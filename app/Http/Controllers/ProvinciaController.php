<?php

namespace App\Http\Controllers;

use App\Models\Departamento;
use App\Models\Provincia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProvinciaController extends Controller
{
    /**
     * Muestra el listado inicial de provincias.
     */
    public function index(): Response
    {
        return Inertia::render('Provincias/Index', [
            'provincias' => $this->obtenerProvincias(),
            'departamentos' => $this->departamentos(),
            'filtros' => [
                'buscar' => '',
                'idDepa' => '',
            ],
        ]);
    }

    /**
     * Filtra las provincias mediante una petición AJAX de Inertia.
     */
    public function filtrar(Request $request): Response
    {
        $datos = $request->validate([
            'buscar' => [
                'nullable',
                'string',
                'max:100',
            ],
            'idDepa' => [
                'nullable',
                'integer',
                'exists:departamentos,idDepa',
            ],
            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        $buscar = trim((string) ($datos['buscar'] ?? ''));
        $idDepa = $datos['idDepa'] ?? null;
        $pagina = (int) ($datos['page'] ?? 1);

        return Inertia::render('Provincias/Index', [
            'provincias' => $this->obtenerProvincias(
                buscar: $buscar,
                idDepa: $idDepa,
                pagina: $pagina
            ),
            'departamentos' => $this->departamentos(),
            'filtros' => [
                'buscar' => $buscar,
                'idDepa' => $idDepa,
            ],
        ]);
    }

    /**
     * Muestra el formulario de registro.
     */
    public function create(): Response
    {
        return Inertia::render('Provincias/Create', [
            'departamentos' => $this->departamentos(),
        ]);
    }

    /**
     * Registra una nueva provincia.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        Provincia::create([
            'Provincia' => trim($datos['Provincia']),
            'idDepa' => (int) $datos['idDepa'],
        ]);

        return to_route('provincias.index')
            ->with(
                'success',
                'Provincia registrada correctamente.'
            );
    }

    /**
     * Muestra el formulario de edición.
     */
    public function edit(Provincia $provincia): Response
    {
        return Inertia::render('Provincias/Edit', [
            'provincia' => $provincia,
            'departamentos' => $this->departamentos(),
        ]);
    }

    /**
     * Actualiza una provincia.
     */
    public function update(
        Request $request,
        Provincia $provincia
    ): RedirectResponse {
        $datos = $this->validar($request, $provincia);

        $provincia->update([
            'Provincia' => trim($datos['Provincia']),
            'idDepa' => (int) $datos['idDepa'],
        ]);

        return to_route('provincias.index')
            ->with(
                'success',
                'Provincia actualizada correctamente.'
            );
    }

    /**
     * Elimina una provincia.
     */
    public function destroy(
        Provincia $provincia
    ): RedirectResponse {
        if ($provincia->distritos()->exists()) {
            return back()->with(
                'error',
                'No se puede eliminar la provincia porque tiene distritos relacionados.'
            );
        }

        $provincia->delete();

        return back()->with(
            'success',
            'Provincia eliminada correctamente.'
        );
    }

    /**
     * Retorna las provincias que pertenecen a un departamento.
     */
    public function porDepartamento(
        Departamento $departamento
    ): JsonResponse {
        return response()->json([
            'provincias' => $departamento
                ->provincias()
                ->orderBy('Provincia')
                ->get([
                    'idProv',
                    'Provincia',
                ]),
        ]);
    }

    /**
     * Construye la consulta de provincias.
     */
    private function obtenerProvincias(
        string $buscar = '',
        ?int $idDepa = null,
        int $pagina = 1
    ) {
        return Provincia::query()
            ->with([
                'departamento:idDepa,Departamento',
            ])
            ->withCount('distritos')
            ->when(
                $buscar !== '',
                fn ($query) => $query->where(
                    'Provincia',
                    'like',
                    "%{$buscar}%"
                )
            )
            ->when(
                $idDepa !== null,
                fn ($query) => $query->where(
                    'idDepa',
                    $idDepa
                )
            )
            ->orderBy('Provincia')
            ->paginate(
                perPage: 15,
                columns: ['*'],
                pageName: 'page',
                page: $pagina
            );
    }

    /**
     * Valida los datos de registro y actualización.
     */
    private function validar(
        Request $request,
        ?Provincia $provincia = null
    ): array {
        return $request->validate([
            'Provincia' => [
                'required',
                'string',
                'max:50',
                Rule::unique(
                    'provincias',
                    'Provincia'
                )
                    ->where(
                        fn ($query) => $query->where(
                            'idDepa',
                            $request->input('idDepa')
                        )
                    )
                    ->ignore(
                        $provincia?->idProv,
                        'idProv'
                    ),
            ],
            'idDepa' => [
                'required',
                'integer',
                'exists:departamentos,idDepa',
            ],
        ]);
    }

    /**
     * Obtiene los departamentos disponibles.
     */
    private function departamentos()
    {
        return Departamento::query()
            ->orderBy('Departamento')
            ->get([
                'idDepa',
                'Departamento',
            ]);
    }
}

