<?php

namespace App\Http\Controllers;

use App\Models\Silabo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use App\Services\NotificacionService;
use App\Models\Curso;
class SilaboController extends Controller
{
    /**
     * Obtiene o consulta el sílabo actual del contexto activo.
     */
    public function obtenerSilabo(Request $request)
    {
        $cursoId   = $request->input('curso_id');
        $seccionId = session('logros_seccion_id') ?? $request->input('seccion_id');
        $periodoId = session('logros_periodo_id') ?? $request->input('periodo_id');

        $silabo = Silabo::with('usuario')
            ->where('curso_id', $cursoId)
            ->where('id_seccion', $seccionId)
            ->where('id_periodo', $periodoId)
            ->first();

        return response()->json([
            'success' => true,
            'silabo'  => $silabo
        ]);
    }

    /**
     * Guarda o reemplaza el sílabo del curso en la sección/periodo actual.
     */
   public function guardar(Request $request)
    {
        $request->validate([
            'curso_id'   => 'required|integer|exists:cursos,id',
            'seccion_id' => 'nullable|integer',
            'periodo_id' => 'nullable|integer',
            'archivo'    => 'required|file|mimes:pdf,doc,docx|max:10240', // Máx 10MB
        ]);

        $seccionId = session('logros_seccion_id') ?? $request->input('seccion_id');
        $periodoId = session('logros_periodo_id') ?? $request->input('periodo_id');
        /** @var \App\Models\Usuario|null $user */
        $user = Auth::user();

        // Buscar si ya existe un sílabo cargado para este contexto
        $silabo = Silabo::where('curso_id', $request->curso_id)
            ->where('id_seccion', $seccionId)
            ->where('id_periodo', $periodoId)
            ->first();

        // Si existe un archivo anterior, eliminarlo del disco
        if ($silabo && $silabo->archivo && Storage::disk('public')->exists($silabo->archivo)) {
            Storage::disk('public')->delete($silabo->archivo);
        }

        // Subir nuevo archivo a storage/app/public/silabos
        $path = $request->file('archivo')->store('silabos', 'public');

        // Crear o actualizar registro
        $silabo = Silabo::updateOrCreate(
            [
                'curso_id'   => $request->curso_id,
                'id_seccion' => $seccionId,
                'id_periodo' => $periodoId,
            ],
            [
                'usuario_id'   => $user?->id,
                'archivo'      => $path,
                'fecha_subida' => now(),
            ]
        );

        // =========================================================
        // NOTIFICACIÓN A ESTUDIANTES MATRICULADOS
        // =========================================================
        $curso = Curso::find($request->curso_id);
        $nombreCurso = $curso?->nombre ?? 'su unidad didáctica';

        NotificacionService::notificarEstudiantesDeCurso(
            $request->curso_id,
            $seccionId,
            $periodoId,
            "El docente ha publicado un nuevo sílabo para {$nombreCurso}.",
            'silabo',
            route('estudiante.cursos')
        );

        return back()->with('success', 'Sílabo registrado y estudiantes notificados correctamente.');
    }

    /**
     * Descarga / Abre el archivo PDF guardado.
     */
    public function ver($id)
    {
        $silabo = Silabo::findOrFail($id);

        if (!$silabo->archivo || !Storage::disk('public')->exists($silabo->archivo)) {
            return back()->with('error', 'El archivo no existe o fue eliminado.');
        }

        return response()->file(Storage::disk('public')->path($silabo->archivo));
    }

    /**
     * Elimina el registro del sílabo y borra el archivo físico.
     */
    public function eliminar($id)
    {
        $silabo = Silabo::findOrFail($id);

        // Borrar el archivo físico si existe
        if ($silabo->archivo && Storage::disk('public')->exists($silabo->archivo)) {
            Storage::disk('public')->delete($silabo->archivo);
        }

        $silabo->delete();

        return back()->with('success', 'Sílabo eliminado exitosamente.');
    }
}