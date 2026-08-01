<?php

namespace App\Http\Controllers;

use App\Models\Admision;
use App\Models\Periodo;
use App\Models\Requisito;
use App\Models\TipoAdmision;
use App\Models\TipoPago;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class AdmisionController extends Controller
{
    /**
     * Listado de procesos de admisión.
     */
    public function index(Request $request): Response
    {
        $filtros = $request->validate([
            'buscar' => ['nullable', 'string', 'max:100'],
            'periodo_id' => ['nullable', 'integer', 'exists:periodos,id'],
            'tipo_admision_id' => ['nullable', 'integer', 'exists:tipo_admision,id_tipo_admision'],
            'estado' => ['nullable', Rule::in(['todos', 'activos', 'inactivos'])],
            'por_pagina' => ['nullable', 'integer', Rule::in([10, 15, 25, 50])],
        ]);

        $admisiones = Admision::query()
            ->with([
                'periodo:id,nombre,fecha_inicio,fecha_fin,activo',
                'tipoAdmision:id_tipo_admision,nombre,monto,monto_extemporaneo,activo',
            ])
            ->withCount(['inscripciones', 'requisitos', 'tiposPago', 'resultados'])
            ->buscar($filtros['buscar'] ?? null)
            ->when($filtros['periodo_id'] ?? null, fn ($query, $periodoId) => $query->where('id_periodo', $periodoId))
            ->when($filtros['tipo_admision_id'] ?? null, fn ($query, $tipoAdmisionId) => $query->where('id_tipo_admision', $tipoAdmisionId))
            ->when(($filtros['estado'] ?? 'todos') === 'activos', fn ($query) => $query->where('activo', true))
            ->when(($filtros['estado'] ?? 'todos') === 'inactivos', fn ($query) => $query->where('activo', false))
            ->orderByDesc('inicio_proceso')
            ->orderByDesc('id_admision')
            ->paginate($filtros['por_pagina'] ?? 10)
            ->withQueryString();

        return Inertia::render('Admisiones/Index', [
            'admisiones' => $admisiones,
            'filtros' => [
                'buscar' => $filtros['buscar'] ?? '',
                'periodo_id' => $filtros['periodo_id'] ?? '',
                'tipo_admision_id' => $filtros['tipo_admision_id'] ?? '',
                'estado' => $filtros['estado'] ?? 'todos',
                'por_pagina' => $filtros['por_pagina'] ?? 10,
            ],
            'periodos' => Periodo::query()->select('id', 'nombre', 'activo')->orderByDesc('fecha_inicio')->get(),
            'tiposAdmision' => TipoAdmision::query()->select('id_tipo_admision', 'nombre', 'activo')->orderBy('nombre')->get(),
            'resumen' => [
                'total' => Admision::count(),
                'activas' => Admision::where('activo', true)->count(),
                'inactivas' => Admision::where('activo', false)->count(),
                'con_inscripciones' => Admision::has('inscripciones')->count(),
            ],
        ]);
    }

    /**
     * Formulario de creación.
     */
    public function create(): Response
    {
        return Inertia::render('Admisiones/Create', [
            'periodos' => Periodo::query()->activo()->select('id', 'nombre', 'fecha_inicio', 'fecha_fin')->orderByDesc('fecha_inicio')->get(),
            'tiposAdmision' => TipoAdmision::query()->activos()->select('id_tipo_admision', 'nombre', 'monto', 'monto_extemporaneo')->orderBy('nombre')->get(),
            'requisitos' => Requisito::query()->activos()->select('id_requisito', 'nombre', 'descripcion')->orderBy('nombre')->get(),
            'tiposPago' => TipoPago::query()->activos()->select('id_tipo_pago', 'nombre', 'banco_o_entidad', 'numero_cuenta', 'cci', 'nombre_titular')->orderBy('nombre')->get(),
        ]);
    }

    /**
     * Registra un proceso de admisión.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validarAdmision($request);

        DB::transaction(function () use ($datos) {
            $requisitos = $datos['requisitos'] ?? [];
            $tiposPago = $datos['tipos_pago'] ?? [];
            unset($datos['requisitos'], $datos['tipos_pago']);

            $admision = Admision::create($datos);
            $admision->requisitos()->sync($requisitos);
            $admision->tiposPago()->sync($tiposPago);
        });

        return redirect()->route('admisiones.index')->with('success', 'El proceso de admisión fue registrado correctamente.');
    }

    /**
     * Detalle del proceso.
     */
    public function show(Admision $admision): Response
{
    $admision->load([
        'periodo:id,nombre,descripcion,fecha_inicio,fecha_fin,activo',
        'tipoAdmision:id_tipo_admision,nombre,monto,monto_extemporaneo,activo',
        'requisitos:id_requisito,nombre,descripcion,activo',
        'tiposPago:id_tipo_pago,nombre,banco_o_entidad,numero_cuenta,cci,nombre_titular,activo',

        'inscripciones' => function ($query) {
            $query->with([
                'postulante:id_postulante,codigo_postulante,nombres,apellidos,dni,email,telefono',
                'planEstudio:id,nombre,codigo,tipo',
            ])
            ->orderByDesc('fecha_registro') // <--- Cambia ->latest() por orderByDesc('fecha_registro')
            ->limit(10);
        },
    ]);

    $admision->loadCount([
        'inscripciones',
        'requisitos',
        'tiposPago',
        'resultados',
    ]);

    return Inertia::render('Admisiones/Show', [
        'admision' => $admision,
    ]);
}

    /**
     * Formulario de edición.
     */
    public function edit(Admision $admision): Response
    {
        $admision->load(['requisitos:id_requisito', 'tiposPago:id_tipo_pago']);

        return Inertia::render('Admisiones/Edit', [
            'admision' => [
                'id_admision' => $admision->id_admision,
                'id_periodo' => $admision->id_periodo,
                'id_tipo_admision' => $admision->id_tipo_admision,
                'nombre' => $admision->nombre,
                'inicio_proceso' => $admision->inicio_proceso?->format('Y-m-d'),
                'fin_proceso' => $admision->fin_proceso?->format('Y-m-d'),
                'inicio_inscripciones' => $admision->inicio_inscripciones?->format('Y-m-d'),
                'fin_inscripciones' => $admision->fin_inscripciones?->format('Y-m-d'),
                'inicio_extemporaneo' => $admision->inicio_extemporaneo?->format('Y-m-d'),
                'fin_extemporaneo' => $admision->fin_extemporaneo?->format('Y-m-d'),
                'fecha_examen' => $admision->fecha_examen?->format('Y-m-d'),
                'direccion' => $admision->direccion,
                'activo' => $admision->activo,
                'requisitos' => $admision->requisitos->pluck('id_requisito')->values(),
                'tipos_pago' => $admision->tiposPago->pluck('id_tipo_pago')->values(),
            ],
            'periodos' => Periodo::query()
                ->where(fn ($query) => $query->where('activo', true)->orWhere('id', $admision->id_periodo))
                ->select('id', 'nombre', 'fecha_inicio', 'fecha_fin', 'activo')
                ->orderByDesc('fecha_inicio')
                ->get(),
            'tiposAdmision' => TipoAdmision::query()
                ->where(fn ($query) => $query->where('activo', true)->orWhere('id_tipo_admision', $admision->id_tipo_admision))
                ->select('id_tipo_admision', 'nombre', 'monto', 'monto_extemporaneo', 'activo')
                ->orderBy('nombre')
                ->get(),
            'requisitos' => Requisito::query()
                ->where(fn ($query) => $query->where('activo', true)->orWhereIn('id_requisito', $admision->requisitos->pluck('id_requisito')))
                ->select('id_requisito', 'nombre', 'descripcion', 'activo')
                ->orderBy('nombre')
                ->get(),
            'tiposPago' => TipoPago::query()
                ->where(fn ($query) => $query->where('activo', true)->orWhereIn('id_tipo_pago', $admision->tiposPago->pluck('id_tipo_pago')))
                ->select('id_tipo_pago', 'nombre', 'banco_o_entidad', 'numero_cuenta', 'cci', 'nombre_titular', 'activo')
                ->orderBy('nombre')
                ->get(),
        ]);
    }

    /**
     * Actualiza el proceso.
     */
    public function update(Request $request, Admision $admision): RedirectResponse
    {
        $datos = $this->validarAdmision($request, $admision);

        DB::transaction(function () use ($datos, $admision) {
            $requisitos = $datos['requisitos'] ?? [];
            $tiposPago = $datos['tipos_pago'] ?? [];
            unset($datos['requisitos'], $datos['tipos_pago']);

            $admision->update($datos);
            $admision->requisitos()->sync($requisitos);
            $admision->tiposPago()->sync($tiposPago);
        });

        return redirect()->route('admisiones.show', $admision)->with('success', 'El proceso de admisión fue actualizado correctamente.');
    }

    /**
     * Activa o desactiva el proceso.
     */
    public function cambiarEstado(Request $request, Admision $admision): RedirectResponse
    {
        $datos = $request->validate(['activo' => ['required', 'boolean']]);

        $admision->update(['activo' => $datos['activo']]);

        $mensaje = $datos['activo']
            ? 'El proceso de admisión fue activado correctamente.'
            : 'El proceso de admisión fue desactivado correctamente.';

        return back()->with('success', $mensaje);
    }

    /**
     * Elimina un proceso sin registros asociados.
     */
    public function destroy(Admision $admision): RedirectResponse
    {
        if ($admision->inscripciones()->exists()) {
            return back()->with('error', 'No se puede eliminar el proceso porque tiene inscripciones registradas.');
        }

        if ($admision->resultados()->exists()) {
            return back()->with('error', 'No se puede eliminar el proceso porque tiene resultados registrados.');
        }

        try {
            DB::transaction(function () use ($admision) {
                $admision->requisitos()->detach();
                $admision->tiposPago()->detach();
                $admision->delete();
            });

            return redirect()->route('admisiones.index')->with('success', 'El proceso de admisión fue eliminado correctamente.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'No fue posible eliminar el proceso de admisión.');
        }
    }

    /**
     * Reglas de validación para crear y actualizar.
     */
    private function validarAdmision(Request $request, ?Admision $admision = null): array
    {
        return $request->validate([
            'id_periodo' => ['required', 'integer', 'exists:periodos,id'],
            'id_tipo_admision' => ['required', 'integer', 'exists:tipo_admision,id_tipo_admision'],
            'nombre' => ['required', 'string', 'max:255', Rule::unique('admisiones', 'nombre')->ignore($admision?->id_admision, 'id_admision')],
            'inicio_proceso' => ['required', 'date'],
            'fin_proceso' => ['required', 'date', 'after_or_equal:inicio_proceso'],
            'inicio_inscripciones' => ['required', 'date', 'after_or_equal:inicio_proceso', 'before_or_equal:fin_proceso'],
            'fin_inscripciones' => ['required', 'date', 'after_or_equal:inicio_inscripciones', 'before_or_equal:fin_proceso'],
            'inicio_extemporaneo' => ['nullable', 'date', 'after_or_equal:fin_inscripciones', 'before_or_equal:fin_proceso', 'required_with:fin_extemporaneo'],
            'fin_extemporaneo' => ['nullable', 'date', 'after_or_equal:inicio_extemporaneo', 'before_or_equal:fin_proceso', 'required_with:inicio_extemporaneo'],
            'fecha_examen' => ['required', 'date', 'after_or_equal:inicio_inscripciones', 'before_or_equal:fin_proceso'],
            'direccion' => ['required', 'string', 'max:500'],
            'activo' => ['required', 'boolean'],
            'requisitos' => ['required', 'array', 'min:1'],
            'requisitos.*' => ['integer', 'distinct', 'exists:requisitos,id_requisito'],
            'tipos_pago' => ['required', 'array', 'min:1'],
            'tipos_pago.*' => ['integer', 'distinct', 'exists:tipo_pago,id_tipo_pago'],
        ], [
            'id_periodo.required' => 'Selecciona un periodo académico.',
            'id_tipo_admision.required' => 'Selecciona un tipo de admisión.',
            'nombre.required' => 'Ingresa el nombre del proceso.',
            'nombre.unique' => 'Ya existe un proceso de admisión con ese nombre.',
            'inicio_proceso.required' => 'Ingresa la fecha de inicio del proceso.',
            'fin_proceso.required' => 'Ingresa la fecha de finalización del proceso.',
            'fin_proceso.after_or_equal' => 'El fin del proceso no puede ser anterior a su inicio.',
            'inicio_inscripciones.required' => 'Ingresa la fecha de inicio de inscripciones.',
            'fin_inscripciones.required' => 'Ingresa la fecha de finalización de inscripciones.',
            'fecha_examen.required' => 'Ingresa la fecha del examen.',
            'direccion.required' => 'Ingresa la dirección del examen.',
            'requisitos.required' => 'Selecciona al menos un requisito.',
            'requisitos.min' => 'Selecciona al menos un requisito.',
            'tipos_pago.required' => 'Selecciona al menos un medio de pago.',
            'tipos_pago.min' => 'Selecciona al menos un medio de pago.',
        ]);
    }
}