<?php

namespace App\Mail;

use App\Models\SolicitudTramite;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SolicitudAceptadaMesaPartesMail extends Mailable
{
    use Queueable, SerializesModels;

    public $solicitud;

    public function __construct(SolicitudTramite $solicitud)
    {
        $this->solicitud = $solicitud;
    }

    public function build()
    {
        return $this->subject('Solicitud Aceptada - Código de Seguimiento de Trámite')
                    ->view('emails.solicitud_aceptada');
    }
}