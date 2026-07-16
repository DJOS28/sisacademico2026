<?php

namespace App\Http\Controllers;

use App\Models\Departamento;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DepartamentoController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Departamentos/Index', [
            'departamentos' => $this->obtenerDepartamentos(),
            'filtros' => [
                'buscar' => '',
            ],
        ]);
    }

    public function filtrar(Request $request): Response
    {
        $datos = $request->validate([
            'buscar' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $buscar = trim((string) ($datos['buscar'] ?? ''));
        $pagina = (int) ($datos['page'] ?? 1);

        return Inertia::render('Departamentos/Index', [
            'departamentos' => $this->obtenerDepartamentos(
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
        return Inertia::render('Departamentos/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            'Departamento' => [
                'required',
                'string',
                'max:50',
                Rule::unique('departamentos', 'Departamento'),
            ],
        ]);

        Departamento::create([
            'Departamento' => trim($datos['Departamento']),
        ]);

        return to_route('departamentos.index')
            ->with('success', 'Departamento registrado correctamente.');
    }

    public function edit(Departamento $departamento): Response
    {
        return Inertia::render('Departamentos/Edit', [
            'departamento' => $departamento,
        ]);
    }

    public function update(
        Request $request,
        Departamento $departamento
    ): RedirectResponse {
        $datos = $request->validate([
            'Departamento' => [
                'required',
                'string',
                'max:50',
                Rule::unique('departamentos', 'Departamento')
                    ->ignore($departamento->idDepa, 'idDepa'),
            ],
        ]);

        $departamento->update([
            'Departamento' => trim($datos['Departamento']),
        ]);

        return to_route('departamentos.index')
            ->with('success', 'Departamento actualizado correctamente.');
    }

    public function destroy(
        Departamento $departamento
    ): RedirectResponse {
        if ($departamento->provincias()->exists()) {
            return back()->with(
                'error',
                'No se puede eliminar el departamento porque tiene provincias relacionadas.'
            );
        }

        $departamento->delete();

        return back()->with(
            'success',
            'Departamento eliminado correctamente.'
        );
    }

    private function obtenerDepartamentos(
        string $buscar = '',
        int $pagina = 1
    ) {
        return Departamento::query()
            ->withCount('provincias')
            ->when(
                $buscar !== '',
                fn ($query) => $query->where(
                    'Departamento',
                    'like',
                    "%{$buscar}%"
                )
            )
            ->orderBy('Departamento')
            ->paginate(
                perPage: 15,
                columns: ['*'],
                pageName: 'page',
                page: $pagina
            );
    }
}