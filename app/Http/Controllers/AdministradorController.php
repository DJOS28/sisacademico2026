<?php

namespace App\Http\Controllers;

use App\Models\Administrador;
use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdministradorController extends Controller
{
    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->input('buscar', ''));
        $estado = trim((string) $request->input('estado', ''));

        $administradores = Administrador::query()
            ->with(['usuario.roles'])
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($subquery) use ($buscar) {
                    $subquery
                        ->where('dni', 'like', "%{$buscar}%")
                        ->orWhere('nombre', 'like', "%{$buscar}%")
                        ->orWhere('apellido', 'like', "%{$buscar}%")
                        ->orWhere('email', 'like', "%{$buscar}%")
                        ->orWhereHas(
                            'usuario',
                            fn($usuario) =>
                            $usuario->where('username', 'like', "%{$buscar}%")
                        );
                });
            })
            ->when(
                $estado !== '',
                fn($query) =>
                $query->whereHas(
                    'usuario',
                    fn($usuario) =>
                    $usuario->where('status', $estado)
                )
            )
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Administradores/Index', [
            'administradores' => $administradores,
            'filtros' => [
                'buscar' => $buscar,
                'estado' => $estado,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Administradores/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        DB::transaction(function () use ($datos): void {
            $usuario = Usuario::create([
                'username' => $datos['username'],
                'password_hash' => Hash::make($datos['password']),
                'status' => $datos['status'],
                'img' => $datos['img'] ?? null,
            ]);

            $rolAdministrador = Rol::query()
                ->whereRaw('LOWER(nombre) = ?', ['administrador'])
                ->first();

            if ($rolAdministrador) {
                $usuario->roles()->sync([$rolAdministrador->id]);
            }

            Administrador::create([
                'usuario_id' => $usuario->id,
                'dni' => $datos['dni'],
                'nombre' => $datos['nombre'],
                'apellido' => $datos['apellido'],
                'email' => $datos['email'],
                'telefono' => $datos['telefono'] ?? null,
                'direccion' => $datos['direccion'] ?? null,
            ]);
        });

        return to_route('administradores.index')
            ->with('success', 'Administrador registrado correctamente.');
    }

    public function edit(Administrador $administrador): Response
    {
        // Carga ansiosa para asegurar que el usuario y sus roles existan en memoria
        $administrador->loadMissing('usuario.roles');

        return Inertia::render('Administradores/Edit', [
            'administrador' => $this->administradorData($administrador),
        ]);
    }

    public function update(Request $request, Administrador $administrador): RedirectResponse
    {
        $datos = $this->validar($request, $administrador);

        DB::transaction(function () use ($datos, $administrador): void {
            $usuario = $administrador->usuario;

            // Si por algún registro inconsistente no tuviese usuario asociado, se crea uno
            if (! $usuario) {
                $usuario = Usuario::create([
                    'username' => $datos['username'],
                    'password_hash' => Hash::make($datos['password'] ?? '12345678'),
                    'status' => $datos['status'],
                    'img' => $datos['img'] ?? null,
                ]);

                $administrador->update(['usuario_id' => $usuario->id]);
            } else {
                $payloadUsuario = [
                    'username' => $datos['username'],
                    'status' => $datos['status'],
                    'img' => $datos['img'] ?? $usuario->img,
                ];

                if (! empty($datos['password'])) {
                    $payloadUsuario['password_hash'] = Hash::make($datos['password']);
                }

                $usuario->update($payloadUsuario);
            }

            $rolAdministrador = Rol::query()
                ->whereRaw('LOWER(nombre) = ?', ['administrador'])
                ->first();

            if ($rolAdministrador) {
                $usuario->roles()->syncWithoutDetaching([$rolAdministrador->id]);
            }

            $administrador->update([
                'dni' => $datos['dni'],
                'nombre' => $datos['nombre'],
                'apellido' => $datos['apellido'],
                'email' => $datos['email'],
                'telefono' => $datos['telefono'] ?? null,
                'direccion' => $datos['direccion'] ?? null,
            ]);
        });

        return to_route('administradores.index')
            ->with('success', 'Administrador actualizado correctamente.');
    }

    public function actualizarEstado(Request $request, Administrador $administrador): RedirectResponse
    {
        $datos = $request->validate([
            // Incluye 'Desactivado' para soportar desbloqueos desde el listado
            'status' => ['required', Rule::in(['Activo', 'Inactivo', 'Desactivado'])],
        ]);

        if ($administrador->usuario) {
            $administrador->usuario->update([
                'status' => $datos['status'],
            ]);
        }

        return back()->with('success', 'Estado actualizado correctamente.');
    }

    private function validar(
        Request $request,
        ?Administrador $administrador = null
    ): array {
        $usuarioId = $administrador?->usuario_id;
        $administradorId = $administrador?->id;

        return $request->validate([
            'dni' => [
                'required',
                'string',
                'max:15',
                Rule::unique('administradores', 'dni')
                    ->ignore($administradorId),
                function (string $attribute, mixed $value, \Closure $fail) use ($administradorId): void {
                    if ($this->identidadExisteEnOtraTabla('dni', $value, 'administradores', $administradorId)) {
                        $fail('El DNI ya está registrado en otro perfil del sistema.');
                    }
                },
            ],
            'nombre' => ['required', 'string', 'max:100'],
            'apellido' => ['required', 'string', 'max:100'],
            'email' => [
                'required',
                'email',
                'max:150',
                Rule::unique('administradores', 'email')
                    ->ignore($administradorId),
                function (string $attribute, mixed $value, \Closure $fail) use ($administradorId): void {
                    if ($this->identidadExisteEnOtraTabla('email', mb_strtolower(trim($value)), 'administradores', $administradorId)) {
                        $fail('El correo electrónico ya está registrado en otro perfil del sistema.');
                    }
                },
            ],
            'telefono' => ['nullable', 'string', 'max:20'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'username' => [
                'required',
                'string',
                'max:50',
                Rule::unique('usuarios', 'username')
                    ->ignore($usuarioId),
            ],
            'password' => [
                $administrador ? 'nullable' : 'required',
                'string',
                'min:8',
                'confirmed',
            ],
            'status' => [
                'required',
                Rule::in(['Activo', 'Inactivo', 'Desactivado']),
            ],
            'img' => ['nullable', 'string', 'max:255'],
        ]);
    }

    private function administradorData(Administrador $administrador): array
    {
        return [
            'id' => $administrador->id,
            'dni' => $administrador->dni ?? '',
            'nombre' => $administrador->nombre ?? '',
            'apellido' => $administrador->apellido ?? '',
            'email' => $administrador->email ?? '',
            'telefono' => $administrador->telefono ?? '',
            'direccion' => $administrador->direccion ?? '',
            'usuario' => [
                'id' => $administrador->usuario?->id,
                'username' => $administrador->usuario?->username ?? '',
                'status' => $administrador->usuario?->status ?? 'Activo',
                'img' => $administrador->usuario?->img ?? '',
            ],
        ];
    }

    private function identidadExisteEnOtraTabla(
        string $columna,
        mixed $valor,
        string $tablaActual,
        ?int $registroActualId = null
    ): bool {
        $tablas = [
            'administradores',
            'docentes',
            'personal',
            'cajeros',
            'postulantes',
        ];

        foreach ($tablas as $tabla) {
            if (! Schema::hasTable($tabla) || ! Schema::hasColumn($tabla, $columna)) {
                continue;
            }

            $query = DB::table($tabla);

            if ($columna === 'email') {
                $query->whereRaw(
                    'LOWER(TRIM(email)) = ?',
                    [mb_strtolower(trim((string) $valor))]
                );
            } else {
                $query->where($columna, trim((string) $valor));
            }

            if (
                $tabla === $tablaActual &&
                $registroActualId !== null &&
                Schema::hasColumn($tabla, 'id')
            ) {
                $query->where('id', '!=', $registroActualId);
            }

            if ($query->exists()) {
                return true;
            }
        }

        return false;
    }
}