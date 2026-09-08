<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Helvetica', Arial, sans-serif; color: #334155; line-height: 1.5; padding: 20px; }
        .card { max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; background: #ffffff; }
        .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 20px; }
        .code-box { background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 10px; padding: 15px; text-align: center; margin: 20px 0; }
        .code { font-size: 24px; font-weight: bold; color: #1e3a8a; letter-spacing: 2px; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <div style="font-size: 16px; font-weight: bold; color: #1e3a8a;">MESA DE PARTES VIRTUAL</div>
            <div>Expediente Aceptado y Conformado</div>
        </div>

        <p>Estimado(a) <strong>{{ $solicitud->externo->nombre_razon_social }}</strong>,</p>

        <p>Su solicitud para el trámite <strong>{{ $solicitud->tramite->nombre }}</strong> ha sido <strong>ACEPTADA</strong> por Mesa de Partes tras verificar los requisitos exigidos.</p>

        <div class="code-box">
            <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">Su Código de Seguimiento es:</div>
            <div class="code">{{ $solicitud->codigo_seguimiento }}</div>
        </div>

        <p>Con este código podrá ingresar a nuestro portal web y consultar en tiempo real la ubicación de su expediente y el estado de atención de su trámite.</p>

        <br>
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
            Atentamente,<br>
            <strong>Mesa de Partes e Información Institucional</strong>
        </p>
    </div>
</body>
</html>