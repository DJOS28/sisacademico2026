import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Head,
    Link,
    router,
} from '@inertiajs/react';
import axios from 'axios';
import Select from 'react-select';
import Swal from 'sweetalert2';
import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

const selectStyles = () => ({
    control: (base, state) => ({
        ...base,
        minHeight: '42px',
        height: '42px',
        borderRadius: '0.5rem',
        borderColor: state.isFocused
            ? '#315d7a'
            : '#cbd5e1',
        boxShadow: state.isFocused
            ? '0 0 0 2px rgba(49, 93, 122, 0.20)'
            : 'none',
        backgroundColor: state.isDisabled
            ? '#f1f5f9'
            : '#ffffff',
        fontSize: '0.875rem',

        '&:hover': {
            borderColor: '#315d7a',
        },
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

    singleValue: (base) => ({
        ...base,
        color: '#334155',
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
        color: state.isSelected
            ? '#ffffff'
            : '#334155',
    }),
});

export default function Index({
    horarios: horariosIniciales,
    docentes = [],
    periodos = [],
    dias = [],
    filtros = {},
}) {
    const [horarios, setHorarios] = useState(
        horariosIniciales
    );

    const [buscar, setBuscar] = useState(
        filtros.buscar ?? ''
    );

    const [idDocente, setIdDocente] = useState(
        filtros.id_docente
            ? String(filtros.id_docente)
            : ''
    );

    const [idCurso, setIdCurso] = useState(
        filtros.id_curso
            ? String(filtros.id_curso)
            : ''
    );

    const [idPeriodo, setIdPeriodo] = useState(
        filtros.id_periodo
            ? String(filtros.id_periodo)
            : ''
    );

    const [dia, setDia] = useState(
        filtros.dia ?? ''
    );

    const [cursos, setCursos] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [cargandoCursos, setCargandoCursos] =
        useState(false);

    const primeraCarga = useRef(true);
    const controladorFiltro = useRef(null);

    useEffect(() => {
        setHorarios(horariosIniciales);
    }, [horariosIniciales]);

    const obtenerNombreDocente = (docente) => {
        if (!docente) {
            return 'Sin docente';
        }

        return [
            docente.nombre,
            docente.apellido,
        ]
            .filter(Boolean)
            .join(' ');
    };

    const obtenerNombrePeriodo = (periodo) => {
        if (!periodo) {
            return 'Sin periodo';
        }

        return (
            periodo.nombre ??
            periodo.periodo ??
            periodo.descripcion ??
            periodo.anio ??
            `Periodo ${periodo.id}`
        );
    };

    const formatearHora = (hora) => {
        if (!hora) {
            return '—';
        }

        return String(hora).substring(0, 5);
    };

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

    const opcionesPeriodos = useMemo(
        () =>
            periodos.map((periodo) => ({
                value: String(periodo.id),
                label: obtenerNombrePeriodo(periodo),
            })),
        [periodos]
    );

    const opcionesDias = useMemo(
        () =>
            dias.map((diaItem) => ({
                value: diaItem,
                label: diaItem,
            })),
        [dias]
    );

    const buscarOpcion = (
        opciones,
        valor
    ) =>
        opciones.find(
            (opcion) =>
                String(opcion.value) ===
                String(valor)
        ) ?? null;

    const filtrar = async (
        pagina = 1,
        mantenerScroll = true
    ) => {
        controladorFiltro.current?.abort();

        controladorFiltro.current =
            new AbortController();

        setCargando(true);

        try {
            const response = await axios.post(
                route('horarios.filtrar'),
                {
                    buscar: buscar.trim(),

                    id_docente:
                        idDocente || null,

                    id_curso:
                        idCurso || null,

                    id_periodo:
                        idPeriodo || null,

                    dia:
                        dia || null,

                    page:
                        pagina,
                },
                {
                    headers: {
                        Accept:
                            'application/json',

                        'X-Requested-With':
                            'XMLHttpRequest',
                    },

                    signal:
                        controladorFiltro.current
                            .signal,
                }
            );

            setHorarios(
                response.data.horarios
            );

            if (
                Array.isArray(
                    response.data.cursos
                )
            ) {
                setCursos(
                    response.data.cursos
                );
            }

            if (!mantenerScroll) {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth',
                });
            }
        } catch (error) {
            if (
                error.code === 'ERR_CANCELED' ||
                error.name === 'CanceledError'
            ) {
                return;
            }

            let mensaje =
                'No se pudo realizar la búsqueda de horarios.';

            if (
                error.response?.status === 422
            ) {
                const errores =
                    error.response.data?.errors ??
                    {};

                mensaje =
                    Object.values(
                        errores
                    )?.[0]?.[0] ??
                    mensaje;
            }

            Swal.fire({
                title: 'Error',
                text: mensaje,
                icon: 'error',
                confirmButtonText: 'Aceptar',
            });
        } finally {
            setCargando(false);
            setCargandoCursos(false);
        }
    };

    useEffect(() => {
        if (primeraCarga.current) {
            primeraCarga.current = false;

            if (idDocente) {
                setCargandoCursos(true);
                filtrar(1, true);
            }

            return;
        }

        const temporizador =
            window.setTimeout(() => {
                filtrar(1, true);
            }, 400);

        return () => {
            window.clearTimeout(
                temporizador
            );
        };
    }, [
        buscar,
        idDocente,
        idCurso,
        idPeriodo,
        dia,
    ]);

    const cambiarDocente = (opcion) => {
        const docenteId =
            opcion?.value ?? '';

        setIdDocente(docenteId);
        setIdCurso('');
        setCursos([]);

        if (docenteId) {
            setCargandoCursos(true);
        }
    };

    const limpiarFiltros = () => {
        setBuscar('');
        setIdDocente('');
        setIdCurso('');
        setIdPeriodo('');
        setDia('');
        setCursos([]);
        setCargandoCursos(false);
    };

    const tieneFiltros =
        buscar !== '' ||
        idDocente !== '' ||
        idCurso !== '' ||
        idPeriodo !== '' ||
        dia !== '';

    const cambiarPagina = (pagina) => {
        if (
            pagina < 1 ||
            pagina > horarios.last_page ||
            pagina === horarios.current_page ||
            cargando
        ) {
            return;
        }

        filtrar(pagina, false);
    };

    const eliminar = async (horario) => {
        const resultado = await Swal.fire({
            title: '¿Eliminar horario?',

            html: `
                <div style="text-align:left;line-height:1.7">
                    <p>
                        <strong>Docente:</strong>
                        ${obtenerNombreDocente(
                            horario.docente
                        )}
                    </p>

                    <p>
                        <strong>Curso:</strong>
                        ${
                            horario.curso?.nombre ??
                            'Sin curso'
                        }
                    </p>

                    <p>
                        <strong>Día:</strong>
                        ${
                            horario.dia ??
                            'Sin día'
                        }
                    </p>

                    <p>
                        <strong>Hora:</strong>
                        ${formatearHora(
                            horario.hora_inicio
                        )}
                        -
                        ${formatearHora(
                            horario.hora_fin
                        )}
                    </p>
                </div>
            `,

            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
        });

        if (!resultado.isConfirmed) {
            return;
        }

        router.delete(
            route(
                'horarios.destroy',
                horario.id
            ),
            {
                preserveScroll: true,

                onStart: () => {
                    Swal.fire({
                        title: 'Eliminando...',
                        allowOutsideClick: false,
                        allowEscapeKey: false,

                        didOpen: () =>
                            Swal.showLoading(),
                    });
                },

                onSuccess: async (page) => {
                    const error =
                        page.props?.flash?.error;

                    if (error) {
                        await Swal.fire({
                            title:
                                'No se pudo eliminar',

                            text:
                                error,

                            icon:
                                'error',

                            confirmButtonText:
                                'Aceptar',
                        });

                        return;
                    }

                    const mensaje =
                        page.props?.flash
                            ?.success ??
                        'Horario eliminado correctamente.';

                    await Swal.fire({
                        title:
                            'Horario eliminado',

                        text:
                            mensaje,

                        icon:
                            'success',

                        timer:
                            1700,

                        showConfirmButton:
                            false,
                    });

                    const paginaObjetivo =
                        horarios.data.length === 1 &&
                        horarios.current_page > 1
                            ? horarios.current_page - 1
                            : horarios.current_page;

                    filtrar(
                        paginaObjetivo,
                        true
                    );
                },

                onError: (errors) => {
                    const mensaje =
                        errors?.horario ??
                        errors?.error ??
                        'No se pudo eliminar el horario.';

                    Swal.fire({
                        title:
                            'No se pudo eliminar',

                        text:
                            mensaje,

                        icon:
                            'error',

                        confirmButtonText:
                            'Aceptar',
                    });
                },

                onFinish: () => {
                    if (Swal.isLoading()) {
                        Swal.close();
                    }
                },
            }
        );
    };

    const obtenerPaginas = () => {
        const paginaActual =
            horarios.current_page;

        const ultimaPagina =
            horarios.last_page;

        const paginas = [];

        let inicio = Math.max(
            1,
            paginaActual - 2
        );

        let fin = Math.min(
            ultimaPagina,
            paginaActual + 2
        );

        if (paginaActual <= 3) {
            fin = Math.min(
                5,
                ultimaPagina
            );
        }

        if (
            paginaActual >=
            ultimaPagina - 2
        ) {
            inicio = Math.max(
                1,
                ultimaPagina - 4
            );
        }

        for (
            let pagina = inicio;
            pagina <= fin;
            pagina += 1
        ) {
            paginas.push(pagina);
        }

        return paginas;
    };

    const obtenerAula = (horario) => {
        if (horario.aula) {
            const nombre =
                horario.aula.nombre ??
                'Aula';

            const numero =
                horario.aula.numero_aula
                    ? ` - ${horario.aula.numero_aula}`
                    : '';

            const pabellon =
                horario.aula.pabellon?.nombre
                    ? ` (${horario.aula.pabellon.nombre})`
                    : '';

            return `${nombre}${numero}${pabellon}`;
        }

        if (horario.numero_aula) {
            return horario.numero_aula;
        }

        return 'Sin aula';
    };

    const generarPdfDocente = () => {
        if (!idDocente) {
            Swal.fire({
                title: 'Seleccione un docente',
                text: 'Debe seleccionar un docente para generar su horario en PDF.',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
            });

            return;
        }

        const url = route(
            'horarios.pdf-docente',
            {
                docente: idDocente,
                id_periodo: idPeriodo || undefined,
            }
        );

        window.open(
            url,
            '_blank',
            'noopener,noreferrer'
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Horarios
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Gestión de horarios académicos.
                        </p>
                    </div>

                    <Link
                        href={route(
                            'horarios.create'
                        )}
                        className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#274b63]"
                    >
                        Nuevo horario
                    </Link>
                </div>
            }
        >
            <Head title="Horarios" />

            <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6 xl:items-end">
                    <div className="xl:col-span-2">
                        <label
                            htmlFor="buscar"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Buscar
                        </label>

                        <div className="relative">
                            <input
                                id="buscar"
                                type="search"
                                value={buscar}
                                onChange={(event) =>
                                    setBuscar(
                                        event.target.value
                                    )
                                }
                                placeholder="Docente, curso, aula, sección..."
                                autoComplete="off"
                                className="h-[42px] w-full rounded-lg border border-slate-300 px-3 pr-14 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                            />

                            {cargando && (
                                <span
                                    className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-300 border-t-[#315d7a]"
                                    aria-label="Filtrando"
                                />
                            )}
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="id_docente"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Docente
                        </label>

                        <Select
                            inputId="id_docente"
                            options={opcionesDocentes}
                            value={buscarOpcion(
                                opcionesDocentes,
                                idDocente
                            )}
                            onChange={cambiarDocente}
                            placeholder="Buscar docente..."
                            noOptionsMessage={() =>
                                'Sin resultados'
                            }
                            isClearable
                            isDisabled={cargando}
                            styles={selectStyles()}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="id_curso"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Curso
                        </label>

                        <Select
                            inputId="id_curso"
                            options={opcionesCursos}
                            value={buscarOpcion(
                                opcionesCursos,
                                idCurso
                            )}
                            onChange={(opcion) =>
                                setIdCurso(
                                    opcion?.value ?? ''
                                )
                            }
                            placeholder={
                                !idDocente
                                    ? 'Seleccione docente'
                                    : cargandoCursos
                                      ? 'Cargando...'
                                      : cursos.length === 0
                                        ? 'Sin cursos'
                                        : 'Buscar curso...'
                            }
                            noOptionsMessage={() =>
                                'Sin cursos registrados'
                            }
                            isClearable
                            isLoading={cargandoCursos}
                            isDisabled={
                                cargando ||
                                cargandoCursos ||
                                !idDocente
                            }
                            styles={selectStyles()}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="id_periodo"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Periodo
                        </label>

                        <Select
                            inputId="id_periodo"
                            options={opcionesPeriodos}
                            value={buscarOpcion(
                                opcionesPeriodos,
                                idPeriodo
                            )}
                            onChange={(opcion) =>
                                setIdPeriodo(
                                    opcion?.value ?? ''
                                )
                            }
                            placeholder="Buscar periodo..."
                            noOptionsMessage={() =>
                                'Sin resultados'
                            }
                            isClearable
                            isDisabled={cargando}
                            styles={selectStyles()}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="dia"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Día
                        </label>

                        <Select
                            inputId="dia"
                            options={opcionesDias}
                            value={buscarOpcion(
                                opcionesDias,
                                dia
                            )}
                            onChange={(opcion) =>
                                setDia(
                                    opcion?.value ?? ''
                                )
                            }
                            placeholder="Buscar día..."
                            noOptionsMessage={() =>
                                'Sin resultados'
                            }
                            isClearable
                            isDisabled={cargando}
                            styles={selectStyles()}
                        />
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-3">
                    <button
                        type="button"
                        onClick={limpiarFiltros}
                        disabled={
                            !tieneFiltros ||
                            cargando
                        }
                        className="flex h-[42px] items-center justify-center whitespace-nowrap rounded-lg border border-slate-300 bg-white px-4 py-0 text-sm font-semibold leading-none text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Limpiar filtros
                    </button>

                    <button
                        type="button"
                        onClick={generarPdfDocente}
                        disabled={
                            !idDocente ||
                            cargando
                        }
                        className="flex h-[42px] items-center justify-center whitespace-nowrap rounded-lg bg-[#315d7a] px-4 py-0 text-sm font-semibold leading-none text-white transition hover:bg-[#274b63] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Generar PDF
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Docente
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Curso
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Día y hora
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Aula
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Sección
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Periodo
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Frecuencia
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Acciones
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {horarios.data?.length > 0 ? (
                                horarios.data.map(
                                    (horario) => (
                                        <tr
                                            key={horario.id}
                                            className="transition hover:bg-slate-50"
                                        >
                                            <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                                                {obtenerNombreDocente(
                                                    horario.docente
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-sm text-slate-700">
                                                {horario.curso
                                                    ?.nombre ??
                                                    'Sin curso'}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                                                <div className="font-semibold text-slate-700">
                                                    {horario.dia ??
                                                        'Sin día'}
                                                </div>

                                                <div className="mt-1 text-xs text-slate-500">
                                                    {formatearHora(
                                                        horario.hora_inicio
                                                    )}{' '}
                                                    -{' '}
                                                    {formatearHora(
                                                        horario.hora_fin
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {obtenerAula(
                                                    horario
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {horario.seccion
                                                    ?.nombre ??
                                                    'Sin sección'}
                                            </td>

                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {obtenerNombrePeriodo(
                                                    horario.periodo
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {horario.frecuencia ??
                                                    '—'}
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-2">
                                                    <Link
                                                        href={route(
                                                            'horarios.edit',
                                                            horario.id
                                                        )}
                                                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                                    >
                                                        Editar
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            eliminar(
                                                                horario
                                                            )
                                                        }
                                                        className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                )
                            ) : (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-4 py-12 text-center"
                                    >
                                        <p className="text-sm font-semibold text-slate-600">
                                            No se encontraron horarios.
                                        </p>

                                        <p className="mt-1 text-xs text-slate-400">
                                            Pruebe cambiando los filtros de búsqueda.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {horarios.total > 0 && (
                    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                            Mostrando{' '}
                            <span className="font-semibold text-slate-700">
                                {horarios.from}
                            </span>{' '}
                            a{' '}
                            <span className="font-semibold text-slate-700">
                                {horarios.to}
                            </span>{' '}
                            de{' '}
                            <span className="font-semibold text-slate-700">
                                {horarios.total}
                            </span>{' '}
                            registros
                        </p>

                        {horarios.last_page > 1 && (
                            <div className="flex flex-wrap items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() =>
                                        cambiarPagina(
                                            horarios.current_page -
                                                1
                                        )
                                    }
                                    disabled={
                                        horarios.current_page ===
                                            1 ||
                                        cargando
                                    }
                                    className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Anterior
                                </button>

                                {obtenerPaginas().map(
                                    (pagina) => (
                                        <button
                                            key={pagina}
                                            type="button"
                                            onClick={() =>
                                                cambiarPagina(
                                                    pagina
                                                )
                                            }
                                            disabled={cargando}
                                            className={`h-8 min-w-8 rounded-md px-2 text-xs font-semibold transition ${
                                                pagina ===
                                                horarios.current_page
                                                    ? 'bg-[#315d7a] text-white'
                                                    : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            {pagina}
                                        </button>
                                    )
                                )}

                                <button
                                    type="button"
                                    onClick={() =>
                                        cambiarPagina(
                                            horarios.current_page +
                                                1
                                        )
                                    }
                                    disabled={
                                        horarios.current_page ===
                                            horarios.last_page ||
                                        cargando
                                    }
                                    className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}