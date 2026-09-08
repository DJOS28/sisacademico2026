<?php

namespace App\Mail;

use App\Models\SolicitudTramite;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SolicitudFinalizadaMail extends Mailable
{
    use Queueable, SerializesModels;

    public SolicitudTramite $solicitud;

    public function __construct(SolicitudTramite $solicitud)
    {
        $this->solicitud = $solicitud;
    }

    public function build()
    {
        $estadoTexto = $this->solicitud->estado === 'completado' ? 'Atendido' : 'Observado';

        return $this->subject("Estado de Trámite [{$this->solicitud->codigo_seguimiento}] - {$estadoTexto}")
                    ->view('emails.solicitud_finalizada');
    }
}