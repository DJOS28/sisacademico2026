import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

const COMPONENTES = [
    { value: 'autenticacion', label: 'a) Autenticación e inicio de sesión' },
    { value: 'seguridad_usuarios', label: 'b) Administración de usuarios, roles y permisos' },
    { value: 'configuracion_institucional', label: 'c) Configuración institucional y académica' },
    { value: 'admision', label: 'd) Admisión' },
    { value: 'programacion_academica', label: 'e) Planificación y programación académica' },
    { value: 'matricula', label: 'f) Matrícula' },
    { value: 'estudiantes', label: 'g) Gestión de estudiantes' },
    { value: 'docentes', label: 'h) Gestión docente' },
    { value: 'asistencia', label: 'i) Registro de asistencia' },
    { value: 'evaluacion_academica', label: 'j) Evaluación académica y Registro Auxiliar' },
    { value: 'supervision', label: 'k) Supervisión académica' },
    { value: 'interoperabilidad_moodle', label: 'l) Interoperabilidad Aula Virtual Moodle' },
    { value: 'import_export', label: 'm) Importación y exportación de información' },
];

export default function Index({ auditorias, filtros = {} }) {
    const [buscar, setBuscar] = useState(filtros.buscar || '');
    const [componente, setComponente] = useState(filtros.componente || '');
    const [operacion, setOperacion] = useState(filtros.operacion || '');
    const [resultado, setResultado] = useState(filtros.resultado || '');
    const [desde, setDesde] = useState(filtros.desde || '');
    const [hasta, setHasta] = useState(filtros.hasta || '');

    const [cargando, setCargando] = useState(false);
    const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);

    const isFirstRender = useRef(true);

    // Función de consulta asíncrona vía Inertia Partial Reloads
    const realizarConsulta = useCallback((params) => {
        setCargando(true);
        router.get(
            route('auditoria.index'),
            params,
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['auditorias', 'filtros'],
                onFinish: () => setCargando(false),
            }
        );
    }, []);

    // Debounce reactivo para búsqueda en tiempo real
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            realizarConsulta({
                buscar,
                componente,
                operacion,
                resultado,
                desde,
                hasta,
            });
        }, 350);

        return () => clearTimeout(timer);
    }, [buscar, componente, operacion, resultado, desde, hasta, realizarConsulta]);

    const limpiarFiltros = () => {
        setBuscar('');
        setComponente('');
        setOperacion('');
        setResultado('');
        setDesde('');
        setHasta('');
        realizarConsulta({});
    };

    const cambiarPagina = (url) => {
        if (!url || cargando) return;
        setCargando(true);
        router.visit(url, {
            preserveState: true,
            preserveScroll: true,
            only: ['auditorias', 'filtros'],
            onFinish: () => setCargando(false),
        });
    };

    const getResultadoBadge = (res) => {
        switch (res) {
            case 'EXITO':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        ÉXITO
                    </span>
                );
            case 'BLOQUEADO':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        BLOQUEADO
                    </span>
                );
            case 'FALLIDO':
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        FALLIDO
                    </span>
                );
        }
    };

    const getOperacionBadge = (op) => {
        const estilos = {
            INSERTAR: 'bg-blue-50 text-blue-700 border-blue-200',
            ACTUALIZAR: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            ELIMINAR: 'bg-rose-50 text-rose-700 border-rose-200',
            ACCESO: 'bg-purple-50 text-purple-700 border-purple-200',
            IMPORTAR: 'bg-teal-50 text-teal-700 border-teal-200',
            EXPORTAR: 'bg-sky-50 text-sky-700 border-sky-200',
        };

        return (
            <span className={`inline-block rounded px-2 py-0.5 font-mono text-[11px] font-bold border ${estilos[op] || 'bg-slate-100 text-slate-700'}`}>
                {op}
            </span>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#315d7a]">
                            <span>Seguridad y Control Institucional</span>
                            <span>•</span>
                            <span>Directiva 12.11 DRE</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mt-1">Registro y Trazabilidad de Auditoría</h1>
                        <p className="text-sm text-slate-500">Historial inmutable de operaciones, accesos y modificaciones en la plataforma.</p>
                    </div>

                    <a
                        href={route('auditoria.exportar')}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition"
                    >
                        <span>📥 Exportar Registros (CSV/Excel)</span>
                    </a>
                </div>
            }
        >
            <Head title="Auditoría del Sistema" />

            <div className="space-y-6">
                {/* PANEL DE FILTRADO REACTIVO */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm relative">
                    {cargando && (
                        <div className="absolute top-3 right-4 flex items-center gap-1.5 text-xs font-semibold text-[#315d7a]">
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4Z" />
                            </svg>
                            <span>Sincronizando...</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Buscar (Tiempo real)</label>
                            <input
                                type="text"
                                placeholder="Usuario, IP o descripción..."
                                value={buscar}
                                onChange={(e) => setBuscar(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a]"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Componente</label>
                            <select
                                value={componente}
                                onChange={(e) => setComponente(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a]"
                            >
                                <option value="">-- Todos los componentes --</option>
                                {COMPONENTES.map((c) => (
                                    <option key={c.value} value={c.value}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Operación</label>
                            <select
                                value={operacion}
                                onChange={(e) => setOperacion(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a]"
                            >
                                <option value="">-- Todas las operaciones --</option>
                                <option value="INSERTAR">INSERTAR (Creación)</option>
                                <option value="ACTUALIZAR">ACTUALIZAR (Modificación)</option>
                                <option value="ELIMINAR">ELIMINAR (Baja)</option>
                                <option value="ACCESO">ACCESO (Login / Auth)</option>
                                <option value="IMPORTAR">IMPORTAR (Archivos)</option>
                                <option value="EXPORTAR">EXPORTAR (Descargas)</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Resultado</label>
                            <select
                                value={resultado}
                                onChange={(e) => setResultado(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a]"
                            >
                                <option value="">-- Todos los resultados --</option>
                                <option value="EXITO">ÉXITO</option>
                                <option value="BLOQUEADO">BLOQUEADO</option>
                                <option value="FALLIDO">FALLIDO</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Fecha Desde</label>
                            <input
                                type="date"
                                value={desde}
                                onChange={(e) => setDesde(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a]"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Fecha Hasta</label>
                            <input
                                type="date"
                                value={hasta}
                                onChange={(e) => setHasta(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a]"
                            />
                        </div>

                        <div className="sm:col-span-2 flex items-end justify-end pt-1">
                            <button
                                type="button"
                                onClick={limpiarFiltros}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                            >
                                Restablecer Filtros
                            </button>
                        </div>
                    </div>
                </div>

                {/* TABLA PRINCIPAL */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm relative">
                    <div className={`overflow-x-auto transition-opacity duration-150 ${cargando ? 'opacity-60' : 'opacity-100'}`}>
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-700">
                                <tr>
                                    <th className="px-5 py-3.5">Fecha y Hora</th>
                                    <th className="px-5 py-3.5">Usuario / Rol</th>
                                    <th className="px-5 py-3.5">Componente</th>
                                    <th className="px-5 py-3.5">Operación</th>
                                    <th className="px-5 py-3.5">Descripción de la Acción</th>
                                    <th className="px-5 py-3.5 text-center">Resultado</th>
                                    <th className="px-5 py-3.5 text-center">IP / Red</th>
                                    <th className="px-5 py-3.5 text-right">Detalle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {auditorias.data.length > 0 ? (
                                    auditorias.data.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50/75 transition">
                                            <td className="px-5 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">
                                                {new Date(row.created_at).toLocaleString('es-PE', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                })}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="font-semibold text-slate-800 font-mono text-xs">
                                                    @{row.username_historico}
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    {row.rol_usuario || 'Sin rol'}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-xs font-medium text-slate-700">
                                                {row.componente}
                                            </td>
                                            <td className="px-5 py-3">
                                                {getOperacionBadge(row.operacion)}
                                            </td>
                                            <td className="px-5 py-3 text-xs text-slate-800 max-w-xs truncate" title={row.descripcion}>
                                                {row.descripcion}
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                {getResultadoBadge(row.resultado)}
                                            </td>
                                            <td className="px-5 py-3 text-center font-mono text-xs text-slate-500">
                                                {row.ip_origen}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => setDetalleSeleccionado(row)}
                                                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#315d7a] hover:bg-slate-100 transition"
                                                >
                                                    Ver Data
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-10 text-center text-sm italic text-slate-400">
                                            No se encontraron registros de auditoría bajo estos filtros de búsqueda.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINACIÓN ASÍNCRONA */}
                    {auditorias.links && auditorias.links.length > 3 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 px-6 py-3.5 text-xs text-slate-500 gap-2">
                            <div>
                                Mostrando {auditorias.from || 0} a {auditorias.to || 0} de {auditorias.total} registros auditados
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {auditorias.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        disabled={!link.url || cargando}
                                        onClick={() => cambiarPagina(link.url)}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                                            link.active
                                                ? 'bg-[#315d7a] text-white'
                                                : link.url
                                                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                : 'text-slate-300 pointer-events-none'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DE ANÁLISIS FORENSE */}
            {detalleSeleccionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Auditoría Forense #{detalleSeleccionado.id}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Registro inmutable capturado el {new Date(detalleSeleccionado.created_at).toLocaleString('es-PE')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDetalleSeleccionado(null)}
                                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mt-4 space-y-4 text-xs">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                <div>
                                    <span className="text-slate-400 block uppercase font-bold text-[10px]">Usuario:</span>
                                    <span className="font-semibold text-slate-800">@{detalleSeleccionado.username_historico}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block uppercase font-bold text-[10px]">Rol:</span>
                                    <span className="font-semibold text-slate-800">{detalleSeleccionado.rol_usuario || '—'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block uppercase font-bold text-[10px]">Operación:</span>
                                    <span className="font-semibold text-slate-800">{detalleSeleccionado.operacion}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block uppercase font-bold text-[10px]">Dirección IP:</span>
                                    <span className="font-mono text-slate-800">{detalleSeleccionado.ip_origen}</span>
                                </div>
                            </div>

                            <div>
                                <span className="font-bold text-slate-700 block mb-1">Descripción:</span>
                                <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-200 text-slate-800 font-mono text-[11px]">
                                    {detalleSeleccionado.descripcion}
                                </div>
                            </div>

                            {detalleSeleccionado.motivo_fallo && (
                                <div>
                                    <span className="font-bold text-rose-700 block mb-1">Motivo del Fallo / Bloqueo:</span>
                                    <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200 text-rose-800 text-[11px]">
                                        {detalleSeleccionado.motivo_fallo}
                                    </div>
                                </div>
                            )}

                            <div>
                                <span className="font-bold text-slate-700 block mb-1">User Agent:</span>
                                <div className="p-2 bg-slate-50 rounded border border-slate-200 text-slate-500 font-mono text-[10px] break-all">
                                    {detalleSeleccionado.user_agent || 'No capturado'}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div>
                                    <span className="font-bold text-slate-700 block mb-1">Valores Anteriores (Before):</span>
                                    <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl overflow-x-auto text-[11px] font-mono h-48 border border-slate-800">
                                        {detalleSeleccionado.datos_anteriores 
                                            ? JSON.stringify(detalleSeleccionado.datos_anteriores, null, 2) 
                                            : '// Sin valores previos'}
                                    </pre>
                                </div>

                                <div>
                                    <span className="font-bold text-slate-700 block mb-1">Valores Nuevos (After):</span>
                                    <pre className="p-3 bg-slate-900 text-sky-400 rounded-xl overflow-x-auto text-[11px] font-mono h-48 border border-slate-800">
                                        {detalleSeleccionado.datos_nuevos 
                                            ? JSON.stringify(detalleSeleccionado.datos_nuevos, null, 2) 
                                            : '// Sin valores nuevos'}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end border-t border-slate-100 pt-3">
                            <button
                                type="button"
                                onClick={() => setDetalleSeleccionado(null)}
                                className="rounded-lg bg-slate-800 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition"
                            >
                                Cerrar Inspección
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}