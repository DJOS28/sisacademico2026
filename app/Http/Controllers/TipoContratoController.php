<?php

namespace App\Http\Controllers;

use App\Models\TipoContrato;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TipoContratoController extends Controller
{
    /**
     * Muestra el listado de tipos de contrato.
     */
    public function index(Request $request)
    {
        $buscar = $request->input('buscar');

        $tiposContrato = TipoContrato::when($buscar, function ($query, $buscar) {
                $query->where('nombre_tipo_contrato', 'like', "%{$buscar}%");
            })
            ->orderBy('id_tipo_contrato', 'desc')
            ->paginate(10)
            ->withQueryString();

        // 👈 Solo responder JSON si es una búsqueda explícita de Axios
        if ($request->boolean('ajax_search')) {
            return response()->json($tiposContrato);
        }

        return Inertia::render('TiposContrato/Index', [
            'tiposContrato' => $tiposContrato,
            'filters'       => ['buscar' => $buscar],
        ]);
    }

    /**
     * Almacena un nuevo tipo de contrato.
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre_tipo_contrato' => 'required|string|max:50|unique:tipos_contrato,nombre_tipo_contrato',
            'estado'               => 'required|in:Activo,Inactivo',
        ]);

        TipoContrato::create([
            'nombre_tipo_contrato' => trim($request->nombre_tipo_contrato),
            'estado'               => $request->estado,
        ]);

        return redirect()->back()->with('success', 'Tipo de contrato creado correctamente.');
    }

    /**
     * Actualiza un tipo de contrato existente.
     */
    public function update(Request $request, $id)
    {
        $tipoContrato = TipoContrato::findOrFail($id);

        $request->validate([
            'nombre_tipo_contrato' => 'required|string|max:50|unique:tipos_contrato,nombre_tipo_contrato,' . $id . ',id_tipo_contrato',
            'estado'               => 'required|in:Activo,Inactivo',
        ]);

        $tipoContrato->update([
            'nombre_tipo_contrato' => trim($request->nombre_tipo_contrato),
            'estado'               => $request->estado,
        ]);

        return redirect()->back()->with('success', 'Tipo de contrato actualizado.');
    }

    /**
     * Elimina un tipo de contrato.
     */
    public function destroy($id)
    {
        $tipoContrato = TipoContrato::findOrFail($id);

        // Verificar si existen ofertas laborales asociadas
        if ($tipoContrato->ofertas()->exists()) {
            return redirect()->back()->withErrors([
                'error' => 'No se puede eliminar el tipo de contrato porque está asociado a ofertas laborales.',
            ]);
        }

        $tipoContrato->delete();

        return redirect()->back()->with('success', 'Tipo de contrato eliminado correctamente.');
    }
}