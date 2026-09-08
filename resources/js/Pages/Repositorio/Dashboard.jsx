import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({
    totales = {},
    porCarrera = [],
    porCategoria = [],
    porAnio = [],
    topRecursos = [],
}) {
    const maxPorCarrera = Math.max(...porCarrera.map((c) => c.total), 1);
    const maxPorCategoria = Math.max(...porCategoria.map((c) => c.total), 1);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Panel Analítico del Repositorio</h1>
                        <p className="text-xs text-slate-500">Métricas de impacto, producción investigativa y descargas institucionales.</p>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href={route('repositorio-recursos.index')}
                            className="rounded-xl bg-[#315d7a] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#274b63] shadow-xs"
                        >
                            Ver Publicaciones
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard - Repositorio Digital" />

            <div className="space-y-6">
                {/* 1. TARJETAS DE INDICADORES CLAVE (KPIs) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-sky-50 text-[#315d7a] flex items-center justify-center text-2xl font-bold">
                            📚
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Total Recursos</span>
                            <span className="text-xl font-extrabold text-slate-900">{totales.documentos ?? 0}</span>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-2xl font-bold">
                            👥
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Autores / Tesistas</span>
                            <span className="text-xl font-extrabold text-slate-900">{totales.autores ?? 0}</span>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl font-bold">
                            👁️
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Visualizaciones</span>
                            <span className="text-xl font-extrabold text-slate-900">{totales.visitas ?? 0}</span>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl font-bold">
                            ⬇️
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Descargas Totales</span>
                            <span className="text-xl font-extrabold text-emerald-700">{totales.descargas ?? 0}</span>
                        </div>
                    </div>
                </div>

                {/* 2. DISTRIBUCIÓN POR CARRERAS Y CATEGORÍAS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Producción por Programa de Estudios */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Producción por Programa Académico
                            </h2>
                            <span className="text-[11px] text-slate-400 font-mono">{porCarrera.length} Carreras</span>
                        </div>

                        <div className="space-y-3.5">
                            {porCarrera.length > 0 ? (
                                porCarrera.map((c, idx) => (
                                    <div key={idx} className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                                            <span className="truncate max-w-[280px]">{c.nombre}</span>
                                            <span className="font-mono text-[#315d7a] font-bold">{c.total} obras</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#315d7a] rounded-full transition-all duration-500"
                                                style={{ width: `${(c.total / maxPorCarrera) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 italic py-8 text-center">Sin publicaciones asignadas a carreras.</p>
                            )}
                        </div>
                    </div>

                    {/* Distribución por Colecciones / Categorías */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Documentos por Tipo / Categoría
                            </h2>
                            <span className="text-[11px] text-slate-400 font-mono">{porCategoria.length} Colecciones</span>
                        </div>

                        <div className="space-y-3.5">
                            {porCategoria.length > 0 ? (
                                porCategoria.map((cat, idx) => (
                                    <div key={idx} className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                                            <span>{cat.nombre}</span>
                                            <span className="font-mono text-purple-700 font-bold">{cat.total} docs</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-600 rounded-full transition-all duration-500"
                                                style={{ width: `${(cat.total / maxPorCategoria) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 italic py-8 text-center">Sin publicaciones por categoría.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. RANKING DE DOCUMENTOS MÁS CONSULTADOS Y TENDENCIA POR AÑO */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Top 5 Obras más leídas */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                        <div className="border-b border-slate-100 pb-3">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Top Publicaciones con Mayor Impacto
                            </h2>
                            <p className="text-[11px] text-slate-500">Documentos con mayor índice de lectura y descargas.</p>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {topRecursos.length > 0 ? (
                                topRecursos.map((r, i) => (
                                    <div key={r.id} className="py-3 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <span className="h-7 w-7 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold flex items-center justify-center text-xs">
                                                #{i + 1}
                                            </span>
                                            <div>
                                                <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">
                                                    {r.titulo}
                                                </h3>
                                                <span className="text-[10px] text-slate-400 font-medium block">
                                                    {r.plan_estudio?.nombre || 'General'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 font-mono text-[11px] flex-shrink-0">
                                            <span className="bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                                👁️ {r.visitas}
                                            </span>
                                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 font-bold">
                                                ⬇️ {r.descargas}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 italic py-6 text-center">No hay registros de lecturas.</p>
                            )}
                        </div>
                    </div>

                    {/* Producción Anual */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                        <div className="border-b border-slate-100 pb-3">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Producción por Año
                            </h2>
                            <p className="text-[11px] text-slate-500">Histórico de publicaciones.</p>
                        </div>

                        <div className="space-y-2.5">
                            {porAnio.length > 0 ? (
                                porAnio.map((a, i) => (
                                    <div key={i} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl text-xs">
                                        <span className="font-bold text-slate-700 font-mono">Año {a.anio_publicacion}</span>
                                        <span className="bg-[#315d7a] text-white px-2.5 py-0.5 rounded-md font-mono font-bold text-[11px]">
                                            {a.total} tesis
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 italic py-6 text-center">Sin histórico anual.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}