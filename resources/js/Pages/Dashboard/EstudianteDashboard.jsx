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
        alert: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
            </>
        ),
    };

    return <svg {...props}>{icons[name]}</svg>;
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

const summaryCards = [
    {
        title: 'Cursos matriculados',
        value: '—',
        description: 'Periodo académico actual',
        icon: 'book',
    },
    {
        title: 'Promedio general',
        value: '—',
        description: 'Rendimiento acumulado',
        icon: 'chart',
    },
    {
        title: 'Asistencia',
        value: '—',
        description: 'Porcentaje del periodo',
        icon: 'check',
    },
    {
        title: 'Pagos pendientes',
        value: '—',
        description: 'Obligaciones por regularizar',
        icon: 'wallet',
    },
];

const quickAccess = [
    {
        label: 'Mi horario',
        description: 'Consulta tus clases programadas',
        icon: 'calendar',
        routeName: 'estudiante.horario',
    },
    {
        label: 'Mis notas',
        description: 'Revisa tus calificaciones',
        icon: 'chart',
        routeName: 'estudiante.notas',
    },
    {
        label: 'Mis pagos',
        description: 'Consulta deudas y comprobantes',
        icon: 'wallet',
        routeName: 'estudiante.pagos',
    },
    {
        label: 'Mis trámites',
        description: 'Solicitudes y seguimiento',
        icon: 'file',
        routeName: 'estudiante.tramites',
    },
    {
        label: 'Aula virtual',
        description: 'Materiales, tareas y evaluaciones',
        icon: 'book',
        routeName: 'estudiante.materiales',
    },
    {
        label: 'Bolsa laboral',
        description: 'Ofertas y oportunidades',
        icon: 'briefcase',
        routeName: 'ofertas-laborales.index',
    },
];

const todaySchedule = [
    {
        time: '08:00',
        title: 'Curso pendiente de conexión',
        detail: 'El horario se mostrará cuando se conecte la base de datos.',
        status: 'Próximo',
    },
    {
        time: '10:30',
        title: 'Curso pendiente de conexión',
        detail: 'El aula y docente se cargarán dinámicamente.',
        status: 'Programado',
    },
];

const announcements = [
    {
        title: 'Bienvenido al portal del estudiante',
        detail: 'Desde este espacio podrás consultar tu información académica.',
        date: 'Hoy',
    },
    {
        title: 'Servicios disponibles',
        detail: 'Horarios, notas, pagos, trámites y aula virtual.',
        date: 'Sistema',
    },
];

export default function EstudianteDashboard() {
    const { auth } = usePage().props;
    const user = auth?.user ?? {};

    const displayName =
        user.nombre_completo ||
        user.username ||
        'Estudiante';

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-[#315d7a]">
                            Portal del estudiante
                        </p>

                        <h1 className="mt-1 text-2xl font-bold text-slate-900">
                            Mi panel académico
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Bienvenido, {displayName}. Aquí encontrarás tu información académica y servicios.
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                        <Icon name="calendar" className="h-4 w-4 text-[#315d7a]" />
                        Periodo académico actual
                    </div>
                </div>
            }
        >
            <Head title="Portal del estudiante" />

            <div className="space-y-6">
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {summaryCards.map((card) => (
                        <article
                            key={card.title}
                            className="rounded-xl border border-slate-200 bg-white p-5"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">
                                        {card.title}
                                    </p>

                                    <p className="mt-3 text-3xl font-bold text-slate-900">
                                        {card.value}
                                    </p>

                                    <p className="mt-2 text-xs text-slate-400">
                                        {card.description}
                                    </p>
                                </div>

                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#eaf1f6] text-[#315d7a]">
                                    <Icon name={card.icon} className="h-5 w-5" />
                                </div>
                            </div>
                        </article>
                    ))}
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    Horario de hoy
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Clases y actividades programadas.
                                </p>
                            </div>

                            <Link
                                href={routeHref('estudiante.horario')}
                                className={[
                                    'inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600',
                                    routeExists('estudiante.horario')
                                        ? 'hover:bg-slate-50'
                                        : 'pointer-events-none opacity-50',
                                ].join(' ')}
                            >
                                Ver horario
                                <Icon name="arrowRight" className="h-4 w-4" />
                            </Link>
                        </div>

                        <div className="mt-5 space-y-3">
                            {todaySchedule.map((item) => (
                                <div
                                    key={`${item.time}-${item.title}`}
                                    className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4"
                                >
                                    <div className="flex min-w-16 flex-col items-center justify-center rounded-lg bg-white px-3 py-2">
                                        <Icon
                                            name="clock"
                                            className="h-4 w-4 text-[#315d7a]"
                                        />
                                        <span className="mt-1 text-sm font-bold text-slate-900">
                                            {item.time}
                                        </span>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {item.title}
                                                </p>
                                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                                    {item.detail}
                                                </p>
                                            </div>

                                            <span className="rounded-full bg-[#eef3f7] px-2.5 py-1 text-[11px] font-semibold text-[#315d7a]">
                                                {item.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </article>

                    <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">
                                Accesos rápidos
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Ingresa a tus principales servicios.
                            </p>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            {quickAccess.map((item) => {
                                const exists = routeExists(item.routeName);

                                return (
                                    <Link
                                        key={item.label}
                                        href={routeHref(item.routeName)}
                                        className={[
                                            'group flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition',
                                            exists
                                                ? 'hover:border-[#b9ccd8] hover:bg-[#f8fafc]'
                                                : 'pointer-events-none opacity-50',
                                        ].join(' ')}
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eaf1f6] text-[#315d7a]">
                                            <Icon name={item.icon} className="h-5 w-5" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-slate-900">
                                                {item.label}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {item.description}
                                            </p>
                                        </div>

                                        <Icon
                                            name="arrowRight"
                                            className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#315d7a]"
                                        />
                                    </Link>
                                );
                            })}
                        </div>
                    </article>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                    <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    Actividad académica
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Próximas tareas y evaluaciones.
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eaf1f6] text-[#315d7a]">
                                <Icon name="book" className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                            <Icon
                                name="alert"
                                className="mx-auto h-8 w-8 text-slate-400"
                            />
                            <p className="mt-3 text-sm font-semibold text-slate-700">
                                Sin actividades cargadas
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                Las tareas y evaluaciones aparecerán cuando se conecten los módulos académicos.
                            </p>
                        </div>
                    </article>

                    <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    Anuncios
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Comunicados y novedades institucionales.
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eaf1f6] text-[#315d7a]">
                                <Icon name="bell" className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="mt-5 divide-y divide-slate-100">
                            {announcements.map((item) => (
                                <div
                                    key={item.title}
                                    className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                        <Icon name="file" className="h-4 w-4" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {item.title}
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            {item.detail}
                                        </p>
                                    </div>

                                    <span className="whitespace-nowrap text-xs text-slate-400">
                                        {item.date}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </article>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}