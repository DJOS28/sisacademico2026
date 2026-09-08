<?php

namespace App\Http\Controllers;

use App\Models\Curso;
use App\Models\Horario;
use App\Models\Instituto;
use App\Models\LogroCurso;
use App\Models\MatriculaCurso;
use App\Models\NotaCriterio;
use App\Models\NotaFinal;
use App\Models\NotaLogro;
use App\Models\NotaSubcomponente;
use App\Models\Periodo;
use App\Models\Seccion;
use App\Models\Usuario;
use App\Services\AuditoriaService;
use App\Services\MoodleService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class NotasController extends Controller
{
    protected MoodleService $moodleService;

    public function __construct(MoodleService $moodleService)
    {
        $this->moodleService = $moodleService;
    }

    // =========================================================================
    // 1. MÉTODOS PARA "NOTAS TAB" (GESTIÓN DEL CURSO)
    // =========================================================================

    /**
     * Obtener matriz para NotasTab (Vista dentro de Gestionar Curso)
     */
    public function getMatrizNotas(Request $request): JsonResponse
    {
        $cursoId   = $request->input('curso_id') ?? session('logros_curso_id');
        $seccionId = $request->input('seccion_id') ?? session('logros_seccion_id');
        $periodoId = $request->input('periodo_id') ?? session('logros_periodo_id');

        if (!$cursoId || !$seccionId) {
            return response()->json([
                'estudiantes'          => [],
                'logros'               => [],
                'notas_subcomponentes' => [],
                'notas_logros'         => [],
                'notas_finales'        => [],
            ]);
        }

        $horarioId = Horario::where('id_curso', $cursoId)
            ->where('id_seccion', $seccionId)
            ->when($periodoId, fn($q) => $q->where('id_periodo', $periodoId))
            ->value('id');

        $estudiantes = MatriculaCurso::with(['estudiante.usuario'])
            ->where('horario_id', $horarioId)
            ->get()
            ->map(fn($item) => [
                'estudiante_id'   => $item->estudiante?->id_postulante ?? $item->estudiante?->id,
                'codigo'          => $item->estudiante?->codigo_postulante ?? $item->estudiante?->dni ?? 'S/N',
                'nombre_completo' => $item->estudiante?->nombre_completo ?? 'Sin Nombre',
                'moodle_user_id'  => $item->estudiante?->usuario?->moodle_user_id,
            ])
            ->filter(fn($e) => !is_null($e['estudiante_id']))
            ->sortBy('nombre_completo')
            ->values();

        $logros = LogroCurso::with(['subcomponentes' => function ($query) {
                $query->orderBy('id', 'asc');
            }])
            ->where('curso_id', $cursoId)
            ->where('id_seccion', $seccionId)
            ->when($periodoId, fn($q) => $q->where('id_periodo', $periodoId))
            ->orderBy('id', 'asc')
            ->get();

        $estudianteIds    = $estudiantes->pluck('estudiante_id');
        $subcomponenteIds = $logros->pluck('subcomponentes')->flatten()->pluck('id');

        $notasSubcomponentes = NotaSubcomponente::whereIn('estudiante_id', $estudianteIds)
            ->whereIn('subcomponente_id', $subcomponenteIds)
            ->where('id_seccion', $seccionId)
            ->when($periodoId, fn($q) => $q->where('id_periodo', $periodoId))
            ->get();

        $notasLogros = NotaLogro::whereIn('estudiante_id', $estudianteIds)
            ->where('curso_id', $cursoId)
            ->where('id_seccion', $seccionId)
            ->when($periodoId, fn($q) => $q->where('id_periodo', $periodoId))
            ->get();

        $notasFinales = NotaFinal::whereIn('estudiante_id', $estudianteIds)
            ->where('curso_id', $cursoId)
            ->where('id_seccion', $seccionId)
            ->get();

        return response()->json([
            'estudiantes'          => $estudiantes,
            'logros'               => $logros,
            'notas_subcomponentes' => $notasSubcomponentes,
            'notas_logros'         => $notasLogros,
            'notas_finales'        => $notasFinales,
        ]);
    }

    /**
     * Guardar notas desde NotasTab con updateOrCreate
     */
    public function guardarNotasMatriz(Request $request): JsonResponse
    {
        $request->validate([
            'notas_subcomponentes'                    => 'nullable|array',
            'notas_subcomponentes.*.estudiante_id'    => 'required|integer',
            'notas_subcomponentes.*.subcomponente_id' => 'required|integer',
            'notas_subcomponentes.*.nota'             => 'nullable|numeric|min:0|max:20',

            'notas_logros_manuales'                   => 'nullable|array',
            'notas_logros_manuales.*.estudiante_id'   => 'required|integer',
            'notas_logros_manuales.*.logro_curso_id'  => 'required|integer',
            'notas_logros_manuales.*.nota'            => 'nullable|numeric|min:0|max:20',

            'notas_finales_directas'                  => 'nullable|array',
            'notas_finales_directas.*.estudiante_id'  => 'required|integer',
            'notas_finales_directas.*.nota'           => 'nullable|numeric|min:0|max:20',
        ]);

        $cursoId   = $request->input('curso_id') ?? session('logros_curso_id');
        $seccionId = $request->input('seccion_id') ?? session('logros_seccion_id');
        $periodoId = $request->input('periodo_id') ?? session('logros_periodo_id');

        if (!$cursoId || !$seccionId) {
            return response()->json(['error' => 'Sesión de curso no activa.'], 400);
        }

        try {
            DB::transaction(function () use ($request, $cursoId, $seccionId, $periodoId) {
                // 1. Guardar o actualizar Subcomponentes
                if ($request->has('notas_subcomponentes')) {
                    foreach ($request->notas_subcomponentes as $item) {
                        if ($item['nota'] !== null && $item['nota'] !== '') {
                            NotaSubcomponente::updateOrCreate(
                                [
                                    'estudiante_id'    => $item['estudiante_id'],
                                    'subcomponente_id' => $item['subcomponente_id'],
                                    'id_seccion'       => $seccionId,
                                ],
                                [
                                    'nota'       => $item['nota'],
                                    'id_periodo' => $periodoId,
                                ]
                            );
                        } else {
                            NotaSubcomponente::where('estudiante_id', $item['estudiante_id'])
                                ->where('subcomponente_id', $item['subcomponente_id'])
                                ->where('id_seccion', $seccionId)
                                ->delete();
                        }
                    }
                }

                // 2. Guardar o actualizar Logros
                if ($request->has('notas_logros_manuales')) {
                    foreach ($request->notas_logros_manuales as $item) {
                        if ($item['nota'] !== null && $item['nota'] !== '') {
                            NotaLogro::updateOrCreate(
                                [
                                    'estudiante_id'  => $item['estudiante_id'],
                                    'logro_curso_id' => $item['logro_curso_id'],
                                    'curso_id'       => $cursoId,
                                    'id_seccion'     => $seccionId,
                                ],
                                [
                                    'nota'       => $item['nota'],
                                    'id_periodo' => $periodoId,
                                ]
                            );
                        } else {
                            NotaLogro::where('estudiante_id', $item['estudiante_id'])
                                ->where('logro_curso_id', $item['logro_curso_id'])
                                ->where('curso_id', $cursoId)
                                ->where('id_seccion', $seccionId)
                                ->delete();
                        }
                    }
                }

                // 3. Guardar o actualizar Notas Finales
                if ($request->has('notas_finales_directas')) {
                    foreach ($request->notas_finales_directas as $item) {
                        if ($item['nota'] !== null && $item['nota'] !== '') {
                            NotaFinal::updateOrCreate(
                                [
                                    'estudiante_id' => $item['estudiante_id'],
                                    'curso_id'      => $cursoId,
                                    'id_seccion'    => $seccionId,
                                ],
                                [
                                    'promedio'   => $item['nota'],
                                    'id_periodo' => $periodoId,
                                    'usuario'    => auth()->user()?->username ?? 'SISTEMA',
                                ]
                            );
                        } else {
                            NotaFinal::where('estudiante_id', $item['estudiante_id'])
                                ->where('curso_id', $cursoId)
                                ->where('id_seccion', $seccionId)
                                ->delete();
                        }
                    }
                }
            });

            // Auditoría: j) Evaluación académica y Registro Auxiliar
            AuditoriaService::registrar(
                componente: 'evaluacion_academica',
                operacion: 'ACTUALIZAR',
                descripcion: "Actualización de matriz de notas para Curso ID {$cursoId} (Sección: {$seccionId}, Periodo: {$periodoId})",
                registroId: (string) $cursoId,
                nuevos: [
                    'curso_id'                 => $cursoId,
                    'seccion_id'               => $seccionId,
                    'periodo_id'               => $periodoId,
                    'cant_notas_dimensiones'   => count($request->notas_subcomponentes ?? []),
                    'cant_notas_logros'        => count($request->notas_logros_manuales ?? []),
                    'cant_notas_finales'       => count($request->notas_finales_directas ?? []),
                ],
                resultado: 'EXITO'
            );

            return response()->json(['success' => true, 'message' => 'Calificaciones actualizadas correctamente.']);
        } catch (Throwable $e) {
            Log::error('Error en guardarNotasMatriz: ' . $e->getMessage());

            AuditoriaService::registrar(
                componente: 'evaluacion_academica',
                operacion: 'ACTUALIZAR',
                descripcion: "Fallo al actualizar matriz de notas para Curso ID {$cursoId}",
                registroId: (string) $cursoId,
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return response()->json(['error' => 'Ocurrió un error en el servidor al guardar.'], 500);
        }
    }

    // =========================================================================
    // 2. MÉTODOS EXCLUSIVOS PARA "REGISTRO AUXILIAR (EXCEL MINEDU)"
    // =========================================================================

    /**
     * Obtener matriz con criterios C1-C4 para el Registro Auxiliar
     */
    public function getMatrizRegistroAuxiliar(Request $request): JsonResponse
    {
        $cursoId   = $request->input('curso_id') ?? session('logros_curso_id');
        $seccionId = $request->input('seccion_id') ?? session('logros_seccion_id');
        $periodoId = $request->input('periodo_id') ?? session('logros_periodo_id');

        if (!$cursoId || !$seccionId) {
            return response()->json([
                'estudiantes'          => [],
                'logros'               => [],
                'notas_criterios'      => [],
                'notas_subcomponentes' => [],
                'notas_logros'         => [],
                'notas_finales'        => [],
            ]);
        }

        $horarioId = Horario::where('id_curso', $cursoId)
            ->where('id_seccion', $seccionId)
            ->when($periodoId, fn($q) => $q->where('id_periodo', $periodoId))
            ->value('id');

        // Estudiantes matriculados
        $estudiantes = MatriculaCurso::with(['estudiante.usuario'])
            ->where('horario_id', $horarioId)
            ->get()
            ->map(fn($item) => [
                'estudiante_id'   => $item->estudiante?->id_postulante ?? $item->estudiante?->id,
                'codigo'          => $item->estudiante?->codigo_postulante ?? $item->estudiante?->dni ?? 'S/N',
                'nombre_completo' => $item->estudiante?->nombre_completo ?? 'Sin Nombre',
            ])
            ->filter(fn($e) => !is_null($e['estudiante_id']))
            ->sortBy('nombre_completo')
            ->values();

        // Logros con subcomponentes y criterios C1-C4
        $logros = LogroCurso::with(['subcomponentes.criterios' => function ($query) {
                $query->orderBy('orden', 'asc');
            }])
            ->where('curso_id', $cursoId)
            ->where('id_seccion', $seccionId)
            ->when($periodoId, fn($q) => $q->where('id_periodo', $periodoId))
            ->orderBy('id', 'asc')
            ->get();

        $estudianteIds    = $estudiantes->pluck('estudiante_id');
        $subcomponenteIds = $logros->pluck('subcomponentes')->flatten()->pluck('id');
        $criterioIds      = $logros->pluck('subcomponentes')->flatten()->pluck('criterios')->flatten()->pluck('id');

        $notasCriterios = NotaCriterio::whereIn('estudiante_id', $estudianteIds)
            ->whereIn('criterio_id', $criterioIds)
            ->where('id_seccion', $seccionId)
            ->when($periodoId, fn($q) => $q->where('id_periodo', $periodoId))
            ->get();

        $notasSubcomponentes = NotaSubcomponente::whereIn('estudiante_id', $estudianteIds)
            ->whereIn('subcomponente_id', $subcomponenteIds)
            ->where('id_seccion', $seccionId)
            ->when($periodoId, fn($q) => $q->where('id_periodo', $periodoId))
            ->get();

        $notasLogros = NotaLogro::whereIn('estudiante_id', $estudianteIds)
            ->where('curso_id', $cursoId)
            ->where('id_seccion', $seccionId)
            ->when($periodoId, fn($q) => $q->where('id_periodo', $periodoId))
            ->get();

        $notasFinales = NotaFinal::whereIn('estudiante_id', $estudianteIds)
            ->where('curso_id', $cursoId)
            ->where('id_seccion', $seccionId)
            ->get();

        return response()->json([
            'estudiantes'          => $estudiantes,
            'logros'               => $logros,
            'notas_criterios'      => $notasCriterios,
            'notas_subcomponentes' => $notasSubcomponentes,
            'notas_logros'         => $notasLogros,
            'notas_finales'        => $notasFinales,
        ]);
    }

    /**
     * Guardar notas desde el Registro Auxiliar en cascada:
     * 1. notas_criterios
     * 2. notas_subcomponentes
     * 3. notas_logros
     * 4. nota_final
     */
    public function guardarRegistroAuxiliar(Request $request): JsonResponse
    {
        $request->validate([
            'curso_id'                                 => 'required|integer',
            'seccion_id'                               => 'required|integer',
            'periodo_id'                               => 'required|integer',
            'notas_criterios'                          => 'nullable|array',
            'notas_criterios.*.estudiante_id'          => 'required|integer',
            'notas_criterios.*.criterio_id'            => 'required|integer',
            'notas_criterios.*.nota'                   => 'nullable|numeric|min:0|max:20',
            'notas_subcomponentes'                     => 'nullable|array',
            'notas_subcomponentes.*.estudiante_id'     => 'required|integer',
            'notas_subcomponentes.*.subcomponente_id'  => 'required|integer',
            'notas_subcomponentes.*.nota'              => 'nullable|numeric|min:0|max:20',
            'notas_logros'                             => 'nullable|array',
            'notas_logros.*.estudiante_id'             => 'required|integer',
            'notas_logros.*.logro_curso_id'            => 'required|integer',
            'notas_logros.*.nota'                      => 'nullable|numeric|min:0|max:20',
            'notas_finales'                            => 'nullable|array',
            'notas_finales.*.estudiante_id'            => 'required|integer',
            'notas_finales.*.nota'                     => 'nullable|numeric|min:0|max:20',
        ]);

        $cursoId   = (int) $request->curso_id;
        $seccionId = (int) $request->seccion_id;
        $periodoId = (int) $request->periodo_id;

        // Validar si el periodo está activo y vigente por fecha límite
        $periodo = Periodo::find($periodoId);
        if ($periodo) {
            $ahora = now()->startOfDay();
            if (!$periodo->activo || ($periodo->fecha_fin && $ahora->gt($periodo->fecha_fin))) {
                AuditoriaService::registrar(
                    componente: 'evaluacion_academica',
                    operacion: 'ACTUALIZAR',
                    descripcion: "Intento bloqueado de guardar Registro Auxiliar: Periodo ID {$periodoId} cerrado o vencido",
                    registroId: (string) $cursoId,
                    resultado: 'BLOQUEADO',
                    motivoFallo: 'El periodo académico está inactivo o fuera de fecha'
                );

                return response()->json([
                    'error' => 'El periodo académico está cerrado. No se pueden registrar ni modificar calificaciones.',
                ], 422);
            }
        }

        try {
            DB::transaction(function () use ($request, $cursoId, $seccionId, $periodoId) {
                // ==========================================
                // 1. TABLA: notas_criterios (C1..C4)
                // ==========================================
                if ($request->has('notas_criterios')) {
                    foreach ($request->notas_criterios as $item) {
                        if ($item['nota'] !== null && $item['nota'] !== '') {
                            NotaCriterio::updateOrCreate(
                                [
                                    'estudiante_id' => $item['estudiante_id'],
                                    'criterio_id'   => $item['criterio_id'],
                                    'id_seccion'    => $seccionId,
                                    'id_periodo'    => $periodoId,
                                ],
                                [
                                    'nota' => $item['nota'],
                                ]
                            );
                        } else {
                            NotaCriterio::where('estudiante_id', $item['estudiante_id'])
                                ->where('criterio_id', $item['criterio_id'])
                                ->where('id_seccion', $seccionId)
                                ->where('id_periodo', $periodoId)
                                ->delete();
                        }
                    }
                }

                // ==========================================
                // 2. TABLA: notas_subcomponentes (Dimensiones)
                // ==========================================
                if ($request->has('notas_subcomponentes')) {
                    foreach ($request->notas_subcomponentes as $item) {
                        if ($item['nota'] !== null && $item['nota'] !== '') {
                            NotaSubcomponente::updateOrCreate(
                                [
                                    'estudiante_id'    => $item['estudiante_id'],
                                    'subcomponente_id' => $item['subcomponente_id'],
                                    'id_seccion'       => $seccionId,
                                ],
                                [
                                    'nota'       => $item['nota'],
                                    'id_periodo' => $periodoId,
                                ]
                            );
                        } else {
                            NotaSubcomponente::where('estudiante_id', $item['estudiante_id'])
                                ->where('subcomponente_id', $item['subcomponente_id'])
                                ->where('id_seccion', $seccionId)
                                ->delete();
                        }
                    }
                }

                // ==========================================
                // 3. TABLA: notas_logros (Indicadores)
                // ==========================================
                if ($request->has('notas_logros')) {
                    foreach ($request->notas_logros as $item) {
                        if ($item['nota'] !== null && $item['nota'] !== '') {
                            NotaLogro::updateOrCreate(
                                [
                                    'estudiante_id'  => $item['estudiante_id'],
                                    'logro_curso_id' => $item['logro_curso_id'],
                                    'curso_id'       => $cursoId,
                                    'id_seccion'     => $seccionId,
                                ],
                                [
                                    'nota'       => $item['nota'],
                                    'id_periodo' => $periodoId,
                                ]
                            );
                        } else {
                            NotaLogro::where('estudiante_id', $item['estudiante_id'])
                                ->where('logro_curso_id', $item['logro_curso_id'])
                                ->where('curso_id', $cursoId)
                                ->where('id_seccion', $seccionId)
                                ->delete();
                        }
                    }
                }

                // ==========================================
                // 4. TABLA: nota_final (Nota Final de la UD)
                // ==========================================
                if ($request->has('notas_finales')) {
                    foreach ($request->notas_finales as $item) {
                        if ($item['nota'] !== null && $item['nota'] !== '') {
                            NotaFinal::updateOrCreate(
                                [
                                    'estudiante_id' => $item['estudiante_id'],
                                    'curso_id'      => $cursoId,
                                    'id_seccion'    => $seccionId,
                                ],
                                [
                                    'promedio'   => $item['nota'],
                                    'id_periodo' => $periodoId,
                                    'usuario'    => auth()->user()?->username ?? 'SISTEMA',
                                ]
                            );
                        } else {
                            NotaFinal::where('estudiante_id', $item['estudiante_id'])
                                ->where('curso_id', $cursoId)
                                ->where('id_seccion', $seccionId)
                                ->delete();
                        }
                    }
                }
            });

            // Auditoría: j) Evaluación académica y Registro Auxiliar
            AuditoriaService::registrar(
                componente: 'evaluacion_academica',
                operacion: 'ACTUALIZAR',
                descripcion: "Carga y consolidación de calificaciones en Registro Auxiliar (Curso ID: {$cursoId}, Sección: {$seccionId}, Periodo: {$periodoId})",
                registroId: (string) $cursoId,
                nuevos: [
                    'curso_id'              => $cursoId,
                    'seccion_id'            => $seccionId,
                    'periodo_id'            => $periodoId,
                    'cant_notas_criterios'  => count($request->notas_criterios ?? []),
                    'cant_notas_dimensiones'=> count($request->notas_subcomponentes ?? []),
                    'cant_notas_logros'     => count($request->notas_logros ?? []),
                    'cant_notas_finales'    => count($request->notas_finales ?? []),
                ],
                resultado: 'EXITO'
            );

            return response()->json([
                'success' => true,
                'message' => 'Registro Auxiliar, dimensiones, logros y notas finales guardados correctamente.',
            ]);
        } catch (Throwable $e) {
            Log::error('Error en guardarRegistroAuxiliar: ' . $e->getMessage());

            AuditoriaService::registrar(
                componente: 'evaluacion_academica',
                operacion: 'ACTUALIZAR',
                descripcion: "Fallo al procesar calificaciones del Registro Auxiliar (Curso ID: {$cursoId})",
                registroId: (string) $cursoId,
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return response()->json([
                'error' => 'Ocurrió un error al guardar en la base de datos: ' . $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // 3. MOODLE, REPORTES PDF Y ACTAS
    // =========================================================================

    public function listarEvaluacionesMoodle(): JsonResponse
    {
        $cursoId = session('logros_curso_id');
        $curso   = Curso::find($cursoId);

        if (!$curso || !$curso->moodle_course_id) {
            return response()->json(['evaluaciones' => []]);
        }

        try {
            $evaluaciones = $this->moodleService->listarEvaluacionesDisponibles((int) $curso->moodle_course_id);
            return response()->json(['evaluaciones' => $evaluaciones]);
        } catch (Throwable $e) {
            Log::error('Error al listar evaluaciones de Moodle: ' . $e->getMessage());
            return response()->json(['error' => 'No se pudieron consultar las evaluaciones del Aula Virtual.'], 500);
        }
    }

    public function importarNotasMoodle(Request $request): JsonResponse
    {
        $request->validate([
            'moodle_item_id'   => 'required|integer',
            'es_nota_final'    => 'nullable|boolean',
            'subcomponente_id' => 'nullable|integer|exists:subcomponentes_logro,id',
            'logro_curso_id'   => 'nullable|integer|exists:logros_curso,id',
        ]);

        $cursoId   = session('logros_curso_id');
        $seccionId = session('logros_seccion_id');
        $periodoId = session('logros_periodo_id');

        $curso = Curso::findOrFail($cursoId);

        if (!$curso->moodle_course_id) {
            return response()->json(['error' => 'El curso no está vinculado con el Aula Virtual.'], 400);
        }

        $notasMoodle = $this->moodleService->extraerNotasPorItem((int) $curso->moodle_course_id, (int) $request->moodle_item_id);

        if (empty($notasMoodle)) {
            return response()->json(['error' => 'No se encontraron calificaciones registradas en Moodle.'], 404);
        }

        $horarioId = Horario::where('id_curso', $cursoId)
            ->where('id_seccion', $seccionId)
            ->where('id_periodo', $periodoId)
            ->value('id');

        $matriculados = MatriculaCurso::with(['estudiante.usuario'])
            ->where('horario_id', $horarioId)
            ->get();

        $actualizados = 0;

        try {
            DB::transaction(function () use ($matriculados, $notasMoodle, $request, $cursoId, $seccionId, $periodoId, &$actualizados) {
                foreach ($matriculados as $item) {
                    $postulante = $item->estudiante;
                    if (!$postulante) continue;

                    $usuario = $postulante->usuario;
                    $moodleUserId = $usuario?->moodle_user_id;

                    if (!$moodleUserId) {
                        $dni = $postulante->dni ?? $usuario?->username;
                        if ($dni) {
                            try {
                                $moodleUser = $this->moodleService->obtenerUsuarioPorCampo('username', (string) $dni);
                                if ($moodleUser && isset($moodleUser['id'])) {
                                    $moodleUserId = (int) $moodleUser['id'];
                                    if ($usuario) $usuario->update(['moodle_user_id' => $moodleUserId]);
                                }
                            } catch (Throwable $e) {
                                Log::error("Error vinculando moodle_user_id para DNI {$dni}: " . $e->getMessage());
                            }
                        }
                    }

                    if ($moodleUserId && isset($notasMoodle[$moodleUserId]) && $notasMoodle[$moodleUserId] !== null) {
                        $notaVigesimal = $notasMoodle[$moodleUserId];

                        if ($request->boolean('es_nota_final')) {
                            NotaFinal::updateOrCreate(
                                [
                                    'estudiante_id' => $postulante->id_postulante,
                                    'curso_id'      => $cursoId,
                                    'id_seccion'    => $seccionId,
                                ],
                                [
                                    'promedio'   => $notaVigesimal,
                                    'id_periodo' => $periodoId,
                                    'usuario'    => auth()->user()?->username ?? 'MOODLE_SYNC',
                                ]
                            );
                            $actualizados++;
                        } elseif ($request->filled('subcomponente_id')) {
                            NotaSubcomponente::updateOrCreate(
                                [
                                    'estudiante_id'    => $postulante->id_postulante,
                                    'subcomponente_id' => $request->subcomponente_id,
                                    'id_seccion'       => $seccionId,
                                ],
                                [
                                    'nota'       => $notaVigesimal,
                                    'id_periodo' => $periodoId,
                                ]
                            );
                            $actualizados++;
                        } elseif ($request->filled('logro_curso_id')) {
                            NotaLogro::updateOrCreate(
                                [
                                    'estudiante_id'  => $postulante->id_postulante,
                                    'logro_curso_id' => $request->logro_curso_id,
                                    'curso_id'       => $cursoId,
                                    'id_seccion'     => $seccionId,
                                ],
                                [
                                    'nota'       => $notaVigesimal,
                                    'id_periodo' => $periodoId,
                                ]
                            );
                            $actualizados++;
                        }
                    }
                }
            });

            // Auditoría: l) Interoperabilidad Aula Virtual Moodle & m) Importación
            AuditoriaService::registrar(
                componente: 'interoperabilidad_moodle',
                operacion: 'IMPORTAR',
                descripcion: "Sincronización de notas desde Moodle (Item ID: {$request->moodle_item_id}) para Curso ID {$cursoId}: {$actualizados} calificaciones volcadas",
                registroId: (string) $request->moodle_item_id,
                nuevos: [
                    'curso_id'         => $cursoId,
                    'moodle_course_id' => $curso->moodle_course_id,
                    'moodle_item_id'   => $request->moodle_item_id,
                    'total_notas'      => $actualizados,
                ],
                resultado: 'EXITO'
            );

            return response()->json([
                'success' => true,
                'message' => "Se sincronizaron {$actualizados} calificaciones desde el Aula Virtual.",
            ]);
        } catch (Throwable $e) {
            AuditoriaService::registrar(
                componente: 'interoperabilidad_moodle',
                operacion: 'IMPORTAR',
                descripcion: "Fallo en la importación de calificaciones de Moodle (Item ID: {$request->moodle_item_id})",
                registroId: (string) $request->moodle_item_id,
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return response()->json(['error' => 'Error al sincronizar las notas de Moodle: ' . $e->getMessage()], 500);
        }
    }

    public function generarPdfReporte(Request $request)
    {
        $cursoId   = session('logros_curso_id') ?? $request->input('curso_id');
        $seccionId = session('logros_seccion_id') ?? $request->input('seccion_id');
        $periodoId = session('logros_periodo_id') ?? $request->input('periodo_id');

        $instituto = Instituto::with(['distrito.provincia.departamento'])->first();

        $distrito     = $instituto?->distrito;
        $provincia    = $distrito?->provincia;
        $departamento = $provincia?->departamento;

        $curso   = Curso::with(['semestre', 'planesEstudio'])->findOrFail($cursoId);
        $seccion = Seccion::findOrFail($seccionId);
        $periodo = Periodo::find($periodoId);
        
        $planEstudio = $curso->planesEstudio->first();

        $usuarioDocente = auth()->user();
        $nombreDocente  = $usuarioDocente?->nombre_completo ?? $usuarioDocente?->username ?? 'No asignado';

        $horarioId = Horario::where('id_curso', $cursoId)
            ->where('id_seccion', $seccionId)
            ->where('id_periodo', $periodoId)
            ->value('id');

        $estudiantes = MatriculaCurso::with('estudiante')
            ->where('horario_id', $horarioId)
            ->get()
            ->map(fn($item) => [
                'estudiante_id'   => $item->estudiante?->id_postulante ?? $item->estudiante?->id,
                'codigo'          => $item->estudiante?->codigo_postulante ?? $item->estudiante?->dni ?? 'S/N',
                'nombre_completo' => $item->estudiante?->nombre_completo ?? 'Sin Nombre',
            ])
            ->filter(fn($e) => !is_null($e['estudiante_id']))
            ->sortBy('nombre_completo')
            ->values();

        $logros = LogroCurso::with(['subcomponentes' => function ($query) {
                $query->orderBy('id', 'asc');
            }])
            ->where('curso_id', $cursoId)
            ->where('id_seccion', $seccionId)
            ->where('id_periodo', $periodoId)
            ->orderBy('id', 'asc')
            ->get();

        $estudianteIds    = $estudiantes->pluck('estudiante_id');
        $subcomponenteIds = $logros->pluck('subcomponentes')->flatten()->pluck('id');

        $notasSubcomponentes = NotaSubcomponente::whereIn('estudiante_id', $estudianteIds)
            ->whereIn('subcomponente_id', $subcomponenteIds)
            ->where('id_seccion', $seccionId)
            ->get();

        $notasLogros = NotaLogro::whereIn('estudiante_id', $estudianteIds)
            ->where('curso_id', $cursoId)
            ->where('id_seccion', $seccionId)
            ->get();

        $notasFinales = NotaFinal::whereIn('estudiante_id', $estudianteIds)
            ->where('curso_id', $cursoId)
            ->where('id_seccion', $seccionId)
            ->get();

        $curso_info = [
            'curso'      => $curso->nombre,
            'carrera'    => $planEstudio?->nombre ?? 'Sin Plan de Estudio',
            'periodo'    => $periodo?->nombre ?? 'N/A',
            'semestre'   => $curso->semestre?->nombre ?? 'N/A',
            'docente'    => $nombreDocente,
            'tipo'       => $planEstudio?->tipo ?? 'Transversal',
            'resolucion' => $planEstudio?->resolucion ?? 'Sin Resolución',
        ];

        // Auditoría: m) Importación y exportación de información
        AuditoriaService::registrar(
            componente: 'import_export',
            operacion: 'EXPORTAR',
            descripcion: "Generación de Reporte de Calificaciones en PDF para {$curso->nombre} (Sección {$seccion->nombre})",
            registroId: (string) $curso->id,
            resultado: 'EXITO'
        );

        $pdf = Pdf::loadView('pdf.reporte_notas', compact(
            'instituto',
            'distrito',
            'provincia',
            'departamento',
            'curso',
            'seccion',
            'periodo',
            'curso_info',
            'nombreDocente',
            'estudiantes',
            'logros',
            'notasSubcomponentes',
            'notasLogros',
            'notasFinales'
        ))->setPaper('a4', 'landscape');

        return $pdf->stream("Reporte_Notas_{$seccion->nombre}.pdf");
    }

    public function generarPdfRankingTop5(Request $request)
    {
        $cursoId   = session('logros_curso_id') ?? $request->input('curso_id');
        $seccionId = session('logros_seccion_id') ?? $request->input('seccion_id');
        $periodoId = session('logros_periodo_id') ?? $request->input('periodo_id');

        if (!$cursoId) abort(404, 'No se especificó un curso válido.');

        $instituto = Instituto::with(['distrito.provincia.departamento'])->first();

        $distrito     = $instituto?->distrito;
        $provincia    = $distrito?->provincia;
        $departamento = $provincia?->departamento;

        $curso       = Curso::with(['semestre', 'planesEstudio'])->findOrFail($cursoId);
        $seccion     = Seccion::find($seccionId);
        $periodo     = Periodo::find($periodoId);
        $planEstudio = $curso->planesEstudio->first();

        $usuarioDocente = auth()->user();
        $nombreDocente  = $usuarioDocente?->nombre_completo ?? $usuarioDocente?->username ?? 'No asignado';

        $horarioId = Horario::where('id_curso', $cursoId)
            ->where('id_seccion', $seccionId)
            ->where('id_periodo', $periodoId)
            ->value('id');

        $estudiantes = MatriculaCurso::with('estudiante')
            ->where('horario_id', $horarioId)
            ->get()
            ->map(fn($item) => [
                'estudiante_id'   => $item->estudiante?->id_postulante ?? $item->estudiante?->id,
                'codigo'          => $item->estudiante?->codigo_postulante ?? $item->estudiante?->dni ?? 'S/N',
                'nombre_completo' => $item->estudiante?->nombre_completo ?? 'Sin Nombre',
            ])
            ->filter(fn($e) => !is_null($e['estudiante_id']))
            ->values();

        $estudianteIds = $estudiantes->pluck('estudiante_id');

        $notasFinales = NotaFinal::whereIn('estudiante_id', $estudianteIds)
            ->where('curso_id', $cursoId)
            ->where('id_seccion', $seccionId)
            ->get()
            ->keyBy('estudiante_id');

        $topEstudiantes = $estudiantes->map(function ($est) use ($notasFinales) {
            $notaObj  = $notasFinales->get($est['estudiante_id']);
            $promedio = $notaObj ? ($notaObj->promedio ?? $notaObj->nota ?? $notaObj->promedio_final ?? 0) : 0;

            return [
                'codigo'          => $est['codigo'],
                'nombre_completo' => $est['nombre_completo'],
                'promedio'        => floatval($promedio),
            ];
        })
        ->sortByDesc('promedio')
        ->take(5)
        ->values();

        $curso_info = [
            'curso'      => $curso->nombre,
            'carrera'    => $planEstudio?->nombre ?? 'Sin Plan de Estudio',
            'periodo'    => $periodo?->nombre ?? 'N/A',
            'semestre'   => $curso->semestre?->nombre ?? 'N/A',
            'docente'    => $nombreDocente,
            'tipo'       => $planEstudio?->tipo ?? 'Transversal',
            'resolucion' => $planEstudio?->resolucion ?? 'Sin Resolución',
        ];

        // Auditoría: m) Exportación de información
        AuditoriaService::registrar(
            componente: 'import_export',
            operacion: 'EXPORTAR',
            descripcion: "Generación de Reporte Ranking Top 5 en PDF para {$curso->nombre} (Sección {$seccion?->nombre})",
            registroId: (string) $curso->id,
            resultado: 'EXITO'
        );

        $pdf = Pdf::loadView('pdf.reporte_ranking_top5', compact(
            'instituto',
            'distrito',
            'provincia',
            'departamento',
            'curso',
            'seccion',
            'periodo',
            'curso_info',
            'nombreDocente',
            'topEstudiantes'
        ))->setPaper('a4', 'portrait');

        return $pdf->stream("Ranking_Top5_{$seccion?->nombre}.pdf");
    }

    public function generarPdfNominaMatriculados(Request $request)
    {
        $cursoId   = session('logros_curso_id') ?? $request->input('curso_id');
        $seccionId = session('logros_seccion_id') ?? $request->input('seccion_id');
        $periodoId = session('logros_periodo_id') ?? $request->input('periodo_id');

        if (!$cursoId) abort(404, 'No se especificó un curso válido.');

        $instituto = Instituto::with(['distrito.provincia.departamento'])->first();

        $distrito     = $instituto?->distrito;
        $provincia    = $distrito?->provincia;
        $departamento = $provincia?->departamento;

        $curso       = Curso::with(['semestre', 'planesEstudio'])->findOrFail($cursoId);
        $seccion     = Seccion::find($seccionId);
        $periodo     = Periodo::find($periodoId);
        $planEstudio = $curso->planesEstudio->first();

        $usuarioDocente = auth()->user();
        $nombreDocente  = $usuarioDocente?->nombre_completo ?? $usuarioDocente?->username ?? 'No asignado';

        $horarioId = Horario::where('id_curso', $cursoId)
            ->where('id_seccion', $seccionId)
            ->where('id_periodo', $periodoId)
            ->value('id');

        $estudiantes = MatriculaCurso::with('estudiante')
            ->where('horario_id', $horarioId)
            ->get()
            ->map(fn($item) => [
                'estudiante_id'   => $item->estudiante?->id_postulante ?? $item->estudiante?->id,
                'codigo'          => $item->estudiante?->codigo_postulante ?? $item->estudiante?->dni ?? 'S/N',
                'dni'             => $item->estudiante?->dni ?? 'S/N',
                'nombre_completo' => $item->estudiante?->nombre_completo ?? 'Sin Nombre',
            ])
            ->filter(fn($e) => !is_null($e['estudiante_id']))
            ->sortBy('nombre_completo')
            ->values();

        $curso_info = [
            'curso'      => $curso->nombre,
            'carrera'    => $planEstudio?->nombre ?? 'Sin Plan de Estudio',
            'periodo'    => $periodo?->nombre ?? 'N/A',
            'semestre'   => $curso->semestre?->nombre ?? 'N/A',
            'docente'    => $nombreDocente,
            'tipo'       => $planEstudio?->tipo ?? 'Transversal',
            'resolucion' => $planEstudio?->resolucion ?? 'Sin Resolución',
        ];

        // Auditoría: m) Exportación de información
        AuditoriaService::registrar(
            componente: 'import_export',
            operacion: 'EXPORTAR',
            descripcion: "Generación de Nómina de Matriculados en PDF para {$curso->nombre} (Sección {$seccion?->nombre})",
            registroId: (string) $curso->id,
            resultado: 'EXITO'
        );

        $pdf = Pdf::loadView('pdf.reporte_nomina_matriculados', compact(
            'instituto',
            'distrito',
            'provincia',
            'departamento',
            'curso',
            'seccion',
            'periodo',
            'curso_info',
            'nombreDocente',
            'estudiantes'
        ))->setPaper('a4', 'portrait');

        return $pdf->stream("Nomina_Matriculados_{$seccion?->nombre}.pdf");
    }

    public function actaFinal(Request $request, $id)
    {
        $cursoId   = $id ?? session('logros_curso_id');
        $seccionId = $request->query('seccion') ?? session('logros_seccion_id');
        $turnoId   = $request->query('turno') ?? session('logros_turno_id');

        if (!$cursoId || !$seccionId) {
            abort(400, 'Faltan parámetros de curso o sección válidos.');
        }

        $curso = Curso::with(['moduloformativo', 'semestre', 'planesEstudio', 'docentes'])->findOrFail($cursoId);

        $periodoActivo = Periodo::where('activo', 1)->first() 
            ?? Periodo::find(session('logros_periodo_id')) 
            ?? abort(404, 'No se encontró un periodo académico activo.');

        $usuarioDocente = Auth::user();
        $docenteId = $usuarioDocente?->docente?->id ?? $usuarioDocente?->id;

        $horarioQuery = DB::table('horarios')
            ->where('id_curso', $cursoId)
            ->where('id_periodo', $periodoActivo->id)
            ->where('id_seccion', $seccionId);

        if ($turnoId) {
            $horarioQuery->where('id_turno', $turnoId);
        }

        if ($docenteId) {
            $horarioQuery->where('id_docente', $docenteId);
        }

        $horarioBase = $horarioQuery->first();

        if (!$horarioBase) {
            abort(403, 'No tienes permisos asignados o no existe un horario para este grupo.');
        }

        $instituto = Instituto::first();

        $logoPath = ($instituto && $instituto->logo && file_exists(public_path('storage/' . $instituto->logo)))
            ? public_path('storage/' . $instituto->logo)
            : public_path('images/logo-default.png');

        $estudiantes = DB::table('matricula_cursos as mc')
            ->join('matriculas as m', 'm.id', '=', 'mc.matricula_id')
            ->join('horarios as h', 'h.id', '=', 'mc.horario_id')
            ->join('postulantes as p', 'm.postulante_id', '=', 'p.id_postulante')
            ->whereNotNull('mc.horario_id')
            ->where('h.id_curso', $cursoId)
            ->where('h.id_periodo', $periodoActivo->id)
            ->where('h.id_seccion', $seccionId)
            ->when($turnoId, fn($q) => $q->where('h.id_turno', $turnoId))
            ->select(
                DB::raw('MIN(mc.id) as matricula_curso_id'),
                'm.id as matricula_id',
                'p.id_postulante as id_estudiante',
                DB::raw("CONCAT(p.apellidos, ' ', p.nombres) AS nombre"),
                'p.dni'
            )
            ->groupBy('m.id', 'p.id_postulante', 'p.apellidos', 'p.nombres', 'p.dni')
            ->orderBy('nombre', 'asc')
            ->get();

        $sesiones = DB::table('sesiones')
            ->where('curso_id', $cursoId)
            ->orderBy('fecha', 'asc')
            ->get();

        $asistencias = DB::table('asistencias')
            ->whereIn('matricula_curso_id', $estudiantes->pluck('matricula_curso_id'))
            ->get()
            ->groupBy('matricula_curso_id')
            ->map(fn($items) => $items->keyBy('sesion_id'));

        $logros = DB::table('logros_curso')
            ->where('curso_id', $cursoId)
            ->orderBy('id', 'asc')
            ->get();

        $notas_logros = DB::table('matricula_cursos as mc')
            ->join('matriculas as m', 'm.id', '=', 'mc.matricula_id')
            ->join('horarios as h', 'h.id', '=', 'mc.horario_id')
            ->join('postulantes as p', 'm.postulante_id', '=', 'p.id_postulante')
            ->join('logros_curso as lc', 'lc.curso_id', '=', 'h.id_curso')
            ->leftJoin('notas_logros as nl', function ($join) use ($cursoId) {
                $join->on('nl.estudiante_id', '=', 'p.id_postulante')
                    ->where('nl.curso_id', '=', $cursoId)
                    ->on('nl.logro_curso_id', '=', 'lc.id');
            })
            ->whereNotNull('mc.horario_id')
            ->where('h.id_curso', $cursoId)
            ->where('h.id_periodo', $periodoActivo->id)
            ->where('h.id_seccion', $seccionId)
            ->when($turnoId, fn($q) => $q->where('h.id_turno', $turnoId))
            ->select(
                'p.id_postulante AS id_estudiante',
                DB::raw("CONCAT(p.apellidos, ' ', p.nombres) AS nombre_estudiante"),
                'p.dni',
                'lc.nombre AS nombre_logro',
                'nl.nota AS nota_logro'
            )
            ->distinct()
            ->orderBy('nombre_estudiante', 'asc')
            ->get();

        $lista_estudiantes = [];
        $lista_logros = [];

        foreach ($notas_logros as $fila) {
            $idEstudiante = $fila->id_estudiante;
            $logro        = $fila->nombre_logro;
            $nota         = is_numeric($fila->nota_logro) ? round($fila->nota_logro) : '-';

            if (!in_array($logro, $lista_logros)) {
                $lista_logros[] = $logro;
            }

            if (!isset($lista_estudiantes[$idEstudiante])) {
                $lista_estudiantes[$idEstudiante] = [
                    'nombre' => $fila->nombre_estudiante,
                    'dni'    => $fila->dni,
                    'logros' => [],
                ];
            }

            $lista_estudiantes[$idEstudiante]['logros'][$logro] = $nota;
        }

        $nombreDocente = $usuarioDocente?->nombre_completo ?? $usuarioDocente?->username ?? 'No asignado';

        // Auditoría: j) Evaluación académica y Registro Auxiliar & m) Exportación
        AuditoriaService::registrar(
            componente: 'evaluacion_academica',
            operacion: 'EXPORTAR',
            descripcion: "Generación y descarga de Acta Final Oficial (PDF) para {$curso->nombre} (Sección {$seccionId})",
            registroId: (string) $cursoId,
            nuevos: [
                'curso_id'         => $cursoId,
                'seccion_id'       => $seccionId,
                'periodo_id'       => $periodoActivo->id,
                'total_estudiantes'=> $estudiantes->count(),
                'total_sesiones'   => $sesiones->count(),
            ],
            resultado: 'EXITO'
        );

        $pdf = Pdf::loadView('pdf.acta_final', [
            'instituto'         => $instituto,
            'logoPath'          => $logoPath,
            'curso'             => $curso,
            'estudiantes'       => $estudiantes,
            'sesiones'          => $sesiones,
            'asistencias'       => $asistencias,
            'logros'            => $logros,
            'periodo'           => $periodoActivo,
            'lista_estudiantes' => $lista_estudiantes,
            'lista_logros'      => $lista_logros,
            'nombreDocente'     => $nombreDocente,
        ])->setPaper('a3', 'landscape');

        return $pdf->stream("Acta_Final_UD_{$cursoId}_Sec_{$seccionId}.pdf");
    }
}