<?php

namespace App\Http\Controllers;

use App\Imports\CursoImport;
use App\Models\Curso;
use App\Models\ModuloFormativo;
use App\Models\Semestre;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Throwable;

class CursoController extends Controller
{
    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->input('buscar', ''));
        $semestreId = $request->input('semestre_id');
        $moduloId = $request->input('id_modulo');
        $tipo = trim((string) $request->input('tipo', ''));

        $cursos = Curso::query()
            ->with([
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
                                'moduloFormativo',
                                fn ($q) => $q->where(
                                    'nombre',
                                    'like',
                                    "%{$buscar}%"
                                )
                            );
                    });
                }
            )
            ->when(
                filled($semestreId),
                fn ($query) => $query->where(
                    'semestre_id',
                    $semestreId
                )
            )
            ->when(
                filled($moduloId),
                fn ($query) => $query->where(
                    'id_modulo',
                    $moduloId
                )
            )
            ->when(
                $tipo !== '',
                fn ($query) => $query->where(
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
                fn (Curso $curso): array =>
                    $this->cursoData($curso)
            );

        return Inertia::render('Cursos/Index', [
            'cursos' => $cursos,
            'semestres' => $this->semestres(),
            'modulos' => $this->modulos(),
            'tipos' => $this->tipos(),
            'filtros' => [
                'buscar' => $buscar,
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
            'semestres' => $this->semestres(true),
            'modulos' => $this->modulos(),
            'tipos' => $this->tipos(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        Curso::create($this->payload($datos));

        return to_route('cursos.index')
            ->with(
                'success',
                'Curso registrado correctamente.'
            );
    }

    public function edit(Curso $curso): Response
    {
        $curso->load([
            'semestre:id,nombre,activo',
            'moduloFormativo:id_modulo,id_plan_estudio,nombre,num_modulo',
        ]);

        return Inertia::render('Cursos/Edit', [
            'curso' => $this->cursoData($curso),
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

        $curso->update(
            $this->payload($datos)
        );

        return to_route('cursos.index')
            ->with(
                'success',
                'Curso actualizado correctamente.'
            );
    }

    public function destroy(Curso $curso): RedirectResponse
    {
        try {
            $curso->delete();

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
        ], [
            'archivo.required' =>
                'Debe seleccionar un archivo.',
            'archivo.mimes' =>
                'El archivo debe ser Excel o CSV.',
            'archivo.max' =>
                'El archivo no debe superar los 5 MB.',
        ]);

        try {
            $import = new CursoImport();

            DB::transaction(function () use (
                $request,
                $import
            ): void {
                Excel::import(
                    $import,
                    $request->file('archivo')
                );
            });

            $mensaje = sprintf(
                'Importación finalizada: %d cursos registrados y %d filas omitidas.',
                $import->importados(),
                $import->omitidos()
            );

            return back()
                ->with('success', $mensaje)
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
                'No se pudo procesar el archivo. Revise su estructura y contenido.'
            );
        }
    }

    private function validar(
        Request $request,
        ?Curso $curso = null
    ): array {
        return $request->validate([
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
                'max:10000',
            ],
            'orden' => [
                'required',
                'integer',
                'min:1',
                'max:1000',
                Rule::unique('cursos', 'orden')
                    ->where(
                        fn ($query) => $query
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
        ], [
            'nombre.required' =>
                'El nombre del curso es obligatorio.',
            'semestre_id.required' =>
                'Debe seleccionar un semestre.',
            'semestre_id.exists' =>
                'El semestre seleccionado no existe.',
            'tipo.required' =>
                'Debe seleccionar un tipo.',
            'id_modulo.required' =>
                'Debe seleccionar un módulo formativo.',
            'id_modulo.exists' =>
                'El módulo formativo seleccionado no existe.',
            'creditos.required' =>
                'Los créditos son obligatorios.',
            'creditos.numeric' =>
                'Los créditos deben ser numéricos.',
            'horas_semestrales.required' =>
                'Las horas semestrales son obligatorias.',
            'orden.required' =>
                'El orden es obligatorio.',
            'orden.unique' =>
                'Ese orden ya está asignado dentro del semestre y módulo seleccionados.',
        ]);
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
            'orden' => (int) $datos['orden'],
        ];
    }

    private function cursoData(Curso $curso): array
    {
        return [
            'id' => $curso->id,
            'nombre' => $curso->nombre,
            'descripcion' => $curso->descripcion,
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
                    'activo' =>
                        (bool) $curso->semestre->activo,
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
                    'plan_estudio' =>
                        $curso->moduloFormativo->relationLoaded(
                            'planEstudio'
                        ) && $curso->moduloFormativo->planEstudio
                            ? [
                                'id' =>
                                    $curso->moduloFormativo
                                        ->planEstudio->id,
                                'nombre' =>
                                    $curso->moduloFormativo
                                        ->planEstudio->nombre,
                                'codigo' =>
                                    $curso->moduloFormativo
                                        ->planEstudio->codigo,
                            ]
                            : null,
                ]
                : null,
            'created_at' => $curso->created_at
                ?->format('d/m/Y H:i'),
            'updated_at' => $curso->updated_at
                ?->format('d/m/Y H:i'),
        ];
    }

    private function semestres(
        bool $soloActivos = false,
        ?int $actualId = null
    ): array {
        return Semestre::query()
            ->when(
                $soloActivos,
                function ($query) use ($actualId): void {
                    $query->where(function ($subquery) use (
                        $actualId
                    ): void {
                        $subquery->where('activo', true);

                        if ($actualId) {
                            $subquery->orWhere(
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
                fn (Semestre $semestre): array => [
                    'id' => $semestre->id,
                    'nombre' => $semestre->nombre,
                    'activo' =>
                        (bool) $semestre->activo,
                ]
            )
            ->values()
            ->all();
    }

    private function modulos(
        ?int $actualId = null
    ): array {
        return ModuloFormativo::query()
            ->with(
                'planEstudio:id,nombre,codigo,activo'
            )
            ->whereHas(
                'planEstudio',
                function ($query) use ($actualId): void {
                    $query->where('activo', true);

                    if ($actualId) {
                        $query->orWhereHas(
                            'modulosFormativos',
                            fn ($q) => $q->where(
                                'id_modulo',
                                $actualId
                            )
                        );
                    }
                }
            )
            ->orderBy('id_plan_estudio')
            ->orderBy('num_modulo')
            ->get([
                'id_modulo',
                'id_plan_estudio',
                'nombre',
                'num_modulo',
            ])
            ->map(
                fn (ModuloFormativo $modulo): array => [
                    'id_modulo' => $modulo->id_modulo,
                    'nombre' => $modulo->nombre,
                    'num_modulo' => $modulo->num_modulo,
                    'plan_estudio' => $modulo->planEstudio
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
            'Específico',
            'Transversal',
            'Empleabilidad',
        ];
    }

    private function nullable(mixed $valor): ?string
    {
        $valor = trim((string) $valor);

        return $valor !== '' ? $valor : null;
    }
}
