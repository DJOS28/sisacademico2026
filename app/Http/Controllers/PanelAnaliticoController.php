<?php

namespace App\Http\Controllers;

use App\Models\OfertaLaboral;
use App\Models\Postulacion;
use App\Models\Empresa;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class PanelAnaliticoController extends Controller
{
    public function index()
    {
        $hoy = Carbon::now()->toDateString();

        // 1. Tarjetas de Resumen (KPIs)
        $totalOfertasActivas = OfertaLaboral::where('estado', 'Publicada')
            ->where('fecha_limite', '>=', $hoy)
            ->count();

        $totalOfertasVencidas = OfertaLaboral::where('fecha_limite', '<', $hoy)->count();
        $totalPostulaciones = Postulacion::count();
        $totalEmpresasActivas = Empresa::has('ofertas')->count();

        // 2. Gráfico 1: Modalidades de trabajo en ofertas
        $modalidades = OfertaLaboral::select('modalidad', DB::raw('count(*) as total'))
            ->groupBy('modalidad')
            ->pluck('total', 'modalidad');

        // 3. Gráfico 2: Estado de las postulaciones realizadas
        $estadosPostulacion = Postulacion::select('estado', DB::raw('count(*) as total'))
            ->groupBy('estado')
            ->pluck('total', 'estado');

        // 4. Últimas postulaciones registradas
        $ultimasPostulaciones = Postulacion::with(['postulante', 'oferta.empresa'])
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('PanelAnalitico/Index', [
            'kpis' => [
                'ofertas_activas'  => $totalOfertasActivas,
                'ofertas_vencidas' => $totalOfertasVencidas,
                'postulaciones'    => $totalPostulaciones,
                'empresas'         => $totalEmpresasActivas,
            ],
            'graficos' => [
                'modalidades'        => $modalidades,
                'estadosPostulacion' => $estadosPostulacion,
            ],
            'ultimasPostulaciones' => $ultimasPostulaciones,
        ]);
    }
}