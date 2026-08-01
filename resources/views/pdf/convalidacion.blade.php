<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Constancia de Convalidación - Expediente N° {{ str_pad($convalidacion->id, 6, '0', STR_PAD_LEFT) }}</title>
    <style>
        @page {
            margin: 20px 25px;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10px;
            color: #1e293b;
            margin: 0;
            padding: 0;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 2px solid #315d7a;
            padding-bottom: 8px;
            margin-bottom: 12px;
        }

        .header-table td {
            vertical-align: middle;
        }

        .logo-img {
            max-width: 130px;
            max-height: 65px;
        }

        .inst-title {
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            color: #315d7a;
            margin: 0;
            text-align: center;
        }

        .inst-subtitle {
            font-size: 9px;
            margin: 2px 0;
            color: #475569;
            text-align: center;
        }

        .report-title {
            text-align: center;
            margin: 12px 0;
        }

        .report-title h2 {
            font-size: 13px;
            margin: 0;
            text-transform: uppercase;
            color: #315d7a;
            letter-spacing: 0.5px;
        }

        .report-title h3 {
            font-size: 10px;
            margin: 3px 0 0 0;
            font-weight: normal;
            color: #64748b;
        }

        .section-title {
            background: #315d7a;
            color: #fff;
            padding: 4px 8px;
            font-size: 9.5px;
            font-weight: bold;
            margin-top: 10px;
            margin-bottom: 0;
            text-transform: uppercase;
        }

        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }

        .info-table td {
            border: 1px solid #cbd5e1;
            padding: 5px 6px;
            vertical-align: middle;
            font-size: 9px;
        }

        .info-label {
            width: 22%;
            background: #f1f5f9;
            font-weight: bold;
            color: #1e293b;
        }

        .info-value {
            width: 28%;
            color: #334155;
        }

        .notes-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            font-size: 9px;
        }

        .notes-table th,
        .notes-table td {
            border: 1px solid #cbd5e1;
            padding: 6px 5px;
            text-align: center;
        }

        .notes-table th {
            background: #e2e8f0;
            font-weight: bold;
            color: #1e293b;
            font-size: 8.5px;
            text-transform: uppercase;
        }

        .badge-estado {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 8.5px;
            text-transform: uppercase;
        }

        .badge-aprobado { background-color: #dcfce7; color: #166534; }
        .badge-pendiente { background-color: #fef3c7; color: #92400e; }
        .badge-rechazado { background-color: #ffe4e6; color: #991b1b; }

        .footer-signatures {
            width: 100%;
            margin-top: 50px;
            border-collapse: collapse;
        }

        .signature-box {
            width: 200px;
            border-top: 1px solid #475569;
            text-align: center;
            padding-top: 4px;
            font-size: 8.5px;
            color: #334155;
            margin: 0 auto;
        }

        .footer {
            margin-top: 20px;
            font-size: 8px;
            color: #94a3b8;
            text-align: right;
            border-top: 1px solid #e2e8f0;
            padding-top: 4px;
        }
    </style>
</head>
<body>

    {{-- ENCABEZADO INSTITUCIONAL --}}
    <table class="header-table">
        <tr>
            <td style="width: 120px; text-align: left;">
                @if(!empty($imagenBase64))
                    <img class="logo-img" src="{{ $imagenBase64 }}" alt="Logo Instituto">
                @endif
            </td>
            <td>
                <p class="inst-title">{{ $instituto->nombre ?? 'INSTITUTO DE EDUCACIÓN SUPERIOR' }}</p>
                <p class="inst-subtitle">
                    Código Modular: {{ $instituto->codigo_modular ?? '---' }} 
                    @if(!empty($instituto->dre)) | DRE: {{ $instituto->dre }} @endif
                </p>
                <p class="inst-subtitle">
                    {{ $instituto->direccion ?? '' }} 
                    @if(!empty($instituto->telefono)) | Teléf: {{ $instituto->telefono }} @endif
                </p>
            </td>
            <td style="width: 110px; text-align: right;">
                <span style="font-size: 10px; font-weight: bold; color: #315d7a;">
                    EXP. N° {{ str_pad($convalidacion->id, 6, '0', STR_PAD_LEFT) }}
                </span>
            </td>
        </tr>
    </table>

    {{-- TÍTULO --}}
    <div class="report-title">
        <h2>CONSTANCIA DE CONVALIDACIÓN ACADÉMICA</h2>
        <h3>Acreditación y Homologación de Unidades Didácticas / Asignaturas</h3>
    </div>

    {{-- I. DATOS DEL ESTUDIANTE --}}
    <div class="section-title">I. DATOS DEL ESTUDIANTE</div>
    <table class="info-table">
        <tr>
            <td class="info-label">Apellidos y Nombres</td>
            <td class="info-value" colspan="3">
                <strong>{{ $convalidacion->estudiante ? $convalidacion->estudiante->apellidos . ', ' . $convalidacion->estudiante->nombres : '---' }}</strong>
            </td>
        </tr>
        <tr>
            <td class="info-label">DNI / Doc. Identidad</td>
            <td class="info-value">{{ $convalidacion->estudiante->dni ?? '---' }}</td>
            <td class="info-label">Periodo Lectivo</td>
            <td class="info-value">{{ $convalidacion->periodo->nombre ?? '---' }}</td>
        </tr>
    </table>

    {{-- II. DETALLE DE CONVALIDACIÓN --}}
    <div class="section-title">II. ASIGNATURA Y ANTECEDENTES ACADÉMICOS</div>
    <table class="notes-table">
        <thead>
            <tr>
                <th style="width: 35%;">Asignatura Destino (Plan de Estudios)</th>
                <th style="width: 30%;">Curso / Materia de Origen</th>
                <th style="width: 20%;">Institución / Univ. Origen</th>
                <th style="width: 8%;">Nota</th>
                <th style="width: 7%;">Estado</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="text-align: left; padding-left: 6px;">
                    <strong>{{ $convalidacion->cursoDestino->nombre ?? '---' }}</strong>
                </td>
                <td style="text-align: left; padding-left: 6px;">
                    {{ $convalidacion->curso_origen }}
                </td>
                <td>
                    {{ $convalidacion->institucion_origen }}
                </td>
                <td>
                    <strong>{{ number_format($convalidacion->nota_origen, 1) }}</strong>
                </td>
                <td>
                    <span class="badge-estado {{ $convalidacion->estado === 'Aprobado' ? 'badge-aprobado' : ($convalidacion->estado === 'Rechazado' ? 'badge-rechazado' : 'badge-pendiente') }}">
                        {{ $convalidacion->estado }}
                    </span>
                </td>
            </tr>
        </tbody>
    </table>

    {{-- III. SUSTENTO Y RESOLUCIÓN --}}
    <div class="section-title">III. OBSERVACIONES Y RESOLUCIÓN DIRECTORAL</div>
    <table class="info-table">
        <tr>
            <td class="info-label" style="width: 20%;">Fecha Registro</td>
            <td class="info-value" style="width: 30%;">
                {{ $convalidacion->fecha_convalidacion ? \Carbon\Carbon::parse($convalidacion->fecha_convalidacion)->format('d/m/Y') : '---' }}
            </td>
            <td class="info-label" style="width: 20%;">Condición Final</td>
            <td class="info-value" style="width: 30%;">
                <strong>{{ $convalidacion->estado === 'Aprobado' ? 'CONVALIDADO' : $convalidacion->estado }}</strong>
            </td>
        </tr>
        <tr>
            <td class="info-label">Sustento / Resolución</td>
            <td class="info-value" colspan="3" style="height: 40px; vertical-align: top;">
                {{ $convalidacion->observaciones ?? 'Sin observaciones adicionales expresadas en el expediente.' }}
            </td>
        </tr>
    </table>

    {{-- FIRMAS REGULATORIAS --}}
    <table class="footer-signatures">
        <tr>
            <td style="width: 50%;">
                <div class="signature-box">
                    Secretaría Académica<br>
                    <strong>{{ $instituto->nombre ?? 'SGA' }}</strong>
                </div>
            </td>
            <td style="width: 50%;">
                <div class="signature-box">
                    V°B° Director General / Dirección Académica<br>
                    <strong>{{ $instituto->nombre ?? 'SGA' }}</strong>
                </div>
            </td>
        </tr>
    </table>

    <div class="footer">
        Documento oficial expedido el {{ date('d/m/Y - H:i') }} | Sistema de Gestión Académica (SGA)
    </div>

</body>
</html>