<?php

namespace App\Http\Controllers;

use App\Models\Curso;
use App\Models\Seccion;
use App\Models\Periodo;
use App\Models\Instituto;
use App\Models\Horario;
use App\Models\LogroCurso;
use App\Models\MatriculaCurso;
use App\Models\NotaFinal;
use App\Models\NotaLogro;
use App\Models\NotaSubcomponente;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Usuario; // IMPORTANTE: Usar la clase Usuario

use Illuminate\Support\Facades\Auth;

class NotasController extends Controller
{
    /**
     * Obtener matriz completa de notas para la vista en vivo
     */
    public function getMatrizNotas(): JsonResponse
    {
        $cursoId   = session('logros_curso_id');
        $seccionId = session('logros_seccion_id');
        $periodoId = session('logros_periodo_id');

        if (!$cursoId || !$seccionId) {
            return response()->json(['error' => 'Sesión de curso no activa.'], 400);
        }

        // 1. Horario específico de esta sección y periodo
        $horarioId = Horario::where('id_curso', $cursoId)
            ->where('id_seccion', $seccionId)
            ->where('id_periodo', $periodoId)
            ->value('id');

        // 2. Estudiantes matriculados en esta sección
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

        // 3. Logros ESPECÍFICOS de esta Sección y Periodo
        $logros = LogroCurso::with(['subcomponentes' => function ($query) {
                $query->orderBy('id', 'asc');
            }])
            ->where('curso_id', $cursoId)
            ->where('id_seccion', $seccionId)
            ->where('id_periodo', $periodoId)
            ->orderBy('id', 'asc')
            ->get();

        // 4. Mapeo de notas filtradas por estudiante, sección y periodo
        $estudianteIds    = $estudiantes->pluck('estudiante_id');
        $subcomponenteIds = $logros->pluck('subcomponentes')->flatten()->pluck('id');

        $notasSubcomponentes = NotaSubcomponente::whereIn('estudiante_id', $estudianteIds)
            ->whereIn('subcomponente_id', $subcomponenteIds)
            ->where('id_seccion', $seccionId)
            ->get();

        $notasLogros = NotaLogro::whereIn('estudiante_id', $estudianteIds)
            ->where('curso_id', $cursoId)
            ->where('id_seccion', $seccionId)
            ->whereIn('logro_curso_id', $logros->pluck('id'))
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
     * Guardar o actualizar la matriz de notas en la BD
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

    $cursoId   = session('logros_curso_id');
    $seccionId = session('logros_seccion_id');
    $periodoId = session('logros_periodo_id');

    if (!$cursoId || !$seccionId) {
        return response()->json(['error' => 'Sesión de curso no activa.'], 400);
    }

    try {
        DB::transaction(function () use ($request, $cursoId, $seccionId, $periodoId) {
            
            // 1. Guardar o borrar Notas por Subcomponente
            if ($request->has('notas_subcomponentes')) {
                foreach ($request->notas_subcomponentes as $item) {
                    if ($item['nota'] !== null && $item['nota'] !== '') {
                        NotaSubcomponente::updateOrCreate(
                            [
                                'estudiante_id'    => $item['estudiante_id'],
                                'subcomponente_id' => $item['subcomponente_id'],
                            ],
                            [
                                'nota'       => $item['nota'],
                                'id_seccion' => $seccionId,
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

            // 2. Guardar Notas por Logros Manuales o Calculados
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
                            ->where('id_seccion', $seccionId)
                            ->delete();
                    }
                }
            }

            // 3. Guardar Notas Finales
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
                                'usuario'    => auth()->user()?->name ?? 'SISTEMA',
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

        return response()->json(['success' => true, 'message' => 'Calificaciones actualizadas correctamente.']);

    } catch (\Exception $e) {
        Log::error('Error en guardarNotasMatriz: ' . $e->getMessage());
        return response()->json(['error' => 'Ocurrió un error en el servidor al guardar.'], 500);
    }
}

    /**
     * Generar Reporte Consolidado de Notas en PDF
     */
   /**
 * Generar Reporte Consolidado de Notas en PDF
 */
public function generarPdfReporte(Request $request)
{
    $cursoId   = session('logros_curso_id') ?? $request->input('curso_id');
    $seccionId = session('logros_seccion_id') ?? $request->input('seccion_id');
    $periodoId = session('logros_periodo_id') ?? $request->input('periodo_id');

    // 1. Cargar el Instituto dinámico con la jerarquía: Distrito -> Provincia -> Departamento
    $instituto = Instituto::with(['distrito.provincia.departamento'])->first();

    // Extraer datos de ubicación desde las relaciones de la BD
    $distrito     = $instituto?->distrito;
    $provincia    = $distrito?->provincia;
    $departamento = $provincia?->departamento;

    // 2. Cargar Curso con Semestre y Plan de Estudios
    $curso   = Curso::with(['semestre', 'planesEstudio'])->findOrFail($cursoId);
    $seccion = Seccion::findOrFail($seccionId);
    $periodo = Periodo::find($periodoId);
    
    // Obtener el Plan de Estudio dinámico de la relación
    $planEstudio = $curso->planesEstudio->first();

    // 3. Obtener el nombre del docente autenticado utilizando su accessor de perfil
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
        ->whereIn('logro_curso_id', $logros->pluck('id'))
        ->get();

    $notasFinales = NotaFinal::whereIn('estudiante_id', $estudianteIds)
        ->where('curso_id', $cursoId)
        ->where('id_seccion', $seccionId)
        ->get();

    // Construcción del array dinámico sin strings estáticos hardcodeados
    $curso_info = [
        'curso'      => $curso->nombre,
        'carrera'    => $planEstudio?->nombre ?? 'Sin Plan de Estudio',
        'periodo'    => $periodo?->nombre ?? 'N/A',
        'semestre'   => $curso->semestre?->nombre ?? 'N/A',
        'docente'    => $nombreDocente,
        'tipo'       => $planEstudio?->tipo ?? 'Transversal',
        'resolucion' => $planEstudio?->resolucion ?? 'Sin Resolución',
    ];

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

    if (!$cursoId) {
        abort(404, 'No se especificó un curso válido.');
    }

    // 1. Cargar Instituto dinámico con jerarquía completa
    $instituto = Instituto::with(['distrito.provincia.departamento'])->first();

    $distrito     = $instituto?->distrito;
    $provincia    = $distrito?->provincia;
    $departamento = $provincia?->departamento;

    // 2. Cargar Curso, Sección y Periodo
    $curso       = Curso::with(['semestre', 'planesEstudio'])->findOrFail($cursoId);
    $seccion     = Seccion::find($seccionId);
    $periodo     = Periodo::find($periodoId);
    $planEstudio = $curso->planesEstudio->first();

    // 3. Usuario Docente autenticado
    /** @var \App\Models\Usuario|null $usuarioDocente */
    $usuarioDocente = auth()->user();
    $nombreDocente  = $usuarioDocente?->nombre_completo ?? $usuarioDocente?->username ?? 'No asignado';

    // 4. Obtener Horario exacto del grupo
    $horarioId = Horario::where('id_curso', $cursoId)
        ->where('id_seccion', $seccionId)
        ->where('id_periodo', $periodoId)
        ->value('id');

    // 5. Obtener los estudiantes matriculados en ese horario
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

    // 6. Consultar las Notas Finales registradas
    $notasFinales = NotaFinal::whereIn('estudiante_id', $estudianteIds)
        ->where('curso_id', $cursoId)
        ->where('id_seccion', $seccionId)
        ->get()
        ->keyBy('estudiante_id');

    // 7. Asociar nota a cada estudiante, ordenar de mayor a menor y tomar los Top 5
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

    // 8. Array de información del curso para el encabezado
    $curso_info = [
        'curso'      => $curso->nombre,
        'carrera'    => $planEstudio?->nombre ?? 'Sin Plan de Estudio',
        'periodo'    => $periodo?->nombre ?? 'N/A',
        'semestre'   => $curso->semestre?->nombre ?? 'N/A',
        'docente'    => $nombreDocente,
        'tipo'       => $planEstudio?->tipo ?? 'Transversal',
        'resolucion' => $planEstudio?->resolucion ?? 'Sin Resolución',
    ];

    // 9. Cargar vista del PDF Ranking Top 5
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

    if (!$cursoId) {
        abort(404, 'No se especificó un curso válido.');
    }

    // 1. Cargar Instituto dinámico con jerarquía completa
    $instituto = Instituto::with(['distrito.provincia.departamento'])->first();

    $distrito     = $instituto?->distrito;
    $provincia    = $distrito?->provincia;
    $departamento = $provincia?->departamento;

    // 2. Cargar Curso, Sección y Periodo
    $curso       = Curso::with(['semestre', 'planesEstudio'])->findOrFail($cursoId);
    $seccion     = Seccion::find($seccionId);
    $periodo     = Periodo::find($periodoId);
    $planEstudio = $curso->planesEstudio->first();

    // 3. Usuario Docente autenticado
    /** @var \App\Models\Usuario|null $usuarioDocente */
    $usuarioDocente = auth()->user();
    $nombreDocente  = $usuarioDocente?->nombre_completo ?? $usuarioDocente?->username ?? 'No asignado';

    // 4. Obtener Horario exacto del grupo
    $horarioId = Horario::where('id_curso', $cursoId)
        ->where('id_seccion', $seccionId)
        ->where('id_periodo', $periodoId)
        ->value('id');

    // 5. Obtener únicamente los estudiantes matriculados ordenados alfabéticamente
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

    // 6. Encabezado e información general del curso
    $curso_info = [
        'curso'      => $curso->nombre,
        'carrera'    => $planEstudio?->nombre ?? 'Sin Plan de Estudio',
        'periodo'    => $periodo?->nombre ?? 'N/A',
        'semestre'   => $curso->semestre?->nombre ?? 'N/A',
        'docente'    => $nombreDocente,
        'tipo'       => $planEstudio?->tipo ?? 'Transversal',
        'resolucion' => $planEstudio?->resolucion ?? 'Sin Resolución',
    ];

    // 7. Cargar la vista Blade para la nómina
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

    // 1. Cargar datos completos del Curso
    $curso = Curso::with(['moduloformativo', 'semestre', 'planesEstudio', 'docentes'])->findOrFail($cursoId);

    // 2. Periodo activo
    $periodoActivo = Periodo::where('activo', 1)->first() 
        ?? Periodo::find(session('logros_periodo_id')) 
        ?? abort(404, 'No se encontró un periodo académico activo.');

    // 3. Obtener Usuario Docente Autenticado (Modelo Usuario)
    /** @var Usuario|null $usuarioDocente */
    $usuarioDocente = Auth::user();

    // Si la tabla de horarios o la relación guarda directamente el ID de usuario o id_docente
    $docenteId = $usuarioDocente?->docente?->id ?? $usuarioDocente?->id;

    // 4. Validar el horario/permiso del docente para esta asignatura
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

    // 5. Datos del Instituto e imagen corporativa
    $instituto = Instituto::first();

    $logoPath = ($instituto && $instituto->logo && file_exists(public_path('storage/' . $instituto->logo)))
        ? public_path('storage/' . $instituto->logo)
        : public_path('images/logo-default.png');

    // 6. Estudiantes matriculados en la sección
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

    // 7. Sesiones y Asistencias
    $sesiones = DB::table('sesiones')
        ->where('curso_id', $cursoId)
        ->orderBy('fecha', 'asc')
        ->get();

    $asistencias = DB::table('asistencias')
        ->whereIn('matricula_curso_id', $estudiantes->pluck('matricula_curso_id'))
        ->get()
        ->groupBy('matricula_curso_id')
        ->map(fn($items) => $items->keyBy('sesion_id'));

    // 8. Logros del curso
    $logros = DB::table('logros_curso')
        ->where('curso_id', $cursoId)
        ->orderBy('id', 'asc')
        ->get();

    // 9. Cargar y agrupar Calificaciones por Estudiante
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

    // Nombre completo desde tu modelo Usuario
    $nombreDocente = $usuarioDocente?->nombre_completo ?? $usuarioDocente?->username ?? 'No asignado';

    // 10. Renderizar PDF
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