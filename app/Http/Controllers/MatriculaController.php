<?php

namespace App\Http\Controllers;

use App\Models\Matricula;
use App\Models\MatriculaCurso;
use App\Models\Postulante;
use App\Models\PlanEstudio;
use App\Models\Periodo;
use App\Models\Semestre;
use App\Models\Horario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use App\Models\Instituto;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response as HttpResponse;
class MatriculaController extends Controller
{
    /**
     * Vista principal de matrículas (Carga inicial síncrona).
     */
    public function index(): Response
    {
        $matriculas = Matricula::with(['postulante', 'planEstudio', 'periodo', 'semestre'])
            ->orderBy('id', 'desc')
            ->paginate(10);

        return Inertia::render('Matriculas/Index', [
            'matriculas' => $matriculas,
            'periodos'   => Periodo::select('id', 'nombre')->get(),
            'semestres'  => Semestre::select('id', 'nombre')->get(),
            'estados'    => ['Pendiente', 'Matriculado', 'Retirado', 'Convalidado', 'Repitencia'],
            'filtros'    => (object)[]
        ]);
    }

    /**
     * Filtrado dinámico vía AJAX (Peticiones asíncronas de Axios).
     */
    public function filtrar(Request $request): JsonResponse
    {
        $buscar = trim((string)$request->input('buscar'));
        $periodoId = $request->input('periodo_id');
        $semestreId = $request->input('semestre_id');
        $estado = $request->input('estado');

        $query = Matricula::with(['postulante', 'planEstudio', 'periodo', 'semestre']);

        if ($buscar !== '') {
            $query->where(function ($q) use ($buscar) {
                $q->where('codigo_matricula', 'like', "%{$buscar}%")
                  ->orWhereHas('postulante', function ($sub) use ($buscar) {
                      $sub->where('dni', 'like', "%{$buscar}%")
                          ->orWhere('nombres', 'like', "%{$buscar}%")
                          ->orWhere('apellidos', 'like', "%{$buscar}%");
                  });
            });
        }

        if (!blank($periodoId)) {
            $query->where('periodo_id', $periodoId);
        }
        if (!blank($semestreId)) {
            $query->where('semestre_id', $semestreId);
        }
        if (!blank($estado)) {
            $query->where('estado', $estado);
        }

        $matriculas = $query->orderBy('id', 'desc')->paginate(10);

        return response()->json([
            'matriculas' => $matriculas
        ]);
    }

    /**
     * Muestra el formulario para crear una nueva matrícula.
     */
    public function create(Request $request): Response
    {
        // 1. Cargar catálogos base con las columnas físicas reales
        $periodos = Periodo::select('id', 'nombre', 'activo')->where('activo', 1)->get();
        $semestres = Semestre::select('id', 'nombre')->get();
        
        // En postulantes sí se llama 'nombres' y 'apellidos'
        $estudiantes = Postulante::select('id_postulante', 'nombres', 'apellidos', 'dni', 'grado')
            ->orderBy('apellidos')
            ->get();

        // En planes_estudio sí existe 'codigo'
        $planes = PlanEstudio::select('id', 'nombre', 'codigo')->get();

        // 2. Determinar qué periodo mapear (por defecto el primero activo encontrado)
        $periodoSeleccionado = $request->input('periodo_id') ?? $periodos->first()?->id;

        // 3. Oferta académica adaptada a tus columnas reales
        $horariosDisponibles = Horario::with([
            'curso:id,nombre',                    // Corregido: removido 'codigo'
            'seccion:id,nombre', 
            'turno:id,nombre', 
            'docente:id,nombre,apellido'          // Corregido: cambiado 'nombres,apellidos' por 'nombre,apellido'
        ])
        ->when($periodoSeleccionado, function ($q) use ($periodoSeleccionado) {
            $q->where('id_periodo', $periodoSeleccionado);
        })
        ->get()
        ->map(function ($horario) {
            return [
                'id' => $horario->id,
                'curso_id' => $horario->id_curso,
                'curso_nombre' => $horario->curso?->nombre,
                // Fallback para el frontend combinando el ID del curso
                'curso_codigo' => 'CUR-' . str_pad($horario->id_curso, 3, '0', STR_PAD_LEFT), 
                'seccion' => $horario->seccion?->nombre,
                'turno' => $horario->turno?->nombre,
                // Unión adaptada a 'nombre' y 'apellido' en singular
                'docente' => $horario->docente ? ($horario->docente->nombre . ' ' . $horario->docente->apellido) : 'Por asignar',
                'detalle_horario' => "{$horario->dia}: {$horario->hora_inicio} - {$horario->hora_fin}",
                'capacidad' => $horario->capacidad,
            ];
        });

        return Inertia::render('Matriculas/Create', [
            'estudiantes' => $estudiantes,
            'planes'      => $planes,
            'periodos'    => $periodos,
            'semestres'   => $semestres,
            'ofertaAcademicas' => $horariosDisponibles,
            'filtroPeriodo' => $periodoSeleccionado
        ]);
    }

