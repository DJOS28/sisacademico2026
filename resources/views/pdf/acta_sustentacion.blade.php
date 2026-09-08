<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Acta de Sustentación - {{ $acta->numero_acta }}</title>
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
        .titulo-acta {
            text-align: center;
            font-size: 13pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 20px 0 10px 0;
            color: #0f172a;
            letter-spacing: 1px;
        }
        .numero-acta {
            text-align: center;
            font-size: 10pt;
            font-weight: bold;
            color: #315d7a;
            margin-bottom: 25px;
        }
        .contenido {
            text-align: justify;
            margin-bottom: 20px;
        }
        .cuadro-datos {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        .cuadro-datos td {
            padding: 6px 8px;
            font-size: 10pt;
            vertical-align: top;
        }
        .cuadro-datos .label {
            font-weight: bold;
            width: 30%;
            color: #334155;
        }
        .cuadro-datos .valor {
            width: 70%;
            color: #0f172a;
        }
        .dictamen-box {
            border: 1.5px solid #0f172a;
            background-color: #f8fafc;
            padding: 12px 16px;
            margin: 20px 0;
            text-align: center;
        }
        .dictamen-resultado {
            font-size: 12pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #0f172a;
        }
        .firmas {
            margin-top: 60px;
            width: 100%;
        }
        .firmas td {
            text-align: center;
            width: 33.33%;
            padding: 0 10px;
            vertical-align: top;
        }
        .linea-firma {
            border-top: 1px solid #0f172a;
            margin-bottom: 4px;
        }
        .firma-nombre {
            font-size: 8.5pt;
            font-weight: bold;
            color: #0f172a;
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
            R.M. de Creación: {{ $instituto->resolucion_creacion ?? 'Institucional' }} | 
            {{ $instituto->distrito->nombre ?? 'Trujillo' }} - Perú
        </div>
    </div>

    <div class="titulo-acta">Acta Oficial de Sustentación de Titulación</div>
    <div class="numero-acta">{{ $acta->numero_acta }}</div>

    <div class="contenido">
        Siendo las <strong>{{ \Carbon\Carbon::parse($acta->fecha_sustentacion)->format('H:i') }}</strong> horas del día 
        <strong>{{ \Carbon\Carbon::parse($acta->fecha_sustentacion)->isoFormat('D [de] MMMM [del] YYYY') }}</strong>, en las instalaciones de 
        <strong>{{ $acta->lugar_aula }}</strong>, se reunió el Jurado Evaluador designado para presenciar y calificar el acto público de sustentación conducente a la obtención del Título Profesional Técnico:
    </div>

    <table class="cuadro-datos">
        <tr>
            <td class="label">Postulante / Egresado:</td>
            <td class="valor"><strong>{{ $titulacion->estudiante->apellidos }}, {{ $titulacion->estudiante->nombres }}</strong></td>
        </tr>
        <tr>
            <td class="label">Documento de Identidad:</td>
            <td class="valor">DNI N° {{ $titulacion->estudiante->dni }}</td>
        </tr>
        <tr>
            <td class="label">Programa de Estudios:</td>
            <td class="valor">{{ $titulacion->planEstudio->nombre }}</td>
        </tr>
        <tr>
            <td class="label">Modalidad de Titulación:</td>
            <td class="valor">{{ $titulacion->modalidad->nombre }}</td>
        </tr>
        <tr>
            <td class="label">Denominación del Proyecto:</td>
            <td class="valor"><em>"{{ $titulacion->titulo_proyecto ?? '---' }}"</em></td>
        </tr>
    </table>

    <div class="contenido">
        Habiéndose escuchado la disertación, absueltas las preguntas y culminada la deliberación secreta de los miembros del jurado, se llegó al siguiente veredicto:
    </div>

    <div class="dictamen-box">
        <div class="dictamen-resultado">
            DICTAMEN: {{ str_replace('_', ' ', $acta->resultado) }}
        </div>
        @if($acta->nota_promedio)
            <div style="font-size: 10pt; color: #475569; margin-top: 4px;">
                Calificación Final Obtenida: <strong>{{ number_format($acta->nota_promedio, 2) }}</strong>
            </div>
        @endif
    </div>

    @if(!empty($acta->observaciones))
        <div style="font-size: 9.5pt; color: #475569; margin-bottom: 20px;">
            <strong>Observaciones:</strong> {{ $acta->observaciones }}
        </div>
    @endif

    <div class="contenido">
        En fe de lo actuado y en conformidad con las normas institucionales vigentes, firman los miembros del Jurado Evaluador:
    </div>

    <table class="firmas">
        <tr>
            @foreach($jurados as $jurado)
                <td>
                    <div class="linea-firma"></div>
                    <div class="firma-nombre">{{ $jurado->docente->nombre }} {{ $jurado->docente->apellido }}</div>
                    <div class="firma-cargo">{{ $jurado->cargo }}</div>
                </td>
            @endforeach
        </tr>
    </table>

</body>
</html>