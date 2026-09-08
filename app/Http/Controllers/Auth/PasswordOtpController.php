<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\EnviarCodigoOtpMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Throwable;

class PasswordOtpController extends Controller
{
    /**
     * Muestra la pantalla inicial de recuperación de clave.
     */
    public function showForgotPassword()
    {
        return Inertia::render('Auth/ForgotPasswordOtp', [
            'step' => 1,
        ]);
    }

    /**
     * PASO 1: Busca al usuario por username y envía el código OTP de 6 dígitos.
     */
    public function sendOtp(Request $request)
    {
        $request->validate([
            'username' => ['required', 'string'],
        ], [
            'username.required' => 'Ingresa tu nombre de usuario.',
        ]);

        $username = trim($request->username);

        // 1. Buscar directamente en la tabla 'usuarios' por username
        $usuario = DB::table('usuarios')->where('username', $username)->first();

        if (!$usuario) {
            return back()->withErrors(['username' => 'El nombre de usuario ingresado no existe en el sistema.']);
        }

        // 2. Obtener el correo electrónico asociado desde las tablas de perfil
        $email = DB::table('administradores')->where('usuario_id', $usuario->id)->value('email')
            ?? DB::table('personal')->where('usuario_id', $usuario->id)->value('email')
            ?? DB::table('docentes')->where('usuario_id', $usuario->id)->value('email')
            ?? DB::table('postulantes')->where('usuario_id', $usuario->id)->value('email');

        if (!$email) {
            return back()->withErrors(['username' => 'El usuario no tiene un correo electrónico registrado para enviarle el código.']);
        }

        // 3. Generar código OTP aleatorio de 6 dígitos
        $codigo = (string) rand(100000, 999999);

        // 4. Inhabilitar códigos anteriores del usuario
        DB::table('password_otps')->where('usuario_id', $usuario->id)->update(['usado' => 1]);

        // 5. Registrar el nuevo código OTP
        DB::table('password_otps')->insert([
            'usuario_id' => $usuario->id,
            'codigo'     => $codigo,
            'expiracion' => now()->addMinutes(15),
            'usado'      => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 6. Enviar correo electrónico
        try {
            Mail::to($email)->send(new EnviarCodigoOtpMail($usuario, $codigo));
        } catch (Throwable $e) {
            logger()->error("Error al enviar correo OTP: " . $e->getMessage());
            return back()->withErrors(['username' => 'No se pudo enviar el correo con el código. Verifica la configuración SMTP.']);
        }

        return Inertia::render('Auth/ForgotPasswordOtp', [
            'status'     => 'Se ha enviado un código de 6 dígitos a tu correo electrónico.',
            'step'       => 2,
            'usuario_id' => $usuario->id,
        ]);
    }

    /**
     * PASO 2: Valida el código OTP.
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'usuario_id' => ['required', 'integer'],
            'codigo'     => ['required', 'string', 'size:6'],
        ], [
            'codigo.required' => 'Ingresa el código de 6 dígitos.',
            'codigo.size'     => 'El código debe tener exactamente 6 dígitos.',
        ]);

        $otpRecord = DB::table('password_otps')
            ->where('usuario_id', $request->usuario_id)
            ->where('codigo', trim($request->codigo))
            ->where('usado', 0)
            ->where('expiracion', '>', now())
            ->first();

        if (!$otpRecord) {
            return back()->withErrors(['codigo' => 'El código de verificación es incorrecto o ha expirado.']);
        }

        return Inertia::render('Auth/ForgotPasswordOtp', [
            'status'     => 'Código verificado correctamente. Ingresa tu nueva contraseña.',
            'step'       => 3,
            'usuario_id' => $request->usuario_id,
            'otp_id'     => $otpRecord->id,
        ]);
    }

    /**
     * PASO 3: Actualiza la contraseña en la columna 'password_hash'.
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'usuario_id' => ['required', 'integer'],
            'otp_id'     => ['required', 'integer'],
            'password'   => ['required', 'string', 'min:6', 'confirmed'],
        ], [
            'password.required'  => 'Ingresa tu nueva contraseña.',
            'password.min'       => 'La contraseña debe tener al menos 6 caracteres.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
        ]);

        $otpRecord = DB::table('password_otps')
            ->where('id', $request->otp_id)
            ->where('usuario_id', $request->usuario_id)
            ->where('usado', 0)
            ->first();

        if (!$otpRecord) {
            return back()->withErrors(['password' => 'La sesión de recuperación ha expirado.']);
        }

        $nuevaClave = Hash::make($request->password);

        // 1. Actualización directa en la columna 'password_hash' de la tabla 'usuarios'
        DB::table('usuarios')
            ->where('id', $request->usuario_id)
            ->update([
                'password_hash' => $nuevaClave,
                'updated_at'    => now(),
            ]);

        // 2. Si también existiera la tabla estándar 'users' de Laravel
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'password')) {
            DB::table('users')
                ->where('id', $request->usuario_id)
                ->update([
                    'password'   => $nuevaClave,
                    'updated_at' => now(),
                ]);
        }

        // 3. Marcar el código OTP como usado
        DB::table('password_otps')
            ->where('id', $request->otp_id)
            ->update([
                'usado'      => 1,
                'updated_at' => now(),
            ]);

        return redirect()->route('login')->with('status', '¡Tu contraseña ha sido actualizada con éxito! Ya puedes iniciar sesión.');
    }
}