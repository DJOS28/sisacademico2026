<?php

namespace App\Http\Controllers;

use App\Models\Curso;
use App\Models\LogroCurso;
use App\Models\Periodo;
use App\Models\Seccion;
use App\Models\SubcomponenteLogro;
use App\Services\AuditoriaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class LogroCursoController extends Controller
{
    /**
     * Muestra la lista de logros, dimensiones (con sus pesos) y criterios asociados.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $usuario = $request->user();
        $docenteId = $usuario->docente?->id ?? $usuario->id;

        // 1. Obtener parámetros de la petición o de la sesión
        $cursoId   = $request->input('curso_id') ?? session('logros_curso_id');
        $seccionId = $request->input('seccion_id') ?? session('logros_seccion_id');
        $periodoId = $request->input('periodo_id') ?? session('logros_periodo_id') ?? Periodo::orderBy('id', 'desc')->first()?->id;

        if (!$cursoId || !$seccionId) {
            return redirect()->route('docente.cursos');
        }

        // 2. Guardar o refrescar la sesión activa
        session([
            'logros_curso_id'   => $cursoId,
            'logros_seccion_id' => $seccionId,
            'logros_periodo_id' => $periodoId,
        ]);

        $curso   = Curso::findOrFail($cursoId);
        $seccion = Seccion::findOrFail($seccionId);
        $periodo = Periodo::find($periodoId);

        // 3. Cargar logros junto a sus subcomponentes (dimensiones) y los criterios de cada dimensión
        $logros = LogroCurso::with([
            'subcomponentes' => function ($q) {
                $q->orderBy('id', 'asc');
            },
            'subcomponentes.criterios' => function ($q) {
                $q->orderBy('orden', 'asc')->orderBy('id', 'asc');
            },
        ])
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

    /**
     * Registra un nuevo logro de aprendizaje.
     */
    public function storeLogro(Request $request): RedirectResponse
    {
        $request->validate([
            'curso_id'    => 'required|exists:cursos,id',
            'seccion_id'  => 'required|exists:secciones,id',
            'periodo_id'  => 'required|exists:periodos,id',
            'nombre'      => 'required|string|max:100',
            'descripcion' => 'nullable|string',
        ]);

        session([
            'logros_curso_id'   => $request->curso_id,
            'logros_seccion_id' => $request->seccion_id,
            'logros_periodo_id' => $request->periodo_id,
        ]);

        $docenteId = $request->user()->docente?->id ?? $request->user()->id;

        try {
            $logro = LogroCurso::create([
                'curso_id'    => $request->curso_id,
                'id_seccion'  => $request->seccion_id,
                'id_periodo'  => $request->periodo_id,
                'id_docente'  => $docenteId,
                'nombre'      => $request->nombre,
                'descripcion' => $request->descripcion,
            ]);

            // Auditoría: j) Evaluación académica y Registro Auxiliar
            AuditoriaService::registrar(
                componente: 'evaluacion_academica',
                operacion: 'INSERTAR',
                descripcion: "Logro de aprendizaje creado: '{$logro->nombre}' en Curso ID {$request->curso_id} (Sección ID: {$request->seccion_id})",
                registroId: (string) $logro->id,
                nuevos: [
                    'curso_id'    => $request->curso_id,
                    'seccion_id'  => $request->seccion_id,
                    'periodo_id'  => $request->periodo_id,
                    'docente_id'  => $docenteId,
                    'nombre'      => $request->nombre,
                    'descripcion' => $request->descripcion,
                ],
                resultado: 'EXITO'
            );

            return redirect()->back()->with('success', 'Logro de aprendizaje creado exitosamente.');
        } catch (Throwable $e) {
            AuditoriaService::registrar(
                componente: 'evaluacion_academica',
                operacion: 'INSERTAR',
                descripcion: "Fallo al registrar logro '{$request->nombre}' en Curso ID {$request->curso_id}",
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return redirect()->back()->withErrors(['error' => 'Error al crear el logro: ' . $e->getMessage()]);
        }
    }

    /**
     * Actualiza un logro existente.
     */
    public function updateLogro(Request $request, LogroCurso $logro): RedirectResponse
    {
        $request->validate([
            'nombre'      => 'required|string|max:100',
            'descripcion' => 'nullable|string',
        ]);

        $datosAnteriores = $logro->only(['nombre', 'descripcion']);

        try {
            $logro->update([
                'nombre'      => $request->nombre,
                'descripcion' => $request->descripcion,
            ]);

            // Auditoría: j) Evaluación académica y Registro Auxiliar
            AuditoriaService::registrar(
                componente: 'evaluacion_academica',
                operacion: 'ACTUALIZAR',
                descripcion: "Logro de aprendizaje actualizado (ID: {$logro->id}) en Curso ID {$logro->curso_id}",
                registroId: (string) $logro->id,
                anteriores: $datosAnteriores,
                nuevos: [
                    'nombre'      => $request->nombre,
                    'descripcion' => $request->descripcion,
                ],
                resultado: 'EXITO'
            );

            return redirect()->back()->with('success', 'Logro actualizado correctamente.');
        } catch (Throwable $e) {
            AuditoriaService::registrar(
                componente: 'evaluacion_academica',
                operacion: 'ACTUALIZAR',
                descripcion: "Fallo al actualizar el logro ID {$logro->id}",
                registroId: (string) $logro->id,
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return redirect()->back()->withErrors(['error' => 'Error al actualizar el logro: ' . $e->getMessage()]);
        }
    }

    /**
     * Elimina un logro y sus subcomponentes/criterios asociados en cascada.
     */
    public function destroyLogro(LogroCurso $logro): RedirectResponse
    {
        $datosEliminados = [
            'id'          => $logro->id,
            'nombre'      => $logro->nombre,
            'curso_id'    => $logro->curso_id,
            'seccion_id'  => $logro->id_seccion,
            'periodo_id'  => $logro->id_periodo,
        ];

        try {
            foreach ($logro->subcomponentes as $sub) {
                $sub->criterios()->delete();
                $sub->delete();
            }

            $logro->delete();

            // Auditoría: j) Evaluación académica y Registro Auxiliar
            AuditoriaService::registrar(
                componente: 'evaluacion_academica',
                operacion: 'ELIMINAR',
                descripcion: "Logro de aprendizaje eliminado: '{$datosEliminados['nombre']}' (ID: {$datosEliminados['id']}) junto con sus dimensiones y criterios",
                registroId: (string) $datosEliminados['id'],
                anteriores: $datosEliminados,
                resultado: 'EXITO'
            );

            return redirect()->back()->with('success', 'Logro eliminado correctamente.');
        } catch (Throwable $e) {
            AuditoriaService::registrar(
                componente: 'evaluacion_academica',
                operacion: 'ELIMINAR',
                descripcion: "Fallo al eliminar el logro ID {$logro->id}",
                registroId: (string) $logro->id,
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return redirect()->back()->withErrors(['error' => 'Error al eliminar el logro: ' . $e->getMessage()]);
        }
    }

    /**
     * Agrega un subcomponente (dimensión) con su respectivo peso a un logro.
     */
    public function storeSubcomponente(Request $request, LogroCurso $logro): RedirectResponse
    {
        $request->validate([
            'nombre'      => 'required|string|max:300',
            'descripcion' => 'nullable|string',
            'peso'        => 'required|numeric|min:0|max:100',
        ]);

        try {
            $nombreNormalizado = strtoupper(trim($request->nombre));

            $subcomponente = $logro->subcomponentes()->create([
                'nombre'      => $nombreNormalizado,
                'descripcion' => $request->descripcion,
                'peso'        => $request->peso,
            ]);

            // Auditoría: j) Evaluación académica y Registro Auxiliar
            AuditoriaService::registrar(
                componente: 'evaluacion_academica',
                operacion: 'INSERTAR',
                descripcion: "Dimensión evaluativa agregada: '{$nombreNormalizado}' (Peso: {$request->peso}%) al Logro ID {$logro->id}",
                registroId: (string) $subcomponente->id,
                nuevos: [
                    'logro_curso_id' => $logro->id,
                    'nombre'         => $nombreNormalizado,
                    'descripcion'    => $request->descripcion,
                    'peso'           => $request->peso,
                ],
                resultado: 'EXITO'
            );

            return redirect()->back()->with('success', 'Dimensión agregada exitosamente.');
        } catch (Throwable $e) {
            AuditoriaService::registrar(
                componente: 'evaluacion_academica',
                operacion: 'INSERTAR',
                descripcion: "Fallo al agregar dimensión evaluativa al Logro ID {$logro->id}",
                registroId: (string) $logro->id,
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return redirect()->back()->withErrors(['error' => 'Error al agregar la dimensión: ' . $e->getMessage()]);
        }
    }

    /**
     * Actualiza una dimensión existente (nombre, descripción y peso ponderado).
     */
    public function updateSubcomponente(Request $request, SubcomponenteLogro $subcomponente): RedirectResponse
    {
        $request->validate([
            'nombre'      => 'required|string|max:300',
            'descripcion' => 'nullable|string',
            'peso'        => 'required|numeric|min:0|max:100',
        ]);

        $datosAnteriores = $subcomponente->only(['nombre', 'descripcion', 'peso']);
        $nombreNormalizado = strtoupper(trim($request->nombre));

        try {
            $subcomponente->update([
                'nombre'      => $nombreNormalizado,
                'descripcion' => $request->descripcion,
                'peso'        => $request->peso,
            ]);

            // Auditoría: j) Evaluación académica y Registro Auxiliar
            AuditoriaService::registrar(
                componente: 'evaluacion_academica',
                operacion: 'ACTUALIZAR',
                descripcion: "Dimensión evaluativa actualizada (ID: {$subcomponente->id}) de Logro ID {$subcomponente->logro_curso_id}",
                registroId: (string) $subcomponente->id,
                anteriores: $datosAnteriores,
                nuevos: [
                    'nombre'      => $nombreNormalizado,
                    'descripcion' => $request->descripcion,
                    'peso'        => $request->peso,
                ],
                resultado: 'EXITO'
            );

            return redirect()->back()->with('success', 'Dimensión actualizada exitosamente.');
        } catch (Throwable $e) {
            AuditoriaService::registrar(
                componente: 'evaluacion_academica',
                operacion: 'ACTUALIZAR',
                descripcion: "Fallo al actualizar dimensión ID {$subcomponente->id}",
                registroId: (string) $subcomponente->id,
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return redirect()->back()->withErrors(['error' => 'Error al actualizar la dimensión: ' . $e->getMessage()]);
        }
    }

    /**
     * Elimina una dimensión y sus criterios asociados.
     */
    public function destroySubcomponente(SubcomponenteLogro $subcomponente): RedirectResponse
    {
        $datosEliminados = [
            'id'             => $subcomponente->id,
            'logro_curso_id' => $subcomponente->logro_curso_id,
            'nombre'         => $subcomponente->nombre,
            'peso'           => $subcomponente->peso,
        ];

        try {
            $subcomponente->criterios()->delete();
            $subcomponente->delete();

            // Auditoría: j) Evaluación académica y Registro Auxiliar
            AuditoriaService::registrar(
                componente: 'evaluacion_academica',
                operacion: 'ELIMINAR',
                descripcion: "Dimensión evaluativa eliminada: '{$datosEliminados['nombre']}' (ID: {$datosEliminados['id']})",
                registroId: (string) $datosEliminados['id'],
                anteriores: $datosEliminados,
                resultado: 'EXITO'
            );

            return redirect()->back()->with('success', 'Dimensión eliminada correctamente.');
        } catch (Throwable $e) {
            AuditoriaService::registrar(
                componente: 'evaluacion_academica',
                operacion: 'ELIMINAR',
                descripcion: "Fallo al eliminar dimensión evaluativa ID {$subcomponente->id}",
                registroId: (string) $subcomponente->id,
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return redirect()->back()->withErrors(['error' => 'Error al eliminar la dimensión: ' . $e->getMessage()]);
        }
    }
}