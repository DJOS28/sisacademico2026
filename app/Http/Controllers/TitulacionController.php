<?php

namespace App\Http\Controllers;

use App\Models\Docente;
use App\Models\PlanEstudio;
use App\Models\Postulante;
use App\Models\Titulacion;
use App\Models\TitulacionExpedienteRequisito;
use App\Models\TitulacionModalidad;
use App\Models\TitulacionRequisito;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

class TitulacionController extends Controller
{
    /**
     * Listado principal de expedientes de titulación.
     */
    public function index(Request $request): Response
    {
        $buscar       = trim((string) $request->input('buscar', ''));
        $modalidadId  = $request->input('modalidad_id');
        $planEstudioId = $request->input('plan_estudio_id');
        $estado       = trim((string) $request->input('estado', ''));

        $titulaciones = Titulacion::query()
            ->with([
                'estudiante:id_postulante,dni,nombres,apellidos',
                'planEstudio:id,nombre,codigo',
                'modalidad:id,nombre',
                'asesor:id,nombre,apellido',
            ])
            ->withCount([
                'requisitosExpediente',
                'requisitosExpediente as requisitos_aprobados_count' => fn ($q) => $q->where('estado', 'Aprobado'),
            ])
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('codigo_expediente', 'like', "%{$buscar}%")
                        ->orWhere('titulo_proyecto', 'like', "%{$buscar}%")
                        ->orWhereHas('estudiante', function ($q) use ($buscar) {
                            $q->where('dni', 'like', "%{$buscar}%")
                              ->orWhere('nombres', 'like', "%{$buscar}%")
                              ->orWhere('apellidos', 'like', "%{$buscar}%");
                        });
                });
            })
            ->when(! blank($modalidadId), fn ($q) => $q->where('modalidad_id', $modalidadId))
            ->when(! blank($planEstudioId), fn ($q) => $q->where('plan_estudio_id', $planEstudioId))
            ->when($estado !== '', fn ($q) => $q->where('estado', $estado))
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Titulacion/Expedientes/Index', [
            'titulaciones' => $titulaciones,
            'modalidades'  => TitulacionModalidad::where('activo', 1)->select('id', 'nombre')->orderBy('nombre')->get(),
            'planes'       => PlanEstudio::where('activo', 1)->select('id', 'nombre', 'codigo')->orderBy('nombre')->get(),
            'estados'      => ['Iniciado', 'En_Revision', 'Apto_Sustentacion', 'Sustentado', 'Titulado', 'Observado', 'Rechazado'],
            'filtros'      => [
                'buscar'          => $buscar,
                'modalidad_id'    => $modalidadId ?? '',
                'plan_estudio_id' => $planEstudioId ?? '',
                'estado'          => $estado,
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
            'modalidad_id'    => ['nullable', 'integer', 'exists:titulacion_modalidades,id'],
            'plan_estudio_id' => ['nullable', 'integer', 'exists:planes_estudio,id'],
            'estado'          => ['nullable', 'string', 'in:Iniciado,En_Revision,Apto_Sustentacion,Sustentado,Titulado,Observado,Rechazado'],
            'page'            => ['nullable', 'integer', 'min:1'],
        ]);

        $buscar       = trim((string) ($datos['buscar'] ?? ''));
        $modalidadId  = $datos['modalidad_id'] ?? null;
        $planEstudioId = $datos['plan_estudio_id'] ?? null;
        $estado       = trim((string) ($datos['estado'] ?? ''));
        $pagina       = (int) ($datos['page'] ?? 1);

        $titulaciones = Titulacion::query()
            ->with([
                'estudiante:id_postulante,dni,nombres,apellidos',
                'planEstudio:id,nombre,codigo',
                'modalidad:id,nombre',
                'asesor:id,nombre,apellido',
            ])
            ->withCount([
                'requisitosExpediente',
                'requisitosExpediente as requisitos_aprobados_count' => fn ($q) => $q->where('estado', 'Aprobado'),
            ])
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('codigo_expediente', 'like', "%{$buscar}%")
                        ->orWhere('titulo_proyecto', 'like', "%{$buscar}%")
                        ->orWhereHas('estudiante', function ($q) use ($buscar) {
                            $q->where('dni', 'like', "%{$buscar}%")
                              ->orWhere('nombres', 'like', "%{$buscar}%")
                              ->orWhere('apellidos', 'like', "%{$buscar}%");
                        });
                });
            })
            ->when(! blank($modalidadId), fn ($q) => $q->where('modalidad_id', $modalidadId))
            ->when(! blank($planEstudioId), fn ($q) => $q->where('plan_estudio_id', $planEstudioId))
            ->when($estado !== '', fn ($q) => $q->where('estado', $estado))
            ->orderByDesc('id')
            ->paginate(perPage: 10, columns: ['*'], pageName: 'page', page: $pagina);

        return response()->json(['titulaciones' => $titulaciones]);
    }

    /**
     * Formulario de apertura de nuevo expediente.
     */
    public function create(): Response
    {
        return Inertia::render('Titulacion/Expedientes/Create', [
            'estudiantes' => Postulante::select('id_postulante', 'dni', 'nombres', 'apellidos')
                ->orderBy('apellidos')
                ->get(),
            'planes'      => PlanEstudio::where('activo', 1)->select('id', 'nombre', 'codigo')->get(),
            'modalidades' => TitulacionModalidad::where('activo', 1)->select('id', 'nombre')->get(),
            'asesores'    => Docente::select('id', 'nombre', 'apellido')->orderBy('apellido')->get(),
            'requisitos'  => TitulacionRequisito::where('activo', 1)->get(),
        ]);
    }

    /**
     * Registra un expediente y genera su checklist inicial de requisitos.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            'estudiante_id'    => ['required', 'integer', 'exists:postulantes,id_postulante'],
            'plan_estudio_id'  => ['required', 'integer', 'exists:planes_estudio,id'],
            'modalidad_id'     => ['required', 'integer', 'exists:titulacion_modalidades,id'],
            'asesor_id'        => ['nullable', 'integer', 'exists:docentes,id'],
            'titulo_proyecto'  => ['nullable', 'string', 'max:500'],
            'fecha_solicitud'  => ['required', 'date'],
            'archivo_proyecto' => ['nullable', 'file', 'mimes:pdf,docx,doc', 'max:25600'],
        ]);

        DB::transaction(function () use ($datos, $request) {
            $archivoPath = null;
            if ($request->hasFile('archivo_proyecto')) {
                $archivoPath = $request->file('archivo_proyecto')->store('titulacion/proyectos', 'public');
            }

            $añoActual = date('Y');

            $titulacion = Titulacion::create([
                'codigo_expediente' => 'TEMP-' . uniqid(),
                'estudiante_id'     => $datos['estudiante_id'],
                'plan_estudio_id'   => $datos['plan_estudio_id'],
                'modalidad_id'      => $datos['modalidad_id'],
                'asesor_id'         => $datos['asesor_id'] ?? null,
                'titulo_proyecto'   => $datos['titulo_proyecto'] ?? null,
                'archivo_proyecto'  => $archivoPath,
                'estado'            => 'Iniciado',
                'fecha_solicitud'   => $datos['fecha_solicitud'],
            ]);

            // Generar código correlativo formal
            $titulacion->update([
                'codigo_expediente' => 'EXP-TIT-' . $añoActual . '-' . str_pad($titulacion->id, 5, '0', STR_PAD_LEFT),
            ]);

            // Inicializar checklist con todos los requisitos activos
            $requisitosActivos = TitulacionRequisito::where('activo', 1)->get();
            foreach ($requisitosActivos as $req) {
                TitulacionExpedienteRequisito::create([
                    'titulacion_id' => $titulacion->id,
                    'requisito_id'  => $req->id,
                    'estado'        => 'Pendiente',
                ]);
            }
        });

        return to_route('titulaciones.index')->with('success', 'Expediente de titulación aperturado exitosamente.');
    }

    /**
     * Vista de detalle, auditoría de requisitos y avance del expediente.
     */
    public function show(Titulacion $titulacion): Response
    {
        $titulacion->load([
            'estudiante',
            'planEstudio',
            'modalidad',
            'asesor',
            'requisitosExpediente.requisito',
            'jurados.docente',
            'acta',
        ]);

        return Inertia::render('Titulacion/Expedientes/Show', [
            'titulacion' => $titulacion,
            'docentes'   => Docente::select('id', 'nombre', 'apellido')->orderBy('apellido')->get(),
        ]);
    }

    /**
     * Sube o reemplaza el archivo de un requisito específico en el expediente.
     */
    public function subirArchivoRequisito(Request $request, TitulacionExpedienteRequisito $expedienteRequisito): RedirectResponse
    {
        $request->validate([
            'archivo' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:15360'],
        ], [
            'archivo.required' => 'Debe adjuntar el archivo correspondiente al requisito.',
            'archivo.max'      => 'El archivo no debe exceder los 15 MB.',
        ]);

        if (! empty($expedienteRequisito->archivo_adjunto) && Storage::disk('public')->exists($expedienteRequisito->archivo_adjunto)) {
            Storage::disk('public')->delete($expedienteRequisito->archivo_adjunto);
        }

        $path = $request->file('archivo')->store('titulacion/requisitos', 'public');

        $expedienteRequisito->update([
            'archivo_adjunto'    => $path,
            'estado'             => 'Pendiente',
            'observacion'        => null,
            'fecha_verificacion' => null,
        ]);

        return back()->with('success', 'Documento del requisito cargado correctamente.');
    }

    /**
     * Evalúa y dictamina el estado de un requisito (Aprobado / Observado).
     */
    public function evaluarRequisito(Request $request, TitulacionExpedienteRequisito $expedienteRequisito): RedirectResponse
    {
        $datos = $request->validate([
            'estado'      => ['required', 'string', 'in:Aprobado,Observado,Pendiente'],
            'observacion' => ['nullable', 'string', 'max:500'],
        ]);

        $expedienteRequisito->update([
            'estado'             => $datos['estado'],
            'observacion'        => $datos['observacion'] ?? null,
            'fecha_verificacion' => now(),
        ]);

        // Verificar si todos los requisitos obligatorios están aprobados
        $titulacion = $expedienteRequisito->titulacion;
        $faltanObligatorios = $titulacion->requisitosExpediente()
            ->whereHas('requisito', fn ($q) => $q->where('es_obligatorio', 1))
            ->where('estado', '<>', 'Aprobado')
            ->exists();

        if (! $faltanObligatorios && $titulacion->estado === 'Iniciado') {
            $titulacion->update(['estado' => 'Apto_Sustentacion']);
        } elseif ($faltanObligatorios && $titulacion->estado === 'Apto_Sustentacion') {
            $titulacion->update(['estado' => 'En_Revision']);
        }

        return back()->with('success', 'Evaluación de requisito registrada.');
    }

    /**
     * Actualiza el estado global del expediente.
     */
    public function cambiarEstadoExpediente(Request $request, Titulacion $titulacion): RedirectResponse
    {
        $datos = $request->validate([
            'estado' => ['required', 'string', 'in:Iniciado,En_Revision,Apto_Sustentacion,Sustentado,Titulado,Observado,Rechazado'],
        ]);

        $titulacion->update(['estado' => $datos['estado']]);

        return back()->with('success', 'Estado del expediente actualizado a: ' . $datos['estado']);
    }

    /**
     * Descarga el proyecto o un documento del requisito.
     */
    public function descargarArchivo(string $tipo, int $id): BinaryFileResponse
    {
        if ($tipo === 'proyecto') {
            $registro = Titulacion::findOrFail($id);
            $ruta = $registro->archivo_proyecto;
        } else {
            $registro = TitulacionExpedienteRequisito::findOrFail($id);
            $ruta = $registro->archivo_adjunto;
        }

        if (empty($ruta) || ! Storage::disk('public')->exists($ruta)) {
            abort(404, 'El archivo solicitado no existe en el servidor.');
        }

        return response()->file(Storage::disk('public')->path($ruta));
    }

    /**
     * Elimina el expediente completo y sus archivos físicos asociados.
     */
    public function destroy(Titulacion $titulacion): RedirectResponse
    {
        try {
            DB::transaction(function () use ($titulacion) {
                // Eliminar archivo del proyecto
                if (! empty($titulacion->archivo_proyecto) && Storage::disk('public')->exists($titulacion->archivo_proyecto)) {
                    Storage::disk('public')->delete($titulacion->archivo_proyecto);
                }

                // Eliminar archivos de requisitos
                foreach ($titulacion->requisitosExpediente as $reqExp) {
                    if (! empty($reqExp->archivo_adjunto) && Storage::disk('public')->exists($reqExp->archivo_adjunto)) {
                        Storage::disk('public')->delete($reqExp->archivo_adjunto);
                    }
                }

                $titulacion->delete();
            });

            return back()->with('success', 'Expediente de titulación eliminado.');
        } catch (Throwable $exception) {
            report($exception);
            return back()->with('error', 'No se pudo eliminar el expediente.');
        }
    }
    /**
     * Muestra el formulario para editar un expediente.
     */
    public function edit(Titulacion $titulacion): Response
    {
        $titulacion->load(['estudiante', 'planEstudio', 'modalidad', 'asesor']);

        return Inertia::render('Titulacion/Expedientes/Edit', [
            'titulacion'  => $titulacion,
            'estudiantes' => Postulante::select('id_postulante', 'dni', 'nombres', 'apellidos')
                ->orderBy('apellidos')
                ->get(),
            'planes'      => PlanEstudio::where('activo', 1)->select('id', 'nombre', 'codigo')->get(),
            'modalidades' => TitulacionModalidad::where('activo', 1)->select('id', 'nombre')->get(),
            'asesores'    => Docente::select('id', 'nombre', 'apellido')->orderBy('apellido')->get(),
            'estados'     => ['Iniciado', 'En_Revision', 'Apto_Sustentacion', 'Sustentado', 'Titulado', 'Observado', 'Rechazado'],
        ]);
    }

    /**
     * Actualiza la información del expediente.
     */
    public function update(Request $request, Titulacion $titulacion): RedirectResponse
    {
        $datos = $request->validate([
            'estudiante_id'    => ['required', 'integer', 'exists:postulantes,id_postulante'],
            'plan_estudio_id'  => ['required', 'integer', 'exists:planes_estudio,id'],
            'modalidad_id'     => ['required', 'integer', 'exists:titulacion_modalidades,id'],
            'asesor_id'        => ['nullable', 'integer', 'exists:docentes,id'],
            'titulo_proyecto'  => ['nullable', 'string', 'max:500'],
            'estado'           => ['required', 'string', 'in:Iniciado,En_Revision,Apto_Sustentacion,Sustentado,Titulado,Observado,Rechazado'],
            'fecha_solicitud'  => ['required', 'date'],
            'archivo_proyecto' => ['nullable', 'file', 'mimes:pdf,docx,doc', 'max:25600'],
        ]);

        DB::transaction(function () use ($datos, $request, $titulacion) {
            $archivoPath = $titulacion->archivo_proyecto;

            if ($request->hasFile('archivo_proyecto')) {
                if (! empty($titulacion->archivo_proyecto) && Storage::disk('public')->exists($titulacion->archivo_proyecto)) {
                    Storage::disk('public')->delete($titulacion->archivo_proyecto);
                }
                $archivoPath = $request->file('archivo_proyecto')->store('titulacion/proyectos', 'public');
            }

            $titulacion->update([
                'estudiante_id'    => $datos['estudiante_id'],
                'plan_estudio_id'  => $datos['plan_estudio_id'],
                'modalidad_id'     => $datos['modalidad_id'],
                'asesor_id'        => $datos['asesor_id'] ?? null,
                'titulo_proyecto'  => $datos['titulo_proyecto'] ?? null,
                'archivo_proyecto' => $archivoPath,
                'estado'           => $datos['estado'],
                'fecha_solicitud'  => $datos['fecha_solicitud'],
            ]);
        });

        return to_route('titulaciones.show', $titulacion->id)->with('success', 'Expediente de titulación actualizado con éxito.');
    }
}