    public function obtenerHorariosPorSemestre(Request $request): JsonResponse
    {
        $request->validate([
            'periodo_id'      => 'required|integer|exists:periodos,id',
            'semestre_id'     => 'required|integer|exists:semestres,id',
            'plan_estudio_id' => 'required|integer|exists:planes_estudio,id',
        ]);

        $periodoId     = $request->input('periodo_id');
        $semestreId    = $request->input('semestre_id');
        $planEstudioId = $request->input('plan_estudio_id');

        $horarios = Horario::with([
            'curso:id,nombre,semestre_id', // Carga ligera de los campos requeridos de la tabla cursos
            'seccion:id,nombre', 
            'turno:id,nombre', 
            'docente:id,nombre,apellido'
        ])
        ->where('id_periodo', $periodoId)
        ->whereHas('curso', function ($query) use ($semestreId, $planEstudioId) {
            // 1. Filtrar por el semestre del curso
            $query->where('semestre_id', $semestreId)
            // 2. Filtrar a través de la relación intermedia con cursos_plan_estudio
            ->whereHas('planesEstudio', function ($pQuery) use ($planEstudioId) {
                $pQuery->where('plan_estudio_id', $planEstudioId);
            });
        })
        ->get()
        ->map(function ($horario) {
            return [
                'id'              => $horario->id,
                'curso_id'        => $horario->id_curso,
                'curso_nombre'    => $horario->curso?->nombre,
                'curso_codigo'    => 'CUR-' . str_pad($horario->id_curso, 3, '0', STR_PAD_LEFT),
                'seccion'         => $horario->seccion?->nombre,
                'turno'           => $horario->turno?->nombre,
                'docente'         => $horario->docente ? ($horario->docente->nombre . ' ' . $horario->docente->apellido) : 'Por asignar',
                'detalle_horario' => "{$horario->dia}: {$horario->hora_inicio} - {$horario->hora_fin}",
                'capacidad'       => $horario->capacidad,
            ];
        });

        return response()->json([
            'horarios' => $horarios
        ]);
    }
    /**
     * Verifica si un postulante/estudiante ya tiene matrícula en el periodo.
     */
    public function verificarMatriculaEstudiante(Request $request): JsonResponse
    {
        $postulanteId = $request->input('postulante_id');
        $periodoId = $request->input('periodo_id');

        $matricula = Matricula::where('postulante_id', $postulanteId)
            ->where('periodo_id', $periodoId)
            ->first();

        if ($matricula) {
            return response()->json([
                'existe' => true,
                'semestre_id' => $matricula->semestre_id,
                'plan_estudio_id' => $matricula->plan_estudio_id,
            ]);
        }

        return response()->json(['existe' => false]);
    }
    /**
     * Registra o complementa la matrícula del estudiante en el periodo lectivo.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            'postulante_id'                     => 'required|integer|exists:postulantes,id_postulante',
            'plan_estudio_id'                   => 'required|integer|exists:planes_estudio,id',
            'periodo_id'                        => 'required|integer|exists:periodos,id',
            'semestre_id'                       => 'required|integer|exists:semestres,id', // Semestre principal del alumno
            'fecha_matricula'                   => 'required|date',
            'cursos_seleccionados'              => 'required|array|min:1',
            'cursos_seleccionados.*.horario_id' => 'required|integer|exists:horarios,id',
            'cursos_seleccionados.*.estado'     => 'nullable|string|in:Inscrito,Repitencia,Cargo,Convalidado',
        ], [
            'cursos_seleccionados.required'     => 'Debe seleccionar al menos una asignatura para la matrícula.',
            'cursos_seleccionados.min'          => 'Debe seleccionar al menos una asignatura para la matrícula.',
        ]);

        try {
            DB::transaction(function () use ($datos) {
                // 1. Verificar si ya existe matrícula para este alumno en este periodo lectivo
                $matricula = Matricula::firstOrNew([
                    'postulante_id' => $datos['postulante_id'],
                    'periodo_id'    => $datos['periodo_id'],
                ]);

                // Si es un registro nuevo, generar correlativo; si ya existe, actualizar cabecera
                if (! $matricula->exists) {
                    $añoActual = date('Y');
                    $ultimoId = Matricula::max('id') ?? 0;
                    $matricula->codigo_matricula = 'MAT-' . $añoActual . '-' . str_pad($ultimoId + 1, 4, '0', STR_PAD_LEFT);
                }

                $matricula->plan_estudio_id = $datos['plan_estudio_id'];
                $matricula->semestre_id     = $datos['semestre_id']; // Ciclo oficial
                $matricula->estado          = 'Matriculado';
                $matricula->fecha_matricula = $datos['fecha_matricula'];
                $matricula->save();

                // 2. Cargar todos los horarios enviados
                $horariosIds = collect($datos['cursos_seleccionados'])->pluck('horario_id')->unique()->toArray();
                $horariosCargados = Horario::whereIn('id', $horariosIds)->get()->keyBy('id');

                // 3. Validar choque de secciones (no permite 2 secciones distintas del mismo curso)
                $seccionesPorCurso = [];
                foreach ($horariosIds as $hId) {
                    $horarioInfo = $horariosCargados->get($hId);
                    if ($horarioInfo) {
                        $cursoId = $horarioInfo->id_curso;
                        $seccionId = $horarioInfo->id_seccion;

                        if (isset($seccionesPorCurso[$cursoId]) && $seccionesPorCurso[$cursoId] !== $seccionId) {
                            throw new \Exception("No puede matricular la misma asignatura en dos secciones diferentes.");
                        }

                        $seccionesPorCurso[$cursoId] = $seccionId;
                    }
                }

                // 4. Registrar o actualizar los cursos en la tabla pivot
                foreach ($datos['cursos_seleccionados'] as $item) {
                    $horario = $horariosCargados->get($item['horario_id']);

                    if ($horario) {
                        $matricula->cursosMatriculados()->updateOrCreate(
                            ['horario_id' => $horario->id],
                            [
                                'curso_id' => $horario->id_curso,
                                'estado'   => $item['estado'] ?? 'Inscrito', // Permite guardar 'Repitencia'
                            ]
                        );
                    }
                }

                // 5. Actualizar condición del postulante a Estudiante
                $postulante = Postulante::find($datos['postulante_id']);
                if ($postulante && $postulante->grado !== 'Estudiante') {
                    $postulante->update(['grado' => 'Estudiante']);
                }
            });

            return to_route('matriculas.index')->with('success', 'Matrícula y carga horaria procesadas con éxito.');

        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Muestra el formulario para editar una matrícula existente.
     */
    /**
     * Muestra el formulario para editar una matrícula existente.
     */
    public function edit(int $id): Response
    {
        $matricula = Matricula::with(['cursosMatriculados.horario', 'postulante'])->findOrFail($id);
        
        $periodos = Periodo::select('id', 'nombre', 'activo')->get();
        $semestres = Semestre::select('id', 'nombre')->get();
        $planes = PlanEstudio::select('id', 'nombre', 'codigo')->get();
        $estados = ['Pendiente', 'Matriculado', 'Retirado', 'Convalidado', 'Repitencia'];

        // Cargar horarios filtrados por el periodo y el semestre de la matrícula
        $horariosDisponibles = Horario::with([
            'curso:id,nombre',                  // ✅ Corregido: removido 'codigo'
            'seccion:id,nombre', 
            'turno:id,nombre',
            'docente:id,nombre,apellido'        // ✅ Corregido: en singular 'nombre,apellido'
        ])
        ->where('id_periodo', $matricula->periodo_id)
        ->whereHas('curso', function ($query) use ($matricula) {
            $query->where('semestre_id', $matricula->semestre_id);
        })
        ->get()
        ->map(function ($horario) {
            return [
                'id'              => $horario->id,
                'curso_id'        => $horario->id_curso,
                'curso_nombre'    => $horario->curso?->nombre,
                // Fallback dinámico para el código visual del curso en React
                'curso_codigo'    => 'CUR-' . str_pad($horario->id_curso, 3, '0', STR_PAD_LEFT),
                'seccion'         => $horario->seccion?->nombre,
                'turno'           => $horario->turno?->nombre,
                'docente'         => $horario->docente ? ($horario->docente->nombre . ' ' . $horario->docente->apellido) : 'Por asignar',
                'detalle_horario' => "{$horario->dia}: {$horario->hora_inicio} - {$horario->hora_fin}",
            ];
        });

        // Formatear los cursos que ya tiene cargados actualmente
        $cursosActuales = $matricula->cursosMatriculados->map(function ($det) {
            return [
                'horario_id' => $det->horario_id,
                'estado'     => $det->estado
            ];
        });

        return Inertia::render('Matriculas/Edit', [
            'matricula'        => $matricula,
            'planes'           => $planes,
            'periodos'         => $periodos,
            'semestres'        => $semestres,
            'estados'          => $estados,
            'ofertaAcademicas' => $horariosDisponibles,
            'cursosActuales'   => $cursosActuales,
        ]);
    }

    
    /**
     * Actualiza la matrícula y sincroniza la carga horaria.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $matricula = Matricula::findOrFail($id);

        $datos = $request->validate([
            'plan_estudio_id'                   => 'required|integer|exists:planes_estudio,id',
            'periodo_id'                        => 'required|integer|exists:periodos,id',
            'semestre_id'                       => 'required|integer|exists:semestres,id',
            'estado'                            => 'required|string|in:Pendiente,Matriculado,Retirado,Convalidado,Repitencia',
            'fecha_matricula'                   => 'required|date',
            'cursos_seleccionados'              => 'required|array|min:1',
            'cursos_seleccionados.*.horario_id' => 'required|integer|exists:horarios,id',
            'cursos_seleccionados.*.estado'     => 'nullable|string',
        ], [
            'cursos_seleccionados.required'     => 'Debe mantener al menos una asignatura seleccionada.',
            'cursos_seleccionados.min'          => 'Debe mantener al menos una asignatura seleccionada.',
        ]);

        try {
            DB::transaction(function () use ($datos, $matricula) {
                // 1. Actualizar datos generales de la matrícula
                $matricula->update([
                    'plan_estudio_id' => $datos['plan_estudio_id'],
                    'periodo_id'      => $datos['periodo_id'],
                    'semestre_id'     => $datos['semestre_id'],
                    'estado'          => $datos['estado'],
                    'fecha_matricula' => $datos['fecha_matricula'],
                ]);

                // 2. Cargar la información de los horarios enviados en 1 solo Query
                $horariosIds = collect($datos['cursos_seleccionados'])->pluck('horario_id')->unique()->toArray();
                $horariosCargados = Horario::whereIn('id', $horariosIds)->get()->keyBy('id');

                // 3. VALIDACIÓN CORREGIDA: Permitir múltiples bloques si pertenecen a la MISMA sección
                $seccionesPorCurso = [];
                foreach ($horariosIds as $hId) {
                    $horarioInfo = $horariosCargados->get($hId);
                    if ($horarioInfo) {
                        $cursoId = $horarioInfo->id_curso;
                        $seccionId = $horarioInfo->id_seccion;

                        // Si el mismo curso intenta registrarse con 2 secciones distintas
                        if (isset($seccionesPorCurso[$cursoId]) && $seccionesPorCurso[$cursoId] !== $seccionId) {
                            throw new \Exception("No puede matricular el mismo curso en dos secciones diferentes.");
                        }

                        $seccionesPorCurso[$cursoId] = $seccionId;
                    }
                }

                // 4. ELIMINAR los horarios que el usuario desmarcó en el frontend
                $matricula->cursosMatriculados()->whereNotIn('horario_id', $horariosIds)->delete();

                // 5. REGISTRAR / ACTUALIZAR los horarios seleccionados
                foreach ($datos['cursos_seleccionados'] as $item) {
                    $horario = $horariosCargados->get($item['horario_id']);

                    if ($horario) {
                        $matricula->cursosMatriculados()->updateOrCreate(
                            [
                                'horario_id' => $horario->id,
                            ],
                            [
                                'curso_id'   => $horario->id_curso,
                                'estado'     => $item['estado'] ?? 'Inscrito',
                            ]
                        );
                    }
                }
            });

            return to_route('matriculas.index')->with('success', 'Matrícula modificada con éxito.');

        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Elimina una matrícula y toda su carga asociada (Cascade simulado).
     */
    public function destroy(int $id): RedirectResponse
    {
        try {
            DB::transaction(function () use ($id) {
                $matricula = Matricula::findOrFail($id);

                // 1. Limpiar primero el pivote dependiente para evitar violaciones de Constraint
                $matricula->cursosMatriculados()->delete();

                // 2. Eliminar la matrícula cabecera
                $matricula->delete();
            });

            return redirect()->route('matriculas.index')->with('success', 'La matrícula fue removida del sistema.');

        } catch (\Exception $e) {
            return redirect()->route('matriculas.index')->with('error', 'No se pudo eliminar la matrícula: ' . $e->getMessage());
        }
    }

