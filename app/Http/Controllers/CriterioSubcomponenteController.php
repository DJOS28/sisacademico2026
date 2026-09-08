<?php

namespace App\Http\Controllers;

use App\Models\CriterioSubcomponente;
use App\Models\LogroCurso;
use App\Models\SubcomponenteLogro;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CriterioSubcomponenteController extends Controller
{
    /**
     * Listar criterios de un subcomponente específico
     */
    public function index($subcomponenteId): JsonResponse
    {
        $criterios = CriterioSubcomponente::where('subcomponente_id', $subcomponenteId)
            ->orderBy('orden', 'asc')
            ->get();

        return response()->json([
            'success'   => true,
            'criterios' => $criterios,
        ]);
    }

    /**
     * Registrar un nuevo criterio individual (ej: C1, C2, etc.)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subcomponente_id' => 'required|integer|exists:subcomponentes_logro,id',
            'codigo'           => 'required|string|max:20',
            'nombre'           => 'nullable|string|max:150',
            'orden'            => 'nullable|integer|min:1',
        ]);

        $validated['codigo'] = strtoupper(trim($validated['codigo']));

        $criterio = CriterioSubcomponente::create($validated);

        return response()->json([
            'success'  => true,
            'message'  => 'Criterio creado exitosamente.',
            'criterio' => $criterio,
        ]);
    }

    /**
     * Actualizar datos de un criterio (código y nombre)
     */
    public function update(Request $request, $id): JsonResponse
    {
        $criterio = CriterioSubcomponente::findOrFail($id);

        $validated = $request->validate([
            'codigo' => 'required|string|max:20',
            'nombre' => 'nullable|string|max:150',
            'orden'  => 'nullable|integer|min:1',
        ]);

        $validated['codigo'] = strtoupper(trim($validated['codigo']));

        $criterio->update($validated);

        return response()->json([
            'success'  => true,
            'message'  => 'Criterio actualizado correctamente.',
            'criterio' => $criterio,
        ]);
    }

    /**
     * Eliminar un criterio
     */
    public function destroy($id): JsonResponse
    {
        $criterio = CriterioSubcomponente::findOrFail($id);
        $criterio->delete();

        return response()->json([
            'success' => true,
            'message' => 'Criterio eliminado correctamente.',
        ]);
    }

    /**
     * Generar automáticamente C1, C2, C3, C4 para un subcomponente individual
     */
    public function generarCriteriosDefecto($subcomponenteId): JsonResponse
    {
        $subcomponente = SubcomponenteLogro::findOrFail($subcomponenteId);

        $criteriosBase = [
            ['codigo' => 'C1', 'nombre' => 'Criterio 1', 'orden' => 1],
            ['codigo' => 'C2', 'nombre' => 'Criterio 2', 'orden' => 2],
            ['codigo' => 'C3', 'nombre' => 'Criterio 3', 'orden' => 3],
            ['codigo' => 'C4', 'nombre' => 'Criterio 4', 'orden' => 4],
        ];

        foreach ($criteriosBase as $item) {
            CriterioSubcomponente::firstOrCreate(
                [
                    'subcomponente_id' => $subcomponente->id,
                    'codigo'           => $item['codigo'],
                ],
                [
                    'nombre' => $item['nombre'],
                    'orden'  => $item['orden'],
                ]
            );
        }

        $criterios = CriterioSubcomponente::where('subcomponente_id', $subcomponente->id)
            ->orderBy('orden')
            ->get();

        return response()->json([
            'success'   => true,
            'message'   => 'Criterios C1-C4 generados por defecto.',
            'criterios' => $criterios,
        ]);
    }

    /**
     * Generar la estructura oficial completa MINEDU para un Logro:
     * - ACTITUDINAL (Peso: 33.34%)
     * - CONCEPTUAL (Peso: 33.33%)
     * - PROCEDIMENTAL (Peso: 33.33%)
     * Cada una con sus casilleros C1 a C4.
     */
    public function generarEstructuraOficial($logroId): JsonResponse
    {
        $logro = LogroCurso::findOrFail($logroId);

        try {
            DB::transaction(function () use ($logro) {
                $dimensionesBase = [
                    ['nombre' => 'ACTITUDINAL',   'descripcion' => 'Evaluación Actitudinal',   'peso' => 33.34],
                    ['nombre' => 'CONCEPTUAL',    'descripcion' => 'Evaluación Conceptual',    'peso' => 33.33],
                    ['nombre' => 'PROCEDIMENTAL', 'descripcion' => 'Evaluación Procedimental', 'peso' => 33.33],
                ];

                foreach ($dimensionesBase as $dim) {
                    $sub = SubcomponenteLogro::firstOrCreate(
                        [
                            'logro_curso_id' => $logro->id,
                            'nombre'         => $dim['nombre'],
                        ],
                        [
                            'descripcion' => $dim['descripcion'],
                            'peso'        => $dim['peso'],
                        ]
                    );

                    // Si ya existía pero tenía peso 0, le actualizamos su peso base
                    if ((float)$sub->peso == 0) {
                        $sub->update(['peso' => $dim['peso']]);
                    }

                    for ($i = 1; $i <= 4; $i++) {
                        CriterioSubcomponente::firstOrCreate(
                            [
                                'subcomponente_id' => $sub->id,
                                'codigo'           => "C{$i}",
                            ],
                            [
                                'nombre' => "Criterio {$i}",
                                'orden'  => $i,
                            ]
                        );
                    }
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Estructura oficial MINEDU generada exitosamente con pesos por dimensión.',
            ]);
        } catch (\Throwable $e) {
            Log::error("Error en generarEstructuraOficial: {$e->getMessage()}");
            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error al generar la estructura oficial: ' . $e->getMessage(),
            ], 500);
        }
    }
}