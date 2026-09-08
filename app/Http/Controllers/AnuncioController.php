<?php

namespace App\Http\Controllers;

use App\Models\Anuncio;
use App\Models\PlanEstudio;
use App\Services\AuditoriaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class AnuncioController extends Controller
{
    /**
     * Muestra el listado de anuncios institucionales.
     */
    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->input('buscar', ''));
        $planEstudioId = $request->input('plan_estudio_id');
        $activo = $request->input('activo');

        $anuncios = Anuncio::query()
            ->with(['planEstudio:id,nombre,codigo'])
            ->when($buscar !== '', function ($q) use ($buscar) {
                $q->where(function ($sub) use ($buscar) {
                    $sub->where('titulo', 'like', "%{$buscar}%")
                        ->orWhere('contenido', 'like', "%{$buscar}%");
                });
            })
            ->when(!blank($planEstudioId), fn($q) => $q->where('plan_estudio_id', (int) $planEstudioId))
            ->when(!blank($activo), fn($q) => $q->where('activo', (bool) $activo))
            ->orderByDesc('id_anuncio')
            ->paginate(10)
            ->withQueryString();

        $planesEstudio = PlanEstudio::query()
            ->where('activo', 1)
            ->select('id', 'nombre', 'codigo')
            ->orderBy('nombre')
            ->get();

        return Inertia::render('Anuncios/Index', [
            'anuncios'      => $anuncios,
            'planesEstudio' => $planesEstudio,
            'filtros'       => [
                'buscar'          => $buscar,
                'plan_estudio_id' => $planEstudioId ?? '',
                'activo'          => $activo ?? '',
            ],
        ]);
    }

    /**
     * Endpoint AJAX para filtrado dinámico en tiempo real.
     */
    public function filtrar(Request $request): JsonResponse
    {
        $buscar = trim((string) $request->input('buscar', ''));
        $planEstudioId = $request->input('plan_estudio_id');
        $activo = $request->input('activo');

        $anuncios = Anuncio::query()
            ->with(['planEstudio:id,nombre,codigo'])
            ->when($buscar !== '', function ($q) use ($buscar) {
                $q->where(function ($sub) use ($buscar) {
                    $sub->where('titulo', 'like', "%{$buscar}%")
                        ->orWhere('contenido', 'like', "%{$buscar}%");
                });
            })
            ->when(!blank($planEstudioId), fn($q) => $q->where('plan_estudio_id', (int) $planEstudioId))
            ->when(!blank($activo), fn($q) => $q->where('activo', (bool) $activo))
            ->orderByDesc('id_anuncio')
            ->paginate(10)
            ->withQueryString();

        return response()->json([
            'anuncios' => $anuncios,
        ]);
    }

    /**
     * Registra un nuevo anuncio institucional.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            'titulo'          => ['required', 'string', 'max:255'],
            'contenido'       => ['required', 'string'],
            'plan_estudio_id' => ['required', 'integer', 'exists:planes_estudio,id'],
            'activo'          => ['nullable', 'boolean'],
        ], [
            'titulo.required'          => 'El título del anuncio es obligatorio.',
            'contenido.required'       => 'El contenido del aviso es requerido.',
            'plan_estudio_id.required' => 'Debe asociar el aviso a un plan de estudio.',
            'plan_estudio_id.exists'   => 'El plan de estudio seleccionado no es válido.',
        ]);

        try {
            $anuncio = null;

            DB::transaction(function () use ($datos, &$anuncio) {
                $anuncio = Anuncio::create([
                    'titulo'          => trim($datos['titulo']),
                    'contenido'       => trim($datos['contenido']),
                    'plan_estudio_id' => (int) $datos['plan_estudio_id'],
                    'activo'          => (bool) ($datos['activo'] ?? true),
                ]);

                // Directiva 12.11 DRE Ancash - c) Configuración institucional y académica
                AuditoriaService::registrar(
                    componente: 'configuracion_institucional',
                    operacion: 'INSERTAR',
                    descripcion: "Aviso/Anuncio publicado: '{$anuncio->titulo}' (Plan ID: {$anuncio->plan_estudio_id})",
                    registroId: (string) $anuncio->id_anuncio,
                    nuevos: [
                        'titulo'          => $anuncio->titulo,
                        'plan_estudio_id' => $anuncio->plan_estudio_id,
                        'activo'          => $anuncio->activo,
                    ],
                    resultado: 'EXITO'
                );
            });

            return back()->with('success', 'Anuncio publicado correctamente.');
        } catch (Throwable $e) {
            AuditoriaService::registrar(
                componente: 'configuracion_institucional',
                operacion: 'INSERTAR',
                descripcion: "Fallo al publicar anuncio '{$datos['titulo']}'",
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return back()->withErrors(['error' => 'Error al crear el anuncio: ' . $e->getMessage()]);
        }
    }

    /**
     * Actualiza el contenido de un anuncio existente.
     */
    public function update(Request $request, Anuncio $anuncio): RedirectResponse
    {
        $datos = $request->validate([
            'titulo'          => ['required', 'string', 'max:255'],
            'contenido'       => ['required', 'string'],
            'plan_estudio_id' => ['required', 'integer', 'exists:planes_estudio,id'],
            'activo'          => ['required', 'boolean'],
        ], [
            'titulo.required'          => 'El título del anuncio es obligatorio.',
            'contenido.required'       => 'El contenido del aviso es requerido.',
            'plan_estudio_id.required' => 'Debe asociar el aviso a un plan de estudio.',
        ]);

        $datosAnteriores = [
            'titulo'          => $anuncio->titulo,
            'contenido'       => $anuncio->contenido,
            'plan_estudio_id' => $anuncio->plan_estudio_id,
            'activo'          => $anuncio->activo,
        ];

        try {
            DB::transaction(function () use ($datos, $anuncio, $datosAnteriores) {
                $anuncio->update([
                    'titulo'          => trim($datos['titulo']),
                    'contenido'       => trim($datos['contenido']),
                    'plan_estudio_id' => (int) $datos['plan_estudio_id'],
                    'activo'          => (bool) $datos['activo'],
                ]);

                AuditoriaService::registrar(
                    componente: 'configuracion_institucional',
                    operacion: 'ACTUALIZAR',
                    descripcion: "Anuncio ID {$anuncio->id_anuncio} modificado: '{$anuncio->titulo}'",
                    registroId: (string) $anuncio->id_anuncio,
                    anteriores: $datosAnteriores,
                    nuevos: [
                        'titulo'          => $anuncio->titulo,
                        'plan_estudio_id' => $anuncio->plan_estudio_id,
                        'activo'          => $anuncio->activo,
                    ],
                    resultado: 'EXITO'
                );
            });

            return back()->with('success', 'Anuncio actualizado con éxito.');
        } catch (Throwable $e) {
            AuditoriaService::registrar(
                componente: 'configuracion_institucional',
                operacion: 'ACTUALIZAR',
                descripcion: "Fallo al actualizar anuncio ID {$anuncio->id_anuncio}",
                registroId: (string) $anuncio->id_anuncio,
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return back()->withErrors(['error' => 'Error al actualizar el anuncio: ' . $e->getMessage()]);
        }
    }

    /**
     * Alterna rápidamente el estado (Activo / Inactivo) del aviso.
     */
    public function toggleEstado(Anuncio $anuncio): JsonResponse
    {
        $estadoAnterior = $anuncio->activo;
        $nuevoEstado = !$estadoAnterior;

        try {
            $anuncio->update(['activo' => $nuevoEstado]);

            AuditoriaService::registrar(
                componente: 'configuracion_institucional',
                operacion: 'ACTUALIZAR',
                descripcion: "Cambio de visibilidad de anuncio ID {$anuncio->id_anuncio} ('{$anuncio->titulo}') a " . ($nuevoEstado ? 'Activo' : 'Inactivo'),
                registroId: (string) $anuncio->id_anuncio,
                anteriores: ['activo' => $estadoAnterior],
                nuevos: ['activo' => $nuevoEstado],
                resultado: 'EXITO'
            );

            return response()->json([
                'success' => true,
                'activo'  => $nuevoEstado,
                'message' => 'Estado del anuncio actualizado.',
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'No se pudo cambiar el estado del anuncio.',
            ], 500);
        }
    }

    /**
     * Elimina definitivamente el anuncio.
     */
    public function destroy(Anuncio $anuncio): RedirectResponse
    {
        $datosEliminados = [
            'id_anuncio'      => $anuncio->id_anuncio,
            'titulo'          => $anuncio->titulo,
            'plan_estudio_id' => $anuncio->plan_estudio_id,
        ];

        try {
            DB::transaction(function () use ($anuncio, $datosEliminados) {
                $anuncio->delete();

                AuditoriaService::registrar(
                    componente: 'configuracion_institucional',
                    operacion: 'ELIMINAR',
                    descripcion: "Anuncio eliminado: '{$datosEliminados['titulo']}' (ID: {$datosEliminados['id_anuncio']})",
                    registroId: (string) $datosEliminados['id_anuncio'],
                    anteriores: $datosEliminados,
                    resultado: 'EXITO'
                );
            });

            return back()->with('success', 'Anuncio eliminado correctamente.');
        } catch (Throwable $e) {
            AuditoriaService::registrar(
                componente: 'configuracion_institucional',
                operacion: 'ELIMINAR',
                descripcion: "Fallo al eliminar anuncio ID {$anuncio->id_anuncio}",
                registroId: (string) $anuncio->id_anuncio,
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return back()->withErrors(['error' => 'Error al eliminar el anuncio: ' . $e->getMessage()]);
        }
    }
}