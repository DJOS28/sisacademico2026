<?php

namespace App\Services;

use App\Models\Usuario;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Request;
use Throwable;

class AuditoriaService
{
    public static function registrar(
        string $componente,
        string $operacion,
        string $descripcion,
        ?string $registroId = null,
        ?array $anteriores = null,
        ?array $nuevos = null,
        string $resultado = 'EXITO',
        ?string $motivoFallo = null
    ): void {
        try {
            $user = Auth::user();
            $username = $user ? $user->username : (Request::input('username') ?? 'Invitado/Sistema');
            $rol = $user?->roles?->first()?->nombre ?? 'Sin Rol';

            unset($anteriores['password_hash'], $nuevos['password_hash']);

            DB::table('auditoria_operaciones')->insert([
                'usuario_id' => $user?->id,
                'username_historico' => $username,
                'rol_usuario' => $rol,
                'componente' => $componente,
                'operacion' => $operacion,
                'descripcion' => $descripcion,
                'registro_id' => $registroId,
                'datos_anteriores' => $anteriores ? json_encode($anteriores, JSON_UNESCAPED_UNICODE) : null,
                'datos_nuevos' => $nuevos ? json_encode($nuevos, JSON_UNESCAPED_UNICODE) : null,
                'resultado' => $resultado,
                'motivo_fallo' => $motivoFallo,
                'ip_origen' => Request::ip() ?? '127.0.0.1',
                'user_agent' => Request::userAgent(),
                'created_at' => now(),
            ]);
        } catch (Throwable $e) {
            report($e); // No frena la operación principal si falla la traza
        }
    }
}