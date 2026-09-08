<?php

namespace App\Imports;

use App\Models\Postulante;
use App\Models\Rol;
use App\Models\Usuario;
use App\Services\MoodleService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class EstudiantesImport implements ToCollection, WithHeadingRow
{
    public int $procesados = 0;
    public int $omitidos = 0;
    public array $errores = [];

    protected MoodleService $moodleService;
    protected array $usuariosParaMoodle = [];
    protected array $usuariosCreados = [];

    public function __construct(MoodleService $moodleService)
    {
        $this->moodleService = $moodleService;
    }

    public function collection(Collection $filas)
    {
        $rolEstudiante = Rol::where('nombre', 'Estudiante')->first();
        $rolId = $rolEstudiante ? $rolEstudiante->id : 3;

        foreach ($filas as $index => $fila) {
            $numFila = $index + 2;

            $dni    = trim((string)($fila['dni'] ?? ''));
            $nombre = trim((string)($fila['nombres'] ?? $fila['nombre'] ?? ''));
            $apell  = trim((string)($fila['apellidos'] ?? $fila['apellido'] ?? ''));
            $email  = trim((string)($fila['email'] ?? $fila['correo'] ?? ''));

            if (empty($dni) || empty($nombre) || empty($apell)) {
                $this->omitidos++;
                $this->errores[] = "Fila {$numFila}: Datos incompletos (DNI, nombres y apellidos son obligatorios).";
                continue;
            }

            if (strlen($dni) !== 8) {
                $this->omitidos++;
                $this->errores[] = "Fila {$numFila}: El DNI '{$dni}' no es válido (debe tener 8 dígitos).";
                continue;
            }

            // Validar existencia previa en usuarios o postulantes
            if (Postulante::where('dni', $dni)->exists() || Usuario::where('username', $dni)->exists()) {
                $this->omitidos++;
                $this->errores[] = "Fila {$numFila}: El estudiante con DNI {$dni} ya se encuentra registrado.";
                continue;
            }

            $emailFinal     = !empty($email) ? mb_strtolower($email) : "{$dni}@instituto.edu.pe";
            $passwordMoodle = "{$dni}@Est2026";

            try {
                DB::transaction(function () use ($dni, $nombre, $apell, $emailFinal, $passwordMoodle, $fila, $rolId) {
                    // 1. Crear el usuario de acceso
                    $usuario = Usuario::create([
                        'username'      => $dni,
                        'password_hash' => Hash::make($passwordMoodle),
                        'status'        => 'Activo',
                    ]);

                    // 2. Asignar el rol Estudiante
                    $usuario->roles()->syncWithoutDetaching([$rolId]);

                    // 3. Crear el perfil de Postulante / Estudiante
                    Postulante::create([
                        'usuario_id'         => $usuario->id,
                        'dni'                => $dni,
                        'nombres'            => mb_strtoupper($nombre),
                        'apellidos'          => mb_strtoupper($apell),
                        'email'              => $emailFinal,
                        'telefono'           => trim((string)($fila['telefono'] ?? $fila['celular'] ?? '')) ?: null,
                        'direccion'          => trim((string)($fila['direccion'] ?? '')) ?: null,
                        'año_egreso'         => trim((string)($fila['año_egreso'] ?? $fila['anio_egreso'] ?? '')) ?: null,
                        'grado'              => 'Estudiante',
                        'discapacidad'       => false,
                        'fecha_registro'     => now(),
                    ]);

                    // Acumular para Moodle
                    $this->usuariosParaMoodle[] = [
                        'username'  => $dni,
                        'password'  => $passwordMoodle,
                        'firstname' => $nombre,
                        'lastname'  => $apell,
                        'email'     => $emailFinal,
                    ];

                    $this->usuariosCreados[$dni] = $usuario;
                    $this->procesados++;
                });
            } catch (\Throwable $e) {
                $this->omitidos++;
                $this->errores[] = "Fila {$numFila}: Error en base de datos - {$e->getMessage()}";
            }
        }

        // Sincronización en bloque con Moodle
        $this->sincronizarConMoodle();
    }

    protected function sincronizarConMoodle(): void
    {
        if (empty($this->usuariosParaMoodle)) {
            return;
        }

        try {
            $lotes = array_chunk($this->usuariosParaMoodle, 50);

            foreach ($lotes as $lote) {
                $resultadoMoodle = $this->moodleService->crearUsuariosMasivo($lote);

                if (is_array($resultadoMoodle)) {
                    foreach ($resultadoMoodle as $mUser) {
                        $username = $mUser['username'] ?? null;
                        $moodleId = $mUser['id'] ?? null;

                        if ($username && $moodleId && isset($this->usuariosCreados[$username])) {
                            $this->usuariosCreados[$username]->update([
                                'moodle_user_id' => (int) $moodleId,
                            ]);
                        }
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::error("Error en sincronización masiva de estudiantes a Moodle: " . $e->getMessage());
        }
    }
}