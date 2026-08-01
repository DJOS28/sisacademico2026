@php
use Carbon\Carbon;
$anioActual = Carbon::now()->year;
@endphp

<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 10px;
            color: #333;
            font-size: 12px;
        }

        .header {
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 10px;
        }

        .header img {
            width: 100px;
        }

        .header h3 {
            margin: 10px 0;
            font-size: 16px;
        }

        .three-columns {
            width: 100%;
            display: block;
        }

        .column {
            width: 31.33%;
            /* Ajustar a 31.33% para que las tres columnas sumen 100% con margen */
            display: inline-block;
            vertical-align: top;
            margin-right: 1%;
            /* Margen del 1% */
            box-sizing: border-box;
        }

        .column:last-child {
            margin-right: 0;
            /* Eliminar margen en la última columna */
        }

        .column h4 {
            text-align: center;
            margin-bottom: 10px;
            font-size: 14px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            border: 1px solid #ddd;
        }

        th,
        td {
            border: 1px solid #000;
            padding: 4px;
            text-align: justify;
            word-wrap: break-word;
            overflow: hidden;
        }

        th {
            font-weight: bold;
            text-align: center;
        }

        .small-text {
            font-size: 11px;
        }

        /* Estilo personalizado para la tercera columna */
        .column h1 {
            font-size: 32px;
            text-align: center;
            border: 1px solid black;
            padding: 30px;
            margin: 30px 0;
        }

        .column h2 {
            font-size: 28px;
            text-align: center;
            border: 1px solid black;
            padding: 18px;
            margin: 30px 0;
        }

        .column h3 {
            font-size: 16px;
            margin-bottom: 30px;
        }

        /* Salto de página para nueva sección */
        .page-break {
            page-break-before: always;
        }

        .info-table,
        .notes-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        .info-table td,
        .notes-table th,
        .notes-table td {
            border: 1px solid #ddd;
            padding: 12px;

        }

        .info-table th,
        .notes-table th {
            background-color: #f4f4f4;
            color: #333;
            font-weight: bold;
        }

        .info-table td {
            background-color: #fff;
        }

        .info-table .title {
            font-weight: bold;
            width: 30%;
            background-color: #f9f9f9;
            text-align: right;
            padding-right: 15px;
        }

        .info-table .value {
            width: 70%;
        }

        .notes-table td {
            text-align: center;
        }

        .notes-table .high-grade {
            color: black;
        }

        .notes-table .low-grade {
            color: red;
        }

        .total {
            font-weight: bold;
            text-align: right;
            background-color: #f4f4f4;
            padding-right: 12px;
        }

        .tabla-asistencia {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 9px;
        }

        .tabla-asistencia th,
        .tabla-asistencia td {
            border: 1px solid #000;
            text-align: center;
            padding: 3px;
        }

        /* titulo fechas */
        .asistencia-fechas-titulo {
            font-weight: bold;
        }

        .asistencia-fechas-sub {
            font-size: 8px;
            font-weight: normal;
        }

        /* columnas de fecha */
        .asistencia-fecha {
            font-size: 8px;
            width: 18px;
        }

        /* columna numero */
        .asistencia-numero {
            width: 22px;
        }

        /* columnas finales */
        .asistencia-total {
            width: 28px;
        }

        .asistencia-porcentaje {
            width: 28px;
        }
    </style>
</head>

