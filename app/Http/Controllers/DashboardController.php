<?php

namespace App\Http\Controllers;

use App\Models\Periodo;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $usuario = $request->user();

        // ==========================================
        // 1. DASHBOARD ESTUDIANTE
        // ==========================================
        if ($usuario->tieneRol('Estudiante')) {
            // Obtener el registro de la tabla postulantes vinculado al usuario
            $estudiante = DB::table('postulantes')
                ->where('usuario_id', $usuario->id)
                ->first();

            $estudianteId = $estudiante?->id_postulante;

            // Obtener el Periodo Activo
            $periodoActivo = Periodo::where('activo', 1)->first();

            if (!$periodoActivo || !$estudianteId) {
                return Inertia::render('Dashboard/EstudianteDashboard', [
                    'dashboardType' => 'estudiante',
                    'periodo'       => $periodoActivo->nombre ?? 'Sin periodo activo',
                    'summary'       => [
                        'total_cursos'    => 0,
                        'promedio_general' => '00.00',
                        'porcentaje_asistencia' => '0%',
                        'pagos_realizados' => '0',
                    ],
                    'todaySchedule' => [],
                    'announcements' => [],
                ]);
            }

            // Matrícula activa del estudiante en el periodo actual
            $matriculaActiva = DB::table('matriculas')
                ->where('postulante_id', $estudianteId)
                ->where('periodo_id', $periodoActivo->id)
                ->where('estado', 'Matriculado')
                ->first();

            $totalCursos = 0;
            $todaySchedule = collect();
            $porcentajeAsistencia = 100;

            if ($matriculaActiva) {
                // Total Cursos Matriculados
                $totalCursos = DB::table('matricula_cursos')
                    ->where('matricula_id', $matriculaActiva->id)
                    ->count();

                // Horario de Hoy
                $diasEnum = [
                    1 => 'Lunes',
                    2 => 'Martes',
                    3 => 'Miércoles',
                    4 => 'Jueves',
                    5 => 'Viernes',
                    6 => 'Sábado',
                    7 => 'Domingo',
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
                    ->map(function ($item) {
                        $aula = $item->aula_nombre ? "Aula: {$item->aula_nombre}" . ($item->numero_aula ? " ({$item->numero_aula})" : '') : 'Aula no asignada';
                        $docente = $item->docente_nombre ? " • Prof. {$item->docente_nombre}" : '';
                        
                        return [
                            'time'   => Carbon::parse($item->hora_inicio)->format('H:i') . ' - ' . Carbon::parse($item->hora_fin)->format('H:i'),
                            'title'  => $item->curso_nombre,
                            'detail' => "{$aula}{$docente}",
                            'status' => 'Programado',
                        ];
                    });

                // Cálculo Porcentaje Asistencia Global del Periodo
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

            // Promedio Acumulado / Promedio General
            $promedioAcumulado = DB::table('nota_final')
                ->where('estudiante_id', $estudianteId)
                ->avg('promedio');

            $promedioTexto = $promedioAcumulado ? number_format($promedioAcumulado, 2) : '—';

            // Cantidad de pagos o transacciones registradas
            $pagosCount = DB::table('pagos_postulantes')
                ->where('postulante_id', $estudianteId)
                ->where('estado', 'aceptado')
                ->count();

            // Anuncios Institucionales para el Plan de Estudio del estudiante
            $planEstudioId = $matriculaActiva->plan_estudio_id ?? null;

            $announcementsQuery = DB::table('anuncios')
                ->where('activo', 1);

            if ($planEstudioId) {
                $announcementsQuery->where('plan_estudio_id', $planEstudioId);
            }

            $announcements = $announcementsQuery
                ->orderBy('created_at', 'desc')
                ->limit(4)
                ->get()
                ->map(fn($ann) => [
                    'title'  => $ann->titulo,
                    'detail' => $ann->contenido,
                    'date'   => Carbon::parse($ann->created_at)->diffForHumans(),
                ]);

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

        // ==========================================
        // 2. DASHBOARD DOCENTE
        // ==========================================
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

            $cursosDocente = DB::table('horarios as h')
                ->join('cursos as c', 'c.id', '=', 'h.id_curso')
                ->leftJoin('secciones as s', 's.id', '=', 'h.id_seccion')
                ->where('h.id_docente', $docenteId)
                ->where('h.id_periodo', $periodoActivo->id)
                ->select('h.id_curso', 'h.id_seccion', 'h.id_turno', 'c.nombre as curso_nombre', 's.nombre as seccion_nombre')
                ->groupBy('h.id_curso', 'h.id_seccion', 'h.id_turno', 'c.nombre', 's.nombre')
                ->get();

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
                ->map(function ($item) {
                    $aulaTexto = $item->aula_nombre ? " • Aula: {$item->aula_nombre}" . ($item->numero_aula ? " ({$item->numero_aula})" : '') : '';
                    return [
                        'time'   => Carbon::parse($item->hora_inicio)->format('H:i') . ' - ' . Carbon::parse($item->hora_fin)->format('H:i'),
                        'title'  => $item->curso_nombre,
                        'detail' => "Sección: " . ($item->seccion_nombre ?? 'Única') . $aulaTexto,
                        'status' => 'Programada',
                    ];
                });

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
                    'total_cursos'            => $cursosDocente->count(),
                    'total_estudiantes'       => $totalEstudiantes,
                    'asistencias_pendientes'  => $asistenciasPendientes,
                    'evaluaciones_pendientes' => 0,
                ],
                'todaySchedule' => $todaySchedule,
            ]);
        }

        // ==========================================
        // 3. DASHBOARD ADMINISTRATIVO
        // ==========================================
        $periodoActivo = Periodo::where('activo', 1)->first();

        $safeCount = static function (string $table, ?callable $filter = null): int {
            if (!Schema::hasTable($table)) {
                return 0;
            }

            $query = DB::table($table);

            if ($filter) {
                $filter($query);
            }

            return $query->count();
        };

        $usuariosActivos = $safeCount('usuarios', function ($query) {
            if (Schema::hasColumn('usuarios', 'activo')) {
                $query->where('activo', 1);
            } elseif (Schema::hasColumn('usuarios', 'estado')) {
                $query->whereIn(DB::raw('LOWER(estado)'), ['activo', 'habilitado']);
            }
        });

        $totalPostulantes = $safeCount('postulantes');

        $matriculados = $safeCount('matriculas', function ($query) use ($periodoActivo) {
            if ($periodoActivo && Schema::hasColumn('matriculas', 'periodo_id')) {
                $query->where('periodo_id', $periodoActivo->id);
            }

            if (Schema::hasColumn('matriculas', 'estado')) {
                $query->whereRaw('LOWER(estado) = ?', ['matriculado']);
            }
        });

        $cursosProgramados = $safeCount('horarios', function ($query) use ($periodoActivo) {
            if ($periodoActivo && Schema::hasColumn('horarios', 'id_periodo')) {
                $query->where('id_periodo', $periodoActivo->id);
            }

            if (Schema::hasColumn('horarios', 'id_curso')) {
                $query->distinct('id_curso');
            }
        });

        if (Schema::hasTable('horarios') && Schema::hasColumn('horarios', 'id_curso')) {
            $horariosQuery = DB::table('horarios');
            if ($periodoActivo && Schema::hasColumn('horarios', 'id_periodo')) {
                $horariosQuery->where('id_periodo', $periodoActivo->id);
            }
            $cursosProgramados = $horariosQuery->distinct()->count('id_curso');
        }

        $pagosRegistrados = $safeCount('pagos_postulantes', function ($query) {
            if (Schema::hasColumn('pagos_postulantes', 'estado')) {
                $query->whereIn(DB::raw('LOWER(estado)'), ['aceptado', 'pagado', 'aprobado']);
            }
        });

        $docentes = $safeCount('docentes', function ($query) {
            if (Schema::hasColumn('docentes', 'activo')) {
                $query->where('activo', 1);
            }
        });

        $matriculasPorEstado = collect();
        if (Schema::hasTable('matriculas') && Schema::hasColumn('matriculas', 'estado')) {
            $query = DB::table('matriculas')
                ->select('estado', DB::raw('COUNT(*) as total'));

            if ($periodoActivo && Schema::hasColumn('matriculas', 'periodo_id')) {
                $query->where('periodo_id', $periodoActivo->id);
            }

            $matriculasPorEstado = $query
                ->groupBy('estado')
                ->orderByDesc('total')
                ->get()
                ->map(fn ($item) => [
                    'label' => ucfirst($item->estado ?: 'Sin estado'),
                    'value' => (int) $item->total,
                ]);
        }

        $postulantesPorMes = collect();
        if (
            Schema::hasTable('postulantes')
            && Schema::hasColumn('postulantes', 'created_at')
        ) {
            $desde = Carbon::now()->startOfMonth()->subMonths(5);

            $datosMensuales = DB::table('postulantes')
                ->where('created_at', '>=', $desde)
                ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as mes, COUNT(*) as total")
                ->groupBy('mes')
                ->pluck('total', 'mes');

            $postulantesPorMes = collect(range(0, 5))->map(function ($offset) use ($desde, $datosMensuales) {
                $fecha = $desde->copy()->addMonths($offset);
                $clave = $fecha->format('Y-m');

                return [
                    'label' => ucfirst($fecha->locale('es')->translatedFormat('M')),
                    'value' => (int) ($datosMensuales[$clave] ?? 0),
                ];
            });
        }

        $ultimosPostulantes = collect();
        if (Schema::hasTable('postulantes')) {
            $nombreColumnas = collect(['nombres', 'nombre', 'nombre_completo'])
                ->first(fn ($column) => Schema::hasColumn('postulantes', $column));
            $fechaColumna = Schema::hasColumn('postulantes', 'created_at') ? 'created_at' : null;
            $estadoColumna = Schema::hasColumn('postulantes', 'estado') ? 'estado' : null;

            if ($nombreColumnas) {
                $query = DB::table('postulantes')->select($nombreColumnas);
                if ($fechaColumna) {
                    $query->addSelect($fechaColumna)->orderByDesc($fechaColumna);
                }
                if ($estadoColumna) {
                    $query->addSelect($estadoColumna);
                }

                $ultimosPostulantes = $query->limit(5)->get()->map(function ($item) use ($nombreColumnas, $fechaColumna, $estadoColumna) {
                    return [
                        'name' => $item->{$nombreColumnas},
                        'status' => $estadoColumna ? ucfirst($item->{$estadoColumna} ?: 'Registrado') : 'Registrado',
                        'date' => $fechaColumna && $item->{$fechaColumna}
                            ? Carbon::parse($item->{$fechaColumna})->diffForHumans()
                            : 'Sin fecha',
                    ];
                });
            }
        }

        return Inertia::render('Dashboard/AdminDashboard', [
            'dashboardType' => 'administrativo',
            'periodo' => $periodoActivo->nombre ?? 'Sin periodo activo',
            'lastUpdated' => Carbon::now()->format('d/m/Y H:i'),
            'summary' => [
                'usuarios_activos' => $usuariosActivos,
                'postulantes' => $totalPostulantes,
                'matriculados' => $matriculados,
                'cursos_programados' => $cursosProgramados,
                'pagos_registrados' => $pagosRegistrados,
                'docentes' => $docentes,
            ],
            'matriculasByStatus' => $matriculasPorEstado,
            'applicantsByMonth' => $postulantesPorMes,
            'recentApplicants' => $ultimosPostulantes,
        ]);
    }
}