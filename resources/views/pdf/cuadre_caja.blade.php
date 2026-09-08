<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte_Cuadre_Caja_{{ $caja->id_caja }}</title>
    <style>
        @page {
            margin: 25px 30px;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 8.5pt;
            color: #1e293b;
            line-height: 1.3;
        }
        
        /* ENCABEZADO INSTITUCIONAL */
        .header-table {
            width: 100%;
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .institution-name {
            font-size: 13pt;
            font-weight: bold;
            color: #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .report-title {
            font-size: 10pt;
            font-weight: bold;
            color: #475569;
            margin-top: 3px;
        }
        .meta-box {
            font-size: 8pt;
            color: #64748b;
            text-align: right;
        }

        /* BLOQUES Y TARJETAS */
        .section-title {
            font-size: 9pt;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            margin-top: 15px;
            margin-bottom: 6px;
            padding-left: 5px;
            border-left: 3px solid #1e3a8a;
        }

        /* RESUMEN DE ARQUEO */
        .summary-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 6px;
            margin-bottom: 10px;
        }
        .summary-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 8px 10px;
            border-radius: 4px;
        }
        .summary-label {
            font-size: 7.5pt;
            color: #64748b;
            text-transform: uppercase;
            font-weight: bold;
        }
        .summary-value {
            font-size: 10pt;
            font-weight: bold;
            color: #0f172a;
            margin-top: 2px;
        }
        .summary-value.positive { color: #15803d; }
        .summary-value.negative { color: #b91c1c; }
        .summary-value.highlight { color: #1e3a8a; font-size: 11pt; }

        /* TABLAS DE DATOS */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5px;
        }
        .data-table th {
            background-color: #1e3a8a;
            color: #ffffff;
            font-size: 8pt;
            font-weight: bold;
            text-transform: uppercase;
            padding: 6px 8px;
            text-align: left;
        }
        .data-table td {
            padding: 5px 8px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 8pt;
        }
        .data-table tr:nth-child(even) {
            background-color: #f8fafc;
        }
        
        /* UTILIDADES */
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        .badge-ingreso { color: #15803d; font-weight: bold; }
        .badge-egreso { color: #b91c1c; font-weight: bold; }

        /* FIRMAS Y PIE */
        .signatures-table {
            width: 100%;
            margin-top: 60px;
            border: none;
        }
        .signature-line {
            border-top: 1px solid #94a3b8;
            width: 70%;
            margin: 0 auto;
            padding-top: 5px;
            font-size: 8pt;
            font-weight: bold;
            color: #334155;
        }
        .footer-info {
            margin-top: 30px;
            font-size: 7pt;
            color: #94a3b8;
            text-align: center;
        }
    </style>
</head>
<body>

    <!-- ENCABEZADO INSTITUCIONAL -->
    <table class="header-table">
        <tr>
            <td style="border: none; padding: 0;">
                <div class="institution-name">{{ $instituto->nombre ?? 'INSTITUTO DE EDUCACIÓN SUPERIOR' }}</div>
                <div class="report-title">INFORME DE ARQUEO Y CUADRE DE CAJA</div>
            </td>
            <td class="meta-box" style="border: none; padding: 0;">
                <div><strong>Caja N°:</strong> {{ $caja->id_caja }}</div>
                <div><strong>Nombre:</strong> {{ $caja->nombre ?? 'Caja General' }}</div>
                <div><strong>Estado:</strong> {{ $caja->fecha_cierre ? 'CERRADA' : 'EN PROCESO' }}</div>
            </td>
        </tr>
    </table>

    <!-- RESUMEN OPERATIVO -->
    <div class="section-title">Resumen de Arqueo Financiero</div>
    <table class="summary-table">
        <tr>
            <td width="25%" class="summary-card">
                <div class="summary-label">Apertura Inicial</div>
                <div class="summary-value">S/ {{ number_format($caja->apertura, 2) }}</div>
                <div style="font-size: 6.5pt; color: #94a3b8;">{{ $caja->fecha_apertura }}</div>
            </td>
            <td width="25%" class="summary-card">
                <div class="summary-label">(+) Cobros Alumnos</div>
                <div class="summary-value positive">S/ {{ number_format($totalIngresosPagos, 2) }}</div>
                <div style="font-size: 6.5pt; color: #94a3b8;">Pagos postulantes</div>
            </td>
            <td width="25%" class="summary-card">
                <div class="summary-label">(-) Total Egresos</div>
                <div class="summary-value negative">S/ {{ number_format($totalEgresos, 2) }}</div>
                <div style="font-size: 6.5pt; color: #94a3b8;">Gastos y salidas</div>
            </td>
            <td width="25%" class="summary-card" style="background-color: #eff6ff; border-color: #bfdbfe;">
                <div class="summary-label" style="color: #1e3a8a;">Saldo Teórico</div>
                <div class="summary-value highlight">S/ {{ number_format($saldoTeorico, 2) }}</div>
                <div style="font-size: 6.5pt; color: #3b82f6;">Esperado en caja</div>
            </td>
        </tr>
        <tr>
            <td colspan="2" class="summary-card">
                <div class="summary-label">Saldo Final Declarado</div>
                <div class="summary-value">S/ {{ number_format($caja->saldo_final ?? 0, 2) }}</div>
            </td>
            <td colspan="2" class="summary-card" style="{{ $diferencia == 0 ? 'background-color: #f0fdf4;' : 'background-color: #fffbeb;' }}">
                <div class="summary-label">Diferencia / Cuadre</div>
                <div class="summary-value {{ $diferencia == 0 ? 'positive' : 'negative' }}">
                    S/ {{ number_format($diferencia, 2) }}
                    <span style="font-size: 7.5pt; font-weight: normal;">
                        {{ $diferencia == 0 ? '(CUADRADOS)' : ($diferencia > 0 ? '(SOBRANTE)' : '(FALTANTE)') }}
                    </span>
                </div>
            </td>
        </tr>
    </table>

    <!-- COBROS DE ALUMNOS -->
    <div class="section-title">Detalle de Cobros Recaudados</div>
    <table class="data-table">
        <thead>
            <tr>
                <th width="12%">Ticket</th>
                <th width="48%">Estudiante / Postulante</th>
                <th width="25%">Concepto</th>
                <th width="15%" class="text-right">Monto</th>
            </tr>
        </thead>
        <tbody>
            @forelse($pagosPostulantes as $pago)
                <tr>
                    <td class="bold">#{{ str_pad($pago->id_pagos, 6, '0', STR_PAD_LEFT) }}</td>
                    <td>{{ $pago->postulante->nombre_completo ?? trim(($pago->postulante->nombres ?? '') . ' ' . ($pago->postulante->apellidos ?? '')) }}</td>
                    <td>{{ $pago->concepto->nombre ?? 'General' }}</td>
                    <td class="text-right bold badge-ingreso">S/ {{ number_format($pago->monto, 2) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="4" class="text-center" style="color: #94a3b8; padding: 12px;">No se registraron cobros de estudiantes en esta sesión.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <!-- TRANSACCIONES OPERATIVAS DIRECTAS -->
    @if(count($transacciones) > 0)
        <div class="section-title">Transacciones Operativas Manuales</div>
        <table class="data-table">
            <thead>
                <tr>
                    <th width="10%"># ID</th>
                    <th width="12%">Tipo</th>
                    <th width="38%">Persona / Destinatario</th>
                    <th width="25%">Concepto / Observación</th>
                    <th width="15%" class="text-right">Monto</th>
                </tr>
            </thead>
            <tbody>
                @foreach($transacciones as $transaccion)
                    <tr>
                        <td class="bold">#{{ $transaccion->id_transaccion }}</td>
                        <td class="{{ $transaccion->tipo === 'ingreso' ? 'badge-ingreso' : 'badge-egreso' }}">
                            {{ strtoupper($transaccion->tipo) }}
                        </td>
                        <td>{{ trim(($transaccion->nombres ?? '') . ' ' . ($transaccion->apellidos ?? '')) ?: ($transaccion->dni ?? 'N/A') }}</td>
                        <td>{{ $transaccion->concepto->nombre ?? $transaccion->observacion ?? '-' }}</td>
                        <td class="text-right {{ $transaccion->tipo === 'ingreso' ? 'badge-ingreso' : 'badge-egreso' }}">
                            {{ $transaccion->tipo === 'ingreso' ? '+' : '-' }} S/ {{ number_format($transaccion->monto, 2) }}
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <!-- SECCIÓN DE FIRMAS -->
    <table class="signatures-table">
        <tr>
            <td class="text-center" style="border: none; width: 50%;">
                <div class="signature-line">
                    Responsable de Caja
                </div>
            </td>
            <td class="text-center" style="border: none; width: 50%;">
                <div class="signature-line">
                    Administración / Auditoría
                </div>
            </td>
        </tr>
    </table>

    <div class="footer-info">
        Documento generado automáticamente por el sistema el {{ $fechaImpresion }}
    </div>

</body>
</html>