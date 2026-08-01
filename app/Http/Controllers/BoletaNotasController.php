<?php

namespace App\Http\Controllers;

use App\Models\Postulante;
use App\Models\Matricula;
use App\Models\MatriculaCurso;
use App\Models\Periodo;
use App\Models\NotaFinal;
use App\Models\Instituto;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\URL;
use Barryvdh\DomPDF\Facade\Pdf;

class BoletaNotasController extends Controller
{
    public function index(): Response
    {
        $periodoActivo = Periodo::where('activo', 1)->first();

        return Inertia::render('Boletas/Index', [
            'periodoActivo' => $periodoActivo,
        ]);
    }

    /**
     * Consulta la matrícula y el récord de notas del alumno en el periodo activo.
     */
    public function buscarConsolidado(Request $request): JsonResponse
    {
        $request->validate([
            'dni'        => 'required|string',
            'periodo_id' => 'required|integer|exists:periodos,id',
        ]);

        $dni       = trim($request->input('dni'));
        $periodoId = $request->input('periodo_id');

        $estudiante = Postulante::select('id_postulante', 'nombres', 'apellidos', 'dni')
            ->where('dni', $dni)
            ->first();

        if (!$estudiante) {
            return response()->json([
                'encontrado' => false,
                'mensaje'    => 'No se encontró ningún estudiante con el DNI ingresado.',
            ]);
        }

        $matricula = Matricula::where('postulante_id', $estudiante->id_postulante)
            ->where('periodo_id', $periodoId)
            ->first();

        if (!$matricula) {
            return response()->json([
                'encontrado'  => true,
                'matriculado' => false,
                'mensaje'     => 'El estudiante no cuenta con matrícula registrada en el periodo activo.',
                'estudiante'  => $estudiante,
            ]);
        }

        // Obtener asignaturas, agrupar/filtrar duplicados y adjuntar la nota final
        $cursos = MatriculaCurso::with('curso:id,nombre,creditos')
            ->where('matricula_id', $matricula->id)
            ->get()
            ->unique('curso_id') // EVITA DUPLICADOS POR ID DE CURSO
            ->map(function ($det) use ($estudiante, $periodoId) {
                // Consultar nota final si existe
                $notaFinal = NotaFinal::where('estudiante_id', $estudiante->id_postulante)
                    ->where('curso_id', $det->curso_id)
                    ->where('id_periodo', $periodoId)
                    ->first();

                return [
                    'curso_id' => $det->curso_id,
                    'nombre'   => $det->curso?->nombre ?? '---',
                    'creditos' => $det->curso?->creditos ?? 0,
                    'estado'   => $det->estado,
                    'promedio' => $notaFinal ? $notaFinal->promedio : null,
                ];
            })
            ->values(); // Reindexar el array para evitar claves no consecutivas en JSON

        // 🔒 Generar URL firmada temporal (válida por 30 minutos)
        $urlPdf = URL::temporarySignedRoute(
            'boleta_notas.pdf',
            now()->addMinutes(30),
            [
                'estudiante_id' => $estudiante->id_postulante,
                'periodo_id'    => $periodoId,
            ]
        );

        return response()->json([
            'encontrado'   => true,
            'matriculado'  => true,
            'estudiante'   => $estudiante,
            'matricula_id' => $matricula->id,
            'cursos'       => $cursos,
            'url_pdf'      => $urlPdf, // 👈 URL segura para el botón de imprimir en React
        ]);
    }

    /**
     * Genera el PDF de la Boleta de Notas con membrete completo.
     */
    public function generarPdf(Request $request)
    {
        // 1. Validar la firma criptográfica de la URL
        if (!$request->hasValidSignature()) {
            abort(403, 'El enlace de descarga es inválido o ha expirado.');
        }

        $request->validate([
            'estudiante_id' => 'required|integer',
            'periodo_id'    => 'required|integer',
        ]);

        $user = auth()->user();

        // 2. Control de Autorización (Usa tieneRol() y el perfil asociado)
        if ($user->tieneRol('Estudiante') && $user->postulante?->id_postulante != $request->estudiante_id) {
            abort(403, 'No tiene permisos para consultar la boleta de este estudiante.');
        }

        $estudiante = Postulante::findOrFail($request->estudiante_id);
        $periodo    = Periodo::findOrFail($request->periodo_id);

        // Cargar Instituto con ubicación geográfica completa
        $instituto = Instituto::with('distrito.provincia.departamento')->first();

        // Procesar Logo a Base64 para DomPDF
        $imagenBase64 = null;
        if ($instituto && !empty($instituto->logo) && file_exists(public_path('storage/' . $instituto->logo))) {
            $path = public_path('storage/' . $instituto->logo);
            $type = pathinfo($path, PATHINFO_EXTENSION);
            $data = file_get_contents($path);
            $imagenBase64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
        }

        $matricula = Matricula::where('postulante_id', $estudiante->id_postulante)
            ->where('periodo_id', $periodo->id)
            ->firstOrFail();

        // Obtener asignaturas únicas sin duplicados
        $cursos = MatriculaCurso::with('curso')
            ->where('matricula_id', $matricula->id)
            ->get()
            ->unique('curso_id')
            ->map(function ($det) use ($estudiante, $periodo) {
                $notaFinal = NotaFinal::where('estudiante_id', $estudiante->id_postulante)
                    ->where('curso_id', $det->curso_id)
                    ->where('id_periodo', $periodo->id)
                    ->first();

                return [
                    'nombre'   => $det->curso?->nombre ?? '---',
                    'creditos' => $det->curso?->creditos ?? 0,
                    'estado'   => $det->estado,
                    'promedio' => $notaFinal ? $notaFinal->promedio : 'S/N',
                ];
            })
            ->values();

        $pdf = Pdf::loadView('pdf.boleta_notas', [
            'estudiante'   => $estudiante,
            'periodo'      => $periodo,
            'instituto'    => $instituto,
            'imagenBase64' => $imagenBase64,
            'cursos'       => $cursos,
        ]);

        return $pdf->stream("Boleta_Notas_{$estudiante->dni}.pdf");
    }
}