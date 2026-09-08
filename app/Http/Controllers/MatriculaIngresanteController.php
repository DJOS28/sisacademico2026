<?php

namespace App\Http\Controllers;

use App\Models\Admision;
use App\Models\Horario;
use App\Models\Matricula;
use App\Models\Periodo;
use App\Models\PlanEstudio;
use App\Models\Postulante;
use App\Models\ResultadoAdmision;
use App\Models\Seccion;
use App\Models\Semestre;
use App\Models\Turno;
use App\Models\Usuario;
use App\Services\AuditoriaService;
use App\Services\MoodleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class MatriculaIngresanteController extends Controller
{
    protected MoodleService $moodleService;

    public function __construct(MoodleService $moodleService)
    {
        $this->moodleService = $moodleService;
    }

    /**
     * Muestra la vista base de la matrícula masiva de ingresantes.
     */
    public function index(): Response
    {
        $primerSemestre = Semestre::orderBy('id', 'asc')->first();

        return Inertia::render('Matriculas/MatriculaIngresantes', [
            'admisiones'     => Admision::query()->where('activo', 1)->select('id_admision', 'nombre')->orderByDesc('id_admision')->get(),
            'periodos'       => Periodo::query()->where('activo', 1)->select('id', 'nombre')->get(),
            'planesEstudio'  => PlanEstudio::query()->select('id', 'nombre', 'codigo')->orderBy('nombre')->get(),
            'turnos'         => Turno::query()->select('id', 'nombre')->get(),
            'primerSemestre' => $primerSemestre,
        ]);
    }

    /**
     * Endpoint AJAX: Devuelve ingresantes y secciones disponibles para el I Semestre.
     */
    public function obtenerDatosAjax(Request $request): JsonResponse
    {
        $idProceso = $request->input('id_proceso');
        $idPeriodo = $request->input('periodo_id');
        $idPlan    = $request->input('plan_estudio_id');

        if (!$idProceso || !$idPlan || !$idPeriodo) {
            return response()->json([
                'ingresantes' => [],
                'secciones'   => [],
            ]);
        }

        $primerSemestre = Semestre::orderBy('id', 'asc')->first();
        $semestreId = $primerSemestre ? $primerSemestre->id : 1;

        // 1. Obtener postulantes con vacante cargando la relación del usuario
        $resultados = ResultadoAdmision::query()
            ->where('id_proceso', $idProceso)
            ->where('plan_estudio_id', $idPlan)
            ->where('estado', 'con_vacante')
            ->with([
                'postulante' => function ($q) {
                    $q->select('id_postulante', 'codigo_postulante', 'nombres', 'apellidos', 'dni', 'email', 'telefono', 'usuario_id')
                      ->with('usuario:id,username,moodle_user_id');
                },
                'planEstudio:id,nombre,codigo',
            ])
            ->get();

        $ingresantes = [];
        foreach ($resultados as $res) {
            $p = $res->postulante;
            if (!$p) continue;

            $yaMatriculado = Matricula::where('postulante_id', $p->id_postulante)
                ->where('periodo_id', $idPeriodo)
                ->exists();

            // Verificar usuario vinculado o por DNI
            $usuario = $p->usuario;
            if (!$usuario && !empty($p->dni)) {
                $usuario = Usuario::where('username', $p->dni)->select('id', 'username', 'moodle_user_id')->first();
            }

            $tieneUsuario = !is_null($usuario);
            $tieneMoodle  = !empty($usuario?->moodle_user_id);

            $ingresantes[] = [
                'id_resultado'      => $res->id,
                'postulante_id'     => $p->id_postulante,
                'codigo_postulante' => $p->codigo_postulante,
                'nombres'           => $p->nombres,
                'apellidos'         => $p->apellidos,
                'dni'               => $p->dni,
                'email'             => $p->email,
                'plan_estudio_id'   => $res->plan_estudio_id,
                'plan_nombre'       => $res->planEstudio?->nombre,
                'nota'              => $res->nota,
                'ya_matriculado'    => $yaMatriculado,
                'tiene_usuario'     => $tieneUsuario,
                'tiene_moodle'      => $tieneMoodle,
            ];
        }

        // 2. Obtener secciones con oferta horaria real en el 1er Semestre
        $seccionIds = Horario::query()
            ->where('id_periodo', $idPeriodo)
            ->whereHas('curso', function ($q) use ($semestreId, $idPlan) {
                $q->where('semestre_id', $semestreId)
                  ->whereHas('planesEstudio', fn ($p) => $p->where('plan_estudio_id', $idPlan));
            })
            ->whereNotNull('id_seccion')
            ->pluck('id_seccion')
            ->unique()
            ->toArray();

        $seccionesDisponibles = Seccion::query()
            ->whereIn('id', $seccionIds)
            ->select('id', 'nombre')
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'ingresantes' => $ingresantes,
            'secciones'   => $seccionesDisponibles,
        ]);
    }

    /**
     * Procesa la matrícula masiva de ingresantes y sincroniza en lote con Moodle.
     */
    public function store(Request $request): RedirectResponse
    {
        set_time_limit(300);

        $datos = $request->validate([
            'id_proceso'        => ['required', 'integer', 'exists:admisiones,id_admision'],
            'periodo_id'        => ['required', 'integer', 'exists:periodos,id'],
            'plan_estudio_id'   => ['required', 'integer', 'exists:planes_estudio,id'],
            'semestre_id'       => ['required', 'integer', 'exists:semestres,id'],
            'seccion_id'        => ['required', 'integer', 'exists:secciones,id'],
            'turno_id'          => ['nullable', 'integer', 'exists:turnos,id'],
            'postulantes_ids'   => ['required', 'array', 'min:1'],
            'postulantes_ids.*' => ['required', 'integer', 'exists:postulantes,id_postulante'],
        ], [
            'id_proceso.required'      => 'Seleccione el proceso de admisión.',
            'periodo_id.required'      => 'Seleccione el periodo lectivo activo.',
            'plan_estudio_id.required' => 'Seleccione el plan de estudios.',
            'seccion_id.required'      => 'Seleccione la sección asignada.',
            'postulantes_ids.required' => 'Seleccione al menos un ingresante a matricular.',
        ]);

        try {
            // 1. Cargar la oferta horaria del 1er ciclo con relaciones de Moodle
            $horariosPrimerCiclo = Horario::with(['curso', 'seccion'])
                ->where('id_periodo', $datos['periodo_id'])
                ->where('id_seccion', $datos['seccion_id'])
                ->when($datos['turno_id'] ?? null, fn ($q, $tId) => $q->where('id_turno', $tId))
                ->whereHas('curso', function ($q) use ($datos) {
                    $q->where('semestre_id', $datos['semestre_id'])
                      ->whereHas('planesEstudio', fn ($p) => $p->where('plan_estudio_id', $datos['plan_estudio_id']));
                })
                ->get();

            if ($horariosPrimerCiclo->isEmpty()) {
                throw new \Exception("La sección seleccionada no posee horarios programados en el 1er Semestre para este Plan de Estudios.");
            }

            // 2. Obtener los postulantes seleccionados con su usuario vinculado
            $postulantes = Postulante::with('usuario')
                ->whereIn('id_postulante', $datos['postulantes_ids'])
                ->get();

            // =========================================================================
            // FASE 1: RESOLUCIÓN Y AUTO-CREACIÓN MASIVA DE USUARIOS EN MOODLE
            // =========================================================================
            $usuariosMoodleParaCrear = [];
            $moodleUserIdsMap = []; // Almacena [dni_lower => moodle_user_id]

            foreach ($postulantes as $p) {
                $dni = trim((string) ($p->dni ?? ''));
                if (empty($dni)) continue;

                $dniKey = mb_strtolower($dni);
                $usuario = $p->usuario;

                if (!$usuario) {
                    $usuario = Usuario::where('username', $dni)->first();
                }

                // Si ya existe moodle_user_id en la tabla usuarios
                if ($usuario && !empty($usuario->moodle_user_id)) {
                    $moodleUserIdsMap[$dniKey] = (int) $usuario->moodle_user_id;
                    continue;
                }

                // Consultar en Moodle si la cuenta ya existe de forma remota
                try {
                    $moodleUser = $this->moodleService->obtenerUsuarioPorCampo('username', $dniKey);
                    if ($moodleUser && isset($moodleUser['id'])) {
                        $mId = (int) $moodleUser['id'];
                        $moodleUserIdsMap[$dniKey] = $mId;

                        if ($usuario) {
                            $usuario->moodle_user_id = $mId;
                            $usuario->save();
                        }
                        continue;
                    }
                } catch (\Throwable $e) {
                    Log::warning("No se pudo verificar usuario en Moodle ({$dni}): " . $e->getMessage());
                }

                // Si no existe, preparar para crear en lote
                $usuariosMoodleParaCrear[] = [
                    'username'  => $dniKey,
                    'password'  => $dni . '*Temp2026',
                    'firstname' => $p->nombres ?? 'Estudiante',
                    'lastname'  => $p->apellidos ?? 'General',
                    'email'     => !empty($p->email) ? $p->email : "{$dni}@instituto.edu.pe",
                ];
            }

            // Enviar creación en lote a Moodle
            if (!empty($usuariosMoodleParaCrear)) {
                $creados = $this->moodleService->crearUsuariosMasivo($usuariosMoodleParaCrear);

                if (is_array($creados)) {
                    foreach ($creados as $nuevo) {
                        $uName = $nuevo['username'] ?? null;
                        $uId   = $nuevo['id'] ?? null;
                        if ($uName && $uId) {
                            $moodleUserIdsMap[mb_strtolower($uName)] = (int) $uId;
                        }
                    }

                    AuditoriaService::registrar(
                        componente: 'interoperabilidad_moodle',
                        operacion: 'INSERTAR',
                        descripcion: 'Creación masiva de ' . count($creados) . ' usuario(s) en el Aula Virtual Moodle para ingresantes',
                        resultado: 'EXITO'
                    );
                }
            }

            // =========================================================================
            // FASE 2: PERSISTENCIA LOCAL EN TRANSACCIÓN SQL
            // =========================================================================
            $añoActual = date('Y');
            $rolEstudiante = DB::table('roles')->where('nombre', 'Estudiante')->first();
            $rolEstudianteId = $rolEstudiante ? $rolEstudiante->id : null;

            $enrolmentsMoodleBatch   = [];
            $groupMembersMoodleBatch = [];
            $totalCuentasLocalesCreadas = 0;

            DB::transaction(function () use (
                $datos,
                $postulantes,
                $horariosPrimerCiclo,
                $añoActual,
                $rolEstudianteId,
                $moodleUserIdsMap,
                &$enrolmentsMoodleBatch,
                &$groupMembersMoodleBatch,
                &$totalCuentasLocalesCreadas
            ) {
                foreach ($postulantes as $postulante) {
                    $dniKey = mb_strtolower(trim((string) $postulante->dni));
                    $moodleIdResuelto = $moodleUserIdsMap[$dniKey] ?? null;

                    // 1. Matrícula local
                    $matricula = Matricula::firstOrNew([
                        'postulante_id' => $postulante->id_postulante,
                        'periodo_id'    => $datos['periodo_id'],
                    ]);

                    if (!$matricula->exists) {
                        $ultimoId = Matricula::max('id') ?? 0;
                        $matricula->codigo_matricula = 'MAT-' . $añoActual . '-' . str_pad($ultimoId + 1, 5, '0', STR_PAD_LEFT);
                    }

                    $matricula->plan_estudio_id = $datos['plan_estudio_id'];
                    $matricula->semestre_id     = $datos['semestre_id'];
                    $matricula->estado          = 'Matriculado';
                    $matricula->fecha_matricula = now()->toDateString();
                    $matricula->save();

                    // 2. Asignar materias del ciclo
                    foreach ($horariosPrimerCiclo as $horario) {
                        $matricula->cursosMatriculados()->updateOrCreate(
                            ['horario_id' => $horario->id],
                            [
                                'curso_id' => $horario->id_curso,
                                'estado'   => 'Inscrito',
                            ]
                        );

                        // Acumular payload para enrolar en Moodle
                        $moodleCourseId = $horario->curso?->moodle_course_id;
                        $moodleGroupId  = $horario->moodle_group_id ?? $horario->seccion?->moodle_group_id;

                        if ($moodleIdResuelto && $moodleCourseId) {
                            $enrolmentsMoodleBatch[] = [
                                'roleid'    => 5,
                                'userid'    => (int) $moodleIdResuelto,
                                'courseid'  => (int) $moodleCourseId,
                                'timestart' => time(),
                                'timeend'   => 0,
                            ];

                            if ($moodleGroupId) {
                                $groupMembersMoodleBatch[] = [
                                    'groupid' => (int) $moodleGroupId,
                                    'userid'  => (int) $moodleIdResuelto,
                                ];
                            }
                        }
                    }

                    // 3. Crear o actualizar Usuario en la tabla 'usuarios'
                    $usuario = $postulante->usuario;
                    if (!$usuario) {
                        $usuario = Usuario::where('username', $postulante->dni)->first();
                    }

                    if ($usuario) {
                        if ($moodleIdResuelto && $usuario->moodle_user_id !== $moodleIdResuelto) {
                            $usuario->moodle_user_id = $moodleIdResuelto;
                            $usuario->save();
                        }
                    } else {
                        $usuario = Usuario::create([
                            'username'       => $postulante->dni,
                            'password_hash'  => Hash::make($postulante->dni),
                            'status'         => 'Activo',
                            'moodle_user_id' => $moodleIdResuelto,
                        ]);
                        $totalCuentasLocalesCreadas++;
                    }

                    // Vincular el usuario al postulante y cambiar grado a Estudiante
                    $postulante->usuario_id = $usuario->id;
                    $postulante->grado      = 'Estudiante';
                    $postulante->save();

                    // Asignar rol Estudiante
                    if ($rolEstudianteId) {
                        DB::table('usuario_roles')->updateOrInsert(
                            [
                                'usuario_id' => $usuario->id,
                                'rol_id'     => $rolEstudianteId,
                            ],
                            [
                                'updated_at' => now(),
                                'created_at' => now(),
                            ]
                        );
                    }
                }
            });

            $total = count($postulantes);

            // Auditorías
            if ($totalCuentasLocalesCreadas > 0) {
                AuditoriaService::registrar(
                    componente: 'seguridad_usuarios',
                    operacion: 'INSERTAR',
                    descripcion: "Aprovisionamiento masivo de {$totalCuentasLocalesCreadas} cuenta(s) de acceso y rol Estudiante en el portal",
                    resultado: 'EXITO'
                );
            }

            AuditoriaService::registrar(
                componente: 'estudiantes',
                operacion: 'ACTUALIZAR',
                descripcion: "Actualización de grado de 'Postulante' a 'Estudiante' para {$total} ingresante(s)",
                resultado: 'EXITO'
            );

            AuditoriaService::registrar(
                componente: 'matricula',
                operacion: 'INSERTAR',
                descripcion: "Matrícula masiva de {$total} ingresante(s) al I Semestre (Plan ID: {$datos['plan_estudio_id']}, Sección ID: {$datos['seccion_id']}, Periodo ID: {$datos['periodo_id']})",
                registroId: (string) $datos['periodo_id'],
                nuevos: [
                    'proceso_admision_id' => $datos['id_proceso'],
                    'plan_estudio_id'     => $datos['plan_estudio_id'],
                    'seccion_id'          => $datos['seccion_id'],
                    'periodo_id'          => $datos['periodo_id'],
                    'total_ingresantes'   => $total,
                    'materias_por_alumno' => count($horariosPrimerCiclo),
                ],
                resultado: 'EXITO'
            );

            // =========================================================================
            // FASE 3: ENROLAMIENTO Y GRUPOS EN MOODLE (EN BLOQUES / BATCH)
            // =========================================================================
            try {
                if (!empty($enrolmentsMoodleBatch)) {
                    $enrolmentsUnicos = collect($enrolmentsMoodleBatch)
                        ->unique(fn ($item) => "{$item['userid']}_{$item['courseid']}")
                        ->values()
                        ->toArray();

                    $this->moodleService->matricularUsuariosMasivo($enrolmentsUnicos, 100);
                }

                if (!empty($groupMembersMoodleBatch)) {
                    $groupsUnicos = collect($groupMembersMoodleBatch)
                        ->unique(fn ($item) => "{$item['groupid']}_{$item['userid']}")
                        ->values()
                        ->toArray();

                    $this->moodleService->agregarUsuariosAGruposMasivo($groupsUnicos, 100);
                }

                if (!empty($enrolmentsMoodleBatch)) {
                    AuditoriaService::registrar(
                        componente: 'interoperabilidad_moodle',
                        operacion: 'INSERTAR',
                        descripcion: "Enrolamiento masivo en Moodle: " . count($enrolmentsMoodleBatch) . " asignación(es) a cursos y grupos del 1er Ciclo",
                        resultado: 'EXITO'
                    );
                }
            } catch (\Throwable $e) {
                Log::error("Error en enrolamiento masivo de ingresantes hacia Moodle: " . $e->getMessage());

                AuditoriaService::registrar(
                    componente: 'interoperabilidad_moodle',
                    operacion: 'INSERTAR',
                    descripcion: 'Error de comunicación con la API de Moodle durante el enrolamiento de ingresantes',
                    resultado: 'FALLIDO',
                    motivoFallo: $e->getMessage()
                );
            }

            return back()->with('success', "Se matricularon exitosamente {$total} ingresantes, sus cuentas locales fueron creadas y su acceso al Aula Virtual quedó sincronizado.");

        } catch (Throwable $e) {
            Log::error("Error en store de matrícula masiva de ingresantes: " . $e->getMessage());

            AuditoriaService::registrar(
                componente: 'matricula',
                operacion: 'INSERTAR',
                descripcion: 'Fallo durante el procesamiento de matrícula masiva de ingresantes',
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}