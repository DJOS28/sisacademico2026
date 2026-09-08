<?php

namespace App\Http\Controllers;

use App\Models\Docente;
use App\Models\PlanEstudio;
use App\Models\RepositorioAutor;
use App\Models\RepositorioCategoria;
use App\Models\RepositorioRecurso;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

class RepositorioRecursoController extends Controller
{
    /**
     * Listado principal de publicaciones y documentos.
     */
    public function index(Request $request): Response
    {
        $buscar      = trim((string) $request->input('buscar', ''));
        $categoriaId = $request->input('categoria_id');
        $autorId     = $request->input('autor_id');
        $estado      = trim((string) $request->input('estado', ''));

        $recursos = RepositorioRecurso::query()
            ->with(['autores:id,nombre', 'categorias:id,nombre', 'planEstudio:id,nombre,codigo', 'asesor:id,nombre,apellido'])
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('titulo', 'like', "%{$buscar}%")
                        ->orWhere('descripcion', 'like', "%{$buscar}%")
                        ->orWhere('palabras_clave', 'like', "%{$buscar}%")
                        ->orWhereHas('autores', fn ($q) => $q->where('nombre', 'like', "%{$buscar}%"));
                });
            })
            ->when(! blank($categoriaId), fn ($q) => $q->whereHas('categorias', fn ($sub) => $sub->where('categoria_id', $categoriaId)))
            ->when(! blank($autorId), fn ($q) => $q->whereHas('autores', fn ($sub) => $sub->where('autor_id', $autorId)))
            ->when($estado !== '', fn ($q) => $q->where('activo', $estado === 'Activo'))
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Repositorio/Recursos/Index', [
            'recursos'    => $recursos,
            'categorias'  => RepositorioCategoria::where('activo', 1)->select('id', 'nombre')->orderBy('nombre')->get(),
            'autores'     => RepositorioAutor::where('activo', 1)->with('estudiante:id_postulante,dni')->select('id', 'nombre', 'estudiante_id')->orderBy('nombre')->get(),
            'planes'      => PlanEstudio::where('activo', 1)->select('id', 'nombre', 'codigo')->orderBy('nombre')->get(),
            'asesores'    => Docente::select('id', 'nombre', 'apellido')->orderBy('apellido')->get(),
            'filtros'     => [
                'buscar'       => $buscar,
                'categoria_id' => $categoriaId ?? '',
                'autor_id'     => $autorId ?? '',
                'estado'       => $estado,
            ],
        ]);
    }

    /**
     * Filtrado dinámico vía AJAX.
     */
    public function filtrar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'buscar'       => ['nullable', 'string', 'max:150'],
            'categoria_id' => ['nullable', 'integer', 'exists:repositorio_categorias,id'],
            'autor_id'     => ['nullable', 'integer', 'exists:repositorio_autores,id'],
            'estado'       => ['nullable', 'string', 'in:Activo,Inactivo'],
            'page'         => ['nullable', 'integer', 'min:1'],
        ]);

        $buscar      = trim((string) ($datos['buscar'] ?? ''));
        $categoriaId = $datos['categoria_id'] ?? null;
        $autorId     = $datos['autor_id'] ?? null;
        $estado      = trim((string) ($datos['estado'] ?? ''));
        $pagina      = (int) ($datos['page'] ?? 1);

        $recursos = RepositorioRecurso::query()
            ->with(['autores:id,nombre', 'categorias:id,nombre', 'planEstudio:id,nombre,codigo', 'asesor:id,nombre,apellido'])
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('titulo', 'like', "%{$buscar}%")
                        ->orWhere('descripcion', 'like', "%{$buscar}%")
                        ->orWhere('palabras_clave', 'like', "%{$buscar}%")
                        ->orWhereHas('autores', fn ($q) => $q->where('nombre', 'like', "%{$buscar}%"));
                });
            })
            ->when(! blank($categoriaId), fn ($q) => $q->whereHas('categorias', fn ($sub) => $sub->where('categoria_id', $categoriaId)))
            ->when(! blank($autorId), fn ($q) => $q->whereHas('autores', fn ($sub) => $sub->where('autor_id', $autorId)))
            ->when($estado !== '', fn ($q) => $q->where('activo', $estado === 'Activo'))
            ->orderByDesc('id')
            ->paginate(perPage: 10, columns: ['*'], pageName: 'page', page: $pagina);

        return response()->json(['recursos' => $recursos]);
    }

    /**
     * Registra un nuevo recurso/tesis con archivo físico.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            'titulo'           => ['required', 'string', 'max:255'],
            'descripcion'      => ['nullable', 'string', 'max:3000'],
            'plan_estudio_id'  => ['nullable', 'integer', 'exists:planes_estudio,id'],
            'asesor_id'        => ['nullable', 'integer', 'exists:docentes,id'],
            'anio_publicacion' => ['nullable', 'integer', 'min:1990', 'max:' . date('Y')],
            'palabras_clave'   => ['nullable', 'string', 'max:255'],
            'activo'           => ['nullable', 'boolean'],
            'autor_ids'        => ['required', 'array', 'min:1'],
            'autor_ids.*'      => ['required', 'integer', 'exists:repositorio_autores,id'],
            'categoria_ids'    => ['required', 'array', 'min:1'],
            'categoria_ids.*'  => ['required', 'integer', 'exists:repositorio_categorias,id'],
            'archivo'          => ['required', 'file', 'mimes:pdf,docx,doc', 'max:30720'], // Máx 30MB
        ], [
            'autor_ids.required'     => 'Debe vincular al menos un autor/tesista al documento.',
            'categoria_ids.required' => 'Debe clasificar el documento en al menos una categoría.',
            'archivo.required'       => 'Debe adjuntar el archivo digital (PDF o Word).',
            'archivo.max'            => 'El archivo no debe exceder los 30 MB.',
        ]);

        DB::transaction(function () use ($datos, $request) {
            $archivoPath = $request->file('archivo')->store('repositorio/documentos', 'public');
            $extension = strtolower($request->file('archivo')->getClientOriginalExtension());

            $recurso = RepositorioRecurso::create([
                'titulo'           => trim($datos['titulo']),
                'descripcion'      => $datos['descripcion'] ?? null,
                'archivo'          => $archivoPath,
                'tipo_archivo'     => $extension,
                'plan_estudio_id'  => $datos['plan_estudio_id'] ?? null,
                'asesor_id'        => $datos['asesor_id'] ?? null,
                'anio_publicacion' => $datos['anio_publicacion'] ?? date('Y'),
                'palabras_clave'   => $datos['palabras_clave'] ?? null,
                'activo'           => (bool) ($datos['activo'] ?? true),
                'visitas'          => 0,
                'descargas'        => 0,
                'creado_en'        => now(),
            ]);

            // Asignar autores y categorías en tablas intermedias
            $recurso->autores()->sync($datos['autor_ids']);
            $recurso->categorias()->sync($datos['categoria_ids']);
        });

        return back()->with('success', 'Documento publicado en el repositorio correctamente.');
    }

    /**
     * Actualiza metadatos y archivo del recurso.
     */
    public function update(Request $request, RepositorioRecurso $recurso): RedirectResponse
    {
        $datos = $request->validate([
            'titulo'           => ['required', 'string', 'max:255'],
            'descripcion'      => ['nullable', 'string', 'max:3000'],
            'plan_estudio_id'  => ['nullable', 'integer', 'exists:planes_estudio,id'],
            'asesor_id'        => ['nullable', 'integer', 'exists:docentes,id'],
            'anio_publicacion' => ['nullable', 'integer', 'min:1990', 'max:' . date('Y')],
            'palabras_clave'   => ['nullable', 'string', 'max:255'],
            'activo'           => ['nullable', 'boolean'],
            'autor_ids'        => ['required', 'array', 'min:1'],
            'autor_ids.*'      => ['required', 'integer', 'exists:repositorio_autores,id'],
            'categoria_ids'    => ['required', 'array', 'min:1'],
            'categoria_ids.*'  => ['required', 'integer', 'exists:repositorio_categorias,id'],
            'archivo'          => ['nullable', 'file', 'mimes:pdf,docx,doc', 'max:30720'],
        ]);

        DB::transaction(function () use ($datos, $request, $recurso) {
            $archivoPath = $recurso->archivo;
            $tipoArchivo = $recurso->tipo_archivo;

            if ($request->hasFile('archivo')) {
                if (! empty($recurso->archivo) && Storage::disk('public')->exists($recurso->archivo)) {
                    Storage::disk('public')->delete($recurso->archivo);
                }
                $archivoPath = $request->file('archivo')->store('repositorio/documentos', 'public');
                $tipoArchivo = strtolower($request->file('archivo')->getClientOriginalExtension());
            }

            $recurso->update([
                'titulo'           => trim($datos['titulo']),
                'descripcion'      => $datos['descripcion'] ?? null,
                'archivo'          => $archivoPath,
                'tipo_archivo'     => $tipoArchivo,
                'plan_estudio_id'  => $datos['plan_estudio_id'] ?? null,
                'asesor_id'        => $datos['asesor_id'] ?? null,
                'anio_publicacion' => $datos['anio_publicacion'] ?? date('Y'),
                'palabras_clave'   => $datos['palabras_clave'] ?? null,
                'activo'           => (bool) $datos['activo'],
            ]);

            $recurso->autores()->sync($datos['autor_ids']);
            $recurso->categorias()->sync($datos['categoria_ids']);
        });

        return back()->with('success', 'Documento actualizado correctamente.');
    }

    /**
     * Incrementa visitas y permite previsualizar el archivo.
     */
    public function verArchivo(RepositorioRecurso $recurso): BinaryFileResponse
    {
        if (empty($recurso->archivo) || ! Storage::disk('public')->exists($recurso->archivo)) {
            abort(404, 'El archivo digital no fue encontrado.');
        }

        $recurso->increment('visitas');
        return response()->file(Storage::disk('public')->path($recurso->archivo));
    }

    /**
     * Incrementa descargas y descarga el archivo físico.
     */
    public function descargarArchivo(RepositorioRecurso $recurso): BinaryFileResponse
    {
        if (empty($recurso->archivo) || ! Storage::disk('public')->exists($recurso->archivo)) {
            abort(404, 'El archivo digital no fue encontrado.');
        }

        $recurso->increment('descargas');
        return response()->download(Storage::disk('public')->path($recurso->archivo));
    }

    /**
     * Activa o desactiva la visibilidad del recurso.
     */
    public function actualizarEstado(Request $request, RepositorioRecurso $recurso): RedirectResponse
    {
        $datos = $request->validate([
            'activo' => ['required', 'boolean'],
        ]);

        $recurso->update(['activo' => (bool) $datos['activo']]);

        return back()->with('success', 'Estado del documento actualizado.');
    }

    /**
     * Elimina el recurso, sus relaciones intermedias y su archivo físico.
     */
    public function destroy(RepositorioRecurso $recurso): RedirectResponse
    {
        try {
            DB::transaction(function () use ($recurso) {
                if (! empty($recurso->archivo) && Storage::disk('public')->exists($recurso->archivo)) {
                    Storage::disk('public')->delete($recurso->archivo);
                }

                $recurso->autores()->detach();
                $recurso->categorias()->detach();
                $recurso->delete();
            });

            return back()->with('success', 'Documento eliminado del repositorio correctamente.');
        } catch (Throwable $exception) {
            report($exception);
            return back()->with('error', 'No se pudo eliminar el documento.');
        }
    }

    /**
     * Dashboard analítico y reportes del Repositorio Digital.
     */
    public function dashboard(): Response
    {
        // 1. KPIs Generales
        $totales = [
            'documentos' => RepositorioRecurso::count(),
            'visitas'    => (int) RepositorioRecurso::sum('visitas'),
            'descargas'  => (int) RepositorioRecurso::sum('descargas'),
            'autores'    => RepositorioAutor::count(),
        ];

        // 2. Documentos por Carrera / Plan de Estudios
        $porCarrera = PlanEstudio::query()
            ->withCount('recursosRepositorio')
            ->having('recursos_repositorio_count', '>', 0)
            ->orderByDesc('recursos_repositorio_count')
            ->get(['id', 'nombre', 'codigo'])
            ->map(fn ($p) => [
                'nombre' => $p->nombre,
                'codigo' => $p->codigo,
                'total'  => $p->recursos_repositorio_count,
            ]);

        // 3. Documentos por Categoría
        $porCategoria = RepositorioCategoria::query()
            ->withCount('recursos')
            ->having('recursos_count', '>', 0)
            ->orderByDesc('recursos_count')
            ->get(['id', 'nombre'])
            ->map(fn ($c) => [
                'nombre' => $c->nombre,
                'total'  => $c->recursos_count,
            ]);

        // 4. Producción por Año de Publicación
        $porAnio = RepositorioRecurso::query()
            ->selectRaw('anio_publicacion, COUNT(*) as total')
            ->whereNotNull('anio_publicacion')
            ->groupBy('anio_publicacion')
            ->orderBy('anio_publicacion', 'desc')
            ->limit(6)
            ->get()
            ->sortBy('anio_publicacion')
            ->values();

        // 5. Top 5 Documentos Más Consultados y Descargados
        $topRecursos = RepositorioRecurso::query()
            ->with(['planEstudio:id,nombre', 'autores:id,nombre'])
            ->orderByDesc('visitas')
            ->limit(5)
            ->get(['id', 'titulo', 'plan_estudio_id', 'visitas', 'descargas', 'tipo_archivo']);

        return Inertia::render('Repositorio/Dashboard', [
            'totales'      => $totales,
            'porCarrera'   => $porCarrera,
            'porCategoria' => $porCategoria,
            'porAnio'      => $porAnio,
            'topRecursos'  => $topRecursos,
        ]);
    }
}