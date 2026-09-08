<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\HistorialDerivacion;
use App\Models\SolicitanteExterno;
use App\Models\SolicitudRequisitoArchivo;
use App\Models\SolicitudTramite;
use App\Models\Tramite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;
use App\Mail\SolicitudFinalizadaMail;
class SolicitudTramiteController extends Controller
{
    /**
     * ID por defecto del área de Mesa de Partes General en la BD.
     */
    protected int $idAreaMesaPartes = 1;

    /**
     * BANDEJA 1: Mesa de Partes (Recepciona solicitudes públicas entrantes).
     */
    public function bandejaMesaPartes(Request $request): Response|JsonResponse
    {
        $buscar = trim((string) $request->input('buscar', ''));

        $solicitudes = SolicitudTramite::query()
            ->with([
                'tramite',
                'solicitanteExterno',
                'postulante',
                'personal',
                'archivosRequisitos.requisito',
                'historialDerivaciones.areaOrigen',
                'historialDerivaciones.areaDestino',
            ])
            ->where('area_id', $this->idAreaMesaPartes)
            ->whereIn('estado', ['pendiente', 'derivado', 'recepcionado'])
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('codigo_seguimiento', 'like', "%{$buscar}%")
                        ->orWhereHas('solicitanteExterno', fn ($q) => $q->where('nombre_razon_social', 'like', "%{$buscar}%")->orWhere('numero_documento', 'like', "%{$buscar}%"))
                        ->orWhereHas('tramite', fn ($q) => $q->where('nombre', 'like', "%{$buscar}%"));
                });
            })
            ->orderByDesc('fecha_solicitud')
            ->paginate(15)
            ->withQueryString();

        if ($request->wantsJson() && !$request->hasHeader('X-Inertia')) {
            return response()->json($solicitudes);
        }

        return Inertia::render('GestionDocumentaria/BandejaMesaPartes', [
            'solicitudes' => $solicitudes,
            'areas'       => Area::where('estado', 'Activo')->orderBy('nombre')->get(['id', 'nombre']),
            'filtros'     => ['buscar' => $buscar],
        ]);
    }

    /**
     * BANDEJA 2: Por Área (Secretaría Académica, Tesorería, etc. atienden lo derivado a sus áreas).
     */
    public function porMiArea(Request $request): Response|JsonResponse
    {
        $user = Auth::user();

        // Obtener áreas asignadas al usuario (Principal + Adicionales)
        $areaIds = $user->areas()->pluck('areas.id')->toArray();
        if ($user->id_area && !in_array($user->id_area, $areaIds)) {
            $areaIds[] = $user->id_area;
        }

        $buscar = trim((string) $request->input('buscar', ''));
        $estado = trim((string) $request->input('estado', ''));

        $solicitudes = SolicitudTramite::porAreas($areaIds)
            ->with([
                'tramite',
                'area',
                'responsable',
                'solicitanteExterno',
                'postulante',
                'personal',
                'archivosRequisitos.requisito',
                'historialDerivaciones.areaOrigen',
                'historialDerivaciones.areaDestino',
                'historialDerivaciones.usuario',
            ])
            ->when($request->boolean('solo_sin_asignar'), fn ($q) => $q->sinAsignar())
            ->when($estado !== '', fn ($q) => $q->where('estado', $estado))
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('codigo_seguimiento', 'like', "%{$buscar}%")
                        ->orWhereHas('tramite', fn ($q) => $q->where('nombre', 'like', "%{$buscar}%"))
                        ->orWhereHas('solicitanteExterno', fn ($q) => $q->where('nombre_razon_social', 'like', "%{$buscar}%")->orWhere('numero_documento', 'like', "%{$buscar}%"));
                });
            })
            ->orderByDesc('prioridad')
            ->orderByDesc('fecha_solicitud')
            ->paginate(15)
            ->withQueryString();

        if ($request->wantsJson() && !$request->hasHeader('X-Inertia')) {
            return response()->json($solicitudes);
        }

        return Inertia::render('GestionDocumentaria/BandejaArea', [
            'solicitudes' => $solicitudes,
            'areas'       => Area::where('estado', 'Activo')->orderBy('nombre')->get(['id', 'nombre']),
            'filtros'     => ['buscar' => $buscar, 'estado' => $estado],
        ]);
    }

    /**
     * BANDEJA 3: Mis Asignadas (Trámites tomados puntualmente por el usuario).
     */
    public function misAsignadas(Request $request): Response|JsonResponse
    {
        $solicitudes = SolicitudTramite::deResponsable(Auth::id())
            ->with([
                'tramite',
                'area',
                'postulante',
                'solicitanteExterno',
                'personal',
                'archivosRequisitos.requisito',
                'historialDerivaciones.areaOrigen',
                'historialDerivaciones.areaDestino',
            ])
            ->when($request->estado, fn ($q) => $q->where('estado', $request->estado))
            ->orderByDesc('prioridad')
            ->orderByDesc('fecha_solicitud')
            ->paginate(15);

        if ($request->wantsJson() && !$request->hasHeader('X-Inertia')) {
            return response()->json($solicitudes);
        }

        return Inertia::render('GestionDocumentaria/MisAsignadas', [
            'solicitudes' => $solicitudes,
            'areas'       => Area::where('estado', 'Activo')->orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }

    /**
     * AUDITORÍA Y BÚSQUEDA GENERAL DE EXPEDIENTES (Con Historial y Adjuntos).
     */
    public function expedientesIndex(Request $request): Response|JsonResponse
    {
        $buscar = trim((string) $request->input('buscar', ''));
        $estado = trim((string) $request->input('estado', ''));
        $areaId = $request->input('area_id');

        $solicitudes = SolicitudTramite::query()
            ->with([
                'tramite',
                'area',
                'responsable',
                'solicitanteExterno',
                'postulante',
                'personal',
                'archivosRequisitos.requisito',
                'historialDerivaciones.areaOrigen',
                'historialDerivaciones.areaDestino',
                'historialDerivaciones.usuario',
            ])
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('codigo_seguimiento', 'like', "%{$buscar}%")
                        ->orWhereHas('tramite', fn ($q) => $q->where('nombre', 'like', "%{$buscar}%"))
                        ->orWhereHas('solicitanteExterno', fn ($q) => $q->where('nombre_razon_social', 'like', "%{$buscar}%")->orWhere('numero_documento', 'like', "%{$buscar}%"));
                });
            })
            ->when($estado !== '', fn ($q) => $q->where('estado', $estado))
            ->when(filled($areaId), fn ($q) => $q->where('area_id', $areaId))
            ->orderByDesc('fecha_solicitud')
            ->paginate(15)
            ->withQueryString();

        if ($request->wantsJson() && !$request->hasHeader('X-Inertia')) {
            return response()->json($solicitudes);
        }

        return Inertia::render('GestionDocumentaria/ExpedientesIndex', [
            'solicitudes' => $solicitudes,
            'areas'       => Area::where('estado', 'Activo')->orderBy('nombre')->get(['id', 'nombre']),
            'filtros'     => [
                'buscar'  => $buscar,
                'estado'  => $estado,
                'area_id' => $areaId,
            ],
        ]);
    }

    /**
     * REGISTRO DE SOLICITUD: Pública o Interna.
     * Asigna automáticamente el ingreso a Mesa de Partes General (area_id = 1).
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'tipo_solicitante' => ['required', Rule::in(['postulante', 'externo', 'personal'])],
            'tramite_id'       => ['required', 'exists:tramites,id'],
            'prioridad'        => ['nullable', Rule::in(['baja', 'media', 'alta'])],
            'archivo'          => ['nullable', 'file', 'max:10240'],

            // Requeridos según tipo
            'postulante_id'           => ['required_if:tipo_solicitante,postulante', 'nullable', 'exists:postulantes,id_postulante'],
            'solicitante_personal_id' => ['required_if:tipo_solicitante,personal', 'nullable', 'exists:personal,id'],

            // Datos de solicitante externo
            'tipo_documento'       => ['required_if:tipo_solicitante,externo', 'nullable', Rule::in(['DNI', 'RUC', 'CE', 'PASAPORTE'])],
            'numero_documento'     => ['required_if:tipo_solicitante,externo', 'nullable', 'string', 'max:20'],
            'nombre_razon_social'  => ['required_if:tipo_solicitante,externo', 'nullable', 'string', 'max:255'],
            'email'                => ['required_if:tipo_solicitante,externo', 'nullable', 'email', 'max:100'],
            'telefono'             => ['nullable', 'string', 'max:20'],
            'direccion'            => ['nullable', 'string', 'max:255'],

            // Archivos adjuntos por requisito
            'archivos'             => ['nullable', 'array'],
            'archivos.*'           => ['nullable', 'file', 'max:10240'],
        ]);

        return DB::transaction(function () use ($data, $request) {
            $solicitanteExternoId = null;

            if ($data['tipo_solicitante'] === 'externo') {
                $externo = SolicitanteExterno::firstOrCreate(
                    [
                        'tipo_documento'   => $data['tipo_documento'],
                        'numero_documento' => $data['numero_documento'],
                    ],
                    [
                        'nombre_razon_social' => $data['nombre_razon_social'],
                        'email'               => mb_strtolower(trim($data['email'])),
                        'telefono'            => $data['telefono'] ?? null,
                        'direccion'           => $data['direccion'] ?? null,
                    ]
                );
                $solicitanteExternoId = $externo->id;
            }

            $tramite = Tramite::findOrFail($data['tramite_id']);

            $archivoPath = $request->hasFile('archivo')
                ? $request->file('archivo')->store('tramites', 'public')
                : null;

            $solicitud = SolicitudTramite::create([
                'tipo_solicitante'        => $data['tipo_solicitante'],
                'postulante_id'           => $data['postulante_id'] ?? null,
                'solicitante_externo_id'  => $solicitanteExternoId,
                'solicitante_personal_id' => $data['solicitante_personal_id'] ?? null,
                'tramite_id'              => $tramite->id,
                'area_id'                 => $this->idAreaMesaPartes,
                'estado'                  => 'pendiente',
                'prioridad'               => $data['prioridad'] ?? 'media',
                'archivo'                 => $archivoPath,
                'fecha_solicitud'         => now(),
            ]);

            if ($request->hasFile('archivos')) {
                foreach ($request->file('archivos') as $requisitoId => $fileObj) {
                    if ($fileObj && $fileObj->isValid()) {
                        $path = $fileObj->store("tramites/requisitos/{$solicitud->id}", 'public');
                        SolicitudRequisitoArchivo::create([
                            'solicitud_id'    => $solicitud->id,
                            'requisito_id'    => is_numeric($requisitoId) ? (int)$requisitoId : null,
                            'archivo_ruta'    => $path,
                            'nombre_original' => $fileObj->getClientOriginalName(),
                        ]);
                    }
                }
            }

            if ($request->wantsJson()) {
                return response()->json([
                    'message'            => 'Solicitud registrada correctamente.',
                    'solicitud'          => $solicitud->fresh(['tramite', 'area']),
                    'codigo_seguimiento' => $solicitud->codigo_seguimiento,
                ], 201);
            }

            return redirect()->route('solicitud-externa.seguimiento', $solicitud->codigo_seguimiento)
                ->with('success', 'Solicitud registrada con éxito. Código: ' . $solicitud->codigo_seguimiento);
        });
    }

    /**
     * DERIVAR EXPEDIENTE: Transfiere el expediente a otra área adjuntando informe/proveído.
     */
    public function derivar(Request $request, SolicitudTramite $solicitud)
    {
        $datos = $request->validate([
            'area_destino_id' => ['required', 'integer', 'exists:areas,id'],
            'observacion'     => ['nullable', 'string', 'max:1000'],
            'comentarios'     => ['nullable', 'string', 'max:1000'],
            'archivo'         => ['nullable', 'file', 'mimes:pdf,jpg,png,doc,docx', 'max:10240'],
        ]);

        try {
            DB::transaction(function () use ($request, $solicitud, $datos) {
                $usuario = Auth::user();
                $areaOrigenId = $solicitud->area_id ?? $this->idAreaMesaPartes;

                $rutaArchivo = null;
                if ($request->hasFile('archivo')) {
                    $rutaArchivo = $request->file('archivo')->store("tramites/derivaciones/{$solicitud->id}", 'public');
                }

                // 1. Crear registro en historial_derivaciones con adjunto de área
                HistorialDerivacion::create([
                    'solicitud_id'          => $solicitud->id,
                    'area_origen_id'        => $areaOrigenId,
                    'area_destino_id'       => $datos['area_destino_id'],
                    'fecha_derivacion'      => now(),
                    'estado_en_origen'      => 'derivado',
                    'estado_en_destino'     => 'pendiente',
                    'observacion'           => $datos['observacion'] ?? null,
                    'comentarios'           => $datos['comentarios'] ?? null,
                    'usuario_id'            => $usuario->id,
                    'responsable_origen_id' => $usuario->id,
                    'archivo_derivacion'    => $rutaArchivo,
                ]);

                // 2. Reubicar la solicitud al área destino
                $solicitud->update([
                    'area_id'        => $datos['area_destino_id'],
                    'responsable_id' => null, // Queda disponible para asignación en el área destino
                    'estado'         => 'derivado',
                ]);
            });

            if ($request->wantsJson()) {
                return response()->json(['message' => 'El expediente ha sido derivado correctamente.']);
            }

            return back()->with('success', 'El expediente ha sido derivado correctamente.');
        } catch (Throwable $e) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Error al derivar el expediente.', 'error' => $e->getMessage()], 500);
            }
            return back()->with('error', 'Error al derivar el expediente.');
        }
    }

    /**
     * ASIGNARME: Un responsable toma la solicitud para atenderla.
     */
    public function asignarme(SolicitudTramite $solicitud)
    {
        $user = Auth::user();
        $areaIds = $user->areas()->pluck('areas.id')->toArray();
        if ($user->id_area) {
            $areaIds[] = $user->id_area;
        }

        abort_unless(in_array($solicitud->area_id, $areaIds), 403, 'No tienes acceso a esta área.');
        abort_if($solicitud->responsable_id !== null, 409, 'La solicitud ya tiene un responsable asignado.');

        $solicitud->update([
            'responsable_id' => $user->id,
            'estado'         => 'en_proceso',
        ]);

        return response()->json([
            'message'   => 'Solicitud asignada a ti correctamente.',
            'solicitud' => $solicitud->fresh(['area', 'responsable']),
        ]);
    }

   /**
     * RESOLVER / ATENDER: Finaliza la solicitud (Completado / Rechazado con Sustento) y envía Mailable.
     */
    public function resolver(Request $request, SolicitudTramite $solicitud)
    {
        $data = $request->validate([
            'estado'         => ['required', Rule::in(['en_proceso', 'completado', 'rechazado'])],
            'motivo_rechazo' => ['required_if:estado,rechazado', 'nullable', 'string', 'max:1000'],
            'archivo'        => ['nullable', 'file', 'mimes:pdf,jpg,png,doc,docx', 'max:10240'],
        ]);

        $archivoPath = $solicitud->archivo;
        if ($request->hasFile('archivo')) {
            $archivoPath = $request->file('archivo')->store("tramites/resoluciones/{$solicitud->id}", 'public');
        }

        $solicitud->update([
            'estado'           => $data['estado'],
            'motivo_rechazo'   => $data['motivo_rechazo'] ?? null,
            'fecha_resolucion' => in_array($data['estado'], ['completado', 'rechazado']) ? now() : null,
            'responsable_id'   => Auth::id(),
            'archivo'          => $archivoPath,
        ]);

        // Cargar relaciones para identificar al solicitante y su correo
        $solicitud->load(['tramite', 'solicitanteExterno', 'postulante', 'personal']);

        $emailDestino = match ($solicitud->tipo_solicitante) {
            'externo'    => $solicitud->solicitanteExterno?->email,
            'postulante' => $solicitud->postulante?->email,
            'personal'   => $solicitud->personal?->email,
            default      => null,
        };

        // Enviar Mailable al finalizar o rechazar
        if ($emailDestino && in_array($data['estado'], ['completado', 'rechazado'])) {
            try {
                Mail::to($emailDestino)->send(new SolicitudFinalizadaMail($solicitud));
            } catch (Throwable $e) {
                logger()->error("No se pudo enviar correo de finalización: " . $e->getMessage());
            }
        }

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Solicitud actualizada correctamente.', 'solicitud' => $solicitud]);
        }

        return back()->with('success', 'Solicitud actualizada correctamente.');
    }

    /**
     * CONSULTA PÚBLICA / VISTA DE SEGUIMIENTO (Por Código de Seguimiento).
     */
    public function seguimiento(Request $request, ?string $codigo = null)
    {
        $codigoBusqueda = $codigo ?? $request->input('codigo');
        $solicitudData = null;

        if ($codigoBusqueda) {
            $solicitud = SolicitudTramite::with([
                'tramite',
                'area',
                'solicitanteExterno',
                'postulante',
                'personal',
                'archivosRequisitos.requisito',
                'historialDerivaciones.areaOrigen',
                'historialDerivaciones.areaDestino',
                'historialDerivaciones.usuario',
            ])
            ->where('codigo_seguimiento', trim($codigoBusqueda))
            ->first();

            if ($solicitud) {
                $solicitudData = [
                    'codigo_seguimiento' => $solicitud->codigo_seguimiento,
                    'tramite'            => $solicitud->tramite?->nombre,
                    'solicitante'        => $solicitud->solicitante_nombre,
                    'estado'             => $solicitud->estado,
                    'prioridad'          => $solicitud->prioridad,
                    'area_actual'        => $solicitud->area?->nombre ?? 'Mesa de Partes General',
                    'fecha_solicitud'    => $solicitud->fecha_solicitud?->format('d/m/Y H:i'),
                    'fecha_resolucion'   => $solicitud->fecha_resolucion?->format('d/m/Y H:i'),
                    'motivo_rechazo'     => $solicitud->motivo_rechazo,
                    'archivo_resolucion' => $solicitud->archivo,
                    'archivos'           => $solicitud->archivosRequisitos->map(fn ($adj) => [
                        'id'              => $adj->id,
                        'requisito'       => $adj->requisito?->descripcion ?? 'Documento Adjunto',
                        'nombre_original' => $adj->nombre_original,
                        'ruta'            => $adj->archivo_ruta,
                    ]),
                    'historial'          => $solicitud->historialDerivaciones->map(fn ($h) => [
                        'id'                 => $h->id,
                        'area_origen'        => $h->areaOrigen?->nombre ?? 'Mesa de Partes General',
                        'area_destino'       => $h->areaDestino?->nombre ?? 'Área Destino',
                        'fecha_derivacion'   => $h->fecha_derivacion ? date('d/m/Y H:i', strtotime($h->fecha_derivacion)) : null,
                        'observacion'        => $h->observacion,
                        'archivo_derivacion' => $h->archivo_derivacion,
                    ]),
                ];
            }
        }

        if ($request->wantsJson() && !$request->hasHeader('X-Inertia')) {
            return $solicitudData
                ? response()->json($solicitudData)
                : response()->json(['message' => 'No se encontró la solicitud.'], 404);
        }

        return Inertia::render('Public/SolicitudExterna/Seguimiento', [
            'codigoInicial' => $codigoBusqueda ?? '',
            'solicitud'     => $solicitudData,
        ]);
    }

    /**
     * DETALLE COMPLETO DE EXPEDIENTE.
     */
    public function show(SolicitudTramite $solicitud)
    {
        return response()->json(
            $solicitud->load([
                'tramite.requisitos',
                'area',
                'responsable',
                'postulante',
                'solicitanteExterno',
                'personal',
                'archivosRequisitos.requisito',
                'historialDerivaciones.areaOrigen',
                'historialDerivaciones.areaDestino',
                'historialDerivaciones.usuario',
            ])
        );
    }
}