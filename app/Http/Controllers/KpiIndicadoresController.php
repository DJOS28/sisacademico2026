<?php

namespace App\Http\Controllers;

use App\Models\Asistencia;
use App\Models\Curso;
use App\Models\Docente;
use App\Models\Instituto;
use App\Models\Matricula;
use App\Models\MatriculaCurso;
use App\Models\NotaFinal;
use App\Models\OfertaLaboral;
use App\Models\Periodo;
use App\Models\Postulacion;
use App\Models\Sesion;
use App\Models\SolicitudTramite;
use App\Models\Supervision;
use App\Models\TransaccionCaja;
use App\Services\AuditoriaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class KpiIndicadoresController extends Controller
{
    public function index(Request $request): Response
    {
        $periodos = Periodo::query()->orderByDesc('id')->get(['id', 'nombre', 'activo']);
        $periodoId = $request->input('periodo_id') 
            ?? $periodos->firstWhere('activo', 1)?->id 
            ?? $periodos->first()?->id;

        $instituto = Instituto::query()->first();
        $indicadores = $this->calcularIndicadores((int) $periodoId);

        return Inertia::render('Reportes/KpiDashboard', [
            'instituto'   => $instituto,
            'periodos'    => $periodos,
            'periodoId'   => (int) $periodoId,
            'kpis'        => $indicadores,
            'fechaEmision'=> now()->format('d/m/Y H:i:s'),
        ]);
    }

    public function obtenerDataAjax(Request $request): JsonResponse
    {
        $periodoId = (int) $request->validate([
            'periodo_id' => ['required', 'integer', 'exists:periodos,id'],
        ])['periodo_id'];

        return response()->json([
            'kpis'         => $this->calcularIndicadores($periodoId),
            'fechaEmision' => now()->format('d/m/Y H:i:s'),
        ]);
    }

    public function exportar(Request $request): StreamedResponse
    {
        $periodoId = (int) $request->input('periodo_id', Periodo::where('activo', 1)->value('id') ?? 1);
        $periodo = Periodo::find($periodoId);
        $instituto = Instituto::first();
        $kpis = $this->calcularIndicadores($periodoId);

        AuditoriaService::registrar(
            componente: 'import_export',
            operacion: 'EXPORTAR',
            descripcion: "Descarga de Informe Ejecutivo de KPIs e Indicadores Regionales (Periodo: {$periodo?->nombre})",
            registroId: (string) $periodoId,
            resultado: 'EXITO'
        );

        $nombreArchivo = 'KPI_Seguimiento_' . str($periodo?->nombre ?? 'General')->slug('_') . '_' . date('Ymd_His') . '.csv';

        return response()->streamDownload(function () use ($kpis, $periodo, $instituto) {
            echo "\xEF\xBB\xBF";
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['REPORTE OFICIAL DE INDICADORES INSTITUCIONALES Y SEGUIMIENTO']);
            fputcsv($handle, ['DIRECTIVA 12.17.3 / 12.17.4 DRE ANCASH']);
            fputcsv($handle, ['Institución', $instituto?->nombre ?? 'IESTP']);
            fputcsv($handle, ['Periodo Académico', $periodo?->nombre ?? 'N/A']);
            fputcsv($handle, ['Fecha de Emisión', now()->format('d/m/Y H:i:s')]);
            fputcsv($handle, []);

            fputcsv($handle, ['EJE ESTRATÉGICO', 'INDICADOR CLAVE (KPI)', 'VALOR / CANTIDAD', 'TASA / PORCENTAJE']);
            fputcsv($handle, ['Matrícula', 'Total Alumnos Matriculados', $kpis['matricula']['total'], '100%']);
            fputcsv($handle, ['Matrícula', 'Regulares', $kpis['matricula']['regulares'], $kpis['matricula']['tasa_regulares'] . '%']);
            fputcsv($handle, ['Rendimiento', 'Aprobados (>=13)', $kpis['evaluacion']['aprobados'], $kpis['evaluacion']['tasa_aprobacion'] . '%']);
            fputcsv($handle, ['Asistencia', 'Tasa Global Asistencia', $kpis['asistencia']['presentes'], $kpis['asistencia']['tasa_asistencia'] . '%']);
            fputcsv($handle, ['Supervisión', 'Aprobadas', $kpis['supervision']['aprobadas'], $kpis['supervision']['tasa_cumplimiento'] . '%']);
            fputcsv($handle, ['Aula Virtual', 'Cursos en Moodle', $kpis['moodle']['cursos_con_moodle'], $kpis['moodle']['tasa_digitalizacion'] . '%']);
            fputcsv($handle, ['Trámites', 'Resueltos', $kpis['tramites']['completados'], $kpis['tramites']['tasa_resolucion'] . '%']);
            fputcsv($handle, ['Caja', 'Total Recaudado', 'S/ ' . number_format($kpis['caja']['total_ingresos'], 2), '—']);
            fputcsv($handle, ['Bolsa Laboral', 'Colocaciones', $kpis['bolsa']['colocados'], $kpis['bolsa']['tasa_colocacion'] . '%']);

            fclose($handle);
        }, $nombreArchivo, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function calcularIndicadores(int $periodoId): array
    {
        // 1. Matrícula y distribución por estados
        $matriculasQuery = Matricula::where('periodo_id', $periodoId);
        $totalMatriculados = (clone $matriculasQuery)->count();
        $regulares    = (clone $matriculasQuery)->where('estado', 'Matriculado')->count();
        $repitencia   = (clone $matriculasQuery)->where('estado', 'Repitencia')->count();
        $retirados    = (clone $matriculasQuery)->where('estado', 'Retirado')->count();
        $convalidados = (clone $matriculasQuery)->where('estado', 'Convalidado')->count();
        $pendientes   = (clone $matriculasQuery)->where('estado', 'Pendiente')->count();

        // 2. Matrícula por Programa de Estudios (SQL nativo directo, sin depender de relaciones en PlanEstudio)
        $matriculaPorPlan = DB::table('matriculas as m')
            ->join('planes_estudio as p', 'p.id', '=', 'm.plan_estudio_id')
            ->where('m.periodo_id', $periodoId)
            ->select('p.nombre', 'p.codigo', DB::raw('COUNT(m.id) as total'))
            ->groupBy('p.id', 'p.nombre', 'p.codigo')
            ->orderByDesc('total')
            ->get()
            ->map(fn($item) => [
                'nombre' => $item->nombre,
                'codigo' => $item->codigo ?? substr($item->nombre, 0, 4),
                'total'  => (int) $item->total,
            ])
            ->values();

        // 3. Asistencia desglosada
        $totalAsistencias = Asistencia::whereHas('sesion.horario', fn($q) => $q->where('id_periodo', $periodoId))->count();
        $presentes    = Asistencia::whereHas('sesion.horario', fn($q) => $q->where('id_periodo', $periodoId))->where('estado', 'presente')->count();
        $tardanzas    = Asistencia::whereHas('sesion.horario', fn($q) => $q->where('id_periodo', $periodoId))->where('estado', 'tardanza')->count();
        $justificados = Asistencia::whereHas('sesion.horario', fn($q) => $q->where('id_periodo', $periodoId))->where('estado', 'justificado')->count();
        $faltas       = Asistencia::whereHas('sesion.horario', fn($q) => $q->where('id_periodo', $periodoId))->where('estado', 'falta')->count();
        $tasaAsistencia = $totalAsistencias > 0 ? round((($presentes + $justificados) / $totalAsistencias) * 100, 1) : 0;

        // 4. Calificaciones y distribución por rangos de notas
        $notasFinales = NotaFinal::where('id_periodo', $periodoId)->pluck('promedio');
        $totalEvaluados = $notasFinales->count();
        $aprobados = $notasFinales->filter(fn($n) => (float) $n >= 12.5)->count();
        $desaprobados = $totalEvaluados - $aprobados;
        $tasaAprobacion = $totalEvaluados > 0 ? round(($aprobados / $totalEvaluados) * 100, 1) : 0;
        $promedioGeneralNotas = $totalEvaluados > 0 ? round($notasFinales->avg(), 2) : 0;

        $rango0_10  = $notasFinales->filter(fn($n) => (float) $n <= 10.4)->count();
        $rango11_12 = $notasFinales->filter(fn($n) => (float) $n >= 10.5 && (float) $n <= 12.4)->count();
        $rango13_16 = $notasFinales->filter(fn($n) => (float) $n >= 12.5 && (float) $n <= 16.4)->count();
        $rango17_20 = $notasFinales->filter(fn($n) => (float) $n >= 16.5)->count();

        // 5. Cursos y Avance
        $asignaturasCursadas = MatriculaCurso::whereHas('matricula', fn($q) => $q->where('periodo_id', $periodoId))->count();
        $promedioCursosPorAlumno = $totalMatriculados > 0 ? round($asignaturasCursadas / $totalMatriculados, 1) : 0;

        // 6. Actividad Docente & Sesiones
        $totalDocentes = Docente::whereHas('horarios', fn($q) => $q->where('id_periodo', $periodoId))->distinct()->count('id');
        $sesionesDictadas = Sesion::whereHas('horario', fn($q) => $q->where('id_periodo', $periodoId))->count();

        // 7. Supervisión Pedagógica
        $supervisiones = Supervision::whereHas('horario', fn($q) => $q->where('id_periodo', $periodoId))->get();
        $totalSupervisiones = $supervisiones->count();
        $supAprobadas = $supervisiones->where('estado', 'APROBADO')->count();
        $supObservadas = $supervisiones->where('estado', 'OBSERVADO')->count();
        $supCriticas = $supervisiones->where('estado', 'CRITICO')->count();
        $tasaCumplimientoSupervision = $totalSupervisiones > 0 ? round(($supAprobadas / $totalSupervisiones) * 100, 1) : 0;

        // 8. Uso de Aula Virtual Moodle
        $cursosOfertados = Curso::whereHas('horarios', fn($q) => $q->where('id_periodo', $periodoId))->distinct()->count('id');
        $cursosConMoodle = Curso::whereHas('horarios', fn($q) => $q->where('id_periodo', $periodoId))
            ->whereNotNull('moodle_course_id')
            ->distinct()
            ->count('id');
        $archivosDigitales = DB::table('archivos_curso')->where('id_periodo', $periodoId)->count();
        $tasaDigitalizacion = $cursosOfertados > 0 ? round(($cursosConMoodle / $cursosOfertados) * 100, 1) : 0;

        // 9. Atención de Trámites
        $tramitesPendientes = SolicitudTramite::whereIn('estado', ['pendiente', 'en_proceso'])->count();
        $tramitesCompletados = SolicitudTramite::whereIn('estado', ['completado', 'procesado', 'aprobado'])->count();
        $tramitesRechazados = SolicitudTramite::where('estado', 'rechazado')->count();
        $totalTramites = $tramitesPendientes + $tramitesCompletados + $tramitesRechazados;
        $tasaResolucionTramites = $totalTramites > 0 ? round(($tramitesCompletados / $totalTramites) * 100, 1) : 0;

        // 10. Operaciones de Pago (Caja)
        $pagos = TransaccionCaja::where('estado', 'aceptado')->where('tipo', 'ingreso');
        $totalRecaudado = (float) (clone $pagos)->sum('monto');
        $totalOperaciones = (clone $pagos)->count();

        // 11. Bolsa Laboral
        $ofertasActivas = OfertaLaboral::where('estado', 'Publicada')->count();
        $totalPostulaciones = Postulacion::count();
        $postulacionesColocadas = Postulacion::where('estado', 'Aceptado')->count();
        $tasaColocacion = $totalPostulaciones > 0 ? round(($postulacionesColocadas / $totalPostulaciones) * 100, 1) : 0;

        return [
            'matricula' => [
                'total'           => $totalMatriculados,
                'regulares'       => $regulares,
                'repitencia'      => $repitencia,
                'retirados'       => $retirados,
                'convalidados'    => $convalidados,
                'pendientes'      => $pendientes,
                'tasa_regulares'  => $totalMatriculados > 0 ? round(($regulares / $totalMatriculados) * 100, 1) : 0,
                'tasa_repitencia' => $totalMatriculados > 0 ? round(($repitencia / $totalMatriculados) * 100, 1) : 0,
                'por_programa'    => $matriculaPorPlan,
            ],
            'trayectoria' => [
                'retirados'      => $retirados,
                'convalidados'   => $convalidados,
                'tasa_desercion' => $totalMatriculados > 0 ? round(($retirados / $totalMatriculados) * 100, 1) : 0,
            ],
            'asistencia' => [
                'total_registros'   => $totalAsistencias,
                'presentes'         => $presentes,
                'tardanzas'         => $tardanzas,
                'justificados'      => $justificados,
                'faltas'            => $faltas,
                'tasa_asistencia'   => $tasaAsistencia,
                'tasa_inasistencia' => $totalAsistencias > 0 ? round(($faltas / $totalAsistencias) * 100, 1) : 0,
            ],
            'evaluacion' => [
                'total_evaluados'   => $totalEvaluados,
                'aprobados'         => $aprobados,
                'desaprobados'      => $desaprobados,
                'tasa_aprobacion'   => $tasaAprobacion,
                'tasa_desaprobacion'=> $totalEvaluados > 0 ? round(($desaprobados / $totalEvaluados) * 100, 1) : 0,
                'promedio_general'  => $promedioGeneralNotas,
                'distribucion'      => [
                    'critico_0_10'   => $rango0_10,
                    'regular_11_12'  => $rango11_12,
                    'bueno_13_16'    => $rango13_16,
                    'excelente_17_20'=> $rango17_20,
                ],
            ],
            'avance' => [
                'asignaturas_cursadas'   => $asignaturasCursadas,
                'promedio_cursos_alumno' => $promedioCursosPorAlumno,
            ],
            'docentes' => [
                'total_docentes'    => $totalDocentes,
                'sesiones_dictadas' => $sesionesDictadas,
            ],
            'supervision' => [
                'total_supervisiones' => $totalSupervisiones,
                'aprobadas'           => $supAprobadas,
                'observadas'          => $supObservadas,
                'criticas'            => $supCriticas,
                'tasa_cumplimiento'   => $tasaCumplimientoSupervision,
            ],
            'moodle' => [
                'cursos_ofertados'   => $cursosOfertados,
                'cursos_con_moodle'  => $cursosConMoodle,
                'archivos_digitales' => $archivosDigitales,
                'tasa_digitalizacion'=> $tasaDigitalizacion,
            ],
            'tramites' => [
                'total'           => $totalTramites,
                'pendientes'      => $tramitesPendientes,
                'completados'     => $tramitesCompletados,
                'rechazados'      => $tramitesRechazados,
                'tasa_resolucion' => $tasaResolucionTramites,
            ],
            'caja' => [
                'total_ingresos' => $totalRecaudado,
                'operaciones'    => $totalOperaciones,
            ],
            'bolsa' => [
                'ofertas_activas' => $ofertasActivas,
                'postulaciones'   => $totalPostulaciones,
                'colocados'       => $postulacionesColocadas,
                'tasa_colocacion' => $tasaColocacion,
            ],
        ];
    }
}