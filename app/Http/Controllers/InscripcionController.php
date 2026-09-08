<?php

namespace App\Http\Controllers;

use App\Models\Admision;
use App\Models\Inscripcion;
use App\Models\PlanEstudio;
use App\Models\Postulante;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class InscripcionController extends Controller
{
    public function index(Request $request): Response
    {
        $filtros = $request->validate([
            'buscar' => ['nullable', 'string', 'max:100'],
            'admision_id' => ['nullable', 'integer', 'exists:admisiones,id_admision'],
            'plan_id' => ['nullable', 'integer', 'exists:planes_estudio,id'],
            'estado' => ['nullable', Rule::in(['todos', 'inscrito', 'observado', 'subsanado', 'aceptado', 'matriculado'])],
            'por_pagina' => ['nullable', 'integer', Rule::in([10, 15, 25, 50])],
        ]);

        $inscripciones = Inscripcion::query()
            ->with([
                'admision:id_admision,nombre,activo',
                'postulante:id_postulante,codigo_postulante,nombres,apellidos,dni,email,telefono',
                'planEstudio:id,nombre,codigo,tipo',
            ])
            ->when($filtros['buscar'] ?? null, function ($query, $buscar) {
                $query->whereHas('postulante', function ($sub) use ($buscar) {
                    $sub->where('codigo_postulante', 'like', "%{$buscar}%")
                        ->orWhere('dni', 'like', "%{$buscar}%")
                        ->orWhere('nombres', 'like', "%{$buscar}%")
                        ->orWhere('apellidos', 'like', "%{$buscar}%");
                });
            })
            ->when($filtros['admision_id'] ?? null, fn ($q, $id) => $q->where('id_admision', $id))
            ->when($filtros['plan_id'] ?? null, fn ($q, $id) => $q->where('id_plan', $id))
            ->when(($filtros['estado'] ?? 'todos') !== 'todos', fn ($q) => $q->where('estado', $filtros['estado']))
            ->orderByDesc('fecha_registro')
            ->paginate($filtros['por_pagina'] ?? 10)
            ->withQueryString();

        return Inertia::render('Inscripciones/Index', [
            'inscripciones' => $inscripciones,
            'filtros' => [
                'buscar' => $filtros['buscar'] ?? '',
                'admision_id' => $filtros['admision_id'] ?? '',
                'plan_id' => $filtros['plan_id'] ?? '',
                'estado' => $filtros['estado'] ?? 'todos',
                'por_pagina' => $filtros['por_pagina'] ?? 10,
            ],
            'admisiones' => Admision::query()->select('id_admision', 'nombre', 'activo')->orderByDesc('id_admision')->get(),
            'planesEstudio' => PlanEstudio::query()->select('id', 'nombre', 'codigo')->orderBy('nombre')->get(),
            'resumen' => [
                'total' => Inscripcion::count(),
                'inscritos' => Inscripcion::where('estado', 'inscrito')->count(),
                'observados' => Inscripcion::where('estado', 'observado')->count(),
                'aceptados' => Inscripcion::where('estado', 'aceptado')->count(),
                'matriculados' => Inscripcion::where('estado', 'matriculado')->count(),
            ],
        ]);
    }

    /**
     * Carga el formulario de creación presencial/interna (Postulante + Inscripción).
     */
    public function create(): Response
    {
        return Inertia::render('Inscripciones/Create', [
            'admisiones' => Admision::query()->where('activo', 1)->select('id_admision', 'nombre')->orderByDesc('id_admision')->get(),
            'planesEstudio' => PlanEstudio::query()->where('activo', 1)->select('id', 'nombre', 'codigo')->orderBy('nombre')->get(),
        ]);
    }

    /**
     * Registra en simultáneo al postulante y su inscripción.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            // Proceso y Carrera
            'id_admision' => ['required', 'integer', 'exists:admisiones,id_admision'],
            'id_plan' => ['required', 'integer', 'exists:planes_estudio,id'],
            'segunda_opcion' => ['nullable', 'string', 'max:100'],
            'estado' => ['required', Rule::in(['inscrito', 'observado', 'subsanado', 'aceptado', 'matriculado'])],
            'observacion' => ['nullable', 'string'],

            // Datos Personales del Nuevo Postulante
            'nombres' => ['required', 'string', 'max:100'],
            'apellidos' => ['required', 'string', 'max:100'],
            'dni' => ['required', 'string', 'max:15', 'unique:postulantes,dni'],
            'email' => ['required', 'email', 'max:100', 'unique:postulantes,email'],
            'telefono' => ['required', 'string', 'max:15'],
            'genero' => ['nullable', 'string', 'max:15'],
            'fecha_nacimiento' => ['nullable', 'date'],
            'direccion' => ['nullable', 'string', 'max:100'],
        ], [
            'dni.unique' => 'El DNI ingresado ya se encuentra registrado en el sistema.',
            'email.unique' => 'El correo electrónico ya se encuentra registrado.',
            'id_admision.required' => 'Seleccione un proceso de admisión.',
            'id_plan.required' => 'Seleccione una carrera principal.',
            'nombres.required' => 'Ingrese los nombres del postulante.',
            'apellidos.required' => 'Ingrese los apellidos del postulante.',
        ]);

        DB::transaction(function () use ($datos) {
            // 1. Generar Código de Postulante único
            $ultimoId = Postulante::max('id_postulante') ?? 0;
            $codigoPostulante = 'POST-' . date('Y') . '-' . str_pad((string) ($ultimoId + 1), 4, '0', STR_PAD_LEFT);

            // 2. Crear Postulante
            $postulante = Postulante::create([
                'codigo_postulante' => $codigoPostulante,
                'nombres' => $datos['nombres'],
                'apellidos' => $datos['apellidos'],
                'dni' => $datos['dni'],
                'email' => $datos['email'],
                'telefono' => $datos['telefono'],
                'genero' => $datos['genero'] ?? 'Masculino',
                'fecha_nacimiento' => $datos['fecha_nacimiento'] ?? null,
                'direccion' => $datos['direccion'] ?? null,
                'grado' => 'Postulante',
            ]);

            // 3. Crear Registro de Inscripción vinculado al nuevo postulante
            Inscripcion::create([
                'id_admision' => $datos['id_admision'],
                'id_postulante' => $postulante->id_postulante,
                'id_plan' => $datos['id_plan'],
                'segunda_opcion' => $datos['segunda_opcion'] ?? null,
                'estado' => $datos['estado'],
                'observacion' => $datos['observacion'] ?? null,
                'fecha_registro' => now(),
            ]);
        });

        return redirect()->route('inscripciones.index')->with('success', 'El postulante y su inscripción fueron registrados correctamente.');
    }

    public function show(Inscripcion $inscripcion): Response
    {
        $inscripcion->load([
            'admision:id_admision,nombre,inicio_proceso,fin_proceso,activo',
            'postulante:id_postulante,codigo_postulante,nombres,apellidos,dni,email,telefono,direccion,copia_dni,certificado_estudios,comprobante_pago',
            'planEstudio:id,nombre,codigo,tipo',
        ]);

        return Inertia::render('Inscripciones/Show', ['inscripcion' => $inscripcion]);
    }

    public function edit(Inscripcion $inscripcion): Response
    {
        $inscripcion->load(['postulante']);

        return Inertia::render('Inscripciones/Edit', [
            'inscripcion' => $inscripcion,
            'admisiones' => Admision::query()->select('id_admision', 'nombre', 'activo')->orderByDesc('id_admision')->get(),
            'planesEstudio' => PlanEstudio::query()->select('id', 'nombre', 'codigo')->orderBy('nombre')->get(),
        ]);
    }

    public function update(Request $request, Inscripcion $inscripcion): RedirectResponse
    {
        $datos = $request->validate([
            'id_admision' => ['required', 'integer', 'exists:admisiones,id_admision'],
            'id_plan' => ['required', 'integer', 'exists:planes_estudio,id'],
            'segunda_opcion' => ['nullable', 'string', 'max:100'],
            'estado' => ['required', Rule::in(['inscrito', 'observado', 'subsanado', 'aceptado', 'matriculado'])],
            'observacion' => ['nullable', 'string'],
        ]);

        $inscripcion->update($datos);

        return redirect()->route('inscripciones.index')->with('success', 'La inscripción fue actualizada correctamente.');
    }

    public function cambiarEstado(Request $request, Inscripcion $inscripcion): RedirectResponse
    {
        $datos = $request->validate([
            'estado' => ['required', Rule::in(['inscrito', 'observado', 'subsanado', 'aceptado', 'matriculado'])],
            'observacion' => ['nullable', 'string'],
        ]);

        $inscripcion->update($datos);
        return back()->with('success', 'El estado de la inscripción fue cambiado.');
    }

    public function destroy(Inscripcion $inscripcion): RedirectResponse
    {
        try {
            $inscripcion->delete();
            return redirect()->route('inscripciones.index')->with('success', 'Inscripción eliminada correctamente.');
        } catch (Throwable $exception) {
            report($exception);
            return back()->with('error', 'No se pudo eliminar la inscripción.');
        }
    }
}