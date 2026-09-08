import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function CajaDetalle({ caja = {}, pagosPostulantes = [], transacciones = [], resumenFinanciero = {} }) {
    const imprimirPDF = async () => {
        try {
            const response = await axios.post(route('reportes.cajas.pdf', caja.id_caja), {}, { responseType: 'blob' });
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');
        } catch (error) {
            Swal.fire('Error', 'No se pudo generar el reporte PDF', 'error');
        }
    };

    // Formateador nulo-seguro
    const formatMoney = (val) => parseFloat(val || 0).toFixed(2);

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-slate-800">Arqueo y Cuadre de Caja #{caja.id_caja}</h1>}>
            <Head title={`Arqueo Caja #${caja.id_caja}`} />

            <div className="w-full space-y-6">
                <div className="flex justify-between items-center">
                    <Link href={route('reportes.cajas.index')} className="text-xs font-bold text-slate-500 hover:text-slate-800 transition">
                        ← Volver a Historial
                    </Link>
                    <button
                        onClick={imprimirPDF}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-red-700 transition cursor-pointer"
                    >
                        📄 Exportar Reporte PDF
                    </button>
                </div>

                {/* TARJETA DE RESUMEN DE ARQUEO / CUADRE */}
                <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                    <h2 className="text-base font-bold text-slate-800 border-b pb-3">Resumen Balanza Financiera (Arqueo)</h2>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-slate-500 font-medium">Monto Apertura</p>
                            <p className="text-lg font-bold text-slate-800">S/ {formatMoney(resumenFinanciero.apertura)}</p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                            <p className="text-emerald-700 font-medium">(+) Cobros a Alumnos</p>
                            <p className="text-lg font-bold text-emerald-800">S/ {formatMoney(resumenFinanciero.total_ingresos_pagos)}</p>
                        </div>
                        <div className="p-3 bg-rose-50 rounded-lg border border-rose-100">
                            <p className="text-rose-700 font-medium">(-) Total Egresos</p>
                            <p className="text-lg font-bold text-rose-800">S/ {formatMoney(resumenFinanciero.total_egresos)}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-blue-900 font-bold">(=) Saldo Teórico Esperado</p>
                            <p className="text-lg font-black text-blue-900">S/ {formatMoney(resumenFinanciero.saldo_teorico)}</p>
                        </div>
                    </div>

                    {caja.fecha_cierre && (
                        <div className={`p-4 rounded-lg flex justify-between items-center text-xs font-bold ${resumenFinanciero.diferencia === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                            <span>Saldo Final Declarado: S/ {formatMoney(resumenFinanciero.saldo_final)}</span>
                            <span>
                                Diferencia / Cuadre: S/ {formatMoney(resumenFinanciero.diferencia)} {resumenFinanciero.diferencia === 0 ? '(CUADRADO)' : ''}
                            </span>
                        </div>
                    )}
                </div>

                {/* TABLA DE DETALLE DE RECAUDACIÓN (POSTULANTES / ESTUDIANTES) */}
                <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Detalle de Cobros Recaudados</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 uppercase text-slate-500 font-bold border-b">
                                <tr>
                                    <th className="p-3"># Ticket</th>
                                    <th className="p-3">Estudiante</th>
                                    <th className="p-3">Concepto</th>
                                    <th className="p-3">Fecha</th>
                                    <th className="p-3 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {pagosPostulantes.length > 0 ? (
                                    pagosPostulantes.map((p) => (
                                        <tr key={p.id_pagos} className="hover:bg-slate-50 transition">
                                            <td className="p-3 font-bold text-slate-800">#{String(p.id_pagos).padStart(6, '0')}</td>
                                            <td className="p-3 font-semibold text-slate-800">
                                                {p.postulante?.nombre_completo || `${p.postulante?.nombres || ''} ${p.postulante?.apellidos || ''}`.trim() || 'Estudiante'}
                                            </td>
                                            <td className="p-3 text-slate-600">{p.concepto?.nombre || 'General'}</td>
                                            <td className="p-3 text-slate-500">{p.fecha}</td>
                                            <td className="p-3 text-right font-bold text-emerald-600">S/ {formatMoney(p.monto)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="p-4 text-center text-slate-400">No hay registros de cobros directos a estudiantes en esta caja.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* TABLA DE TRANSACCIONES OPERATIVAS (EGRESOS / INGRESOS MANUALES) */}
                {transacciones.length > 0 && (
                    <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                        <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Transacciones Operativas Manuales</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 uppercase text-slate-500 font-bold border-b">
                                    <tr>
                                        <th className="p-3"># ID</th>
                                        <th className="p-3">Tipo</th>
                                        <th className="p-3">Persona / Destinatario</th>
                                        <th className="p-3">Observación</th>
                                        <th className="p-3">Fecha</th>
                                        <th className="p-3 text-right">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {transacciones.map((t) => (
                                        <tr key={t.id_transaccion} className="hover:bg-slate-50 transition">
                                            <td className="p-3 font-bold text-slate-800">#{t.id_transaccion}</td>
                                            <td className="p-3 font-bold">
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${t.tipo === 'ingreso' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                    {t.tipo}
                                                </span>
                                            </td>
                                            <td className="p-3 font-medium text-slate-800">
                                                {`${t.nombres || ''} ${t.apellidos || ''}`.trim() || t.dni || 'N/A'}
                                            </td>
                                            <td className="p-3 text-slate-500">{t.observacion || '-'}</td>
                                            <td className="p-3 text-slate-500">{t.fecha}</td>
                                            <td className={`p-3 text-right font-bold ${t.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {t.tipo === 'ingreso' ? '+' : '-'} S/ {formatMoney(t.monto)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}