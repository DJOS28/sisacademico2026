import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';

export default function BolsaLaboralIndex({ ofertas, misPostulaciones = [], estudiante, filtros }) {
    const [tabActiva, setTabActiva] = useState('ofertas'); // 'ofertas' | 'mis_postulaciones'
    const [buscar, setBuscar] = useState(filtros.buscar ?? '');
    const [modalidad, setModalidad] = useState(filtros.modalidad ?? '');

    // Modales
    const [modalDetalle, setModalDetalle] = useState(null);
    const [modalPostular, setModalPostular] = useState(null);

    // Formulario de Postulación
    const { data, setData, post, processing, reset, errors } = useForm({
        id_oferta: '',
        mensaje_presentacion: '',
        cv_adjunto: null,
    });

    const handleFiltrar = (e) => {
        e.preventDefault();
        router.get(route('estudiante.bolsa-laboral'), { buscar, modalidad }, { preserveState: true, replace: true });
    };

    const limpiarFiltros = () => {
        setBuscar('');
        setModalidad('');
        router.get(route('estudiante.bolsa-laboral'));
    };

    const abrirModalPostular = (oferta) => {
        setData({
            id_oferta: oferta.id_oferta,
            mensaje_presentacion: '',
            cv_adjunto: null,
        });
        setModalPostular(oferta);
    };

    const submitPostular = (e) => {
        e.preventDefault();
        post(route('estudiante.bolsa-laboral.postular'), {
            forceFormData: true,
            onSuccess: () => {
                setModalPostular(null);
                reset();
                Swal.fire('¡Postulación Enviada!', 'La empresa revisará tu perfil en breve.', 'success');
            },
        });
    };

    // Verificar si el estudiante ya postuló a una oferta en específico
    const obtenerPostulacionPrevia = (idOferta) => {
        return misPostulaciones.find((p) => String(p.id_oferta) === String(idOferta));
    };

    const getBadgeEstadoPostulacion = (estado) => {
        switch (estado) {
            case 'Postulado':
                return <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">⏳ Postulado</span>;
            case 'En_Revision':
                return <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">🔍 En Revisión</span>;
            case 'Preseleccionado':
                return <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 border border-purple-200">⭐ Preseleccionado</span>;
            case 'Aceptado':
                return <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">🎉 Aceptado</span>;
            case 'Rechazado':
                return <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200">❌ No Seleccionado</span>;
            default:
                return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{estado}</span>;
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">💼 Bolsa de Trabajo y Empleabilidad</h1>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Encuentra convocatorias laborales exclusivas, prácticas y empleos afines a tu programa de estudios.
                        </p>
                    </div>

                    {/* BOTONES TABS */}
                    <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
                        <button
                            onClick={() => setTabActiva('ofertas')}
                            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                                tabActiva === 'ofertas' ? 'bg-[#315d7a] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Convocatorias ({ofertas.total})
                        </button>
                        <button
                            onClick={() => setTabActiva('mis_postulaciones')}
                            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                                tabActiva === 'mis_postulaciones' ? 'bg-[#315d7a] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Mis Postulaciones ({misPostulaciones.length})
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Bolsa Laboral" />

            <div className="space-y-6">
                {tabActiva === 'ofertas' ? (
                    <>
                        {/* FILTROS Y BUSCADOR */}
                        <form onSubmit={handleFiltrar} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative min-w-[260px] flex-1">
                                    <input
                                        type="text"
                                        value={buscar}
                                        onChange={(e) => setBuscar(e.target.value)}
                                        placeholder="Buscar por puesto, empresa o ciudad..."
                                        className="w-full rounded-lg border border-slate-300 pl-9 pr-4 py-2 text-xs font-medium outline-none focus:border-[#315d7a]"
                                    />
                                    <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
                                </div>

                                <select
                                    value={modalidad}
                                    onChange={(e) => setModalidad(e.target.value)}
                                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium outline-none focus:border-[#315d7a]"
                                >
                                    <option value="">Todas las modalidades</option>
                                    <option value="Presencial">Presencial</option>
                                    <option value="Remoto">Remoto</option>
                                    <option value="Hibrido">Híbrido</option>
                                </select>

                                <button
                                    type="submit"
                                    className="rounded-lg bg-[#315d7a] px-4 py-2 text-xs font-bold text-white hover:bg-[#274c64] transition cursor-pointer"
                                >
                                    Filtrar
                                </button>

                                {(buscar || modalidad) && (
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

                        {/* LISTADO DE OFERTAS LABORALES */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            {ofertas.data.map((item) => {
                                const postulacionPrevia = obtenerPostulacionPrevia(item.id_oferta);

                                return (
                                    <div
                                        key={item.id_oferta}
                                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-[#315d7a]/50 transition flex flex-col justify-between space-y-4"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    {item.logo_empresa ? (
                                                        <img
                                                            src={item.logo_empresa.startsWith('/') ? item.logo_empresa : `/storage/${item.logo_empresa}`}
                                                            alt={item.nombre_empresa}
                                                            className="h-12 w-12 rounded-xl object-contain border border-slate-100 p-1"
                                                        />
                                                    ) : (
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 font-black text-slate-400 text-lg">
                                                            🏢
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 text-sm leading-snug">{item.titulo}</h3>
                                                        <p className="text-xs font-semibold text-[#315d7a]">{item.nombre_empresa || 'Empresa Confidencial'}</p>
                                                    </div>
                                                </div>

                                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600 border border-slate-200">
                                                    {item.modalidad}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                                                {item.lugar && <span>📍 {item.lugar}</span>}
                                                {item.remuneracion && <span className="font-bold text-emerald-700">💵 S/ {item.remuneracion}</span>}
                                                {item.nombre_tipo_contrato && <span>📄 {item.nombre_tipo_contrato}</span>}
                                            </div>

                                            <p className="line-clamp-2 text-xs text-slate-600 leading-relaxed">
                                                {item.descripcion}
                                            </p>
                                        </div>

                                        <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                                            <span className="text-[11px] font-medium text-slate-400">
                                                Límite: {item.fecha_limite ? new Date(item.fecha_limite).toLocaleDateString('es-PE') : 'Sin fecha'}
                                            </span>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setModalDetalle(item)}
                                                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                                                >
                                                    👁️ Ver Detalle
                                                </button>

                                                {postulacionPrevia ? (
                                                    <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                                                        ✓ Ya Postulaste
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => abrirModalPostular(item)}
                                                        className="rounded-lg bg-[#315d7a] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#274c64] shadow-xs transition cursor-pointer"
                                                    >
                                                        🚀 Postular
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {ofertas.data.length === 0 && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs font-bold text-slate-400">
                                No se encontraron convocatorias laborales activas en este momento.
                            </div>
                        )}

                        {/* PAGINACIÓN */}
                        {ofertas.links?.length > 1 && (
                            <div className="flex flex-wrap items-center justify-center gap-1">
                                {ofertas.links.map((link, index) => (
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
                    </>
                ) : (
                    /* MIS POSTULACIONES */
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    {['Oferta Laboral', 'Empresa', 'Fecha Postulación', 'Estado', 'CV Enviado'].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {misPostulaciones.map((p) => (
                                    <tr key={p.id_postulacion} className="hover:bg-slate-50/80 transition">
                                        <td className="px-4 py-3 text-xs font-bold text-slate-900">
                                            {p.oferta_titulo}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-semibold text-[#315d7a]">
                                            🏢 {p.nombre_empresa || 'Confidencial'}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500">
                                            {p.fecha_postulacion ? new Date(p.fecha_postulacion).toLocaleString('es-PE') : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            {getBadgeEstadoPostulacion(p.estado_postulacion)}
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            {p.cv_adjunto ? (
                                                <a
                                                    href={p.cv_adjunto.startsWith('/') ? p.cv_adjunto : `/storage/${p.cv_adjunto}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="font-bold text-[#315d7a] hover:underline"
                                                >
                                                    📄 Ver CV
                                                </a>
                                            ) : (
                                                <span className="text-slate-400 italic">Sin CV</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {misPostulaciones.length === 0 && (
                            <div className="p-12 text-center text-xs font-bold text-slate-400">
                                Aún no te has postulado a ninguna oferta laboral.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* MODAL DETALLE DE LA OFERTA */}
            {modalDetalle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
                    <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
                        <div className="border-b pb-3 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-bold uppercase text-slate-400">{modalDetalle.nombre_empresa || 'Empresa'}</span>
                                <h3 className="text-base font-black text-[#315d7a]">{modalDetalle.titulo}</h3>
                            </div>
                            <button onClick={() => setModalDetalle(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <div><strong>Modalidad:</strong> {modalDetalle.modalidad}</div>
                            <div><strong>Lugar:</strong> {modalDetalle.lugar || 'No especificado'}</div>
                            <div><strong>Sueldo:</strong> {modalDetalle.remuneracion ? `S/ ${modalDetalle.remuneracion}` : 'A tratar'}</div>
                            <div><strong>Vacantes:</strong> {modalDetalle.vacantes ?? 1}</div>
                            <div><strong>Contrato:</strong> {modalDetalle.nombre_tipo_contrato || 'General'}</div>
                            <div><strong>Publicado:</strong> {modalDetalle.fecha_publicacion}</div>
                        </div>

                        <div className="space-y-2 text-xs text-slate-700">
                            <h4 className="font-bold text-slate-900 uppercase">Descripción del Puesto:</h4>
                            <p className="whitespace-pre-line leading-relaxed">{modalDetalle.descripcion}</p>
                        </div>

                        {modalDetalle.experiencia && (
                            <div className="space-y-1 text-xs text-slate-700 border-t pt-2">
                                <h4 className="font-bold text-slate-900 uppercase">Experiencia Requerida:</h4>
                                <p>{modalDetalle.experiencia}</p>
                            </div>
                        )}

                        {modalDetalle.pasos_postular && (
                            <div className="space-y-1 text-xs text-slate-700 border-t pt-2">
                                <h4 className="font-bold text-slate-900 uppercase">Instrucciones Adicionales:</h4>
                                <p>{modalDetalle.pasos_postular}</p>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 border-t pt-3">
                            <button onClick={() => setModalDetalle(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer">Cerrar</button>
                            {!obtenerPostulacionPrevia(modalDetalle.id_oferta) && (
                                <button
                                    onClick={() => {
                                        const oferta = modalDetalle;
                                        setModalDetalle(null);
                                        abrirModalPostular(oferta);
                                    }}
                                    className="rounded-xl bg-[#315d7a] px-6 py-2 text-xs font-bold text-white hover:bg-[#274c64] cursor-pointer"
                                >
                                    🚀 Postular Ahora
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PARA POSTULAR */}
            {modalPostular && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
                        <div className="border-b pb-2 flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900">
                                🚀 Postular a: <span className="text-[#315d7a]">{modalPostular.titulo}</span>
                            </h3>
                            <button onClick={() => setModalPostular(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
                        </div>

                        <form onSubmit={submitPostular} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Carta / Mensaje de Presentación</label>
                                <textarea
                                    rows={3}
                                    value={data.mensaje_presentacion}
                                    onChange={(e) => setData('mensaje_presentacion', e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-[#315d7a]"
                                    placeholder="Escribe brevemente por qué te interesa la vacante..."
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Currículum Vitae (PDF)</label>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => setData('cv_adjunto', e.target.files[0] ?? null)}
                                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-600"
                                />
                                {estudiante?.curriculum_archivo && !data.cv_adjunto && (
                                    <p className="mt-1 text-[11px] font-semibold text-emerald-600">
                                        ✓ Si no seleccionas uno nuevo, se enviará el CV registrado en tu perfil.
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t pt-3">
                                <button type="button" onClick={() => setModalPostular(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer">Cancelar</button>
                                <button type="submit" disabled={processing} className="rounded-xl bg-[#315d7a] px-6 py-2 text-xs font-bold text-white hover:bg-[#274c64] disabled:opacity-50 cursor-pointer">
                                    {processing ? 'Enviando...' : 'Confirmar Postulación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}