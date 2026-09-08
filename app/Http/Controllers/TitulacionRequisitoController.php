<?php

namespace App\Http\Controllers;

use App\Models\TitulacionRequisito;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class TitulacionRequisitoController extends Controller
{
    /**
     * Listado inicial de requisitos de titulación.
     */
    public function index(Request $request): Response
    {
        $buscar      = trim((string) $request->input('buscar', ''));
        $estado      = trim((string) $request->input('estado', ''));
        $obligatorio = trim((string) $request->input('es_obligatorio', ''));

        $requisitos = TitulacionRequisito::query()
            ->withCount('expedienteRequisitos')
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('nombre', 'like', "%{$buscar}%")
                        ->orWhere('descripcion', 'like', "%{$buscar}%");
                });
            })
            ->when($estado !== '', fn ($query) => $query->where('activo', $estado === 'Activo'))
            ->when($obligatorio !== '', fn ($query) => $query->where('es_obligatorio', $obligatorio === '1'))
            ->orderBy('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Titulacion/Requisitos/Index', [
            'requisitos' => $requisitos,
            'filtros'    => [
                'buscar'         => $buscar,
                'estado'         => $estado,
                'es_obligatorio' => $obligatorio,
            ],
        ]);
    }

    /**
     * Filtrado dinámico vía AJAX.
     */
    public function filtrar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'buscar'         => ['nullable', 'string', 'max:100'],
            'estado'         => ['nullable', 'string', 'in:Activo,Inactivo'],
            'es_obligatorio' => ['nullable', 'string', 'in:1,0'],
            'page'           => ['nullable', 'integer', 'min:1'],
        ]);

        $buscar      = trim((string) ($datos['buscar'] ?? ''));
        $estado      = trim((string) ($datos['estado'] ?? ''));
        $obligatorio = trim((string) ($datos['es_obligatorio'] ?? ''));
        $pagina      = (int) ($datos['page'] ?? 1);

        $requisitos = TitulacionRequisito::query()
            ->withCount('expedienteRequisitos')
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('nombre', 'like', "%{$buscar}%")
                        ->orWhere('descripcion', 'like', "%{$buscar}%");
                });
            })
            ->when($estado !== '', fn ($query) => $query->where('activo', $estado === 'Activo'))
            ->when($obligatorio !== '', fn ($query) => $query->where('es_obligatorio', $obligatorio === '1'))
            ->orderBy('id')
            ->paginate(perPage: 10, columns: ['*'], pageName: 'page', page: $pagina);

        return response()->json(['requisitos' => $requisitos]);
    }

    /**
     * Registra un nuevo requisito en el catálogo.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        TitulacionRequisito::create([
            'nombre'         => trim($datos['nombre']),
            'descripcion'    => $this->normalizarNullable($datos['descripcion'] ?? null),
            'es_obligatorio' => (bool) ($datos['es_obligatorio'] ?? true),
            'activo'         => (bool) ($datos['activo'] ?? true),
        ]);

        return back()->with('success', 'Requisito de titulación creado correctamente.');
    }

    /**
     * Actualiza un requisito existente.
     */
    public function update(Request $request, TitulacionRequisito $requisito): RedirectResponse
    {
        $datos = $this->validar($request, $requisito);

        $requisito->update([
            'nombre'         => trim($datos['nombre']),
            'descripcion'    => $this->normalizarNullable($datos['descripcion'] ?? null),
            'es_obligatorio' => (bool) $datos['es_obligatorio'],
            'activo'         => (bool) $datos['activo'],
        ]);

        return back()->with('success', 'Requisito actualizado correctamente.');
    }

    /**
     * Activa o desactiva la obligatoriedad.
     */
    public function toggleObligatorio(TitulacionRequisito $requisito): RedirectResponse
    {
        $requisito->update(['es_obligatorio' => ! $requisito->es_obligatorio]);

        return back()->with('success', 'Condición de obligatoriedad actualizada.');
    }

    /**
     * Activa o desactiva el estado del requisito.
     */
    public function actualizarEstado(Request $request, TitulacionRequisito $requisito): RedirectResponse
    {
        $datos = $request->validate([
            'activo' => ['required', 'boolean'],
        ]);

        $requisito->update(['activo' => (bool) $datos['activo']]);

        return back()->with('success', 'Estado del requisito modificado correctamente.');
    }

    /**
     * Elimina el requisito si no está asociado a expedientes existentes.
     */
    public function destroy(TitulacionRequisito $requisito): RedirectResponse
    {
        try {
            if ($requisito->expedienteRequisitos()->exists()) {
                return back()->with('error', 'No se puede eliminar el requisito porque ya ha sido entregado en expedientes de egresados.');
            }

            $requisito->delete();

            return back()->with('success', 'Requisito eliminado.');
        } catch (Throwable $exception) {
            report($exception);
            return back()->with('error', 'No se pudo eliminar el requisito.');
        }
    }

    /**
     * Reglas de validación.
     */
    private function validar(Request $request, ?TitulacionRequisito $requisito = null): array
    {
        return $request->validate([
            'nombre'         => ['required', 'string', 'max:150', Rule::unique('titulacion_requisitos', 'nombre')->ignore($requisito?->id)],
            'descripcion'    => ['nullable', 'string', 'max:255'],
            'es_obligatorio' => ['nullable', 'boolean'],
            'activo'         => ['nullable', 'boolean'],
        ], [
            'nombre.required' => 'El nombre del requisito es obligatorio.',
            'nombre.unique'   => 'Ya existe un requisito con este nombre.',
            'nombre.max'      => 'El nombre no debe exceder los 150 caracteres.',
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