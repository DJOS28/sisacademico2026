<?php

namespace App\Http\Controllers;

use App\Models\PatrimonioBien;
use App\Models\PatrimonioMantenimiento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PatrimonioMantenimientoController extends Controller
{
    /**
     * Listado general de mantenimientos.
     */
    public function index(Request $request): Response
    {
        $buscar      = trim((string) $request->input('buscar', ''));
        $tipo        = trim((string) $request->input('tipo', ''));
        $estado      = trim((string) $request->input('estado', ''));
        $bienId      = $request->input('bien_id');
        $fechaInicio = $request->input('fecha_inicio');
        $fechaFin    = $request->input('fecha_fin');

        $mantenimientos = PatrimonioMantenimiento::query()
            ->with(['bien:id,codigo_patrimonial,denominacion,marca,modelo,situacion'])
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('diagnostico', 'like', "%{$buscar}%")
                        ->orWhere('proveedor_tecnico', 'like', "%{$buscar}%")
                        ->orWhere('acciones_realizadas', 'like', "%{$buscar}%")
                        ->orWhereHas('bien', function ($q) use ($buscar) {
                            $q->where('codigo_patrimonial', 'like', "%{$buscar}%")
                              ->orWhere('denominacion', 'like', "%{$buscar}%");
                        });
                });
            })
            ->when($tipo !== '', fn ($q) => $q->where('tipo', $tipo))
            ->when($estado !== '', fn ($q) => $q->where('estado', $estado))
            ->when(! blank($bienId), fn ($q) => $q->where('bien_id', $bienId))
            ->when(! blank($fechaInicio), fn ($q) => $q->whereDate('fecha_ingreso', '>=', $fechaInicio))
            ->when(! blank($fechaFin), fn ($q) => $q->whereDate('fecha_ingreso', '<=', $fechaFin))
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Patrimonio/Mantenimientos/Index', [
            'mantenimientos' => $mantenimientos,
            'bienes'         => PatrimonioBien::where('situacion', '<>', 'De_Baja')
                ->select('id', 'codigo_patrimonial', 'denominacion', 'situacion')
                ->orderBy('denominacion')
                ->get(),
            'tipos'          => ['Preventivo', 'Correctivo'],
            'estados'        => ['En_Proceso', 'Finalizado', 'Irreparable'],
            'filtros'        => [
                'buscar'       => $buscar,
                'tipo'         => $tipo,
                'estado'       => $estado,
                'bien_id'      => $bienId ?? '',
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
            'tipo'         => ['nullable', 'string', 'in:Preventivo,Correctivo'],
            'estado'       => ['nullable', 'string', 'in:En_Proceso,Finalizado,Irreparable'],
            'bien_id'      => ['nullable', 'integer', 'exists:patrimonio_bienes,id'],
            'fecha_inicio' => ['nullable', 'date'],
            'fecha_fin'    => ['nullable', 'date'],
            'page'         => ['nullable', 'integer', 'min:1'],
        ]);

        $buscar      = trim((string) ($datos['buscar'] ?? ''));
        $tipo        = trim((string) ($datos['tipo'] ?? ''));
        $estado      = trim((string) ($datos['estado'] ?? ''));
        $bienId      = $datos['bien_id'] ?? null;
        $fechaInicio = $datos['fecha_inicio'] ?? null;
        $fechaFin    = $datos['fecha_fin'] ?? null;
        $pagina      = (int) ($datos['page'] ?? 1);

        $mantenimientos = PatrimonioMantenimiento::query()
            ->with(['bien:id,codigo_patrimonial,denominacion,marca,modelo,situacion'])
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('diagnostico', 'like', "%{$buscar}%")
                        ->orWhere('proveedor_tecnico', 'like', "%{$buscar}%")
                        ->orWhere('acciones_realizadas', 'like', "%{$buscar}%")
                        ->orWhereHas('bien', function ($q) use ($buscar) {
                            $q->where('codigo_patrimonial', 'like', "%{$buscar}%")
                              ->orWhere('denominacion', 'like', "%{$buscar}%");
                        });
                });
            })
            ->when($tipo !== '', fn ($q) => $q->where('tipo', $tipo))
            ->when($estado !== '', fn ($q) => $q->where('estado', $estado))
            ->when(! blank($bienId), fn ($q) => $q->where('bien_id', $bienId))
            ->when(! blank($fechaInicio), fn ($q) => $q->whereDate('fecha_ingreso', '>=', $fechaInicio))
            ->when(! blank($fechaFin), fn ($q) => $q->whereDate('fecha_ingreso', '<=', $fechaFin))
            ->orderByDesc('id')
            ->paginate(perPage: 10, columns: ['*'], pageName: 'page', page: $pagina);

        return response()->json(['mantenimientos' => $mantenimientos]);
    }

    /**
     * Registra un nuevo servicio de mantenimiento.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        $bien = PatrimonioBien::findOrFail($datos['bien_id']);

        DB::transaction(function () use ($datos, $bien) {
            PatrimonioMantenimiento::create([
                'bien_id'             => $bien->id,
                'tipo'                => $datos['tipo'],
                'diagnostico'         => trim($datos['diagnostico']),
                'acciones_realizadas' => $this->normalizarNullable($datos['acciones_realizadas'] ?? null),
                'costo'               => $datos['costo'] ?? 0.00,
                'proveedor_tecnico'   => $this->normalizarNullable($datos['proveedor_tecnico'] ?? null),
                'fecha_ingreso'       => $datos['fecha_ingreso'],
                'fecha_salida'        => $datos['fecha_salida'] ?? null,
                'estado'              => $datos['estado'],
                'created_at'          => now(),
            ]);

            // Actualizar la situación del activo según el estado del mantenimiento
            $this->actualizarSituacionBien($bien, $datos['estado']);
        });

        return back()->with('success', 'Orden de mantenimiento registrada correctamente.');
    }

    /**
     * Actualiza el diagnóstico, costo o cierre del mantenimiento.
     */
    public function update(Request $request, PatrimonioMantenimiento $mantenimiento): RedirectResponse
    {
        $datos = $this->validar($request);

        DB::transaction(function () use ($datos, $mantenimiento) {
            $mantenimiento->update([
                'bien_id'             => $datos['bien_id'],
                'tipo'                => $datos['tipo'],
                'diagnostico'         => trim($datos['diagnostico']),
                'acciones_realizadas' => $this->normalizarNullable($datos['acciones_realizadas'] ?? null),
                'costo'               => $datos['costo'] ?? 0.00,
                'proveedor_tecnico'   => $this->normalizarNullable($datos['proveedor_tecnico'] ?? null),
                'fecha_ingreso'       => $datos['fecha_ingreso'],
                'fecha_salida'        => $datos['fecha_salida'] ?? null,
                'estado'              => $datos['estado'],
            ]);

            $bien = $mantenimiento->bien;
            if ($bien) {
                $this->actualizarSituacionBien($bien, $datos['estado']);
            }
        });

        return back()->with('success', 'Mantenimiento actualizado.');
    }

    /**
     * Elimina el registro de mantenimiento.
     */
    public function destroy(PatrimonioMantenimiento $mantenimiento): RedirectResponse
    {
        try {
            $bien = $mantenimiento->bien;

            $mantenimiento->delete();

            // Si no quedan otros mantenimientos en proceso, restaurar a Operativo
            if ($bien && ! $bien->mantenimientos()->where('estado', 'En_Proceso')->exists()) {
                if ($bien->situacion === 'En_Mantenimiento') {
                    $bien->update(['situacion' => 'Operativo']);
                }
            }

            return back()->with('success', 'Registro de mantenimiento eliminado.');
        } catch (Throwable $exception) {
            report($exception);
            return back()->with('error', 'No se pudo eliminar el mantenimiento.');
        }
    }

    /**
     * Sincroniza la situación operativa del bien.
     */
    private function actualizarSituacionBien(PatrimonioBien $bien, string $estadoMantenimiento): void
    {
        if ($estadoMantenimiento === 'En_Proceso') {
            $bien->update(['situacion' => 'En_Mantenimiento']);
        } elseif ($estadoMantenimiento === 'Finalizado') {
            $bien->update(['situacion' => 'Operativo']);
        } elseif ($estadoMantenimiento === 'Irreparable') {
            $bien->update(['situacion' => 'Inoperativo']);
        }
    }

    /**
     * Validación de campos.
     */
    private function validar(Request $request): array
    {
        return $request->validate([
            'bien_id'             => ['required', 'integer', 'exists:patrimonio_bienes,id'],
            'tipo'                => ['required', 'string', 'in:Preventivo,Correctivo'],
            'diagnostico'         => ['required', 'string', 'max:1000'],
            'acciones_realizadas' => ['nullable', 'string', 'max:1000'],
            'costo'               => ['nullable', 'numeric', 'min:0'],
            'proveedor_tecnico'   => ['nullable', 'string', 'max:150'],
            'fecha_ingreso'       => ['required', 'date'],
            'fecha_salida'        => ['nullable', 'date', 'after_or_equal:fecha_ingreso'],
            'estado'              => ['required', 'string', 'in:En_Proceso,Finalizado,Irreparable'],
        ], [
            'bien_id.required'         => 'Debe seleccionar el bien patrimonial.',
            'diagnostico.required'     => 'El diagnóstico técnico o falla reportada es obligatorio.',
            'fecha_ingreso.required'   => 'La fecha de ingreso a mantenimiento es obligatoria.',
            'fecha_salida.after_or_equal' => 'La fecha de salida no puede ser anterior a la fecha de ingreso.',
        ]);
    }

    /**
     * Normalizar cadenas vacías a null.
     */
    private function normalizarNullable(mixed $valor): ?string
    {
        $valor = trim((string) $valor);
        return $valor !== '' ? $valor : null;
    }
}