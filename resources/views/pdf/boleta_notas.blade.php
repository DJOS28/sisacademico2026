<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Boleta de Notas - {{ $estudiante->dni }}</title>
    <style>
        @page {
            margin: 18px 20px 20px 20px;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10px;
            color: #222;
            margin: 0;
            padding: 0;
        }

        .header {
            width: 100%;
            border-bottom: 2px solid #1f3c88;
            padding-bottom: 8px;
            margin-bottom: 10px;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
        }

        .header-table td {
            vertical-align: middle;
        }

        .logo-cell {
            width: 120px;
            text-align: left;
        }

        .logo-img {
            max-width: 140px;
            max-height: 70px;
        }

        .title-cell {
            text-align: center;
        }

        .inst-title {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            color: #1f3c88;
            margin: 0;
        }

        .inst-subtitle {
            font-size: 9.5px;
            margin: 2px 0;
            color: #444;
        }

        .report-title {
            text-align: center;
            margin: 8px 0;
        }

        .report-title h2 {
            font-size: 14px;
            margin: 0;
            text-transform: uppercase;
            color: #1f3c88;
        }

        .report-title h3 {
            font-size: 11px;
            margin: 3px 0 0 0;
            font-weight: normal;
            color: #333;
        }

        .section-title {
            background: #1f3c88;
            color: #fff;
            padding: 4px 8px;
            font-size: 10px;
            font-weight: bold;
            margin-top: 8px;
            margin-bottom: 0;
            text-transform: uppercase;
        }

        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
        }

        .info-table td {
            border: 1px solid #cfd6e4;
            padding: 4px 6px;
            vertical-align: middle;
            font-size: 9px;
        }

        .info-label {
            width: 22%;
            background: #eef3fb;
            font-weight: bold;
            color: #1f3c88;
        }

        .info-value {
            width: 28%;
            color: #222;
        }

        .notes-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            font-size: 9px;
            table-layout: fixed;
        }

        .notes-table th,
        .notes-table td {
            border: 1px solid #bfc7d4;
            padding: 5px 4px;
            text-align: center;
            word-wrap: break-word;
        }

        .notes-table th {
            background: #dfe8f7;
            font-weight: bold;
            color: #0f2557;
            font-size: 8.5px;
            text-transform: uppercase;
        }

        .notes-table .student-col {
            text-align: left;
            padding-left: 6px;
        }

        .notes-table tbody tr:nth-child(even) {
            background: #f7f9fc;
        }

        .badge-estado {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: bold;
            font-size: 8.5px;
            background-color: #e2e8f0;
            color: #1e293b;
        }

        .nota-aprobada {
            color: #047857;
            font-weight: bold;
        }

        .nota-desaprobada {
            color: #dc2626;
            font-weight: bold;
        }

        .footer-signatures {
            width: 100%;
            margin-top: 45px;
            border-collapse: collapse;
        }

        .signature-box {
            width: 200px;
            border-top: 1px solid #666;
            text-align: center;
            padding-top: 4px;
            font-size: 8.5px;
            color: #444;
            margin: 0 auto;
        }

        .footer {
            margin-top: 15px;
            font-size: 8px;
            color: #666;
            text-align: right;
        }
    </style>
