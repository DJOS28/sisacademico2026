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
use App\Models\Horario;
use App\Models\Periodo;
use App\Models\Semestre;
use Illuminate\Http\RedirectResponse;
use App\Models\Curso;
use App\Models\Seccion;
use App\Models\Sesion;
use App\Models\Asistencia;
use App\Models\MatriculaCurso;
use Illuminate\Support\Facades\Log;
use App\Models\ArchivoCurso;
use App\Models\SubcomponenteLogro;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Instituto;
use Illuminate\Support\Facades\Auth;
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

    public function misCursos(Request $request): Response
    {
        $usuario = $request->user();
        
        // ID del docente autenticado (Seguridad)
        $docenteId = $usuario->docente?->id ?? $usuario->id;

        $periodos = Periodo::orderBy('id', 'desc')->get();
        $semestres = Semestre::all();

        // Obtener valores enviados por POST o GET
        $periodoId = $request->input('periodo_id') ?? $periodos->first()?->id;
        $semestreId = $request->input('semestre_id');

        // Consulta de horarios con la barrera de seguridad en id_docente
        $query = Horario::with(['curso.semestre', 'seccion', 'turno', 'periodo'])
            ->where('id_docente', $docenteId);

        if ($periodoId) {
            $query->where('id_periodo', $periodoId);
        }

        if ($semestreId) {
            $query->whereHas('curso', function ($q) use ($semestreId) {
                $q->where('semestre_id', $semestreId);
            });
        }

        $horarios = $query->get();

        // Mapeo del resultado...
        $cursos = $horarios->groupBy(function ($item) {
            return $item->id_curso . '_' . $item->id_seccion;
        })->map(function ($grupo) {
            $primerHorario = $grupo->first();
            return [
                'curso_id'       => $primerHorario->id_curso,
                'seccion_id'     => $primerHorario->id_seccion,
                'curso_nombre'   => $primerHorario->curso?->nombre,
                'curso_codigo'   => $primerHorario->curso?->codigo,
                'semestre_nombre'=> $primerHorario->curso?->semestre?->nombre,
                'seccion_nombre' => $primerHorario->seccion?->nombre,
                'turno_nombre'   => $primerHorario->turno?->nombre,
                'total_bloques'  => $grupo->count(),
                'horarios'       => $grupo->map(function ($h) {
                    return [
                        'dia'         => $h->dia,
                        'hora_inicio' => $h->hora_inicio,
                        'hora_fin'    => $h->hora_fin,
                        'aula'        => $h->numero_aula,
                    ];
                })->values(),
            ];
        })->values();

        return Inertia::render('Docentes/Cursos/Index', [
            'periodos'  => $periodos,
            'semestres' => $semestres,
            'cursos'    => $cursos,
            'filters'   => [
                'periodo_id'  => (string) $periodoId,
                'semestre_id' => (string) $semestreId,
            ]
        ]);
    }

   public function gestionar(Request $request): Response|RedirectResponse
{
    $usuario = $request->user();
    $docenteId = $usuario->docente?->id ?? $usuario->id;

    // 1. Intentar obtener parámetros de la petición POST/GET o fallback a la SESIÓN
    $cursoId   = $request->input('curso_id') ?? session('logros_curso_id');
    $seccionId = $request->input('seccion_id') ?? session('logros_seccion_id');
    $periodoId = $request->input('periodo_id') ?? session('logros_periodo_id') ?? Periodo::orderBy('id', 'desc')->first()?->id;

    // Si no existen los datos clave, redirige al listado principal de cursos
    if (!$cursoId || !$seccionId) {
        return redirect()->route('docente.cursos');
    }

    // 2. Guardar/Actualizar el contexto activo en la sesión HTTP
    session([
        'logros_curso_id'   => $cursoId,
        'logros_seccion_id' => $seccionId,
        'logros_periodo_id' => $periodoId,
    ]);

    // 3. Obtener los IDs de todos los horarios/turnos de esta sección
    $horariosIds = Horario::where('id_curso', $cursoId)
        ->where('id_seccion', $seccionId)
        ->where('id_periodo', $periodoId)
        ->where('id_docente', $docenteId)
        ->pluck('id');

    // 4. Cargar las sesiones asociadas a este curso y sección (activas e inactivas)
    $sesiones = Sesion::where('curso_id', $cursoId)
        ->where(function ($query) use ($horariosIds) {
            $query->whereIn('horario_id', $horariosIds)
                ->orWhereNull('horario_id');
        })
        ->orderBy('fecha', 'asc')
        ->orderBy('id_sesion', 'asc')
        ->get();

    // 5. Cargar los materiales y recursos asociados al curso
    $materiales = ArchivoCurso::where('curso_id', $cursoId)
        ->orderBy('created_at', 'desc')
        ->get();

    // 6. 🟢 CORREGIDO: Cargar los subcomponentes/criterios usando la relación 'logro'
    $subcomponentes = SubcomponenteLogro::whereHas('logro', function ($query) use ($cursoId) {
            $query->where('curso_id', $cursoId);
        })
        ->get();

    $curso   = Curso::with('semestre')->findOrFail($cursoId);
    $seccion = Seccion::findOrFail($seccionId);
    $periodo = Periodo::find($periodoId);

    // 7. Retornar respuesta a Inertia.js incluyendo 'subcomponentes'
    return Inertia::render('Docentes/Cursos/Gestionar/Index', [
        'curso'   => [
            'id'       => $curso->id,
            'nombre'   => $curso->nombre,
            'codigo'   => $curso->codigo,
            'semestre' => $curso->semestre?->nombre,
        ],
        'seccion' => [
            'id'     => $seccion->id,
            'nombre' => $seccion->nombre,
        ],
        'periodo' => [
            'id'     => $periodo?->id,
            'nombre' => $periodo?->nombre,
        ],
        'sesiones'       => $sesiones,
        'materiales'     => $materiales,
        'subcomponentes' => $subcomponentes,
    ]);
}

    /**
     * Guarda una nueva sesión de clase.
     */
    public function storeSesion(Request $request): RedirectResponse
    {
        // 1. Validar los datos de entrada
        $request->validate([
            'nombre'    => 'required|string|max:255',
            'fecha'     => 'required|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha',
            'archivo'   => 'nullable|file|mimes:pdf,docx,pptx,zip|max:10240', // Máx 10MB
        ]);

        // 2. Obtener el contexto actual guardado en la sesión HTTP
        $cursoId   = session('logros_curso_id');
        $seccionId = session('logros_seccion_id');
        $periodoId = session('logros_periodo_id');
        $docenteId = $request->user()->docente?->id ?? $request->user()->id;

        // Validación de seguridad: Verificar si la sesión de contexto sigue activa
        if (!$cursoId || !$seccionId) {
            return redirect()->back()->withErrors([
                'nombre' => 'La sesión académica ha expirado. Por favor, vuelve a ingresar al curso.'
            ]);
        }

        // 3. Obtener el ID de horario principal para esta sección (compatible con varios turnos/días)
        $horarioId = Horario::where('id_curso', $cursoId)
            ->where('id_seccion', $seccionId)
            ->where('id_periodo', $periodoId)
            ->where('id_docente', $docenteId)
            ->orderBy('id', 'asc')
            ->value('id');

        // 4. Procesar el archivo adjunto si existe
        $rutaArchivo = null;
        if ($request->hasFile('archivo')) {
            $rutaArchivo = $request->file('archivo')->store('sesiones', 'public');
        }

        // 5. Crear la sesión en la BD
        try {
            Sesion::create([
                'curso_id'   => $cursoId,
                'horario_id' => $horarioId,
                'nombre'     => $request->nombre,
                'fecha'      => $request->fecha,
                'fecha_fin'  => $request->fecha_fin,
                'archivo'    => $rutaArchivo,
                'activo'     => 1,
            ]);

            return redirect()->back()->with('success', 'Sesión registrada correctamente.');

        } catch (\Exception $e) {
            Log::error('Error al guardar la sesión: ' . $e->getMessage());

            return redirect()->back()->withErrors([
                'nombre' => 'Ocurrió un error en el servidor al intentar guardar la sesión.'
            ]);
        }
    }

    /**
 * Actualiza los datos de una sesión existente.
 */
