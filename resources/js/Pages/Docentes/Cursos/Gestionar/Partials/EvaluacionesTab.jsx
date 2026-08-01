import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function EvaluacionesTab({ curso, seccion, periodo }) {
    const [evaluaciones, setEvaluaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Estados para Formulario Crear/Editar
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedId, setSelectedId] = useState(null);

    // Estados para el Modal de Resultados / Calificaciones
    const [showNotasModal, setShowNotasModal] = useState(false);
    const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState(null);
    const [resultados, setResultados] = useState([]);
    const [loadingNotas, setLoadingNotas] = useState(false);

    const initialFormState = {
        nombre: '',
        fecha_inicio: '',
        hora_inicio: '08:00',
        fecha_fin: '',
        hora_fin: '23:59',
        preguntas: [
            {
                texto: '',
                tipo: 'opcion',
                puntaje: 5,
                opciones: [
                    { texto: '', es_correcta: true },
                    { texto: '', es_correcta: false }
                ]
            }
        ]
    };
    const [form, setForm] = useState(initialFormState);

    useEffect(() => {
        if (curso?.id) {
            fetchEvaluaciones();
        }
    }, [curso?.id, seccion?.id, periodo?.id]);

    const fetchEvaluaciones = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/evaluaciones', {
                params: {
                    curso_id: curso?.id,
                    seccion_id: seccion?.id,
                    periodo_id: periodo?.id
                }
            });
            setEvaluaciones(response.data);
        } catch (error) {
            console.error("Error al cargar evaluaciones:", error);
        } finally {
            setLoading(false);
        }
    };

    // Función para abrir modal y consultar las notas de los alumnos
    const handleVerNotas = async (evaluacion) => {
        setEvaluacionSeleccionada(evaluacion);
        setShowNotasModal(true);
        setLoadingNotas(true);

        try {
            const response = await axios.get(`/evaluaciones/${evaluacion.id_evaluacion}/resultados`);
            setResultados(response.data);
        } catch (error) {
            console.error("Error al cargar notas:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error al consultar notas',
                text: error.response?.data?.message || 'No se pudieron obtener las calificaciones de esta evaluación.',
                customClass: { popup: 'rounded-2xl' }
            });
            setResultados([]);
        } finally {
            setLoadingNotas(false);
        }
    };

    const formatDateOnly = (dateStr) => {
        if (!dateStr) return '';
        return dateStr.split('T')[0];
    };

    const formatTimeOnly = (timeStr) => {
        if (!timeStr) return '';
        return timeStr.substring(0, 5);
    };

    const handleOpenCreateModal = () => {
        setForm(initialFormState);
        setModalMode('create');
        setSelectedId(null);
        setShowModal(true);
    };

    const handleOpenEditModal = (evaluacion) => {
        setModalMode('edit');
        setSelectedId(evaluacion.id_evaluacion);

        const preguntasFormateadas = (evaluacion.preguntas || []).map(p => ({
            texto: p.pregunta,
            tipo: p.tipo,
            puntaje: p.puntaje ?? 5,
            opciones: (p.opciones || []).map(o => ({
                texto: o.opcion,
                es_correcta: Boolean(o.es_correcta)
            }))
        }));

        setForm({
            nombre: evaluacion.nombre,
            fecha_inicio: formatDateOnly(evaluacion.fecha_inicio),
            hora_inicio: formatTimeOnly(evaluacion.hora_inicio),
            fecha_fin: formatDateOnly(evaluacion.fecha_fin),
            hora_fin: formatTimeOnly(evaluacion.hora_fin),
            preguntas: preguntasFormateadas.length > 0 ? preguntasFormateadas : initialFormState.preguntas
        });

        setShowModal(true);
    };

    const handleFormChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleAddPregunta = () => {
        setForm({
            ...form,
            preguntas: [
                ...form.preguntas,
                {
                    texto: '',
                    tipo: 'opcion',
                    puntaje: 5,
                    opciones: [
                        { texto: '', es_correcta: true },
                        { texto: '', es_correcta: false }
                    ]
                }
            ]
        });
    };

    const handleRemovePregunta = (pIndex) => {
        if (form.preguntas.length === 1) return;
        setForm({ ...form, preguntas: form.preguntas.filter((_, idx) => idx !== pIndex) });
    };

    const handlePreguntaChange = (pIndex, field, value) => {
        const newPreguntas = [...form.preguntas];
        newPreguntas[pIndex][field] = value;

        if (field === 'tipo' && value === 'v_f') {
            newPreguntas[pIndex].opciones = [
                { texto: 'Verdadero', es_correcta: true },
                { texto: 'Falso', es_correcta: false }
            ];
        } else if (field === 'tipo' && value === 'corta') {
            newPreguntas[pIndex].opciones = [];
        }

        setForm({ ...form, preguntas: newPreguntas });
    };

    const handleAddOpcion = (pIndex) => {
        const newPreguntas = [...form.preguntas];
        newPreguntas[pIndex].opciones.push({ texto: '', es_correcta: false });
        setForm({ ...form, preguntas: newPreguntas });
    };

    const handleRemoveOpcion = (pIndex, oIndex) => {
        const newPreguntas = [...form.preguntas];
        newPreguntas[pIndex].opciones = newPreguntas[pIndex].opciones.filter((_, idx) => idx !== oIndex);
        setForm({ ...form, preguntas: newPreguntas });
    };

    const handleOpcionChange = (pIndex, oIndex, field, value) => {
        const newPreguntas = [...form.preguntas];
        if (field === 'es_correcta') {
            newPreguntas[pIndex].opciones.forEach((op, idx) => {
                op.es_correcta = idx === oIndex;
            });
        } else {
            newPreguntas[pIndex].opciones[oIndex][field] = value;
        }
        setForm({ ...form, preguntas: newPreguntas });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        Swal.fire({
            title: modalMode === 'create' ? 'Guardando...' : 'Actualizando...',
            text: 'Por favor espere.',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        try {
            const payload = { 
                ...form, 
                curso_id: curso?.id,
                seccion_id: seccion?.id,
                periodo_id: periodo?.id
            };
            
            if (modalMode === 'create') {
                await axios.post('/evaluaciones', payload);
            } else {
                await axios.put(`/evaluaciones/${selectedId}`, payload);
            }

            setShowModal(false);
            fetchEvaluaciones();

            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: modalMode === 'create' ? 'Evaluación creada.' : 'Evaluación actualizada correctamente.',
                timer: 1800,
                showConfirmButton: false,
                customClass: { popup: 'rounded-2xl' }
            });
        } catch (error) {
            console.error("Error al guardar evaluación:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Error al procesar la solicitud.',
                confirmButtonColor: '#1f3c88',
                customClass: { popup: 'rounded-2xl' }
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (evaluacion) => {
        Swal.fire({
            title: '¿Eliminar Evaluación?',
            html: `Estás a punto de eliminar <strong>"${evaluacion.nombre}"</strong>.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
            customClass: { popup: 'rounded-2xl' }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`/evaluaciones/${evaluacion.id_evaluacion}`);
                    setEvaluaciones(prev => prev.filter(e => e.id_evaluacion !== evaluacion.id_evaluacion));
                    Swal.fire({
                        icon: 'success',
                        title: '¡Eliminado!',
                        timer: 1500,
                        showConfirmButton: false,
                        customClass: { popup: 'rounded-2xl' }
                    });
                } catch (error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'No se pudo eliminar la evaluación.',
                        confirmButtonColor: '#1f3c88',
                        customClass: { popup: 'rounded-2xl' }
                    });
                }
            }
        });
    };

    const getEstadoBadge = (fechaInicio, horaInicio, fechaFin, horaFin) => {
        const ahora = new Date();

        const fInicioStr = `${formatDateOnly(fechaInicio)}T${formatTimeOnly(horaInicio)}:00`;
        const fFinStr = `${formatDateOnly(fechaFin)}T${formatTimeOnly(horaFin)}:00`;

        const inicio = new Date(fInicioStr);
        const fin = new Date(fFinStr);

        if (ahora < inicio) {
            return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Pendiente</span>;
        } else if (ahora >= inicio && ahora <= fin) {
            return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">En Curso</span>;
        } else {
            return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">Finalizada</span>;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                    <h2 className="text-base font-bold text-slate-900">Gestión de Evaluaciones</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Cree exámenes, cuestionarios y gestione las calificaciones automáticas para este curso.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="bg-[#1f3c88] hover:bg-[#19306e] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                    <span>+ Nueva Evaluación</span>
                </button>
            </div>

            {loading ? (
                <div className="py-12 text-center text-xs text-slate-500 font-medium flex justify-center items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1f3c88]"></span>
                    Cargando evaluaciones...
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                                <tr>
                                    <th className="py-3 px-4 w-12 text-center">N°</th>
                                    <th className="py-3 px-4">Evaluación</th>
                                    <th className="py-3 px-4 text-center">Preguntas</th>
                                    <th className="py-3 px-4">Inicio</th>
                                    <th className="py-3 px-4">Fin</th>
                                    <th className="py-3 px-4 text-center">Estado</th>
                                    <th className="py-3 px-4 text-center w-48">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {evaluaciones.length > 0 ? (
                                    evaluaciones.map((evaluacion, index) => (
                                        <tr key={evaluacion.id_evaluacion} className="hover:bg-slate-50/80 transition">
                                            <td className="py-3 px-4 text-center font-bold text-slate-400">{index + 1}</td>
                                            <td className="py-3 px-4">
                                                <div className="font-bold text-slate-800">{evaluacion.nombre}</div>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-semibold text-[11px]">
                                                    {evaluacion.preguntas_count ?? evaluacion.preguntas?.length ?? 0} preguntas
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-600">
                                                <div className="font-medium text-slate-800">{formatDateOnly(evaluacion.fecha_inicio)}</div>
                                                <div className="text-[10px] text-slate-400">{formatTimeOnly(evaluacion.hora_inicio)}</div>
                                            </td>
                                            <td className="py-3 px-4 text-slate-600">
                                                <div className="font-medium text-slate-800">{formatDateOnly(evaluacion.fecha_fin)}</div>
                                                <div className="text-[10px] text-slate-400">{formatTimeOnly(evaluacion.hora_fin)}</div>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {getEstadoBadge(evaluacion.fecha_inicio, evaluacion.hora_inicio, evaluacion.fecha_fin, evaluacion.hora_fin)}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {/* Botón Ver Notas/Resultados */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleVerNotas(evaluacion)}
                                                        className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                                                        title="Ver Calificaciones de los Estudiantes"
                                                    >
                                                        📊 Notas
                                                    </button>

                                                    {/* Botón Editar */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEditModal(evaluacion)}
                                                        className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-semibold transition cursor-pointer"
                                                        title="Editar Evaluación"
                                                    >
                                                        Editar
                                                    </button>

                                                    {/* Botón Eliminar */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(evaluacion)}
                                                        className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold transition cursor-pointer"
                                                        title="Eliminar Evaluación"
                                                    >
                                                        Borrar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="py-10 text-center text-slate-400">
                                            No hay evaluaciones registradas para este curso.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL RESULTADOS / NOTAS */}
            {showNotasModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">
                                    Calificaciones: {evaluacionSeleccionada?.nombre}
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Reporte oficial de respuestas de la sección. Total de estudiantes: <strong>{resultados.length}</strong>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowNotasModal(false)}
                                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto py-4">
                            {loadingNotas ? (
                                <div className="py-12 text-center text-xs text-slate-500 font-medium flex justify-center items-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1f3c88]"></span>
                                    Cargando listado de notas...
                                </div>
                            ) : resultados.length > 0 ? (
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                                            <tr>
                                                <th className="py-2.5 px-3 w-10 text-center">N°</th>
                                                <th className="py-2.5 px-3">Código</th>
                                                <th className="py-2.5 px-3">Estudiante</th>
                                                <th className="py-2.5 px-3 text-center">Aciertos</th>
                                                <th className="py-2.5 px-3 text-center">Nota Final</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-700">
                                            {resultados.map((res, i) => {
                                                const puntaje = parseFloat(res.puntaje_total || 0);
                                                return (
                                                    <tr key={res.estudiante_id || i} className="hover:bg-slate-50 transition">
                                                        <td className="py-2.5 px-3 text-center font-bold text-slate-400">{i + 1}</td>
                                                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{res.codigo || 'S/N'}</td>
                                                        <td className="py-2.5 px-3 font-bold text-slate-800">
                                                            {res.estudiante_nombre || res.nombre_completo || 'Sin Nombre'}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                                                            {res.respuestas_correctas ?? 0} / {res.total_preguntas ?? evaluacionSeleccionada?.preguntas_count ?? 0}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-center">
                                                            <span className={`px-2.5 py-1 rounded-md font-bold text-xs inline-block min-w-[60px] ${
                                                                puntaje >= 10.5 
                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                            }`}>
                                                                {puntaje.toFixed(1)} pts
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-400 text-xs">
                                    No hay estudiantes matriculados o con resultados para esta evaluación.
                                </div>
                            )}
                        </div>

                        <div className="pt-3 border-t border-slate-200 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowNotasModal(false)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CREAR / EDITAR */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col my-8">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <h3 className="text-sm font-bold text-slate-900">
                                {modalMode === 'create' ? 'Nueva Evaluación' : 'Editar Evaluación'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Título de la Evaluación *</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    required
                                    value={form.nombre}
                                    onChange={handleFormChange}
                                    placeholder="Ej. Examen Parcial I"
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1f3c88]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Inicio *</label>
                                    <input
                                        type="date"
                                        name="fecha_inicio"
                                        required
                                        value={form.fecha_inicio}
                                        onChange={handleFormChange}
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1f3c88]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Hora Inicio *</label>
                                    <input
                                        type="time"
                                        name="hora_inicio"
                                        required
                                        value={form.hora_inicio}
                                        onChange={handleFormChange}
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1f3c88]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Fin *</label>
                                    <input
                                        type="date"
                                        name="fecha_fin"
                                        required
                                        value={form.fecha_fin}
                                        onChange={handleFormChange}
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1f3c88]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Hora Fin *</label>
                                    <input
                                        type="time"
                                        name="hora_fin"
                                        required
                                        value={form.hora_fin}
                                        onChange={handleFormChange}
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1f3c88]"
                                    />
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Preguntas ({form.preguntas.length})</h4>
                                        <span className="text-[11px] font-bold text-emerald-600">
                                            Puntaje Total: {form.preguntas.reduce((acc, curr) => acc + (parseFloat(curr.puntaje) || 0), 0)} pts
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddPregunta}
                                        className="text-[11px] font-bold text-[#1f3c88] hover:underline cursor-pointer"
                                    >
                                        + Agregar Pregunta
                                    </button>
                                </div>

                                {form.preguntas.map((pregunta, pIndex) => (
                                    <div key={pIndex} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-bold text-slate-700">Pregunta #{pIndex + 1}</span>
                                            {form.preguntas.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePregunta(pIndex)}
                                                    className="text-rose-600 text-xs font-bold hover:underline cursor-pointer"
                                                >
                                                    Eliminar
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-12 gap-2">
                                            <div className="col-span-6">
                                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Enunciado</label>
                                                <input
                                                    type="text"
                                                    placeholder="Escriba el enunciado..."
                                                    required
                                                    value={pregunta.texto}
                                                    onChange={(e) => handlePreguntaChange(pIndex, 'texto', e.target.value)}
                                                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-[#1f3c88]"
                                                />
                                            </div>

                                            <div className="col-span-4">
                                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Tipo</label>
                                                <select
                                                    value={pregunta.tipo}
                                                    onChange={(e) => handlePreguntaChange(pIndex, 'tipo', e.target.value)}
                                                    className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none"
                                                >
                                                    <option value="opcion">Opción Múltiple</option>
                                                    <option value="v_f">Verdadero / Falso</option>
                                                    <option value="corta">Pregunta Corta</option>
                                                </select>
                                            </div>

                                            <div className="col-span-2">
                                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Puntos</label>
                                                <input
                                                    type="number"
                                                    min="0.5"
                                                    step="0.5"
                                                    required
                                                    value={pregunta.puntaje}
                                                    onChange={(e) => handlePreguntaChange(pIndex, 'puntaje', parseFloat(e.target.value) || 0)}
                                                    className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-center focus:outline-none focus:border-[#1f3c88]"
                                                />
                                            </div>
                                        </div>

                                        {pregunta.tipo !== 'corta' && (
                                            <div className="pl-2 space-y-2 border-l-2 border-slate-200 mt-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-semibold text-slate-500">Opciones (Marca la respuesta correcta):</span>
                                                    {pregunta.tipo === 'opcion' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddOpcion(pIndex)}
                                                            className="text-[10px] font-bold text-[#1f3c88] hover:underline cursor-pointer"
                                                        >
                                                            + Opción
                                                        </button>
                                                    )}
                                                </div>

                                                {pregunta.opciones.map((opcion, oIndex) => (
                                                    <div key={oIndex} className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name={`correcta_${pIndex}`}
                                                            checked={opcion.es_correcta}
                                                            onChange={() => handleOpcionChange(pIndex, oIndex, 'es_correcta', true)}
                                                            className="text-[#1f3c88] cursor-pointer"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder={`Opción ${oIndex + 1}`}
                                                            required
                                                            disabled={pregunta.tipo === 'v_f'}
                                                            value={opcion.texto}
                                                            onChange={(e) => handleOpcionChange(pIndex, oIndex, 'texto', e.target.value)}
                                                            className="flex-1 text-xs px-2 py-1 rounded border border-slate-200 bg-white focus:outline-none focus:border-[#1f3c88]"
                                                        />
                                                        {pregunta.tipo === 'opcion' && pregunta.opciones.length > 2 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveOpcion(pIndex, oIndex)}
                                                                className="text-rose-500 text-xs font-bold px-1 cursor-pointer"
                                                            >
                                                                ✕
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 bg-[#1f3c88] hover:bg-[#19306e] text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                                >
                                    {saving ? 'Guardando...' : (modalMode === 'create' ? 'Guardar Evaluación' : 'Actualizar Evaluación')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}