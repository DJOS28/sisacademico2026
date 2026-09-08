<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Acta de Baja Patrimonial - {{ $bien->codigo_patrimonial }}</title>
    <style>
        @page {
            margin: 25mm 20mm 20mm 20mm;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 11pt;
            color: #1e293b;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }
        .header img {
            max-height: 60px;
            margin-bottom: 6px;
        }
        .instituto-nombre {
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #0f172a;
        }
        .instituto-sub {
            font-size: 9pt;
            color: #64748b;
        }
        .titulo-doc {
            text-align: center;
            font-size: 13pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 20px 0 6px 0;
            color: #0f172a;
            letter-spacing: 1px;
        }
        .resolucion-doc {
            text-align: center;
            font-size: 10pt;
            font-weight: bold;
            color: #315d7a;
            margin-bottom: 25px;
        }
        .cuerpo {
            text-align: justify;
            margin-bottom: 15px;
        }
        .tabla-datos {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            border: 1.5px solid #0f172a;
        }
        .tabla-datos td {
            padding: 7px 10px;
            font-size: 9.5pt;
            border-bottom: 1px solid #cbd5e1;
        }
        .tabla-datos .label {
            font-weight: bold;
            width: 32%;
            background-color: #f8fafc;
            color: #334155;
        }
        .tabla-datos .valor {
            width: 68%;
            color: #0f172a;
        }
        .box-informe {
            border: 1px solid #cbd5e1;
            background-color: #f8fafc;
            padding: 12px 14px;
            margin: 15px 0;
            font-size: 9.5pt;
        }
        .pie-pagina {
            margin-top: 30px;
            text-align: right;
            font-size: 10pt;
        }
        .firmas {
            margin-top: 60px;
            width: 100%;
        }
        .firmas td {
            text-align: center;
            width: 50%;
            padding: 0 20px;
            vertical-align: top;
        }
        .linea-firma {
            border-top: 1px solid #0f172a;
            margin-bottom: 4px;
        }
        .firma-nombre {
            font-size: 9pt;
            font-weight: bold;
        }
        .firma-cargo {
            font-size: 8pt;
            color: #475569;
            text-transform: uppercase;
        }
    </style>
</head>
<body>

    <div class="header">
        @if(!empty($imagenBase64))
            <img src="{{ $imagenBase64 }}" alt="Logo">
        @endif
        <div class="instituto-nombre">{{ $instituto->nombre ?? 'INSTITUTO DE EDUCACIÓN SUPERIOR' }}</div>
        <div class="instituto-sub">
            Unidad de Administración / Control Patrimonial | {{ $instituto->distrito->nombre ?? 'Trujillo' }} - Perú
        </div>
    </div>

    <div class="titulo-doc">Acta Oficial de Baja y Desincorporación Patrimonial</div>
    <div class="resolucion-doc">{{ $baja->resolucion_director ?? 'EXPEDIENTE DE DESINCORPORACIÓN' }}</div>

    <div class="cuerpo">
        En las instalaciones del <strong>{{ $instituto->nombre ?? 'Instituto de Educación Superior' }}</strong>, con fecha 
        <strong>{{ \Carbon\Carbon::parse($baja->fecha_baja)->isoFormat('D [de] MMMM [del] YYYY') }}</strong>, la Comisión de Inventario y Control Patrimonial 
        procede a formalizar la <strong>Baja Definitiva</strong> del siguiente activo del Margesí de Bienes Institucionales:
    </div>

    <table class="tabla-datos">
        <tr>
            <td class="label">Código Patrimonial:</td>
            <td class="valor"><strong>{{ $bien->codigo_patrimonial }}</strong></td>
        </tr>
        <tr>
            <td class="label">Denominación del Bien:</td>
            <td class="valor"><strong>{{ $bien->denominacion }}</strong></td>
        </tr>
        <tr>
            <td class="label">Familia / Categoría:</td>
            <td class="valor">{{ $bien->categoria->nombre ?? 'N/D' }}</td>
        </tr>
        <tr>
            <td class="label">Marca / Modelo / Serie:</td>
            <td class="valor">{{ $bien->marca ?? 'N/D' }} / {{ $bien->modelo ?? 'N/D' }} / S/N: {{ $bien->serie ?? 'N/D' }}</td>
        </tr>
        <tr>
            <td class="label">Causal de la Baja:</td>
            <td class="valor"><strong>{{ str_replace('_', ' ', $baja->causal) }}</strong></td>
        </tr>
        <tr>
            <td class="label">Valor Contable de Adquisición:</td>
            <td class="valor">S/ {{ number_format($bien->valor_adquisicion, 2) }}</td>
        </tr>
    </table>

    <div class="cuerpo">
        <strong>Fundamento y Justificación Técnica de la Desincorporación:</strong>
    </div>

    <div class="box-informe">
        {{ $baja->informe_tecnico }}
    </div>

    <div class="cuerpo">
        Se levanta la presente acta en señal de conformidad, disponiéndose la eliminación contable y el destino final del bien de acuerdo con las directivas de la Superintendencia Nacional de Bienes Estatales (SBN).
    </div>

    <div class="pie-pagina">
        {{ $instituto->distrito->nombre ?? 'Trujillo' }}, {{ \Carbon\Carbon::now()->isoFormat('D [de] MMMM [del] YYYY') }}
    </div>

    <table class="firmas">
        <tr>
            <td>
                <div class="linea-firma"></div>
                <div class="firma-nombre">RESPONSABLE DE PATRIMONIO</div>
                <div class="firma-cargo">Unidad de Abastecimiento y Servicios</div>
            </td>
            <td>
                <div class="linea-firma"></div>
                <div class="firma-nombre">DIRECCIÓN GENERAL</div>
                <div class="firma-cargo">{{ $instituto->nombre ?? 'Instituto' }}</div>
            </td>
        </tr>
    </table>

</body>
</html>