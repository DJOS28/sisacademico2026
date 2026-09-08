import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useState } from 'react';

export default function Index({ periodos, periodoActivoId, planesDisponibles, planSeleccionadoId, docentes, secciones, monitoreoInicial, historialGeneral: initialHistorial }) {
    const [periodoId, setPeriodoId] = useState(periodoActivoId);
    const [planEstudioId, setPlanEstudioId] = useState(planSeleccionadoId || '');
    const [docenteId, setDocenteId] = useState('');
    const [seccionId, setSeccionId] = useState('');
    const [buscar, setBuscar] = useState('');

    const [pestanaActiva, setPestanaActiva] = useState('monitoreo');
    const [monitoreo, setMonitoreo] = useState(monitoreoInicial || []);
    const [historial, setHistorial] = useState(initialHistorial || []);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Modal de Auditoría con Evidencias
    const [showModal, setShowModal] = useState(false);
    const [itemSeleccionado, setItemSeleccionado] = useState(null);
    const [pestanaModal, setPestanaModal] = useState('dictamen'); // 'dictamen' | 'silabo' | 'sesiones' | 'materiales' | 'asistencia' | 'notas'
    const [evidencias, setEvidencias] = useState(null);
    const [loadingEvidencias, setLoadingEvidencias] = useState(false);

    // Modal de Historial de Curso
    const [showModalHistorial, setShowModalHistorial] = useState(false);
    const [historialCurso, setHistorialCurso] = useState([]);
    const [loadingHistorialCurso, setLoadingHistorialCurso] = useState(false);

    const [formData, setFormData] = useState({
        horario_id: '',
        sesion_id: '',
        fecha: new Date().toISOString().split('T')[0],
        puntaje: '',
        estado: 'APROBADO',
        tiene_silabo: false,
        tiene_asistencia: false,
        tiene_archivo: false,
        tiene_notas: false,
        observaciones: '',
    });

    const fetchFiltrado = async (pId = periodoId, plId = planEstudioId, dId = docenteId, sId = seccionId, bText = buscar) => {
        if (!plId) {
            setMonitoreo([]);
            setHistorial([]);
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get(route('supervision.filtrar'), {
                params: {
                    periodo_id: pId,
                    plan_estudio_id: plId,
                    docente_id: dId,
                    seccion_id: sId,
                    buscar: bText,
                }
            });
            setMonitoreo(res.data.monitoreo || []);
            setHistorial(res.data.historial || []);
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error de Consulta', text: 'No se pudo actualizar la información.' });
        } finally {
            setLoading(false);
        }
    };

    const handlePlanChange = (e) => {
        const nuevoPlan = e.target.value;
        setPlanEstudioId(nuevoPlan);
        fetchFiltrado(periodoId, nuevoPlan, docenteId, seccionId, buscar);
    };

    const handlePeriodoChange = (e) => {
        const nuevoPeriodo = e.target.value;
        setPeriodoId(nuevoPeriodo);
        fetchFiltrado(nuevoPeriodo, planEstudioId, docenteId, seccionId, buscar);
    };

    const handleAbrirSupervision = async (item) => {
        setItemSeleccionado(item);
        setPestanaModal('dictamen');
        setFormData({
            horario_id: item.horario_id,
            sesion_id: '',
            fecha: new Date().toISOString().split('T')[0],
            puntaje: item.supervision_guardada ? item.supervision_guardada.puntaje : '',
            estado: item.supervision_guardada ? item.supervision_guardada.estado : 'APROBADO',
            tiene_silabo: item.supervision_guardada ? item.supervision_guardada.tiene_silabo : item.tiene_silabo,
            tiene_asistencia: item.supervision_guardada ? item.supervision_guardada.tiene_asistencia : item.tiene_asistencia,
            tiene_archivo: item.supervision_guardada ? item.supervision_guardada.tiene_archivo : item.tiene_archivo,
            tiene_notas: item.supervision_guardada ? item.supervision_guardada.tiene_notas : item.tiene_notas,
            observaciones: item.supervision_guardada?.observaciones || '',
        });
        setShowModal(true);

        // Cargar evidencias reales
        setLoadingEvidencias(true);
        try {
            const res = await axios.get(route('supervision.detalles.curso', item.horario_id));
            setEvidencias(res.data);
        } catch (error) {
            console.error("Error al cargar evidencias:", error);
        } finally {
            setLoadingEvidencias(false);
        }
    };

    const handleVerHistorialCurso = async (item) => {
        setItemSeleccionado(item);
        setShowModalHistorial(true);
        setLoadingHistorialCurso(true);
        try {
            const res = await axios.get(route('supervision.historial.curso', item.horario_id));
            setHistorialCurso(res.data.historial || []);
        } catch (error) {
            Swal.fire('Error', 'No se pudo cargar el historial del curso.', 'error');
        } finally {
            setLoadingHistorialCurso(false);
        }
    };

    const handleGuardarSupervision = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await axios.post(route('supervision.store'), formData);

            if (res.data.success) {
                setMonitoreo(prev => prev.map(item => {
                    if (item.horario_id === formData.horario_id) {
                        return {
                            ...item,
                            total_auditorias: item.total_auditorias + 1,
                            supervision_guardada: res.data.supervision,
                        };
                    }
                    return item;
                }));

                setShowModal(false);
                fetchFiltrado(periodoId, planEstudioId, docenteId, seccionId, buscar);

                Swal.fire({
                    icon: 'success',
                    title: '¡Supervisión Guardada!',
                    text: res.data.message,
                    timer: 1600,
                    showConfirmButton: false,
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error al Guardar',
                text: error.response?.data?.message || 'No se pudo registrar la supervisión.',
            });
        } finally {
            setSaving(false);
        }
    };

    const getBadgeEstado = (estado) => {
        switch (estado) {
            case 'APROBADO':
                return <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700">APROBADO</span>;
            case 'OBSERVADO':
                return <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700">OBSERVADO</span>;
            case 'CRITICO':
                return <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700">CRÍTICO</span>;
            default:
                return <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-600">Sin Auditar</span>;
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Supervisión y Control Docente</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Auditoría de cumplimiento académico y registro de dictámenes por carrera.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={periodoId}
                            onChange={handlePeriodoChange}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#315d7a]"
                        >
                            {periodos.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre} {p.activo ? '(Activo)' : ''}</option>
                            ))}
                        </select>

                        <Link
                            href={route('supervision.planes.index')}
                            className="rounded-lg bg-[#315d7a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#274c64]"
                        >
                            Asignar Supervisores
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Supervisión Docente" />

            {/* Selector de Plan de Estudios */}
            <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50/40 p-4 shadow-sm">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Seleccione Carrera / Plan de Estudios a Auditar:
                </label>
                <select
                    value={planEstudioId}
                    onChange={handlePlanChange}
                    className="min-w-[320px] rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-[#315d7a]"
                >
                    <option value="">-- Seleccionar Plan de Estudios --</option>
                    {planesDisponibles.map(plan => (
                        <option key={plan.id} value={plan.id}>
                            {plan.nombre} {plan.codigo ? `(${plan.codigo})` : ''}
                        </option>
                    ))}
                </select>
            </div>

            {/* Pestañas: Monitoreo vs Historial */}
            <div className="flex items-center gap-2 border-b border-slate-200 mb-5">
                <button
                    type="button"
                    onClick={() => setPestanaActiva('monitoreo')}
                    className={`px-4 py-2.5 text-sm font-bold border-b-2 transition cursor-pointer ${
                        pestanaActiva === 'monitoreo'
                            ? 'border-[#315d7a] text-[#315d7a]'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    📊 Matriz de Cursos ({monitoreo.length})
                </button>

                <button
                    type="button"
                    onClick={() => setPestanaActiva('historial')}
                    className={`px-4 py-2.5 text-sm font-bold border-b-2 transition cursor-pointer ${
                        pestanaActiva === 'historial'
                            ? 'border-[#315d7a] text-[#315d7a]'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    📜 Histórico de Auditorías Registradas ({historial.length})
                </button>
            </div>

            {/* Matriz de Cursos */}
            {pestanaActiva === 'monitoreo' && (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 font-bold uppercase text-slate-500">Docente / Curso</th>
                                <th className="px-4 py-3 text-center font-bold uppercase text-slate-500">Sec.</th>
                                <th className="px-4 py-3 text-center font-bold uppercase text-slate-500">Sílabo</th>
                                <th className="px-4 py-3 text-center font-bold uppercase text-slate-500">Sesiones</th>
                                <th className="px-4 py-3 text-center font-bold uppercase text-slate-500">Materiales</th>
                                <th className="px-4 py-3 text-center font-bold uppercase text-slate-500">Asistencia</th>
                                <th className="px-4 py-3 text-center font-bold uppercase text-slate-500">Notas</th>
                                <th className="px-4 py-3 text-center font-bold uppercase text-slate-500">Último Dictamen</th>
                                <th className="px-4 py-3 text-center font-bold uppercase text-slate-500">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {loading ? (
                                <tr><td colSpan="9" className="py-12 text-center text-slate-400">Consultando datos...</td></tr>
                            ) : !planEstudioId ? (
                                <tr><td colSpan="9" className="py-14 text-center text-slate-400 font-medium">👉 Seleccione un Plan de Estudios en el menú superior.</td></tr>
                            ) : monitoreo.length > 0 ? (
                                monitoreo.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-slate-900 text-sm">{item.docente_nombre}</p>
                                            <p className="text-xs text-slate-500">{item.curso_nombre}</p>
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-slate-500">{item.seccion_nombre}</td>
                                        <td className="px-4 py-3 text-center">{item.tiene_silabo ? <span className="text-emerald-600 font-bold">✓ Sí</span> : <span className="text-rose-500 font-bold">✕ No</span>}</td>
                                        <td className="px-4 py-3 text-center font-bold">{item.total_sesiones} sem.</td>
                                        <td className="px-4 py-3 text-center">{item.tiene_archivo ? <span className="text-emerald-600 font-bold">✓ Sí</span> : <span className="text-rose-500 font-bold">✕ No</span>}</td>
                                        <td className="px-4 py-3 text-center">{item.tiene_asistencia ? <span className="text-emerald-600 font-bold">✓ Sí</span> : <span className="text-rose-500 font-bold">✕ No</span>}</td>
                                        <td className="px-4 py-3 text-center">{item.tiene_notas ? <span className="text-emerald-600 font-bold">✓ Sí</span> : <span className="text-rose-500 font-bold">✕ No</span>}</td>
                                        <td className="px-4 py-3 text-center">
                                            {getBadgeEstado(item.supervision_guardada?.estado)}
                                            {item.supervision_guardada && (
                                                <div className="text-[10px] text-slate-400 mt-0.5 font-bold">Nota: {parseFloat(item.supervision_guardada.puntaje).toFixed(1)}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAbrirSupervision(item)}
                                                    className="rounded-md bg-[#315d7a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#274c64]"
                                                >
                                                    🔍 Auditar
                                                </button>
                                                {item.total_auditorias > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleVerHistorialCurso(item)}
                                                        className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                                        title="Ver historial de actas"
                                                    >
                                                        📜 ({item.total_auditorias})
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="9" className="py-10 text-center text-slate-400">No hay cursos registrados.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Historial General */}
            {pestanaActiva === 'historial' && (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 font-bold uppercase text-slate-500">Fecha</th>
                                <th className="px-4 py-3 font-bold uppercase text-slate-500">Curso / Docente</th>
                                <th className="px-4 py-3 text-center font-bold uppercase text-slate-500">Sec.</th>
                                <th className="px-4 py-3 text-center font-bold uppercase text-slate-500">Calificación</th>
                                <th className="px-4 py-3 text-center font-bold uppercase text-slate-500">Dictamen</th>
                                <th className="px-4 py-3 font-bold uppercase text-slate-500">Supervisor Responsable</th>
                                <th className="px-4 py-3 font-bold uppercase text-slate-500">Observaciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {historial.length > 0 ? (
                                historial.map((h, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-mono font-bold text-slate-800">{h.fecha}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-slate-900">{h.curso_nombre}</p>
                                            <p className="text-xs text-slate-500">{h.docente_nombre}</p>
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold">{h.seccion}</td>
                                        <td className="px-4 py-3 text-center font-black text-sm text-slate-900">{parseFloat(h.puntaje).toFixed(1)}</td>
                                        <td className="px-4 py-3 text-center">{getBadgeEstado(h.estado)}</td>
                                        <td className="px-4 py-3 font-medium text-slate-700">{h.supervisor}</td>
                                        <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={h.observaciones}>{h.observaciones}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="7" className="py-12 text-center text-slate-400">No se han registrado auditorías en este periodo.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL EXTENDIDO: AUDITORÍA + EXPLORADOR DE EVIDENCIAS EN PESTAÑAS         */}
            {/* ========================================================================= */}
            {showModal && itemSeleccionado && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
                        {/* Cabecera del Modal */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <div>
                                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                    <span>🔍 Auditoría y Control Pedagógico</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {itemSeleccionado.curso_nombre} — {itemSeleccionado.docente_nombre} (Sección {itemSeleccionado.seccion_nombre})
                                </p>
                            </div>
                            <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
                        </div>

                        {/* Barra de Navegación de Evidencias */}
                        <div className="flex items-center gap-1 border-b border-slate-200 py-2 overflow-x-auto">
                            <button
                                type="button"
                                onClick={() => setPestanaModal('dictamen')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                                    pestanaModal === 'dictamen' ? 'bg-[#315d7a] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                📝 Emitir Dictamen
                            </button>
                            <button
                                type="button"
                                onClick={() => setPestanaModal('silabo')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                                    pestanaModal === 'silabo' ? 'bg-[#315d7a] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                📄 Ver Sílabo
                            </button>
                            <button
                                type="button"
                                onClick={() => setPestanaModal('sesiones')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                                    pestanaModal === 'sesiones' ? 'bg-[#315d7a] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                📅 Sesiones ({evidencias?.sesiones?.length || 0})
                            </button>
                            <button
                                type="button"
                                onClick={() => setPestanaModal('materiales')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                                    pestanaModal === 'materiales' ? 'bg-[#315d7a] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                📦 Materiales ({evidencias?.materiales?.length || 0})
                            </button>
                            <button
                                type="button"
                                onClick={() => setPestanaModal('asistencia')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                                    pestanaModal === 'asistencia' ? 'bg-[#315d7a] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                👥 Asistencias
                            </button>
                            <button
                                type="button"
                                onClick={() => setPestanaModal('notas')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                                    pestanaModal === 'notas' ? 'bg-[#315d7a] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                📊 Calificaciones
                            </button>
                        </div>

                        {/* Cuerpo de la Evidencia Seleccionada */}
                        <div className="flex-1 overflow-y-auto py-4">
                            {loadingEvidencias ? (
                                <div className="py-12 text-center text-xs text-slate-400">Cargando evidencias del curso...</div>
                            ) : (
                                <>
                                    {/* 1. Formulario Dictamen */}
                                    {pestanaModal === 'dictamen' && (
                                        <form onSubmit={handleGuardarSupervision} className="space-y-4">
                                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                                                <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Resumen del Sistema</div>
                                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                                    <div>Sílabo en plataforma: <strong className={itemSeleccionado.tiene_silabo ? 'text-emerald-700' : 'text-rose-700'}>{itemSeleccionado.tiene_silabo ? 'Cargado' : 'Faltante'}</strong></div>
                                                    <div>Sesiones creadas: <strong className="text-slate-700">{itemSeleccionado.total_sesiones} semanas</strong></div>
                                                    <div>Materiales de clase: <strong className={itemSeleccionado.tiene_archivo ? 'text-emerald-700' : 'text-rose-700'}>{itemSeleccionado.tiene_archivo ? 'Disponibles' : 'Sin archivos'}</strong></div>
                                                    <div>Asistencias marcadas: <strong className={itemSeleccionado.tiene_asistencia ? 'text-emerald-700' : 'text-rose-700'}>{itemSeleccionado.tiene_asistencia ? 'Registradas' : 'Pendiente'}</strong></div>
                                                    <div className="col-span-2">Notas en sistema: <strong className={itemSeleccionado.tiene_notas ? 'text-emerald-700' : 'text-rose-700'}>{itemSeleccionado.tiene_notas ? 'Con calificaciones' : 'Sin notas ingresadas'}</strong></div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-xs font-bold text-slate-700">Criterios Validados por el Supervisor *</label>
                                                <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-xl border border-slate-200">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" checked={formData.tiene_silabo} onChange={(e) => setFormData({ ...formData, tiene_silabo: e.target.checked })} className="rounded text-[#315d7a]" />
                                                        <span>Sílabo Conforme</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" checked={formData.tiene_archivo} onChange={(e) => setFormData({ ...formData, tiene_archivo: e.target.checked })} className="rounded text-[#315d7a]" />
                                                        <span>Materiales Conformes</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" checked={formData.tiene_asistencia} onChange={(e) => setFormData({ ...formData, tiene_asistencia: e.target.checked })} className="rounded text-[#315d7a]" />
                                                        <span>Asistencia al Día</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" checked={formData.tiene_notas} onChange={(e) => setFormData({ ...formData, tiene_notas: e.target.checked })} className="rounded text-[#315d7a]" />
                                                        <span>Notas al Día</span>
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Auditoría *</label>
                                                    <input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} required className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#315d7a]" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">Calificación (0 a 20) *</label>
                                                    <input type="number" step="0.5" min="0" max="20" value={formData.puntaje} onChange={(e) => setFormData({ ...formData, puntaje: e.target.value })} placeholder="Ej: 18" required className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-bold text-center focus:outline-none focus:border-[#315d7a]" />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">Dictamen Final *</label>
                                                <select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-bold focus:outline-none focus:border-[#315d7a]">
                                                    <option value="APROBADO">APROBADO — Cumple satisfactoriamente</option>
                                                    <option value="OBSERVADO">OBSERVADO — Requiere regularización</option>
                                                    <option value="CRITICO">CRÍTICO — Incumplimiento grave</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">Observaciones / Recomendaciones</label>
                                                <textarea rows="3" value={formData.observaciones} onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })} placeholder="Detalles para el docente sobre sílabos, asistencias o notas..." className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#315d7a]"></textarea>
                                            </div>

                                            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                                                <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
                                                <button type="submit" disabled={saving} className="rounded-xl bg-[#315d7a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#274c64] disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar Supervisión'}</button>
                                            </div>
                                        </form>
                                    )}

                                    {/* 2. Evidencia: Sílabo */}
                                    {pestanaModal === 'silabo' && (
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-3">
                                            {evidencias?.silabo ? (
                                                <div>
                                                    <div className="text-3xl mb-1">📄</div>
                                                    <p className="font-bold text-slate-900 text-sm">Sílabo disponible</p>
                                                    <p className="text-xs text-slate-500 mb-3 font-mono">Archivo: {evidencias.silabo.archivo}</p>
                                                    <a href={`/storage/${evidencias.silabo.archivo}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#315d7a] text-white rounded-xl text-xs font-bold hover:bg-[#274c64]">
                                                        Descargar / Ver Sílabo
                                                    </a>
                                                </div>
                                            ) : (
                                                <div className="py-8 text-slate-400 text-xs font-semibold">❌ El docente aún no ha subido el archivo del sílabo para esta sección.</div>
                                            )}
                                        </div>
                                    )}

                                    {/* 3. Evidencia: Sesiones */}
                                    {pestanaModal === 'sesiones' && (
                                        <div className="space-y-2">
                                            {evidencias?.sesiones?.length > 0 ? (
                                                evidencias.sesiones.map((s, idx) => (
                                                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                                                        <div>
                                                            <div className="font-bold text-slate-900">Semana {idx + 1}: {s.nombre}</div>
                                                            <div className="text-[10px] text-slate-400 font-mono">Fechas: {s.fecha} al {s.fecha_fin || '---'}</div>
                                                        </div>
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Registrada</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-8 text-center text-slate-400 text-xs">No hay sesiones programadas en este curso.</div>
                                            )}
                                        </div>
                                    )}

                                    {/* 4. Evidencia: Materiales */}
                                    {pestanaModal === 'materiales' && (
                                        <div className="space-y-2">
                                            {evidencias?.materiales?.length > 0 ? (
                                                evidencias.materiales.map((m, idx) => (
                                                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                                                        <div>
                                                            <div className="font-bold text-slate-900">{m.nombre}</div>
                                                            <div className="text-[10px] text-slate-400 font-mono">Tipo: {m.tipo?.toUpperCase()}</div>
                                                        </div>
                                                        <a href={`/storage/${m.ruta}`} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline">Ver Archivo</a>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-8 text-center text-slate-400 text-xs">No hay materiales ni diapositivas subidas.</div>
                                            )}
                                        </div>
                                    )}

                                    {/* 5. Evidencia: Asistencia */}
                                    {pestanaModal === 'asistencia' && (
                                        <div className="space-y-2">
                                            {evidencias?.asistencias?.length > 0 ? (
                                                <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                                                    <thead className="bg-slate-100 font-bold text-slate-600">
                                                        <tr>
                                                            <th className="p-2.5">Fecha de Clase</th>
                                                            <th className="p-2.5 text-center">Matriculados</th>
                                                            <th className="p-2.5 text-center text-emerald-700">Presentes</th>
                                                            <th className="p-2.5 text-center text-rose-700">Faltas</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {evidencias.asistencias.map((a, idx) => (
                                                            <tr key={idx} className="hover:bg-slate-50">
                                                                <td className="p-2.5 font-mono font-bold text-slate-800">{a.fecha}</td>
                                                                <td className="p-2.5 text-center font-bold">{a.total_alumnos}</td>
                                                                <td className="p-2.5 text-center font-bold text-emerald-700">{a.presentes}</td>
                                                                <td className="p-2.5 text-center font-bold text-rose-700">{a.faltas}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div className="py-8 text-center text-slate-400 text-xs">No se han registrado asistencias a los alumnos.</div>
                                            )}
                                        </div>
                                    )}

                                    {/* 6. Evidencia: Calificaciones */}
                                    {pestanaModal === 'notas' && (
                                        <div className="space-y-2 max-h-72 overflow-y-auto">
                                            {evidencias?.notas?.length > 0 ? (
                                                <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                                                    <thead className="bg-slate-100 font-bold text-slate-600">
                                                        <tr>
                                                            <th className="p-2.5">DNI</th>
                                                            <th className="p-2.5">Estudiante</th>
                                                            <th className="p-2.5 text-center">Nota Final</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {evidencias.notas.map((n, idx) => (
                                                            <tr key={idx} className="hover:bg-slate-50">
                                                                <td className="p-2.5 font-mono text-slate-500">{n.dni}</td>
                                                                <td className="p-2.5 font-semibold text-slate-900">{n.apellidos}, {n.nombres}</td>
                                                                <td className="p-2.5 text-center font-black text-sm text-slate-900">
                                                                    {n.nota_final !== null ? n.nota_final : <span className="text-slate-300 font-normal">Sin Nota</span>}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div className="py-8 text-center text-slate-400 text-xs">No hay estudiantes matriculados o notas registradas.</div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Historial de Auditorías por Curso */}
            {showModalHistorial && itemSeleccionado && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 flex flex-col max-h-[85vh]">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Historial de Auditorías del Curso</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{itemSeleccionado.curso_nombre} — {itemSeleccionado.docente_nombre} (Sección {itemSeleccionado.seccion_nombre})</p>
                            </div>
                            <button type="button" onClick={() => setShowModalHistorial(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto py-4 space-y-3">
                            {loadingHistorialCurso ? (
                                <div className="py-8 text-center text-xs text-slate-400">Cargando actas...</div>
                            ) : historialCurso.length > 0 ? (
                                historialCurso.map((acta) => (
                                    <div key={acta.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono font-bold text-slate-700">📅 {acta.fecha}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900">Nota: {parseFloat(acta.puntaje).toFixed(1)}</span>
                                                {getBadgeEstado(acta.estado)}
                                            </div>
                                        </div>
                                        <div className="text-slate-600"><strong>Supervisor:</strong> {acta.supervisor}</div>
                                        <p className="text-slate-500 bg-white p-2.5 rounded-lg border border-slate-100">{acta.observaciones}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center text-slate-400 text-xs">No hay auditorías registradas para este curso.</div>
                            )}
                        </div>

                        <div className="pt-3 border-t border-slate-200 flex justify-end">
                            <button type="button" onClick={() => setShowModalHistorial(false)} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}