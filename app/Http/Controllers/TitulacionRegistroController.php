<?php

namespace App\Http\Controllers;

use App\Models\Instituto;
use App\Models\PlanEstudio;
use App\Models\Postulante;
use App\Models\Titulacion;
use App\Models\TitulacionActa;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TitulacionRegistroController extends Controller
{
    /**
     * Listado del Libro de Títulos y Registro Oficial.
     */
    public function index(Request $request): Response
    {
        $buscar        = trim((string) $request->input('buscar', ''));
        $planEstudioId = $request->input('plan_estudio_id');
        $libro         = trim((string) $request->input('libro', ''));
        $estadoRegistro = trim((string) $request->input('estado_registro', '')); // Registrado / Pendiente

        $titulaciones = Titulacion::query()
            ->with([
                'estudiante:id_postulante,dni,nombres,apellidos,grado',
                'planEstudio:id,nombre,codigo',
                'modalidad:id,nombre',
                'acta',
            ])
            ->whereHas('acta', fn ($q) => $q->whereIn('resultado', ['Aprobado_Unanimidad', 'Aprobado_Mayoria']))
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('codigo_expediente', 'like', "%{$buscar}%")
                        ->orWhereHas('estudiante', function ($q) use ($buscar) {
                            $q->where('dni', 'like', "%{$buscar}%")
                              ->orWhere('nombres', 'like', "%{$buscar}%")
                              ->orWhere('apellidos', 'like', "%{$buscar}%");
                        })
                        ->orWhereHas('acta', function ($q) use ($buscar) {
                            $q->where('numero_diploma', 'like', "%{$buscar}%")
                              ->orWhere('resolucion_director', 'like', "%{$buscar}%")
                              ->orWhere('codigo_registro_minedu', 'like', "%{$buscar}%")
                              ->orWhere('numero_acta', 'like', "%{$buscar}%");
                        });
                });
            })
            ->when(! blank($planEstudioId), fn ($q) => $q->where('plan_estudio_id', $planEstudioId))
            ->when($libro !== '', fn ($q) => $q->whereHas('acta', fn ($sub) => $sub->where('libro', $libro)))
            ->when($estadoRegistro === 'Registrado', fn ($q) => $q->whereNotNull('acta.numero_diploma'))
            ->when($estadoRegistro === 'Pendiente', fn ($q) => $q->whereNull('acta.numero_diploma'))
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        $librosDisponibles = TitulacionActa::whereNotNull('libro')
            ->select('libro')
            ->distinct()
            ->pluck('libro');

        return Inertia::render('Titulacion/Registro/Index', [
            'titulaciones'      => $titulaciones,
            'planes'            => PlanEstudio::where('activo', 1)->select('id', 'nombre', 'codigo')->orderBy('nombre')->get(),
            'librosDisponibles' => $librosDisponibles,
            'filtros'           => [
                'buscar'          => $buscar,
                'plan_estudio_id' => $planEstudioId ?? '',
                'libro'           => $libro,
                'estado_registro' => $estadoRegistro,
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
            'plan_estudio_id' => ['nullable', 'integer', 'exists:planes_estudio,id'],
            'libro'           => ['nullable', 'string', 'max:20'],
            'estado_registro' => ['nullable', 'string', 'in:Registrado,Pendiente'],
            'page'            => ['nullable', 'integer', 'min:1'],
        ]);

        $buscar        = trim((string) ($datos['buscar'] ?? ''));
        $planEstudioId = $datos['plan_estudio_id'] ?? null;
        $libro         = trim((string) ($datos['libro'] ?? ''));
        $estadoRegistro = trim((string) ($datos['estado_registro'] ?? ''));
        $pagina        = (int) ($datos['page'] ?? 1);

        $titulaciones = Titulacion::query()
            ->with([
                'estudiante:id_postulante,dni,nombres,apellidos,grado',
                'planEstudio:id,nombre,codigo',
                'modalidad:id,nombre',
                'acta',
            ])
            ->whereHas('acta', fn ($q) => $q->whereIn('resultado', ['Aprobado_Unanimidad', 'Aprobado_Mayoria']))
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('codigo_expediente', 'like', "%{$buscar}%")
                        ->orWhereHas('estudiante', function ($q) use ($buscar) {
                            $q->where('dni', 'like', "%{$buscar}%")
                              ->orWhere('nombres', 'like', "%{$buscar}%")
                              ->orWhere('apellidos', 'like', "%{$buscar}%");
                        })
                        ->orWhereHas('acta', function ($q) use ($buscar) {
                            $q->where('numero_diploma', 'like', "%{$buscar}%")
                              ->orWhere('resolucion_director', 'like', "%{$buscar}%")
                              ->orWhere('codigo_registro_minedu', 'like', "%{$buscar}%")
                              ->orWhere('numero_acta', 'like', "%{$buscar}%");
                        });
                });
            })
            ->when(! blank($planEstudioId), fn ($q) => $q->where('plan_estudio_id', $planEstudioId))
            ->when($libro !== '', fn ($q) => $q->whereHas('acta', fn ($sub) => $sub->where('libro', $libro)))
            ->when($estadoRegistro === 'Registrado', fn ($q) => $q->whereNotNull('acta.numero_diploma'))
            ->when($estadoRegistro === 'Pendiente', fn ($q) => $q->whereNull('acta.numero_diploma'))
            ->orderByDesc('id')
            ->paginate(perPage: 10, columns: ['*'], pageName: 'page', page: $pagina);

        return response()->json(['titulaciones' => $titulaciones]);
    }

    /**
     * Asienta los datos del Diploma y Código de Registro en el Libro Oficial.
     */
    public function registrarDiploma(Request $request, Titulacion $titulacion): RedirectResponse
    {
        $datos = $request->validate([
            'resolucion_director'    => ['required', 'string', 'max:100'],
            'numero_diploma'         => ['required', 'string', 'max:50'],
            'libro'                  => ['required', 'string', 'max:20'],
            'folio'                  => ['required', 'string', 'max:20'],
            'codigo_registro_minedu' => ['nullable', 'string', 'max:50'],
        ], [
            'resolucion_director.required' => 'La Resolución Directoral es obligatoria.',
            'numero_diploma.required'      => 'El número de diploma es obligatorio.',
            'libro.required'               => 'El número de libro es obligatorio.',
            'folio.required'               => 'El folio de asentamiento es obligatorio.',
        ]);

        if (! $titulacion->acta) {
            return back()->withErrors(['error' => 'No se puede registrar diploma sin un acta de sustentación aprobada previa.']);
        }

        DB::transaction(function () use ($datos, $titulacion) {
            // 1. Asentar metadatos en el acta
            $titulacion->acta->update([
                'resolucion_director'    => trim($datos['resolucion_director']),
                'numero_diploma'         => trim($datos['numero_diploma']),
                'libro'                  => trim($datos['libro']),
                'folio'                  => trim($datos['folio']),
                'codigo_registro_minedu' => $this->normalizarNullable($datos['codigo_registro_minedu'] ?? null),
            ]);

            // 2. Establecer estado final del expediente a 'Titulado'
            $titulacion->update(['estado' => 'Titulado']);

            // 3. Actualizar grado académico del postulante a Titulado
            if ($titulacion->estudiante) {
                $titulacion->estudiante->update(['grado' => 'Titulado']);
            }
        });

        return back()->with('success', 'Título asentado en el Libro Oficial y diploma registrado exitosamente.');
    }

    /**
     * Emite la Constancia de Registro de Título Oficial en PDF.
     */
    public function emitirConstanciaPdf(Titulacion $titulacion): HttpResponse
    {
        $titulacion->load(['estudiante', 'planEstudio', 'modalidad', 'acta']);

        if (! $titulacion->acta || empty($titulacion->acta->numero_diploma)) {
            abort(404, 'Este expediente aún no cuenta con diploma asentado en el Libro de Títulos.');
        }

        $instituto = Instituto::with('distrito.provincia.departamento')->first();

        $imagenBase64 = null;
        if ($instituto && ! empty($instituto->logo) && file_exists(public_path('storage/' . $instituto->logo))) {
            $path = public_path('storage/' . $instituto->logo);
            $type = pathinfo($path, PATHINFO_EXTENSION);
            $data = file_get_contents($path);
            $imagenBase64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
        }

        $pdf = Pdf::loadView('pdf.constancia_titulo', [
            'titulacion'   => $titulacion,
            'acta'         => $titulacion->acta,
            'instituto'    => $instituto,
            'imagenBase64' => $imagenBase64,
        ])->setPaper('a4', 'portrait');

        return $pdf->stream('Constancia_Registro_Titulo_' . ($titulacion->acta->numero_diploma) . '.pdf');
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