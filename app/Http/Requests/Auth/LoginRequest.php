<?php

namespace App\Http\Requests\Auth;

use App\Models\Usuario;
use App\Services\AuditoriaService;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'username' => ['required', 'string', 'max:50'],
            'password' => ['required', 'string'],
            'remember' => ['boolean'],
        ];
    }

    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $username = $this->string('username')->trim()->toString();
        $usuario = Usuario::where('username', $username)->first();

        // Reactivación automática si ya culminó el tiempo de penalización de 5 minutos
        if ($usuario && $usuario->status === 'Desactivado' && ! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            $usuario->update(['status' => 'Activo']);
            $usuario->refresh();

            AuditoriaService::registrar(
                componente: 'autenticacion',
                operacion: 'ACTUALIZAR',
                descripcion: "Cuenta reactivada automáticamente tras culminar penalización temporal para el usuario @{$username}",
                registroId: (string) $usuario->id,
                anteriores: ['status' => 'Desactivado'],
                nuevos: ['status' => 'Activo'],
                resultado: 'EXITO'
            );
        }

        // Validación de estado inactivo o desactivado
        if ($usuario && $usuario->status !== 'Activo') {
            AuditoriaService::registrar(
                componente: 'autenticacion',
                operacion: 'ACCESO',
                descripcion: "Intento de acceso denegado: cuenta en estado '{$usuario->status}' para @{$username}",
                registroId: (string) $usuario->id,
                resultado: 'BLOQUEADO',
                motivoFallo: "Estado del usuario: {$usuario->status}"
            );

            throw ValidationException::withMessages([
                'username' => 'Tu cuenta se encuentra desactivada temporalmente por seguridad.',
            ]);
        }

        $credentials = [
            'username' => $username,
            'password' => $this->string('password')->toString(),
            'status' => 'Activo',
        ];

        if (! Auth::attempt($credentials, $this->boolean('remember'))) {
            // Registrar intento fallido (ventana de 300 segundos = 5 minutos)
            RateLimiter::hit($this->throttleKey(), 300);

            $intentosActuales = RateLimiter::attempts($this->throttleKey());

            // Si se alcanza el límite de 5 intentos fallidos
            if ($usuario && $intentosActuales >= 5) {
                $usuario->update(['status' => 'Desactivado']);

                AuditoriaService::registrar(
                    componente: 'autenticacion',
                    operacion: 'ACTUALIZAR',
                    descripcion: "Cuenta desactivada por alcanzar el límite de 5 intentos fallidos (@{$username})",
                    registroId: (string) $usuario->id,
                    anteriores: ['status' => 'Activo'],
                    nuevos: ['status' => 'Desactivado'],
                    resultado: 'BLOQUEADO',
                    motivoFallo: 'Exceso de intentos de autenticación'
                );
            } else {
                AuditoriaService::registrar(
                    componente: 'autenticacion',
                    operacion: 'ACCESO',
                    descripcion: "Intento fallido de autenticación (intento {$intentosActuales}/5) para @{$username}",
                    registroId: $usuario ? (string) $usuario->id : null,
                    resultado: 'FALLIDO',
                    motivoFallo: 'Credenciales inválidas'
                );
            }

            $this->ensureIsNotRateLimited();

            $intentosRestantes = RateLimiter::remaining($this->throttleKey(), 5);

            throw ValidationException::withMessages([
                'username' => "Credenciales incorrectas. Te quedan {$intentosRestantes} intento(s) antes de bloquear la cuenta.",
            ]);
        }

        // Login exitoso: limpiar bloqueos y asentar trazabilidad
        RateLimiter::clear($this->throttleKey());

        AuditoriaService::registrar(
            componente: 'autenticacion',
            operacion: 'ACCESO',
            descripcion: "Inicio de sesión exitoso en la plataforma para @{$username}",
            registroId: (string) Auth::id(),
            resultado: 'EXITO'
        );
    }

    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());
        $minutes = ceil($seconds / 60);

        AuditoriaService::registrar(
            componente: 'autenticacion',
            operacion: 'ACCESO',
            descripcion: "Solicitud bloqueada por límite de tasa (Rate Limit activo por {$minutes} min)",
            resultado: 'BLOQUEADO',
            motivoFallo: "Bloqueo temporal vigente: {$seconds} segundos restantes"
        );

        throw ValidationException::withMessages([
            'username' => "Has superado el límite de 5 intentos. Tu cuenta ha sido desactivada temporalmente. Vuelve a intentar en {$minutes} minuto(s).",
        ]);
    }

    public function throttleKey(): string
    {
        return Str::transliterate(
            Str::lower($this->string('username')->trim()).'|'.$this->ip()
        );
    }
}