<?php

namespace App\Http\Controllers;

use App\Models\AuditoriaOperacion;
use App\Services\AuditoriaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditoriaController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        $buscar = trim((string) $request->input('buscar', ''));
        $componente = $request->input('componente');
        $operacion = $request->input('operacion');
        $resultado = $request->input('resultado');
        $desde = $request->input('desde');
        $hasta = $request->input('hasta');

        $auditorias = AuditoriaOperacion::query()
            ->when($buscar !== '', fn($q) => $q->where(function ($sub) use ($buscar) {
                $sub->where('username_historico', 'like', "%{$buscar}%")
                    ->orWhere('descripcion', 'like', "%{$buscar}%")
                    ->orWhere('ip_origen', 'like', "%{$buscar}%");
            }))
            ->when($componente, fn($q) => $q->where('componente', $componente))
            ->when($operacion, fn($q) => $q->where('operacion', $operacion))
            ->when($resultado, fn($q) => $q->where('resultado', $resultado))
            ->when($desde, fn($q) => $q->whereDate('created_at', '>=', $desde))
            ->when($hasta, fn($q) => $q->whereDate('created_at', '<=', $hasta))
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        $filtros = $request->only(['buscar', 'componente', 'operacion', 'resultado', 'desde', 'hasta']);

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json([
                'auditorias' => $auditorias,
                'filtros' => $filtros,
            ]);
        }

        return Inertia::render('Auditoria/Index', [
            'auditorias' => $auditorias,
            'filtros' => $filtros,
        ]);
    }

    public function exportar(Request $request): StreamedResponse
    {
        AuditoriaService::registrar(
            'import_export',
            'EXPORTAR',
            'Exportación de registros de auditoría institucional para supervisión DRE'
        );

        $nombreArchivo = 'auditoria_institucional_' . date('Ymd_His') . '.csv';

        return response()->streamDownload(function () {
            echo "\xEF\xBB\xBF";
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'ID', 'Fecha y Hora', 'Usuario', 'Rol', 'Componente Afectado', 
                'Operacion', 'Descripcion', 'Resultado', 'IP Origen'
            ]);

            AuditoriaOperacion::query()
                ->latest('id')
                ->chunk(500, function ($filas) use ($handle) {
                    foreach ($filas as $fila) {
                        fputcsv($handle, [
                            $fila->id,
                            $fila->created_at->format('Y-m-d H:i:s'),
                            $fila->username_historico,
                            $fila->rol_usuario,
                            $fila->componente,
                            $fila->operacion,
                            $fila->descripcion,
                            $fila->resultado,
                            $fila->ip_origen,
                        ]);
                    }
                });

            fclose($handle);
        }, $nombreArchivo, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}