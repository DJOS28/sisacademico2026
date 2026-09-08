import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

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
        book: (
            <>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M4 4v15.5" />
                <path d="M20 4H6.5A2.5 2.5 0 0 0 4 6.5" />
                <path d="M20 4v13" />
            </>
        ),
        award: (
            <>
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
            </>
        ),
        fileText: (
            <>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
            </>
        ),
        checkCircle: (
            <>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
            </>
        ),
        alertCircle: (
            <>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
            </>
        ),
        filter: (
            <>
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </>
        ),
    };

    return <svg {...props}>{icons[name] ?? null}</svg>;
}

export default function Index({
    cursos = [],
    cursoSeleccionado = null,
    notasLogros = [],
    notaFinal = '—',
    periodo = '',
}) {
    const handleCursoChange = (e) => {
        const cursoId = e.target.value;
        if (!cursoId) return;

        router.get(
            route('estudiante.notas'),
            { curso_id: cursoId },
            { preserveState: true, replace: true }
        );
    };

    const notaFinalNum = parseFloat(notaFinal);
    const esPromedioValido = !isNaN(notaFinalNum) && notaFinal !== '—';
    const esAprobado = esPromedioValido && notaFinalNum >= 13;

    const totalSubcomponentes = notasLogros.reduce(
        (acc, l) => acc + (l.subcomponentes?.length || 0),
        0
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#315d7a]/10 text-[#315d7a] text-[11px] font-extrabold uppercase tracking-wider">
                            Portal Estudiante
                        </span>
                        <h1 className="mt-1 text-2xl font-bold text-slate-900 tracking-tight">
                            Boleta de Calificaciones
                        </h1>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Evaluaciones e indicadores de logro del periodo lectivo.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs">
                            <Icon name="book" className="h-4 w-4 text-[#315d7a]" />
                            <span>Periodo: <strong className="text-[#315d7a]">{periodo}</strong></span>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Mis Notas - Estudiante" />

            <div className="space-y-6">

                {/* BARRA DE FILTRO Y SELECTOR DE CURSO */}
                <section className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf1f6] text-[#315d7a]">
                                <Icon name="filter" className="h-5 w-5" />
                            </div>
                            <div>
                                <label
                                    htmlFor="select-curso"
                                    className="block text-[11px] font-bold uppercase tracking-wider text-slate-400"
                                >
                                    Asignatura Matriculada
                                </label>
                                <p className="text-xs font-semibold text-slate-700">
                                    Selecciona un curso para consultar su detalle
                                </p>
                            </div>
                        </div>

                        <div className="w-full sm:w-80">
                            {cursos.length > 0 ? (
                                <select
                                    id="select-curso"
                                    value={cursoSeleccionado?.id ?? ''}
                                    onChange={handleCursoChange}
                                    className="w-full rounded-xl border-slate-200 text-xs font-bold text-slate-800 focus:border-[#315d7a] focus:ring-[#315d7a] bg-slate-50/50 py-2.5 px-3"
                                >
                                    {cursos.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.nombre}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="text-xs font-bold text-slate-400 bg-slate-100 p-2.5 rounded-xl text-center">
                                    Sin asignaturas
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* TARJETAS RESUMEN DEL RENDIMIENTO DEL CURSO */}
                {cursoSeleccionado && (
                    <section className="grid gap-4 sm:grid-cols-3">
                        {/* Card 1: Nombre y Contexto */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
                            <div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                    Unidad Didáctica
                                </span>
                                <h2 className="text-base font-bold text-slate-900 leading-snug mt-1">
                                    {cursoSeleccionado.nombre}
                                </h2>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                <span>Indicadores: <strong>{notasLogros.length}</strong></span>
                                <span>Evaluaciones: <strong>{totalSubcomponentes}</strong></span>
                            </div>
                        </div>

                        {/* Card 2: Estado del Curso */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                    Estado Académico
                                </span>
                                <p className="text-sm font-bold text-slate-800 mt-1">
                                    {!esPromedioValido
                                        ? 'En Evaluación'
                                        : esAprobado
                                        ? 'Aprobado Satisfactoriamente'
                                        : 'En Recuperación'}
                                </p>
                            </div>
                            <div className="shrink-0">
                                {!esPromedioValido ? (
                                    <div className="p-3 bg-slate-100 rounded-2xl text-slate-400">
                                        <Icon name="award" className="h-6 w-6" />
                                    </div>
                                ) : esAprobado ? (
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                                        <Icon name="checkCircle" className="h-6 w-6" />
                                    </div>
                                ) : (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-2xl border border-red-100">
                                        <Icon name="alertCircle" className="h-6 w-6" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Card 3: Promedio Acumulado Final */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex items-center justify-between bg-gradient-to-br from-white to-slate-50/80">
                            <div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                    Promedio Final
                                </span>
                                <span className="text-xs text-slate-500 mt-0.5 block">
                                    Cálculo oficial del curso
                                </span>
                            </div>

                            <span
                                className={`text-3xl font-black tracking-tight px-4 py-1.5 rounded-2xl border ${
                                    !esPromedioValido
                                        ? 'bg-slate-100 text-slate-400 border-slate-200'
                                        : esAprobado
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-red-50 text-red-700 border-red-200'
                                }`}
                            >
                                {notaFinal}
                            </span>
                        </div>
                    </section>
                )}

                {/* CONTENIDO PRINCIPAL: LISTADO DE LOGROS Y SUS EVALUACIONES */}
                {notasLogros.length > 0 ? (
                    <div className="space-y-5">
                        {notasLogros.map((logro, index) => {
                            const notaLogroNum = parseFloat(logro.nota);
                            const logroAprobado = !isNaN(notaLogroNum) && notaLogroNum >= 13;

                            return (
                                <div
                                    key={logro.id}
                                    className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs transition hover:border-slate-300"
                                >
                                    {/* Header del Logro */}
                                    <div className="bg-slate-50/70 p-4 px-5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#315d7a] text-white font-extrabold text-xs shadow-2xs">
                                                L{index + 1}
                                            </span>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900">
                                                    {logro.nombre}
                                                </h3>
                                                {logro.descripcion && (
                                                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                                        {logro.descripcion}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase">
                                                Prom. Logro:
                                            </span>
                                            <span
                                                className={`text-sm font-extrabold px-3 py-1 rounded-xl border ${
                                                    logro.nota === '—'
                                                        ? 'bg-slate-100 text-slate-500 border-slate-200'
                                                        : logroAprobado
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-red-50 text-red-700 border-red-200'
                                                }`}
                                            >
                                                {logro.nota}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Tabla Detallada con Criterios */}
                                    {logro.subcomponentes && logro.subcomponentes.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-slate-100/40 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                                                    <tr>
                                                        <th className="py-3 px-5 min-w-[180px]">Evaluación / Dimensión</th>
                                                        <th className="py-3 px-5 text-center w-24">Peso (%)</th>
                                                        <th className="py-3 px-5 min-w-[220px]">Criterios Evaluados</th>
                                                        <th className="py-3 px-5 text-right w-28">Calificación</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {logro.subcomponentes.map((sub) => {
                                                        const notaSubNum = parseFloat(sub.nota);
                                                        const subAprobado = !isNaN(notaSubNum) && notaSubNum >= 13;
                                                        const criterios = sub.criterios || [];

                                                        return (
                                                            <tr key={sub.id} className="hover:bg-slate-50/60 transition">
                                                                {/* Nombre de la Dimensión */}
                                                                <td className="py-3.5 px-5 font-semibold text-slate-800">
                                                                    <div className="flex items-center gap-2.5">
                                                                        <Icon name="fileText" className="h-4 w-4 text-[#315d7a] shrink-0" />
                                                                        <span>{sub.nombre}</span>
                                                                    </div>
                                                                </td>

                                                                {/* Peso */}
                                                                <td className="py-3.5 px-5 text-center text-slate-500 font-medium">
                                                                    {sub.peso ? (
                                                                        <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded">
                                                                            {sub.peso}%
                                                                        </span>
                                                                    ) : (
                                                                        '—'
                                                                    )}
                                                                </td>

                                                                {/* Chips de Criterios (C1, C2, C3, C4...) */}
                                                                <td className="py-3.5 px-5">
                                                                    {criterios.length > 0 ? (
                                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                                            {criterios.map((crit) => {
                                                                                const nCrit = crit.nota;
                                                                                const nCritNum = parseFloat(nCrit);
                                                                                const critOk = !isNaN(nCritNum) && nCritNum >= 13;

                                                                                return (
                                                                                    <span
                                                                                        key={crit.id}
                                                                                        title={crit.nombre || crit.codigo}
                                                                                        className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] font-mono shadow-2xs"
                                                                                    >
                                                                                        <span className="font-bold text-slate-500">{crit.codigo}:</span>
                                                                                        <span className={`font-black ${
                                                                                            nCrit === null || nCrit === undefined
                                                                                                ? 'text-slate-300'
                                                                                                : critOk
                                                                                                ? 'text-emerald-700'
                                                                                                : 'text-rose-600'
                                                                                        }`}>
                                                                                            {nCrit !== null && nCrit !== undefined ? nCrit : '-'}
                                                                                        </span>
                                                                                    </span>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-[11px] text-slate-400 italic">
                                                                            Sin criterios desglosados
                                                                        </span>
                                                                    )}
                                                                </td>

                                                                {/* Calificación Final de la Dimensión */}
                                                                <td className="py-3.5 px-5 text-right">
                                                                    <span
                                                                        className={`font-bold px-2.5 py-1 rounded-lg inline-block text-xs ${
                                                                            sub.nota === '—'
                                                                                ? 'text-slate-400 bg-slate-100'
                                                                                : subAprobado
                                                                                ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/60'
                                                                                : 'text-red-700 bg-red-50 border border-red-200/60 font-black'
                                                                        }`}
                                                                    >
                                                                        {sub.nota}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="p-5 text-center text-xs text-slate-400 italic">
                                            Sin evaluaciones secundarias cargadas para este logro.
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    cursoSeleccionado && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
                            <Icon name="alertCircle" className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                            <h3 className="text-sm font-bold text-slate-800">
                                Sin indicadores o calificaciones
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                El docente no ha registrado notas para este curso todavía.
                            </p>
                        </div>
                    )
                )}

            </div>
        </AuthenticatedLayout>
    );
}