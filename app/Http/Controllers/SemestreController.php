<?php

namespace App\Http\Controllers;

use App\Models\Semestre;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class SemestreController extends Controller
{
    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->input('buscar', ''));
        $estado = trim((string) $request->input('estado', ''));

        $semestres = Semestre::query()
            ->when(
                $buscar !== '',
                function ($query) use ($buscar): void {
                    $query->where(function ($subquery) use ($buscar): void {
                        $subquery
                            ->where('nombre', 'like', "%{$buscar}%")
                            ->orWhere('descripcion', 'like', "%{$buscar}%");
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
            ->orderBy('nombre')
            ->paginate(10)
            ->withQueryString()
            ->through(function (Semestre $semestre): array {
                return [
                    'id' => $semestre->id,
                    'nombre' => $semestre->nombre,
                    'descripcion' => $semestre->descripcion,
                    'activo' => (bool) $semestre->activo,
                    'fecha_creacion' => $semestre->fecha_creacion
                        ?->format('d/m/Y H:i'),
                    'created_at' => $semestre->created_at
                        ?->format('d/m/Y H:i'),
                    'updated_at' => $semestre->updated_at
                        ?->format('d/m/Y H:i'),
                ];
            });

        return Inertia::render('Semestres/Index', [
            'semestres' => $semestres,
            'filtros' => [
                'buscar' => $buscar,
                'estado' => $estado,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Semestres/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        Semestre::create([
            'nombre' => trim($datos['nombre']),
            'descripcion' => $this->normalizarNullable(
                $datos['descripcion'] ?? null
            ),
            'activo' => (bool) $datos['activo'],
            'fecha_creacion' => now(),
        ]);

        return to_route('semestres.index')
            ->with('success', 'Semestre registrado correctamente.');
    }

    public function edit(Semestre $semestre): Response
    {
        return Inertia::render('Semestres/Edit', [
            'semestre' => [
                'id' => $semestre->id,
                'nombre' => $semestre->nombre,
                'descripcion' => $semestre->descripcion,
                'activo' => (bool) $semestre->activo,
                'fecha_creacion' => $semestre->fecha_creacion
                    ?->format('d/m/Y H:i'),
            ],
        ]);
    }

    public function update(
        Request $request,
        Semestre $semestre
    ): RedirectResponse {
        $datos = $this->validar($request, $semestre);

        $semestre->update([
            'nombre' => trim($datos['nombre']),
            'descripcion' => $this->normalizarNullable(
                $datos['descripcion'] ?? null
            ),
            'activo' => (bool) $datos['activo'],
        ]);

        return to_route('semestres.index')
            ->with('success', 'Semestre actualizado correctamente.');
    }

    public function actualizarEstado(
        Request $request,
        Semestre $semestre
    ): RedirectResponse {
        $datos = $request->validate([
            'activo' => [
                'required',
                'boolean',
            ],
        ]);

        $semestre->update([
            'activo' => (bool) $datos['activo'],
        ]);

        return back()->with(
            'success',
            'Estado del semestre actualizado correctamente.'
        );
    }

    public function destroy(Semestre $semestre): RedirectResponse
    {
        try {
            $semestre->delete();

            return back()->with(
                'success',
                'Semestre eliminado correctamente.'
            );
        } catch (Throwable $exception) {
            report($exception);

            return back()->with(
                'error',
                'No se pudo eliminar el semestre porque tiene registros relacionados.'
            );
        }
    }

    private function validar(
        Request $request,
        ?Semestre $semestre = null
    ): array {
        return $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:50',
                Rule::unique('semestres', 'nombre')
                    ->ignore($semestre?->id),
            ],
            'descripcion' => [
                'nullable',
                'string',
                'max:1000',
            ],
            'activo' => [
                'required',
                'boolean',
            ],
        ], [
            'nombre.required' => 'El nombre del semestre es obligatorio.',
            'nombre.unique' => 'Ya existe un semestre con ese nombre.',
            'nombre.max' => 'El nombre no debe superar los 50 caracteres.',
            'descripcion.max' => 'La descripción no debe superar los 1000 caracteres.',
            'activo.required' => 'Debe indicar el estado del semestre.',
            'activo.boolean' => 'El estado seleccionado no es válido.',
        ]);
    }

    private function normalizarNullable(mixed $valor): ?string
    {
        $valor = trim((string) $valor);

        return $valor !== '' ? $valor : null;
    }
}
