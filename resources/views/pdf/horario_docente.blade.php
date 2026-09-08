<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Horario Académico - {{ $docente->nombre }} {{ $docente->apellido }}</title>
    <style>
        @page { margin: 12mm 10mm; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 8.5pt; color: #0f172a; }
        .header { text-align: center; border-bottom: 2px solid #315d7a; padding-bottom: 8px; margin-bottom: 12px; }
        .instituto { font-size: 13pt; font-weight: bold; text-transform: uppercase; color: #0f172a; }
        .subtitulo { font-size: 9pt; color: #475569; margin-top: 2px; }
        .info-docente { width: 100%; border-collapse: collapse; margin-bottom: 12px; background: #f8fafc; border: 1px solid #e2e8f0; }
        .info-docente td { padding: 6px 10px; font-size: 8.5pt; }
        .tabla-horario { width: 100%; border-collapse: collapse; margin-top: 5px; }
        .tabla-horario th, .tabla-horario td { border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-size: 8pt; }
        .tabla-horario th { background-color: #315d7a; color: #ffffff; text-transform: uppercase; font-weight: bold; }
        .bloque-clase { background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 4px; padding: 4px; }
        .bloque-curso { font-weight: bold; color: #0369a1; font-size: 8pt; display: block; }
        .bloque-detalle { font-size: 7pt; color: #475569; margin-top: 2px; display: block; }
    </style>
</head>
<body>

    <div class="header">
        <div class="instituto">{{ $instituto->nombre ?? 'INSTITUTO DE EDUCACIÓN SUPERIOR' }}</div>
        <div class="subtitulo">Horario Académico Semanal del Docente • Periodo: {{ $periodoActivo->nombre ?? 'Activo' }}</div>
    </div>

    <table class="info-docente">
        <tr>
            <td style="width: 50%;"><strong>Docente:</strong> {{ $docente->apellido }}, {{ $docente->nombre }}</td>
            <td style="width: 25%;"><strong>DNI:</strong> {{ $docente->dni }}</td>
            <td style="width: 25%;"><strong>Fecha de Emisión:</strong> {{ date('d/m/Y') }}</td>
        </tr>
    </table>

    @php
        $dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        $rangos = $horarios->map(fn($h) => substr($h->hora_inicio, 0, 5) . ' - ' . substr($h->hora_fin, 0, 5))->unique()->values();
    @endphp

    <table class="tabla-horario">
        <thead>
            <tr>
                <th style="width: 14%;">HORA</th>
                @foreach($dias as $dia)
                    <th>{{ $dia }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse($rangos as $rango)
                <tr>
                    <td style="font-weight: bold; background: #f8fafc;">{{ $rango }}</td>
                    @foreach($dias as $dia)
                        @php
                            $clase = $horarios->first(function($h) use ($dia, $rango) {
                                $rangoItem = substr($h->hora_inicio, 0, 5) . ' - ' . substr($h->hora_fin, 0, 5);
                                return strcasecmp($h->dia ?? $h->dia_semana, $dia) === 0 && $rangoItem === $rango;
                            });
                        @endphp
                        <td>
                            @if($clase)
                                <div class="bloque-clase">
                                    <span class="bloque-curso">{{ $clase->curso->nombre ?? 'Curso' }}</span>
                                    <span class="bloque-detalle">Sec: {{ $clase->seccion->nombre ?? 'S/N' }} | Aula: {{ $clase->aula->nombre ?? $clase->numero_aula ?? 'AULA' }}</span>
                                </div>
                            @else
                                <span style="color: #cbd5e1;">—</span>
                            @endif
                        </td>
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td colspan="7" style="padding: 20px; color: #94a3b8;">No registra asignaciones horarias en este periodo.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

</body>
</html>