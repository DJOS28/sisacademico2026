import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

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
        calendar: (
            <>
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4" />
                <path d="M8 3v4" />
                <path d="M3 10h18" />
            </>
        ),
        book: (
            <>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M4 4v15.5" />
                <path d="M20 4H6.5A2.5 2.5 0 0 0 4 6.5" />
                <path d="M20 4v13" />
            </>
        ),
        users: (
            <>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </>
        ),
        clipboard: (
            <>
                <rect x="5" y="4" width="14" height="17" rx="2" />
                <path d="M9 4.5V3h6v1.5" />
                <path d="m9 13 2 2 4-4" />
            </>
        ),
        chart: (
            <>
                <path d="M4 19V9" />
                <path d="M10 19V5" />
                <path d="M16 19v-7" />
                <path d="M22 19H2" />
            </>
        ),
        clock: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
            </>
        ),
        file: (
            <>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                <path d="M14 2v6h6" />
                <path d="M8 13h8" />
                <path d="M8 17h6" />
            </>
        ),
        checkCircle: (
            <>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
            </>
        ),
        arrowRight: (
            <>
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
            </>
        ),
    };

    return <svg {...props}>{icons[name] || icons.clipboard}</svg>;
}

function routeExists(routeName) {
    if (routeName === 'docente.asistencias.index' || routeName === 'docente.registro-auxiliar') {
        return true;
    }
    try {
        return typeof route === 'function' && route().has(routeName);
    } catch {
        return false;
    }
}

function routeHref(routeName) {
    if (routeName === 'docente.asistencias.index') {
        return '/docente/asistencias';
    }
    if (routeName === 'docente.registro-auxiliar') {
        return '/docente/registro-auxiliar';
    }
    return routeExists(routeName) ? route(routeName) : '#';
}

const quickAccess = [
    {
        label: 'Registro Auxiliar',
        description: 'Matriz de notas MINEDU (C1 - C4) y logros',
        icon: 'file',
        routeName: 'docente.registro-auxiliar',
        badge: 'Oficial',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
        label: 'Control de Asistencias',
        description: 'Toma diaria e importación masiva desde Excel',
        icon: 'checkCircle',
        routeName: 'docente.asistencias.index',
        badge: 'Excel Masivo',
        badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
        label: 'Mis cursos',
        description: 'Gestión de sílabos, tareas y sesiones',
        icon: 'book',
        routeName: 'docente.cursos',
    },
    {
        label: 'Mi horario',
        description: 'Distribución semanal y carga horaria',
        icon: 'calendar',
        routeName: 'docente.horarios',
    },
];

