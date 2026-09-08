<?php

namespace App\Http\Controllers;

use App\Models\TitulacionModalidad;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class TitulacionModalidadController extends Controller
{
    /**
     * Listado inicial de modalidades de titulación.
     */
    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->input('buscar', ''));
        $estado = trim((string) $request->input('estado', ''));

        $modalidades = TitulacionModalidad::query()
            ->withCount('titulaciones')
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where('nombre', 'like', "%{$buscar}%")
                    ->orWhere('descripcion', 'like', "%{$buscar}%");
            })
            ->when($estado !== '', fn ($query) => $query->where('activo', $estado === 'Activo'))
            ->orderBy('nombre')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Titulacion/Modalidades/Index', [
            'modalidades' => $modalidades,
            'filtros'     => [
                'buscar' => $buscar,
                'estado' => $estado,
            ],
        ]);
    }

    /**
     * Filtrado asíncrono vía AJAX.
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

        $modalidades = TitulacionModalidad::query()
            ->withCount('titulaciones')
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where('nombre', 'like', "%{$buscar}%")
                    ->orWhere('descripcion', 'like', "%{$buscar}%");
            })
            ->when($estado !== '', fn ($query) => $query->where('activo', $estado === 'Activo'))
            ->orderBy('nombre')
            ->paginate(perPage: 10, columns: ['*'], pageName: 'page', page: $pagina);

        return response()->json(['modalidades' => $modalidades]);
    }

    /**
     * Registra una nueva modalidad.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        TitulacionModalidad::create([
            'nombre'      => trim($datos['nombre']),
            'descripcion' => $this->normalizarNullable($datos['descripcion'] ?? null),
            'activo'      => (bool) ($datos['activo'] ?? true),
        ]);

        return back()->with('success', 'Modalidad de titulación registrada correctamente.');
    }

    /**
     * Actualiza una modalidad existente.
     */
    public function update(Request $request, TitulacionModalidad $modalidad): RedirectResponse
    {
        $datos = $this->validar($request, $modalidad);

        $modalidad->update([
            'nombre'      => trim($datos['nombre']),
            'descripcion' => $this->normalizarNullable($datos['descripcion'] ?? null),
            'activo'      => (bool) $datos['activo'],
        ]);

        return back()->with('success', 'Modalidad de titulación actualizada correctamente.');
    }

    /**
     * Activa o desactiva la modalidad.
     */
    public function actualizarEstado(Request $request, TitulacionModalidad $modalidad): RedirectResponse
    {
        $datos = $request->validate([
            'activo' => ['required', 'boolean'],
        ]);

        $modalidad->update(['activo' => (bool) $datos['activo']]);

        return back()->with('success', 'Estado de la modalidad actualizado correctamente.');
    }

    /**
     * Elimina una modalidad si no tiene expedientes vinculados.
     */
    public function destroy(TitulacionModalidad $modalidad): RedirectResponse
    {
        try {
            if ($modalidad->titulaciones()->exists()) {
                return back()->with('error', 'No se puede eliminar la modalidad porque tiene expedientes de titulación asociados.');
            }

            $modalidad->delete();

            return back()->with('success', 'Modalidad de titulación eliminada.');
        } catch (Throwable $exception) {
            report($exception);
            return back()->with('error', 'No se pudo eliminar la modalidad.');
        }
    }

    /**
     * Reglas de validación.
     */
    private function validar(Request $request, ?TitulacionModalidad $modalidad = null): array
    {
        return $request->validate([
            'nombre'      => ['required', 'string', 'max:100', Rule::unique('titulacion_modalidades', 'nombre')->ignore($modalidad?->id)],
            'descripcion' => ['nullable', 'string', 'max:255'],
            'activo'      => ['nullable', 'boolean'],
        ], [
            'nombre.required' => 'El nombre de la modalidad es obligatorio.',
            'nombre.unique'   => 'Ya existe una modalidad de titulación con ese nombre.',
            'nombre.max'      => 'El nombre no debe superar los 100 caracteres.',
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