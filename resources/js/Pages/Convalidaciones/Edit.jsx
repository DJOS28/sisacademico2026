import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function Edit({ convalidacion, estudiantes, periodos }) {
    const { data, setData, put, processing, errors } = useForm({
        estudiante_id: convalidacion.estudiante_id || '',
        periodo_id: convalidacion.periodo_id || '',
        curso_destino_id: convalidacion.curso_destino_id || '',
        institucion_origen: convalidacion.institucion_origen || '',
        curso_origen: convalidacion.curso_origen || '',
        nota_origen: convalidacion.nota_origen || '',
        fecha_convalidacion: convalidacion.fecha_convalidacion || '',
        estado: convalidacion.estado || 'Pendiente',
        observaciones: convalidacion.observaciones || '',
    });

    const [cursosMatriculados, setCursosMatriculados] = useState([]);
    const [cargandoCursos, setCargandoCursos] = useState(false);
    const [mensajeMatricula, setMensajeMatricula] = useState('');

    /**
     * Carga los cursos en los que está matriculado el estudiante para el periodo.
     */
    const cargarCursosEstudiante = async (estudianteId, periodoId) => {
        if (!estudianteId || !periodoId) {
            setCursosMatriculados([]);
            setMensajeMatricula('');
            return;
        }

        setCargandoCursos(true);
        setMensajeMatricula('');
        try {
            const res = await axios.get(route('convalidaciones.cursos_matriculados'), {
                params: {
                    estudiante_id: estudianteId,
                    periodo_id: periodoId,
                },
            });

            if (res.data.registrado) {
                setCursosMatriculados(res.data.cursos);
            } else {
                setCursosMatriculados([]);
                setMensajeMatricula(res.data.mensaje);
            }
        } catch (error) {
            console.error('Error al consultar cursos:', error);
        } finally {
            setCargandoCursos(false);
        }
    };

    // Cargar los cursos al montar la vista
    useEffect(() => {
        if (data.estudiante_id && data.periodo_id) {
            cargarCursosEstudiante(data.estudiante_id, data.periodo_id);
        }
    }, []);

    const handleEstudianteChange = (e) => {
        const estId = e.target.value;
        setData('estudiante_id', estId);
        setData('curso_destino_id', '');
        cargarCursosEstudiante(estId, data.periodo_id);
    };

    const handlePeriodoChange = (e) => {
        const perId = e.target.value;
        setData('periodo_id', perId);
        setData('curso_destino_id', '');
        cargarCursosEstudiante(data.estudiante_id, perId);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        put(route('convalidaciones.update', convalidacion.id), {
            onSuccess: () => {
                Swal.fire({
                    title: '¡Actualizado!',
                    text: 'El expediente de convalidación fue actualizado correctamente.',
                    icon: 'success',
                    timer: 1800,
                    showConfirmButton: false,
                });
            },
            onError: (err) => {
                Swal.fire({
                    title: 'Error al actualizar',
                    text: err?.error || 'Verifique los campos ingresados.',
                    icon: 'error',
                    confirmButtonText: 'Aceptar',
                });
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Editar Convalidación Académica
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Modificación de información de origen, notas y resolución.
                        </p>
                    </div>

                    <Link
                        href={route('convalidaciones.index')}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                        &larr; Volver
                    </Link>
                </div>
            }
        >
            <Head title={`Editar Convalidación #${convalidacion.id}`} />

            <div className="max-w-4xl mx-auto">
                <form
                    onSubmit={handleSubmit}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* ESTUDIANTE */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Estudiante *
                            </label>
                            <select
                                required
                                value={data.estudiante_id}
                                onChange={handleEstudianteChange}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                            >
                                <option value="">-- Seleccionar Estudiante --</option>
                                {estudiantes?.map((est) => (
                                    <option key={est.id_postulante} value={est.id_postulante}>
                                        {est.apellidos}, {est.nombres} ({est.dni})
                                    </option>
                                ))}
                            </select>
                            {errors.estudiante_id && (
                                <p className="text-xs text-rose-600 mt-1">{errors.estudiante_id}</p>
                            )}
                        </div>

                        {/* PERIODO LECTIVO */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Periodo Lectivo *
                            </label>
                            <select
                                required
                                value={data.periodo_id}
                                onChange={handlePeriodoChange}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                            >
                                <option value="">-- Seleccionar Periodo --</option>
                                {periodos?.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.nombre}
                                    </option>
                                ))}
                            </select>
                            {errors.periodo_id && (
                                <p className="text-xs text-rose-600 mt-1">{errors.periodo_id}</p>
                            )}
                        </div>
                    </div>

                    {/* CURSO DESTINO */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Asignatura a Convalidar (Curso Destino) *
                        </label>
                        <select
                            required
                            disabled={cargandoCursos || cursosMatriculados.length === 0}
                            value={data.curso_destino_id}
                            onChange={(e) => setData('curso_destino_id', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20 disabled:bg-slate-100"
                        >
                            <option value="">
                                {cargandoCursos
                                    ? 'Cargando asignaturas...'
                                    : '-- Seleccionar Curso de la Matrícula --'}
                            </option>
                            {cursosMatriculados.map((c) => (
                                <option key={c.curso_id} value={c.curso_id}>
                                    {c.nombre} [{c.estado}]
                                </option>
                            ))}
                        </select>
                        {mensajeMatricula && (
                            <p className="text-xs font-semibold text-amber-600 mt-1">
                                {mensajeMatricula}
                            </p>
                        )}
                        {errors.curso_destino_id && (
                            <p className="text-xs text-rose-600 mt-1">{errors.curso_destino_id}</p>
                        )}
                    </div>

                    <hr className="border-slate-100" />

                    {/* DATOS DE ORIGEN */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Institución / Universidad de Origen *
                            </label>
                            <input
                                type="text"
                                required
                                value={data.institucion_origen}
                                onChange={(e) => setData('institucion_origen', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                            />
                            {errors.institucion_origen && (
                                <p className="text-xs text-rose-600 mt-1">{errors.institucion_origen}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Nombre del Curso de Origen *
                            </label>
                            <input
                                type="text"
                                required
                                value={data.curso_origen}
                                onChange={(e) => setData('curso_origen', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                            />
                            {errors.curso_origen && (
                                <p className="text-xs text-rose-600 mt-1">{errors.curso_origen}</p>
                            )}
                        </div>
                    </div>

                    {/* NOTA, FECHA Y ESTADO */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Nota de Origen (0 - 20) *
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="20"
                                required
                                value={data.nota_origen}
                                onChange={(e) => setData('nota_origen', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                            />
                            {errors.nota_origen && (
                                <p className="text-xs text-rose-600 mt-1">{errors.nota_origen}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Fecha de Convalidación *
                            </label>
                            <input
                                type="date"
                                required
                                value={data.fecha_convalidacion}
                                onChange={(e) => setData('fecha_convalidacion', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                            />
                            {errors.fecha_convalidacion && (
                                <p className="text-xs text-rose-600 mt-1">{errors.fecha_convalidacion}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Estado del Expediente *
                            </label>
                            <select
                                value={data.estado}
                                onChange={(e) => setData('estado', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                            >
                                <option value="Pendiente">Pendiente</option>
                                <option value="Aprobado">Aprobado</option>
                                <option value="Rechazado">Rechazado</option>
                            </select>
                            {errors.estado && (
                                <p className="text-xs text-rose-600 mt-1">{errors.estado}</p>
                            )}
                        </div>
                    </div>

                    {/* OBSERVACIONES */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Observaciones / Sustento Técnico
                        </label>
                        <textarea
                            rows="3"
                            value={data.observaciones}
                            onChange={(e) => setData('observaciones', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                        />
                    </div>

                    {/* ACCIONES */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <Link
                            href={route('convalidaciones.index')}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-5 py-2.5 text-xs font-semibold text-white bg-[#315d7a] hover:bg-[#274b63] rounded-lg shadow transition disabled:opacity-50"
                        >
                            {processing ? 'Actualizando...' : 'Actualizar Convalidación'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}