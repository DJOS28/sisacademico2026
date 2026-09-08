import { useState } from 'react';
import { router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import ModalCrearSesion from './ModalCrearSesion';
import ModalGenerarSesiones from './ModalGenerarSesiones';

export default function SesionesTab({ sesiones = [], periodo = null }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
    const [sesionAEditar, setSesionAEditar] = useState(null);

    const handleCreate = () => {
        setSesionAEditar(null);
        setIsModalOpen(true);
    };

    const handleEdit = (sesion) => {
        setSesionAEditar(sesion);
        setIsModalOpen(true);
    };

    const handleToggleStatus = (sesion) => {
        const nuevoEstado = !sesion.activo;

        Swal.fire({
            title: 'Actualizando estado...',
            text: 'Sincronizando con el Aula Virtual',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

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
            onError: () => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo cambiar el estado de la sesión.',
                    customClass: { popup: 'rounded-2xl' },
                });
            }
        });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: '¿Eliminar sesión?',
            text: 'Esta acción borrará la sesión y sus asistencias asociadas.',
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
                Swal.fire({
                    title: 'Eliminando sesión...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading(),
                });

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
                    onError: () => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Ocurrió un inconveniente al intentar eliminar la sesión.',
                            customClass: { popup: 'rounded-2xl' },
                        });
                    }
                });
            }
        });
    };

    return (
        <div className="space-y-4">
            {/* Header con botones de acción */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        Programación de Sesiones ({sesiones.length})
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Organiza los contenidos y asistencias por cada día de clase del horario.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsAutoModalOpen(true)}
                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                        <span>⚡ Generar Automático</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleCreate}
                        className="inline-flex items-center gap-1.5 bg-[#315d7a] hover:bg-[#254860] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                        <span>+ Nueva Sesión</span>
                    </button>
                </div>
            </div>

            {/* Listado de Sesiones */}
            {sesiones.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center bg-slate-50/50">
                    <p className="text-xs font-medium text-slate-500">
                        Aún no has registrado sesiones de clase para esta sección.
                    </p>
                    <button
                        type="button"
                        onClick={() => setIsAutoModalOpen(true)}
                        className="mt-3 text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                        ⚡ Generar las 16 sesiones automáticamente aquí
                    </button>
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
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
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

                                    {s.moodle_section_id && (
                                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                                            Aula Virtual ID: {s.moodle_section_id}
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-sm font-bold text-slate-800">{s.nombre}</h3>
                                
                                {s.fecha && (
                                    <p className="text-xs text-slate-500">
                                        Fecha: <strong className="text-slate-700">{s.fecha}</strong>
                                    </p>
                                )}
                            </div>

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

            {/* Modal para Crear/Editar individual */}
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

            {/* Modal para Generación Automática */}
            {isAutoModalOpen && (
                <ModalGenerarSesiones
                    isOpen={isAutoModalOpen}
                    periodoInicio={periodo?.fecha_inicio}
                    onClose={() => setIsAutoModalOpen(false)}
                />
            )}
        </div>
    );
}