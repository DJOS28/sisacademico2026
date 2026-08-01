<?php

namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use App\Models\Periodo;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Colegio;
use App\Models\Evaluacion;
use Illuminate\Support\Facades\Storage;
use App\Models\EnvioTarea;
use Illuminate\Http\JsonResponse;
use App\Models\PreguntaEvaluacion;
use App\Models\OpcionPreguntaEvaluacion;
use App\Models\RespuestaEstudianteEvaluacion;
class EstudianteCursoController extends Controller
{
    /**
     * Muestra el listado de "Mis Cursos" matriculados por el estudiante.
     */
    public function misCursos(Request $request): Response
    {
        $usuario = $request->user();

        // 1. Obtener estudiante vinculado
        $estudiante = DB::table('postulantes')
            ->where('usuario_id', $usuario->id)
            ->first();

        if (!$estudiante) {
            return Inertia::render('Estudiante/Cursos/Index', [
                'cursos'  => [],
                'periodo' => null,
            ]);
        }

        // 2. Periodo activo o seleccionado
        $periodoActivo = Periodo::where('activo', 1)->first();

        if (!$periodoActivo) {
            return Inertia::render('Estudiante/Cursos/Index', [
                'cursos'  => [],
                'periodo' => 'Sin Periodo Activo',
            ]);
        }

        // 3. Matrícula activa del estudiante
        $matricula = DB::table('matriculas')
            ->where('postulante_id', $estudiante->id_postulante)
            ->where('periodo_id', $periodoActivo->id)
            ->where('estado', 'Matriculado')
            ->first();

        if (!$matricula) {
            return Inertia::render('Estudiante/Cursos/Index', [
                'cursos'  => [],
                'periodo' => $periodoActivo->nombre,
            ]);
        }

        // 4. Cursos matriculados (AGRUPADOS POR CURSO PARA EVITAR DUPLICADOS)
        $cursosQuery = DB::table('matricula_cursos as mc')
            ->join('cursos as c', 'c.id', '=', 'mc.curso_id')
            ->join('horarios as h', 'h.id', '=', 'mc.horario_id')
            ->leftJoin('secciones as s', 's.id', '=', 'h.id_seccion')
            ->leftJoin('turnos as t', 't.id', '=', 'h.id_turno')
            ->leftJoin('docentes as d', 'd.id', '=', 'h.id_docente')
            ->leftJoin('semestres as sem', 'sem.id', '=', 'c.semestre_id')
            ->leftJoin('nota_final as nf', function ($join) use ($estudiante) {
                $join->on('nf.curso_id', '=', 'c.id')
                    ->where('nf.estudiante_id', '=', $estudiante->id_postulante);
            })
            ->where('mc.matricula_id', $matricula->id)
            ->select(
                'c.id as curso_id',
                'c.nombre as curso_nombre',
                'c.creditos',
                'c.horas_semestrales',
                'sem.nombre as semestre_nombre',
                's.nombre as seccion_nombre',
                't.nombre as turno_nombre',
                'd.nombre as docente_nom',
                'd.apellido as docente_ape',
                'd.email as docente_email',
                'nf.promedio as nota_promedio',
                DB::raw("GROUP_CONCAT(mc.id) as matricula_curso_ids")
            )
            ->groupBy(
                'c.id',
                'c.nombre',
                'c.creditos',
                'c.horas_semestrales',
                'sem.nombre',
                's.nombre',
                't.nombre',
                'd.nombre',
                'd.apellido',
                'd.email',
                'nf.promedio'
            )
            ->get();

        // 5. Cargar asistencias y bloques de horario completos por cada curso único
        $cursosFormatted = $cursosQuery->map(function ($curso) {
            $mcIds = explode(',', $curso->matricula_curso_ids);

            // Obtener todos los bloques de horario asignados a este curso
            $horarios = DB::table('matricula_cursos as mc')
                ->join('horarios as h', 'h.id', '=', 'mc.horario_id')
                ->leftJoin('aulas as a', 'a.id', '=', 'h.id_aula')
                ->whereIn('mc.id', $mcIds)
                ->select('h.dia', 'h.hora_inicio', 'h.hora_fin', 'a.nombre as aula_nombre', 'a.numero_aula')
                ->get();

            // Totalizar asistencias sumando las sesiones de todos sus bloques de horario
            $asistencias = DB::table('asistencias')
                ->whereIn('matricula_curso_id', $mcIds)
                ->select(
                    DB::raw("COUNT(CASE WHEN UPPER(estado) IN ('P', 'PRESENTE') THEN 1 END) as presentes"),
                    DB::raw("COUNT(CASE WHEN UPPER(estado) IN ('F', 'A', 'FALTA', 'AUSENTE') THEN 1 END) as faltas"),
                    DB::raw("COUNT(id) as total")
                )
                ->first();

            $totalSesiones = $asistencias->total ?? 0;
            $faltas = $asistencias->faltas ?? 0;
            $porcentajeInasistencia = $totalSesiones > 0 ? round(($faltas / $totalSesiones) * 100) : 0;

            $nombreDocenteCompleto = trim("{$curso->docente_nom} {$curso->docente_ape}");

            return [
                'matricula_curso_id'      => $mcIds[0], // Usamos el primer ID para mantener referencia
                'curso_id'                => $curso->curso_id,
                'nombre'                  => $curso->curso_nombre,
                'creditos'                => $curso->creditos ?? 0,
                'horas_semestrales'       => $curso->horas_semestrales ?? 0,
                'semestre'                => $curso->semestre_nombre ?? 'Semestre N/A',
                'seccion'                 => $curso->seccion_nombre ?? 'A',
                'turno'                   => $curso->turno_nombre ?? 'Mañana',
                'docente'                 => !empty($nombreDocenteCompleto) ? $nombreDocenteCompleto : 'Por Asignar',
                'docente_email'           => $curso->docente_email ?? '—',
                'nota_promedio'           => is_numeric($curso->nota_promedio) ? number_format($curso->nota_promedio, 2) : '—',
                'faltas'                  => $faltas,
                'porcentaje_inasistencia' => $porcentajeInasistencia,
                'horarios'                => $horarios,
            ];
        });

        return Inertia::render('Estudiante/Cursos/Index', [
            'cursos'  => $cursosFormatted,
            'periodo' => $periodoActivo->nombre,
        ]);
    }

