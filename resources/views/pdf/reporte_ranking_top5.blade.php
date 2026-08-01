<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Ranking - Top 5</title>
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

        .notes-table .puesto-col {
            width: 60px;
            font-weight: bold;
        }

        .notes-table .dni-col {
            width: 90px;
            color: #555;
        }

        .notes-table .student-col {
            text-align: left;
            padding-left: 8px;
        }

        .notes-table .prom-col {
            width: 110px;
        }

        .notes-table tbody tr:nth-child(even) {
            background: #f7f9fc;
        }

        .promedio-final {
            font-weight: bold;
            background: #e0f2fe;
            color: #1f3c88;
            font-size: 10px;
        }

        /* Estilos de Insignias de Mérito */
        .badge-puesto {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 9px;
        }

        .puesto-1 { background-color: #fef08a; color: #854d0e; border: 1px solid #fde047; } /* Oro */
        .puesto-2 { background-color: #e2e8f0; color: #334155; border: 1px solid #cbd5e1; } /* Plata */
        .puesto-3 { background-color: #ffedd5; color: #9a3412; border: 1px solid #fed7aa; } /* Bronce */
        .puesto-otros { background-color: #f1f5f9; color: #475569; }

        .text-desaprobado {
            color: #dc2626 !important;
            font-weight: bold;
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
                    @elseif($instituto && isset($instituto->logo) && file_exists(public_path('storage/' . $instituto->logo)))
                        <img class="logo-img" src="{{ public_path('storage/' . $instituto->logo) }}" alt="Logo del Instituto">
                    @endif
                </td>
                <td class="title-cell">
                    <p class="inst-title">{{ $instituto->nombre ?? $instituto['nombre'] ?? 'INSTITUTO EDUCATIVO' }}</p>
                    <p class="inst-subtitle">
                        Código Modular: {{ $instituto->codigo_modular ?? $instituto['codigo_modular'] ?? '---' }}
                    </p>
                    <p class="inst-subtitle">
                        {{ $instituto->direccion ?? $instituto['direccion'] ?? '' }}
                        @if(!empty($instituto->telefono ?? $instituto['telefono'] ?? null))
                            | Teléfono: {{ $instituto->telefono ?? $instituto['telefono'] }}
                        @endif
                    </p>
                </td>
                <td style="width: 100px;"></td>
            </tr>
        </table>
    </div>

    {{-- TITULO DEL REPORTE --}}
    <div class="report-title">
        <h2>CUADRO DE MÉRITO - TOP 5</h2>
        <h3>Unidad Didáctica: {{ $curso->nombre ?? $curso_info['curso'] ?? 'No disponible' }}</h3>
    </div>

    {{-- DATOS DEL INSTITUTO --}}
    <div class="section-title">DATOS DEL INSTITUTO</div>
    <table class="info-table">
        <tr>
            <td class="info-label">Nombre del IEST/IES/EEST</td>
            <td class="info-value">{{ $instituto->nombre ?? $instituto['nombre'] ?? 'No disponible' }}</td>
            <td class="info-label">DRE</td>
            <td class="info-value">{{ $instituto->dre ?? $instituto['dre'] ?? 'No disponible' }}</td>
        </tr>
        <tr>
            <td class="info-label">Código Modular</td>
            <td class="info-value">{{ $instituto->codigo_modular ?? $instituto['codigo_modular'] ?? 'No disponible' }}</td>
            <td class="info-label">Tipo de Gestión</td>
            <td class="info-value">Pública</td>
        </tr>
        <tr>
            <td class="info-label">Departamento</td>
            <td class="info-value">
                {{ $instituto->distrito?->provincia?->departamento?->nombre ?? $departamento->Departamento ?? 'No disponible' }}
            </td>
            <td class="info-label">Provincia</td>
            <td class="info-value">
                {{ $instituto->distrito?->provincia?->nombre ?? $provincia->Provincia ?? 'No disponible' }}
            </td>
        </tr>
        <tr>
            <td class="info-label">Distrito</td>
            <td class="info-value">
                {{ $instituto->distrito?->nombre ?? $distrito->Distrito ?? 'No disponible' }}
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
            <td class="info-value">{{ $curso->carrera?->nombre ?? $curso_info['carrera'] ?? 'No disponible' }}</td>
            <td class="info-label">Periodo Lectivo</td>
            <td class="info-value">{{ $periodo->nombre ?? $curso_info['periodo'] ?? 'No disponible' }}</td>
        </tr>
        <tr>
            <td class="info-label">Sección / Turno</td>
            <td class="info-value">SECCIÓN {{ $seccion->nombre ?? 'A' }}</td>
            <td class="info-label">Periodo Académico</td>
            <td class="info-value">{{ $curso->semestre?->nombre ?? $curso_info['semestre'] ?? 'No disponible' }}</td>
        </tr>
        <tr>
            <td class="info-label">Nivel Formativo</td>
            <td class="info-value">Profesional Técnico</td>
            <td class="info-label">Docente</td>
            <td class="info-value">{{ $nombreDocente ?? $curso_info['docente'] ?? auth()->user()->name }}</td>
        </tr>
    </table>

    {{-- TABLA RANKING TOP 5 ESTUDIANTES --}}
    <div class="section-title">ESTUDIANTES DESTACADOS</div>
    <table class="notes-table">
        <thead>
            <tr>
                <th class="puesto-col">Puesto</th>
                <th class="dni-col">DNI / CÓD.</th>
                <th class="student-col">Estudiante</th>
                <th class="prom-col" style="background: #bae6fd; color: #1f3c88;">Promedio Final</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($topEstudiantes as $index => $est)
                @php
                    $puesto = $index + 1;
                    $badgeClass = match($puesto) {
                        1 => 'puesto-1',
                        2 => 'puesto-2',
                        3 => 'puesto-3',
                        default => 'puesto-otros',
                    };
                @endphp
                <tr>
                    <td class="puesto-col">
                        <span class="badge-puesto {{ $badgeClass }}">
                            N° {{ $puesto }}
                        </span>
                    </td>
                    <td class="dni-col">{{ $est['codigo'] }}</td>
                    <td class="student-col">
                        <strong>{{ $est['nombre_completo'] }}</strong>
                    </td>
                    <td class="promedio-final prom-col {{ $est['promedio'] < 11 ? 'text-desaprobado' : '' }}">
                        {{ number_format($est['promedio'], 2) }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="4" style="padding: 12px; color: #666;">
                        No hay registros suficientes para mostrar el ranking de estudiantes.
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
                    Docente Responsable del Curso<br>
                    <strong>{{ $nombreDocente ?? auth()->user()->name }}</strong>
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