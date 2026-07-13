<?php

namespace App\Http\Controllers;

use App\Models\Periodo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PeriodoController extends Controller
{
    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->input('buscar', ''));

        $periodos = Periodo::query()
            ->when(
                $buscar !== '',
                function ($query) use ($buscar): void {
                    $query->where(
                        function ($subquery) use ($buscar): void {
                            $subquery
                                ->where('nombre', 'like', "%{$buscar}%")
                                ->orWhere(
                                    'descripcion',
                                    'like',
                                    "%{$buscar}%"
                                );
                        }
                    );
                }
            )
            ->orderByDesc('fecha_inicio')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Periodos/Index', [
            'periodos' => $periodos,
            'filtros' => [
                'buscar' => $buscar,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Periodos/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        DB::transaction(function () use ($datos): void {
            $activo = (bool) ($datos['activo'] ?? false);

            if ($activo) {
                /*
                 * Solo puede existir un periodo activo.
                 * Al activar el nuevo periodo, se desactivan los demás.
                 */
                Periodo::query()->update([
                    'activo' => false,
                ]);
            }

            Periodo::create([
                'nombre' => trim($datos['nombre']),
                'descripcion' => $this->normalizarNullable(
                    $datos['descripcion'] ?? null
                ),
                'fecha_inicio' => $datos['fecha_inicio'],
                'fecha_fin' => $datos['fecha_fin'],
                'activo' => $activo,
            ]);
        });

        return to_route('periodos.index')
            ->with('success', 'Periodo registrado correctamente.');
    }

    public function edit(Periodo $periodo): Response
    {
        return Inertia::render('Periodos/Edit', [
            'periodo' => [
                'id' => $periodo->id,
                'nombre' => $periodo->nombre,
                'descripcion' => $periodo->descripcion,
                'fecha_inicio' => optional(
                    $periodo->fecha_inicio
                )?->format('Y-m-d'),
                'fecha_fin' => optional(
                    $periodo->fecha_fin
                )?->format('Y-m-d'),
                'activo' => (bool) $periodo->activo,
            ],
        ]);
    }

    public function update(
        Request $request,
        Periodo $periodo
    ): RedirectResponse {
        $datos = $this->validar($request, $periodo);

        DB::transaction(function () use (
            $datos,
            $periodo
        ): void {
            $activo = (bool) ($datos['activo'] ?? false);

            if ($activo) {
                Periodo::query()
                    ->where('id', '!=', $periodo->id)
                    ->update([
                        'activo' => false,
                    ]);
            }

            $periodo->update([
                'nombre' => trim($datos['nombre']),
                'descripcion' => $this->normalizarNullable(
                    $datos['descripcion'] ?? null
                ),
                'fecha_inicio' => $datos['fecha_inicio'],
                'fecha_fin' => $datos['fecha_fin'],
                'activo' => $activo,
            ]);
        });

        return to_route('periodos.index')
            ->with('success', 'Periodo actualizado correctamente.');
    }

    public function activar(
        Periodo $periodo
    ): RedirectResponse {
        DB::transaction(function () use ($periodo): void {
            Periodo::query()->update([
                'activo' => false,
            ]);

            $periodo->update([
                'activo' => true,
            ]);
        });

        return back()->with(
            'success',
            'Periodo activado correctamente.'
        );
    }

    public function desactivar(
        Periodo $periodo
    ): RedirectResponse {
        if (! $periodo->activo) {
            return back()->with(
                'info',
                'El periodo ya se encuentra inactivo.'
            );
        }

        $periodo->update([
            'activo' => false,
        ]);

        return back()->with(
            'success',
            'Periodo desactivado correctamente.'
        );
    }

    public function destroy(
        Periodo $periodo
    ): RedirectResponse {
        if ($periodo->activo) {
            return back()->with(
                'error',
                'No se puede eliminar el periodo activo. Primero active otro periodo o desactívelo.'
            );
        }

        try {
            $periodo->delete();

            return back()->with(
                'success',
                'Periodo eliminado correctamente.'
            );
        } catch (Throwable $exception) {
            report($exception);

            return back()->with(
                'error',
                'No se pudo eliminar el periodo porque tiene registros relacionados.'
            );
        }
    }

    private function validar(
        Request $request,
        ?Periodo $periodo = null
    ): array {
        return $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:50',
                Rule::unique('periodos', 'nombre')
                    ->ignore($periodo?->id),
            ],
            'descripcion' => [
                'nullable',
                'string',
                'max:1000',
            ],
            'fecha_inicio' => [
                'required',
                'date',
            ],
            'fecha_fin' => [
                'required',
                'date',
                'after_or_equal:fecha_inicio',
            ],
            'activo' => [
                'required',
                'boolean',
            ],
        ], [
            'nombre.required' =>
                'El nombre del periodo es obligatorio.',
            'nombre.unique' =>
                'Ya existe un periodo con ese nombre.',
            'fecha_inicio.required' =>
                'La fecha de inicio es obligatoria.',
            'fecha_fin.required' =>
                'La fecha de fin es obligatoria.',
            'fecha_fin.after_or_equal' =>
                'La fecha de fin debe ser igual o posterior a la fecha de inicio.',
            'activo.required' =>
                'Debe indicar si el periodo estará activo.',
            'activo.boolean' =>
                'El valor del estado activo no es válido.',
        ]);
    }

    private function normalizarNullable(
        mixed $valor
    ): ?string {
        $valor = trim((string) $valor);

        return $valor !== ''
            ? $valor
            : null;
    }
}