    /**
     * Muestra la matriz de Horario Semanal del estudiante.
     */
    public function miHorario(Request $request): Response
    {
        $usuario = $request->user();

        $estudiante = DB::table('postulantes')
            ->where('usuario_id', $usuario->id)
            ->first();

        $periodoActivo = Periodo::where('activo', 1)->first();

        if (!$estudiante || !$periodoActivo) {
            return Inertia::render('Estudiante/Horario/Index', [
                'horarioMatriz' => [],
                'horarios'      => [],
                'periodo'       => null,
            ]);
        }

        $matricula = DB::table('matriculas')
            ->where('postulante_id', $estudiante->id_postulante)
            ->where('periodo_id', $periodoActivo->id)
            ->where('estado', 'Matriculado')
            ->first();

        if (!$matricula) {
            return Inertia::render('Estudiante/Horario/Index', [
                'horarioMatriz' => [],
                'horarios'      => [],
                'periodo'       => $periodoActivo->nombre,
            ]);
        }

        // Obtener todos los bloques de horario del estudiante
        $horarios = DB::table('matricula_cursos as mc')
            ->join('horarios as h', 'h.id', '=', 'mc.horario_id')
            ->join('cursos as c', 'c.id', '=', 'mc.curso_id')
            ->leftJoin('secciones as s', 's.id', '=', 'h.id_seccion')
            ->leftJoin('aulas as a', 'a.id', '=', 'h.id_aula')
            ->leftJoin('docentes as d', 'd.id', '=', 'h.id_docente')
            ->where('mc.matricula_id', $matricula->id)
            ->select(
                'h.dia',
                'h.hora_inicio',
                'h.hora_fin',
                'c.nombre as curso_nombre',
                's.nombre as seccion_nombre',
                'a.nombre as aula_nombre',
                'a.numero_aula',
                DB::raw("TRIM(CONCAT(IFNULL(d.nombre,''), ' ', IFNULL(d.apellido,''))) as docente_nombre")
            )
            ->orderBy('h.hora_inicio', 'asc')
            ->get();

        return Inertia::render('Estudiante/Horario/Index', [
            'horarios'      => $horarios,
            'horarioMatriz' => $horarios,
            'periodo'       => $periodoActivo->nombre,
        ]);
    }

