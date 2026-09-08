<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\Aula;
use App\Models\PatrimonioBien;
use App\Models\PatrimonioMovimiento;
use App\Models\Personal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PatrimonioMovimientoController extends Controller
{
    /**
     * Listado general del historial de movimientos.
     */
    public function index(Request $request): Response
    {
        $buscar         = trim((string) $request->input('buscar', ''));
        $tipoMovimiento = trim((string) $request->input('tipo_movimiento', ''));
        $bienId         = $request->input('bien_id');
        $fechaInicio    = $request->input('fecha_inicio');
        $fechaFin       = $request->input('fecha_fin');

        $movimientos = PatrimonioMovimiento::query()
            ->with([
                'bien:id,codigo_patrimonial,denominacion,marca,modelo',
                'aulaOrigen:id,nombre,numero_aula',
                'aulaDestino:id,nombre,numero_aula',
                'areaOrigen:id,nombre',
                'areaDestino:id,nombre',
                'personalOrigen:id,dni,nombre,apellido',
                'personalDestino:id,dni,nombre,apellido',
            ])
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('motivo', 'like', "%{$buscar}%")
                        ->orWhereHas('bien', function ($q) use ($buscar) {
                            $q->where('codigo_patrimonial', 'like', "%{$buscar}%")
                              ->orWhere('denominacion', 'like', "%{$buscar}%");
                        });
                });
            })
            ->when($tipoMovimiento !== '', fn ($q) => $q->where('tipo_movimiento', $tipoMovimiento))
            ->when(! blank($bienId), fn ($q) => $q->where('bien_id', $bienId))
            ->when(! blank($fechaInicio), fn ($q) => $q->whereDate('fecha_movimiento', '>=', $fechaInicio))
            ->when(! blank($fechaFin), fn ($q) => $q->whereDate('fecha_movimiento', '<=', $fechaFin))
            ->orderByDesc('fecha_movimiento')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Patrimonio/Movimientos/Index', [
            'movimientos'      => $movimientos,
            'bienes'           => PatrimonioBien::where('situacion', '<>', 'De_Baja')->select('id', 'codigo_patrimonial', 'denominacion', 'aula_id', 'area_id', 'responsable_personal_id')->orderBy('denominacion')->get(),
            'aulas'            => Aula::with('pabellon:id,nombre')->select('id', 'nombre', 'numero_aula', 'id_pabellon')->orderBy('nombre')->get(),
            'areas'            => Area::where('estado', 'Activo')->select('id', 'nombre')->orderBy('nombre')->get(),
            'personal'         => Personal::select('id', 'dni', 'nombre', 'apellido')->orderBy('apellido')->get(),
            'tiposMovimiento'  => ['Asignacion', 'Reubicacion', 'Prestamo', 'Retorno'],
            'filtros'          => [
                'buscar'          => $buscar,
                'tipo_movimiento' => $tipoMovimiento,
                'bien_id'         => $bienId ?? '',
                'fecha_inicio'    => $fechaInicio ?? '',
                'fecha_fin'       => $fechaFin ?? '',
            ],
        ]);
    }

    /**
     * Filtrado dinámico vía AJAX.
     */
    public function filtrar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'buscar'          => ['nullable', 'string', 'max:100'],
            'tipo_movimiento' => ['nullable', 'string', 'in:Asignacion,Reubicacion,Prestamo,Retorno'],
            'bien_id'         => ['nullable', 'integer', 'exists:patrimonio_bienes,id'],
            'fecha_inicio'    => ['nullable', 'date'],
            'fecha_fin'       => ['nullable', 'date'],
            'page'            => ['nullable', 'integer', 'min:1'],
        ]);

        $buscar         = trim((string) ($datos['buscar'] ?? ''));
        $tipoMovimiento = trim((string) ($datos['tipo_movimiento'] ?? ''));
        $bienId         = $datos['bien_id'] ?? null;
        $fechaInicio    = $datos['fecha_inicio'] ?? null;
        $fechaFin       = $datos['fecha_fin'] ?? null;
        $pagina         = (int) ($datos['page'] ?? 1);

        $movimientos = PatrimonioMovimiento::query()
            ->with([
                'bien:id,codigo_patrimonial,denominacion,marca,modelo',
                'aulaOrigen:id,nombre,numero_aula',
                'aulaDestino:id,nombre,numero_aula',
                'areaOrigen:id,nombre',
                'areaDestino:id,nombre',
                'personalOrigen:id,dni,nombre,apellido',
                'personalDestino:id,dni,nombre,apellido',
            ])
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('motivo', 'like', "%{$buscar}%")
                        ->orWhereHas('bien', function ($q) use ($buscar) {
                            $q->where('codigo_patrimonial', 'like', "%{$buscar}%")
                              ->orWhere('denominacion', 'like', "%{$buscar}%");
                        });
                });
            })
            ->when($tipoMovimiento !== '', fn ($q) => $q->where('tipo_movimiento', $tipoMovimiento))
            ->when(! blank($bienId), fn ($q) => $q->where('bien_id', $bienId))
            ->when(! blank($fechaInicio), fn ($q) => $q->whereDate('fecha_movimiento', '>=', $fechaInicio))
            ->when(! blank($fechaFin), fn ($q) => $q->whereDate('fecha_movimiento', '<=', $fechaFin))
            ->orderByDesc('fecha_movimiento')
            ->paginate(perPage: 10, columns: ['*'], pageName: 'page', page: $pagina);

        return response()->json(['movimientos' => $movimientos]);
    }

    /**
     * Registra un movimiento y actualiza la ubicación/responsable del bien en tiempo real.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            'bien_id'             => ['required', 'integer', 'exists:patrimonio_bienes,id'],
            'tipo_movimiento'     => ['required', 'string', 'in:Asignacion,Reubicacion,Prestamo,Retorno'],
            'aula_destino_id'     => ['nullable', 'integer', 'exists:aulas,id'],
            'area_destino_id'     => ['nullable', 'integer', 'exists:areas,id'],
            'personal_destino_id' => ['nullable', 'integer', 'exists:personal,id'],
            'fecha_movimiento'    => ['required', 'date'],
            'motivo'              => ['nullable', 'string', 'max:1000'],
        ], [
            'bien_id.required'         => 'Debe seleccionar el bien patrimonial.',
            'tipo_movimiento.required' => 'Debe especificar el tipo de movimiento.',
            'fecha_movimiento.required'=> 'La fecha de movimiento es obligatoria.',
        ]);

        $bien = PatrimonioBien::findOrFail($datos['bien_id']);

        DB::transaction(function () use ($datos, $bien) {
            // 1. Guardar registro histórico con los valores anteriores y los nuevos
            PatrimonioMovimiento::create([
                'bien_id'             => $bien->id,
                'aula_origen_id'      => $bien->aula_id,
                'aula_destino_id'     => $datos['aula_destino_id'] ?? null,
                'area_origen_id'      => $bien->area_id,
                'area_destino_id'     => $datos['area_destino_id'] ?? null,
                'personal_origen_id'  => $bien->responsable_personal_id,
                'personal_destino_id' => $datos['personal_destino_id'] ?? null,
                'tipo_movimiento'     => $datos['tipo_movimiento'],
                'motivo'              => ! empty(trim($datos['motivo'] ?? '')) ? trim($datos['motivo']) : null,
                'fecha_movimiento'    => $datos['fecha_movimiento'],
                'created_at'          => now(),
            ]);

            // 2. Sincronizar el estado actual en la tabla principal de bienes
            $bien->update([
                'aula_id'                 => $datos['aula_destino_id'] ?? null,
                'area_id'                 => $datos['area_destino_id'] ?? null,
                'responsable_personal_id' => $datos['personal_destino_id'] ?? null,
            ]);
        });

        return back()->with('success', 'Movimiento registrado y ubicación del bien actualizada.');
    }

    /**
     * Elimina un registro de movimiento.
     */
    public function destroy(PatrimonioMovimiento $movimiento): RedirectResponse
    {
        try {
            $movimiento->delete();

            return back()->with('success', 'Registro de movimiento eliminado.');
        } catch (Throwable $exception) {
            report($exception);
            return back()->with('error', 'No se pudo eliminar el movimiento.');
        }
    }
}