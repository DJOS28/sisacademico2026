<?php

namespace App\Http\Controllers;

use App\Models\Area;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class AreaController extends Controller
{
    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->input('buscar', ''));
        $estado = trim((string) $request->input('estado', ''));

        $areas = Area::query()
            ->withCount(['personal', 'usuarios'])
            ->when($buscar !== '', function ($query) use ($buscar): void {
                $query->where(function ($subquery) use ($buscar): void {
                    $subquery
                        ->where('nombre', 'like', "%{$buscar}%")
                        ->orWhere('descripcion', 'like', "%{$buscar}%");
                });
            })
            ->when($estado !== '', fn ($query) => $query->where('estado', $estado))
            ->orderBy('nombre')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Areas/Index', [
            'areas' => $areas,
            'filtros' => compact('buscar', 'estado'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Areas/Create', [
            'estados' => ['Activo', 'Inactivo'],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        Area::create([
            'nombre' => trim($datos['nombre']),
            'descripcion' => $this->nullable($datos['descripcion'] ?? null),
            'estado' => $datos['estado'],
            'fecha_creacion' => now(),
        ]);

        return to_route('areas.index')
            ->with('success', 'Área registrada correctamente.');
    }

    public function edit(Area $area): Response
    {
        return Inertia::render('Areas/Edit', [
            'area' => $area,
            'estados' => ['Activo', 'Inactivo'],
        ]);
    }

    public function update(Request $request, Area $area): RedirectResponse
    {
        $datos = $this->validar($request, $area);

        $area->update([
            'nombre' => trim($datos['nombre']),
            'descripcion' => $this->nullable($datos['descripcion'] ?? null),
            'estado' => $datos['estado'],
        ]);

        return to_route('areas.index')
            ->with('success', 'Área actualizada correctamente.');
    }

    public function actualizarEstado(Request $request, Area $area): RedirectResponse
    {
        $datos = $request->validate([
            'estado' => ['required', Rule::in(['Activo', 'Inactivo'])],
        ]);

        $area->update(['estado' => $datos['estado']]);

        return back()->with('success', 'Estado actualizado correctamente.');
    }

    public function destroy(Area $area): RedirectResponse
    {
        if ($area->personal()->exists()) {
            return back()->with(
                'error',
                'No se puede eliminar el área porque tiene personal relacionado.'
            );
        }

        if ($area->usuarios()->exists()) {
            return back()->with(
                'error',
                'No se puede eliminar el área porque tiene usuarios relacionados.'
            );
        }

        try {
            $area->delete();

            return back()->with('success', 'Área eliminada correctamente.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with(
                'error',
                'No se pudo eliminar el área porque tiene registros relacionados.'
            );
        }
    }

    private function validar(Request $request, ?Area $area = null): array
    {
        return $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:100',
                Rule::unique('areas', 'nombre')->ignore($area?->id),
            ],
            'descripcion' => ['nullable', 'string', 'max:1000'],
            'estado' => ['required', Rule::in(['Activo', 'Inactivo'])],
        ], [
            'nombre.required' => 'El nombre del área es obligatorio.',
            'nombre.unique' => 'Ya existe un área con ese nombre.',
            'estado.required' => 'Debe seleccionar un estado.',
        ]);
    }

    private function nullable(mixed $value): ?string
    {
        $value = trim((string) $value);
        return $value !== '' ? $value : null;
    }
}
