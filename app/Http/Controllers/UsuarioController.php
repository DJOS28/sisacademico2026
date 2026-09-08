<?php

namespace App\Http\Controllers;

use App\Models\Rol;
use App\Models\Usuario;
use App\Services\AuditoriaService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class UsuarioController extends Controller
{
    /**
     * Lista inicial de usuarios.
     */
    public function index(): Response
    {
        $usuarios = $this->usuariosQuery()
            ->paginate(10)
            ->through(fn(Usuario $usuario) => $this->usuarioData($usuario));

        $roles = Rol::query()
            ->orderBy('nombre')
            ->get(['id', 'nombre']);

        return Inertia::render('Usuarios/Index', [
            'usuarios' => $usuarios,
            'roles'    => $roles,
        ]);
    }

    /**
     * Búsqueda AJAX mediante POST para no exponer filtros en la URL.
     */
    public function buscar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['Activo', 'Inactivo', 'Disponible', 'Desactivado'])],
            'rol_id' => ['nullable', 'integer', Rule::exists('roles', 'id')],
            'page'   => ['nullable', 'integer', 'min:1'],
        ]);

        $search = trim((string) ($validated['search'] ?? ''));
        $status = trim((string) ($validated['status'] ?? ''));
        $rolId  = $validated['rol_id'] ?? null;
        $page   = (int) ($validated['page'] ?? 1);

        $usuarios = $this->usuariosQuery()
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $subquery) use ($search) {
                    $subquery
                        ->where('username', 'like', "%{$search}%")
                        ->orWhere('moodle_user_id', 'like', "%{$search}%");
                });
            })
            ->when($status !== '', function (Builder $query) use ($status) {
                $query->where('status', $status);
            })
            ->when($rolId, function (Builder $query) use ($rolId) {
                $query->whereHas('roles', function (Builder $roleQuery) use ($rolId) {
                    $roleQuery->where('roles.id', $rolId);
                });
            })
            ->paginate(10, ['*'], 'page', $page)
            ->through(fn(Usuario $usuario) => $this->usuarioData($usuario));

        return response()->json([
            'usuarios' => $usuarios,
        ]);
    }

    /**
     * Devuelve el detalle del usuario y sus roles.
     */
    public function show(Usuario $usuario): JsonResponse
    {
        $usuario->load('roles:id,nombre');

        return response()->json([
            'usuario' => $this->usuarioData($usuario),
        ]);
    }

    /**
     * Cambia la contraseña por una nueva definida por el administrador.
     */
    public function cambiarClave(Request $request, Usuario $usuario): JsonResponse
    {
        $validated = $request->validate([
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],
        ], [
            'password.required'  => 'La nueva contraseña es obligatoria.',
            'password.min'       => 'La nueva contraseña debe tener al menos 8 caracteres.',
            'password.confirmed' => 'La confirmación de contraseña no coincide.',
        ]);

        try {
            $usuario->update([
                'password_hash' => Hash::make($validated['password']),
            ]);

            // Auditoría: b) Administración de usuarios, roles y permisos
            AuditoriaService::registrar(
                componente: 'seguridad_usuarios',
                operacion: 'ACTUALIZAR',
                descripcion: "Cambio manual de credenciales de acceso para @{$usuario->username}",
                registroId: (string) $usuario->id,
                nuevos: ['clave_modificada' => true],
                resultado: 'EXITO'
            );

            return response()->json([
                'message' => 'La contraseña se actualizó correctamente.',
            ]);
        } catch (Throwable $e) {
            AuditoriaService::registrar(
                componente: 'seguridad_usuarios',
                operacion: 'ACTUALIZAR',
                descripcion: "Fallo al cambiar contraseña para @{$usuario->username}",
                registroId: (string) $usuario->id,
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return response()->json(['error' => 'No se pudo actualizar la contraseña.'], 500);
        }
    }

    /**
     * Restablece la contraseña del usuario a 123456.
     */
    public function resetearClave(Usuario $usuario): JsonResponse
    {
        try {
            $usuario->update([
                'password_hash' => Hash::make('123456'),
            ]);

            // Auditoría: b) Administración de usuarios, roles y permisos
            AuditoriaService::registrar(
                componente: 'seguridad_usuarios',
                operacion: 'ACTUALIZAR',
                descripcion: "Restablecimiento forzado de contraseña por defecto para @{$usuario->username}",
                registroId: (string) $usuario->id,
                nuevos: ['clave_restablecida' => true],
                resultado: 'EXITO'
            );

            return response()->json([
                'message'            => 'La contraseña fue restablecida correctamente.',
                'temporary_password' => '123456',
            ]);
        } catch (Throwable $e) {
            AuditoriaService::registrar(
                componente: 'seguridad_usuarios',
                operacion: 'ACTUALIZAR',
                descripcion: "Fallo al restablecer contraseña por defecto para @{$usuario->username}",
                registroId: (string) $usuario->id,
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return response()->json(['error' => 'No se pudo restablecer la contraseña.'], 500);
        }
    }

    /**
     * Asigna o reemplaza los roles del usuario.
     */
    public function actualizarRoles(Request $request, Usuario $usuario): JsonResponse
    {
        $validated = $request->validate([
            'role_ids' => [
                'required',
                'array',
                'min:1',
            ],
            'role_ids.*' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('roles', 'id'),
            ],
        ], [
            'role_ids.required'   => 'Debe seleccionar por lo menos un rol.',
            'role_ids.array'      => 'La lista de roles no tiene un formato válido.',
            'role_ids.min'        => 'Debe seleccionar por lo menos un rol.',
            'role_ids.*.integer'  => 'Uno de los roles seleccionados no es válido.',
            'role_ids.*.exists'   => 'Uno de los roles seleccionados no existe.',
            'role_ids.*.distinct' => 'No se deben seleccionar roles repetidos.',
        ]);

        $rolesSeleccionados = Rol::query()
            ->whereIn('id', $validated['role_ids'])
            ->get(['id', 'nombre']);

        $nombresRoles = $rolesSeleccionados
            ->pluck('nombre')
            ->map(fn($nombre) => mb_strtolower(trim($nombre), 'UTF-8'));

        $seleccionaEstudiante = $nombresRoles->contains('estudiante');
        $seleccionaDocente    = $nombresRoles->contains('docente');

        // Verificar el tipo de usuario en la base de datos
        $esEstudiante = DB::table('postulantes')->where('usuario_id', $usuario->id)->exists();
        $esDocente    = DB::table('docentes')->where('usuario_id', $usuario->id)->exists();

        /*
        |--------------------------------------------------------------------------
        | 1. El rol Estudiante es exclusivo y solo para matriculados/postulantes
        |--------------------------------------------------------------------------
        */
        if ($seleccionaEstudiante && $rolesSeleccionados->count() > 1) {
            AuditoriaService::registrar(
                componente: 'seguridad_usuarios',
                operacion: 'ACTUALIZAR',
                descripcion: "Intento bloqueado de combinar rol 'Estudiante' con otros perfiles para @{$usuario->username}",
                registroId: (string) $usuario->id,
                resultado: 'BLOQUEADO',
                motivoFallo: 'El rol Estudiante es de asignación exclusiva'
            );

            throw ValidationException::withMessages([
                'role_ids' => [
                    'El rol Estudiante es exclusivo y no puede combinarse con otros roles administrativos, docentes o de supervisión.',
                ],
            ]);
        }

        if ($seleccionaEstudiante && !$esEstudiante) {
            AuditoriaService::registrar(
                componente: 'seguridad_usuarios',
                operacion: 'ACTUALIZAR',
                descripcion: "Intento bloqueado de asignar rol 'Estudiante' a un no matriculado (@{$usuario->username})",
                registroId: (string) $usuario->id,
                resultado: 'BLOQUEADO',
                motivoFallo: 'El usuario no existe en la tabla postulantes'
            );

            throw ValidationException::withMessages([
                'role_ids' => [
                    'Este usuario no está registrado en el padrón de estudiantes/postulantes y no puede recibir el rol Estudiante.',
                ],
            ]);
        }

        if ($esEstudiante && (!$seleccionaEstudiante || $rolesSeleccionados->count() !== 1)) {
            AuditoriaService::registrar(
                componente: 'seguridad_usuarios',
                operacion: 'ACTUALIZAR',
                descripcion: "Intento bloqueado de remover o alterar rol único 'Estudiante' para @{$usuario->username}",
                registroId: (string) $usuario->id,
                resultado: 'BLOQUEADO',
                motivoFallo: 'Un alumno no puede recibir roles no permitidos'
            );

            throw ValidationException::withMessages([
                'role_ids' => [
                    'Un usuario registrado como estudiante solo puede conservar el rol Estudiante.',
                ],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | 2. Validación de Docente
        |--------------------------------------------------------------------------
        */
        if ($seleccionaDocente && !$esDocente) {
            AuditoriaService::registrar(
                componente: 'seguridad_usuarios',
                operacion: 'ACTUALIZAR',
                descripcion: "Intento bloqueado de asignar rol 'Docente' a usuario no docente (@{$usuario->username})",
                registroId: (string) $usuario->id,
                resultado: 'BLOQUEADO',
                motivoFallo: 'El usuario no existe en la tabla docentes'
            );

            throw ValidationException::withMessages([
                'role_ids' => [
                    'Este usuario no está registrado en el módulo de docentes y no puede recibir el rol Docente.',
                ],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | 3. Sincronizar roles y auditar
        |--------------------------------------------------------------------------
        */
        $rolesAnteriores = $usuario->roles->pluck('nombre')->toArray();

        try {
            $usuario->roles()->sync($rolesSeleccionados->pluck('id')->all());
            $usuario->load('roles:id,nombre');

            $rolesNuevos = $usuario->roles->pluck('nombre')->toArray();

            AuditoriaService::registrar(
                componente: 'seguridad_usuarios',
                operacion: 'ACTUALIZAR',
                descripcion: "Reasignación de roles y permisos para @{$usuario->username}: [" . implode(', ', $rolesNuevos) . "]",
                registroId: (string) $usuario->id,
                anteriores: ['roles' => $rolesAnteriores],
                nuevos: ['roles' => $rolesNuevos],
                resultado: 'EXITO'
            );

            return response()->json([
                'message' => 'Los roles del usuario se actualizaron correctamente.',
                'roles'   => $usuario->roles
                    ->map(fn(Rol $rol) => [
                        'id'     => $rol->id,
                        'nombre' => $rol->nombre,
                    ])
                    ->values(),
            ]);
        } catch (Throwable $e) {
            AuditoriaService::registrar(
                componente: 'seguridad_usuarios',
                operacion: 'ACTUALIZAR',
                descripcion: "Error en base de datos al sincronizar roles para @{$usuario->username}",
                registroId: (string) $usuario->id,
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return response()->json(['error' => 'No se pudieron actualizar los roles.'], 500);
        }
    }

    /**
     * Cambia el estado de acceso del usuario.
     */
    public function actualizarEstado(Request $request, Usuario $usuario): JsonResponse
    {
        $validated = $request->validate([
            'status' => [
                'required',
                Rule::in(['Activo', 'Inactivo', 'Disponible', 'Desactivado']),
            ],
        ], [
            'status.required' => 'El estado es obligatorio.',
            'status.in'       => 'El estado seleccionado no es válido.',
        ]);

        $statusAnterior = $usuario->status;
        $statusNuevo = $validated['status'];

        try {
            $usuario->update([
                'status' => $statusNuevo,
            ]);

            // Auditoría: b) Administración de usuarios, roles y permisos
            AuditoriaService::registrar(
                componente: 'seguridad_usuarios',
                operacion: 'ACTUALIZAR',
                descripcion: "Modificación del estado de acceso de @{$usuario->username} ({$statusAnterior} -> {$statusNuevo})",
                registroId: (string) $usuario->id,
                anteriores: ['status' => $statusAnterior],
                nuevos: ['status' => $statusNuevo],
                resultado: 'EXITO'
            );

            return response()->json([
                'message' => 'El estado del usuario se actualizó correctamente.',
                'status'  => $usuario->status,
            ]);
        } catch (Throwable $e) {
            AuditoriaService::registrar(
                componente: 'seguridad_usuarios',
                operacion: 'ACTUALIZAR',
                descripcion: "Fallo al cambiar estado de usuario @{$usuario->username}",
                registroId: (string) $usuario->id,
                resultado: 'FALLIDO',
                motivoFallo: $e->getMessage()
            );

            return response()->json(['error' => 'No se pudo actualizar el estado del usuario.'], 500);
        }
    }

    private function usuariosQuery(): Builder
    {
        return Usuario::query()
            ->with('roles:id,nombre')
            ->orderBy('username');
    }

    private function usuarioData(Usuario $usuario): array
    {
        return [
            'id'             => $usuario->id,
            'moodle_user_id' => $usuario->moodle_user_id,
            'username'       => $usuario->username,
            'status'         => $usuario->status,
            'img'            => $usuario->img,
            'created_at'     => optional($usuario->created_at)?->format('d/m/Y H:i'),
            'updated_at'     => optional($usuario->updated_at)?->format('d/m/Y H:i'),
            'roles'          => $usuario->roles
                ->map(fn(Rol $rol) => [
                    'id'     => $rol->id,
                    'nombre' => $rol->nombre,
                ])
                ->values(),
        ];
    }
}