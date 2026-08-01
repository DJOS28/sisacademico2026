import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

function Icon({ name, className = 'h-5 w-5' }) {
    const props = {
        className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
        strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': true,
    };
    const icons = {
        users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></>,
        academic: <><path d="m3 10 9-5 9 5-9 5-9-5Z" /><path d="M7 12.5V17c3 2 7 2 10 0v-4.5" /></>,
        book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4v15.5" /><path d="M20 4H6.5A2.5 2.5 0 0 0 4 6.5v0" /><path d="M20 4v13" /></>,
        wallet: <><path d="M3 6h15a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2V6Z" /><path d="M16 11h5v4h-5a2 2 0 0 1 0-4Z" /></>,
        calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
        arrowRight: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
        file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></>,
        chart: <><path d="M3 3v18h18" /><path d="m7 16 4-5 4 3 5-7" /></>,
        refresh: <><path d="M20 11a8 8 0 1 0-2.34 5.66" /><path d="M20 4v7h-7" /></>,
        teacher: <><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a6 6 0 0 1 12 0v2M16 8l2 2 4-4" /></>,
    };
    return <svg {...props}>{icons[name]}</svg>;
}

function routeExists(name) {
    try { return route().has(name); } catch { return false; }
}

const quickActions = [
    { label: 'Gestionar usuarios', description: 'Usuarios, estados y roles', routeName: 'usuarios.index', icon: 'users' },
    { label: 'Gestionar docentes', description: 'Perfiles académicos', routeName: 'docentes.index', icon: 'teacher' },
    { label: 'Ver postulantes', description: 'Proceso de admisión', routeName: 'postulantes.index', icon: 'file' },
    { label: 'Revisar matrículas', description: 'Matrículas del periodo', routeName: 'matriculas.index', icon: 'calendar' },
];

function MetricCard({ title, value, description, icon, accent }) {
    return (
        <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                        {Number(value || 0).toLocaleString('es-PE')}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">{description}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-[#315d7a]">
                    <Icon name={icon} />
                </div>
            </div>
        </article>
    );
}

function EmptyState({ children }) {
    return <div className="flex min-h-44 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">{children}</div>;
}