</head>
<body>

    {{-- ENCABEZADO CON LOGO DE INSTITUTO --}}
    <div class="header">
        <table class="header-table">
            <tr>
                <td class="logo-cell">
                    @if(!empty($imagenBase64))
                        <img class="logo-img" src="{{ $imagenBase64 }}" alt="Logo del Instituto">
                    @elseif($instituto && !empty($instituto->logo) && file_exists(public_path('storage/' . $instituto->logo)))
                        <img class="logo-img" src="{{ public_path('storage/' . $instituto->logo) }}" alt="Logo del Instituto">
                    @endif
                </td>
                <td class="title-cell">
                    <p class="inst-title">{{ $instituto->nombre ?? 'INSTITUTO EDUCATIVO' }}</p>
                    <p class="inst-subtitle">
                        Código Modular: {{ $instituto->codigo_modular ?? '---' }}
                        @if(!empty($instituto->dre))
                            | DRE: {{ $instituto->dre }}
                        @endif
                    </p>
                    <p class="inst-subtitle">
                        {{ $instituto->direccion ?? '' }}
                        @if(!empty($instituto->telefono))
                            | Teléfono: {{ $instituto->telefono }}
                        @endif
                    </p>
                </td>
                <td style="width: 100px; text-align: right;">
                    <span style="font-size: 11px; font-weight: bold; color: #1f3c88;">
                        DNI: {{ $estudiante->dni }}
                    </span>
                </td>
            </tr>
        </table>
    </div>

    {{-- TÍTULO DE LA BOLETA --}}
    <div class="report-title">
        <h2>BOLETA OFICIAL DE NOTAS</h2>
        <h3>Consolidado de Evaluación Académica - Periodo {{ $periodo->nombre }}</h3>
    </div>

    {{-- I. DATOS INSTITUCIONALES Y UBICACIÓN --}}
    <div class="section-title">I. DATOS DEL INSTITUTO</div>
    <table class="info-table">
        <tr>
            <td class="info-label">Nombre del Instituto</td>
            <td class="info-value">{{ $instituto->nombre ?? 'No disponible' }}</td>
            <td class="info-label">DRE</td>
            <td class="info-value">{{ $instituto->dre ?? 'No disponible' }}</td>
        </tr>
        <tr>
            <td class="info-label">Código Modular</td>
            <td class="info-value">{{ $instituto->codigo_modular ?? 'No disponible' }}</td>
            <td class="info-label">Teléfono</td>
            <td class="info-value">{{ $instituto->telefono ?? 'No registrado' }}</td>
        </tr>
        <tr>
            <td class="info-label">Departamento</td>
            <td class="info-value">
                {{ $instituto->distrito?->provincia?->departamento?->Departamento ?? $instituto->distrito?->provincia?->departamento?->nombre ?? 'No asignado' }}
            </td>
            <td class="info-label">Provincia</td>
            <td class="info-value">
                {{ $instituto->distrito?->provincia?->Provincia ?? $instituto->distrito?->provincia?->nombre ?? 'No asignado' }}
            </td>
        </tr>
        <tr>
            <td class="info-label">Distrito</td>
            <td class="info-value">
                {{ $instituto->distrito?->nombre ?? $instituto->distrito?->Distrito ?? 'No asignado' }}
            </td>
            <td class="info-label">Dirección</td>
            <td class="info-value">{{ $instituto->direccion ?? 'No registrada' }}</td>
        </tr>
    </table>

    {{-- II. DATOS DEL ESTUDIANTE --}}
    <div class="section-title">II. DATOS DEL ESTUDIANTE Y PERIODO</div>
    <table class="info-table">
        <tr>
            <td class="info-label">Estudiante</td>
            <td class="info-value" colspan="3">
                <strong>{{ $estudiante->apellidos }}, {{ $estudiante->nombres }}</strong>
            </td>
        </tr>
        <tr>
            <td class="info-label">DNI / Documento</td>
            <td class="info-value"><strong>{{ $estudiante->dni }}</strong></td>
            <td class="info-label">Periodo Lectivo</td>
            <td class="info-value"><strong>{{ $periodo->nombre }}</strong></td>
        </tr>
        <tr>
            <td class="info-label">Fecha de Emisión</td>
            <td class="info-value">{{ date('d/m/Y') }}</td>
            <td class="info-label">Condición Estudiante</td>
            <td class="info-value">{{ $estudiante->grado ?? 'Estudiante Regular' }}</td>
        </tr>
    </table>

    {{-- III. RENDIMIENTO ACADÉMICO / ASIGNATURAS --}}
    <div class="section-title">III. RENDIMIENTO ACADÉMICO Y NOTAS REGISTRADAS</div>
    <table class="notes-table">
        <thead>
            <tr>
                <th style="width: 25px;">N°</th>
                <th class="student-col">Asignatura / Unidad Didáctica</th>
                <th style="width: 65px;">Créditos</th>
                <th style="width: 80px;">Condición</th>
                <th style="width: 90px;">Promedio Final</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($cursos as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td class="student-col">
                        <strong>{{ $item['nombre'] }}</strong>
                    </td>
                    <td>{{ number_format($item['creditos'], 2) }}</td>
                    <td>
                        <span class="badge-estado">{{ $item['estado'] ?? 'Inscrito' }}</span>
                    </td>
                    <td style="font-size: 10px;">
                        @if(is_numeric($item['promedio']))
                            <span class="{{ $item['promedio'] >= 13 ? 'nota-aprobada' : 'nota-desaprobada' }}">
                                {{ number_format($item['promedio'], 1) }}
                            </span>
                        @else
                            <span style="color: #666; font-weight: normal;">{{ $item['promedio'] }}</span>
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="5" style="padding: 12px; color: #666;">
                        No existen asignaturas inscritas para el presente periodo lectivo.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    {{-- FIRMAS REGULATORIAS --}}
    <table class="footer-signatures">
        <tr>
            <td width="50%">
                <div class="signature-box">
                    Firma del Estudiante<br>
                    <strong>DNI: {{ $estudiante->dni }}</strong>
                </div>
            </td>
            <td width="50%">
                <div class="signature-box">
                    V°B° Dirección Académica / Secretaría<br>
                    <strong>{{ $instituto->nombre ?? 'SGA' }}</strong>
                </div>
            </td>
        </tr>
    </table>

    <div class="footer">
        Boleta oficial expedida el {{ date('d/m/Y - H:i') }} | Sistema de Gestión Académica
    </div>

</body>
</html>