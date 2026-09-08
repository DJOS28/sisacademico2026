<?php

namespace App\Http\Controllers;

use App\Models\Postulante;
use App\Models\RepositorioAutor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class RepositorioAutorController extends Controller
{
    /**
     * Listado inicial de autores.
     */
    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->input('buscar', ''));
        $estado = trim((string) $request->input('estado', ''));

        $autores = RepositorioAutor::query()
            ->with(['estudiante:id_postulante,dni,nombres,apellidos'])
            ->withCount('recursos')
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('nombre', 'like', "%{$buscar}%")
                        ->orWhere('email', 'like', "%{$buscar}%")
                        ->orWhere('biografia', 'like', "%{$buscar}%")
                        ->orWhereHas('estudiante', function ($q) use ($buscar) {
                            $q->where('dni', 'like', "%{$buscar}%")
                              ->orWhere('nombres', 'like', "%{$buscar}%")
                              ->orWhere('apellidos', 'like', "%{$buscar}%");
                        });
                });
            })
            ->when($estado !== '', fn ($query) => $query->where('activo', $estado === 'Activo'))
            ->orderBy('nombre')
            ->paginate(10)
            ->withQueryString();

        $estudiantes = Postulante::select('id_postulante', 'dni', 'nombres', 'apellidos')
            ->orderBy('apellidos')
            ->get();

        return Inertia::render('Repositorio/Autores/Index', [
            'autores'     => $autores,
            'estudiantes' => $estudiantes,
            'filtros'     => [
                'buscar' => $buscar,
                'estado' => $estado,
            ],
        ]);
    }

    /**
     * Filtrado dinámico vía AJAX.
     */
    public function filtrar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'buscar' => ['nullable', 'string', 'max:100'],
            'estado' => ['nullable', 'string', 'in:Activo,Inactivo'],
            'page'   => ['nullable', 'integer', 'min:1'],
        ]);

        $buscar = trim((string) ($datos['buscar'] ?? ''));
        $estado = trim((string) ($datos['estado'] ?? ''));
        $pagina = (int) ($datos['page'] ?? 1);

        $autores = RepositorioAutor::query()
            ->with(['estudiante:id_postulante,dni,nombres,apellidos'])
            ->withCount('recursos')
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('nombre', 'like', "%{$buscar}%")
                        ->orWhere('email', 'like', "%{$buscar}%")
                        ->orWhere('biografia', 'like', "%{$buscar}%")
                        ->orWhereHas('estudiante', function ($q) use ($buscar) {
                            $q->where('dni', 'like', "%{$buscar}%")
                              ->orWhere('nombres', 'like', "%{$buscar}%")
                              ->orWhere('apellidos', 'like', "%{$buscar}%");
                        });
                });
            })
            ->when($estado !== '', fn ($query) => $query->where('activo', $estado === 'Activo'))
            ->orderBy('nombre')
            ->paginate(perPage: 10, columns: ['*'], pageName: 'page', page: $pagina);

        return response()->json(['autores' => $autores]);
    }

    /**
     * Registra un nuevo autor.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        // Si se vincula a un estudiante, autocompletar nombre si viene vacío
        $nombre = trim($datos['nombre'] ?? '');
        if ($nombre === '' && !empty($datos['estudiante_id'])) {
            $est = Postulante::find($datos['estudiante_id']);
            if ($est) {
                $nombre = "{$est->nombres} {$est->apellidos}";
            }
        }

        RepositorioAutor::create([
            'nombre'        => $nombre,
            'email'         => $this->normalizarNullable($datos['email'] ?? null),
            'biografia'     => $this->normalizarNullable($datos['biografia'] ?? null),
            'estudiante_id' => $datos['estudiante_id'] ?? null,
            'activo'        => (bool) ($datos['activo'] ?? true),
            'creado_en'     => now(),
        ]);

        return back()->with('success', 'Autor registrado correctamente.');
    }

    /**
     * Actualiza un autor.
     */
    public function update(Request $request, RepositorioAutor $autor): RedirectResponse
    {
        $datos = $this->validar($request, $autor);

        $autor->update([
            'nombre'        => trim($datos['nombre']),
            'email'         => $this->normalizarNullable($datos['email'] ?? null),
            'biografia'     => $this->normalizarNullable($datos['biografia'] ?? null),
            'estudiante_id' => $datos['estudiante_id'] ?? null,
            'activo'        => (bool) $datos['activo'],
        ]);

        return back()->with('success', 'Autor actualizado correctamente.');
    }

    /**
     * Activa o desactiva al autor.
     */
    public function actualizarEstado(Request $request, RepositorioAutor $autor): RedirectResponse
    {
        $datos = $request->validate([
            'activo' => ['required', 'boolean'],
        ]);

        $autor->update(['activo' => (bool) $datos['activo']]);

        return back()->with('success', 'Estado del autor actualizado correctamente.');
    }

    /**
     * Elimina al autor si no tiene publicaciones asociadas.
     */
    public function destroy(RepositorioAutor $autor): RedirectResponse
    {
        try {
            if ($autor->recursos()->exists()) {
                return back()->with('error', 'No se puede eliminar el autor porque tiene publicaciones asociadas.');
            }

            $autor->delete();

            return back()->with('success', 'Autor eliminado correctamente.');
        } catch (Throwable $exception) {
            report($exception);
            return back()->with('error', 'No se pudo eliminar el autor.');
        }
    }

    /**
     * Reglas de validación.
     */
    private function validar(Request $request, ?RepositorioAutor $autor = null): array
    {
        return $request->validate([
            'nombre'        => ['required', 'string', 'max:100'],
            'email'         => ['nullable', 'email', 'max:100'],
            'biografia'     => ['nullable', 'string', 'max:2000'],
            'estudiante_id' => ['nullable', 'integer', 'exists:postulantes,id_postulante'],
            'activo'        => ['nullable', 'boolean'],
        ], [
            'nombre.required'       => 'El nombre del autor es obligatorio.',
            'nombre.max'            => 'El nombre no debe superar los 100 caracteres.',
            'email.email'           => 'El formato del correo no es válido.',
            'estudiante_id.exists'  => 'El estudiante seleccionado no existe en el sistema.',
        ]);
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