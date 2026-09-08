<?php

namespace App\Http\Controllers;

use App\Exports\DocentesPlantillaExport;
use App\Http\Requests\Docente\StoreDocenteRequest;
use App\Http\Requests\Docente\UpdateDocenteRequest;
use App\Imports\DocentesImport;
use App\Models\ArchivoCurso;
use App\Models\Asistencia;
use App\Models\Curso;
use App\Models\Docente;
use App\Models\Horario;
use App\Models\Instituto;
use App\Models\LogroCurso;
use App\Models\MatriculaCurso;
use App\Models\NotaCriterio;
use App\Models\NotaFinal;
use App\Models\NotaLogro;
use App\Models\NotaSubcomponente;
use App\Models\Periodo;
use App\Models\Rol;
use App\Models\Seccion;
use App\Models\Semestre;
use App\Models\Sesion;
use App\Models\SubcomponenteLogro;
use App\Models\Usuario;
use App\Services\DeColectaService;
use App\Services\MoodleService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use RuntimeException;
use App\Services\NotificacionService;
use Throwable;

class DocenteController extends Controller
{
    protected MoodleService $moodleService;
    protected DeColectaService $deColectaService;

    public function __construct(MoodleService $moodleService, DeColectaService $deColectaService)
    {
        $this->moodleService    = $moodleService;
        $this->deColectaService = $deColectaService;
    }

