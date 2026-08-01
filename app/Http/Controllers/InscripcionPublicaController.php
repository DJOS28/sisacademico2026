<?php

namespace App\Http\Controllers;

use App\Models\Admision;
use App\Models\Inscripcion;
use App\Models\PlanEstudio;
use App\Models\Postulante;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class InscripcionPublicaController extends Controller
{
    /**
     * Muestra el formulario público de inscripción.
     */
    public function create(?int $admisionId = null): Response
    {
        $admisiones = Admision::query()
            ->where('activo', 1)
            ->with([
                'requisitos',
                'tiposPago' => function ($query) {
                    $query->where('tipo_pago.activo', 1);
                },
            ])
            ->orderByDesc('inicio_proceso')
            ->get();

        $planesEstudio = PlanEstudio::query()
            ->where('activo', 1)
            ->select('id', 'nombre', 'codigo')
            ->orderBy('nombre')
            ->get();

        return Inertia::render('Public/InscripcionForm', [
            'admisiones' => $admisiones,
            'planesEstudio' => $planesEstudio,
            'admisionSeleccionadaId' => $admisionId,
        ]);
    }

    /**
     * Registra al postulante y su inscripción pública.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            // Proceso y Carrera
            'id_admision' => ['required', 'integer', 'exists:admisiones,id_admision'],
            'id_plan' => ['required', 'integer', 'exists:planes_estudio,id'],
            'segunda_opcion' => ['nullable', 'string', 'max:100'],

            // Datos Personales del Postulante
            'nombres' => ['required', 'string', 'max:100'],
            'apellidos' => ['required', 'string', 'max:100'],
            'dni' => ['required', 'string', 'max:15', 'unique:postulantes,dni'],
            'email' => ['required', 'email', 'max:100', 'unique:postulantes,email'],
            'telefono' => ['required', 'string', 'max:15'],
            'genero' => ['nullable', 'string', 'max:15'],
            'fecha_nacimiento' => ['nullable', 'date'],
            'direccion' => ['nullable', 'string', 'max:100'],

            // Archivos de Requisitos / Pago
            'copia_dni' => ['nullable', 'file', 'mimes:pdf,jpg,png', 'max:4096'],
            'certificado_estudios' => ['nullable', 'file', 'mimes:pdf,jpg,png', 'max:4096'],
            'partida_nacimiento' => ['nullable', 'file', 'mimes:pdf,jpg,png', 'max:4096'],
            'comprobante_pago' => ['nullable', 'file', 'mimes:pdf,jpg,png', 'max:4096'],
            'id_medio_pago' => ['nullable', 'integer', 'exists:tipo_pago,id_tipo_pago'],
        ], [
            'dni.unique' => 'El DNI ingresado ya se encuentra registrado en el sistema.',
            'email.unique' => 'El correo electrónico ya se encuentra registrado.',
            'id_admision.required' => 'Seleccione un proceso de admisión.',
            'id_plan.required' => 'Seleccione la carrera a la que desea postular.',
        ]);

        DB::transaction(function () use ($request, $datos) {
            // 1. Procesar archivos si existen
            $archivos = [];
            foreach (['copia_dni', 'certificado_estudios', 'partida_nacimiento', 'comprobante_pago'] as $campoFile) {
                if ($request->hasFile($campoFile)) {
                    $archivos[$campoFile] = $request->file($campoFile)->store('postulantes/requisitos', 'public');
                }
            }

            // 2. Generar Código de Postulante único
            $ultimoId = Postulante::max('id_postulante') ?? 0;
            $codigoPostulante = 'POST-' . date('Y') . '-' . str_pad((string) ($ultimoId + 1), 4, '0', STR_PAD_LEFT);

            // 3. Crear Postulante
            $postulante = Postulante::create(array_merge($datos, $archivos, [
                'codigo_postulante' => $codigoPostulante,
                'grado' => 'Postulante',
            ]));

            // 4. Crear Registro de Inscripción
            Inscripcion::create([
                'id_admision' => $datos['id_admision'],
                'id_postulante' => $postulante->id_postulante,
                'id_plan' => $datos['id_plan'],
                'segunda_opcion' => $datos['segunda_opcion'] ?? null,
                'estado' => 'inscrito',
                'fecha_registro' => now(),
            ]);
        });

        // 🟢 Retornamos a la misma vista enviando la notificación de éxito
        return back()->with('success', 'Tu inscripción ha sido registrada con éxito. Estaremos revisando tus documentos.');
    }
}