<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\Personal;
use App\Models\Rol;
use App\Models\Usuario;
use App\Services\DeColectaService;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class PersonalController extends Controller
{
    protected DeColectaService $deColectaService;

    public function __construct(DeColectaService $deColectaService)
    {
        $this->deColectaService = $deColectaService;
    }

    /**
     * Renderizado inicial de la vista Inertia.
     */
    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->input('buscar', ''));
        $estado = trim((string) $request->input('estado', ''));
        $areaId = $request->input('area_id');

        $personal = Personal::query()
            ->with([
                'usuario.roles',
                'usuario.areas',
                'area',
            ])
            ->when($buscar !== '', function ($query) use ($buscar): void {
                $query->where(function ($subquery) use ($buscar): void {
                    $subquery
                        ->where('dni', 'like', "%{$buscar}%")
                        ->orWhere('nombre', 'like', "%{$buscar}%")
                        ->orWhere('apellido', 'like', "%{$buscar}%")
                        ->orWhere('email', 'like', "%{$buscar}%")
                        ->orWhere('puesto', 'like', "%{$buscar}%")
                        ->orWhereHas(
                            'usuario',
                            fn ($usuario) => $usuario->where(
                                'username',
                                'like',
                                "%{$buscar}%"
                            )
                        );
                });
            })
            ->when(
                $estado !== '',
                fn ($query) => $query->whereHas(
                    'usuario',
                    fn ($usuario) => $usuario->where('status', $estado)
                )
            )
            ->when(
                filled($areaId),
                fn ($query) => $query->where('id_area', $areaId)
            )
            ->orderByDesc('fecha_creacion')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Personal/Index', [
            'personal' => $personal,
            'areas'    => $this->areasDisponibles(),
            'filtros'  => [
                'buscar'  => $buscar,
                'estado'  => $estado,
                'area_id' => $areaId,
            ],
        ]);
    }

    /**
     * Endpoint exclusivo de búsqueda AJAX para filtrado dinámico en tiempo real (Index.jsx).
     */
    public function buscarAjax(Request $request): JsonResponse
    {
        $buscar = trim((string) $request->input('buscar', ''));
        $estado = trim((string) $request->input('estado', ''));
        $areaId = $request->input('area_id');

        $personal = Personal::query()
            ->with([
                'usuario.roles',
                'usuario.areas',
                'area',
            ])
            ->when($buscar !== '', function ($query) use ($buscar): void {
                $query->where(function ($subquery) use ($buscar): void {
                    $subquery
                        ->where('dni', 'like', "%{$buscar}%")
                        ->orWhere('nombre', 'like', "%{$buscar}%")
                        ->orWhere('apellido', 'like', "%{$buscar}%")
                        ->orWhere('email', 'like', "%{$buscar}%")
                        ->orWhere('puesto', 'like', "%{$buscar}%")
                        ->orWhereHas(
                            'usuario',
                            fn ($usuario) => $usuario->where('username', 'like', "%{$buscar}%")
                        );
                });
            })
            ->when($estado !== '', fn ($query) => $query->whereHas('usuario', fn ($u) => $u->where('status', $estado)))
            ->when(filled($areaId), fn ($query) => $query->where('id_area', $areaId))
            ->orderByDesc('fecha_creacion')
            ->paginate(10);

        return response()->json($personal);
    }

    /**
     * Consulta interna a RENIEC para autocompletado en el formulario de personal.
     */
    public function consultarDni(string $dni): JsonResponse
    {
        if (strlen($dni) !== 8 || !ctype_digit($dni)) {
            return response()->json([
                'success' => false,
                'message' => 'El DNI debe contener exactamente 8 dígitos.',
            ], 422);
        }

        $resultado = $this->deColectaService->consultarDni($dni);
        return response()->json($resultado, $resultado['success'] ? 200 : 400);
    }

    public function create(): Response
    {
        return Inertia::render('Personal/Create', [
            'roles' => $this->rolesDisponibles(),
            'areas' => $this->areasDisponibles(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        DB::transaction(function () use ($datos): void {
            $usuario = Usuario::create([
                'username'      => trim($datos['username']),
                'password_hash' => Hash::make($datos['password']),
                'status'        => $datos['status'],
                'img'           => $this->normalizarNullable($datos['img'] ?? null),
            ]);

            Personal::create([
                'usuario_id'     => $usuario->id,
                'dni'            => trim($datos['dni']),
                'nombre'         => trim($datos['nombre']),
                'apellido'       => trim($datos['apellido']),
                'direccion'      => $this->normalizarNullable($datos['direccion'] ?? null),
                'telefono'       => $this->normalizarNullable($datos['telefono'] ?? null),
                'email'          => mb_strtolower(trim($datos['email'])),
                'puesto'         => trim($datos['puesto']),
                'id_area'        => (int) $datos['id_area'],
                'fecha_creacion' => now(),
            ]);

            $usuario->roles()->sync(
                collect($datos['role_ids'])
                    ->map(fn ($id) => (int) $id)
                    ->unique()
                    ->values()
                    ->all()
            );

            $usuario->areas()->sync(
                $this->prepararAreas(
                    $datos['id_area'],
                    $datos['area_ids'] ?? []
                )
            );
        });

        return to_route('personal.index')
            ->with('success', 'Personal registrado correctamente.');
    }

    public function edit(Personal $personal): Response
    {
        $personal->load([
            'usuario.roles',
            'usuario.areas',
            'area',
        ]);

        return Inertia::render('Personal/Edit', [
            'personal' => $this->personalData($personal),
            'roles'    => $this->rolesDisponibles(),
            'areas'    => $this->areasDisponibles(),
        ]);
    }

    public function update(
        Request $request,
        Personal $personal
    ): RedirectResponse {
        $datos = $this->validar($request, $personal);

        DB::transaction(function () use ($datos, $personal): void {
            $personal->loadMissing('usuario');

            $usuario = $personal->usuario;

            if (! $usuario) {
                throw new RuntimeException(
                    'El registro de personal no tiene una cuenta de usuario asociada.'
                );
            }

            $usuario->update([
                'username' => trim($datos['username']),
                'status'   => $datos['status'],
                'img'      => $this->normalizarNullable($datos['img'] ?? null),
            ]);

            if (! empty($datos['password'])) {
                $usuario->update([
                    'password_hash' => Hash::make($datos['password']),
                ]);
            }

            $personal->update([
                'dni'       => trim($datos['dni']),
                'nombre'    => trim($datos['nombre']),
                'apellido'  => trim($datos['apellido']),
                'direccion' => $this->normalizarNullable($datos['direccion'] ?? null),
                'telefono'  => $this->normalizarNullable($datos['telefono'] ?? null),
                'email'     => mb_strtolower(trim($datos['email'])),
                'puesto'    => trim($datos['puesto']),
                'id_area'   => (int) $datos['id_area'],
            ]);

            $usuario->roles()->sync(
                collect($datos['role_ids'])
                    ->map(fn ($id) => (int) $id)
                    ->unique()
                    ->values()
                    ->all()
            );

            $usuario->areas()->sync(
                $this->prepararAreas(
                    $datos['id_area'],
                    $datos['area_ids'] ?? []
                )
            );
        });

        return to_route('personal.index')
            ->with('success', 'Personal actualizado correctamente.');
    }

    public function actualizarEstado(
        Request $request,
        Personal $personal
    ): RedirectResponse {
        $datos = $request->validate([
            'status' => [
                'required',
                Rule::in(['Activo', 'Inactivo']),
            ],
        ]);

        $personal->loadMissing('usuario');

        if (! $personal->usuario) {
            return back()->with(
                'error',
                'El personal no tiene una cuenta de usuario asociada.'
            );
        }

        $personal->usuario->update([
            'status' => $datos['status'],
        ]);

        return back()->with(
            'success',
            'Estado actualizado correctamente.'
        );
    }

    public function destroy(Personal $personal): RedirectResponse
    {
        DB::transaction(function () use ($personal): void {
            $personal->loadMissing('usuario');

            $usuario = $personal->usuario;

            $personal->delete();

            if ($usuario) {
                $usuario->roles()->detach();
                $usuario->areas()->detach();
                $usuario->delete();
            }
        });

        return to_route('personal.index')
            ->with('success', 'Personal eliminado correctamente.');
    }

    private function validar(
        Request $request,
        ?Personal $personal = null
    ): array {
        $usuarioId = $personal?->usuario_id;
        $personalId = $personal?->id;

        return $request->validate([
            'dni' => [
                'required',
                'string',
                'max:15',

                Rule::unique('personal', 'dni')
                    ->ignore($personalId),

                function (
                    string $attribute,
                    mixed $value,
                    Closure $fail
                ): void {
                    if ($this->valorExisteEnOtroPerfil(
                        columna: 'dni',
                        valor: trim((string) $value),
                        tablaActual: 'personal'
                    )) {
                        $fail(
                            'El DNI ya está registrado en otro perfil del sistema.'
                        );
                    }
                },
            ],

            'nombre' => [
                'required',
                'string',
                'max:100',
            ],

            'apellido' => [
                'required',
                'string',
                'max:100',
            ],

            'email' => [
                'required',
                'email',
                'max:150',

                Rule::unique('personal', 'email')
                    ->ignore($personalId),

                function (
                    string $attribute,
                    mixed $value,
                    Closure $fail
                ): void {
                    if ($this->valorExisteEnOtroPerfil(
                        columna: 'email',
                        valor: mb_strtolower(trim((string) $value)),
                        tablaActual: 'personal'
                    )) {
                        $fail(
                            'El correo electrónico ya está registrado en otro perfil del sistema.'
                        );
                    }
                },
            ],

            'telefono' => [
                'nullable',
                'string',
                'max:20',
            ],

            'direccion' => [
                'nullable',
                'string',
                'max:255',
            ],

            'puesto' => [
                'required',
                'string',
                'max:120',
            ],

            'id_area' => [
                'required',
                'integer',
                Rule::exists('areas', 'id')
                    ->where('estado', 'Activo'),
            ],

            'area_ids' => [
                'nullable',
                'array',
            ],

            'area_ids.*' => [
                'integer',
                'distinct',
                Rule::exists('areas', 'id')
                    ->where('estado', 'Activo'),
            ],

            'role_ids' => [
                'required',
                'array',
                'min:1',
            ],

            'role_ids.*' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('roles', 'id')->where(
                    function ($query): void {
                        $query
                            ->where('estado', 1)
                            ->whereRaw(
                                'LOWER(TRIM(nombre)) NOT IN (?, ?, ?)',
                                [
                                    'estudiante',
                                    'docente',
                                    'administrador',
                                ]
                            );
                    }
                ),
            ],

            'username' => [
                'required',
                'string',
                'max:50',
                Rule::unique('usuarios', 'username')
                    ->ignore($usuarioId),
            ],

            'password' => [
                $personal ? 'nullable' : 'required',
                'string',
                'min:8',
                'confirmed',
            ],

            'status' => [
                'required',
                Rule::in(['Activo', 'Inactivo']),
            ],

            'img' => [
                'nullable',
                'string',
                'max:255',
            ],
        ], [
            'role_ids.required'  => 'Debe seleccionar por lo menos un rol.',
            'role_ids.min'       => 'Debe seleccionar por lo menos un rol.',
            'role_ids.*.exists'  => 'Uno de los roles seleccionados no está permitido.',
            'id_area.required'   => 'Debe seleccionar el área principal.',
            'id_area.exists'     => 'El área principal seleccionada no está disponible.',
            'password.confirmed' => 'La confirmación de contraseña no coincide.',
        ]);
    }

    private function valorExisteEnOtroPerfil(
        string $columna,
        string $valor,
        string $tablaActual
    ): bool {
        $tablasPerfiles = [
            'administradores',
            'docentes',
            'personal',
            'cajeros',
            'postulantes',
        ];

        foreach ($tablasPerfiles as $tabla) {
            if ($tabla === $tablaActual) {
                continue;
            }

            if (! Schema::hasTable($tabla)) {
                continue;
            }

            if (! Schema::hasColumn($tabla, $columna)) {
                continue;
            }

            $query = DB::table($tabla);

            if ($columna === 'email') {
                $query->whereRaw(
                    'LOWER(TRIM(email)) = ?',
                    [mb_strtolower(trim($valor))]
                );
            } else {
                $query->where(
                    $columna,
                    trim($valor)
                );
            }

            if ($query->exists()) {
                return true;
            }
        }

        return false;
    }

    private function rolesDisponibles()
    {
        return Rol::query()
            ->where('estado', true)
            ->whereRaw(
                'LOWER(TRIM(nombre)) NOT IN (?, ?, ?)',
                [
                    'estudiante',
                    'docente',
                    'administrador',
                ]
            )
            ->orderBy('nombre')
            ->get([
                'id',
                'nombre',
                'descripcion',
            ]);
    }

    private function areasDisponibles()
    {
        return Area::query()
            ->where('estado', 'Activo')
            ->orderBy('nombre')
            ->get([
                'id',
                'nombre',
            ]);
    }

    private function prepararAreas(
        int|string $areaPrincipalId,
        array $areasAdicionales
    ): array {
        return collect($areasAdicionales)
            ->push($areaPrincipalId)
            ->filter()
            ->map(fn ($areaId) => (int) $areaId)
            ->unique()
            ->mapWithKeys(fn (int $areaId) => [
                $areaId => [
                    'activo' => true,
                ],
            ])
            ->all();
    }

    private function normalizarNullable(
        mixed $valor
    ): ?string {
        $valor = trim((string) $valor);

        return $valor !== '' ? $valor : null;
    }

    private function personalData(
        Personal $personal
    ): array {
        return [
            'id'        => $personal->id,
            'dni'       => $personal->dni,
            'nombre'    => $personal->nombre,
            'apellido'  => $personal->apellido,
            'direccion' => $personal->direccion,
            'telefono'  => $personal->telefono,
            'email'     => $personal->email,
            'puesto'    => $personal->puesto,
            'id_area'   => $personal->id_area,

            'role_ids' => $personal->usuario
                ? $personal->usuario->roles
                    ->pluck('id')
                    ->map(fn ($id) => (int) $id)
                    ->values()
                    ->all()
                : [],

            'area_ids' => $personal->usuario
                ? $personal->usuario->areas
                    ->pluck('id')
                    ->map(fn ($id) => (int) $id)
                    ->values()
                    ->all()
                : [],

            'usuario' => [
                'id'       => $personal->usuario?->id,
                'username' => $personal->usuario?->username,
                'status'   => $personal->usuario?->status,
                'img'      => $personal->usuario?->img,
            ],
        ];
    }
}