import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function MatriculaIngresantes({
    admisiones = [],
    periodos = [],
    planesEstudio = [],
    turnos = [],
    primerSemestre = null,
}) {
    const [idProceso, setIdProceso] = useState('');
    const [idPeriodo, setIdPeriodo] = useState(periodos[0]?.id ?? '');
    const [idPlan, setIdPlan] = useState('');

    const [ingresantes, setIngresantes] = useState([]);
    const [seccionesDisponibles, setSeccionesDisponibles] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [seleccionados, setSeleccionados] = useState([]);

    const { data, setData, post, processing } = useForm({
        id_proceso: '',
        periodo_id: periodos[0]?.id ?? '',
        plan_estudio_id: '',
        semestre_id: primerSemestre?.id ?? 1,
        seccion_id: '',
        turno_id: turnos[0]?.id ?? '',
        postulantes_ids: [],
    });

    // Petición AJAX limpia con Axios al cambiar cualquiera de los 3 filtros principales
    useEffect(() => {
        if (!idProceso || !idPeriodo || !idPlan) {
            setIngresantes([]);
            setSeccionesDisponibles([]);
            setSeleccionados([]);
            return;
        }

        const cargarDatosIngresantes = async () => {
            setCargando(true);
            try {
                const response = await axios.get(route('matriculas.ingresantes.ajax'), {
                    params: {
                        id_proceso: idProceso,
                        periodo_id: idPeriodo,
                        plan_estudio_id: idPlan,
                    },
                });

                const listaIngresantes = response.data.ingresantes || [];
                const listaSecciones = response.data.secciones || [];

                setIngresantes(listaIngresantes);
                setSeccionesDisponibles(listaSecciones);
                setSeleccionados([]);

                setData((prev) => ({
                    ...prev,
                    id_proceso: idProceso,
                    periodo_id: idPeriodo,
                    plan_estudio_id: idPlan,
                    seccion_id: listaSecciones.length > 0 ? listaSecciones[0].id : '',
                    postulantes_ids: [],
                }));
            } catch (error) {
                console.error('Error al cargar datos vía Axios:', error);
                Swal.fire('Error de conexión', 'No se pudieron consultar los datos de ingresantes.', 'error');
            } finally {
                setCargando(false);
            }
        };

        cargarDatosIngresantes();
    }, [idProceso, idPeriodo, idPlan]);

    const toggleSeleccionarTodo = (e) => {
        if (e.target.checked) {
            const todosHabilitados = ingresantes
                .filter((ing) => !ing.ya_matriculado)
                .map((ing) => ing.postulante_id);
            setSeleccionados(todosHabilitados);
            setData('postulantes_ids', todosHabilitados);
        } else {
            setSeleccionados([]);
            setData('postulantes_ids', []);
        }
    };

    const toggleSeleccionarUno = (id) => {
        let actualizados;
        if (seleccionados.includes(id)) {
            actualizados = seleccionados.filter((i) => i !== id);
        } else {
            actualizados = [...seleccionados, id];
        }
        setSeleccionados(actualizados);
        setData('postulantes_ids', actualizados);
    };

    const procesarMatricula = (e) => {
        e.preventDefault();

        if (!data.seccion_id) {
            Swal.fire('Atención', 'Seleccione la sección de destino con horarios habilitados.', 'warning');
            return;
        }

        if (seleccionados.length === 0) {
            Swal.fire('Atención', 'Seleccione al menos un ingresante para matricular.', 'warning');
            return;
        }

        const seccionNombre = seccionesDisponibles.find((s) => String(s.id) === String(data.seccion_id))?.nombre || '';

        Swal.fire({
            title: '¿Confirmar Matrícula Masiva?',
            text: `Se matriculará a ${seleccionados.length} alumno(s) en la Sección ${seccionNombre} (${primerSemestre?.nombre || '1er Semestre'}), se asignará su horario y se crearán sus usuarios.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#315d7a',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, Matricular Grupo',
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            if (result.isConfirmed) {
                post(route('matriculas.ingresantes.store'), {
                    preserveScroll: true,
                    onStart: () => {
                        Swal.fire({
                            title: 'Generando matrículas y usuarios...',
                            allowOutsideClick: false,
                            didOpen: () => Swal.showLoading(),
                        });
                    },
                    onSuccess: () => {
                        setSeleccionados([]);
                        // Recargar lista vía Axios
                        setIdPlan((prev) => prev); 
                        Swal.fire({
                            title: '¡Matrícula Exitosa!',
                            text: 'Se registraron los alumnos en la sección y se activaron sus cuentas de usuario.',
                            icon: 'success',
                            confirmButtonColor: '#315d7a',
                        });
                    },
                    onError: (err) => {
                        Swal.fire('Error', err.error || 'Verifique la configuración de horarios de la sección.', 'error');
                    },
                });
            }
        });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-slate-900">Matrícula por Grupo de Ingresantes (1er Semestre)</h1>}>
            <Head title="Matrícula Masiva Ingresantes" />

            <div className="w-full space-y-6">
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Inscripción Masiva para I Semestre</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Filtre por Programa de forma asíncrona, seleccione la Sección habilitada y matricule con usuarios automáticos.
                        </p>
                    </div>

                    <Link
                        href={route('matriculas.index')}
                        className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Volver a Matrículas
                    </Link>
                </div>

                {/* FILTROS ASÍNCRONOS */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-2">
                        1. Filtro Asíncrono y Configuración de Sección
                    </h3>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">Proceso Admisión *</label>
                            <select
                                value={idProceso}
                                onChange={(e) => setIdProceso(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#315d7a]"
                            >
                                <option value="">-- Seleccionar --</option>
                                {admisiones.map((a) => (
                                    <option key={a.id_admision} value={a.id_admision}>
                                        {a.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">Periodo Lectivo *</label>
                            <select
                                value={idPeriodo}
                                onChange={(e) => setIdPeriodo(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#315d7a]"
                            >
                                <option value="">-- Seleccionar --</option>
                                {periodos.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">Plan de Estudios *</label>
                            <select
                                value={idPlan}
                                onChange={(e) => setIdPlan(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#315d7a]"
                            >
                                <option value="">-- Seleccionar Plan --</option>
                                {planesEstudio.map((pe) => (
                                    <option key={pe.id} value={pe.id}>
                                        {pe.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-bold text-[#315d7a]">
                                Secciones Habilitadas (1er Semestre) *
                            </label>
                            <select
                                value={data.seccion_id}
                                disabled={seccionesDisponibles.length === 0}
                                onChange={(e) => setData('seccion_id', e.target.value)}
                                className="w-full rounded-lg border-2 border-[#315d7a]/30 bg-sky-50/50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-[#315d7a] disabled:opacity-50"
                            >
                                {seccionesDisponibles.length > 0 ? (
                                    seccionesDisponibles.map((sec) => (
                                        <option key={sec.id} value={sec.id}>
                                            Sección {sec.nombre}
                                        </option>
                                    ))
                                ) : (
                                    <option value="">-- Sin secciones programadas --</option>
                                )}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-bold text-[#315d7a]">Turno *</label>
                            <select
                                value={data.turno_id}
                                onChange={(e) => setData('turno_id', e.target.value)}
                                className="w-full rounded-lg border-2 border-[#315d7a]/30 bg-sky-50/50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-[#315d7a]"
                            >
                                <option value="">-- Opcional / Turno --</option>
                                {turnos.map((tur) => (
                                    <option key={tur.id} value={tur.id}>
                                        {tur.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* TABLA DE INGRESANTES (RENDERIZADA VÍA AXIOS) */}
                {idProceso && idPlan && (
                    <form onSubmit={procesarMatricula} className="space-y-4">
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-800">
                                    Postulantes con Vacante ({ingresantes.length})
                                </h3>
                                <div className="text-xs text-slate-500">
                                    Ciclo oficial a matricular: <strong className="text-[#315d7a]">{primerSemestre?.nombre || 'Semestre I'}</strong>
                                </div>
                            </div>

                            {cargando ? (
                                <div className="p-10 text-center text-sm font-semibold text-[#315d7a]">
                                    Cargando ingresantes y secciones vía Axios...
                                </div>
                            ) : ingresantes.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-slate-600">
                                        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-700">
                                            <tr>
                                                <th className="px-6 py-3 text-center w-12">
                                                    <input
                                                        type="checkbox"
                                                        onChange={toggleSeleccionarTodo}
                                                        checked={
                                                            seleccionados.length > 0 &&
                                                            seleccionados.length === ingresantes.filter((i) => !i.ya_matriculado).length
                                                        }
                                                        className="h-4 w-4 rounded border-slate-300 text-[#315d7a] focus:ring-[#315d7a]"
                                                    />
                                                </th>
                                                <th className="px-6 py-3">Código / DNI</th>
                                                <th className="px-6 py-3">Ingresante</th>
                                                <th className="px-6 py-3 text-center">Nota Admisión</th>
                                                <th className="px-6 py-3 text-center">Estado Matrícula</th>
                                                <th className="px-6 py-3 text-center">Cuenta Usuario</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {ingresantes.map((ing) => {
                                                const estaSeleccionado = seleccionados.includes(ing.postulante_id);
                                                return (
                                                    <tr
                                                        key={ing.postulante_id}
                                                        className={`hover:bg-slate-50 transition ${
                                                            ing.ya_matriculado ? 'bg-slate-50/70 opacity-60' : ''
                                                        }`}
                                                    >
                                                        <td className="px-6 py-3.5 text-center">
                                                            <input
                                                                type="checkbox"
                                                                disabled={ing.ya_matriculado}
                                                                checked={estaSeleccionado}
                                                                onChange={() => toggleSeleccionarUno(ing.postulante_id)}
                                                                className="h-4 w-4 rounded border-slate-300 text-[#315d7a] focus:ring-[#315d7a]"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-900">
                                                            <div>{ing.codigo_postulante || 'S/C'}</div>
                                                            <div className="text-[11px] font-normal text-slate-400">DNI: {ing.dni}</div>
                                                        </td>
                                                        <td className="px-6 py-3.5 font-semibold text-slate-800">
                                                            {ing.apellidos}, {ing.nombres}
                                                        </td>
                                                        <td className="px-6 py-3.5 text-center font-mono font-bold text-[#315d7a]">
                                                            {Number(ing.nota).toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-3.5 text-center">
                                                            {ing.ya_matriculado ? (
                                                                <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                                                                    ✓ Matriculado
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                                                                    Pendiente
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-3.5 text-center">
                                                            {ing.tiene_usuario ? (
                                                                <span className="text-xs text-emerald-700 font-bold">✓ Creado</span>
                                                            ) : (
                                                                <span className="text-xs text-slate-400 italic">Por generar</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-sm text-slate-400 italic">
                                    No se encontraron ingresantes con vacante en el plan de estudio seleccionado.
                                </div>
                            )}
                        </div>

                        {ingresantes.length > 0 && (
                            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                <span className="text-xs font-semibold text-slate-600">
                                    Seleccionados: <strong>{seleccionados.length}</strong> ingresantes pendientes
                                </span>

                                <button
                                    type="submit"
                                    disabled={processing || seleccionados.length === 0 || seccionesDisponibles.length === 0}
                                    className="rounded-lg bg-[#315d7a] px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-[#274b63] disabled:opacity-50 cursor-pointer"
                                >
                                    {processing ? 'Matriculando...' : 'Matricular Selección en Sección Especificada'}
                                </button>
                            </div>
                        )}
                    </form>
                )}
            </div>
        </AuthenticatedLayout>
    );
}