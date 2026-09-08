<?php

namespace App\Mail;

use App\Models\Usuario;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class EnviarCodigoOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public $usuario;
    public string $codigo;

    public function __construct($usuario, string $codigo)
    {
        $this->usuario = $usuario;
        $this->codigo = $codigo;
    }

    public function build()
    {
        return $this->subject('Código de Recuperación de Contraseña')
                    ->view('emails.codigo_otp');
    }
}