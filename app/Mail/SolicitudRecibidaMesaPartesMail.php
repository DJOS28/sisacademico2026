<?php

namespace App\Mail;

use App\Models\SolicitudTramite;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SolicitudRecibidaMesaPartesMail extends Mailable
{
    use Queueable, SerializesModels;

    public $solicitud;

    public function __construct(SolicitudTramite $solicitud)
    {
        $this->solicitud = $solicitud;
    }

    public function build()
    {
        return $this->subject('Confirmación de Recepción de Documento - Mesa de Partes Virtual')
                    ->view('emails.solicitud_recibida');
    }
}