    /**
     * Muestra la ficha oficial de matrícula con la carga horaria completa.
     */
    public function verFicha(int $id): HttpResponse
{
    $matricula = Matricula::with([
        'postulante',
        'planEstudio',
        'periodo',
        'semestre',
        'cursosMatriculados.curso',
        'cursosMatriculados.horario.seccion',
        'cursosMatriculados.horario.turno',
        'cursosMatriculados.horario.docente'
    ])->findOrFail($id);

    // AGRUPAR CURSOS REPETIDOS Y CONCATENAR SUS HORARIOS/DÍAS
    $cursosUnicos = $matricula->cursosMatriculados
        ->groupBy('curso_id')
        ->map(function ($items) {
            $primerItem = $items->first();
            $horarioBase = $primerItem->horario;

            // Mapear y unir todos los bloques de horario asignados a esta misma asignatura
            $horariosFormateados = $items->map(function ($det) {
                $h = $det->horario;
                return $h ? "{$h->dia}: {$h->hora_inicio} - {$h->hora_fin}" : null;
            })->filter()->unique()->implode(' / ');

            return [
                'curso_nombre' => $primerItem->curso->nombre ?? '---',
                'seccion'      => $horarioBase?->seccion?->nombre ?? '---',
                'turno'        => $horarioBase?->turno?->nombre ?? '---',
                'docente'      => $horarioBase?->docente 
                                    ? "{$horarioBase->docente->nombre} {$horarioBase->docente->apellido}" 
                                    : 'Por asignar',
                'horarios'     => !empty($horariosFormateados) ? $horariosFormateados : '---',
                'estado'       => $primerItem->estado ?? 'Inscrito',
            ];
        })->values();

    // Cargar información del Instituto con sus relaciones geográficas
    $instituto = Instituto::with('distrito.provincia.departamento')->first();

    // Convertir imagen a Base64 para evitar bloqueos de protocolo en Dompdf
    $imagenBase64 = null;
    if ($instituto && !empty($instituto->logo) && file_exists(public_path('storage/' . $instituto->logo))) {
        $path = public_path('storage/' . $instituto->logo);
        $type = pathinfo($path, PATHINFO_EXTENSION);
        $data = file_get_contents($path);
        $imagenBase64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
    }

    $pdf = Pdf::loadView('pdf.ficha_matricula', [
        'matricula'    => $matricula,
        'cursosUnicos' => $cursosUnicos, // Pasamos la lista consolidada
        'instituto'    => $instituto,
        'imagenBase64' => $imagenBase64
    ]);

    return $pdf->stream('Ficha_Matricula_' . ($matricula->codigo_matricula ?? $id) . '.pdf');
}
}