<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Notas</title>
    <style>
        /* ORIENTACIÓN HORIZONTAL (LANDSCAPE) */
        @page {
            size: a4 landscape;
            margin: 14px 18px 16px 18px;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 8.5px;
            color: #222;
            margin: 0;
            padding: 0;
        }

        .header {
            width: 100%;
            border-bottom: 2px solid #1f3c88;
            padding-bottom: 5px;
            margin-bottom: 6px;
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
            max-width: 120px;
            max-height: 55px;
        }

        .title-cell {
            text-align: center;
        }

        .inst-title {
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            color: #1f3c88;
            margin: 0;
        }

        .inst-subtitle {
            font-size: 8.5px;
            margin: 2px 0;
            color: #444;
        }

        .report-title {
            text-align: center;
            margin: 4px 0 6px 0;
        }

        .report-title h2 {
            font-size: 12px;
            margin: 0;
            text-transform: uppercase;
            color: #1f3c88;
        }

        .report-title h3 {
            font-size: 9.5px;
            margin: 2px 0 0 0;
            font-weight: normal;
            color: #333;
        }

        .section-title {
            background: #1f3c88;
            color: #fff;
            padding: 3px 6px;
            font-size: 8.5px;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 5px;
            margin-bottom: 0;
        }

        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 4px;
        }

        .info-table td {
            border: 1px solid #cfd6e4;
            padding: 3px 6px;
            vertical-align: middle;
            font-size: 8px;
        }

        .info-label {
            width: 16%;
            background: #eef3fb;
            font-weight: bold;
            color: #1f3c88;
        }

        .info-value {
            width: 34%;
            color: #222;
        }

        /* TABLA DE CALIFICACIONES */
        .notes-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
            font-size: 8px;
        }

        .notes-table th,
        .notes-table td {
            border: 1px solid #bfc7d4;
            padding: 4px 2px;
            text-align: center;
            vertical-align: middle;
        }

        .notes-table th {
            background: #dfe8f7;
            font-weight: bold;
            color: #0f2557;
            font-size: 7.5px;
            text-transform: uppercase;
        }

        .notes-table .num-col {
            width: 22px;
        }

        .notes-table .dni-col {
            width: 58px;
            color: #555;
            font-size: 7.5px;
        }

        /* COLUMNA DE ESTUDIANTE: NUNCA SE CORTA */
        .notes-table .student-col {
            width: 220px;
            text-align: left;
            padding-left: 6px;
            padding-right: 4px;
            font-weight: bold;
            font-size: 8px;
            line-height: 1.2;
            white-space: normal !important;
            word-wrap: break-word !important;
            word-break: break-word !important;
        }

        .notes-table .prom-col {
            width: 55px;
            background: #bae6fd;
            color: #1f3c88;
            font-weight: bold;
        }

        .notes-table tbody tr:nth-child(even) {
            background: #f8fafc;
        }

        .promedio-logro {
            background: #fef3c7;
            font-weight: bold;
        }

        .promedio-final {
            font-weight: bold;
            background: #e0f2fe;
            color: #1f3c88;
            font-size: 9px;
        }

        .text-desaprobado {
            color: #dc2626 !important;
            font-weight: bold;
        }

        /* LEYENDA */
        .leyenda-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            font-size: 7.5px;
        }

        .leyenda-table td {
            border: 1px solid #cfd6e4;
            padding: 3px 6px;
            vertical-align: top;
        }

        .leyenda-title {
            background: #f1f5f9;
            font-weight: bold;
            width: 75px;
            color: #1f3c88;
            text-align: center;
        }

        /* FIRMAS */
        .footer-signatures {
            width: 100%;
            margin-top: 25px;
            border-collapse: collapse;
        }

        .signature-box {
            width: 220px;
            border-top: 1px solid #666;
            text-align: center;
            padding-top: 4px;
            font-size: 8px;
            color: #444;
            margin: 0 auto;
        }

        .footer {
            margin-top: 8px;
            font-size: 7.5px;
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
                <td style="width: 120px;"></td>
            </tr>
        </table>
    </div>

    {{-- TITULO DEL REPORTE --}}
    <div class="report-title">
        <h2>Reporte de Notas</h2>
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

    {{-- DETALLE DE CALIFICACIONES --}}
    <div class="section-title">DETALLE DE CALIFICACIONES</div>
    <table class="notes-table">
        <thead>
            @if(count($logros) > 0)
                <tr>
                    <th class="num-col" rowspan="2">N°</th>
                    <th class="dni-col" rowspan="2">DNI / CÓD.</th>
                    <th class="student-col" rowspan="2">APELLIDOS Y NOMBRES</th>
                    @foreach ($logros as $idx => $logro)
                        @php $subCount = count($logro->subcomponentes); @endphp
                        <th colspan="{{ $subCount > 0 ? $subCount + 1 : 1 }}" style="background: #e2e8f0; border-left: 2px solid #94a3b8;">
                            LOGRO {{ $idx + 1 }}
                        </th>
                    @endforeach
                    <th class="prom-col" rowspan="2">Promedio Final</th>
                </tr>
                <tr>
                    @foreach ($logros as $logro)
                        @if(count($logro->subcomponentes) > 0)
                            @foreach($logro->subcomponentes as $sub)
                                <th title="{{ $sub->nombre }}">
                                    {{ Str::limit($sub->nombre, 7, '.') }}<br>({{ (float)$sub->peso }}%)
                                </th>
                            @endforeach
                            <th style="background: #fde68a; width: 34px;">PROM.</th>
                        @else
                            <th style="width: 36px;">NOTA</th>
                        @endif
                    @endforeach
                </tr>
            @else
                <tr>
                    <th class="num-col">N°</th>
                    <th class="dni-col">DNI / CÓD.</th>
                    <th class="student-col">APELLIDOS Y NOMBRES</th>
                    <th class="prom-col">Promedio Final</th>
                </tr>
            @endif
        </thead>
        <tbody>
            @forelse ($estudiantes as $index => $est)
                @php
                    $finalRecord = $notasFinales->where('estudiante_id', $est['estudiante_id'])->first();
                    $promFinal = $finalRecord?->promedio;
                @endphp
                <tr>
                    <td class="num-col">{{ $index + 1 }}</td>
                    <td class="dni-col">{{ $est['codigo'] }}</td>
                    <td class="student-col">{{ $est['nombre_completo'] }}</td>

                    @foreach ($logros as $logro)
                        @if(count($logro->subcomponentes) > 0)
                            @foreach($logro->subcomponentes as $sub)
                                @php
                                    $nSub = $notasSubcomponentes->where('estudiante_id', $est['estudiante_id'])
                                                                ->where('subcomponente_id', $sub->id)
                                                                ->first()?->nota;
                                @endphp
                                <td class="{{ $nSub !== null && $nSub < 13 ? 'text-desaprobado' : '' }}">
                                    {{ $nSub !== null ? number_format($nSub, 1) : '-' }}
                                </td>
                            @endforeach
                            @php
                                $nLog = $notasLogros->where('estudiante_id', $est['estudiante_id'])
                                                    ->where('logro_curso_id', $logro->id)
                                                    ->first()?->nota;
                            @endphp
                            <td class="promedio-logro {{ $nLog !== null && $nLog < 13 ? 'text-desaprobado' : '' }}">
                                {{ $nLog !== null ? number_format($nLog, 1) : '-' }}
                            </td>
                        @else
                            @php
                                $nLog = $notasLogros->where('estudiante_id', $est['estudiante_id'])
                                                    ->where('logro_curso_id', $logro->id)
                                                    ->first()?->nota;
                            @endphp
                            <td class="{{ $nLog !== null && $nLog < 13 ? 'text-desaprobado' : '' }}">
                                {{ $nLog !== null ? number_format($nLog, 1) : '-' }}
                            </td>
                        @endif
                    @endforeach

                    <td class="promedio-final prom-col {{ $promFinal !== null && $promFinal < 13 ? 'text-desaprobado' : '' }}">
                        {{ $promFinal !== null ? round($promFinal) : '-' }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="30" style="padding: 10px; color: #666;">
                        No hay estudiantes registrados en este curso.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    {{-- DESCRIPCIÓN DE INDICADORES / LOGROS DE APRENDIZAJE --}}
    @if(count($logros) > 0)
        <div class="section-title" style="margin-top: 8px;">DESCRIPCIÓN DE INDICADORES / LOGROS DE APRENDIZAJE</div>
        <table class="leyenda-table">
            @foreach ($logros as $idx => $logro)
                <tr>
                    <td class="leyenda-title">LOGRO {{ $idx + 1 }}</td>
                    <td>
                        <strong>{{ $logro->nombre }}:</strong>
                        <span style="color: #555;">{{ $logro->descripcion ?? 'Sin descripción adicional.' }}</span>
                    </td>
                </tr>
            @endforeach
        </table>
    @endif

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
        Documento generado automáticamente el {{ date('d/m/Y - H:i') }} | Sistema de Gestión Académica
    </div>

</body>
</html>