export default function DocenteDashboard({
    periodo = 'Periodo Activo',
    summary = {},
    todaySchedule = [],
}) {
    const { auth } = usePage().props;
    const user = auth?.user ?? {};

    const displayName =
        user.nombre_completo ||
        user.username ||
        'Docente';

    const summaryCards = [
        {
            title: 'Cursos asignados',
            value: summary.total_cursos ?? 0,
            description: 'Periodo académico actual',
            icon: 'book',
            link: 'docente.cursos',
        },
        {
            title: 'Estudiantes a cargo',
            value: summary.total_estudiantes ?? 0,
            description: 'Matriculados en tus secciones',
            icon: 'users',
            link: 'docente.estudiantes',
        },
        {
            title: 'Control de Asistencias',
            value: summary.asistencias_pendientes ?? 0,
            description: 'Sesiones pendientes de registro',
            icon: 'clipboard',
            link: 'docente.asistencias.index',
            highlight: true,
        },
        {
            title: 'Registro Auxiliar',
            value: summary.evaluaciones_pendientes ?? 0,
            description: 'Logros y criterios por calificar',
            icon: 'file',
            link: 'docente.registro-auxiliar',
            highlight: true,
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#16A6A1]">
                            Portal docente
                        </p>
                        <h1 className="mt-1 text-2xl font-black text-slate-900">
                            Mi panel académico
                        </h1>
                        <p className="mt-1 text-xs text-slate-500">
                            Bienvenido, <span className="font-bold text-slate-700">{displayName}</span>. Accede de forma directa a tus registros de notas, asistencias y sesiones.
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs">
                        <Icon name="calendar" className="h-4 w-4 text-[#315d7a]" />
                        <span>Periodo: {periodo}</span>
                    </div>
                </div>
            }
        >
            <Head title="Portal Docente" />

            <div className="space-y-6">
                {/* TARJETAS RESUMEN INTERACTIVAS */}
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {summaryCards.map((card) => {
                        const href = routeHref(card.link);
                        return (
                            <Link
                                key={card.title}
                                href={href}
                                className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition hover:border-[#315d7a]/50 hover:shadow-xs"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                            {card.title}
                                        </p>
                                        <p className="mt-2 text-3xl font-black text-slate-900 group-hover:text-[#315d7a] transition-colors">
                                            {card.value}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500 truncate">
                                            {card.description}
                                        </p>
                                    </div>

                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-[#315d7a] border border-slate-100 group-hover:bg-[#315d7a] group-hover:text-white transition-all">
                                        <Icon name={card.icon} className="h-5 w-5" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    {/* CLASES DE HOY */}
                    <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
                        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="text-base font-black text-slate-900">
                                    Clases de hoy
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Cursos y horarios programados para la fecha.
                                </p>
                            </div>

                            <Link
                                href={routeHref('docente.horarios')}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                            >
                                <span>Ver horario</span>
                                <Icon name="arrowRight" className="h-3.5 w-3.5" />
                            </Link>
                        </div>

                        <div className="mt-5 space-y-3">
                            {todaySchedule.length > 0 ? (
                                todaySchedule.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 hover:bg-slate-50 transition"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="flex min-w-16 flex-col items-center justify-center rounded-xl bg-white px-3 py-2 border border-slate-200 shadow-2xs">
                                                <Icon name="clock" className="h-4 w-4 text-[#315d7a]" />
                                                <span className="mt-1 text-xs font-black text-slate-900">
                                                    {item.time}
                                                </span>
                                            </div>

                                            <div>
                                                <p className="text-sm font-bold text-slate-900">
                                                    {item.title}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {item.detail}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-center">
                                            <Link
                                                href={routeHref('docente.asistencias.index')}
                                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                                                title="Tomar asistencia a este curso"
                                            >
                                                <span>✓ Asistencia</span>
                                            </Link>
                                            <span className="rounded-lg bg-slate-200/70 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                                                {item.status || 'Programado'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/30">
                                    <Icon name="calendar" className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                                    <p className="text-xs font-bold text-slate-700">
                                        No tienes clases programadas para hoy
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Consulta tu horario semanal o registra evaluaciones pendientes.
                                    </p>
                                </div>
                            )}
                        </div>
                    </article>

                    {/* ACCESOS DIRECTOS */}
                    <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
                        <div className="border-b border-slate-100 pb-4">
                            <h2 className="text-base font-black text-slate-900">
                                Módulos Principales
                            </h2>
                            <p className="text-xs text-slate-500">
                                Accesos directos a tus herramientas de gestión diaria.
                            </p>
                        </div>

                        <div className="mt-5 space-y-3">
                            {quickAccess.map((item) => {
                                const href = routeHref(item.routeName);

                                return (
                                    <Link
                                        key={item.label}
                                        href={href}
                                        className="group flex items-center justify-between rounded-xl border border-slate-200 p-3.5 transition hover:border-[#315d7a] hover:bg-slate-50/70 shadow-2xs cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#315d7a] group-hover:bg-[#315d7a] group-hover:text-white transition-colors">
                                                <Icon name={item.icon} className="h-5 w-5" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="truncate text-xs font-black text-slate-900 group-hover:text-[#315d7a] transition-colors">
                                                        {item.label}
                                                    </p>
                                                    {item.badge && (
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${item.badgeColor}`}>
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 truncate text-[11px] text-slate-400">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>

                                        <Icon
                                            name="arrowRight"
                                            className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#315d7a]"
                                        />
                                    </Link>
                                );
                            })}
                        </div>
                    </article>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}