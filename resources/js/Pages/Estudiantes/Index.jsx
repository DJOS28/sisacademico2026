import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Head,
    Link,
    router,
} from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

export default function Index({
    estudiantes: estudiantesIniciales,
    generos = [],
    grados = [],
    filtros = {},
}) {
    const [estudiantes, setEstudiantes] = useState(estudiantesIniciales);
    const [buscar, setBuscar] = useState(filtros.buscar ?? '');
    const [genero, setGenero] = useState(filtros.genero ?? '');
    const [grado, setGrado] = useState(filtros.grado ?? '');
    const [discapacidad, setDiscapacidad] = useState(
        filtros.discapacidad !== undefined && filtros.discapacidad !== null
            ? String(filtros.discapacidad)
            : ''
    );
    const [cargando, setCargando] = useState(false);

    // Estados para el Modal de Importación Masiva
    const [modalImportar, setModalImportar] = useState(false);
    const [archivoExcel, setArchivoExcel] = useState(null);
    const [importando, setImportando] = useState(false);

    const primeraCarga = useRef(true);
    const controladorFiltro = useRef(null);

    useEffect(() => {
        setEstudiantes(estudiantesIniciales);
    }, [estudiantesIniciales]);

    const tieneFiltros = useMemo(
        () =>
            buscar.trim() !== '' ||
            genero !== '' ||
            grado !== '' ||
            discapacidad !== '',
        [buscar, genero, grado, discapacidad]
    );

    const formatearFecha = (fecha) => {
        if (!fecha) return '—';
        const date = new Date(fecha);
        if (Number.isNaN(date.getTime())) return fecha;
        return new Intl.DateTimeFormat('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(date);
    };

    const formatearFechaHora = (fecha) => {
        if (!fecha) return '—';
        const date = new Date(fecha);
        if (Number.isNaN(date.getTime())) return fecha;
        return new Intl.DateTimeFormat('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const obtenerFoto = (ruta) => {
        if (!ruta) return null;
        if (
            String(ruta).startsWith('http://') ||
            String(ruta).startsWith('https://') ||
            String(ruta).startsWith('/storage/')
        ) {
            return ruta;
        }
        return `/storage/${ruta}`;
    };

    const filtrar = async (pagina = 1, moverArriba = false) => {
        controladorFiltro.current?.abort();
        controladorFiltro.current = new AbortController();
        setCargando(true);

        try {
            const response = await axios.post(
                route('estudiantes.filtrar'),
                {
                    buscar: buscar.trim(),
                    genero,
                    grado,
                    discapacidad,
                    page: pagina,
                },
                {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    signal: controladorFiltro.current.signal,
                }
            );

            setEstudiantes(response.data.estudiantes);

            if (moverArriba) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (error) {
            if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') return;

            let mensaje = 'No se pudo realizar la búsqueda de estudiantes.';
            if (error.response?.status === 422) {
                const errores = error.response.data?.errors ?? {};
                mensaje = Object.values(errores)?.[0]?.[0] ?? mensaje;
            }

            Swal.fire({
                title: 'Error',
                text: mensaje,
                icon: 'error',
                confirmButtonText: 'Aceptar',
            });
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        if (primeraCarga.current) {
            primeraCarga.current = false;
            return;
        }

        const temporizador = window.setTimeout(() => {
            filtrar(1);
        }, 400);

        return () => window.clearTimeout(temporizador);
    }, [buscar, genero, grado, discapacidad]);

    const limpiarFiltros = () => {
        setBuscar('');
        setGenero('');
        setGrado('');
        setDiscapacidad('');
    };

    const cambiarPagina = (pagina) => {
        if (
            pagina < 1 ||
            pagina > estudiantes.last_page ||
            pagina === estudiantes.current_page ||
            cargando
        ) {
            return;
        }
        filtrar(pagina, true);
    };

    const manejarImportacion = async (e) => {
        e.preventDefault();

        if (!archivoExcel) {
            Swal.fire('Atención', 'Seleccione un archivo Excel (.xlsx, .xls o .csv).', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('archivo_excel', archivoExcel);

        setImportando(true);

        Swal.fire({
            title: 'Importando y sincronizando con Moodle...',
            text: 'Por favor espere mientras se registran las cuentas.',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

        try {
            const res = await axios.post(route('estudiantes.importar.masivo'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setModalImportar(false);
            setArchivoExcel(null);

            const { procesados, omitidos, errores } = res.data;

            let htmlDetalle = `<div style="text-align:left; font-size:13px; line-height: 1.6;">
                <p><strong>Registrados con éxito:</strong> <span style="color:#16a34a; font-weight: bold;">${procesados}</span></p>
                <p><strong>Omitidos / Observados:</strong> <span style="color:#dc2626; font-weight: bold;">${omitidos}</span></p>`;

            if (errores && errores.length > 0) {
                htmlDetalle += `<div style="max-height:140px; overflow-y:auto; margin-top:8px; padding:8px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0;">
                    <ul style="list-style:disc; padding-left:16px; margin:0; font-size:12px; color:#475569;">
                        ${errores.map((err) => `<li>${err}</li>`).join('')}
                    </ul>
                </div>`;
            }
            htmlDetalle += '</div>';

            await Swal.fire({
                title: 'Importación Finalizada',
                html: htmlDetalle,
                icon: omitidos > 0 && procesados === 0 ? 'warning' : 'success',
                confirmButtonColor: '#315d7a',
            });

            filtrar(1);
        } catch (error) {
            const mensaje = error.response?.data?.message || 'Ocurrió un error al procesar el archivo.';
            Swal.fire('Error en la importación', mensaje, 'error');
        } finally {
            setImportando(false);
        }
    };

    const eliminar = async (estudiante) => {
        const resultado = await Swal.fire({
            title: '¿Eliminar estudiante?',
            html: `
                <div style="text-align:left; line-height:1.7;">
                    <p><strong>Estudiante:</strong> ${estudiante.nombres ?? ''} ${estudiante.apellidos ?? ''}</p>
                    <p><strong>DNI:</strong> ${estudiante.dni ?? '—'}</p>
                    <p><strong>Código:</strong> ${estudiante.codigo_postulante ?? 'Sin código'}</p>
                    <p style="margin-top:10px; color:#dc2626;">Esta acción eliminará el registro y su usuario vinculado en Moodle.</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            reverseButtons: true,
        });

        if (!resultado.isConfirmed) return;

        router.delete(route('estudiantes.destroy', estudiante.id_postulante), {
            preserveScroll: true,
            onStart: () => {
                Swal.fire({
                    title: 'Eliminando estudiante...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading(),
                });
            },
            onSuccess: async (page) => {
                const error = page.props?.flash?.error;
                if (error) {
                    await Swal.fire('No se pudo eliminar', error, 'error');
                    return;
                }

                await Swal.fire({
                    title: 'Estudiante eliminado',
                    text: page.props?.flash?.success ?? 'El estudiante se eliminó correctamente.',
                    icon: 'success',
                    timer: 1600,
                    showConfirmButton: false,
                });

                const paginaObjetivo =
                    estudiantes.data.length === 1 && estudiantes.current_page > 1
                        ? estudiantes.current_page - 1
                        : estudiantes.current_page;

                filtrar(paginaObjetivo);
            },
            onError: (errores) => {
                const mensaje = errores?.estudiante ?? errores?.error ?? 'No se pudo eliminar el estudiante.';
                Swal.fire('No se pudo eliminar', mensaje, 'error');
            },
            onFinish: () => {
                if (Swal.isLoading()) Swal.close();
            },
        });
    };

    const obtenerPaginas = () => {
        const paginaActual = estudiantes.current_page;
        const ultimaPagina = estudiantes.last_page;
        const paginas = [];

        let inicio = Math.max(1, paginaActual - 2);
        let fin = Math.min(ultimaPagina, paginaActual + 2);

        if (paginaActual <= 3) fin = Math.min(5, ultimaPagina);
        if (paginaActual >= ultimaPagina - 2) inicio = Math.max(1, ultimaPagina - 4);

        for (let pagina = inicio; pagina <= fin; pagina += 1) {
            paginas.push(pagina);
        }

        return paginas;
    };

    const badgeGrado = (gradoActual) => {
        const clases = {
            Postulante: 'bg-amber-50 text-amber-700',
            Ingresante: 'bg-blue-50 text-blue-700',
            Estudiante: 'bg-emerald-50 text-emerald-700',
            Egresado:   'bg-violet-50 text-violet-700',
        };
        return clases[gradoActual] ?? 'bg-slate-100 text-slate-700';
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Estudiantes</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Administre los postulantes, ingresantes, estudiantes y egresados registrados.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* BOTÓN APERTURA MODAL IMPORTACIÓN MASIVA */}
                        <button
                            type="button"
                            onClick={() => setModalImportar(true)}
                            className="flex h-[42px] items-center justify-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-xs cursor-pointer"
                        >
                            📄 Carga Masiva (Excel)
                        </button>

                        {/* BOTÓN NUEVO ESTUDIANTE */}
                        <Link
                            href={route('estudiantes.create')}
                            className="flex h-[42px] items-center justify-center rounded-lg bg-[#315d7a] px-4 text-sm font-semibold text-white transition hover:bg-[#274b63] shadow-xs"
                        >
                            + Nuevo estudiante
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Estudiantes" />

            {/* BARRA DE FILTROS */}
            <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12 xl:items-end">
                    <div className="xl:col-span-4">
                        <label htmlFor="buscar" className="mb-2 block text-sm font-semibold text-slate-700">
                            Buscar
                        </label>
                        <div className="relative">
                            <input
                                id="buscar"
                                type="search"
                                value={buscar}
                                onChange={(event) => setBuscar(event.target.value)}
                                autoComplete="off"
                                placeholder="Código, DNI, nombres, apellidos o correo..."
                                className="h-[42px] w-full rounded-lg border border-slate-300 px-3 pr-11 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                            />
                            {cargando && (
                                <span className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-300 border-t-[#315d7a]" />
                            )}
                        </div>
                    </div>

                    <div className="xl:col-span-2">
                        <label htmlFor="genero" className="mb-2 block text-sm font-semibold text-slate-700">
                            Género
                        </label>
                        <select
                            id="genero"
                            value={genero}
                            onChange={(event) => setGenero(event.target.value)}
                            className="h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                        >
                            <option value="">Todos</option>
                            {generos.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="xl:col-span-2">
                        <label htmlFor="grado" className="mb-2 block text-sm font-semibold text-slate-700">
                            Condición
                        </label>
                        <select
                            id="grado"
                            value={grado}
                            onChange={(event) => setGrado(event.target.value)}
                            className="h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                        >
                            <option value="">Todas</option>
                            {grados.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="xl:col-span-2">
                        <label htmlFor="discapacidad" className="mb-2 block text-sm font-semibold text-slate-700">
                            Discapacidad
                        </label>
                        <select
                            id="discapacidad"
                            value={discapacidad}
                            onChange={(event) => setDiscapacidad(event.target.value)}
                            className="h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                        >
                            <option value="">Todos</option>
                            <option value="1">Sí</option>
                            <option value="0">No</option>
                        </select>
                    </div>

                    <div className="xl:col-span-2">
                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            disabled={!tieneFiltros || cargando}
                            className="flex h-[42px] w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* TABLA DE RESULTADOS */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Estudiante
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Documento
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Contacto
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Colegio
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Condición
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Matrículas
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Registro
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Acciones
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {estudiantes.data?.length > 0 ? (
                                estudiantes.data.map((estudiante) => {
                                    const foto = obtenerFoto(estudiante.foto_postulante);
                                    const nombreCompleto = `${estudiante.nombres ?? ''} ${estudiante.apellidos ?? ''}`.trim();

                                    return (
                                        <tr key={estudiante.id_postulante} className="transition hover:bg-slate-50">
                                            <td className="px-4 py-3">
                                                <div className="flex min-w-[220px] items-center gap-3">
                                                    {foto ? (
                                                        <img
                                                            src={foto}
                                                            alt={nombreCompleto}
                                                            className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover"
                                                            onError={(event) => {
                                                                event.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#315d7a]/10 text-sm font-bold text-[#315d7a]">
                                                            {String(estudiante.nombres ?? 'E').trim().charAt(0).toUpperCase()}
                                                        </div>
                                                    )}

                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            {nombreCompleto}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-slate-400">
                                                            {estudiante.codigo_postulante
                                                                ? `Código: ${estudiante.codigo_postulante}`
                                                                : `ID: ${estudiante.id_postulante}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3">
                                                <p className="text-sm font-semibold text-slate-700">
                                                    {estudiante.dni ?? '—'}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-400">
                                                    {estudiante.genero ?? 'Sin género registrado'}
                                                </p>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="min-w-[180px]">
                                                    <p className="truncate text-sm text-slate-700">
                                                        {estudiante.email ?? 'Sin correo'}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-slate-400">
                                                        {estudiante.telefono ?? 'Sin teléfono'}
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                <p className="min-w-[170px] text-sm text-slate-700">
                                                    {estudiante.colegio?.nombre ??
                                                        estudiante.colegio?.nombre_colegio ??
                                                        'Sin colegio registrado'}
                                                </p>
                                            </td>

                                            <td className="px-4 py-3 text-center">
                                                <span
                                                    className={`inline-flex min-w-[88px] items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${badgeGrado(
                                                        estudiante.grado
                                                    )}`}
                                                >
                                                    {estudiante.grado ?? 'Postulante'}
                                                </span>
                                                {Boolean(estudiante.discapacidad) && (
                                                    <p className="mt-1 text-xs font-medium text-amber-700">
                                                        Con discapacidad
                                                    </p>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex min-w-[68px] items-center justify-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                                    {estudiante.matriculas_count ?? 0}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3">
                                                <p className="text-sm text-slate-600">
                                                    {formatearFechaHora(
                                                        estudiante.fecha_registro ?? estudiante.created_at
                                                    )}
                                                </p>
                                                {estudiante.fecha_nacimiento && (
                                                    <p className="mt-0.5 text-xs text-slate-400">
                                                        Nacimiento: {formatearFecha(estudiante.fecha_nacimiento)}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={route(
                                                            'estudiantes.edit',
                                                            estudiante.id_postulante
                                                        )}
                                                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                                    >
                                                        Editar
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() => eliminar(estudiante)}
                                                        disabled={
                                                            Number(estudiante.inscripciones_count ?? 0) > 0 ||
                                                            Number(estudiante.matriculas_count ?? 0) > 0
                                                        }
                                                        title={
                                                            Number(estudiante.inscripciones_count ?? 0) > 0 ||
                                                            Number(estudiante.matriculas_count ?? 0) > 0
                                                                ? 'No se puede eliminar porque tiene movimientos académicos'
                                                                : 'Eliminar estudiante'
                                                        }
                                                        className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center">
                                        <p className="text-sm font-semibold text-slate-600">
                                            No se encontraron estudiantes.
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            Cambie los filtros o registre un nuevo estudiante.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINACIÓN */}
                {estudiantes.total > 0 && (
                    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                            Mostrando <span className="font-semibold text-slate-700">{estudiantes.from}</span> a{' '}
                            <span className="font-semibold text-slate-700">{estudiantes.to}</span> de{' '}
                            <span className="font-semibold text-slate-700">{estudiantes.total}</span> registros
                        </p>

                        {estudiantes.last_page > 1 && (
                            <div className="flex flex-wrap items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => cambiarPagina(estudiantes.current_page - 1)}
                                    disabled={estudiantes.current_page === 1 || cargando}
                                    className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Anterior
                                </button>

                                {obtenerPaginas().map((pagina) => (
                                    <button
                                        key={pagina}
                                        type="button"
                                        onClick={() => cambiarPagina(pagina)}
                                        disabled={cargando}
                                        className={`h-8 min-w-8 rounded-md px-2 text-xs font-semibold transition ${
                                            pagina === estudiantes.current_page
                                                ? 'bg-[#315d7a] text-white'
                                                : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        {pagina}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => cambiarPagina(estudiantes.current_page + 1)}
                                    disabled={estudiantes.current_page === estudiantes.last_page || cargando}
                                    className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* MODAL DE IMPORTACIÓN MASIVA MEJORADO */}
            {modalImportar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
                        {/* Cabecera del modal */}
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    Carga Masiva de Estudiantes
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Importe estudiantes y sincronice sus accesos con Moodle.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!importando) {
                                        setModalImportar(false);
                                        setArchivoExcel(null);
                                    }
                                }}
                                className="text-slate-400 hover:text-slate-600 text-lg"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Paso 1: Descargar Plantilla */}
                        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold text-slate-800">Paso 1: Descargue el formato oficial</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Use la plantilla con las columnas exactas requeridas.
                                    </p>
                                </div>
                                <a
                                    href={route('estudiantes.descargar.plantilla')}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-100 hover:text-[#315d7a]"
                                >
                                    📥 Descargar Plantilla
                                </a>
                            </div>
                        </div>

                        {/* Paso 2: Formulario y Subida */}
                        <form onSubmit={manejarImportacion} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-xs font-bold text-slate-700">
                                    Paso 2: Seleccione el archivo completado (.xlsx, .xls o .csv)
                                </label>
                                <input
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={(e) => setArchivoExcel(e.target.files?.[0] ?? null)}
                                    disabled={importando}
                                    className="block w-full rounded-lg border border-slate-300 bg-white text-xs text-slate-600 file:mr-3 file:border-0 file:bg-slate-100 file:px-3 file:py-2.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                                />
                            </div>

                            {/* Instrucciones y Reglas de Negocio */}
                            <div className="rounded-lg bg-blue-50/70 p-3.5 text-xs text-blue-900 border border-blue-100 space-y-1.5">
                                <p className="font-bold flex items-center gap-1">
                                    ℹ️ Consideraciones de la carga:
                                </p>
                                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                                    <li>Las columnas <strong>dni</strong>, <strong>nombres</strong> y <strong>apellidos</strong> son obligatorias.</li>
                                    <li>El usuario de acceso creado será su <strong>DNI</strong>.</li>
                                    <li>La contraseña institucional para Moodle será <strong>DNI@Est2026</strong>.</li>
                                    <li>Se asignará automáticamente la condición y rol de <strong>Estudiante</strong>.</li>
                                </ul>
                            </div>

                            {/* Botones de Acción */}
                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    disabled={importando}
                                    onClick={() => {
                                        setModalImportar(false);
                                        setArchivoExcel(null);
                                    }}
                                    className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={importando || !archivoExcel}
                                    className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer shadow-xs"
                                >
                                    {importando ? 'Procesando...' : 'Subir e Importar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}