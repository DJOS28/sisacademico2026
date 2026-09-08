<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Plan de Estudios - {{ $plan->codigo ?? $plan->nombre }}</title>
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
            font-size: 13px;
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
            text-transform: uppercase;
        }

        .info-value {
            width: 28%;
            color: #222;
        }

        .curriculum-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            font-size: 8.5px;
        }

        .curriculum-table th,
        .curriculum-table td {
            border: 1px solid #bfc7d4;
            padding: 4px 5px;
            text-align: center;
        }

        .curriculum-table th {
            background: #dfe8f7;
            font-weight: bold;
            color: #0f2557;
            text-transform: uppercase;
            font-size: 8.5px;
        }

        .curriculum-table .subject-col {
            text-align: left;
            padding-left: 6px;
            font-weight: bold;
        }

        .curriculum-table .module-col {
            text-align: left;
            padding-left: 6px;
            color: #444;
        }

        .cycle-header {
            background: #e9effa;
            color: #1f3c88;
            font-weight: bold;
            text-align: left;
            padding-left: 8px !important;
            text-transform: uppercase;
            font-size: 9px;
            border-top: 1.5px solid #1f3c88 !important;
        }

        .cycle-subtotal {
            background: #f8fafc;
            font-weight: bold;
            color: #334155;
        }

        .total-row {
            background: #1f3c88 !important;
            color: #ffffff !important;
            font-weight: bold;
            font-size: 9.5px;
        }

        .total-row td {
            border-color: #1f3c88 !important;
            color: #ffffff !important;
        }

        .footer-signatures {
            width: 100%;
            margin-top: 35px;
            border-collapse: collapse;
        }

        .signature-box {
            width: 210px;
            border-top: 1px solid #666;
            text-align: center;
            padding-top: 4px;
            font-size: 8.5px;
            color: #444;
            margin: 0 auto;
        }

        .footer {
            margin-top: 12px;
            font-size: 8px;
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
                        <img class="logo-img" src="{{ $imagenBase64 }}" alt="Logo">
                    @elseif($instituto && !empty($instituto->logo) && file_exists(public_path('storage/' . $instituto->logo)))
                        <img class="logo-img" src="{{ public_path('storage/' . $instituto->logo) }}" alt="Logo">
                    @endif
                </td>
                <td class="title-cell">
                    <p class="inst-title">{{ $instituto->nombre ?? 'INSTITUTO DE EDUCACIÓN SUPERIOR' }}</p>
                    <p class="inst-subtitle">
                        Código Modular: {{ $instituto->codigo_modular ?? '---' }}
                        @if(!empty($instituto->dre)) | DRE: {{ $instituto->dre }} @endif
                    </p>
                    <p class="inst-subtitle">
                        {{ $instituto->direccion ?? '' }}
                        @if(!empty($instituto->telefono)) | Tel: {{ $instituto->telefono }} @endif
                    </p>
                </td>
                <td style="width: 110px; text-align: right;">
                    <span style="font-size: 10px; font-weight: bold; color: #1f3c88;">
                        CÓDIGO:<br>{{ $plan->codigo ?? 'S/C' }}
                    </span>
                </td>
            </tr>
        </table>
    </div>

    {{-- TÍTULO DEL REPORTE --}}
    <div class="report-title">
        <h2>PLAN DE ESTUDIOS / MALLA CURRICULAR OFICIAL</h2>
        <h3>Estructura Curricular Aprobada</h3>
    </div>

    {{-- I. INFORMACIÓN GENERAL DEL PLAN --}}
    <div class="section-title">I. INFORMACIÓN DEL PROGRAMA ACADÉMICO</div>
    <table class="info-table">
        <tr>
            <td class="info-label">Plan de Estudios</td>
            <td class="info-value" colspan="3"><strong>{{ $plan->nombre }}</strong></td>
        </tr>
        <tr>
            <td class="info-label">Código del Plan Estudios</td>
            <td class="info-value"><strong>{{ $plan->codigo ?? '---' }}</strong></td>
            <td class="info-label">Resolución</td>
            <td class="info-value">{{ $plan->resolucion ?? 'Aprobado' }}</td>
        </tr>
        <tr>
            <td class="info-label">Régimen / Tipo</td>
            <td class="info-value">{{ $plan->tipo ?? 'Modular' }}</td>
            <td class="info-label">Fecha de Emisión</td>
            <td class="info-value">{{ date('d/m/Y') }}</td>
        </tr>
    </table>

    {{-- II. DETALLE DE ASIGNATURAS POR CICLO --}}
    <div class="section-title">II. DISTRIBUCIÓN DE ASIGNATURAS POR PERIODO LECTIVO</div>
    <table class="curriculum-table">
        <thead>
            <tr>
                <th style="width: 55px;">Código</th>
                <th style="width: 25px;">Ord.</th>
                <th class="subject-col">Asignatura / Unidad Didáctica</th>
                <th class="module-col">Módulo Formativo</th>
                <th style="width: 65px;">Tipo</th>
                <th style="width: 45px;">Créd.</th>
                <th style="width: 45px;">Horas</th>
            </tr>
        </thead>
        <tbody>
            @foreach($semestres as $sem)
                @php
                    $cursosCiclo = $cursosPorSemestre[$sem->id] ?? collect();
                    $totalCredCiclo = $cursosCiclo->sum('creditos');
                    $totalHorasCiclo = $cursosCiclo->sum('horas_semestrales');
                @endphp

                <tr>
                    <td colspan="7" class="cycle-header">PERIODO ACADÉMICO {{ $sem->nombre }}</td>
                </tr>

                @forelse($cursosCiclo as $idx => $curso)
                    <tr style="{{ $idx % 2 === 1 ? 'background-color: #fbfcfe;' : '' }}">
                        <td style="font-family: monospace; font-weight: bold; color: #1f3c88;">
                            CUR-{{ str_pad($curso->id, 3, '0', STR_PAD_LEFT) }}
                        </td>
                        <td>{{ $curso->orden ?? ($idx + 1) }}</td>
                        <td class="subject-col">{{ $curso->nombre }}</td>
                        <td class="module-col">
                            {{ $curso->moduloFormativo ? 'M'.$curso->moduloFormativo->num_modulo.': '.$curso->moduloFormativo->nombre : '---' }}
                        </td>
                        <td>{{ $curso->tipo }}</td>
                        <td style="font-weight: bold;">{{ number_format($curso->creditos, 1) }}</td>
                        <td>{{ $curso->horas_semestrales }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="7" style="color: #888; font-style: italic; padding: 6px;">
                            Sin asignaturas registradas en este ciclo
                        </td>
                    </tr>
                @endforelse

                @if($cursosCiclo->count() > 0)
                    <tr class="cycle-subtotal">
                        <td colspan="5" style="text-align: right; text-transform: uppercase; font-size: 8px;">
                            Subtotal Ciclo {{ $sem->nombre }}:
                        </td>
                        <td>{{ number_format($totalCredCiclo, 1) }}</td>
                        <td>{{ $totalHorasCiclo }}</td>
                    </tr>
                @endif
            @endforeach

            {{-- TOTAL GENERAL --}}
            <tr class="total-row">
                <td colspan="5" style="text-align: right; text-transform: uppercase; padding: 6px;">
                    TOTAL GENERAL DEL PLAN ({{ $totales['total_cursos'] }} ASIGNATURAS):
                </td>
                <td>{{ number_format($totales['total_creditos'], 1) }}</td>
                <td>{{ $totales['total_horas'] }}</td>
            </tr>
        </tbody>
    </table>

    {{-- FIRMAS INSTITUCIONALES --}}
    <table class="footer-signatures">
        <tr>
            <td width="50%">
                <div class="signature-box">
                    Coordinación Académica<br>
                    <strong>{{ $instituto->nombre ?? 'SGA' }}</strong>
                </div>
            </td>
            <td width="50%">
                <div class="signature-box">
                    Dirección General / Secretaría Académica<br>
                    <strong>{{ $instituto->nombre ?? 'SGA' }}</strong>
                </div>
            </td>
        </tr>
    </table>

    <div class="footer">
        Documento oficial emitido el {{ date('d/m/Y - H:i') }} | Sistema de Gestión Académica
    </div>

</body>
</html>