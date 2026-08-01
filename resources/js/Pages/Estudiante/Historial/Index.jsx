import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

function Icon({ name, className = 'h-5 w-5' }) {
    const props = {
        className,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
    };

    const icons = {
        award: (
            <>
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
            </>
        ),
        bookOpen: (
            <>
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </>
        ),
        checkCircle: (
            <>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
            </>
        ),
        calendar: (
            <>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </>
        ),
    };

    return <svg {...props}>{icons[name] ?? null}</svg>;
}

export default function Index({ historial = [], resumen = null }) {
    const promedioNum = parseFloat(resumen?.promedio_acumulado);
    const esPromedioAprobado = !isNaN(promedioNum) && promedioNum >= 11;

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#315d7a]/10 text-[#315d7a] text-[11px] font-extrabold uppercase tracking-wider">
                        Portal Estudiante
                    </span>
                    <h1 className="mt-1 text-2xl font-bold text-slate-900 tracking-tight">
                        Historial Académico
                    </h1>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Consolidado e historia de asignaturas concluidas y promedios por período.
                    </p>
                </div>
            }
        >
            <Head title="Historial Académico - Estudiante" />

            <div className="space-y-6">

                {/* 1. CARDS MÉTIRCAS GLOBALES DE LA CARRERA */}
                {resumen && (
                    <section className="grid gap-4 sm:grid-cols-3">
                        {/* Promedio Ponderado Acumulado */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                    Promedio Acumulado
                                </span>
                                <span className="text-xs font-semibold text-slate-500 mt-0.5 block">
                                    Ponderado histórico
                                </span>
                            </div>
                            <span
                                className={`text-3xl font-black px-3.5 py-1 rounded-2xl border ${
                                    resumen.promedio_acumulado === '—'
                                        ? 'bg-slate-100 text-slate-400 border-slate-200'
                                        : esPromedioAprobado
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-red-50 text-red-700 border-red-200'
                                }`}
                            >
                                {resumen.promedio_acumulado}
                            </span>
                        </div>

                        {/* Créditos Aprobados */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                    Créditos Aprobados
                                </span>
                                <span className="text-2xl font-black text-slate-900 mt-1 block">
                                    {resumen.creditos_aprobados} <span className="text-xs text-slate-400 font-bold">Créditos</span>
                                </span>
                            </div>
                            <div className="p-3 bg-sky-50 text-[#315d7a] rounded-2xl border border-sky-100">
                                <Icon name="award" className="h-6 w-6" />
                            </div>
                        </div>

                        {/* Cursos Concluidos */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                    Cursos Evaluados
                                </span>
                                <span className="text-2xl font-black text-slate-900 mt-1 block">
                                    {resumen.cursos_evaluados} <span className="text-xs text-slate-400 font-bold">Asignaturas</span>
                                </span>
                            </div>
                            <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl border border-slate-200">
                                <Icon name="bookOpen" className="h-6 w-6" />
                            </div>
                        </div>
                    </section>
                )}

                {/* 2. RECORRIDO DE PERIODOS LECTIVOS */}
                {historial.length > 0 ? (
                    <div className="space-y-6">
                        {historial.map((item) => (
                            <div
                                key={item.periodo_id}
                                className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs"
                            >
                                {/* Header del Periodo Lectivo */}
                                <div className="bg-slate-50/80 p-4 px-5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#315d7a] text-white font-extrabold">
                                            <Icon name="calendar" className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">
                                                Periodo Académico: {item.periodo_nombre}
                                            </h3>
                                            <p className="text-[11px] text-slate-400 font-semibold">
                                                {item.cursos.length} Cursos inscritos
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase">
                                            Promedio del Periodo:
                                        </span>
                                        <span className="text-sm font-extrabold px-3 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
                                            {item.promedio_periodo}
                                        </span>
                                    </div>
                                </div>

                                {/* Tabla de Cursos del Periodo */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-100/40 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                                            <tr>
                                                <th className="py-3 px-5">Asignatura</th>
                                                <th className="py-3 px-5">Nivel / Semestre</th>
                                                <th className="py-3 px-5 text-center">Créditos</th>
                                                <th className="py-3 px-5 text-center">Condición</th>
                                                <th className="py-3 px-5 text-right">Nota Final</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {item.cursos.map((c) => (
                                                <tr key={c.curso_id} className="hover:bg-slate-50/60 transition">
                                                    <td className="py-3.5 px-5 font-bold text-slate-900">
                                                        {c.nombre}
                                                    </td>

                                                    <td className="py-3.5 px-5 font-medium text-slate-500">
                                                        {c.semestre}
                                                    </td>

                                                    <td className="py-3.5 px-5 text-center font-bold text-slate-700">
                                                        {c.creditos}
                                                    </td>

                                                    <td className="py-3.5 px-5 text-center">
                                                        {c.cursando ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                                                                En Cursado
                                                            </span>
                                                        ) : c.aprobado ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                                                                Aprobado
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-bold text-[10px]">
                                                                Desaprobado
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="py-3.5 px-5 text-right">
                                                        <span
                                                            className={`font-black px-2.5 py-1 rounded-lg text-xs ${
                                                                c.nota === '—'
                                                                    ? 'text-slate-400'
                                                                    : c.aprobado
                                                                    ? 'text-emerald-700 bg-emerald-50'
                                                                    : 'text-red-600 bg-red-50'
                                                            }`}
                                                        >
                                                            {c.nota}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
                        <Icon name="bookOpen" className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                        <h3 className="text-sm font-bold text-slate-800">
                            Sin historial de matrículas
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            No se registran periodos académicos cursados formalmente.
                        </p>
                    </div>
                )}

            </div>
        </AuthenticatedLayout>
    );
}