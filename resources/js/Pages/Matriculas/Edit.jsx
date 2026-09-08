import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useEffect, useMemo, useState } from 'react';

// Conversor auxiliar por si los nombres vienen en números romanos (I, II, III...)
const parseCicloNumero = (semestre) => {
    if (!semestre) return 0;
    if (semestre.orden !== undefined && semestre.orden !== null) return Number(semestre.orden);
    if (semestre.numero !== undefined && semestre.numero !== null) return Number(semestre.numero);
    
    const mapa = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10 };
    const cleanStr = String(semestre.nombre || semestre).trim().toUpperCase();
    return mapa[cleanStr] || Number(semestre.id) || 0;
};

export default function Edit({
    matricula,
    planes = [],
    periodos = [],
    semestres = [],
    estados = [],
    ofertaAcademicas: ofertaInicial = [],
    cursosActuales = [],
}) {
    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        plan_estudio_id: matricula?.plan_estudio_id ?? '',
        periodo_id: matricula?.periodo_id ?? '',
        semestre_id: matricula?.semestre_id ?? '',
        estado: matricula?.estado ?? 'Matriculado',
        fecha_matricula: matricula?.fecha_matricula ? matricula.fecha_matricula.split('T')[0] : '',
        cursos_seleccionados: cursosActuales ?? [],
    });

    // Estado para explorar asignaturas por ciclo
    const [semestreExplorador, setSemestreExplorador] = useState(matricula?.semestre_id ?? '');
    const [ofertaAcademicas, setOfertaAcademicas] = useState(ofertaInicial);
    const [cargandoHorarios, setCargandoHorarios] = useState(false);

    // Objeto del semestre oficial elegido
    const semestrePrincipalObj = useMemo(() => {
        return semestres.find(s => String(s.id) === String(data.semestre_id));
    }, [data.semestre_id, semestres]);

    // Filtrar para ver únicamente el ciclo oficial y los ciclos inferiores
    const semestresDisponiblesExplorador = useMemo(() => {
        if (!semestrePrincipalObj) return semestres;
        const ordenLimite = parseCicloNumero(semestrePrincipalObj);
        return semestres.filter(s => parseCicloNumero(s) <= ordenLimite);
    }, [semestrePrincipalObj, semestres]);

    // Carga asíncrona al cambiar el ciclo del explorador, periodo o plan
    useEffect(() => {
        if (!data.periodo_id || !semestreExplorador || !data.plan_estudio_id) {
            setOfertaAcademicas([]);
            return;
        }

        // Si es el estado inicial exacto
        if (
            String(data.periodo_id) === String(matricula.periodo_id) && 
            String(semestreExplorador) === String(matricula.semestre_id) &&
            String(data.plan_estudio_id) === String(matricula.plan_estudio_id)
        ) {
            setOfertaAcademicas(ofertaInicial);
            return;
        }

        const cargarCursosPorSemestre = async () => {
            setCargandoHorarios(true);
            try {
                const response = await axios.get(route('matriculas.horarios_semestre'), {
                    params: {
                        periodo_id: data.periodo_id,
                        semestre_id: semestreExplorador,
                        plan_estudio_id: data.plan_estudio_id,
                    }
                });
                setOfertaAcademicas(response.data.horarios ?? []);
            } catch (error) {
                console.error("Error al cargar oferta académica:", error);
                setOfertaAcademicas([]);
            } finally {
                setCargandoHorarios(false);
            }
        };

        cargarCursosPorSemestre();
    }, [data.periodo_id, semestreExplorador, data.plan_estudio_id]);

    // Horarios actualmente seleccionados
    const horariosSeleccionadosMap = useMemo(() => {
        const selectedIds = new Set(data.cursos_seleccionados.map(item => String(item.horario_id)));
        return ofertaAcademicas.filter(h => selectedIds.has(String(h.id)));
    }, [data.cursos_seleccionados, ofertaAcademicas]);

    // Selección por paquete completo de sección
    const handleToggleCurso = (horarioClickeado) => {
        const bloquesMismaSeccion = ofertaAcademicas.filter(
            h => String(h.curso_id) === String(horarioClickeado.curso_id) && 
                 String(h.seccion) === String(horarioClickeado.seccion)
        );

        const idsMismaSeccion = new Set(bloquesMismaSeccion.map(h => String(h.id)));

        const estaSeleccionado = data.cursos_seleccionados.some(
            item => idsMismaSeccion.has(String(item.horario_id))
        );

        if (estaSeleccionado) {
            setData('cursos_seleccionados', data.cursos_seleccionados.filter(
                item => !idsMismaSeccion.has(String(item.horario_id))
            ));
        } else {
            const conflictoSeccion = horariosSeleccionadosMap.find(
                h => String(h.curso_id) === String(horarioClickeado.curso_id) && 
                     String(h.seccion) !== String(horarioClickeado.seccion)
            );

            if (conflictoSeccion) {
                Swal.fire({
                    title: 'Sección no compatible',
                    text: `La asignatura "${horarioClickeado.curso_nombre}" ya cuenta con la Sección ${conflictoSeccion.seccion} seleccionada. Desmárquela antes de elegir otra sección.`,
                    icon: 'warning',
                    confirmButtonColor: '#315d7a',
                });
                return;
            }

            const esRepitencia = String(semestreExplorador) !== String(data.semestre_id);
            const estadoInicial = esRepitencia ? 'Repitencia' : 'Inscrito';

            const nuevosBloques = bloquesMismaSeccion.map(h => ({
                horario_id: h.id,
                estado: estadoInicial
            }));

            const seleccionSinEsteCurso = data.cursos_seleccionados.filter(
                item => !idsMismaSeccion.has(String(item.horario_id))
            );

            setData('cursos_seleccionados', [...seleccionSinEsteCurso, ...nuevosBloques]);
        }
    };

    const handleCambiarEstadoCurso = (horarioId, nuevoEstado) => {
        setData('cursos_seleccionados', data.cursos_seleccionados.map(item => {
            if (String(item.horario_id) === String(horarioId)) {
                return { ...item, estado: nuevoEstado };
            }
            return item;
        }));
    };

    // Sincronización al cambiar el Ciclo Principal
    const handleCambioSemestrePrincipal = (e) => {
        const val = e.target.value;
        setData('semestre_id', val);
        // Sincroniza inmediatamente el explorador con el nuevo ciclo elegido
        setSemestreExplorador(val);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (data.cursos_seleccionados.length === 0) {
            Swal.fire({
                title: 'Atención',
                text: 'La matrícula debe conservar al menos una asignatura registrada.',
                icon: 'warning',
                confirmButtonColor: '#315d7a',
            });
            return;
        }

        post(route('matriculas.update', matricula.id), {
            preserveScroll: true,
            onStart: () => {
                Swal.fire({
                    title: 'Actualizando matrícula...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading(),
                });
            },
            onSuccess: () => {
                Swal.fire({
                    title: '¡Modificación Guardada!',
                    text: 'La matrícula se actualizó correctamente.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                });
            },
            onError: (err) => {
                const mensajeError = err.error ?? 'Verifique los datos e intente nuevamente.';
                Swal.fire('Error al actualizar', mensajeError, 'error');
            }
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Editar Matrícula: {matricula.codigo_matricula}</h1>
                        <p className="text-xs text-slate-500">Modificación de estado, ciclo lectivo y reajuste de carga académica.</p>
                    </div>
                    <Link
                        href={route('matriculas.index')}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                    >
                        Volver a la lista
                    </Link>
                </div>
            }
        >
            <Head title={`Editar Matrícula ${matricula.codigo_matricula}`} />

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 lg:flex-row items-start w-full">
                
                {/* PANEL IZQUIERDO */}
                <div className="w-full lg:w-1/3 space-y-5">
                    
                    {/* Datos del Alumno */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                        <h3 className="text-sm font-bold text-slate-900 mb-3 border-b pb-2 flex items-center justify-between">
                            <span>Información del Alumno</span>
                            <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {matricula.postulante?.grado ?? 'Estudiante'}
                            </span>
                        </h3>

                        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
                            <p className="text-sm font-bold text-slate-900">
                                {matricula.postulante?.apellidos}, {matricula.postulante?.nombres}
                            </p>
                            <p className="text-xs text-slate-500 font-mono">
                                DNI: <span className="font-semibold text-slate-700">{matricula.postulante?.dni ?? '—'}</span>
                            </p>
                            <p className="text-xs text-slate-500 font-mono">
                                Código Matrícula: <span className="font-semibold text-[#315d7a]">{matricula.codigo_matricula}</span>
                            </p>
                        </div>
                    </div>

                    {/* Parámetros Académicos */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 border-b pb-2">
                            Parámetros Académicos
                        </h3>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Estado de Matrícula</label>
                            <select
                                value={data.estado}
                                onChange={(e) => setData('estado', e.target.value)}
                                className={`w-full rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition focus:ring-2 ${
                                    errors.estado ? 'border-rose-400' : 'border-slate-300 focus:border-[#315d7a]'
                                }`}
                            >
                                {estados.map((est) => (
                                    <option key={est} value={est}>{est}</option>
                                ))}
                            </select>
                            {errors.estado && <p className="mt-1 text-[11px] text-rose-600">{errors.estado}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Plan de Estudios</label>
                            <select
                                value={data.plan_estudio_id}
                                onChange={(e) => setData('plan_estudio_id', e.target.value)}
                                className={`w-full rounded-lg border bg-white px-3 py-2 text-xs text-slate-800 outline-none transition ${
                                    errors.plan_estudio_id ? 'border-rose-400' : 'border-slate-300 focus:border-[#315d7a]'
                                }`}
                            >
                                <option value="">-- Seleccione Plan --</option>
                                {planes.map((p) => (
                                    <option key={p.id} value={p.id}>{p.codigo} - {p.nombre}</option>
                                ))}
                            </select>
                            {errors.plan_estudio_id && <p className="mt-1 text-[11px] text-rose-600">{errors.plan_estudio_id}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Periodo Lectivo</label>
                                <select
                                    value={data.periodo_id}
                                    onChange={(e) => setData('periodo_id', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                >
                                    <option value="">-- Periodo --</option>
                                    {periodos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Ciclo Principal</label>
                                <select
                                    value={data.semestre_id}
                                    onChange={handleCambioSemestrePrincipal}
                                    className={`w-full rounded-lg border bg-white px-3 py-2 text-xs text-slate-800 outline-none transition ${
                                        errors.semestre_id ? 'border-rose-400' : 'border-slate-300 focus:border-[#315d7a]'
                                    }`}
                                >
                                    <option value="">-- Semestre --</option>
                                    {semestres.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha de Registro</label>
                            <input
                                type="date"
                                value={data.fecha_matricula}
                                onChange={(e) => setData('fecha_matricula', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full mt-2 rounded-lg bg-[#315d7a] py-2.5 text-xs font-bold text-white transition hover:bg-[#274b63] disabled:opacity-50 shadow-xs cursor-pointer"
                        >
                            {processing ? 'Guardando Cambios...' : 'Guardar Cambios de Matrícula'}
                        </button>
                    </div>

                </div>

                {/* PANEL DERECHO */}
                <div className="w-full lg:w-2/3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 border-b pb-3">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Ajustar Carga Académica</h3>
                            <p className="text-[11px] text-slate-500">Agregue o remueva asignaturas para modificar la carga del estudiante.</p>
                        </div>

                        {/* SELECTOR EXPLORADOR */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Ver ciclo:</label>
                            <select
                                value={semestreExplorador}
                                disabled={!data.semestre_id}
                                onChange={(e) => setSemestreExplorador(e.target.value)}
                                className="rounded-lg border border-slate-300 bg-amber-50/60 text-amber-900 font-bold px-3 py-1 text-xs outline-none focus:border-[#315d7a] disabled:opacity-50"
                            >
                                <option value="">-- Seleccionar --</option>
                                {semestresDisponiblesExplorador.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        Semestre {s.nombre} {String(s.id) === String(data.semestre_id) ? '(Oficial)' : '(Atrasado)'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {errors.cursos_seleccionados && (
                        <div className="mb-4 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-600 border border-rose-200">
                            {errors.cursos_seleccionados}
                        </div>
                    )}

                    <div className="overflow-hidden rounded-lg border border-slate-200">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-xs">
                                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="py-2.5 px-3 text-center w-10">Sel.</th>
                                        <th className="py-2.5 px-3">Asignatura</th>
                                        <th className="py-2.5 px-3">Condición</th>
                                        <th className="py-2.5 px-3">Sección / Turno</th>
                                        <th className="py-2.5 px-3">Horario</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {cargandoHorarios ? (
                                        <tr>
                                            <td colSpan={5} className="py-10 text-center text-slate-400 font-medium">
                                                Cargando oferta académica...
                                            </td>
                                        </tr>
                                    ) : ofertaAcademicas.length > 0 ? (
                                        ofertaAcademicas.map((horario) => {
                                            const itemEncontrado = data.cursos_seleccionados.find(
                                                item => String(item.horario_id) === String(horario.id)
                                            );
                                            const estaMarcado = !!itemEncontrado;

                                            const tieneConflicto = horariosSeleccionadosMap.some(
                                                h => String(h.curso_id) === String(horario.curso_id) && 
                                                     String(h.seccion) !== String(horario.seccion)
                                            );

                                            return (
                                                <tr 
                                                    key={horario.id}
                                                    onClick={() => !tieneConflicto && handleToggleCurso(horario)}
                                                    className={`transition ${
                                                        tieneConflicto 
                                                            ? 'opacity-35 bg-slate-50 cursor-not-allowed' 
                                                            : estaMarcado 
                                                                ? 'bg-emerald-50/70 text-slate-900 font-medium cursor-pointer border-l-4 border-l-emerald-600' 
                                                                : 'hover:bg-slate-50 text-slate-700 cursor-pointer'
                                                    }`}
                                                >
                                                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            disabled={tieneConflicto}
                                                            checked={estaMarcado}
                                                            onChange={() => handleToggleCurso(horario)}
                                                            className="h-4 w-4 rounded border-slate-300 text-[#315d7a] focus:ring-[#315d7a]"
                                                        />
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        <span className="font-bold block text-slate-900">{horario.curso_nombre}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono">{horario.curso_codigo}</span>
                                                    </td>
                                                    <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                                                        {estaMarcado ? (
                                                            <select
                                                                value={itemEncontrado?.estado ?? 'Inscrito'}
                                                                onChange={(e) => handleCambiarEstadoCurso(horario.id, e.target.value)}
                                                                className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-700 outline-none focus:border-[#315d7a]"
                                                            >
                                                                <option value="Inscrito">Regular</option>
                                                                <option value="Repitencia">Repitencia</option>
                                                                <option value="Cargo">Cargo</option>
                                                            </select>
                                                        ) : (
                                                            <span className="text-[11px] text-slate-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mr-1 ${
                                                            horario.seccion === 'A' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                                                        }`}>
                                                            Sec. {horario.seccion ?? '—'}
                                                        </span>
                                                        <span className="text-[11px] text-slate-500">{horario.turno ?? '—'}</span>
                                                    </td>
                                                    <td className="py-2.5 px-3 font-medium text-slate-600">
                                                        {horario.detalle_horario}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-10 text-center text-slate-400">
                                                {!semestreExplorador 
                                                    ? 'Seleccione un Ciclo / Semestre en el filtro superior para cargar la oferta.' 
                                                    : 'No hay asignaturas programadas para el ciclo seleccionado.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </form>
        </AuthenticatedLayout>
    );
}