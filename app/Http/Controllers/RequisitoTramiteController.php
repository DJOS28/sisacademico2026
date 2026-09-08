<?php

namespace App\Http\Controllers;

use App\Models\RequisitoTramite;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class RequisitoTramiteController extends Controller
{
    /**
     * Listado con búsqueda/filtro automático.
     * - Petición normal (visita de página) -> Inertia::render
     * - Petición AJAX (buscar mientras escribe) -> JSON
     */
    public function index(Request $request)
    {
        $buscar = $request->input('buscar');
        $estado = $request->input('estado');

        $requisitos = RequisitoTramite::query()
            ->when($buscar, fn ($q) => $q->where('descripcion', 'like', "%{$buscar}%"))
            ->when($estado, fn ($q) => $q->where('estado', $estado))
            ->orderBy('descripcion')
            ->paginate(10)
            ->withQueryString();

        // Las visitas normales de Inertia (clic en un Link, navegación del menú)
        // también son peticiones AJAX por debajo, pero llevan la cabecera
        // X-Inertia. Solo tratamos como "búsqueda por axios" cuando esa
        // cabecera NO está presente, para no romper el protocolo de Inertia.
        $esPeticionInertia = $request->header('X-Inertia');

        if (!$esPeticionInertia && ($request->wantsJson() || $request->ajax())) {
            return response()->json($requisitos);
        }

        return Inertia::render('RequisitosTramite/Index', [
            'requisitos' => $requisitos,
            'filtros'    => [
                'buscar' => $buscar,
                'estado' => $estado,
            ],
        ]);
    }

    /**
     * Guardar (AJAX). El front hace fetch/axios y muestra SweetAlert
     * según la respuesta JSON, sin recargar ni redirigir.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'descripcion' => ['required', 'string', 'max:255', 'unique:requisitos_tramite,descripcion'],
            'estado'      => ['nullable', Rule::in(['Activo', 'Inactivo'])],
        ], [
            'descripcion.unique' => 'Ya existe un requisito con esa descripción.',
        ]);

        $requisito = RequisitoTramite::create([
            'descripcion' => $data['descripcion'],
            'estado'      => $data['estado'] ?? 'Activo',
        ]);

        return response()->json([
            'message'   => 'Requisito registrado correctamente.',
            'requisito' => $requisito,
        ], 201);
    }

    /**
     * Actualizar (AJAX).
     */
    public function update(Request $request, RequisitoTramite $requisitosTramite)
    {
        $data = $request->validate([
            'descripcion' => [
                'required', 'string', 'max:255',
                Rule::unique('requisitos_tramite', 'descripcion')->ignore($requisitosTramite->id),
            ],
            'estado' => ['nullable', Rule::in(['Activo', 'Inactivo'])],
        ], [
            'descripcion.unique' => 'Ya existe un requisito con esa descripción.',
        ]);

        $requisitosTramite->update($data);

        return response()->json([
            'message'   => 'Requisito actualizado correctamente.',
            'requisito' => $requisitosTramite->fresh(),
        ]);
    }

    /**
     * Activar / desactivar (AJAX) — igual que el toggle de semestres pero en JSON.
     */
    public function cambiarEstado(Request $request, RequisitoTramite $requisitosTramite)
    {
        $data = $request->validate([
            'estado' => ['required', Rule::in(['Activo', 'Inactivo'])],
        ]);

        $requisitosTramite->update(['estado' => $data['estado']]);

        return response()->json([
            'message'   => $data['estado'] === 'Activo'
                ? 'Requisito activado.'
                : 'Requisito desactivado.',
            'requisito' => $requisitosTramite->fresh(),
        ]);
    }

    /**
     * Eliminar (AJAX). Bloquea el borrado si el requisito ya está
     * asociado a algún trámite (tabla pivote tramite_requisitos).
     */
    public function destroy(RequisitoTramite $requisitosTramite)
    {
        $enUso = DB::table('tramite_requisitos')
            ->where('requisito_id', $requisitosTramite->id)
            ->exists();

        if ($enUso) {
            return response()->json([
                'message' => 'No se puede eliminar: este requisito está asignado a uno o más trámites.',
            ], 409);
        }

        $requisitosTramite->delete();

        return response()->json([
            'message' => 'Requisito eliminado correctamente.',
        ]);
    }
}