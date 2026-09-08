import { useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function ModalGenerarSesiones({ isOpen, onClose, periodoInicio }) {
    if (!isOpen) return null;

    const { data, setData, post, processing, errors } = useForm({
        fecha_inicio: periodoInicio || new Date().toISOString().split('T')[0],
        total_sesiones: 16,
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        Swal.fire({
            title: '¿Generar sesiones automáticas?',
            text: `Se programarán ${data.total_sesiones} sesiones consecutivas según los días de tu horario y se sincronizarán con Moodle.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#315d7a',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, generar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
            customClass: { popup: 'rounded-2xl' },
        }).then((result) => {
            if (result.isConfirmed) {
                // 1. Loader animado mientras el backend procesa Moodle y la Base de Datos
                Swal.fire({
                    title: 'Generando sesiones...',
                    text: 'Creando sesiones y sincronizando con el Aula Virtual (Moodle). Por favor, espera.',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    showConfirmButton: false,
                    didOpen: () => {
                        Swal.showLoading();
                    },
                    customClass: { popup: 'rounded-2xl' },
                });

                // 2. Envío de petición POST
                post(route('cursos.sesiones.generar-automatico'), {
                    preserveScroll: true,
                    onSuccess: () => {
                        onClose();
                        // 3. Alerta de éxito al culminar la petición
                        Swal.fire({
                            icon: 'success',
                            title: '¡Sesiones Generadas con Éxito!',
                            text: `Se crearon las ${data.total_sesiones} sesiones y quedaron vinculadas con el Aula Virtual.`,
                            timer: 2200,
                            showConfirmButton: false,
                            customClass: { popup: 'rounded-2xl' },
                        });
                    },
                    onError: (err) => {
                        // Alerta en caso de error
                        Swal.fire({
                            icon: 'error',
                            title: 'Error al generar',
                            text: Object.values(err)[0] || 'Ocurrió un problema al intentar generar las sesiones.',
                            customClass: { popup: 'rounded-2xl' },
                        });
                    },
                });
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>⚡ Generar Sesiones Automáticas</span>
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer disabled:opacity-50"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700">
                            Fecha de la Primera Clase <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={data.fecha_inicio}
                            onChange={(e) => setData('fecha_inicio', e.target.value)}
                            disabled={processing}
                            className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#315d7a] focus:bg-white focus:outline-none"
                            required
                        />
                        {errors.fecha_inicio && <p className="mt-1 text-[11px] text-rose-500">{errors.fecha_inicio}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700">
                            Número de Sesiones a Crear <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="64"
                            value={data.total_sesiones}
                            onChange={(e) => setData('total_sesiones', parseInt(e.target.value) || '')}
                            disabled={processing}
                            className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#315d7a] focus:bg-white focus:outline-none"
                            required
                        />
                        {errors.total_sesiones && <p className="mt-1 text-[11px] text-rose-500">{errors.total_sesiones}</p>}
                        <p className="mt-1 text-[11px] text-slate-400">
                            El sistema buscará los días de clase asignados en tu horario y creará correlativamente cada sesión en el sistema y en Moodle.
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl bg-[#315d7a] hover:bg-[#254860] px-4 py-2 text-xs font-bold text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                        >
                            {processing ? 'Generando...' : 'Iniciar Generación'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}