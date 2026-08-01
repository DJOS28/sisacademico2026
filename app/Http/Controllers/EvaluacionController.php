<?php

namespace App\Http\Controllers;

use App\Models\Evaluacion;
use App\Models\PreguntaEvaluacion;
use App\Models\OpcionPreguntaEvaluacion;
use App\Models\NotaFinalEvaluacion;
use App\Models\Curso;
use App\Models\Seccion;
use App\Models\Periodo;
use App\Models\Horario;
use App\Models\MatriculaCurso;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;

use Exception;

class EvaluacionController extends Controller
{
    /**
     * Retorna la lista de evaluaciones en JSON para el tab de React.
     * Filtra estrictamente por curso_id, seccion_id y periodo_id.
     */
    public function index(Request $request)
    {
        $cursoId   = $request->input('curso_id') ?? session('logros_curso_id');
        $seccionId = $request->input('seccion_id') ?? session('logros_seccion_id');
        $periodoId = $request->input('periodo_id') ?? session('logros_periodo_id');

        if (!$cursoId) {
            return response()->json(['message' => 'No se especificó un curso válido.'], 400);
        }

        $evaluaciones = Evaluacion::with(['preguntas.opciones'])
            ->withCount('preguntas')
            ->where('curso_id', $cursoId)
            ->when($seccionId, fn($q) => $q->where('seccion_id', $seccionId))
            ->when($periodoId, fn($q) => $q->where('periodo_id', $periodoId))
            ->orderBy('fecha_inicio', 'desc')
            ->orderBy('hora_inicio', 'desc')
            ->get();

        return response()->json($evaluaciones);
    }

    /**
     * Formulario o vista para crear evaluación.
     */
    public function create(Request $request)
    {
        $cursoId = $request->input('curso_id') ?? session('logros_curso_id');
        $curso   = Curso::findOrFail($cursoId);

        return view('evaluaciones.create', compact('curso'));
    }

