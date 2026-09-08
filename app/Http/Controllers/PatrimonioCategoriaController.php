<?php

namespace App\Http\Controllers;

use App\Models\PatrimonioCategoria;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PatrimonioCategoriaController extends Controller
{
    /**
     * Listado inicial de categorías patrimoniales.
     */
    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->input('buscar', ''));
        $estado = trim((string) $request->input('estado', ''));

        $categorias = PatrimonioCategoria::query()
            ->withCount('bienes')
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('codigo', 'like', "%{$buscar}%")
                        ->orWhere('nombre', 'like', "%{$buscar}%")
                        ->orWhere('descripcion', 'like', "%{$buscar}%");
                });
            })
            ->when($estado !== '', fn ($query) => $query->where('activo', $estado === 'Activo'))
            ->orderBy('nombre')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Patrimonio/Categorias/Index', [
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

        $categorias = PatrimonioCategoria::query()
            ->withCount('bienes')
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('codigo', 'like', "%{$buscar}%")
                        ->orWhere('nombre', 'like', "%{$buscar}%")
                        ->orWhere('descripcion', 'like', "%{$buscar}%");
                });
            })
            ->when($estado !== '', fn ($query) => $query->where('activo', $estado === 'Activo'))
            ->orderBy('nombre')
            ->paginate(perPage: 10, columns: ['*'], pageName: 'page', page: $pagina);

        return response()->json(['categorias' => $categorias]);
    }

    /**
     * Registra una nueva categoría de bienes.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        PatrimonioCategoria::create([
            'codigo'      => strtoupper(trim($datos['codigo'])),
            'nombre'      => trim($datos['nombre']),
            'descripcion' => $this->normalizarNullable($datos['descripcion'] ?? null),
            'activo'      => (bool) ($datos['activo'] ?? true),
        ]);

        return back()->with('success', 'Categoría patrimonial creada correctamente.');
    }

    /**
     * Actualiza una categoría existente.
     */
    public function update(Request $request, PatrimonioCategoria $categoria): RedirectResponse
    {
        $datos = $this->validar($request, $categoria);

        $categoria->update([
            'codigo'      => strtoupper(trim($datos['codigo'])),
            'nombre'      => trim($datos['nombre']),
            'descripcion' => $this->normalizarNullable($datos['descripcion'] ?? null),
            'activo'      => (bool) $datos['activo'],
        ]);

        return back()->with('success', 'Categoría patrimonial actualizada correctamente.');
    }

    /**
     * Activa o desactiva la categoría.
     */
    public function actualizarEstado(Request $request, PatrimonioCategoria $categoria): RedirectResponse
    {
        $datos = $request->validate([
            'activo' => ['required', 'boolean'],
        ]);

        $categoria->update(['activo' => (bool) $datos['activo']]);

        return back()->with('success', 'Estado de la categoría modificado.');
    }

    /**
     * Elimina una categoría si no tiene bienes registrados.
     */
    public function destroy(PatrimonioCategoria $categoria): RedirectResponse
    {
        try {
            if ($categoria->bienes()->exists()) {
                return back()->with('error', 'No se puede eliminar la categoría porque tiene bienes institucionales asociados.');
            }

            $categoria->delete();

            return back()->with('success', 'Categoría patrimonial eliminada.');
        } catch (Throwable $exception) {
            report($exception);
            return back()->with('error', 'No se pudo eliminar la categoría.');
        }
    }

    /**
     * Reglas de validación.
     */
    private function validar(Request $request, ?PatrimonioCategoria $categoria = null): array
    {
        return $request->validate([
            'codigo'      => ['required', 'string', 'max:20', Rule::unique('patrimonio_categorias', 'codigo')->ignore($categoria?->id)],
            'nombre'      => ['required', 'string', 'max:100'],
            'descripcion' => ['nullable', 'string', 'max:500'],
            'activo'      => ['nullable', 'boolean'],
        ], [
            'codigo.required' => 'El código identificador es obligatorio.',
            'codigo.unique'   => 'Ya existe una categoría con este código.',
            'nombre.required' => 'El nombre de la categoría es obligatorio.',
        ]);
    }

    /**
     * Limpia cadenas vacías a null.
     */
    private function normalizarNullable(mixed $valor): ?string
    {
        $valor = trim((string) $valor);
        return $valor !== '' ? $valor : null;
    }
}