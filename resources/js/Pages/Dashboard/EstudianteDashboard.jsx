import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
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
        wallet: (
            <>
                <path d="M3 6h15a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2V6Z" />
                <path d="M3 6a3 3 0 0 1 3-3h11" />
                <path d="M16 11h5v4h-5a2 2 0 0 1 0-4Z" />
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
        bell: (
            <>
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
            </>
        ),
        briefcase: (
            <>
                <rect x="3" y="7" width="18" height="13" rx="2" />
                <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M3 12h18" />
            </>
        ),
        arrowRight: (
            <>
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
            </>
        ),
        check: <path d="m5 12 4 4L19 6" />,
        sparkles: (
            <>
                <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
            </>
        ),
        close: (
            <>
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
            </>
        ),
    };

    return <svg {...props}>{icons[name] ?? null}</svg>;
}

function routeExists(routeName) {
    try {
        return route().has(routeName);
    } catch {
        return false;
    }
}

function routeHref(routeName) {
    return routeExists(routeName) ? route(routeName) : '#';
}

const quickAccess = [
    {
        label: 'Mi horario',
        description: 'Consulta tus clases e itinerario',
        icon: 'calendar',
        routeName: 'estudiante.horario',
        bg: 'bg-blue-50 text-blue-700',
    },
    {
        label: 'Mis notas',
        description: 'Revisa tu récord y promedios',
        icon: 'chart',
        routeName: 'estudiante.notas',
        bg: 'bg-emerald-50 text-emerald-700',
    },
    {
        label: 'Mis pagos',
        description: 'Consulta tus cuotas y voucher',
        icon: 'wallet',
        routeName: 'estudiante.pagos',
        bg: 'bg-amber-50 text-amber-700',
    },
    {
        label: 'Mis trámites',
        description: 'Solicitudes y estado de peticiones',
        icon: 'file',
        routeName: 'estudiante.tramites',
        bg: 'bg-purple-50 text-purple-700',
    },
    {
        label: 'Aula virtual',
        description: 'Materiales, tareas y exámenes',
        icon: 'book',
        routeName: 'estudiante.materiales',
        bg: 'bg-sky-50 text-sky-700',
    },
    {
        label: 'Bolsa laboral',
        description: 'Ofertas de empleo y prácticas',
        icon: 'briefcase',
        routeName: 'ofertas-laborales.index',
        bg: 'bg-indigo-50 text-indigo-700',
    },
];

