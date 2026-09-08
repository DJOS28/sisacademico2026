import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import axios from 'axios';

export default function BandejaArea({ solicitudes, areas = [], filtros }) {
    const [buscar, setBuscar] = useState(filtros.buscar ?? '');
    const [estado, setEstado] = useState(filtros.estado ?? '');
    const [soloSinAsignar, setSoloSinAsignar] = useState(false);

    // Modales
    const [modalDerivar, setModalDerivar] = useState(null);
    const [modalResolver, setModalResolver] = useState(null);
    const [modalDetalle, setModalDetalle] = useState(null);

    // Formulario de Derivación (con soporte para archivo)
    const { data: formDerivar, setData: setDataDerivar, post: postDerivar, processing: cargandoDerivar, reset: resetDerivar, errors: erroresDerivar } = useForm({
        area_destino_id: '',
        observacion: '',
        comentarios: '',
        archivo: null,
    });

    // Formulario de Atención / Resolución (subida multipart)
    const { data: formResolver, setData: setDataResolver, post: postResolver, processing: cargandoResolver, reset: resetResolver, errors: erroresResolver } = useForm({
        _method: 'PUT',
        estado: 'completado',
        motivo_rechazo: '',
        archivo: null,
    });

    // Filtrar solicitudes
    const handleFiltrar = (e) => {
        e.preventDefault();
        router.get(route('solicitudes.area.index'), {
            buscar,
            estado,
            solo_sin_asignar: soloSinAsignar ? 1 : 0
        }, { preserveState: true, replace: true });
    };

    const limpiarFiltros = () => {
        setBuscar('');
        setEstado('');
        setSoloSinAsignar(false);
        router.get(route('solicitudes.area.index'));
    };

    // Asignarse / Tomar el expediente
    const handleAsignarme = async (item) => {
        const result = await Swal.fire({
            title: '¿Asignarte este expediente?',
            text: `Pasarás a ser el responsable directo de la atención de la solicitud ${item.codigo_seguimiento}.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, asignarme',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#315d7a',
        });

        if (!result.isConfirmed) return;

        try {
            await axios.post(route('solicitudes.asignarme', item.id));
            Swal.fire('Asignado', 'Has tomado la responsabilidad de este expediente.', 'success');
            router.reload({ preserveScroll: true });
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'No se pudo asignar el expediente.', 'error');
        }
    };

    // Enviar Derivación con Archivo
    const submitDerivar = (e) => {
        e.preventDefault();
        if (!modalDerivar) return;

        postDerivar(route('solicitudes.derivar', modalDerivar.id), {
            forceFormData: true,
            onSuccess: () => {
                setModalDerivar(null);
                resetDerivar();
                Swal.fire('Derivado', 'El expediente ha sido transferido a la nueva área con su adjunto.', 'success');
            },
        });
    };

    // Enviar Resolución (Aprobación / Observación con correo automático)
    const submitResolver = (e) => {
        e.preventDefault();
        if (!modalResolver) return;

        postResolver(route('solicitudes.atender', modalResolver.id), {
            forceFormData: true,
            onSuccess: () => {
                setModalResolver(null);
                resetResolver();
                Swal.fire('Procesado', 'El expediente ha sido actualizado y se ha notificado al solicitante por correo.', 'success');
            },
        });
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
                return <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">✅ Atendido / Completado</span>;
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
                        <h1 className="text-2xl font-bold text-slate-900">🏢 Bandeja de Atención por Área</h1>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Gestión, derivación e informe de expedientes asignados a tu departamento.
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Bandeja de Atención por Área" />

            <div className="space-y-6">

                {/* FILTROS DE BÚSQUEDA */}
                <form onSubmit={handleFiltrar} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative min-w-[260px] flex-1">
                            <input
                                type="text"
                                value={buscar}
                                onChange={(e) => setBuscar(e.target.value)}
                                placeholder="Buscar por código de seguimiento o trámite..."
                                className="w-full rounded-lg border border-slate-300 pl-9 pr-4 py-2 text-xs font-medium outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]"
                            />
                            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
                        </div>

                        <select
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium outline-none focus:border-[#315d7a]"
                        >
                            <option value="">Todos los estados</option>
                            <option value="pendiente">Pendientes</option>
                            <option value="en_proceso">En Proceso</option>
                            <option value="derivado">Derivados</option>
                            <option value="completado">Completados</option>
                            <option value="rechazado">Rechazados</option>
                        </select>

                        <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={soloSinAsignar}
                                onChange={(e) => setSoloSinAsignar(e.target.checked)}
                                className="rounded border-slate-300 text-[#315d7a] focus:ring-[#315d7a]"
                            />
                            <span>Solo sin responsable</span>
                        </label>

                        <button
                            type="submit"
                            className="rounded-lg bg-[#315d7a] px-4 py-2 text-xs font-bold text-white hover:bg-[#274c64] transition cursor-pointer"
                        >
                            Filtrar
                        </button>

                        {(buscar || estado || soloSinAsignar) && (
                            <button
                                type="button"
                                onClick={limpiarFiltros}
                                className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>
                </form>

                {/* TABLA DE SOLICITUDES */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                {['Código / Fecha', 'Trámite', 'Solicitante', 'Ubicación / Origen', 'Estado', 'Responsable', 'Acciones'].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {solicitudes.data.map((item) => (
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
                                        <p className="font-semibold text-slate-800">{item.solicitante_nombre ?? 'Externo'}</p>
                                        <span className="text-[10px] font-bold uppercase text-slate-400">{item.tipo_solicitante}</span>
                                    </td>

                                    <td className="px-4 py-3 text-xs">
                                        <span className="font-semibold text-slate-700">🏢 {item.area?.nombre}</span>
                                    </td>

                                    <td className="px-4 py-3 text-xs">{getBadgeEstado(item.estado)}</td>

                                    <td className="px-4 py-3 text-xs">
                                        {item.responsable ? (
                                            <span className="font-semibold text-slate-700">👤 {item.responsable.username}</span>
                                        ) : (
                                            <span className="text-amber-600 font-bold italic text-[11px]">Sin Asignar</span>
                                        )}
                                    </td>

                                    <td className="px-4 py-3 text-xs">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setModalDetalle(item)}
                                                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                                                title="Ver Detalle e Historial"
                                            >
                                                👁️
                                            </button>

                                            {!item.responsable && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleAsignarme(item)}
                                                    className="rounded-md bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-600 shadow-xs cursor-pointer"
                                                >
                                                    📌 Asignarme
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setModalDerivar(item);
                                                    setDataDerivar('area_destino_id', '');
                                                    setDataDerivar('observacion', '');
                                                    setDataDerivar('archivo', null);
                                                }}
                                                className="rounded-md bg-purple-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-purple-800 shadow-xs cursor-pointer"
                                            >
                                                ↗️ Derivar
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setModalResolver(item);
                                                    setDataResolver('_method', 'PUT');
                                                    setDataResolver('estado', 'completado');
                                                    setDataResolver('motivo_rechazo', item.motivo_rechazo ?? '');
                                                    setDataResolver('archivo', null);
                                                }}
                                                className="rounded-md bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-800 shadow-xs cursor-pointer"
                                            >
                                                ✓ Atender / Finalizar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {solicitudes.data.length === 0 && (
                        <div className="p-12 text-center text-xs font-bold text-slate-400">
                            No hay expedientes pendientes en tu área.
                        </div>
                    )}
                </div>

                {/* PAGINACIÓN */}
                {solicitudes.links?.length > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-1">
                        {solicitudes.links.map((link, index) => (
                            <button
                                key={index}
                                disabled={!link.url}
                                onClick={() => link.url && router.visit(link.url, { preserveState: true, preserveScroll: true })}
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

            {/* MODAL DERIVAR CON ENVIÓ DE ARCHIVO */}
            {modalDerivar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
                        <div className="border-b pb-2 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-900">
                                ↗️ Derivar Expediente: <span className="text-[#315d7a]">{modalDerivar.codigo_seguimiento}</span>
                            </h3>
                            <button onClick={() => setModalDerivar(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
                        </div>

                        <form onSubmit={submitDerivar} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Área Destino *</label>
                                <select
                                    value={formDerivar.area_destino_id}
                                    onChange={(e) => setDataDerivar('area_destino_id', e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-[#315d7a]"
                                    required
                                >
                                    <option value="">-- Selecciona el Área Destino --</option>
                                    {areas.filter((a) => String(a.id) !== String(modalDerivar.area_id)).map((a) => (
                                        <option key={a.id} value={a.id}>{a.nombre}</option>
                                    ))}
                                </select>
                                {erroresDerivar.area_destino_id && <p className="mt-1 text-xs font-bold text-rose-600">{erroresDerivar.area_destino_id}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Observación / Proveído para el Área</label>
                                <textarea
                                    rows={2}
                                    value={formDerivar.observacion}
                                    onChange={(e) => setDataDerivar('observacion', e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-[#315d7a]"
                                    placeholder="Ej. Se deriva para informe técnico..."
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Adjuntar Informe / Proveído de Derivación (PDF, JPG, PNG)</label>
                                <input
                                    type="file"
                                    onChange={(e) => setDataDerivar('archivo', e.target.files[0] ?? null)}
                                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-600"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t pt-3">
                                <button type="button" onClick={() => setModalDerivar(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer">Cancelar</button>
                                <button type="submit" disabled={cargandoDerivar} className="rounded-xl bg-purple-700 px-6 py-2 text-xs font-bold text-white hover:bg-purple-800 disabled:opacity-50 cursor-pointer">
                                    {cargandoDerivar ? 'Derivando...' : 'Confirmar Derivación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL ATENDER / FINALIZAR / OBSERVAR */}
            {modalResolver && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
                        <div className="border-b pb-2 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-900">
                                ✓ Atender / Finalizar: <span className="text-[#315d7a]">{modalResolver.codigo_seguimiento}</span>
                            </h3>
                            <button onClick={() => setModalResolver(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
                        </div>

                        <form onSubmit={submitResolver} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Resultado del Trámite *</label>
                                <select
                                    value={formResolver.estado}
                                    onChange={(e) => setDataResolver('estado', e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-[#315d7a]"
                                >
                                    <option value="completado">✅ Aprobar y Finalizar Trámite</option>
                                    <option value="en_proceso">⚙️ Mantener En Proceso / Evaluación</option>
                                    <option value="rechazado">❌ Observar / Rechazar Solicitud</option>
                                </select>
                            </div>

                            {/* DOCUMENTO DE RESPUESTA FINAL / CERTIFICADO / INFORME */}
                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase text-slate-600">
                                    {formResolver.estado === 'completado' 
                                        ? '📄 Adjuntar Documento de Respuesta / Resolución Final (PDF)' 
                                        : '📎 Adjuntar Documento Probatorio / Sustento (Opcional)'}
                                </label>
                                <input
                                    type="file"
                                    onChange={(e) => setDataResolver('archivo', e.target.files[0] ?? null)}
                                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-600"
                                />
                            </div>

                            {/* NOTA DE CONCLUSIÓN / SUSTENTO DE RECHAZO */}
                            <div>
                                <label className={`mb-1 block text-xs font-bold uppercase ${formResolver.estado === 'rechazado' ? 'text-rose-700' : 'text-slate-600'}`}>
                                    {formResolver.estado === 'rechazado' ? 'Motivo de Rechazo u Observaciones *' : 'Conclusión / Notas de Respuesta al Solicitante'}
                                </label>
                                <textarea
                                    rows={3}
                                    value={formResolver.motivo_rechazo}
                                    onChange={(e) => setDataResolver('motivo_rechazo', e.target.value)}
                                    className={`w-full rounded-xl border p-2.5 text-xs outline-none ${
                                        formResolver.estado === 'rechazado'
                                            ? 'border-rose-300 bg-rose-50/30 focus:border-rose-600'
                                            : 'border-slate-300 focus:border-[#315d7a]'
                                    }`}
                                    placeholder={
                                        formResolver.estado === 'rechazado'
                                            ? 'Indique las razones específicas del rechazo u observaciones...'
                                            : 'Escriba indicaciones o notas finales para el usuario...'
                                    }
                                    required={formResolver.estado === 'rechazado'}
                                />
                                {erroresResolver.motivo_rechazo && (
                                    <p className="mt-1 text-xs font-bold text-rose-600">{erroresResolver.motivo_rechazo}</p>
                                )}
                            </div>

                            <div className="rounded-xl bg-blue-50/70 p-3 text-[11px] font-medium text-blue-800 border border-blue-100 flex items-center gap-2">
                                <span>📧</span>
                                <span>Al guardar, se enviará una notificación por correo electrónico automáticamente al solicitante informándole del resultado.</span>
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t pt-3">
                                <button type="button" onClick={() => setModalResolver(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer">Cancelar</button>
                                <button type="submit" disabled={cargandoResolver} className="rounded-xl bg-emerald-700 px-6 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50 cursor-pointer">
                                    {cargandoResolver ? 'Guardando...' : 'Confirmar y Notificar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DETALLE Y HISTORIAL CON INFORMES Y PROVEÍDOS DE DERIVACIÓN */}
            {modalDetalle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl space-y-5 max-h-[85vh] overflow-y-auto">
                        <div className="border-b pb-2 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-bold uppercase text-slate-400">Expediente Digital</span>
                                <h3 className="text-base font-black text-[#315d7a]">{modalDetalle.codigo_seguimiento}</h3>
                            </div>
                            <button onClick={() => setModalDetalle(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <div><strong>Trámite:</strong> {modalDetalle.tramite?.nombre}</div>
                            <div><strong>Solicitante:</strong> {modalDetalle.solicitante_nombre}</div>
                            <div><strong>Ubicación Actual:</strong> 🏢 {modalDetalle.area?.nombre}</div>
                            <div><strong>Estado:</strong> {getBadgeEstado(modalDetalle.estado)}</div>
                        </div>

                        {modalDetalle.motivo_rechazo && (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 space-y-1">
                                <span className="font-bold">📝 Sustento / Observación Final:</span>
                                <p className="italic font-medium">"{modalDetalle.motivo_rechazo}"</p>
                            </div>
                        )}

                        {modalDetalle.archivo && (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center justify-between">
                                <div>
                                    <span className="font-bold">📄 Documento de Resolución Emitido</span>
                                    <p className="text-[11px] text-emerald-600">Respuesta oficial emitida por el área.</p>
                                </div>
                                <a
                                    href={`/storage/${modalDetalle.archivo}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 transition"
                                >
                                    Descargar ➔
                                </a>
                            </div>
                        )}

                        {/* REQUISITOS ADJUNTOS */}
                        {(modalDetalle.archivos_requisitos?.length > 0 || modalDetalle.archivosRequisitos?.length > 0) && (
                            <div className="space-y-2 border-t pt-3">
                                <h4 className="text-xs font-bold uppercase text-slate-500">📁 Requisitos y Archivos del Solicitante</h4>
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
                                            <span className="text-[10px] font-bold text-[#315d7a]">Descargar ➔</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TIMELINE DE DERIVACIONES E INFORMES DE ÁREAS */}
                        {(modalDetalle.historial_derivaciones?.length > 0 || modalDetalle.historialDerivaciones?.length > 0) && (
                            <div className="space-y-2 border-t pt-3">
                                <h4 className="text-xs font-bold uppercase text-slate-500">📜 Historial de Derivaciones e Informes de Área</h4>
                                <div className="space-y-2.5">
                                    {(modalDetalle.historial_derivaciones || modalDetalle.historialDerivaciones).map((h, idx) => (
                                        <div key={h.id || idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1.5">
                                            <div className="flex items-center justify-between font-bold text-slate-800">
                                                <span>🏢 {h.area_origen?.nombre || h.areaOrigen?.nombre || 'Mesa de Partes'} ➔ 🏢 {h.area_destino?.nombre || h.areaDestino?.nombre || 'Área Destino'}</span>
                                                <span className="text-[10px] text-slate-400 font-normal">{h.fecha_derivacion ? new Date(h.fecha_derivacion).toLocaleString('es-PE') : '-'}</span>
                                            </div>

                                            {h.observacion && <p className="text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100">"{h.observacion}"</p>}

                                            {h.archivo_derivacion && (
                                                <a
                                                    href={`/storage/${h.archivo_derivacion}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 font-bold text-purple-700 hover:text-purple-900 text-[11px]"
                                                >
                                                    📎 Descargar Proveído / Informe Adjunto ➔
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end border-t pt-3">
                            <button onClick={() => setModalDetalle(null)} className="rounded-xl bg-slate-800 px-6 py-2 text-xs font-bold text-white cursor-pointer">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

        </AuthenticatedLayout>
    );
}