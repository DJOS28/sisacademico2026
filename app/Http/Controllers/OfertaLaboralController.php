<?php

namespace App\Http\Controllers;

use App\Models\OfertaLaboral;
use App\Models\Empresa;
use App\Models\TipoContrato;
use App\Models\PlanEstudio;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class OfertaLaboralController extends Controller
{
    /**
     * Muestra el listado de ofertas laborales con filtros AJAX.
     */
    public function index(Request $request)
    {
        $buscar          = $request->input('buscar');
        $id_empresa      = $request->input('id_empresa');
        $id_tipo_contrato = $request->input('id_tipo_contrato');
        $modalidad       = $request->input('modalidad');
        $estado          = $request->input('estado');

        $query = OfertaLaboral::with([
                'empresa:id_empresa,nombre_empresa,logo_empresa',
                'tipoContrato:id_tipo_contrato,nombre_tipo_contrato',
                'planEstudio'
            ])
            ->when($buscar, function ($q, $buscar) {
                $q->where(function ($sub) use ($buscar) {
                    $sub->where('titulo', 'like', "%{$buscar}%")
                        ->orWhere('lugar', 'like', "%{$buscar}%");
                });
            })
            ->when($id_empresa, function ($q, $id_empresa) {
                $q->where('id_empresa', $id_empresa);
            })
            ->when($id_tipo_contrato, function ($q, $id_tipo_contrato) {
                $q->where('id_tipo_contrato', $id_tipo_contrato);
            })
            ->when($modalidad, function ($q, $modalidad) {
                $q->where('modalidad', $modalidad);
            })
            ->when($estado, function ($q, $estado) {
                $q->where('estado', $estado);
            })
            ->orderBy('id_oferta', 'desc');

        $ofertas = $query->paginate(10)->withQueryString();

        if ($request->boolean('ajax_search')) {
            return response()->json($ofertas);
        }

        $empresas = Empresa::where('estado', 'Activo')->select('id_empresa', 'nombre_empresa')->get();
        $tiposContrato = TipoContrato::where('estado', 'Activo')->select('id_tipo_contrato', 'nombre_tipo_contrato')->get();

        return Inertia::render('OfertasLaborales/Index', [
            'ofertas'       => $ofertas,
            'empresas'      => $empresas,
            'tiposContrato' => $tiposContrato,
            'filters'       => [
                'buscar'           => $buscar,
                'id_empresa'       => $id_empresa,
                'id_tipo_contrato' => $id_tipo_contrato,
                'modalidad'        => $modalidad,
                'estado'           => $estado,
            ],
        ]);
    }

    /**
     * Muestra la vista de creación.
     */
    public function create(): Response
    {
        $empresas = Empresa::where('estado', 'Activo')->select('id_empresa', 'nombre_empresa')->get();
        $tiposContrato = TipoContrato::where('estado', 'Activo')->select('id_tipo_contrato', 'nombre_tipo_contrato')->get();
        $planesEstudio = PlanEstudio::select('id', 'nombre')->get();

        return Inertia::render('OfertasLaborales/Create', [
            'empresas'      => $empresas,
            'tiposContrato' => $tiposContrato,
            'planesEstudio' => $planesEstudio,
        ]);
    }

    /**
     * Almacena una nueva oferta laboral.
     */
    public function store(Request $request)
    {
        $request->validate([
            'id_empresa'        => 'required|exists:empresas,id_empresa',
            'id_tipo_contrato'  => 'required|exists:tipos_contrato,id_tipo_contrato',
            'id_plan_estudio'   => 'nullable|exists:planes_estudio,id', // CORREGIDO
            'titulo'            => 'required|string|max:255',
            'descripcion'       => 'required|string',
            'fecha_publicacion' => 'required|date',
            'fecha_limite'      => 'nullable|date|after_or_equal:fecha_publicacion',
            'lugar'             => 'nullable|string|max:255',
            'modalidad'         => 'required|string',
            'tipo_oferta'       => 'nullable|string|max:100',
            'remuneracion'      => 'nullable|numeric|min:0',
            'vacantes'          => 'required|integer|min:1',
            'experiencia'       => 'nullable|string|max:255',
            'pasos_postular'    => 'nullable|string',
            'estado'            => 'required|string',
            'archivo_pdf'       => 'nullable|file|mimes:pdf|max:5120',
        ]);

        $archivoPath = null;
        if ($request->hasFile('archivo_pdf')) {
            $archivoPath = $request->file('archivo_pdf')->store('ofertas_pdf', 'public');
        }

        OfertaLaboral::create([
            'id_empresa'        => $request->id_empresa,
            'id_tipo_contrato'  => $request->id_tipo_contrato,
            'id_plan_estudio'   => $request->id_plan_estudio ?: null,
            'titulo'            => trim($request->titulo),
            'descripcion'       => $request->descripcion,
            'fecha_publicacion' => $request->fecha_publicacion,
            'fecha_limite'      => $request->fecha_limite,
            'lugar'             => $request->lugar,
            'modalidad'         => $request->modalidad,
            'tipo_oferta'       => $request->tipo_oferta,
            'remuneracion'      => $request->remuneracion,
            'vacantes'          => $request->vacantes,
            'experiencia'       => $request->experiencia,
            'pasos_postular'    => $request->pasos_postular,
            'estado'            => $request->estado,
            'archivo_pdf'       => $archivoPath,
        ]);

        return redirect()->route('ofertas-laborales.index')->with('success', 'Oferta laboral registrada correctamente.');
    }

    /**
     * Muestra la vista de edición.
     */
    public function edit($id): Response
    {
        $oferta = OfertaLaboral::findOrFail($id);
        $empresas = Empresa::where('estado', 'Activo')->select('id_empresa', 'nombre_empresa')->get();
        $tiposContrato = TipoContrato::where('estado', 'Activo')->select('id_tipo_contrato', 'nombre_tipo_contrato')->get();
        $planesEstudio = PlanEstudio::select('id', 'nombre')->get();

        return Inertia::render('OfertasLaborales/Edit', [
            'oferta'        => $oferta,
            'empresas'      => $empresas,
            'tiposContrato' => $tiposContrato,
            'planesEstudio' => $planesEstudio,
        ]);
    }

    /**
     * Actualiza la oferta laboral.
     */
    public function update(Request $request, $id)
    {
        $oferta = OfertaLaboral::findOrFail($id);

        $request->validate([
            'id_empresa'        => 'required|exists:empresas,id_empresa',
            'id_tipo_contrato'  => 'required|exists:tipos_contrato,id_tipo_contrato',
            'id_plan_estudio'   => 'nullable|exists:planes_estudio,id', // CORREGIDO
            'titulo'            => 'required|string|max:255',
            'descripcion'       => 'required|string',
            'fecha_publicacion' => 'required|date',
            'fecha_limite'      => 'nullable|date',
            'lugar'             => 'nullable|string|max:255',
            'modalidad'         => 'required|string',
            'tipo_oferta'       => 'nullable|string|max:100',
            'remuneracion'      => 'nullable|numeric|min:0',
            'vacantes'          => 'required|integer|min:1',
            'experiencia'       => 'nullable|string|max:255',
            'pasos_postular'    => 'nullable|string',
            'estado'            => 'required|string',
            'archivo_pdf'       => 'nullable|file|mimes:pdf|max:5120',
        ]);

        if ($request->hasFile('archivo_pdf')) {
            if ($oferta->archivo_pdf && Storage::disk('public')->exists($oferta->archivo_pdf)) {
                Storage::disk('public')->delete($oferta->archivo_pdf);
            }
            $oferta->archivo_pdf = $request->file('archivo_pdf')->store('ofertas_pdf', 'public');
        }

        $oferta->update([
            'id_empresa'        => $request->id_empresa,
            'id_tipo_contrato'  => $request->id_tipo_contrato,
            'id_plan_estudio'   => $request->id_plan_estudio ?: null,
            'titulo'            => trim($request->titulo),
            'descripcion'       => $request->descripcion,
            'fecha_publicacion' => $request->fecha_publicacion,
            'fecha_limite'      => $request->fecha_limite,
            'lugar'             => $request->lugar,
            'modalidad'         => $request->modalidad,
            'tipo_oferta'       => $request->tipo_oferta,
            'remuneracion'      => $request->remuneracion,
            'vacantes'          => $request->vacantes,
            'experiencia'       => $request->experiencia,
            'pasos_postular'    => $request->pasos_postular,
            'estado'            => $request->estado,
        ]);

        return redirect()->route('ofertas-laborales.index')->with('success', 'Oferta laboral actualizada.');
    }

    /**
     * Elimina una oferta laboral.
     */
    public function destroy($id)
    {
        $oferta = OfertaLaboral::findOrFail($id);

        if ($oferta->archivo_pdf && Storage::disk('public')->exists($oferta->archivo_pdf)) {
            Storage::disk('public')->delete($oferta->archivo_pdf);
        }

        $oferta->delete();

        return redirect()->back()->with('success', 'Oferta laboral eliminada correctamente.');
    }
}