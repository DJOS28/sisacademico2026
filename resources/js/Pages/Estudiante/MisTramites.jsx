import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function MisTramites({ tramitesDisponibles = [], solicitudes }) {
    const [modalNuevo, setModalDetalleNuevo] = useState(false);
    const [modalDetalle, setModalDetalle] = useState(null);
    const [tramiteSeleccionado, setTramiteSeleccionado] = useState(null);

    // Estado para el buscador tipo Select2
    const [busquedaTramite, setBusquedaTramite] = useState('');
    const [dropdownAbierto, setDropdownAbierto] = useState(false);
    const dropdownRef = useRef(null);

    // Formulario de Nueva Solicitud
    const { data, setData, post, processing, reset, errors } = useForm({
        tramite_id: '',
        archivos: {},
    });

    // Cerrar el dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownAbierto(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filtrar la lista de más de 100 trámites en tiempo real
    const tramitesFiltrados = tramitesDisponibles.filter((item) =>
        item.nombre.toLowerCase().includes(busquedaTramite.toLowerCase()) ||
        (item.descripcion && item.descripcion.toLowerCase().includes(busquedaTramite.toLowerCase()))
    );

    const seleccionarTramiteItem = (tramite) => {
        setData('tramite_id', tramite.id);
        setTramiteSeleccionado(tramite);
        setBusquedaTramite(tramite.nombre);
        setDropdownAbierto(false);
    };

    const limpiarSeleccionTramite = () => {
        setData('tramite_id', '');
        setTramiteSeleccionado(null);
        setBusquedaTramite('');
        setDropdownAbierto(true);
    };

    const handleFileChange = (requisitoId, file) => {
        setData('archivos', {
            ...data.archivos,
            [requisitoId]: file,
        });
    };

    const submitGuardar = (e) => {
        e.preventDefault();
        post(route('estudiante.tramites.store'), {
            forceFormData: true,
            onSuccess: () => {
                setModalDetalleNuevo(false);
                reset();
                setTramiteSeleccionado(null);
                setBusquedaTramite('');
                Swal.fire('Solicitado', 'Tu trámite ha sido registrado con éxito.', 'success');
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
                return <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 border border-purple-200">↗️ En Evaluación</span>;
            case 'completado':
                return <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">✅ Atendido / Aprobado</span>;
            case 'rechazado':
                return <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200">❌ Observado / Rechazado</span>;
            default:
                return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{est}</span>;
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">📄 Mis Trámites Académicos</h1>
                        <p className="mt-1 text-xs text-slate-500">
                            Solicita certificados, constancias y realiza el seguimiento de tus trámites en tiempo real.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setModalDetalleNuevo(true);
                            limpiarSeleccionTramite();
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#315d7a] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#274c64] transition shadow-xs cursor-pointer"
                    >
                        <span>➕ Solicitar Nuevo Trámite</span>
                    </button>
                </div>
            }
        >
            <Head title="Mis Trámites Académicos" />

            <div className="space-y-6">
                {/* TABLA DE SOLICITUDES DEL ESTUDIANTE */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                {['Código / Fecha', 'Trámite Solicitado', 'Ubicación / Área', 'Estado', 'Acciones'].map((h) => (
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
                                        <span className="font-semibold text-slate-700">🏢 {item.area?.nombre || 'Mesa de Partes'}</span>
                                    </td>

                                    <td className="px-4 py-3 text-xs">{getBadgeEstado(item.estado)}</td>

                                    <td className="px-4 py-3 text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setModalDetalle(item)}
                                            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                        >
                                            👁️ Ver Seguimiento
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {solicitudes.data.length === 0 && (
                        <div className="p-12 text-center text-xs font-bold text-slate-400">
                            Aún no has registrado solicitudes de trámites académicos.
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

            {/* MODAL 1: SOLICITAR NUEVO TRÁMITE CON SELECT2 / BUSCADOR INTEGRAD0 */}
            {modalNuevo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="border-b pb-2 flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900">
                                ➕ Solicitar Trámite Académico
                            </h3>
                            <button onClick={() => setModalDetalleNuevo(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
                        </div>

                        <form onSubmit={submitGuardar} className="space-y-4">
                            
                            {/* CAMPO SELECT2 BUSCADOR */}
                            <div className="relative" ref={dropdownRef}>
                                <label className="mb-1 block text-xs font-bold uppercase text-slate-600">
                                    Selecciona el Trámite *
                                </label>
                                
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={busquedaTramite}
                                        onFocus={() => setDropdownAbierto(true)}
                                        onChange={(e) => {
                                            setBusquedaTramite(e.target.value);
                                            setDropdownAbierto(true);
                                            if (tramiteSeleccionado) {
                                                setData('tramite_id', '');
                                                setTramiteSeleccionado(null);
                                            }
                                        }}
                                        placeholder="🔍 Escribe para buscar entre todos los trámites..."
                                        className="w-full rounded-xl border border-slate-300 p-2.5 pr-8 text-xs font-medium outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1] transition"
                                        required={!data.tramite_id}
                                    />

                                    {tramiteSeleccionado && (
                                        <button
                                            type="button"
                                            onClick={limpiarSeleccionTramite}
                                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                                            title="Limpiar selección"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                {/* DESPLEGABLE CON SCROLL PARA MÁS DE 100 TRÁMITES */}
                                {dropdownAbierto && (
                                    <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl divide-y divide-slate-100">
                                        {tramitesFiltrados.length > 0 ? (
                                            tramitesFiltrados.map((t) => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => seleccionarTramiteItem(t)}
                                                    className={`w-full text-left px-3.5 py-2.5 text-xs hover:bg-[#dfeaf1]/50 transition flex items-center justify-between cursor-pointer ${
                                                        String(data.tramite_id) === String(t.id)
                                                            ? 'bg-[#315d7a]/10 font-bold text-[#315d7a]'
                                                            : 'text-slate-700'
                                                    }`}
                                                >
                                                    <span className="font-semibold">{t.nombre}</span>
                                                    <span className="text-[11px] font-bold text-slate-400">
                                                        {t.costo ? `S/ ${t.costo}` : 'Gratuito'}
                                                    </span>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-3 text-center text-xs text-slate-400 italic">
                                                No se encontraron trámites con "{busquedaTramite}"
                                            </div>
                                        )}
                                    </div>
                                )}

                                {errors.tramite_id && <p className="mt-1 text-xs font-bold text-rose-600">{errors.tramite_id}</p>}
                            </div>

                            {/* DETALLES Y REQUISITOS DEL TRÁMITE SELECCIONADO */}
                            {tramiteSeleccionado && (
                                <div className="space-y-3 rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs">
                                    {tramiteSeleccionado.descripcion && (
                                        <p className="text-slate-600"><strong>Descripción:</strong> {tramiteSeleccionado.descripcion}</p>
                                    )}

                                    {tramiteSeleccionado.requisitos?.length > 0 ? (
                                        <div className="space-y-2 border-t pt-2">
                                            <h4 className="font-bold text-slate-700 uppercase text-[11px]">Requisitos Requeridos:</h4>
                                            {tramiteSeleccionado.requisitos.map((req) => (
                                                <div key={req.id} className="space-y-1">
                                                    <label className="block text-[11px] font-semibold text-slate-600">
                                                        📄 {req.descripcion} {req.es_obligatorio ? '*' : '(Opcional)'}
                                                    </label>
                                                    <input
                                                        type="file"
                                                        required={Boolean(req.es_obligatorio)}
                                                        onChange={(e) => handleFileChange(req.id, e.target.files[0] ?? null)}
                                                        className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs text-slate-600"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 italic text-[11px]">Este trámite no exige adjuntar requisitos obligatorios.</p>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 border-t pt-3">
                                <button type="button" onClick={() => setModalDetalleNuevo(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer">Cancelar</button>
                                <button type="submit" disabled={processing || !data.tramite_id} className="rounded-xl bg-[#315d7a] px-6 py-2 text-xs font-bold text-white hover:bg-[#274c64] disabled:opacity-50 cursor-pointer">
                                    {processing ? 'Enviando...' : 'Enviar Solicitud'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: SEGUIMIENTO Y DETALLE COMPLETO */}
            {modalDetalle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
                        <div className="border-b pb-2 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-bold uppercase text-slate-400">Seguimiento de Trámite</span>
                                <h3 className="text-base font-black text-[#315d7a]">{modalDetalle.codigo_seguimiento}</h3>
                            </div>
                            <button onClick={() => setModalDetalle(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <div><strong>Trámite:</strong> {modalDetalle.tramite?.nombre}</div>
                            <div><strong>Ubicación Actual:</strong> 🏢 {modalDetalle.area?.nombre || 'Mesa de Partes'}</div>
                            <div><strong>Estado:</strong> {getBadgeEstado(modalDetalle.estado)}</div>
                            <div><strong>Fecha de Solicitud:</strong> {modalDetalle.fecha_solicitud ? new Date(modalDetalle.fecha_solicitud).toLocaleString('es-PE') : '-'}</div>
                        </div>

                        {modalDetalle.motivo_rechazo && (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 space-y-1">
                                <span className="font-bold">❌ Observación / Sustento:</span>
                                <p className="italic">"{modalDetalle.motivo_rechazo}"</p>
                            </div>
                        )}

                        {/* DOCUMENTOS ADJUNTADOS POR EL ESTUDIANTE */}
                        {(modalDetalle.archivos_requisitos?.length > 0 || modalDetalle.archivosRequisitos?.length > 0) && (
                            <div className="space-y-2 border-t pt-3">
                                <h4 className="text-xs font-bold uppercase text-slate-600">📁 Mis Documentos Adjuntados</h4>
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

                        {/* HISTORIAL DE RECORRIDO DE ÁREAS */}
                        {(modalDetalle.historial_derivaciones?.length > 0 || modalDetalle.historialDerivaciones?.length > 0) && (
                            <div className="space-y-2 border-t pt-3">
                                <h4 className="text-xs font-bold uppercase text-slate-600">📜 Recorrido Interno</h4>
                                <div className="space-y-2">
                                    {(modalDetalle.historial_derivaciones || modalDetalle.historialDerivaciones).map((h, idx) => (
                                        <div key={h.id || idx} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs space-y-1">
                                            <div className="flex items-center justify-between font-bold text-slate-800">
                                                <span>🏢 {h.area_origen?.nombre || h.areaOrigen?.nombre || 'Mesa de Partes'} ➔ 🏢 {h.area_destino?.nombre || h.areaDestino?.nombre || 'Área Destino'}</span>
                                                <span className="text-[10px] text-slate-400 font-normal">{h.fecha_derivacion ? new Date(h.fecha_derivacion).toLocaleString('es-PE') : '-'}</span>
                                            </div>
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