export default function AdminDashboard() {
    const {
        auth, periodo = 'Sin periodo activo', lastUpdated,
        summary = {}, matriculasByStatus = [], applicantsByMonth = [],
        recentApplicants = [],
    } = usePage().props;

    const user = auth?.user ?? {};
    const displayName = user.nombre_completo || user.username || 'Administrador';
    const maxMonthly = Math.max(...applicantsByMonth.map((item) => item.value), 1);
    const totalStates = Math.max(matriculasByStatus.reduce((sum, item) => sum + item.value, 0), 1);

    const stats = [
        { title: 'Usuarios activos', value: summary.usuarios_activos, description: 'Cuentas habilitadas', icon: 'users', accent: 'bg-sky-500' },
        { title: 'Postulantes', value: summary.postulantes, description: 'Total registrado', icon: 'academic', accent: 'bg-violet-500' },
        { title: 'Matriculados', value: summary.matriculados, description: `Periodo ${periodo}`, icon: 'calendar', accent: 'bg-emerald-500' },
        { title: 'Cursos programados', value: summary.cursos_programados, description: 'Cursos únicos del periodo', icon: 'book', accent: 'bg-amber-500' },
        { title: 'Docentes activos', value: summary.docentes, description: 'Personal docente', icon: 'teacher', accent: 'bg-cyan-500' },
        { title: 'Pagos procesados', value: summary.pagos_registrados, description: 'Pagos aceptados', icon: 'wallet', accent: 'bg-rose-500' },
    ];

    return (
        <AuthenticatedLayout header={
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-semibold text-[#315d7a]">Gestión académica</p>
                    <h1 className="mt-1 text-2xl font-bold text-slate-900">Panel administrativo</h1>
                    <p className="mt-1 text-sm text-slate-500">Bienvenido, {displayName}. Esta es la situación actual del sistema.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Icon name="calendar" className="h-4 w-4 text-[#315d7a]" />{periodo}
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                        <Icon name="refresh" className="h-3 w-3" /> Actualizado: {lastUpdated || 'ahora'}
                    </p>
                </div>
            </div>
        }>
            <Head title="Panel administrativo" />
            <div className="space-y-6">
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                    {stats.map((stat) => <MetricCard key={stat.title} {...stat} />)}
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-slate-900">Evolución de postulantes</h2>
                                <p className="mt-1 text-sm text-slate-500">Nuevos registros de los últimos seis meses</p>
                            </div>
                            <Icon name="chart" className="h-5 w-5 text-[#315d7a]" />
                        </div>
                        {applicantsByMonth.length ? (
                            <div className="mt-6 flex h-56 items-end gap-3 border-b border-slate-200 px-2">
                                {applicantsByMonth.map((item) => (
                                    <div key={item.label} className="flex h-full flex-1 flex-col justify-end text-center">
                                        <span className="mb-2 text-xs font-bold text-slate-600">{item.value}</span>
                                        <div className="mx-auto w-full max-w-12 rounded-t-lg bg-gradient-to-t from-[#315d7a] to-[#6da0bf] transition hover:opacity-80" style={{ height: `${Math.max((item.value / maxMonthly) * 82, item.value ? 8 : 1)}%` }} />
                                        <span className="mt-2 pb-2 text-xs text-slate-500">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <div className="mt-5"><EmptyState>Aún no existen postulantes con fecha de registro.</EmptyState></div>}
                    </article>

                    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <h2 className="font-bold text-slate-900">Matrículas por estado</h2>
                        <p className="mt-1 text-sm text-slate-500">Distribución del periodo activo</p>
                        {matriculasByStatus.length ? (
                            <div className="mt-6 space-y-5">
                                {matriculasByStatus.map((item, index) => {
                                    const percentage = Math.round((item.value / totalStates) * 100);
                                    const colors = ['bg-emerald-500', 'bg-amber-500', 'bg-sky-500', 'bg-slate-400'];
                                    return <div key={item.label}>
                                        <div className="mb-2 flex justify-between text-sm">
                                            <span className="font-medium text-slate-600">{item.label}</span>
                                            <span className="font-bold text-slate-800">{item.value} · {percentage}%</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                            <div className={`h-full rounded-full ${colors[index % colors.length]}`} style={{ width: `${percentage}%` }} />
                                        </div>
                                    </div>;
                                })}
                            </div>
                        ) : <div className="mt-5"><EmptyState>No hay matrículas en el periodo.</EmptyState></div>}
                    </article>
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <h2 className="font-bold text-slate-900">Acciones rápidas</h2>
                        <p className="mt-1 text-sm text-slate-500">Operaciones frecuentes del sistema</p>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            {quickActions.map((action) => {
                                const enabled = routeExists(action.routeName);
                                return <Link key={action.label} href={enabled ? route(action.routeName) : '#'} className={`group flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition ${enabled ? 'hover:border-[#9eb9ca] hover:bg-slate-50' : 'pointer-events-none opacity-45'}`}>
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eaf1f6] text-[#315d7a]"><Icon name={action.icon} /></div>
                                    <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-800">{action.label}</p><p className="mt-1 text-xs text-slate-500">{action.description}</p></div>
                                    <Icon name="arrowRight" className="h-4 w-4 text-slate-300 group-hover:text-[#315d7a]" />
                                </Link>;
                            })}
                        </div>
                    </article>

                    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex items-center justify-between">
                            <div><h2 className="font-bold text-slate-900">Postulantes recientes</h2><p className="mt-1 text-sm text-slate-500">Últimos registros incorporados</p></div>
                            <span className="rounded-full bg-[#eaf1f6] px-3 py-1 text-xs font-semibold text-[#315d7a]">Tiempo real</span>
                        </div>
                        {recentApplicants.length ? (
                            <div className="mt-5 divide-y divide-slate-100">
                                {recentApplicants.map((item, index) => <div key={`${item.name}-${index}`} className="flex items-center gap-3 py-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-[#315d7a]">{item.name?.charAt(0)?.toUpperCase() || 'P'}</div>
                                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{item.name}</p><p className="text-xs text-slate-400">{item.date}</p></div>
                                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{item.status}</span>
                                </div>)}
                            </div>
                        ) : <div className="mt-5"><EmptyState>No hay registros recientes.</EmptyState></div>}
                    </article>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}