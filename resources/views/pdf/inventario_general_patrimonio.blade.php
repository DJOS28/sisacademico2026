<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Inventario General de Bienes Patrimoniales</title>
    <style>
        @page {
            margin: 15mm 12mm 15mm 12mm;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 8.5pt;
            color: #1e293b;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 8px;
            margin-bottom: 12px;
        }
        .titulo {
            font-size: 12pt;
            font-weight: bold;
            text-transform: uppercase;
        }
        .subtitulo {
            font-size: 8.5pt;
            color: #64748b;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }
        th {
            background-color: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 5px 6px;
            font-size: 8pt;
            text-align: left;
        }
        td {
            border: 1px solid #e2e8f0;
            padding: 4.5px 6px;
            font-size: 7.5pt;
        }
        .total-box {
            margin-top: 15px;
            text-align: right;
            font-size: 9.5pt;
            font-weight: bold;
        }
    </style>
</head>
<body>

    <div class="header">
        <div class="titulo">{{ $instituto->nombre ?? 'INSTITUTO DE EDUCACIÓN SUPERIOR' }}</div>
        <div class="subtitulo">Margesí e Inventario Consolidado de Bienes Patrimoniales Activos | Fecha: {{ date('d/m/Y H:i') }}</div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th style="width: 110px;">Cód. Patrimonial</th>
                <th>Denominación del Activo</th>
                <th>Familia / Categoría</th>
                <th>Marca / Modelo / Serie</th>
                <th>Ubicación Actual</th>
                <th style="width: 60px; text-align: center;">Estado</th>
                <th style="width: 70px; text-align: center;">Situación</th>
                <th style="width: 75px; text-align: right;">Valor (S/)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($bienes as $idx => $bien)
                <tr>
                    <td style="text-align: center; font-family: monospace;">{{ $idx + 1 }}</td>
                    <td style="font-family: monospace; font-weight: bold;">{{ $bien->codigo_patrimonial }}</td>
                    <td><strong>{{ $bien->denominacion }}</strong></td>
                    <td>{{ $bien->categoria->nombre ?? 'N/D' }}</td>
                    <td>{{ $bien->marca ?? '-' }} / {{ $bien->modelo ?? '-' }} ({{ $bien->serie ?? 'S/N' }})</td>
                    <td>{{ $bien->aula->nombre ?? ($bien->area->nombre ?? 'Sin ubicación') }}</td>
                    <td style="text-align: center;">{{ $bien->estado_conservacion }}</td>
                    <td style="text-align: center;">{{ str_replace('_', ' ', $bien->situacion) }}</td>
                    <td style="text-align: right; font-family: monospace;">{{ number_format($bien->valor_adquisicion, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="total-box">
        Valorización Total Consolidada: S/ {{ number_format($totalValor, 2) }}
    </div>

</body>
</html>