    /**
     * Muestra las notas detalladas del estudiante por curso matriculado.
     */
    public function misNotas(Request $request): Response
    {
        $usuario = $request->user();

        $estudiante = DB::table('postulantes')
            ->where('usuario_id', $usuario->id)
            ->first();

        $periodoActivo = Periodo::where('activo', 1)->first();

        if (!$estudiante || !$periodoActivo) {
            return Inertia::render('Estudiante/Notas/Index', [
                'cursos'            => [],
                'cursoSeleccionado' => null,
                'notasLogros'       => [],
                'notaFinal'         => null,
                'periodo'           => null,
            ]);
        }

        // Matrícula activa
        $matricula = DB::table('matriculas')
            ->where('postulante_id', $estudiante->id_postulante)
            ->where('periodo_id', $periodoActivo->id)
            ->where('estado', 'Matriculado')
            ->first();

        if (!$matricula) {
            return Inertia::render('Estudiante/Notas/Index', [
                'cursos'            => [],
                'cursoSeleccionado' => null,
                'notasLogros'       => [],
                'notaFinal'         => null,
                'periodo'           => $periodoActivo->nombre,
            ]);
        }

        // Listar cursos matriculados únicos para el selector/tabs
        $cursos = DB::table('matricula_cursos as mc')
            ->join('cursos as c', 'c.id', '=', 'mc.curso_id')
            ->where('mc.matricula_id', $matricula->id)
            ->select('c.id', 'c.nombre')
            ->distinct('c.id')
            ->get();

        // Determinar qué curso mostrar
        $cursoId = $request->input('curso_id', $cursos->first()?->id);
        $cursoSeleccionado = $cursos->firstWhere('id', $cursoId);

        $notasLogrosFormatted = [];
        $notaFinalObj = null;

        if ($cursoId) {
            // 1. Obtener Logros del curso
            $logros = DB::table('logros_curso')
                ->where('curso_id', $cursoId)
                ->where('id_periodo', $periodoActivo->id)
                ->get();

            foreach ($logros as $logro) {
                // Nota asignada al Logro
                $notaLogro = DB::table('notas_logros')
                    ->where('estudiante_id', $estudiante->id_postulante)
                    ->where('curso_id', $cursoId)
                    ->where('logro_curso_id', $logro->id)
                    ->value('nota');

                // Subcomponentes del logro
                $subcomponentes = DB::table('subcomponentes_logro')
                    ->where('logro_curso_id', $logro->id)
                    ->get()
                    ->map(function ($sub) use ($estudiante) {
                        $notaSub = DB::table('notas_subcomponentes')
                            ->where('estudiante_id', $estudiante->id_postulante)
                            ->where('subcomponente_id', $sub->id)
                            ->value('nota');

                        return [
                            'id'     => $sub->id,
                            'nombre' => $sub->nombre,
                            'peso'   => $sub->peso,
                            'nota'   => is_numeric($notaSub) ? number_format($notaSub, 2) : '—',
                        ];
                    });

                $notasLogrosFormatted[] = [
                    'id'             => $logro->id,
                    'nombre'         => $logro->nombre,
                    'descripcion'    => $logro->descripcion,
                    'nota'           => is_numeric($notaLogro) ? number_format($notaLogro, 2) : '—',
                    'subcomponentes' => $subcomponentes,
                ];
            }

            // Nota Final Promedio
            $notaFinalObj = DB::table('nota_final')
                ->where('estudiante_id', $estudiante->id_postulante)
                ->where('curso_id', $cursoId)
                ->first();
        }

        return Inertia::render('Estudiante/Notas/Index', [
            'cursos'            => $cursos,
            'cursoSeleccionado' => $cursoSeleccionado,
            'notasLogros'       => $notasLogrosFormatted,
            'notaFinal'         => $notaFinalObj ? number_format($notaFinalObj->promedio, 2) : '—',
            'periodo'           => $periodoActivo->nombre,
        ]);
    }

