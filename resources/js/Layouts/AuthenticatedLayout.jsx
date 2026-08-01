import Dropdown from '@/Components/Dropdown';
import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

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
        dashboard: (
            <>
                <rect x="3" y="3" width="7" height="7" rx="2" />
                <rect x="14" y="3" width="7" height="7" rx="2" />
                <rect x="3" y="14" width="7" height="7" rx="2" />
                <rect x="14" y="14" width="7" height="7" rx="2" />
            </>
        ),
        institution: (
            <>
                <path d="M3 10h18" />
                <path d="M5 10V7l7-4 7 4v3" />
                <path d="M5 21v-8" />
                <path d="M9 21v-8" />
                <path d="M15 21v-8" />
                <path d="M19 21v-8" />
                <path d="M3 21h18" />
            </>
        ),
        academic: (
            <>
                <path d="m3 10 9-5 9 5-9 5-9-5Z" />
                <path d="M7 12.5V17c3 2 7 2 10 0v-4.5" />
                <path d="M21 10v6" />
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
        'user-plus': (
            <>
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="17" y1="11" x2="23" y2="11" />
            </>
        ),
        'file-text': (
            <>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
            </>
        ),
        wallet: (
            <>
                <path d="M3 6h15a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2V6Z" />
                <path d="M3 6a3 3 0 0 1 3-3h11" />
                <path d="M16 11h5v4h-5a2 2 0 0 1 0-4Z" />
            </>
        ),
        briefcase: (
            <>
                <rect x="3" y="7" width="18" height="13" rx="2" />
                <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M3 12h18" />
            </>
        ),
        'book-open': (
            <>
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </>
        ),
        grid: (
            <>
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
            </>
        ),
        shield: (
            <>
                <path d="M12 3 5 6v5c0 4.6 2.8 8.3 7 10 4.2-1.7 7-5.4 7-10V6l-7-3Z" />
                <path d="m9 12 2 2 4-4" />
            </>
        ),
        menu: (
            <>
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
            </>
        ),
        close: (
            <>
                <path d="m6 6 12 12" />
                <path d="M18 6 6 18" />
            </>
        ),
        chevronDown: <path d="m6 9 6 6 6-6" />,
        bell: (
            <>
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
            </>
        ),
        search: (
            <>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
            </>
        ),
        logout: (
            <>
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
                <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
            </>
        ),
        profile: (
            <>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
            </>
        ),
    };

    return <svg {...props}>{icons[name] || icons.grid}</svg>;
}

