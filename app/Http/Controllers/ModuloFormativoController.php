<?php

namespace App\Http\Controllers;

use App\Models\ModuloFormativo;
use App\Models\PlanEstudio;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ModuloFormativoController extends Controller
{
    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->input('buscar', ''));
        $planEstudioId = $request->input('plan_estudio_id');

        $modulos = ModuloFormativo::query()
            ->with([
                'planEstudio:id,nombre,codigo,activo',
            ])
            ->when(
                $buscar !== '',
                function ($query) use ($buscar): void {
                    $query->where(function ($subquery) use ($buscar): void {
                        $subquery
                            ->where('nombre', 'like', "%{$buscar}%")
                            ->orWhere('num_modulo', 'like', "%{$buscar}%")
                            ->orWhere('horas', 'like', "%{$buscar}%")
                            ->orWhere('creditos', 'like', "%{$buscar}%")
                            ->orWhereHas(
                                'planEstudio',
                                function ($planQuery) use ($buscar): void {
                                    $planQuery
                                        ->where('nombre', 'like', "%{$buscar}%")
                                        ->orWhere('codigo', 'like', "%{$buscar}%");
                                }
                            );
                    });
                }
            )
            ->when(
                filled($planEstudioId),
                fn ($query) => $query->where(
                    'id_plan_estudio',
                    $planEstudioId
                )
            )
            ->orderBy('id_plan_estudio')
            ->orderBy('num_modulo')
            ->paginate(10)
            ->withQueryString()
            ->through(
                fn (ModuloFormativo $modulo): array =>
                    $this->moduloData($modulo)
            );

        $planesEstudio = PlanEstudio::query()
            ->orderBy('nombre')
            ->get([
                'id',
                'nombre',
                'codigo',
                'activo',
            ])
            ->map(
                fn (PlanEstudio $plan): array => [
                    'id' => $plan->id,
                    'nombre' => $plan->nombre,
                    'codigo' => $plan->codigo,
                    'activo' => (bool) $plan->activo,
                ]
            )
            ->values();

        return Inertia::render('ModulosFormativos/Index', [
            'modulos' => $modulos,
            'planesEstudio' => $planesEstudio,
            'filtros' => [
                'buscar' => $buscar,
                'plan_estudio_id' => $planEstudioId
                    ? (string) $planEstudioId
                    : '',
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('ModulosFormativos/Create', [
            'planesEstudio' => $this->planesParaFormulario(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        ModuloFormativo::create([
            'id_plan_estudio' => (int) $datos['id_plan_estudio'],
            'nombre' => trim($datos['nombre']),
            'num_modulo' => (int) $datos['num_modulo'],
            'horas' => (int) $datos['horas'],
            'creditos' =>$datos['creditos'],
        ]);

        return to_route('modulos-formativos.index')
            ->with(
                'success',
                'Módulo formativo registrado correctamente.'
            );
    }

    public function edit(
        ModuloFormativo $moduloFormativo
    ): Response {
        $moduloFormativo->load(
            'planEstudio:id,nombre,codigo,activo'
        );

        return Inertia::render('ModulosFormativos/Edit', [
            'modulo' => $this->moduloData($moduloFormativo),
            'planesEstudio' => $this->planesParaFormulario(
                $moduloFormativo->id_plan_estudio
            ),
        ]);
    }

    public function update(
        Request $request,
        ModuloFormativo $moduloFormativo
    ): RedirectResponse {
        $datos = $this->validar(
            $request,
            $moduloFormativo
        );

        $moduloFormativo->update([
            'id_plan_estudio' => (int) $datos['id_plan_estudio'],
            'nombre' => trim($datos['nombre']),
            'num_modulo' => (int) $datos['num_modulo'],
            'horas' => (int) $datos['horas'],
            'creditos' => $datos['creditos'],
        ]);

        return to_route('modulos-formativos.index')
            ->with(
                'success',
                'Módulo formativo actualizado correctamente.'
            );
    }

    public function destroy(
        ModuloFormativo $moduloFormativo
    ): RedirectResponse {
        try {
            DB::transaction(
                function () use ($moduloFormativo): void {
                    $moduloFormativo->delete();
                }
            );

            return back()->with(
                'success',
                'Módulo formativo eliminado correctamente.'
            );
        } catch (Throwable $exception) {
            report($exception);

            return back()->with(
                'error',
                'No se pudo eliminar el módulo porque tiene registros académicos relacionados.'
            );
        }
    }

    private function validar(
        Request $request,
        ?ModuloFormativo $moduloFormativo = null
    ): array {
        $planEstudioId = $request->input('id_plan_estudio');

        return $request->validate([
            'id_plan_estudio' => [
                'required',
                'integer',
                'exists:planes_estudio,id',
            ],
            'nombre' => [
                'required',
                'string',
                'max:100',
            ],
            'num_modulo' => [
                'required',
                'integer',
                'min:1',
                Rule::unique(
                    'modulos_formativos',
                    'num_modulo'
                )
                    ->where(
                        fn ($query) => $query->where(
                            'id_plan_estudio',
                            $planEstudioId
                        )
                    )
                    ->ignore(
                        $moduloFormativo?->id_modulo,
                        'id_modulo'
                    ),
            ],
            'horas' => [
                'required',
                'integer',
                'min:1',
                'max:10000',
            ],
            'creditos' => [
                'required',
                'numeric',
                'min:0.01',
                'max:1000',
                'decimal:0,2',
            ],
        ], [
            'id_plan_estudio.required' =>
                'Debe seleccionar un plan de estudio.',
            'id_plan_estudio.exists' =>
                'El plan de estudio seleccionado no existe.',
            'nombre.required' =>
                'El nombre del módulo es obligatorio.',
            'nombre.max' =>
                'El nombre no debe superar los 100 caracteres.',
            'num_modulo.required' =>
                'El número de módulo es obligatorio.',
            'num_modulo.min' =>
                'El número de módulo debe ser mayor que cero.',
            'num_modulo.unique' =>
                'Ya existe ese número de módulo dentro del plan seleccionado.',
            'horas.required' =>
                'La cantidad de horas es obligatoria.',
            'horas.min' =>
                'La cantidad de horas debe ser mayor que cero.',
            'creditos.required' =>
                'La cantidad de créditos es obligatoria.',
            'creditos.min' =>
                'La cantidad de créditos debe ser mayor que cero.',
        ]);
    }

    private function moduloData(
        ModuloFormativo $modulo
    ): array {
        return [
            'id_modulo' => $modulo->id_modulo,
            'id_plan_estudio' => $modulo->id_plan_estudio,
            'nombre' => $modulo->nombre,
            'num_modulo' => $modulo->num_modulo,
            'horas' => $modulo->horas,
            'creditos' => $modulo->creditos,
            'plan_estudio' => $modulo->relationLoaded('planEstudio')
                && $modulo->planEstudio
                ? [
                    'id' => $modulo->planEstudio->id,
                    'nombre' => $modulo->planEstudio->nombre,
                    'codigo' => $modulo->planEstudio->codigo,
                    'activo' => (bool) $modulo->planEstudio->activo,
                ]
                : null,
            'created_at' => $modulo->created_at
                ?->format('d/m/Y H:i'),
            'updated_at' => $modulo->updated_at
                ?->format('d/m/Y H:i'),
        ];
    }

    private function planesParaFormulario(
        ?int $planActualId = null
    ): array {
        return PlanEstudio::query()
            ->where(function ($query) use ($planActualId): void {
                $query->where('activo', true);

                if ($planActualId) {
                    $query->orWhere('id', $planActualId);
                }
            })
            ->orderBy('nombre')
            ->get([
                'id',
                'nombre',
                'codigo',
                'activo',
            ])
            ->map(
                fn (PlanEstudio $plan): array => [
                    'id' => $plan->id,
                    'nombre' => $plan->nombre,
                    'codigo' => $plan->codigo,
                    'activo' => (bool) $plan->activo,
                ]
            )
            ->values()
            ->all();
    }
}