public function updateSesion(Request $request, $id): RedirectResponse
{
    $request->validate([
        'nombre'    => 'required|string|max:255',
        'fecha'     => 'required|date',
        'fecha_fin' => 'nullable|date|after_or_equal:fecha',
        'archivo'   => 'nullable|file|mimes:pdf,docx,pptx,zip|max:10240',
    ]);

    $sesion = Sesion::findOrFail($id);

    $datosActualizar = [
        'nombre'    => $request->nombre,
        'fecha'     => $request->fecha,
        'fecha_fin' => $request->fecha_fin,
    ];

    // Si se subió un nuevo archivo, reemplaza el anterior
    if ($request->hasFile('archivo')) {
        if ($sesion->archivo && Storage::disk('public')->exists($sesion->archivo)) {
            Storage::disk('public')->delete($sesion->archivo);
        }
        $datosActualizar['archivo'] = $request->file('archivo')->store('sesiones', 'public');
    }

    $sesion->update($datosActualizar);

    return redirect()->back()->with('success', 'Sesión actualizada correctamente.');
}

    /**
     * Alterna el estado activo / inactivo de la sesión.
     */
    public function toggleSesion($id): RedirectResponse
    {
        $sesion = Sesion::findOrFail($id);
        $sesion->update([
            'activo' => !$sesion->activo
        ]);

        return redirect()->back()->with('success', 'Estado de la sesión actualizado.');
    }

    /**
     * Elimina una sesión y borra su archivo adjunto del storage.
     */
    public function destroySesion($id): RedirectResponse
    {
        $sesion = Sesion::findOrFail($id);

        // Borrado físico del archivo adjunto si existe
        if ($sesion->archivo && Storage::disk('public')->exists($sesion->archivo)) {
            Storage::disk('public')->delete($sesion->archivo);
        }

        $sesion->delete();

        return redirect()->back()->with('success', 'Sesión eliminada correctamente.');
    }

    /**
 * Obtener listado de estudiantes y sus asistencias para una sesión
 */
