<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Helvetica', Arial, sans-serif; color: #334155; line-height: 1.5; padding: 20px; }
        .card { max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; background: #ffffff; }
        .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 20px; }
        .title { font-size: 16px; font-weight: bold; color: #1e3a8a; }
        .badge { background: #fef3c7; color: #92400e; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; display: inline-block; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <div class="title">MESA DE PARTES VIRTUAL</div>
            <div>Confirmación de Recepción de Solicitud</div>
        </div>

        <p>Estimado(a) <strong>{{ $solicitud->externo->nombre_razon_social }}</strong>,</p>

        <p>Confirmamos que su documento para el trámite <strong>{{ $solicitud->tramite->nombre }}</strong> ha sido registrado correctamente en nuestro sistema.</p>

        <div style="margin: 20px 0; text-align: center;">
            <span class="badge">ESTADO: EN REVISIÓN PREVIA POR MESA DE PARTES</span>
        </div>

        <p>Su documentación está siendo verificada por el personal encargado. Tan pronto como su expediente sea aceptado y derivado al área correspondiente, recibirá un correo adicional con su <strong>Código de Seguimiento Oficial</strong> para consultar el avance del trámite.</p>

        <br>
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
            Atentamente,<br>
            <strong>Mesa de Partes e Información Institucional</strong>
        </p>
    </div>
</body>
</html>