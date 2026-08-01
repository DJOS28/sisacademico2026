<?php

namespace App\Http\Controllers;

use App\Models\Colegio;
use App\Models\Postulante;
use App\Models\TipoPago;
use App\Models\Usuario;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EstudianteController extends Controller
{
    /**
     * Lista principal de estudiantes/postulantes.
     */
    public function index(): Response
    {
        return Inertia::render('Estudiantes/Index', [
            'estudiantes' => $this->obtenerEstudiantes(),
            'generos' => $this->generos(),
            'grados' => $this->grados(),
            'filtros' => [
                'buscar' => '',
                'genero' => '',
                'grado' => '',
                'discapacidad' => '',
            ],
        ]);
    }

    /**
     * Filtrado mediante POST AJAX.
     */
    public function filtrar(Request $request): JsonResponse 
    {
        $datos = $request->validate([
            'buscar' => ['nullable', 'string', 'max:150'],
            'genero' => ['nullable', 'string', 'max:20'],
            'grado' => ['nullable', 'string', 'max:50'],
            'discapacidad' => ['nullable', Rule::in(['', '1', '0', 1, 0])],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $buscar = trim((string) ($datos['buscar'] ?? ''));
        $genero = trim((string) ($datos['genero'] ?? ''));
        $grado = trim((string) ($datos['grado'] ?? ''));
        $discapacidad = filled($datos['discapacidad'] ?? null) ? (int) $datos['discapacidad'] : null;
        $pagina = max(1, (int) ($datos['page'] ?? 1));

        $estudiantes = $this->obtenerEstudiantes(
            buscar: $buscar,
            genero: $genero,
            grado: $grado,
            discapacidad: $discapacidad,
            pagina: $pagina
        );

        if ($estudiantes->isEmpty() && $pagina > 1 && $estudiantes->lastPage() > 0) {
            $pagina = $estudiantes->lastPage();
            $estudiantes = $this->obtenerEstudiantes(
                buscar: $buscar,
                genero: $genero,
                grado: $grado,
                discapacidad: $discapacidad,
                pagina: $pagina
            );
        }

        return response()->json([
            'estudiantes' => $estudiantes,
            'filtros' => [
                'buscar' => $buscar,
                'genero' => $genero,
                'grado' => $grado,
                'discapacidad' => $discapacidad === null ? '' : (string) $discapacidad,
            ],
        ]);
    }

    /**
     * Formulario para registrar un estudiante.
     */
    public function create(): Response
    {
        return Inertia::render('Estudiantes/Create', [
            'colegios' => $this->colegios(),
            'mediosPago' => $this->mediosPago(),
            'usuarios' => $this->usuariosDisponibles(),
            'generos' => $this->generos(),
            'lenguasMaternas' => $this->lenguasMaternas(),
            'fuentesInscripcion' => $this->fuentesInscripcion(),
            'grados' => $this->grados(),
        ]);
    }

    /**
     * Registra el estudiante creando su usuario y asignando su rol transaccionalmente.
     */
    public function store(Request $request): RedirectResponse 
    {
        $datos = $this->validar($request);

        DB::transaction(function () use ($request, $datos) {
            // 1. Crear el usuario en la tabla 'usuarios'
            $usuario = Usuario::create([
                'username' => trim($datos['username']),
                'password_hash' => Hash::make($datos['password']),
                'status' => 'Activo'
            ]);

            // 2. Vincular el Rol Estudiante (ID: 3) en la tabla 'usuario_roles'
            DB::table('usuario_roles')->insert([
                'usuario_id' => $usuario->id,
                'rol_id'     => 3,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            $archivos = $this->guardarArchivos($request);

            // 3. Crear el Postulante/Estudiante vinculando el usuario_id generado
            Postulante::create([
                'codigo_postulante' => $this->nullable($datos['codigo_postulante'] ?? null),
                'nombres' => trim($datos['nombres']),
                'apellidos' => trim($datos['apellidos']),
                'dni' => trim($datos['dni']),
                'email' => $this->nullable($datos['email'] ?? null),
                'telefono' => $this->nullable($datos['telefono'] ?? null),
                'genero' => $this->nullable($datos['genero'] ?? null),
                'fecha_nacimiento' => $datos['fecha_nacimiento'] ?? null,
                'lengua_materna' => $this->nullable($datos['lengua_materna'] ?? null),
                'direccion' => $this->nullable($datos['direccion'] ?? null),
                'usuario_id' => $usuario->id, 
                'id_colegio' => $datos['id_colegio'] ?? null,
                'año_egreso' => $datos['año_egreso'] ?? null,
                'discapacidad' => (bool) ($datos['discapacidad'] ?? false),
                'nombre_discapacidad' => ! empty($datos['discapacidad']) ? $this->nullable($datos['nombre_discapacidad'] ?? null) : null,
                'fecha_registro' => now(),
                'id_medio_pago' => $datos['id_medio_pago'] ?? null,
                'fuente_inscripcion' => $this->nullable($datos['fuente_inscripcion'] ?? null),
                'grado' => $this->nullable($datos['grado'] ?? null) ?? 'Estudiante',
                ...$archivos,
            ]);
        });

        return to_route('estudiantes.index')->with('success', 'Estudiante y credenciales registrados correctamente.');
    }

    /**
     * Formulario de edición.
     */
    public function edit(Postulante $postulante): Response 
    {
        // Carga forzada de la relación 'usuario' completa
        $postulante->load(['usuario', 'colegio', 'medioPago']);

        // Búsqueda directa en BD en caso de que la relación Eloquent falle
        $usernameReal = null;
        if ($postulante->usuario) {
            $usernameReal = $postulante->usuario->username;
        } elseif ($postulante->usuario_id) {
            $u = DB::table('usuarios')->where('id', $postulante->usuario_id)->first();
            $usernameReal = $u?->username;
        }

        return Inertia::render('Estudiantes/Edit', [
            'estudiante' => [
                'id_postulante'       => $postulante->id_postulante,
                'codigo_postulante'   => $postulante->codigo_postulante,
                'nombres'             => $postulante->nombres,
                'apellidos'           => $postulante->apellidos,
                'dni'                 => $postulante->dni,
                'email'               => $postulante->email,
                'telefono'            => $postulante->telefono,
                'genero'              => $postulante->genero,
                'fecha_nacimiento'    => $postulante->fecha_nacimiento?->format('Y-m-d'),
                'lengua_materna'      => $postulante->lengua_materna,
                'direccion'           => $postulante->direccion,
                'usuario_id'          => $postulante->usuario_id,

                // Enviamos el username tanto plano como anidado
                'username'            => $usernameReal ?? 'Sin usuario vinculado',
                'usuario'             => $postulante->usuario ?? ($usernameReal ? ['username' => $usernameReal] : null),

                'id_colegio'          => $postulante->id_colegio,
                'año_egreso'          => $postulante->año_egreso, 
                'discapacidad'        => (bool) $postulante->discapacidad,
                'nombre_discapacidad' => $postulante->nombre_discapacidad,
                'id_medio_pago'       => $postulante->id_medio_pago,
                'fuente_inscripcion'  => $postulante->fuente_inscripcion,
                'grado'               => $postulante->grado,

                // Archivos
                'foto_postulante'      => $this->urlArchivo($postulante->foto_postulante),
                'certificado_estudios' => $this->urlArchivo($postulante->certificado_estudios),
                'partida_nacimiento'   => $this->urlArchivo($postulante->partida_nacimiento),
                'comprobante_pago'     => $this->urlArchivo($postulante->comprobante_pago),
                'copia_dni'            => $this->urlArchivo($postulante->copia_dni),
                'curriculum_archivo'   => $this->urlArchivo($postulante->curriculum_archivo),
            ],
            
            'colegios'           => $this->colegios(),
            'mediosPago'         => $this->mediosPago(),
            'generos'            => $this->generos(),
            'lenguasMaternas'    => $this->lenguasMaternas(),
            'fuentesInscripcion' => $this->fuentesInscripcion(),
            'grados'             => $this->grados(),
        ]);
    }

    /**
     * Actualiza el estudiante.
     */
    public function update(Request $request, Postulante $postulante): RedirectResponse 
    {
        $datos = $this->validar(request: $request, postulante: $postulante);

        DB::transaction(function () use ($request, $datos, $postulante) {
            $archivos = $this->guardarArchivos(request: $request, postulante: $postulante);

            // Si se ingresó una nueva contraseña, actualizarla en la tabla usuarios
            if (!empty($datos['password']) && $postulante->usuario_id) {
                Usuario::where('id', $postulante->usuario_id)->update([
                    'password_hash' => Hash::make($datos['password']),
                ]);
            }

            $postulante->update([
                'codigo_postulante' => $this->nullable($datos['codigo_postulante'] ?? null),
                'nombres' => trim($datos['nombres']),
                'apellidos' => trim($datos['apellidos']),
                'dni' => trim($datos['dni']),
                'email' => $this->nullable($datos['email'] ?? null),
                'telefono' => $this->nullable($datos['telefono'] ?? null),
                'genero' => $this->nullable($datos['genero'] ?? null),
                'fecha_nacimiento' => $datos['fecha_nacimiento'] ?? null,
                'lengua_materna' => $this->nullable($datos['lengua_materna'] ?? null),
                'direccion' => $this->nullable($datos['direccion'] ?? null),
                'usuario_id' => $datos['usuario_id'] ?? $postulante->usuario_id,
                'id_colegio' => $datos['id_colegio'] ?? null,
                'año_egreso' => $datos['año_egreso'] ?? null,
                'discapacidad' => (bool) ($datos['discapacidad'] ?? false),
                'nombre_discapacidad' => ! empty($datos['discapacidad']) ? $this->nullable($datos['nombre_discapacidad'] ?? null) : null,
                'id_medio_pago' => $datos['id_medio_pago'] ?? null,
                'fuente_inscripcion' => $this->nullable($datos['fuente_inscripcion'] ?? null),
                'grado' => $this->nullable($datos['grado'] ?? null) ?? 'Postulante',
                ...$archivos,
            ]);
        });

        return to_route('estudiantes.index')->with('success', 'Estudiante actualizado correctamente.');
    }

    /**
     * Elimina el estudiante cuando no tiene movimientos.
     */
    public function destroy(Postulante $postulante): RedirectResponse 
    {
        if ($postulante->inscripciones()->exists()) {
            return back()->with('error', 'No se puede eliminar el estudiante porque tiene inscripciones registradas.');
        }
        if ($postulante->matriculas()->exists()) {
            return back()->with('error', 'No se puede eliminar el estudiante porque tiene matrículas registradas.');
        }
        if ($postulante->pagosPostulantes()->exists()) {
            return back()->with('error', 'No se puede eliminar el estudiante porque tiene pagos registrados.');
        }

        DB::transaction(function () use ($postulante) {
            $this->eliminarArchivos($postulante);
            $postulante->delete();
        });

        return back()->with('success', 'Estudiante eliminado correctamente.');
    }

    /**
     * Consulta reutilizable para el listado.
     */
    private function obtenerEstudiantes(
        string $buscar = '',
        string $genero = '',
        string $grado = '',
        ?int $discapacidad = null,
        int $pagina = 1
    ) {
        return Postulante::query()
            ->with(['usuario', 'colegio', 'medioPago'])
            ->withCount(['inscripciones', 'matriculas'])
            ->buscar($buscar)
            ->when($genero !== '', fn (Builder $query) => $query->where('genero', $genero))
            ->when($grado !== '', fn (Builder $query) => $query->where('grado', $grado))
            ->when($discapacidad !== null, fn (Builder $query) => $query->where('discapacidad', $discapacidad))
            ->orderBy('apellidos')
            ->orderBy('nombres')
            ->paginate(
                perPage: 10,
                pageName: 'page',
                page: $pagina
            );
    }

    /**
     * Validaciones para registrar y actualizar.
     */
    private function validar(Request $request, ?Postulante $postulante = null): array 
    {
        return $request->validate(
            [
                'codigo_postulante' => [
                    'nullable', 'string', 'max:255',
                    Rule::unique('postulantes', 'codigo_postulante')->ignore($postulante?->id_postulante, 'id_postulante'),
                ],
                'nombres' => ['required', 'string', 'max:100'],
                'apellidos' => ['required', 'string', 'max:100'],
                'dni' => [
                    'required', 'digits:8',
                    Rule::unique('postulantes', 'dni')->ignore($postulante?->id_postulante, 'id_postulante'),
                ],
                'email' => ['nullable', 'email', 'max:100'],
                'telefono' => ['nullable', 'string', 'max:15'],
                'genero' => ['nullable', 'string', 'max:20'],
                'fecha_nacimiento' => ['nullable', 'date', 'before:today'],
                'lengua_materna' => ['nullable', 'string', 'max:50'],
                'direccion' => ['nullable', 'string', 'max:100'],
                'username' => [
                    Rule::requiredIf(fn () => !$postulante), 'nullable', 'string', 'max:50',
                    Rule::unique('usuarios', 'username')->ignore($postulante?->usuario_id),
                ],
                'password' => [Rule::requiredIf(fn () => !$postulante), 'nullable', 'string', 'min:8', 'confirmed'],
                'id_colegio' => ['nullable', 'integer', 'exists:colegios,id_colegio'],
                'año_egreso' => ['nullable', 'integer', 'digits:4', 'min:1950', 'max:' . now()->year],
                'discapacidad' => ['required', 'boolean'],
                'nombre_discapacidad' => [Rule::requiredIf(fn () => $request->boolean('discapacidad')), 'nullable', 'string', 'max:100'],
                'id_medio_pago' => ['nullable', 'integer', 'exists:tipo_pago,id_tipo_pago'],
                'fuente_inscripcion' => ['nullable', 'string', 'max:60'],
                'grado' => ['required', 'string', Rule::in($this->grados())],
                'foto_postulante' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:3072'],
                'certificado_estudios' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
                'partida_nacimiento' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
                'comprobante_pago' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
                'copia_dni' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
                'curriculum_archivo' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
            ],
            [
                'nombres.required' => 'Debe ingresar los nombres.',
                'nombres.max' => 'Los nombres no pueden superar los 100 caracteres.',
                'apellidos.required' => 'Debe ingresar los apellidos.',
                'apellidos.max' => 'Los apellidos no pueden superar los 100 caracteres.',
                'dni.required' => 'Debe ingresar el DNI.',
                'dni.digits' => 'El DNI debe contener exactamente 8 dígitos.',
                'dni.unique' => 'Ya existe un estudiante registrado con ese DNI.',
                'username.required' => 'Debe definir un nombre de usuario.',
                'username.unique' => 'El nombre de usuario ya se encuentra registrado.',
                'password.required' => 'Debe ingresar una contraseña de acceso.',
                'password.min' => 'La contraseña de acceso debe tener mínimo 8 caracteres.',
                'password.confirmed' => 'Las contraseñas ingresadas no coinciden.',
                'codigo_postulante.unique' => 'El código ya está registrado.',
                'email.email' => 'El correo electrónico no tiene un formato válido.',
                'fecha_nacimiento.before' => 'La fecha de nacimiento debe ser anterior a hoy.',
                'id_colegio.exists' => 'El colegio seleccionado no existe.',
                'año_egreso.digits' => 'El año de egreso debe contener cuatro dígitos.',
                'año_egreso.max' => 'El año de egreso no puede ser posterior al año actual.',
                'nombre_discapacidad.required' => 'Debe indicar el tipo de discapacidad.',
                'id_medio_pago.exists' => 'El medio de pago seleccionado no existe.',
                'grado.required' => 'Debe seleccionar la condición del estudiante.',
                'grado.in' => 'La condición seleccionada no es válida.',
                'foto_postulante.mimes' => 'La fotografía debe ser JPG, PNG o WEBP.',
                'foto_postulante.max' => 'La fotografía no puede superar los 3 MB.',
                'certificado_estudios.mimes' => 'El certificado debe ser PDF, JPG o PNG.',
                'partida_nacimiento.mimes' => 'La partida debe ser PDF, JPG o PNG.',
                'comprobante_pago.mimes' => 'El comprobante debe ser PDF, JPG o PNG.',
                'copia_dni.mimes' => 'La copia del DNI debe ser PDF, JPG o PNG.',
                'curriculum_archivo.mimes' => 'El currículum debe ser PDF, DOC o DOCX.',
            ]
        );
    }

    /**
     * Guarda o reemplaza los archivos.
     */
    private function guardarArchivos(Request $request, ?Postulante $postulante = null): array 
    {
        $campos = [
            'foto_postulante' => 'estudiantes/fotos',
            'certificado_estudios' => 'estudiantes/documentos/certificados',
            'partida_nacimiento' => 'estudiantes/documentos/partidas',
            'comprobante_pago' => 'estudiantes/documentos/comprobantes',
            'copia_dni' => 'estudiantes/documentos/dni',
            'curriculum_archivo' => 'estudiantes/documentos/curriculum',
        ];

        $archivos = [];

        foreach ($campos as $campo => $carpeta) {
            if (! $request->hasFile($campo)) {
                if ($postulante) {
                    $archivos[$campo] = $postulante->{$campo};
                }
                continue;
            }

            $archivoAnterior = $postulante?->{$campo};

            if (filled($archivoAnterior) && Storage::disk('public')->exists($archivoAnterior)) {
                Storage::disk('public')->delete($archivoAnterior);
            }

            $archivos[$campo] = $request->file($campo)->store($carpeta, 'public');
        }

        return $archivos;
    }

    /**
     * Elimina los archivos asociados a un postulante.
     */
    private function eliminarArchivos(Postulante $postulante): void
    {
        $campos = [
            'foto_postulante', 'certificado_estudios', 'partida_nacimiento',
            'comprobante_pago', 'copia_dni', 'curriculum_archivo'
        ];

        foreach ($campos as $campo) {
            $ruta = $postulante->{$campo};
            if (filled($ruta) && Storage::disk('public')->exists($ruta)) {
                Storage::disk('public')->delete($ruta);
            }
        }
    }

    /**
     * Colegios disponibles.
     */
    private function colegios()
    {
        return Colegio::query()->orderBy('nombre')->get();
    }

    /**
     * Medios de pago disponibles.
     */
    private function mediosPago()
    {
        return TipoPago::query()->orderBy('nombre')->get();
    }

    /**
     * Usuarios que todavía no están vinculados.
     */
    private function usuariosDisponibles()
    {
        $usuariosOcupados = Postulante::whereNotNull('usuario_id')
            ->pluck('usuario_id')
            ->toArray();

        return Usuario::select('id', 'username')
            ->whereNotIn('id', $usuariosOcupados)
            ->get();
    }

    /**
     * Retorna la URL pública del archivo.
     */
    private function urlArchivo(?string $archivo): ?string
    {
        if (blank($archivo)) {
            return null;
        }

        if (! Storage::disk('public')->exists($archivo)) {
            return null;
        }

        return Storage::disk('public')->url($archivo);
    }

    private function generos(): array { return ['Masculino', 'Femenino', 'Otro', 'Prefiero no indicar']; }
    private function lenguasMaternas(): array { return ['Español', 'Quechua', 'Aymara', 'Asháninka', 'Otra lengua originaria', 'Lengua extranjera']; }
    private function fuentesInscripcion(): array { return ['Presencial', 'Página web', 'Redes sociales', 'Campaña institucional', 'Referencia', 'Otro']; }
    private function grados(): array { return ['Postulante', 'Ingresante', 'Estudiante', 'Egresado']; }

    private function nullable(mixed $valor): mixed 
    {
        if (is_string($valor) && trim($valor) === '') {
            return null;
        }
        return is_string($valor) ? trim($valor) : $valor;
    }
}