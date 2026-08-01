<?php

namespace App\Http\Controllers;

use App\Models\Curso;
use App\Models\LogroCurso;
use App\Models\Periodo;
use App\Models\Seccion;
use App\Models\SubcomponenteLogro;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
class LogroCursoController extends Controller
{
    /**
     * Muestra la lista de logros y subcomponentes para un curso y sección específicos.
     */
   public function index(Request $request): Response|RedirectResponse
{
    $usuario = $request->user();
    $docenteId = $usuario->docente?->id ?? $usuario->id;

    // 1. Intentamos obtener de la petición POST/GET, si no vienen, los buscamos de la SESIÓN
    $cursoId   = $request->input('curso_id') ?? session('logros_curso_id');
    $seccionId = $request->input('seccion_id') ?? session('logros_seccion_id');
    $periodoId = $request->input('periodo_id') ?? session('logros_periodo_id') ?? Periodo::orderBy('id', 'desc')->first()?->id;

    // Si sigue sin haber datos (ej. un GET directo sin previa selección), recién redirige a mis cursos
    if (!$cursoId || !$seccionId) {
        return redirect()->route('docente.cursos');
    }

    // 2. Guardamos o refrescamos la sesión activa
    session([
        'logros_curso_id'   => $cursoId,
        'logros_seccion_id' => $seccionId,
        'logros_periodo_id' => $periodoId,
    ]);

    $curso   = Curso::findOrFail($cursoId);
    $seccion = Seccion::findOrFail($seccionId);
    $periodo = Periodo::find($periodoId);

    $logros = LogroCurso::with('subcomponentes')
        ->where('curso_id', $cursoId)
        ->where('id_seccion', $seccionId)
        ->where('id_periodo', $periodoId)
        ->where('id_docente', $docenteId)
        ->orderBy('id', 'asc')
        ->get();

    return Inertia::render('Docentes/Cursos/Logros/Index', [
        'curso'   => $curso,
        'seccion' => $seccion,
        'periodo' => $periodo,
        'logros'  => $logros,
    ]);
}

public function storeLogro(Request $request)
{
    $request->validate([
        'curso_id'    => 'required|exists:cursos,id',
        'seccion_id'  => 'required|exists:secciones,id',
        'periodo_id'  => 'required|exists:periodos,id',
        'nombre'      => 'required|string|max:100',
        'descripcion' => 'nullable|string',
    ]);

    // Nos aseguramos de mantener la sesión activa actualizada
    session([
        'logros_curso_id'   => $request->curso_id,
        'logros_seccion_id' => $request->seccion_id,
        'logros_periodo_id' => $request->periodo_id,
    ]);

    $docenteId = $request->user()->docente?->id ?? $request->user()->id;

    LogroCurso::create([
        'curso_id'    => $request->curso_id,
        'id_seccion'  => $request->seccion_id,
        'id_periodo'  => $request->periodo_id,
        'id_docente'  => $docenteId,
        'nombre'      => $request->nombre,
        'descripcion' => $request->descripcion,
    ]);

    return redirect()->back()->with('success', 'Logro de aprendizaje creado exitosamente.');
}

    /**
     * Actualiza un logro existente.
     */
    public function updateLogro(Request $request, LogroCurso $logro)
    {
        $request->validate([
            'nombre'      => 'required|string|max:100',
            'descripcion' => 'nullable|string',
        ]);

        $logro->update([
            'nombre'      => $request->nombre,
            'descripcion' => $request->descripcion,
        ]);

        return redirect()->back()->with('success', 'Logro actualizado correctamente.');
    }

    /**
     * Elimina un logro y sus subcomponentes asociados.
     */
    public function destroyLogro(LogroCurso $logro)
    {
        // Se eliminan primero los subcomponentes asociados
        $logro->subcomponentes()->delete();
        $logro->delete();

        return redirect()->back()->with('success', 'Logro eliminado correctamente.');
    }

    /**
     * Agrega un subcomponente/criterio a un logro específico.
     */
    public function storeSubcomponente(Request $request, LogroCurso $logro)
    {
        $request->validate([
            'nombre'      => 'required|string|max:100',
            'descripcion' => 'nullable|string',
            'peso'        => 'required|numeric|min:0|max:100',
        ]);

        $logro->subcomponentes()->create([
            'nombre'      => $request->nombre,
            'descripcion' => $request->descripcion,
            'peso'        => $request->peso,
        ]);

        return redirect()->back()->with('success', 'Subcomponente agregado exitosamente.');
    }

    /**
     * Elimina un subcomponente de evaluación.
     */
    public function destroySubcomponente(SubcomponenteLogro $subcomponente)
    {
        $subcomponente->delete();

        return redirect()->back()->with('success', 'Subcomponente eliminado correctamente.');
    }
}