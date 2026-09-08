<?php

namespace App\Http\Controllers;

use App\Mail\SolicitudAceptadaMesaPartesMail;
use App\Mail\SolicitudRecibidaMesaPartesMail;
use App\Models\SolicitanteExterno;
use App\Models\SolicitudRequisitoArchivo;
use App\Models\SolicitudTramite;
use App\Models\Tramite;
use App\Services\DeColectaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SolicitudExternaController extends Controller
{
    protected DeColectaService $deColectaService;

    // Inyección de dependencia automática del servicio DeColecta
    public function __construct(DeColectaService $deColectaService)
    {
        $this->deColectaService = $deColectaService;
    }

    /**
     * Formulario público de registro de solicitud.
     */
    public function create()
    {
        return Inertia::render('Public/SolicitudExterna/Create', [
            'tramites' => Tramite::query()
                ->where('estado', 'Activo')
                ->with('requisitos:id,descripcion')
                ->orderBy('nombre')
                ->get(['id', 'nombre', 'descripcion', 'costo', 'tiempo']),
        ]);
    }

    /**
     * Consultar DNI en RENIEC vía DeColectaService (AJAX).
     */
    public function consultarDni(string $dni): JsonResponse
    {
        if (strlen($dni) !== 8 || !ctype_digit($dni)) {
            return response()->json([
                'success' => false,
                'message' => 'El DNI debe contener exactamente 8 dígitos numéricos.',
            ], 422);
        }

        $resultado = $this->deColectaService->consultarDni($dni);
        return response()->json($resultado, $resultado['success'] ? 200 : 400);
    }

    /**
     * Consultar RUC en SUNAT vía DeColectaService (AJAX).
     */
    public function consultarRuc(string $ruc): JsonResponse
    {
        if (strlen($ruc) !== 11 || !ctype_digit($ruc)) {
            return response()->json([
                'success' => false,
                'message' => 'El RUC debe contener exactamente 11 dígitos numéricos.',
            ], 422);
        }

        $resultado = $this->deColectaService->consultarRuc($ruc);
        return response()->json($resultado, $resultado['success'] ? 200 : 400);
    }

    /**
     * Registrar la solicitud externa en la base de datos.
     * Envía un correo inicial notificando la recepción previa en Mesa de Partes.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'tramite_id'          => ['required', 'exists:tramites,id'],
            'tipo_documento'      => ['required', Rule::in(['DNI', 'RUC', 'CE', 'PASAPORTE'])],
            'numero_documento'    => ['required', 'string', 'max:20'],
            'nombre_razon_social' => ['required', 'string', 'max:255'],
            'email'               => ['required', 'email', 'max:100'],
            'telefono'            => ['nullable', 'string', 'max:20'],
            'direccion'           => ['nullable', 'string', 'max:255'],

            // Datos obligatorios solo si el tipo de documento es RUC
            'rep_legal_dni'     => ['required_if:tipo_documento,RUC', 'nullable', 'string', 'max:20'],
            'rep_legal_nombres' => ['required_if:tipo_documento,RUC', 'nullable', 'string', 'max:255'],
            'rep_legal_cargo'   => ['nullable', 'string', 'max:100'],

            // Archivos adjuntos
            'archivo'    => ['nullable', 'file', 'mimes:pdf,jpg,png', 'max:10240'],
            'archivos'   => ['nullable', 'array'],
            'archivos.*' => ['file', 'mimes:pdf,jpg,png', 'max:10240'],
        ], [
            'rep_legal_dni.required_if'     => 'El DNI del representante legal es obligatorio para empresas (RUC).',
            'rep_legal_nombres.required_if' => 'Los nombres del representante legal son obligatorios para empresas (RUC).',
        ]);

        $tramite = Tramite::where('estado', 'Activo')->findOrFail($data['tramite_id']);

        $solicitud = DB::transaction(function () use ($data, $request, $tramite) {
            // 1. Crear o actualizar los datos del Solicitante Externo
            $externo = SolicitanteExterno::updateOrCreate(
                [
                    'tipo_documento'   => $data['tipo_documento'],
                    'numero_documento' => $data['numero_documento'],
                ],
                [
                    'nombre_razon_social' => $data['nombre_razon_social'],
                    'rep_legal_dni'       => $data['tipo_documento'] === 'RUC' ? ($data['rep_legal_dni'] ?? null) : null,
                    'rep_legal_nombres'   => $data['tipo_documento'] === 'RUC' ? ($data['rep_legal_nombres'] ?? null) : null,
                    'rep_legal_cargo'     => $data['tipo_documento'] === 'RUC' ? ($data['rep_legal_cargo'] ?? null) : null,
                    'email'               => $data['email'],
                    'telefono'            => $data['telefono'] ?? null,
                    'direccion'           => $data['direccion'] ?? null,
                ]
            );

            // 2. Guardar archivo principal único si existiera
            $archivoPath = $request->hasFile('archivo')
                ? $request->file('archivo')->store('tramites/externos', 'public')
                : null;

            // 3. Crear el registro principal de la solicitud
            $nuevaSolicitud = SolicitudTramite::create([
                'tipo_solicitante'       => 'externo',
                'solicitante_externo_id' => $externo->id,
                'tramite_id'             => $tramite->id,
                'area_id'                => 1, // Asignado inicialmente a Mesa de Partes General
                'estado'                 => 'pendiente',
                'prioridad'              => 'media',
                'archivo'                => $archivoPath,
                'fecha_solicitud'        => now(),
            ]);

            // 4. Guardar múltiples archivos mapeados por id de requisito si fueron enviados
            if ($request->hasFile('archivos')) {
                foreach ($request->file('archivos') as $requisitoId => $fileObj) {
                    if ($fileObj && $fileObj->isValid()) {
                        $path = $fileObj->store("tramites/expedientes/{$nuevaSolicitud->id}", 'public');
                        SolicitudRequisitoArchivo::create([
                            'solicitud_id'    => $nuevaSolicitud->id,
                            'requisito_id'    => $requisitoId,
                            'archivo_ruta'    => $path,
                            'nombre_original' => $fileObj->getClientOriginalName(),
                        ]);
                    }
                }
            }

            return $nuevaSolicitud;
        });

        // 5. ENVIAR CORREO DE CONFIRMACIÓN DE RECEPCIÓN PREVIA
        $emailDestino = $solicitud->externo?->email ?? $solicitud->solicitanteExterno?->email;
        if ($emailDestino) {
            try {
                Mail::to($emailDestino)->send(new SolicitudRecibidaMesaPartesMail($solicitud));
            } catch (\Exception $e) {
                logger()->error("No se pudo enviar correo de recepción: " . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Tu solicitud fue recibida correctamente. Se envió una confirmación a tu correo electrónico. Mesa de Partes revisará tu documentación.',
        ], 201);
    }

    /**
     * Acción ejecutada por el responsable de Mesa de Partes para ACEPTAR/APROBAR la solicitud.
     * En este punto se envía el segundo correo con el CÓDIGO DE SEGUIMIENTO.
     */
    public function aceptarMesaPartes($id)
    {
        $solicitud = SolicitudTramite::with(['externo', 'solicitanteExterno', 'tramite'])->findOrFail($id);

        if ($solicitud->estado !== 'pendiente') {
            return back()->withErrors(['error' => 'Esta solicitud ya ha sido procesada o aceptada anteriormente.']);
        }

        DB::transaction(function () use ($solicitud) {
            $solicitud->update([
                'estado'         => 'procesado',
                'responsable_id' => auth()->id(),
            ]);
        });

        // ENVIAR EL SEGUNDO CORREO CON EL CÓDIGO DE SEGUIMIENTO OFICIAL
        $emailDestino = $solicitud->externo?->email ?? $solicitud->solicitanteExterno?->email;
        if ($emailDestino) {
            try {
                Mail::to($emailDestino)->send(new SolicitudAceptadaMesaPartesMail($solicitud));
            } catch (\Exception $e) {
                logger()->error("No se pudo enviar correo con código de seguimiento: " . $e->getMessage());
            }
        }

        return back()->with('success', 'Solicitud aceptada correctamente. Se envió el código de seguimiento al usuario.');
    }

    /**
     * Consulta pública del estado por código de seguimiento.
     */
   /**
 * Vista pública y seguimiento de expediente por código.
 */
public function seguimiento(Request $request, ?string $codigo = null)
{
    $codigoBusqueda = $codigo ?? $request->input('codigo');
    $solicitudData = null;

    if ($codigoBusqueda) {
        $solicitud = SolicitudTramite::with([
            'tramite',
            'area',
            'externo',
            'solicitanteExterno',
            'archivosRequisitos.requisito',
            'historialDerivaciones.areaOrigen',
            'historialDerivaciones.areaDestino',
        ])
        ->where('codigo_seguimiento', trim($codigoBusqueda))
        ->first();

        if ($solicitud) {
            $solicitudData = [
                'codigo_seguimiento' => $solicitud->codigo_seguimiento,
                'tramite'            => $solicitud->tramite->nombre,
                'solicitante'        => $solicitud->solicitante_nombre,
                'estado'             => $solicitud->estado,
                'prioridad'          => $solicitud->prioridad,
                'area_actual'        => $solicitud->area?->nombre ?? 'Mesa de Partes General',
                'fecha_solicitud'    => $solicitud->fecha_solicitud?->format('d/m/Y H:i'),
                'fecha_resolucion'   => $solicitud->fecha_resolucion?->format('d/m/Y H:i'),
                'motivo_rechazo'     => $solicitud->motivo_rechazo,
                'archivos'           => $solicitud->archivosRequisitos->map(function ($adjunto) {
                    return [
                        'id'              => $adjunto->id,
                        'requisito'       => $adjunto->requisito?->descripcion ?? 'Documento Adjunto',
                        'nombre_original' => $adjunto->nombre_original,
                        'ruta'            => $adjunto->archivo_ruta,
                    ];
                }),
                'historial'          => $solicitud->historialDerivaciones->map(function ($h) {
                    return [
                        'id'               => $h->id,
                        'area_origen'      => $h->areaOrigen?->nombre ?? 'Mesa de Partes General',
                        'area_destino'     => $h->areaDestino?->nombre ?? 'Área Destino',
                        'fecha_derivacion' => $h->fecha_derivacion ? date('d/m/Y H:i', strtotime($h->fecha_derivacion)) : null,
                        'fecha_aceptacion' => $h->fecha_aceptacion ? date('d/m/Y H:i', strtotime($h->fecha_aceptacion)) : null,
                        'estado_origen'    => $h->estado_en_origen,
                        'estado_destino'   => $h->estado_en_destino,
                        'observacion'      => $h->observacion,
                        'comentarios'      => $h->comentarios,
                    ];
                }),
            ];
        }
    }

    return Inertia::render('Public/SolicitudExterna/Seguimiento', [
        'codigoInicial' => $codigoBusqueda ?? '',
        'solicitud'     => $solicitudData,
    ]);
}
}