import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';

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
            </>
        ),
        academic: (
            <>
                <path d="m3 10 9-5 9 5-9 5-9-5Z" />
                <path d="M7 12.5V17c3 2 7 2 10 0v-4.5" />
            </>
        ),
        calendar: (
            <>
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4M8 3v4M3 10h18" />
            </>
        ),
        arrowRight: (
            <>
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
            </>
        ),
        file: (
            <>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                <path d="M14 2v6h6" />
            </>
        ),
        chart: (
            <>
                <path d="M3 3v18h18" />
                <path d="m7 16 4-5 4 3 5-7" />
            </>
        ),
        refresh: (
            <>
                <path d="M20 11a8 8 0 1 0-2.34 5.66" />
                <path d="M20 4v7h-7" />
            </>
        ),
        teacher: (
            <>
                <circle cx="9" cy="7" r="4" />
                <path d="M3 21v-2a6 6 0 0 1 12 0v2M16 8l2 2 4-4" />
            </>
        ),
        award: (
            <>
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
            </>
        ),
        checkCircle: (
            <>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
            </>
        ),
    };
    return <svg {...props}>{icons[name] || icons.file}</svg>;
}

function routeExists(name) {
    try {
        return typeof route === 'function' && route().has(name);
    } catch {
        return false;
    }
}

const quickActions = [
    { label: 'Gestionar usuarios', description: 'Cuentas, estados y roles', routeName: 'usuarios.index', icon: 'users' },
    { label: 'Gestionar docentes', description: 'Perfiles y asignaciones', routeName: 'docentes.index', icon: 'teacher' },
    { label: 'Proceso de admisión', description: 'Postulantes y registros', routeName: 'admisiones.index', icon: 'file' },
    { label: 'Control de matrículas', description: 'Matrículas del periodo', routeName: 'matriculas.index', icon: 'calendar' },
];

const PALETTE = {
    primary: '#123B57',
    secondary: '#16A6A1',
    accent: '#D7A62E',
    danger: '#E11D48',
    slate: '#64748B',
};

const PIE_COLORS = ['#16A6A1', '#D7A62E', '#E11D48', '#8B5CF6'];

function MetricCard({ title, value, description, icon, accent }) {
    return (
        <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition hover:-translate-y-0.5 hover:shadow-md">
            <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</p>
                    <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                        {Number(value || 0).toLocaleString('es-PE')}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 truncate">{description}</p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#315d7a]">
                    <Icon name={icon} />
                </div>
            </div>
        </article>
    );
}

function EmptyState({ children }) {
    return (
        <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-xs text-slate-400">
            {children}
        </div>
    );
}

