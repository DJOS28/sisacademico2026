import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';

export default function MisAsignadas({ solicitudes, areas = [] }) {
    const [estado, setEstado] = useState('');

    // Modales
    const [modalDerivar, setModalDerivar] = useState(null);
    const [modalResolver, setModalResolver] = useState(null);
    const [modalDetalle, setModalDetalle] = useState(null);

    // Formulario de Derivación
    const {
        data: formDerivar,
        setData: setDataDerivar,
        post: postDerivar,
        processing: cargandoDerivar,
        reset: resetDerivar,
        errors: erroresDerivar,
    } = useForm({
        area_destino_id: '',
        observacion: '',
        comentarios: '',
        archivo: null,
    });

    // Formulario de Atención / Resolución
    const {
        data: formResolver,
        setData: setDataResolver,
        put: putResolver,
        processing: cargandoResolver,
        reset: resetResolver,
        errors: erroresResolver,
    } = useForm({
        estado: 'completado',
        motivo_rechazo: '',
    });

    // Filtrar solicitudes por estado
    const handleFiltrar = (e) => {
        e.preventDefault();
        router.get(
            route('solicitudes.mis-asignadas'),
            { estado },
            { preserveState: true, replace: true }
        );
    };

    const limpiarFiltros = () => {
        setEstado('');
        router.get(route('solicitudes.mis-asignadas'));
    };

    // Enviar Derivación
    const submitDerivar = (e) => {
        e.preventDefault();
        if (!modalDerivar) return;

        postDerivar(route('solicitudes.derivar', modalDerivar.id), {
            forceFormData: true,
            onSuccess: () => {
                setModalDerivar(null);
                resetDerivar();
                Swal.fire(
                    'Derivado',
                    'El expediente ha sido derivado correctamente a la nueva área.',
                    'success'
                );
            },
        });
    };

    // Enviar Resolución
    const submitResolver = (e) => {
        e.preventDefault();
        if (!modalResolver) return;

        putResolver(route('solicitudes.atender', modalResolver.id), {
            onSuccess: () => {
                setModalResolver(null);
                resetResolver();
                Swal.fire(
                    'Actualizado',
                    'El expediente fue resuelto con éxito.',
                    'success'
                );
            },
        });
    };

    const getBadgeEstado = (est) => {
        switch (est?.toLowerCase()) {
            case 'pendiente':
                return (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                        ⏳ Pendiente
                    </span>
                );
            case 'en_proceso':
                return (
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                        ⚙️ En Proceso
                    </span>
                );
            case 'derivado':
                return (
                    <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 border border-purple-200">
                        ↗️ Derivado
                    </span>
                );
            case 'completado':
                return (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                        ✅ Completado
                    </span>
                );
            case 'rechazado':
                return (
                    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200">
                        ❌ Observado / Rechazado
                    </span>
                );
            default:
                return (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                        {est}
                    </span>
                );
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            📌 Mis Solicitudes Asignadas
                        </h1>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Listado de expedientes tomados bajo tu responsabilidad para atención directa.
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Mis Asignadas" />

            <div className="space-y-6">
                {/* FILTROS DE BÚSQUEDA */}
                <form
                    onSubmit={handleFiltrar}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
                >
                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium outline-none focus:border-[#315d7a]"
                        >
                            <option value="">Todos los estados</option>
                            <option value="en_proceso">En Proceso</option>
                            <option value="derivado">Derivados</option>
                            <option value="completado">Completados</option>
                            <option value="rechazado">Rechazados</option>
                        </select>

                        <button
                            type="submit"
                            className="rounded-lg bg-[#315d7a] px-4 py-2 text-xs font-bold text-white hover:bg-[#274c64] transition cursor-pointer"
                        >
                            Filtrar
                        </button>

                        {estado && (
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
                                {[
                                    'Código / Fecha',
                                    'Trámite',
                                    'Solicitante',
                                    'Ubicación / Área',
                                    'Estado',
                                    'Acciones',
                                ].map((h) => (
                                    <th
                                        key={h}
                                        className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                                    >
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
                                            {item.fecha_solicitud
                                                ? new Date(item.fecha_solicitud).toLocaleString('es-PE')
                                                : '-'}
                                        </p>
                                    </td>

                                    <td className="px-4 py-3 text-xs font-bold text-slate-800">
                                        {item.tramite?.nombre}
                                    </td>

                                    <td className="px-4 py-3 text-xs">
                                        <p className="font-semibold text-slate-800">
                                            {item.solicitante_nombre ?? 'Solicitante Externo'}
                                        </p>
                                        <span className="text-[10px] font-bold uppercase text-slate-400">
                                            {item.tipo_solicitante}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3 text-xs">
                                        <span className="font-semibold text-slate-700">
                                            🏢 {item.area?.nombre || 'Mesa de Partes'}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3 text-xs">{getBadgeEstado(item.estado)}</td>

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

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setModalDerivar(item);
                                                    setDataDerivar('area_destino_id', '');
                                                }}
                                                className="rounded-md bg-purple-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-purple-800 shadow-xs cursor-pointer"
                                            >
                                                ↗️ Derivar
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setModalResolver(item);
                                                    setDataResolver('estado', 'completado');
                                                }}
                                                className="rounded-md bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-800 shadow-xs cursor-pointer"
                                            >
                                                ✓ Resolver
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {solicitudes.data.length === 0 && (
                        <div className="p-12 text-center text-xs font-bold text-slate-400">
                            No tienes solicitudes asignadas actualmente.
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
                                onClick={() =>
                                    link.url &&
                                    router.visit(link.url, {
                                        preserveState: true,
                                        preserveScroll: true,
                                    })
                                }
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

            {/* MODAL DERIVAR */}
            {modalDerivar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
                        <div className="border-b pb-2 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-900">
                                ↗️ Derivar Expediente:{' '}
                                <span className="text-[#315d7a]">
                                    {modalDerivar.codigo_seguimiento}
                                </span>
                            </h3>
                            <button
                                onClick={() => setModalDerivar(null)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={submitDerivar} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase text-slate-600">
                                    Área Destino *
                                </label>
                                <select
                                    value={formDerivar.area_destino_id}
                                    onChange={(e) =>
                                        setDataDerivar('area_destino_id', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-[#315d7a]"
                                    required
                                >
                                    <option value="">-- Selecciona el Área Destino --</option>
                                    {areas
                                        .filter(
                                            (a) => String(a.id) !== String(modalDerivar.area_id)
                                        )
                                        .map((a) => (
                                            <option key={a.id} value={a.id}>
                                                {a.nombre}
                                            </option>
                                        ))}
                                </select>
                                {erroresDerivar.area_destino_id && (
                                    <p className="mt-1 text-xs font-bold text-rose-600">
                                        {erroresDerivar.area_destino_id}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase text-slate-600">
                                    Observación / Indicación
                                </label>
                                <textarea
                                    rows={2}
                                    value={formDerivar.observacion}
                                    onChange={(e) => setDataDerivar('observacion', e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-[#315d7a]"
                                    placeholder="Instrucciones para el área destino..."
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase text-slate-600">
                                    Documento Adjunto (Informe / Proveído)
                                </label>
                                <input
                                    type="file"
                                    onChange={(e) =>
                                        setDataDerivar('archivo', e.target.files[0] ?? null)
                                    }
                                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-600"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t pt-3">
                                <button
                                    type="button"
                                    onClick={() => setModalDerivar(null)}
                                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={cargandoDerivar}
                                    className="rounded-xl bg-purple-700 px-6 py-2 text-xs font-bold text-white hover:bg-purple-800 disabled:opacity-50 cursor-pointer"
                                >
                                    {cargandoDerivar ? 'Derivando...' : 'Confirmar Derivación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL RESOLVER */}
            {modalResolver && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
                        <div className="border-b pb-2 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-900">
                                ✓ Resolver Solicitud:{' '}
                                <span className="text-[#315d7a]">
                                    {modalResolver.codigo_seguimiento}
                                </span>
                            </h3>
                            <button
                                onClick={() => setModalResolver(null)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={submitResolver} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase text-slate-600">
                                    Acción a Realizar *
                                </label>
                                <select
                                    value={formResolver.estado}
                                    onChange={(e) => setDataResolver('estado', e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-[#315d7a]"
                                >
                                    <option value="completado">✅ Aceptar y Completar Trámite</option>
                                    <option value="en_proceso">⚙️ Marcar En Proceso / En Evaluación</option>
                                    <option value="rechazado">❌ Observar / Rechazar Solicitud</option>
                                </select>
                            </div>

                            {formResolver.estado === 'rechazado' && (
                                <div>
                                    <label className="mb-1 block text-xs font-bold uppercase text-rose-700">
                                        Motivo de Rechazo *
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={formResolver.motivo_rechazo}
                                        onChange={(e) =>
                                            setDataResolver('motivo_rechazo', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-rose-300 bg-rose-50/30 p-2.5 text-xs outline-none focus:border-rose-600"
                                        placeholder="Sustento o razón del rechazo..."
                                        required
                                    />
                                    {erroresResolver.motivo_rechazo && (
                                        <p className="mt-1 text-xs font-bold text-rose-600">
                                            {erroresResolver.motivo_rechazo}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 border-t pt-3">
                                <button
                                    type="button"
                                    onClick={() => setModalResolver(null)}
                                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={cargandoResolver}
                                    className="rounded-xl bg-emerald-700 px-6 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
                                >
                                    {cargandoResolver ? 'Procesando...' : 'Guardar Resolución'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DETALLE */}
            {modalDetalle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
                        <div className="border-b pb-2 flex items-center justify-between">
                            <h3 className="text-base font-black text-[#315d7a]">
                                {modalDetalle.codigo_seguimiento}
                            </h3>
                            <button
                                onClick={() => setModalDetalle(null)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 text-xs">
                            <div>
                                <strong>Trámite:</strong> {modalDetalle.tramite?.nombre}
                            </div>
                            <div>
                                <strong>Solicitante:</strong> {modalDetalle.solicitante_nombre}
                            </div>
                            <div>
                                <strong>Área Actual:</strong> 🏢 {modalDetalle.area?.nombre}
                            </div>
                            <div>
                                <strong>Estado:</strong> {getBadgeEstado(modalDetalle.estado)}
                            </div>
                        </div>

                        {(modalDetalle.archivos_requisitos?.length > 0 ||
                            modalDetalle.archivosRequisitos?.length > 0) && (
                            <div className="space-y-2 border-t pt-3">
                                <h4 className="text-xs font-bold uppercase text-slate-500">
                                    Documentos Adjuntados
                                </h4>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {(
                                        modalDetalle.archivos_requisitos ||
                                        modalDetalle.archivosRequisitos
                                    ).map((adj) => (
                                        <a
                                            key={adj.id}
                                            href={`/storage/${adj.archivo_ruta}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs hover:bg-blue-50 transition"
                                        >
                                            <span className="truncate font-semibold text-slate-700">
                                                📄 {adj.nombre_original || 'Documento'}
                                            </span>
                                            <span className="text-[10px] font-bold text-[#315d7a]">
                                                Descargar ➔
                                            </span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end border-t pt-3">
                            <button
                                onClick={() => setModalDetalle(null)}
                                className="rounded-xl bg-slate-800 px-6 py-2 text-xs font-bold text-white cursor-pointer"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}