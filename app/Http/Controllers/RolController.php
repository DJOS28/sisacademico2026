<?php

namespace App\Http\Controllers;

use App\Models\Modulo;
use App\Models\Rol;
use App\Services\AuditoriaService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class RolController extends Controller
{
    /**
     * Muestra el listado inicial de roles.
     */
    public function index(): Response
    {
        return Inertia::render('Roles/Index', [
            'roles' => $this->obtenerRoles(),
            'estados' => $this->estados(),
            'filtros' => [
                'buscar' => '',
                'estado' => '',
            ],
        ]);
    }

    /**
     * Filtra roles mediante POST AJAX.
     */
    public function filtrar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'buscar' => ['nullable', 'string', 'max:150'],
            'estado' => ['nullable', Rule::in(['1', '0', 1, 0])],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $buscar = trim((string) ($datos['buscar'] ?? ''));
        $estado = filled($datos['estado'] ?? null) ? (int) $datos['estado'] : null;
        $pagina = max(1, (int) ($datos['page'] ?? 1));

        $roles = $this->obtenerRoles(
            buscar: $buscar,
            estado: $estado,
            pagina: $pagina
        );

        if ($roles->isEmpty() && $pagina > 1 && $roles->lastPage() > 0) {
            $pagina = $roles->lastPage();
            $roles = $this->obtenerRoles(
                buscar: $buscar,
                estado: $estado,
                pagina: $pagina
            );
        }

        return response()->json([
            'roles' => $roles,
            'filtros' => [
                'buscar' => $buscar,
                'estado' => $estado === null ? '' : (string) $estado,
            ],
        ]);
    }

    /**
     * Muestra el formulario de creación.
     */
    public function create(): Response
    {
        return Inertia::render('Roles/Create', [
            'modulos' => $this->modulos(),
            'estados' => $this->estados(),
            'reglasModulos' => [
                'modulo_estudiante_id' => $this->obtenerModuloEspecial('estudiante')?->id,
                'modulo_docente_id' => $this->obtenerModuloEspecial('docente')?->id,
            ],
        ]);
    }

    /**
     * Registra un rol con sus módulos.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar(request: $request);
        $this->validarModulosPermitidosPorRol($datos);

        try {
            $rol = null;

            DB::transaction(function () use ($datos, &$rol) {
                $rol = Rol::create([
                    'nombre' => trim($datos['nombre']),
                    'descripcion' => $this->nullable($datos['descripcion'] ?? null),
                    'estado' => (bool) $datos['estado'],
                ]);

                $rol->modulos()->sync($datos['modulos']);

                // Directiva 12.11 DRE Ancash - b) Administración de usuarios, roles y permisos
                AuditoriaService::registrar(
                    componente: 'seguridad_usuarios',
                    operacion: 'INSERTAR',
                    descripcion: "Creación de perfil de rol institucional: '{$rol->nombre}' con " . count($datos['modulos']) . " módulo(s) asignado(s)",
                    registroId: (string) $rol->id,
                    nuevos: [
                        'nombre' => $rol->nombre,
                        'descripcion' => $rol->descripcion,
                        'estado' => $rol->estado ? 'Activo' : 'Inactivo',
                        'modulos' => $datos['modulos'],
                    ],
                    resultado: 'EXITO'
                );
            });

            return to_route('roles.index')->with('success', 'Rol registrado correctamente.');
        } catch (Throwable $e) {
            AuditoriaService::registrar(
                componente: 'seguridad_usuarios',
                operacion: 'INSERTAR',
                descripcion: "Fallo al crear rol institucional '{$datos['nombre']}'",
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return back()->withErrors(['error' => 'Error al registrar el rol: ' . $e->getMessage()]);
        }
    }

    /**
     * Muestra el formulario de edición.
     */
    public function edit(Rol $rol): Response
    {
        $rol->load(['modulos:id,nombre,descripcion']);

        return Inertia::render('Roles/Edit', [
            'rol' => [
                'id' => $rol->id,
                'nombre' => $rol->nombre,
                'descripcion' => $rol->descripcion,
                'estado' => (bool) $rol->estado,
                'modulos' => $rol->modulos->pluck('id')->map(fn ($id) => (int) $id)->values()->all(),
            ],
            'modulos' => $this->modulos(),
            'estados' => $this->estados(),
            'reglasModulos' => [
                'modulo_estudiante_id' => $this->obtenerModuloEspecial('estudiante')?->id,
                'modulo_docente_id' => $this->obtenerModuloEspecial('docente')?->id,
            ],
        ]);
    }

    /**
     * Actualiza el rol y sus módulos.
     */
    public function update(Request $request, Rol $rol): RedirectResponse
    {
        $datos = $this->validar(request: $request, rol: $rol);
        $this->validarModulosPermitidosPorRol($datos);

        $datosAnteriores = [
            'nombre' => $rol->nombre,
            'descripcion' => $rol->descripcion,
            'estado' => $rol->estado ? 'Activo' : 'Inactivo',
            'modulos' => $rol->modulos()->pluck('modulos.id')->all(),
        ];

        try {
            DB::transaction(function () use ($datos, $rol, $datosAnteriores) {
                $rol->update([
                    'nombre' => trim($datos['nombre']),
                    'descripcion' => $this->nullable($datos['descripcion'] ?? null),
                    'estado' => (bool) $datos['estado'],
                ]);

                $rol->modulos()->sync($datos['modulos']);

                // Directiva 12.11 DRE Ancash - b) Administración de usuarios, roles y permisos
                AuditoriaService::registrar(
                    componente: 'seguridad_usuarios',
                    operacion: 'ACTUALIZAR',
                    descripcion: "Actualización de perfil de rol: '{$rol->nombre}' y sincronización de privilegios/módulos",
                    registroId: (string) $rol->id,
                    anteriores: $datosAnteriores,
                    nuevos: [
                        'nombre' => $rol->nombre,
                        'descripcion' => $rol->descripcion,
                        'estado' => $rol->estado ? 'Activo' : 'Inactivo',
                        'modulos' => $datos['modulos'],
                    ],
                    resultado: 'EXITO'
                );
            });

            return to_route('roles.index')->with('success', 'Rol actualizado correctamente.');
        } catch (Throwable $e) {
            AuditoriaService::registrar(
                componente: 'seguridad_usuarios',
                operacion: 'ACTUALIZAR',
                descripcion: "Fallo al actualizar el rol ID {$rol->id}",
                registroId: (string) $rol->id,
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return back()->withErrors(['error' => 'Error al actualizar el rol: ' . $e->getMessage()]);
        }
    }

    /**
     * Cambia el estado del rol.
     */
    public function actualizarEstado(Request $request, Rol $rol): RedirectResponse
    {
        $datos = $request->validate(
            ['estado' => ['required', 'boolean']],
            [
                'estado.required' => 'Debe indicar el nuevo estado.',
                'estado.boolean' => 'El estado seleccionado no es válido.',
            ]
        );

        $nuevoEstado = (bool) $datos['estado'];
        $estadoAnterior = $rol->estado;

        if (! $nuevoEstado && $rol->usuarios()->exists()) {
            AuditoriaService::registrar(
                componente: 'seguridad_usuarios',
                operacion: 'ACTUALIZAR',
                descripcion: "Intento bloqueado de desactivar rol '{$rol->nombre}': posee usuarios activos asignados",
                registroId: (string) $rol->id,
                resultado: 'BLOQUEADO',
                motivoFallo: 'Rol con asignaciones activas en la tabla usuario_roles'
            );

            throw ValidationException::withMessages([
                'estado' => 'No se puede desactivar el rol porque está asignado a uno o más usuarios.',
            ]);
        }

        try {
            $rol->update(['estado' => $nuevoEstado]);

            AuditoriaService::registrar(
                componente: 'seguridad_usuarios',
                operacion: 'ACTUALIZAR',
                descripcion: "Cambio de estado del rol '{$rol->nombre}' de " . ($estadoAnterior ? 'Activo' : 'Inactivo') . ' a ' . ($nuevoEstado ? 'Activo' : 'Inactivo'),
                registroId: (string) $rol->id,
                anteriores: ['estado' => $estadoAnterior ? 'Activo' : 'Inactivo'],
                nuevos: ['estado' => $nuevoEstado ? 'Activo' : 'Inactivo'],
                resultado: 'EXITO'
            );

            return back()->with(
                'success',
                $nuevoEstado ? 'Rol activado correctamente.' : 'Rol desactivado correctamente.'
            );
        } catch (Throwable $e) {
            AuditoriaService::registrar(
                componente: 'seguridad_usuarios',
                operacion: 'ACTUALIZAR',
                descripcion: "Fallo al cambiar estado del rol ID {$rol->id}",
                registroId: (string) $rol->id,
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return back()->withErrors(['error' => 'Error al cambiar estado del rol: ' . $e->getMessage()]);
        }
    }

    /**
     * Retorna los módulos asignados al rol.
     */
    public function modulosAsignados(Rol $rol): JsonResponse
    {
        $rol->load(['modulos:id,nombre,descripcion']);

        return response()->json([
            'rol' => [
                'id' => $rol->id,
                'nombre' => $rol->nombre,
                'descripcion' => $rol->descripcion,
                'estado' => (bool) $rol->estado,
            ],
            'modulos' => $rol->modulos->map(fn (Modulo $modulo) => [
                'id' => $modulo->id,
                'nombre' => $modulo->nombre,
                'descripcion' => $modulo->descripcion,
            ])->values(),
        ]);
    }

    /**
     * Elimina un rol que no tenga usuarios.
     */
    public function destroy(Rol $rol): RedirectResponse
    {
        if ($rol->usuarios()->exists()) {
            AuditoriaService::registrar(
                componente: 'seguridad_usuarios',
                operacion: 'ELIMINAR',
                descripcion: "Intento bloqueado de eliminar el rol '{$rol->nombre}': está asignado a usuarios",
                registroId: (string) $rol->id,
                resultado: 'BLOQUEADO',
                motivoFallo: 'Dependencia relacional en usuario_roles'
            );

            return back()->with('error', 'No se puede eliminar el rol porque está asignado a uno o más usuarios.');
        }

        $datosEliminados = [
            'id' => $rol->id,
            'nombre' => $rol->nombre,
            'descripcion' => $rol->descripcion,
            'modulos' => $rol->modulos()->pluck('modulos.id')->all(),
        ];

        try {
            DB::transaction(function () use ($rol, $datosEliminados) {
                $rol->modulos()->detach();
                $rol->delete();

                AuditoriaService::registrar(
                    componente: 'seguridad_usuarios',
                    operacion: 'ELIMINAR',
                    descripcion: "Eliminación de rol institucional '{$datosEliminados['nombre']}' y desvinculación de permisos",
                    registroId: (string) $datosEliminados['id'],
                    anteriores: $datosEliminados,
                    resultado: 'EXITO'
                );
            });

            return back()->with('success', 'Rol eliminado correctamente.');
        } catch (Throwable $e) {
            AuditoriaService::registrar(
                componente: 'seguridad_usuarios',
                operacion: 'ELIMINAR',
                descripcion: "Fallo durante la eliminación del rol ID {$rol->id}",
                registroId: (string) $rol->id,
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return back()->withErrors(['error' => 'Error al eliminar el rol: ' . $e->getMessage()]);
        }
    }

    /**
     * Consulta reutilizable para el listado.
     */
    private function obtenerRoles(string $buscar = '', ?int $estado = null, int $pagina = 1)
    {
        return Rol::query()
            ->withCount(['modulos', 'usuarios'])
            ->when($buscar !== '', function (Builder $query) use ($buscar) {
                $query->where(function (Builder $subquery) use ($buscar) {
                    $subquery->where('nombre', 'like', "%{$buscar}%")
                        ->orWhere('descripcion', 'like', "%{$buscar}%");
                });
            })
            ->when($estado !== null, fn (Builder $query) => $query->where('estado', $estado))
            ->orderByDesc('estado')
            ->orderBy('nombre')
            ->paginate(
                perPage: 10,
                columns: ['id', 'nombre', 'descripcion', 'estado', 'created_at', 'updated_at'],
                pageName: 'page',
                page: $pagina
            );
    }

    /**
     * Valida la creación y actualización.
     */
    private function validar(Request $request, ?Rol $rol = null): array
    {
        return $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:100',
                Rule::unique('roles', 'nombre')->ignore($rol?->id),
            ],
            'descripcion' => ['nullable', 'string', 'max:500'],
            'estado' => ['required', 'boolean'],
            'modulos' => ['required', 'array', 'min:1'],
            'modulos.*' => ['required', 'integer', 'distinct', 'exists:modulos,id'],
        ], [
            'nombre.required' => 'Debe ingresar el nombre del rol.',
            'nombre.string' => 'El nombre del rol no es válido.',
            'nombre.max' => 'El nombre del rol no puede superar los 100 caracteres.',
            'nombre.unique' => 'Ya existe un rol con ese nombre.',
            'descripcion.string' => 'La descripción del rol no es válida.',
            'descripcion.max' => 'La descripción no puede superar los 500 caracteres.',
            'estado.required' => 'Debe seleccionar el estado del rol.',
            'estado.boolean' => 'El estado seleccionado no es válido.',
            'modulos.required' => 'Debe seleccionar al menos un módulo.',
            'modulos.array' => 'La selección de módulos no es válida.',
            'modulos.min' => 'Debe seleccionar al menos un módulo.',
            'modulos.*.required' => 'Uno de los módulos seleccionados no es válido.',
            'modulos.*.integer' => 'Uno de los módulos seleccionados no es válido.',
            'modulos.*.distinct' => 'No puede seleccionar dos veces el mismo módulo.',
            'modulos.*.exists' => 'Uno de los módulos seleccionados no existe.',
        ]);
    }

    /**
     * Aplica las reglas especiales de módulos por rol.
     */
    private function validarModulosPermitidosPorRol(array $datos): void
    {
        $nombreRol = $this->normalizarTexto($datos['nombre'] ?? '');
        $idsSeleccionados = collect($datos['modulos'] ?? [])->map(fn ($id) => (int) $id)->unique()->values();
        $modulosSeleccionados = Modulo::query()->whereIn('id', $idsSeleccionados)->get(['id', 'nombre']);

        $moduloEstudiante = $this->obtenerModuloEspecial('estudiante');
        $moduloDocente = $this->obtenerModuloEspecial('docente');

        if ($nombreRol === 'estudiante') {
            if (! $moduloEstudiante) {
                throw ValidationException::withMessages([
                    'modulos' => 'No existe el módulo Estudiante en el sistema.',
                ]);
            }

            $soloModuloEstudiante = $idsSeleccionados->count() === 1 &&
                $idsSeleccionados->contains((int) $moduloEstudiante->id);

            if (! $soloModuloEstudiante) {
                throw ValidationException::withMessages([
                    'modulos' => 'El rol Estudiante solo puede tener asignado el módulo Estudiante.',
                ]);
            }

            return;
        }

        if ($nombreRol === 'docente') {
            if ($moduloEstudiante && $idsSeleccionados->contains((int) $moduloEstudiante->id)) {
                throw ValidationException::withMessages([
                    'modulos' => 'El rol Docente no puede tener asignado el módulo Estudiante.',
                ]);
            }

            return;
        }

        $idsRestringidos = collect([$moduloEstudiante?->id, $moduloDocente?->id])
            ->filter(fn ($id) => $id !== null)
            ->map(fn ($id) => (int) $id)
            ->values();

        $modulosNoPermitidos = $modulosSeleccionados
            ->filter(fn (Modulo $modulo) => $idsRestringidos->contains((int) $modulo->id))
            ->pluck('nombre')
            ->values();

        if ($modulosNoPermitidos->isNotEmpty()) {
            throw ValidationException::withMessages([
                'modulos' => 'El rol ' . trim($datos['nombre']) . ' no puede tener asignados los módulos: ' . $modulosNoPermitidos->join(', ') . '.',
            ]);
        }
    }

    private function obtenerModuloEspecial(string $nombre): ?Modulo
    {
        $nombreNormalizado = $this->normalizarTexto($nombre);

        return Modulo::query()
            ->get(['id', 'nombre', 'descripcion'])
            ->first(fn (Modulo $modulo) => $this->normalizarTexto($modulo->nombre) === $nombreNormalizado);
    }

    private function normalizarTexto(?string $texto): string
    {
        return str(trim((string) $texto))->lower()->ascii()->toString();
    }

    private function modulos()
    {
        return Modulo::query()->orderBy('nombre')->get(['id', 'nombre', 'descripcion']);
    }

    private function estados(): array
    {
        return [
            ['value' => 1, 'label' => 'Activo'],
            ['value' => 0, 'label' => 'Inactivo'],
        ];
    }

    private function nullable(mixed $valor): mixed
    {
        if (is_string($valor) && trim($valor) === '') {
            return null;
        }

        return is_string($valor) ? trim($valor) : $valor;
    }
}