public function getAsistenciasPorSesion($sesionId)
{
    $cursoId   = session('logros_curso_id');
    $seccionId = session('logros_seccion_id');
    $periodoId = session('logros_periodo_id');

    $horarioId = Horario::where('id_curso', $cursoId)
        ->where('id_seccion', $seccionId)
        ->where('id_periodo', $periodoId)
        ->value('id');

    $alumnos = MatriculaCurso::with('estudiante')
        ->where('horario_id', $horarioId)
        ->get()
        ->map(function ($item) use ($sesionId) {
            $asistencia = Asistencia::where('sesion_id', $sesionId)
                ->where('matricula_curso_id', $item->id)
                ->first();

            return [
                'matricula_curso_id' => $item->id,
                'codigo_alumno'      => $item->estudiante?->codigo_postulante ?? $item->estudiante?->dni ?? 'S/N',
                'nombre_completo'    => $item->estudiante?->nombre_completo ?? 'Estudiante sin nombre',
                'estado'             => $asistencia?->estado ?? 'presente',
                'observaciones'      => $asistencia?->observaciones ?? '',
            ];
        });

    return response()->json($alumnos);
}

/**
 * Guardar o actualizar la asistencia masiva de la sesión
 */
public function guardarAsistencia(Request $request): RedirectResponse
{
    $request->validate([
        'sesion_id'     => 'required|exists:sesiones,id_sesion',
        'fecha'         => 'required|date',
        'asistencias'   => 'required|array',
        'asistencias.*.matricula_curso_id' => 'required|exists:matricula_cursos,id',
        'asistencias.*.estado'             => 'required|in:presente,falta,tardanza,justificado',
        'asistencias.*.observaciones'      => 'nullable|string|max:255',
    ]);

    $sesionId = $request->sesion_id;
    $fecha    = $request->fecha;

    try {
        foreach ($request->asistencias as $item) {
            Asistencia::updateOrCreate(
                [
                    'sesion_id'          => $sesionId,
                    'matricula_curso_id' => $item['matricula_curso_id'],
                ],
                [
                    'fecha'         => $fecha,
                    'estado'        => $item['estado'],
                    'observaciones' => $item['observaciones'] ?? null,
                ]
            );
        }

        return redirect()->back()->with('success', 'Asistencia registrada correctamente.');

    } catch (\Exception $e) {
        Log::error('Error al guardar asistencia: ' . $e->getMessage());
        return redirect()->back()->withErrors(['error' => 'Error al guardar la asistencia.']);
    }
}
public function generarPdfReporte(Request $request)
{
    $cursoId   = session('logros_curso_id') ?? $request->input('curso_id');
    $seccionId = session('logros_seccion_id') ?? $request->input('seccion_id');
    $periodoId = session('logros_periodo_id') ?? $request->input('periodo_id');

    // 1. Datos del Instituto y Ubicación
    $instituto = Instituto::with(['distrito.provincia.departamento'])->first();
    $distrito     = $instituto?->distrito;
    $provincia    = $distrito?->provincia;
    $departamento = $provincia?->departamento;

    // 2. Curso, Sección y Periodo
    $curso       = Curso::with(['semestre', 'planesEstudio'])->findOrFail($cursoId);
    $seccion     = Seccion::findOrFail($seccionId);
    $periodo     = Periodo::find($periodoId);
    $planEstudio = $curso->planesEstudio->first();

    // 3. Usuario Docente
    $usuarioDocente = auth()->user();
    $nombreDocente  = $usuarioDocente?->nombre_completo ?? $usuarioDocente?->username ?? 'DOCENTE NO ASIGNADO';

    // 4. Horario y Estudiantes
    $horarioId = Horario::where('id_curso', $cursoId)
        ->where('id_seccion', $seccionId)
        ->where('id_periodo', $periodoId)
        ->value('id');

    $estudiantes = MatriculaCurso::with('estudiante')
        ->where('horario_id', $horarioId)
        ->get()
        ->map(fn($item) => [
            'matricula_curso_id' => $item->id,
            'codigo'             => $item->estudiante?->codigo_postulante ?? $item->estudiante?->dni ?? 'S/N',
            'nombre_completo'    => $item->estudiante?->nombre_completo ?? 'Sin Nombre',
        ])
        ->sortBy('nombre_completo')
        ->values();

    // 5. Sesiones de Clase del Curso filtradas por curso_id u horario_id
    $sesiones = Sesion::where('curso_id', $cursoId)
        ->when($horarioId, function ($query) use ($horarioId) {
            $query->where('horario_id', $horarioId);
        })
        ->orderBy('fecha', 'asc')
        ->get();

    $sesionIds    = $sesiones->pluck('id_sesion');
    $matriculaIds = $estudiantes->pluck('matricula_curso_id');

    $asistencias = Asistencia::whereIn('sesion_id', $sesionIds)
        ->whereIn('matricula_curso_id', $matriculaIds)
        ->get();

    $pdf = Pdf::loadView('pdf.reporte_asistencia', compact(
        'instituto',
        'distrito',
        'provincia',
        'departamento',
        'curso',
        'seccion',
        'periodo',
        'planEstudio',
        'nombreDocente',
        'estudiantes',
        'sesiones',
        'asistencias'
    ))->setPaper('a4', 'landscape');

    return $pdf->stream("Reporte_Asistencia_{$seccion->nombre}.pdf");
}

