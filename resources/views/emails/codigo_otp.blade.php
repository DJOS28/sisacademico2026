<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; margin: 0; }
        .card { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 30px; border: 1px solid #e2e8f0; text-align: center; }
        .code { display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #315d7a; background: #f1f5f9; padding: 12px 24px; border-radius: 8px; margin: 20px 0; border: 1px dashed #315d7a; }
        .footer { font-size: 11px; color: #94a3b8; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 12px; }
    </style>
</head>
<body>
    <div class="card">
        <h2 style="color: #315d7a; margin-top:0;">Recuperación de Contraseña</h2>
        <p>Hola <strong>{{ $usuario->name ?? $usuario->username }}</strong>,</p>
        <p>Has solicitado restablecer tu contraseña. Usa el siguiente código de verificación de 6 dígitos:</p>
        
        <div class="code">{{ $codigo }}</div>

        <p style="font-size: 13px; color: #64748b;">Este código expirará en 15 minutos y solo puede ser usado una vez.</p>
        <p style="font-size: 12px; color: #94a3b8;">Si no solicitaste este cambio, puedes ignorar este correo.</p>

        <div class="footer">
            <p>Sistema de Gestión Académica - Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>