<body>

    {{-- Sección: Asistencias / Logros / Encabezado --}}
    <div class="three-columns">

        {{-- Columna: Control de Asistencia --}}
        <div class="column">
            <h4 style="text-align:center;">Control de Asistencia</h4>

                <table class="tabla-asistencia">
                    <thead>
                        <tr>
                            <th rowspan="2" class="asistencia-numero">
                                N°<br>Orden
                            </th>

                            <th colspan="{{ max(count($sesiones), 1) }}">
                                F E C H A S
                                <br>
                                <span class="asistencia-fechas-sub">
                                    P: Presente | F: Falta | J: Justificado | T: Tardanza
                                </span>
                            </th>

                            <th rowspan="2" class="asistencia-total">
                                Total<br>Inasist.
                            </th>

                            <th rowspan="2" class="asistencia-porcentaje">
                                %<br>Inasist.
                            </th>
                        </tr>

                        <tr>
                            @forelse($sesiones as $s)
                                <th style="font-size: 7.5px;">
                                    {{ \Carbon\Carbon::parse($s->fecha)->format('d/m') }}
                                </th>
                            @empty
                                <th style="font-size: 7.5px;">-</th>
                            @endforelse
                        </tr>
                    </thead>

                    <tbody>
                        @php $contador = 1; @endphp

                        @foreach($estudiantes as $e)
                            @php
                                $asistColeccion = collect($asistencias[$e->matricula_curso_id] ?? []);

                                // Contar faltas ('F', 'A', 'FALTA', 'AUSENTE')
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

                                        // Buscar la asistencia correspondiente a esta sesión
                                        $asistenciaItem = $asistColeccion->first(function($item) use ($idSesion) {
                                            $itemSesionId = is_object($item) 
                                                ? ($item->sesion_id ?? $item->id_sesion ?? null) 
                                                : ($item['sesion_id'] ?? $item['id_sesion'] ?? null);
                                            return $itemSesionId == $idSesion;
                                        });

                                        $rawEstado = strtoupper(is_object($asistenciaItem) ? ($asistenciaItem->estado ?? '') : ($asistenciaItem['estado'] ?? ''));

                                        $inicial = match($rawEstado) {
                                            'P', 'PRESENTE' => 'P',
                                            'F', 'A', 'FALTA', 'AUSENTE' => 'F',
                                            'J', 'JUSTIFICADO' => 'J',
                                            'T', 'TARDANZA' => 'T',
                                            default => '-'
                                        };

                                        $colorStyle = match($inicial) {
                                            'F' => 'color: red; font-weight: bold;',
                                            'J' => 'color: #d97706; font-weight: bold;',
                                            'T' => 'color: #2563eb;',
                                            default => 'color: #333;'
                                        };
                                    @endphp

                                    <td style="{{ $colorStyle }}">
                                        {{ $inicial }}
                                    </td>
                                @empty
                                    <td>-</td>
                                @endforelse

                                {{-- Total Inasistencias --}}
                                <td style="{{ $faltas > 0 ? 'font-weight: bold; color: red;' : '' }}">
                                    {{ $faltas }}
                                </td>

                                {{-- Porcentaje Inasistencias --}}
                                <td style="{{ $porcentaje >= 30 ? 'color: red; font-weight: bold;' : '' }}">
                                    {{ $porcentaje }}%
                                </td>
                            </tr>

                            @php $contador++; @endphp
                        @endforeach

                        {{-- Relleno estático para abarcar el alto del tríptico --}}
                        @for($i = $contador; $i <= 35; $i++)
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

        </div>

        {{-- Columna: Logros --}}
        <div class="column">
            <h4>Indicadores de Logro</h4>
            <table>
                <tr>
                    <td colspan="2"><strong>Indicadores de Logro</strong></td>
                </tr>
                <tr>
                    <th>Nº</th>
                    <th>Nombre</th>
                </tr>
                @foreach($logros as $i => $logro)
                <tr>
                    <td>{{ $i+1 }}</td>
                    <td>{{ $logro->nombre }}</td>
                </tr>
                @endforeach
            </table>
        </div>

        {{-- Columna: Encabezado institucional --}}
        <div class="column">
            <div class="header">
                @if(file_exists($logoPath))
                <img src="{{ $logoPath }}" alt="Logo">
                @else
                <p><strong>{{ $instituto->nombre }}</strong></p>
                @endif
            </div>
            <h1>REGISTRO DE EVALUACIÓN Y NOTAS - {{ $periodo->nombre ?? '---' }}</h1>
            
            <h3>PROGRAMA DE ESTUDIOS: {{ $curso->planesEstudio->first()->nombre ?? '---' }}</h3>
            <h3>PERIODO ACADEMICO: {{ $curso->semestre->nombre ?? '---' }}</h3>
            <h3>MÓDULO FORMATIVO: {{ $curso->moduloformativo->nombre ?? '---' }}</h3>
            <h2>UNIDAD DIDÁCTICA<br> {{ $curso->nombre }}</h2>
            
            <h3>DOCENTE: {{ $curso->docentes->first()->nombre_completo ?? '---' }}</h3>
            <h3>PERIODO: {{ $periodo->nombre ?? '---' }}</h3>
            <h3>CREDITOS: {{ $curso->creditos ?? '---' }}</h3>
            <h3>HORAS SEMESTRALES: {{ $curso->horas_semestrales ?? '---' }}</h3>
        </div>

    </div>

    {{-- Sección: Registro de Notas --}}
    <div class="page-break">
        <table class="tabla-notas">

            <thead>
                <tr>
                    <th>#</th>
                    <th>Estudiante</th>

                    @foreach($lista_logros as $logro)
                    <th>{{ $logro }}</th>
                    @endforeach

                    <th>Promedio</th>
                    <th>Recuperación</th>
                    <th>Nota Final</th>

                </tr>
            </thead>

            <tbody>

                @foreach($lista_estudiantes as $est)

                @php
                $sum = 0;
                $count = 0;
                @endphp

                <tr>

                    <td>{{ $loop->iteration }}</td>

                    <td>{{ $est['nombre'] }}</td>

                    @foreach($lista_logros as $logro)

                    @php
                    $nota = $est['logros'][$logro] ?? '-';

                    $style = is_numeric($nota) && $nota < 11 ? 'color:red;' : '' ;

                        if(is_numeric($nota)){
                        $sum +=$nota;
                        $count++;
                        }
                        @endphp

                        <td style="{{ $style }}">
                        {{ $nota }}
                        </td>

                        @endforeach

                        @php
                        $prom = $count ? round($sum / $count) : '-';
                        @endphp

                        <td>{{ $prom }}</td>

                        <td></td>

                        <td>{{ $prom }}</td>

                </tr>

                @endforeach

            </tbody>
        </table>
    </div>
</body>

</html>