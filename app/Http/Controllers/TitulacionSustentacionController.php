<?php

namespace App\Http\Controllers;

use App\Models\Docente;
use App\Models\Instituto;
use App\Models\Titulacion;
use App\Models\TitulacionActa;
use App\Models\TitulacionJurado;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class TitulacionSustentacionController extends Controller
{
    /**
     * Listado principal de sustentaciones programadas y actas.
     */
    public function index(Request $request): Response
    {
        $buscar    = trim((string) $request->input('buscar', ''));
        $resultado = trim((string) $request->input('resultado', ''));

        $sustentaciones = Titulacion::query()
            ->with([
                'estudiante:id_postulante,dni,nombres,apellidos',
                'planEstudio:id,nombre,codigo',
                'modalidad:id,nombre',
                'jurados.docente:id,nombre,apellido',
                'acta',
            ])
            ->whereIn('estado', ['Apto_Sustentacion', 'Sustentado', 'Titulado'])
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('codigo_expediente', 'like', "%{$buscar}%")
                        ->orWhere('titulo_proyecto', 'like', "%{$buscar}%")
                        ->orWhereHas('estudiante', function ($q) use ($buscar) {
                            $q->where('dni', 'like', "%{$buscar}%")
                              ->orWhere('nombres', 'like', "%{$buscar}%")
                              ->orWhere('apellidos', 'like', "%{$buscar}%");
                        })
                        ->orWhereHas('acta', fn ($q) => $q->where('numero_acta', 'like', "%{$buscar}%"));
                });
            })
            ->when($resultado !== '', fn ($q) => $q->whereHas('acta', fn ($sub) => $sub->where('resultado', $resultado)))
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        $aptosSinProgramar = Titulacion::where('estado', 'Apto_Sustentacion')
            ->doesntHave('acta')
            ->with(['estudiante:id_postulante,dni,nombres,apellidos', 'planEstudio:id,nombre'])
            ->get();

        $docentes = Docente::select('id', 'nombre', 'apellido')->orderBy('apellido')->get();

        return Inertia::render('Titulacion/Sustentaciones/Index', [
            'sustentaciones'   => $sustentaciones,
            'aptosSinProgramar' => $aptosSinProgramar,
            'docentes'         => $docentes,
            'resultados'       => ['Aprobado_Unanimidad', 'Aprobado_Mayoria', 'Desaprobado'],
            'filtros'          => [
                'buscar'    => $buscar,
                'resultado' => $resultado,
            ],
        ]);
    }

    /**
     * Filtrado dinámico vía AJAX.
     */
    public function filtrar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'buscar'    => ['nullable', 'string', 'max:100'],
            'resultado' => ['nullable', 'string', 'in:Aprobado_Unanimidad,Aprobado_Mayoria,Desaprobado'],
            'page'      => ['nullable', 'integer', 'min:1'],
        ]);

        $buscar    = trim((string) ($datos['buscar'] ?? ''));
        $resultado = trim((string) ($datos['resultado'] ?? ''));
        $pagina    = (int) ($datos['page'] ?? 1);

        $sustentaciones = Titulacion::query()
            ->with([
                'estudiante:id_postulante,dni,nombres,apellidos',
                'planEstudio:id,nombre,codigo',
                'modalidad:id,nombre',
                'jurados.docente:id,nombre,apellido',
                'acta',
            ])
            ->whereIn('estado', ['Apto_Sustentacion', 'Sustentado', 'Titulado'])
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('codigo_expediente', 'like', "%{$buscar}%")
                        ->orWhere('titulo_proyecto', 'like', "%{$buscar}%")
                        ->orWhereHas('estudiante', function ($q) use ($buscar) {
                            $q->where('dni', 'like', "%{$buscar}%")
                              ->orWhere('nombres', 'like', "%{$buscar}%")
                              ->orWhere('apellidos', 'like', "%{$buscar}%");
                        })
                        ->orWhereHas('acta', fn ($q) => $q->where('numero_acta', 'like', "%{$buscar}%"));
                });
            })
            ->when($resultado !== '', fn ($q) => $q->whereHas('acta', fn ($sub) => $sub->where('resultado', $resultado)))
            ->orderByDesc('id')
            ->paginate(perPage: 10, columns: ['*'], pageName: 'page', page: $pagina);

        return response()->json(['sustentaciones' => $sustentaciones]);
    }

    /**
     * Registra o actualiza la mesa de jurados y el acta de sustentación.
     */
    public function guardarSustentacion(Request $request, Titulacion $titulacion): RedirectResponse
    {
        $datos = $request->validate([
            'fecha_sustentacion' => ['required', 'date'],
            'lugar_aula'         => ['required', 'string', 'max:100'],
            'nota_promedio'      => ['nullable', 'numeric', 'min:0', 'max:20'],
            'resultado'          => ['required', 'string', 'in:Aprobado_Unanimidad,Aprobado_Mayoria,Desaprobado'],
            'observaciones'      => ['nullable', 'string', 'max:1000'],
            'jurados'            => ['required', 'array', 'min:3'],
            'jurados.*.docente_id' => ['required', 'integer', 'exists:docentes,id'],
            'jurados.*.cargo'      => ['required', 'string', 'in:Presidente,Secretario,Vocal,Accesitario'],
        ], [
            'jurados.min' => 'Debe conformar un jurado evaluador de al menos 3 docentes (Presidente, Secretario y Vocal).',
        ]);

        // Validar que no se repitan docentes en la misma mesa
        $docentesIds = collect($datos['jurados'])->pluck('docente_id')->toArray();
        if (count($docentesIds) !== count(array_unique($docentesIds))) {
            return back()->withErrors(['jurados' => 'No puede asignar al mismo docente en más de un cargo de la mesa directiva.']);
        }

        DB::transaction(function () use ($datos, $titulacion) {
            // 1. Sincronizar jurados evaluadores
            $titulacion->jurados()->delete();
            foreach ($datos['jurados'] as $jurado) {
                TitulacionJurado::create([
                    'titulacion_id' => $titulacion->id,
                    'docente_id'    => $jurado['docente_id'],
                    'cargo'         => $jurado['cargo'],
                ]);
            }

            // 2. Generar correlativo del acta si es nueva
            $añoActual = date('Y');
            $numeroActa = 'ACTA-' . $añoActual . '-' . str_pad($titulacion->id, 5, '0', STR_PAD_LEFT);

            // 3. Crear o actualizar el acta
            TitulacionActa::updateOrCreate(
                ['titulacion_id' => $titulacion->id],
                [
                    'numero_acta'        => $numeroActa,
                    'fecha_sustentacion' => $datos['fecha_sustentacion'],
                    'lugar_aula'         => $datos['lugar_aula'],
                    'nota_promedio'      => $datos['nota_promedio'] ?? null,
                    'resultado'          => $datos['resultado'],
                    'observaciones'      => $datos['observaciones'] ?? null,
                    'created_at'         => now(),
                ]
            );

            // 4. Actualizar estado del expediente
            $nuevoEstado = $datos['resultado'] === 'Desaprobado' ? 'Observado' : 'Sustentado';
            $titulacion->update(['estado' => $nuevoEstado]);
        });

        return back()->with('success', 'Sustentación y acta registrada exitosamente.');
    }

    /**
     * Emite y visualiza el Acta Oficial de Sustentación en formato PDF.
     */
    public function emitirActaPdf(Titulacion $titulacion): HttpResponse
    {
        $titulacion->load([
            'estudiante',
            'planEstudio',
            'modalidad',
            'asesor',
            'jurados.docente',
            'acta',
        ]);

        if (! $titulacion->acta) {
            abort(404, 'Esta sustentación aún no cuenta con un acta registrada.');
        }

        $instituto = Instituto::with('distrito.provincia.departamento')->first();

        $imagenBase64 = null;
        if ($instituto && ! empty($instituto->logo) && file_exists(public_path('storage/' . $instituto->logo))) {
            $path = public_path('storage/' . $instituto->logo);
            $type = pathinfo($path, PATHINFO_EXTENSION);
            $data = file_get_contents($path);
            $imagenBase64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
        }

        $pdf = Pdf::loadView('pdf.acta_sustentacion', [
            'titulacion'   => $titulacion,
            'acta'         => $titulacion->acta,
            'jurados'      => $titulacion->jurados,
            'instituto'    => $instituto,
            'imagenBase64' => $imagenBase64,
        ])->setPaper('a4', 'portrait');

        return $pdf->stream('Acta_Sustentacion_' . $titulacion->acta->numero_acta . '.pdf');
    }
}