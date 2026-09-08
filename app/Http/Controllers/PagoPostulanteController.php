<?php

namespace App\Http\Controllers;

use App\Models\Caja;
use App\Models\Concepto;
use App\Models\PagoPostulante;
use App\Models\Postulante;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Instituto;
class PagoPostulanteController extends Controller
{
    /**
     * Muestra la lista general de pagos de postulantes.
     */
    public function index(Request $request): Response
    {
        $search = trim($request->input('search'));

        $pagos = PagoPostulante::with(['postulante', 'concepto', 'caja'])
            ->when($search, function ($query, $search) {
                $query->whereHas('postulante', function ($q) use ($search) {
                    $q->buscar($search);
                });
            })
            ->latest('id_pagos')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Pagos/Index', [
            'pagos'   => $pagos,
            'filters' => ['search' => $search],
        ]);
    }

    /**
     * Vista de registro a pantalla completa.
     */
    public function create(): Response
    {
        $cajaAbierta = Caja::whereNull('fecha_cierre')->latest('id_caja')->first();
        $conceptos = Concepto::where('activo', 1)->get();

        return Inertia::render('Pagos/Create', [
            'cajaAbierta' => $cajaAbierta,
            'conceptos'   => $conceptos,
        ]);
    }

    /**
     * Endpoint AJAX directo que usa scopeBuscar().
     */
    public function buscarPostulante(Request $request)
    {
        try {
            $query = trim($request->input('query'));

            if (strlen($query) < 2) {
                return response()->json([]);
            }

            // Utiliza el scopeBuscar definido en tu modelo Postulante
            $postulantes = Postulante::buscar($query)
                ->take(10)
                ->get();

            return response()->json($postulantes);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Almacena el pago en la caja abierta.
     */
    public function store(Request $request)
    {
        $request->validate([
            'postulante_id' => 'required|exists:postulantes,id_postulante',
            'concepto_id'   => 'required|exists:conceptos,id_concepto',
            'monto'         => 'required|numeric|min:0.10',
            'observacion'   => 'nullable|string|max:255',
        ]);

        $caja = Caja::whereNull('fecha_cierre')->latest('id_caja')->first();

        if (!$caja) {
            return back()->withErrors(['error' => 'No hay una caja abierta para procesar el pago.']);
        }

        $pago = DB::transaction(function () use ($request, $caja) {
            return PagoPostulante::create([
                'postulante_id' => $request->postulante_id,
                'concepto_id'   => $request->concepto_id,
                'caja_id'       => $caja->id_caja,
                'monto'         => $request->monto,
                'fecha'         => now(),
                'observacion'   => $request->observacion,
                'estado'        => PagoPostulante::ESTADO_ACEPTADO,
            ]);
        });

        return redirect()->route('pagos.index')->with([
            'success' => 'Pago registrado correctamente.',
            'pago_id' => $pago->id_pagos,
        ]);
    }

    /**
     * Anular un pago.
     */
    public function anular($id)
    {
        $pago = PagoPostulante::findOrFail($id);

        if ($pago->estado === PagoPostulante::ESTADO_ANULADO) {
            return back()->withErrors(['error' => 'Este pago ya se encuentra anulado.']);
        }

        $pago->update([
            'estado' => PagoPostulante::ESTADO_ANULADO,
        ]);

        return back()->with('success', 'El pago ha sido anulado correctamente.');
    }

    /**
     * Generar Ticket PDF Térmico.
     */
   public function generarTicket($id)
{
    $pago = PagoPostulante::with(['postulante', 'concepto', 'caja'])->findOrFail($id);
    
    // Obtenemos los datos de la institución (con su relación de distrito si se requiere)
    $instituto = Instituto::with('distrito')->first();

    $pdf = Pdf::loadView('pdf.ticket_pago', [
        'pago'           => $pago,
        'instituto'      => $instituto,
        'fechaImpresion' => now()->format('d/m/Y H:i:s'),
    ])->setPaper([0, 0, 226.77, 500], 'portrait');

    return $pdf->stream("Ticket_Pago_{$pago->id_pagos}.pdf");
}
}