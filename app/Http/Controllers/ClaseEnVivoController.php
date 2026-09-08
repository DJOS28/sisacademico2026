<?php

namespace App\Http\Controllers;

use App\Models\ClaseEnVivo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClaseEnVivoController extends Controller
{
    /**
     * Obtiene el listado de clases en vivo de la sección activa (vía AJAX).
     */
    public function index(): JsonResponse
    {
        $cursoId   = session('logros_curso_id');
        $seccionId = session('logros_seccion_id');
        $periodoId = session('logros_periodo_id');

        if (!$cursoId || !$seccionId) {
            return response()->json(['error' => 'Sesión no activa.'], 400);
        }

        $clases = ClaseEnVivo::with('sesion')
            ->where('curso_id', $cursoId)
            ->where('id_seccion', $seccionId)
            ->where('id_periodo', $periodoId)
            ->orderBy('fecha_inicio', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json($clases);
    }

    /**
     * Crea/Programa una nueva clase en vivo.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'titulo'       => 'required|string|max:255',
            'sesion_id'    => 'nullable|exists:sesiones,id_sesion',
            'fecha_inicio' => 'required|date',
        ]);

        $cursoId   = session('logros_curso_id');
        $seccionId = session('logros_seccion_id');
        $periodoId = session('logros_periodo_id');

        if (!$cursoId || !$seccionId) {
            return redirect()->back()->withErrors(['error' => 'Sesión de curso vencida.']);
        }

        // Generar un room_name único e impredecible para Jitsi
        $slugTitle  = Str::slug($request->titulo);
        $randomCode = Str::random(8);
        $roomName   = "LMS_C{$cursoId}_S{$seccionId}_P{$periodoId}_{$slugTitle}_{$randomCode}";

        ClaseEnVivo::create([
            'curso_id'     => $cursoId,
            'id_seccion'   => $seccionId,
            'id_periodo'   => $periodoId,
            'sesion_id'    => $request->sesion_id,
            'titulo'       => $request->titulo,
            'room_name'    => $roomName,
            'estado'       => 'programada',
            'fecha_inicio' => $request->fecha_inicio,
        ]);

        return redirect()->back()->with('success', 'Clase en vivo programada correctamente.');
    }

    /**
     * Actualiza el estado de la clase (en_vivo / finalizada).
     */
    public function cambiarEstado(Request $request, $id): JsonResponse
    {
        $request->validate([
            'estado' => 'required|in:programada,en_vivo,finalizada',
        ]);

        $seccionId = session('logros_seccion_id');

        $clase = ClaseEnVivo::where('id', $id)
            ->where('id_seccion', $seccionId)
            ->firstOrFail();

        $updateData = ['estado' => $request->estado];

        if ($request->estado === 'en_vivo' && !$clase->fecha_inicio) {
            $updateData['fecha_inicio'] = now();
        }

        if ($request->estado === 'finalizada') {
            $updateData['fecha_fin'] = now();

            // Calcular automáticamente la duración si tenía fecha de inicio
            if ($clase->fecha_inicio && empty($clase->duracion_minutos)) {
                $updateData['duracion_minutos'] = max(1, (int) now()->diffInMinutes($clase->fecha_inicio));
            }
        }

        $clase->update($updateData);

        return response()->json(['success' => true, 'clase' => $clase]);
    }

    /**
     * Registra o actualiza el enlace de la grabación de la clase.
     */
    public function registrarGrabacion(Request $request, $id): JsonResponse
    {
        $request->validate([
            'url_grabacion'    => ['required', 'url', 'max:500'],
            'duracion_minutos' => ['nullable', 'integer', 'min:1'],
        ], [
            'url_grabacion.required' => 'La URL del video o grabación es obligatoria.',
            'url_grabacion.url'      => 'Debe ingresar un enlace web válido (ej. YouTube, Drive, OneDrive).',
        ]);

        $seccionId = session('logros_seccion_id');

        $clase = ClaseEnVivo::where('id', $id)
            ->where('id_seccion', $seccionId)
            ->firstOrFail();

        $clase->update([
            'url_grabacion'    => trim($request->url_grabacion),
            'duracion_minutos' => $request->duracion_minutos ? (int) $request->duracion_minutos : $clase->duracion_minutos,
            'estado'           => 'finalizada',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Enlace de la grabación registrado con éxito.',
            'clase'   => $clase,
        ]);
    }

    /**
     * Elimina una clase programada.
     */
    public function destroy($id): RedirectResponse
    {
        $seccionId = session('logros_seccion_id');

        $clase = ClaseEnVivo::where('id', $id)
            ->where('id_seccion', $seccionId)
            ->firstOrFail();

        $clase->delete();

        return redirect()->back()->with('success', 'Clase eliminada correctamente.');
    }
}