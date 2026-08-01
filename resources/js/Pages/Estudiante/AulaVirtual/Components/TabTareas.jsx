import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function Icon({ name, className = 'h-4 w-4' }) {
    const icons = {
        fileText: (
            <>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" points="14 2 14 8 20 8" />
            </>
        ),
        upload: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        ),
        checkCircle: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        ),
        clock: (
            <>
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" points="12 6 12 12 16 14" />
            </>
        ),
        close: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />,
        download: (
            <>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </>
        )
    };

    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
            {icons[name] ?? null}
        </svg>
    );
}

export default function TabTareas({ tareas = [] }) {
    const [listadoTareas, setListadoTareas] = useState(tareas);
    const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
    const [archivo, setArchivo] = useState(null);
    const [comentario, setComentario] = useState('');
    const [cargando, setCargando] = useState(false);
    const [errores, setErrores] = useState({});

    const abrirModal = (tarea) => {
        setTareaSeleccionada(tarea);
        setArchivo(null);
        setComentario('');
        setErrores({});
    };

    const cerrarModal = () => {
        setTareaSeleccionada(null);
        setArchivo(null);
        setComentario('');
        setErrores({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!archivo) {
            setErrores({ archivo: 'Por favor, selecciona un archivo.' });
            return;
        }

        setCargando(true);
        setErrores({});

        // Construir datos de la petición AJAX
        const formData = new FormData();
        formData.append('tarea_id', tareaSeleccionada.id);
        formData.append('archivo', archivo);
        if (comentario) {
            formData.append('comentario', comentario);
        }

        try {
            const response = await axios.post(route('estudiante.tareas.entregar'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            cerrarModal();

            // Actualizar estado local para reflejar la entrega en la UI sin recargar
            setListadoTareas((prev) =>
                prev.map((t) =>
                    t.id === tareaSeleccionada.id
                        ? { ...t, entregado: true, fecha_entrega: response.data.fecha_entrega }
                        : t
                )
            );

            // Alerta SweetAlert2
            Swal.fire({
                icon: 'success',
                title: '¡Entrega Realizada!',
                text: response.data.message || 'Tu tarea se ha subido correctamente.',
                confirmButtonColor: '#315d7a',
                timer: 3000,
            });
        } catch (error) {
            if (error.response && error.response.status === 422) {
                setErrores(error.response.data.errors || {});
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error de servidor',
                    text: error.response?.data?.message || 'No se pudo enviar la tarea. Inténtalo de nuevo.',
                    confirmButtonColor: '#315d7a',
                });
            }
        } finally {
            setCargando(false);
        }
    };

    if (!listadoTareas.length) {
        return (
            <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Icon name="fileText" className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">No hay tareas o asignaciones pendientes.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Cabecera */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                    <h3 className="text-sm font-bold text-slate-900">Tareas y Entregables</h3>
                    <p className="text-[11px] text-slate-400">Revisa tus actividades asignadas y sube tus trabajos en la fecha indicada.</p>
                </div>
                <span className="text-xs font-bold text-[#315d7a] bg-[#315d7a]/10 px-3 py-1 rounded-xl">
                    {listadoTareas.length} Tareas
                </span>
            </div>

            {/* Listado de Tareas */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {listadoTareas.map((t) => {
                    const estaEntregado = Boolean(t.entregado);
                    const archivoDocente = t.archivo_url;

                    return (
                        <div
                            key={t.id}
                            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4"
                        >
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between gap-2">
                                    {estaEntregado ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                                            <Icon name="checkCircle" className="h-3 w-3" /> Entregado
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                                            <Icon name="clock" className="h-3 w-3" /> Pendiente
                                        </span>
                                    )}

                                    <span className="text-[11px] text-red-500 font-bold">
                                        Vence: {t.fecha_limite}
                                    </span>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 leading-snug">{t.titulo}</h4>
                                    {t.descripcion && (
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-3">{t.descripcion}</p>
                                    )}
                                </div>

                                {archivoDocente && (
                                    <a
                                        href={archivoDocente}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-[#315d7a] font-bold transition w-full"
                                    >
                                        <Icon name="download" className="h-3.5 w-3.5" />
                                        <span className="truncate">Descargar Adjunto del Docente</span>
                                    </a>
                                )}
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 font-medium">
                                    {estaEntregado ? 'Puedes actualizar tu entrega' : 'Máximo 10MB (PDF, DOCX, ZIP)'}
                                </span>
                                <button
                                    onClick={() => abrirModal(t)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                        estaEntregado
                                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            : 'bg-[#315d7a] hover:bg-[#274b63] text-white shadow-2xs'
                                    }`}
                                >
                                    <Icon name="upload" className="h-3.5 w-3.5" />
                                    <span>{estaEntregado ? 'Reenviar Trabajo' : 'Subir Trabajo'}</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* MODAL DE SUBIDA VÍA AJAX */}
            {tareaSeleccionada && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 relative animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                            <div>
                                <span className="text-[10px] font-black uppercase text-[#315d7a] bg-sky-50 px-2 py-0.5 rounded-md">
                                    Entrega de Actividad
                                </span>
                                <h3 className="text-sm font-bold text-slate-900 mt-1">{tareaSeleccionada.titulo}</h3>
                            </div>
                            <button
                                onClick={cerrarModal}
                                disabled={cargando}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                            >
                                <Icon name="close" className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Archivo adjunto <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.zip,.rar"
                                    onChange={(e) => setArchivo(e.target.files[0] || null)}
                                    disabled={cargando}
                                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#315d7a]/10 file:text-[#315d7a] hover:file:bg-[#315d7a]/20 cursor-pointer"
                                />
                                {errores.archivo && (
                                    <p className="text-[11px] text-red-500 font-bold mt-1">{errores.archivo}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Comentario opcional
                                </label>
                                <textarea
                                    rows="3"
                                    value={comentario}
                                    onChange={(e) => setComentario(e.target.value)}
                                    disabled={cargando}
                                    placeholder="Agrega alguna nota o aclaración para el docente..."
                                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-[#315d7a] focus:ring-0 transition"
                                />
                                {errores.comentario && (
                                    <p className="text-[11px] text-red-500 font-bold mt-1">{errores.comentario}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={cerrarModal}
                                    disabled={cargando}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={cargando}
                                    className="px-4 py-2 bg-[#315d7a] hover:bg-[#274b63] text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    {cargando ? 'Guardando...' : 'Confirmar Entrega'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}