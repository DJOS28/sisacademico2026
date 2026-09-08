import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import Select from 'react-select';
import Swal from 'sweetalert2';
import { useMemo, useRef, useState } from 'react';

const selectStyles = (hasError = false) => ({
    control: (base, state) => ({
        ...base,
        minHeight: '42px',
        height: '42px',
        borderRadius: '0.5rem',
        borderColor: hasError
            ? '#fb7185'
            : state.isFocused
              ? '#315d7a'
              : '#cbd5e1',
        boxShadow: state.isFocused
            ? hasError
                ? '0 0 0 2px rgba(251, 113, 133, 0.20)'
                : '0 0 0 2px rgba(49, 93, 122, 0.20)'
            : 'none',
        '&:hover': {
            borderColor: hasError ? '#f43f5e' : '#315d7a',
        },
        fontSize: '0.875rem',
        backgroundColor: state.isDisabled ? '#f1f5f9' : '#ffffff',
    }),
    valueContainer: (base) => ({
        ...base,
        height: '40px',
        padding: '0 12px',
    }),
    input: (base) => ({
        ...base,
        margin: 0,
        padding: 0,
    }),
    indicatorsContainer: (base) => ({
        ...base,
        height: '40px',
    }),
    placeholder: (base) => ({
        ...base,
        color: '#94a3b8',
    }),
    menu: (base) => ({
        ...base,
        zIndex: 50,
        fontSize: '0.875rem',
    }),
    option: (base, state) => ({
        ...base,
        cursor: 'pointer',
        backgroundColor: state.isSelected
            ? '#315d7a'
            : state.isFocused
              ? '#f1f5f9'
              : '#ffffff',
        color: state.isSelected ? '#ffffff' : '#334155',
    }),
});

