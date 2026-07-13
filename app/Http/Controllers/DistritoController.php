<?php

namespace App\Http\Controllers;

use App\Models\Departamento;
use App\Models\Distrito;
use App\Models\Provincia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DistritoController extends Controller
{
    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->input('buscar', ''));
        $idDepa = $request->input('idDepa');
        $idProv = $request->input('idProv');

        $distritos = Distrito::query()
            ->with('provincia.departamento')
            ->when(
                $buscar !== '',
                fn ($query) => $query->where(
                    'Distrito',
                    'like',
                    "%{$buscar}%"
                )
            )
            ->when(
                filled($idProv),
                fn ($query) => $query->where('idProv', $idProv)
            )
            ->when(
                filled($idDepa) && ! filled($idProv),
                fn ($query) => $query->whereHas(
                    'provincia',
                    fn ($subquery) => $subquery->where(
                        'idDepa',
                        $idDepa
                    )
                )
            )
            ->orderBy('Distrito')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Distritos/Index', [
            'distritos' => $distritos,
            'departamentos' => $this->departamentos(),
            'provincias' => filled($idDepa)
                ? Provincia::query()
                    ->where('idDepa', $idDepa)
                    ->orderBy('Provincia')
                    ->get(['idProv', 'Provincia'])
                : [],
            'filtros' => [
                'buscar' => $buscar,
                'idDepa' => $idDepa,
                'idProv' => $idProv,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Distritos/Create', [
            'departamentos' => $this->departamentos(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        Distrito::create([
            'Distrito' => trim($datos['Distrito']),
            'idProv' => (int) $datos['idProv'],
        ]);

        return to_route('distritos.index')
            ->with('success', 'Distrito registrado correctamente.');
    }

    public function edit(Distrito $distrito): Response
    {
        $distrito->load('provincia');

        return Inertia::render('Distritos/Edit', [
            'distrito' => $distrito,
            'departamentos' => $this->departamentos(),
            'provincias' => Provincia::query()
                ->where('idDepa', $distrito->provincia?->idDepa)
                ->orderBy('Provincia')
                ->get(['idProv', 'Provincia']),
            'idDepa' => $distrito->provincia?->idDepa,
        ]);
    }

    public function update(
        Request $request,
        Distrito $distrito
    ): RedirectResponse {
        $datos = $this->validar($request, $distrito);

        $distrito->update([
            'Distrito' => trim($datos['Distrito']),
            'idProv' => (int) $datos['idProv'],
        ]);

        return to_route('distritos.index')
            ->with('success', 'Distrito actualizado correctamente.');
    }

    public function destroy(Distrito $distrito): RedirectResponse
    {
        if ($distrito->institutos()->exists()) {
            return back()->with(
                'error',
                'No se puede eliminar el distrito porque tiene institutos relacionados.'
            );
        }

        $distrito->delete();

        return back()->with(
            'success',
            'Distrito eliminado correctamente.'
        );
    }

    public function porProvincia(
        Provincia $provincia
    ): JsonResponse {
        return response()->json([
            'distritos' => $provincia->distritos()
                ->orderBy('Distrito')
                ->get([
                    'idDist',
                    'Distrito',
                ]),
        ]);
    }

    private function validar(
        Request $request,
        ?Distrito $distrito = null
    ): array {
        return $request->validate([
            'Distrito' => [
                'required',
                'string',
                'max:50',
                Rule::unique('distritos', 'Distrito')
                    ->where(
                        fn ($query) => $query->where(
                            'idProv',
                            $request->input('idProv')
                        )
                    )
                    ->ignore($distrito?->idDist, 'idDist'),
            ],
            'idProv' => [
                'required',
                'integer',
                'exists:provincias,idProv',
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
