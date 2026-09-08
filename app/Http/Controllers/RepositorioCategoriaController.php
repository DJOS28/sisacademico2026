<?php

namespace App\Http\Controllers;

use App\Models\RepositorioCategoria;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class RepositorioCategoriaController extends Controller
{
    /**
     * Listado inicial de categorías.
     */
    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->input('buscar', ''));
        $estado = trim((string) $request->input('estado', ''));

        $categorias = RepositorioCategoria::query()
            ->withCount('recursos')
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('nombre', 'like', "%{$buscar}%")
                        ->orWhere('descripcion', 'like', "%{$buscar}%");
                });
            })
            ->when($estado !== '', fn ($query) => $query->where('activo', $estado === 'Activo'))
            ->orderBy('nombre')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Repositorio/Categorias/Index', [
            'categorias' => $categorias,
            'filtros'    => [
                'buscar' => $buscar,
                'estado' => $estado,
            ],
        ]);
    }

    /**
     * Filtrado dinámico vía AJAX.
     */
    public function filtrar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'buscar' => ['nullable', 'string', 'max:100'],
            'estado' => ['nullable', 'string', 'in:Activo,Inactivo'],
            'page'   => ['nullable', 'integer', 'min:1'],
        ]);

        $buscar = trim((string) ($datos['buscar'] ?? ''));
        $estado = trim((string) ($datos['estado'] ?? ''));
        $pagina = (int) ($datos['page'] ?? 1);

        $categorias = RepositorioCategoria::query()
            ->withCount('recursos')
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('nombre', 'like', "%{$buscar}%")
                        ->orWhere('descripcion', 'like', "%{$buscar}%");
                });
            })
            ->when($estado !== '', fn ($query) => $query->where('activo', $estado === 'Activo'))
            ->orderBy('nombre')
            ->paginate(perPage: 10, columns: ['*'], pageName: 'page', page: $pagina);

        return response()->json(['categorias' => $categorias]);
    }

    /**
     * Registra una nueva categoría.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        RepositorioCategoria::create([
            'nombre'      => trim($datos['nombre']),
            'descripcion' => $this->normalizarNullable($datos['descripcion'] ?? null),
            'activo'      => (bool) ($datos['activo'] ?? true),
            'creado_en'   => now(),
        ]);

        return back()->with('success', 'Categoría registrada correctamente.');
    }

    /**
     * Actualiza una categoría existente.
     */
    public function update(Request $request, RepositorioCategoria $categoria): RedirectResponse
    {
        $datos = $this->validar($request, $categoria);

        $categoria->update([
            'nombre'      => trim($datos['nombre']),
            'descripcion' => $this->normalizarNullable($datos['descripcion'] ?? null),
            'activo'      => (bool) $datos['activo'],
        ]);

        return back()->with('success', 'Categoría actualizada correctamente.');
    }

    /**
     * Activa o desactiva la categoría.
     */
    public function actualizarEstado(Request $request, RepositorioCategoria $categoria): RedirectResponse
    {
        $datos = $request->validate([
            'activo' => ['required', 'boolean'],
        ]);

        $categoria->update(['activo' => (bool) $datos['activo']]);

        return back()->with('success', 'Estado de la categoría actualizado correctamente.');
    }

    /**
     * Elimina una categoría si no contiene recursos vinculados.
     */
    public function destroy(RepositorioCategoria $categoria): RedirectResponse
    {
        try {
            if ($categoria->recursos()->exists()) {
                return back()->with('error', 'No se puede eliminar la categoría porque tiene recursos asociados.');
            }

            $categoria->delete();

            return back()->with('success', 'Categoría eliminada correctamente.');
        } catch (Throwable $exception) {
            report($exception);
            return back()->with('error', 'No se pudo eliminar la categoría.');
        }
    }

    /**
     * Reglas de validación.
     */
    private function validar(Request $request, ?RepositorioCategoria $categoria = null): array
    {
        return $request->validate([
            'nombre'      => ['required', 'string', 'max:100', Rule::unique('repositorio_categorias', 'nombre')->ignore($categoria?->id)],
            'descripcion' => ['nullable', 'string', 'max:1000'],
            'activo'      => ['nullable', 'boolean'],
        ], [
            'nombre.required' => 'El nombre de la categoría es obligatorio.',
            'nombre.unique'   => 'Ya existe una categoría registrada con ese nombre.',
            'nombre.max'      => 'El nombre no debe superar los 100 caracteres.',
            'descripcion.max' => 'La descripción no debe superar los 1000 caracteres.',
        ]);
    }

    /**
     * Limpia valores vacíos a null.
     */
    private function normalizarNullable(mixed $valor): ?string
    {
        $valor = trim((string) $valor);
        return $valor !== '' ? $valor : null;
    }
}