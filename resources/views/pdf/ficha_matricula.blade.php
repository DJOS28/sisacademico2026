<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Ficha de Matrícula - {{ $matricula->codigo_matricula }}</title>
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
                        {{ $matricula->codigo_matricula }}
                    </span>
                </td>
            </tr>
        </table>
    </div>

    {{-- TÍTULO DE LA FICHA --}}
    <div class="report-title">
        <h2>FICHA OFICIAL DE MATRÍCULA</h2>
        <h3>Constancia de Asignación de Carga Horaria y Registro Lectivo</h3>
    </div>

    {{-- DATOS INSTITUCIONALES Y UBICACIÓN GEOGRÁFICA --}}
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

    {{-- DATOS DEL ESTUDIANTE Y PERIODO --}}
    <div class="section-title">II. DATOS DE LA MATRÍCULA Y ESTUDIANTE</div>
    <table class="info-table">
        <tr>
            <td class="info-label">Estudiante</td>
            <td class="info-value">
                <strong>{{ $matricula->postulante ? $matricula->postulante->nombres . ' ' . $matricula->postulante->apellidos : 'No asignado' }}</strong>
            </td>
            <td class="info-label">DNI / Doc.</td>
            <td class="info-value">{{ $matricula->postulante->dni ?? '---' }}</td>
        </tr>
        <tr>
            <td class="info-label">Plan de Estudios</td>
            <td class="info-value">{{ $matricula->planEstudio->nombre ?? '---' }}</td>
            <td class="info-label">Periodo Lectivo</td>
            <td class="info-value">{{ $matricula->periodo->nombre ?? '---' }}</td>
        </tr>
        <tr>
            <td class="info-label">Ciclo / Semestre</td>
            <td class="info-value">{{ $matricula->semestre->nombre ?? '---' }}</td>
            <td class="info-label">Fecha Matrícula</td>
            <td class="info-value">{{ $matricula->fecha_matricula ? \Carbon\Carbon::parse($matricula->fecha_matricula)->format('d/m/Y') : '---' }}</td>
        </tr>
        <tr>
            <td class="info-label">Estado Matrícula</td>
            <td class="info-value"><span class="badge-estado">{{ $matricula->estado }}</span></td>
            <td class="info-label">Condición Estudiante</td>
            <td class="info-value">{{ $matricula->postulante->grado ?? 'Estudiante' }}</td>
        </tr>
    </table>

    {{-- TABLA DETALLE DE ASIGNATURAS UNIFICADA --}}
    <div class="section-title">III. CARGA HORARIA / ASIGNATURAS REGISTRADAS</div>
    <table class="notes-table">
        <thead>
            <tr>
                <th style="width: 25px;">N°</th>
                <th class="student-col">Asignatura / Curso</th>
                <th style="width: 50px;">Sección</th>
                <th style="width: 55px;">Turno</th>
                <th style="width: 130px;">Docente</th>
                <th style="width: 145px;">Horarios / Días</th>
                <th style="width: 60px;">Estado</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($cursosUnicos as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td class="student-col">
                        <strong>{{ $item['curso_nombre'] }}</strong>
                    </td>
                    <td>{{ $item['seccion'] }}</td>
                    <td>{{ $item['turno'] }}</td>
                    <td>{{ $item['docente'] }}</td>
                    <td style="font-size: 8px;">{{ $item['horarios'] }}</td>
                    <td>{{ $item['estado'] }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" style="padding: 12px; color: #666;">
                        No existen asignaturas inscritas en la presente matrícula.
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
                    <strong>DNI: {{ $matricula->postulante->dni ?? '---' }}</strong>
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
        Ficha oficial expedida el {{ date('d/m/Y - H:i') }} | Sistema de Gestión Académica
    </div>

</body>
</html>