public function storeMaterial(Request $request): RedirectResponse
{
    $request->validate([
        'tipo'      => 'required|in:archivo,video',
        'nombre'    => 'required|string|max:255',
        'sesion_id' => 'nullable|exists:sesiones,id_sesion',
        'archivo'   => 'required_if:tipo,archivo|nullable|file|max:20480', // Máx 20MB
        'url_video' => 'required_if:tipo,video|nullable|url|max:255',
    ]);

    $cursoId   = session('logros_curso_id');
    $seccionId = session('logros_seccion_id');
    $periodoId = session('logros_periodo_id');

    if (!$cursoId || !$seccionId) {
        return redirect()->back()->withErrors(['error' => 'La sesión del curso o sección ha expirado.']);
    }

    $ruta = null;

    if ($request->tipo === 'archivo' && $request->hasFile('archivo')) {
        $ruta = $request->file('archivo')->store('materiales', 'public');
    } else {
        $ruta = $request->url_video;
    }

    // Guardar incluyendo la Sección y Periodo de la sesión activa
    ArchivoCurso::create([
        'curso_id'   => $cursoId,
        'id_seccion' => $seccionId, // 👈 Asignación de Sección
        'id_periodo' => $periodoId, // 👈 Asignación de Periodo
        'sesion_id'  => $request->sesion_id,
        'tipo'       => $request->tipo,
        'nombre'     => $request->nombre,
        'ruta'       => $ruta,
    ]);

    return redirect()->back()->with('success', 'Material publicado correctamente.');
}

