<?php

namespace App\Http\Controllers;

use App\Models\Seccion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SeccionController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Secciones/Index', [
            'secciones' => $this->obtenerSecciones(),
            'filtros' => [
                'buscar' => '',
            ],
        ]);
    }

    public function filtrar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'buscar' => [
                'nullable',
                'string',
                'max:100',
            ],
            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        $buscar = trim((string) ($datos['buscar'] ?? ''));
        $pagina = (int) ($datos['page'] ?? 1);

        return response()->json([
            'secciones' => $this->obtenerSecciones(
                buscar: $buscar,
                pagina: $pagina
            ),
            'filtros' => [
                'buscar' => $buscar,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Secciones/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        Seccion::create([
            'nombre' => trim($datos['nombre']),
            'descripcion' => filled($datos['descripcion'] ?? null)
                ? trim($datos['descripcion'])
                : null,
        ]);

        return to_route('secciones.index')
            ->with(
                'success',
                'Sección registrada correctamente.'
            );
    }

    public function edit(Seccion $seccion): Response
    {
        return Inertia::render('Secciones/Edit', [
            'seccion' => $seccion,
        ]);
    }

    public function update(
        Request $request,
        Seccion $seccion
    ): RedirectResponse {
        $datos = $this->validar($request, $seccion);

        $seccion->update([
            'nombre' => trim($datos['nombre']),
            'descripcion' => filled($datos['descripcion'] ?? null)
                ? trim($datos['descripcion'])
                : null,
        ]);

        return to_route('secciones.index')
            ->with(
                'success',
                'Sección actualizada correctamente.'
            );
    }

    public function destroy(
        Seccion $seccion
    ): RedirectResponse {
        /*
         * Agrega aquí una validación cuando la sección
         * tenga horarios, estudiantes u otras relaciones.
         */

        $seccion->delete();

        return back()->with(
            'success',
            'Sección eliminada correctamente.'
        );
    }

    private function obtenerSecciones(
        string $buscar = '',
        int $pagina = 1
    ) {
        return Seccion::query()
            ->when(
                $buscar !== '',
                function ($query) use ($buscar) {
                    $query->where(
                        function ($subquery) use ($buscar) {
                            $subquery
                                ->where(
                                    'nombre',
                                    'like',
                                    "%{$buscar}%"
                                )
                                ->orWhere(
                                    'descripcion',
                                    'like',
                                    "%{$buscar}%"
                                );
                        }
                    );
                }
            )
            ->orderBy('nombre')
            ->paginate(
                perPage: 15,
                columns: ['*'],
                pageName: 'page',
                page: $pagina
            );
    }

    private function validar(
        Request $request,
        ?Seccion $seccion = null
    ): array {
        return $request->validate(
            [
                'nombre' => [
                    'required',
                    'string',
                    'max:50',
                    Rule::unique('secciones', 'nombre')
                        ->ignore($seccion?->id),
                ],
                'descripcion' => [
                    'nullable',
                    'string',
                    'max:1000',
                ],
            ],
            [
                'nombre.required' =>
                    'El nombre de la sección es obligatorio.',
                'nombre.unique' =>
                    'Ya existe una sección con este nombre.',
                'nombre.max' =>
                    'El nombre no debe superar los 50 caracteres.',
                'descripcion.max' =>
                    'La descripción no debe superar los 1000 caracteres.',
            ]
        );
    }
}