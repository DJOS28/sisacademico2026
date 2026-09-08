<?php

namespace App\Http\Controllers;

use App\Models\Instituto;
use App\Models\PatrimonioBien;
use App\Models\PatrimonioCategoria;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class PatrimonioReporteController extends Controller
{
    /**
     * Dashboard analítico y centro de reportes de patrimonio.
     */
    public function dashboard(): Response
    {
        $totalBienes = PatrimonioBien::count();
        $valorTotal = PatrimonioBien::where('situacion', '<>', 'De_Baja')->sum('valor_adquisicion');

        $bienesPorSituacion = [
            'Operativo'        => PatrimonioBien::where('situacion', 'Operativo')->count(),
            'En_Mantenimiento' => PatrimonioBien::where('situacion', 'En_Mantenimiento')->count(),
            'Inoperativo'      => PatrimonioBien::where('situacion', 'Inoperativo')->count(),
            'De_Baja'          => PatrimonioBien::where('situacion', 'De_Baja')->count(),
        ];

        $bienesPorConservacion = [
            'Nuevo'    => PatrimonioBien::where('estado_conservacion', 'Nuevo')->count(),
            'Bueno'    => PatrimonioBien::where('estado_conservacion', 'Bueno')->count(),
            'Regular'  => PatrimonioBien::where('estado_conservacion', 'Regular')->count(),
            'Malo'     => PatrimonioBien::where('estado_conservacion', 'Malo')->count(),
            'Chatarra' => PatrimonioBien::where('estado_conservacion', 'Chatarra')->count(),
        ];

        $categoriasStats = PatrimonioCategoria::withCount(['bienes', 'bienes as activos_operativos_count' => fn ($q) => $q->where('situacion', 'Operativo')])
            ->withSum(['bienes' => fn ($q) => $q->where('situacion', '<>', 'De_Baja')], 'valor_adquisicion')
            ->get();

        $ultimosBienes = PatrimonioBien::with(['categoria:id,nombre', 'aula:id,nombre', 'area:id,nombre'])
            ->orderByDesc('id')
            ->take(5)
            ->get();

        return Inertia::render('Patrimonio/Reportes/Dashboard', [
            'metricas' => [
                'total_bienes'       => $totalBienes,
                'valor_total'        => (float) $valorTotal,
                'por_situacion'      => $bienesPorSituacion,
                'por_conservacion'   => $bienesPorConservacion,
            ],
            'categoriasStats' => $categoriasStats,
            'ultimosBienes'   => $ultimosBienes,
            'categorias'      => PatrimonioCategoria::select('id', 'nombre')->orderBy('nombre')->get(),
        ]);
    }

    /**
     * Genera la hoja de etiquetas / stickers adhesivos con Código QR.
     */
    public function imprimirEtiquetas(Request $request): HttpResponse
    {
        $categoriaId = $request->input('categoria_id');
        $situacion   = $request->input('situacion');

        $bienes = PatrimonioBien::query()
            ->with(['categoria:id,nombre'])
            ->where('situacion', '<>', 'De_Baja')
            ->when(! blank($categoriaId), fn ($q) => $q->where('categoria_id', $categoriaId))
            ->when(! blank($situacion), fn ($q) => $q->where('situacion', $situacion))
            ->orderBy('codigo_patrimonial')
            ->get();

        $instituto = Instituto::first();

        $pdf = Pdf::loadView('pdf.etiquetas_patrimonio', [
            'bienes'    => $bienes,
            'instituto' => $instituto,
        ])->setPaper('a4', 'portrait');

        return $pdf->stream('Etiquetas_Patrimoniales.pdf');
    }

    /**
     * Emite el reporte consolidado de inventario en PDF.
     */
    public function reporteInventarioPdf(Request $request): HttpResponse
    {
        $categoriaId = $request->input('categoria_id');

        $bienes = PatrimonioBien::query()
            ->with(['categoria:id,nombre', 'aula:id,nombre', 'area:id,nombre', 'responsable:id,nombre,apellido'])
            ->when(! blank($categoriaId), fn ($q) => $q->where('categoria_id', $categoriaId))
            ->orderBy('categoria_id')
            ->orderBy('codigo_patrimonial')
            ->get();

        $instituto = Instituto::first();

        $pdf = Pdf::loadView('pdf.inventario_general_patrimonio', [
            'bienes'      => $bienes,
            'instituto'   => $instituto,
            'categoriaId' => $categoriaId,
            'totalValor'  => $bienes->where('situacion', '<>', 'De_Baja')->sum('valor_adquisicion'),
        ])->setPaper('a4', 'landscape');

        return $pdf->stream('Inventario_General_Patrimonio.pdf');
    }
}