<?php

namespace App\Http\Controllers;

use App\Models\Pabellon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PabellonController extends Controller
{
    /**
     * Muestra el listado inicial.
     */
    public function index(): Response
    {
        return Inertia::render('Pabellones/Index', [
            'pabellones' => $this->obtenerPabellones(),
            'filtros' => [
                'buscar' => '',
            ],
        ]);
    }

    /**
     * Filtra los pabellones mediante AJAX.
     */
    public function filtrar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'buscar' => [
                'nullable',
                'string',
                'max:100',
            ],
            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        $buscar = trim((string) ($datos['buscar'] ?? ''));
        $pagina = (int) ($datos['page'] ?? 1);

        return response()->json([
            'pabellones' => $this->obtenerPabellones(
                buscar: $buscar,
                pagina: $pagina
            ),
            'filtros' => [
                'buscar' => $buscar,
            ],
        ]);
    }

    /**
     * Muestra el formulario de registro.
     */
    public function create(): Response
    {
        return Inertia::render('Pabellones/Create');
    }

    /**
     * Registra un pabellón.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        Pabellon::create([
            'nombre' => trim($datos['nombre']),
            'descripcion' => filled($datos['descripcion'] ?? null)
                ? trim($datos['descripcion'])
                : null,
        ]);

        return to_route('pabellones.index')
            ->with(
                'success',
                'Pabellón registrado correctamente.'
            );
    }

    /**
     * Muestra el formulario de edición.
     */
    public function edit(Pabellon $pabellon): Response
{
    return Inertia::render('Pabellones/Edit', [
        'pabellon' => $pabellon,
    ]);
}

    /**
     * Actualiza un pabellón.
     */
    public function update(
        Request $request,
        Pabellon $pabellon
    ): RedirectResponse {
        $datos = $this->validar($request, $pabellon);

        $pabellon->update([
            'nombre' => trim($datos['nombre']),
            'descripcion' => filled($datos['descripcion'] ?? null)
                ? trim($datos['descripcion'])
                : null,
        ]);

        return to_route('pabellones.index')
            ->with(
                'success',
                'Pabellón actualizado correctamente.'
            );
    }

    /**
     * Elimina un pabellón.
     */
    public function destroy(
        Pabellon $pabellon
    ): RedirectResponse {
        if ($pabellon->aulas()->exists()) {
            return back()->with(
                'error',
                'No se puede eliminar el pabellón porque tiene aulas relacionadas.'
            );
        }

        $pabellon->delete();

        return back()->with(
            'success',
            'Pabellón eliminado correctamente.'
        );
    }

    /**
     * Consulta reutilizable para listado y filtrado.
     */
    private function obtenerPabellones(
        string $buscar = '',
        int $pagina = 1
    ) {
        return Pabellon::query()
            ->withCount('aulas')
            ->when(
                $buscar !== '',
                function ($query) use ($buscar) {
                    $query->where(function ($subquery) use ($buscar) {
                        $subquery
                            ->where(
                                'nombre',
                                'like',
                                "%{$buscar}%"
                            )
                            ->orWhere(
                                'descripcion',
                                'like',
                                "%{$buscar}%"
                            );
                    });
                }
            )
            ->orderBy('nombre')
            ->paginate(
                perPage: 15,
                columns: ['*'],
                pageName: 'page',
                page: $pagina
            );
    }

    /**
     * Reglas de validación.
     */
    private function validar(
        Request $request,
        ?Pabellon $pabellon = null
    ): array {
        return $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:100',
                Rule::unique('pabellones', 'nombre')
                    ->ignore($pabellon?->id),
            ],
            'descripcion' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ]);
    }
}

