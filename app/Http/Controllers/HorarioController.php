<?php

namespace App\Http\Controllers;

use App\Models\Aula;
use App\Models\Curso;
use App\Models\Docente;
use App\Models\Horario;
use App\Models\Periodo;
use App\Models\PlanEstudio;
use App\Models\Seccion;
use App\Models\Turno;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Instituto;
use Barryvdh\DomPDF\Facade\Pdf;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class HorarioController extends Controller
{
    /**
     * Muestra el listado inicial de horarios.
     */
    public function index(): Response
    {
        return Inertia::render('Horarios/Index', [
            'horarios' => $this->obtenerHorarios(),

            'docentes' => $this->docentes(),

            'periodos' => $this->periodos(),

            'dias' => $this->dias(),

            'filtros' => [
                'buscar' => '',
                'id_docente' => '',
                'id_curso' => '',
                'id_periodo' => '',
                'dia' => '',
            ],
        ]);
    }

    /**
     * Filtra horarios mediante POST AJAX.
     */
    public function filtrar(
        Request $request
    ): JsonResponse {
        $datos = $request->validate([
            'buscar' => [
                'nullable',
                'string',
                'max:150',
            ],

            'id_docente' => [
                'nullable',
                'integer',
                'exists:docentes,id',
            ],

            'id_curso' => [
                'nullable',
                'integer',
                'exists:cursos,id',
            ],

            'id_periodo' => [
                'nullable',
                'integer',
                'exists:periodos,id',
            ],

            'dia' => [
                'nullable',
                Rule::in($this->dias()),
            ],

            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        $buscar = trim(
            (string) ($datos['buscar'] ?? '')
        );

        $idDocente = filled(
            $datos['id_docente'] ?? null
        )
            ? (int) $datos['id_docente']
            : null;

        $idCurso = filled(
            $datos['id_curso'] ?? null
        )
            ? (int) $datos['id_curso']
            : null;

        $idPeriodo = filled(
            $datos['id_periodo'] ?? null
        )
            ? (int) $datos['id_periodo']
            : null;

        $dia = trim(
            (string) ($datos['dia'] ?? '')
        );

        $pagina = (int) (
            $datos['page'] ?? 1
        );

        /*
         * En el listado, los cursos se obtienen de los
         * horarios registrados para el docente.
         */
        if (
            $idDocente !== null &&
            $idCurso !== null
        ) {
            $cursoDelDocente = Horario::query()
                ->where(
                    'id_docente',
                    $idDocente
                )
                ->where(
                    'id_curso',
                    $idCurso
                )
                ->exists();

            if (! $cursoDelDocente) {
                $idCurso = null;
            }
        }

        return response()->json([
            'horarios' => $this->obtenerHorarios(
                buscar: $buscar,
                idDocente: $idDocente,
                idCurso: $idCurso,
                idPeriodo: $idPeriodo,
                dia: $dia,
                pagina: $pagina
            ),

            'cursos' => $this->cursosDelDocente(
                $idDocente
            ),

            'filtros' => [
                'buscar' => $buscar,
                'id_docente' =>
                $idDocente ?? '',
                'id_curso' =>
                $idCurso ?? '',
                'id_periodo' =>
                $idPeriodo ?? '',
                'dia' => $dia,
            ],
        ]);
    }

    /**
     * Muestra el formulario de registro.
     */
    public function create(): Response
    {
        return Inertia::render(
            'Horarios/Create',
            [
                'docentes' =>
                $this->docentes(),

                'aulas' =>
                $this->aulas(),

                'periodos' =>
                $this->periodos(),

                'planesEstudio' =>
                $this->planesEstudio(),

                'secciones' =>
                $this->secciones(),

                'turnos' =>
                $this->turnos(),

                'dias' =>
                $this->dias(),

                'frecuencias' =>
                $this->frecuencias(),
            ]
        );
    }

    /**
     * Registra uno o varios horarios.
     *
     * Cada elemento de programaciones genera
     * un registro independiente en horarios.
     */
    public function store(
        Request $request
    ): RedirectResponse {
        $datos = $this->validar(
            request: $request
        );

        $this->validarCursoDelPlanEstudio(
            $datos
        );

        DB::transaction(
            function () use ($datos) {
                /*
                 * Registra la relación docente-curso
                 * al momento de crear el horario.
                 */
                $curso = Curso::query()
                    ->findOrFail(
                        $datos['id_curso']
                    );

                $curso->docentes()
                    ->syncWithoutDetaching([
                        $datos['id_docente'],
                    ]);

                /*
                 * Datos comunes para todos
                 * los días seleccionados.
                 */
                $datosComunes = [
                    'id_docente' =>
                    $datos['id_docente'],

                    'id_curso' =>
                    $datos['id_curso'],

                    'id_aula' =>
                    $datos['id_aula']
                        ?? null,

                    'id_periodo' =>
                    $datos['id_periodo'],

                    'frecuencia' =>
                    $datos['frecuencia']
                        ?? null,

                    'capacidad' =>
                    $datos['capacidad']
                        ?? null,

                    'id_plan_estudio' =>
                    $datos['id_plan_estudio'],

                    'id_seccion' =>
                    $datos['id_seccion']
                        ?? null,

                    'moodle_group_id' =>
                    $datos['moodle_group_id'] ?? null,

                    'id_turno' =>
                    $datos['id_turno']
                        ?? null,
                ];

                /*
                 * Completa tipo, número y capacidad
                 * desde el aula seleccionada.
                 */
                $datosComunes =
                    $this->completarDatosDelAula(
                        $datosComunes
                    );

                foreach (
                    $datos['programaciones']
                    as $programacion
                ) {
                    Horario::create([
                        ...$datosComunes,

                        'dia' =>
                        $programacion['dia'],

                        'hora_inicio' =>
                        $programacion['hora_inicio'],

                        'hora_fin' =>
                        $programacion['hora_fin'],
                    ]);
                }
            }
        );

        $cantidad = count(
            $datos['programaciones']
        );

        $mensaje = $cantidad === 1
            ? 'Horario registrado correctamente.'
            : "{$cantidad} horarios registrados correctamente.";

        return to_route(
            'horarios.index'
        )->with(
            'success',
            $mensaje
        );
    }

    /**
     * Muestra el formulario de edición.
     *
     * Cada registro de horarios representa
     * un solo día y rango de horas.
     */
    public function edit(
        Horario $horario
    ): Response {
        $horario->load([
            'docente',
            'curso',
            'aula',
            'periodo',
            'planEstudio',
            'seccion',
            'turno',
        ]);

        return Inertia::render(
            'Horarios/Edit',
            [
                'horario' => [
                    'id' =>
                    $horario->id,

                    'id_docente' =>
                    $horario->id_docente,

                    'id_curso' =>
                    $horario->id_curso,

                    'id_aula' =>
                    $horario->id_aula,

                    'id_periodo' =>
                    $horario->id_periodo,

                    'frecuencia' =>
                    $horario->frecuencia,

                    'capacidad' =>
                    $horario->capacidad,

                    'id_plan_estudio' =>
                    $horario
                        ->id_plan_estudio,

                    'id_seccion' =>
                    $horario->id_seccion,

                    'moodle_group_id' =>
                    $horario
                        ->moodle_group_id,

                    'id_turno' =>
                    $horario->id_turno,

                    'programaciones' => [
                        [
                            'dia' =>
                            $horario->dia,

                            'hora_inicio' =>
                            $this->formatearHora(
                                $horario
                                    ->getRawOriginal(
                                        'hora_inicio'
                                    )
                            ),

                            'hora_fin' =>
                            $this->formatearHora(
                                $horario
                                    ->getRawOriginal(
                                        'hora_fin'
                                    )
                            ),
                        ],
                    ],
                ],

                'docentes' =>
                $this->docentes(),

                /*
                 * En edición se cargan los cursos
                 * del plan de estudio guardado.
                 */
                'cursosIniciales' =>
                $this->cursosDelPlanEstudio(
                    $horario
                        ->id_plan_estudio
                ),

                'aulas' =>
                $this->aulas(),

                'periodos' =>
                $this->periodos(),

                'planesEstudio' =>
                $this->planesEstudio(),

                'secciones' =>
                $this->secciones(),

                'turnos' =>
                $this->turnos(),

                'dias' =>
                $this->dias(),

                'frecuencias' =>
                $this->frecuencias(),
            ]
        );
    }

    /**
     * Actualiza un registro de horario.
     *
     * El formulario de edición debe enviar
     * una sola programación.
     */
    public function update(
        Request $request,
        Horario $horario
    ): RedirectResponse {
        $datos = $this->validar(
            request: $request,
            horario: $horario,
            esEdicion: true
        );

        $this->validarCursoDelPlanEstudio(
            $datos
        );

        $programacion =
            $datos['programaciones'][0];

        DB::transaction(
            function () use (
                $datos,
                $programacion,
                $horario
            ) {
                $curso = Curso::query()
                    ->findOrFail(
                        $datos['id_curso']
                    );

                $curso->docentes()
                    ->syncWithoutDetaching([
                        $datos['id_docente'],
                    ]);

                $datosHorario = [
                    'id_docente' =>
                    $datos['id_docente'],

                    'id_curso' =>
                    $datos['id_curso'],

                    'id_aula' =>
                    $datos['id_aula']
                        ?? null,

                    'id_periodo' =>
                    $datos['id_periodo'],

                    'frecuencia' =>
                    $datos['frecuencia']
                        ?? null,

                    'capacidad' =>
                    $datos['capacidad']
                        ?? null,

                    'id_plan_estudio' =>
                    $datos['id_plan_estudio'],

                    'id_seccion' =>
                    $datos['id_seccion']
                        ?? null,

                    'moodle_group_id' =>
                    $datos['moodle_group_id'] ?? null,

                    'id_turno' =>
                    $datos['id_turno']
                        ?? null,

                    'dia' =>
                    $programacion['dia'],

                    'hora_inicio' =>
                    $programacion['hora_inicio'],

                    'hora_fin' =>
                    $programacion['hora_fin'],
                ];

                $datosHorario =
                    $this->completarDatosDelAula(
                        $datosHorario
                    );

                $horario->update(
                    $datosHorario
                );
            }
        );

        return to_route(
            'horarios.index'
        )->with(
            'success',
            'Horario actualizado correctamente.'
        );
    }

    /**
     * Elimina un horario.
     */
    public function destroy(
        Horario $horario
    ): RedirectResponse {
        $horario->delete();

        return back()->with(
            'success',
            'Horario eliminado correctamente.'
        );
    }

    /**
     * Retorna los cursos que pertenecen
     * al plan de estudio seleccionado.
     */
    public function cursosPorPlanEstudio(
        PlanEstudio $planEstudio
    ): JsonResponse {
        return response()->json([
            'cursos' =>
            $this->cursosDelPlanEstudio(
                $planEstudio->id
            ),
        ]);
    }

    /**
     * Consulta reutilizable del listado.
     */
    private function obtenerHorarios(
        string $buscar = '',
        ?int $idDocente = null,
        ?int $idCurso = null,
        ?int $idPeriodo = null,
        string $dia = '',
        int $pagina = 1
    ) {
        return Horario::query()
            ->with([
                'docente:id,nombre,apellido',
                'curso:id,nombre',
                'aula:id,nombre,numero_aula,id_pabellon,tipo,capacidad',
                'aula.pabellon:id,nombre',
                'periodo:id,nombre',
                'planEstudio:id,nombre',
                'seccion:id,nombre',
                'turno:id,nombre,hora_inicio,hora_fin',
            ])

            ->when(
                $buscar !== '',
                function (
                    $query
                ) use ($buscar) {
                    $query->where(
                        function (
                            $subquery
                        ) use ($buscar) {
                            $subquery
                                ->where(
                                    'dia',
                                    'like',
                                    "%{$buscar}%"
                                )

                                ->orWhere(
                                    'tipo_aula',
                                    'like',
                                    "%{$buscar}%"
                                )

                                ->orWhere(
                                    'numero_aula',
                                    'like',
                                    "%{$buscar}%"
                                )

                                ->orWhereHas(
                                    'docente',
                                    function (
                                        $docenteQuery
                                    ) use ($buscar) {
                                        $docenteQuery
                                            ->where(
                                                'nombre',
                                                'like',
                                                "%{$buscar}%"
                                            )

                                            ->orWhere(
                                                'apellido',
                                                'like',
                                                "%{$buscar}%"
                                            );
                                    }
                                )

                                ->orWhereHas(
                                    'curso',
                                    fn(
                                        $cursoQuery
                                    ) =>
                                    $cursoQuery
                                        ->where(
                                            'nombre',
                                            'like',
                                            "%{$buscar}%"
                                        )
                                )

                                ->orWhereHas(
                                    'aula',
                                    function (
                                        $aulaQuery
                                    ) use ($buscar) {
                                        $aulaQuery
                                            ->where(
                                                'nombre',
                                                'like',
                                                "%{$buscar}%"
                                            )

                                            ->orWhere(
                                                'numero_aula',
                                                'like',
                                                "%{$buscar}%"
                                            );
                                    }
                                )

                                ->orWhereHas(
                                    'seccion',
                                    fn(
                                        $seccionQuery
                                    ) =>
                                    $seccionQuery
                                        ->where(
                                            'nombre',
                                            'like',
                                            "%{$buscar}%"
                                        )
                                )

                                ->orWhereHas(
                                    'turno',
                                    fn(
                                        $turnoQuery
                                    ) =>
                                    $turnoQuery
                                        ->where(
                                            'nombre',
                                            'like',
                                            "%{$buscar}%"
                                        )
                                );
                        }
                    );
                }
            )

            ->when(
                $idDocente !== null,
                fn($query) =>
                $query->where(
                    'id_docente',
                    $idDocente
                )
            )

            ->when(
                $idCurso !== null,
                fn($query) =>
                $query->where(
                    'id_curso',
                    $idCurso
                )
            )

            ->when(
                $idPeriodo !== null,
                fn($query) =>
                $query->where(
                    'id_periodo',
                    $idPeriodo
                )
            )

            ->when(
                $dia !== '',
                fn($query) =>
                $query->where(
                    'dia',
                    $dia
                )
            )

            ->orderByRaw(
                "FIELD(
                    dia,
                    'Lunes',
                    'Martes',
                    'Miércoles',
                    'Jueves',
                    'Viernes',
                    'Sábado',
                    'Domingo'
                )"
            )

            ->orderBy('hora_inicio')

            ->paginate(
                perPage: 15,
                columns: ['*'],
                pageName: 'page',
                page: $pagina
            );
    }

    /**
     * Valida el formulario de horarios.
     */
    private function validar(
        Request $request,
        ?Horario $horario = null,
        bool $esEdicion = false
    ): array {
        $datos = $request->validate(
            [
                'id_periodo' => [
                    'required',
                    'integer',
                    'exists:periodos,id',
                ],

                'id_plan_estudio' => [
                    'required',
                    'integer',
                    'exists:planes_estudio,id',
                ],

                'id_docente' => [
                    'required',
                    'integer',
                    'exists:docentes,id',
                ],

                'id_curso' => [
                    'required',
                    'integer',
                    'exists:cursos,id',
                ],

                'id_seccion' => [
                    'nullable',
                    'integer',
                    'exists:secciones,id',
                ],

                'id_turno' => [
                    'nullable',
                    'integer',
                    'exists:turnos,id',
                ],

                'id_aula' => [
                    'nullable',
                    'integer',
                    'exists:aulas,id',
                ],

                'frecuencia' => [
                    'nullable',
                    Rule::in(
                        $this->frecuencias()
                    ),
                ],

                'capacidad' => [
                    'nullable',
                    'integer',
                    'min:0',
                    'max:10000',
                ],

                'moodle_group_id' => [
                    'nullable',
                    'integer',
                    'min:1',
                ],

                'programaciones' => [
                    'required',
                    'array',
                    'min:1',

                    $esEdicion
                        ? 'max:1'
                        : 'max:7',
                ],

                'programaciones.*.dia' => [
                    'required',

                    Rule::in(
                        $this->dias()
                    ),

                    'distinct',
                ],

                'programaciones.*.hora_inicio' => [
                    'required',
                    'date_format:H:i',
                ],

                'programaciones.*.hora_fin' => [
                    'required',
                    'date_format:H:i',
                ],
            ],

            [
                'id_periodo.required' =>
                'Debe seleccionar un periodo académico.',

                'id_plan_estudio.required' =>
                'Debe seleccionar un plan de estudio.',

                'id_docente.required' =>
                'Debe seleccionar un docente.',

                'id_curso.required' =>
                'Debe seleccionar un curso.',

                'programaciones.required' =>
                'Debe agregar al menos un día de programación.',

                'programaciones.array' =>
                'La programación enviada no es válida.',

                'programaciones.min' =>
                'Debe agregar al menos un día de programación.',

                'programaciones.max' =>
                $esEdicion
                    ? 'En edición solo puede modificar un horario.'
                    : 'No puede registrar más de siete días.',

                'programaciones.*.dia.required' =>
                'Debe seleccionar el día.',

                'programaciones.*.dia.in' =>
                'El día seleccionado no es válido.',

                'programaciones.*.dia.distinct' =>
                'No puede registrar dos veces el mismo día.',

                'programaciones.*.hora_inicio.required' =>
                'Debe indicar la hora de inicio.',

                'programaciones.*.hora_inicio.date_format' =>
                'La hora de inicio no tiene un formato válido.',

                'programaciones.*.hora_fin.required' =>
                'Debe indicar la hora de fin.',

                'programaciones.*.hora_fin.date_format' =>
                'La hora de fin no tiene un formato válido.',
            ]
        );

        foreach (
            $datos['programaciones']
            as $indice => $programacion
        ) {
            if (
                $programacion['hora_fin'] <=
                $programacion['hora_inicio']
            ) {
                throw ValidationException::withMessages([
                    "programaciones.{$indice}.hora_fin" =>
                    'La hora de fin debe ser posterior a la hora de inicio.',
                ]);
            }

            $datosHorario = [
                'id_docente' =>
                $datos['id_docente'],

                'id_curso' =>
                $datos['id_curso'],

                'id_aula' =>
                $datos['id_aula']
                    ?? null,

                'id_periodo' =>
                $datos['id_periodo'],

                'id_plan_estudio' =>
                $datos['id_plan_estudio'],

                'id_seccion' =>
                $datos['id_seccion']
                    ?? null,

                'id_turno' =>
                $datos['id_turno']
                    ?? null,

                'dia' =>
                $programacion['dia'],

                'hora_inicio' =>
                $programacion['hora_inicio'],

                'hora_fin' =>
                $programacion['hora_fin'],
            ];

            $this->validarCruceDocente(
                datos: $datosHorario,
                indice: $indice,
                horario: $horario
            );

            $this->validarCruceAula(
                datos: $datosHorario,
                indice: $indice,
                horario: $horario
            );

            $this->validarHorarioDentroDelTurno(
                datos: $datosHorario,
                indice: $indice
            );
        }

        return $datos;
    }

    /**
     * Valida que el curso pertenezca
     * al plan de estudio seleccionado.
     */
    private function validarCursoDelPlanEstudio(
        array $datos
    ): void {
        $cursoPerteneceAlPlan =
            DB::table(
                'cursos_plan_estudio'
            )
            ->where(
                'plan_estudio_id',
                $datos['id_plan_estudio']
            )
            ->where(
                'curso_id',
                $datos['id_curso']
            )
            ->exists();

        if (! $cursoPerteneceAlPlan) {
            throw ValidationException::withMessages([
                'id_curso' =>
                'El curso seleccionado no pertenece al plan de estudio.',
            ]);
        }
    }

    /**
     * Evita cruces de horario para el docente.
     */
    private function validarCruceDocente(
        array $datos,
        int $indice,
        ?Horario $horario = null
    ): void {
        $existeCruce = Horario::query()
            ->where(
                'id_docente',
                $datos['id_docente']
            )

            ->where(
                'dia',
                $datos['dia']
            )

            ->where(
                'id_periodo',
                $datos['id_periodo']
            )

            ->when(
                $horario !== null,
                fn($query) =>
                $query->where(
                    'id',
                    '<>',
                    $horario->id
                )
            )

            ->where(
                'hora_inicio',
                '<',
                $datos['hora_fin']
            )

            ->where(
                'hora_fin',
                '>',
                $datos['hora_inicio']
            )

            ->exists();

        if ($existeCruce) {
            throw ValidationException::withMessages([
                "programaciones.{$indice}.hora_inicio" =>
                "El docente ya tiene otro horario el {$datos['dia']} dentro de ese rango de horas.",
            ]);
        }
    }

    /**
     * Evita cruces de horario para el aula.
     */
    private function validarCruceAula(
        array $datos,
        int $indice,
        ?Horario $horario = null
    ): void {
        if (empty($datos['id_aula'])) {
            return;
        }

        $existeCruce = Horario::query()
            ->where(
                'id_aula',
                $datos['id_aula']
            )

            ->where(
                'dia',
                $datos['dia']
            )

            ->where(
                'id_periodo',
                $datos['id_periodo']
            )

            ->when(
                $horario !== null,
                fn($query) =>
                $query->where(
                    'id',
                    '<>',
                    $horario->id
                )
            )

            ->where(
                'hora_inicio',
                '<',
                $datos['hora_fin']
            )

            ->where(
                'hora_fin',
                '>',
                $datos['hora_inicio']
            )

            ->exists();

        if ($existeCruce) {
            throw ValidationException::withMessages([
                "programaciones.{$indice}.hora_inicio" =>
                "El aula ya está ocupada el {$datos['dia']} dentro de ese rango de horas.",
            ]);
        }
    }

    /**
     * Verifica que cada horario se encuentre
     * dentro del rango del turno seleccionado.
     */
    private function validarHorarioDentroDelTurno(
        array $datos,
        int $indice
    ): void {
        if (empty($datos['id_turno'])) {
            return;
        }

        $turno = Turno::query()
            ->find(
                $datos['id_turno']
            );

        if (! $turno) {
            return;
        }

        $inicioTurno = $this->formatearHora(
            $turno->getRawOriginal(
                'hora_inicio'
            )
        );

        $finTurno = $this->formatearHora(
            $turno->getRawOriginal(
                'hora_fin'
            )
        );

        if (
            $datos['hora_inicio'] <
            $inicioTurno ||
            $datos['hora_fin'] >
            $finTurno
        ) {
            throw ValidationException::withMessages([
                "programaciones.{$indice}.hora_inicio" =>
                "El horario del {$datos['dia']} debe encontrarse dentro del turno {$turno->nombre}, de {$inicioTurno} a {$finTurno}.",
            ]);
        }
    }

    /**
     * Completa los datos redundantes del aula.
     */
    private function completarDatosDelAula(
        array $datos
    ): array {
        if (empty($datos['id_aula'])) {
            $datos['tipo_aula'] = null;
            $datos['numero_aula'] = null;

            if (
                ! array_key_exists(
                    'capacidad',
                    $datos
                )
            ) {
                $datos['capacidad'] = null;
            }

            return $datos;
        }

        $aula = Aula::query()
            ->findOrFail(
                $datos['id_aula']
            );

        $datos['tipo_aula'] =
            $aula->tipo;

        $datos['numero_aula'] =
            $aula->numero_aula;

        $datos['capacidad'] =
            $aula->capacidad;

        return $datos;
    }

    /**
     * Cursos pertenecientes a un plan.
     */
    private function cursosDelPlanEstudio(
        ?int $idPlanEstudio
    ) {
        if ($idPlanEstudio === null) {
            return collect();
        }

        $planEstudio =
            PlanEstudio::query()
            ->find($idPlanEstudio);

        if (! $planEstudio) {
            return collect();
        }

        return $planEstudio
            ->cursos()

            ->with([
                'semestre:id,nombre',

                'moduloFormativo:id_modulo,nombre',
            ])

            ->orderBy(
                'cursos.orden'
            )

            ->orderBy(
                'cursos.nombre'
            )

            ->get([
                'cursos.id',
                'cursos.nombre',
                'cursos.tipo',
                'cursos.semestre_id',
                'cursos.id_modulo',
                'cursos.orden',
            ]);
    }

    /**
     * Cursos registrados para un docente.
     *
     * Se utiliza únicamente en los filtros
     * del listado de horarios.
     */
    private function cursosDelDocente(
        ?int $idDocente
    ) {
        if ($idDocente === null) {
            return collect();
        }

        return Curso::query()
            ->whereHas(
                'horarios',
                fn($query) =>
                $query->where(
                    'id_docente',
                    $idDocente
                )
            )

            ->orderBy('nombre')

            ->get([
                'id',
                'nombre',
            ]);
    }

    /**
     * Lista de docentes.
     */
    private function docentes()
    {
        return Docente::query()
            ->orderBy('apellido')
            ->orderBy('nombre')
            ->get([
                'id',
                'nombre',
                'apellido',
            ]);
    }

    /**
     * Lista de aulas.
     */
    private function aulas()
    {
        return Aula::query()
            ->with([
                'pabellon:id,nombre',
            ])

            ->orderBy('nombre')

            ->get([
                'id',
                'nombre',
                'numero_aula',
                'capacidad',
                'id_pabellon',
                'tipo',
            ]);
    }

    /**
     * Lista de periodos.
     */
    private function periodos()
    {
        return Periodo::query()
            ->orderByDesc('id')
            ->get();
    }

    /**
     * Lista de planes de estudio activos.
     */
    private function planesEstudio()
    {
        return PlanEstudio::query()
            ->where('activo', 1)

            ->orderBy('nombre')

            ->get([
                'id',
                'nombre',
                'codigo',
            ]);
    }

    /**
     * Lista de secciones.
     */
    private function secciones()
    {
        return Seccion::query()
            ->orderBy('nombre')

            ->get([
                'id',
                'nombre',
            ]);
    }

    /**
     * Lista de turnos.
     */
    private function turnos()
    {
        return Turno::query()
            ->orderBy('hora_inicio')

            ->get([
                'id',
                'nombre',
                'hora_inicio',
                'hora_fin',
            ]);
    }

    /**
     * Días permitidos.
     */
    private function dias(): array
    {
        return [
            'Lunes',
            'Martes',
            'Miércoles',
            'Jueves',
            'Viernes',
            'Sábado',
            'Domingo',
        ];
    }

    /**
     * Frecuencias permitidas.
     */
    private function frecuencias(): array
    {
        return [
            'Semanal',
            'Quincenal',
            'Mensual',
        ];
    }

    /**
     * Convierte HH:mm:ss a HH:mm.
     */
    private function formatearHora(
        ?string $hora
    ): string {
        if (
            $hora === null ||
            $hora === ''
        ) {
            return '';
        }

        return substr(
            $hora,
            0,
            5
        );
    }
    public function pdfPorDocente(Request $request, Docente $docente): HttpResponse
    {
        $datos = $request->validate([
            'id_periodo' => [
                'nullable',
                'integer',
                'exists:periodos,id',
            ],
        ]);

        $idPeriodo = filled(
            $datos['id_periodo'] ?? null
        )
            ? (int) $datos['id_periodo']
            : null;

        $instituto = Instituto::query()
            ->with([
                'distrito',
            ])
            ->first();

        $horarios = Horario::query()
            ->with([
                'curso:id,nombre',
                'aula:id,nombre,numero_aula,id_pabellon,tipo,capacidad',
                'aula.pabellon:id,nombre',
                'periodo',
                'planEstudio:id,nombre,codigo',
                'seccion:id,nombre',
                'turno:id,nombre,hora_inicio,hora_fin',
            ])
            ->where(
                'id_docente',
                $docente->id
            )
            ->when(
                $idPeriodo !== null,
                fn($query) => $query->where(
                    'id_periodo',
                    $idPeriodo
                )
            )
            ->orderByRaw(
                "FIELD(
                dia,
                'Lunes',
                'Martes',
                'Miércoles',
                'Jueves',
                'Viernes',
                'Sábado',
                'Domingo'
            )"
            )
            ->orderBy('hora_inicio')
            ->get();

        $periodo = $idPeriodo !== null
            ? Periodo::query()->find($idPeriodo)
            : null;

        /*
     * Construye la matriz de horario
     * en bloques pedagógicos de 45 minutos.
     */
        $matrizHorario = $this->construirMatrizHorario(
            horarios: $horarios,
            duracionBloque: 45
        );

        $logoPath = $this->obtenerLogoInstitutoBase64(
            $instituto?->logo
        );

        $pdf = Pdf::loadView(
            'pdf.horarios.docente',
            [
                'instituto' => $instituto,
                'docente' => $docente,
                'periodo' => $periodo,
                'horarios' => $horarios,
                'diasHorario' => $matrizHorario['dias'],
                'franjasHorario' => $matrizHorario['franjas'],
                'logoPath' => $logoPath,
                'fechaEmision' => now(),
            ]
        )
            ->setPaper(
                'a4',
                'landscape'
            )
            ->setOptions([
                'isRemoteEnabled' => true,
                'isHtml5ParserEnabled' => true,
                'defaultFont' => 'DejaVu Sans',
            ]);

        $nombreDocente = trim(
            "{$docente->nombre} {$docente->apellido}"
        );

        $nombreArchivo = 'horario-' .
            str($nombreDocente)
            ->slug('-')
            ->toString() .
            '.pdf';

        return $pdf->stream(
            $nombreArchivo
        );
    }

    private function construirMatrizHorario(
        Collection $horarios,
        int $duracionBloque = 45
    ): array {
        $ordenDias = [
            'Lunes',
            'Martes',
            'Miércoles',
            'Jueves',
            'Viernes',
            'Sábado',
            'Domingo',
        ];

        if ($horarios->isEmpty()) {
            return [
                'dias' => array_slice(
                    $ordenDias,
                    0,
                    5
                ),
                'franjas' => [],
            ];
        }

        /*
        * Solo muestra los días que tienen horarios.
        */
        $diasConHorario = $horarios
            ->pluck('dia')
            ->filter()
            ->unique()
            ->values()
            ->all();

        $dias = collect($ordenDias)
            ->filter(
                fn (string $dia) =>
                    in_array(
                        $dia,
                        $diasConHorario,
                        true
                    )
            )
            ->values()
            ->all();

        /*
        * Obtiene la primera hora y la última hora
        * registradas para construir las franjas.
        */
        $horaInicioGeneral = $horarios
            ->map(
                fn (Horario $horario) =>
                    substr(
                        (string) $horario->getRawOriginal(
                            'hora_inicio'
                        ),
                        0,
                        5
                    )
            )
            ->filter()
            ->sort()
            ->first();

        $horaFinGeneral = $horarios
            ->map(
                fn (Horario $horario) =>
                    substr(
                        (string) $horario->getRawOriginal(
                            'hora_fin'
                        ),
                        0,
                        5
                    )
            )
            ->filter()
            ->sortDesc()
            ->first();

        if (
            blank($horaInicioGeneral) ||
            blank($horaFinGeneral)
        ) {
            return [
                'dias' => $dias,
                'franjas' => [],
            ];
        }

        $inicioGeneral = Carbon::createFromFormat(
            'H:i',
            $horaInicioGeneral
        );

        $finGeneral = Carbon::createFromFormat(
            'H:i',
            $horaFinGeneral
        );

        $franjas = [];

        $inicioBloque = $inicioGeneral->copy();

        while ($inicioBloque->lt($finGeneral)) {
            $finBloque = $inicioBloque
                ->copy()
                ->addMinutes($duracionBloque);

            /*
            * Si el último bloque supera la hora final,
            * termina exactamente en la hora registrada.
            */
            if ($finBloque->gt($finGeneral)) {
                $finBloque = $finGeneral->copy();
            }

            $fila = [
                'hora_inicio' =>
                    $inicioBloque->format('H:i'),

                'hora_fin' =>
                    $finBloque->format('H:i'),

                'horario' =>
                    $inicioBloque->format('H:i') .
                    ' - ' .
                    $finBloque->format('H:i'),

                'dias' => [],
            ];

            foreach ($dias as $dia) {
                $horarioEncontrado = $horarios
                    ->first(
                        function (
                            Horario $horario
                        ) use (
                            $dia,
                            $inicioBloque,
                            $finBloque
                        ) {
                            if ($horario->dia !== $dia) {
                                return false;
                            }

                            $inicioHorario =
                                Carbon::createFromFormat(
                                    'H:i',
                                    substr(
                                        (string) $horario
                                            ->getRawOriginal(
                                                'hora_inicio'
                                            ),
                                        0,
                                        5
                                    )
                                );

                            $finHorario =
                                Carbon::createFromFormat(
                                    'H:i',
                                    substr(
                                        (string) $horario
                                            ->getRawOriginal(
                                                'hora_fin'
                                            ),
                                        0,
                                        5
                                    )
                                );

                            /*
                            * Existe contenido cuando el bloque
                            * se superpone con el rango registrado.
                            */
                            return $inicioHorario->lt(
                                $finBloque
                            ) &&
                                $finHorario->gt(
                                    $inicioBloque
                                );
                        }
                    );

                $fila['dias'][$dia] =
                    $horarioEncontrado;
            }

            $franjas[] = $fila;

            $inicioBloque = $finBloque->copy();
        }

        return [
            'dias' => $dias,
            'franjas' => $franjas,
        ];
    }

    /**
     * Obtiene la ruta física del logo institucional.
     */
    private function obtenerLogoInstitutoBase64(
        ?string $logo
    ): ?string {
        if (blank($logo)) {
            return null;
        }

        $logo = ltrim(
            str_replace('\\', '/', $logo),
            '/'
        );

        $disco = Storage::disk('public');

        if (! $disco->exists($logo)) {
            return null;
        }

        $contenido = $disco->get($logo);

        if ($contenido === '') {
            return null;
        }

        $extension = strtolower(
            pathinfo(
                $logo,
                PATHINFO_EXTENSION
            )
        );

        $mime = match ($extension) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            'svg' => 'image/svg+xml',
            default => 'application/octet-stream',
        };

        return 'data:' .
            $mime .
            ';base64,' .
            base64_encode($contenido);
    }
}
