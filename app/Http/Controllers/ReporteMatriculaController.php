<?php

namespace App\Http\Controllers;

use App\Models\Instituto;
use App\Models\Matricula;
use App\Models\Periodo;
use App\Models\PlanEstudio;
use App\Models\Semestre;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class ReporteMatriculaController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Reportes/Matriculados', [
            'periodos'  => Periodo::query()->where('activo', 1)->select('id', 'nombre')->get(),
            'semestres' => Semestre::query()->select('id', 'nombre')->orderBy('id')->get(),
            'planes'    => PlanEstudio::query()->select('id', 'nombre', 'codigo')->get(),
        ]);
    }

    public function obtenerMatriculadosAjax(Request $request): JsonResponse
    {
        $periodoId  = $request->input('periodo_id');
        $semestreId = $request->input('semestre_id');
        $planId     = $request->input('plan_estudio_id');

        if (!$periodoId || !$semestreId || !$planId) {
            return response()->json(['matriculados' => []]);
        }

        $matriculados = Matricula::query()
            ->where('periodo_id', $periodoId)
            ->where('semestre_id', $semestreId)
            ->where('plan_estudio_id', $planId)
            ->where('estado', 'Matriculado')
            ->with(['postulante:id_postulante,codigo_postulante,nombres,apellidos,dni,email,telefono'])
            ->get()
            ->map(function ($m) {
                return [
                    'id'               => $m->id,
                    'codigo_matricula' => $m->codigo_matricula,
                    'fecha_matricula'  => $m->fecha_matricula,
                    'codigo_alumno'    => $m->postulante?->codigo_postulante,
                    'dni'              => $m->postulante?->dni,
                    'nombres'          => $m->postulante?->nombres,
                    'apellidos'        => $m->postulante?->apellidos,
                    'email'            => $m->postulante?->email,
                    'telefono'         => $m->postulante?->telefono,
                ];
            });

        return response()->json(['matriculados' => $matriculados]);
    }

    public function verPdf(Request $request): HttpResponse
    {
        $request->validate([
            'periodo_id'      => ['required', 'integer', 'exists:periodos,id'],
            'semestre_id'     => ['required', 'integer', 'exists:semestres,id'],
            'plan_estudio_id' => ['required', 'integer', 'exists:planes_estudio,id'],
        ]);

        // Información del Instituto y su ubicación geográfica
        $instituto = Instituto::with('distrito.provincia.departamento')->first();

        $periodo  = Periodo::findOrFail($request->periodo_id);
        $semestre = Semestre::findOrFail($request->semestre_id);
        $plan     = PlanEstudio::findOrFail($request->plan_estudio_id);

        // Mapeo a la estructura esperada por la plantilla Blade
        $estudiantes = Matricula::query()
            ->where('periodo_id', $periodo->id)
            ->where('semestre_id', $semestre->id)
            ->where('plan_estudio_id', $plan->id)
            ->where('estado', 'Matriculado')
            ->with('postulante')
            ->get()
            ->map(function ($m) {
                return [
                    'codigo'          => $m->postulante?->dni ?? $m->codigo_matricula,
                    'nombre_completo' => mb_strtoupper(($m->postulante?->apellidos ?? '') . ', ' . ($m->postulante?->nombres ?? '')),
                ];
            });

        // Convertir el logo a Base64
        $imagenBase64 = null;
        if ($instituto && $instituto->logo && file_exists(public_path('storage/' . $instituto->logo))) {
            $path = public_path('storage/' . $instituto->logo);
            $type = pathinfo($path, PATHINFO_EXTENSION);
            $data = file_get_contents($path);
            $imagenBase64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
        }

        $pdf = Pdf::loadView('pdf.reporte_matriculados', compact(
            'instituto',
            'periodo',
            'semestre',
            'plan',
            'estudiantes',
            'imagenBase64'
        ));

        return $pdf->stream("Reporte_Matriculados_{$plan->codigo}_{$semestre->nombre}.pdf");
    }
}