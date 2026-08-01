<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Tarea;
use App\Models\EnvioTarea;
use App\Models\CalificacionTarea;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class TareaController extends Controller
{
    /**
     * Obtener el listado de tareas filtrado estrictamente por curso, sección y periodo.
     */
    public function index(Request $request)
    {
        // Unificación de nombres de parámetros desde Request y Session
        $cursoId   = $request->input('curso_id') ?? session('logros_curso_id') ?? session('curso_id');
        $seccionId = $request->input('seccion_id') ?? $request->input('id_seccion') ?? session('logros_seccion_id') ?? session('id_seccion');
        $periodoId = $request->input('periodo_id') ?? $request->input('id_periodo') ?? session('logros_periodo_id') ?? session('id_periodo');

        if (!$cursoId) {
            return response()->json(['message' => 'No se especificó un curso válido.'], 400);
        }

        $tareas = Tarea::query()
            ->when(method_exists(Tarea::class, 'sesion'), function ($q) {
                $q->with('sesion');
            })
            ->when(method_exists(Tarea::class, 'subcomponente'), function ($q) {
                $q->with('subcomponente');
            })
            ->when(method_exists(Tarea::class, 'envios'), function ($q) {
                $q->withCount('envios');
            })
            ->seccionActual($cursoId, $seccionId, $periodoId)
            ->orderBy('fecha', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json($tareas);
    }

    /**
     * Registrar una nueva tarea asignada explícitamente a la sección y periodo activos.
     */
    public function store(Request $request)
    {
        // Unificación de nombres de parámetros
        $cursoId   = $request->input('curso_id') ?? session('logros_curso_id') ?? session('curso_id');
        $seccionId = $request->input('seccion_id') ?? $request->input('id_seccion') ?? session('logros_seccion_id') ?? session('id_seccion');
        $periodoId = $request->input('periodo_id') ?? $request->input('id_periodo') ?? session('logros_periodo_id') ?? session('id_periodo');

        $request->validate([
            'nombre'           => 'required|string|max:150',
            'descripcion'      => 'nullable|string',
            'fecha'            => 'required|date',
            'fecha_fin'        => 'required|date|after_or_equal:fecha',
            'hora_inicio'      => 'nullable',
            'hora_fin'         => 'nullable',
            'sesion_id'        => 'nullable|exists:sesiones,id_sesion',
            'subcomponente_id' => 'nullable',
            'archivo'          => 'nullable|file|mimes:pdf,doc,docx,zip,rar,png,jpg|max:10240',
        ]);

        $pathArchivo = null;
        if ($request->hasFile('archivo')) {
            $pathArchivo = $request->file('archivo')->store('tareas/guias', 'public');
        }

        $tarea = Tarea::create([
            'nombre'           => $request->nombre,
            'descripcion'      => $request->descripcion,
            'subcomponente_id' => $request->subcomponente_id ?: null,
            'fecha'            => $request->fecha,
            'fecha_fin'        => $request->fecha_fin,
            'hora_inicio'      => $request->hora_inicio ?? '08:00',
            'hora_fin'         => $request->hora_fin ?? '23:59',
            'archivo'          => $pathArchivo,
            'sesion_id'        => $request->sesion_id ?: null,
            'curso_id'         => $cursoId,
            'id_seccion'       => $seccionId,
            'id_periodo'       => $periodoId,
        ]);

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Tarea creada con éxito.', 'tarea' => $tarea], 201);
        }

        return back()->with('success', 'Tarea creada con éxito.');
    }

    /**
     * Obtener las entregas enviadas por los alumnos para una tarea específica.
     */
    public function verEntregas($id)
    {
        $tarea = Tarea::with(['envios.estudiante', 'envios.calificacion'])->findOrFail($id);

        return response()->json($tarea);
    }

    /**
     * Registrar o actualizar la calificación y observación de una entrega de alumno.
     */
    public function calificar(Request $request, $envioId)
    {
        $request->validate([
            'nota'        => 'required|numeric|min:0|max:20',
            'observacion' => 'nullable|string',
        ]);

        $envio = EnvioTarea::findOrFail($envioId);

        DB::transaction(function () use ($envio, $request) {
            CalificacionTarea::updateOrCreate(
                ['envio_tarea_id' => $envio->id],
                [
                    'nota'        => $request->nota,
                    'observacion' => $request->observacion,
                ]
            );
        });

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Calificación registrada correctamente.']);
        }

        return back()->with('success', 'Calificación registrada correctamente.');
    }

    /**
     * Eliminar una tarea y su archivo del servidor.
     */
    public function destroy($id, Request $request)
    {
        $tarea = Tarea::findOrFail($id);

        if ($tarea->archivo && Storage::disk('public')->exists($tarea->archivo)) {
            Storage::disk('public')->delete($tarea->archivo);
        }

        $tarea->delete();

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Tarea eliminada correctamente.']);
        }

        return back()->with('success', 'Tarea eliminada correctamente.');
    }
}