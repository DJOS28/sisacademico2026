import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function PagosIndex({ pagos = [], conceptos = [], resumen, estudiante }) {
    const getBadgeEstado = (est) => {
        switch (est?.toLowerCase()) {
            case 'aceptado':
                return <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">✅ Aprobado / Cancelado</span>;
            case 'anulado':
                return <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200">❌ Anulado</span>;
            default:
                return <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">⏳ En Proceso</span>;
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">💳 Mis Pagos y Tasas Académicas</h1>
                        <p className="mt-1 text-xs text-slate-500">
                            Consulta tu historial de pagos abonados en caja y el tarifario de trámites de la institución.
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Mis Pagos" />

            <div className="space-y-6">
                {/* TARJETAS DE RESUMEN FINANCIERO */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 font-bold text-emerald-600 text-xl border border-emerald-100">
                            💰
                        </div>
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Abonado</span>
                            <p className="text-xl font-black text-slate-900">S/ {resumen?.total_pagado ?? '0.00'}</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-600 text-xl border border-blue-100">
                            📑
                        </div>
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Comprobantes</span>
                            <p className="text-xl font-black text-slate-900">{resumen?.total_pagos ?? 0} Transacciones</p>
                        </div>
                    </div>

                    {estudiante?.comprobante_pago && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Comprobante de Inscripción</span>
                                <p className="text-xs font-bold text-slate-800 mt-0.5">Voucher Adjunto</p>
                            </div>
                            <a
                                href={estudiante.comprobante_pago.startsWith('/') ? estudiante.comprobante_pago : `/storage/${estudiante.comprobante_pago}`}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-xl bg-[#315d7a] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#274c64] transition shadow-xs"
                            >
                                📄 Ver Voucher
                            </a>
                        </div>
                    )}
                </div>

                {/* HISTORIAL DE PAGOS */}
                <div className="space-y-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">📜 Historial de Transacciones Abonadas</h2>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    {['Comprobante / Concepto', 'Fecha', 'Caja / Sede', 'Monto', 'Estado', 'Observación'].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pagos.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                                        <td className="px-4 py-3.5 text-xs font-bold text-slate-800">
                                            {item.concepto}
                                        </td>

                                        <td className="px-4 py-3.5 text-xs text-slate-600 font-medium">
                                            {item.fecha}
                                        </td>

                                        <td className="px-4 py-3.5 text-xs text-slate-600">
                                            🏢 {item.caja}
                                        </td>

                                        <td className="px-4 py-3.5 text-xs font-black text-emerald-700">
                                            S/ {item.monto}
                                        </td>

                                        <td className="px-4 py-3.5 text-xs">
                                            {getBadgeEstado(item.estado)}
                                        </td>

                                        <td className="px-4 py-3.5 text-xs text-slate-500 italic">
                                            {item.observacion}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {pagos.length === 0 && (
                            <div className="p-12 text-center text-xs font-bold text-slate-400">
                                No registras transacciones de pago en el sistema.
                            </div>
                        )}
                    </div>
                </div>

                {/* TARIFARIO DE CONCEPTOS VIGENTES */}
                <div className="space-y-3 pt-4 border-t border-slate-200">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">🏷️ Tarifario de Conceptos de Pago Vigentes</h2>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {conceptos.map((c) => (
                            <div key={c.id_concepto} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-xs text-slate-900">{c.nombre}</p>
                                    <span className="text-[10px] font-semibold uppercase text-slate-400">{c.tipo_concepto || 'General'}</span>
                                </div>
                                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-black text-[#315d7a]">
                                    S/ {numberFormat(c.precio)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function numberFormat(val) {
    return isNaN(val) ? '0.00' : sprintf('%.2f', val);
}

function sprintf(format, number) {
    return parseFloat(number).toFixed(2);
}