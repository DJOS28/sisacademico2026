import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function MaterialesTab({ materiales = [], sesiones = [] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [archivosSeleccionados, setArchivosSeleccionados] = useState([]);

    const { data, setData, post, processing, errors, reset } = useForm({
        tipo: 'archivo',
        nombre: '',
        sesion_id: '',
        archivos: [],
        url_video: '',
    });

    const handleOpenCreate = () => {
        reset();
        setArchivosSeleccionados([]);
        setEditingMaterial(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (material) => {
        setEditingMaterial(material);
        setData({
            tipo: material.tipo,
            nombre: material.nombre,
            sesion_id: material.sesion_id || '',
            archivos: [],
            url_video: material.tipo === 'video' ? material.ruta : '',
        });
        setArchivosSeleccionados([]);
        setIsModalOpen(true);
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setData('archivos', files);
        setArchivosSeleccionados(files.map(f => ({ name: f.name, size: (f.size / 1024 / 1024).toFixed(2) + ' MB' })));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const routeName = editingMaterial
            ? route('cursos.materiales.update', editingMaterial.id)
            : route('cursos.materiales.store');

        Swal.fire({
            title: editingMaterial ? 'Actualizando material...' : 'Subiendo y sincronizando con Moodle...',
            text: 'Por favor, espera unos segundos.',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

        post(routeName, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setIsModalOpen(false);
                setEditingMaterial(null);
                setArchivosSeleccionados([]);
                Swal.fire({
                    icon: 'success',
                    title: editingMaterial ? '¡Material Actualizado!' : '¡Material(es) Publicado(s)!',
                    text: 'Los archivos se guardaron y sincronizaron con el Aula Virtual.',
                    timer: 1800,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-2xl' },
                });
            },
            onError: () => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Revisa los campos requeridos.',
                    confirmButtonColor: '#315d7a',
                    customClass: { popup: 'rounded-2xl' },
                });
            },
        });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: '¿Eliminar este material?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
            customClass: { popup: 'rounded-2xl' },
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('cursos.materiales.destroy', id), {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire({
                            icon: 'success',
                            title: '¡Eliminado!',
                            timer: 1500,
                            showConfirmButton: false,
                            customClass: { popup: 'rounded-2xl' },
                        });
                    },
                });
            }
        });
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                    <h2 className="text-base font-bold text-slate-900">
                        Materiales y Recursos Didácticos ({materiales.length})
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Sube archivos PDF, diapositivas PPT o comparte enlaces de videos vinculados a cada semana/sesión.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="inline-flex items-center gap-1.5 bg-[#315d7a] hover:bg-[#254860] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                >
                    <span>+ Subir Material(es)</span>
                </button>
            </div>

            {/* Listado */}
            {materiales.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center bg-slate-50/50">
                    <p className="text-xs font-medium text-slate-500">
                        No hay materiales o videos compartidos en este curso aún.
                    </p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {materiales.map((m) => {
                        const esVideo = m.tipo === 'video';
                        const sesion = sesiones.find((s) => s.id_sesion === m.sesion_id);

                        return (
                            <div
                                key={m.id}
                                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex items-center justify-between gap-4"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                esVideo
                                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                    : 'bg-sky-50 text-sky-700 border-sky-200'
                                            }`}
                                        >
                                            {esVideo ? 'Video / Enlace' : 'Archivo / Documento'}
                                        </span>

                                        {sesion && (
                                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                                {sesion.nombre}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-sm font-bold text-slate-800">{m.nombre}</h3>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <a
                                        href={esVideo ? m.ruta : `/storage/${m.ruta}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-bold text-[#315d7a] hover:bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200 transition"
                                    >
                                        {esVideo ? 'Ver Enlace' : 'Descargar'}
                                    </a>

                                    <button
                                        type="button"
                                        onClick={() => handleOpenEdit(m)}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
                                    >
                                        Editar
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleDelete(m.id)}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition cursor-pointer"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal Crear / Editar */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900">
                                {editingMaterial ? 'Editar Material' : 'Publicar Material(es) en Sistema y Moodle'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Tipo */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Recurso *</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setData('tipo', 'archivo')}
                                        className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                                            data.tipo === 'archivo'
                                                ? 'bg-[#315d7a] text-white border-[#315d7a]'
                                                : 'bg-slate-50 text-slate-600 border-slate-200'
                                        }`}
                                    >
                                        📁 Documento(s) / Archivo(s)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData('tipo', 'video')}
                                        className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                                            data.tipo === 'video'
                                                ? 'bg-[#315d7a] text-white border-[#315d7a]'
                                                : 'bg-slate-50 text-slate-600 border-slate-200'
                                        }`}
                                    >
                                        🔗 Enlace de Video
                                    </button>
                                </div>
                            </div>

                            {/* Título */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    {data.tipo === 'archivo' && archivosSeleccionados.length > 1
                                        ? 'Título General (Opcional, se usará el nombre de cada archivo)'
                                        : 'Título del Material *'}
                                </label>
                                <input
                                    type="text"
                                    placeholder={data.tipo === 'archivo' ? 'Ej. Diapositivas Sesión 1' : 'Ej. Video Explicativo YouTube'}
                                    value={data.nombre}
                                    onChange={(e) => setData('nombre', e.target.value)}
                                    className="w-full text-xs rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-800 focus:border-[#315d7a] focus:bg-white focus:outline-none"
                                />
                                {errors.nombre && <span className="text-[11px] text-red-500 mt-1 block">{errors.nombre}</span>}
                            </div>

                            {/* Sesión */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Sesión / Semana de Clase</label>
                                <select
                                    value={data.sesion_id}
                                    onChange={(e) => setData('sesion_id', e.target.value)}
                                    className="w-full text-xs rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-800 focus:border-[#315d7a] focus:bg-white focus:outline-none"
                                >
                                    <option value="">-- Material General del Curso --</option>
                                    {sesiones.map((s) => (
                                        <option key={s.id_sesion} value={s.id_sesion}>
                                            {s.nombre} {s.moodle_section_id ? `(Moodle ID: ${s.moodle_section_id})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Archivo Múltiple o Video */}
                            {data.tipo === 'archivo' ? (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        {editingMaterial ? 'Reemplazar Archivo' : 'Seleccionar Archivo(s) (Permite selección múltiple) *'}
                                    </label>
                                    <input
                                        type="file"
                                        multiple={!editingMaterial}
                                        onChange={handleFileChange}
                                        className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                                    />
                                    {archivosSeleccionados.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            <p className="text-[11px] font-bold text-slate-600">Archivos listos para subir:</p>
                                            <ul className="text-[11px] text-slate-500 list-disc list-inside">
                                                {archivosSeleccionados.map((f, i) => (
                                                    <li key={i}>{f.name} ({f.size})</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {errors.archivos && <span className="text-[11px] text-red-500 mt-1 block">{errors.archivos}</span>}
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">URL del Video *</label>
                                    <input
                                        type="url"
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        value={data.url_video}
                                        onChange={(e) => setData('url_video', e.target.value)}
                                        className="w-full text-xs rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-800 focus:border-[#315d7a] focus:bg-white focus:outline-none"
                                        required
                                    />
                                    {errors.url_video && <span className="text-[11px] text-red-500 mt-1 block">{errors.url_video}</span>}
                                </div>
                            )}

                            {/* Botones */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={processing}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#315d7a] hover:bg-[#254860] transition shadow-2xs disabled:opacity-50 cursor-pointer"
                                >
                                    {processing ? 'Publicando...' : editingMaterial ? 'Guardar Cambios' : 'Publicar y Sincronizar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}