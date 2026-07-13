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
        users: (
            <>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </>
        ),
        academic: (
            <>
                <path d="m3 10 9-5 9 5-9 5-9-5Z" />
                <path d="M7 12.5V17c3 2 7 2 10 0v-4.5" />
                <path d="M21 10v6" />
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
        wallet: (
            <>
                <path d="M3 6h15a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2V6Z" />
                <path d="M3 6a3 3 0 0 1 3-3h11" />
                <path d="M16 11h5v4h-5a2 2 0 0 1 0-4Z" />
            </>
        ),
        arrowUp: (
            <>
                <path d="m18 15-6-6-6 6" />
            </>
        ),
        arrowRight: (
            <>
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
            </>
        ),
        calendar: (
            <>
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4" />
                <path d="M8 3v4" />
                <path d="M3 10h18" />
            </>
        ),
        clock: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
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
        bell: (
            <>
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
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
        more: (
            <>
                <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
                <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
                <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
            </>
        ),
        check: (
            <>
                <path d="m5 12 4 4L19 6" />
            </>
        ),
        alert: (
            <>
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M10.3 3.6 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
            </>
        ),
        plus: (
            <>
                <path d="M12 5v14" />
                <path d="M5 12h14" />
            </>
        ),
    };

    return <svg {...props}>{icons[name]}</svg>;
}

const stats = [
    {
        title: 'Estudiantes activos',
        value: '1,248',
        change: '+8.2%',
        description: 'frente al periodo anterior',
        icon: 'users',
        accent: 'from-indigo-500 to-violet-500',
        surface: 'bg-indigo-50 text-indigo-700',
    },
    {
        title: 'Matrículas del periodo',
        value: '936',
        change: '+5.4%',
        description: 'avance acumulado',
        icon: 'academic',
        accent: 'from-cyan-500 to-sky-500',
        surface: 'bg-cyan-50 text-cyan-700',
    },
    {
        title: 'Cursos programados',
        value: '84',
        change: '+12',
        description: 'cursos habilitados',
        icon: 'book',
        accent: 'from-emerald-500 to-teal-500',
        surface: 'bg-emerald-50 text-emerald-700',
    },
    {
        title: 'Recaudación mensual',
        value: 'S/ 48,620',
        change: '+11.7%',
        description: 'respecto al mes anterior',
        icon: 'wallet',
        accent: 'from-amber-500 to-orange-500',
        surface: 'bg-amber-50 text-amber-700',
    },
];

const quickActions = [
    {
        label: 'Nueva matrícula',
        description: 'Registrar un nuevo proceso',
        icon: 'academic',
        routeName: 'matriculas.index',
    },
    {
        label: 'Nuevo estudiante',
        description: 'Registrar postulante o alumno',
        icon: 'users',
        routeName: 'postulantes.index',
    },
    {
        label: 'Programar curso',
        description: 'Asignar curso y horario',
        icon: 'book',
        routeName: 'cursos.index',
    },
    {
        label: 'Registrar pago',
        description: 'Procesar operación de caja',
        icon: 'wallet',
        routeName: 'pagos.index',
    },
];

const activity = [
    {
        title: 'Nueva matrícula registrada',
        detail: 'María Torres · Administración',
        time: 'Hace 8 min',
        icon: 'check',
        style: 'bg-emerald-50 text-emerald-700',
    },
    {
        title: 'Pago pendiente de validación',
        detail: 'Comprobante N.° 001-4587',
        time: 'Hace 24 min',
        icon: 'alert',
        style: 'bg-amber-50 text-amber-700',
    },
    {
        title: 'Curso actualizado',
        detail: 'Gestión de Proyectos · Ciclo III',
        time: 'Hace 1 h',
        icon: 'book',
        style: 'bg-indigo-50 text-indigo-700',
    },
    {
        title: 'Nuevo documento publicado',
        detail: 'Cronograma académico 2026-II',
        time: 'Hace 2 h',
        icon: 'file',
        style: 'bg-sky-50 text-sky-700',
    },
];

const schedule = [
    {
        time: '08:00',
        title: 'Programación Web',
        detail: 'Aula 204 · Ing. Carlos Mendoza',
        badge: 'En curso',
        badgeStyle: 'bg-emerald-50 text-emerald-700',
    },
    {
        time: '10:30',
        title: 'Base de Datos II',
        detail: 'Laboratorio 3 · Mg. Ana Salazar',
        badge: 'Próxima',
        badgeStyle: 'bg-indigo-50 text-indigo-700',
    },
    {
        time: '14:00',
        title: 'Gestión de Proyectos',
        detail: 'Aula 101 · Mg. Luis Herrera',
        badge: 'Programada',
        badgeStyle: 'bg-slate-100 text-slate-600',
    },
];

const enrollmentData = [
    { label: 'Administración', value: 78 },
    { label: 'Computación e Informática', value: 92 },
    { label: 'Contabilidad', value: 66 },
    { label: 'Enfermería Técnica', value: 84 },
];

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

