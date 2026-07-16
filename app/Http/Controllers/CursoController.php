<?php

namespace App\Http\Controllers;

use App\Imports\CursoImport;
use App\Models\Curso;
use App\Models\ModuloFormativo;
use App\Models\PlanEstudio;
use App\Models\Semestre;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Throwable;
use Illuminate\Http\JsonResponse;

class CursoController extends Controller
{
    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->input('buscar', ''));
        $planEstudioId = $request->input('plan_estudio_id');
        $semestreId = $request->input('semestre_id');
        $moduloId = $request->input('id_modulo');
        $tipo = trim((string) $request->input('tipo', ''));

        $cursos = Curso::query()
            ->with([
                'planesEstudio:id,nombre,codigo',
                'semestre:id,nombre,activo',
                'moduloFormativo:id_modulo,id_plan_estudio,nombre,num_modulo',
                'moduloFormativo.planEstudio:id,nombre,codigo',
            ])
            ->when(
                $buscar !== '',
                function ($query) use ($buscar): void {
                    $query->where(function ($subquery) use ($buscar): void {
                        $subquery
                            ->where('nombre', 'like', "%{$buscar}%")
                            ->orWhere('descripcion', 'like', "%{$buscar}%")
                            ->orWhere('tipo', 'like', "%{$buscar}%")
                            ->orWhereHas(
                                'planesEstudio',
                                fn($q) => $q
                                    ->where(
                                        'nombre',
                                        'like',
                                        "%{$buscar}%"
                                    )
                                    ->orWhere(
                                        'codigo',
                                        'like',
                                        "%{$buscar}%"
                                    )
                            );
                    });
                }
            )
            ->when(
                filled($planEstudioId),
                fn($query) => $query->whereHas(
                    'planesEstudio',
                    fn($q) => $q->where(
                        'planes_estudio.id',
                        $planEstudioId
                    )
                )
            )
            ->when(
                filled($semestreId),
                fn($query) => $query->where(
                    'semestre_id',
                    $semestreId
                )
            )
            ->when(
                filled($moduloId),
                fn($query) => $query->where(
                    'id_modulo',
                    $moduloId
                )
            )
            ->when(
                $tipo !== '',
                fn($query) => $query->where(
                    'tipo',
                    $tipo
                )
            )
            ->orderBy('semestre_id')
            ->orderBy('id_modulo')
            ->orderBy('orden')
            ->paginate(15)
            ->withQueryString()
            ->through(
                fn(Curso $curso): array =>
                $this->cursoData($curso)
            );

        return Inertia::render('Cursos/Index', [
            'cursos' => $cursos,
            'planesEstudio' => $this->planesEstudio(),
            'semestres' => $this->semestres(),
            'modulos' => $this->modulos(),
            'tipos' => $this->tipos(),
            'filtros' => [
                'buscar' => $buscar,
                'plan_estudio_id' => filled($planEstudioId)
                    ? (string) $planEstudioId
                    : '',
                'semestre_id' => filled($semestreId)
                    ? (string) $semestreId
                    : '',
                'id_modulo' => filled($moduloId)
                    ? (string) $moduloId
                    : '',
                'tipo' => $tipo,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Cursos/Create', [
            'planesEstudio' => $this->planesEstudio(true),
            'semestres' => $this->semestres(true),
            'modulos' => $this->modulos(),
            'tipos' => $this->tipos(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        DB::transaction(function () use ($datos): void {
            $curso = Curso::create(
                $this->payload($datos)
            );

            $curso->planesEstudio()->sync([
                (int) $datos['plan_estudio_id'],
            ]);
        });

        return to_route('cursos.index')
            ->with(
                'success',
                'Curso registrado correctamente.'
            );
    }

    public function edit(Curso $curso): Response
    {
        $curso->load([
            'planesEstudio:id,nombre,codigo',
            'semestre:id,nombre,activo',
            'moduloFormativo:id_modulo,id_plan_estudio,nombre,num_modulo',
        ]);

        $planActualId = $curso->planesEstudio
            ->first()?->id;

        return Inertia::render('Cursos/Edit', [
            'curso' => $this->cursoData($curso),
            'planesEstudio' => $this->planesEstudio(
                true,
                $planActualId
            ),
            'semestres' => $this->semestres(
                true,
                $curso->semestre_id
            ),
            'modulos' => $this->modulos(
                $curso->id_modulo
            ),
            'tipos' => $this->tipos(),
        ]);
    }

    public function update(
        Request $request,
        Curso $curso
    ): RedirectResponse {
        $datos = $this->validar(
            $request,
            $curso
        );

        DB::transaction(function () use (
            $datos,
            $curso
        ): void {
            $curso->update(
                $this->payload($datos)
            );

            $curso->planesEstudio()->sync([
                (int) $datos['plan_estudio_id'],
            ]);
        });

        return to_route('cursos.index')
            ->with(
                'success',
                'Curso actualizado correctamente.'
            );
    }

    public function destroy(Curso $curso): RedirectResponse
    {
        try {
            DB::transaction(function () use ($curso): void {
                $curso->planesEstudio()->detach();
                $curso->delete();
            });

            return back()->with(
                'success',
                'Curso eliminado correctamente.'
            );
        } catch (Throwable $exception) {
            report($exception);

            return back()->with(
                'error',
                'No se pudo eliminar el curso porque tiene registros relacionados.'
            );
        }
    }

    public function importar(
        Request $request
    ): RedirectResponse {
        $request->validate([
            'archivo' => [
                'required',
                'file',
                'mimes:xlsx,xls,csv',
                'max:5120',
            ],
        ]);

        try {
            $import = new CursoImport();

            Excel::import(
                $import,
                $request->file('archivo')
            );

            return back()
                ->with(
                    'success',
                    sprintf(
                        'Importación finalizada: %d cursos registrados y %d filas omitidas.',
                        $import->importados(),
                        $import->omitidos()
                    )
                )
                ->with(
                    'import_errors',
                    array_slice(
                        $import->errores(),
                        0,
                        50
                    )
                );
        } catch (Throwable $exception) {
            report($exception);

            return back()->with(
                'error',
                'No se pudo procesar el archivo.'
            );
        }
    }

    public function modulosPorPlan(
        PlanEstudio $planEstudio
    ) {
        return response()->json(
            ModuloFormativo::query()
                ->where(
                    'id_plan_estudio',
                    $planEstudio->id
                )
                ->orderBy('num_modulo')
                ->get([
                    'id_modulo',
                    'nombre',
                    'num_modulo',
                ])
        );
    }

    private function validar(
        Request $request,
        ?Curso $curso = null
    ): array {
        $datos = $request->validate([
            'plan_estudio_id' => [
                'required',
                'integer',
                'exists:planes_estudio,id',
            ],
            'nombre' => [
                'required',
                'string',
                'max:100',
            ],
            'descripcion' => [
                'nullable',
                'string',
                'max:3000',
            ],
            'semestre_id' => [
                'required',
                'integer',
                'exists:semestres,id',
            ],
            'tipo' => [
                'required',
                'string',
                'max:20',
            ],
            'id_modulo' => [
                'required',
                'integer',
                'exists:modulos_formativos,id_modulo',
            ],
            'creditos' => [
                'required',
                'numeric',
                'min:0',
                'max:99.99',
            ],
            'horas_semestrales' => [
                'required',
                'integer',
                'min:1',
            ],
            'orden' => [
                'required',
                'integer',
                'min:1',
                Rule::unique('cursos', 'orden')
                    ->where(
                        fn($query) => $query
                            ->where(
                                'semestre_id',
                                $request->input(
                                    'semestre_id'
                                )
                            )
                            ->where(
                                'id_modulo',
                                $request->input(
                                    'id_modulo'
                                )
                            )
                    )
                    ->ignore($curso?->id),
            ],
        ]);

        $moduloPerteneceAlPlan = ModuloFormativo::query()
            ->where(
                'id_modulo',
                $datos['id_modulo']
            )
            ->where(
                'id_plan_estudio',
                $datos['plan_estudio_id']
            )
            ->exists();

        if (! $moduloPerteneceAlPlan) {
            abort(
                redirect()
                    ->back()
                    ->withErrors([
                        'id_modulo' =>
                        'El módulo seleccionado no pertenece al plan de estudio.',
                    ])
                    ->withInput()
            );
        }

        return $datos;
    }

    private function payload(array $datos): array
    {
        return [
            'nombre' => trim($datos['nombre']),
            'descripcion' => $this->nullable(
                $datos['descripcion'] ?? null
            ),
            'semestre_id' =>
            (int) $datos['semestre_id'],
            'tipo' => trim($datos['tipo']),
            'id_modulo' =>
            (int) $datos['id_modulo'],
            'creditos' => number_format(
                (float) $datos['creditos'],
                2,
                '.',
                ''
            ),
            'horas_semestrales' =>
            (int) $datos['horas_semestrales'],
            'orden' =>
            (int) $datos['orden'],
        ];
    }

    private function cursoData(Curso $curso): array
    {
        return [
            'id' => $curso->id,
            'nombre' => $curso->nombre,
            'descripcion' => $curso->descripcion,
            'plan_estudio_id' => $curso
                ->planesEstudio
                ->first()?->id,
            'planes_estudio' => $curso
                ->planesEstudio
                ->map(
                    fn(PlanEstudio $plan): array => [
                        'id' => $plan->id,
                        'nombre' => $plan->nombre,
                        'codigo' => $plan->codigo,
                    ]
                )
                ->values()
                ->all(),
            'semestre_id' => $curso->semestre_id,
            'tipo' => $curso->tipo,
            'id_modulo' => $curso->id_modulo,
            'creditos' => $curso->creditos,
            'horas_semestrales' =>
            $curso->horas_semestrales,
            'orden' => $curso->orden,
            'semestre' => $curso->semestre
                ? [
                    'id' => $curso->semestre->id,
                    'nombre' => $curso->semestre->nombre,
                ]
                : null,
            'modulo' => $curso->moduloFormativo
                ? [
                    'id_modulo' =>
                    $curso->moduloFormativo->id_modulo,
                    'nombre' =>
                    $curso->moduloFormativo->nombre,
                    'num_modulo' =>
                    $curso->moduloFormativo->num_modulo,
                ]
                : null,
        ];
    }

    private function planesEstudio(
        bool $soloActivos = false,
        ?int $actualId = null
    ): array {
        return PlanEstudio::query()
            ->when(
                $soloActivos,
                function ($query) use ($actualId): void {
                    $query->where(function ($q) use (
                        $actualId
                    ): void {
                        $q->where('activo', true);

                        if ($actualId) {
                            $q->orWhere(
                                'id',
                                $actualId
                            );
                        }
                    });
                }
            )
            ->orderBy('nombre')
            ->get([
                'id',
                'nombre',
                'codigo',
                'activo',
            ])
            ->map(
                fn(PlanEstudio $plan): array => [
                    'id' => $plan->id,
                    'nombre' => $plan->nombre,
                    'codigo' => $plan->codigo,
                    'activo' => (bool) $plan->activo,
                ]
            )
            ->values()
            ->all();
    }

    private function semestres(
        bool $soloActivos = false,
        ?int $actualId = null
    ): array {
        return Semestre::query()
            ->when(
                $soloActivos,
                function ($query) use ($actualId): void {
                    $query->where(function ($q) use (
                        $actualId
                    ): void {
                        $q->where('activo', true);

                        if ($actualId) {
                            $q->orWhere(
                                'id',
                                $actualId
                            );
                        }
                    });
                }
            )
            ->orderBy('nombre')
            ->get([
                'id',
                'nombre',
                'activo',
            ])
            ->map(
                fn(Semestre $semestre): array => [
                    'id' => $semestre->id,
                    'nombre' => $semestre->nombre,
                    'activo' =>
                    (bool) $semestre->activo,
                ]
            )
            ->values()
            ->all();
    }

    private function modulos(?int $actualId = null): array
    {
        return ModuloFormativo::query()->with('planEstudio:id,nombre,codigo')
            ->orderBy('id_plan_estudio')
            ->orderBy('num_modulo')
            ->get([
                'id_modulo',
                'id_plan_estudio',
                'nombre',
                'num_modulo',
            ])
            ->map(
                fn(ModuloFormativo $modulo): array => [
                    'id_modulo' =>
                    $modulo->id_modulo,
                    'id_plan_estudio' =>
                    $modulo->id_plan_estudio,
                    'nombre' => $modulo->nombre,
                    'num_modulo' =>
                    $modulo->num_modulo,
                    'plan_estudio' =>
                    $modulo->planEstudio
                        ? [
                            'id' =>
                            $modulo->planEstudio->id,
                            'nombre' =>
                            $modulo->planEstudio->nombre,
                            'codigo' =>
                            $modulo->planEstudio->codigo,
                        ]
                        : null,
                ]
            )
            ->values()
            ->all();
    }

    private function tipos(): array
    {
        return [
            'Especialidad',
            'Transversal',
            'Empleabilidad',
        ];
    }

    private function nullable(mixed $valor): ?string
    {
        $valor = trim((string) $valor);

        return $valor !== '' ? $valor : null;
    }

    public function filtrar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'buscar' => [
                'nullable',
                'string',
                'max:100',
            ],
            'plan_estudio_id' => [
                'nullable',
                'integer',
                'exists:planes_estudio,id',
            ],
            'semestre_id' => [
                'nullable',
                'integer',
                'exists:semestres,id',
            ],
            'id_modulo' => [
                'nullable',
                'integer',
                'exists:modulos_formativos,id_modulo',
            ],
            'tipo' => [
                'nullable',
                'string',
                'max:20',
            ],
            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        $buscar = trim((string) ($datos['buscar'] ?? ''));
        $planEstudioId = $datos['plan_estudio_id'] ?? null;
        $semestreId = $datos['semestre_id'] ?? null;
        $moduloId = $datos['id_modulo'] ?? null;
        $tipo = trim((string) ($datos['tipo'] ?? ''));

        $cursos = Curso::query()
            ->with([
                'planesEstudio:id,nombre,codigo',
                'semestre:id,nombre,activo',
                'moduloFormativo:id_modulo,id_plan_estudio,nombre,num_modulo',
            ])
            ->when(
                $buscar !== '',
                function ($query) use ($buscar): void {
                    $query->where(function ($subquery) use ($buscar): void {
                        $subquery
                            ->where('nombre', 'like', "%{$buscar}%")
                            ->orWhere('descripcion', 'like', "%{$buscar}%")
                            ->orWhere('tipo', 'like', "%{$buscar}%")
                            ->orWhereHas(
                                'planesEstudio',
                                fn($q) => $q
                                    ->where(
                                        'nombre',
                                        'like',
                                        "%{$buscar}%"
                                    )
                                    ->orWhere(
                                        'codigo',
                                        'like',
                                        "%{$buscar}%"
                                    )
                            )
                            ->orWhereHas(
                                'moduloFormativo',
                                fn($q) => $q->where(
                                    'nombre',
                                    'like',
                                    "%{$buscar}%"
                                )
                            );
                    });
                }
            )
            ->when(
                $planEstudioId,
                fn($query) => $query->whereHas(
                    'planesEstudio',
                    fn($q) => $q->where(
                        'planes_estudio.id',
                        $planEstudioId
                    )
                )
            )
            ->when(
                $semestreId,
                fn($query) => $query->where(
                    'semestre_id',
                    $semestreId
                )
            )
            ->when(
                $moduloId,
                fn($query) => $query->where(
                    'id_modulo',
                    $moduloId
                )
            )
            ->when(
                $tipo !== '',
                fn($query) => $query->where(
                    'tipo',
                    $tipo
                )
            )
            ->orderBy('semestre_id')
            ->orderBy('id_modulo')
            ->orderBy('orden')
            ->paginate(
                15,
                ['*'],
                'page',
                (int) ($datos['page'] ?? 1)
            );

        $cursos->getCollection()->transform(
            function (Curso $curso): array {
                return [
                    'id' => $curso->id,
                    'nombre' => $curso->nombre,
                    'descripcion' => $curso->descripcion,
                    'tipo' => $curso->tipo,
                    'creditos' => $curso->creditos,
                    'horas_semestrales' =>
                    $curso->horas_semestrales,
                    'orden' => $curso->orden,

                    'planes_estudio' => $curso
                        ->planesEstudio
                        ->map(
                            fn(PlanEstudio $plan): array => [
                                'id' => $plan->id,
                                'nombre' => $plan->nombre,
                                'codigo' => $plan->codigo,
                            ]
                        )
                        ->values(),

                    'semestre' => $curso->semestre
                        ? [
                            'id' => $curso->semestre->id,
                            'nombre' => $curso->semestre->nombre,
                        ]
                        : null,

                    'modulo' => $curso->moduloFormativo
                        ? [
                            'id_modulo' =>
                            $curso->moduloFormativo->id_modulo,
                            'nombre' =>
                            $curso->moduloFormativo->nombre,
                            'num_modulo' =>
                            $curso->moduloFormativo->num_modulo,
                        ]
                        : null,
                ];
            }
        );

        return response()->json([
            'cursos' => $cursos,
        ]);
    }
}
