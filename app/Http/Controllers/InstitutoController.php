<?php

namespace App\Http\Controllers;

use App\Models\Departamento;
use App\Models\Distrito;
use App\Models\Instituto;
use App\Models\Provincia;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InstitutoController extends Controller
{
    public function index(): Response
    {
        $institutos = Instituto::query()
            ->with('distrito.provincia.departamento')
            ->orderBy('nombre')
            ->paginate(10);

        return Inertia::render('Instituto/Index', [
            'institutos' => $institutos,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Instituto/Create', [
            'departamentos' => $this->departamentos(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        $logo = null;

        if ($request->hasFile('logo')) {
            $logo = $request->file('logo')
                ->store('instituto', 'public');
        }

        Instituto::create([
            'nombre' => trim($datos['nombre']),
            'direccion' => $this->nullable($datos['direccion'] ?? null),
            'telefono' => $this->nullable($datos['telefono'] ?? null),
            'logo' => $logo,
            'codigo_modular' => $this->nullable(
                $datos['codigo_modular'] ?? null
            ),
            'dre' => $this->nullable($datos['dre'] ?? null),
            'idDist' => (int) $datos['idDist'],
        ]);

        return to_route('instituto.index')
            ->with('success', 'Instituto registrado correctamente.');
    }

    public function edit(Instituto $instituto): Response
    {
        $instituto->load('distrito.provincia');

        return Inertia::render('Instituto/Edit', [
            'instituto' => [
                ...$instituto->toArray(),
                'logo_url' => $instituto->logo
                    ? Storage::disk('public')->url($instituto->logo)
                    : null,
            ],
            'departamentos' => $this->departamentos(),
            'provincias' => Provincia::query()
                ->where(
                    'idDepa',
                    $instituto->distrito?->provincia?->idDepa
                )
                ->orderBy('Provincia')
                ->get(['idProv', 'Provincia']),
            'distritos' => Distrito::query()
                ->where(
                    'idProv',
                    $instituto->distrito?->idProv
                )
                ->orderBy('Distrito')
                ->get(['idDist', 'Distrito']),
            'idDepa' =>
                $instituto->distrito?->provincia?->idDepa,
            'idProv' =>
                $instituto->distrito?->idProv,
        ]);
    }

    public function update(Request $request,Instituto $instituto): RedirectResponse 
    {
        $datos = $this->validar($request, $instituto);

        $logo = $instituto->logo;

        if ($request->boolean('remove_logo') && $logo) {
            Storage::disk('public')->delete($logo);
            $logo = null;
        }

        if ($request->hasFile('logo')) {
            if ($logo) {
                Storage::disk('public')->delete($logo);
            }

            $logo = $request->file('logo')
                ->store('instituto', 'public');
        }

        $instituto->update([
            'nombre' => trim($datos['nombre']),
            'direccion' => $this->nullable($datos['direccion'] ?? null),
            'telefono' => $this->nullable($datos['telefono'] ?? null),
            'logo' => $logo,
            'codigo_modular' => $this->nullable(
                $datos['codigo_modular'] ?? null
            ),
            'dre' => $this->nullable($datos['dre'] ?? null),
            'idDist' => (int) $datos['idDist'],
        ]);

        return to_route('instituto.index')
            ->with('success', 'Instituto actualizado correctamente.');
    }

    public function destroy(Instituto $instituto): RedirectResponse
    {
        if ($instituto->logo) {
            Storage::disk('public')->delete($instituto->logo);
        }

        $instituto->delete();

        return back()->with(
            'success',
            'Instituto eliminado correctamente.'
        );
    }

    private function validar(Request $request,?Instituto $instituto = null): array 
    {
        return $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:100',
                Rule::unique('instituto', 'nombre')
                    ->ignore($instituto?->id),
            ],
            'direccion' => [
                'nullable',
                'string',
                'max:255',
            ],
            'telefono' => [
                'nullable',
                'string',
                'max:20',
            ],
            'codigo_modular' => [
                'nullable',
                'string',
                'max:20',
            ],
            'dre' => [
                'nullable',
                'string',
                'max:20',
            ],
            'idDist' => [
                'required',
                'integer',
                'exists:distritos,idDist',
            ],
            'logo' => [
                'nullable',
                'image',
                'max:2048',
            ],
            'remove_logo' => [
                'nullable',
                'boolean',
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

    private function nullable(mixed $value): ?string
    {
        $value = trim((string) $value);

        return $value !== '' ? $value : null;
    }
}
