import React from 'react';
import { useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function ModalFormTipoContrato({ tipoContrato, onClose }) {
    const isEditing = !!tipoContrato;

    const { data, setData, post, put, processing, errors } = useForm({
        nombre_tipo_contrato: tipoContrato?.nombre_tipo_contrato || '',
        estado: tipoContrato?.estado || 'Activo',
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        // Configuración de opciones con callbacks de Inertia
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: isEditing ? '¡Actualizado!' : '¡Registrado!',
                    text: isEditing 
                        ? 'La modalidad de contrato se actualizó correctamente.' 
                        : 'El tipo de contrato fue registrado con éxito.',
                    icon: 'success',
                    confirmButtonColor: '#315d7a',
                    timer: 2000,
                    showConfirmButton: false,
                });
                onClose();
            },
            onError: () => {
                Swal.fire({
                    title: 'Atención',
                    text: 'Por favor, revise los campos marcados en rojo.',
                    icon: 'warning',
                    confirmButtonColor: '#315d7a',
                });
            },
        };

        // Ejecución limpia
        if (isEditing) {
            put(`/tipos-contrato/${tipoContrato.id_tipo_contrato}`, options);
        } else {
            post('/tipos-contrato', options);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">
                        {isEditing ? 'Editar Tipo de Contrato' : 'Registrar Tipo de Contrato'}
                    </h3>
                    <button 
                        onClick={onClose} 
                        disabled={processing}
                        className="text-slate-400 hover:text-slate-600 font-bold disabled:opacity-50"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* NOMBRE / MODALIDAD */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                            Nombre de la Modalidad *
                        </label>
                        <input
                            type="text"
                            value={data.nombre_tipo_contrato}
                            onChange={(e) => setData('nombre_tipo_contrato', e.target.value)}
                            placeholder="Ej. Tiempo Completo, Prácticas Preprofesionales"
                            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                                errors.nombre_tipo_contrato 
                                    ? 'border-rose-400 focus:ring-rose-200' 
                                    : 'border-slate-300 focus:ring-[#315d7a]/20 focus:border-[#315d7a]'
                            }`}
                        />
                        {errors.nombre_tipo_contrato && (
                            <span className="text-xs text-rose-500 font-medium mt-1 block">
                                {errors.nombre_tipo_contrato}
                            </span>
                        )}
                    </div>

                    {/* ESTADO */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Estado</label>
                        <select
                            value={data.estado}
                            onChange={(e) => setData('estado', e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#315d7a]"
                        >
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                        </select>
                    </div>

                    {/* BOTONES DE ACCIÓN */}
                    <div className="border-t border-slate-200 pt-4 flex justify-end gap-2">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            disabled={processing}
                            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 bg-[#315d7a] text-white rounded-lg text-xs font-bold hover:bg-[#274b63] transition shadow disabled:opacity-50 flex items-center gap-2"
                        >
                            {processing ? (
                                <>
                                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                <span>{isEditing ? 'Guardar Cambios' : 'Registrar'}</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}