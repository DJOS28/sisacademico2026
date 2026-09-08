<?php

namespace App\Http\Controllers;

use App\Models\Tramite;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TramiteController extends Controller
{
    /**
     * Listado con búsqueda/filtro automático.
     * - Visita normal / navegación de Inertia -> Inertia::render
     * - Búsqueda por axios (sin cabecera X-Inertia) -> JSON
     */
    public function index(Request $request)
    {
        $buscar = $request->input('buscar');
        $estado = $request->input('estado');

        $tramites = Tramite::query()
            ->withCount('requisitos')
            ->when($buscar, fn ($q) => $q->where(function ($sub) use ($buscar) {
                $sub->where('nombre', 'like', "%{$buscar}%")
                    ->orWhere('descripcion', 'like', "%{$buscar}%");
            }))
            ->when($estado, fn ($q) => $q->where('estado', $estado))
            ->orderBy('nombre')
            ->paginate(10)
            ->withQueryString();

        $esPeticionInertia = $request->header('X-Inertia');

        if (!$esPeticionInertia && ($request->wantsJson() || $request->ajax())) {
            return response()->json($tramites);
        }

        return Inertia::render('Tramites/Index', [
            'tramites' => $tramites,
            'filtros'  => [
                'buscar' => $buscar,
                'estado' => $estado,
            ],
        ]);
    }

    /**
     * Formulario de creación.
     */
    public function create()
    {
        return Inertia::render('Tramites/Create', [
            'requisitosDisponibles' => DB::table('requisitos_tramite')
                ->where('estado', 'Activo')
                ->orderBy('descripcion')
                ->get(['id', 'descripcion']),
        ]);
    }

    /**
     * Detalle de un trámite (vista de solo lectura).
     */
    public function show(Tramite $tramite)
    {
        return Inertia::render('Tramites/Show', [
            'tramite' => $tramite->load('requisitos:id,descripcion'),
        ]);
    }

    /**
     * Formulario de edición, precargado con los requisitos ya marcados.
     */
    public function edit(Tramite $tramite)
    {
        return Inertia::render('Tramites/Edit', [
            'tramite' => $tramite->load('requisitos:id,descripcion'),
            'requisitosDisponibles' => DB::table('requisitos_tramite')
                ->where('estado', 'Activo')
                ->orderBy('descripcion')
                ->get(['id', 'descripcion']),
        ]);
    }

    /**
     * Guardar (AJAX).
     */
    public function store(Request $request)
    {
        $data = $this->validarDatos($request);

        $tramite = DB::transaction(function () use ($data) {
            $tramite = Tramite::create([
                'nombre'      => $data['nombre'],
                'descripcion' => $data['descripcion'] ?? null,
                'estado'      => $data['estado'] ?? 'Activo',
                'costo'       => $data['costo'] ?? null,
                'tiempo'      => $data['tiempo'] ?? null,
            ]);

            $tramite->requisitos()->sync($data['requisitos'] ?? []);

            return $tramite;
        });

        return response()->json([
            'message' => 'Trámite registrado correctamente.',
            'tramite' => $tramite->load('requisitos:id,descripcion'),
        ], 201);
    }

    /**
     * Actualizar (AJAX).
     */
    public function update(Request $request, Tramite $tramite)
    {
        $data = $this->validarDatos($request);

        DB::transaction(function () use ($data, $tramite) {
            $tramite->update([
                'nombre'      => $data['nombre'],
                'descripcion' => $data['descripcion'] ?? null,
                'estado'      => $data['estado'] ?? $tramite->estado,
                'costo'       => $data['costo'] ?? null,
                'tiempo'      => $data['tiempo'] ?? null,
            ]);

            $tramite->requisitos()->sync($data['requisitos'] ?? []);
        });

        return response()->json([
            'message' => 'Trámite actualizado correctamente.',
            'tramite' => $tramite->fresh()->load('requisitos:id,descripcion'),
        ]);
    }

    /**
     * Activar / desactivar (AJAX).
     */
    public function cambiarEstado(Request $request, Tramite $tramite)
    {
        $data = $request->validate([
            'estado' => ['required', Rule::in(['Activo', 'Inactivo'])],
        ]);

        $tramite->update(['estado' => $data['estado']]);

        return response()->json([
            'message' => $data['estado'] === 'Activo' ? 'Trámite activado.' : 'Trámite desactivado.',
            'tramite' => $tramite->fresh(),
        ]);
    }

    /**
     * Eliminar (AJAX). Bloquea el borrado si el trámite ya tiene
     * solicitudes registradas (integridad con solicitudes_tramites).
     */
    public function destroy(Tramite $tramite)
    {
        $tieneSolicitudes = DB::table('solicitudes_tramites')
            ->where('tramite_id', $tramite->id)
            ->exists();

        if ($tieneSolicitudes) {
            return response()->json([
                'message' => 'No se puede eliminar: este trámite ya tiene solicitudes registradas. Puedes desactivarlo en su lugar.',
            ], 409);
        }

        DB::transaction(function () use ($tramite) {
            $tramite->requisitos()->detach();
            $tramite->delete();
        });

        return response()->json([
            'message' => 'Trámite eliminado correctamente.',
        ]);
    }

    /**
     * Reglas de validación compartidas por store/update.
     */
    private function validarDatos(Request $request): array
    {
        return $request->validate([
            'nombre'         => ['required', 'string', 'max:100'],
            'descripcion'    => ['nullable', 'string', 'max:200'],
            'estado'         => ['nullable', Rule::in(['Activo', 'Inactivo'])],
            'costo'          => ['nullable', 'numeric', 'min:0'],
            'tiempo'         => ['nullable', 'string', 'max:50'],
            'requisitos'     => ['nullable', 'array'],
            'requisitos.*'   => ['integer', 'exists:requisitos_tramite,id'],
        ]);
    }
}