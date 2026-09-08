import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

export default function Dashboard({
    metricas,
    categoriasStats = [],
    ultimosBienes = [],
    categorias = [],
}) {
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [filtroSituacion, setFiltroSituacion] = useState('');

    const descargarEtiquetas = () => {
        const url = route('patrimonio.reportes.etiquetas', {
            categoria_id: filtroCategoria || null,
            situacion: filtroSituacion || null,
        });
        window.open(url, '_blank');
    };

    const descargarInventario = () => {
        const url = route('patrimonio.reportes.inventario', {
            categoria_id: filtroCategoria || null,
        });
        window.open(url, '_blank');
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reportes y Métricas Patrimoniales</h1>
                        <p className="text-xs text-slate-500">Indicadores de activos, valorización contable y generación de etiquetas QR.</p>
                    </div>
                </div>
            }
        >
            <Head title="Reportes de Patrimonio" />

            <div className="space-y-6">
                {/* 1. TARJETAS DE INDICADORES CLAVE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <span className="text-xs font-semibold text-slate-500 block">Total Activos Registrados</span>
                        <strong className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                            {metricas?.total_bienes || 0}
                        </strong>
                        <span className="text-[11px] text-emerald-600 font-medium block mt-1">
                            ✓ Inventario General
                        </span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <span className="text-xs font-semibold text-slate-500 block">Valorización Contable</span>
                        <strong className="text-2xl font-black text-[#315d7a] font-mono mt-1 block">
                            S/ {Number(metricas?.valor_total || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </strong>
                        <span className="text-[11px] text-slate-500 font-medium block mt-1">
                            Sin incluir bienes de baja
                        </span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <span className="text-xs font-semibold text-slate-500 block">Bienes Operativos</span>
                        <strong className="text-2xl font-black text-emerald-700 font-mono mt-1 block">
                            {metricas?.por_situacion?.Operativo || 0}
                        </strong>
                        <span className="text-[11px] text-emerald-600 font-medium block mt-1">
                            Disponibles para docencia y gestión
                        </span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <span className="text-xs font-semibold text-slate-500 block">En Mantenimiento / Taller</span>
                        <strong className="text-2xl font-black text-amber-600 font-mono mt-1 block">
                            {metricas?.por_situacion?.En_Mantenimiento || 0}
                        </strong>
                        <span className="text-[11px] text-amber-600 font-medium block mt-1">
                            Bajo servicio técnico activo
                        </span>
                    </div>
                </div>

                {/* 2. PANEL DE GENERACIÓN DE REPORTES Y ETIQUETAS QR */}
                <div className="bg-[#315d7a] p-6 rounded-2xl text-white shadow-md">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-base font-bold flex items-center gap-2 text-white">
                                🖨️ Centro de Emisión de Reportes y Etiquetas QR
                            </h2>
                            <p className="text-xs text-sky-100 mt-1 max-w-xl">
                                Seleccione la categoría o situación para generar la hoja de stickers adhesivos con código QR imprimible o el consolidado de inventario institucional.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                            <select
                                value={filtroCategoria}
                                onChange={(e) => setFiltroCategoria(e.target.value)}
                                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none shadow-xs cursor-pointer focus:border-[#315d7a]"
                            >
                                <option value="">Todas las categorías</option>
                                {categorias.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.nombre}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                onClick={descargarEtiquetas}
                                className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#315d7a] transition hover:bg-sky-50 shadow-xs cursor-pointer"
                            >
                                🏷️ Imprimir Etiquetas QR
                            </button>

                            <button
                                type="button"
                                onClick={descargarInventario}
                                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-xs cursor-pointer"
                            >
                                📄 Reporte Inventario PDF
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. RESUMEN POR FAMILIA / CATEGORÍA */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                            Distribución y Valor por Familia de Bienes
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="text-slate-500 font-bold border-b border-slate-200 bg-slate-50">
                                        <th className="py-2.5 px-3">Categoría</th>
                                        <th className="py-2.5 px-3 text-center">Total Activos</th>
                                        <th className="py-2.5 px-3 text-center">Operativos</th>
                                        <th className="py-2.5 px-3 text-right">Valorización Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                                    {categoriasStats.map((cs) => (
                                        <tr key={cs.id} className="hover:bg-slate-50 transition">
                                            <td className="py-3 px-3 font-sans font-semibold text-slate-900">
                                                [{cs.codigo}] {cs.nombre}
                                            </td>
                                            <td className="py-3 px-3 text-center font-bold text-slate-800">
                                                {cs.bienes_count}
                                            </td>
                                            <td className="py-3 px-3 text-center font-bold text-emerald-600">
                                                {cs.activos_operativos_count}
                                            </td>
                                            <td className="py-3 px-3 text-right font-bold text-[#315d7a]">
                                                S/ {Number(cs.bienes_sum_valor_adquisicion || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ESTADO DE CONSERVACIÓN */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                            Estado de Conservación
                        </h2>
                        <div className="space-y-3.5">
                            {Object.entries(metricas?.por_conservacion || {}).map(([estado, cantidad]) => {
                                const total = metricas?.total_bienes || 1;
                                const pct = Math.round((cantidad / total) * 100);

                                return (
                                    <div key={estado} className="space-y-1">
                                        <div className="flex justify-between text-xs font-semibold">
                                            <span className="text-slate-700">{estado}</span>
                                            <span className="text-slate-900 font-mono font-bold">{cantidad} ({pct}%)</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${
                                                    estado === 'Nuevo' || estado === 'Bueno'
                                                        ? 'bg-emerald-500'
                                                        : estado === 'Regular'
                                                        ? 'bg-amber-500'
                                                        : 'bg-rose-500'
                                                }`}
                                                style={{ width: `${pct}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}