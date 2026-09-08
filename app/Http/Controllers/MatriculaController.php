<?php

namespace App\Http\Controllers;

use App\Models\Curso;
use App\Models\Horario;
use App\Models\Instituto;
use App\Models\Matricula;
use App\Models\MatriculaCurso;
use App\Models\Periodo;
use App\Models\PlanEstudio;
use App\Models\Postulante;
use App\Models\Semestre;
use App\Services\AuditoriaService;
use App\Services\MoodleService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Throwable;

class MatriculaController extends Controller
{
    /**
     * Límite máximo de créditos permitidos por periodo lectivo.
     */
    private const LIMITE_MAX_CREDITOS = 50.00;

    protected MoodleService $moodleService;

    public function __construct(MoodleService $moodleService)
    {
        $this->moodleService = $moodleService;
    }

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
            'periodos'   => Periodo::select('id', 'nombre', 'activo')->get(),
            'semestres'  => Semestre::select('id', 'nombre')->get(),
            'estados'    => ['Pendiente', 'Matriculado', 'Retirado', 'Convalidado', 'Repitencia'],
            'filtros'    => (object) [],
        ]);
    }

    /**
     * Filtrado dinámico vía AJAX (Peticiones asíncronas de Axios).
     */
    public function filtrar(Request $request): JsonResponse
    {
        $buscar     = trim((string) $request->input('buscar'));
        $periodoId  = $request->input('periodo_id');
        $semestreId = $request->input('semestre_id');
        $estado     = $request->input('estado');

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

        if (! blank($periodoId)) {
            $query->where('periodo_id', $periodoId);
        }
        if (! blank($semestreId)) {
            $query->where('semestre_id', $semestreId);
        }
        if (! blank($estado)) {
            $query->where('estado', $estado);
        }

        $matriculas = $query->orderBy('id', 'desc')->paginate(10);

        return response()->json(['matriculas' => $matriculas]);
    }

    /**
     * Muestra el formulario para crear una nueva matrícula.
     */
    public function create(Request $request): Response
    {
        $periodos    = Periodo::select('id', 'nombre', 'activo')->where('activo', 1)->get();
        $semestres   = Semestre::select('id', 'nombre')->get();
        $planes      = PlanEstudio::select('id', 'nombre', 'codigo')->get();
        $estudiantes = Postulante::select('id_postulante', 'nombres', 'apellidos', 'dni', 'grado')
            ->orderBy('apellidos')
            ->get();

        $periodoSeleccionado = $request->input('periodo_id') ?? $periodos->first()?->id;

        $horariosDisponibles = Horario::with([
            'curso:id,nombre',
            'seccion:id,nombre',
            'turno:id,nombre',
            'docente:id,nombre,apellido',
        ])
        ->when($periodoSeleccionado, fn ($q) => $q->where('id_periodo', $periodoSeleccionado))
        ->get()
        ->map(fn ($horario) => [
            'id'              => $horario->id,
            'curso_id'        => $horario->id_curso,
            'curso_nombre'    => $horario->curso?->nombre,
            'curso_codigo'    => 'CUR-' . str_pad($horario->id_curso, 3, '0', STR_PAD_LEFT),
            'seccion'         => $horario->seccion?->nombre,
            'turno'           => $horario->turno?->nombre,
            'docente'         => $horario->docente ? ($horario->docente->nombre . ' ' . $horario->docente->apellido) : 'Por asignar',
            'detalle_horario' => "{$horario->dia}: {$horario->hora_inicio} - {$horario->hora_fin}",
            'capacidad'       => $horario->capacidad,
        ]);

        return Inertia::render('Matriculas/Create', [
            'estudiantes'      => $estudiantes,
            'planes'           => $planes,
            'periodos'         => $periodos,
            'semestres'        => $semestres,
            'ofertaAcademicas' => $horariosDisponibles,
            'filtroPeriodo'    => $periodoSeleccionado,
        ]);
    }

    /**
     * Endpoint AJAX para cargar horarios por semestre, plan y periodo.
     */
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
            'curso:id,nombre,semestre_id',
            'seccion:id,nombre',
            'turno:id,nombre',
            'docente:id,nombre,apellido',
        ])
        ->where('id_periodo', $periodoId)
        ->whereHas('curso', function ($query) use ($semestreId, $planEstudioId) {
            $query->where('semestre_id', $semestreId)
                ->whereHas('planesEstudio', fn ($pQuery) => $pQuery->where('plan_estudio_id', $planEstudioId));
        })
        ->get()
        ->map(fn ($horario) => [
            'id'              => $horario->id,
            'curso_id'        => $horario->id_curso,
            'curso_nombre'    => $horario->curso?->nombre,
            'curso_codigo'    => 'CUR-' . str_pad($horario->id_curso, 3, '0', STR_PAD_LEFT),
            'seccion'         => $horario->seccion?->nombre,
            'turno'           => $horario->turno?->nombre,
            'docente'         => $horario->docente ? ($horario->docente->nombre . ' ' . $horario->docente->apellido) : 'Por asignar',
            'detalle_horario' => "{$horario->dia}: {$horario->hora_inicio} - {$horario->hora_fin}",
            'capacidad'       => $horario->capacidad,
        ]);

        return response()->json(['horarios' => $horarios]);
    }

    /**
     * Verifica si un postulante/estudiante ya tiene matrícula en el periodo.
     */
    public function verificarMatriculaEstudiante(Request $request): JsonResponse
    {
        $postulanteId = $request->input('postulante_id');
        $periodoId    = $request->input('periodo_id');

        $matricula = Matricula::where('postulante_id', $postulanteId)
            ->where('periodo_id', $periodoId)
            ->first();

        if ($matricula) {
            return response()->json([
                'existe'          => true,
                'semestre_id'     => $matricula->semestre_id,
                'plan_estudio_id' => $matricula->plan_estudio_id,
            ]);
        }

        return response()->json(['existe' => false]);
    }

    /**
     * Registra o complementa la matrícula individual y la sincroniza con Moodle.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            'postulante_id'                     => 'required|integer|exists:postulantes,id_postulante',
            'plan_estudio_id'                   => 'required|integer|exists:planes_estudio,id',
            'periodo_id'                        => 'required|integer|exists:periodos,id',
            'semestre_id'                       => 'required|integer|exists:semestres,id',
            'fecha_matricula'                   => 'required|date',
            'cursos_seleccionados'              => 'required|array|min:1',
            'cursos_seleccionados.*.horario_id' => 'required|integer|exists:horarios,id',
            'cursos_seleccionados.*.estado'     => 'nullable|string|in:Inscrito,Repitencia,Cargo,Convalidado',
        ], [
            'cursos_seleccionados.required' => 'Debe seleccionar al menos una asignatura para la matrícula.',
            'cursos_seleccionados.min'      => 'Debe seleccionar al menos una asignatura para la matrícula.',
        ]);

        $matriculaCreada = null;
        $cursosParaSincronizarMoodle = [];
        $postulante = null;

        try {
            DB::transaction(function () use ($datos, &$matriculaCreada, &$cursosParaSincronizarMoodle, &$postulante) {
                // 1. Validar periodo activo
                $this->validarPeriodoActivo((int) $datos['periodo_id']);

                // 2. Cargar horarios
                $horariosIds = collect($datos['cursos_seleccionados'])->pluck('horario_id')->unique()->toArray();
                $horariosCargados = Horario::with(['curso', 'seccion'])->whereIn('id', $horariosIds)->get()->keyBy('id');

                // 3. Validaciones académicas
                $this->validarSeccionUnicaPorCurso($horariosIds, $horariosCargados);
                $this->validarCruceHorarioEstudiante($horariosCargados);
                $this->validarLimiteCreditos($horariosCargados);

                // 4. Obtener o crear matrícula
                $matricula = Matricula::firstOrNew([
                    'postulante_id' => $datos['postulante_id'],
                    'periodo_id'    => $datos['periodo_id'],
                ]);

                // 5. Validar aforo
                $this->validarAforoHorarios($datos['cursos_seleccionados'], $horariosCargados, $matricula);

                $esNueva = ! $matricula->exists;

                $matricula->plan_estudio_id = $datos['plan_estudio_id'];
                $matricula->semestre_id     = $datos['semestre_id'];
                $matricula->estado          = 'Matriculado';
                $matricula->fecha_matricula = $datos['fecha_matricula'];
                $matricula->save();

                if (empty($matricula->codigo_matricula)) {
                    $añoActual = date('Y');
                    $matricula->update([
                        'codigo_matricula' => 'MAT-' . $añoActual . '-' . str_pad($matricula->id, 5, '0', STR_PAD_LEFT),
                    ]);
                }

                // 6. Asignaturas pivot
                foreach ($datos['cursos_seleccionados'] as $item) {
                    $horario = $horariosCargados->get($item['horario_id']);
                    if ($horario) {
                        $matricula->cursosMatriculados()->updateOrCreate(
                            ['horario_id' => $horario->id],
                            [
                                'curso_id' => $horario->id_curso,
                                'estado'   => $item['estado'] ?? 'Inscrito',
                            ]
                        );

                        $cursosParaSincronizarMoodle[] = $horario;
                    }
                }

                // 7. Actualizar postulante a Estudiante
                $postulante = Postulante::find($datos['postulante_id']);
                if ($postulante && $postulante->grado !== 'Estudiante') {
                    $postulante->update(['grado' => 'Estudiante']);
                }

                $matriculaCreada = $matricula;

                // Auditoría: f) Matrícula registrada con éxito
                AuditoriaService::registrar(
                    componente: 'matricula',
                    operacion: $esNueva ? 'INSERTAR' : 'ACTUALIZAR',
                    descripcion: "Matrícula procesada: {$matricula->codigo_matricula} para el estudiante {$postulante?->dni} ({$postulante?->apellidos}, {$postulante?->nombres}) con " . count($datos['cursos_seleccionados']) . " asignatura(s)",
                    registroId: (string) $matricula->id,
                    anteriores: null,
                    nuevos: [
                        'codigo_matricula' => $matricula->codigo_matricula,
                        'postulante_id'    => $matricula->postulante_id,
                        'periodo_id'       => $matricula->periodo_id,
                        'plan_estudio_id'  => $matricula->plan_estudio_id,
                        'semestre_id'      => $matricula->semestre_id,
                        'cursos_total'     => count($datos['cursos_seleccionados']),
                    ],
                    resultado: 'EXITO'
                );
            });

            // 8. Sincronización Moodle
            if ($postulante) {
                $moodleUserId = $this->obtenerMoodleUserIdEstudiante($postulante);

                if ($moodleUserId) {
                    $sincronizadosOk = 0;
                    foreach ($cursosParaSincronizarMoodle as $horario) {
                        $this->matricularEstudianteEnMoodle($moodleUserId, $horario);
                        $sincronizadosOk++;
                    }

                    // Auditoría: l) Interoperabilidad Moodle
                    AuditoriaService::registrar(
                        componente: 'interoperabilidad_moodle',
                        operacion: 'INSERTAR',
                        descripcion: "Enrolamiento automático de estudiante DNI {$postulante->dni} en {$sincronizadosOk} curso(s) de Moodle (UserID: {$moodleUserId})",
                        registroId: (string) $moodleUserId,
                        resultado: 'EXITO'
                    );
                }
            }

            return to_route('matriculas.index')->with('success', 'Matrícula y sincronización con el Aula Virtual procesadas con éxito.');
        } catch (\Exception $e) {
            // Auditoría: f) Fallo o bloqueo de matrícula
            AuditoriaService::registrar(
                componente: 'matricula',
                operacion: 'INSERTAR',
                descripcion: "Intento fallido de matrícula para Postulante ID {$datos['postulante_id']}",
                registroId: (string) $datos['postulante_id'],
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Muestra el formulario para editar una matrícula existente.
     */
    public function edit(int $id): Response
    {
        $matricula = Matricula::with(['cursosMatriculados.horario', 'postulante'])->findOrFail($id);

        $periodos  = Periodo::select('id', 'nombre', 'activo')->get();
        $semestres = Semestre::select('id', 'nombre')->get();
        $planes    = PlanEstudio::select('id', 'nombre', 'codigo')->get();
        $estados   = ['Pendiente', 'Matriculado', 'Retirado', 'Convalidado', 'Repitencia'];

        $horariosDisponibles = Horario::with([
            'curso:id,nombre,semestre_id',
            'seccion:id,nombre',
            'turno:id,nombre',
            'docente:id,nombre,apellido',
        ])
        ->where('id_periodo', $matricula->periodo_id)
        ->whereHas('curso', function ($query) use ($matricula) {
            $query->where('semestre_id', $matricula->semestre_id)
                ->whereHas('planesEstudio', fn ($pQuery) => $pQuery->where('plan_estudio_id', $matricula->plan_estudio_id));
        })
        ->get()
        ->map(fn ($horario) => [
            'id'              => $horario->id,
            'curso_id'        => $horario->id_curso,
            'curso_nombre'    => $horario->curso?->nombre,
            'curso_codigo'    => 'CUR-' . str_pad($horario->id_curso, 3, '0', STR_PAD_LEFT),
            'seccion'         => $horario->seccion?->nombre,
            'turno'           => $horario->turno?->nombre,
            'docente'         => $horario->docente ? ($horario->docente->nombre . ' ' . $horario->docente->apellido) : 'Por asignar',
            'detalle_horario' => "{$horario->dia}: {$horario->hora_inicio} - {$horario->hora_fin}",
            'capacidad'       => $horario->capacidad,
        ]);

        $cursosActuales = $matricula->cursosMatriculados->map(fn ($det) => [
            'horario_id' => $det->horario_id,
            'estado'     => $det->estado,
        ]);

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
     * Actualiza la matrícula y sincroniza altas/bajas con Moodle.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $matricula = Matricula::with(['cursosMatriculados.horario.curso', 'cursosMatriculados.horario.seccion', 'postulante'])->findOrFail($id);

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
            'cursos_seleccionados.required' => 'Debe mantener al menos una asignatura seleccionada.',
            'cursos_seleccionados.min'      => 'Debe mantener al menos una asignatura seleccionada.',
        ]);

        try {
            $horariosViejos = $matricula->cursosMatriculados->pluck('horario')->filter();
            $horariosNuevosParaMatricular = [];
            $horariosParaDesmatricular = [];
            $datosAnteriores = $matricula->only(['plan_estudio_id', 'periodo_id', 'semestre_id', 'estado', 'fecha_matricula']);

            DB::transaction(function () use ($datos, $matricula, $horariosViejos, $datosAnteriores, &$horariosNuevosParaMatricular, &$horariosParaDesmatricular) {
                // 1. Cargar horarios seleccionados
                $horariosIds = collect($datos['cursos_seleccionados'])->pluck('horario_id')->unique()->toArray();
                $horariosCargados = Horario::with(['curso', 'seccion'])->whereIn('id', $horariosIds)->get()->keyBy('id');

                // 2. Validaciones académicas
                $this->validarSeccionUnicaPorCurso($horariosIds, $horariosCargados);
                $this->validarCruceHorarioEstudiante($horariosCargados);
                $this->validarLimiteCreditos($horariosCargados);
                $this->validarAforoHorarios($datos['cursos_seleccionados'], $horariosCargados, $matricula);

                // 3. Diferencias de horarios
                $horariosViejosIds = $horariosViejos->pluck('id')->toArray();
                
                $horariosEliminadosIds = array_diff($horariosViejosIds, $horariosIds);
                $horariosParaDesmatricular = $horariosViejos->whereIn('id', $horariosEliminadosIds);

                $horariosAgregadosIds = array_diff($horariosIds, $horariosViejosIds);
                $horariosNuevosParaMatricular = $horariosCargados->whereIn('id', $horariosAgregadosIds);

                // 4. Actualizar cabecera
                $matricula->update([
                    'plan_estudio_id' => $datos['plan_estudio_id'],
                    'periodo_id'      => $datos['periodo_id'],
                    'semestre_id'     => $datos['semestre_id'],
                    'estado'          => $datos['estado'],
                    'fecha_matricula' => $datos['fecha_matricula'],
                ]);

                // 5. Sincronizar en BD local
                $matricula->cursosMatriculados()->whereNotIn('horario_id', $horariosIds)->delete();

                foreach ($datos['cursos_seleccionados'] as $item) {
                    $horario = $horariosCargados->get($item['horario_id']);
                    if ($horario) {
                        $matricula->cursosMatriculados()->updateOrCreate(
                            ['horario_id' => $horario->id],
                            [
                                'curso_id' => $horario->id_curso,
                                'estado'   => $item['estado'] ?? 'Inscrito',
                            ]
                        );
                    }
                }

                // Auditoría: f) Actualización de Matrícula
                AuditoriaService::registrar(
                    componente: 'matricula',
                    operacion: 'ACTUALIZAR',
                    descripcion: "Matrícula actualizada {$matricula->codigo_matricula} (Estado: {$datos['estado']}, Asignaturas: " . count($datos['cursos_seleccionados']) . ")",
                    registroId: (string) $matricula->id,
                    anteriores: $datosAnteriores,
                    nuevos: [
                        'plan_estudio_id' => $datos['plan_estudio_id'],
                        'periodo_id'      => $datos['periodo_id'],
                        'semestre_id'     => $datos['semestre_id'],
                        'estado'          => $datos['estado'],
                        'fecha_matricula' => $datos['fecha_matricula'],
                        'cursos_total'    => count($datos['cursos_seleccionados']),
                    ],
                    resultado: 'EXITO'
                );
            });

            // 6. Sincronización Moodle
            $postulante = $matricula->postulante;
            if ($postulante) {
                $moodleUserId = $this->obtenerMoodleUserIdEstudiante($postulante);

                if ($moodleUserId) {
                    if ($datos['estado'] === 'Retirado') {
                        foreach ($horariosViejos as $horario) {
                            $this->desmatricularEstudianteEnMoodle($moodleUserId, $horario);
                        }

                        AuditoriaService::registrar(
                            componente: 'interoperabilidad_moodle',
                            operacion: 'ELIMINAR',
                            descripcion: "Desmatriculación en Moodle por estado 'Retirado' del estudiante DNI {$postulante->dni}",
                            registroId: (string) $moodleUserId,
                            resultado: 'EXITO'
                        );
                    } else {
                        foreach ($horariosParaDesmatricular as $horario) {
                            $this->desmatricularEstudianteEnMoodle($moodleUserId, $horario);
                        }
                        foreach ($horariosNuevosParaMatricular as $horario) {
                            $this->matricularEstudianteEnMoodle($moodleUserId, $horario);
                        }

                        AuditoriaService::registrar(
                            componente: 'interoperabilidad_moodle',
                            operacion: 'ACTUALIZAR',
                            descripcion: "Sincronización de cursos en Moodle para estudiante DNI {$postulante->dni}: +" . count($horariosNuevosParaMatricular) . " alta(s), -" . count($horariosParaDesmatricular) . " baja(s)",
                            registroId: (string) $moodleUserId,
                            resultado: 'EXITO'
                        );
                    }
                }
            }

            return to_route('matriculas.index')->with('success', 'Matrícula y Aula Virtual sincronizadas con éxito.');
        } catch (\Exception $e) {
            AuditoriaService::registrar(
                componente: 'matricula',
                operacion: 'ACTUALIZAR',
                descripcion: "Fallo al actualizar la matrícula ID {$id}",
                registroId: (string) $id,
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Elimina una matrícula y desmatricula al estudiante de Moodle.
     */
    public function destroy(int $id): RedirectResponse
    {
        try {
            $matricula = Matricula::with(['cursosMatriculados.horario.curso', 'cursosMatriculados.horario.seccion', 'postulante'])->findOrFail($id);

            $horarios = $matricula->cursosMatriculados->pluck('horario')->filter();
            $postulante = $matricula->postulante;
            $codigoMatricula = $matricula->codigo_matricula;

            // 1. Desmatricular de Moodle
            if ($postulante) {
                $moodleUserId = $this->obtenerMoodleUserIdEstudiante($postulante);
                if ($moodleUserId) {
                    foreach ($horarios as $horario) {
                        $this->desmatricularEstudianteEnMoodle($moodleUserId, $horario);
                    }

                    AuditoriaService::registrar(
                        componente: 'interoperabilidad_moodle',
                        operacion: 'ELIMINAR',
                        descripcion: "Desmatriculación total en Moodle por anulación de matrícula {$codigoMatricula} (Estudiante DNI {$postulante->dni})",
                        registroId: (string) $moodleUserId,
                        resultado: 'EXITO'
                    );
                }
            }

            // 2. Eliminar local
            DB::transaction(function () use ($matricula, $codigoMatricula, $postulante) {
                $matricula->cursosMatriculados()->delete();
                $matricula->delete();

                // Auditoría: f) Eliminación de matrícula
                AuditoriaService::registrar(
                    componente: 'matricula',
                    operacion: 'ELIMINAR',
                    descripcion: "Eliminación definitiva de matrícula {$codigoMatricula} asociada al estudiante DNI {$postulante?->dni}",
                    registroId: (string) $matricula->id,
                    resultado: 'EXITO'
                );
            });

            return redirect()->route('matriculas.index')->with('success', 'La matrícula fue removida del sistema y desmatriculada del Aula Virtual.');
        } catch (\Exception $e) {
            AuditoriaService::registrar(
                componente: 'matricula',
                operacion: 'ELIMINAR',
                descripcion: "Fallo al eliminar la matrícula ID {$id}",
                registroId: (string) $id,
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return redirect()->route('matriculas.index')->with('error', 'No se pudo eliminar la matrícula: ' . $e->getMessage());
        }
    }

    /**
     * Muestra la ficha oficial de matrícula en formato PDF.
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
            'cursosMatriculados.horario.docente',
        ])->findOrFail($id);

        $cursosUnicos = $matricula->cursosMatriculados
            ->groupBy('curso_id')
            ->map(function ($items) {
                $primerItem  = $items->first();
                $horarioBase = $primerItem->horario;

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
                    'horarios'     => ! empty($horariosFormateados) ? $horariosFormateados : '---',
                    'estado'       => $primerItem->estado ?? 'Inscrito',
                ];
            })->values();

        $instituto = Instituto::with('distrito.provincia.departamento')->first();

        $imagenBase64 = null;
        if ($instituto && ! empty($instituto->logo) && file_exists(public_path('storage/' . $instituto->logo))) {
            $path = public_path('storage/' . $instituto->logo);
            $type = pathinfo($path, PATHINFO_EXTENSION);
            $data = file_get_contents($path);
            $imagenBase64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
        }

        // Auditoría: m) Exportación de información documental
        AuditoriaService::registrar(
            componente: 'import_export',
            operacion: 'EXPORTAR',
            descripcion: "Emisión y visualización de Ficha Oficial de Matrícula (PDF) {$matricula->codigo_matricula}",
            registroId: (string) $matricula->id,
            resultado: 'EXITO'
        );

        $pdf = Pdf::loadView('pdf.ficha_matricula', [
            'matricula'    => $matricula,
            'cursosUnicos' => $cursosUnicos,
            'instituto'    => $instituto,
            'imagenBase64' => $imagenBase64,
        ]);

        return $pdf->stream('Ficha_Matricula_' . ($matricula->codigo_matricula ?? $id) . '.pdf');
    }

    /**
     * =========================================================================
     * IMPORTACIÓN MASIVA OPTIMIZADA (SOPORTA 30 A 50+ ALUMNOS SIN CAÍDAS)
     * =========================================================================
     */
    public function importarMasivo(Request $request): RedirectResponse
    {
        set_time_limit(300);

        $request->validate([
            'periodo_id' => 'required|integer|exists:periodos,id',
            'archivo'    => 'required|file|mimes:xlsx,xls,csv|max:5120',
        ]);

        $periodoId = (int) $request->input('periodo_id');
        $this->validarPeriodoActivo($periodoId);

        $path = $request->file('archivo')->getRealPath();

        try {
            $filas = Excel::toArray([], $path)[0] ?? [];
        } catch (\Throwable $e) {
            AuditoriaService::registrar(
                componente: 'import_export',
                operacion: 'IMPORTAR',
                descripcion: 'Fallo al parsear archivo Excel de matrícula masiva',
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return back()->withErrors(['error' => 'No se pudo leer el archivo Excel: ' . $e->getMessage()]);
        }

        if (count($filas) <= 1) {
            return back()->withErrors(['error' => 'El archivo Excel no contiene registros de datos.']);
        }

        // 1. Precarga en memoria
        $postulantesMap = Postulante::all()->keyBy(fn ($p) => trim((string) $p->dni));

        $horariosPeriodo = Horario::with(['curso.planesEstudio', 'seccion', 'turno'])
            ->where('id_periodo', $periodoId)
            ->get();

        $matriculasPorEstudiante = [];
        $observaciones = [];
        $filasValidas = 0;

        // 2. Parseo y validación de filas
        foreach (array_slice($filas, 1) as $index => $fila) {
            $numeroFila = $index + 2;

            $dni        = trim((string) ($fila[0] ?? ''));
            $codCurso   = trim((string) ($fila[1] ?? ''));
            $seccionNom = strtoupper(trim((string) ($fila[2] ?? '')));
            $turnoNom   = trim((string) ($fila[3] ?? ''));
            $condicion  = trim((string) ($fila[4] ?? 'Inscrito')) ?: 'Inscrito';

            if ($dni === '' || $codCurso === '') {
                continue;
            }

            $postulante = $postulantesMap->get($dni);
            if (! $postulante) {
                $observaciones[] = "Fila {$numeroFila}: DNI '{$dni}' no registrado.";
                continue;
            }

            $cursoIdNum = (int) str_ireplace('CUR-', '', $codCurso);

            $horario = $horariosPeriodo->first(function ($h) use ($codCurso, $cursoIdNum, $seccionNom, $turnoNom) {
                $matchCurso = ($h->id_curso === $cursoIdNum)
                    || (strcasecmp($h->curso?->codigo ?? '', $codCurso) === 0);

                $matchSeccion = empty($seccionNom) || strtoupper($h->seccion?->nombre ?? '') === $seccionNom;
                $matchTurno   = empty($turnoNom) || strcasecmp($h->turno?->nombre ?? '', $turnoNom) === 0;

                return $matchCurso && $matchSeccion && $matchTurno;
            });

            if (! $horario) {
                $observaciones[] = "Fila {$numeroFila}: No existe horario abierto en el periodo para el curso '{$codCurso}' (Sección: '{$seccionNom}').";
                continue;
            }

            $matriculasPorEstudiante[$postulante->id_postulante]['postulante'] = $postulante;
            $matriculasPorEstudiante[$postulante->id_postulante]['cursos'][] = [
                'horario'   => $horario,
                'condicion' => in_array($condicion, ['Inscrito', 'Repitencia', 'Cargo', 'Convalidado']) ? $condicion : 'Inscrito',
            ];

            $filasValidas++;
        }

        if (empty($matriculasPorEstudiante)) {
            AuditoriaService::registrar(
                componente: 'import_export',
                operacion: 'IMPORTAR',
                descripcion: 'Importación masiva de matrículas rechazada: no contiene filas válidas',
                resultado: 'FALLIDO',
                motivoFallo: implode(' | ', array_slice($observaciones, 0, 3))
            );

            return back()->withErrors([
                'error'   => 'No se encontraron registros válidos para matricular.',
                'detalle' => array_slice($observaciones, 0, 5),
            ]);
        }

        // 3. Resolución segura de IDs de Moodle FUERA de la transacción SQL
        $estudiantesMoodleIds = [];
        foreach ($matriculasPorEstudiante as $postulanteId => $item) {
            $postulante = $item['postulante'];
            $moodleId = $this->obtenerMoodleUserIdEstudiante($postulante);
            if ($moodleId) {
                $estudiantesMoodleIds[$postulanteId] = $moodleId;
            }
        }

        // 4. Persistencia en Base de Datos Local
        $enrolmentsMoodle   = [];
        $groupMembersMoodle = [];

        DB::beginTransaction();
        try {
            $añoActual = date('Y');

            foreach ($matriculasPorEstudiante as $postulanteId => $item) {
                $postulante    = $item['postulante'];
                $primerHorario = $item['cursos'][0]['horario'];

                $matricula = Matricula::firstOrCreate(
                    [
                        'postulante_id' => $postulanteId,
                        'periodo_id'    => $periodoId,
                    ],
                    [
                        'plan_estudio_id'  => $primerHorario->curso?->planesEstudio?->first()?->id ?? 1,
                        'semestre_id'      => $primerHorario->curso?->semestre_id ?? 1,
                        'estado'           => 'Matriculado',
                        'fecha_matricula'  => now()->toDateString(),
                        'codigo_matricula' => 'MAT-' . $añoActual . '-' . str_pad($postulanteId, 5, '0', STR_PAD_LEFT),
                    ]
                );

                $moodleUserId = $estudiantesMoodleIds[$postulanteId] ?? null;

                foreach ($item['cursos'] as $cursoData) {
                    $h = $cursoData['horario'];

                    $matricula->cursosMatriculados()->updateOrCreate(
                        ['horario_id' => $h->id],
                        [
                            'curso_id' => $h->id_curso,
                            'estado'   => $cursoData['condicion'],
                        ]
                    );

                    $moodleCourseId = $h->curso?->moodle_course_id;
                    $moodleGroupId  = $h->moodle_group_id ?? $h->seccion?->moodle_group_id;

                    if ($moodleUserId && $moodleCourseId) {
                        $enrolmentsMoodle[] = [
                            'roleid'    => 5,
                            'userid'    => (int) $moodleUserId,
                            'courseid'  => (int) $moodleCourseId,
                            'timestart' => time(),
                            'timeend'   => 0,
                        ];

                        if ($moodleGroupId) {
                            $groupMembersMoodle[] = [
                                'groupid' => (int) $moodleGroupId,
                                'userid'  => (int) $moodleUserId,
                            ];
                        }
                    }
                }

                if ($postulante->grado !== 'Estudiante') {
                    $postulante->update(['grado' => 'Estudiante']);
                }
            }

            DB::commit();

            $totalEstudiantes = count($matriculasPorEstudiante);

            // Auditoría: m) Importación de matrículas
            AuditoriaService::registrar(
                componente: 'import_export',
                operacion: 'IMPORTAR',
                descripcion: "Carga masiva de matrícula en Periodo ID {$periodoId}: {$filasValidas} asignaturas procesadas para {$totalEstudiantes} estudiantes",
                registroId: (string) $periodoId,
                nuevos: [
                    'periodo_id'        => $periodoId,
                    'total_estudiantes' => $totalEstudiantes,
                    'total_asignaturas' => $filasValidas,
                ],
                resultado: 'EXITO'
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error en transacción de matrícula masiva: " . $e->getMessage());

            AuditoriaService::registrar(
                componente: 'import_export',
                operacion: 'IMPORTAR',
                descripcion: "Fallo en la transacción de base de datos durante importación masiva de matrícula (Periodo ID {$periodoId})",
                registroId: (string) $periodoId,
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return back()->withErrors(['error' => 'Error al guardar en base de datos: ' . $e->getMessage()]);
        }

        // 5. Sincronización en Bloque a Moodle
        try {
            if (! empty($enrolmentsMoodle)) {
                $enrolmentsUnicos = collect($enrolmentsMoodle)
                    ->unique(fn ($item) => "{$item['userid']}_{$item['courseid']}")
                    ->values()
                    ->toArray();

                $this->moodleService->matricularUsuariosMasivo($enrolmentsUnicos, 100);
            }

            if (! empty($groupMembersMoodle)) {
                $groupsUnicos = collect($groupMembersMoodle)
                    ->unique(fn ($item) => "{$item['groupid']}_{$item['userid']}")
                    ->values()
                    ->toArray();

                $this->moodleService->agregarUsuariosAGruposMasivo($groupsUnicos, 100);
            }

            // Auditoría: l) Interoperabilidad masiva Moodle
            if (! empty($enrolmentsMoodle)) {
                AuditoriaService::registrar(
                    componente: 'interoperabilidad_moodle',
                    operacion: 'IMPORTAR',
                    descripcion: "Sincronización masiva hacia Moodle ejecutada: " . count($enrolmentsMoodle) . " asignaciones de curso y grupos",
                    resultado: 'EXITO'
                );
            }
        } catch (\Throwable $e) {
            Log::error("Error en sincronización masiva hacia Moodle: " . $e->getMessage());

            AuditoriaService::registrar(
                componente: 'interoperabilidad_moodle',
                operacion: 'IMPORTAR',
                descripcion: 'Fallo al sincronizar matrículas masivas en la API de Moodle',
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );
        }

        $totalEstudiantes = count($matriculasPorEstudiante);
        $mensaje = "Se procesaron exitosamente {$filasValidas} asignaturas para {$totalEstudiantes} estudiantes con sincronización a Moodle.";

        if (! empty($observaciones)) {
            return back()->with('warning', $mensaje . ' Algunas filas tuvieron observaciones: ' . implode(' | ', array_slice($observaciones, 0, 3)));
        }

        return back()->with('success', $mensaje);
    }

    /**
     * =========================================================================
     * MÉTODOS AUXILIARES DE INTEGRACIÓN CON MOODLE
     * =========================================================================
     */

    private function obtenerMoodleUserIdEstudiante(Postulante $postulante): ?int
    {
        $dni = trim((string) ($postulante->dni 
            ?? $postulante->numero_documento 
            ?? $postulante->persona?->numero_documento 
            ?? ''));

        if ($dni === '') {
            return null;
        }

        if (! empty($postulante->moodle_user_id)) {
            return (int) $postulante->moodle_user_id;
        }

        try {
            $moodleUser = $this->moodleService->obtenerUsuarioPorCampo('username', mb_strtolower($dni));

            if ($moodleUser && isset($moodleUser['id'])) {
                $moodleId = (int) $moodleUser['id'];
                $postulante->update(['moodle_user_id' => $moodleId]);
                return $moodleId;
            }

            $passwordTemporal = $dni . '*Temp2026';
            $email = ! empty($postulante->email) 
                ? $postulante->email 
                : "{$dni}@instituto.edu.pe";

            $nuevoUsuario = $this->moodleService->crearUsuario(
                $dni,
                $passwordTemporal,
                $postulante->nombres ?? 'Estudiante',
                $postulante->apellidos ?? 'General',
                $email
            );

            if (is_array($nuevoUsuario) && isset($nuevoUsuario[0]['id'])) {
                $moodleId = (int) $nuevoUsuario[0]['id'];
                $postulante->update(['moodle_user_id' => $moodleId]);

                AuditoriaService::registrar(
                    componente: 'interoperabilidad_moodle',
                    operacion: 'INSERTAR',
                    descripcion: "Usuario Moodle aprovisionado automáticamente para estudiante DNI {$dni} (Moodle ID: {$moodleId})",
                    registroId: (string) $moodleId,
                    resultado: 'EXITO'
                );

                return $moodleId;
            }
        } catch (\Throwable $e) {
            Log::error("Error validando/creando usuario Moodle ({$dni}): " . $e->getMessage());

            AuditoriaService::registrar(
                componente: 'interoperabilidad_moodle',
                operacion: 'INSERTAR',
                descripcion: "Fallo al crear/validar usuario Moodle para estudiante DNI {$dni}",
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );
        }

        return null;
    }

    private function matricularEstudianteEnMoodle(int $moodleUserId, Horario $horario): void
    {
        $moodleCourseId = $horario->curso?->moodle_course_id;
        $moodleGroupId  = $horario->moodle_group_id ?? $horario->seccion?->moodle_group_id ?? null;

        if ($moodleCourseId) {
            try {
                $this->moodleService->matricularUsuario($moodleUserId, (int) $moodleCourseId, 5);

                if ($moodleGroupId) {
                    $this->moodleService->agregarUsuarioAGrupo((int) $moodleGroupId, $moodleUserId);
                }
            } catch (\Throwable $e) {
                Log::error("Error matriculando estudiante {$moodleUserId} en curso {$moodleCourseId}: " . $e->getMessage());
            }
        }
    }

    private function desmatricularEstudianteEnMoodle(int $moodleUserId, Horario $horario): void
    {
        $moodleCourseId = $horario->curso?->moodle_course_id;
        $moodleGroupId  = $horario->moodle_group_id ?? $horario->seccion?->moodle_group_id ?? null;

        if ($moodleCourseId) {
            try {
                if ($moodleGroupId) {
                    $this->moodleService->eliminarUsuarioDeGrupo((int) $moodleGroupId, $moodleUserId);
                }

                $this->moodleService->desmatricularUsuario($moodleUserId, (int) $moodleCourseId, 5);
            } catch (\Throwable $e) {
                Log::error("Error desmatriculando estudiante {$moodleUserId} de curso {$moodleCourseId}: " . $e->getMessage());
            }
        }
    }

    /**
     * =========================================================================
     * REGLAS DE VALIDACIÓN ACADÉMICA
     * =========================================================================
     */

    private function validarSeccionUnicaPorCurso(array $horariosIds, $horariosCargados): void
    {
        $seccionesPorCurso = [];
        foreach ($horariosIds as $hId) {
            $horario = $horariosCargados->get($hId);
            if ($horario) {
                $cursoId   = $horario->id_curso;
                $seccionId = $horario->id_seccion;

                if (isset($seccionesPorCurso[$cursoId]) && $seccionesPorCurso[$cursoId] !== $seccionId) {
                    throw new \Exception("No puede matricular la asignatura '{$horario->curso->nombre}' en dos secciones diferentes.");
                }

                $seccionesPorCurso[$cursoId] = $seccionId;
            }
        }
    }

    private function validarCruceHorarioEstudiante($horariosCargados): void
    {
        $lista = $horariosCargados->values();

        for ($i = 0; $i < $lista->count(); $i++) {
            for ($j = $i + 1; $j < $lista->count(); $j++) {
                $h1 = $lista[$i];
                $h2 = $lista[$j];

                if ($h1->id_curso !== $h2->id_curso && $h1->dia === $h2->dia) {
                    if ($h1->hora_inicio < $h2->hora_fin && $h1->hora_fin > $h2->hora_inicio) {
                        throw new \Exception("Cruce de horario el {$h1->dia}: '{$h1->curso->nombre}' ({$h1->hora_inicio}-{$h1->hora_fin}) se solapa con '{$h2->curso->nombre}' ({$h2->hora_inicio}-{$h2->hora_fin}).");
                    }
                }
            }
        }
    }

    private function validarLimiteCreditos($horariosCargados): void
    {
        $cursosIds = $horariosCargados->pluck('id_curso')->unique();
        $totalCreditos = (float) Curso::whereIn('id', $cursosIds)->sum('creditos');

        if ($totalCreditos > self::LIMITE_MAX_CREDITOS) {
            throw new \Exception("La carga académica seleccionada ({$totalCreditos} créditos) excede el límite máximo permitido de " . self::LIMITE_MAX_CREDITOS . " créditos por periodo lectivo.");
        }
    }

    private function validarAforoHorarios(array $cursosSeleccionados, $horariosCargados, ?Matricula $matricula = null): void
    {
        foreach ($cursosSeleccionados as $item) {
            $horario = $horariosCargados->get($item['horario_id']);

            if ($horario && $horario->capacidad > 0) {
                $matriculadosActuales = MatriculaCurso::where('horario_id', $horario->id)
                    ->when($matricula && $matricula->exists, fn ($q) => $q->where('matricula_id', '<>', $matricula->id))
                    ->count();

                if ($matriculadosActuales >= $horario->capacidad) {
                    $nombreCurso = $horario->curso?->nombre ?? 'Asignatura';
                    $seccionNom  = $horario->seccion?->nombre ?? 'Única';
                    throw new \Exception("No hay vacantes disponibles para '{$nombreCurso}' en la Sección {$seccionNom} (Aforo máximo: {$horario->capacidad}).");
                }
            }
        }
    }

    private function validarPeriodoActivo(int $periodoId): void
    {
        $periodo = Periodo::find($periodoId);
        if ($periodo && ! $periodo->activo) {
            throw new \Exception("No se pueden registrar matrículas en un periodo académico que se encuentra cerrado o inactivo.");
        }
    }
}