    /**
     * Muestra el reporte detallado de asistencias por curso del estudiante.
     */
    /**
     * Muestra el reporte detallado de asistencias por curso del estudiante.
     */
    public function miAsistencia(Request $request): Response
    {
        $usuario = $request->user();

        $estudiante = DB::table('postulantes')
            ->where('usuario_id', $usuario->id)
            ->first();

        $periodoActivo = Periodo::where('activo', 1)->first();

        if (!$estudiante || !$periodoActivo) {
            return Inertia::render('Estudiante/Asistencia/Index', [
                'cursos'            => [],
                'cursoSeleccionado' => null,
                'resumen'           => null,
                'asistencias'       => [],
                'periodo'           => null,
            ]);
        }

        // Matrícula activa
        $matricula = DB::table('matriculas')
            ->where('postulante_id', $estudiante->id_postulante)
            ->where('periodo_id', $periodoActivo->id)
            ->where('estado', 'Matriculado')
            ->first();

        if (!$matricula) {
            return Inertia::render('Estudiante/Asistencia/Index', [
                'cursos'            => [],
                'cursoSeleccionado' => null,
                'resumen'           => null,
                'asistencias'       => [],
                'periodo'           => $periodoActivo->nombre,
            ]);
        }

        // Listar cursos matriculados únicos para el selector
        $cursos = DB::table('matricula_cursos as mc')
            ->join('cursos as c', 'c.id', '=', 'mc.curso_id')
            ->where('mc.matricula_id', $matricula->id)
            ->select('c.id', 'c.nombre')
            ->distinct('c.id')
            ->get();

        // Determinar el curso seleccionado
        $cursoId = $request->input('curso_id', $cursos->first()?->id);
        $cursoSeleccionado = $cursos->firstWhere('id', $cursoId);

        $resumen = null;
        $asistenciasDetalle = [];

        if ($cursoId) {
            // Obtener todos los IDs de matricula_curso pertenecientes a esta asignatura
            $mcIds = DB::table('matricula_cursos')
                ->where('matricula_id', $matricula->id)
                ->where('curso_id', $cursoId)
                ->pluck('id');

            // Consulta ajustada a la DDL exacta de la tabla asistencias
            $asistenciasDetalle = DB::table('asistencias as a')
                ->join('matricula_cursos as mc', 'mc.id', '=', 'a.matricula_curso_id')
                ->leftJoin('horarios as h', 'h.id', '=', 'mc.horario_id')
                ->leftJoin('aulas as au', 'au.id', '=', 'h.id_aula')
                ->whereIn('a.matricula_curso_id', $mcIds)
                ->select(
                    'a.id',
                    'a.fecha',
                    'a.estado',
                    'a.observaciones',
                    'h.hora_inicio',
                    'h.hora_fin',
                    'au.nombre as aula_nombre'
                )
                ->orderBy('a.fecha', 'desc')
                ->get()
                ->map(function ($a) {
                    return [
                        'id'          => $a->id,
                        'fecha'       => Carbon::parse($a->fecha)->format('d/m/Y'),
                        'dia'         => Carbon::parse($a->fecha)->locale('es')->isoFormat('dddd'),
                        'estado'      => strtoupper(trim($a->estado)),
                        'observacion' => !empty($a->observaciones) ? $a->observaciones : '—',
                        'horario'     => ($a->hora_inicio && $a->hora_fin) 
                                            ? substr($a->hora_inicio, 0, 5) . ' - ' . substr($a->hora_fin, 0, 5) 
                                            : '—',
                        'aula'        => $a->aula_nombre ?? 'Por definir',
                    ];
                });

            // Resumen de conteo y porcentajes
            $conteo = DB::table('asistencias')
                ->whereIn('matricula_curso_id', $mcIds)
                ->select(
                    DB::raw("COUNT(CASE WHEN UPPER(estado) IN ('P', 'PRESENTE') THEN 1 END) as presentes"),
                    DB::raw("COUNT(CASE WHEN UPPER(estado) IN ('F', 'A', 'FALTA', 'AUSENTE') THEN 1 END) as faltas"),
                    DB::raw("COUNT(CASE WHEN UPPER(estado) IN ('T', 'TARDE', 'TARDANZA') THEN 1 END) as tardanzas"),
                    DB::raw("COUNT(CASE WHEN UPPER(estado) IN ('J', 'JUSTIFICADO') THEN 1 END) as justificadas"),
                    DB::raw("COUNT(id) as total")
                )
                ->first();

            $total = $conteo->total ?? 0;
            $presentes = $conteo->presentes ?? 0;
            $faltas = $conteo->faltas ?? 0;
            $tardanzas = $conteo->tardanzas ?? 0;
            $justificadas = $conteo->justificadas ?? 0;

            $porcentajeAsistencia = $total > 0 ? round((($presentes + $tardanzas + $justificadas) / $total) * 100) : 100;
            $porcentajeInasistencia = $total > 0 ? round(($faltas / $total) * 100) : 0;

            $resumen = [
                'total_sesiones'          => $total,
                'presentes'               => $presentes,
                'faltas'                  => $faltas,
                'tardanzas'               => $tardanzas,
                'justificadas'            => $justificadas,
                'porcentaje_asistencia'   => $porcentajeAsistencia,
                'porcentaje_inasistencia' => $porcentajeInasistencia,
                'en_riesgo'               => $porcentajeInasistencia >= 30,
            ];
        }

        return Inertia::render('Estudiante/Asistencia/Index', [
            'cursos'            => $cursos,
            'cursoSeleccionado' => $cursoSeleccionado,
            'resumen'           => $resumen,
            'asistencias'       => $asistenciasDetalle,
            'periodo'           => $periodoActivo->nombre,
        ]);
    }