export default function EstudianteDashboard({
    periodo = 'Periodo Activo',
    summary = {},
    todaySchedule = [],
    announcements = [],
}) {
    const { auth } = usePage().props;
    const user = auth?.user ?? {};

    // Estado para controlar los comunicados visibles
    const [listaAnuncios, setListaAnuncios] = useState(announcements);

    const descartarAnuncio = (indexADescartar) => {
        setListaAnuncios((prev) => prev.filter((_, idx) => idx !== indexADescartar));
    };

    const displayName =
        user.nombre_completo ||
        user.username ||
        'Estudiante';

    const summaryCards = [
        {
            title: 'Cursos matriculados',
            value: summary.total_cursos ?? 0,
            description: 'Asignaturas del ciclo',
            icon: 'book',
            color: 'text-sky-600',
            bgColor: 'bg-sky-50',
        },
        {
            title: 'Promedio acumulado',
            value: summary.promedio_general ?? '—',
            description: 'Rendimiento académico',
            icon: 'chart',
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
        },
        {
            title: 'Asistencia general',
            value: summary.porcentaje_asistencia ?? '100%',
            description: 'Asistencia a sesiones',
            icon: 'check',
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
        },
        {
            title: 'Comprobantes / Pagos',
            value: summary.pagos_realizados ?? 0,
            description: 'Pagos registrados',
            icon: 'wallet',
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#315d7a]/10 text-[#315d7a]">
                                Portal del estudiante
                            </span>
                        </div>
                        <h1 className="mt-1 text-2xl font-bold text-slate-900 tracking-tight">
                            ¡Hola, {displayName}! 👋
                        </h1>
                        <p className="mt-1 text-xs sm:text-sm text-slate-500">
                            Bienvenido a tu portal académico. Revisa tus clases del día y estado académico.
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs">
                        <Icon name="calendar" className="h-4 w-4 text-[#315d7a]" />
                        <span>{periodo}</span>
                    </div>
                </div>
            }
        >
            <Head title="Portal del Estudiante" />

            <div className="space-y-6">

                {/* COMUNICADO DESTACADO EN CABECERA (ALERT BANNER CERRABLE) */}
                {listaAnuncios.length > 0 && (
                    <div className="relative overflow-hidden rounded-xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#315d7a] text-white">
                                    <Icon name="bell" className="h-4 w-4" />
                                </span>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#315d7a]">
                                            Aviso Importante
                                        </span>
                                        <span className="text-[11px] text-slate-400">• {listaAnuncios[0].date}</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                                        {listaAnuncios[0].title}
                                    </h3>
                                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                        {listaAnuncios[0].detail}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => descartarAnuncio(0)}
                                className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-blue-100 hover:text-slate-700 transition"
                                title="Cerrar aviso"
                            >
                                <Icon name="close" className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
                
                {/* TARJETAS RESUMEN DE INDICADORES */}
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {summaryCards.map((card) => (
                        <article
                            key={card.title}
                            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:shadow-md transition-all group"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        {card.title}
                                    </p>

                                    <p className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">
                                        {card.value}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        {card.description}
                                    </p>
                                </div>

                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${card.bgColor} ${card.color} group-hover:scale-105 transition-transform`}>
                                    <Icon name={card.icon} className="h-6 w-6" />
                                </div>
                            </div>
                        </article>
                    ))}
                </section>

                {/* HORARIO DEL DÍA Y ACCESOS RÁPIDOS */}
                <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    
                    {/* SECCIÓN HORARIO DE HOY */}
                    <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <Icon name="clock" className="h-5 w-5 text-[#315d7a]" />
                                        <span>Horario de clases de hoy</span>
                                    </h2>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Sesiones programadas para la jornada de hoy.
                                    </p>
                                </div>

                                <Link
                                    href={routeHref('estudiante.horario')}
                                    className={[
                                        'inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition',
                                        routeExists('estudiante.horario')
                                            ? 'hover:bg-slate-50 hover:border-[#315d7a] hover:text-[#315d7a]'
                                            : 'pointer-events-none opacity-50',
                                    ].join(' ')}
                                >
                                    <span>Ver horario completo</span>
                                    <Icon name="arrowRight" className="h-3.5 w-3.5" />
                                </Link>
                            </div>

                            <div className="mt-5 space-y-3">
                                {todaySchedule.length > 0 ? (
                                    todaySchedule.map((item, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-4 rounded-xl border border-slate-200/70 bg-slate-50/60 p-4 hover:bg-white hover:border-[#315d7a]/40 transition"
                                        >
                                            <div className="flex min-w-[95px] flex-col items-center justify-center rounded-xl bg-white px-3 py-2 border border-slate-200/80 shadow-2xs">
                                                <span className="text-xs font-bold text-[#315d7a]">
                                                    {item.time}
                                                </span>
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-start justify-between gap-2">
                                                    <div>
                                                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                                                            {item.title}
                                                        </h3>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {item.detail}
                                                        </p>
                                                    </div>

                                                    <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-0.5 text-[10px] font-bold">
                                                        {item.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center my-4">
                                        <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                                            <Icon name="calendar" className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-800">
                                            ¡Sin clases programadas para hoy!
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                                            Aprovecha para repasar tus tareas, lecturas o consultar las novedades del aula virtual.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                            <span>Sincronizado con el sistema académico</span>
                            <span className="font-semibold text-[#315d7a]">Asistencia controlada</span>
                        </div>
                    </article>

                    {/* SECCIÓN ACCESOS RÁPIDOS */}
                    <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                        <div className="pb-4 border-b border-slate-100">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Icon name="sparkles" className="h-5 w-5 text-[#315d7a]" />
                                <span>Accesos rápidos</span>
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Directo a tus servicios y funciones principales.
                            </p>
                        </div>

                        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
                            {quickAccess.map((item) => {
                                const exists = routeExists(item.routeName);

                                return (
                                    <Link
                                        key={item.label}
                                        href={routeHref(item.routeName)}
                                        className={[
                                            'group flex items-center gap-3.5 rounded-xl border border-slate-200/80 p-3.5 transition-all',
                                            exists
                                                ? 'hover:border-[#315d7a]/50 hover:bg-slate-50/80 hover:shadow-2xs'
                                                : 'pointer-events-none opacity-50',
                                        ].join(' ')}
                                    >
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.bg}`}>
                                            <Icon name={item.icon} className="h-5 w-5" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-bold text-slate-900 group-hover:text-[#315d7a] transition">
                                                {item.label}
                                            </p>
                                            <p className="mt-0.5 truncate text-[11px] text-slate-500">
                                                {item.description}
                                            </p>
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

                {/* BANDEJA GENERAL DE COMUNICADOS */}
                <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Icon name="bell" className="h-5 w-5 text-[#315d7a]" />
                                <span>Anuncios y Comunicados Institucionales</span>
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Novedades y avisos publicados para tu programa de estudios.
                            </p>
                        </div>
                    </div>

                    <div className="mt-4">
                        {listaAnuncios.length > 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {listaAnuncios.map((item, index) => (
                                    <div
                                        key={index}
                                        className="relative rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 hover:bg-white hover:border-[#315d7a]/30 transition group"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => descartarAnuncio(index)}
                                            className="absolute top-3 right-3 rounded-lg p-1 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-200 hover:text-slate-700 transition"
                                            title="Ocultar comunicado"
                                        >
                                            <Icon name="close" className="h-3.5 w-3.5" />
                                        </button>

                                        <div className="pr-6">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200/60 shrink-0">
                                                    {item.date}
                                                </span>
                                            </div>
                                            <h3 className="text-xs font-bold text-slate-900 leading-snug mt-1.5">
                                                {item.title}
                                            </h3>
                                        </div>
                                        <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                            {item.detail}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-400 text-xs">
                                No hay comunicados pendientes en este momento.
                            </div>
                        )}
                    </div>
                </section>

            </div>
        </AuthenticatedLayout>
    );
}