const adminNavigation = [
    // --- MÓDULO 1: GENERAL / PANEL ---
    {
        id: 'general',
        moduleCode: 'PANEL',
        moduleNames: ['Panel principal', 'General', 'Dashboard'],
        label: 'General',
        icon: 'dashboard',
        items: [
            {
                label: 'Panel administrativo',
                routeName: 'dashboard',
            },
        ],
    },

    // --- MÓDULO 2: GESTIÓN INSTITUCIONAL ---
    {
        id: 'institucional',
        moduleCode: 'INSTITUCIONAL',
        moduleNames: [
            'Gestión institucional',
            'Gestion institucional',
            'Institucional',
            'Configuración',
            'Configuracion',
            'Administración General',
            'Administracion General',
            'Planificación',
            'Planificacion',
            'Supervisión',
            'Supervision',
        ],
        label: 'Gestión institucional',
        icon: 'institution',
        items: [
            { label: 'Institución', routeName: 'instituto.index' },
            { label: 'Departamentos', routeName: 'departamentos.index' },
            { label: 'Provincias', routeName: 'provincias.index' },
            { label: 'Distritos', routeName: 'distritos.index' },
            { label: 'Áreas administrativas', routeName: 'areas.index' },
            { label: 'Pabellones', routeName: 'pabellones.index' },
            { label: 'Aulas', routeName: 'aulas.index' },
            { label: 'Turnos', routeName: 'turnos.index' },
            { label: 'Secciones', routeName: 'secciones.index' },
        ],
    },

    // --- MÓDULO 3: GESTIÓN ACADÉMICA ---
    {
        id: 'academico',
        moduleCode: 'ACADEMICO',
        moduleNames: [
            'Gestión académica',
            'Gestion academica',
            'Académico',
            'Academico',
        ],
        label: 'Gestión académica',
        icon: 'academic',
        items: [
            { label: 'Periodos académicos', routeName: 'periodos.index' },
            { label: 'Semestres', routeName: 'semestres.index' },
            { label: 'Planes de estudio', routeName: 'planes-estudio.index' },
            { label: 'Módulos formativos', routeName: 'modulos-formativos.index' },
            { label: 'Cursos', routeName: 'cursos.index' },
            { label: 'Horarios', routeName: 'horarios.index' },
        ],
    },

    // --- MÓDULO 4: ADMISIÓN ---
    {
        id: 'admision',
        moduleCode: 'ADMISION',
        moduleNames: ['Admisión', 'Admision', 'Inscripciones', 'Postulantes'],
        label: 'Admisión',
        icon: 'user-plus',
        items: [
            { label: 'Requisitos', routeName: 'requisitos.index' },
            { label: 'Medio de Pagos', routeName: 'tipos-pago.index' },
            { label: 'Proceso de Admisión', routeName: 'admisiones.index' },
            { label: 'Inscripciones', routeName: 'inscripciones.index' },
            { label: 'Observados', routeName: 'admisiones.observados' },
            { label: 'Rechazados', routeName: 'admisiones.rechazados' },
        ],
    },

    // --- MÓDULO 5: ESTUDIANTES Y MATRÍCULA ---
    {
        id: 'estudiantes',
        moduleCode: 'ESTUDIANTES',
        moduleNames: [
            'Estudiantes',
            'Gestión de estudiantes',
            'Gestion de estudiantes',
            'Matrícula',
            'Matricula',
        ],
        label: 'Estudiantes y matrícula',
        icon: 'users',
        items: [
            { label: 'Estudiantes', routeName: 'estudiantes.index' },
            { label: 'Matrículas', routeName: 'matriculas.index' },
            { label: 'Convalidaciones', routeName: 'convalidaciones.index' },
            { label: 'Boleta de Notas', routeName: 'boleta_notas.index' },
        ],
    },

    // --- MÓDULO 6: TRÁMITES ACADÉMICOS ---
    {
        id: 'tramites',
        moduleCode: 'TRAMITES',
        moduleNames: [
            'Trámites académicos',
            'Tramites academicos',
            'Trámites',
            'Tramites',
            'Mesa de Partes',
        ],
        label: 'Trámites académicos',
        icon: 'file-text',
        items: [
            { label: 'Gestión de trámites', routeName: 'tramites.index' },
        ],
    },

    // --- MÓDULO 7: CAJA Y ADMINISTRACIÓN FINANCIERA ---
    {
        id: 'caja',
        moduleCode: 'CAJA',
        moduleNames: [
            'Caja',
            'Pagos',
            'Administración',
            'Administracion',
            'Administración General',
            'Administracion General',
        ],
        label: 'Caja y Pagos',
        icon: 'wallet',
        items: [
            { label: 'Apertura y Cierre de Caja', routeName: 'caja.index' },
            { label: 'Pagos y cobros', routeName: 'pagos.index' },
            { label: 'Conceptos de pago', routeName: 'conceptos.index' },
            { label: 'Bienes patrimoniales', routeName: 'bienes.index' },
        ],
    },

    // --- MÓDULO 8: BOLSA LABORAL Y PRÁCTICAS ---
    {
        id: 'bolsa-laboral',
        moduleCode: 'BOLSA_LABORAL',
        moduleNames: [
            'Bolsa Laboral',
            'Bolsa laboral',
            'Oportunidades laborales',
            'Prácticas',
            'Practicas',
        ],
        label: 'Bolsa laboral',
        icon: 'briefcase',
        items: [
            { label: 'Empresas', routeName: 'empresas.index' },
            { label: 'Tipo de Contrato', routeName: 'tipos-contrato.index' },
            { label: 'Ofertas laborales', routeName: 'ofertas-laborales.index' },
            { label: 'Reporte', routeName: 'panel-analitico.index' },
        ],
    },

    // --- MÓDULO 9: REPOSITORIO ACADÉMICO ---
    {
        id: 'repositorio',
        moduleCode: 'REPOSITORIO',
        moduleNames: [
            'Repositorio académico',
            'Repositorio academicos',
            'Repositorio',
            'Biblioteca digital',
        ],
        label: 'Repositorio académico',
        icon: 'book-open',
        items: [
            { label: 'Documentos y publicaciones', routeName: 'repositorio.index' },
        ],
    },

    // --- MÓDULO 10: SERVICIOS Y COMUNICACIÓN ---
    {
        id: 'servicios',
        moduleCode: 'SERVICIOS',
        moduleNames: [
            'Servicios académicos',
            'Servicios academicos',
            'Servicios',
            'Anuncios',
            'Encuestas',
        ],
        label: 'Servicios e interacción',
        icon: 'grid',
        items: [
            { label: 'Encuestas', routeName: 'encuestas.index' },
            { label: 'Anuncios y foros', routeName: 'anuncios.index' },
        ],
    },

    // --- MÓDULO 11: SEGURIDAD Y SISTEMA ---
    {
        id: 'sistema',
        moduleCode: 'SEGURIDAD',
        moduleNames: [
            'Seguridad y sistema',
            'Seguridad',
            'Sistema',
            'Configuración',
            'Configuracion',
            'Administración General',
            'Administracion General',
        ],
        label: 'Seguridad y sistema',
        icon: 'shield',
        items: [
            { label: 'Usuarios', routeName: 'usuarios.index' },
            { label: 'Administradores', routeName: 'administradores.index' },
            { label: 'Personal', routeName: 'personal.index' },
            { label: 'Docentes', routeName: 'docentes.index' },
            { label: 'Roles y permisos', routeName: 'roles.index' },
            { label: 'Módulos y accesos', routeName: 'modulos.index' },
            { label: 'Auditoría', routeName: 'auditoria.index' },
        ],
    },
];