    /**
     * Muestra el Historial Académico completo (Récord histórico de notas por períodos).
     */
    /**
     * Muestra el Historial Académico completo (Récord histórico de notas por períodos).
     */
    public function historialAcademico(Request $request): Response
    {
        $usuario = $request->user();

        $estudiante = DB::table('postulantes')
            ->where('usuario_id', $usuario->id)
            ->first();

        if (!$estudiante) {
            return Inertia::render('Estudiante/Historial/Index', [
                'historial' => [],
                'resumen'   => null,
            ]);
        }

        // 1. Obtener todas las matrículas del estudiante en orden cronológico descendente
        $matriculas = DB::table('matriculas as m')
            ->join('periodos as p', 'p.id', '=', 'm.periodo_id')
            ->where('m.postulante_id', $estudiante->id_postulante)
            ->select('m.id as matricula_id', 'p.id as periodo_id', 'p.nombre as periodo_nombre')
            ->orderBy('p.id', 'desc')
            ->get();

        $historialPorPeriodo = [];
        $totalCreditosAprobados = 0;
        $totalCreditosMatriculados = 0;
        $sumaNotasPonderadas = 0;
        $totalCursosEvaluados = 0;

        foreach ($matriculas as $mat) {
            // 2. Cursos de cada matrícula agrupados por ID para evitar duplicados por horario
            $cursos = DB::table('matricula_cursos as mc')
                ->join('cursos as c', 'c.id', '=', 'mc.curso_id')
                ->leftJoin('semestres as sem', 'sem.id', '=', 'c.semestre_id')
                ->leftJoin('nota_final as nf', function ($join) use ($estudiante) {
                    $join->on('nf.curso_id', '=', 'c.id')
                        ->where('nf.estudiante_id', '=', $estudiante->id_postulante);
                })
                ->where('mc.matricula_id', $mat->matricula_id)
                ->select(
                    'c.id as curso_id',
                    'c.nombre as curso_nombre',
                    'c.creditos',
                    'sem.nombre as semestre_nombre',
                    'nf.promedio as nota_promedio'
                )
                ->groupBy('c.id', 'c.nombre', 'c.creditos', 'sem.nombre', 'nf.promedio')
                ->get();

            $cursosFormatted = [];
            $creditosPeriodo = 0;
            $sumaPonderadoPeriodo = 0;

            foreach ($cursos as $c) {
                // Corrección de acceso a propiedades PHP ($c->propiedad)
                $creditos = $c->creditos ?? 0;
                $nota = is_numeric($c->nota_promedio) ? (float) $c->nota_promedio : null;
                $aprobado = $nota !== null && $nota >= 11;

                if ($nota !== null) {
                    $sumaPonderadoPeriodo += ($nota * $creditos);
                    $creditosPeriodo += $creditos;

                    // Acumulados Globales
                    $sumaNotasPonderadas += ($nota * $creditos);
                    $totalCreditosMatriculados += $creditos;
                    $totalCursosEvaluados++;

                    if ($aprobado) {
                        $totalCreditosAprobados += $creditos;
                    }
                }

                $cursosFormatted[] = [
                    'curso_id' => $c->curso_id,
                    'nombre'   => $c->curso_nombre,
                    'creditos' => $creditos,
                    'semestre' => $c->semestre_nombre ?? 'Semestre N/A',
                    'nota'     => $nota !== null ? number_format($nota, 2) : '—',
                    'aprobado' => $aprobado,
                    'cursando' => $nota === null,
                ];
            }

            // Promedio del periodo
            $promedioPeriodo = $creditosPeriodo > 0 ? round($sumaPonderadoPeriodo / $creditosPeriodo, 2) : null;

            $historialPorPeriodo[] = [
                'periodo_id'       => $mat->periodo_id,
                'periodo_nombre'   => $mat->periodo_nombre,
                'promedio_periodo' => $promedioPeriodo !== null ? number_format($promedioPeriodo, 2) : '—',
                'cursos'           => $cursosFormatted,
            ];
        }

        // 3. Promedio Ponderado Acumulado (GPA / PPS)
        $promedioAcumulado = $totalCreditosMatriculados > 0 
            ? round($sumaNotasPonderadas / $totalCreditosMatriculados, 2) 
            : null;

        return Inertia::render('Estudiante/Historial/Index', [
            'historial' => $historialPorPeriodo,
            'resumen'   => [
                'promedio_acumulado' => $promedioAcumulado !== null ? number_format($promedioAcumulado, 2) : '—',
                'creditos_aprobados' => $totalCreditosAprobados,
                'cursos_evaluados'   => $totalCursosEvaluados,
            ],
        ]);
    }

    

    /**
     * Muestra el formulario con los datos actuales del estudiante.
     */
    public function editarPerfil(Request $request): Response
    {
        $usuario = $request->user();

        // Obtener la información del estudiante asociado al usuario autenticado
        $estudiante = DB::table('postulantes')
            ->where('usuario_id', $usuario->id)
            ->first();

        // Obtener todos los colegios registrados usando el modelo Eloquent Colegio
        $colegios = Colegio::orderBy('id_colegio', 'asc')->get();

        return Inertia::render('Estudiante/Perfil/Index', [
            'estudiante' => $estudiante,
            'colegios'   => $colegios,
            'usuario'    => [
                'id'    => $usuario->id,
                'email' => $usuario->email,
                'name'  => $usuario->name,
            ],
        ]);
    }

