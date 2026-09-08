<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; margin: 0; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 30px; border: 1px solid #e2e8f0; }
        .header { text-align: center; border-bottom: 2px solid #315d7a; padding-bottom: 15px; margin-bottom: 20px; }
        .header h2 { color: #315d7a; margin: 0; font-size: 18px; }
        .info-box { background-color: #f8fafc; border-left: 4px solid #315d7a; padding: 12px 16px; margin: 15px 0; border-radius: 4px; font-size: 13px; }
        .btn { display: inline-block; background-color: #315d7a; color: #ffffff !important; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 12px; margin-top: 15px; }
        .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h2>Sistema de Gestión Documentaria</h2>
        </div>

        <p>Estimado(a) <strong>{{ $solicitud->solicitante_nombre }}</strong>,</p>

        <p>Le informamos que su solicitud para el trámite <strong>{{ $solicitud->tramite?->nombre }}</strong> con código de seguimiento <strong style="color: #315d7a;">{{ $solicitud->codigo_seguimiento }}</strong> ha finalizado:</p>

        <div class="info-box">
            <p style="margin: 0 0 6px 0;">
                <strong>Estado Final:</strong>
                @if($solicitud->estado === 'completado')
                    <span style="color: #16a34a; font-weight: bold;">✅ ATENDIDO / COMPLETADO</span>
                @else
                    <span style="color: #dc2626; font-weight: bold;">❌ OBSERVADO / RECHAZADO</span>
                @endif
            </p>
            @if($solicitud->motivo_rechazo)
                <p style="margin: 6px 0 0 0;"><strong>Detalles / Observaciones:</strong></p>
                <p style="margin: 3px 0 0 0; font-style: italic; color: #475569;">"{{ $solicitud->motivo_rechazo }}"</p>
            @endif
        </div>

        <p style="font-size: 13px;">Puede consultar la trazabilidad completa y descargar los documentos emitidos ingresando a nuestro portal con su código de seguimiento:</p>

        <div style="text-align: center;">
            <a href="{{ route('solicitud-externa.seguimiento', $solicitud->codigo_seguimiento) }}" class="btn">
                🔍 Consultar Seguimiento de Expediente
            </a>
        </div>

        <div class="footer">
            <p>Este es un mensaje automático del Sistema de Gestión Documentaria. Por favor no responda a este correo.</p>
        </div>
    </div>
</body>
</html>