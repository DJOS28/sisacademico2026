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
        message: (
            <>
                <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
            </>
        ),
        bell: (
            <>
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
            </>
        ),
        arrowRight: (
            <>
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
            </>
        ),
        alert: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
            </>
        ),
        check: <path d="m5 12 4 4L19 6" />,
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
        title: 'Cursos asignados',
        value: '—',
        description: 'Periodo académico actual',
        icon: 'book',
    },
    {
        title: 'Estudiantes a cargo',
        value: '—',
        description: 'Total de estudiantes',
        icon: 'users',
    },
    {
        title: 'Asistencias pendientes',
        value: '—',
        description: 'Sesiones por registrar',
        icon: 'clipboard',
    },
    {
        title: 'Evaluaciones pendientes',
        value: '—',
        description: 'Actividades por calificar',
        icon: 'chart',
    },
];

const quickAccess = [
    {
        label: 'Mis cursos',
        description: 'Consulta tus cursos asignados',
        icon: 'book',
        routeName: 'docente.cursos',
    },
    {
        label: 'Mi horario',
        description: 'Revisa tus clases programadas',
        icon: 'calendar',
        routeName: 'docente.horarios',
    },
    {
        label: 'Registrar asistencia',
        description: 'Control de asistencia por sesión',
        icon: 'clipboard',
        routeName: 'docente.asistencia',
    },
    {
        label: 'Registrar notas',
        description: 'Carga y actualiza calificaciones',
        icon: 'chart',
        routeName: 'docente.notas',
    },
    {
        label: 'Aula virtual',
        description: 'Materiales, tareas y foros',
        icon: 'file',
        routeName: 'docente.materiales',
    },
    {
        label: 'Mensajes',
        description: 'Comunicación académica',
        icon: 'message',
        routeName: 'mensajes.index',
    },
];

const todaySchedule = [
    {
        time: '08:00',
        title: 'Curso pendiente de conexión',
        detail: 'El curso, aula y sección se mostrarán desde la base de datos.',
        status: 'Próxima',
    },
    {
        time: '10:30',
        title: 'Curso pendiente de conexión',
        detail: 'La información del horario se cargará dinámicamente.',
        status: 'Programada',
    },
];

const pendingTasks = [
    {
        title: 'Registrar asistencia',
        detail: 'Sesión pendiente de cierre',
        icon: 'clipboard',
    },
    {
        title: 'Calificar evaluaciones',
        detail: 'Actividades pendientes de revisión',
        icon: 'chart',
    },
    {
        title: 'Publicar material',
        detail: 'Contenido pendiente en aula virtual',
        icon: 'file',
    },
];

const announcements = [
    {
        title: 'Bienvenido al portal docente',
        detail: 'Desde este espacio podrás gestionar tu actividad académica.',
        date: 'Hoy',
    },
    {
        title: 'Módulos disponibles',
        detail: 'Cursos, horarios, asistencia, notas y aula virtual.',
        date: 'Sistema',
    },
];

export default function DocenteDashboard() {
    const { auth } = usePage().props;
    const user = auth?.user ?? {};

    const displayName =
        user.nombre_completo ||
        user.username ||
        'Docente';

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-[#315d7a]">
                            Portal docente
                        </p>

                        <h1 className="mt-1 text-2xl font-bold text-slate-900">
                            Mi panel académico
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Bienvenido, {displayName}. Gestiona tus cursos, asistencia,
                            evaluaciones y aula virtual.
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                        <Icon name="calendar" className="h-4 w-4 text-[#315d7a]" />
                        Periodo académico actual
                    </div>
                </div>
            }
        >
            <Head title="Portal docente" />

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
                                    Clases de hoy
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Cursos y sesiones programadas para la jornada.
                                </p>
                            </div>

                            <Link
                                href={routeHref('docente.horarios')}
                                className={[
                                    'inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600',
                                    routeExists('docente.horarios')
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
                                Ingresa a tus funciones principales.
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
                                    Pendientes académicos
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Actividades que requieren atención.
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eaf1f6] text-[#315d7a]">
                                <Icon name="alert" className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="mt-5 space-y-3">
                            {pendingTasks.map((item) => (
                                <div
                                    key={item.title}
                                    className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4"
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#315d7a]">
                                        <Icon name={item.icon} className="h-4 w-4" />
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {item.title}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            {item.detail}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </article>

                    <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    Anuncios y comunicaciones
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Novedades institucionales y académicas.
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
                                        <Icon name="message" className="h-4 w-4" />
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

                <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                        <Icon
                            name="alert"
                            className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
                        />

                        <div>
                            <p className="text-sm font-semibold text-amber-800">
                                Datos pendientes de conexión
                            </p>

                            <p className="mt-1 text-sm leading-6 text-amber-700">
                                Los totales, horarios, cursos, asistencias y evaluaciones
                                aparecerán cuando se conecte el DashboardController con las
                                tablas académicas.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}