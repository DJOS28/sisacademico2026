<?php

namespace App\Http\Controllers;

use App\Models\Departamento;
use App\Models\Distrito;
use App\Models\Provincia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DistritoController extends Controller
{
    /**
     * Muestra el listado inicial.
     */
    public function index(): Response
    {
        return Inertia::render('Distritos/Index', [
            'distritos' => $this->obtenerDistritos(),
            'departamentos' => $this->departamentos(),
            'provincias' => [],
            'filtros' => [
                'buscar' => '',
                'idDepa' => '',
                'idProv' => '',
            ],
        ]);
    }

    /**
     * Filtra distritos mediante AJAX con Inertia.
     */
    public function filtrar(Request $request): JsonResponse
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
        'idProv' => [
            'nullable',
            'integer',
            'exists:provincias,idProv',
        ],
        'page' => [
            'nullable',
            'integer',
            'min:1',
        ],
    ]);

    $buscar = trim((string) ($datos['buscar'] ?? ''));

    $idDepa = isset($datos['idDepa'])
        ? (int) $datos['idDepa']
        : null;

    $idProv = isset($datos['idProv'])
        ? (int) $datos['idProv']
        : null;

    $pagina = (int) ($datos['page'] ?? 1);

    if ($idProv !== null && $idDepa !== null) {
        $provinciaValida = Provincia::query()
            ->where('idProv', $idProv)
            ->where('idDepa', $idDepa)
            ->exists();

        if (! $provinciaValida) {
            $idProv = null;
        }
    }

    $distritos = $this->obtenerDistritos(
        buscar: $buscar,
        idDepa: $idDepa,
        idProv: $idProv,
        pagina: $pagina
    );

    $provincias = $this->provinciasPorDepartamento($idDepa);

    return response()->json([
        'distritos' => $distritos,
        'provincias' => $provincias,
        'filtros' => [
            'buscar' => $buscar,
            'idDepa' => $idDepa ?? '',
            'idProv' => $idProv ?? '',
        ],
    ]);
}

    /**
     * Muestra el formulario de registro.
     */
    public function create(): Response
    {
        return Inertia::render('Distritos/Create', [
            'departamentos' => $this->departamentos(),
        ]);
    }

    /**
     * Registra un distrito.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        Distrito::create([
            'Distrito' => trim($datos['Distrito']),
            'idProv' => (int) $datos['idProv'],
        ]);

        return to_route('distritos.index')
            ->with(
                'success',
                'Distrito registrado correctamente.'
            );
    }

    /**
     * Muestra el formulario de edición.
     */
    public function edit(Distrito $distrito): Response
    {
        $distrito->load('provincia');

        $idDepa = $distrito->provincia?->idDepa;

        return Inertia::render('Distritos/Edit', [
            'distrito' => $distrito,
            'departamentos' => $this->departamentos(),
            'provincias' => $this->provinciasPorDepartamento($idDepa),
            'idDepa' => $idDepa,
        ]);
    }

    /**
     * Actualiza un distrito.
     */
    public function update(
        Request $request,
        Distrito $distrito
    ): RedirectResponse {
        $datos = $this->validar($request, $distrito);

        $distrito->update([
            'Distrito' => trim($datos['Distrito']),
            'idProv' => (int) $datos['idProv'],
        ]);

        return to_route('distritos.index')
            ->with(
                'success',
                'Distrito actualizado correctamente.'
            );
    }

    /**
     * Elimina un distrito.
     */
    public function destroy(
        Distrito $distrito
    ): RedirectResponse {
        if ($distrito->institutos()->exists()) {
            return back()->with(
                'error',
                'No se puede eliminar el distrito porque tiene institutos relacionados.'
            );
        }

        $distrito->delete();

        return back()->with(
            'success',
            'Distrito eliminado correctamente.'
        );
    }

    /**
     * Devuelve distritos por provincia en JSON.
     */
    public function porProvincia(
        Provincia $provincia
    ): JsonResponse {
        return response()->json([
            'distritos' => $provincia
                ->distritos()
                ->orderBy('Distrito')
                ->get([
                    'idDist',
                    'Distrito',
                ]),
        ]);
    }

    /**
     * Construye la consulta para listar y filtrar distritos.
     */
    private function obtenerDistritos(
        string $buscar = '',
        ?int $idDepa = null,
        ?int $idProv = null,
        int $pagina = 1
    ) {
        return Distrito::query()
            ->with([
                'provincia:idProv,Provincia,idDepa',
                'provincia.departamento:idDepa,Departamento',
            ])
            ->when(
                $buscar !== '',
                fn ($query) => $query->where(
                    'Distrito',
                    'like',
                    "%{$buscar}%"
                )
            )
            ->when(
                $idProv !== null,
                fn ($query) => $query->where(
                    'idProv',
                    $idProv
                )
            )
            ->when(
                $idDepa !== null && $idProv === null,
                fn ($query) => $query->whereHas(
                    'provincia',
                    fn ($subquery) => $subquery->where(
                        'idDepa',
                        $idDepa
                    )
                )
            )
            ->orderBy('Distrito')
            ->paginate(
                perPage: 20,
                columns: ['*'],
                pageName: 'page',
                page: $pagina
            );
    }

    /**
     * Valida los datos del distrito.
     */
    private function validar(
        Request $request,
        ?Distrito $distrito = null
    ): array {
        return $request->validate([
            'Distrito' => [
                'required',
                'string',
                'max:50',
                Rule::unique('distritos', 'Distrito')
                    ->where(
                        fn ($query) => $query->where(
                            'idProv',
                            $request->input('idProv')
                        )
                    )
                    ->ignore(
                        $distrito?->idDist,
                        'idDist'
                    ),
            ],
            'idProv' => [
                'required',
                'integer',
                'exists:provincias,idProv',
            ],
        ]);
    }

    /**
     * Obtiene todos los departamentos.
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

    /**
     * Obtiene provincias del departamento seleccionado.
     */
    private function provinciasPorDepartamento(
        ?int $idDepa
    ) {
        if ($idDepa === null) {
            return collect();
        }

        return Provincia::query()
            ->where('idDepa', $idDepa)
            ->orderBy('Provincia')
            ->get([
                'idProv',
                'Provincia',
            ]);
    }
}