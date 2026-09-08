<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Ticket_Pago_{{ $pago->id_pagos }}</title>
    <style>
        @page { margin: 4px; }
        body {
            font-family: 'Courier', 'Helvetica', sans-serif;
            font-size: 8.5pt;
            color: #000;
            margin: 0;
            padding: 4px;
            line-height: 1.2;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        .logo { max-width: 60px; max-height: 60px; height: auto; margin-bottom: 2px; }
        .divider { border-top: 1px dashed #000; margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; }
        td, th { padding: 2px 0; vertical-align: top; }
        .footer { margin-top: 10px; font-size: 7.5pt; }
    </style>
</head>
<body>

    <!-- Encabezado Institucional Dinámico -->
    <div class="text-center">
        @if($instituto && $instituto->logo && file_exists(public_path('storage/' . $instituto->logo)))
            <img src="{{ public_path('storage/' . $instituto->logo) }}" class="logo" alt="Logo">
        @elseif(file_exists(public_path('images/logo.png')))
            <img src="{{ public_path('images/logo.png') }}" class="logo" alt="Logo">
        @endif

        <div class="bold uppercase" style="font-size: 9.5pt;">
            {{ $instituto->nombre ?? 'INSTITUTO DE EDUCACIÓN SUPERIOR' }}
        </div>
        
        @if($instituto->codigo_modular)
            <div>CÓD. MODULAR: {{ $instituto->codigo_modular }}</div>
        @endif
        
        @if($instituto->dre)
            <div>DRE: {{ $instituto->dre }}</div>
        @endif

        @if($instituto->direccion)
            <div style="font-size: 7.5pt;">{{ $instituto->direccion }}</div>
        @endif

        @if($instituto->telefono)
            <div style="font-size: 7.5pt;">TELÉF: {{ $instituto->telefono }}</div>
        @endif

        <div style="font-size: 7.5pt; font-weight: bold; margin-top: 2px;">COMPROBANTE DE PAGO INTERNO</div>
    </div>

    <div class="divider"></div>

    <!-- Correlativo -->
    <div class="text-center bold" style="font-size: 10pt;">
        TICKET DE COBRO N° {{ str_pad($pago->id_pagos, 8, '0', STR_PAD_LEFT) }}
    </div>

    <div class="divider"></div>

    <!-- Datos del Alumno y Operación -->
    <div>
        <strong>Fecha / Hora:</strong> {{ \Carbon\Carbon::parse($pago->created_at)->format('d/m/Y H:i:s') }}<br>
        <strong>DNI:</strong> {{ $pago->postulante->dni }}<br>
        <strong>Alumno:</strong> {{ $pago->postulante->nombre_completo ?? ($pago->postulante->nombres . ' ' . $pago->postulante->apellidos) }}<br>
        <strong>Caja / Turno:</strong> {{ $pago->caja->nombre ?? 'Caja Principal' }}
    </div>

    <div class="divider"></div>

    <!-- Detalle del Concepto -->
    <table>
        <thead>
            <tr>
                <th class="text-left" style="width: 70%;">DESCRIPCIÓN</th>
                <th class="text-right" style="width: 30%;">TOTAL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="uppercase">{{ $pago->concepto->nombre }}</td>
                <td class="text-right bold">S/ {{ number_format($pago->monto, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <div class="divider"></div>

    <!-- Importe Total -->
    <table>
        <tr>
            <td class="bold text-right" style="font-size: 10pt;">TOTAL RECIBIDO:</td>
            <td class="bold text-right" style="font-size: 10pt;">S/ {{ number_format($pago->monto, 2) }}</td>
        </tr>
    </table>

    @if($pago->observacion)
        <div style="margin-top: 4px; font-size: 8pt;">
            <strong>Observación:</strong> {{ $pago->observacion }}
        </div>
    @endif

    <div class="divider"></div>

    <!-- Pie del Ticket -->
    <div class="text-center footer">
        <br><br>
        ____________________________________<br>
        <strong>Firma del Cajero / Recaudador</strong><br><br>
        ¡Gracias por realizar su trámite en {{ $instituto->nombre ?? 'nuestra institución' }}!<br>
        <em>Impresión: {{ $fechaImpresion }}</em>
    </div>

</body>
</html>