    /**
     * Actualiza la información personal del estudiante.
     */
    /**
     * Actualiza la información personal, procedencia y archivos del estudiante.
     */
    public function actualizarPerfil(Request $request)
    {
        $usuario = $request->user();

        $estudiante = DB::table('postulantes')
            ->where('usuario_id', $usuario->id)
            ->first();

        if (!$estudiante) {
            return redirect()->back()->with('error', 'No se encontró la ficha del estudiante.');
        }

        // 1. Validación de todos los campos recibidos desde React
        $validated = $request->validate([
            // Datos Personales y Contacto
            'nombres'             => 'required|string|max:100',
            'apellidos'           => 'required|string|max:100',
            'dni'                 => 'required|string|max:15|unique:postulantes,dni,' . $estudiante->id_postulante . ',id_postulante',
            'email'               => 'required|email|max:100|unique:users,email,' . $usuario->id,
            'telefono'            => 'nullable|string|max:15',
            'direccion'           => 'nullable|string|max:100',
            'fecha_nacimiento'    => 'nullable|date',
            'genero'              => 'nullable|string|max:15',
            'lengua_materna'      => 'nullable|string|max:50',

            // Procedencia escolar e inclusión
            'id_colegio'          => 'nullable|integer',
            'año_egreso'          => 'nullable|string|max:4',
            'discapacidad'        => 'nullable|boolean',
            'nombre_discapacidad' => 'nullable|string|max:100',

            // Archivos adjuntos (máx 5MB)
            'foto_postulante'      => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'certificado_estudios' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'partida_nacimiento'   => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'copia_dni'            => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'comprobante_pago'     => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'curriculum_archivo'   => 'nullable|file|mimes:pdf|max:5120',
        ]);

        // 2. Procesamiento y guardado de archivos
        $archivosGuardados = [];
        $carpetasArchivos = [
            'foto_postulante'      => 'estudiantes/fotos',
            'certificado_estudios' => 'estudiantes/documentos',
            'partida_nacimiento'   => 'estudiantes/documentos',
            'copia_dni'            => 'estudiantes/documentos',
            'comprobante_pago'     => 'estudiantes/comprobantes',
            'curriculum_archivo'   => 'estudiantes/cvs',
        ];

        foreach ($carpetasArchivos as $campo => $carpeta) {
            if ($request->hasFile($campo)) {
                $path = $request->file($campo)->store($carpeta, 'public');
                $archivosGuardados[$campo] = '/storage/' . $path;
            } else {
                // Conservar el archivo previo si no se seleccionó uno nuevo
                $archivosGuardados[$campo] = $estudiante->$campo ?? null;
            }
        }

        // 3. Actualizar tabla users (Nombre y Email)
        DB::table('users')
            ->where('id', $usuario->id)
            ->update([
                'name'       => trim($validated['nombres'] . ' ' . $validated['apellidos']),
                'email'      => $validated['email'],
                'updated_at' => now(),
            ]);

        // 4. Actualizar tabla postulantes (Preservando el grado/condición)
        DB::table('postulantes')
            ->where('id_postulante', $estudiante->id_postulante)
            ->update([
                // Datos Personales
                'nombres'              => $validated['nombres'],
                'apellidos'            => $validated['apellidos'],
                'dni'                  => $validated['dni'],
                'email'                => $validated['email'],
                'telefono'             => $validated['telefono'] ?? null,
                'direccion'            => $validated['direccion'] ?? null,
                'fecha_nacimiento'     => $validated['fecha_nacimiento'] ?? null,
                'genero'               => $validated['genero'] ?? null,
                'lengua_materna'       => $validated['lengua_materna'] ?? null,

                // Procedencia e Inclusión
                'id_colegio'           => $validated['id_colegio'] ?? null,
                'año_egreso'           => $validated['año_egreso'] ?? null,
                'discapacidad'         => !empty($validated['discapacidad']) ? 1 : 0,
                'nombre_discapacidad'  => $validated['nombre_discapacidad'] ?? null,

                // Rutas de Archivos y Fotos
                'foto_postulante'      => $archivosGuardados['foto_postulante'],
                'certificado_estudios' => $archivosGuardados['certificado_estudios'],
                'partida_nacimiento'   => $archivosGuardados['partida_nacimiento'],
                'copia_dni'            => $archivosGuardados['copia_dni'],
                'comprobante_pago'     => $archivosGuardados['comprobante_pago'],
                'curriculum_archivo'   => $archivosGuardados['curriculum_archivo'],

                'updated_at'           => now(),
            ]);

        return redirect()->back()->with('success', 'Tus datos y documentación han sido actualizados correctamente.');
    }

    
    public function verAulaVirtual(Request $request, $curso_id)
    {
        $usuario = $request->user();

        // 1. Obtener la ficha del estudiante
        $estudiante = DB::table('postulantes')
            ->where('usuario_id', $usuario->id)
            ->first();

        if (!$estudiante) {
            return redirect()->route('estudiante.cursos')
                ->with('error', 'No se encontró el perfil de estudiante.');
        }

        // 2. Obtener el contexto exacto del estudiante: Curso + Sección + Periodo
        $contexto = DB::table('matriculas as m')
            ->join('matricula_cursos as mc', 'm.id', '=', 'mc.matricula_id')
            ->join('cursos as c', 'mc.curso_id', '=', 'c.id')
            ->leftJoin('horarios as h', 'mc.horario_id', '=', 'h.id')
            ->leftJoin('secciones as sec', 'h.id_seccion', '=', 'sec.id')
            ->leftJoin('semestres as s', 'c.semestre_id', '=', 's.id')
            ->leftJoin('cursos_docentes as cd', 'c.id', '=', 'cd.curso_id')
            ->leftJoin('docentes as d', 'cd.docente_id', '=', 'd.id')
            ->where('m.postulante_id', $estudiante->id_postulante)
            ->where('c.id', $curso_id)
            ->select(
                'c.id as curso_id',
                'c.nombre as nombre',
                'h.id_seccion as seccion_id',
                'h.id_periodo as periodo_id',
                'h.id as horario_id',
                DB::raw("COALESCE(sec.nombre, 'Sin sección') as seccion_nombre"),
                DB::raw("COALESCE(s.nombre, 'Sin semestre') as semestre_nombre"),
                DB::raw("CONCAT(COALESCE(d.nombre, ''), ' ', COALESCE(d.apellido, '')) as docente")
            )
            ->first();

        if (!$contexto) {
            return redirect()->route('estudiante.cursos')
                ->with('error', 'No tienes acceso a este curso.');
        }

        $seccionId = $contexto->seccion_id;
        $periodoId = $contexto->periodo_id;

        // 3. Consultar Sílabo (filtrado por curso, sección y periodo)
        $pathSilabo = DB::table('silabos')
            ->where('curso_id', $curso_id)
            ->where(function ($q) use ($seccionId) {
                $q->where('id_seccion', $seccionId)->orWhereNull('id_seccion');
            })
            ->where(function ($q) use ($periodoId) {
                $q->where('id_periodo', $periodoId)->orWhereNull('id_periodo');
            })
            ->orderBy('id_silabo', 'desc')
            ->value('archivo');

        $silabo = $pathSilabo ? Storage::url($pathSilabo) : null;

        // 4. Consultar Sesiones de Clase (filtradas por curso y horario_id de la sección)
        $sesiones = DB::table('sesiones')
            ->where('curso_id', $curso_id)
            ->where('activo', 1)
            ->where(function ($query) use ($contexto) {
                $query->where('horario_id', $contexto->horario_id)
                      ->orWhereNull('horario_id');
            })
            ->orderBy('fecha', 'asc')
            ->orderBy('id_sesion', 'asc')
            ->get()
            ->map(fn($s) => [
                'id'          => $s->id_sesion,
                'nombre'      => $s->nombre,
                'fecha'       => $s->fecha,
                'fecha_fin'   => $s->fecha_fin,
                'archivo_url' => $s->archivo ? Storage::url($s->archivo) : null,
            ]);

        // 5. Consultar Materiales (filtrados por curso, sección y periodo)
        $materiales = DB::table('archivos_curso')
            ->where('curso_id', $curso_id)
            ->where(function ($q) use ($seccionId) {
                $q->where('id_seccion', $seccionId)->orWhereNull('id_seccion');
            })
            ->where(function ($q) use ($periodoId) {
                $q->where('id_periodo', $periodoId)->orWhereNull('id_periodo');
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($m) => [
                'id'        => $m->id,
                'sesion_id' => $m->sesion_id,
                'tipo'      => $m->tipo,
                'nombre'    => $m->nombre,
                'ruta'      => $m->tipo === 'archivo' ? Storage::url($m->ruta) : $m->ruta,
                'fecha'     => optional($m->created_at)->format('d/m/Y'),
            ]);

        // 6. Consultar Tareas (filtradas por curso y sección, cruzando con envios_tareas)
        $tareas = DB::table('tareas as t')
            ->leftJoin('envios_tareas as et', function ($join) use ($estudiante) {
                $join->on('t.id', '=', 'et.tarea_id')
                     ->where('et.estudiante_id', '=', $estudiante->id_postulante);
            })
            ->where('t.curso_id', $curso_id)
            ->where(function ($q) use ($seccionId) {
                $q->where('t.id_seccion', $seccionId)->orWhereNull('t.id_seccion');
            })
            ->orderBy('t.fecha_fin', 'asc')
            ->select([
                't.id',
                't.nombre as titulo',
                't.descripcion',
                't.fecha_fin as fecha_limite',
                't.archivo as archivo_docente',
                'et.id as envio_id',
                'et.archivo as archivo_estudiante',
                'et.fecha_envio',
            ])
            ->get()
            ->map(fn($t) => [
                'id'                 => $t->id,
                'titulo'             => $t->titulo,
                'descripcion'        => $t->descripcion,
                'fecha_limite'       => $t->fecha_limite,
                'archivo_url'        => $t->archivo_docente ? Storage::url($t->archivo_docente) : null,
                'entregado'          => (bool) $t->envio_id,
                'archivo_estudiante' => $t->archivo_estudiante ? Storage::url($t->archivo_estudiante) : null,
                'fecha_envio'        => $t->fecha_envio,
            ]);

        // 7. 🟢 CONSULTAR EVALUACIONES (Filtradas por curso, sección y periodo)
        $evaluaciones = DB::table('evaluaciones')
            ->where('curso_id', $curso_id)
            ->where(function ($q) use ($seccionId) {
                $q->where('seccion_id', $seccionId)->orWhereNull('seccion_id');
            })
            ->where(function ($q) use ($periodoId) {
                $q->where('periodo_id', $periodoId)->orWhereNull('periodo_id');
            })
            ->orderBy('fecha_inicio', 'asc')
            ->orderBy('hora_inicio', 'asc')
            ->get()
            ->map(fn($e) => [
                'id'           => $e->id_evaluacion,
                'titulo'       => $e->nombre,
                'fecha_inicio' => $e->fecha_inicio,
                'hora_inicio'  => $e->hora_inicio,
                'fecha_fin'    => $e->fecha_fin,
                'hora_fin'     => $e->hora_fin,
            ]);

        // 8. Renderizar en Inertia
        return Inertia::render('Estudiante/AulaVirtual/Show', [
            'curso' => [
                'id'       => $contexto->curso_id,
                'nombre'   => $contexto->nombre,
                'seccion'  => $contexto->seccion_nombre,
                'semestre' => $contexto->semestre_nombre,
                'docente'  => $contexto->docente,
            ],
            'sesiones'     => $sesiones,
            'materiales'   => $materiales,
            'tareas'       => $tareas,
            'evaluaciones' => $evaluaciones, // 👈 Ahora envía el listado real de la BD
            'clasesVivo'   => [],
            'silabo'       => $silabo,
        ]);
    }

    public function entregarTarea(Request $request): JsonResponse
    {
        $request->validate([
            'tarea_id'   => 'required|integer|exists:tareas,id',
            'archivo'    => 'required|file|mimes:pdf,doc,docx,zip,rar|max:10240', // Máx 10MB
            'comentario' => 'nullable|string|max:500',
        ]);

        $usuario = $request->user();

        // 1. Obtener la ficha del estudiante (postulante)
        $estudiante = DB::table('postulantes')
            ->where('usuario_id', $usuario->id)
            ->first();

        if (!$estudiante) {
            return response()->json(['message' => 'No se encontró el perfil de estudiante.'], 422);
        }

        // 2. Buscar si ya existía un envío previo en 'envios_tareas' para eliminar el archivo del disco
        $envioPrevio = DB::table('envios_tareas')
            ->where('tarea_id', $request->tarea_id)
            ->where('estudiante_id', $estudiante->id_postulante)
            ->first();

        if ($envioPrevio && $envioPrevio->archivo && Storage::disk('public')->exists($envioPrevio->archivo)) {
            Storage::disk('public')->delete($envioPrevio->archivo);
        }

        // 3. Guardar nuevo archivo en storage/app/public/envios_tareas
        $path = $request->file('archivo')->store('envios_tareas', 'public');

        // 4. Registrar o actualizar envío en la tabla 'envios_tareas'
        DB::table('envios_tareas')->updateOrInsert(
            [
                'tarea_id'      => $request->tarea_id,
                'estudiante_id' => $estudiante->id_postulante,
            ],
            [
                'archivo'     => $path,
                'comentario'  => $request->comentario,
                'fecha_envio' => now(),
                'updated_at'  => now(),
            ]
        );

        return response()->json([
            'message'     => 'Tarea enviada correctamente.',
            'fecha_envio' => now()->format('Y-m-d H:i:s'),
        ], 200);
    }

    public function rendirEvaluacion(Request $request, $evaluacion_id): Response
{
    $usuario = $request->user();

    $estudiante = DB::table('postulantes')
        ->where('usuario_id', $usuario->id)
        ->first();

    if (!$estudiante) {
        return redirect()->route('estudiante.cursos')
            ->with('error', 'No se encontró el perfil de estudiante.');
    }

    // Cargar la evaluación con sus preguntas y opciones
    $evaluacion = Evaluacion::with(['preguntas.opciones'])
        ->findOrFail($evaluacion_id);

    // Renderizar la vista del examen para el alumno
    return Inertia::render('Estudiante/Evaluaciones/Rendir', [
        'evaluacion' => $evaluacion,
    ]);
}
public function guardarEvaluacion(Request $request, $evaluacion_id): JsonResponse
{
    $request->validate([
        'respuestas' => 'required|array',
    ]);

    $usuario = $request->user();

    // Obtener la ficha del estudiante (postulante)
    $estudiante = DB::table('postulantes')
        ->where('usuario_id', $usuario->id)
        ->first();

    if (!$estudiante) {
        return response()->json(['message' => 'No se encontró el perfil de estudiante.'], 422);
    }

    DB::transaction(function () use ($request, $evaluacion_id, $estudiante) {
        foreach ($request->respuestas as $pregunta_id => $opcion_id) {
            
            // 1. Obtener la pregunta para consultar su puntaje asignado
            $pregunta = PreguntaEvaluacion::find($pregunta_id);
            $puntajePregunta = $pregunta ? $pregunta->puntaje : 0.0;

            // 2. Consultar si la opción seleccionada es la correcta
            $opcion = OpcionPreguntaEvaluacion::find($opcion_id);
            $esCorrecta = $opcion ? (bool) $opcion->es_correcta : false;

            // 3. Registrar o actualizar la respuesta
            RespuestaEstudianteEvaluacion::updateOrCreate(
                [
                    'evaluacion_id' => $evaluacion_id,
                    'estudiante_id' => $estudiante->id_postulante,
                    'pregunta_id'   => $pregunta_id,
                ],
                [
                    'opcion_id'        => $opcion_id,
                    'es_correcta'      => $esCorrecta,
                    'puntaje_obtenido' => $esCorrecta ? $puntajePregunta : 0.0,
                ]
            );
        }
    });

    return response()->json([
        'message' => 'Tus respuestas han sido enviadas correctamente.',
    ], 200);
}
}