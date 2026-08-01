<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">

    <title>
        Horario académico del docente
    </title>

    <style>
        @page {
            margin: 16px 20px 18px 20px;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            color: #1f2937;
            font-family: DejaVu Sans, sans-serif;
            font-size: 8.5px;
        }

        .encabezado {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #7b8794;
        }

        .encabezado td {
            padding: 7px;
            border: 1px solid #7b8794;
            vertical-align: middle;
        }

        .celda-logo {
            width: 15%;
            height: 74px;
            text-align: center;
        }

        .logo {
            display: block;
            max-width: 88px;
            max-height: 62px;
            margin: 0 auto;
        }

        .sin-logo {
            color: #7b8794;
            font-size: 8px;
            text-transform: uppercase;
        }

        .celda-institucion {
            width: 60%;
            text-align: center;
        }

        .nombre-instituto {
            margin: 0;
            color: #17365d;
            font-size: 15px;
            font-weight: bold;
            line-height: 1.25;
            text-transform: uppercase;
        }

        .subtitulo-institucion {
            margin-top: 4px;
            color: #475569;
            font-size: 8px;
        }

        .celda-documento {
            width: 25%;
            padding: 0 !important;
        }

        .tabla-documento {
            width: 100%;
            border-collapse: collapse;
        }

        .tabla-documento td {
            padding: 4px 6px;
            border: 0;
            border-bottom: 1px solid #aab4bf;
            font-size: 7.5px;
        }

        .tabla-documento tr:last-child td {
            border-bottom: 0;
        }

        .documento-etiqueta {
            width: 45%;
            background: #e7edf3;
            color: #263b50;
            font-weight: bold;
        }

        .documento-valor {
            text-align: center;
        }

        .titulo-documento {
            margin: 10px 0 8px;
            padding: 7px;
            border: 1px solid #7b8794;
            background: #d9e2f3;
            color: #17365d;
            font-size: 13px;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
        }

        .informacion {
            width: 100%;
            margin-bottom: 9px;
            border-collapse: collapse;
        }

        .informacion td {
            padding: 5px 7px;
            border: 1px solid #9ca8b5;
        }

        .informacion-etiqueta {
            width: 11%;
            background: #e7edf3;
            color: #263b50;
            font-weight: bold;
        }

        .informacion-valor {
            width: 39%;
        }

        .horario {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .horario thead {
            display: table-header-group;
        }

        .horario tr {
            page-break-inside: avoid;
        }

        .horario th {
            padding: 7px 4px;
            border: 1px solid #5c6f82;
            background: #274b69;
            color: #ffffff;
            font-size: 8px;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
        }

        .horario td {
            height: 43px;
            padding: 4px;
            border: 1px solid #9eabb7;
            vertical-align: middle;
            text-align: center;
        }

        .horario tbody tr:nth-child(even) td {
            background: #f5f7fa;
        }

        .horario tbody tr:nth-child(even) .columna-hora {
            background: #e5ebf1;
        }

        .columna-hora {
            width: 72px;
            background: #edf1f5;
            color: #17365d;
            font-size: 8px;
            font-weight: bold;
        }

        .curso {
            color: #17365d;
            font-size: 8.5px;
            font-weight: bold;
            line-height: 1.25;
        }

        .detalle {
            margin-top: 2px;
            color: #4b5563;
            font-size: 6.8px;
            line-height: 1.25;
        }

        .seccion {
            margin-top: 2px;
            color: #334155;
            font-size: 6.8px;
            font-weight: bold;
        }

        .vacio {
            color: #9ca3af;
            font-size: 10px;
        }

        .sin-registros {
            height: 80px !important;
            color: #64748b;
            font-size: 9px;
            text-align: center;
        }

        .observacion {
            width: 100%;
            margin-top: 8px;
            border-collapse: collapse;
        }

        .observacion td {
            padding: 5px 7px;
            border: 1px solid #9ca8b5;
        }

        .observacion-titulo {
            width: 12%;
            background: #e7edf3;
            color: #263b50;
            font-weight: bold;
        }

        .firmas {
            width: 100%;
            margin-top: 28px;
            border-collapse: collapse;
        }

        .firmas td {
            width: 33.33%;
            padding: 0 25px;
            text-align: center;
            vertical-align: bottom;
        }

        .linea-firma {
            padding-top: 5px;
            border-top: 1px solid #374151;
            color: #374151;
            font-size: 7.5px;
            font-weight: bold;
        }

        .cargo-firma {
            margin-top: 2px;
            color: #64748b;
            font-size: 7px;
        }

        .pie {
            position: fixed;
            right: 0;
            bottom: -7px;
            left: 0;
            color: #64748b;
            font-size: 6.8px;
        }

        .pie-izquierda {
            float: left;
        }

        .pie-derecha {
            float: right;
        }

        .clearfix::after {
            display: table;
            clear: both;
            content: "";
        }
    </style>
</head>

<body>
    <table class="encabezado">
        <tr>
            <td class="celda-logo">
                @if ($logoPath)
                    <img
                        src="{{ $logoPath }}"
                        alt="Logo institucional"
                        class="logo"
                    >
                @else
                    <span class="sin-logo">
                        Logo institucional
                    </span>
                @endif
            </td>

            <td class="celda-institucion">
                <div class="nombre-instituto">
                    {{
                        $instituto?->nombre
                        ?? 'Instituto de Educación Superior Tecnológico'
                    }}
                </div>

                <div class="subtitulo-institucion">
                    @if ($instituto?->direccion)
                        {{ $instituto->direccion }}
                    @endif

                    @if (
                        $instituto?->direccion &&
                        $instituto?->telefono
                    )
                        &nbsp; | &nbsp;
                    @endif

                    @if ($instituto?->telefono)
                        Teléfono:
                        {{ $instituto->telefono }}
                    @endif
                </div>
            </td>

            <td class="celda-documento">
                <table class="tabla-documento">
                    <tr>
                        <td class="documento-etiqueta">
                            Código
                        </td>

                        <td class="documento-valor">
                            HOR-DOC-01
                        </td>
                    </tr>

                    <tr>
                        <td class="documento-etiqueta">
                            Versión
                        </td>

                        <td class="documento-valor">
                            1.0
                        </td>
                    </tr>

                    <tr>
                        <td class="documento-etiqueta">
                            Fecha
                        </td>

                        <td class="documento-valor">
                            {{ $fechaEmision->format('d/m/Y') }}
                        </td>
                    </tr>

                    <tr>
                        <td class="documento-etiqueta">
                            Página
                        </td>

                        <td class="documento-valor">
                            1
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <div class="titulo-documento">
        Horario académico del docente
    </div>

    <table class="informacion">
        <tr>
            <td class="informacion-etiqueta">
                Docente
            </td>

            <td class="informacion-valor">
                {{
                    trim(
                        ($docente->apellido ?? '') .
                        ' ' .
                        ($docente->nombre ?? '')
                    )
                }}
            </td>

            <td class="informacion-etiqueta">
                Periodo
            </td>

            <td class="informacion-valor">
                @if ($periodo)
                    {{
                        $periodo->nombre
                        ?? $periodo->periodo
                        ?? $periodo->descripcion
                        ?? $periodo->anio
                        ?? 'Periodo ' . $periodo->id
                    }}
                @else
                    Todos los periodos
                @endif
            </td>
        </tr>

        <tr>
            <td class="informacion-etiqueta">
                Código modular
            </td>

            <td class="informacion-valor">
                {{
                    $instituto?->codigo_modular
                    ?? 'No registrado'
                }}
            </td>

            <td class="informacion-etiqueta">
                DRE
            </td>

            <td class="informacion-valor">
                {{
                    $instituto?->dre
                    ?? 'No registrada'
                }}
            </td>
        </tr>

        <tr>
            <td class="informacion-etiqueta">
                Distrito
            </td>

            <td class="informacion-valor">
               {{ $instituto?->distrito?->nombre ?? 'No registrado' }}
            </td>

            <td class="informacion-etiqueta">
                Duración
            </td>

            <td class="informacion-valor">
                Bloques pedagógicos de 45 minutos
            </td>
        </tr>
    </table>

    <table class="horario">
        <thead>
            <tr>
                <th class="columna-hora">
                    Hora
                </th>

                @foreach ($diasHorario as $dia)
                    <th>
                        {{ $dia }}
                    </th>
                @endforeach
            </tr>
        </thead>

        <tbody>
            @forelse ($franjasHorario as $franja)
                <tr>
                    <td class="columna-hora">
                        {{ $franja['hora_inicio'] }}

                        <br>

                        a

                        <br>

                        {{ $franja['hora_fin'] }}
                    </td>

                    @foreach ($diasHorario as $dia)
                        @php
                            $horario = $franja['dias'][$dia] ?? null;
                        @endphp

                        <td>
                            @if ($horario)
                                <div class="curso">
                                    {{
                                        $horario->curso?->nombre
                                        ?? 'Curso no registrado'
                                    }}
                                </div>

                                <div class="detalle">
                                    Aula:

                                    @if ($horario->aula)
                                        {{
                                            $horario->aula->nombre
                                        }}

                                        @if ($horario->aula->numero_aula)
                                            -
                                            {{
                                                $horario->aula->numero_aula
                                            }}
                                        @endif
                                    @else
                                        No asignada
                                    @endif
                                </div>

                                @if (
                                    $horario->aula?->pabellon?->nombre
                                )
                                    <div class="detalle">
                                        {{
                                            $horario
                                                ->aula
                                                ->pabellon
                                                ->nombre
                                        }}
                                    </div>
                                @endif

                                @if (
                                    $horario->seccion?->nombre
                                )
                                    <div class="seccion">
                                        Sección:
                                        {{
                                            $horario
                                                ->seccion
                                                ->nombre
                                        }}
                                    </div>
                                @endif
                            @else
                                <span class="vacio">
                                    —
                                </span>
                            @endif
                        </td>
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td
                        colspan="{{ count($diasHorario) + 1 }}"
                        class="sin-registros"
                    >
                        El docente no tiene horarios registrados
                        para el periodo seleccionado.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <table class="observacion">
        <tr>
            <td class="observacion-titulo">
                Observaciones
            </td>

            <td>
                El presente horario se encuentra sujeto a las
                disposiciones académicas y administrativas de la institución.
            </td>
        </tr>
    </table>

    <table class="firmas">
        <tr>
            <td>
                <div class="linea-firma">
                    Docente
                </div>

                <div class="cargo-firma">
                    Firma
                </div>
            </td>

            <td>
                <div class="linea-firma">
                    Jefatura de Unidad Académica
                </div>

                <div class="cargo-firma">
                    Visto bueno
                </div>
            </td>

            <td>
                <div class="linea-firma">
                    Dirección General
                </div>

                <div class="cargo-firma">
                    Aprobación
                </div>
            </td>
        </tr>
    </table>

    <div class="pie clearfix">
        <div class="pie-izquierda">
            Sistema Integrado de Gestión Académica
        </div>

        <div class="pie-derecha">
            Generado el
            {{ $fechaEmision->format('d/m/Y H:i') }}
        </div>
    </div>
</body>
</html>