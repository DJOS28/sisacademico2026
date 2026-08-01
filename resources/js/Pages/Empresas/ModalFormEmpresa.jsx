import React from 'react';
import { useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function ModalFormEmpresa({ empresa, onClose }) {
    const isEditing = !!empresa;

    const { data, setData, post, processing, errors } = useForm({
        _method: isEditing ? 'PUT' : 'POST',
        nombre_empresa: empresa?.nombre_empresa || '',
        ruc: empresa?.ruc || '',
        direccion_empresa: empresa?.direccion_empresa || '',
        telefono_empresa: empresa?.telefono_empresa || '',
        email_contacto: empresa?.email_contacto || '',
        nombre_contacto: empresa?.nombre_contacto || '',
        estado: empresa?.estado || 'Activo',
        logo: null,
        crear_usuario: false,
        username: '',
        password: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const url = isEditing ? `/empresas/${empresa.id_empresa}` : '/empresas';

        post(url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: isEditing ? '¡Actualizado!' : '¡Registrado!',
                    text: isEditing 
                        ? 'Los datos de la empresa se actualizaron correctamente.' 
                        : 'La empresa fue registrada con éxito.',
                    icon: 'success',
                    confirmButtonColor: '#315d7a',
                    timer: 2000,
                    showConfirmButton: false,
                });
                onClose();
            },
            onError: (err) => {
                Swal.fire({
                    title: 'Atención',
                    text: 'Por favor, revise los campos marcados en rojo.',
                    icon: 'warning',
                    confirmButtonColor: '#315d7a',
                });
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">
                        {isEditing ? 'Editar Empresa' : 'Registrar Empresa'}
                    </h3>
                    <button 
                        onClick={onClose} 
                        disabled={processing}
                        className="text-slate-400 hover:text-slate-600 font-bold disabled:opacity-50"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    {/* RAZÓN SOCIAL */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                            Nombre / Razón Social *
                        </label>
                        <input
                            type="text"
                            value={data.nombre_empresa}
                            onChange={(e) => setData('nombre_empresa', e.target.value)}
                            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                                errors.nombre_empresa 
                                    ? 'border-rose-400 focus:ring-rose-200' 
                                    : 'border-slate-300 focus:ring-[#315d7a]/20 focus:border-[#315d7a]'
                            }`}
                        />
                        {errors.nombre_empresa && (
                            <span className="text-xs text-rose-500 font-medium mt-1 block">{errors.nombre_empresa}</span>
                        )}
                    </div>

                    {/* RUC Y TELÉFONO */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">RUC</label>
                            <input
                                type="text"
                                maxLength="11"
                                value={data.ruc}
                                onChange={(e) => setData('ruc', e.target.value)}
                                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                                    errors.ruc 
                                        ? 'border-rose-400 focus:ring-rose-200' 
                                        : 'border-slate-300 focus:ring-[#315d7a]/20 focus:border-[#315d7a]'
                                }`}
                            />
                            {errors.ruc && <span className="text-xs text-rose-500 font-medium mt-1 block">{errors.ruc}</span>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Teléfono</label>
                            <input
                                type="text"
                                value={data.telefono_empresa}
                                onChange={(e) => setData('telefono_empresa', e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                            />
                            {errors.telefono_empresa && <span className="text-xs text-rose-500 font-medium mt-1 block">{errors.telefono_empresa}</span>}
                        </div>
                    </div>

                    {/* CONTACTO Y EMAIL */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Contacto</label>
                            <input
                                type="text"
                                value={data.nombre_contacto}
                                onChange={(e) => setData('nombre_contacto', e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                            />
                            {errors.nombre_contacto && <span className="text-xs text-rose-500 font-medium mt-1 block">{errors.nombre_contacto}</span>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email Contacto</label>
                            <input
                                type="email"
                                value={data.email_contacto}
                                onChange={(e) => setData('email_contacto', e.target.value)}
                                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                                    errors.email_contacto 
                                        ? 'border-rose-400 focus:ring-rose-200' 
                                        : 'border-slate-300 focus:ring-[#315d7a]/20 focus:border-[#315d7a]'
                                }`}
                            />
                            {errors.email_contacto && <span className="text-xs text-rose-500 font-medium mt-1 block">{errors.email_contacto}</span>}
                        </div>
                    </div>

                    {/* DIRECCIÓN */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Dirección</label>
                        <input
                            type="text"
                            value={data.direccion_empresa}
                            onChange={(e) => setData('direccion_empresa', e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                        />
                        {errors.direccion_empresa && <span className="text-xs text-rose-500 font-medium mt-1 block">{errors.direccion_empresa}</span>}
                    </div>

                    {/* LOGO */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Logo Empresa</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setData('logo', e.target.files[0])}
                            className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 file:font-semibold hover:file:bg-slate-200 cursor-pointer"
                        />
                        {errors.logo && <span className="text-xs text-rose-500 font-medium mt-1 block">{errors.logo}</span>}
                    </div>

                    {/* OPCIÓN CREAR USUARIO (Solo en creación) */}
                    {!isEditing && (
                        <div className="border-t border-slate-200 pt-3">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.crear_usuario}
                                    onChange={(e) => setData('crear_usuario', e.target.checked)}
                                    className="rounded border-slate-300 text-[#315d7a] focus:ring-[#315d7a]"
                                />
                                Crear usuario de acceso para la empresa
                            </label>

                            {data.crear_usuario && (
                                <div className="grid grid-cols-2 gap-3 mt-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Username *</label>
                                        <input
                                            type="text"
                                            value={data.username}
                                            onChange={(e) => setData('username', e.target.value)}
                                            className={`w-full border rounded px-2.5 py-1.5 text-xs outline-none ${
                                                errors.username ? 'border-rose-400' : 'border-slate-300 focus:border-[#315d7a]'
                                            }`}
                                        />
                                        {errors.username && <span className="text-[10px] text-rose-500 mt-0.5 block">{errors.username}</span>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Password *</label>
                                        <input
                                            type="password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className={`w-full border rounded px-2.5 py-1.5 text-xs outline-none ${
                                                errors.password ? 'border-rose-400' : 'border-slate-300 focus:border-[#315d7a]'
                                            }`}
                                        />
                                        {errors.password && <span className="text-[10px] text-rose-500 mt-0.5 block">{errors.password}</span>}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ESTADO (Solo en edición) */}
                    {isEditing && (
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
                    )}

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