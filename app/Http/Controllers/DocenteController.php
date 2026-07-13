<?php

namespace App\Http\Controllers;

use App\Http\Requests\Docente\StoreDocenteRequest;
use App\Http\Requests\Docente\UpdateDocenteRequest;
use App\Models\Docente;
use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Throwable;

class DocenteController extends Controller
{
    public function index(): Response
    {
        $docentes = $this->docentesQuery()
            ->paginate(10)
            ->through(
                fn (Docente $docente): array =>
                    $this->docenteData($docente)
            );

        return Inertia::render('Docentes/Index', [
            'docentes' => $docentes,
        ]);
    }

    /**
     * Búsqueda AJAX mediante POST.
     */
    public function buscar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => [
                'nullable',
                'string',
                'max:100',
            ],
            'status' => [
                'nullable',
                Rule::in([
                    'Activo',
                    'Inactivo',
                ]),
            ],
            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        $search = trim((string) ($validated['search'] ?? ''));
        $status = trim((string) ($validated['status'] ?? ''));

        $docentes = $this->docentesQuery()
            ->when(
                $search !== '',
                function (Builder $query) use ($search): void {
                    $query->where(
                        function (Builder $subquery) use ($search): void {
                            $subquery
                                ->where('nombre', 'like', "%{$search}%")
                                ->orWhere('apellido', 'like', "%{$search}%")
                                ->orWhere('dni', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%")
                                ->orWhere('telefono', 'like', "%{$search}%")
                                ->orWhere('departamento', 'like', "%{$search}%")
                                ->orWhere('cargo', 'like', "%{$search}%")
                                ->orWhereHas(
                                    'usuario',
                                    function (
                                        Builder $usuarioQuery
                                    ) use ($search): void {
                                        $usuarioQuery->where(
                                            'username',
                                            'like',
                                            "%{$search}%"
                                        );
                                    }
                                );
                        }
                    );
                }
            )
            ->when(
                $status !== '',
                function (Builder $query) use ($status): void {
                    $query->whereHas(
                        'usuario',
                        function (
                            Builder $usuarioQuery
                        ) use ($status): void {
                            $usuarioQuery->where(
                                'status',
                                $status
                            );
                        }
                    );
                }
            )
            ->paginate(
                10,
                ['*'],
                'page',
                (int) ($validated['page'] ?? 1)
            )
            ->through(
                fn (Docente $docente): array =>
                    $this->docenteData($docente)
            );

        return response()->json([
            'docentes' => $docentes,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Docentes/Create', [
            'estados' => [
                'Activo',
                'Inactivo',
            ],
        ]);
    }

