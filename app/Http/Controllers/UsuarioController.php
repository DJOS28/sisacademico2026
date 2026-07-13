<?php

namespace App\Http\Controllers;

use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
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
            'roles' => $roles,
        ]);
    }

    /**
     * Búsqueda AJAX mediante POST para no exponer filtros en la URL.
     */
    public function buscar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['Activo', 'Inactivo'])],
            'rol_id' => ['nullable', 'integer', Rule::exists('roles', 'id')],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $search = trim((string) ($validated['search'] ?? ''));
        $status = trim((string) ($validated['status'] ?? ''));
        $rolId = $validated['rol_id'] ?? null;
        $page = (int) ($validated['page'] ?? 1);

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
            'password.required' => 'La nueva contraseña es obligatoria.',
            'password.min' => 'La nueva contraseña debe tener al menos 8 caracteres.',
            'password.confirmed' => 'La confirmación de contraseña no coincide.',
        ]);

        $usuario->update([
            'password_hash' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'message' => 'La contraseña se actualizó correctamente.',
        ]);
    }

    /**
     * Restablece la contraseña del usuario a 123456.
     */
    public function resetearClave(Usuario $usuario): JsonResponse
    {
        $usuario->update([
            'password_hash' => Hash::make('123456'),
        ]);

        return response()->json([
            'message' => 'La contraseña fue restablecida correctamente.',
            'temporary_password' => '123456',
        ]);
    }

    /**
     * Asigna o reemplaza los roles del usuario.
     */
    public function actualizarRoles(
        Request $request,
        Usuario $usuario
    ): JsonResponse {
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
            'role_ids.required' =>
            'Debe seleccionar por lo menos un rol.',

            'role_ids.array' =>
            'La lista de roles no tiene un formato válido.',

            'role_ids.min' =>
            'Debe seleccionar por lo menos un rol.',

            'role_ids.*.integer' =>
            'Uno de los roles seleccionados no es válido.',

            'role_ids.*.exists' =>
            'Uno de los roles seleccionados no existe.',

            'role_ids.*.distinct' =>
            'No se deben seleccionar roles repetidos.',
        ]);

        $rolesSeleccionados = Rol::query()
            ->whereIn('id', $validated['role_ids'])
            ->get(['id', 'nombre']);

        $nombresRoles = $rolesSeleccionados
            ->pluck('nombre')
            ->map(
                fn($nombre) => mb_strtolower(
                    trim($nombre),
                    'UTF-8'
                )
            );

        $seleccionaEstudiante = $nombresRoles->contains('estudiante');
        $seleccionaDocente = $nombresRoles->contains('docente');

        /*
    |--------------------------------------------------------------------------
    | Verificar el tipo real del usuario
    |--------------------------------------------------------------------------
    */

        $esEstudiante = DB::table('postulantes')
            ->where('usuario_id', $usuario->id)
            ->exists();

        $esDocente = DB::table('docentes')
            ->where('usuario_id', $usuario->id)
            ->exists();

        /*
    |--------------------------------------------------------------------------
    | El rol Estudiante es exclusivo
    |--------------------------------------------------------------------------
    */

        if ($seleccionaEstudiante && $rolesSeleccionados->count() > 1) {
            throw ValidationException::withMessages([
                'role_ids' => [
                    'El rol Estudiante es exclusivo y no puede combinarse con otros roles.',
                ],
            ]);
        }

        /*
    |--------------------------------------------------------------------------
    | El rol Docente es exclusivo
    |--------------------------------------------------------------------------
    */

        if ($seleccionaDocente && $rolesSeleccionados->count() > 1) {
            throw ValidationException::withMessages([
                'role_ids' => [
                    'El rol Docente es exclusivo y no puede combinarse con otros roles.',
                ],
            ]);
        }

        /*
    |--------------------------------------------------------------------------
    | Solo un estudiante registrado puede tener ese rol
    |--------------------------------------------------------------------------
    */

        if ($seleccionaEstudiante && ! $esEstudiante) {
            throw ValidationException::withMessages([
                'role_ids' => [
                    'Este usuario no está registrado como estudiante y no puede recibir el rol Estudiante.',
                ],
            ]);
        }

        /*
    |--------------------------------------------------------------------------
    | Solo un docente registrado puede tener ese rol
    |--------------------------------------------------------------------------
    */

        if ($seleccionaDocente && ! $esDocente) {
            throw ValidationException::withMessages([
                'role_ids' => [
                    'Este usuario no está registrado como docente y no puede recibir el rol Docente.',
                ],
            ]);
        }

        /*
    |--------------------------------------------------------------------------
    | Un estudiante registrado solo puede conservar Estudiante
    |--------------------------------------------------------------------------
    */

        if (
            $esEstudiante &&
            (
                ! $seleccionaEstudiante ||
                $rolesSeleccionados->count() !== 1
            )
        ) {
            throw ValidationException::withMessages([
                'role_ids' => [
                    'Un usuario registrado como estudiante solo puede tener el rol Estudiante.',
                ],
            ]);
        }

        /*
    |--------------------------------------------------------------------------
    | Un docente registrado solo puede conservar Docente
    |--------------------------------------------------------------------------
    */

        if (
            $esDocente &&
            (
                ! $seleccionaDocente ||
                $rolesSeleccionados->count() !== 1
            )
        ) {
            throw ValidationException::withMessages([
                'role_ids' => [
                    'Un usuario registrado como docente solo puede tener el rol Docente.',
                ],
            ]);
        }

        /*
    |--------------------------------------------------------------------------
    | Asignar roles
    |--------------------------------------------------------------------------
    */

        $usuario->roles()->sync(
            $rolesSeleccionados->pluck('id')->all()
        );

        $usuario->load('roles:id,nombre');

        return response()->json([
            'message' =>
            'Los roles del usuario se actualizaron correctamente.',

            'roles' => $usuario->roles
                ->map(fn(Rol $rol) => [
                    'id' => $rol->id,
                    'nombre' => $rol->nombre,
                ])
                ->values(),
        ]);
    }

    /**
     * Cambia el estado de acceso del usuario.
     */
    public function actualizarEstado(Request $request, Usuario $usuario): JsonResponse
    {
        $validated = $request->validate([
            'status' => [
                'required',
                Rule::in(['Activo', 'Inactivo']),
            ],
        ], [
            'status.required' => 'El estado es obligatorio.',
            'status.in' => 'El estado seleccionado no es válido.',
        ]);

        $usuario->update([
            'status' => $validated['status'],
        ]);

        return response()->json([
            'message' => 'El estado del usuario se actualizó correctamente.',
            'status' => $usuario->status,
        ]);
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
            'id' => $usuario->id,
            'moodle_user_id' => $usuario->moodle_user_id,
            'username' => $usuario->username,
            'status' => $usuario->status,
            'img' => $usuario->img,
            'created_at' => optional($usuario->created_at)?->format('d/m/Y H:i'),
            'updated_at' => optional($usuario->updated_at)?->format('d/m/Y H:i'),
            'roles' => $usuario->roles
                ->map(fn(Rol $rol) => [
                    'id' => $rol->id,
                    'nombre' => $rol->nombre,
                ])
                ->values(),
        ];
    }
}
