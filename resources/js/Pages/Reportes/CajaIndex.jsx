import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function CajaIndex({ cajasHistorial = { data: [] }, totales = {}, filters = {} }) {
    const [fechaInicio, setFechaInicio] = useState(filters.fecha_inicio || '');
    const [fechaFin, setFechaFin] = useState(filters.fecha_fin || '');

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('reportes.cajas.index'), { fecha_inicio: fechaInicio, fecha_fin: fechaFin }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-slate-800">Historial y Reportes de Cajas</h1>}>
            <Head title="Reportes de Caja" />

            <div className="w-full space-y-6">
                {/* TARJETAS KPI DE MÉTRICAS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold text-slate-500 uppercase">Total Recaudado (Cobros)</p>
                        <p className="text-2xl font-black text-emerald-600 mt-1">
                            S/ {parseFloat(totales.total_recaudado || 0).toFixed(2)}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold text-slate-500 uppercase">Total Egresos</p>
                        <p className="text-2xl font-black text-rose-600 mt-1">
                            S/ {parseFloat(totales.total_egresos || 0).toFixed(2)}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold text-slate-500 uppercase">Cajas Cerradas</p>
                        <p className="text-2xl font-black text-slate-800 mt-1">
                            {totales.cajas_cerradas || 0} Sesiones
                        </p>
                    </div>
                </div>

                {/* FILTROS E HISTORIAL */}
                <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b pb-4">
                        <h2 className="text-base font-bold text-slate-800">Historial de Turnos y Sesiones de Caja</h2>

                        <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-2">
                            <div>
                                <input
                                    type="date"
                                    value={fechaInicio}
                                    onChange={(e) => setFechaInicio(e.target.value)}
                                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-[#315d7a] outline-none"
                                />
                            </div>
                            <span className="text-xs text-slate-400">a</span>
                            <div>
                                <input
                                    type="date"
                                    value={fechaFin}
                                    onChange={(e) => setFechaFin(e.target.value)}
                                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-[#315d7a] outline-none"
                                />
                            </div>
                            <button type="submit" className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-900 transition">
                                Filtrar
                            </button>
                        </form>
                    </div>

                    {/* TABLA USANDO LOS CAMPOS DIRECTOS DE LA TABLA `caja` */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 uppercase text-slate-500 font-bold border-b">
                                <tr>
                                    <th className="p-3">ID</th>
                                    <th className="p-3">Nombre / Caja</th>
                                    <th className="p-3">Apertura</th>
                                    <th className="p-3">Cierre</th>
                                    <th className="p-3">Monto Apertura</th>
                                    <th className="p-3">Saldo Final</th>
                                    <th className="p-3 text-center">Estado</th>
                                    <th className="p-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {cajasHistorial.data.map((c) => (
                                    <tr key={c.id_caja} className="hover:bg-slate-50 transition">
                                        <td className="p-3 font-bold text-slate-800">#{c.id_caja}</td>
                                        <td className="p-3 text-slate-700 font-medium">
                                            {c.nombre || `Caja #${c.id_caja}`}
                                        </td>
                                        <td className="p-3 text-slate-500">{c.fecha_apertura}</td>
                                        <td className="p-3 text-slate-500">{c.fecha_cierre || 'En curso'}</td>
                                        <td className="p-3 font-semibold text-slate-700">
                                            S/ {parseFloat(c.apertura || 0).toFixed(2)}
                                        </td>
                                        <td className="p-3 font-bold text-slate-900">
                                            {c.saldo_final !== null && c.saldo_final !== undefined
                                                ? `S/ ${parseFloat(c.saldo_final).toFixed(2)}`
                                                : '-'}
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.fecha_cierre ? 'bg-slate-100 text-slate-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {c.fecha_cierre ? 'CERRADA' : 'ABIERTA'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <Link
                                                href={route('reportes.cajas.detalle', c.id_caja)}
                                                className="inline-flex items-center gap-1 rounded bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 transition"
                                            >
                                                🔍 Ver Arqueo
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}