<?php

namespace App\Http\Controllers;

use App\Models\Periodo;
use App\Models\PlanEstudio;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PlanEstudioController extends Controller
{
    /**
     * Listado de planes de estudio.
     */
    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->input('buscar', ''));
        $estado = trim((string) $request->input('estado', ''));
        $tipo = trim((string) $request->input('tipo', ''));

        $planes = PlanEstudio::query()
            ->with([
                'periodos' => fn ($query) => $query
                    ->orderByDesc('fecha_inicio'),
            ])
            ->when(
                $buscar !== '',
                function ($query) use ($buscar): void {
                    $query->where(function ($subquery) use ($buscar): void {
                        $subquery
                            ->where('nombre', 'like', "%{$buscar}%")
                            ->orWhere('descripcion', 'like', "%{$buscar}%")
                            ->orWhere('codigo', 'like', "%{$buscar}%")
                            ->orWhere('resolucion', 'like', "%{$buscar}%")
                            ->orWhere('moodle_category_id', 'like', "%{$buscar}%");
                    });
                }
            )
            ->when(
                $estado !== '',
                fn ($query) => $query->where(
                    'activo',
                    $estado === 'Activo'
                )
            )
            ->when(
                $tipo !== '',
                fn ($query) => $query->where('tipo', $tipo)
            )
            ->orderBy('nombre')
            ->paginate(10)
            ->withQueryString()
            ->through(
                fn (PlanEstudio $plan): array =>
                    $this->planData($plan)
            );

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
     * Registrar un plan de estudio.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        PlanEstudio::create([
            'nombre' => trim($datos['nombre']),
            'descripcion' => $this->normalizarNullable(
                $datos['descripcion'] ?? null
            ),
            'activo' => (bool) $datos['activo'],
            'moodle_category_id' => $datos['moodle_category_id'] ?? null,
            'codigo' => $this->normalizarNullable(
                $datos['codigo'] ?? null
            ),
            'resolucion' => $this->normalizarNullable(
                $datos['resolucion'] ?? null
            ),
            'tipo' => $datos['tipo'] ?? null,
        ]);

        return to_route('planes-estudio.index')
            ->with(
                'success',
                'Plan de estudio registrado correctamente.'
            );
    }

    /**
     * Formulario de edición.
     */
    public function edit(PlanEstudio $planEstudio): Response
    {
        $planEstudio->load([
            'periodos' => fn ($query) => $query
                ->orderByDesc('fecha_inicio'),
        ]);

        return Inertia::render('PlanesEstudio/Edit', [
            'plan' => $this->planData($planEstudio),
            'tipos' => $this->tipos(),
        ]);
    }

    /**
     * Actualizar un plan de estudio.
     */
    public function update(
        Request $request,
        PlanEstudio $planEstudio
    ): RedirectResponse {
        $datos = $this->validar(
            $request,
            $planEstudio
        );

        $planEstudio->update([
            'nombre' => trim($datos['nombre']),
            'descripcion' => $this->normalizarNullable(
                $datos['descripcion'] ?? null
            ),
            'activo' => (bool) $datos['activo'],
            'moodle_category_id' => $datos['moodle_category_id'] ?? null,
            'codigo' => $this->normalizarNullable(
                $datos['codigo'] ?? null
            ),
            'resolucion' => $this->normalizarNullable(
                $datos['resolucion'] ?? null
            ),
            'tipo' => $datos['tipo'] ?? null,
        ]);

        return to_route('planes-estudio.index')
            ->with(
                'success',
                'Plan de estudio actualizado correctamente.'
            );
    }

    /**
     * Activar o desactivar un plan de estudio.
     */
    public function actualizarEstado(
        Request $request,
        PlanEstudio $planEstudio
    ): RedirectResponse {
        $datos = $request->validate([
            'activo' => [
                'required',
                'boolean',
            ],
        ]);

        $planEstudio->update([
            'activo' => (bool) $datos['activo'],
        ]);

        return back()->with(
            'success',
            'Estado del plan de estudio actualizado correctamente.'
        );
    }

    /**
     * Obtener los periodos para mostrarlos en el modal.
     */
    public function periodos(
        PlanEstudio $planEstudio
    ): JsonResponse {
        $planEstudio->load([
            'periodos:id,nombre,fecha_inicio,fecha_fin,activo',
        ]);

        $periodosSeleccionados = $planEstudio
            ->periodos
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $periodos = Periodo::query()
            ->orderByDesc('fecha_inicio')
            ->orderByDesc('id')
            ->get([
                'id',
                'nombre',
                'descripcion',
                'fecha_inicio',
                'fecha_fin',
                'activo',
            ])
            ->map(
                function (Periodo $periodo) use (
                    $periodosSeleccionados
                ): array {
                    return [
                        'id' => $periodo->id,
                        'nombre' => $periodo->nombre,
                        'descripcion' => $periodo->descripcion,
                        'fecha_inicio' => $periodo->fecha_inicio
                            ?->format('Y-m-d'),
                        'fecha_fin' => $periodo->fecha_fin
                            ?->format('Y-m-d'),
                        'activo' => (bool) $periodo->activo,
                        'seleccionado' => in_array(
                            (int) $periodo->id,
                            $periodosSeleccionados,
                            true
                        ),
                    ];
                }
            )
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
     *
     * Este método retorna una redirección para funcionar correctamente
     * con router.put() de Inertia.
     */
    public function sincronizarPeriodos(
        Request $request,
        PlanEstudio $planEstudio
    ): RedirectResponse {
        $datos = $request->validate([
            'periodo_ids' => [
                'required',
                'array',
                'min:1',
            ],
            'periodo_ids.*' => [
                'required',
                'integer',
                'distinct',
                'exists:periodos,id',
            ],
        ], [
            'periodo_ids.required' =>
                'Debe seleccionar por lo menos un periodo.',
            'periodo_ids.array' =>
                'Los periodos seleccionados no tienen un formato válido.',
            'periodo_ids.min' =>
                'Debe seleccionar por lo menos un periodo.',
            'periodo_ids.*.required' =>
                'Uno de los periodos seleccionados no es válido.',
            'periodo_ids.*.distinct' =>
                'No puede seleccionar un periodo más de una vez.',
            'periodo_ids.*.exists' =>
                'Uno de los periodos seleccionados no existe.',
        ]);

        DB::transaction(
            function () use (
                $datos,
                $planEstudio
            ): void {
                $periodoIds = collect($datos['periodo_ids'])
                    ->map(fn ($id) => (int) $id)
                    ->unique()
                    ->values()
                    ->all();

                $planEstudio
                    ->periodos()
                    ->sync($periodoIds);
            }
        );

        return back()->with(
            'success',
            'Periodos asociados correctamente al plan de estudio.'
        );
    }

    /**
     * Eliminar un plan de estudio.
     */
    public function destroy(
        PlanEstudio $planEstudio
    ): RedirectResponse {
        try {
            DB::transaction(
                function () use ($planEstudio): void {
                    /*
                     * Aunque la tabla pivote tiene ON DELETE CASCADE,
                     * se desacopla explícitamente para mantener claridad.
                     */
                    $planEstudio
                        ->periodos()
                        ->detach();

                    $planEstudio->delete();
                }
            );

            return back()->with(
                'success',
                'Plan de estudio eliminado correctamente.'
            );
        } catch (Throwable $exception) {
            report($exception);

            return back()->with(
                'error',
                'No se pudo eliminar el plan de estudio porque tiene registros académicos relacionados.'
            );
        }
    }

    /**
     * Validaciones de creación y actualización.
     */
    private function validar(
        Request $request,
        ?PlanEstudio $planEstudio = null
    ): array {
        return $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:100',
            ],
            'descripcion' => [
                'nullable',
                'string',
                'max:2000',
            ],
            'activo' => [
                'required',
                'boolean',
            ],
            'moodle_category_id' => [
                'nullable',
                'integer',
                'min:1',
            ],
            'codigo' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('planes_estudio', 'codigo')
                    ->ignore($planEstudio?->id),
            ],
            'resolucion' => [
                'nullable',
                'string',
                'max:50',
            ],
            'tipo' => [
                'nullable',
                Rule::in([
                    'Modular',
                    'transversal',
                    'empleabilidad',
                ]),
            ],
        ], [
            'nombre.required' =>
                'El nombre del plan de estudio es obligatorio.',
            'nombre.max' =>
                'El nombre no debe superar los 100 caracteres.',
            'descripcion.max' =>
                'La descripción no debe superar los 2000 caracteres.',
            'codigo.unique' =>
                'Ya existe un plan de estudio con ese código.',
            'codigo.max' =>
                'El código no debe superar los 50 caracteres.',
            'resolucion.max' =>
                'La resolución no debe superar los 50 caracteres.',
            'tipo.in' =>
                'El tipo de plan de estudio seleccionado no es válido.',
            'moodle_category_id.integer' =>
                'La categoría de Moodle debe ser un número entero.',
        ]);
    }

    /**
     * Transformar el plan para las vistas Inertia.
     */
    private function planData(
        PlanEstudio $plan
    ): array {
        return [
            'id' => $plan->id,
            'nombre' => $plan->nombre,
            'descripcion' => $plan->descripcion,
            'activo' => (bool) $plan->activo,
            'moodle_category_id' =>
                $plan->moodle_category_id,
            'codigo' => $plan->codigo,
            'resolucion' => $plan->resolucion,
            'tipo' => $plan->tipo,

            'periodos' => $plan->relationLoaded('periodos')
                ? $plan->periodos
                    ->map(
                        fn (Periodo $periodo): array => [
                            'id' => $periodo->id,
                            'nombre' => $periodo->nombre,
                            'fecha_inicio' => $periodo->fecha_inicio
                                ?->format('Y-m-d'),
                            'fecha_fin' => $periodo->fecha_fin
                                ?->format('Y-m-d'),
                            'activo' => (bool) $periodo->activo,
                        ]
                    )
                    ->values()
                    ->all()
                : [],

            'periodo_ids' => $plan->relationLoaded('periodos')
                ? $plan->periodos
                    ->pluck('id')
                    ->map(fn ($id) => (int) $id)
                    ->values()
                    ->all()
                : [],

            'created_at' => $plan->created_at
                ?->format('d/m/Y H:i'),

            'updated_at' => $plan->updated_at
                ?->format('d/m/Y H:i'),
        ];
    }

    /**
     * Tipos permitidos por la columna ENUM.
     */
    private function tipos(): array
    {
        return [
            [
                'value' => 'Modular',
                'label' => 'Modular',
            ],
            [
                'value' => 'transversal',
                'label' => 'Transversal',
            ],
            [
                'value' => 'empleabilidad',
                'label' => 'Empleabilidad',
            ],
        ];
    }

    /**
     * Convertir cadenas vacías en null.
     */
    private function normalizarNullable(
        mixed $valor
    ): ?string {
        $valor = trim((string) $valor);

        return $valor !== ''
            ? $valor
            : null;
    }
}