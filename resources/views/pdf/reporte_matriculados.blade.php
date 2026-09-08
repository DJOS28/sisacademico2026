<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Nómina de Estudiantes Matriculados</title>
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
            font-size: 15px;
            font-weight: bold;
            text-transform: uppercase;
            color: #1f3c88;
            margin: 0;
        }

        .inst-subtitle {
            font-size: 10px;
            margin: 2px 0;
            color: #444;
        }

        .report-title {
            text-align: center;
            margin: 10px 0;
        }

        .report-title h2 {
            font-size: 15px;
            margin: 0;
            text-transform: uppercase;
            color: #1f3c88;
        }

        .report-title h3 {
            font-size: 11px;
            margin: 4px 0 0 0;
            font-weight: normal;
            color: #333;
        }

        .section-title {
            background: #1f3c88;
            color: #fff;
            padding: 5px 8px;
            font-size: 11px;
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
            border: 1px solid #cfd6e4;
            padding: 5px 7px;
            vertical-align: middle;
            font-size: 9.5px;
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
            font-size: 9.5px;
            table-layout: fixed;
        }

        .notes-table th,
        .notes-table td {
            border: 1px solid #bfc7d4;
            padding: 6px 4px;
            text-align: center;
            word-wrap: break-word;
        }

        .notes-table th {
            background: #dfe8f7;
            font-weight: bold;
            color: #0f2557;
            font-size: 9px;
            text-transform: uppercase;
        }

        .notes-table .num-col {
            width: 40px;
            font-weight: bold;
            color: #1f3c88;
        }

        .notes-table .dni-col {
            width: 110px;
            color: #333;
            font-family: monospace;
            font-size: 10px;
        }

        .notes-table .student-col {
            text-align: left;
            padding-left: 10px;
        }

        .notes-table tbody tr:nth-child(even) {
            background: #f7f9fc;
        }

        .footer-signatures {
            width: 100%;
            margin-top: 40px;
            border-collapse: collapse;
        }

        .signature-box {
            width: 200px;
            border-top: 1px solid #666;
            text-align: center;
            padding-top: 4px;
            font-size: 9px;
            color: #444;
            margin: 0 auto;
        }

        .footer {
            margin-top: 15px;
            font-size: 8.5px;
            color: #666;
            text-align: right;
        }
    </style>
</head>
<body>

    {{-- ENCABEZADO CON LOGO --}}
    <div class="header">
        <table class="header-table">
            <tr>
                <td class="logo-cell">
                    @if(!empty($imagenBase64))
                        <img class="logo-img" src="{{ $imagenBase64 }}" alt="Logo del Instituto">
                    @elseif(isset($instituto->logo) && file_exists(public_path('storage/' . $instituto->logo)))
                        <img class="logo-img" src="{{ public_path('storage/' . $instituto->logo) }}" alt="Logo del Instituto">
                    @endif
                </td>
                <td class="title-cell">
                    <p class="inst-title">{{ $instituto->nombre ?? 'INSTITUTO EDUCATIVO' }}</p>
                    <p class="inst-subtitle">
                        Código Modular: {{ $instituto->codigo_modular ?? '---' }}
                    </p>
                    <p class="inst-subtitle">
                        {{ $instituto->direccion ?? '' }}
                        @if(!empty($instituto->telefono))
                            | Teléfono: {{ $instituto->telefono }}
                        @endif
                    </p>
                </td>
                <td style="width: 100px;"></td>
            </tr>
        </table>
    </div>

    {{-- TÍTULO DEL REPORTE --}}
    <div class="report-title">
        <h2>NÓMINA DE ESTUDIANTES MATRICULADOS</h2>
        <h3>Plan de Estudios: {{ $plan->nombre ?? 'No disponible' }} ({{ $plan->codigo ?? '' }})</h3>
    </div>

    {{-- DATOS DEL INSTITUTO --}}
    <div class="section-title">DATOS DEL INSTITUTO</div>
    <table class="info-table">
        <tr>
            <td class="info-label">Nombre del IEST/IES/EEST</td>
            <td class="info-value">{{ $instituto->nombre ?? 'No disponible' }}</td>
            <td class="info-label">DRE</td>
            <td class="info-value">{{ $instituto->dre ?? 'No disponible' }}</td>
        </tr>
        <tr>
            <td class="info-label">Código Modular</td>
            <td class="info-value">{{ $instituto->codigo_modular ?? 'No disponible' }}</td>
            <td class="info-label">Tipo de Gestión</td>
            <td class="info-value">Pública</td>
        </tr>
        <tr>
            <td class="info-label">Departamento</td>
            <td class="info-value">
                {{ $instituto->distrito?->provincia?->departamento?->nombre ?? 'No disponible' }}
            </td>
            <td class="info-label">Provincia</td>
            <td class="info-value">
                {{ $instituto->distrito?->provincia?->nombre ?? 'No disponible' }}
            </td>
        </tr>
        <tr>
            <td class="info-label">Distrito</td>
            <td class="info-value">
                {{ $instituto->distrito?->nombre ?? 'No disponible' }}
            </td>
            <td class="info-label">Modalidad</td>
            <td class="info-value">Presencial</td>
        </tr>
    </table>

    {{-- DATOS ACADÉMICOS --}}
    <div class="section-title">DATOS ACADÉMICOS</div>
    <table class="info-table">
        <tr>
            <td class="info-label">Programa de Estudio</td>
            <td class="info-value">{{ $plan->nombre ?? 'No disponible' }}</td>
            <td class="info-label">Periodo Lectivo</td>
            <td class="info-value">{{ $periodo->nombre ?? 'No disponible' }}</td>
        </tr>
        <tr>
            <td class="info-label">Sección / Turno</td>
            <td class="info-value">SECCIÓN A</td>
            <td class="info-label">Periodo Académico</td>
            <td class="info-value">{{ $semestre->nombre ?? 'No disponible' }}</td>
        </tr>
        <tr>
            <td class="info-label">Nivel Formativo</td>
            <td class="info-value">Profesional Técnico</td>
            <td class="info-label">Usuario Emisor</td>
            <td class="info-value">{{ auth()->user()->username ?? auth()->user()->name ?? 'Sistema' }}</td>
        </tr>
    </table>

    {{-- TABLA LISTA DE MATRICULADOS --}}
    <div class="section-title">RELACIÓN DE ALUMNOS MATRICULADOS ({{ count($estudiantes) }})</div>
    <table class="notes-table">
        <thead>
            <tr>
                <th class="num-col">N°</th>
                <th class="dni-col">DNI / CÓDIGO</th>
                <th class="student-col">Apellidos y Nombres</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($estudiantes as $index => $est)
                <tr>
                    <td class="num-col">{{ $index + 1 }}</td>
                    <td class="dni-col">{{ $est['codigo'] }}</td>
                    <td class="student-col">
                        <strong>{{ $est['nombre_completo'] }}</strong>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="3" style="padding: 12px; color: #666; text-align: center;">
                        No se encontraron estudiantes matriculados en este ciclo y periodo.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    {{-- FIRMAS --}}
    <table class="footer-signatures">
        <tr>
            <td width="50%">
                <div class="signature-box">
                    Responsable de Registro y Actas<br>
                    <strong>{{ auth()->user()->name ?? auth()->user()->username }}</strong>
                </div>
            </td>
            <td width="50%">
                <div class="signature-box">
                    V°B° Dirección Académica / Secretaría
                </div>
            </td>
        </tr>
    </table>

    <div class="footer">
        Documento generado automáticamente el {{ date('d/m/Y - H:i') }}
    </div>

</body>
</html>