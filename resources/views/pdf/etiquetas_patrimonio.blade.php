<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Etiquetas Patrimoniales</title>
    <style>
        @page {
            margin: 10mm;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 8pt;
            color: #0f172a;
        }
        .grid-etiquetas {
            width: 100%;
            border-collapse: collapse;
        }
        .grid-etiquetas td {
            width: 50%;
            padding: 5px;
            vertical-align: top;
        }
        .etiqueta {
            border: 1.5px solid #0f172a;
            border-radius: 6px;
            padding: 6px 8px;
            height: 95px;
            background-color: #ffffff;
        }
        .header-etiqueta {
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 3px;
            margin-bottom: 4px;
            font-size: 7.5pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #315d7a;
        }
        .tabla-interior {
            width: 100%;
            border-collapse: collapse;
        }
        .tabla-interior td {
            padding: 0;
            vertical-align: middle;
        }
        .qr-cell {
            width: 70px;
            text-align: center;
        }
        .qr-img {
            width: 65px;
            height: 65px;
        }
        .info-cell {
            padding-left: 6px !important;
            font-size: 7.5pt;
        }
        .codigo-patrimonial {
            font-size: 9.5pt;
            font-weight: bold;
            font-family: monospace;
            color: #0f172a;
            margin-bottom: 2px;
        }
        .denominacion {
            font-weight: bold;
            color: #334155;
            line-height: 1.1;
            height: 24px;
            overflow: hidden;
        }
        .detalles {
            font-size: 6.5pt;
            color: #64748b;
            margin-top: 2px;
        }
    </style>
</head>
<body>

    <table class="grid-etiquetas">
        @foreach($bienes->chunk(2) as $fila)
            <tr>
                @foreach($fila as $bien)
                    <td>
                        <div class="etiqueta">
                            <div class="header-etiqueta">
                                {{ $instituto->nombre ?? 'INSTITUTO DE EDUCACIÓN SUPERIOR' }} • CONTROL PATRIMONIAL
                            </div>
                            <table class="tabla-interior">
                                <tr>
                                    <td class="qr-cell">
                                        <img class="qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data={{ urlencode($bien->codigo_patrimonial . ' - ' . $bien->denominacion) }}" alt="QR">
                                    </td>
                                    <td class="info-cell">
                                        <div class="codigo-patrimonial">{{ $bien->codigo_patrimonial }}</div>
                                        <div class="denominacion">{{ $bien->denominacion }}</div>
                                        <div class="detalles">
                                            Marca: {{ $bien->marca ?? 'N/D' }} | Serie: {{ $bien->serie ?? 'N/D' }}
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </td>
                @endforeach
                @if($fila->count() == 1)
                    <td></td>
                @endif
            </tr>
        @endforeach
    </table>

</body>
</html>