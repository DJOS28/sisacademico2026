<?php

namespace App\Http\Controllers;

use App\Models\Requisito;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class RequisitoController extends Controller
{
    public function index(Request $request): Response
    {
        $filtros = $request->validate([
            'buscar' => ['nullable', 'string', 'max:100'],
            'estado' => ['nullable', Rule::in(['todos', 'activos', 'inactivos'])],
            'por_pagina' => ['nullable', 'integer', Rule::in([10, 15, 25, 50])],
        ]);

        $requisitos = Requisito::query()
            ->withCount('admisiones')
            ->when($filtros['buscar'] ?? null, fn ($query, $buscar) => $query->where('nombre', 'like', "%{$buscar}%")->orWhere('descripcion', 'like', "%{$buscar}%"))
            ->when(($filtros['estado'] ?? 'todos') === 'activos', fn ($query) => $query->where('activo', true))
            ->when(($filtros['estado'] ?? 'todos') === 'inactivos', fn ($query) => $query->where('activo', false))
            ->orderByDesc('id_requisito')
            ->paginate($filtros['por_pagina'] ?? 10)
            ->withQueryString();

        return Inertia::render('Requisitos/Index', [
            'requisitos' => $requisitos,
            'filtros' => [
                'buscar' => $filtros['buscar'] ?? '',
                'estado' => $filtros['estado'] ?? 'todos',
                'por_pagina' => $filtros['por_pagina'] ?? 10,
            ],
            'resumen' => [
                'total' => Requisito::count(),
                'activos' => Requisito::where('activo', true)->count(),
                'inactivos' => Requisito::where('activo', false)->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Requisitos/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validarRequisito($request);
        Requisito::create($datos);

        return redirect()->route('requisitos.index')->with('success', 'El requisito fue registrado correctamente.');
    }

    public function show(Requisito $requisito): Response
    {
        $requisito->load(['admisiones:id_admision,nombre,activo']);
        $requisito->loadCount('admisiones');

        return Inertia::render('Requisitos/Show', ['requisito' => $requisito]);
    }

    public function edit(Requisito $requisito): Response
    {
        return Inertia::render('Requisitos/Edit', ['requisito' => $requisito]);
    }

    public function update(Request $request, Requisito $requisito): RedirectResponse
    {
        $datos = $this->validarRequisito($request, $requisito);
        $requisito->update($datos);

        return redirect()->route('requisitos.index')->with('success', 'El requisito fue actualizado correctamente.');
    }

    public function cambiarEstado(Request $request, Requisito $requisito): RedirectResponse
    {
        $datos = $request->validate(['activo' => ['required', 'boolean']]);
        $requisito->update(['activo' => $datos['activo']]);

        $mensaje = $datos['activo'] ? 'El requisito fue activado correctamente.' : 'El requisito fue desactivado correctamente.';
        return back()->with('success', $mensaje);
    }

    public function destroy(Requisito $requisito): RedirectResponse
    {
        if ($requisito->admisiones()->exists()) {
            return back()->with('error', 'No se puede eliminar el requisito porque está asociado a procesos de admisión.');
        }

        try {
            $requisito->delete();
            return redirect()->route('requisitos.index')->with('success', 'El requisito fue eliminado correctamente.');
        } catch (Throwable $exception) {
            report($exception);
            return back()->with('error', 'No fue posible eliminar el requisito.');
        }
    }

    private function validarRequisito(Request $request, ?Requisito $requisito = null): array
    {
        return $request->validate([
            'nombre' => ['required', 'string', 'max:100', Rule::unique('requisitos', 'nombre')->ignore($requisito?->id_requisito, 'id_requisito')],
            'descripcion' => ['nullable', 'string'],
            'activo' => ['required', 'boolean'],
        ], [
            'nombre.required' => 'Ingresa el nombre del requisito.',
            'nombre.unique' => 'Ya existe un requisito registrado con este nombre.',
        ]);
    }
}