/**
 * Elimina un material asegurando el contexto de la sección.
 */
public function destroyMaterial($id): RedirectResponse
{
    $cursoId   = session('logros_curso_id');
    $seccionId = session('logros_seccion_id');

    // Garantizar que solo se pueda eliminar si pertenece a la sección activa
    $material = ArchivoCurso::where('id', $id)
        ->where('curso_id', $cursoId)
        ->where('id_seccion', $seccionId)
        ->firstOrFail();

    if ($material->tipo === 'archivo' && Storage::disk('public')->exists($material->ruta)) {
        Storage::disk('public')->delete($material->ruta);
    }

    $material->delete();

    return redirect()->back()->with('success', 'Material eliminado.');
}

public function updateMaterial(Request $request, $id): RedirectResponse
{
    $cursoId   = session('logros_curso_id');
    $seccionId = session('logros_seccion_id');

    // Garantizar que solo se edite si pertenece a la sección activa
    $material = ArchivoCurso::where('id', $id)
        ->where('curso_id', $cursoId)
        ->where('id_seccion', $seccionId)
        ->firstOrFail();

    $request->validate([
        'tipo'      => 'required|in:archivo,video',
        'nombre'    => 'required|string|max:255',
        'sesion_id' => 'nullable|exists:sesiones,id_sesion',
        'archivo'   => 'nullable|file|max:20480',
        'url_video' => 'required_if:tipo,video|nullable|url|max:255',
    ]);

    $data = [
        'tipo'      => $request->tipo,
        'nombre'    => $request->nombre,
        'sesion_id' => $request->sesion_id,
    ];

    if ($request->tipo === 'archivo') {
        if ($request->hasFile('archivo')) {
            if ($material->ruta && Storage::disk('public')->exists($material->ruta)) {
                Storage::disk('public')->delete($material->ruta);
            }
            $data['ruta'] = $request->file('archivo')->store('materiales', 'public');
        }
    } else {
        $data['ruta'] = $request->url_video;
    }

    $material->update($data);

    return redirect()->back()->with('success', 'Material actualizado correctamente.');
}

public function horarios()
    {
        /** @var \App\Models\Usuario $usuario */
        $usuario = Auth::user();

        // Obtener la entidad/perfil de Docente asociada al Usuario
        $docente = $usuario->docente;

        if (!$docente) {
            return back()->with('error', 'El usuario actual no tiene un perfil docente asignado.');
        }

        // Obtener los horarios vinculados al id del perfil de docente
        $horarios = Horario::with(['curso', 'seccion', 'periodo', 'aula'])
            ->where('id_docente', $docente->id) // O $docente->id_docente según la PK de tu tabla 'docentes'
            ->whereHas('periodo', function ($q) {
                $q->where('activo', 1);
            })
            ->get();

        return Inertia::render('Docentes/Horarios/Index', [
            'horarios' => $horarios,
        ]);
    }
}