const docenteNavigation = [
    {
        id: 'general',
        label: 'General',
        icon: 'dashboard',
        alwaysVisible: true,
        items: [{ label: 'Panel docente', routeName: 'dashboard' }],
    },
    {
        id: 'docencia',
        label: 'Mi actividad académica',
        icon: 'academic',
        alwaysVisible: true,
        items: [
            { label: 'Mis cursos', routeName: 'docente.cursos' },
            { label: 'Mi horario', routeName: 'docente.horarios' },
            { label: 'Mis estudiantes', routeName: 'docente.estudiantes' },
        ],
    },
    {
        id: 'comunicacion',
        label: 'Comunicación',
        icon: 'briefcase',
        alwaysVisible: true,
        items: [
            { label: 'Anuncios', routeName: 'anuncios.index' },
            { label: 'Mensajes', routeName: 'mensajes.index' },
        ],
    },
];

const estudianteNavigation = [
    {
        id: 'general',
        label: 'General',
        icon: 'dashboard',
        alwaysVisible: true,
        items: [
            { label: 'Mi panel', routeName: 'dashboard' },
            { label: 'Mi perfil', routeName: 'estudiante.perfil.edit' },
        ],
    },
    {
        id: 'formacion',
        label: 'Mi formación',
        icon: 'academic',
        alwaysVisible: true,
        items: [
            { label: 'Mi horario', routeName: 'estudiante.horario' },
            { label: 'Mis cursos', routeName: 'estudiante.cursos' },
            { label: 'Mis notas', routeName: 'estudiante.notas' },
            { label: 'Mi asistencia', routeName: 'estudiante.asistencia' },
            { label: 'Historial académico', routeName: 'estudiante.historial' },
        ],
    },
    {
        id: 'aula-virtual',
        label: 'Aula virtual',
        icon: 'academic',
        alwaysVisible: true,
        items: [
            { label: 'Materiales', routeName: 'estudiante.materiales' },
            { label: 'Tareas', routeName: 'estudiante.tareas' },
            { label: 'Evaluaciones', routeName: 'estudiante.evaluaciones' },
            { label: 'Foros', routeName: 'estudiante.foros' },
        ],
    },
    {
        id: 'servicios',
        label: 'Servicios',
        icon: 'briefcase',
        alwaysVisible: true,
        items: [
            { label: 'Mis pagos', routeName: 'estudiante.pagos' },
            { label: 'Mis trámites', routeName: 'estudiante.tramites' },
            { label: 'Anuncios', routeName: 'anuncios.index' },
            { label: 'Bolsa laboral', routeName: 'ofertas-laborales.index' },
            { label: 'Prácticas', routeName: 'practicas.index' },
        ],
    },
];

