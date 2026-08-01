<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Asistencia</title>
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

        .att-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            font-size: 8.5px;
            table-layout: fixed;
        }

        .att-table th,
        .att-table td {
            border: 1px solid #bfc7d4;
            padding: 4px 2px;
            text-align: center;
            word-wrap: break-word;
        }

        .att-table th {
            background: #dfe8f7;
            font-weight: bold;
            color: #0f2557;
            font-size: 8px;
            text-transform: uppercase;
        }

        .num-col { width: 25px; }
        .dni-col { width: 65px; }
        .student-col { text-align: left; padding-left: 4px; font-weight: bold; }

        .st-p { color: #15803d; font-weight: bold; } /* Presente */
        .st-f { color: #dc2626; font-weight: bold; } /* Falta */
        .st-t { color: #d97706; font-weight: bold; } /* Tardanza */
        .st-j { color: #0284c7; font-weight: bold; } /* Justificado */

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
                    @if($instituto && isset($instituto->logo) && file_exists(public_path('storage/' . $instituto->logo)))
                        <img class="logo-img" src="{{ public_path('storage/' . $instituto->logo) }}" alt="Logo">
                    @endif
                </td>
                <td class="title-cell">
                    <p class="inst-title">{{ $instituto->nombre ?? 'INSTITUTO DE EDUCACIÓN SUPERIOR' }}</p>
                    <p class="inst-subtitle">Código Modular: {{ $instituto->codigo_modular ?? '---' }}</p>
                    <p class="inst-subtitle">{{ $instituto->direccion ?? '' }}</p>
                </td>
                <td style="width: 100px;"></td>
            </tr>
        </table>
    </div>

    {{-- TITULO DE REPORTE --}}
    <div class="report-title">
        <h2>Reporte Consolidado de Asistencias</h2>
        <h3>Unidad Didáctica: {{ $curso->nombre ?? 'No disponible' }}</h3>
    </div>

    {{-- DATOS DEL INSTITUTO --}}
    <div class="section-title">DATOS DEL INSTITUTO Y CURSO</div>
    <table class="info-table">
        <tr>
            <td class="info-label">Programa de Estudio</td>
            <td class="info-value">{{ $planEstudio->nombre ?? 'No asignado' }}</td>
            <td class="info-label">Periodo Lectivo</td>
            <td class="info-value">{{ $periodo->nombre ?? 'N/A' }}</td>
        </tr>
        <tr>
            <td class="info-label">Sección / Turno</td>
            <td class="info-value">SECCIÓN {{ $seccion->nombre ?? 'A' }}</td>
            <td class="info-label">Periodo Académico</td>
            <td class="info-value">{{ $curso->semestre?->nombre ?? 'I' }}</td>
        </tr>
        <tr>
            <td class="info-label">Docente</td>
            <td class="info-value">{{ $nombreDocente }}</td>
            <td class="info-label">Modalidad</td>
            <td class="info-value">Presencial</td>
        </tr>
    </table>

    {{-- MATRIZ DE ASISTENCIA POR SESIÓN --}}
    <div class="section-title">CONTROL DE ASISTENCIA POR SESIÓN</div>
    <table class="att-table">
        <thead>
            <tr>
                <th class="num-col">N°</th>
                <th class="dni-col">DNI / CÓD.</th>
                <th class="student-col">Estudiante</th>
                @foreach ($sesiones as $idx => $s)
                    <th>
                        S{{ $idx + 1 }}<br>
                        <span style="font-size: 7px; font-weight: normal;">{{ date('d/m', strtotime($s->fecha)) }}</span>
                    </th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse ($estudiantes as $index => $est)
                <tr>
                    <td class="num-col">{{ $index + 1 }}</td>
                    <td class="dni-col">{{ $est['codigo'] }}</td>
                    <td class="student-col">{{ $est['nombre_completo'] }}</td>

                    @foreach ($sesiones as $s)
                        @php
                            $registro = $asistencias->where('sesion_id', $s->id_sesion)
                                                   ->where('matricula_curso_id', $est['matricula_curso_id'])
                                                   ->first();
                            $estado = $registro?->estado;
                        @endphp
                        <td>
                            @if($estado === 'presente')
                                <span class="st-p">P</span>
                            @elseif($estado === 'falta')
                                <span class="st-f">F</span>
                            @elseif($estado === 'tardanza')
                                <span class="st-t">T</span>
                            @elseif($estado === 'justificado')
                                <span class="st-j">J</span>
                            @else
                                -
                            @endif
                        </td>
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td colspan="50" style="padding: 10px; color: #666;">
                        No se encontraron estudiantes matriculados en esta sección.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    {{-- LEYENDA Y FIRMAS --}}
    <div style="margin-top: 10px; font-size: 8px; color: #444;">
        <strong>Leyenda:</strong>
        <span class="st-p">P</span> = Presente |
        <span class="st-t">T</span> = Tardanza |
        <span class="st-f">F</span> = Falta |
        <span class="st-j">J</span> = Justificado
    </div>

    <table class="footer-signatures">
        <tr>
            <td width="50%">
                <div class="signature-box">
                    Docente Responsable del Curso<br>
                    <strong>{{ $nombreDocente }}</strong>
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