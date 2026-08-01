<?php

namespace App\Http\Controllers;

use App\Models\Admision;
use App\Models\TipoPago;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class TipoPagoController extends Controller
{
    public function index(Request $request): Response
    {
        $filtros = $request->validate([
            'buscar' => ['nullable', 'string', 'max:100'],
            'estado' => ['nullable', Rule::in(['todos', 'activos', 'inactivos'])],
            'por_pagina' => ['nullable', 'integer', Rule::in([10, 15, 25, 50])],
        ]);

        $tiposPago = TipoPago::query()
            ->withCount('admisiones')
            ->when($filtros['buscar'] ?? null, function ($query, $buscar) {
                $query->where('nombre', 'like', "%{$buscar}%")
                    ->orWhere('banco_o_entidad', 'like', "%{$buscar}%")
                    ->orWhere('numero_cuenta', 'like', "%{$buscar}%")
                    ->orWhere('cci', 'like', "%{$buscar}%");
            })
            ->when(($filtros['estado'] ?? 'todos') === 'activos', fn ($query) => $query->where('activo', 1))
            ->when(($filtros['estado'] ?? 'todos') === 'inactivos', fn ($query) => $query->where('activo', 0))
            ->orderByDesc('id_tipo_pago')
            ->paginate($filtros['por_pagina'] ?? 10)
            ->withQueryString();

        return Inertia::render('TiposPago/Index', [
            'tiposPago' => $tiposPago,
            'filtros' => [
                'buscar' => $filtros['buscar'] ?? '',
                'estado' => $filtros['estado'] ?? 'todos',
                'por_pagina' => $filtros['por_pagina'] ?? 10,
            ],
            'resumen' => [
                'total' => TipoPago::count(),
                'activos' => TipoPago::where('activo', 1)->count(),
                'inactivos' => TipoPago::where('activo', 0)->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        // Pasamos las admisiones activas para poder vincularlas en la vista de creación
        $admisiones = Admision::where('activo', 1)
            ->select('id_admision', 'nombre')
            ->orderByDesc('id_admision')
            ->get();

        return Inertia::render('TiposPago/Create', [
            'admisiones' => $admisiones,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validarTipoPago($request);

        DB::transaction(function () use ($datos) {
            // 1. Crear el medio de pago
            $tipoPago = TipoPago::create($datos);

            // 2. Insertar las relaciones en la tabla intermedia admisiones_tipo_pago
            if (!empty($datos['admisiones_ids'])) {
                $tipoPago->admisiones()->sync($datos['admisiones_ids']);
            }
        });

        return redirect()->route('tipos-pago.index')->with('success', 'El medio de pago fue registrado correctamente.');
    }

    public function show(TipoPago $tipoPago): Response
    {
        $tipoPago->load(['admisiones:id_admision,nombre,activo']);
        $tipoPago->loadCount('admisiones');

        return Inertia::render('TiposPago/Show', ['tipoPago' => $tipoPago]);
    }

    public function edit(TipoPago $tipoPago): Response
    {
        // Cargar las relaciones actuales para pre-seleccionarlas en React
        $tipoPago->load('admisiones:id_admision');

        $admisiones = Admision::where('activo', 1)
            ->select('id_admision', 'nombre')
            ->orderByDesc('id_admision')
            ->get();

        return Inertia::render('TiposPago/Edit', [
            'tipoPago' => $tipoPago,
            'admisiones' => $admisiones,
            // Enviamos array simple de IDs seleccionados para React
            'admisionesSeleccionadas' => $tipoPago->admisiones->pluck('id_admision'),
        ]);
    }

    public function update(Request $request, TipoPago $tipoPago): RedirectResponse
    {
        $datos = $this->validarTipoPago($request, $tipoPago);

        DB::transaction(function () use ($tipoPago, $datos) {
            // 1. Actualizar datos del medio de pago
            $tipoPago->update($datos);

            // 2. Sincronizar (insertar/eliminar) en la tabla intermedia admisiones_tipo_pago
            $tipoPago->admisiones()->sync($datos['admisiones_ids'] ?? []);
        });

        return redirect()->route('tipos-pago.index')->with('success', 'El medio de pago fue actualizado correctamente.');
    }

    public function cambiarEstado(Request $request, TipoPago $tipoPago): RedirectResponse
    {
        $datos = $request->validate(['activo' => ['required', 'boolean']]);
        $tipoPago->update(['activo' => $datos['activo']]);

        $mensaje = $datos['activo'] ? 'El medio de pago fue activado correctamente.' : 'El medio de pago fue desactivado correctamente.';
        return back()->with('success', $mensaje);
    }

    public function destroy(TipoPago $tipoPago): RedirectResponse
    {
        if ($tipoPago->admisiones()->exists()) {
            return back()->with('error', 'No se puede eliminar el medio de pago porque está asociado a procesos de admisión.');
        }

        try {
            $tipoPago->delete();
            return redirect()->route('tipos-pago.index')->with('success', 'El medio de pago fue eliminado correctamente.');
        } catch (Throwable $exception) {
            report($exception);
            return back()->with('error', 'No fue posible eliminar el medio de pago.');
        }
    }

    private function validarTipoPago(Request $request, ?TipoPago $tipoPago = null): array
    {
        return $request->validate([
            'nombre' => ['required', 'string', 'max:50', Rule::unique('tipo_pago', 'nombre')->ignore($tipoPago?->id_tipo_pago, 'id_tipo_pago')],
            'banco_o_entidad' => ['required', 'string', 'max:100'],
            'numero_cuenta' => ['required', 'string', 'max:50'],
            'cci' => ['required', 'string', 'max:20'],
            'nombre_titular' => ['required', 'string', 'max:100'],
            'activo' => ['required', 'boolean'],
            // Validación para los IDs de admisión (pueden ser uno o varios)
            'admisiones_ids' => ['nullable', 'array'],
            'admisiones_ids.*' => ['integer', 'exists:admisiones,id_admision'],
        ], [
            'nombre.required' => 'Ingresa el nombre del medio de pago.',
            'nombre.unique' => 'Ya existe un medio de pago con ese nombre.',
            'banco_o_entidad.required' => 'Ingresa el banco o entidad financiera.',
            'numero_cuenta.required' => 'Ingresa el número de cuenta.',
            'cci.required' => 'Ingresa el número de CCI.',
            'nombre_titular.required' => 'Ingresa el nombre del titular de la cuenta.',
        ]);
    }
}