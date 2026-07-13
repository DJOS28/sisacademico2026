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
        calendar: (
            <>
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4" />
                <path d="M8 3v4" />
                <path d="M3 10h18" />
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
        file: (
            <>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                <path d="M14 2v6h6" />
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

const stats = [
    {
        title: 'Usuarios registrados',
        value: '—',
        description: 'Cuentas activas en el sistema',
        icon: 'users',
    },
    {
        title: 'Postulantes',
        value: '—',
        description: 'Registros del proceso de admisión',
        icon: 'academic',
    },
    {
        title: 'Cursos programados',
        value: '—',
        description: 'Cursos del periodo académico',
        icon: 'book',
    },
    {
        title: 'Pagos registrados',
        value: '—',
        description: 'Operaciones procesadas',
        icon: 'wallet',
    },
];

const quickActions = [
    {
        label: 'Gestionar usuarios',
        description: 'Usuarios, claves, estados y roles',
        routeName: 'usuarios.index',
        icon: 'users',
    },
    {
        label: 'Gestionar docentes',
        description: 'Registro y mantenimiento de docentes',
        routeName: 'docentes.index',
        icon: 'academic',
    },
    {
        label: 'Ver postulantes',
        description: 'Proceso de admisión institucional',
        routeName: 'postulantes.index',
        icon: 'file',
    },
    {
        label: 'Revisar matrículas',
        description: 'Gestión de matrículas del periodo',
        routeName: 'matriculas.index',
        icon: 'calendar',
    },
];

export default function AdminDashboard() {
    const { auth } = usePage().props;
    const user = auth?.user ?? {};

    const displayName =
        user.nombre_completo ||
        user.username ||
        'Administrador';

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-[#315d7a]">
                            Gestión administrativa
                        </p>

                        <h1 className="mt-1 text-2xl font-bold text-slate-900">
                            Panel administrativo
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Bienvenido, {displayName}. Revisa el estado general del sistema.
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                        <Icon name="calendar" className="h-4 w-4 text-[#315d7a]" />
                        Periodo académico actual
                    </div>
                </div>
            }
        >
            <Head title="Panel administrativo" />

            <div className="space-y-6">
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat) => (
                        <article
                            key={stat.title}
                            className="rounded-xl border border-slate-200 bg-white p-5"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">
                                        {stat.title}
                                    </p>

                                    <p className="mt-3 text-3xl font-bold text-slate-900">
                                        {stat.value}
                                    </p>

                                    <p className="mt-2 text-xs text-slate-400">
                                        {stat.description}
                                    </p>
                                </div>

                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#eaf1f6] text-[#315d7a]">
                                    <Icon name={stat.icon} className="h-5 w-5" />
                                </div>
                            </div>
                        </article>
                    ))}
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">
                                Acciones rápidas
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Accesos frecuentes para la administración del sistema.
                            </p>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            {quickActions.map((action) => {
                                const exists = routeExists(action.routeName);

                                return (
                                    <Link
                                        key={action.label}
                                        href={routeHref(action.routeName)}
                                        className={[
                                            'group flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition',
                                            exists
                                                ? 'hover:border-[#b9ccd8] hover:bg-[#f8fafc]'
                                                : 'pointer-events-none opacity-50',
                                        ].join(' ')}
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eaf1f6] text-[#315d7a]">
                                            <Icon
                                                name={action.icon}
                                                className="h-5 w-5"
                                            />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-slate-900">
                                                {action.label}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                {action.description}
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

                    <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                        <h2 className="text-base font-bold text-slate-900">
                            Resumen de responsabilidades
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Funciones disponibles según los módulos autorizados.
                        </p>

                        <div className="mt-5 space-y-3">
                            {[
                                'Administrar usuarios, contraseñas y roles.',
                                'Gestionar docentes y perfiles académicos.',
                                'Supervisar admisión, postulantes y matrículas.',
                                'Controlar cursos, horarios, evaluaciones y asistencia.',
                                'Consultar pagos, trámites y servicios institucionales.',
                            ].map((item) => (
                                <div
                                    key={item}
                                    className="flex items-start gap-3 rounded-lg bg-slate-50 p-3"
                                >
                                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                                        <Icon name="check" className="h-4 w-4" />
                                    </div>

                                    <p className="text-sm leading-6 text-slate-600">
                                        {item}
                                    </p>
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
                                Indicadores pendientes de conexión
                            </p>

                            <p className="mt-1 text-sm leading-6 text-amber-700">
                                Las cifras aparecerán cuando el DashboardController envíe
                                los totales reales de usuarios, postulantes, cursos y pagos.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}