    /**
     * Guarda una nueva evaluación con sus preguntas, opciones y relaciones de sección/periodo.
     */
    public function store(Request $request)
    {
        $request->validate([
            'curso_id'            => 'required|exists:cursos,id',
            'seccion_id'          => 'nullable|exists:secciones,id',
            'periodo_id'          => 'nullable|exists:periodos,id',
            'nombre'              => 'required|string|max:100',
            'fecha_inicio'        => 'required|date',
            'hora_inicio'         => 'required',
            'fecha_fin'           => 'required|date|after_or_equal:fecha_inicio',
            'hora_fin'            => 'required',
            'preguntas'           => 'required|array|min:1',
            'preguntas.*.texto'   => 'required|string',
            'preguntas.*.tipo'    => 'required|in:corta,opcion,v_f',
            'preguntas.*.puntaje' => 'required|numeric|min:0.5',
        ]);

        DB::beginTransaction();
        try {
            // 1. Crear cabecera de la evaluación asignando sección y periodo
            $evaluacion = Evaluacion::create([
                'curso_id'     => $request->curso_id,
                'seccion_id'   => $request->seccion_id,
                'periodo_id'   => $request->periodo_id,
                'nombre'       => $request->nombre,
                'fecha_inicio' => $request->fecha_inicio,
                'hora_inicio'  => $request->hora_inicio,
                'fecha_fin'    => $request->fecha_fin,
                'hora_fin'     => $request->hora_fin,
            ]);

            // 2. Insertar preguntas y opciones
            foreach ($request->preguntas as $pIndex => $pData) {
                $rutaImagen = null;
                if ($request->hasFile("preguntas.{$pIndex}.imagen")) {
                    $rutaImagen = $request->file("preguntas.{$pIndex}.imagen")->store('evaluaciones/preguntas', 'public');
                }

                $pregunta = PreguntaEvaluacion::create([
                    'evaluacion_id' => $evaluacion->id_evaluacion,
                    'pregunta'      => $pData['texto'],
                    'tipo'          => $pData['tipo'],
                    'puntaje'       => $pData['puntaje'],
                    'imagen'        => $rutaImagen,
                ]);

                if (in_array($pData['tipo'], ['opcion', 'v_f']) && isset($pData['opciones'])) {
                    foreach ($pData['opciones'] as $oData) {
                        OpcionPreguntaEvaluacion::create([
                            'pregunta_id' => $pregunta->id_pregunta,
                            'opcion'      => $oData['texto'],
                            'es_correcta' => isset($oData['es_correcta']) && ($oData['es_correcta'] == '1' || $oData['es_correcta'] === true) ? 1 : 0,
                        ]);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'success'    => true,
                'message'    => 'Evaluación creada exitosamente.',
                'evaluacion' => $evaluacion
            ], 201);

        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al guardar la evaluación: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualiza una evaluación existente enviada desde el modal de React.
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'seccion_id'          => 'nullable|exists:secciones,id',
            'periodo_id'          => 'nullable|exists:periodos,id',
            'nombre'              => 'required|string|max:100',
            'fecha_inicio'        => 'required|date',
            'hora_inicio'         => 'required',
            'fecha_fin'           => 'required|date|after_or_equal:fecha_inicio',
            'hora_fin'            => 'required',
            'preguntas'           => 'required|array|min:1',
            'preguntas.*.texto'   => 'required|string',
            'preguntas.*.tipo'    => 'required|in:corta,opcion,v_f',
            'preguntas.*.puntaje' => 'required|numeric|min:0.5',
        ]);

        DB::beginTransaction();
        try {
            $evaluacion = Evaluacion::findOrFail($id);

            // Actualizar la cabecera
            $evaluacion->update([
                'seccion_id'   => $request->seccion_id ?? $evaluacion->seccion_id,
                'periodo_id'   => $request->periodo_id ?? $evaluacion->periodo_id,
                'nombre'       => $request->nombre,
                'fecha_inicio' => $request->fecha_inicio,
                'hora_inicio'  => $request->hora_inicio,
                'fecha_fin'    => $request->fecha_fin,
                'hora_fin'     => $request->hora_fin,
            ]);

            // Reemplazar preguntas/opciones para sincronizar cambios limpia y atómicamente
            $evaluacion->preguntas()->delete();

            foreach ($request->preguntas as $pIndex => $pData) {
                $rutaImagen = null;
                if ($request->hasFile("preguntas.{$pIndex}.imagen")) {
                    $rutaImagen = $request->file("preguntas.{$pIndex}.imagen")->store('evaluaciones/preguntas', 'public');
                }

                $pregunta = PreguntaEvaluacion::create([
                    'evaluacion_id' => $evaluacion->id_evaluacion,
                    'pregunta'      => $pData['texto'],
                    'tipo'          => $pData['tipo'],
                    'puntaje'       => $pData['puntaje'],
                    'imagen'        => $rutaImagen,
                ]);

                if (in_array($pData['tipo'], ['opcion', 'v_f']) && isset($pData['opciones'])) {
                    foreach ($pData['opciones'] as $oData) {
                        OpcionPreguntaEvaluacion::create([
                            'pregunta_id' => $pregunta->id_pregunta,
                            'opcion'      => $oData['texto'],
                            'es_correcta' => isset($oData['es_correcta']) && ($oData['es_correcta'] == '1' || $oData['es_correcta'] === true) ? 1 : 0,
                        ]);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Evaluación actualizada correctamente.'
            ], 200);

        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la evaluación: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Muestra las respuestas y notas de los estudiantes para una evaluación.
     */
   
    /**
     * Eliminar una evaluación mediante AJAX.
     */
    public function destroy($id)
    {
        try {
            $evaluacion = Evaluacion::findOrFail($id);
            $evaluacion->delete();

            return response()->json([
                'success' => true,
                'message' => 'Evaluación eliminada correctamente.'
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error al intentar eliminar la evaluación.'
            ], 500);
        }
    }

   public function verResultados($evaluacion_id): JsonResponse
{
    // 1. Obtener los datos de la evaluación y la cantidad de preguntas
    $evaluacion = Evaluacion::withCount('preguntas')->findOrFail($evaluacion_id);
    $totalPreguntas = $evaluacion->preguntas_count ?? 0;

    // 2. Determinar el horario de la sección
    $cursoId   = session('logros_curso_id') ?? $evaluacion->curso_id;
    $seccionId = session('logros_seccion_id') ?? $evaluacion->seccion_id;
    $periodoId = session('logros_periodo_id') ?? $evaluacion->periodo_id;

    $horarioId = Horario::where('id_curso', $cursoId)
        ->where('id_seccion', $seccionId)
        ->where('id_periodo', $periodoId)
        ->value('id');

    // 3. Obtener el listado oficial de estudiantes matriculados
    $estudiantes = MatriculaCurso::with('estudiante')
        ->where('horario_id', $horarioId)
        ->get()
        ->map(fn($item) => [
            'estudiante_id'   => $item->estudiante?->id_postulante ?? $item->estudiante?->id,
            'codigo'          => $item->estudiante?->codigo_postulante ?? $item->estudiante?->dni ?? 'S/N',
            'estudiante_nombre' => $item->estudiante?->nombre_completo 
                ?? trim(($item->estudiante?->nombres ?? '') . ' ' . ($item->estudiante?->apellidos ?? '')),
        ])
        ->filter(fn($e) => !is_null($e['estudiante_id']))
        ->keyBy('estudiante_id');

    // 4. Calcular puntajes y aciertos agrupados desde respuestas_estudiante_evaluacion
    $respuestasCalculadas = DB::table('respuestas_estudiante_evaluacion')
        ->where('evaluacion_id', $evaluacion_id)
        ->select(
            'estudiante_id',
            DB::raw("COALESCE(SUM(puntaje_obtenido), 0) as puntaje_total"),
            DB::raw("SUM(CASE WHEN es_correcta = 1 THEN 1 ELSE 0 END) as respuestas_correctas")
        )
        ->groupBy('estudiante_id')
        ->get()
        ->keyBy('estudiante_id');

    // 5. Unificar listado oficial con las notas obtenidas
    $resultados = $estudiantes->map(function ($est) use ($respuestasCalculadas, $totalPreguntas) {
        $respuesta = $respuestasCalculadas->get($est['estudiante_id']);

        return [
            'estudiante_id'     => $est['estudiante_id'],
            'codigo'            => $est['codigo'],
            'estudiante_nombre' => $est['estudiante_nombre'],
            'respuestas_correctas' => $respuesta ? (int) $respuesta->respuestas_correctas : 0,
            'total_preguntas'   => $totalPreguntas,
            'puntaje_total'     => $respuesta ? (float) $respuesta->puntaje_total : 0.0,
        ];
    })->sortBy('estudiante_nombre')->values();

    // 6. Retornar el JSON listo para el modal en React
    return response()->json($resultados);
}

}