export default function AdminDashboard() {
    const {
        auth,
        periodo = 'Sin periodo activo',
        lastUpdated,
        summary = {},
        dataAdmisionMatricula = [],
        dataEgresadosTitulados = [],
        dataRepitenciaCursos = [],
        dataConvalidaciones = [],
        dataCargaDocente = [],
    } = usePage().props;

    const user = auth?.user ?? {};
    const displayName = user.nombre_completo || user.username || 'Administrador';

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <span className="bg-[#eaf1f6] text-[#315d7a] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            Gestión institucional y académica
                        </span>
                        <h1 className="mt-1 text-2xl font-black text-slate-900">Panel administrativo central</h1>
                        <p className="mt-1 text-xs text-slate-500">
                            Bienvenido, <span className="font-bold text-slate-700">{displayName}</span>. Indicadores y analítica institucional en tiempo real.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-2xs">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                            <Icon name="calendar" className="h-4 w-4 text-[#315d7a]" />
                            <span>Periodo: {periodo}</span>
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                            <Icon name="refresh" className="h-3 w-3" /> Actualizado: {lastUpdated || 'ahora'}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Panel Administrativo" />

            <div className="space-y-8">
                {/* 1. INDICADORES OPERATIVOS */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Indicadores Operativos del Periodo</h3>
                        <span className="text-xs text-slate-400">Métricas principales</span>
                    </div>
                    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        <MetricCard title="Usuarios activos" value={summary.usuarios_activos} description="Cuentas habilitadas" icon="users" accent="bg-sky-500" />
                        <MetricCard title="Postulantes" value={summary.postulantes} description="Total registrado" icon="academic" accent="bg-violet-500" />
                        <MetricCard title="Matriculados" value={summary.matriculados} description="Periodo actual" icon="calendar" accent="bg-emerald-500" />
                        <MetricCard title="Docentes activos" value={summary.docentes} description="Personal docente" icon="teacher" accent="bg-cyan-500" />
                        <MetricCard title="Convalidados" value={summary.convalidados} description="Trámites aprobados" icon="checkCircle" accent="bg-amber-500" />
                        <MetricCard title="Titulados" value={summary.titulados} description="Expedientes con éxito" icon="award" accent="bg-rose-500" />
                    </section>
                </div>

                {/* 2. GRÁFICOS PRINCIPALES (Admisión y Titulación) */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Admisión y Titulación</h3>
                        <span className="text-xs text-slate-400">Visualización con Recharts</span>
                    </div>
                    <section className="grid gap-6 lg:grid-cols-2">
                        {/* Admisión vs Matrículas */}
                        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900">Admisión vs Matriculados por Programa</h2>
                                    <p className="mt-0.5 text-xs text-slate-500">Postulantes, ingresantes y matriculados efectivos</p>
                                </div>
                                <Icon name="chart" className="h-5 w-5 text-[#315d7a]" />
                            </div>
                            {dataAdmisionMatricula.length > 0 ? (
                                <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={dataAdmisionMatricula} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="carrera" tick={{ fontSize: 10, fill: '#64748B' }} />
                                            <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                                            <Bar dataKey="postulantes" name="Postulantes" fill={PALETTE.slate} radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="ingresantes" name="Ingresantes" fill={PALETTE.secondary} radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="matriculados" name="Matriculados" fill={PALETTE.primary} radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <EmptyState>No hay datos de admisión registrados para este periodo.</EmptyState>
                            )}
                        </article>

                        {/* Egresados vs Titulados */}
                        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900">Evolución de Egresados y Titulados</h2>
                                    <p className="mt-0.5 text-xs text-slate-500">Tasa histórica de titulación por periodos</p>
                                </div>
                                <Icon name="award" className="h-5 w-5 text-[#D7A62E]" />
                            </div>
                            {dataEgresadosTitulados.length > 0 ? (
                                <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={dataEgresadosTitulados} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorEgresados" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={PALETTE.secondary} stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor={PALETTE.secondary} stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorTitulados" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={PALETTE.accent} stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor={PALETTE.accent} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="periodo" tick={{ fontSize: 10, fill: '#64748B' }} />
                                            <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                                            <Area type="monotone" dataKey="expedientes" name="Expedientes" stroke={PALETTE.secondary} strokeWidth={2} fillOpacity={1} fill="url(#colorEgresados)" />
                                            <Area type="monotone" dataKey="titulados" name="Titulados" stroke={PALETTE.accent} strokeWidth={2} fillOpacity={1} fill="url(#colorTitulados)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <EmptyState>No hay datos históricos de titulación registrados.</EmptyState>
                            )}
                        </article>
                    </section>
                </div>

                {/* 3. INDICADORES ACADÉMICOS Y CARGA DOCENTE */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Repitencia, Convalidaciones y Horarios</h3>
                        <span className="text-xs text-slate-400">Control de calidad formativa</span>
                    </div>
                    <section className="grid gap-6 lg:grid-cols-3">
                        {/* Repitencia */}
                        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                            <div className="mb-4">
                                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Cursos con Mayor Repitencia</h2>
                                <p className="text-[11px] text-slate-400">Estudiantes desaprobados en el periodo</p>
                            </div>
                            {dataRepitenciaCursos.length > 0 ? (
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart layout="vertical" data={dataRepitenciaCursos} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} />
                                            <YAxis dataKey="curso" type="category" tick={{ fontSize: 9, fill: '#64748B' }} width={90} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                                            <Bar dataKey="desaprobados" name="Desaprobados" fill={PALETTE.danger} radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <EmptyState>No se registran repitencias en el periodo actual.</EmptyState>
                            )}
                        </article>

                        {/* Convalidaciones */}
                        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                            <div className="mb-4">
                                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Distribución de Convalidaciones</h2>
                                <p className="text-[11px] text-slate-400">Trámites por estado</p>
                            </div>
                            {dataConvalidaciones.length > 0 ? (
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={dataConvalidaciones}
                                                dataKey="total"
                                                nameKey="tipo"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={42}
                                                outerRadius={70}
                                                paddingAngle={4}
                                            >
                                                {dataConvalidaciones.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <EmptyState>No hay registros de convalidaciones.</EmptyState>
                            )}
                        </article>

                        {/* Carga Horaria Docente */}
                        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                            <div className="mb-4">
                                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Carga Horaria Docente</h2>
                                <p className="text-[11px] text-slate-400">Horas lectivas semanales asignadas</p>
                            </div>
                            {dataCargaDocente.length > 0 ? (
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={dataCargaDocente} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="docente" tick={{ fontSize: 9, fill: '#64748B' }} />
                                            <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                                            <Bar dataKey="horas_lectivas" name="Horas Lectivas" fill={PALETTE.primary} radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <EmptyState>No hay horarios programados para los docentes.</EmptyState>
                            )}
                        </article>
                    </section>
                </div>

                {/* 4. ACCESOS RÁPIDOS */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Accesos Rápidos</h3>
                    </div>
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {quickActions.map((action) => {
                                const enabled = routeExists(action.routeName);
                                return (
                                    <Link
                                        key={action.label}
                                        href={enabled ? route(action.routeName) : '#'}
                                        className={`group flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition ${
                                            enabled ? 'hover:border-[#9eb9ca] hover:bg-slate-50' : 'pointer-events-none opacity-45'
                                        }`}
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eaf1f6] text-[#315d7a]">
                                            <Icon name={action.icon} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-slate-800">{action.label}</p>
                                            <p className="mt-1 text-xs text-slate-500">{action.description}</p>
                                        </div>
                                        <Icon name="arrowRight" className="h-4 w-4 text-slate-300 group-hover:text-[#315d7a]" />
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}