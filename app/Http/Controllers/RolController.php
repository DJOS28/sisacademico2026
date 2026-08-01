<?php

namespace App\Http\Controllers;

use App\Models\Modulo;
use App\Models\Rol;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

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
    public function filtrar(
        Request $request
    ): JsonResponse {
        $datos = $request->validate([
            'buscar' => [
                'nullable',
                'string',
                'max:150',
            ],

            'estado' => [
                'nullable',
                Rule::in([
                    '1',
                    '0',
                    1,
                    0,
                ]),
            ],

            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        $buscar = trim(
            (string) ($datos['buscar'] ?? '')
        );

        /*
         * null o cadena vacía significan que
         * no se aplicará filtro por estado.
         *
         * El valor 0 debe conservarse porque
         * representa el estado inactivo.
         */
        $estado = filled(
            $datos['estado'] ?? null
        )
            ? (int) $datos['estado']
            : null;

        $pagina = max(
            1,
            (int) ($datos['page'] ?? 1)
        );

        $roles = $this->obtenerRoles(
            buscar: $buscar,
            estado: $estado,
            pagina: $pagina
        );

        /*
         * Si la página solicitada dejó de existir,
         * retorna la última página disponible.
         */
        if (
            $roles->isEmpty() &&
            $pagina > 1 &&
            $roles->lastPage() > 0
        ) {
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

                'estado' => $estado === null
                    ? ''
                    : (string) $estado,
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
                'modulo_estudiante_id' =>
                    $this->obtenerModuloEspecial(
                        'estudiante'
                    )?->id,

                'modulo_docente_id' =>
                    $this->obtenerModuloEspecial(
                        'docente'
                    )?->id,
            ],
        ]);
    }

    /**
     * Registra un rol con sus módulos.
     */
    public function store(
        Request $request
    ): RedirectResponse {
        $datos = $this->validar(
            request: $request
        );

        /*
         * Verifica las reglas especiales antes
         * de registrar el rol.
         */
        $this->validarModulosPermitidosPorRol(
            $datos
        );

        DB::transaction(
            function () use ($datos) {
                $rol = Rol::create([
                    'nombre' => trim(
                        $datos['nombre']
                    ),

                    'descripcion' =>
                        $this->nullable(
                            $datos['descripcion'] ?? null
                        ),

                    'estado' =>
                        (bool) $datos['estado'],
                ]);

                $rol->modulos()->sync(
                    $datos['modulos']
                );
            }
        );

        return to_route(
            'roles.index'
        )->with(
            'success',
            'Rol registrado correctamente.'
        );
    }

    /**
     * Muestra el formulario de edición.
     */
    public function edit(
        Rol $rol
    ): Response {
        $rol->load([
            'modulos:id,nombre,descripcion',
        ]);

        return Inertia::render('Roles/Edit', [
            'rol' => [
                'id' =>
                    $rol->id,

                'nombre' =>
                    $rol->nombre,

                'descripcion' =>
                    $rol->descripcion,

                'estado' =>
                    (bool) $rol->estado,

                'modulos' =>
                    $rol->modulos
                        ->pluck('id')
                        ->map(
                            fn ($id) =>
                                (int) $id
                        )
                        ->values()
                        ->all(),
            ],

            'modulos' => $this->modulos(),

            'estados' => $this->estados(),

            'reglasModulos' => [
                'modulo_estudiante_id' =>
                    $this->obtenerModuloEspecial(
                        'estudiante'
                    )?->id,

                'modulo_docente_id' =>
                    $this->obtenerModuloEspecial(
                        'docente'
                    )?->id,
            ],
        ]);
    }

    /**
     * Actualiza el rol y sus módulos.
     */
    public function update(
        Request $request,
        Rol $rol
    ): RedirectResponse {
        $datos = $this->validar(
            request: $request,
            rol: $rol
        );

        /*
         * Aplica las mismas reglas utilizadas
         * durante la creación.
         */
        $this->validarModulosPermitidosPorRol(
            $datos
        );

        DB::transaction(
            function () use (
                $datos,
                $rol
            ) {
                $rol->update([
                    'nombre' => trim(
                        $datos['nombre']
                    ),

                    'descripcion' =>
                        $this->nullable(
                            $datos['descripcion'] ?? null
                        ),

                    'estado' =>
                        (bool) $datos['estado'],
                ]);

                $rol->modulos()->sync(
                    $datos['modulos']
                );
            }
        );

        return to_route(
            'roles.index'
        )->with(
            'success',
            'Rol actualizado correctamente.'
        );
    }

    /**
     * Cambia el estado del rol.
     */
    public function actualizarEstado(
        Request $request,
        Rol $rol
    ): RedirectResponse {
        $datos = $request->validate(
            [
                'estado' => [
                    'required',
                    'boolean',
                ],
            ],
            [
                'estado.required' =>
                    'Debe indicar el nuevo estado.',

                'estado.boolean' =>
                    'El estado seleccionado no es válido.',
            ]
        );

        $nuevoEstado = (bool) $datos['estado'];

        /*
         * No se permite desactivar un rol
         * que todavía esté asignado a usuarios.
         */
        if (
            ! $nuevoEstado &&
            $rol->usuarios()->exists()
        ) {
            throw ValidationException::withMessages([
                'estado' =>
                    'No se puede desactivar el rol porque está asignado a uno o más usuarios.',
            ]);
        }

        $rol->update([
            'estado' => $nuevoEstado,
        ]);

        return back()->with(
            'success',
            $nuevoEstado
                ? 'Rol activado correctamente.'
                : 'Rol desactivado correctamente.'
        );
    }

    /**
     * Retorna los módulos asignados al rol.
     */
    public function modulosAsignados(
        Rol $rol
    ): JsonResponse {
        $rol->load([
            'modulos:id,nombre,descripcion',
        ]);

        return response()->json([
            'rol' => [
                'id' =>
                    $rol->id,

                'nombre' =>
                    $rol->nombre,

                'descripcion' =>
                    $rol->descripcion,

                'estado' =>
                    (bool) $rol->estado,
            ],

            'modulos' =>
                $rol->modulos
                    ->map(
                        fn (
                            Modulo $modulo
                        ) => [
                            'id' =>
                                $modulo->id,

                            'nombre' =>
                                $modulo->nombre,

                            'descripcion' =>
                                $modulo->descripcion,
                        ]
                    )
                    ->values(),
        ]);
    }

    /**
     * Elimina un rol que no tenga usuarios.
     */
    public function destroy(
        Rol $rol
    ): RedirectResponse {
        if ($rol->usuarios()->exists()) {
            return back()->with(
                'error',
                'No se puede eliminar el rol porque está asignado a uno o más usuarios.'
            );
        }

        DB::transaction(
            function () use ($rol) {
                $rol->modulos()->detach();

                $rol->delete();
            }
        );

        return back()->with(
            'success',
            'Rol eliminado correctamente.'
        );
    }

    /**
     * Consulta reutilizable para el listado.
     */
    private function obtenerRoles(
        string $buscar = '',
        ?int $estado = null,
        int $pagina = 1
    ) {
        return Rol::query()
            ->withCount([
                'modulos',
                'usuarios',
            ])

            ->when(
                $buscar !== '',
                function (
                    Builder $query
                ) use ($buscar) {
                    $query->where(
                        function (
                            Builder $subquery
                        ) use ($buscar) {
                            $subquery
                                ->where(
                                    'nombre',
                                    'like',
                                    "%{$buscar}%"
                                )

                                ->orWhere(
                                    'descripcion',
                                    'like',
                                    "%{$buscar}%"
                                );
                        }
                    );
                }
            )

            ->when(
                $estado !== null,
                fn (
                    Builder $query
                ) =>
                    $query->where(
                        'estado',
                        $estado
                    )
            )

            ->orderByDesc('estado')
            ->orderBy('nombre')

            ->paginate(
                perPage: 10,

                columns: [
                    'id',
                    'nombre',
                    'descripcion',
                    'estado',
                    'created_at',
                    'updated_at',
                ],

                pageName: 'page',

                page: $pagina
            );
    }

    /**
     * Valida la creación y actualización.
     */
    private function validar(
        Request $request,
        ?Rol $rol = null
    ): array {
        return $request->validate(
            [
                'nombre' => [
                    'required',
                    'string',
                    'max:100',

                    Rule::unique(
                        'roles',
                        'nombre'
                    )->ignore(
                        $rol?->id
                    ),
                ],

                'descripcion' => [
                    'nullable',
                    'string',
                    'max:500',
                ],

                'estado' => [
                    'required',
                    'boolean',
                ],

                /*
                 * Todo rol debe tener al menos
                 * un módulo autorizado.
                 */
                'modulos' => [
                    'required',
                    'array',
                    'min:1',
                ],

                'modulos.*' => [
                    'required',
                    'integer',
                    'distinct',
                    'exists:modulos,id',
                ],
            ],

            [
                'nombre.required' =>
                    'Debe ingresar el nombre del rol.',

                'nombre.string' =>
                    'El nombre del rol no es válido.',

                'nombre.max' =>
                    'El nombre del rol no puede superar los 100 caracteres.',

                'nombre.unique' =>
                    'Ya existe un rol con ese nombre.',

                'descripcion.string' =>
                    'La descripción del rol no es válida.',

                'descripcion.max' =>
                    'La descripción no puede superar los 500 caracteres.',

                'estado.required' =>
                    'Debe seleccionar el estado del rol.',

                'estado.boolean' =>
                    'El estado seleccionado no es válido.',

                'modulos.required' =>
                    'Debe seleccionar al menos un módulo.',

                'modulos.array' =>
                    'La selección de módulos no es válida.',

                'modulos.min' =>
                    'Debe seleccionar al menos un módulo.',

                'modulos.*.required' =>
                    'Uno de los módulos seleccionados no es válido.',

                'modulos.*.integer' =>
                    'Uno de los módulos seleccionados no es válido.',

                'modulos.*.distinct' =>
                    'No puede seleccionar dos veces el mismo módulo.',

                'modulos.*.exists' =>
                    'Uno de los módulos seleccionados no existe.',
            ]
        );
    }

    /**
     * Aplica las reglas especiales:
     *
     * 1. El rol Estudiante solo puede recibir
     *    el módulo Estudiante.
     *
     * 2. El rol Docente puede recibir todos
     *    los módulos excepto Estudiante.
     *
     * 3. Los demás roles no pueden recibir
     *    los módulos Estudiante ni Docente.
     */
    private function validarModulosPermitidosPorRol(
        array $datos
    ): void {
        $nombreRol = $this->normalizarTexto(
            $datos['nombre'] ?? ''
        );

        $idsSeleccionados = collect(
            $datos['modulos'] ?? []
        )
            ->map(
                fn ($id) => (int) $id
            )
            ->unique()
            ->values();

        $modulosSeleccionados =
            Modulo::query()
                ->whereIn(
                    'id',
                    $idsSeleccionados
                )
                ->get([
                    'id',
                    'nombre',
                ]);

        $moduloEstudiante =
            $this->obtenerModuloEspecial(
                'estudiante'
            );

        $moduloDocente =
            $this->obtenerModuloEspecial(
                'docente'
            );

        /*
         * Rol Estudiante:
         * solo módulo Estudiante.
         */
        if ($nombreRol === 'estudiante') {
            if (! $moduloEstudiante) {
                throw ValidationException::withMessages([
                    'modulos' =>
                        'No existe el módulo Estudiante en el sistema.',
                ]);
            }

            $soloModuloEstudiante =
                $idsSeleccionados->count() === 1 &&
                $idsSeleccionados->contains(
                    (int) $moduloEstudiante->id
                );

            if (! $soloModuloEstudiante) {
                throw ValidationException::withMessages([
                    'modulos' =>
                        'El rol Estudiante solo puede tener asignado el módulo Estudiante.',
                ]);
            }

            return;
        }

        /*
         * Rol Docente:
         * cualquier módulo menos Estudiante.
         */
        if ($nombreRol === 'docente') {
            if (
                $moduloEstudiante &&
                $idsSeleccionados->contains(
                    (int) $moduloEstudiante->id
                )
            ) {
                throw ValidationException::withMessages([
                    'modulos' =>
                        'El rol Docente no puede tener asignado el módulo Estudiante.',
                ]);
            }

            return;
        }

        /*
         * Otros roles:
         * no pueden recibir Estudiante ni Docente.
         */
        $idsRestringidos = collect([
            $moduloEstudiante?->id,
            $moduloDocente?->id,
        ])
            ->filter(
                fn ($id) => $id !== null
            )
            ->map(
                fn ($id) => (int) $id
            )
            ->values();

        $modulosNoPermitidos =
            $modulosSeleccionados
                ->filter(
                    fn (
                        Modulo $modulo
                    ) =>
                        $idsRestringidos->contains(
                            (int) $modulo->id
                        )
                )
                ->pluck('nombre')
                ->values();

        if ($modulosNoPermitidos->isNotEmpty()) {
            throw ValidationException::withMessages([
                'modulos' =>
                    'El rol ' .
                    trim($datos['nombre']) .
                    ' no puede tener asignados los módulos: ' .
                    $modulosNoPermitidos->join(', ') .
                    '.',
            ]);
        }
    }

    /**
     * Busca un módulo especial por su nombre,
     * ignorando mayúsculas, espacios y tildes.
     */
    private function obtenerModuloEspecial(
        string $nombre
    ): ?Modulo {
        $nombreNormalizado =
            $this->normalizarTexto(
                $nombre
            );

        return Modulo::query()
            ->get([
                'id',
                'nombre',
                'descripcion',
            ])
            ->first(
                fn (
                    Modulo $modulo
                ) =>
                    $this->normalizarTexto(
                        $modulo->nombre
                    ) ===
                    $nombreNormalizado
            );
    }

    /**
     * Normaliza textos para comparar nombres
     * sin importar tildes o mayúsculas.
     */
    private function normalizarTexto(
        ?string $texto
    ): string {
        return str(
            trim((string) $texto)
        )
            ->lower()
            ->ascii()
            ->toString();
    }

    /**
     * Lista los módulos disponibles.
     */
    private function modulos()
    {
        return Modulo::query()
            ->orderBy('nombre')
            ->get([
                'id',
                'nombre',
                'descripcion',
            ]);
    }

    /**
     * Estados disponibles.
     */
    private function estados(): array
    {
        return [
            [
                'value' => 1,
                'label' => 'Activo',
            ],

            [
                'value' => 0,
                'label' => 'Inactivo',
            ],
        ];
    }

    /**
     * Convierte cadenas vacías en null.
     */
    private function nullable(
        mixed $valor
    ): mixed {
        if (
            is_string($valor) &&
            trim($valor) === ''
        ) {
            return null;
        }

        return is_string($valor)
            ? trim($valor)
            : $valor;
    }
}