export default function Create({
    docentes = [],
    aulas = [],
    periodos = [],
    planesEstudio = [],
    secciones = [],
    turnos = [],
    dias = [],
    frecuencias = [],
}) {
    const [data, setData] = useState({
        id_periodo: '',
        id_plan_estudio: '',
        id_docente: '',
        id_curso: '',
        id_seccion: '',
        id_turno: '',
        frecuencia: 'Semanal',
        id_aula: '',
        capacidad: '',
        moodle_group_id: '',
        programaciones: [
            {
                dia: '',
                hora_inicio: '',
                hora_fin: '',
            },
        ],
    });

    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [cursos, setCursos] = useState([]);
    const [cargandoCursos, setCargandoCursos] = useState(false);

    const controladorCursos = useRef(null);

    const inputClass = (error) =>
        `h-[42px] w-full rounded-lg border px-3 text-sm text-slate-800 outline-none transition focus:ring-2 ${
            error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                : 'border-slate-300 focus:border-[#315d7a] focus:ring-[#315d7a]/20'
        } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`;

    const formatearHora = (hora) => {
        if (!hora) return '';
        return String(hora).substring(0, 5);
    };

    const obtenerNombreDocente = (docente) => {
        if (!docente) return '';
        return [docente.nombre, docente.apellido].filter(Boolean).join(' ');
    };

    const obtenerNombrePeriodo = (periodo) => {
        if (!periodo) return '';
        return (
            periodo.nombre ??
            periodo.periodo ??
            periodo.descripcion ??
            periodo.anio ??
            `Periodo ${periodo.id}`
        );
    };

    const opcionesPeriodos = useMemo(
        () =>
            periodos.map((periodo) => ({
                value: String(periodo.id),
                label: obtenerNombrePeriodo(periodo),
            })),
        [periodos]
    );

    const opcionesPlanes = useMemo(
        () =>
            planesEstudio.map((plan) => ({
                value: String(plan.id),
                label: plan.codigo ? `${plan.codigo} - ${plan.nombre}` : plan.nombre,
            })),
        [planesEstudio]
    );

    const opcionesDocentes = useMemo(
        () =>
            docentes.map((docente) => ({
                value: String(docente.id),
                label: obtenerNombreDocente(docente),
            })),
        [docentes]
    );

    const opcionesCursos = useMemo(
        () =>
            cursos.map((curso) => ({
                value: String(curso.id),
                label: curso.nombre,
            })),
        [cursos]
    );

    const opcionesSecciones = useMemo(
        () =>
            secciones.map((seccion) => ({
                value: String(seccion.id),
                label: seccion.nombre,
            })),
        [secciones]
    );

    const opcionesTurnos = useMemo(
        () =>
            turnos.map((turno) => ({
                value: String(turno.id),
                label: `${turno.nombre} (${formatearHora(turno.hora_inicio)} - ${formatearHora(turno.hora_fin)})`,
            })),
        [turnos]
    );

    const opcionesAulas = useMemo(
        () =>
            aulas.map((aula) => ({
                value: String(aula.id),
                label: [aula.nombre, aula.numero_aula, aula.pabellon?.nombre]
                    .filter(Boolean)
                    .join(' - '),
            })),
        [aulas]
    );

    const opcionesFrecuencias = useMemo(
        () =>
            frecuencias.map((frecuencia) => ({
                value: frecuencia,
                label: frecuencia,
            })),
        [frecuencias]
    );

    const periodoSeleccionado = useMemo(
        () => periodos.find((p) => String(p.id) === String(data.id_periodo)) ?? null,
        [periodos, data.id_periodo]
    );

    const planSeleccionado = useMemo(
        () => planesEstudio.find((p) => String(p.id) === String(data.id_plan_estudio)) ?? null,
        [planesEstudio, data.id_plan_estudio]
    );

    const docenteSeleccionado = useMemo(
        () => docentes.find((d) => String(d.id) === String(data.id_docente)) ?? null,
        [docentes, data.id_docente]
    );

    const cursoSeleccionado = useMemo(
        () => cursos.find((c) => String(c.id) === String(data.id_curso)) ?? null,
        [cursos, data.id_curso]
    );

    const seccionSeleccionada = useMemo(
        () => secciones.find((s) => String(s.id) === String(data.id_seccion)) ?? null,
        [secciones, data.id_seccion]
    );

    const turnoSeleccionado = useMemo(
        () => turnos.find((t) => String(t.id) === String(data.id_turno)) ?? null,
        [turnos, data.id_turno]
    );

    const aulaSeleccionada = useMemo(
        () => aulas.find((a) => String(a.id) === String(data.id_aula)) ?? null,
        [aulas, data.id_aula]
    );

    const buscarOpcion = (opciones, valor) =>
        opciones.find((opcion) => String(opcion.value) === String(valor)) ?? null;

    const cargarCursosDelPlan = async (planEstudioId) => {
        controladorCursos.current?.abort();

        setCursos([]);
        setData((prev) => ({ ...prev, id_curso: '' }));
        setErrors((prev) => {
            const copia = { ...prev };
            delete copia.id_plan_estudio;
            delete copia.id_curso;
            return copia;
        });

        if (!planEstudioId) return;

        controladorCursos.current = new AbortController();
        setCargandoCursos(true);

        try {
            const response = await axios.get(
                route('horarios.cursos-por-plan', planEstudioId),
                {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    signal: controladorCursos.current.signal,
                }
            );

            setCursos(response.data.cursos ?? []);
        } catch (error) {
            if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') return;

            setCursos([]);
            Swal.fire({
                title: 'Error',
                text: 'No se pudieron cargar los cursos del plan de estudio.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
            });
        } finally {
            setCargandoCursos(false);
        }
    };

    const cambiarPlanEstudio = (opcion) => {
        const planId = opcion?.value ?? '';
        setData((prev) => ({
            ...prev,
            id_plan_estudio: planId,
            id_curso: '',
        }));
        cargarCursosDelPlan(planId);
    };

    const cambiarTurno = (opcion) => {
        const turnoId = opcion?.value ?? '';
        const turno = turnos.find((item) => String(item.id) === String(turnoId));

        const programacionesActualizadas = data.programaciones.map((programacion) => ({
            ...programacion,
            hora_inicio: programacion.hora_inicio || formatearHora(turno?.hora_inicio),
            hora_fin: programacion.hora_fin || formatearHora(turno?.hora_fin),
        }));

        setData((prev) => ({
            ...prev,
            id_turno: turnoId,
            programaciones: programacionesActualizadas,
        }));
    };

    const cambiarAula = (opcion) => {
        const aulaId = opcion?.value ?? '';
        const aula = aulas.find((item) => String(item.id) === String(aulaId));

        setData((prev) => ({
            ...prev,
            id_aula: aulaId,
            capacidad: aula?.capacidad ?? '',
        }));
    };

    const agregarProgramacion = () => {
        const diasUsados = data.programaciones.map((p) => p.dia).filter(Boolean);
        const siguienteDia = dias.find((dia) => !diasUsados.includes(dia)) ?? '';

        setData((prev) => ({
            ...prev,
            programaciones: [
                ...prev.programaciones,
                { dia: siguienteDia, hora_inicio: '', hora_fin: '' },
            ],
        }));
    };

    const eliminarProgramacion = (indice) => {
        if (data.programaciones.length === 1) {
            Swal.fire({
                title: 'Atención',
                text: 'Debe existir al menos un día de programación.',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
            });
            return;
        }

        setData((prev) => ({
            ...prev,
            programaciones: prev.programaciones.filter((_, pos) => pos !== indice),
        }));
    };

    const actualizarProgramacion = (indice, campo, valor) => {
        setData((prev) => ({
            ...prev,
            programaciones: prev.programaciones.map((prog, pos) =>
                pos === indice ? { ...prog, [campo]: valor } : prog
            ),
        }));

        setErrors((prev) => {
            const copia = { ...prev };
            delete copia[`programaciones.${indice}.${campo}`];
            delete copia.programaciones;
            return copia;
        });
    };

    const diasDisponiblesParaFila = (indice) => {
        const diasSeleccionados = data.programaciones
            .filter((_, pos) => pos !== indice)
            .map((p) => p.dia)
            .filter(Boolean);

        return dias
            .filter((dia) => !diasSeleccionados.includes(dia))
            .map((dia) => ({ value: dia, label: dia }));
    };

    const obtenerErrorProgramacion = (indice, campo) =>
        errors[`programaciones.${indice}.${campo}`] ?? null;

    const horariosResumen = useMemo(
        () =>
            data.programaciones
                .filter((p) => p.dia)
                .map((p) => `${p.dia}: ${p.hora_inicio || '--:--'} - ${p.hora_fin || '--:--'}`),
        [data.programaciones]
    );

    const submit = async (event) => {
        event.preventDefault();

        // 1. Validaciones previas en cliente
        const programacionesCompletas = data.programaciones.filter(
            (p) => p.dia && p.hora_inicio && p.hora_fin
        );

        if (programacionesCompletas.length !== data.programaciones.length) {
            await Swal.fire({
                title: 'Programación incompleta',
                text: 'Complete el día, la hora de inicio y la hora de fin de cada fila.',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
            });
            return;
        }

        const horaIncorrecta = data.programaciones.some(
            (p) => p.hora_fin <= p.hora_inicio
        );

        if (horaIncorrecta) {
            await Swal.fire({
                title: 'Rango de horas incorrecto',
                text: 'La hora de fin debe ser posterior a la hora de inicio en cada día.',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
            });
            return;
        }

        // 2. Confirmación con modal SweetAlert2
        const confirmacion = await Swal.fire({
            title: '¿Registrar horario?',
            html: `
                <div style="text-align:left;font-size:14px;line-height:1.7">
                    <p><strong>Docente:</strong> ${obtenerNombreDocente(docenteSeleccionado) || 'No seleccionado'}</p>
                    <p><strong>Curso:</strong> ${cursoSeleccionado?.nombre ?? 'No seleccionado'}</p>
                    <p><strong>Sección:</strong> ${seccionSeleccionada?.nombre ?? 'No seleccionada'}</p>
                    <p style="margin-top:8px"><strong>Programación:</strong></p>
                    <ul style="padding-left:18px">
                        ${horariosResumen.map((h) => `<li>${h}</li>`).join('')}
                    </ul>
                    <p style="margin-top:8px"><strong>Aula:</strong> ${
                        aulaSeleccionada
                            ? [aulaSeleccionada.nombre, aulaSeleccionada.numero_aula].filter(Boolean).join(' - ')
                            : 'No seleccionada'
                    }</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, registrar',
            cancelButtonText: 'Revisar',
            confirmButtonColor: '#315d7a',
            cancelButtonColor: '#64748b',
            reverseButtons: true,
        });

        if (!confirmacion.isConfirmed) return;

        // 3. Envío asíncrono con AJAX (Axios)
        setProcessing(true);
        setErrors({});

        Swal.fire({
            title: 'Registrando horario...',
            text: 'Asignando docentes y grupos en el Aula Virtual Moodle',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => Swal.showLoading(),
        });

        try {
            const response = await axios.post(route('horarios.store'), data, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            await Swal.fire({
                title: '¡Registrado!',
                text: response.data?.message || 'Horario registrado y sincronizado con Moodle correctamente.',
                icon: 'success',
                confirmButtonColor: '#315d7a',
                confirmButtonText: 'Aceptar',
            });

            router.visit(route('horarios.index'));
        } catch (error) {
            Swal.close();

            if (error.response?.status === 422) {
                const backendErrors = error.response.data?.errors || {};
                setErrors(backendErrors);

                const listaErrores = Object.values(backendErrors)
                    .flat()
                    .map((msg) => `<li>${msg}</li>`)
                    .join('');

                Swal.fire({
                    title: 'Conflicto o datos no válidos',
                    html: `
                        <div style="text-align:left;font-size:14px;color:#e11d48">
                            <ul style="padding-left:18px;line-height:1.6">
                                ${listaErrores}
                            </ul>
                        </div>
                    `,
                    icon: 'warning',
                    confirmButtonColor: '#315d7a',
                    confirmButtonText: 'Entendido',
                });
            } else {
                Swal.fire({
                    title: 'Error del servidor',
                    text: error.response?.data?.message || 'Ocurrió un error inesperado al procesar el horario.',
                    icon: 'error',
                    confirmButtonColor: '#315d7a',
                    confirmButtonText: 'Aceptar',
                });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Nuevo horario</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Registre la programación académica por día y rango de horas con sincronización en Moodle.
                    </p>
                </div>
            }
        >
            <Head title="Nuevo horario" />

            <form onSubmit={submit} className="grid grid-cols-1 gap-5 xl:grid-cols-12">
                <div className="space-y-5 xl:col-span-9">
                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4">
                            <h2 className="text-base font-bold text-slate-900">Información académica</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Los campos permiten buscar escribiendo parte del nombre.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <CampoSelect label="Periodo" required error={errors.id_periodo}>
                                <Select
                                    inputId="id_periodo"
                                    options={opcionesPeriodos}
                                    value={buscarOpcion(opcionesPeriodos, data.id_periodo)}
                                    onChange={(opcion) => setData((prev) => ({ ...prev, id_periodo: opcion?.value ?? '' }))}
                                    placeholder="Buscar periodo..."
                                    noOptionsMessage={() => 'Sin resultados'}
                                    isClearable
                                    isDisabled={processing}
                                    styles={selectStyles(Boolean(errors.id_periodo))}
                                />
                            </CampoSelect>

                            <CampoSelect label="Plan de estudio" required error={errors.id_plan_estudio}>
                                <Select
                                    inputId="id_plan_estudio"
                                    options={opcionesPlanes}
                                    value={buscarOpcion(opcionesPlanes, data.id_plan_estudio)}
                                    onChange={cambiarPlanEstudio}
                                    placeholder="Buscar plan..."
                                    noOptionsMessage={() => 'Sin resultados'}
                                    isClearable
                                    isDisabled={processing}
                                    styles={selectStyles(Boolean(errors.id_plan_estudio))}
                                />
                            </CampoSelect>

                            <CampoSelect label="Docente" required error={errors.id_docente}>
                                <Select
                                    inputId="id_docente"
                                    options={opcionesDocentes}
                                    value={buscarOpcion(opcionesDocentes, data.id_docente)}
                                    onChange={(opcion) => setData((prev) => ({ ...prev, id_docente: opcion?.value ?? '' }))}
                                    placeholder="Buscar docente..."
                                    noOptionsMessage={() => 'Sin resultados'}
                                    isClearable
                                    isDisabled={processing}
                                    styles={selectStyles(Boolean(errors.id_docente))}
                                />
                            </CampoSelect>

                            <CampoSelect label="Curso del plan" required error={errors.id_curso}>
                                <Select
                                    inputId="id_curso"
                                    options={opcionesCursos}
                                    value={buscarOpcion(opcionesCursos, data.id_curso)}
                                    onChange={(opcion) => setData((prev) => ({ ...prev, id_curso: opcion?.value ?? '' }))}
                                    placeholder={
                                        !data.id_plan_estudio
                                            ? 'Seleccione un plan'
                                            : cargandoCursos
                                              ? 'Cargando...'
                                              : 'Buscar curso...'
                                    }
                                    noOptionsMessage={() => 'El plan no tiene cursos'}
                                    isClearable
                                    isLoading={cargandoCursos}
                                    isDisabled={processing || !data.id_plan_estudio || cargandoCursos}
                                    styles={selectStyles(Boolean(errors.id_curso))}
                                />
                            </CampoSelect>

                            <CampoSelect label="Sección" error={errors.id_seccion}>
                                <Select
                                    inputId="id_seccion"
                                    options={opcionesSecciones}
                                    value={buscarOpcion(opcionesSecciones, data.id_seccion)}
                                    onChange={(opcion) => setData((prev) => ({ ...prev, id_seccion: opcion?.value ?? '' }))}
                                    placeholder="Buscar sección..."
                                    noOptionsMessage={() => 'Sin resultados'}
                                    isClearable
                                    isDisabled={processing}
                                    styles={selectStyles(Boolean(errors.id_seccion))}
                                />
                            </CampoSelect>

                            <CampoSelect label="Turno" error={errors.id_turno}>
                                <Select
                                    inputId="id_turno"
                                    options={opcionesTurnos}
                                    value={buscarOpcion(opcionesTurnos, data.id_turno)}
                                    onChange={cambiarTurno}
                                    placeholder="Buscar turno..."
                                    noOptionsMessage={() => 'Sin resultados'}
                                    isClearable
                                    isDisabled={processing}
                                    styles={selectStyles(Boolean(errors.id_turno))}
                                />
                            </CampoSelect>

                            <CampoSelect label="Aula" error={errors.id_aula}>
                                <Select
                                    inputId="id_aula"
                                    options={opcionesAulas}
                                    value={buscarOpcion(opcionesAulas, data.id_aula)}
                                    onChange={cambiarAula}
                                    placeholder="Buscar aula..."
                                    noOptionsMessage={() => 'Sin resultados'}
                                    isClearable
                                    isDisabled={processing}
                                    styles={selectStyles(Boolean(errors.id_aula))}
                                />
                            </CampoSelect>

                            <div>
                                <label htmlFor="moodle_group_id" className="mb-2 block text-sm font-semibold text-slate-700">
                                    Moodle Group ID
                                </label>
                                <input
                                    id="moodle_group_id"
                                    type="number"
                                    min="1"
                                    value={data.moodle_group_id}
                                    onChange={(e) => setData((prev) => ({ ...prev, moodle_group_id: e.target.value }))}
                                    disabled={processing}
                                    placeholder="Automático / Opcional"
                                    className={inputClass(errors.moodle_group_id)}
                                />
                                {errors.moodle_group_id && (
                                    <p className="mt-1 text-sm text-rose-600">{errors.moodle_group_id}</p>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Programación semanal</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Cada día puede tener una hora de inicio y fin diferente.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={agregarProgramacion}
                                disabled={processing || data.programaciones.length >= dias.length}
                                className="flex h-[40px] items-center justify-center rounded-lg border border-[#315d7a] bg-white px-4 text-sm font-semibold text-[#315d7a] transition hover:bg-[#315d7a]/5 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                + Agregar día
                            </button>
                        </div>

                        <div className="space-y-3">
                            {data.programaciones.map((programacion, indice) => (
                                <div
                                    key={indice}
                                    className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-12 md:items-end"
                                >
                                    <div className="md:col-span-4">
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Día <span className="text-rose-500">*</span>
                                        </label>
                                        <Select
                                            options={diasDisponiblesParaFila(indice)}
                                            value={
                                                programacion.dia
                                                    ? { value: programacion.dia, label: programacion.dia }
                                                    : null
                                            }
                                            onChange={(opcion) => actualizarProgramacion(indice, 'dia', opcion?.value ?? '')}
                                            placeholder="Buscar día..."
                                            noOptionsMessage={() => 'No hay días disponibles'}
                                            isClearable
                                            isDisabled={processing}
                                            styles={selectStyles(Boolean(obtenerErrorProgramacion(indice, 'dia')))}
                                        />
                                        {obtenerErrorProgramacion(indice, 'dia') && (
                                            <p className="mt-1 text-sm text-rose-600">
                                                {obtenerErrorProgramacion(indice, 'dia')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="md:col-span-3">
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Hora de inicio <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="time"
                                            value={programacion.hora_inicio}
                                            onChange={(e) => actualizarProgramacion(indice, 'hora_inicio', e.target.value)}
                                            disabled={processing}
                                            className={inputClass(obtenerErrorProgramacion(indice, 'hora_inicio'))}
                                        />
                                        {obtenerErrorProgramacion(indice, 'hora_inicio') && (
                                            <p className="mt-1 text-sm text-rose-600">
                                                {obtenerErrorProgramacion(indice, 'hora_inicio')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="md:col-span-3">
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Hora de fin <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="time"
                                            value={programacion.hora_fin}
                                            onChange={(e) => actualizarProgramacion(indice, 'hora_fin', e.target.value)}
                                            disabled={processing}
                                            className={inputClass(obtenerErrorProgramacion(indice, 'hora_fin'))}
                                        />
                                        {obtenerErrorProgramacion(indice, 'hora_fin') && (
                                            <p className="mt-1 text-sm text-rose-600">
                                                {obtenerErrorProgramacion(indice, 'hora_fin')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="md:col-span-2">
                                        <button
                                            type="button"
                                            onClick={() => eliminarProgramacion(indice)}
                                            disabled={processing || data.programaciones.length === 1}
                                            className="flex h-[42px] w-full items-center justify-center rounded-lg border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {errors.programaciones && (
                            <p className="mt-2 text-sm text-rose-600">{errors.programaciones}</p>
                        )}

                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <CampoSelect label="Frecuencia" error={errors.frecuencia}>
                                <Select
                                    inputId="frecuencia"
                                    options={opcionesFrecuencias}
                                    value={buscarOpcion(opcionesFrecuencias, data.frecuencia)}
                                    onChange={(opcion) => setData((prev) => ({ ...prev, frecuencia: opcion?.value ?? '' }))}
                                    placeholder="Seleccione..."
                                    isClearable
                                    isDisabled={processing}
                                    styles={selectStyles(Boolean(errors.frecuencia))}
                                />
                            </CampoSelect>

                            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                                {turnoSeleccionado ? (
                                    <>
                                        Turno seleccionado: <strong>{turnoSeleccionado.nombre}</strong> (
                                        {formatearHora(turnoSeleccionado.hora_inicio)} -{' '}
                                        {formatearHora(turnoSeleccionado.hora_fin)}).
                                    </>
                                ) : (
                                    'Seleccione un turno para visualizar su rango de referencia.'
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4">
                            <h2 className="text-base font-bold text-slate-900">Información del aula</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Se completa automáticamente con el aula seleccionada.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <CampoLectura label="Tipo de aula" value={aulaSeleccionada?.tipo ?? ''} />
                            <CampoLectura label="Número" value={aulaSeleccionada?.numero_aula ?? ''} />
                            <CampoLectura label="Capacidad" value={aulaSeleccionada?.capacidad ?? ''} />
                            <CampoLectura label="Pabellón" value={aulaSeleccionada?.pabellon?.nombre ?? ''} />
                        </div>
                    </section>
                </div>

                <aside className="xl:col-span-3">
                    <div className="sticky top-5 space-y-4">
                        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-base font-bold text-slate-900">Resumen</h2>
                            <p className="mt-1 text-sm text-slate-500">Verifique antes de registrar.</p>

                            <div className="mt-4 space-y-3">
                                <ResumenItem
                                    label="Periodo"
                                    value={obtenerNombrePeriodo(periodoSeleccionado) || 'No seleccionado'}
                                />
                                <ResumenItem
                                    label="Plan"
                                    value={planSeleccionado?.nombre ?? 'No seleccionado'}
                                />
                                <ResumenItem
                                    label="Docente"
                                    value={obtenerNombreDocente(docenteSeleccionado) || 'No seleccionado'}
                                />
                                <ResumenItem
                                    label="Curso"
                                    value={cursoSeleccionado?.nombre ?? 'No seleccionado'}
                                />
                                <ResumenItem
                                    label="Sección"
                                    value={seccionSeleccionada?.nombre ?? 'No seleccionada'}
                                />

                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                        Programación
                                    </p>
                                    {horariosResumen.length > 0 ? (
                                        <div className="mt-2 space-y-1.5">
                                            {horariosResumen.map((horario, indice) => (
                                                <p key={indice} className="text-sm font-semibold text-slate-800">
                                                    {horario}
                                                </p>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="mt-1 text-sm font-semibold text-slate-800">No definida</p>
                                    )}
                                </div>

                                <ResumenItem
                                    label="Frecuencia"
                                    value={data.frecuencia || 'No seleccionada'}
                                />
                                <ResumenItem
                                    label="Aula"
                                    value={
                                        aulaSeleccionada
                                            ? [aulaSeleccionada.nombre, aulaSeleccionada.numero_aula]
                                                  .filter(Boolean)
                                                  .join(' - ')
                                            : 'No seleccionada'
                                    }
                                />
                            </div>
                        </section>

                        <button
                            type="submit"
                            disabled={processing || cargandoCursos}
                            className="flex h-[44px] w-full items-center justify-center rounded-lg bg-[#315d7a] px-5 text-sm font-semibold text-white transition hover:bg-[#274b63] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {processing ? 'Registrando...' : 'Registrar horario'}
                        </button>

                        <Link
                            href={route('horarios.index')}
                            className="flex h-[44px] w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                            Cancelar
                        </Link>
                    </div>
                </aside>
            </form>
        </AuthenticatedLayout>
    );
}

function CampoSelect({ label, required = false, error, children }) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
                {label}
                {required && <span className="ml-1 text-rose-500">*</span>}
            </label>
            {children}
            {error && <p className="mt-1 text-sm text-rose-600">{error}</p>}
        </div>
    );
}

function CampoLectura({ label, value }) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
            <input
                type="text"
                value={value}
                readOnly
                placeholder="Automático"
                className="h-[42px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none"
            />
        </div>
    );
}

function ResumenItem({ label, value }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
        </div>
    );
}