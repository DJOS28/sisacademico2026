<?php

namespace App\Imports;

use App\Models\Usuario;
use App\Models\Docente;
use App\Models\Rol;
use App\Services\MoodleService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class DocentesImport implements ToCollection, WithHeadingRow
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
        $rolDocente = Rol::where('nombre', 'Docente')->first();

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

            // Validar existencia en las tablas reales
            if (Docente::where('dni', $dni)->exists() || Usuario::where('username', $dni)->exists()) {
                $this->omitidos++;
                $this->errores[] = "Fila {$numFila}: El docente con DNI {$dni} ya se encuentra registrado.";
                continue;
            }

            $emailFinal     = !empty($email) ? $email : "{$dni}@instituto.edu.pe";
            $passwordMoodle = "{$dni}@Doc2026";

            try {
                DB::transaction(function () use ($dni, $nombre, $apell, $emailFinal, $passwordMoodle, $fila, $rolDocente) {
                    // Creación en la tabla 'usuarios' con 'password_hash'
                    $usuario = Usuario::create([
                        'username'      => $dni,
                        'password_hash' => Hash::make($passwordMoodle),
                        'status'        => 'Activo',
                    ]);

                    if ($rolDocente) {
                        $usuario->roles()->attach($rolDocente->id);
                    }

                    // Creación del perfil docente
                    Docente::create([
                        'usuario_id'   => $usuario->id,
                        'dni'          => $dni,
                        'nombre'       => mb_strtoupper($nombre),
                        'apellido'     => mb_strtoupper($apell),
                        'email'        => $emailFinal,
                        'telefono'     => trim((string)($fila['telefono'] ?? $fila['celular'] ?? '')),
                        'direccion'    => trim((string)($fila['direccion'] ?? '')),
                        'departamento' => trim((string)($fila['departamento'] ?? 'Académico')),
                        'cargo'        => trim((string)($fila['cargo'] ?? 'Docente')),
                    ]);

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
                $this->errores[] = "Fila {$numFila}: Error al guardar - {$e->getMessage()}";
            }
        }

        // Sincronización en lotes hacia Moodle
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
                                'moodle_user_id' => $moodleId,
                            ]);
                        }
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::error("Error en sincronización por lotes a Moodle: " . $e->getMessage());
        }
    }
}