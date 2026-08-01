import { useState, useEffect } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function ClaseEnVivoTab({ sesiones = [] }) {
    const { auth } = usePage().props;
    const [clases, setClases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [claseActiva, setClaseActiva] = useState(null); // Clase seleccionada para entrar a Jitsi
    const [showModal, setShowModal] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        titulo: '',
        sesion_id: '',
        fecha_inicio: '',
    });

    useEffect(() => {
        fetchClases();
    }, []);

    const fetchClases = async () => {
        setLoading(true);
        try {
            const res = await axios.get(route('cursos.clases.index'));
            setClases(res.data);
        } catch (error) {
            console.error('Error al cargar las clases:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = (e) => {
        e.preventDefault();
        post(route('cursos.clases.store'), {
            onSuccess: () => {
                setShowModal(false);
                reset();
                fetchClases();
                Swal.fire({
                    icon: 'success',
                    title: '¡Clase Programada!',
                    text: 'La videoconferencia fue registrada con éxito.',
                    timer: 1500,
                    showConfirmButton: false,
                });
            },
        });
    };

    const handleIniciarClase = async (clase) => {
        try {
            await axios.post(route('cursos.clases.estado', clase.id), { estado: 'en_vivo' });
            setClaseActiva({ ...clase, estado: 'en_vivo' });
            fetchClases();
        } catch (error) {
            Swal.fire('Error', 'No se pudo cambiar el estado de la clase.', 'error');
        }
    };

    const handleFinalizarClase = async () => {
        if (!claseActiva) return;
        try {
            await axios.post(route('cursos.clases.estado', claseActiva.id), { estado: 'finalizada' });
            setClaseActiva(null);
            fetchClases();
            Swal.fire('Clase Finalizada', 'La sesión en vivo ha concluido.', 'info');
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: '¿Eliminar clase?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            if (result.isConfirmed) {
                axios.delete(route('cursos.clases.destroy', id)).then(() => {
                    fetchClases();
                    Swal.fire('Eliminada', 'La clase fue eliminada.', 'success');
                });
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Si hay una videoconferencia activa */}
            {claseActiva ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase animate-pulse">
                                ● Transmitiendo en Vivo
                            </span>
                            <h2 className="text-base font-bold text-slate-900 mt-1">{claseActiva.titulo}</h2>
                        </div>
                        <button
                            type="button"
                            onClick={handleFinalizarClase}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                            Finalizar Clase para Todos
                        </button>
                    </div>

                    <div className="w-full h-[620px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                        <JitsiMeeting
                            domain="meet.element.io"
                            roomName={claseActiva.room_name}
                            configOverwrite={{
                                startWithAudioMuted: true,
                                disableThirdPartyRequests: true,
                                prejoinPageEnabled: false,
                                enableWelcomePage: false,
                                enableLobby: false,         // Desactiva vestíbulo/sala de espera
                                requireDisplayName: false,
                            }}
                            interfaceConfigOverwrite={{
                                TOOLBAR_BUTTONS: [
                                    'microphone', 'camera', 'desktop', 'chat',
                                    'raisehand', 'tileview', 'fullscreen', 'hangup', 'sharetiles'
                                ],
                                SHOW_JITSI_WATERMARK: false,
                            }}
                            userInfo={{
                                displayName: auth?.user?.nombre_completo || auth?.user?.name || 'Docente',
                                email: auth?.user?.email || '',
                            }}
                            onApiReady={(externalApi) => {
                                // Forzar la desactivación del lobby al conectarse
                                externalApi.executeCommand('toggleLobby', false);
                            }}
                            onReadyToClose={() => setClaseActiva(null)}
                            getIFrameRef={(iframeRef) => {
                                iframeRef.style.height = '100%';
                                iframeRef.style.width = '100%';
                            }}
                        />
                    </div>
                </div>
            ) : (
                /* Listado y Programación */
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Clases en Vivo Programadas</h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Programa las sesiones virtuales de videoconferencia para esta sección.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowModal(true)}
                            className="bg-[#315d7a] hover:bg-[#254860] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                        >
                            + Programar Nueva Clase
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-12 text-center text-xs text-slate-500">Cargando programaciones...</div>
                    ) : clases.length === 0 ? (
                        <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center bg-slate-50/50">
                            <p className="text-xs font-medium text-slate-500">No hay clases en vivo programadas para esta sección.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {clases.map((item) => (
                                <div key={item.id} className="border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3 bg-white">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                                                item.estado === 'en_vivo' 
                                                    ? 'bg-red-100 text-red-700 animate-pulse' 
                                                    : item.estado === 'finalizada' 
                                                    ? 'bg-slate-100 text-slate-600' 
                                                    : 'bg-emerald-100 text-emerald-800'
                                            }`}>
                                                {item.estado === 'en_vivo' ? 'En Vivo' : item.estado === 'finalizada' ? 'Finalizada' : 'Programada'}
                                            </span>
                                            <h3 className="text-sm font-bold text-slate-900 mt-1">{item.titulo}</h3>
                                            {item.sesion && (
                                                <p className="text-[11px] text-slate-400 font-medium">
                                                    Sesión: {item.sesion.nombre}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(item.id)}
                                            className="text-slate-400 hover:text-red-600 text-xs font-bold cursor-pointer"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="text-xs text-slate-500 flex items-center gap-1.5 border-t border-slate-100 pt-3">
                                        📅 {new Date(item.fecha_inicio).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </div>

                                    <div className="pt-1">
                                        {item.estado === 'finalizada' ? (
                                            <button disabled className="w-full bg-slate-100 text-slate-400 py-2 rounded-xl text-xs font-bold">
                                                Clase Concluida
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleIniciarClase(item)}
                                                className="w-full bg-[#315d7a] hover:bg-[#254860] text-white py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                                            >
                                                {item.estado === 'en_vivo' ? 'Reingresar a la Clase' : 'Iniciar Clase Virtual'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modal Programar Clase */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <h3 className="text-base font-bold text-slate-900">Programar Clase en Vivo</h3>
                        <form onSubmit={handleCreate} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Título de la Clase</label>
                                <input
                                    type="text"
                                    required
                                    value={data.titulo}
                                    onChange={(e) => setData('titulo', e.target.value)}
                                    placeholder="Ej. Clase 01: Introducción al tema"
                                    className="w-full rounded-xl border-slate-200 text-xs p-2.5 focus:border-[#315d7a]"
                                />
                                {errors.titulo && <p className="text-red-500 mt-1">{errors.titulo}</p>}
                            </div>

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
                                <label className="block font-bold text-slate-700 mb-1">Fecha y Hora de Inicio</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={data.fecha_inicio}
                                    onChange={(e) => setData('fecha_inicio', e.target.value)}
                                    className="w-full rounded-xl border-slate-200 text-xs p-2.5 focus:border-[#315d7a]"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-xl text-slate-600 font-bold border border-slate-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-[#315d7a] text-white px-4 py-2 rounded-xl font-bold"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}