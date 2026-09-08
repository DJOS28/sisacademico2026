@php
use Carbon\Carbon;
$anioActual = Carbon::now()->year;
@endphp

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Registro Auxiliar de Evaluación</title>
    <style>
        @page {
            size: a4 landscape;
            margin: 12px 15px 12px 15px;
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 8px;
            color: #222;
            margin: 0;
            padding: 0;
        }

        /* TABLA CONTENEDORA DEL TRÍPTICO */
        .triptico-container {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .triptico-container > tbody > tr > td {
            vertical-align: top;
            padding: 0 5px;
        }

        /* PROPORCIONES */
        .col-asistencia {
            width: 44%;
        }

        .col-logros {
            width: 20%;
        }

        .col-portada {
            width: 36%;
            border-left: 1.5px dashed #cbd5e1;
            padding-left: 18px !important;
            padding-right: 4px !important;
        }

        .section-header {
            background-color: #1f3c88;
            color: #ffffff;
            font-size: 8.5px;
            font-weight: bold;
            text-align: center;
            padding: 4px;
            text-transform: uppercase;
            margin-bottom: 5px;
            border-radius: 2px;
        }

        /* TABLA DE ASISTENCIA */
        .tabla-asistencia {
            width: 100%;
            border-collapse: collapse;
            font-size: 7px;
            table-layout: fixed;
        }

        .tabla-asistencia th,
        .tabla-asistencia td {
            border: 1px solid #94a3b8;
            text-align: center;
            padding: 1.5px 0.5px;
            height: 14px;
        }

        .tabla-asistencia th {
            background-color: #f1f5f9;
            color: #0f2557;
            font-weight: bold;
        }

        .asistencia-num {
            width: 16px;
        }

        .asistencia-fecha {
            font-size: 6px;
            letter-spacing: -0.3px;
        }

        .asistencia-tot {
            width: 18px;
            background-color: #f8fafc;
            font-weight: bold;
        }

        .asistencia-porc {
            width: 22px;
            background-color: #f8fafc;
            font-weight: bold;
        }

        /* TABLA DE LOGROS */
        .tabla-logros {
            width: 100%;
            border-collapse: collapse;
            font-size: 7.5px;
        }

        .tabla-logros th,
        .tabla-logros td {
            border: 1px solid #94a3b8;
            padding: 4px 5px;
            text-align: left;
        }

        .tabla-logros th {
            background-color: #f1f5f9;
            color: #0f2557;
            font-weight: bold;
            text-align: center;
        }

        .tabla-logros .num {
            width: 18px;
            text-align: center;
            font-weight: bold;
        }

        /* ================================================================= */
        /* PORTADA E INFORMACIÓN DEL CURSO (MÁXIMO ESPACIADO Y ALTURA)       */
        /* ================================================================= */
        .portada-box {
            text-align: center;
            padding-top: 4px;
        }

        .portada-logo {
            max-width: 120px;
            max-height: 55px;
            margin-bottom: 10px;
        }

        .portada-titulo-inst {
            font-size: 11.5px;
            font-weight: bold;
            color: #1f3c88;
            text-transform: uppercase;
            margin: 0 0 10px 0;
            line-height: 1.3;
        }

        .portada-badge {
            display: inline-block;
            background-color: #1f3c88;
            color: #ffffff;
            font-size: 9px;
            font-weight: bold;
            padding: 4px 14px;
            margin: 0 0 14px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-radius: 3px;
        }

        .portada-curso {
            background-color: #f0f9ff;
            border: 1.5px solid #38bdf8;
            padding: 12px 14px;
            margin: 0 0 16px 0;
            border-radius: 4px;
            text-align: center;
        }

        .portada-curso-label {
            font-size: 8px;
            color: #0284c7;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 4px;
        }

        .portada-curso-nombre {
            font-size: 12px;
            font-weight: bold;
            color: #0c4a6e;
            text-transform: uppercase;
            margin: 0;
            line-height: 1.35;
        }

        /* TABLA DE DATOS CON ALTURA Y ESPACIADO AMPLIADO */
        .portada-tabla-info {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
        }

        .portada-tabla-info td {
            border: 1px solid #cbd5e1;
            padding: 11px 12px; /* Espaciado interno amplio */
            height: 38px;        /* Altura uniforme por fila */
            font-size: 9px;
            line-height: 1.4;
            vertical-align: middle;
        }

        .portada-tabla-info .label {
            background-color: #f8fafc;
            font-weight: bold;
            color: #1f3c88;
            width: 37%;
            text-transform: uppercase;
            font-size: 8px;
            letter-spacing: 0.2px;
        }

        .portada-tabla-info .value {
            color: #1e293b;
            font-weight: 600;
        }

        /* PÁGINA 2: REGISTRO DE NOTAS */
        .page-break {
            page-break-before: always;
        }

        .header-notas {
            width: 100%;
            border-bottom: 2px solid #1f3c88;
            padding-bottom: 4px;
            margin-bottom: 6px;
        }

        .header-notas td {
            vertical-align: middle;
        }

        .titulo-notas {
            font-size: 11px;
            font-weight: bold;
            color: #1f3c88;
            text-transform: uppercase;
            margin: 0;
        }

        .subtitulo-notas {
            font-size: 8px;
            color: #444;
            margin: 2px 0 0 0;
        }

        .tabla-notas {
            width: 100%;
            border-collapse: collapse;
            font-size: 7.5px;
        }

        .tabla-notas th,
        .tabla-notas td {
            border: 1px solid #94a3b8;
            padding: 3.5px 2px;
            text-align: center;
        }

        .tabla-notas th {
            background-color: #dfe8f7;
            color: #0f2557;
            font-weight: bold;
            font-size: 7px;
            text-transform: uppercase;
        }

        .tabla-notas .col-num {
            width: 18px;
        }

        .tabla-notas .col-estudiante {
            width: 250px;
            text-align: left;
            padding-left: 5px;
            font-weight: bold;
            white-space: normal;
        }

        .tabla-notas .col-logro {
            width: auto;
        }

        .tabla-notas .col-prom {
            width: 44px;
            background-color: #fef3c7;
            font-weight: bold;
        }

        .tabla-notas .col-recup {
            width: 44px;
        }

        .tabla-notas .col-final {
            width: 48px;
            background-color: #e0f2fe;
            color: #1f3c88;
            font-weight: bold;
            font-size: 8px;
        }

        .nota-desaprobada {
            color: #dc2626 !important;
            font-weight: bold;
        }

        .tabla-notas tbody tr:nth-child(even) {
            background-color: #f8fafc;
        }

        /* FIRMAS */
        .firmas-container {
            width: 100%;
            margin-top: 30px;
            border-collapse: collapse;
        }

        .firma-box {
            width: 200px;
            border-top: 1px solid #333;
            text-align: center;
            padding-top: 4px;
            font-size: 7.5px;
            color: #333;
            margin: 0 auto;
        }

        .footer-text {
            margin-top: 12px;
            font-size: 6.5px;
            color: #64748b;
            text-align: right;
        }
    </style>
</head>

<body>

    {{-- ==================================================================== --}}
    {{-- PÁGINA 1: TRÍPTICO PROPORCIONAL (44% Asistencia | 20% Logros | 36% Portada) --}}
    {{-- ==================================================================== --}}
    <table class="triptico-container">
        <tr>
            {{-- 1. CONTROL DE ASISTENCIA --}}
            <td class="col-asistencia">
                <div class="section-header">Control de Asistencia</div>
                <table class="tabla-asistencia">
                    <thead>
                        <tr>
                            <th rowspan="2" class="asistencia-num">N°</th>
                            <th colspan="{{ max(count($sesiones), 1) }}">
                                SESIONES PROGRAMADAS
                            </th>
                            <th rowspan="2" class="asistencia-tot">F</th>
                            <th rowspan="2" class="asistencia-porc">%</th>
                        </tr>
                        <tr>
                            @forelse($sesiones as $s)
                                <th class="asistencia-fecha">
                                    {{ \Carbon\Carbon::parse($s->fecha)->format('d/m') }}
                                </th>
                            @empty
                                <th class="asistencia-fecha">-</th>
                            @endforelse
                        </tr>
                    </thead>
                    <tbody>
                        @php $contador = 1; @endphp
                        @foreach($estudiantes as $e)
                            @php
                                $asistColeccion = collect($asistencias[$e->matricula_curso_id] ?? []);
                                $faltas = $asistColeccion->filter(function($item) {
                                    $est = strtoupper(is_object($item) ? ($item->estado ?? '') : ($item['estado'] ?? ''));
                                    return in_array($est, ['F', 'A', 'FALTA', 'AUSENTE']);
                                })->count();

                                $totalSesiones = count($sesiones);
                                $porcentaje = $totalSesiones > 0 ? round(($faltas / $totalSesiones) * 100) : 0;
                            @endphp
                            <tr>
                                <td>{{ $contador }}</td>
                                @forelse($sesiones as $s)
                                    @php
                                        $idSesion = $s->id_sesion ?? $s->id ?? null;
                                        $asistenciaItem = $asistColeccion->first(function($item) use ($idSesion) {
                                            $itemSesionId = is_object($item) 
                                                ? ($item->sesion_id ?? $item->id_sesion ?? null) 
                                                : ($item['sesion_id'] ?? $item['id_sesion'] ?? null);
                                            return $itemSesionId == $idSesion;
                                        });

                                        $rawEstado = strtoupper(is_object($asistenciaItem) ? ($asistenciaItem->estado ?? '') : ($asistenciaItem['estado'] ?? ''));
                                        $inicial = match($rawEstado) {
                                            'P', 'PRESENTE' => '•',
                                            'F', 'A', 'FALTA', 'AUSENTE' => 'F',
                                            'J', 'JUSTIFICADO' => 'J',
                                            'T', 'TARDANZA' => 'T',
                                            default => '-'
                                        };

                                        $colorStyle = match($inicial) {
                                            'F' => 'color: #dc2626; font-weight: bold;',
                                            'J' => 'color: #d97706; font-weight: bold;',
                                            'T' => 'color: #2563eb;',
                                            default => 'color: #333;'
                                        };
                                    @endphp
                                    <td style="{{ $colorStyle }}">{{ $inicial }}</td>
                                @empty
                                    <td>-</td>
                                @endforelse
                                <td style="{{ $faltas > 0 ? 'color: #dc2626; font-weight: bold;' : '' }}">{{ $faltas }}</td>
                                <td style="{{ $porcentaje >= 30 ? 'color: #dc2626; font-weight: bold;' : '' }}">{{ $porcentaje }}%</td>
                            </tr>
                            @php $contador++; @endphp
                        @endforeach

                        @for($i = $contador; $i <= 30; $i++)
                            <tr>
                                <td>{{ $i }}</td>
                                @forelse($sesiones as $s)
                                    <td>-</td>
                                @empty
                                    <td>-</td>
                                @endforelse
                                <td>0</td>
                                <td>0%</td>
                            </tr>
                        @endfor
                    </tbody>
                </table>
            </td>

            {{-- 2. INDICADORES DE LOGRO --}}
            <td class="col-logros">
                <div class="section-header">Indicadores de Logro</div>
                <table class="tabla-logros">
                    <thead>
                        <tr>
                            <th class="num">N°</th>
                            <th>Descripción del Indicador</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($logros as $i => $logro)
                            <tr>
                                <td class="num">{{ $i + 1 }}</td>
                                <td>
                                    <strong>{{ $logro->nombre }}</strong>
                                    @if(!empty($logro->descripcion))
                                        <br><span style="color: #64748b; font-size: 7px; line-height: 1.2;">{{ $logro->descripcion }}</span>
                                    @endif
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="2" style="text-align: center; color: #64748b;">No hay indicadores registrados.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </td>

            {{-- 3. PORTADA CON INFORMACIÓN DEL CURSO (MAXIMIZADA Y ESPACIOSA) --}}
            <td class="col-portada">
                <div class="portada-box">
                    @if(!empty($logoPath) && file_exists($logoPath))
                        <img src="{{ $logoPath }}" alt="Logo" class="portada-logo">
                    @endif

                    <h1 class="portada-titulo-inst">{{ $instituto->nombre ?? 'INSTITUTO DE EDUCACIÓN SUPERIOR' }}</h1>
                    <div class="portada-badge">Registro Auxiliar de Evaluación</div>

                    {{-- Cuadro de Unidad Didáctica --}}
                    <div class="portada-curso">
                        <span class="portada-curso-label">Unidad Didáctica:</span>
                        <h2 class="portada-curso-nombre">{{ $curso->nombre }}</h2>
                    </div>

                    {{-- Tabla de Datos Amplia --}}
                    <table class="portada-tabla-info">
                        <tr>
                            <td class="label">Programa de Estudio:</td>
                            <td class="value">{{ $curso->planesEstudio->first()->nombre ?? $curso->carrera?->nombre ?? '---' }}</td>
                        </tr>
                        <tr>
                            <td class="label">Periodo Lectivo:</td>
                            <td class="value">{{ $periodo->nombre ?? '---' }}</td>
                        </tr>
                        <tr>
                            <td class="label">Periodo Académico:</td>
                            <td class="value">Semestre {{ $curso->semestre->nombre ?? '---' }}</td>
                        </tr>
                        <tr>
                            <td class="label">Módulo Formativo:</td>
                            <td class="value">{{ $curso->moduloformativo->nombre ?? '---' }}</td>
                        </tr>
                        <tr>
                            <td class="label">Docente Responsable:</td>
                            <td class="value">{{ $curso->docentes->first()->nombre_completo ?? $nombreDocente ?? '---' }}</td>
                        </tr>
                        <tr>
                            <td class="label">Créditos / Horas:</td>
                            <td class="value">{{ $curso->creditos ?? '-' }} Créditos &nbsp;|&nbsp; {{ $curso->horas_semestrales ?? '-' }} Horas</td>
                        </tr>
                        <tr>
                            <td class="label">Código Modular:</td>
                            <td class="value">{{ $instituto->codigo_modular ?? '---' }}</td>
                        </tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>

    {{-- ==================================================================== --}}
    {{-- PÁGINA 2: REGISTRO OFICIAL DE NOTAS                                  --}}
    {{-- ==================================================================== --}}
    <div class="page-break">
        <table class="header-notas">
            <tr>
                <td>
                    <h2 class="titulo-notas">Registro Consolidado de Calificaciones</h2>
                    <p class="subtitulo-notas">
                        <strong>Unidad Didáctica:</strong> {{ $curso->nombre }} | 
                        <strong>Programa:</strong> {{ $curso->planesEstudio->first()->nombre ?? $curso->carrera?->nombre ?? '---' }} | 
                        <strong>Periodo:</strong> {{ $periodo->nombre ?? '---' }}
                    </p>
                </td>
                <td style="text-align: right; font-size: 7.5px; color: #475569;">
                    Docente: {{ $curso->docentes->first()->nombre_completo ?? $nombreDocente ?? '---' }}
                </td>
            </tr>
        </table>

        <table class="tabla-notas">
            <thead>
                <tr>
                    <th class="col-num">#</th>
                    <th class="col-estudiante">Apellidos y Nombres</th>
                    @foreach($lista_logros as $idx => $logroItem)
                        <th class="col-logro">Logro {{ $idx + 1 }}</th>
                    @endforeach
                    <th class="col-prom">Prom.</th>
                    <th class="col-recup">Recup.</th>
                    <th class="col-final">Nota Final</th>
                </tr>
            </thead>
            <tbody>
                @forelse($lista_estudiantes as $est)
                    @php
                        $sum = 0;
                        $count = 0;
                    @endphp
                    <tr>
                        <td class="col-num">{{ $loop->iteration }}</td>
                        <td class="col-estudiante">{{ $est['nombre'] }}</td>

                        @foreach($lista_logros as $logroItem)
                            @php
                                $nota = $est['logros'][$logroItem] ?? '-';
                                $esNumerico = is_numeric($nota);
                                if ($esNumerico) {
                                    $sum += $nota;
                                    $count++;
                                }
                            @endphp
                            <td class="{{ $esNumerico && $nota < 13 ? 'nota-desaprobada' : '' }}">
                                {{ $nota }}
                            </td>
                        @endforeach

                        @php
                            $prom = $count > 0 ? round($sum / $count) : '-';
                            $recup = $est['recuperacion'] ?? null;
                            $notaFinal = is_numeric($recup) ? max($prom, round($recup)) : $prom;
                        @endphp

                        <td class="col-prom {{ is_numeric($prom) && $prom < 13 ? 'nota-desaprobada' : '' }}">
                            {{ $prom }}
                        </td>

                        <td class="col-recup">
                            {{ is_numeric($recup) ? $recup : '-' }}
                        </td>

                        <td class="col-final {{ is_numeric($notaFinal) && $notaFinal < 13 ? 'nota-desaprobada' : '' }}">
                            {{ $notaFinal }}
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="{{ count($lista_logros) + 5 }}" style="padding: 15px; color: #64748b;">
                            No se encontraron estudiantes matriculados en esta sección.
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        {{-- FIRMAS --}}
        <table class="firmas-container">
            <tr>
                <td style="width: 50%;">
                    <div class="firma-box">
                        Docente Responsable del Curso<br>
                        <strong>{{ $curso->docentes->first()->nombre_completo ?? $nombreDocente ?? 'Docente' }}</strong>
                    </div>
                </td>
                <td style="width: 50%;">
                    <div class="firma-box">
                        V°B° Secretaría Académica / Coordinación<br>
                        <strong>{{ $instituto->nombre ?? 'Instituto de Educación Superior' }}</strong>
                    </div>
                </td>
            </tr>
        </table>

        <div class="footer-text">
            Documento emitido el {{ date('d/m/Y - H:i') }} | Sistema Integrado de Gestión Académica
        </div>
    </div>

</body>
</html>