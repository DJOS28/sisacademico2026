<?php

namespace App\Http\Controllers;

use App\Models\Departamento;
use App\Models\Provincia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProvinciaController extends Controller
{
    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->input('buscar', ''));
        $idDepa = $request->input('idDepa');

        $provincias = Provincia::query()
            ->with('departamento')
            ->withCount('distritos')
            ->when(
                $buscar !== '',
                fn ($query) => $query->where(
                    'Provincia',
                    'like',
                    "%{$buscar}%"
                )
            )
            ->when(
                filled($idDepa),
                fn ($query) => $query->where('idDepa', $idDepa)
            )
            ->orderBy('Provincia')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Provincias/Index', [
            'provincias' => $provincias,
            'departamentos' => $this->departamentos(),
            'filtros' => [
                'buscar' => $buscar,
                'idDepa' => $idDepa,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Provincias/Create', [
            'departamentos' => $this->departamentos(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        Provincia::create([
            'Provincia' => trim($datos['Provincia']),
            'idDepa' => (int) $datos['idDepa'],
        ]);

        return to_route('provincias.index')
            ->with('success', 'Provincia registrada correctamente.');
    }

    public function edit(Provincia $provincia): Response
    {
        return Inertia::render('Provincias/Edit', [
            'provincia' => $provincia,
            'departamentos' => $this->departamentos(),
        ]);
    }

    public function update(
        Request $request,
        Provincia $provincia
    ): RedirectResponse {
        $datos = $this->validar($request, $provincia);

        $provincia->update([
            'Provincia' => trim($datos['Provincia']),
            'idDepa' => (int) $datos['idDepa'],
        ]);

        return to_route('provincias.index')
            ->with('success', 'Provincia actualizada correctamente.');
    }

    public function destroy(Provincia $provincia): RedirectResponse
    {
        if ($provincia->distritos()->exists()) {
            return back()->with(
                'error',
                'No se puede eliminar la provincia porque tiene distritos relacionados.'
            );
        }

        $provincia->delete();

        return back()->with(
            'success',
            'Provincia eliminada correctamente.'
        );
    }

    public function porDepartamento(
        Departamento $departamento
    ): JsonResponse {
        return response()->json([
            'provincias' => $departamento->provincias()
                ->orderBy('Provincia')
                ->get([
                    'idProv',
                    'Provincia',
                ]),
        ]);
    }

    private function validar(
        Request $request,
        ?Provincia $provincia = null
    ): array {
        return $request->validate([
            'Provincia' => [
                'required',
                'string',
                'max:50',
                Rule::unique('provincias', 'Provincia')
                    ->where(
                        fn ($query) => $query->where(
                            'idDepa',
                            $request->input('idDepa')
                        )
                    )
                    ->ignore($provincia?->idProv, 'idProv'),
            ],
            'idDepa' => [
                'required',
                'integer',
                'exists:departamentos,idDepa',
            ],
        ]);
    }

    private function departamentos()
    {
        return Departamento::query()
            ->orderBy('Departamento')
            ->get([
                'idDepa',
                'Departamento',
            ]);
    }
}
