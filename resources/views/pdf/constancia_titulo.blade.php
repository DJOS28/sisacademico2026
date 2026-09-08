<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Constancia de Registro de Título - {{ $acta->numero_diploma }}</title>
    <style>
        @page {
            margin: 25mm 20mm 20mm 20mm;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 11pt;
            color: #1e293b;
            line-height: 1.7;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 25px;
        }
        .header img {
            max-height: 65px;
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
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 25px 0 10px 0;
            color: #0f172a;
            letter-spacing: 1px;
        }
        .numero-diploma {
            text-align: center;
            font-size: 11pt;
            font-weight: bold;
            color: #315d7a;
            margin-bottom: 30px;
        }
        .cuerpo {
            text-align: justify;
            margin-bottom: 20px;
        }
        .tabla-asiento {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            border: 1.5px solid #0f172a;
        }
        .tabla-asiento td {
            padding: 8px 12px;
            font-size: 10pt;
            border-bottom: 1px solid #cbd5e1;
        }
        .tabla-asiento .campo {
            font-weight: bold;
            width: 38%;
            background-color: #f8fafc;
            color: #334155;
        }
        .tabla-asiento .valor {
            width: 62%;
            color: #0f172a;
        }
        .pie-pagina {
            margin-top: 50px;
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
            Secretaría General / Registro y Matrícula | R.M. {{ $instituto->resolucion_creacion ?? 'Institucional' }}
        </div>
    </div>

    <div class="titulo-doc">Constancia de Registro de Título Profesional</div>
    <div class="numero-diploma">DIPLOMA N° {{ $acta->numero_diploma }}</div>

    <div class="cuerpo">
        El Secretario General del <strong>{{ $instituto->nombre ?? 'Instituto de Educación Superior' }}</strong> que suscribe, 
        hace constar que en el <strong>Libro Oficial de Registro de Grados y Títulos</strong> de la institución, se encuentra asentado el siguiente registro oficial:
    </div>

    <table class="tabla-asiento">
        <tr>
            <td class="campo">Titulado(a):</td>
            <td class="valor"><strong>{{ $titulacion->estudiante->apellidos }}, {{ $titulacion->estudiante->nombres }}</strong></td>
        </tr>
        <tr>
            <td class="campo">Documento de Identidad (DNI):</td>
            <td class="valor">{{ $titulacion->estudiante->dni }}</td>
        </tr>
        <tr>
            <td class="campo">Programa de Estudios:</td>
            <td class="valor">{{ $titulacion->planEstudio->nombre }}</td>
        </tr>
        <tr>
            <td class="campo">Resolución de Otorgamiento:</td>
            <td class="valor">{{ $acta->resolucion_director }}</td>
        </tr>
        <tr>
            <td class="campo">Asiento en Libro Oficial:</td>
            <td class="valor"><strong>Libro N° {{ $acta->libro }}</strong> — <strong>Folio N° {{ $acta->folio }}</strong></td>
        </tr>
        <tr>
            <td class="campo">Acta Oficial de Sustentación:</td>
            <td class="valor">{{ $acta->numero_acta }} ({{ \Carbon\Carbon::parse($acta->fecha_sustentacion)->format('d/m/Y') }})</td>
        </tr>
        @if(!empty($acta->codigo_registro_minedu))
            <tr>
                <td class="campo">Código MINEDU / REGISTRA:</td>
                <td class="valor"><strong>{{ $acta->codigo_registro_minedu }}</strong></td>
            </tr>
        @endif
    </table>

    <div class="cuerpo">
        Se expide la presente constancia a solicitud del interesado para los fines legales y laborales que correspondan.
    </div>

    <div class="pie-pagina">
        {{ $instituto->distrito->nombre ?? 'Trujillo' }}, {{ \Carbon\Carbon::now()->isoFormat('D [de] MMMM [del] YYYY') }}
    </div>

    <table class="firmas">
        <tr>
            <td>
                <div class="linea-firma"></div>
                <div class="firma-nombre">SECRETARÍA GENERAL</div>
                <div class="firma-cargo">Registro y Archivo Académico</div>
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