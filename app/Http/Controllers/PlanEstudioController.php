<?php

namespace App\Http\Controllers;

use App\Models\Curso;
use App\Models\Instituto;
use App\Models\Periodo;
use App\Models\PlanEstudio;
use App\Models\Semestre;
use App\Services\MoodleService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PlanEstudioController extends Controller
{
    protected MoodleService $moodleService;

    public function __construct(MoodleService $moodleService)
    {
        $this->moodleService = $moodleService;
    }

    /**
     * Listado de planes de estudio.
     */
    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->input('buscar', ''));
        $estado = trim((string) $request->input('estado', ''));
        $tipo = trim((string) $request->input('tipo', ''));

        $planes = PlanEstudio::query()
            ->with(['periodos' => fn ($query) => $query->orderByDesc('fecha_inicio')])
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($subquery) use ($buscar) {
                    $subquery->where('nombre', 'like', "%{$buscar}%")
                        ->orWhere('descripcion', 'like', "%{$buscar}%")
                        ->orWhere('codigo', 'like', "%{$buscar}%")
                        ->orWhere('resolucion', 'like', "%{$buscar}%")
                        ->orWhere('moodle_category_id', 'like', "%{$buscar}%");
                });
            })
            ->when($estado !== '', fn ($query) => $query->where('activo', $estado === 'Activo'))
            ->when($tipo !== '', fn ($query) => $query->where('tipo', $tipo))
            ->orderBy('nombre')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (PlanEstudio $plan): array => $this->planData($plan));

        return Inertia::render('PlanesEstudio/Index', [
            'planes' => $planes,
            'filtros' => [
                'buscar' => $buscar,
                'estado' => $estado,
                'tipo' => $tipo,
            ],
            'tipos' => $this->tipos(),
        ]);
    }

    /**
     * Formulario de creación.
     */
    public function create(): Response
    {
        return Inertia::render('PlanesEstudio/Create', [
            'tipos' => $this->tipos(),
        ]);
    }

    /**
     * Registrar un plan de estudio y crear su categoría en Moodle.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        $nombre = trim($datos['nombre']);
        $descripcion = $this->normalizarNullable($datos['descripcion'] ?? null);
        $moodleCategoryId = $datos['moodle_category_id'] ?? null;

        // Si no se digitó manualmente un category ID, se crea automáticamente en Moodle
        if (!$moodleCategoryId) {
            try {
                $resMoodle = $this->moodleService->crearCategoria(
                    $nombre,
                    $descripcion ?? "Categoría del plan de estudios {$nombre}"
                );

                if (is_array($resMoodle) && isset($resMoodle[0]['id'])) {
                    $moodleCategoryId = (int) $resMoodle[0]['id'];
                }
            } catch (\Throwable $e) {
                Log::error("Error al crear categoría de Plan de Estudio en Moodle: " . $e->getMessage());
            }
        }

        PlanEstudio::create([
            'nombre' => $nombre,
            'descripcion' => $descripcion,
            'activo' => (bool) $datos['activo'],
            'moodle_category_id' => $moodleCategoryId,
            'codigo' => $this->normalizarNullable($datos['codigo'] ?? null),
            'resolucion' => $this->normalizarNullable($datos['resolucion'] ?? null),
            'tipo' => $datos['tipo'] ?? null,
        ]);

        return to_route('planes-estudio.index')->with('success', 'Plan de estudio registrado y sincronizado como categoría en Moodle.');
    }

    /**
     * Formulario de edición.
     */
    public function edit(PlanEstudio $planEstudio): Response
    {
        $planEstudio->load(['periodos' => fn ($query) => $query->orderByDesc('fecha_inicio')]);

        return Inertia::render('PlanesEstudio/Edit', [
            'plan' => $this->planData($planEstudio),
            'tipos' => $this->tipos(),
        ]);
    }

    /**
     * Actualizar un plan de estudio.
     */
    public function update(Request $request, PlanEstudio $planEstudio): RedirectResponse
    {
        $datos = $this->validar($request, $planEstudio);

        $nombre = trim($datos['nombre']);
        $descripcion = $this->normalizarNullable($datos['descripcion'] ?? null);
        $moodleCategoryId = $datos['moodle_category_id'] ?? $planEstudio->moodle_category_id;

        // 🔄 SINCRONIZACIÓN CON MOODLE
        if ($moodleCategoryId) {
            try {
                // Si ya tiene categoría, la renombramos / actualizamos en Moodle
                $this->moodleService->actualizarCategoria((int) $moodleCategoryId, $nombre, $descripcion);
            } catch (\Throwable $e) {
                Log::error("Error actualizando categoría en Moodle: " . $e->getMessage());
            }
        } else {
            try {
                // Si no tenía categoría, se crea
                $resMoodle = $this->moodleService->crearCategoria(
                    $nombre,
                    $descripcion ?? "Categoría del plan de estudios {$nombre}"
                );

                if (is_array($resMoodle) && isset($resMoodle[0]['id'])) {
                    $moodleCategoryId = (int) $resMoodle[0]['id'];
                }
            } catch (\Throwable $e) {
                Log::error("Error creando categoría en Moodle durante actualización: " . $e->getMessage());
            }
        }

        $planEstudio->update([
            'nombre'             => $nombre,
            'descripcion'        => $descripcion,
            'activo'             => (bool) $datos['activo'],
            'moodle_category_id' => $moodleCategoryId,
            'codigo'             => $this->normalizarNullable($datos['codigo'] ?? null),
            'resolucion'         => $this->normalizarNullable($datos['resolucion'] ?? null),
            'tipo'               => $datos['tipo'] ?? null,
        ]);

        return to_route('planes-estudio.index')->with('success', 'Plan de estudio y categoría en Moodle actualizados correctamente.');
    }

    /**
     * Activar o desactivar un plan de estudio.
     */
    public function actualizarEstado(Request $request, PlanEstudio $planEstudio): RedirectResponse
    {
        $datos = $request->validate([
            'activo' => ['required', 'boolean'],
        ]);

        $planEstudio->update(['activo' => (bool) $datos['activo']]);

        return back()->with('success', 'Estado del plan de estudio actualizado correctamente.');
    }

    /**
     * Obtener los periodos para mostrarlos en el modal.
     */
    public function periodos(PlanEstudio $planEstudio): JsonResponse
    {
        $planEstudio->load(['periodos:id,nombre,fecha_inicio,fecha_fin,activo']);

        $periodosSeleccionados = $planEstudio->periodos->pluck('id')->map(fn ($id) => (int) $id)->all();

        $periodos = Periodo::query()
            ->orderByDesc('fecha_inicio')
            ->orderByDesc('id')
            ->get(['id', 'nombre', 'descripcion', 'fecha_inicio', 'fecha_fin', 'activo'])
            ->map(function (Periodo $periodo) use ($periodosSeleccionados): array {
                return [
                    'id' => $periodo->id,
                    'nombre' => $periodo->nombre,
                    'descripcion' => $periodo->descripcion,
                    'fecha_inicio' => $periodo->fecha_inicio?->format('Y-m-d'),
                    'fecha_fin' => $periodo->fecha_fin?->format('Y-m-d'),
                    'activo' => (bool) $periodo->activo,
                    'seleccionado' => in_array((int) $periodo->id, $periodosSeleccionados, true),
                ];
            })
            ->values();

        return response()->json([
            'plan' => [
                'id' => $planEstudio->id,
                'nombre' => $planEstudio->nombre,
                'codigo' => $planEstudio->codigo,
            ],
            'periodos' => $periodos,
        ]);
    }

    /**
     * Asociar los periodos seleccionados al plan.
     */
    public function sincronizarPeriodos(Request $request, PlanEstudio $planEstudio): RedirectResponse
    {
        $datos = $request->validate([
            'periodo_ids' => ['required', 'array', 'min:1'],
            'periodo_ids.*' => ['required', 'integer', 'distinct', 'exists:periodos,id'],
        ], [
            'periodo_ids.required' => 'Debe seleccionar por lo menos un periodo.',
            'periodo_ids.array' => 'Los periodos seleccionados no tienen un formato válido.',
            'periodo_ids.min' => 'Debe seleccionar por lo menos un periodo.',
            'periodo_ids.*.required' => 'Uno de los periodos seleccionados no es válido.',
            'periodo_ids.*.distinct' => 'No puede seleccionar un periodo más de una vez.',
            'periodo_ids.*.exists' => 'Uno de los periodos seleccionados no existe.',
        ]);

        DB::transaction(function () use ($datos, $planEstudio) {
            $periodoIds = collect($datos['periodo_ids'])->map(fn ($id) => (int) $id)->unique()->values()->all();
            $planEstudio->periodos()->sync($periodoIds);
        });

        return back()->with('success', 'Periodos asociados correctamente al plan de estudio.');
    }

    /**
     * Eliminar un plan de estudio.
     */
    public function destroy(PlanEstudio $planEstudio): RedirectResponse
    {
        try {
            DB::transaction(function () use ($planEstudio) {
                $planEstudio->periodos()->detach();
                $planEstudio->delete();
            });

            return back()->with('success', 'Plan de estudio eliminado correctamente.');
        } catch (Throwable $exception) {
            report($exception);
            return back()->with('error', 'No se pudo eliminar el plan de estudio porque tiene registros académicos relacionados.');
        }
    }

    /**
     * Carga inicial de la vista de Malla Curricular.
     */
    public function malla(): Response
    {
        $planes = PlanEstudio::select('id', 'nombre', 'codigo', 'tipo', 'resolucion')
            ->where('activo', 1)
            ->orderBy('nombre')
            ->get();

        $semestres = Semestre::select('id', 'nombre')->orderBy('id', 'asc')->get();

        return Inertia::render('PlanesEstudio/MallaCurricular', [
            'planes' => $planes,
            'semestres' => $semestres,
        ]);
    }

    /**
     * Carga de datos de la malla curricular vía AJAX.
     */
    public function obtenerMallaAjax(Request $request): JsonResponse
    {
        $request->validate([
            'plan_id' => 'required|integer|exists:planes_estudio,id',
        ]);

        $planId = (int) $request->input('plan_id');

        $plan = PlanEstudio::select('id', 'nombre', 'codigo', 'tipo', 'resolucion', 'descripcion')->findOrFail($planId);

        $cursos = Curso::whereHas('planesEstudio', fn ($q) => $q->where('plan_estudio_id', $planId))
            ->with(['semestre:id,nombre', 'moduloFormativo:id_modulo,nombre,num_modulo'])
            ->orderBy('semestre_id')
            ->orderBy('orden')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'codigo' => 'CUR-' . str_pad($c->id, 3, '0', STR_PAD_LEFT),
                'nombre' => $c->nombre,
                'descripcion' => $c->descripcion,
                'semestre_id' => $c->semestre_id,
                'tipo' => $c->tipo,
                'creditos' => (float) $c->creditos,
                'horas_semestrales' => (int) $c->horas_semestrales,
                'orden' => $c->orden,
                'modulo' => $c->moduloFormativo ? [
                    'id' => $c->moduloFormativo->id_modulo,
                    'nombre' => $c->moduloFormativo->nombre,
                    'num_modulo' => $c->moduloFormativo->num_modulo,
                ] : null,
            ]);

        return response()->json([
            'plan' => $plan,
            'cursosPorSemestre' => $cursos->groupBy('semestre_id'),
            'totales' => [
                'total_cursos' => $cursos->count(),
                'total_creditos' => (float) $cursos->sum('creditos'),
                'total_horas' => (int) $cursos->sum('horas_semestrales'),
            ],
        ]);
    }

    /**
     * Validaciones de creación y actualización.
     */
    private function validar(Request $request, ?PlanEstudio $planEstudio = null): array
    {
        return $request->validate([
            'nombre' => ['required', 'string', 'max:100'],
            'descripcion' => ['nullable', 'string', 'max:2000'],
            'activo' => ['required', 'boolean'],
            'moodle_category_id' => ['nullable', 'integer', 'min:1'],
            'codigo' => ['nullable', 'string', 'max:50', Rule::unique('planes_estudio', 'codigo')->ignore($planEstudio?->id)],
            'resolucion' => ['nullable', 'string', 'max:50'],
            'tipo' => ['nullable', Rule::in(['Modular', 'transversal', 'empleabilidad'])],
        ], [
            'nombre.required' => 'El nombre del plan de estudio es obligatorio.',
            'nombre.max' => 'El nombre no debe superar los 100 caracteres.',
            'descripcion.max' => 'La descripción no debe superar los 2000 caracteres.',
            'codigo.unique' => 'Ya existe un plan de estudio con ese código.',
            'codigo.max' => 'El código no debe superar los 50 caracteres.',
            'resolucion.max' => 'La resolución no debe superar los 50 caracteres.',
            'tipo.in' => 'El tipo de plan de estudio seleccionado no es válido.',
            'moodle_category_id.integer' => 'La categoría de Moodle debe ser un número entero.',
        ]);
    }

    /**
     * Transformar el plan para las vistas Inertia.
     */
    private function planData(PlanEstudio $plan): array
    {
        return [
            'id' => $plan->id,
            'nombre' => $plan->nombre,
            'descripcion' => $plan->descripcion,
            'activo' => (bool) $plan->activo,
            'moodle_category_id' => $plan->moodle_category_id,
            'codigo' => $plan->codigo,
            'resolucion' => $plan->resolucion,
            'tipo' => $plan->tipo,
            'periodos' => $plan->relationLoaded('periodos')
                ? $plan->periodos->map(fn (Periodo $periodo): array => [
                    'id' => $periodo->id,
                    'nombre' => $periodo->nombre,
                    'fecha_inicio' => $periodo->fecha_inicio?->format('Y-m-d'),
                    'fecha_fin' => $periodo->fecha_fin?->format('Y-m-d'),
                    'activo' => (bool) $periodo->activo,
                ])->values()->all()
                : [],
            'periodo_ids' => $plan->relationLoaded('periodos')
                ? $plan->periodos->pluck('id')->map(fn ($id) => (int) $id)->values()->all()
                : [],
            'created_at' => $plan->created_at?->format('d/m/Y H:i'),
            'updated_at' => $plan->updated_at?->format('d/m/Y H:i'),
        ];
    }

    /**
     * Tipos permitidos por la columna ENUM.
     */
    private function tipos(): array
    {
        return [
            ['value' => 'Modular', 'label' => 'Modular'],
            ['value' => 'transversal', 'label' => 'Transversal'],
            ['value' => 'empleabilidad', 'label' => 'Empleabilidad'],
        ];
    }

    /**
     * Convertir cadenas vacías en null.
     */
    private function normalizarNullable(mixed $valor): ?string
    {
        $valor = trim((string) $valor);
        return $valor !== '' ? $valor : null;
    }

    public function generarPdfMalla(int $planId): HttpResponse
    {
        $plan = PlanEstudio::findOrFail($planId);
        $semestres = Semestre::orderBy('id', 'asc')->get();

        $cursos = Curso::whereHas('planesEstudio', fn ($q) => $q->where('plan_estudio_id', $planId))
            ->with(['semestre:id,nombre', 'moduloFormativo:id_modulo,nombre,num_modulo'])
            ->orderBy('semestre_id')
            ->orderBy('orden')
            ->get();

        $cursosPorSemestre = $cursos->groupBy('semestre_id');

        $totales = [
            'total_cursos'   => $cursos->count(),
            'total_creditos' => (float) $cursos->sum('creditos'),
            'total_horas'    => (int) $cursos->sum('horas_semestrales'),
        ];

        $instituto = Instituto::with('distrito.provincia.departamento')->first();
        $imagenBase64 = null;
        if ($instituto && !empty($instituto->logo) && file_exists(public_path('storage/' . $instituto->logo))) {
            $path = public_path('storage/' . $instituto->logo);
            $type = pathinfo($path, PATHINFO_EXTENSION);
            $data = file_get_contents($path);
            $imagenBase64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
        }

        $pdf = Pdf::loadView('pdf.malla_curricular', [
            'plan'              => $plan,
            'semestres'         => $semestres,
            'cursosPorSemestre' => $cursosPorSemestre,
            'totales'           => $totales,
            'instituto'         => $instituto,
            'imagenBase64'      => $imagenBase64,
        ]);

        return $pdf->stream('Plan_Estudios_' . ($plan->codigo ?? $plan->id) . '.pdf');
    }
}