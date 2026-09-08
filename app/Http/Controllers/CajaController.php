<?php

namespace App\Http\Controllers;

use App\Models\Caja;
use App\Models\CajaHistorial;
use App\Models\Concepto;
use App\Models\PagoPostulante;
use App\Models\TransaccionCaja;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CajaController extends Controller
{
    /**
     * Muestra la vista principal de Caja (Apertura / Panel Operativo).
     */
    public function index(): Response
    {
        // Buscar caja actualmente abierta (fecha_cierre es null)
        $cajaAbierta = Caja::whereNull('fecha_cierre')->latest('id_caja')->first();

        $conceptos = Concepto::where('activo', 1)->get();

        if (!$cajaAbierta) {
            return Inertia::render('Caja/Index', [
                'cajaAbierta' => null,
                'conceptos'   => $conceptos,
            ]);
        }

        // Cargar movimientos de la caja abierta
        $transacciones = TransaccionCaja::with('concepto')
            ->where('caja_id', $cajaAbierta->id_caja)
            ->latest('id_transaccion')
            ->get();

        $pagosEstudiantes = PagoPostulante::with(['postulante', 'concepto'])
            ->where('caja_id', $cajaAbierta->id_caja)
            ->latest('id_pagos')
            ->get();

        // Calcular Totales
        $totalIngresos = TransaccionCaja::where('caja_id', $cajaAbierta->id_caja)
            ->where('tipo', 'ingreso')
            ->where('estado', 'aceptado')
            ->sum('monto');

        $totalEgresos = TransaccionCaja::where('caja_id', $cajaAbierta->id_caja)
            ->where('tipo', 'egreso')
            ->where('estado', 'aceptado')
            ->sum('monto');

        $totalPagosEstudiantes = PagoPostulante::where('caja_id', $cajaAbierta->id_caja)
            ->where('estado', PagoPostulante::ESTADO_ACEPTADO)
            ->sum('monto');

        $saldoCalculado = $cajaAbierta->apertura + $totalIngresos + $totalPagosEstudiantes - $totalEgresos;

        return Inertia::render('Caja/Index', [
            'cajaAbierta'      => $cajaAbierta,
            'conceptos'        => $conceptos,
            'transacciones'    => $transacciones,
            'pagosEstudiantes' => $pagosEstudiantes,
            'resumen'          => [
                'apertura'               => (float) $cajaAbierta->apertura,
                'total_ingresos_varios'  => (float) $totalIngresos,
                'total_pagos_alumnos'    => (float) $totalPagosEstudiantes,
                'total_egresos'          => (float) $totalEgresos,
                'saldo_calculado'        => (float) $saldoCalculado,
            ],
        ]);
    }

    /**
     * Apertura una nueva sesión de Caja.
     */
    public function aperturar(Request $request)
    {
        $request->validate([
            'nombre'      => 'required|string|max:255',
            'apertura'    => 'required|numeric|min:0',
            'observacion' => 'nullable|string|max:500',
        ]);

        // Verificar si ya existe una caja abierta
        $existeAbierta = Caja::whereNull('fecha_cierre')->exists();
        if ($existeAbierta) {
            return back()->withErrors(['error' => 'Ya existe una caja abierta actualmente. Debe cerrarla antes de aperturar otra.']);
        }

        DB::transaction(function () use ($request) {
            $caja = Caja::create([
                'nombre'         => $request->nombre,
                'apertura'       => $request->apertura,
                'saldo'          => $request->apertura,
                'fecha_apertura' => now(),
                'observacion'    => $request->observacion,
            ]);

            // Registrar en Historial
            CajaHistorial::create([
                'caja_id'     => $caja->id_caja,
                'tipo'        => 'apertura',
                'monto'       => $request->apertura,
                'fecha'       => now(),
                'observacion' => 'Apertura de sesión de caja',
            ]);
        });

        return back()->with('success', 'Caja aperturada correctamente.');
    }

    /**
     * Cierra la sesión de Caja activa.
     */
    public function cerrar(Request $request)
    {
        $request->validate([
            'observacion' => 'nullable|string|max:500',
        ]);

        $caja = Caja::whereNull('fecha_cierre')->latest('id_caja')->first();

        if (!$caja) {
            return back()->withErrors(['error' => 'No hay ninguna caja abierta para cerrar.']);
        }

        DB::transaction(function () use ($caja, $request) {
            // Calcular saldo final real
            $totalIngresos = TransaccionCaja::where('caja_id', $caja->id_caja)
                ->where('tipo', 'ingreso')
                ->where('estado', 'aceptado')
                ->sum('monto');

            $totalEgresos = TransaccionCaja::where('caja_id', $caja->id_caja)
                ->where('tipo', 'egreso')
                ->where('estado', 'aceptado')
                ->sum('monto');

            $totalPagosEstudiantes = PagoPostulante::where('caja_id', $caja->id_caja)
                ->where('estado', PagoPostulante::ESTADO_ACEPTADO)
                ->sum('monto');

            $saldoFinal = $caja->apertura + $totalIngresos + $totalPagosEstudiantes - $totalEgresos;

            // Actualizar Caja
            $caja->update([
                'saldo_final'  => $saldoFinal,
                'saldo'        => $saldoFinal,
                'fecha_cierre' => now(),
                'observacion'  => $request->observacion ?? $caja->observacion,
            ]);

            // Registrar evento de cierre en Historial
            CajaHistorial::create([
                'caja_id'     => $caja->id_caja,
                'tipo'        => 'cierre',
                'monto'       => $saldoFinal,
                'fecha'       => now(),
                'observacion' => 'Cierre formal de sesión de caja',
            ]);
        });

        return back()->with('success', 'Caja cerrada exitosamente.');
    }

    /**
     * Registra un ingreso o egreso operativo directo en la caja abierta.
     */
   public function registrarTransaccion(Request $request)
{
    $request->validate([
        'tipo'        => 'required|in:ingreso,egreso',
        'monto'       => 'required|numeric|min:0.1',
        'concepto_id' => 'nullable|exists:conceptos,id_concepto',
        'dni'         => 'nullable|string|max:15',
        'nombres'     => 'nullable|string|max:100',
        'apellidos'   => 'nullable|string|max:100',
        'observacion' => 'required_without:concepto_id|nullable|string|max:255',
    ]);

    $caja = Caja::whereNull('fecha_cierre')->latest('id_caja')->first();

    if (!$caja) {
        return back()->withErrors(['error' => 'Debe abrir una caja antes de registrar transacciones.']);
    }

    TransaccionCaja::create([
        'caja_id'     => $caja->id_caja,
        'tipo'        => $request->tipo,
        'monto'       => $request->monto,
        'fecha'       => now(),
        'concepto_id' => $request->concepto_id,
        'dni'         => $request->dni,
        'nombres'     => $request->nombres,
        'apellidos'   => $request->apellidos,
        'observacion' => $request->observacion,
        'estado'      => 'aceptado',
    ]);

    return back()->with('success', 'Movimiento registrado correctamente.');
}

    /**
     * Anula una transacción de caja.
     */
    public function anularTransaccion($id)
    {
        $transaccion = TransaccionCaja::findOrFail($id);

        if ($transaccion->estado === 'anulado') {
            return back()->withErrors(['error' => 'Esta transacción ya se encuentra anulada.']);
        }

        $transaccion->update([
            'estado' => 'anulado',
        ]);

        return back()->with('success', 'Transacción anulada correctamente.');
    }
}