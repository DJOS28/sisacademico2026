<?php

namespace App\Http\Controllers;

use App\Models\Periodo;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $usuario = $request->user();

        // =========================================================
        // 1. DASHBOARD ESTUDIANTE
        // =========================================================
        if ($usuario->tieneRol('Estudiante')) {
            $estudiante = DB::table('postulantes')
                ->where('usuario_id', $usuario->id)
                ->first();

            $estudianteId = $estudiante?->id_postulante;
            $periodoActivo = Periodo::where('activo', 1)->first();

            if (!$periodoActivo || !$estudianteId) {
                return Inertia::render('Dashboard/EstudianteDashboard', [
                    'dashboardType' => 'estudiante',
                    'periodo'       => $periodoActivo->nombre ?? 'Sin periodo activo',
                    'summary'       => [
                        'total_cursos'          => 0,
                        'promedio_general'      => '00.00',
                        'porcentaje_asistencia' => '0%',
                        'pagos_realizados'      => '0',
                    ],
                    'todaySchedule' => [],
                    'announcements' => [],
                ]);
            }

            $matriculaActiva = DB::table('matriculas')
                ->where('postulante_id', $estudianteId)
                ->where('periodo_id', $periodoActivo->id)
                ->where('estado', 'Matriculado')
                ->first();

            $totalCursos = 0;
            $todaySchedule = collect();
            $porcentajeAsistencia = 100;
            $planEstudioId = $matriculaActiva?->plan_estudio_id;

            if ($matriculaActiva) {
                $totalCursos = DB::table('matricula_cursos')
                    ->where('matricula_id', $matriculaActiva->id)
                    ->count();

                $diasEnum = [
                    1 => 'Lunes', 2 => 'Martes', 3 => 'Miércoles',
                    4 => 'Jueves', 5 => 'Viernes', 6 => 'Sábado', 7 => 'Domingo'
                ];
                $diaHoy = $diasEnum[Carbon::now()->dayOfWeekIso] ?? 'Lunes';

                $todaySchedule = DB::table('matricula_cursos as mc')
                    ->join('horarios as h', 'h.id', '=', 'mc.horario_id')
                    ->join('cursos as c', 'c.id', '=', 'mc.curso_id')
                    ->leftJoin('secciones as s', 's.id', '=', 'h.id_seccion')
                    ->leftJoin('aulas as a', 'a.id', '=', 'h.id_aula')
                    ->leftJoin('docentes as d', 'd.id', '=', 'h.id_docente')
                    ->where('mc.matricula_id', $matriculaActiva->id)
                    ->where('h.dia', $diaHoy)
                    ->select(
                        'h.hora_inicio',
                        'h.hora_fin',
                        'c.nombre as curso_nombre',
                        's.nombre as seccion_nombre',
                        'a.nombre as aula_nombre',
                        'a.numero_aula',
                        DB::raw("CONCAT(d.nombre, ' ', d.apellido) as docente_nombre")
                    )
                    ->orderBy('h.hora_inicio', 'asc')
                    ->get()
                    ->map(fn($item) => [
                        'time'   => Carbon::parse($item->hora_inicio)->format('H:i') . ' - ' . Carbon::parse($item->hora_fin)->format('H:i'),
                        'title'  => $item->curso_nombre,
                        'detail' => ($item->aula_nombre ? "Aula: {$item->aula_nombre}" : 'Aula sin asignar') . ($item->docente_nombre ? " • Prof. {$item->docente_nombre}" : ''),
                        'status' => 'Programado',
                    ]);

                $asistenciasCount = DB::table('asistencias as a')
                    ->join('matricula_cursos as mc', 'mc.id', '=', 'a.matricula_curso_id')
                    ->where('mc.matricula_id', $matriculaActiva->id)
                    ->select(
                        DB::raw("COUNT(CASE WHEN UPPER(a.estado) IN ('P', 'PRESENTE') THEN 1 END) as presentes"),
                        DB::raw("COUNT(a.id) as total_sesiones")
                    )
                    ->first();

                if ($asistenciasCount && $asistenciasCount->total_sesiones > 0) {
                    $porcentajeAsistencia = round(($asistenciasCount->presentes / $asistenciasCount->total_sesiones) * 100);
                }
            }

            $promedioAcumulado = DB::table('nota_final')
                ->where('estudiante_id', $estudianteId)
                ->avg('promedio');

            $promedioTexto = $promedioAcumulado ? number_format($promedioAcumulado, 2) : '—';

            $pagosCount = DB::table('pagos_postulantes')
                ->where('postulante_id', $estudianteId)
                ->where('estado', 'aceptado')
                ->count();

            // =========================================================================
            // ANUNCIOS FILTRADOS POR PLAN DE ESTUDIO DEL ALUMNO MATRICULADO
            // =========================================================================
            $announcements = collect();

            if ($planEstudioId) {
                $announcements = DB::table('anuncios')
                    ->where('activo', 1)
                    ->where('plan_estudio_id', $planEstudioId)
                    ->orderByDesc('created_at')
                    ->limit(4)
                    ->get()
                    ->map(fn($ann) => [
                        'title'  => $ann->titulo,
                        'detail' => $ann->contenido,
                        'date'   => Carbon::parse($ann->created_at)->diffForHumans(),
                    ]);
            }

            return Inertia::render('Dashboard/EstudianteDashboard', [
                'dashboardType' => 'estudiante',
                'periodo'       => $periodoActivo->nombre,
                'summary'       => [
                    'total_cursos'          => $totalCursos,
                    'promedio_general'      => $promedioTexto,
                    'porcentaje_asistencia' => "{$porcentajeAsistencia}%",
                    'pagos_realizados'      => $pagosCount,
                ],
                'todaySchedule' => $todaySchedule,
                'announcements' => $announcements,
            ]);
        }

        // =========================================================
        // 2. DASHBOARD DOCENTE
        // =========================================================
        if ($usuario->tieneRol('Docente')) {
            $docente = DB::table('docentes')->where('usuario_id', $usuario->id)->first();
            $docenteId = $docente?->id;
            $periodoActivo = Periodo::where('activo', 1)->first();

            if (!$periodoActivo || !$docenteId) {
                return Inertia::render('Dashboard/DocenteDashboard', [
                    'dashboardType' => 'docente',
                    'periodo'       => $periodoActivo->nombre ?? 'Sin periodo activo',
                    'summary'       => [
                        'total_cursos'            => 0,
                        'total_estudiantes'       => 0,
                        'asistencias_pendientes'  => 0,
                        'evaluaciones_pendientes' => 0,
                    ],
                    'todaySchedule' => [],
                ]);
            }

            $totalCursos = DB::table('horarios')
                ->where('id_docente', $docenteId)
                ->where('id_periodo', $periodoActivo->id)
                ->distinct('id_curso', 'id_seccion')
                ->count('id');

            $totalEstudiantes = DB::table('matricula_cursos as mc')
                ->join('horarios as h', 'h.id', '=', 'mc.horario_id')
                ->where('h.id_docente', $docenteId)
                ->where('h.id_periodo', $periodoActivo->id)
                ->distinct('mc.matricula_id')
                ->count('mc.matricula_id');

            $diasEnum = [1 => 'Lunes', 2 => 'Martes', 3 => 'Miércoles', 4 => 'Jueves', 5 => 'Viernes', 6 => 'Sábado', 7 => 'Domingo'];
            $diaHoy = $diasEnum[Carbon::now()->dayOfWeekIso] ?? 'Lunes';

            $todaySchedule = DB::table('horarios as h')
                ->join('cursos as c', 'c.id', '=', 'h.id_curso')
                ->leftJoin('secciones as s', 's.id', '=', 'h.id_seccion')
                ->leftJoin('aulas as a', 'a.id', '=', 'h.id_aula')
                ->where('h.id_docente', $docenteId)
                ->where('h.id_periodo', $periodoActivo->id)
                ->where('h.dia', $diaHoy)
                ->select('h.hora_inicio', 'h.hora_fin', 'c.nombre as curso_nombre', 's.nombre as seccion_nombre', 'a.nombre as aula_nombre', 'a.numero_aula')
                ->orderBy('h.hora_inicio', 'asc')
                ->get()
                ->map(fn($item) => [
                    'time'   => Carbon::parse($item->hora_inicio)->format('H:i') . ' - ' . Carbon::parse($item->hora_fin)->format('H:i'),
                    'title'  => $item->curso_nombre,
                    'detail' => "Sección: " . ($item->seccion_nombre ?? 'A') . ($item->aula_nombre ? " • Aula: {$item->aula_nombre}" : ''),
                    'status' => 'Programada',
                ]);

            $asistenciasPendientes = DB::table('sesiones as s')
                ->join('horarios as h', 'h.id', '=', 's.horario_id')
                ->leftJoin('asistencias as a', 'a.sesion_id', '=', 's.id_sesion')
                ->where('h.id_docente', $docenteId)
                ->where('h.id_periodo', $periodoActivo->id)
                ->whereNull('a.id')
                ->distinct('s.id_sesion')
                ->count('s.id_sesion');

            return Inertia::render('Dashboard/DocenteDashboard', [
                'dashboardType' => 'docente',
                'periodo'       => $periodoActivo->nombre,
                'summary'       => [
                    'total_cursos'            => 0,
                    'total_estudiantes'       => $totalEstudiantes,
                    'asistencias_pendientes'  => $asistenciasPendientes,
                    'evaluaciones_pendientes' => 0,
                ],
                'todaySchedule' => $todaySchedule,
            ]);
        }

        // =========================================================
        // 3. DASHBOARD ADMINISTRATIVO
        // =========================================================
        $periodoActivo = Periodo::where('activo', 1)->first() ?? Periodo::latest('id')->first();

        $usuariosActivos = DB::table('usuarios')->where('status', 'Disponible')->count();
        $totalPostulantes = DB::table('postulantes')->count();
        $matriculadosCount = DB::table('matriculas')
            ->when($periodoActivo, fn($q) => $q->where('periodo_id', $periodoActivo->id))
            ->where('estado', 'Matriculado')
            ->count();
        $docentesCount = DB::table('docentes')->count();
        $tituladosCount = DB::table('titulaciones')->where('estado', 'Titulado')->count();
        $convalidadosCount = DB::table('convalidaciones')->where('estado', 'Aprobado')->count();

        // A. Indicador 1: Admisión vs Matrículas por Programa de Estudio
        $dataAdmisionMatricula = DB::table('planes_estudio as pe')
            ->leftJoin('inscripcion as i', 'i.id_plan', '=', 'pe.id')
            ->leftJoin('matriculas as m', function ($join) use ($periodoActivo) {
                $join->on('m.postulante_id', '=', 'i.id_postulante')
                    ->on('m.plan_estudio_id', '=', 'pe.id')
                    ->where('m.estado', '=', 'Matriculado');
                if ($periodoActivo) {
                    $join->where('m.periodo_id', '=', $periodoActivo->id);
                }
            })
            ->select(
                'pe.nombre as carrera',
                DB::raw('COUNT(DISTINCT i.id_postulante) as postulantes'),
                DB::raw("COUNT(DISTINCT CASE WHEN i.estado IN ('aceptado', 'matriculado') THEN i.id_postulante END) as ingresantes"),
                DB::raw('COUNT(DISTINCT m.id) as matriculados')
            )
            ->groupBy('pe.id', 'pe.nombre')
            ->limit(5)
            ->get();

        // B. Indicador 2: Egresados vs Titulados por Periodos Lectivos
        $dataEgresadosTitulados = DB::table('periodos as per')
            ->leftJoin('titulaciones as t', 't.created_at', '>=', DB::raw('per.fecha_inicio'))
            ->select(
                'per.nombre as periodo',
                DB::raw("COUNT(DISTINCT t.id) as expedientes"),
                DB::raw("COUNT(DISTINCT CASE WHEN t.estado = 'Titulado' THEN t.id END) as titulados")
            )
            ->groupBy('per.id', 'per.nombre')
            ->orderByDesc('per.id')
            ->limit(5)
            ->get()
            ->reverse()
            ->values();

        // C. Indicador 3: Repitencia y Alumnos en Riesgo por Curso
        $dataRepitenciaCursos = DB::table('cursos as c')
            ->leftJoin('repitencias as r', function ($join) use ($periodoActivo) {
                $join->on('r.curso_id', '=', 'c.id');
                if ($periodoActivo) {
                    $join->where('r.periodo_id', '=', $periodoActivo->id);
                }
            })
            ->leftJoin('nota_final as nf', function ($join) use ($periodoActivo) {
                $join->on('nf.curso_id', '=', 'c.id');
                if ($periodoActivo) {
                    $join->where('nf.id_periodo', '=', $periodoActivo->id);
                }
            })
            ->select(
                'c.nombre as curso',
                DB::raw("COUNT(DISTINCT r.id_reptencia) + COUNT(DISTINCT CASE WHEN nf.promedio < 13 THEN nf.id END) as desaprobados")
            )
            ->groupBy('c.id', 'c.nombre')
            ->having('desaprobados', '>', 0)
            ->orderByDesc('desaprobados')
            ->limit(5)
            ->get();

        // D. Indicador 4: Distribución de Convalidaciones por Estado
        $dataConvalidaciones = DB::table('convalidaciones')
            ->select(
                DB::raw("estado as tipo"),
                DB::raw("COUNT(*) as total")
            )
            ->groupBy('estado')
            ->get();

        // E. Indicador 5: Horarios / Carga Horaria por Docente
        $dataCargaDocente = DB::table('docentes as d')
            ->join('horarios as h', 'h.id_docente', '=', 'd.id')
            ->when($periodoActivo, fn($q) => $q->where('h.id_periodo', $periodoActivo->id))
            ->select(
                DB::raw("CONCAT(d.nombre, ' ', SUBSTRING(d.apellido, 1, 1), '.') as docente"),
                DB::raw("COUNT(h.id) * 2 as horas_lectivas")
            )
            ->groupBy('d.id', 'd.nombre', 'd.apellido')
            ->limit(6)
            ->get();

        return Inertia::render('Dashboard/AdminDashboard', [
            'dashboardType'         => 'administrativo',
            'periodo'               => $periodoActivo->nombre ?? 'Sin periodo activo',
            'lastUpdated'           => Carbon::now()->format('d/m/Y H:i'),
            'summary'               => [
                'usuarios_activos'   => $usuariosActivos,
                'postulantes'        => $totalPostulantes,
                'matriculados'       => $matriculadosCount,
                'docentes'           => $docentesCount,
                'convalidados'       => $convalidadosCount,
                'titulados'          => $tituladosCount,
            ],
            'dataAdmisionMatricula' => $dataAdmisionMatricula,
            'dataEgresadosTitulados'=> $dataEgresadosTitulados,
            'dataRepitenciaCursos'  => $dataRepitenciaCursos,
            'dataConvalidaciones'   => $dataConvalidaciones,
            'dataCargaDocente'      => $dataCargaDocente,
        ]);
    }
}