import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function Create({ periodoActivo }) {
    const [dniBusqueda, setDniBusqueda] = useState('');
    const [buscando, setBuscando] = useState(false);
    const [estudianteInfo, setEstudianteInfo] = useState(null);
    const [cursosMatriculados, setCursosMatriculados] = useState([]);
    const [mensajeMatricula, setMensajeMatricula] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        estudiante_id: '',
        periodo_id: periodoActivo?.id || '',
        curso_destino_id: '',
        institucion_origen: '',
        curso_origen: '',
        nota_origen: '',
        fecha_convalidacion: new Date().toISOString().split('T')[0],
        estado: 'Pendiente',
        observaciones: '',
    });

    /**
     * Búsqueda por DNI y consulta de carga académica en el periodo activo.
     */
    const buscarEstudiante = async (e) => {
        if (e) e.preventDefault();

        if (!dniBusqueda.trim()) {
            Swal.fire({
                title: 'Atención',
                text: 'Ingrese un número de DNI para realizar la búsqueda.',
                icon: 'warning',
                confirmButtonColor: '#315d7a',
            });
            return;
        }

        if (!periodoActivo) {
            Swal.fire({
                title: 'Error de Configuración',
                text: 'No existe un periodo lectivo activo registrado en el sistema.',
                icon: 'error',
                confirmButtonColor: '#315d7a',
            });
            return;
        }

        setBuscando(true);
        setEstudianteInfo(null);
        setCursosMatriculados([]);
        setMensajeMatricula('');
        setData('estudiante_id', '');
        setData('curso_destino_id', '');

        try {
            const res = await axios.get(route('convalidaciones.buscar_estudiante_matricula'), {
                params: {
                    dni: dniBusqueda.trim(),
                    periodo_id: periodoActivo.id,
                },
            });

            if (!res.data.encontrado) {
                setMensajeMatricula(res.data.mensaje);
                Swal.fire({
                    title: 'Estudiante No Encontrado',
                    text: res.data.mensaje,
                    icon: 'info',
                    confirmButtonColor: '#315d7a',
                });
                return;
            }

            setEstudianteInfo(res.data.estudiante);
            setData('estudiante_id', res.data.estudiante.id_postulante);

            if (!res.data.matriculado) {
                setMensajeMatricula(res.data.mensaje);
            } else {
                setCursosMatriculados(res.data.cursos);
            }
        } catch (error) {
            console.error('Error al consultar estudiante:', error);
            Swal.fire({
                title: 'Error de Servidor',
                text: 'No se pudo consultar la información del estudiante.',
                icon: 'error',
                confirmButtonColor: '#315d7a',
            });
        } finally {
            setBuscando(false);
        }
    };

    /**
     * Envío del expediente de convalidación.
     */
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!data.estudiante_id) {
            Swal.fire({
                title: 'Estudiante Requerido',
                text: 'Primero debe buscar y validar a un estudiante mediante su DNI.',
                icon: 'warning',
                confirmButtonColor: '#315d7a',
            });
            return;
        }

        if (!data.curso_destino_id) {
            Swal.fire({
                title: 'Seleccione un Curso',
                text: 'Debe hacer clic sobre una de las tarjetas de asignaturas a convalidar.',
                icon: 'warning',
                confirmButtonColor: '#315d7a',
            });
            return;
        }

        post(route('convalidaciones.store'), {
            onSuccess: () => {
                Swal.fire({
                    title: '¡Expediente Guardado!',
                    text: 'El registro de convalidación fue procesado con éxito.',
                    icon: 'success',
                    timer: 1800,
                    showConfirmButton: false,
                });
            },
            onError: (err) => {
                Swal.fire({
                    title: 'Error de Validación',
                    text: err?.error || 'Por favor, revise los campos ingresados.',
                    icon: 'error',
                    confirmButtonColor: '#315d7a',
                });
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Registrar Expediente de Convalidación
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Búsqueda directa por DNI y selección interactiva de asignatura.
                        </p>
                    </div>

                    <Link
                        href={route('convalidaciones.index')}
                        className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                        &larr; Volver
                    </Link>
                </div>
            }
        >
            <Head title="Crear Convalidación" />

            <div className="w-full space-y-6">
                {/* PASO 1: BÚSQUEDA DEL ESTUDIANTE */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">
                        1. Localización de Estudiante y Matrícula Activa
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        {/* INPUT BÚSQUEDA DNI */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Ingrese el DNI del Estudiante *
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={dniBusqueda}
                                    onChange={(e) => setDniBusqueda(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && buscarEstudiante(e)}
                                    placeholder="Ej. 60215821"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                />
                                <button
                                    type="button"
                                    onClick={buscarEstudiante}
                                    disabled={buscando}
                                    className="inline-flex items-center justify-center rounded-lg bg-[#315d7a] px-4 py-2.5 text-xs font-semibold text-white shadow transition hover:bg-[#274b63] disabled:opacity-50"
                                >
                                    {buscando ? 'Buscando...' : 'Buscar DNI'}
                                </button>
                            </div>
                        </div>

                        {/* PERIODO LECTIVO ACTIVO */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Periodo Lectivo Activo
                            </label>
                            <input
                                type="text"
                                disabled
                                value={periodoActivo ? periodoActivo.nombre : 'Sin periodo activo'}
                                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm font-bold text-slate-700 cursor-not-allowed"
                            />
                        </div>

                        {/* DATOS DEL ESTUDIANTE ENCONTRADO */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Estudiante Identificado
                            </label>
                            <input
                                type="text"
                                disabled
                                value={
                                    estudianteInfo
                                        ? `${estudianteInfo.apellidos}, ${estudianteInfo.nombres}`
                                        : 'Aún no localizado'
                                }
                                className={`w-full rounded-lg border px-3 py-2.5 text-sm font-bold transition ${
                                    estudianteInfo
                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                        : 'border-slate-200 bg-slate-50 text-slate-400'
                                }`}
                            />
                        </div>
                    </div>

                    {/* ALERTA DE MATRÍCULA NO REGISTRADA */}
                    {mensajeMatricula && (
                        <div className="mt-4 p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
                            <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>{mensajeMatricula}</span>
                        </div>
                    )}
                </div>

                {/* PASO 2: SELECCIÓN DE ASIGNATURA Y DATOS DE CONVALIDACIÓN */}
                <form
                    onSubmit={handleSubmit}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6"
                >
                    <div>
                        <h2 className="text-base font-bold text-slate-800 border-b pb-2 mb-3">
                            2. Seleccione la Asignatura a Convalidar (Curso Destino) *
                        </h2>

                        {/* VISTA EN TARJETAS / CARDS */}
                        {cursosMatriculados.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                                {cursosMatriculados.map((c) => {
                                    const seleccionado = String(data.curso_destino_id) === String(c.curso_id);

                                    return (
                                        <div
                                            key={c.curso_id}
                                            onClick={() => setData('curso_destino_id', c.curso_id)}
                                            className={`relative cursor-pointer rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between ${
                                                seleccionado
                                                    ? 'border-[#315d7a] bg-[#315d7a]/5 ring-2 ring-[#315d7a] shadow-md'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="font-semibold text-slate-800 text-sm leading-snug">
                                                    {c.nombre}
                                                </div>

                                                {/* CHECK DE SELECCIÓN */}
                                                <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition ${
                                                    seleccionado
                                                        ? 'border-[#315d7a] bg-[#315d7a] text-white'
                                                        : 'border-slate-300 bg-white'
                                                }`}>
                                                    {seleccionado && (
                                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between text-xs">
                                                <span className="text-slate-400">Estado en Carga:</span>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                                                    c.estado === 'Convalidado' ? 'bg-indigo-100 text-indigo-800' :
                                                    c.estado === 'Repitencia' ? 'bg-rose-100 text-rose-800' :
                                                    'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {c.estado || 'Inscrito'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400 bg-slate-50/50">
                                <p className="text-sm font-semibold">No hay asignaturas disponibles para mostrar.</p>
                                <p className="text-xs mt-1">Busque al estudiante por DNI en la sección superior para cargar sus cursos matriculados.</p>
                            </div>
                        )}

                        {errors.curso_destino_id && (
                            <p className="text-xs text-rose-600 mt-2 font-semibold">{errors.curso_destino_id}</p>
                        )}
                    </div>

                    <h2 className="text-base font-bold text-slate-800 border-b pb-2 pt-2">
                        3. Antecedentes y Datos de Origen
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* INSTITUCIÓN Y CURSO DE ORIGEN */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Institución / Universidad de Origen *
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Ej. Universidad Nacional de Trujillo"
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
                                placeholder="Ej. Matemática Básica I"
                                value={data.curso_origen}
                                onChange={(e) => setData('curso_origen', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                            />
                            {errors.curso_origen && (
                                <p className="text-xs text-rose-600 mt-1">{errors.curso_origen}</p>
                            )}
                        </div>

                        {/* NOTA, FECHA Y ESTADO INICIAL */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2">
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
                                    placeholder="Ej. 16.0"
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
                                    <p className="text-xs text-rose-600 mt-1">
                                        {errors.fecha_convalidacion}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Estado Inicial *
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
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Observaciones / Sustento Técnico
                            </label>
                            <textarea
                                rows="3"
                                placeholder="Resolución directoral de convalidación o número de informe técnico..."
                                value={data.observaciones}
                                onChange={(e) => setData('observaciones', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                            />
                        </div>
                    </div>

                    {/* BOTONES DE ACCIÓN */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <Link
                            href={route('convalidaciones.index')}
                            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={processing || !data.estudiante_id || !data.curso_destino_id}
                            className="px-6 py-2.5 text-xs font-semibold text-white bg-[#315d7a] hover:bg-[#274b63] rounded-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Guardando...' : 'Registrar Convalidación'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}