function normalize(value = '') {
    return value
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

function routeExists(routeName) {
    try {
        return route().has(routeName);
    } catch {
        return false;
    }
}

function getHref(routeName) {
    return routeExists(routeName) ? route(routeName) : '#';
}

function isRouteActive(routeName) {
    try {
        return (
            route().current(routeName) ||
            route().current(`${routeName}.*`)
        );
    } catch {
        return false;
    }
}

export default function AuthenticatedLayout({ header, children }) {
    const page = usePage();
    const user = page.props.auth?.user ?? {};
    const instituto = page.props.instituto ?? page.props.auth?.instituto ?? null;

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    const username = user.username || 'Usuario';
    const fullName =
        user.nombre_completo ||
        [user.perfil?.nombre, user.perfil?.apellido].filter(Boolean).join(' ') ||
        username;

    const mainRole =
        user.rol_principal ||
        user.role ||
        user.rol ||
        user.roles?.[0] ||
        'Sin rol asignado';

    const avatarLetter = fullName.charAt(0).toUpperCase();

    const userRoles = useMemo(
        () => (Array.isArray(user.roles) ? user.roles : []),
        [user.roles],
    );

    const normalizedRoles = useMemo(
        () => userRoles.map((role) => normalize(role)),
        [userRoles],
    );

    const isEstudiante = normalizedRoles.includes('estudiante');
    const isDocente = normalizedRoles.includes('docente');
    const isAdministrator = normalizedRoles.some((role) =>
        role.includes('administrador'),
    );

    const userModules = useMemo(
        () => (Array.isArray(user.modulos) ? user.modulos : []),
        [user.modulos],
    );

    const baseNavigation = useMemo(() => {
        if (isEstudiante) return estudianteNavigation;
        if (isDocente) return docenteNavigation;
        return adminNavigation;
    }, [isEstudiante, isDocente]);

    const hasModuleAccess = (group) => {
        if (group.alwaysVisible) return true;
        if (isAdministrator) return true;

        if (userModules.length === 0) {
            return group.id === 'general';
        }

        return userModules.some((module) => {
            const moduleName = normalize(module.nombre ?? module.name ?? '');
            const moduleCode = normalize(module.codigo ?? module.code ?? '');

            return (
                moduleCode === normalize(group.moduleCode ?? '') ||
                (group.moduleNames ?? []).some(
                    (name) => normalize(name) === moduleName,
                )
            );
        });
    };

    const visibleNavigation = useMemo(
        () => baseNavigation.filter(hasModuleAccess),
        [baseNavigation, userModules, isAdministrator],
    );

    const initialOpenGroups = useMemo(() => {
        const activeGroups = visibleNavigation
            .filter((group) =>
                group.items.some((item) => isRouteActive(item.routeName)),
            )
            .map((group) => group.id);

        return activeGroups.length ? activeGroups : ['general'];
    }, [page.url, visibleNavigation]);

    const [openGroups, setOpenGroups] = useState(initialOpenGroups);

    useEffect(() => {
        setSidebarOpen(false);

        const activeGroups = visibleNavigation
            .filter((group) =>
                group.items.some((item) => isRouteActive(item.routeName)),
            )
            .map((group) => group.id);

        if (activeGroups.length) {
            setOpenGroups((current) => {
                const next = [...new Set([...current, ...activeGroups])];

                return next.length === current.length &&
                    next.every((item, index) => item === current[index])
                    ? current
                    : next;
            });
        }
    }, [page.url, visibleNavigation]);

    const toggleGroup = (groupId) => {
        setOpenGroups((current) =>
            current.includes(groupId)
                ? current.filter((id) => id !== groupId)
                : [...current, groupId],
        );
    };

    const navigateTo = (routeName) => {
        if (!routeExists(routeName)) return;
        router.visit(route(routeName));
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#dcecf2_0,_#eef3f7_36%,_#eef3f7_100%)] text-[#172b3a]">
            {sidebarOpen && (
                <button
                    type="button"
                    className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Cerrar menú"
                />
            )}

            <aside
                className={[
                    'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/10 bg-gradient-to-b from-[#123B57] via-[#123B57] to-[#0F2F46] text-white shadow-2xl transition-all duration-300',
                    sidebarOpen
                        ? 'translate-x-0'
                        : '-translate-x-full lg:translate-x-0',
                    sidebarCollapsed ? 'lg:w-20' : 'w-[290px] lg:w-[290px]',
                ].join(' ')}
            >
                <div className="flex min-h-20 items-center justify-between border-b border-white/10 px-5 py-3">
                    <Link
                        href={getHref('dashboard')}
                        className="flex min-w-0 items-center gap-3"
                    >
                        {instituto?.logo && (
                            <img
                                src={instituto.logo}
                                alt={instituto.nombre || 'Instituto'}
                                className="h-11 w-11 shrink-0 rounded-lg bg-white/95 p-1 object-contain shadow-sm"
                            />
                        )}

                        {!sidebarCollapsed && (
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-white">
                                    {instituto?.nombre || 'Sistema Académico'}
                                </p>
                                <p className="truncate text-xs text-slate-300">
                                    {isEstudiante
                                        ? 'Portal del estudiante'
                                        : isDocente
                                          ? 'Portal docente'
                                          : 'Gestión académica institucional'}
                                </p>
                            </div>
                        )}
                    </Link>

                    <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        className="rounded-md p-2 text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
                        aria-label="Cerrar menú"
                    >
                        <Icon name="close" className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-4">
                    {!sidebarCollapsed && (
                        <div className="mb-3 px-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300/80">
                                {isEstudiante
                                    ? 'Portal del estudiante'
                                    : isDocente
                                      ? 'Portal docente'
                                      : 'Módulos autorizados'}
                            </p>
                        </div>
                    )}

                    <nav className="space-y-1">
                        {visibleNavigation.map((group) => {
                            const isOpen = openGroups.includes(group.id);
                            const groupActive = group.items.some((item) =>
                                isRouteActive(item.routeName),
                            );

                            return (
                                <div key={group.id}>
                                    <button
                                        type="button"
                                        onClick={() => toggleGroup(group.id)}
                                        className={[
                                            'flex w-full items-center rounded-lg px-3 py-2.5 text-left transition-colors',
                                            groupActive
                                                ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/10'
                                                : 'text-slate-200 hover:bg-white/10 hover:text-white',
                                            sidebarCollapsed
                                                ? 'justify-center'
                                                : 'justify-between',
                                        ].join(' ')}
                                        title={sidebarCollapsed ? group.label : undefined}
                                    >
                                        <span className="flex items-center gap-3">
                                            <Icon
                                                name={group.icon}
                                                className={[
                                                    'h-[18px] w-[18px] shrink-0',
                                                    groupActive
                                                        ? 'text-[#5EEAD4]'
                                                        : 'text-slate-300',
                                                ].join(' ')}
                                            />

                                            {!sidebarCollapsed && (
                                                <span className="text-sm font-semibold">
                                                    {group.label}
                                                </span>
                                            )}
                                        </span>

                                        {!sidebarCollapsed && (
                                            <Icon
                                                name="chevronDown"
                                                className={[
                                                    'h-4 w-4 text-slate-300 transition-transform',
                                                    isOpen ? 'rotate-180' : '',
                                                ].join(' ')}
                                            />
                                        )}
                                    </button>

                                    {!sidebarCollapsed && isOpen && (
                                        <div className="ml-5 mt-1 space-y-0.5 border-l border-white/15 pl-3">
                                            {group.items.map((item) => {
                                                const active = isRouteActive(item.routeName);
                                                const exists = routeExists(item.routeName);

                                                return (
                                                    <button
                                                        key={item.routeName}
                                                        type="button"
                                                        onClick={() =>
                                                            navigateTo(item.routeName)
                                                        }
                                                        disabled={!exists}
                                                        className={[
                                                            'relative flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                                                            active
                                                                ? 'bg-white/12 font-semibold text-white'
                                                                : exists
                                                                  ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                                                                  : 'cursor-not-allowed text-slate-500',
                                                        ].join(' ')}
                                                    >
                                                        {active && (
                                                            <span className="absolute -left-[13px] h-5 w-0.5 rounded-full bg-[#D7A62E]" />
                                                        )}
                                                        <span className="truncate">
                                                            {item.label}
                                                        </span>
                                                        {!exists && (
                                                            <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                                                                Próximo
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>

                <div className="border-t border-white/10 p-3">
                    <div className="rounded-xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#16A6A1] text-sm font-bold text-white shadow-sm">
                                {user.img ? (
                                    <img
                                        src={user.img}
                                        alt={fullName}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    avatarLetter
                                )}
                            </div>

                            {!sidebarCollapsed && (
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-white">
                                        {fullName}
                                    </p>
                                    <p className="truncate text-xs font-medium text-[#5EEAD4]">
                                        {mainRole}
                                    </p>
                                    <p className="mt-0.5 truncate text-[11px] text-slate-300">
                                        Usuario: {username}
                                    </p>
                                </div>
                            )}

                            {!sidebarCollapsed && (
                                <span
                                    className="h-2.5 w-2.5 rounded-full bg-emerald-500"
                                    title="Sesión activa"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </aside>

            <div
                className={[
                    'min-h-screen transition-all duration-300',
                    sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-[290px]',
                ].join(' ')}
            >
                <header className="sticky top-0 z-30 border-b border-[#d4e0e8] bg-[#f8fbfd]/95 shadow-sm backdrop-blur">
                    <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setSidebarOpen(true)}
                                className="rounded-md p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
                                aria-label="Abrir menú"
                            >
                                <Icon name="menu" className="h-5 w-5" />
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setSidebarCollapsed((value) => !value)
                                }
                                className="hidden rounded-lg border border-[#d5e1e8] bg-white p-2.5 text-[#315d7a] shadow-sm transition hover:border-[#16A6A1] hover:bg-[#f1fbfa] lg:inline-flex"
                                aria-label="Contraer menú"
                            >
                                <Icon name="menu" className="h-5 w-5" />
                            </button>

                            <div className="hidden sm:block">
                                <p className="text-sm font-semibold text-slate-900">
                                    Sistema de Gestión Académica
                                </p>
                                <p className="text-xs text-slate-500">
                                    {isEstudiante
                                        ? 'Experiencia académica del estudiante'
                                        : isDocente
                                          ? 'Gestión académica docente'
                                          : 'Módulos según perfil autorizado'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="relative hidden md:block">
                                <Icon
                                    name="search"
                                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type="search"
                                    placeholder="Buscar en el sistema..."
                                    className="w-72 rounded-xl border border-[#d5e1e8] bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#16A6A1] focus:ring-4 focus:ring-[#16A6A1]/10"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => setSearchOpen((value) => !value)}
                                className="rounded-md p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 md:hidden"
                                aria-label="Buscar"
                            >
                                <Icon name="search" className="h-5 w-5" />
                            </button>

                            <button
                                type="button"
                                className="relative rounded-lg border border-[#d5e1e8] bg-white p-2.5 text-[#315d7a] shadow-sm transition hover:border-[#16A6A1] hover:bg-[#f1fbfa]"
                                aria-label="Notificaciones"
                            >
                                <Icon name="bell" className="h-5 w-5" />
                                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                            </button>

                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button
                                        type="button"
                                        className="flex items-center gap-3 rounded-xl border border-[#d5e1e8] bg-white p-1.5 pr-3 shadow-sm transition hover:border-[#16A6A1] hover:bg-[#f8fbfd]"
                                    >
                                        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[#176B87] to-[#123B57] text-sm font-bold text-white">
                                            {user.img ? (
                                                <img
                                                    src={user.img}
                                                    alt={fullName}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                avatarLetter
                                            )}
                                        </div>

                                        <div className="hidden min-w-0 text-left sm:block">
                                            <p className="max-w-44 truncate text-sm font-semibold text-slate-900">
                                                {fullName}
                                            </p>
                                            <p className="max-w-44 truncate text-xs text-[#176B87]">
                                                {mainRole}
                                            </p>
                                        </div>

                                        <Icon
                                            name="chevronDown"
                                            className="hidden h-4 w-4 text-slate-400 sm:block"
                                        />
                                    </button>
                                </Dropdown.Trigger>

                                <Dropdown.Content align="right" width="56">
                                    <div className="border-b border-slate-100 px-4 py-3">
                                        <p className="truncate text-sm font-semibold text-slate-900">
                                            {fullName}
                                        </p>
                                        <p className="truncate text-xs text-[#176B87]">
                                            {mainRole}
                                        </p>
                                        <p className="mt-1 truncate text-xs text-slate-400">
                                            {username}
                                        </p>
                                    </div>

                                    {routeExists('profile.edit') && (
                                        <Dropdown.Link href={route('profile.edit')}>
                                            <span className="flex items-center gap-2">
                                                <Icon name="profile" className="h-4 w-4" />
                                                Mi perfil
                                            </span>
                                        </Dropdown.Link>
                                    )}

                                    <Dropdown.Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                    >
                                        <span className="flex items-center gap-2 text-rose-600">
                                            <Icon name="logout" className="h-4 w-4" />
                                            Cerrar sesión
                                        </span>
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>

                    {searchOpen && (
                        <div className="border-t border-[#dce7ed] bg-white/90 px-4 py-3 md:hidden">
                            <div className="relative">
                                <Icon
                                    name="search"
                                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type="search"
                                    autoFocus
                                    placeholder="Buscar en el sistema..."
                                    className="w-full rounded-xl border border-[#d5e1e8] bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none focus:border-[#16A6A1] focus:ring-4 focus:ring-[#16A6A1]/10"
                                />
                            </div>
                        </div>
                    )}
                </header>

                {header && (
                    <section className="border-b border-[#d7e2e9] bg-gradient-to-r from-[#f8fbfd] via-white to-[#e9f5f5]">
                        <div className="px-4 py-6 sm:px-6 lg:px-8">{header}</div>
                    </section>
                )}

                <main className="px-4 py-6 sm:px-6 lg:px-8">
                    <div className="mb-6 h-1 w-full rounded-full bg-gradient-to-r from-[#123B57] via-[#16A6A1] to-[#D7A62E] opacity-80" />
                    <div className="mx-auto w-full max-w-[1600px]">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}