<?php

namespace App\Http\Controllers;

use App\Models\Instituto;
use App\Models\PatrimonioBaja;
use App\Models\PatrimonioBien;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PatrimonioBajaController extends Controller
{
    /**
     * Listado general de bienes dados de baja.
     */
    public function index(Request $request): Response
    {
        $buscar      = trim((string) $request->input('buscar', ''));
        $causal      = trim((string) $request->input('causal', ''));
        $fechaInicio = $request->input('fecha_inicio');
        $fechaFin    = $request->input('fecha_fin');

        $bajas = PatrimonioBaja::query()
            ->with([
                'bien:id,codigo_patrimonial,denominacion,marca,modelo,serie,valor_adquisicion,categoria_id',
                'bien.categoria:id,codigo,nombre',
            ])
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('resolucion_director', 'like', "%{$buscar}%")
                        ->orWhere('informe_tecnico', 'like', "%{$buscar}%")
                        ->orWhereHas('bien', function ($q) use ($buscar) {
                            $q->where('codigo_patrimonial', 'like', "%{$buscar}%")
                              ->orWhere('denominacion', 'like', "%{$buscar}%")
                              ->orWhere('serie', 'like', "%{$buscar}%");
                        });
                });
            })
            ->when($causal !== '', fn ($q) => $q->where('causal', $causal))
            ->when(! blank($fechaInicio), fn ($q) => $q->whereDate('fecha_baja', '>=', $fechaInicio))
            ->when(! blank($fechaFin), fn ($q) => $q->whereDate('fecha_baja', '<=', $fechaFin))
            ->orderByDesc('fecha_baja')
            ->paginate(10)
            ->withQueryString();

        // Bienes disponibles para dar de baja (activos que aún no han sido dados de baja)
        $bienesDisponibles = PatrimonioBien::where('situacion', '<>', 'De_Baja')
            ->select('id', 'codigo_patrimonial', 'denominacion', 'marca', 'modelo', 'situacion', 'estado_conservacion')
            ->orderBy('denominacion')
            ->get();

        return Inertia::render('Patrimonio/Bajas/Index', [
            'bajas'             => $bajas,
            'bienesDisponibles' => $bienesDisponibles,
            'causales'          => ['Obsolescencia', 'Inoperativo', 'Robo_Hurto', 'Perdida', 'Donacion', 'Otro'],
            'filtros'           => [
                'buscar'       => $buscar,
                'causal'       => $causal,
                'fecha_inicio' => $fechaInicio ?? '',
                'fecha_fin'    => $fechaFin ?? '',
            ],
        ]);
    }

    /**
     * Filtrado dinámico vía AJAX.
     */
    public function filtrar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'buscar'       => ['nullable', 'string', 'max:100'],
            'causal'       => ['nullable', 'string', 'in:Obsolescencia,Inoperativo,Robo_Hurto,Perdida,Donacion,Otro'],
            'fecha_inicio' => ['nullable', 'date'],
            'fecha_fin'    => ['nullable', 'date'],
            'page'         => ['nullable', 'integer', 'min:1'],
        ]);

        $buscar      = trim((string) ($datos['buscar'] ?? ''));
        $causal      = trim((string) ($datos['causal'] ?? ''));
        $fechaInicio = $datos['fecha_inicio'] ?? null;
        $fechaFin    = $datos['fecha_fin'] ?? null;
        $pagina      = (int) ($datos['page'] ?? 1);

        $bajas = PatrimonioBaja::query()
            ->with([
                'bien:id,codigo_patrimonial,denominacion,marca,modelo,serie,valor_adquisicion,categoria_id',
                'bien.categoria:id,codigo,nombre',
            ])
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('resolucion_director', 'like', "%{$buscar}%")
                        ->orWhere('informe_tecnico', 'like', "%{$buscar}%")
                        ->orWhereHas('bien', function ($q) use ($buscar) {
                            $q->where('codigo_patrimonial', 'like', "%{$buscar}%")
                              ->orWhere('denominacion', 'like', "%{$buscar}%")
                              ->orWhere('serie', 'like', "%{$buscar}%");
                        });
                });
            })
            ->when($causal !== '', fn ($q) => $q->where('causal', $causal))
            ->when(! blank($fechaInicio), fn ($q) => $q->whereDate('fecha_baja', '>=', $fechaInicio))
            ->when(! blank($fechaFin), fn ($q) => $q->whereDate('fecha_baja', '<=', $fechaFin))
            ->orderByDesc('fecha_baja')
            ->paginate(perPage: 10, columns: ['*'], pageName: 'page', page: $pagina);

        return response()->json(['bajas' => $bajas]);
    }

    /**
     * Registra la baja de un bien patrimonial.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            'bien_id'             => ['required', 'integer', 'exists:patrimonio_bienes,id', 'unique:patrimonio_bajas,bien_id'],
            'causal'              => ['required', 'string', 'in:Obsolescencia,Inoperativo,Robo_Hurto,Perdida,Donacion,Otro'],
            'resolucion_director' => ['nullable', 'string', 'max:100'],
            'informe_tecnico'     => ['required', 'string', 'max:2000'],
            'fecha_baja'          => ['required', 'date'],
        ], [
            'bien_id.required'        => 'Debe seleccionar el bien patrimonial a desincorporar.',
            'bien_id.unique'          => 'Este bien ya cuenta con un registro de baja patrimonial.',
            'causal.required'         => 'Debe especificar la causal de baja.',
            'informe_tecnico.required'=> 'El informe técnico y justificación de baja es obligatorio.',
            'fecha_baja.required'     => 'La fecha de baja es obligatoria.',
        ]);

        $bien = PatrimonioBien::findOrFail($datos['bien_id']);

        DB::transaction(function () use ($datos, $bien) {
            // 1. Crear el asiento de baja
            PatrimonioBaja::create([
                'bien_id'             => $bien->id,
                'causal'              => $datos['causal'],
                'resolucion_director' => ! empty(trim($datos['resolucion_director'] ?? '')) ? trim($datos['resolucion_director']) : null,
                'informe_tecnico'     => trim($datos['informe_tecnico']),
                'fecha_baja'          => $datos['fecha_baja'],
                'created_at'          => now(),
            ]);

            // 2. Actualizar estado del activo y desvincular custodio/ubicación
            $bien->update([
                'situacion'               => 'De_Baja',
                'estado_conservacion'     => $datos['causal'] === 'Inoperativo' ? 'Chatarra' : $bien->estado_conservacion,
                'aula_id'                 => null,
                'area_id'                 => null,
                'responsable_personal_id' => null,
            ]);
        });

        return back()->with('success', 'Bien patrimonial desincorporado y dado de baja exitosamente.');
    }

    /**
     * Revierte la baja y restituye el bien al inventario activo.
     */
    public function destroy(PatrimonioBaja $baja): RedirectResponse
    {
        try {
            DB::transaction(function () use ($baja) {
                $bien = $baja->bien;

                $baja->delete();

                if ($bien) {
                    $bien->update([
                        'situacion' => 'Inoperativo',
                    ]);
                }
            });

            return back()->with('success', 'Registro de baja revertido. El bien ha retornado al inventario.');
        } catch (Throwable $exception) {
            report($exception);
            return back()->with('error', 'No se pudo revertir la baja patrimonial.');
        }
    }

    /**
     * Emite el Acta Oficial de Desincorporación y Baja en PDF.
     */
    public function emitirActaPdf(PatrimonioBaja $baja): HttpResponse
    {
        $baja->load(['bien.categoria']);

        $instituto = Instituto::with('distrito.provincia.departamento')->first();

        $imagenBase64 = null;
        if ($instituto && ! empty($instituto->logo) && file_exists(public_path('storage/' . $instituto->logo))) {
            $path = public_path('storage/' . $instituto->logo);
            $type = pathinfo($path, PATHINFO_EXTENSION);
            $data = file_get_contents($path);
            $imagenBase64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
        }

        $pdf = Pdf::loadView('pdf.acta_baja_patrimonio', [
            'baja'         => $baja,
            'bien'         => $baja->bien,
            'instituto'    => $instituto,
            'imagenBase64' => $imagenBase64,
        ])->setPaper('a4', 'portrait');

        return $pdf->stream('Acta_Baja_' . ($baja->bien->codigo_patrimonial ?? 'Patrimonio') . '.pdf');
    }
}