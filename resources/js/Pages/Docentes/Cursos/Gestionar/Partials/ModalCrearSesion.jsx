import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import Swal from 'sweetalert2';

export default function ModalCrearSesion({ isOpen, onClose, sesion = null }) {
    const isEditing = Boolean(sesion);

    const { data, setData, post, processing, errors, reset } = useForm({
        nombre: '',
        fecha: '',
        fecha_fin: '',
        archivo: null,
    });

    // Cargar datos en caso de edición
    useEffect(() => {
        if (sesion) {
            setData({
                nombre: sesion.nombre || '',
                fecha: sesion.fecha || '',
                fecha_fin: sesion.fecha_fin || '',
                archivo: null,
            });
        } else {
            reset();
        }
    }, [sesion]);

    const handleSubmit = (e) => {
        e.preventDefault();

        const url = isEditing
            ? route('cursos.sesiones.update', sesion.id_sesion)
            : route('cursos.sesiones.store');

        // Petición AJAX mediante Inertia
        post(url, {
            forceFormData: true, // Necesario para enviar archivos/multipart
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
                Swal.fire({
                    icon: 'success',
                    title: isEditing ? '¡Sesión Actualizada!' : '¡Sesión Creada!',
                    text: isEditing
                        ? 'Los cambios se guardaron correctamente.'
                        : 'La nueva sesión ha sido registrada.',
                    timer: 2000,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-2xl' },
                });
            },
            onError: () => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error de Validación',
                    text: 'Por favor, revisa los campos señalados en el formulario.',
                    confirmButtonColor: '#315d7a',
                    customClass: { popup: 'rounded-2xl' },
                });
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-base font-bold text-slate-900">
                        {isEditing ? 'Editar Sesión de Clase' : 'Nueva Sesión de Clase'}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Título / Nombre de la Sesión */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Título / Tema de la Sesión *
                        </label>
                        <input
                            type="text"
                            placeholder="Ej. Semana 1: Introducción a la Epidemiología"
                            value={data.nombre}
                            onChange={(e) => setData('nombre', e.target.value)}
                            className="w-full text-xs rounded-xl border-slate-200 focus:border-[#315d7a] focus:ring-[#315d7a]"
                        />
                        {errors.nombre && (
                            <span className="text-[11px] text-red-500 mt-1 block">{errors.nombre}</span>
                        )}
                    </div>

                    {/* Rango de Fechas */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Fecha Inicio *
                            </label>
                            <input
                                type="date"
                                value={data.fecha}
                                onChange={(e) => setData('fecha', e.target.value)}
                                className="w-full text-xs rounded-xl border-slate-200 focus:border-[#315d7a] focus:ring-[#315d7a]"
                            />
                            {errors.fecha && (
                                <span className="text-[11px] text-red-500 mt-1 block">{errors.fecha}</span>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Fecha Fin (Opcional)
                            </label>
                            <input
                                type="date"
                                value={data.fecha_fin}
                                onChange={(e) => setData('fecha_fin', e.target.value)}
                                className="w-full text-xs rounded-xl border-slate-200 focus:border-[#315d7a] focus:ring-[#315d7a]"
                            />
                        </div>
                    </div>

                    {/* Adjuntar Archivo / Guía */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            {isEditing ? 'Reemplazar Archivo / Guía (Opcional)' : 'Archivo / Guía Adjunta (Opcional)'}
                        </label>
                        <input
                            type="file"
                            onChange={(e) => setData('archivo', e.target.files[0])}
                            className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                        />
                        {errors.archivo && (
                            <span className="text-[11px] text-red-500 mt-1 block">{errors.archivo}</span>
                        )}
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#315d7a] hover:bg-[#254860] transition shadow-2xs disabled:opacity-50 cursor-pointer"
                        >
                            {processing ? 'Guardando...' : isEditing ? 'Actualizar Sesión' : 'Guardar Sesión'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}