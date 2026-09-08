<?php

namespace App\Http\Controllers;

use App\Models\Caja;
use App\Models\PagoPostulante;
use App\Models\TransaccionCaja;
use App\Models\Instituto;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Barryvdh\DomPDF\Facade\Pdf;

class ReporteCajaController extends Controller
{
    /**
     * Dashboard general de reportes e historial de cajas.
     */
    public function index(Request $request): Response
    {
        $fechaInicio = $request->input('fecha_inicio', now()->startOfMonth()->format('Y-m-d'));
        $fechaFin    = $request->input('fecha_fin', now()->format('Y-m-d'));

        // Historial de cierres de caja en el rango de fechas (sin eager loading de cajero)
        $cajasHistorial = Caja::whereBetween('fecha_apertura', ["{$fechaInicio} 00:00:00", "{$fechaFin} 23:59:59"])
            ->latest('id_caja')
            ->paginate(15)
            ->withQueryString();

        // Métricas consolidadas del periodo
        $totales = [
            'total_recaudado' => PagoPostulante::where('estado', PagoPostulante::ESTADO_ACEPTADO)
                ->whereBetween('fecha', [$fechaInicio, $fechaFin])
                ->sum('monto'),
            'total_egresos' => TransaccionCaja::where('tipo', 'egreso')
                ->where('estado', 'aceptado')
                ->whereBetween('fecha', [$fechaInicio, $fechaFin])
                ->sum('monto'),
            'cajas_cerradas' => Caja::whereNotNull('fecha_cierre')
                ->whereBetween('fecha_apertura', ["{$fechaInicio} 00:00:00", "{$fechaFin} 23:59:59"])
                ->count(),
        ];

        return Inertia::render('Reportes/CajaIndex', [
            'cajasHistorial' => $cajasHistorial,
            'totales'        => $totales,
            'filters'        => [
                'fecha_inicio' => $fechaInicio,
                'fecha_fin'    => $fechaFin,
            ],
        ]);
    }

    /**
     * Vista de detalle / Arqueo y Cuadre de una caja específica.
     */
    public function detalleCaja($id): Response
    {
        $caja = Caja::findOrFail($id);

        // Cobros de postulantes vinculados a esta caja
        $pagosPostulantes = PagoPostulante::with(['postulante', 'concepto'])
            ->where('caja_id', $caja->id_caja)
            ->where('estado', PagoPostulante::ESTADO_ACEPTADO)
            ->get();

        // Transacciones directas (Ingresos/Egresos operativos de caja)
        $transacciones = TransaccionCaja::with('concepto')
            ->where('caja_id', $caja->id_caja)
            ->where('estado', 'aceptado')
            ->get();

        // Resumen financiero usando los nombres exactos de columnas: 'apertura' y 'saldo_final'
        $totalIngresosPagos = $pagosPostulantes->sum('monto');
        $totalOtrosIngresos = $transacciones->where('tipo', 'ingreso')->sum('monto');
        $totalEgresos       = $transacciones->where('tipo', 'egreso')->sum('monto');

        $saldoTeorico = $caja->apertura + $totalIngresosPagos + $totalOtrosIngresos - $totalEgresos;
        $diferencia   = ($caja->saldo_final ?? $saldoTeorico) - $saldoTeorico;

        return Inertia::render('Reportes/CajaDetalle', [
            'caja' => $caja,
            'pagosPostulantes'  => $pagosPostulantes,
            'transacciones'     => $transacciones,
            'resumenFinanciero' => [
                'apertura'             => (float) $caja->apertura,
                'total_ingresos_pagos' => (float) $totalIngresosPagos,
                'total_otros_ingresos' => (float) $totalOtrosIngresos,
                'total_egresos'        => (float) $totalEgresos,
                'saldo_teorico'        => (float) $saldoTeorico,
                'saldo_final'          => (float) ($caja->saldo_final ?? 0),
                'diferencia'           => (float) $diferencia,
            ],
        ]);
    }

    /**
     * Exportar PDF de Cuadre y Movimientos de Caja.
     */
    public function pdfCuadreCaja($id)
    {
        $caja = Caja::findOrFail($id);
        $instituto = Instituto::first();

        $pagosPostulantes = PagoPostulante::with(['postulante', 'concepto'])
            ->where('caja_id', $caja->id_caja)
            ->where('estado', PagoPostulante::ESTADO_ACEPTADO)
            ->get();

        $transacciones = TransaccionCaja::with('concepto')
            ->where('caja_id', $caja->id_caja)
            ->where('estado', 'aceptado')
            ->get();

        $totalIngresosPagos = $pagosPostulantes->sum('monto');
        $totalOtrosIngresos = $transacciones->where('tipo', 'ingreso')->sum('monto');
        $totalEgresos       = $transacciones->where('tipo', 'egreso')->sum('monto');

        $saldoTeorico = $caja->apertura + $totalIngresosPagos + $totalOtrosIngresos - $totalEgresos;
        $diferencia   = ($caja->saldo_final ?? $saldoTeorico) - $saldoTeorico;

        $pdf = Pdf::loadView('pdf.cuadre_caja', [
            'caja'               => $caja,
            'instituto'          => $instituto,
            'pagosPostulantes'   => $pagosPostulantes,
            'transacciones'      => $transacciones,
            'totalIngresosPagos' => $totalIngresosPagos,
            'totalOtrosIngresos' => $totalOtrosIngresos,
            'totalEgresos'       => $totalEgresos,
            'saldoTeorico'       => $saldoTeorico,
            'diferencia'         => $diferencia,
            'fechaImpresion'     => now()->format('d/m/Y H:i:s'),
        ])->setPaper('a4', 'portrait');

        return $pdf->stream("Reporte_Caja_{$caja->id_caja}.pdf");
    }
}