export default function Dashboard() {
    const { auth } = usePage().props;
    const user = auth?.user ?? {};
    const username = user.username || user.name || 'Usuario';

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-indigo-600">
                            Resumen institucional
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                            Panel principal
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Bienvenido, {username}. Aquí tienes el estado general del sistema.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                            <Icon name="calendar" className="h-4 w-4 text-slate-400" />
                            Periodo 2026-II
                        </div>

                        <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-indigo-700"
                        >
                            <Icon name="plus" className="h-4 w-4" />
                            Acción rápida
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Panel principal" />

            <div className="space-y-6">
                {/* Tarjetas estadísticas */}
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat) => (
                        <article
                            key={stat.title}
                            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60"
                        >
                            <div
                                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.accent}`}
                            />

                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">
                                        {stat.title}
                                    </p>
                                    <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">
                                        {stat.value}
                                    </p>
                                </div>

                                <div
                                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stat.surface}`}
                                >
                                    <Icon name={stat.icon} className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="mt-4 flex items-center gap-2 text-xs">
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                                    <Icon name="arrowUp" className="h-3.5 w-3.5" />
                                    {stat.change}
                                </span>
                                <span className="text-slate-400">{stat.description}</span>
                            </div>
                        </article>
                    ))}
                </section>

                {/* Gráfico y acciones */}
                <section className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
                    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-950">
                                    Matrículas por programa
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Distribución del periodo académico actual
                                </p>
                            </div>

                            <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                                Ver reporte
                                <Icon name="arrowRight" className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-8 space-y-5">
                            {enrollmentData.map((item) => (
                                <div key={item.label}>
                                    <div className="mb-2 flex items-center justify-between gap-4">
                                        <span className="text-sm font-medium text-slate-700">
                                            {item.label}
                                        </span>
                                        <span className="text-sm font-bold text-slate-950">
                                            {item.value}%
                                        </span>
                                    </div>
                                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500"
                                            style={{ width: `${item.value}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Total matriculados
                                </p>
                                <p className="mt-1 text-xl font-bold text-slate-950">936</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Vacantes disponibles
                                </p>
                                <p className="mt-1 text-xl font-bold text-slate-950">164</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Avance general
                                </p>
                                <p className="mt-1 text-xl font-bold text-slate-950">85%</p>
                            </div>
                        </div>
                    </article>

                    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-950">
                                    Acciones rápidas
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Accesos frecuentes del sistema
                                </p>
                            </div>
                            <Icon name="more" className="h-5 w-5 text-slate-400" />
                        </div>

                        <div className="mt-5 space-y-3">
                            {quickActions.map((action) => (
                                <Link
                                    key={action.label}
                                    href={routeHref(action.routeName)}
                                    className={[
                                        'group flex items-center gap-4 rounded-2xl border border-slate-200 px-4 py-3.5 transition',
                                        routeExists(action.routeName)
                                            ? 'hover:border-indigo-200 hover:bg-indigo-50/60'
                                            : 'pointer-events-none opacity-50',
                                    ].join(' ')}
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-white group-hover:text-indigo-600">
                                        <Icon name={action.icon} className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-slate-900">
                                            {action.label}
                                        </p>
                                        <p className="mt-0.5 truncate text-xs text-slate-500">
                                            {action.description}
                                        </p>
                                    </div>

                                    <Icon
                                        name="arrowRight"
                                        className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-500"
                                    />
                                </Link>
                            ))}
                        </div>
                    </article>
                </section>

                {/* Agenda y actividad */}
                <section className="grid gap-6 xl:grid-cols-2">
                    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-950">
                                    Agenda académica de hoy
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Actividades y clases programadas
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <Icon name="calendar" className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="mt-5 space-y-3">
                            {schedule.map((item) => (
                                <div
                                    key={`${item.time}-${item.title}`}
                                    className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                                >
                                    <div className="flex min-w-16 flex-col items-center justify-center rounded-xl bg-white px-3 py-2 shadow-sm">
                                        <Icon name="clock" className="h-4 w-4 text-indigo-500" />
                                        <span className="mt-1 text-sm font-bold text-slate-950">
                                            {item.time}
                                        </span>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {item.title}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {item.detail}
                                                </p>
                                            </div>

                                            <span
                                                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${item.badgeStyle}`}
                                            >
                                                {item.badge}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </article>

                    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-950">
                                    Actividad reciente
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Últimos movimientos registrados
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                                <Icon name="bell" className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="mt-5 divide-y divide-slate-100">
                            {activity.map((item) => (
                                <div
                                    key={item.title}
                                    className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
                                >
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.style}`}
                                    >
                                        <Icon name={item.icon} className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {item.title}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {item.detail}
                                        </p>
                                    </div>

                                    <span className="whitespace-nowrap text-xs text-slate-400">
                                        {item.time}
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