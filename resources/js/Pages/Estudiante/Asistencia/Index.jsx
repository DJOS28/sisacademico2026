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
        calendar: (
            <>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
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
        userCheck: (
            <>
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <polyline points="17 11 19 13 23 9" />
            </>
        ),
    };

    return <svg {...props}>{icons[name] ?? null}</svg>;
}

export default function Index({
    cursos = [],
    cursoSeleccionado = null,
    resumen = null,
    asistencias = [],
    periodo = '',
}) {
    const handleCursoChange = (e) => {
        const cursoId = e.target.value;
        if (!cursoId) return;

        router.get(
            route('estudiante.asistencia'),
            { curso_id: cursoId },
            { preserveState: true, replace: true }
        );
    };

    const getBadgeEstado = (estado) => {
        switch (estado) {
            case 'P':
            case 'PRESENTE':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Presente
                    </span>
                );
            case 'F':
            case 'FALTA':
            case 'AUSENTE':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 font-bold text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span> Inasistencia
                    </span>
                );
            case 'T':
            case 'TARDE':
            case 'TARDANZA':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span> Tardanza
                    </span>
                );
            case 'J':
            case 'JUSTIFICADO':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200 font-bold text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span> Justificado
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-md bg-slate-100 text-slate-600 font-bold text-xs">
                        {estado}
                    </span>
                );
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#315d7a]/10 text-[#315d7a] text-[11px] font-extrabold uppercase tracking-wider">
                            Portal Estudiante
                        </span>
                        <h1 className="mt-1 text-2xl font-bold text-slate-900 tracking-tight">
                            Control de Asistencias
                        </h1>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Supervisa el registro de asistencias y límite de inasistencias por materia.
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
            <Head title="Mis Asistencias - Estudiante" />

            <div className="space-y-6">

                {/* BARRA DE FILTRO / SELECTOR DE CURSO */}
                <section className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf1f6] text-[#315d7a]">
                                <Icon name="filter" className="h-5 w-5" />
                            </div>
                            <div>
                                <label
                                    htmlFor="select-curso-asistencia"
                                    className="block text-[11px] font-bold uppercase tracking-wider text-slate-400"
                                >
                                    Asignatura Matriculada
                                </label>
                                <p className="text-xs font-semibold text-slate-700">
                                    Selecciona un curso para consultar su reporte de asistencia
                                </p>
                            </div>
                        </div>

                        <div className="w-full sm:w-80">
                            {cursos.length > 0 ? (
                                <select
                                    id="select-curso-asistencia"
                                    value={cursoSeleccionado?.id ?? ''}
                                    onChange={handleCursoChange}
                                    className="w-full rounded-xl border-slate-200 text-xs font-bold text-slate-800 focus:border-[#315d7a] focus:ring-[#315d7a] bg-slate-50/50 py-2.5 px-3 cursor-pointer"
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

                {/* TARJETAS RESUMEN DE ASISTENCIA Y BARRA DE MARGEN */}
                {cursoSeleccionado && resumen && (
                    <section className="space-y-4">
                        {/* 4 Cards Principales */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            
                            {/* Card 1: Porcentaje de Asistencia */}
                            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                    % Asistencia Cumplida
                                </span>
                                <div className="mt-3 flex items-baseline justify-between">
                                    <span className="text-3xl font-black text-[#315d7a]">
                                        {resumen.porcentaje_asistencia}%
                                    </span>
                                    <span className="text-xs font-bold text-slate-500">
                                        {resumen.presentes} de {resumen.total_sesiones} Sesiones
                                    </span>
                                </div>
                            </div>

                            {/* Card 2: Porcentaje de Inasistencia */}
                            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                    % Inasistencia Acumulada
                                </span>
                                <div className="mt-3 flex items-baseline justify-between">
                                    <span
                                        className={`text-3xl font-black ${
                                            resumen.en_riesgo ? 'text-red-600' : 'text-slate-800'
                                        }`}
                                    >
                                        {resumen.porcentaje_inasistencia}%
                                    </span>
                                    <span className="text-xs font-bold text-red-600">
                                        {resumen.faltas} Faltas
                                    </span>
                                </div>
                            </div>

                            {/* Card 3: Tardanzas y Justificaciones */}
                            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                    Novedades Registradas
                                </span>
                                <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-700">
                                    <span>Tardanzas: <strong className="text-amber-600">{resumen.tardanzas}</strong></span>
                                    <span className="text-slate-300">•</span>
                                    <span>Justificadas: <strong className="text-sky-600">{resumen.justificadas}</strong></span>
                                </div>
                            </div>

                            {/* Card 4: Estado Inhabilitación */}
                            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                        Estado de Inhabilitación
                                    </span>
                                    <p className="text-xs font-bold mt-1">
                                        {resumen.en_riesgo ? (
                                            <span className="text-red-600">Límite Superado</span>
                                        ) : (
                                            <span className="text-emerald-600">Dentro del margen</span>
                                        )}
                                    </p>
                                </div>
                                <div className="shrink-0">
                                    {resumen.en_riesgo ? (
                                        <div className="p-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100">
                                            <Icon name="alertCircle" className="h-5 w-5" />
                                        </div>
                                    ) : (
                                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                                            <Icon name="checkCircle" className="h-5 w-5" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Barra Visual de Margen Inasistencias (Límite 30%) */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 px-5 shadow-2xs">
                            <div className="flex items-center justify-between text-xs font-bold mb-2">
                                <span className="text-slate-700">Margen de Inasistencia Permitido (Máximo 30%)</span>
                                <span className={resumen.en_riesgo ? 'text-red-600 font-black' : 'text-slate-500'}>
                                    {resumen.porcentaje_inasistencia}% de 30% Límite
                                </span>
                            </div>
                            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden relative">
                                <div
                                    className={`h-full transition-all duration-500 rounded-full ${
                                        resumen.en_riesgo ? 'bg-red-600' : 'bg-[#315d7a]'
                                    }`}
                                    style={{ width: `${Math.min((resumen.porcentaje_inasistencia / 30) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </section>
                )}

                {/* TABLA HISTORIAL DE SESIONES */}
                {asistencias.length > 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                        <div className="bg-slate-50/70 p-4 px-5 border-b border-slate-200/80 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Icon name="calendar" className="h-4 w-4 text-[#315d7a]" />
                                Historial de Clases Tomadas
                            </h3>
                            <span className="text-xs font-bold text-slate-400">
                                Total: {asistencias.length} Sesiones
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-100/40 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                                    <tr>
                                        <th className="py-3 px-5">Fecha</th>
                                        <th className="py-3 px-5">Día</th>
                                        <th className="py-3 px-5">Horario / Aula</th>
                                        <th className="py-3 px-5 text-center">Estado</th>
                                        <th className="py-3 px-5">Observaciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {asistencias.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/60 transition">
                                            <td className="py-3.5 px-5 font-bold text-slate-900">
                                                {item.fecha}
                                            </td>

                                            <td className="py-3.5 px-5 font-semibold text-slate-600 capitalize">
                                                {item.dia}
                                            </td>

                                            <td className="py-3.5 px-5 text-slate-600 font-medium">
                                                <span className="block text-slate-800 font-semibold">{item.horario}</span>
                                                <span className="text-[10px] text-slate-400">Aula: {item.aula}</span>
                                            </td>

                                            <td className="py-3.5 px-5 text-center">
                                                {getBadgeEstado(item.estado)}
                                            </td>

                                            <td className="py-3.5 px-5 text-slate-500 font-medium">
                                                {item.observacion}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    cursoSeleccionado && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
                            <Icon name="userCheck" className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                            <h3 className="text-sm font-bold text-slate-800">
                                Sin registros de asistencia
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                El docente no ha registrado sesiones tomadas para esta asignatura todavía.
                            </p>
                        </div>
                    )
                )}

            </div>
        </AuthenticatedLayout>
    );
}