    public function index(): Response
    {
        $docentes = $this->docentesQuery()
            ->paginate(10)
            ->through(fn (Docente $docente): array => $this->docenteData($docente));

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
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['Activo', 'Inactivo'])],
            'page'   => ['nullable', 'integer', 'min:1'],
        ]);

        $search = trim((string) ($validated['search'] ?? ''));
        $status = trim((string) ($validated['status'] ?? ''));

        $docentes = $this->docentesQuery()
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $subquery) use ($search): void {
                    $subquery->where('nombre', 'like', "%{$search}%")
                        ->orWhere('apellido', 'like', "%{$search}%")
                        ->orWhere('dni', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('telefono', 'like', "%{$search}%")
                        ->orWhere('departamento', 'like', "%{$search}%")
                        ->orWhere('cargo', 'like', "%{$search}%")
                        ->orWhereHas('usuario', function (Builder $usuarioQuery) use ($search): void {
                            $usuarioQuery->where('username', 'like', "%{$search}%");
                        });
                });
            })
            ->when($status !== '', function (Builder $query) use ($status): void {
                $query->whereHas('usuario', function (Builder $usuarioQuery) use ($status): void {
                    $usuarioQuery->where('status', $status);
                });
            })
            ->paginate(10, ['*'], 'page', (int) ($validated['page'] ?? 1))
            ->through(fn (Docente $docente): array => $this->docenteData($docente));

        return response()->json([
            'docentes' => $docentes,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Docentes/Create', [
            'estados' => ['Activo', 'Inactivo'],
        ]);
    }

    /**
     * 1. REGISTRO INDIVIDUAL con sincronización en Moodle.
     */
    public function store(StoreDocenteRequest $request): JsonResponse
    {
        try {
            $this->validarIdentidadGlobal(
                dni: (string) $request->input('dni'),
                email: (string) $request->input('email')
            );

            $docente = DB::transaction(function () use ($request): Docente {
                $username = $request->string('username')->trim()->toString();
                $password = (string) $request->input('password');
                $nombre   = $request->string('nombre')->trim()->toString();
                $apellido = $request->string('apellido')->trim()->toString();
                $email    = mb_strtolower(trim((string) $request->input('email')));
                $dni      = trim((string) $request->input('dni'));

                $moodleUserId = $request->input('moodle_user_id');

                if (!$moodleUserId) {
                    try {
                        $moodleUser = $this->moodleService->obtenerUsuarioPorCampo('username', $username);

                        if ($moodleUser && isset($moodleUser['id'])) {
                            $moodleUserId = $moodleUser['id'];
                        } else {
                            $moodleRes = $this->moodleService->crearUsuario(
                                $username,
                                $password,
                                $nombre,
                                $apellido,
                                $email
                            );

                            if (is_array($moodleRes) && isset($moodleRes[0]['id'])) {
                                $moodleUserId = $moodleRes[0]['id'];
                            }
                        }
                    } catch (\Throwable $e) {
                        Log::error("Error al sincronizar docente con Moodle: " . $e->getMessage());
                    }
                }

                $imagePath = null;
                if ($request->hasFile('img')) {
                    $imagePath = $request->file('img')->store('usuarios/docentes', 'public');
                }

                $usuario = Usuario::create([
                    'moodle_user_id' => $moodleUserId,
                    'username'       => $username,
                    'password_hash'  => Hash::make($password),
                    'status'         => $request->input('status', 'Activo'),
                    'img'            => $imagePath,
                ]);

                $rolDocente = $this->obtenerRolDocente();
                $usuario->roles()->sync([$rolDocente->id]);

                return Docente::create([
                    'usuario_id'   => $usuario->id,
                    'nombre'       => $nombre,
                    'apellido'     => $apellido,
                    'dni'          => $dni,
                    'email'        => $email,
                    'telefono'     => $this->normalizarNullable($request->input('telefono')),
                    'direccion'    => $this->normalizarNullable($request->input('direccion')),
                    'departamento' => $this->normalizarNullable($request->input('departamento')),
                    'cargo'        => $this->normalizarNullable($request->input('cargo')),
                ]);
            });

            $docente->load(['usuario.roles']);

            return response()->json([
                'message'  => 'Docente registrado y sincronizado con Moodle correctamente.',
                'docente'  => $this->docenteData($docente),
                'redirect' => route('docentes.index'),
            ], 201);
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        } catch (Throwable $exception) {
            report($exception);
            return response()->json(['message' => 'No se pudo registrar al docente.'], 422);
        }
    }

    /**
     * 2. REGISTRO MASIVO MEDIANTE ARCHIVO EXCEL.
     */
    public function importarMasivo(Request $request, MoodleService $moodleService): JsonResponse
    {
        $request->validate([
            'archivo_excel' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:20480'],
        ]);

        try {
            $importador = new DocentesImport($moodleService);
            Excel::import($importador, $request->file('archivo_excel'));

            return response()->json([
                'success'    => true,
                'message'    => "Proceso completado: {$importador->procesados} docentes registrados y sincronizados con éxito.",
                'procesados' => $importador->procesados,
                'omitidos'   => $importador->omitidos,
                'errores'    => $importador->errores,
            ]);
        } catch (\Throwable $e) {
            Log::error('Error en importación masiva de docentes: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al procesar el archivo Excel: ' . $e->getMessage()
            ], 422);
        }
    }

    public function show(Docente $docente): Response
    {
        $docente->load(['usuario.roles']);

        return Inertia::render('Docentes/Show', [
            'docente' => $this->docenteData($docente),
        ]);
    }

    public function edit(Docente $docente): Response
    {
        $docente->load(['usuario.roles']);

        return Inertia::render('Docentes/Edit', [
            'docente' => $this->docenteData($docente),
            'estados' => ['Activo', 'Inactivo'],
        ]);
    }

    public function update(UpdateDocenteRequest $request, Docente $docente): JsonResponse
    {
        try {
            $this->validarIdentidadGlobal(
                dni: (string) $request->input('dni'),
                email: (string) $request->input('email'),
                docenteActualId: $docente->id
            );

            DB::transaction(function () use ($request, $docente): void {
                $docente->loadMissing('usuario');
                $usuario = $docente->usuario;

                if (!$usuario) {
                    throw new RuntimeException('El docente no tiene un usuario relacionado.');
                }

                $imagePath = $usuario->img;

                if ($request->boolean('remove_img') && $imagePath) {
                    Storage::disk('public')->delete($imagePath);
                    $imagePath = null;
                }

                if ($request->hasFile('img')) {
                    if ($imagePath) {
                        Storage::disk('public')->delete($imagePath);
                    }
                    $imagePath = $request->file('img')->store('usuarios/docentes', 'public');
                }

                $usuarioData = [
                    'moodle_user_id' => $request->input('moodle_user_id'),
                    'username'       => $request->string('username')->trim()->toString(),
                    'status'         => $request->input('status', 'Activo'),
                    'img'            => $imagePath,
                ];

                if ($request->filled('password')) {
                    $usuarioData['password_hash'] = Hash::make($request->input('password'));
                }

                $usuario->update($usuarioData);

                $rolDocente = $this->obtenerRolDocente();
                $usuario->roles()->sync([$rolDocente->id]);

                $docente->update([
                    'nombre'       => $request->string('nombre')->trim()->toString(),
                    'apellido'     => $request->string('apellido')->trim()->toString(),
                    'dni'          => trim((string) $request->input('dni')),
                    'email'        => mb_strtolower(trim((string) $request->input('email'))),
                    'telefono'     => $this->normalizarNullable($request->input('telefono')),
                    'direccion'    => $this->normalizarNullable($request->input('direccion')),
                    'departamento' => $this->normalizarNullable($request->input('departamento')),
                    'cargo'        => $this->normalizarNullable($request->input('cargo')),
                ]);
            });

            $docente->refresh()->load(['usuario.roles']);

            return response()->json([
                'message'  => 'Docente actualizado correctamente.',
                'docente'  => $this->docenteData($docente),
                'redirect' => route('docentes.index'),
            ]);
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        } catch (Throwable $exception) {
            report($exception);
            return response()->json(['message' => 'No se pudo actualizar al docente.'], 422);
        }
    }

    public function destroy(Docente $docente): JsonResponse
    {
        try {
            DB::transaction(function () use ($docente): void {
                $docente->loadMissing('usuario');
                $usuario = $docente->usuario;
                $imagePath = $usuario?->img;

                $docente->delete();

                if ($usuario) {
                    $usuario->roles()->detach();
                    $usuario->areas()->detach();
                    $usuario->delete();
                }

                if ($imagePath) {
                    Storage::disk('public')->delete($imagePath);
                }
            });

            return response()->json([
                'message' => 'Docente eliminado correctamente.',
            ]);
        } catch (Throwable $exception) {
            report($exception);
            return response()->json([
                'message' => 'No se pudo eliminar al docente. Puede tener registros académicos relacionados.',
            ], 422);
        }
    }

    private function docentesQuery(): Builder
    {
        return Docente::query()
            ->with(['usuario.roles'])
            ->orderBy('apellido')
            ->orderBy('nombre');
    }

    private function obtenerRolDocente(): Rol
    {
        $rolDocente = Rol::query()
            ->whereRaw('LOWER(TRIM(nombre)) = ?', ['docente'])
            ->where('estado', true)
            ->first();

        if (!$rolDocente) {
            throw new RuntimeException('No existe un rol activo llamado "Docente". Regístrelo antes de crear docentes.');
        }

        return $rolDocente;
    }

    private function validarIdentidadGlobal(string $dni, string $email, ?int $docenteActualId = null): void
    {
        $errores = [];

        if ($this->valorExisteEnPerfiles(columna: 'dni', valor: trim($dni), tablaActual: 'docentes', registroActualId: $docenteActualId)) {
            $errores['dni'] = ['El DNI ya está registrado en otro perfil del sistema.'];
        }

        if ($this->valorExisteEnPerfiles(columna: 'email', valor: mb_strtolower(trim($email)), tablaActual: 'docentes', registroActualId: $docenteActualId)) {
            $errores['email'] = ['El correo electrónico ya está registrado en otro perfil del sistema.'];
        }

        if ($errores !== []) {
            throw ValidationException::withMessages($errores);
        }
    }

    private function valorExisteEnPerfiles(string $columna, string $valor, string $tablaActual, ?int $registroActualId = null): bool
    {
        $tablas = ['administradores', 'docentes', 'personal', 'cajeros', 'postulantes'];

        foreach ($tablas as $tabla) {
            if (!Schema::hasTable($tabla) || !Schema::hasColumn($tabla, $columna)) {
                continue;
            }

            $query = DB::table($tabla);

            if ($columna === 'email') {
                $query->whereRaw('LOWER(TRIM(email)) = ?', [mb_strtolower(trim($valor))]);
            } else {
                $query->where($columna, trim($valor));
            }

            if ($tabla === $tablaActual && $registroActualId !== null && Schema::hasColumn($tabla, 'id')) {
                $query->where('id', '!=', $registroActualId);
            }

            if ($query->exists()) {
                return true;
            }
        }

        return false;
    }

    private function normalizarNullable(mixed $valor): ?string
    {
        $valor = trim((string) $valor);
        return $valor !== '' ? $valor : null;
    }

    private function docenteData(Docente $docente): array
    {
        $usuario = $docente->usuario;

        return [
            'id'              => $docente->id,
            'usuario_id'      => $docente->usuario_id,
            'nombre'          => $docente->nombre,
            'apellido'        => $docente->apellido,
            'nombre_completo' => trim("{$docente->nombre} {$docente->apellido}"),
            'dni'             => $docente->dni,
            'email'           => $docente->email,
            'telefono'        => $docente->telefono,
            'direccion'       => $docente->direccion,
            'departamento'    => $docente->departamento,
            'cargo'           => $docente->cargo,
            'created_at'      => optional($docente->created_at)?->format('d/m/Y H:i'),
            'updated_at'      => optional($docente->updated_at)?->format('d/m/Y H:i'),
            'usuario'         => $usuario ? [
                'id'             => $usuario->id,
                'moodle_user_id' => $usuario->moodle_user_id,
                'username'       => $usuario->username,
                'status'         => $usuario->status,
                'img'            => $usuario->img ? Storage::disk('public')->url($usuario->img) : null,
                'roles'          => $usuario->roles->pluck('nombre')->values(),
            ] : null,
        ];
    }

    public function misCursos(Request $request): Response
    {
        $usuario   = $request->user();
        $docenteId = $usuario->docente?->id ?? $usuario->id;

        $periodos  = Periodo::orderBy('id', 'desc')->get();
        $semestres = Semestre::all();

        $periodoId  = $request->input('periodo_id') ?? $periodos->first()?->id;
        $semestreId = $request->input('semestre_id');

        $query = Horario::with(['curso.semestre', 'seccion', 'turno', 'periodo'])
            ->where('id_docente', $docenteId);

        if ($periodoId) {
            $query->where('id_periodo', $periodoId);
        }

        if ($semestreId) {
            $query->whereHas('curso', fn ($q) => $q->where('semestre_id', $semestreId));
        }

        $horarios = $query->get();

        $cursos = $horarios->groupBy(fn ($item) => $item->id_curso . '_' . $item->id_seccion)
            ->map(function ($grupo) {
                $primerHorario = $grupo->first();
                return [
                    'curso_id'        => $primerHorario->id_curso,
                    'seccion_id'      => $primerHorario->id_seccion,
                    'curso_nombre'    => $primerHorario->curso?->nombre,
                    'curso_codigo'    => $primerHorario->curso?->codigo,
                    'semestre_nombre' => $primerHorario->curso?->semestre?->nombre,
                    'seccion_nombre'  => $primerHorario->seccion?->nombre,
                    'turno_nombre'    => $primerHorario->turno?->nombre,
                    'total_bloques'   => $grupo->count(),
                    'horarios'        => $grupo->map(fn ($h) => [
                        'dia'         => $h->dia,
                        'hora_inicio' => $h->hora_inicio,
                        'hora_fin'    => $h->hora_fin,
                        'aula'        => $h->numero_aula,
                    ])->values(),
                ];
            })->values();

        return Inertia::render('Docentes/Cursos/Index', [
            'periodos'  => $periodos,
            'semestres' => $semestres,
            'cursos'    => $cursos,
            'filters'   => [
                'periodo_id'  => (string) $periodoId,
                'semestre_id' => (string) $semestreId,
            ],
        ]);
    }

    public function gestionar(Request $request): Response|RedirectResponse
    {
        $usuario   = $request->user();
        $docenteId = $usuario->docente?->id ?? $usuario->id;

        $cursoId   = $request->input('curso_id') ?? session('logros_curso_id');
        $seccionId = $request->input('seccion_id') ?? session('logros_seccion_id');
        $periodoId = $request->input('periodo_id') ?? session('logros_periodo_id') ?? Periodo::orderBy('id', 'desc')->first()?->id;

        if (!$cursoId || !$seccionId) {
            return redirect()->route('docente.cursos');
        }

        session([
            'logros_curso_id'   => $cursoId,
            'logros_seccion_id' => $seccionId,
            'logros_periodo_id' => $periodoId,
        ]);

        $horariosIds = Horario::where('id_curso', $cursoId)
            ->where('id_seccion', $seccionId)
            ->where('id_periodo', $periodoId)
            ->where('id_docente', $docenteId)
            ->pluck('id');

        $sesiones = Sesion::where('curso_id', $cursoId)
            ->where(function ($query) use ($horariosIds) {
                $query->whereIn('horario_id', $horariosIds)->orWhereNull('horario_id');
            })
            ->orderBy('fecha', 'asc')
            ->orderBy('id_sesion', 'asc')
            ->get();

        $materiales = ArchivoCurso::where('curso_id', $cursoId)
            ->orderBy('created_at', 'desc')
            ->get();

        $subcomponentes = SubcomponenteLogro::whereHas('logro', fn ($query) => $query->where('curso_id', $cursoId))->get();

        $curso   = Curso::with('semestre')->findOrFail($cursoId);
        $seccion = Seccion::findOrFail($seccionId);
        $periodo = Periodo::find($periodoId);

        return Inertia::render('Docentes/Cursos/Gestionar/Index', [
            'curso' => [
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

    public function storeSesion(Request $request): RedirectResponse
    {
        $request->validate([
            'nombre'    => 'required|string|max:255',
            'fecha'     => 'required|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha',
            'archivo'   => 'nullable|file|mimes:pdf,docx,pptx,zip|max:10240',
        ]);

        $cursoId   = session('logros_curso_id');
        $seccionId = session('logros_seccion_id');
        $periodoId = session('logros_periodo_id');
        $docenteId = $request->user()->docente?->id ?? $request->user()->id;

        if (!$cursoId || !$seccionId) {
            return redirect()->back()->withErrors([
                'nombre' => 'La sesión académica ha expirado. Por favor, vuelve a ingresar al curso.',
            ]);
        }

        $horarioId = Horario::where('id_curso', $cursoId)
            ->where('id_seccion', $seccionId)
            ->where('id_periodo', $periodoId)
            ->where('id_docente', $docenteId)
            ->orderBy('id', 'asc')
            ->value('id');

        $rutaArchivo = null;
        if ($request->hasFile('archivo')) {
            $rutaArchivo = $request->file('archivo')->store('sesiones', 'public');
        }

        $conteoActual = Sesion::where('curso_id', $cursoId)
            ->where('horario_id', $horarioId)
            ->count();

        $numeroSesion = $conteoActual + 1;
        $moodleSectionId = null;

        $curso = Curso::find($cursoId);
        if ($curso && $curso->moodle_course_id) {
            $moodleCourseId = (int) $curso->moodle_course_id;

            try {
                $nombreSeccionMoodle = "Semana {$numeroSesion}: {$request->nombre}";
                $moodleSectionId = $this->moodleService->crearSeccionMoodle(
                    $moodleCourseId,
                    $nombreSeccionMoodle,
                    $numeroSesion
                );
            } catch (\Throwable $e) {
                Log::error('Error creando sección con plugin en Moodle: ' . $e->getMessage());
            }
        }

        try {
            Sesion::create([
                'curso_id'          => $cursoId,
                'horario_id'        => $horarioId,
                'moodle_section_id' => $moodleSectionId,
                'nombre'            => $request->nombre,
                'fecha'             => $request->fecha,
                'fecha_fin'         => $request->fecha_fin,
                'archivo'           => $rutaArchivo,
                'activo'            => 1,
            ]);

            return redirect()->back()->with('success', 'Sesión registrada y creada en el Aula Virtual correctamente.');
        } catch (\Exception $e) {
            Log::error('Error al guardar la sesión: ' . $e->getMessage());

            return redirect()->back()->withErrors([
                'nombre' => 'Ocurrió un error en el servidor al intentar guardar la sesión.',
            ]);
        }
    }

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

        if ($request->hasFile('archivo')) {
            if ($sesion->archivo && Storage::disk('public')->exists($sesion->archivo)) {
                Storage::disk('public')->delete($sesion->archivo);
            }
            $datosActualizar['archivo'] = $request->file('archivo')->store('sesiones', 'public');
        }

        $sesion->update($datosActualizar);

        return redirect()->back()->with('success', 'Sesión actualizada correctamente.');
    }

    public function toggleSesion($id): RedirectResponse
    {
        $sesion = Sesion::findOrFail($id);
        $sesion->update(['activo' => !$sesion->activo]);

        return redirect()->back()->with('success', 'Estado de la sesión actualizado.');
    }

    public function destroySesion($id): RedirectResponse
    {
        $sesion = Sesion::findOrFail($id);

        if ($sesion->archivo && Storage::disk('public')->exists($sesion->archivo)) {
            Storage::disk('public')->delete($sesion->archivo);
        }

        $sesion->delete();

        return redirect()->back()->with('success', 'Sesión eliminada correctamente.');
    }

   
    public function generarSesionesAutomaticas(Request $request): RedirectResponse
    {
        $request->validate([
            'fecha_inicio'   => 'required|date',
            'total_sesiones' => 'required|integer|min:1|max:64',
        ]);

        $cursoId   = session('logros_curso_id');
        $seccionId = session('logros_seccion_id');
        $periodoId = session('logros_periodo_id');
        $docenteId = $request->user()->docente?->id ?? $request->user()->id;

        if (!$cursoId || !$seccionId) {
            return redirect()->back()->withErrors([
                'error' => 'La sesión del curso ha expirado. Selecciona el curso nuevamente.',
            ]);
        }

        // Obtener los bloques de horarios del docente para esta sección
        $horarios = Horario::where('id_curso', $cursoId)
            ->where('id_seccion', $seccionId)
            ->when($periodoId, fn ($q) => $q->where('id_periodo', $periodoId))
            ->where('id_docente', $docenteId)
            ->get();

        if ($horarios->isEmpty()) {
            return redirect()->back()->withErrors([
                'error' => 'No tienes horarios asignados para este curso y sección.',
            ]);
        }

        // Mapeo de días en español al formato numérico de Carbon (1: Lunes ... 7: Domingo)
        $diasMap = [
            'LUNES'     => 1,
            'MARTES'    => 2,
            'MIERCOLES' => 3,
            'MIÉRCOLES' => 3,
            'JUEVES'    => 4,
            'VIERNES'   => 5,
            'SABADO'    => 6,
            'SÁBADO'    => 6,
            'DOMINGO'   => 7,
        ];

        // Mapear el ID de horario asignado a cada día de la semana
        $horariosPorDia = [];
        foreach ($horarios as $h) {
            $diaUpper = mb_strtoupper(trim($h->dia));
            if (isset($diasMap[$diaUpper])) {
                $horariosPorDia[$diasMap[$diaUpper]] = $h->id;
            }
        }

        if (empty($horariosPorDia)) {
            return redirect()->back()->withErrors([
                'error' => 'Los días en la tabla de horarios no tienen un formato válido (ej: Lunes, Martes).',
            ]);
        }

        // Datos del curso para sincronización con Moodle
        $curso = Curso::find($cursoId);
        $moodleCourseId = ($curso && $curso->moodle_course_id) ? (int) $curso->moodle_course_id : null;

        $totalSesiones = (int) $request->total_sesiones;
        $fechaCursor   = \Carbon\Carbon::parse($request->fecha_inicio);
        $sesionesCreadas = 0;

        // Conteo inicial para mantener la correlación de sesiones existentes
        $conteoInicial = Sesion::where('curso_id', $cursoId)
            ->whereIn('horario_id', $horarios->pluck('id'))
            ->count();

        DB::beginTransaction();
        try {
            $maxDiasBusqueda = 365;
            $diasIterados    = 0;

            while ($sesionesCreadas < $totalSesiones && $diasIterados < $maxDiasBusqueda) {
                $diaSemana = $fechaCursor->isoWeekday(); // 1 a 7

                if (isset($horariosPorDia[$diaSemana])) {
                    $numeroCorrelativo = $conteoInicial + $sesionesCreadas + 1;
                    $horarioAsignadoId = $horariosPorDia[$diaSemana];
                    $fechaFormato      = $fechaCursor->format('Y-m-d');
                    $nombreSesion      = "Sesión {$numeroCorrelativo}";
                    $moodleSectionId   = null;

                    // 1. Crear la sección en Moodle si el curso está vinculado
                    if ($moodleCourseId) {
                        try {
                            $nombreSeccionMoodle = "Semana {$numeroCorrelativo}: {$nombreSesion}";
                            $moodleSectionId = $this->moodleService->crearSeccionMoodle(
                                $moodleCourseId,
                                $nombreSeccionMoodle,
                                $numeroCorrelativo
                            );
                        } catch (\Throwable $e) {
                            Log::error("Error creando sección {$numeroCorrelativo} en Moodle: " . $e->getMessage());
                        }
                    }

                    // 2. Crear el registro local con su moodle_section_id vinculado
                    Sesion::create([
                        'curso_id'          => $cursoId,
                        'horario_id'        => $horarioAsignadoId,
                        'moodle_section_id' => $moodleSectionId,
                        'nombre'            => $nombreSesion,
                        'fecha'             => $fechaFormato,
                        'fecha_fin'         => $fechaFormato,
                        'archivo'           => null,
                        'activo'            => 1,
                    ]);

                    $sesionesCreadas++;
                }

                $fechaCursor->addDay();
                $diasIterados++;
            }

            DB::commit();

            $mensaje = $moodleCourseId 
                ? "Se generaron {$sesionesCreadas} sesiones y se sincronizaron con el Aula Virtual (Moodle) exitosamente."
                : "Se generaron {$sesionesCreadas} sesiones correctamente.";

            return redirect()->back()->with('success', $mensaje);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Error generando sesiones automáticas: ' . $e->getMessage());

            return redirect()->back()->withErrors([
                'error' => 'Ocurrió un error al generar las sesiones: ' . $e->getMessage(),
            ]);
        }
    }

    public function getAsistenciasPorSesion($sesionId): JsonResponse
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

    public function guardarAsistencia(Request $request): RedirectResponse
{
    $request->validate([
        'sesion_id'                        => 'required|exists:sesiones,id_sesion',
        'fecha'                            => 'required|date',
        'asistencias'                      => 'required|array',
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

        // =========================================================
        // NOTIFICACIÓN A ESTUDIANTES DEL CURSO
        // =========================================================
        $sesion = Sesion::with(['curso', 'horario'])->find($sesionId);

        if ($sesion) {
            $nombreCurso = $sesion->curso?->nombre ?? 'tu unidad didáctica';
            $nombreSesion = $sesion->nombre ?? 'la clase';
            $seccionId = $sesion->horario?->id_seccion;
            $periodoId = $sesion->horario?->id_periodo;

            NotificacionService::notificarEstudiantesDeCurso(
                $sesion->curso_id,
                $seccionId,
                $periodoId,
                "Se registró la asistencia de {$nombreSesion} en {$nombreCurso}.",
                'asistencia',
                route('estudiante.asistencia')
            );
        }

        return redirect()->back()->with('success', 'Asistencia registrada y estudiantes notificados correctamente.');
    } catch (\Exception $e) {
        Log::error('Error al guardar asistencia: ' . $e->getMessage());
        return redirect()->back()->withErrors(['error' => 'Error al guardar la asistencia: ' . $e->getMessage()]);
    }
}
    public function generarPdfReporte(Request $request)
    {
        $cursoId   = session('logros_curso_id') ?? $request->input('curso_id');
        $seccionId = session('logros_seccion_id') ?? $request->input('seccion_id');
        $periodoId = session('logros_periodo_id') ?? $request->input('periodo_id');

        $instituto    = Instituto::with(['distrito.provincia.departamento'])->first();
        $distrito     = $instituto?->distrito;
        $provincia    = $distrito?->provincia;
        $departamento = $provincia?->departamento;

        $curso       = Curso::with(['semestre', 'planesEstudio'])->findOrFail($cursoId);
        $seccion     = Seccion::findOrFail($seccionId);
        $periodo     = Periodo::find($periodoId);
        $planEstudio = $curso->planesEstudio->first();

        $usuarioDocente = auth()->user();
        $nombreDocente  = $usuarioDocente?->nombre_completo ?? $usuarioDocente?->username ?? 'DOCENTE NO ASIGNADO';

        $horarioId = Horario::where('id_curso', $cursoId)
            ->where('id_seccion', $seccionId)
            ->where('id_periodo', $periodoId)
            ->value('id');

        $estudiantes = MatriculaCurso::with('estudiante')
            ->where('horario_id', $horarioId)
            ->get()
            ->map(fn ($item) => [
                'matricula_curso_id' => $item->id,
                'codigo'             => $item->estudiante?->codigo_postulante ?? $item->estudiante?->dni ?? 'S/N',
                'nombre_completo'    => $item->estudiante?->nombre_completo ?? 'Sin Nombre',
            ])
            ->sortBy('nombre_completo')
            ->values();

        $sesiones = Sesion::where('curso_id', $cursoId)
            ->when($horarioId, fn ($query) => $query->where('horario_id', $horarioId))
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
            'tipo'        => 'required|in:archivo,video',
            'nombre'      => 'nullable|string|max:255',
            'sesion_id'   => 'nullable|exists:sesiones,id_sesion',
            'archivos'    => 'required_if:tipo,archivo|nullable|array',
            'archivos.*'  => 'file|max:20480',
            'url_video'   => 'required_if:tipo,video|nullable|url|max:255',
        ]);

        $cursoId   = session('logros_curso_id');
        $seccionId = session('logros_seccion_id');
        $periodoId = session('logros_periodo_id');

        if (!$cursoId || !$seccionId) {
            return redirect()->back()->withErrors(['error' => 'La sesión del curso ha expirado.']);
        }

        $curso = Curso::findOrFail($cursoId);
        $moodleCourseId = $curso->moodle_course_id ? (int) $curso->moodle_course_id : null;
        
        $sesion = $request->filled('sesion_id') ? Sesion::find($request->sesion_id) : null;
        // Obtenemos el número o id de sección de Moodle
        $moodleSectionId = $sesion?->moodle_section_id;

        try {
            DB::beginTransaction();

            if ($request->tipo === 'archivo' && $request->hasFile('archivos')) {
                foreach ($request->file('archivos') as $archivo) {
                    $nombreOriginal = $archivo->getClientOriginalName();
                    $nombreFinal = $request->filled('nombre') ? $request->nombre : pathinfo($nombreOriginal, PATHINFO_FILENAME);
                    $ruta = $archivo->store('materiales', 'public');

                    // 1. Si Moodle está configurado, subir archivo a Moodle
                    if ($moodleCourseId) {
                        $draftItemId = $this->moodleService->subirArchivoAMoodle($archivo);
                        
                        if ($moodleSectionId && $draftItemId) {
                            $this->moodleService->agregarRecursoASeccion(
                                $moodleCourseId,
                                (int) $moodleSectionId,
                                $nombreFinal,
                                $ruta,
                                'archivo'
                            );
                        }
                    }

                    // 2. Guardar en Base de Datos local
                    ArchivoCurso::create([
                        'curso_id'   => $cursoId,
                        'id_seccion' => $seccionId,
                        'id_periodo' => $periodoId,
                        'sesion_id'  => $request->sesion_id,
                        'tipo'       => 'archivo',
                        'nombre'     => $nombreFinal,
                        'ruta'       => $ruta,
                    ]);
                }
            } elseif ($request->tipo === 'video') {
                $nombreFinal = $request->nombre ?: 'Enlace de Video';

                if ($moodleCourseId && $moodleSectionId) {
                    $this->moodleService->agregarRecursoASeccion(
                        $moodleCourseId,
                        (int) $moodleSectionId,
                        $nombreFinal,
                        $request->url_video,
                        'video'
                    );
                }

                ArchivoCurso::create([
                    'curso_id'   => $cursoId,
                    'id_seccion' => $seccionId,
                    'id_periodo' => $periodoId,
                    'sesion_id'  => $request->sesion_id,
                    'tipo'       => 'video',
                    'nombre'     => $nombreFinal,
                    'ruta'       => $request->url_video,
                ]);
            }

            DB::commit();
            return redirect()->back()->with('success', 'Material(es) publicado(s) y sincronizado(s) con éxito.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Error guardando material didáctico: ' . $e->getMessage());
            return redirect()->back()->withErrors(['error' => 'No se pudo guardar el material: ' . $e->getMessage()]);
        }
    }

    public function destroyMaterial($id): RedirectResponse
    {
        $cursoId   = session('logros_curso_id');
        $seccionId = session('logros_seccion_id');

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

    public function horarios(): Response|RedirectResponse
    {
        /** @var \App\Models\Usuario $usuario */
        $usuario = Auth::user();
        $docente = $usuario->docente;

        if (!$docente) {
            return back()->with('error', 'El usuario actual no tiene un perfil docente asignado.');
        }

        $horarios = Horario::with(['curso', 'seccion', 'periodo', 'aula'])
            ->where('id_docente', $docente->id)
            ->whereHas('periodo', fn ($q) => $q->where('activo', 1))
            ->get();

        return Inertia::render('Docentes/Horarios/Index', [
            'horarios' => $horarios,
        ]);
    }

    public function imprimirHorarioPdf()
    {
        /** @var \App\Models\Usuario $usuario */
        $usuario = Auth::user();
        $docente = $usuario->docente;

        if (!$docente) {
            return back()->with('error', 'No se encontró el perfil docente asignado.');
        }

        $periodoActivo = Periodo::where('activo', 1)->first();

        $horarios = Horario::with(['curso.semestre', 'seccion', 'turno', 'periodo', 'aula'])
            ->where('id_docente', $docente->id)
            ->when($periodoActivo, fn ($q) => $q->where('id_periodo', $periodoActivo->id))
            ->get();

        $instituto = Instituto::with(['distrito.provincia.departamento'])->first();

        $pdf = Pdf::loadView('pdf.horario_docente', compact(
            'instituto',
            'docente',
            'usuario',
            'periodoActivo',
            'horarios'
        ))->setPaper('a4', 'landscape');

        return $pdf->stream("Horario_Docente_{$docente->dni}.pdf");
    }

    public function miPerfil(): Response
    {
        /** @var \App\Models\Usuario $usuario */
        $usuario = Auth::user();
        $docente = $usuario->docente;

        if (!$docente) {
            abort(403, 'No tiene un perfil docente asignado.');
        }

        $docente->load(['usuario.roles']);

        $cursosHistorial = Horario::with(['curso.semestre', 'seccion', 'periodo'])
            ->where('id_docente', $docente->id)
            ->get()
            ->groupBy('id_periodo')
            ->map(fn ($grupo) => [
                'periodo' => $grupo->first()->periodo?->nombre ?? 'Periodo',
                'cursos'  => $grupo->map(fn ($h) => [
                    'curso'   => $h->curso?->nombre,
                    'codigo'  => $h->curso?->codigo,
                    'seccion' => $h->seccion?->nombre,
                ])->unique('curso')->values(),
            ])->values();

        return Inertia::render('Docentes/Perfil/Show', [
            'docente'         => $this->docenteData($docente),
            'cursosHistorial' => $cursosHistorial,
        ]);
    }

    public function updateMiPerfil(Request $request): RedirectResponse
    {
        /** @var \App\Models\Usuario $usuario */
        $usuario = Auth::user();
        $docente = $usuario->docente;

        if (!$docente) {
            abort(403, 'Acceso denegado.');
        }

        $request->validate([
            'email'            => ['required', 'email', 'max:150'],
            'telefono'         => ['nullable', 'string', 'max:20'],
            'direccion'        => ['nullable', 'string', 'max:255'],
            'current_password' => ['nullable', 'required_with:password', 'current_password'],
            'password'         => ['nullable', 'confirmed', 'min:8'],
            'img'              => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_img'       => ['nullable', 'boolean'],
        ], [
            'current_password.current_password' => 'La contraseña actual no es correcta.',
            'password.confirmed'                => 'La confirmación de la nueva contraseña no coincide.',
            'password.min'                      => 'La nueva contraseña debe tener al menos 8 caracteres.',
        ]);

        $this->validarIdentidadGlobal(
            dni: $docente->dni,
            email: (string) $request->input('email'),
            docenteActualId: $docente->id
        );

        DB::transaction(function () use ($request, $docente, $usuario): void {
            $imagePath = $usuario->img;

            if ($request->boolean('remove_img') && $imagePath) {
                Storage::disk('public')->delete($imagePath);
                $imagePath = null;
            }

            if ($request->hasFile('img')) {
                if ($imagePath) {
                    Storage::disk('public')->delete($imagePath);
                }
                $imagePath = $request->file('img')->store('usuarios/docentes', 'public');
            }

            $usuarioData = ['img' => $imagePath];

            if ($request->filled('password')) {
                $usuarioData['password_hash'] = Hash::make($request->input('password'));
            }

            $usuario->update($usuarioData);

            $docente->update([
                'email'     => mb_strtolower(trim((string) $request->input('email'))),
                'telefono'  => $this->normalizarNullable($request->input('telefono')),
                'direccion' => $this->normalizarNullable($request->input('direccion')),
            ]);
        });

        return redirect()->back()->with('success', 'Perfil profesional actualizado exitosamente.');
    }

    public function descargarPlantillaExcel()
    {
        return Excel::download(new DocentesPlantillaExport, 'Plantilla_Importacion_Docentes.xlsx');
    }

    public function consultarDni(Request $request): JsonResponse
    {
        $request->validate([
            'dni' => ['required', 'string', 'size:8', 'regex:/^[0-9]+$/'],
        ]);

        $dni = $request->input('dni');
        $resultado = $this->deColectaService->consultarDni($dni);

        if (!$resultado['success']) {
            return response()->json([
                'success' => false,
                'message' => $resultado['message'] ?? 'No se encontraron datos para el DNI.',
            ], 404);
        }

        $data = $resultado['data'];

        return response()->json([
            'success'   => true,
            'dni'       => $dni,
            'nombres'   => $data['nombres'] ?? $data['first_name'] ?? '',
            'apellidos' => trim(($data['apellido_paterno'] ?? $data['first_last_name'] ?? '') . ' ' . ($data['apellido_materno'] ?? $data['second_last_name'] ?? '')),
        ]);
    }

    public function registroAuxiliarIndex(Request $request): Response
    {
        $usuario = Auth::user();
        $docenteId = $usuario?->docente?->id ?? $usuario?->id;

        $periodoActivo = Periodo::where('activo', 1)->first()
            ?? Periodo::latest('id')->first();

        $periodoId = $request->input('periodo_id', session('logros_periodo_id', $periodoActivo?->id));

        $periodoSeleccionado = Periodo::find($periodoId);
        $periodoCerrado = false;

        if ($periodoSeleccionado) {
            $ahora = now()->startOfDay();
            $periodoCerrado = !$periodoSeleccionado->activo 
                || ($periodoSeleccionado->fecha_fin && $ahora->gt($periodoSeleccionado->fecha_fin));
        }

        $horariosDocente = Horario::with(['curso.semestre', 'seccion', 'turno', 'planEstudio'])
            ->where('id_periodo', $periodoId)
            ->when($docenteId, fn($q) => $q->where('id_docente', $docenteId))
            ->get()
            ->unique(fn($h) => $h->id_curso . '_' . $h->id_seccion)
            ->values();

        $cursoId = $request->input('curso_id', session('logros_curso_id'));
        $seccionId = $request->input('seccion_id', session('logros_seccion_id'));

        if ((!$cursoId || !$seccionId) && $horariosDocente->isNotEmpty()) {
            $primerHorario = $horariosDocente->first();
            $cursoId = $primerHorario->id_curso;
            $seccionId = $primerHorario->id_seccion;
        }

        session([
            'logros_curso_id'   => $cursoId,
            'logros_seccion_id' => $seccionId,
            'logros_periodo_id' => $periodoId,
        ]);

        $cursoSeleccionado = $cursoId ? Curso::with(['semestre', 'planesEstudio'])->find($cursoId) : null;
        $seccionSeleccionada = $seccionId ? Seccion::find($seccionId) : null;

        return Inertia::render('Docentes/RegistroAuxiliar', [
            'periodos'            => Periodo::select('id', 'nombre', 'activo', 'fecha_inicio', 'fecha_fin')->get(),
            'periodoActivo'       => $periodoActivo,
            'periodoSeleccionado' => $periodoSeleccionado,
            'periodoCerrado'      => $periodoCerrado,
            'horariosDocente'     => $horariosDocente->map(fn($h) => [
                'id'              => $h->id,
                'curso_id'        => $h->id_curso,
                'curso_nombre'    => $h->curso?->nombre ?? 'Sin Curso',
                'seccion_id'      => $h->id_seccion,
                'seccion_nombre'  => $h->seccion?->nombre ?? 'A',
                'plan_nombre'     => $h->planEstudio?->nombre ?? 'Plan General',
                'semestre'        => $h->curso?->semestre?->nombre ?? 'I',
            ]),
            'cursoSeleccionado'   => $cursoSeleccionado,
            'seccionSeleccionada' => $seccionSeleccionada,
        ]);
    }

    public function setRegistroAuxiliarContext(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'curso_id'   => 'required|integer|exists:cursos,id',
            'seccion_id' => 'required|integer|exists:secciones,id',
            'periodo_id' => 'required|integer|exists:periodos,id',
        ]);

        $periodo = Periodo::findOrFail($validated['periodo_id']);

        session([
            'logros_curso_id'   => $validated['curso_id'],
            'logros_seccion_id' => $validated['seccion_id'],
            'logros_periodo_id' => $validated['periodo_id'],
        ]);

        $ahora = now()->startOfDay();
        $periodoCerrado = !$periodo->activo 
            || ($periodo->fecha_fin && $ahora->gt($periodo->fecha_fin));

        $redirect = redirect()->route('docente.registro-auxiliar', [
            'curso_id'   => $validated['curso_id'],
            'seccion_id' => $validated['seccion_id'],
            'periodo_id' => $validated['periodo_id'],
        ]);

        if ($periodoCerrado) {
            return $redirect->with('warning', 'Periodo cerrado: La fecha límite ha vencido o el periodo se encuentra inactivo. El registro se encuentra en modo solo lectura.');
        }

        return $redirect;
    }

    /**
     * Importar notas de criterios y logro desde un archivo Excel directamente en el backend
     */
    public function importarNotasLogroExcel(Request $request): JsonResponse
    {
        $request->validate([
            'archivo_excel'  => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:20480'],
            'curso_id'       => ['required', 'integer', 'exists:cursos,id'],
            'seccion_id'     => ['required', 'integer', 'exists:secciones,id'],
            'periodo_id'     => ['required', 'integer', 'exists:periodos,id'],
            'logro_curso_id' => ['required', 'integer', 'exists:logros_curso,id'],
        ]);

        $cursoId      = (int) $request->curso_id;
        $seccionId    = (int) $request->seccion_id;
        $periodoId    = (int) $request->periodo_id;
        $logroCursoId = (int) $request->logro_curso_id;

        try {
            $archivo = $request->file('archivo_excel');
            $datosExcel = Excel::toArray([], $archivo);

            if (empty($datosExcel) || empty($datosExcel[0])) {
                return response()->json(['message' => 'El archivo Excel está vacío.'], 422);
            }

            $filas = $datosExcel[0];

            $logro = LogroCurso::with(['subcomponentes.criterios' => function ($query) {
                $query->orderBy('orden', 'asc');
            }])->findOrFail($logroCursoId);

            $criteriosOrdenados = [];
            foreach ($logro->subcomponentes as $sub) {
                foreach ($sub->criterios as $crit) {
                    $criteriosOrdenados[] = $crit->id;
                }
            }

            $totalCriterios = count($criteriosOrdenados);
            if ($totalCriterios === 0) {
                return response()->json(['message' => 'El logro no tiene criterios configurados.'], 422);
            }

            $horarioId = Horario::where('id_curso', $cursoId)
                ->where('id_seccion', $seccionId)
                ->when($periodoId, fn($q) => $q->where('id_periodo', $periodoId))
                ->value('id');

            $matriculados = MatriculaCurso::with('estudiante')
                ->where('horario_id', $horarioId)
                ->get();

            $estudiantesMap = [];
            foreach ($matriculados as $mat) {
                $est = $mat->estudiante;
                if ($est) {
                    $dni = trim((string) ($est->dni ?? $est->codigo_postulante ?? ''));
                    $idPostulante = $est->id_postulante ?? $est->id;
                    if ($dni !== '') {
                        $estudiantesMap[$dni] = $idPostulante;
                    }
                }
            }

            $notasCriteriosPayload = [];
            $procesados = 0;

            for ($r = 6; $r < count($filas); $r++) {
                $fila = $filas[$r];
                if (empty($fila) || !isset($fila[1])) continue;

                $dniExcel = trim((string) $fila[1]);
                if (!isset($estudiantesMap[$dniExcel])) continue;

                $estudianteId = $estudiantesMap[$dniExcel];
                $colIndex = 3;

                foreach ($criteriosOrdenados as $critId) {
                    if (isset($fila[$colIndex]) && $fila[$colIndex] !== '' && is_numeric($fila[$colIndex])) {
                        $notaVal = min(20, max(0, (float) $fila[$colIndex]));

                        $notasCriteriosPayload[] = [
                            'estudiante_id' => $estudianteId,
                            'criterio_id'   => $critId,
                            'id_seccion'    => $seccionId,
                            'id_periodo'    => $periodoId,
                            'nota'          => $notaVal,
                        ];
                    }
                    $colIndex++;
                }

                $procesados++;
            }

            DB::transaction(function () use ($notasCriteriosPayload, $seccionId, $periodoId) {
                foreach ($notasCriteriosPayload as $item) {
                    NotaCriterio::updateOrCreate(
                        [
                            'estudiante_id' => $item['estudiante_id'],
                            'criterio_id'   => $item['criterio_id'],
                            'id_seccion'    => $seccionId,
                            'id_periodo'    => $periodoId,
                        ],
                        [
                            'nota' => $item['nota'],
                        ]
                    );
                }
            });

            return response()->json([
                'success'    => true,
                'message'    => "Se importaron las calificaciones de {$procesados} estudiantes con éxito.",
                'procesados' => $procesados,
            ]);
        } catch (\Throwable $e) {
            Log::error('Error en importarNotasLogroExcel: ' . $e->getMessage());
            return response()->json([
                'message' => 'Ocurrió un error al procesar el archivo Excel: ' . $e->getMessage()
            ], 500);
        }
    }
}