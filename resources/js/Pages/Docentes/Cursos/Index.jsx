import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

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
        clock: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
            </>
        ),
        filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
        award: (
            <>
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
            </>
        ),
        fileText: (
            <>
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
            </>
        ),
        folder: (
            <>
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </>
        ),
    };

    return <svg {...props}>{icons[name] ?? null}</svg>;
}

export default function Index({
    periodos = [],
    semestres = [],
    planes = [],
    cursos = [],
    filters = {},
}) {
    const [periodoId, setPeriodoId] = useState(filters.periodo_id ?? '');
    const [semestreId, setSemestreId] = useState(filters.semestre_id ?? '');
    const [planEstudioId, setPlanEstudioId] = useState(filters.plan_estudio_id ?? '');

    // Aplicar filtros enviando datos por POST
    const handleFilterChange = (nuevoPeriodo, nuevoSemestre, nuevoPlan) => {
        router.post(
            route('docente.cursos'),
            {
                periodo_id: nuevoPeriodo,
                semestre_id: nuevoSemestre,
                plan_estudio_id: nuevoPlan,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    // Función para abrir la generación del PDF del Acta Final
    const handleExportActaFinal = (curso) => {
        const url = route('reportes.acta_final', {
            id: curso.curso_id,
            seccion: curso.seccion_id,
            turno: curso.turno_id || '',
        });
        window.open(url, '_blank');
    };

    // Función para abrir la Carátula del Curso
    const handleExportCaratula = (curso) => {
        const url = route('reportes.caratula', {
            curso_id: curso.curso_id,
            seccion_id: curso.seccion_id,
            periodo_id: periodoId || filters.periodo_id,
        });
        window.open(url, '_blank');
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#315d7a]">
                            Portal docente
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-slate-900">
                            Mis Cursos Asignados
                        </h1>
                        <p className="mt-1 text-xs text-slate-500">
                            Gestiona tu carga lectiva, consulta horarios y registra los logros de aprendizaje.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
                        <Icon name="book" className="h-4 w-4 text-[#315d7a]" />
                        <span className="text-xs font-bold text-slate-700">
                            Total: <span className="text-[#315d7a]">{cursos.length}</span> Asignatura(s)
                        </span>
                    </div>
                </div>
            }
        >
            <Head title="Mis Cursos - Docente" />

            <div className="space-y-6">
                
                {/* BARRA DE FILTROS */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
                        <Icon name="filter" className="h-3.5 w-3.5 text-[#315d7a]" />
                        <span>Filtros de búsqueda:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Selector de Periodo */}
                        <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                Periodo Lectivo:
                            </label>
                            <select
                                value={periodoId}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setPeriodoId(val);
                                    handleFilterChange(val, semestreId, planEstudioId);
                                }}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#315d7a] focus:bg-white focus:ring-2 focus:ring-[#315d7a]/10 transition"
                            >
                                <option value="">-- Todos los Periodos --</option>
                                {periodos.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Selector de Plan de Estudio */}
                        <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                Plan de Estudio:
                            </label>
                            <select
                                value={planEstudioId}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setPlanEstudioId(val);
                                    handleFilterChange(periodoId, semestreId, val);
                                }}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#315d7a] focus:bg-white focus:ring-2 focus:ring-[#315d7a]/10 transition"
                            >
                                <option value="">-- Todos los Planes --</option>
                                {planes.map((pl) => (
                                    <option key={pl.id} value={pl.id}>
                                        {pl.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Selector de Semestre / Ciclo */}
                        <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                Semestre / Ciclo:
                            </label>
                            <select
                                value={semestreId}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSemestreId(val);
                                    handleFilterChange(periodoId, val, planEstudioId);
                                }}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#315d7a] focus:bg-white focus:ring-2 focus:ring-[#315d7a]/10 transition"
                            >
                                <option value="">-- Todos los Ciclos --</option>
                                {semestres.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        Semestre {s.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* GRILLA DE TARJETAS DE CURSO */}
                {cursos.length > 0 ? (
                    <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {cursos.map((curso) => (
                            <div
                                key={`${curso.curso_id}_${curso.seccion_id}`}
                                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md hover:border-[#315d7a]/30 transition-all flex flex-col justify-between group"
                            >
                                <div>
                                    {/* Etiquetas / Badges */}
                                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                                        <span className="bg-sky-50 text-sky-700 border border-sky-200/60 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                            Semestre {curso.semestre_nombre ?? '—'}
                                        </span>
                                        <span className="bg-amber-50 text-amber-700 border border-amber-200/60 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                            Sec. {curso.seccion_nombre ?? '—'}
                                        </span>
                                        <span className="bg-slate-100 text-slate-600 border border-slate-200/60 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                            {curso.turno_nombre ?? '—'}
                                        </span>
                                    </div>

                                    {/* Nombre y Plan */}
                                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#315d7a] transition leading-snug">
                                        {curso.curso_nombre}
                                    </h3>
                                    
                                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                                        <span>Código: {curso.curso_codigo || 'N/A'}</span>
                                        {curso.plan_estudio && (
                                            <>
                                                <span>•</span>
                                                <span className="truncate max-w-[180px]" title={curso.plan_estudio}>
                                                    {curso.plan_estudio}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {/* Horarios en Píldoras */}
                                    <div className="mt-4 pt-3 border-t border-slate-100">
                                        <p className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center gap-1">
                                            <Icon name="clock" className="h-3.5 w-3.5 text-[#315d7a]" />
                                            Horario de dictado:
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {curso.horarios.map((h, idx) => (
                                                <div 
                                                    key={idx} 
                                                    className="bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 font-medium flex items-center gap-1"
                                                >
                                                    <span className="font-bold text-slate-900">{h.dia}:</span>
                                                    <span>{h.hora_inicio} - {h.hora_fin}</span>
                                                    {h.aula && (
                                                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1 rounded font-mono ml-0.5">
                                                            {h.aula}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Botonera Inferior Completa */}
                                <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col space-y-2">
                                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                                        <span>{curso.total_bloques} bloque(s) / sem</span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {/* Botón Logros */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                router.post(route('cursos.logros'), {
                                                    curso_id: curso.curso_id,
                                                    seccion_id: curso.seccion_id,
                                                    periodo_id: periodoId,
                                                });
                                            }}
                                            className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition border border-amber-200/80 hover:border-amber-500 cursor-pointer"
                                        >
                                            <Icon name="award" className="h-3.5 w-3.5" />
                                            <span>Logros</span>
                                        </button>

                                        {/* Botón Acta Final */}
                                        <button
                                            type="button"
                                            onClick={() => handleExportActaFinal(curso)}
                                            className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition border border-rose-200/80 hover:border-rose-600 cursor-pointer"
                                        >
                                            <Icon name="fileText" className="h-3.5 w-3.5" />
                                            <span>Acta Final</span>
                                        </button>

                                        {/* Botón Carátula */}
                                        <button
                                            type="button"
                                            onClick={() => handleExportCaratula(curso)}
                                            className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition border border-indigo-200/80 hover:border-indigo-600 cursor-pointer"
                                        >
                                            <Icon name="folder" className="h-3.5 w-3.5" />
                                            <span>Carátula</span>
                                        </button>

                                        {/* Botón Gestionar */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                router.post(route('cursos.gestionar'), {
                                                    curso_id: curso.curso_id,
                                                    seccion_id: curso.seccion_id,
                                                    periodo_id: filters.periodo_id,
                                                });
                                            }}
                                            className="inline-flex items-center gap-1 bg-[#315d7a] hover:bg-[#254860] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs ml-auto cursor-pointer"
                                        >
                                            <span>Gestionar</span>
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Estado Vacío */
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
                        <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                            <Icon name="book" className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">
                            No se encontraron asignaturas asignadas
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            No existen horarios programados para los filtros de periodo, plan de estudio o ciclo seleccionados.
                        </p>
                    </div>
                )}

            </div>
        </AuthenticatedLayout>
    );
}