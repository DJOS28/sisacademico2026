<?php

namespace App\Http\Controllers;

use App\Models\Admision;
use App\Models\Inscripcion;
use App\Models\PlanEstudio;
use App\Models\Postulante;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
            'PlanEstudio' => PlanEstudio::query()->select('id', 'nombre', 'codigo')->orderBy('nombre')->get(),
            'resumen' => [
                'total' => Inscripcion::count(),
                'inscritos' => Inscripcion::where('estado', 'inscrito')->count(),
                'observados' => Inscripcion::where('estado', 'observado')->count(),
                'aceptados' => Inscripcion::where('estado', 'aceptado')->count(),
                'matriculados' => Inscripcion::where('estado', 'matriculado')->count(),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $buscarPostulante = trim((string) $request->input('buscar_postulante', ''));

        return Inertia::render('Inscripciones/Create', [
            'admisiones' => Admision::query()->where('activo', true)->select('id_admision', 'nombre')->orderByDesc('inicio_proceso')->get(),
            'postulantes' => Postulante::query()
                ->when($buscarPostulante !== '', function ($query) use ($buscarPostulante) {
                    $query->where('nombres', 'like', "%{$buscarPostulante}%")
                        ->orWhere('apellidos', 'like', "%{$buscarPostulante}%")
                        ->orWhere('dni', 'like', "%{$buscarPostulante}%")
                        ->orWhere('codigo_postulante', 'like', "%{$buscarPostulante}%");
                })
                ->select('id_postulante', 'codigo_postulante', 'nombres', 'apellidos', 'dni')
                ->orderBy('apellidos')
                ->limit(20)
                ->get(),
            'PlanEstudio' => PlanEstudio::query()->where('activo', true)->select('id', 'nombre', 'codigo')->orderBy('nombre')->get(),
            'filtros' => [
                'buscar_postulante' => $buscarPostulante,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validarInscripcion($request);
        Inscripcion::create($datos);

        return redirect()->route('inscripciones.index')->with('success', 'La inscripción fue registrada correctamente.');
    }

    public function show(Inscripcion $inscripcion): Response
    {
        $inscripcion->load([
            'admision:id_admision,nombre,inicio_proceso,fin_proceso,activo',
            'postulante:id_postulante,codigo_postulante,nombres,apellidos,dni,email,telefono,direccion',
            'planEstudio:id,nombre,codigo,tipo',
        ]);

        return Inertia::render('Inscripciones/Show', ['inscripcion' => $inscripcion]);
    }

    public function edit(Request $request, Inscripcion $inscripcion): Response
    {
        $buscarPostulante = trim((string) $request->input('buscar_postulante', ''));

        $inscripcion->load(['postulante:id_postulante,codigo_postulante,nombres,apellidos,dni']);

        return Inertia::render('Inscripciones/Edit', [
            'inscripcion' => $inscripcion,
            'admisiones' => Admision::query()->select('id_admision', 'nombre')->orderByDesc('id_admision')->get(),
            'postulantes' => Postulante::query()
                ->when($buscarPostulante !== '', function ($query) use ($buscarPostulante) {
                    $query->where('nombres', 'like', "%{$buscarPostulante}%")
                        ->orWhere('apellidos', 'like', "%{$buscarPostulante}%")
                        ->orWhere('dni', 'like', "%{$buscarPostulante}%")
                        ->orWhere('codigo_postulante', 'like', "%{$buscarPostulante}%");
                })
                ->orWhere('id_postulante', $inscripcion->id_postulante)
                ->select('id_postulante', 'codigo_postulante', 'nombres', 'apellidos', 'dni')
                ->orderBy('apellidos')
                ->limit(20)
                ->get(),
            'PlanEstudio' => PlanEstudio::query()->select('id', 'nombre', 'codigo')->orderBy('nombre')->get(),
            'filtros' => [
                'buscar_postulante' => $buscarPostulante,
            ],
        ]);
    }

    public function update(Request $request, Inscripcion $inscripcion): RedirectResponse
    {
        $datos = $this->validarInscripcion($request, $inscripcion);
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

    private function validarInscripcion(Request $request, ?Inscripcion $inscripcion = null): array
    {
        return $request->validate([
            'id_admision' => ['required', 'integer', 'exists:admisiones,id_admision'],
            'id_postulante' => [
                'required',
                'integer',
                'exists:postulantes,id_postulante',
                Rule::unique('inscripcion', 'id_postulante')
                    ->where('id_admision', $request->input('id_admision'))
                    ->ignore($inscripcion?->id_inscripcion, 'id_inscripcion'),
            ],
            'id_plan' => ['required', 'integer', 'exists:planes_estudio,id'],
            'segunda_opcion' => ['nullable', 'string', 'max:100'],
            'estado' => ['required', Rule::in(['inscrito', 'observado', 'subsanado', 'aceptado', 'matriculado'])],
            'observacion' => ['nullable', 'string'],
        ], [
            'id_admision.required' => 'Selecciona un proceso de admisión.',
            'id_postulante.required' => 'Selecciona un postulante.',
            'id_postulante.unique' => 'Este postulante ya está inscrito en este proceso.',
            'id_plan.required' => 'Selecciona un plan de estudio.',
        ]);
    }
}