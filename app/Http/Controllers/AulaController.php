<?php


namespace App\Http\Controllers;
use App\Models\Aula;
use App\Models\Pabellon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AulaController extends Controller
{
    /**
     * Muestra el listado inicial.
     */
    public function index(): Response
    {
        return Inertia::render('Aulas/Index', [
            'aulas' => $this->obtenerAulas(),
            'pabellones' => $this->pabellones(),
            'tipos' => $this->tipos(),
            'filtros' => [
                'buscar' => '',
                'id_pabellon' => '',
                'tipo' => '',
            ],
        ]);
    }

    /**
     * Filtra las aulas mediante AJAX.
     */
    public function filtrar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'buscar' => [
                'nullable',
                'string',
                'max:100',
            ],
            'id_pabellon' => [
                'nullable',
                'integer',
                'exists:pabellones,id',
            ],
            'tipo' => [
                'nullable',
                'string',
                'max:50',
            ],
            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        $buscar = trim((string) ($datos['buscar'] ?? ''));

        $idPabellon = isset($datos['id_pabellon'])
            ? (int) $datos['id_pabellon']
            : null;

        $tipo = trim((string) ($datos['tipo'] ?? ''));

        $pagina = (int) ($datos['page'] ?? 1);

        return response()->json([
            'aulas' => $this->obtenerAulas(
                buscar: $buscar,
                idPabellon: $idPabellon,
                tipo: $tipo,
                pagina: $pagina
            ),
            'filtros' => [
                'buscar' => $buscar,
                'id_pabellon' => $idPabellon ?? '',
                'tipo' => $tipo,
            ],
        ]);
    }

    /**
     * Muestra el formulario de registro.
     */
    public function create(): Response
    {
        return Inertia::render('Aulas/Create', [
            'pabellones' => $this->pabellones(),
            'tipos' => $this->tipos(),
        ]);
    }

    /**
     * Registra un aula.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        Aula::create([
            'nombre' => trim($datos['nombre']),
            'numero_aula' => filled($datos['numero_aula'] ?? null)
                ? trim($datos['numero_aula'])
                : null,
            'capacidad' => (int) $datos['capacidad'],
            'id_pabellon' => (int) $datos['id_pabellon'],
            'tipo' => filled($datos['tipo'] ?? null)
                ? trim($datos['tipo'])
                : null,
        ]);

        return to_route('aulas.index')
            ->with(
                'success',
                'Aula registrada correctamente.'
            );
    }

    /**
     * Muestra el formulario de edición.
     */
    public function edit(Aula $aula): Response
    {
        return Inertia::render('Aulas/Edit', [
            'aula' => $aula,
            'pabellones' => $this->pabellones(),
            'tipos' => $this->tipos(),
        ]);
    }

    /**
     * Actualiza un aula.
     */
    public function update(
        Request $request,
        Aula $aula
    ): RedirectResponse {
        $datos = $this->validar($request, $aula);

        $aula->update([
            'nombre' => trim($datos['nombre']),
            'numero_aula' => filled($datos['numero_aula'] ?? null)
                ? trim($datos['numero_aula'])
                : null,
            'capacidad' => (int) $datos['capacidad'],
            'id_pabellon' => (int) $datos['id_pabellon'],
            'tipo' => filled($datos['tipo'] ?? null)
                ? trim($datos['tipo'])
                : null,
        ]);

        return to_route('aulas.index')
            ->with(
                'success',
                'Aula actualizada correctamente.'
            );
    }

    /**
     * Elimina un aula.
     */
    public function destroy(Aula $aula): RedirectResponse
    {
        /*
         * Agrega aquí validaciones de relaciones si posteriormente
         * el aula se relaciona con horarios, cursos o reservas.
         */

        $aula->delete();

        return back()->with(
            'success',
            'Aula eliminada correctamente.'
        );
    }

    /**
     * Consulta reutilizable de aulas.
     */
    private function obtenerAulas(
        string $buscar = '',
        ?int $idPabellon = null,
        string $tipo = '',
        int $pagina = 1
    ) {
        return Aula::query()
            ->with([
                'pabellon:id,nombre',
            ])
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
                                'numero_aula',
                                'like',
                                "%{$buscar}%"
                            )
                            ->orWhere(
                                'tipo',
                                'like',
                                "%{$buscar}%"
                            );
                    });
                }
            )
            ->when(
                $idPabellon !== null,
                fn ($query) => $query->where(
                    'id_pabellon',
                    $idPabellon
                )
            )
            ->when(
                $tipo !== '',
                fn ($query) => $query->where(
                    'tipo',
                    $tipo
                )
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
        ?Aula $aula = null
    ): array {
        return $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:50',
            ],
            'numero_aula' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('aulas', 'numero_aula')
                    ->where(
                        fn ($query) => $query->where(
                            'id_pabellon',
                            $request->input('id_pabellon')
                        )
                    )
                    ->ignore($aula?->id),
            ],
            'capacidad' => [
                'required',
                'integer',
                'min:0',
                'max:10000',
            ],
            'id_pabellon' => [
                'required',
                'integer',
                'exists:pabellones,id',
            ],
            'tipo' => [
                'nullable',
                'string',
                'max:50',
            ],
        ]);
    }

    /**
     * Lista los pabellones para los combos.
     */
    private function pabellones()
    {
        return Pabellon::query()
            ->orderBy('nombre')
            ->get([
                'id',
                'nombre',
            ]);
    }

    /**
     * Obtiene los tipos registrados actualmente.
     */
    private function tipos()
    {
        return Aula::query()
            ->whereNotNull('tipo')
            ->where('tipo', '<>', '')
            ->distinct()
            ->orderBy('tipo')
            ->pluck('tipo')
            ->values();
    }
}

