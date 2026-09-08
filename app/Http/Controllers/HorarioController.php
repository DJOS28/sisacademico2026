<?php

namespace App\Http\Controllers;

use App\Models\Aula;
use App\Models\Curso;
use App\Models\Docente;
use App\Models\Horario;
use App\Models\Instituto;
use App\Models\Periodo;
use App\Models\PlanEstudio;
use App\Models\Seccion;
use App\Models\Turno;
use App\Services\AuditoriaService;
use App\Services\MoodleService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Throwable;

class HorarioController extends Controller
{
    protected MoodleService $moodleService;

    public function __construct(MoodleService $moodleService)
    {
        $this->moodleService = $moodleService;
    }

    /**
     * Muestra el listado inicial de horarios.
     */
    public function index(): Response
    {
        return Inertia::render('Horarios/Index', [
            'horarios' => $this->obtenerHorarios(),
            'docentes' => $this->docentes(),
            'periodos' => $this->periodos(),
            'dias'     => $this->dias(),
            'filtros'  => [
                'buscar'     => '',
                'id_docente' => '',
                'id_curso'   => '',
                'id_periodo' => '',
                'dia'        => '',
            ],
        ]);
    }

    /**
     * Filtra horarios mediante POST AJAX.
     */
    public function filtrar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'buscar'     => ['nullable', 'string', 'max:150'],
            'id_docente' => ['nullable', 'integer', 'exists:docentes,id'],
            'id_curso'   => ['nullable', 'integer', 'exists:cursos,id'],
            'id_periodo' => ['nullable', 'integer', 'exists:periodos,id'],
            'dia'        => ['nullable', Rule::in($this->dias())],
            'page'       => ['nullable', 'integer', 'min:1'],
        ]);

        $buscar    = trim((string) ($datos['buscar'] ?? ''));
        $idDocente = filled($datos['id_docente'] ?? null) ? (int) $datos['id_docente'] : null;
        $idCurso   = filled($datos['id_curso'] ?? null) ? (int) $datos['id_curso'] : null;
        $idPeriodo = filled($datos['id_periodo'] ?? null) ? (int) $datos['id_periodo'] : null;
        $dia       = trim((string) ($datos['dia'] ?? ''));
        $pagina    = (int) ($datos['page'] ?? 1);

        if ($idDocente !== null && $idCurso !== null) {
            $cursoDelDocente = Horario::query()
                ->where('id_docente', $idDocente)
                ->where('id_curso', $idCurso)
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
            'cursos' => $this->cursosDelDocente($idDocente),
            'filtros' => [
                'buscar'     => $buscar,
                'id_docente' => $idDocente ?? '',
                'id_curso'   => $idCurso ?? '',
                'id_periodo' => $idPeriodo ?? '',
                'dia'        => $dia,
            ],
        ]);
    }

    /**
     * Muestra el formulario de registro.
     */
    public function create(): Response
    {
        return Inertia::render('Horarios/Create', [
            'docentes'      => $this->docentes(),
            'aulas'         => $this->aulas(),
            'periodos'      => $this->periodos(),
            'planesEstudio' => $this->planesEstudio(),
            'secciones'     => $this->secciones(),
            'turnos'        => $this->turnos(),
            'dias'          => $this->dias(),
            'frecuencias'   => $this->frecuencias(),
        ]);
    }

    /**
     * Registra horarios y sincroniza Docente y Grupo en Moodle (Respuesta AJAX JSON).
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $datos = $this->validar(request: $request);
            $this->validarCursoDelPlanEstudio($datos);

            $curso = Curso::query()->findOrFail($datos['id_curso']);
            $docente = Docente::query()->with('usuario')->findOrFail($datos['id_docente']);

            $moodleGroupId = $datos['moodle_group_id'] ?? null;

            // 1. Sincronización con Moodle (Asignar Docente + Crear/Vincular Grupo de Sección)
            if ($curso->moodle_course_id) {
                $moodleCourseId = (int) $curso->moodle_course_id;
                $moodleUserId = $docente->usuario?->moodle_user_id ? (int) $docente->usuario->moodle_user_id : null;

                // PASO A: Matricular al Docente como Profesor (roleid = 3)
                if ($moodleUserId) {
                    try {
                        $this->moodleService->asignarProfesor($moodleUserId, $moodleCourseId);
                        AuditoriaService::registrar(
                            componente: 'interoperabilidad_moodle',
                            operacion: 'INSERTAR',
                            descripcion: "Docente {$docente->nombre} {$docente->apellido} matriculado como profesor en curso Moodle ID {$moodleCourseId}",
                            registroId: (string) $moodleCourseId,
                            resultado: 'EXITO'
                        );
                    } catch (\Throwable $e) {
                        Log::error("Error asignando docente en curso Moodle: " . $e->getMessage());
                    }
                }

                // PASO B: Crear o reutilizar el Grupo (Sección / Turno)
                if (!empty($datos['id_seccion']) && !$moodleGroupId) {
                    $seccion = Seccion::find($datos['id_seccion']);
                    $turno = !empty($datos['id_turno']) ? Turno::find($datos['id_turno']) : null;

                    $nombreGrupo = $seccion ? $seccion->nombre : 'Sección';
                    if ($turno) {
                        $nombreGrupo .= " - {$turno->nombre}";
                    }

                    $grupoExistente = Horario::where('id_curso', $curso->id)
                        ->where('id_seccion', $datos['id_seccion'])
                        ->when(!empty($datos['id_turno']), fn ($q) => $q->where('id_turno', $datos['id_turno']))
                        ->whereNotNull('moodle_group_id')
                        ->value('moodle_group_id');

                    if ($grupoExistente) {
                        $moodleGroupId = (int) $grupoExistente;
                    } else {
                        try {
                            $resGrupo = $this->moodleService->crearGrupo($moodleCourseId, $nombreGrupo);
                            if (is_array($resGrupo) && isset($resGrupo[0]['id'])) {
                                $moodleGroupId = (int) $resGrupo[0]['id'];
                                AuditoriaService::registrar(
                                    componente: 'interoperabilidad_moodle',
                                    operacion: 'INSERTAR',
                                    descripcion: "Grupo '{$nombreGrupo}' creado en Moodle para el curso ID {$moodleCourseId} (Grupo ID: {$moodleGroupId})",
                                    registroId: (string) $moodleGroupId,
                                    resultado: 'EXITO'
                                );
                            }
                        } catch (\Throwable $e) {
                            Log::error("Error creando grupo en Moodle para horario: " . $e->getMessage());
                        }
                    }
                }

                // PASO C: Agregar al Docente al Grupo de la Sección
                if ($moodleGroupId && $moodleUserId) {
                    try {
                        $this->moodleService->agregarUsuarioAGrupo($moodleGroupId, $moodleUserId);
                    } catch (\Throwable $e) {
                        Log::error("Error añadiendo docente al grupo en Moodle: " . $e->getMessage());
                    }
                }
            }

            // 2. Transacción en Base de Datos Local
            $nuevosHorariosIds = [];
            DB::transaction(function () use ($datos, $curso, $moodleGroupId, &$nuevosHorariosIds) {
                $curso->docentes()->syncWithoutDetaching([$datos['id_docente']]);

                $datosComunes = [
                    'id_docente'      => $datos['id_docente'],
                    'id_curso'        => $datos['id_curso'],
                    'id_aula'         => $datos['id_aula'] ?? null,
                    'id_periodo'      => $datos['id_periodo'],
                    'frecuencia'      => $datos['frecuencia'] ?? null,
                    'capacidad'       => $datos['capacidad'] ?? null,
                    'id_plan_estudio' => $datos['id_plan_estudio'],
                    'id_seccion'      => $datos['id_seccion'] ?? null,
                    'moodle_group_id' => $moodleGroupId,
                    'id_turno'        => $datos['id_turno'] ?? null,
                ];

                $datosComunes = $this->completarDatosDelAula($datosComunes);

                foreach ($datos['programaciones'] as $programacion) {
                    $nuevoHorario = Horario::create([
                        ...$datosComunes,
                        'dia'         => $programacion['dia'],
                        'hora_inicio' => $programacion['hora_inicio'],
                        'hora_fin'    => $programacion['hora_fin'],
                    ]);
                    $nuevosHorariosIds[] = $nuevoHorario->id;
                }
            });

            $cantidad = count($datos['programaciones']);
            $mensaje = $cantidad === 1 
                ? 'Horario registrado y sincronizado con Moodle correctamente.' 
                : "{$cantidad} horarios registrados y sincronizados con Moodle correctamente.";

            // Auditoría: e) Planificación y programación académica
            AuditoriaService::registrar(
                componente: 'programacion_academica',
                operacion: 'INSERTAR',
                descripcion: "Programación horaria registrada ({$cantidad} bloque(s)) para '{$curso->nombre}' con el docente ID {$datos['id_docente']}",
                registroId: implode(',', $nuevosHorariosIds),
                nuevos: [
                    'id_curso'        => $datos['id_curso'],
                    'id_docente'      => $datos['id_docente'],
                    'id_periodo'      => $datos['id_periodo'],
                    'id_plan_estudio' => $datos['id_plan_estudio'],
                    'id_seccion'      => $datos['id_seccion'] ?? null,
                    'id_aula'         => $datos['id_aula'] ?? null,
                    'bloques'         => $datos['programaciones'],
                ],
                resultado: 'EXITO'
            );

            return response()->json([
                'success' => true,
                'message' => $mensaje,
            ]);

        } catch (ValidationException $ve) {
            AuditoriaService::registrar(
                componente: 'programacion_academica',
                operacion: 'INSERTAR',
                descripcion: 'Conflito o validación fallida al registrar programación horaria',
                resultado: 'FALLIDO',
                motivoFallo: collect($ve->errors())->flatten()->implode(' | ')
            );
            throw $ve;
        } catch (\Throwable $e) {
            AuditoriaService::registrar(
                componente: 'programacion_academica',
                operacion: 'INSERTAR',
                descripcion: 'Error crítico de base de datos durante el registro de horario',
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error al registrar el horario: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Muestra el formulario de edición.
     */
    public function edit(Horario $horario): Response
    {
        $horario->load(['docente', 'curso', 'aula', 'periodo', 'planEstudio', 'seccion', 'turno']);

        return Inertia::render('Horarios/Edit', [
            'horario' => [
                'id'              => $horario->id,
                'id_docente'      => $horario->id_docente,
                'id_curso'        => $horario->id_curso,
                'id_aula'         => $horario->id_aula,
                'id_periodo'      => $horario->id_periodo,
                'frecuencia'      => $horario->frecuencia,
                'capacidad'       => $horario->capacidad,
                'id_plan_estudio' => $horario->id_plan_estudio,
                'id_seccion'      => $horario->id_seccion,
                'moodle_group_id' => $horario->moodle_group_id,
                'id_turno'        => $horario->id_turno,
                'programaciones'  => [
                    [
                        'dia'         => $horario->dia,
                        'hora_inicio' => $this->formatearHora($horario->getRawOriginal('hora_inicio')),
                        'hora_fin'    => $this->formatearHora($horario->getRawOriginal('hora_fin')),
                    ],
                ],
            ],
            'docentes'        => $this->docentes(),
            'cursosIniciales' => $this->cursosDelPlanEstudio($horario->id_plan_estudio),
            'aulas'           => $this->aulas(),
            'periodos'        => $this->periodos(),
            'planesEstudio'   => $this->planesEstudio(),
            'secciones'       => $this->secciones(),
            'turnos'          => $this->turnos(),
            'dias'            => $this->dias(),
            'frecuencias'     => $this->frecuencias(),
        ]);
    }

    /**
     * Actualiza un horario con gestión de cambio de docente, grupos y respuesta AJAX.
     */
    public function update(Request $request, Horario $horario): JsonResponse
    {
        try {
            $datos = $this->validar(request: $request, horario: $horario, esEdicion: true);
            $this->validarCursoDelPlanEstudio($datos);

            $cursoIdAnterior = (int) $horario->id_curso;
            $docenteIdAnterior = (int) $horario->id_docente;
            $moodleGroupIdAnterior = $horario->moodle_group_id ? (int) $horario->moodle_group_id : null;

            $curso = Curso::query()->findOrFail($datos['id_curso']);
            $nuevoDocente = Docente::query()->with('usuario')->findOrFail($datos['id_docente']);

            $moodleGroupId = $datos['moodle_group_id'] ?? $moodleGroupIdAnterior;

            // 1. SINCRONIZACIÓN Y REASIGNACIÓN EN MOODLE
            if ($curso->moodle_course_id) {
                $moodleCourseId = (int) $curso->moodle_course_id;
                $nuevoDocenteMoodleId = $nuevoDocente->usuario?->moodle_user_id ? (int) $nuevoDocente->usuario->moodle_user_id : null;

                // A. Si cambió la sección o turno, crear/buscar el nuevo grupo
                $cambioSeccion = ($horario->id_seccion != ($datos['id_seccion'] ?? null)) || ($horario->id_turno != ($datos['id_turno'] ?? null));

                if ($cambioSeccion && !empty($datos['id_seccion'])) {
                    $seccion = Seccion::find($datos['id_seccion']);
                    $turno = !empty($datos['id_turno']) ? Turno::find($datos['id_turno']) : null;
                    $nombreGrupo = ($seccion ? $seccion->nombre : 'Sección') . ($turno ? " - {$turno->nombre}" : '');

                    $grupoExistente = Horario::where('id_curso', $curso->id)
                        ->where('id_seccion', $datos['id_seccion'])
                        ->when(!empty($datos['id_turno']), fn ($q) => $q->where('id_turno', $datos['id_turno']))
                        ->where('id', '<>', $horario->id)
                        ->whereNotNull('moodle_group_id')
                        ->value('moodle_group_id');

                    if ($grupoExistente) {
                        $moodleGroupId = (int) $grupoExistente;
                    } else {
                        try {
                            $resGrupo = $this->moodleService->crearGrupo($moodleCourseId, $nombreGrupo);
                            if (is_array($resGrupo) && isset($resGrupo[0]['id'])) {
                                $moodleGroupId = (int) $resGrupo[0]['id'];
                            }
                        } catch (\Throwable $e) {
                            Log::error("Error creando nuevo grupo en Moodle (update): " . $e->getMessage());
                        }
                    }
                }

                // B. Matricular al nuevo docente y asignarlo al grupo activo
                if ($nuevoDocenteMoodleId) {
                    try {
                        $this->moodleService->asignarProfesor($nuevoDocenteMoodleId, $moodleCourseId);
                        if ($moodleGroupId) {
                            $this->moodleService->agregarUsuarioAGrupo($moodleGroupId, $nuevoDocenteMoodleId);
                        }
                    } catch (\Throwable $e) {
                        Log::error("Error asignando nuevo docente en Moodle: " . $e->getMessage());
                    }
                }

                // C. Manejo del docente anterior
                if ($docenteIdAnterior !== (int) $datos['id_docente']) {
                    $docenteAnterior = Docente::with('usuario')->find($docenteIdAnterior);
                    $anteriorDocenteMoodleId = $docenteAnterior?->usuario?->moodle_user_id ? (int) $docenteAnterior->usuario->moodle_user_id : null;

                    if ($anteriorDocenteMoodleId) {
                        if ($moodleGroupIdAnterior) {
                            try {
                                $this->moodleService->eliminarUsuarioDeGrupo($moodleGroupIdAnterior, $anteriorDocenteMoodleId);
                            } catch (\Throwable $e) {
                                Log::error("Error removiendo docente anterior del grupo en Moodle: " . $e->getMessage());
                            }
                        }

                        $tieneOtrasClases = Horario::where('id_curso', $cursoIdAnterior)
                            ->where('id_docente', $docenteIdAnterior)
                            ->where('id', '<>', $horario->id)
                            ->exists();

                        if (!$tieneOtrasClases) {
                            try {
                                $this->moodleService->desmatricularUsuario($anteriorDocenteMoodleId, $moodleCourseId, 3);
                                DB::table('cursos_docentes')
                                    ->where('curso_id', $cursoIdAnterior)
                                    ->where('docente_id', $docenteIdAnterior)
                                    ->delete();
                            } catch (\Throwable $e) {
                                Log::error("Error desmatriculando docente anterior en Moodle: " . $e->getMessage());
                            }
                        }
                    }
                }

                // D. Limpiar grupo anterior si quedó en desuso
                if ($moodleGroupIdAnterior && $moodleGroupIdAnterior !== $moodleGroupId) {
                    $grupoEnUso = Horario::where('moodle_group_id', $moodleGroupIdAnterior)
                        ->where('id', '<>', $horario->id)
                        ->exists();

                    if (!$grupoEnUso) {
                        try {
                            $this->moodleService->eliminarGrupo($moodleGroupIdAnterior);
                        } catch (\Throwable $e) {
                            Log::error("Error eliminando grupo antiguo en Moodle: " . $e->getMessage());
                        }
                    }
                }
            }

            // 2. ACTUALIZACIÓN EN BASE DE DATOS LOCAL
            $programacion = $datos['programaciones'][0];
            $datosAnteriores = $horario->only([
                'id_docente', 'id_curso', 'id_aula', 'id_periodo', 'id_plan_estudio',
                'id_seccion', 'id_turno', 'dia', 'hora_inicio', 'hora_fin', 'capacidad'
            ]);

            DB::transaction(function () use ($datos, $programacion, $horario, $curso, $moodleGroupId) {
                $curso->docentes()->syncWithoutDetaching([$datos['id_docente']]);

                $datosHorario = [
                    'id_docente'      => $datos['id_docente'],
                    'id_curso'        => $datos['id_curso'],
                    'id_aula'         => $datos['id_aula'] ?? null,
                    'id_periodo'      => $datos['id_periodo'],
                    'frecuencia'      => $datos['frecuencia'] ?? null,
                    'capacidad'       => $datos['capacidad'] ?? null,
                    'id_plan_estudio' => $datos['id_plan_estudio'],
                    'id_seccion'      => $datos['id_seccion'] ?? null,
                    'moodle_group_id' => $moodleGroupId,
                    'id_turno'        => $datos['id_turno'] ?? null,
                    'dia'             => $programacion['dia'],
                    'hora_inicio'     => $programacion['hora_inicio'],
                    'hora_fin'        => $programacion['hora_fin'],
                ];

                $datosHorario = $this->completarDatosDelAula($datosHorario);
                $horario->update($datosHorario);
            });

            // Auditoría: e) Actualización de programación académica
            AuditoriaService::registrar(
                componente: 'programacion_academica',
                operacion: 'ACTUALIZAR',
                descripcion: "Horario modificado (ID: {$horario->id}) para la asignatura '{$curso->nombre}'",
                registroId: (string) $horario->id,
                anteriores: $datosAnteriores,
                nuevos: [
                    'id_docente'  => $datos['id_docente'],
                    'id_curso'    => $datos['id_curso'],
                    'id_seccion'  => $datos['id_seccion'] ?? null,
                    'id_aula'     => $datos['id_aula'] ?? null,
                    'dia'         => $programacion['dia'],
                    'hora_inicio' => $programacion['hora_inicio'],
                    'hora_fin'    => $programacion['hora_fin'],
                ],
                resultado: 'EXITO'
            );

            return response()->json([
                'success' => true,
                'message' => 'Horario y Aula Virtual actualizados correctamente.',
            ]);

        } catch (ValidationException $ve) {
            AuditoriaService::registrar(
                componente: 'programacion_academica',
                operacion: 'ACTUALIZAR',
                descripcion: "Conflito al actualizar horario ID {$horario->id}",
                registroId: (string) $horario->id,
                resultado: 'FALLIDO',
                motivoFallo: collect($ve->errors())->flatten()->implode(' | ')
            );
            throw $ve;
        } catch (\Throwable $e) {
            AuditoriaService::registrar(
                componente: 'programacion_academica',
                operacion: 'ACTUALIZAR',
                descripcion: "Error al actualizar horario ID {$horario->id}",
                registroId: (string) $horario->id,
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error al actualizar el horario: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Elimina un horario y sincroniza la eliminación del grupo/docente en Moodle.
     */
    public function destroy(Horario $horario): RedirectResponse
    {
        // 1. Validar si existen estudiantes matriculados en este horario
        if (DB::table('matricula_cursos')->where('horario_id', $horario->id)->exists()) {
            AuditoriaService::registrar(
                componente: 'programacion_academica',
                operacion: 'ELIMINAR',
                descripcion: "Intento bloqueado de eliminación de horario ID {$horario->id}: posee alumnos matriculados",
                registroId: (string) $horario->id,
                resultado: 'BLOQUEADO',
                motivoFallo: 'Existen registros en matricula_cursos'
            );

            return back()->with('error', 'No se puede eliminar el horario porque tiene estudiantes matriculados.');
        }

        // 2. Validar si existen asistencias o sesiones creadas
        if (DB::table('asistencias')->whereIn('sesion_id', function ($query) use ($horario) {
            $query->select('id_sesion')->from('sesiones')->where('horario_id', $horario->id);
        })->exists()) {
            AuditoriaService::registrar(
                componente: 'programacion_academica',
                operacion: 'ELIMINAR',
                descripcion: "Intento bloqueado de eliminación de horario ID {$horario->id}: contiene asistencias asentadas",
                registroId: (string) $horario->id,
                resultado: 'BLOQUEADO',
                motivoFallo: 'Existen registros vinculados en sesiones/asistencias'
            );

            return back()->with('error', 'No se puede eliminar el horario porque tiene asistencias registradas.');
        }

        $curso = Curso::find($horario->id_curso);
        $docente = Docente::with('usuario')->find($horario->id_docente);
        $moodleGroupId = $horario->moodle_group_id;
        $detallesEliminados = [
            'id_curso'    => $horario->id_curso,
            'id_docente'  => $horario->id_docente,
            'dia'         => $horario->dia,
            'hora_inicio' => $horario->hora_inicio,
            'hora_fin'    => $horario->hora_fin,
            'id_seccion'  => $horario->id_seccion,
        ];

        try {
            DB::transaction(function () use ($horario, $curso, $docente, $moodleGroupId) {
                $horarioId = $horario->id;
                $cursoId = $horario->id_curso;
                $docenteId = $horario->id_docente;

                // Eliminar el horario local
                $horario->delete();

                // Sincronización con Moodle
                if ($curso && $curso->moodle_course_id) {
                    $moodleCourseId = (int) $curso->moodle_course_id;
                    $moodleUserId = $docente?->usuario?->moodle_user_id ? (int) $docente->usuario->moodle_user_id : null;

                    // A. Eliminar el grupo en Moodle si ningún otro horario lo usa
                    if ($moodleGroupId) {
                        $otrosHorariosConGrupo = Horario::where('moodle_group_id', $moodleGroupId)->exists();
                        if (!$otrosHorariosConGrupo) {
                            try {
                                $this->moodleService->eliminarGrupo($moodleGroupId);
                            } catch (\Throwable $e) {
                                Log::error("Error eliminando grupo en Moodle: " . $e->getMessage());
                            }
                        }
                    }

                    // B. Desmatricular al docente si no tiene más clases en este curso
                    if ($moodleUserId) {
                        $tieneOtrasClasesEnCurso = Horario::where('id_curso', $cursoId)
                            ->where('id_docente', $docenteId)
                            ->exists();

                        if (!$tieneOtrasClasesEnCurso) {
                            try {
                                $this->moodleService->desmatricularUsuario($moodleUserId, $moodleCourseId, 3);
                                DB::table('cursos_docentes')
                                    ->where('curso_id', $cursoId)
                                    ->where('docente_id', $docenteId)
                                    ->delete();
                            } catch (\Throwable $e) {
                                Log::error("Error desmatriculando docente en Moodle: " . $e->getMessage());
                            }
                        }
                    }
                }
            });

            // Auditoría: e) Eliminación de programación horaria
            AuditoriaService::registrar(
                componente: 'programacion_academica',
                operacion: 'ELIMINAR',
                descripcion: "Horario eliminado (ID: {$horario->id}) de la asignatura '{$curso?->nombre}' ({$detallesEliminados['dia']} {$detallesEliminados['hora_inicio']}-{$detallesEliminados['hora_fin']})",
                registroId: (string) $horario->id,
                anteriores: $detallesEliminados,
                resultado: 'EXITO'
            );

            return back()->with('success', 'Horario eliminado y Aula Virtual actualizada correctamente.');
        } catch (\Throwable $exception) {
            report($exception);

            AuditoriaService::registrar(
                componente: 'programacion_academica',
                operacion: 'ELIMINAR',
                descripcion: "Fallo durante la eliminación del horario ID {$horario->id}",
                registroId: (string) $horario->id,
                resultado: 'FALLIDO',
                motivoFallo: $exception->getMessage()
            );

            return back()->with('error', 'Ocurrió un error al eliminar el horario: ' . $exception->getMessage());
        }
    }

    /**
     * Retorna los cursos que pertenecen al plan de estudio seleccionado vía AJAX.
     */
    public function cursosPorPlanEstudio(PlanEstudio $planEstudio): JsonResponse
    {
        return response()->json([
            'cursos' => $this->cursosDelPlanEstudio($planEstudio->id),
        ]);
    }

    /**
     * Valida el formulario de horarios con todas las reglas de concurrencia y límites académicos.
     */
    private function validar(Request $request, ?Horario $horario = null, bool $esEdicion = false): array
    {
        $datos = $request->validate([
            'id_periodo'                  => ['required', 'integer', 'exists:periodos,id'],
            'id_plan_estudio'             => ['required', 'integer', 'exists:planes_estudio,id'],
            'id_docente'                  => ['required', 'integer', 'exists:docentes,id'],
            'id_curso'                    => ['required', 'integer', 'exists:cursos,id'],
            'id_seccion'                  => ['nullable', 'integer', 'exists:secciones,id'],
            'id_turno'                    => ['nullable', 'integer', 'exists:turnos,id'],
            'id_aula'                     => ['nullable', 'integer', 'exists:aulas,id'],
            'frecuencia'                  => ['nullable', Rule::in($this->frecuencias())],
            'capacidad'                   => ['nullable', 'integer', 'min:0', 'max:10000'],
            'moodle_group_id'             => ['nullable', 'integer', 'min:1'],
            'programaciones'              => ['required', 'array', 'min:1', $esEdicion ? 'max:1' : 'max:7'],
            'programaciones.*.dia'         => ['required', Rule::in($this->dias()), 'distinct'],
            'programaciones.*.hora_inicio' => ['required', 'date_format:H:i'],
            'programaciones.*.hora_fin'    => ['required', 'date_format:H:i'],
        ], [
            'id_periodo.required'                   => 'Debe seleccionar un periodo académico.',
            'id_plan_estudio.required'              => 'Debe seleccionar un plan de estudio.',
            'id_docente.required'                   => 'Debe seleccionar un docente.',
            'id_curso.required'                     => 'Debe seleccionar un curso.',
            'programaciones.required'               => 'Debe agregar al menos un día de programación.',
            'programaciones.min'                    => 'Debe agregar al menos un día de programación.',
            'programaciones.max'                    => $esEdicion ? 'En edición solo puede modificar un horario.' : 'No puede registrar más de siete días.',
            'programaciones.*.dia.required'         => 'Debe seleccionar el día.',
            'programaciones.*.dia.in'               => 'El día seleccionado no es válido.',
            'programaciones.*.dia.distinct'         => 'No puede registrar dos veces el mismo día en este lote.',
            'programaciones.*.hora_inicio.required' => 'Debe indicar la hora de inicio.',
            'programaciones.*.hora_fin.required'    => 'Debe indicar la hora de fin.',
        ]);

        $this->validarPeriodoActivo((int) $datos['id_periodo']);
        $this->validarAforoAula($datos);

        foreach ($datos['programaciones'] as $indice => $programacion) {
            if ($programacion['hora_fin'] <= $programacion['hora_inicio']) {
                throw ValidationException::withMessages([
                    "programaciones.{$indice}.hora_fin" => 'La hora de fin debe ser posterior a la hora de inicio.',
                ]);
            }

            $datosHorario = [
                'id_docente'      => $datos['id_docente'],
                'id_curso'        => $datos['id_curso'],
                'id_aula'         => $datos['id_aula'] ?? null,
                'id_periodo'      => $datos['id_periodo'],
                'id_plan_estudio' => $datos['id_plan_estudio'],
                'id_seccion'      => $datos['id_seccion'] ?? null,
                'id_turno'        => $datos['id_turno'] ?? null,
                'dia'             => $programacion['dia'],
                'hora_inicio'     => $programacion['hora_inicio'],
                'hora_fin'        => $programacion['hora_fin'],
            ];

            $this->validarCruceDocente(datos: $datosHorario, indice: $indice, horario: $horario);
            $this->validarCruceAula(datos: $datosHorario, indice: $indice, horario: $horario);
            $this->validarCruceSeccion(datos: $datosHorario, indice: $indice, horario: $horario);
            $this->validarHorarioDentroDelTurno(datos: $datosHorario, indice: $indice);
        }

        return $datos;
    }

    private function validarPeriodoActivo(int $periodoId): void
    {
        $periodo = Periodo::query()->find($periodoId);
        if ($periodo && ! $periodo->activo) {
            throw ValidationException::withMessages([
                'id_periodo' => 'No se pueden registrar o modificar horarios en un periodo académico que se encuentra inactivo/cerrado.',
            ]);
        }
    }

    private function validarAforoAula(array $datos): void
    {
        if (empty($datos['id_aula']) || empty($datos['capacidad'])) {
            return;
        }

        $aula = Aula::query()->find($datos['id_aula']);
        if ($aula && (int) $datos['capacidad'] > (int) $aula->capacidad) {
            throw ValidationException::withMessages([
                'capacidad' => "La capacidad asignada ({$datos['capacidad']}) excede el aforo máximo del aula {$aula->nombre} ({$aula->capacidad} vacantes).",
            ]);
        }
    }

    private function validarCruceSeccion(array $datos, int $indice, ?Horario $horario = null): void
    {
        if (empty($datos['id_seccion'])) {
            return;
        }

        $existeCruce = Horario::query()
            ->where('id_periodo', $datos['id_periodo'])
            ->where('id_plan_estudio', $datos['id_plan_estudio'])
            ->where('id_seccion', $datos['id_seccion'])
            ->where('dia', $datos['dia'])
            ->when($horario !== null, fn ($query) => $query->where('id', '<>', $horario->id))
            ->where('hora_inicio', '<', $datos['hora_fin'])
            ->where('hora_fin', '>', $datos['hora_inicio'])
            ->exists();

        if ($existeCruce) {
            throw ValidationException::withMessages([
                "programaciones.{$indice}.hora_inicio" => "La sección seleccionada ya tiene otra materia programada el {$datos['dia']} en este rango de horas.",
            ]);
        }
    }

    private function validarCursoDelPlanEstudio(array $datos): void
    {
        $cursoPerteneceAlPlan = DB::table('cursos_plan_estudio')
            ->where('plan_estudio_id', $datos['id_plan_estudio'])
            ->where('curso_id', $datos['id_curso'])
            ->exists();

        if (! $cursoPerteneceAlPlan) {
            throw ValidationException::withMessages([
                'id_curso' => 'El curso seleccionado no pertenece al plan de estudio asignado.',
            ]);
        }
    }

    private function validarCruceDocente(array $datos, int $indice, ?Horario $horario = null): void
    {
        $existeCruce = Horario::query()
            ->where('id_docente', $datos['id_docente'])
            ->where('dia', $datos['dia'])
            ->where('id_periodo', $datos['id_periodo'])
            ->when($horario !== null, fn ($query) => $query->where('id', '<>', $horario->id))
            ->where('hora_inicio', '<', $datos['hora_fin'])
            ->where('hora_fin', '>', $datos['hora_inicio'])
            ->exists();

        if ($existeCruce) {
            throw ValidationException::withMessages([
                "programaciones.{$indice}.hora_inicio" => "El docente ya cuenta con otra clase programada el {$datos['dia']} dentro de ese rango de horas.",
            ]);
        }
    }

    private function validarCruceAula(array $datos, int $indice, ?Horario $horario = null): void
    {
        if (empty($datos['id_aula'])) {
            return;
        }

        $existeCruce = Horario::query()
            ->where('id_aula', $datos['id_aula'])
            ->where('dia', $datos['dia'])
            ->where('id_periodo', $datos['id_periodo'])
            ->when($horario !== null, fn ($query) => $query->where('id', '<>', $horario->id))
            ->where('hora_inicio', '<', $datos['hora_fin'])
            ->where('hora_fin', '>', $datos['hora_inicio'])
            ->exists();

        if ($existeCruce) {
            throw ValidationException::withMessages([
                "programaciones.{$indice}.hora_inicio" => "El aula física seleccionada ya está ocupada el {$datos['dia']} en ese rango de horas.",
            ]);
        }
    }

    private function validarHorarioDentroDelTurno(array $datos, int $indice): void
    {
        if (empty($datos['id_turno'])) {
            return;
        }

        $turno = Turno::query()->find($datos['id_turno']);
        if (! $turno) {
            return;
        }

        $inicioTurno = $this->formatearHora($turno->getRawOriginal('hora_inicio'));
        $finTurno    = $this->formatearHora($turno->getRawOriginal('hora_fin'));

        if ($datos['hora_inicio'] < $inicioTurno || $datos['hora_fin'] > $finTurno) {
            throw ValidationException::withMessages([
                "programaciones.{$indice}.hora_inicio" => "El horario del {$datos['dia']} debe encontrarse dentro del turno {$turno->nombre} ({$inicioTurno} a {$finTurno}).",
            ]);
        }
    }

    private function completarDatosDelAula(array $datos): array
    {
        if (empty($datos['id_aula'])) {
            $datos['tipo_aula']   = null;
            $datos['numero_aula'] = null;

            if (! array_key_exists('capacidad', $datos)) {
                $datos['capacidad'] = null;
            }

            return $datos;
        }

        $aula = Aula::query()->findOrFail($datos['id_aula']);
        $datos['tipo_aula']   = $aula->tipo;
        $datos['numero_aula'] = $aula->numero_aula;

        if (empty($datos['capacidad'])) {
            $datos['capacidad'] = $aula->capacidad;
        }

        return $datos;
    }

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
                'curso:id,nombre,moodle_course_id',
                'aula:id,nombre,numero_aula,id_pabellon,tipo,capacidad',
                'aula.pabellon:id,nombre',
                'periodo:id,nombre',
                'planEstudio:id,nombre',
                'seccion:id,nombre',
                'turno:id,nombre,hora_inicio,hora_fin',
            ])
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($subquery) use ($buscar) {
                    $subquery->where('dia', 'like', "%{$buscar}%")
                        ->orWhere('tipo_aula', 'like', "%{$buscar}%")
                        ->orWhere('numero_aula', 'like', "%{$buscar}%")
                        ->orWhereHas('docente', fn ($q) => $q->where('nombre', 'like', "%{$buscar}%")->orWhere('apellido', 'like', "%{$buscar}%"))
                        ->orWhereHas('curso', fn ($q) => $q->where('nombre', 'like', "%{$buscar}%"))
                        ->orWhereHas('aula', fn ($q) => $q->where('nombre', 'like', "%{$buscar}%")->orWhere('numero_aula', 'like', "%{$buscar}%"))
                        ->orWhereHas('seccion', fn ($q) => $q->where('nombre', 'like', "%{$buscar}%"))
                        ->orWhereHas('turno', fn ($q) => $q->where('nombre', 'like', "%{$buscar}%"));
                });
            })
            ->when($idDocente !== null, fn ($query) => $query->where('id_docente', $idDocente))
            ->when($idCurso !== null, fn ($query) => $query->where('id_curso', $idCurso))
            ->when($idPeriodo !== null, fn ($query) => $query->where('id_periodo', $idPeriodo))
            ->when($dia !== '', fn ($query) => $query->where('dia', $dia))
            ->orderByRaw("FIELD(dia, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo')")
            ->orderBy('hora_inicio')
            ->paginate(perPage: 15, columns: ['*'], pageName: 'page', page: $pagina);
    }

    private function cursosDelPlanEstudio(?int $idPlanEstudio)
    {
        if ($idPlanEstudio === null) {
            return collect();
        }

        $planEstudio = PlanEstudio::query()->find($idPlanEstudio);
        if (! $planEstudio) {
            return collect();
        }

        return $planEstudio->cursos()
            ->with(['semestre:id,nombre', 'moduloFormativo:id_modulo,nombre'])
            ->orderBy('cursos.orden')
            ->orderBy('cursos.nombre')
            ->get([
                'cursos.id',
                'cursos.nombre',
                'cursos.tipo',
                'cursos.semestre_id',
                'cursos.id_modulo',
                'cursos.orden',
            ]);
    }

    private function cursosDelDocente(?int $idDocente)
    {
        if ($idDocente === null) {
            return collect();
        }

        return Curso::query()
            ->whereHas('horarios', fn ($query) => $query->where('id_docente', $idDocente))
            ->orderBy('nombre')
            ->get(['id', 'nombre']);
    }

    private function docentes()
    {
        return Docente::query()
            ->orderBy('apellido')
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'apellido']);
    }

    private function aulas()
    {
        return Aula::query()
            ->with(['pabellon:id,nombre'])
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'numero_aula', 'capacidad', 'id_pabellon', 'tipo']);
    }

    private function periodos()
    {
        return Periodo::query()->orderByDesc('id')->get();
    }

    private function planesEstudio()
    {
        return PlanEstudio::query()
            ->where('activo', 1)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'codigo']);
    }

    private function secciones()
    {
        return Seccion::query()->orderBy('nombre')->get(['id', 'nombre']);
    }

    private function turnos()
    {
        return Turno::query()->orderBy('hora_inicio')->get(['id', 'nombre', 'hora_inicio', 'hora_fin']);
    }

    private function dias(): array
    {
        return ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    }

    private function frecuencias(): array
    {
        return ['Semanal', 'Quincenal', 'Mensual'];
    }

    private function formatearHora(?string $hora): string
    {
        return empty($hora) ? '' : substr($hora, 0, 5);
    }

    public function pdfPorDocente(Request $request, Docente $docente): HttpResponse
    {
        $datos = $request->validate([
            'id_periodo' => ['nullable', 'integer', 'exists:periodos,id'],
        ]);

        $idPeriodo = filled($datos['id_periodo'] ?? null) ? (int) $datos['id_periodo'] : null;
        $instituto = Instituto::query()->with(['distrito'])->first();

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
            ->where('id_docente', $docente->id)
            ->when($idPeriodo !== null, fn ($query) => $query->where('id_periodo', $idPeriodo))
            ->orderByRaw("FIELD(dia, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo')")
            ->orderBy('hora_inicio')
            ->get();

        $periodo = $idPeriodo !== null ? Periodo::query()->find($idPeriodo) : null;
        $matrizHorario = $this->construirMatrizHorario(horarios: $horarios, duracionBloque: 45);
        $logoPath = $this->obtenerLogoInstitutoBase64($instituto?->logo);

        // Auditoría: m) Exportación de información
        AuditoriaService::registrar(
            componente: 'import_export',
            operacion: 'EXPORTAR',
            descripcion: "Descarga de reporte de horario individual (PDF) del docente {$docente->nombre} {$docente->apellido} (Periodo ID: " . ($idPeriodo ?? 'Todos') . ")",
            registroId: (string) $docente->id,
            resultado: 'EXITO'
        );

        $pdf = Pdf::loadView('pdf.horarios.docente', [
            'instituto'      => $instituto,
            'docente'        => $docente,
            'periodo'        => $periodo,
            'horarios'       => $horarios,
            'diasHorario'    => $matrizHorario['dias'],
            'franjasHorario' => $matrizHorario['franjas'],
            'logoPath'       => $logoPath,
            'fechaEmision'   => now(),
        ])
        ->setPaper('a4', 'landscape')
        ->setOptions([
            'isRemoteEnabled'      => true,
            'isHtml5ParserEnabled' => true,
            'defaultFont'          => 'DejaVu Sans',
        ]);

        $nombreDocente = trim("{$docente->nombre} {$docente->apellido}");
        $nombreArchivo = 'horario-' . str($nombreDocente)->slug('-')->toString() . '.pdf';

        return $pdf->stream($nombreArchivo);
    }

    private function construirMatrizHorario(Collection $horarios, int $duracionBloque = 45): array
    {
        $ordenDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

        if ($horarios->isEmpty()) {
            return [
                'dias'    => array_slice($ordenDias, 0, 5),
                'franjas' => [],
            ];
        }

        $diasConHorario = $horarios->pluck('dia')->filter()->unique()->values()->all();
        $dias = collect($ordenDias)->filter(fn (string $dia) => in_array($dia, $diasConHorario, true))->values()->all();

        $horaInicioGeneral = $horarios->map(fn (Horario $h) => substr((string) $h->getRawOriginal('hora_inicio'), 0, 5))->filter()->sort()->first();
        $horaFinGeneral    = $horarios->map(fn (Horario $h) => substr((string) $h->getRawOriginal('hora_fin'), 0, 5))->filter()->sortDesc()->first();

        if (blank($horaInicioGeneral) || blank($horaFinGeneral)) {
            return ['dias' => $dias, 'franjas' => []];
        }

        $inicioGeneral = Carbon::createFromFormat('H:i', $horaInicioGeneral);
        $finGeneral    = Carbon::createFromFormat('H:i', $horaFinGeneral);

        $franjas = [];
        $inicioBloque = $inicioGeneral->copy();

        while ($inicioBloque->lt($finGeneral)) {
            $finBloque = $inicioBloque->copy()->addMinutes($duracionBloque);
            if ($finBloque->gt($finGeneral)) {
                $finBloque = $finGeneral->copy();
            }

            $fila = [
                'hora_inicio' => $inicioBloque->format('H:i'),
                'hora_fin'    => $finBloque->format('H:i'),
                'horario'     => $inicioBloque->format('H:i') . ' - ' . $finBloque->format('H:i'),
                'dias'        => [],
            ];

            foreach ($dias as $dia) {
                $horarioEncontrado = $horarios->first(function (Horario $horario) use ($dia, $inicioBloque, $finBloque) {
                    if ($horario->dia !== $dia) {
                        return false;
                    }

                    $inicioHorario = Carbon::createFromFormat('H:i', substr((string) $horario->getRawOriginal('hora_inicio'), 0, 5));
                    $finHorario    = Carbon::createFromFormat('H:i', substr((string) $horario->getRawOriginal('hora_fin'), 0, 5));

                    return $inicioHorario->lt($finBloque) && $finHorario->gt($inicioBloque);
                });

                $fila['dias'][$dia] = $horarioEncontrado;
            }

            $franjas[] = $fila;
            $inicioBloque = $finBloque->copy();
        }

        return ['dias' => $dias, 'franjas' => $franjas];
    }

    private function obtenerLogoInstitutoBase64(?string $logo): ?string
    {
        if (blank($logo)) {
            return null;
        }

        $logo = ltrim(str_replace('\\', '/', $logo), '/');
        $disco = Storage::disk('public');

        if (! $disco->exists($logo)) {
            return null;
        }

        $contenido = $disco->get($logo);
        if ($contenido === '') {
            return null;
        }

        $extension = strtolower(pathinfo($logo, PATHINFO_EXTENSION));
        $mime = match ($extension) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png'         => 'image/png',
            'gif'         => 'image/gif',
            'webp'        => 'image/webp',
            'svg'         => 'image/svg+xml',
            default       => 'application/octet-stream',
        };

        return 'data:' . $mime . ';base64,' . base64_encode($contenido);
    }
}