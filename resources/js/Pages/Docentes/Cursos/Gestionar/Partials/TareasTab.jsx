import { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function TareasTab({ curso, seccion, periodo, sesiones = [], subcomponentes = [] }) {
    const [tareas, setTareas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModalCreate, setShowModalCreate] = useState(false);
    
    // Estado para la revisión de entregas
    const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
    const [showModalEntregas, setShowModalEntregas] = useState(false);
    const [loadingEntregas, setLoadingEntregas] = useState(false);

    // Formulario para Crear Tarea con valores por defecto contextuales
    const { data, setData, post, processing, reset, errors } = useForm({
        nombre: '',
        descripcion: '',
        fecha: '',
        fecha_fin: '',
        hora_inicio: '08:00',
        hora_fin: '23:59',
        sesion_id: '',
        subcomponente_id: '',
        archivo: null,
        curso_id: curso?.id || '',
        seccion_id: seccion?.id || '',
        periodo_id: periodo?.id || '',
        // Compatibilidad por si el backend busca id_seccion / id_periodo
        id_seccion: seccion?.id || '',
        id_periodo: periodo?.id || '',
    });

    // Mantener sincronizados los IDs en el formulario cuando cambian las props
    useEffect(() => {
        if (curso?.id) setData('curso_id', curso.id);
        if (seccion?.id) {
            setData('seccion_id', seccion.id);
            setData('id_seccion', seccion.id);
        }
        if (periodo?.id) {
            setData('periodo_id', periodo.id);
            setData('id_periodo', periodo.id);
        }
    }, [curso?.id, seccion?.id, periodo?.id]);

    // Cargar tareas al montar o cambiar de curso, sección o periodo
    useEffect(() => {
        if (curso?.id) {
            fetchTareas();
        }
    }, [curso?.id, seccion?.id, periodo?.id]);

    const fetchTareas = async () => {
        setLoading(true);
        try {
            // CORRECCIÓN CRÍTICA: Se pasan explícitamente los parámetros para aislar por sección
            const res = await axios.get(route('cursos.tareas.index'), {
                params: {
                    curso_id: curso?.id,
                    seccion_id: seccion?.id,
                    periodo_id: periodo?.id,
                    id_seccion: seccion?.id,
                    id_periodo: periodo?.id,
                }
            });
            setTareas(res.data);
        } catch (error) {
            console.error('Error al cargar tareas:', error);
        } finally {
            setLoading(false);
        }
    };

    // Formulario para Calificar Entrega
    const formCalificar = useForm({
        nota: '',
        observacion: '',
    });

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        post(route('cursos.tareas.store'), {
            forceFormData: true,
            onSuccess: () => {
                setShowModalCreate(false);
                reset();
                fetchTareas();
                Swal.fire({
                    icon: 'success',
                    title: '¡Tarea Publicada!',
                    text: 'La consigna y parámetros han sido registrados.',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-2xl' }
                });
            },
            onError: (err) => {
                console.error('Error al publicar tarea:', err);
            }
        });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: '¿Eliminar esta tarea?',
            text: 'Se eliminarán también las entregas hechas por los alumnos.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
            customClass: { popup: 'rounded-2xl' }
        }).then((result) => {
            if (result.isConfirmed) {
                axios.delete(route('cursos.tareas.destroy', id)).then(() => {
                    fetchTareas();
                    Swal.fire({
                        icon: 'success',
                        title: 'Eliminada',
                        text: 'La tarea ha sido eliminada correctamente.',
                        timer: 1500,
                        showConfirmButton: false,
                        customClass: { popup: 'rounded-2xl' }
                    });
                });
            }
        });
    };

    const handleVerEntregas = async (tareaId) => {
        setLoadingEntregas(true);
        setShowModalEntregas(true);
        try {
            const res = await axios.get(route('cursos.tareas.entregas', tareaId));
            setTareaSeleccionada(res.data);
        } catch (error) {
            console.error('Error al cargar entregas:', error);
            Swal.fire('Error', 'No se pudieron cargar las entregas.', 'error');
        } finally {
            setLoadingEntregas(false);
        }
    };

    const handleCalificarSubmit = (e, envioId) => {
        e.preventDefault();
        formCalificar.post(route('cursos.tareas.calificar', envioId), {
            onSuccess: () => {
                Swal.fire({
                    icon: 'success',
                    title: 'Guardado',
                    text: 'Calificación registrada correctamente.',
                    timer: 1200,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-2xl' }
                });
                handleVerEntregas(tareaSeleccionada.id);
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Encabezado de la pestaña */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                    <h2 className="text-base font-bold text-slate-900">Tareas y Trabajos de Campo</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Administra las consignas, recepciona entregas y califica los trabajos de tus alumnos.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowModalCreate(true)}
                    className="bg-[#315d7a] hover:bg-[#254860] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                >
                    + Crear Nueva Tarea
                </button>
            </div>

            {/* Listado de Tareas */}
            {loading ? (
                <div className="py-12 text-center text-xs text-slate-500 font-medium flex justify-center items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#315d7a]"></span>
                    Cargando tareas asignadas...
                </div>
            ) : tareas.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center bg-slate-50/50">
                    <p className="text-xs font-medium text-slate-500">No hay tareas creadas para esta sección.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tareas.map((item) => (
                        <div key={item.id} className="border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3 bg-white flex flex-col justify-between">
                            <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                                        {item.subcomponente ? item.subcomponente.nombre : 'Tarea Regular'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(item.id)}
                                        className="text-slate-400 hover:text-red-600 text-xs font-bold cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <h3 className="text-sm font-bold text-slate-900">{item.nombre}</h3>
                                
                                {item.descripcion && (
                                    <p className="text-xs text-slate-600 line-clamp-2">{item.descripcion}</p>
                                )}

                                {item.sesion && (
                                    <p className="text-[11px] text-slate-400 font-medium">
                                        📌 Sesión: {item.sesion.nombre}
                                    </p>
                                )}

                                <div className="text-[11px] text-slate-500 space-y-1 border-t border-slate-100 pt-2">
                                    <div>📅 <strong>Apertura:</strong> {item.fecha} ({item.hora_inicio || '00:00'})</div>
                                    <div>⏳ <strong>Vencimiento:</strong> {item.fecha_fin} ({item.hora_fin || '23:59'})</div>
                                </div>

                                {item.archivo && (
                                    <a
                                        href={`/storage/${item.archivo}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#315d7a] hover:underline pt-1"
                                    >
                                        📎 Descargar Guía / Adjunto
                                    </a>
                                )}
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-xs text-slate-500 font-medium">
                                    📥 Entregas: <strong>{item.envios_count || 0}</strong>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleVerEntregas(item.id)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                                >
                                    Revisar y Calificar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Crear Tarea */}
            {showModalCreate && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-base font-bold text-slate-900">Crear Nueva Tarea</h3>
                        
                        <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Título / Nombre de la Tarea</label>
                                <input
                                    type="text"
                                    required
                                    value={data.nombre}
                                    onChange={(e) => setData('nombre', e.target.value)}
                                    placeholder="Ej. Trabajo Práctico 01: Reporte de Investigación"
                                    className="w-full rounded-xl border-slate-200 text-xs p-2.5 focus:border-[#315d7a]"
                                />
                                {errors.nombre && <p className="text-red-500 mt-1">{errors.nombre}</p>}
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Descripción / Instrucciones</label>
                                <textarea
                                    rows="3"
                                    value={data.descripcion}
                                    onChange={(e) => setData('descripcion', e.target.value)}
                                    placeholder="Escribe aquí las pautas o indicaciones para tus estudiantes..."
                                    className="w-full rounded-xl border-slate-200 text-xs p-2.5 focus:border-[#315d7a]"
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Sesión / Semana (Opcional)</label>
                                    <select
                                        value={data.sesion_id}
                                        onChange={(e) => setData('sesion_id', e.target.value)}
                                        className="w-full rounded-xl border-slate-200 text-xs p-2.5 focus:border-[#315d7a]"
                                    >
                                        <option value="">-- Ninguna --</option>
                                        {sesiones.map((s) => (
                                            <option key={s.id_sesion} value={s.id_sesion}>{s.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Criterio / Nota (Opcional)</label>
                                    <select
                                        value={data.subcomponente_id}
                                        onChange={(e) => setData('subcomponente_id', e.target.value)}
                                        className="w-full rounded-xl border-slate-200 text-xs p-2.5 focus:border-[#315d7a]"
                                    >
                                        <option value="">-- Ninguno (Formativo) --</option>
                                        {subcomponentes.map((sc) => (
                                            <option key={sc.id} value={sc.id}>{sc.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Fecha Disponible</label>
                                    <input
                                        type="date"
                                        required
                                        value={data.fecha}
                                        onChange={(e) => setData('fecha', e.target.value)}
                                        className="w-full rounded-xl border-slate-200 text-xs p-2.5 focus:border-[#315d7a]"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Hora Inicio</label>
                                    <input
                                        type="time"
                                        value={data.hora_inicio}
                                        onChange={(e) => setData('hora_inicio', e.target.value)}
                                        className="w-full rounded-xl border-slate-200 text-xs p-2.5 focus:border-[#315d7a]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Fecha Cierre</label>
                                    <input
                                        type="date"
                                        required
                                        value={data.fecha_fin}
                                        onChange={(e) => setData('fecha_fin', e.target.value)}
                                        className="w-full rounded-xl border-slate-200 text-xs p-2.5 focus:border-[#315d7a]"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Hora Fin Límite</label>
                                    <input
                                        type="time"
                                        value={data.hora_fin}
                                        onChange={(e) => setData('hora_fin', e.target.value)}
                                        className="w-full rounded-xl border-slate-200 text-xs p-2.5 focus:border-[#315d7a]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Archivo de Indicaciones (PDF, Word, Zip)</label>
                                <input
                                    type="file"
                                    onChange={(e) => setData('archivo', e.target.files[0])}
                                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModalCreate(false)}
                                    className="px-4 py-2 rounded-xl text-slate-600 font-bold border border-slate-200 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-[#315d7a] text-white px-4 py-2 rounded-xl font-bold cursor-pointer hover:bg-[#254860] transition"
                                >
                                    {processing ? 'Guardando...' : 'Publicar Tarea'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Revisión y Calificación de Entregas */}
            {showModalEntregas && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-3xl w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Revisión de Entregas: {tareaSeleccionada?.nombre}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Lista de trabajos recepcionados de los estudiantes.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModalEntregas(false)}
                                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {loadingEntregas ? (
                            <div className="py-8 text-center text-xs text-slate-500">Cargando entregas...</div>
                        ) : !tareaSeleccionada?.envios || tareaSeleccionada.envios.length === 0 ? (
                            <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                                Ningún estudiante ha subido su trabajo aún.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {tareaSeleccionada.envios.map((envio) => (
                                    <div key={envio.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-900">
                                                    👤 {envio.estudiante?.nombres || 'Estudiante'} {envio.estudiante?.apellido_paterno}
                                                </h4>
                                                <span className="text-[10px] text-slate-400">
                                                    Enviado: {new Date(envio.fecha_envio).toLocaleString('es-PE')}
                                                </span>
                                            </div>

                                            {envio.archivo && (
                                                <a
                                                    href={`/storage/${envio.archivo}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold shadow-2xs hover:bg-slate-50"
                                                >
                                                    📂 Descargar Trabajo
                                                </a>
                                            )}
                                        </div>

                                        {envio.comentario && (
                                            <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-100">
                                                💬 Comentario del alumno: "{envio.comentario}"
                                            </p>
                                        )}

                                        {/* Formulario rápido para asignar calificación */}
                                        <form onSubmit={(e) => handleCalificarSubmit(e, envio.id)} className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 items-end">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nota (0 - 20)</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="20"
                                                    defaultValue={envio.calificacion?.nota || ''}
                                                    onChange={(e) => formCalificar.setData('nota', e.target.value)}
                                                    placeholder="Ej. 18.5"
                                                    className="w-full bg-white rounded-lg border-slate-200 text-xs p-2 focus:border-[#315d7a]"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Observación / Feedback</label>
                                                <input
                                                    type="text"
                                                    defaultValue={envio.calificacion?.observacion || ''}
                                                    onChange={(e) => formCalificar.setData('observacion', e.target.value)}
                                                    placeholder="Ej. Excelente desarrollo del tema"
                                                    className="w-full bg-white rounded-lg border-slate-200 text-xs p-2 focus:border-[#315d7a]"
                                                />
                                            </div>

                                            <div>
                                                <button
                                                    type="submit"
                                                    className="w-full bg-[#315d7a] text-white py-2 rounded-lg text-xs font-bold hover:bg-[#254860] transition cursor-pointer"
                                                >
                                                    Guardar Calificación
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}