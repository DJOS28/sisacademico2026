import { useState } from 'react';
import { router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import ModalCrearSesion from './ModalCrearSesion';

export default function SesionesTab({ sesiones = [] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sesionAEditar, setSesionAEditar] = useState(null);

    // Abrir modal para crear
    const handleCreate = () => {
        setSesionAEditar(null);
        setIsModalOpen(true);
    };

    // Abrir modal para editar
    const handleEdit = (sesion) => {
        setSesionAEditar(sesion);
        setIsModalOpen(true);
    };

    // Alternar estado (Activar / Desactivar) por AJAX con Swal
    const handleToggleStatus = (sesion) => {
        const nuevoEstado = !sesion.activo;

        router.patch(route('cursos.sesiones.toggle', sesion.id_sesion), {}, {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    icon: 'info',
                    title: nuevoEstado ? 'Sesión Activada' : 'Sesión Desactivada',
                    text: `La sesión ahora está ${nuevoEstado ? 'visible' : 'inactiva'}.`,
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-2xl' },
                });
            },
        });
    };

    // Eliminar por AJAX con Confirmación de SweetAlert2
    const handleDelete = (id) => {
        Swal.fire({
            title: '¿Eliminar sesión?',
            text: 'Esta acción no se puede deshacer y borrará los archivos adjuntos.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            customClass: { popup: 'rounded-2xl' },
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('cursos.sesiones.destroy', id), {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire({
                            icon: 'success',
                            title: '¡Eliminada!',
                            text: 'La sesión fue eliminada correctamente.',
                            timer: 1800,
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
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        Programación de Sesiones
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Organiza los contenidos, guías y actividades semana a semana para esta sección.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleCreate}
                    className="inline-flex items-center gap-1.5 bg-[#315d7a] hover:bg-[#254860] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                >
                    <span>+ Nueva Sesión</span>
                </button>
            </div>

            {/* Listado de Sesiones */}
            {sesiones.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center bg-slate-50/50">
                    <p className="text-xs font-medium text-slate-500">
                        Aún no has registrado sesiones de clase para esta sección.
                    </p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {sesiones.map((s, index) => (
                        <div
                            key={s.id_sesion}
                            className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                s.activo 
                                    ? 'border-slate-200 bg-white hover:border-slate-300' 
                                    : 'border-slate-200 bg-slate-50/80 opacity-75'
                            }`}
                        >
                            {/* Detalles de la sesión */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                                        Sesión #{index + 1}
                                    </span>
                                    <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                            s.activo
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}
                                    >
                                        {s.activo ? 'Activa' : 'Inactiva'}
                                    </span>
                                </div>

                                <h3 className="text-sm font-bold text-slate-800">{s.nombre}</h3>
                                
                                {s.fecha && (
                                    <p className="text-xs text-slate-500">
                                        Fecha: {s.fecha} {s.fecha_fin ? `al ${s.fecha_fin}` : ''}
                                    </p>
                                )}
                            </div>

                            {/* Botones de acción */}
                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                {s.archivo && (
                                    <a
                                        href={`/storage/${s.archivo}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-bold text-[#315d7a] hover:bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200 transition"
                                    >
                                        Ver Adjunto
                                    </a>
                                )}

                                <button
                                    type="button"
                                    onClick={() => handleToggleStatus(s)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                                        s.activo
                                            ? 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100'
                                            : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                    }`}
                                >
                                    {s.activo ? 'Desactivar' : 'Activar'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleEdit(s)}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
                                >
                                    Editar
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleDelete(s.id_sesion)}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition cursor-pointer"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal para Crear/Editar */}
            {isModalOpen && (
                <ModalCrearSesion
                    isOpen={isModalOpen}
                    sesion={sesionAEditar}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSesionAEditar(null);
                    }}
                />
            )}
        </div>
    );
}