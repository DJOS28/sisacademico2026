import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

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
        user: (
            <>
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </>
        ),
        monitor: (
            <>
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
            </>
        ),
    };

    return <svg {...props}>{icons[name] ?? null}</svg>;
}

export default function Index({ cursos = [], periodo = '' }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#315d7a]">
                            Portal Estudiante
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-slate-900">
                            Mis Cursos Matriculados
                        </h1>
                        <p className="mt-1 text-xs text-slate-500">
                            Selecciona una asignatura para acceder a su Aula Virtual.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                        <Icon name="book" className="h-4 w-4 text-[#315d7a]" />
                        <span className="text-xs font-bold text-slate-700">
                            Periodo: <span className="text-[#315d7a]">{periodo}</span>
                        </span>
                    </div>
                </div>
            }
        >
            <Head title="Mis Cursos - Estudiante" />

            <div className="space-y-6">
                {cursos.length > 0 ? (
                    <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {cursos.map((c) => (
                            <div
                                key={c.curso_id}
                                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                                        <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                            {c.semestre}
                                        </span>
                                        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                            Sec. {c.seccion}
                                        </span>
                                        <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                            {c.turno}
                                        </span>
                                    </div>

                                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                                        {c.nombre}
                                    </h3>

                                    <p className="mt-1 text-[11px] text-slate-400 font-medium">
                                        {c.creditos} Créditos • {c.horas_semestrales} Hrs.
                                    </p>

                                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 text-[#315d7a] flex items-center justify-center font-bold text-xs shrink-0">
                                            <Icon name="user" className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-800 truncate">
                                                Prof. {c.docente}
                                            </p>
                                            <p className="text-[10px] text-slate-400 truncate">
                                                {c.docente_email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div>
                                            <span className="block text-[10px] text-slate-400 uppercase font-bold">Promedio:</span>
                                            <span className={`text-base font-extrabold ${c.nota_promedio < 11 && c.nota_promedio !== '—' ? 'text-red-600' : 'text-[#315d7a]'}`}>
                                                {c.nota_promedio}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] text-slate-400 uppercase font-bold">Inasistencias:</span>
                                            <span className={`text-base font-extrabold ${c.porcentaje_inasistencia >= 30 ? 'text-red-600' : 'text-slate-700'}`}>
                                                {c.porcentaje_inasistencia}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* BOTÓN DE INGRESO AL AULA VIRTUAL DEL CURSO */}
                                <div className="mt-5 pt-3 border-t border-slate-100">
                                    <Link
                                        href={route('estudiante.aula-virtual.show', c.curso_id)}
                                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#315d7a] hover:bg-[#274b63] text-white text-xs font-bold transition shadow-2xs"
                                    >
                                        <Icon name="monitor" className="h-4 w-4" />
                                        <span>Ingresar al Aula Virtual</span>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
                        <Icon name="book" className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                        <h3 className="text-sm font-bold text-slate-800">No tienes cursos matriculados</h3>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}