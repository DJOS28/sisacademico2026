<?php

namespace App\Http\Controllers;

use App\Models\Asistencia;
use App\Models\Curso;
use App\Models\Horario;
use App\Models\Instituto;
use App\Models\MatriculaCurso;
use App\Models\Periodo;
use App\Models\Seccion;
use App\Models\Sesion;
use App\Services\AuditoriaService;
use App\Services\NotificacionService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class AsistenciaDocenteController extends Controller
{
    /**
     * Vista principal del módulo Control de Asistencias
     */
    public function index(Request $request): Response
    {
        $usuario = Auth::user();
        $docenteId = $usuario?->docente?->id ?? $usuario?->id;

        $periodoActivo = Periodo::where('activo', 1)->first()
            ?? Periodo::latest('id')->first();

        $periodoId = $request->input('periodo_id', session('asistencia_periodo_id', $periodoActivo?->id));

        $periodoSeleccionado = Periodo::find($periodoId);
        $periodoCerrado = false;

        if ($periodoSeleccionado) {
            $ahora = now()->startOfDay();
            $periodoCerrado = !$periodoSeleccionado->activo
                || ($periodoSeleccionado->fecha_fin && $ahora->gt($periodoSeleccionado->fecha_fin));
        }

        // Horarios del docente filtrados por periodo (únicos por curso y sección)
        $horariosDocente = Horario::with(['curso.semestre', 'seccion', 'planEstudio'])
            ->where('id_periodo', $periodoId)
            ->when($docenteId, fn($q) => $q->where('id_docente', $docenteId))
            ->get()
            ->unique(fn($h) => $h->id_curso . '_' . $h->id_seccion)
            ->values();

        $cursoId = $request->input('curso_id', session('asistencia_curso_id'));
        $seccionId = $request->input('seccion_id', session('asistencia_seccion_id'));

        if ((!$cursoId || !$seccionId) && $horariosDocente->isNotEmpty()) {
            $primerHorario = $horariosDocente->first();
            $cursoId = $primerHorario->id_curso;
            $seccionId = $primerHorario->id_seccion;
        }

        session([
            'asistencia_curso_id'   => $cursoId,
            'asistencia_seccion_id' => $seccionId,
            'asistencia_periodo_id' => $periodoId,
        ]);

        $cursoSeleccionado = $cursoId ? Curso::with('semestre')->find($cursoId) : null;
        $seccionSeleccionada = $seccionId ? Seccion::find($seccionId) : null;

        return Inertia::render('Docentes/Asistencias/Index', [
            'periodos'            => Periodo::select('id', 'nombre', 'activo', 'fecha_inicio', 'fecha_fin')->get(),
            'periodoActivo'       => $periodoActivo,
            'periodoSeleccionado' => $periodoSeleccionado,
            'periodoCerrado'      => $periodoCerrado,
            'horariosDocente'     => $horariosDocente->map(fn($h) => [
                'curso_id'       => $h->id_curso,
                'curso_nombre'   => $h->curso?->nombre ?? 'Sin Curso',
                'seccion_id'     => $h->id_seccion,
                'seccion_nombre' => $h->seccion?->nombre ?? 'A',
                'plan_nombre'    => $h->planEstudio?->nombre ?? 'Plan General',
                'semestre'       => $h->curso?->semestre?->nombre ?? 'I',
            ]),
            'cursoSeleccionado'   => $cursoSeleccionado,
            'seccionSeleccionada' => $seccionSeleccionada,
        ]);
    }

    /**
     * Cambiar contexto de curso y sección
     */
    public function setContext(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'curso_id'   => 'required|integer|exists:cursos,id',
            'seccion_id' => 'required|integer|exists:secciones,id',
            'periodo_id' => 'required|integer|exists:periodos,id',
        ]);

        $periodo = Periodo::findOrFail($validated['periodo_id']);

        session([
            'asistencia_curso_id'   => $validated['curso_id'],
            'asistencia_seccion_id' => $validated['seccion_id'],
            'asistencia_periodo_id' => $validated['periodo_id'],
        ]);

        $ahora = now()->startOfDay();
        $periodoCerrado = !$periodo->activo
            || ($periodo->fecha_fin && $ahora->gt($periodo->fecha_fin));

        $redirect = redirect()->route('docente.asistencias.index', [
            'curso_id'   => $validated['curso_id'],
            'seccion_id' => $validated['seccion_id'],
            'periodo_id' => $validated['periodo_id'],
        ]);

        if ($periodoCerrado) {
            return $redirect->with('warning', 'Periodo cerrado: La fecha límite ha vencido. El registro se encuentra en modo solo lectura.');
        }

        return $redirect;
    }

    /**
     * Matriz de datos: Estudiantes ordenados alfabéticamente + Sesiones + Asistencias
     */
    public function getMatriz(Request $request): JsonResponse
    {
        $cursoId   = (int) $request->curso_id;
        $seccionId = (int) $request->seccion_id;
        $periodoId = (int) $request->periodo_id;

        $horarioId = Horario::where('id_curso', $cursoId)
            ->where('id_seccion', $seccionId)
            ->when($periodoId, fn($q) => $q->where('id_periodo', $periodoId))
            ->value('id');

        // 1. Estudiantes matriculados ordenados alfabéticamente
        $estudiantes = MatriculaCurso::with('estudiante')
            ->where('horario_id', $horarioId)
            ->get()
            ->map(fn($item) => [
                'matricula_curso_id' => $item->id,
                'codigo'             => $item->estudiante?->codigo_postulante ?? $item->estudiante?->dni ?? 'S/N',
                'nombre_completo'    => $item->estudiante?->nombre_completo ?? 'Sin Nombre',
            ])
            ->sortBy('nombre_completo', SORT_NATURAL | SORT_FLAG_CASE)
            ->values();

        // 2. Sesiones programadas
        $sesiones = Sesion::where('curso_id', $cursoId)
            ->when($horarioId, fn($q) => $q->where('horario_id', $horarioId))
            ->orderBy('fecha', 'asc')
            ->orderBy('id_sesion', 'asc')
            ->get();

        // 3. Asistencias guardadas
        $asistencias = Asistencia::whereIn('sesion_id', $sesiones->pluck('id_sesion'))
            ->whereIn('matricula_curso_id', $estudiantes->pluck('matricula_curso_id'))
            ->get();

        return response()->json([
            'estudiantes' => $estudiantes,
            'sesiones'    => $sesiones,
            'asistencias' => $asistencias,
        ]);
    }

    /**
     * Guardar asistencias masivas de una sesión y notificar a los estudiantes
     */
    public function guardar(Request $request): JsonResponse
    {
        $request->validate([
            'sesion_id'                        => 'required|exists:sesiones,id_sesion',
            'fecha'                            => 'required|date',
            'periodo_id'                       => 'required|integer',
            'asistencias'                      => 'required|array',
            'asistencias.*.matricula_curso_id' => 'required|exists:matricula_cursos,id',
            'asistencias.*.estado'             => 'required|in:presente,falta,tardanza,justificado',
            'asistencias.*.observaciones'      => 'nullable|string|max:255',
        ]);

        $periodo = Periodo::find($request->periodo_id);
        if ($periodo) {
            $ahora = now()->startOfDay();
            if (!$periodo->activo || ($periodo->fecha_fin && $ahora->gt($periodo->fecha_fin))) {
                AuditoriaService::registrar(
                    componente: 'asistencia',
                    operacion: 'ACTUALIZAR',
                    descripcion: "Intento bloqueado de registrar asistencia: periodo ID {$request->periodo_id} cerrado",
                    registroId: (string) $request->sesion_id,
                    resultado: 'BLOQUEADO',
                    motivoFallo: 'El periodo académico está inactivo o vencido'
                );

                return response()->json([
                    'error' => 'El periodo académico está cerrado. No se pueden modificar las asistencias.',
                ], 422);
            }
        }

        try {
            $sesion = Sesion::with(['curso', 'horario'])->find($request->sesion_id);
            $conteoEstados = [
                'presente'    => 0,
                'falta'       => 0,
                'tardanza'    => 0,
                'justificado' => 0,
            ];

            DB::transaction(function () use ($request, &$conteoEstados) {
                foreach ($request->asistencias as $item) {
                    $estado = $item['estado'];
                    if (isset($conteoEstados[$estado])) {
                        $conteoEstados[$estado]++;
                    }

                    Asistencia::updateOrCreate(
                        [
                            'sesion_id'          => $request->sesion_id,
                            'matricula_curso_id' => $item['matricula_curso_id'],
                        ],
                        [
                            'fecha'         => $request->fecha,
                            'estado'        => $estado,
                            'observaciones' => $item['observaciones'] ?? null,
                        ]
                    );
                }
            });

            // Auditoría: i) Registro de asistencia
            AuditoriaService::registrar(
                componente: 'asistencia',
                operacion: 'ACTUALIZAR',
                descripcion: "Control de asistencia registrado para {$sesion?->curso?->nombre} ({$sesion?->nombre}) - Fecha: {$request->fecha} (" . count($request->asistencias) . " alumnos evaluados)",
                registroId: (string) $request->sesion_id,
                nuevos: [
                    'sesion_id'       => $request->sesion_id,
                    'fecha'           => $request->fecha,
                    'periodo_id'      => $request->periodo_id,
                    'resumen_estados' => $conteoEstados,
                    'total_alumnos'   => count($request->asistencias),
                ],
                resultado: 'EXITO'
            );

            // =========================================================
            // NOTIFICACIÓN AUTOMÁTICA A LOS ESTUDIANTES DEL CURSO
            // =========================================================
            if ($sesion) {
                $nombreCurso = $sesion->curso?->nombre ?? 'tu unidad didáctica';
                $nombreSesion = $sesion->nombre ?? 'la sesión';
                $seccionId = $sesion->horario?->id_seccion;

                NotificacionService::notificarEstudiantesDeCurso(
                    $sesion->curso_id,
                    $seccionId,
                    $request->periodo_id,
                    "Se registró la asistencia de {$nombreSesion} en {$nombreCurso}.",
                    'asistencia',
                    route('estudiante.asistencia')
                );
            }

            return response()->json([
                'success' => true,
                'message' => 'Asistencias guardadas y estudiantes notificados correctamente.',
            ]);
        } catch (\Throwable $e) {
            Log::error('Error en AsistenciaDocenteController@guardar: ' . $e->getMessage());

            AuditoriaService::registrar(
                componente: 'asistencia',
                operacion: 'ACTUALIZAR',
                descripcion: "Fallo al registrar asistencia en Sesión ID {$request->sesion_id}",
                registroId: (string) $request->sesion_id,
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return response()->json([
                'error' => 'Ocurrió un error al guardar la asistencia: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generar reporte consolidado de asistencia en PDF
     */
    public function generarPdfReporte(Request $request)
    {
        $cursoId   = $request->input('curso_id', session('asistencia_curso_id'));
        $seccionId = $request->input('seccion_id', session('asistencia_seccion_id'));
        $periodoId = $request->input('periodo_id', session('asistencia_periodo_id'));

        $instituto    = Instituto::with(['distrito.provincia.departamento'])->first();
        $distrito     = $instituto?->distrito;
        $provincia    = $distrito?->provincia;
        $departamento = $provincia?->departamento;

        $curso       = Curso::with(['semestre', 'planesEstudio'])->findOrFail($cursoId);
        $seccion     = Seccion::findOrFail($seccionId);
        $periodo     = Periodo::find($periodoId);
        $planEstudio = $curso->planesEstudio->first();

        $usuarioDocente = Auth::user();
        $nombreDocente  = $usuarioDocente?->nombre_completo ?? $usuarioDocente?->username ?? 'DOCENTE NO ASIGNADO';

        $horarioId = Horario::where('id_curso', $cursoId)
            ->where('id_seccion', $seccionId)
            ->where('id_periodo', $periodoId)
            ->value('id');

        $estudiantes = MatriculaCurso::with('estudiante')
            ->where('horario_id', $horarioId)
            ->get()
            ->map(fn ($item) => [
                'matricula_curso_id' => $item->id,
                'codigo'             => $item->estudiante?->codigo_postulante ?? $item->estudiante?->dni ?? 'S/N',
                'nombre_completo'    => $item->estudiante?->nombre_completo ?? 'Sin Nombre',
            ])
            ->sortBy('nombre_completo', SORT_NATURAL | SORT_FLAG_CASE)
            ->values();

        $sesiones = Sesion::where('curso_id', $cursoId)
            ->when($horarioId, fn ($query) => $query->where('horario_id', $horarioId))
            ->orderBy('fecha', 'asc')
            ->orderBy('id_sesion', 'asc')
            ->get();

        $asistencias = Asistencia::whereIn('sesion_id', $sesiones->pluck('id_sesion'))
            ->whereIn('matricula_curso_id', $estudiantes->pluck('matricula_curso_id'))
            ->get();

        // Auditoría: m) Importación y exportación de información
        AuditoriaService::registrar(
            componente: 'import_export',
            operacion: 'EXPORTAR',
            descripcion: "Descarga de reporte consolidado de asistencia en PDF ({$curso->nombre} - Sección {$seccion->nombre})",
            registroId: (string) $curso->id,
            nuevos: [
                'curso_id'        => $curso->id,
                'seccion_id'      => $seccion->id,
                'periodo_id'      => $periodoId,
                'total_alumnos'   => $estudiantes->count(),
                'total_sesiones'  => $sesiones->count(),
            ],
            resultado: 'EXITO'
        );

        $pdf = Pdf::loadView('pdf.reporte_asistencia', compact(
            'instituto',
            'distrito',
            'provincia',
            'departamento',
            'curso',
            'seccion',
            'periodo',
            'planEstudio',
            'nombreDocente',
            'estudiantes',
            'sesiones',
            'asistencias'
        ))->setPaper('a4', 'landscape');

        return $pdf->stream("Reporte_Asistencia_{$seccion->nombre}.pdf");
    }
}