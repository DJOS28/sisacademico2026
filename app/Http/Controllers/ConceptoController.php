<?php

namespace App\Http\Controllers;

use App\Models\Concepto;
use App\Imports\ConceptoImport;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

class ConceptoController extends Controller
{
    /**
     * Listado de conceptos
     */
    public function index(): Response
    {
        return Inertia::render('Conceptos/Index', [
            'conceptos' => Concepto::latest('id_concepto')->get(),
        ]);
    }

    /**
     * Registrar un nuevo concepto
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre'        => 'required|string|max:100',
            'precio'        => 'required|numeric|min:0',
            'tipo_concepto' => 'nullable|string|max:20',
            'activo'        => 'boolean',
        ]);

        Concepto::create([
            'nombre'        => $request->nombre,
            'precio'        => $request->precio,
            'tipo_concepto' => $request->tipo_concepto ?? 'General',
            'activo'        => $request->activo ?? 1,
        ]);

        return back()->with('success', 'Concepto registrado exitosamente.');
    }

    /**
     * Actualizar concepto
     */
    public function update(Request $request, $id)
    {
        $concepto = Concepto::findOrFail($id);

        $request->validate([
            'nombre'        => 'required|string|max:100',
            'precio'        => 'required|numeric|min:0',
            'tipo_concepto' => 'nullable|string|max:20',
            'activo'        => 'boolean',
        ]);

        $concepto->update($request->only(['nombre', 'precio', 'tipo_concepto', 'activo']));

        return back()->with('success', 'Concepto actualizado correctamente.');
    }

    /**
     * Eliminar o desactivar concepto
     */
    public function destroy($id)
    {
        $concepto = Concepto::findOrFail($id);
        $concepto->delete();

        return back()->with('success', 'Concepto eliminado correctamente.');
    }

    /**
     * Importación Masiva desde Excel
     */
    public function importarExcel(Request $request)
    {
        $request->validate([
            'archivo' => 'required|file|mimes:xlsx,xls,csv|max:10240',
        ]);

        try {
            Excel::import(new ConceptoImport, $request->file('archivo'));
            return back()->with('success', 'Conceptos importados exitosamente desde el archivo Excel.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Error al importar los conceptos: ' . $e->getMessage()]);
        }
    }
}