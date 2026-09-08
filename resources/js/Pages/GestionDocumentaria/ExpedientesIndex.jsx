import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function ExpedientesIndex({ solicitudes: solicitudesIniciales, areas = [], filtros }) {
    const [listado, setListado] = useState(solicitudesIniciales);
    const [buscar, setBuscar] = useState(filtros.buscar ?? '');
    const [estado, setEstado] = useState(filtros.estado ?? '');
    const [areaId, setAreaId] = useState(filtros.area_id ?? '');
    const [cargando, setCargando] = useState(false);

    // Modal de Detalle / Seguimiento
    const [modalDetalle, setModalDetalle] = useState(null);

    const isFirstRender = useRef(true);

    // Filtrado AJAX dinámico
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timer = setTimeout(async () => {
            setCargando(true);
            const params = {};
            if (buscar.trim() !== '') params.buscar = buscar.trim();
            if (estado !== '') params.estado = estado;
            if (areaId !== '') params.area_id = areaId;

            try {
                const { data } = await axios.get(route('expedientes.index'), { params });
                setListado(data);
            } catch (error) {
                console.error('Error al filtrar expedientes:', error);
            } finally {
                setCargando(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [buscar, estado, areaId]);

    const limpiarFiltros = () => {
        setBuscar('');
        setEstado('');
        setAreaId('');
    };

    const cambiarPagina = async (url) => {
        if (!url) return;
        setCargando(true);
        try {
            const { data } = await axios.get(url);
            setListado(data);
        } catch (error) {
            console.error('Error al cambiar de página:', error);
        } finally {
            setCargando(false);
        }
    };

    const getBadgeEstado = (est) => {
        switch (est?.toLowerCase()) {
            case 'pendiente':
                return <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">⏳ Pendiente</span>;
            case 'en_proceso':
                return <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">⚙️ En Proceso</span>;
            case 'derivado':
                return <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 border border-purple-200">↗️ Derivado</span>;
            case 'completado':
                return <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">✅ Completado</span>;
            case 'rechazado':
                return <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200">❌ Observado / Rechazado</span>;
            default:
                return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{est}</span>;
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">🔍 Seguimiento General de Expedientes</h1>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Consulta la trazabilidad, historial de derivaciones y estado actual de todos los trámites.
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Seguimiento de Expedientes" />

            <div className="space-y-6">
                {/* BARRA DE FILTROS AJAX */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative min-w-[260px] flex-1">
                            <input
                                type="text"
                                value={buscar}
                                onChange={(e) => setBuscar(e.target.value)}
                                placeholder="Buscar por código de seguimiento, trámite o solicitante..."
                                className="w-full rounded-lg border border-slate-300 pl-9 pr-4 py-2 text-xs font-medium outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]"
                            />
                            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
                        </div>

                        <select
                            value={areaId}
                            onChange={(e) => setAreaId(e.target.value)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium outline-none focus:border-[#315d7a]"
                        >
                            <option value="">Todas las áreas</option>
                            {areas.map((a) => (
                                <option key={a.id} value={a.id}>{a.nombre}</option>
                            ))}
                        </select>

                        <select
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium outline-none focus:border-[#315d7a]"
                        >
                            <option value="">Todos los estados</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="en_proceso">En Proceso</option>
                            <option value="derivado">Derivado</option>
                            <option value="completado">Completado</option>
                            <option value="rechazado">Rechazado</option>
                        </select>

                        {(buscar || estado || areaId) && (
                            <button
                                type="button"
                                onClick={limpiarFiltros}
                                className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                            >
                                Limpiar
                            </button>
                        )}

                        {cargando && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#315d7a]">
                                <svg className="animate-spin h-4 w-4 text-[#315d7a]" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Buscando...
                            </span>
                        )}
                    </div>
                </div>

                {/* TABLA DE EXPEDIENTES */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                {['Código / Fecha', 'Trámite', 'Solicitante', 'Área Actual', 'Responsable', 'Estado', 'Acciones'].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {listado.data.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                                    <td className="px-4 py-3 text-xs">
                                        <p className="font-black text-[#315d7a]">{item.codigo_seguimiento}</p>
                                        <p className="text-[11px] text-slate-400">
                                            {item.fecha_solicitud ? new Date(item.fecha_solicitud).toLocaleString('es-PE') : '-'}
                                        </p>
                                    </td>

                                    <td className="px-4 py-3 text-xs font-bold text-slate-800">
                                        {item.tramite?.nombre}
                                    </td>

                                    <td className="px-4 py-3 text-xs">
                                        <p className="font-semibold text-slate-800">{item.solicitante_nombre ?? 'Solicitante Externo'}</p>
                                        <span className="text-[10px] font-bold uppercase text-slate-400">{item.tipo_solicitante}</span>
                                    </td>

                                    <td className="px-4 py-3 text-xs">
                                        <span className="font-semibold text-slate-700">🏢 {item.area?.nombre || 'Mesa de Partes'}</span>
                                    </td>

                                    <td className="px-4 py-3 text-xs">
                                        {item.responsable ? (
                                            <span className="font-semibold text-slate-700">👤 {item.responsable.username}</span>
                                        ) : (
                                            <span className="text-amber-600 font-bold italic text-[11px]">Sin Asignar</span>
                                        )}
                                    </td>

                                    <td className="px-4 py-3 text-xs">{getBadgeEstado(item.estado)}</td>

                                    <td className="px-4 py-3 text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setModalDetalle(item)}
                                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-xs"
                                            title="Ver Trazabilidad Completa"
                                        >
                                            👁️ Ver Seguimiento
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {listado.data.length === 0 && (
                        <div className="p-12 text-center text-xs font-bold text-slate-400">
                            No se encontraron expedientes con los criterios seleccionados.
                        </div>
                    )}
                </div>

                {/* PAGINACIÓN */}
                {listado.links?.length > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-1">
                        {listado.links.map((link, index) => (
                            <button
                                key={index}
                                disabled={!link.url}
                                onClick={() => cambiarPagina(link.url)}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                                    link.active
                                        ? 'bg-[#315d7a] text-white border-[#315d7a]'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                } disabled:opacity-40 cursor-pointer`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL DE SEGUIMIENTO Y TRAZABILIDAD COMPLETA */}
            {modalDetalle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl space-y-5 max-h-[85vh] overflow-y-auto">
                        <div className="border-b pb-3 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-bold uppercase text-slate-400">Hoja de Ruta del Expediente</span>
                                <h3 className="text-lg font-black text-[#315d7a]">{modalDetalle.codigo_seguimiento}</h3>
                            </div>
                            <button onClick={() => setModalDetalle(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
                        </div>

                        {/* DATOS GENERALES */}
                        <div className="grid gap-3 sm:grid-cols-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                            <div><strong>Trámite:</strong> {modalDetalle.tramite?.nombre}</div>
                            <div><strong>Solicitante:</strong> {modalDetalle.solicitante_nombre}</div>
                            <div><strong>Ubicación Actual:</strong> 🏢 {modalDetalle.area?.nombre || 'Mesa de Partes'}</div>
                            <div><strong>Estado Actual:</strong> {getBadgeEstado(modalDetalle.estado)}</div>
                            <div><strong>Fecha Registro:</strong> {modalDetalle.fecha_solicitud ? new Date(modalDetalle.fecha_solicitud).toLocaleString('es-PE') : '-'}</div>
                            <div><strong>Fecha Resolución:</strong> {modalDetalle.fecha_resolucion ? new Date(modalDetalle.fecha_resolucion).toLocaleString('es-PE') : 'En Trámite'}</div>
                        </div>

                        {modalDetalle.motivo_rechazo && (
                            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-xs text-rose-800">
                                <strong>Motivo de Rechazo / Observación Final:</strong>
                                <p className="mt-1 font-medium">{modalDetalle.motivo_rechazo}</p>
                            </div>
                        )}

                        {/* DOCUMENTOS ADJUNTOS */}
                        {(modalDetalle.archivos_requisitos?.length > 0 || modalDetalle.archivosRequisitos?.length > 0) && (
                            <div className="space-y-2 border-t pt-3">
                                <h4 className="text-xs font-bold uppercase text-slate-600">📄 Archivos Adjuntados</h4>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {(modalDetalle.archivos_requisitos || modalDetalle.archivosRequisitos).map((adj) => (
                                        <a
                                            key={adj.id}
                                            href={`/storage/${adj.archivo_ruta}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs hover:bg-blue-50 transition"
                                        >
                                            <span className="truncate font-semibold text-slate-700">📄 {adj.nombre_original || 'Documento'}</span>
                                            <span className="text-[10px] font-bold text-[#315d7a]">Ver ➔</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TIMELINE DE HISTORIAL / DERIVACIONES */}
                        <div className="space-y-2 border-t pt-3">
                            <h4 className="text-xs font-bold uppercase text-slate-600">📜 Historial de Recorrido / Derivaciones</h4>
                            
                            {(modalDetalle.historial_derivaciones?.length > 0 || modalDetalle.historialDerivaciones?.length > 0) ? (
                                <div className="space-y-2.5">
                                    {(modalDetalle.historial_derivaciones || modalDetalle.historialDerivaciones).map((h, idx) => (
                                        <div key={h.id || idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
                                            <div className="flex items-center justify-between font-bold text-slate-800">
                                                <span>🏢 {h.area_origen?.nombre || h.areaOrigen?.nombre || 'Mesa de Partes General'} ➔ 🏢 {h.area_destino?.nombre || h.areaDestino?.nombre || 'Área Destino'}</span>
                                                <span className="text-[10px] text-slate-400 font-normal">
                                                    {h.fecha_derivacion ? new Date(h.fecha_derivacion).toLocaleString('es-PE') : '-'}
                                                </span>
                                            </div>
                                            {h.observacion && (
                                                <p className="text-slate-600 italic text-[11px] bg-white p-2 rounded-lg border border-slate-100">
                                                    "{h.observacion}"
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 italic">El expediente no registra derivaciones previas (permanece en su área inicial).</p>
                            )}
                        </div>

                        <div className="flex justify-end border-t pt-3">
                            <button onClick={() => setModalDetalle(null)} className="rounded-xl bg-slate-800 px-6 py-2 text-xs font-bold text-white cursor-pointer hover:bg-slate-900 transition">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}