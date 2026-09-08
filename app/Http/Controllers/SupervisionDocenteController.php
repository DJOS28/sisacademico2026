<?php

namespace App\Http\Controllers;

use App\Models\Docente;
use App\Models\Horario;
use App\Models\Periodo;
use App\Models\PlanEstudio;
use App\Models\Seccion;
use App\Models\Supervision;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SupervisionDocenteController extends Controller
{
    public function index(Request $request): Response
    {
        $usuario = Auth::user();
        $periodos = Periodo::select('id', 'nombre', 'activo')->get();
        $periodoId = $request->input('periodo_id') ?? Periodo::where('activo', 1)->value('id') ?? $periodos->first()?->id;

        $esAdmin = $usuario && ($usuario->tieneRol('Administrador') || $usuario->tieneRol('Admin') || $usuario->id === 1);

        $planesQuery = PlanEstudio::query()->where('activo', 1);

        if (!$esAdmin) {
            $planesAsignadosIds = DB::table('plan_estudio_supervisor')
                ->where('usuario_id', $usuario->id)
                ->where('activo', 1)
                ->pluck('plan_estudio_id')
                ->toArray();

            $planesQuery->whereIn('id', $planesAsignadosIds);
        }

        $planesDisponibles = $planesQuery->orderBy('nombre')->get(['id', 'nombre', 'codigo']);
        $planEstudioId = $request->input('plan_estudio_id') ?? $planesDisponibles->first()?->id;

        return Inertia::render('Supervision/Index', [
            'periodos'           => $periodos,
            'periodoActivoId'    => (int) $periodoId,
            'planesDisponibles'  => $planesDisponibles,
            'planSeleccionadoId' => $planEstudioId ? (int) $planEstudioId : null,
            'docentes'           => Docente::select('id', 'nombre', 'apellido')->orderBy('apellido')->get(),
            'secciones'          => Seccion::select('id', 'nombre')->get(),
            'monitoreoInicial'   => $planEstudioId ? $this->obtenerDataMonitoreo((int) $periodoId, (int) $planEstudioId) : [],
            'historialGeneral'   => $this->obtenerHistorialGeneral((int) $periodoId, $planEstudioId ? (int) $planEstudioId : null),
        ]);
    }

    public function filtrar(Request $request): JsonResponse
    {
        $periodoId     = $request->input('periodo_id');
        $planEstudioId = $request->input('plan_estudio_id');
        $docenteId     = $request->input('docente_id');
        $seccionId     = $request->input('seccion_id');
        $buscar        = trim((string) $request->input('buscar'));

        if (!$planEstudioId) {
            return response()->json(['monitoreo' => [], 'historial' => []]);
        }

        return response()->json([
            'monitoreo' => $this->obtenerDataMonitoreo((int) $periodoId, (int) $planEstudioId, $docenteId, $seccionId, $buscar),
            'historial' => $this->obtenerHistorialGeneral((int) $periodoId, (int) $planEstudioId),
        ]);
    }

    public function historialCurso($horarioId): JsonResponse
    {
        $supervisiones = Supervision::with(['supervisor.personal', 'supervisor.docente', 'supervisor.administrador'])
            ->where('horario_id', $horarioId)
            ->orderByDesc('fecha')
            ->orderByDesc('id')
            ->get()
            ->map(function ($s) {
                $u = $s->supervisor;
                $nombre = $u?->personal ? "{$u->personal->apellido}, {$u->personal->nombre}" :
                    ($u?->docente ? "{$u->docente->apellido}, {$u->docente->nombre}" :
                    ($u?->administrador ? "{$u->administrador->apellido}, {$u->administrador->nombre}" : ($u?->nombre_completo ?? $u?->username)));

                return [
                    'id'               => $s->id,
                    'fecha'            => date('d/m/Y', strtotime($s->fecha)),
                    'puntaje'          => $s->puntaje,
                    'estado'           => $s->estado,
                    'tiene_silabo'     => (bool) $s->tiene_silabo,
                    'tiene_asistencia' => (bool) $s->tiene_asistencia,
                    'tiene_archivo'    => (bool) $s->tiene_archivo,
                    'tiene_notas'      => (bool) $s->tiene_notas,
                    'observaciones'    => $s->observaciones ?? 'Sin observaciones.',
                    'supervisor'       => $nombre,
                ];
            });

        return response()->json(['historial' => $supervisiones]);
    }

    public function store(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'horario_id'       => 'required|integer|exists:horarios,id',
            'sesion_id'        => 'nullable|integer',
            'fecha'            => 'required|date',
            'puntaje'          => 'required|numeric|min:0|max:20',
            'estado'           => 'required|string|in:APROBADO,OBSERVADO,CRITICO',
            'tiene_silabo'     => 'required|boolean',
            'tiene_asistencia' => 'required|boolean',
            'tiene_archivo'    => 'required|boolean',
            'tiene_notas'      => 'required|boolean',
            'observaciones'    => 'nullable|string|max:1000',
        ]);

        try {
            $supervision = Supervision::create([
                'horario_id'       => $datos['horario_id'],
                'sesion_id'        => $datos['sesion_id'] ?? null,
                'fecha'            => $datos['fecha'],
                'puntaje'          => $datos['puntaje'],
                'estado'           => $datos['estado'],
                'tiene_silabo'     => $datos['tiene_silabo'],
                'tiene_asistencia' => $datos['tiene_asistencia'],
                'tiene_archivo'    => $datos['tiene_archivo'],
                'tiene_notas'      => $datos['tiene_notas'],
                'observaciones'    => $datos['observaciones'] ?? null,
                'usuario_id'       => Auth::id(),
            ]);

            return response()->json([
                'success'     => true,
                'message'     => 'Informe de supervisión registrado con éxito.',
                'supervision' => [
                    'id'            => $supervision->id,
                    'fecha'         => date('Y-m-d', strtotime($supervision->fecha)),
                    'puntaje'       => $supervision->puntaje,
                    'estado'        => $supervision->estado,
                    'tiene_silabo'     => (bool) $supervision->tiene_silabo,
                    'tiene_asistencia' => (bool) $supervision->tiene_asistencia,
                    'tiene_archivo'    => (bool) $supervision->tiene_archivo,
                    'tiene_notas'      => (bool) $supervision->tiene_notas,
                    'observaciones' => $supervision->observaciones,
                    'supervisor'    => Auth::user()?->nombre_completo ?? Auth::user()?->username ?? 'Supervisor',
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al guardar la supervisión: ' . $e->getMessage()
            ], 500);
        }
    }

    private function obtenerDataMonitoreo(int $periodoId, int $planEstudioId, $docenteId = null, $seccionId = null, string $buscar = '')
    {
        $query = Horario::with([
            'curso:id,nombre,moodle_course_id',
            'seccion:id,nombre',
            'docente:id,nombre,apellido,dni',
            'periodo:id,nombre',
            'planEstudio:id,nombre'
        ])
        ->where('id_periodo', $periodoId)
        ->where('id_plan_estudio', $planEstudioId);

        if ($docenteId) $query->where('id_docente', $docenteId);
        if ($seccionId) $query->where('id_seccion', $seccionId);
        if ($buscar !== '') {
            $query->where(function ($q) use ($buscar) {
                $q->whereHas('curso', fn($sub) => $sub->where('nombre', 'like', "%{$buscar}%"))
                  ->orWhereHas('docente', fn($sub) => $sub->where('nombre', 'like', "%{$buscar}%")->orWhere('apellido', 'like', "%{$buscar}%"));
            });
        }

        return $query->get()->map(function ($h) use ($periodoId) {
            $cursoId   = $h->id_curso;
            $seccionId = $h->id_seccion;
            $horarioId = $h->id;

            $tieneSilabo = DB::table('silabos')
                ->where('curso_id', $cursoId)
                ->where('id_seccion', $seccionId)
                ->where('id_periodo', $periodoId)
                ->exists();

            $totalSesiones = DB::table('sesiones')
                ->where('curso_id', $cursoId)
                ->where(function ($q) use ($horarioId) {
                    $q->where('horario_id', $horarioId)->orWhereNull('horario_id');
                })
                ->count();

            $tieneArchivo = DB::table('archivos_curso')
                ->where('curso_id', $cursoId)
                ->where('id_seccion', $seccionId)
                ->where('id_periodo', $periodoId)
                ->exists();

            $tieneAsistencia = DB::table('asistencias as a')
                ->join('matricula_cursos as mc', 'mc.id', '=', 'a.matricula_curso_id')
                ->where('mc.horario_id', $horarioId)
                ->exists();

            $tieneNotas = DB::table('nota_final')->where('curso_id', $cursoId)->where('id_seccion', $seccionId)->exists()
                || DB::table('notas_logros')->where('curso_id', $cursoId)->where('id_seccion', $seccionId)->exists()
                || DB::table('notas_subcomponentes')->where('id_seccion', $seccionId)->where('id_periodo', $periodoId)->exists();

            $totalAuditorias = DB::table('supervisiones')->where('horario_id', $horarioId)->count();

            $ultimaSupervision = Supervision::with('supervisor')
                ->where('horario_id', $horarioId)
                ->latest('id')
                ->first();

            return [
                'horario_id'           => $h->id,
                'curso_id'             => $cursoId,
                'curso_nombre'         => $h->curso?->nombre ?? 'Sin Curso',
                'seccion_nombre'       => $h->seccion?->nombre ?? 'A',
                'docente_nombre'       => $h->docente ? "{$h->docente->apellido}, {$h->docente->nombre}" : 'Sin Asignar',
                'docente_dni'          => $h->docente?->dni ?? '---',
                'tiene_silabo'         => $tieneSilabo,
                'total_sesiones'       => $totalSesiones,
                'tiene_archivo'        => $tieneArchivo,
                'tiene_asistencia'     => $tieneAsistencia,
                'tiene_notas'          => $tieneNotas,
                'total_auditorias'     => $totalAuditorias,
                'supervision_guardada' => $ultimaSupervision ? [
                    'id'               => $ultimaSupervision->id,
                    'fecha'            => date('Y-m-d', strtotime($ultimaSupervision->fecha)),
                    'puntaje'          => $ultimaSupervision->puntaje,
                    'estado'           => $ultimaSupervision->estado,
                    'tiene_silabo'     => (bool) $ultimaSupervision->tiene_silabo,
                    'tiene_asistencia' => (bool) $ultimaSupervision->tiene_asistencia,
                    'tiene_archivo'    => (bool) $ultimaSupervision->tiene_archivo,
                    'tiene_notas'      => (bool) $ultimaSupervision->tiene_notas,
                    'observaciones'    => $ultimaSupervision->observaciones,
                    'supervisor'       => $ultimaSupervision->supervisor?->nombre_completo ?? $ultimaSupervision->supervisor?->username ?? 'Supervisor',
                ] : null,
            ];
        });
    }

    private function obtenerHistorialGeneral(int $periodoId, ?int $planEstudioId)
    {
        $query = Supervision::with([
            'horario.curso',
            'horario.docente',
            'horario.seccion',
            'supervisor.personal',
            'supervisor.docente',
            'supervisor.administrador',
        ])
        ->whereHas('horario', function ($q) use ($periodoId, $planEstudioId) {
            $q->where('id_periodo', $periodoId);
            if ($planEstudioId) {
                $q->where('id_plan_estudio', $planEstudioId);
            }
        })
        ->orderByDesc('fecha')
        ->orderByDesc('id')
        ->limit(50);

        return $query->get()->map(function ($s) {
            $u = $s->supervisor;
            $nombreSupervisor = $u?->personal ? "{$u->personal->apellido}, {$u->personal->nombre}" :
                ($u?->docente ? "{$u->docente->apellido}, {$u->docente->nombre}" :
                ($u?->administrador ? "{$u->administrador->apellido}, {$u->administrador->nombre}" : ($u?->nombre_completo ?? $u?->username)));

            return [
                'id'            => $s->id,
                'fecha'         => date('d/m/Y', strtotime($s->fecha)),
                'curso_nombre'  => $s->horario?->curso?->nombre ?? '---',
                'docente_nombre'=> $s->horario?->docente ? "{$s->horario->docente->apellido}, {$s->horario->docente->nombre}" : 'Sin Asignar',
                'seccion'       => $s->horario?->seccion?->nombre ?? 'A',
                'puntaje'       => $s->puntaje,
                'estado'        => $s->estado,
                'observaciones' => $s->observaciones ?? 'Sin observaciones.',
                'supervisor'    => $nombreSupervisor,
            ];
        });
    }

    /**
     * Obtener el detalle completo de evidencias de un curso para su auditoría
     */
    public function detallesCurso($horarioId): JsonResponse
    {
        $horario = Horario::with(['curso', 'docente', 'seccion', 'periodo'])->findOrFail($horarioId);
        $cursoId   = $horario->id_curso;
        $seccionId = $horario->id_seccion;
        $periodoId = $horario->id_periodo;

        // 1. Evidencia: Sílabo
        $silabo = DB::table('silabos')
            ->where('curso_id', $cursoId)
            ->where('id_seccion', $seccionId)
            ->where('id_periodo', $periodoId)
            ->first();

        // 2. Evidencia: Sesiones creadas
        $sesiones = DB::table('sesiones')
            ->where('curso_id', $cursoId)
            ->where(function ($q) use ($horarioId) {
                $q->where('horario_id', $horarioId)->orWhereNull('horario_id');
            })
            ->orderBy('id_sesion')
            ->get();

        // 3. Evidencia: Materiales / Archivos de clase
        $materiales = DB::table('archivos_curso')
            ->where('curso_id', $cursoId)
            ->where('id_seccion', $seccionId)
            ->where('id_periodo', $periodoId)
            ->get();

        // 4. Evidencia: Resumen de Asistencias tomadas
        $asistenciasResumen = DB::table('asistencias as a')
            ->join('matricula_cursos as mc', 'mc.id', '=', 'a.matricula_curso_id')
            ->join('postulantes as p', 'p.id_postulante', '=', 'mc.matricula_id')
            ->where('mc.horario_id', $horarioId)
            ->select(
                'a.fecha',
                'a.sesion_id',
                DB::raw('COUNT(a.id) as total_alumnos'),
                DB::raw("SUM(CASE WHEN a.estado = 'P' OR a.estado = 'Presente' THEN 1 ELSE 0 END) as presentes"),
                DB::raw("SUM(CASE WHEN a.estado = 'F' OR a.estado = 'Falta' THEN 1 ELSE 0 END) as faltas")
            )
            ->groupBy('a.fecha', 'a.sesion_id')
            ->orderByDesc('a.fecha')
            ->get();

        // 5. Evidencia: Matriz de Notas registradas
        $estudiantesMatriculados = DB::table('matricula_cursos as mc')
            ->join('matriculas as m', 'm.id', '=', 'mc.matricula_id')
            ->join('postulantes as p', 'p.id_postulante', '=', 'm.postulante_id')
            ->leftJoin('nota_final as nf', function($join) use ($cursoId, $seccionId) {
                $join->on('nf.estudiante_id', '=', 'p.id_postulante')
                     ->where('nf.curso_id', '=', $cursoId)
                     ->where('nf.id_seccion', '=', $seccionId);
            })
            ->where('mc.horario_id', $horarioId)
            ->select(
                'p.id_postulante',
                'p.dni',
                'p.nombres',
                'p.apellidos',
                'nf.promedio as nota_final'
            )
            ->get();

        return response()->json([
            'silabo'       => $silabo,
            'sesiones'     => $sesiones,
            'materiales'   => $materiales,
            'asistencias'  => $asistenciasResumen,
            'notas'        => $estudiantesMatriculados,
        ]);
    }
}