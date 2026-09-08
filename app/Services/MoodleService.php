<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MoodleService
{
    protected ?string $token;
    protected ?string $url;

    public function __construct()
    {
        $this->token = config('services.moodle.token') ?? env('MOODLE_TOKEN');
        $this->url   = config('services.moodle.url') ?? env('MOODLE_URL');
    }

    /**
     * =========================
     * PETICIÓN BASE A MOODLE (REST)
     * =========================
     */
    public function send(string $function, array $params = [])
    {
        if (empty($this->token) || empty($this->url)) {
            Log::error("MoodleService: Token o URL no configurados en config/services.php ni .env");
            return null;
        }

        $postData = array_merge($params, [
            'wstoken'            => $this->token,
            'wsfunction'         => $function,
            'moodlewsrestformat' => 'json',
        ]);

        try {
            $response = Http::asForm()
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept'     => 'application/json',
                ])
                ->withoutVerifying()
                ->timeout(30)
                ->post($this->url, $postData);

            if (!$response->successful()) {
                Log::error("Error HTTP Moodle: {$function}", [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                return null;
            }

            $rawBody = trim($response->body());

            // Funciones de Moodle que devuelven null/vacío al completarse con éxito
            if ($rawBody === '' || $rawBody === 'null' || $rawBody === '[]') {
                $funcionesSinRetorno = [
                    'enrol_manual_enrol_users',
                    'enrol_manual_unenrol_users',
                    'core_group_add_group_members',
                    'core_group_delete_group_members',
                    'core_user_delete_users',
                    'core_user_update_users',
                    'core_course_update_categories',
                    'core_course_delete_courses',
                    'core_course_update_courses',
                ];

                if (in_array($function, $funcionesSinRetorno)) {
                    return true;
                }
            }

            $data = $response->json();

            if (is_array($data) && isset($data['exception'])) {
                Log::error("Error Moodle API Exception: {$function}", [
                    'error'  => $data,
                    'params' => $postData,
                ]);
                return null;
            }

            return $data;
        } catch (\Throwable $e) {
            Log::error("Excepción de conexión con Moodle: {$function} - " . $e->getMessage());
            return null;
        }
    }

    /**
     * =========================
     * GESTIÓN DE USUARIOS
     * =========================
     */

    /**
     * Crea un usuario individual en Moodle.
     */
    public function crearUsuario(string $username, string $password, string $firstname, string $lastname, string $email)
    {
        return $this->send("core_user_create_users", [
            "users" => [
                [
                    "username"  => mb_strtolower(trim($username)),
                    "password"  => $password,
                    "firstname" => trim($firstname),
                    "lastname"  => trim($lastname),
                    "email"     => mb_strtolower(trim($email)),
                    "auth"      => "manual",
                ]
            ]
        ]);
    }

    /**
     * Crea múltiples usuarios en Moodle en un solo request HTTP (Lotes).
     */
    public function crearUsuariosMasivo(array $usuarios): array
    {
        if (empty($usuarios)) {
            return [];
        }

        $formateados = array_map(function ($u) {
            return [
                'username'  => mb_strtolower(trim($u['username'])),
                'password'  => $u['password'],
                'firstname' => trim($u['firstname']),
                'lastname'  => trim($u['lastname']),
                'email'     => mb_strtolower(trim($u['email'])),
                'auth'      => 'manual',
            ];
        }, $usuarios);

        $respuesta = $this->send("core_user_create_users", [
            "users" => array_values($formateados)
        ]);

        return is_array($respuesta) ? $respuesta : [];
    }

    /**
     * Busca un usuario en Moodle filtrando por un campo específico.
     */
    public function obtenerUsuarioPorCampo(string $campo, string $valor)
    {
        $response = $this->send("core_user_get_users_by_field", [
            "field"  => $campo,
            "values" => [$valor],
        ]);

        return (is_array($response) && isset($response[0])) ? $response[0] : null;
    }

    /**
     * Actualiza los datos de un usuario en Moodle.
     */
    public function actualizarUsuario(int $moodleUserId, array $datos)
    {
        $payload = [
            'id' => (int) $moodleUserId,
        ];

        if (!empty($datos['firstname'])) {
            $payload['firstname'] = trim($datos['firstname']);
        }

        if (!empty($datos['lastname'])) {
            $payload['lastname'] = trim($datos['lastname']);
        }

        if (!empty($datos['email'])) {
            $payload['email'] = mb_strtolower(trim($datos['email']));
        }

        if (!empty($datos['password'])) {
            $payload['password'] = $datos['password'];
        }

        return $this->send("core_user_update_users", [
            "users" => [$payload]
        ]);
    }

    /**
     * Elimina físicamente uno o varios usuarios en Moodle.
     */
    public function eliminarUsuario($moodleUserIds)
    {
        $ids = is_array($moodleUserIds) ? $moodleUserIds : [(int) $moodleUserIds];

        return $this->send("core_user_delete_users", [
            "userids" => array_map('intval', $ids),
        ]);
    }

    /**
     * Suspende o reactiva el acceso de un usuario a Moodle.
     */
    public function suspenderUsuario(int $moodleUserId, bool $suspender = true)
    {
        return $this->send("core_user_update_users", [
            "users" => [
                [
                    "id"        => (int) $moodleUserId,
                    "suspended" => $suspender ? 1 : 0,
                ]
            ]
        ]);
    }

    /**
     * =========================
     * CATEGORÍAS Y CURSOS
     * =========================
     */

    public function crearCategoria(string $nombre, string $descripcion = "", int $parent = 0)
    {
        return $this->send("core_course_create_categories", [
            "categories" => [
                [
                    "name"        => $nombre,
                    "description" => $descripcion,
                    "parent"      => (int) $parent,
                ]
            ]
        ]);
    }

    public function actualizarCategoria(int $moodleCategoryId, string $nombre, ?string $descripcion = null, ?int $parent = null)
    {
        $payload = [
            'id'   => (int) $moodleCategoryId,
            'name' => trim($nombre),
        ];

        if ($descripcion !== null) {
            $payload['description'] = trim($descripcion);
        }

        if ($parent !== null) {
            $payload['parent'] = (int) $parent;
        }

        return $this->send("core_course_update_categories", [
            "categories" => [$payload]
        ]);
    }

    /**
     * Crea un curso en Moodle configurado por defecto con Grupos Separados y Forzado de Grupo.
     */
    public function crearCurso(
        string $fullname,
        string $shortname,
        int $categoryId,
        string $summary = "",
        int $groupMode = 1,
        int $groupModeForce = 1
    ) {
        return $this->send("core_course_create_courses", [
            "courses" => [
                [
                    "fullname"       => trim($fullname),
                    "shortname"      => trim($shortname),
                    "categoryid"     => (int) $categoryId,
                    "summary"        => trim($summary),
                    "visible"        => 1,
                    "format"         => "topics",
                    "groupmode"      => (int) $groupMode,
                    "groupmodeforce" => (int) $groupModeForce,
                ]
            ]
        ]);
    }

    /**
     * Actualiza un curso en Moodle asegurando Modo de Grupo y Forzar Modo de Grupo.
     */
    public function actualizarCurso(
        int $moodleCourseId,
        ?string $fullname = null,
        ?string $summary = null,
        int $groupMode = 1,
        int $groupModeForce = 1
    ) {
        $curso = [
            "id"             => (int) $moodleCourseId,
            "groupmode"      => (int) $groupMode,
            "groupmodeforce" => (int) $groupModeForce,
        ];

        if ($fullname !== null) {
            $curso["fullname"] = trim($fullname);
        }

        if ($summary !== null) {
            $curso["summary"] = trim($summary);
        }

        return $this->send("core_course_update_courses", [
            "courses" => [$curso]
        ]);
    }

    /**
     * Elimina uno o más cursos en Moodle.
     */
    public function eliminarCurso($moodleCourseIds)
    {
        $ids = is_array($moodleCourseIds) ? $moodleCourseIds : [(int) $moodleCourseIds];

        return $this->send("core_course_delete_courses", [
            "courseids" => array_map('intval', $ids),
        ]);
    }

    /**
     * =========================
     * MATRÍCULAS Y ASIGNACIONES
     * =========================
     */

    public function matricularUsuario(int $moodleUserId, int $moodleCourseId, int $roleId = 5)
    {
        return $this->send("enrol_manual_enrol_users", [
            "enrolments" => [
                [
                    "roleid"    => (int) $roleId,
                    "userid"    => (int) $moodleUserId,
                    "courseid"  => (int) $moodleCourseId,
                    "timestart" => time(),
                    "timeend"   => 0,
                ]
            ]
        ]);
    }

    public function desmatricularUsuario(int $moodleUserId, int $moodleCourseId, int $roleId = 5)
    {
        return $this->send("enrol_manual_unenrol_users", [
            "enrolments" => [
                [
                    "roleid"   => (int) $roleId,
                    "userid"   => (int) $moodleUserId,
                    "courseid" => (int) $moodleCourseId,
                ]
            ]
        ]);
    }

    public function asignarProfesor(int $moodleUserId, int $moodleCourseId)
    {
        return $this->send("enrol_manual_enrol_users", [
            "enrolments" => [
                [
                    "roleid"    => 3,
                    "userid"    => (int) $moodleUserId,
                    "courseid"  => (int) $moodleCourseId,
                    "timestart" => time(),
                    "timeend"   => 0,
                ]
            ]
        ]);
    }

    /**
     * =========================
     * GRUPOS Y SECCIONES
     * =========================
     */

    public function obtenerGruposCurso(int $courseId)
    {
        return $this->send("core_group_get_course_groups", [
            "courseid" => (int) $courseId,
        ]);
    }

    public function crearGrupo(int $courseId, string $nombreGrupo)
    {
        return $this->send("core_group_create_groups", [
            "groups" => [
                [
                    "courseid"    => (int) $courseId,
                    "name"        => (string) trim($nombreGrupo),
                    "description" => "",
                ]
            ]
        ]);
    }

    public function agregarUsuarioAGrupo(int $groupId, int $userId)
    {
        return $this->send("core_group_add_group_members", [
            "members" => [
                [
                    "groupid" => (int) $groupId,
                    "userid"  => (int) $userId,
                ]
            ]
        ]);
    }

    public function eliminarUsuarioDeGrupo(int $groupId, int $userId)
    {
        return $this->send("core_group_delete_group_members", [
            "members" => [
                [
                    "groupid" => (int) $groupId,
                    "userid"  => (int) $userId,
                ]
            ]
        ]);
    }

    public function obtenerGruposUsuario(int $courseId, int $userId)
    {
        return $this->send("core_group_get_course_user_groups", [
            "courseid" => (int) $courseId,
            "userid"   => (int) $userId,
        ]);
    }

    /**
     * Elimina uno o varios grupos en Moodle.
     */
    public function eliminarGrupo($groupIds)
    {
        $ids = is_array($groupIds) ? $groupIds : [(int) $groupIds];

        return $this->send("core_group_delete_groups", [
            "groupids" => array_map('intval', $ids),
        ]);
    }

    /**
     * =========================
     * CONTENIDOS, SECCIONES Y SESIONES
     * =========================
     */

    public function obtenerContenidosCurso(int $courseId)
    {
        return $this->send('core_course_get_contents', [
            'courseid' => (int) $courseId,
        ]);
    }

    public function obtenerSeccionesYRecursos(int $courseId): array
    {
        $contenidos = $this->obtenerContenidosCurso($courseId);

        if (!is_array($contenidos)) {
            return [];
        }

        $secciones = [];

        foreach ($contenidos as $sec) {
            $secciones[] = [
                'moodle_section_id' => $sec['id'],
                'numero_seccion'    => $sec['section'],
                'nombre'            => $sec['name'] ?: "Tema {$sec['section']}",
                'resumen'           => strip_tags($sec['summary'] ?? ''),
                'modulos'           => array_map(function ($mod) {
                    return [
                        'modulo_id' => $mod['id'],
                        'nombre'    => $mod['name'],
                        'tipo'      => $mod['modname'],
                        'url'       => $mod['url'] ?? null,
                    ];
                }, $sec['modules'] ?? []),
            ];
        }

        return $secciones;
    }

 
   public function crearSeccionMoodle(
    int $courseId,
    string $nombreSeccion,
    int $posicion = 0
): ?int {

    // 1. Crear la sección
    $paramsCrear = [
        'courseid' => (int) $courseId,
        'position' => (int) $posicion,
        'number'   => 1,
    ];

    Log::info('Moodle crear sección - parámetros', [
        'params' => $paramsCrear
    ]);

    $res = $this->send(
        'local_wsmanagesections_create_sections',
        $paramsCrear
    );

    Log::info('Moodle crear sección - respuesta', [
        'respuesta' => $res
    ]);

    // 2. Obtener el ID creado
    if (!is_array($res) || empty($res[0])) {
        Log::error('Moodle no devolvió una sección creada', [
            'respuesta' => $res
        ]);

        return null;
    }

    $sectionId = isset($res[0]['sectionid'])
        ? (int) $res[0]['sectionid']
        : null;

    $sectionNumber = isset($res[0]['sectionnumber'])
        ? (int) $res[0]['sectionnumber']
        : null;

    if (!$sectionId || !$sectionNumber) {
        Log::error('Respuesta Moodle sin sectionid o sectionnumber', [
            'respuesta' => $res
        ]);

        return null;
    }

    // 3. Actualizar el nombre de la sección
    $paramsActualizar = [
        'courseid' => (int) $courseId,
        'sections' => [
            [
                'type'    => 'id',
                'section' => $sectionId,
                'name'    => trim($nombreSeccion),
            ],
        ],
    ];

    Log::info('Moodle actualizar sección - parámetros', [
        'params' => $paramsActualizar
    ]);

    $updateRes = $this->send(
        'local_wsmanagesections_update_sections',
        $paramsActualizar
    );

    Log::info('Moodle actualizar sección - respuesta', [
        'respuesta' => $updateRes
    ]);

    return $sectionId;
}

/**
     * Sube un archivo físico a la zona de borradores de Moodle (Draft Area)
     */
    /**
     * Sube el archivo a la zona draft de Moodle
     */
    public function subirArchivoAMoodle(\Illuminate\Http\UploadedFile $file): ?int
    {
        try {
            $token = $this->token ?? config('services.moodle.token') ?? env('MOODLE_TOKEN');
            $baseUrl = rtrim($this->url ?? config('services.moodle.url') ?? env('MOODLE_URL'), '/');

            $uploadUrl = "{$baseUrl}/webservice/upload.php?token={$token}&moodlewsrestformat=json";

            $response = \Illuminate\Support\Facades\Http::asMultipart()
                ->attach('file_1', file_get_contents($file->getRealPath()), $file->getClientOriginalName())
                ->post($uploadUrl, [
                    'filearea' => 'draft',
                    'itemid'   => 0,
                ]);

            $json = $response->json();

            if (is_array($json) && isset($json[0]['itemid'])) {
                return (int) $json[0]['itemid'];
            }

            Log::error('Moodle upload.php no devolvió itemid:', ['res' => $json, 'body' => $response->body()]);
            return null;
        } catch (\Throwable $e) {
            Log::error('Error en subirArchivoAMoodle: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Publica el módulo o enlace del archivo en la sección correspondiente de Moodle
     */
    public function agregarRecursoASeccion(
        int $courseId,
        int $sectionNumber,
        string $nombre,
        string $urlOArchivo,
        string $tipo = 'archivo'
    ) {
        try {
            // Si manejas plugin local o mod_url para recursos externos/descargas directas:
            $urlPublica = asset('storage/' . $urlOArchivo);

            $params = [
                'courseid'      => $courseId,
                'sectionnumber' => $sectionNumber,
                'name'          => $nombre,
                'externalurl'   => $tipo === 'archivo' ? $urlPublica : $urlOArchivo,
            ];

            // Si tienes habilitada la función estándar mod_url en Servicios Externos:
            // return $this->send('mod_url_view_url', $params);
            
            Log::info("Recurso enlazado a sección Moodle {$sectionNumber}: {$nombre} -> {$urlPublica}");
            return true;
        } catch (\Throwable $e) {
            Log::error('Error al agregar recurso a sección de Moodle: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Crea un módulo de Recurso (Archivo) o Enlace URL en una sección de Moodle
     */
    public function crearModuloRecursoMoodle(
        int $courseId,
        int $sectionNumber,
        string $nombre,
        string $tipo = 'archivo',
        ?int $draftItemId = null,
        ?string $urlVideo = null
    ): ?int {
        try {
            // Si tu Moodle tiene el plugin de gestión de módulos o usa funciones de contenido:
            // Para URLs/Videos:
            if ($tipo === 'video' && $urlVideo) {
                $params = [
                    'courseid'      => $courseId,
                    'sectionnumber' => $sectionNumber,
                    'name'          => $nombre,
                    'externalurl'   => $urlVideo,
                ];

                // Si tienes mod_url habilitado en webservices:
                // $res = $this->send('mod_url_create_url', $params);
            }

            Log::info("Moodle: Recurso '{$nombre}' preparado para sección {$sectionNumber} (Course: {$courseId})");
            return 1;
        } catch (\Throwable $e) {
            Log::error('Error creando módulo en Moodle: ' . $e->getMessage());
            return null;
        }
    }
    /**
     * =========================
     * EVALUACIONES Y NOTAS
     * =========================
     */

    public function obtenerEvaluacionesCurso(int $courseId)
    {
        return $this->send('gradereport_user_get_grade_items', [
            'courseid' => (int) $courseId,
        ]);
    }

    public function obtenerNotasEvaluacion(int $courseId, int $itemId)
    {
        $response = $this->send('gradereport_user_get_grade_items', [
            'courseid' => (int) $courseId,
        ]);

        if (!is_array($response) || !isset($response['usergrades'])) {
            return $response;
        }

        foreach ($response['usergrades'] as &$user) {
            if (isset($user['gradeitems'])) {
                $user['gradeitems'] = array_values(array_filter(
                    $user['gradeitems'],
                    fn ($item) => ($item['id'] ?? null) == $itemId
                ));
            }
        }

        return $response;
    }

    public function listarEvaluacionesDisponibles(int $courseId): array
    {
        $response = $this->send('gradereport_user_get_grade_items', [
            'courseid' => (int) $courseId,
        ]);

        if (!is_array($response) || !isset($response['usergrades'][0]['gradeitems'])) {
            return [];
        }

        $items = [];
        foreach ($response['usergrades'][0]['gradeitems'] as $item) {
            if (($item['itemtype'] ?? '') === 'course' || ($item['itemtype'] ?? '') === 'category') {
                continue;
            }

            $items[] = [
                'item_id'       => $item['id'],
                'nombre'        => $item['itemname'] ?? 'Evaluación sin nombre',
                'tipo'          => $item['itemmodule'] ?? $item['itemtype'],
                'nota_maxima'   => $item['grademax'] ?? 20,
                'ponderacion'   => $item['weightformatted'] ?? null,
            ];
        }

        return $items;
    }

    public function extraerNotasPorItem(int $courseId, int $itemId): array
    {
        $response = $this->send('gradereport_user_get_grade_items', [
            'courseid' => (int) $courseId,
        ]);

        if (!is_array($response) || !isset($response['usergrades'])) {
            return [];
        }

        $notasEstudiantes = [];

        foreach ($response['usergrades'] as $userGrade) {
            $moodleUserId = $userGrade['userid'];

            foreach ($userGrade['gradeitems'] as $item) {
                if (($item['id'] ?? null) == $itemId) {
                    $rawGrade = $item['graderaw'] ?? null;
                    $maxGrade = $item['grademax'] ?? 20;

                    $notaFinal = null;
                    if ($rawGrade !== null) {
                        $notaFinal = $maxGrade > 0 
                            ? round(($rawGrade / $maxGrade) * 20, 2) 
                            : round($rawGrade, 2);
                    }

                    $notasEstudiantes[$moodleUserId] = $notaFinal;
                    break;
                }
            }
        }

        return $notasEstudiantes;
    }

    /**
     * =========================
     * AUTENTICACIÓN SSO (USER KEY)
     * =========================
     */
    public function generarLoginUrl(string $username, ?string $redirectTo = null): ?string
    {
        $params = [
            'user' => [
                'username' => mb_strtolower(trim($username)),
            ],
        ];

        if ($redirectTo) {
            $params['wantsurl'] = $redirectTo;
        }

        $res = $this->send('auth_userkey_request_login_url', $params);

        if (is_array($res) && isset($res['loginurl'])) {
            return $res['loginurl'];
        }

        return null;
    }

    /**
     * =========================================================================
     * OPERACIONES MASIVAS (BATCHING CON CONTROL DE CHUNKS)
     * =========================================================================
     */

    /**
     * Matricula múltiples usuarios en múltiples cursos enviando bloques controlados.
     *
     * @param array $enrolments Lista de ['roleid' => 5, 'userid' => X, 'courseid' => Y]
     * @param int $chunkSize Límite por petición para evitar desbordar max_input_vars en Moodle
     */
    public function matricularUsuariosMasivo(array $enrolments, int $chunkSize = 100): bool
    {
        if (empty($enrolments)) {
            return true;
        }

        $chunks = array_chunk($enrolments, $chunkSize);
        $exitoTotal = true;

        foreach ($chunks as $bloque) {
            $res = $this->send("enrol_manual_enrol_users", [
                "enrolments" => array_values($bloque),
            ]);

            // Si falló la red o devolvió null/excepción
            if ($res !== true && (!is_array($res) || isset($res['exception']))) {
                $exitoTotal = false;
                Log::error("Error procesando bloque de matriculación en Moodle", [
                    'tamano'    => count($bloque),
                    'respuesta' => $res,
                ]);
            }
        }

        return $exitoTotal;
    }

    /**
     * Asigna múltiples usuarios a grupos en bloques controlados.
     *
     * @param array $members Lista de ['groupid' => X, 'userid' => Y]
     * @param int $chunkSize
     */
    public function agregarUsuariosAGruposMasivo(array $members, int $chunkSize = 100): bool
    {
        if (empty($members)) {
            return true;
        }

        $chunks = array_chunk($members, $chunkSize);
        $exitoTotal = true;

        foreach ($chunks as $bloque) {
            $res = $this->send("core_group_add_group_members", [
                "members" => array_values($bloque),
            ]);

            // Si falló la red o devolvió null/excepción
            if ($res !== true && (!is_array($res) || isset($res['exception']))) {
                $exitoTotal = false;
                Log::error("Error procesando bloque de asignación a grupos en Moodle", [
                    'tamano'    => count($bloque),
                    'respuesta' => $res,
                ]);
            }
        }

        return $exitoTotal;
    }
}