    import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
    import { Head, Link, useForm } from '@inertiajs/react';
    import axios from 'axios';
    import Swal from 'sweetalert2';
    import { useEffect, useMemo, useState } from 'react';

    export default function Create({
        estudiantes = [],
        planes = [],
        periodos = [],
        semestres = [],
    }) {
        const { data, setData, post, processing, errors } = useForm({
            postulante_id: '',
            plan_estudio_id: '',
            periodo_id: periodos[0]?.id ?? '',
            semestre_id: '', // Semestre Oficial Principal
            fecha_matricula: new Date().toISOString().split('T')[0],
            cursos_seleccionados: [],
        });

        const [semestreExplorador, setSemestreExplorador] = useState('');
        const [ofertaAcademicas, setOfertaAcademicas] = useState([]);
        const [cargandoHorarios, setCargandoHorarios] = useState(false);
        
        // Estado de detección de matrícula existente
        const [matriculaExistente, setMatriculaExistente] = useState(false);

        // Estados para el buscador de estudiante
        const [busquedaEstudiante, setBusquedaEstudiante] = useState('');
        const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

        // Estudiante seleccionado
        const estudianteSeleccionado = useMemo(() => {
            return estudiantes.find(e => String(e.id_postulante) === String(data.postulante_id)) ?? null;
        }, [data.postulante_id, estudiantes]);

        // Filtrado de estudiantes
        const estudiantesFiltrados = useMemo(() => {
            if (!busquedaEstudiante.trim()) return [];
            const term = busquedaEstudiante.toLowerCase();
            return estudiantes.filter(est => 
                `${est.nombres ?? ''} ${est.apellidos ?? ''}`.toLowerCase().includes(term) ||
                est.dni?.includes(term)
            ).slice(0, 6);
        }, [busquedaEstudiante, estudiantes]);

        // DETECTAR SI EL ESTUDIANTE YA TIENE MATRÍCULA EN EL PERIODO ACTIVO
        useEffect(() => {
            if (!data.postulante_id || !data.periodo_id) {
                setMatriculaExistente(false);
                return;
            }

            const verificarPrevia = async () => {
                try {
                    const res = await axios.get(route('matriculas.verificar_estudiante'), {
                        params: {
                            postulante_id: data.postulante_id,
                            periodo_id: data.periodo_id,
                        }
                    });

                    if (res.data.existe) {
                        setMatriculaExistente(true);
                        setData(d => ({
                            ...d,
                            semestre_id: res.data.semestre_id,
                            plan_estudio_id: res.data.plan_estudio_id ?? d.plan_estudio_id,
                        }));

                        // Colocar el explorador por defecto en el semestre previo inmediato
                        const cicloAnterior = semestres.filter(s => Number(s.id) < Number(res.data.semestre_id)).pop();
                        if (cicloAnterior) {
                            setSemestreExplorador(cicloAnterior.id);
                        } else {
                            setSemestreExplorador('');
                        }
                    } else {
                        setMatriculaExistente(false);
                    }
                } catch (error) {
                    console.error("Error al verificar matrícula previa:", error);
                    setMatriculaExistente(false);
                }
            };

            verificarPrevia();
        }, [data.postulante_id, data.periodo_id]);

        // FILTRO DE SEMESTRES DISPONIBLES
        // Si YA TIENE MATRÍCULA: permite elegir SOLAMENTE ciclos estrictamente MENORES (< semestre_id)
        // Si ES NUEVA: permite elegir hasta el ciclo oficial (<= semestre_id)
        const semestresDisponiblesExplorador = useMemo(() => {
            if (!data.semestre_id) return [];
            
            if (matriculaExistente) {
                return semestres.filter(s => Number(s.id) < Number(data.semestre_id));
            }
            
            return semestres.filter(s => Number(s.id) <= Number(data.semestre_id));
        }, [data.semestre_id, matriculaExistente, semestres]);

        const handleCambioSemestrePrincipal = (e) => {
            const val = e.target.value;
            setData('semestre_id', val);
            if (!matriculaExistente) {
                setSemestreExplorador(val);
            }
        };

        // Carga asíncrona de la oferta según el ciclo explorado
        useEffect(() => {
            if (!data.periodo_id || !semestreExplorador || !data.plan_estudio_id) {
                setOfertaAcademicas([]);
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
                    console.error("Error al cargar horarios:", error);
                    setOfertaAcademicas([]);
                } finally {
                    setCargandoHorarios(false);
                }
            };

            cargarCursosPorSemestre();
        }, [data.periodo_id, semestreExplorador, data.plan_estudio_id]);

        // Mapeo de horarios
        const horariosSeleccionadosMap = useMemo(() => {
            const selectedIds = new Set(data.cursos_seleccionados.map(item => String(item.horario_id)));
            return ofertaAcademicas.filter(h => selectedIds.has(String(h.id)));
        }, [data.cursos_seleccionados, ofertaAcademicas]);

        // Manejo de Paquetes por Sección
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
                        text: `La asignatura "${horarioClickeado.curso_nombre}" ya se encuentra seleccionada en la Sección ${conflictoSeccion.seccion}.`,
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

        const seleccionarEstudiante = (est) => {
            setData('postulante_id', est.id_postulante);
            setBusquedaEstudiante('');
            setMostrarSugerencias(false);
        };

        const limpiarEstudiante = () => {
            setData('postulante_id', '');
            setBusquedaEstudiante('');
            setMatriculaExistente(false);
        };

        const handleSubmit = (e) => {
            e.preventDefault();

            if (!data.postulante_id) {
                Swal.fire('Estudiante requerido', 'Debe buscar y seleccionar un estudiante para continuar.', 'warning');
                return;
            }

            if (data.cursos_seleccionados.length === 0) {
                Swal.fire('Atención', 'Debe seleccionar al menos una asignatura.', 'warning');
                return;
            }

            post(route('matriculas.store'), {
                preserveScroll: true,
                onStart: () => {
                    Swal.fire({
                        title: 'Procesando matrícula...',
                        allowOutsideClick: false,
                        didOpen: () => Swal.showLoading(),
                    });
                },
                onSuccess: () => {
                    Swal.fire({
                        title: '¡Matrícula Registrada!',
                        text: 'Se asentó la matrícula correctamente.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false,
                    });
                },
                onError: (err) => {
                    const msj = err.error ?? 'Verifique los datos e intente nuevamente.';
                    Swal.fire('Error al procesar', msj, 'error');
                }
            });
        };

        return (
            <AuthenticatedLayout
                header={
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Registrar Nueva Matrícula</h1>
                            <p className="text-xs text-slate-500">Asignación de carga académica e inscripción por periodo lectivo.</p>
                        </div>
                        <Link
                            href={route('matriculas.index')}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                        >
                            Cancelar
                        </Link>
                    </div>
                }
            >
                <Head title="Nueva Matrícula" />

                <form onSubmit={handleSubmit} className="flex flex-col gap-6 lg:flex-row items-start w-full">
                    
                    {/* PANEL IZQUIERDO: ESTUDIANTE Y PARÁMETROS */}
                    <div className="w-full lg:w-1/3 space-y-5">
                        
                        {/* Buscador de Alumno */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs relative">
                            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between border-b pb-2">
                                <span>1. Estudiante</span>
                                {estudianteSeleccionado && (
                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        Seleccionado
                                    </span>
                                )}
                            </h3>

                            {estudianteSeleccionado ? (
                                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 relative">
                                    <div className="pr-6">
                                        <p className="text-sm font-bold text-slate-900">
                                            {estudianteSeleccionado.apellidos}, {estudianteSeleccionado.nombres}
                                        </p>
                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                            <span className="font-mono bg-white px-2 py-0.5 rounded border text-slate-700 font-semibold">
                                                DNI: {estudianteSeleccionado.dni}
                                            </span>
                                        </div>

                                        {/* ALERTA VISUAL SI TIENE MATRÍCULA ACTIVA */}
                                        {matriculaExistente && (
                                            <div className="mt-2 text-[11px] bg-amber-100/80 text-amber-900 border border-amber-300 p-2 rounded-lg font-medium">
                                                ⚠️ El alumno ya tiene matrícula registrada en este periodo. Solo puede inscribir cursos atrasados (Repitencia/Cargo).
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={limpiarEstudiante}
                                        className="absolute top-3 right-3 text-slate-400 hover:text-rose-600 transition"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Buscar por DNI o Nombres
                                    </label>
                                    <input 
                                        type="text"
                                        placeholder="Escriba el DNI o apellido del alumno..."
                                        value={busquedaEstudiante}
                                        onChange={(e) => {
                                            setBusquedaEstudiante(e.target.value);
                                            setMostrarSugerencias(true);
                                        }}
                                        onFocus={() => setMostrarSugerencias(true)}
                                        className={`w-full rounded-lg border px-3 py-2 text-xs text-slate-800 outline-none transition focus:ring-2 ${
                                            errors.postulante_id ? 'border-rose-400' : 'border-slate-300 focus:border-[#315d7a]'
                                        }`}
                                    />

                                    {mostrarSugerencias && estudiantesFiltrados.length > 0 && (
                                        <div className="absolute z-30 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden max-h-56 overflow-y-auto">
                                            {estudiantesFiltrados.map((est) => (
                                                <div
                                                    key={est.id_postulante}
                                                    onClick={() => seleccionarEstudiante(est)}
                                                    className="cursor-pointer px-3 py-2.5 hover:bg-slate-50 border-b last:border-0 border-slate-100 transition"
                                                >
                                                    <p className="text-xs font-bold text-slate-800">
                                                        {est.apellidos}, {est.nombres}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 font-mono">
                                                        DNI: {est.dni}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Parámetros Académicos */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 border-b pb-2">
                                2. Parámetros Académicos
                            </h3>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Plan de Estudios</label>
                                <select
                                    value={data.plan_estudio_id}
                                    disabled={matriculaExistente}
                                    onChange={(e) => setData('plan_estudio_id', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a] disabled:bg-slate-100"
                                >
                                    <option value="">-- Seleccione Plan --</option>
                                    {planes.map((p) => (
                                        <option key={p.id} value={p.id}>{p.codigo} - {p.nombre}</option>
                                    ))}
                                </select>
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
                                        disabled={matriculaExistente}
                                        onChange={handleCambioSemestrePrincipal}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a] disabled:bg-slate-100"
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
                                className="w-full mt-2 rounded-lg bg-[#315d7a] py-2.5 text-xs font-bold text-white transition hover:bg-[#274b63] disabled:opacity-50 shadow-xs"
                            >
                                {processing ? 'Procesando...' : (matriculaExistente ? 'Agregar Cursos a la Matrícula' : 'Confirmar e Inscribir Matrícula')}
                            </button>
                        </div>

                    </div>

                    {/* PANEL DERECHO: CURSOS DISPONIBLES */}
                    <div className="w-full lg:w-2/3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 border-b pb-3">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">3. Oferta Académica del Ciclo</h3>
                                <p className="text-[11px] text-slate-500">
                                    {matriculaExistente 
                                        ? 'Seleccione un ciclo anterior para inscribir asignaturas en Repitencia o Cargo.' 
                                        : 'Cambie de ciclo para buscar asignaturas atrasadas o en repitencia.'}
                                </p>
                            </div>

                            {/* DESPLEGABLE EXPLORADOR BLOQUEANDO EL CICLO OFICIAL SI YA TIENE MATRÍCULA */}
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Ver ciclo:</label>
                                <select
                                    value={semestreExplorador}
                                    disabled={!data.semestre_id || semestresDisponiblesExplorador.length === 0}
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
                                                        ? (matriculaExistente 
                                                            ? 'Seleccione un ciclo anterior (I o II) en el filtro superior.' 
                                                            : 'Seleccione un Ciclo / Semestre en el filtro superior para cargar la oferta.')
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