    public function store(
        StoreDocenteRequest $request
    ): JsonResponse {
        try {
            $this->validarIdentidadGlobal(
                dni: (string) $request->input('dni'),
                email: (string) $request->input('email')
            );

            $docente = DB::transaction(
                function () use ($request): Docente {
                    $imagePath = null;

                    if ($request->hasFile('img')) {
                        $imagePath = $request
                            ->file('img')
                            ->store(
                                'usuarios/docentes',
                                'public'
                            );
                    }

                    $usuario = Usuario::create([
                        'moodle_user_id' => $request->input(
                            'moodle_user_id'
                        ),
                        'username' => $request
                            ->string('username')
                            ->trim()
                            ->toString(),
                        'password_hash' => Hash::make(
                            $request->input('password')
                        ),
                        'status' => $request->input(
                            'status',
                            'Activo'
                        ),
                        'img' => $imagePath,
                    ]);

                    $rolDocente = $this->obtenerRolDocente();

                    /*
                     * Docente es un rol exclusivo.
                     * No debe combinarse con otros roles.
                     */
                    $usuario->roles()->sync([
                        $rolDocente->id,
                    ]);

                    return Docente::create([
                        'usuario_id' => $usuario->id,
                        'nombre' => $request
                            ->string('nombre')
                            ->trim()
                            ->toString(),
                        'apellido' => $request
                            ->string('apellido')
                            ->trim()
                            ->toString(),
                        'dni' => trim(
                            (string) $request->input('dni')
                        ),
                        'email' => mb_strtolower(
                            trim(
                                (string) $request->input('email')
                            )
                        ),
                        'telefono' => $this->normalizarNullable(
                            $request->input('telefono')
                        ),
                        'direccion' => $this->normalizarNullable(
                            $request->input('direccion')
                        ),
                        'departamento' => $this->normalizarNullable(
                            $request->input('departamento')
                        ),
                        'cargo' => $this->normalizarNullable(
                            $request->input('cargo')
                        ),
                    ]);
                }
            );

            $docente->load([
                'usuario.roles',
            ]);

            return response()->json([
                'message' => 'Docente registrado correctamente.',
                'docente' => $this->docenteData($docente),
                'redirect' => route('docentes.index'),
            ], 201);
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'No se pudo registrar al docente.',
            ], 422);
        }
    }

    public function show(
        Docente $docente
    ): Response {
        $docente->load([
            'usuario.roles',
        ]);

        return Inertia::render('Docentes/Show', [
            'docente' => $this->docenteData($docente),
        ]);
    }

    public function edit(
        Docente $docente
    ): Response {
        $docente->load([
            'usuario.roles',
        ]);

        return Inertia::render('Docentes/Edit', [
            'docente' => $this->docenteData($docente),
            'estados' => [
                'Activo',
                'Inactivo',
            ],
        ]);
    }

    public function update(
        UpdateDocenteRequest $request,
        Docente $docente
    ): JsonResponse {
        try {
            $this->validarIdentidadGlobal(
                dni: (string) $request->input('dni'),
                email: (string) $request->input('email'),
                docenteActualId: $docente->id
            );

            DB::transaction(
                function () use (
                    $request,
                    $docente
                ): void {
                    $docente->loadMissing('usuario');

                    $usuario = $docente->usuario;

                    if (! $usuario) {
                        throw new RuntimeException(
                            'El docente no tiene un usuario relacionado.'
                        );
                    }

                    $imagePath = $usuario->img;

                    if (
                        $request->boolean('remove_img') &&
                        $imagePath
                    ) {
                        Storage::disk('public')->delete(
                            $imagePath
                        );

                        $imagePath = null;
                    }

                    if ($request->hasFile('img')) {
                        if ($imagePath) {
                            Storage::disk('public')->delete(
                                $imagePath
                            );
                        }

                        $imagePath = $request
                            ->file('img')
                            ->store(
                                'usuarios/docentes',
                                'public'
                            );
                    }

                    $usuarioData = [
                        'moodle_user_id' => $request->input(
                            'moodle_user_id'
                        ),
                        'username' => $request
                            ->string('username')
                            ->trim()
                            ->toString(),
                        'status' => $request->input(
                            'status',
                            'Activo'
                        ),
                        'img' => $imagePath,
                    ];

                    if ($request->filled('password')) {
                        $usuarioData['password_hash'] =
                            Hash::make(
                                $request->input('password')
                            );
                    }

                    $usuario->update($usuarioData);

                    $rolDocente = $this->obtenerRolDocente();

                    /*
                     * Mantiene el rol Docente como único rol.
                     */
                    $usuario->roles()->sync([
                        $rolDocente->id,
                    ]);

                    $docente->update([
                        'nombre' => $request
                            ->string('nombre')
                            ->trim()
                            ->toString(),
                        'apellido' => $request
                            ->string('apellido')
                            ->trim()
                            ->toString(),
                        'dni' => trim(
                            (string) $request->input('dni')
                        ),
                        'email' => mb_strtolower(
                            trim(
                                (string) $request->input('email')
                            )
                        ),
                        'telefono' => $this->normalizarNullable(
                            $request->input('telefono')
                        ),
                        'direccion' => $this->normalizarNullable(
                            $request->input('direccion')
                        ),
                        'departamento' => $this->normalizarNullable(
                            $request->input('departamento')
                        ),
                        'cargo' => $this->normalizarNullable(
                            $request->input('cargo')
                        ),
                    ]);
                }
            );

            $docente
                ->refresh()
                ->load([
                    'usuario.roles',
                ]);

            return response()->json([
                'message' => 'Docente actualizado correctamente.',
                'docente' => $this->docenteData($docente),
                'redirect' => route('docentes.index'),
            ]);
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'No se pudo actualizar al docente.',
            ], 422);
        }
    }

    public function destroy(
        Docente $docente
    ): JsonResponse {
        try {
            DB::transaction(
                function () use ($docente): void {
                    $docente->loadMissing('usuario');

                    $usuario = $docente->usuario;
                    $imagePath = $usuario?->img;

                    /*
                     * Primero se elimina la ficha del docente
                     * para liberar la FK docentes.usuario_id.
                     */
                    $docente->delete();

                    if ($usuario) {
                        $usuario->roles()->detach();
                        $usuario->areas()->detach();
                        $usuario->delete();
                    }

                    if ($imagePath) {
                        Storage::disk('public')->delete(
                            $imagePath
                        );
                    }
                }
            );

            return response()->json([
                'message' => 'Docente eliminado correctamente.',
            ]);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' =>
                    'No se pudo eliminar al docente. Puede tener registros académicos relacionados.',
            ], 422);
        }
    }

    private function docentesQuery(): Builder
    {
        return Docente::query()
            ->with([
                'usuario.roles',
            ])
            ->orderBy('apellido')
            ->orderBy('nombre');
    }

    private function obtenerRolDocente(): Rol
    {
        $rolDocente = Rol::query()
            ->whereRaw(
                'LOWER(TRIM(nombre)) = ?',
                ['docente']
            )
            ->where('estado', true)
            ->first();

        if (! $rolDocente) {
            throw new RuntimeException(
                'No existe un rol activo llamado "Docente". Regístrelo antes de crear docentes.'
            );
        }

        return $rolDocente;
    }

    private function validarIdentidadGlobal(
        string $dni,
        string $email,
        ?int $docenteActualId = null
    ): void {
        $errores = [];

        if ($this->valorExisteEnPerfiles(
            columna: 'dni',
            valor: trim($dni),
            tablaActual: 'docentes',
            registroActualId: $docenteActualId
        )) {
            $errores['dni'] = [
                'El DNI ya está registrado en otro perfil del sistema.',
            ];
        }

        if ($this->valorExisteEnPerfiles(
            columna: 'email',
            valor: mb_strtolower(trim($email)),
            tablaActual: 'docentes',
            registroActualId: $docenteActualId
        )) {
            $errores['email'] = [
                'El correo electrónico ya está registrado en otro perfil del sistema.',
            ];
        }

        if ($errores !== []) {
            throw ValidationException::withMessages(
                $errores
            );
        }
    }

    private function valorExisteEnPerfiles(
        string $columna,
        string $valor,
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
            if (! Schema::hasTable($tabla)) {
                continue;
            }

            if (! Schema::hasColumn(
                $tabla,
                $columna
            )) {
                continue;
            }

            $query = DB::table($tabla);

            if ($columna === 'email') {
                $query->whereRaw(
                    'LOWER(TRIM(email)) = ?',
                    [
                        mb_strtolower(trim($valor)),
                    ]
                );
            } else {
                $query->where(
                    $columna,
                    trim($valor)
                );
            }

            if (
                $tabla === $tablaActual &&
                $registroActualId !== null &&
                Schema::hasColumn($tabla, 'id')
            ) {
                $query->where(
                    'id',
                    '!=',
                    $registroActualId
                );
            }

            if ($query->exists()) {
                return true;
            }
        }

        return false;
    }

    private function normalizarNullable(
        mixed $valor
    ): ?string {
        $valor = trim((string) $valor);

        return $valor !== ''
            ? $valor
            : null;
    }

    private function docenteData(
        Docente $docente
    ): array {
        $usuario = $docente->usuario;

        return [
            'id' => $docente->id,
            'usuario_id' => $docente->usuario_id,
            'nombre' => $docente->nombre,
            'apellido' => $docente->apellido,
            'nombre_completo' => trim(
                "{$docente->nombre} {$docente->apellido}"
            ),
            'dni' => $docente->dni,
            'email' => $docente->email,
            'telefono' => $docente->telefono,
            'direccion' => $docente->direccion,
            'departamento' => $docente->departamento,
            'cargo' => $docente->cargo,
            'created_at' => optional(
                $docente->created_at
            )?->format('d/m/Y H:i'),
            'updated_at' => optional(
                $docente->updated_at
            )?->format('d/m/Y H:i'),

            'usuario' => $usuario
                ? [
                    'id' => $usuario->id,
                    'moodle_user_id' =>
                        $usuario->moodle_user_id,
                    'username' => $usuario->username,
                    'status' => $usuario->status,
                    'img' => $usuario->img
                        ? Storage::disk('public')->url(
                            $usuario->img
                        )
                        : null,
                    'roles' => $usuario->roles
                        ->pluck('nombre')
                        ->values(),
                ]
                : null,
        ];
    }
}