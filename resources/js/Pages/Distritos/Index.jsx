import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
export default function Index({
    distritos: distritosIniciales,
    departamentos = [],
    provincias: provinciasIniciales = [],
    filtros = {},
}) {
    const [distritos, setDistritos] = useState(distritosIniciales);
    const [buscar, setBuscar] = useState(filtros.buscar ?? '');
    const [idDepa, setIdDepa] = useState(
        filtros.idDepa ? String(filtros.idDepa) : ''
    );
    const [idProv, setIdProv] = useState(
        filtros.idProv ? String(filtros.idProv) : ''
    );
    const [provincias, setProvincias] = useState(
        provinciasIniciales ?? []
    );
    const [cargando, setCargando] = useState(false);
    const [cargandoProvincias, setCargandoProvincias] = useState(false);

    const primeraCarga = useRef(true);
    const primeraCargaProvincias = useRef(true);
    const controladorFetch = useRef(null);


    useEffect(() => {
        setDistritos(distritosIniciales);
    }, [distritosIniciales]);

    /**
     * Carga las provincias del departamento seleccionado.
     */
    useEffect(() => {
        if (primeraCargaProvincias.current) {
            primeraCargaProvincias.current = false;

            if (idDepa && provinciasIniciales.length > 0) {
                return;
            }
        }

        if (!idDepa) {
            setProvincias([]);
            setIdProv('');
            return;
        }

        controladorFetch.current?.abort();
        controladorFetch.current = new AbortController();

        setCargandoProvincias(true);
        setIdProv('');

        fetch(
            route('provincias.por-departamento', idDepa),
            {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                signal: controladorFetch.current.signal,
            }
        )
            .then((response) => {
                if (!response.ok) {
                    throw new Error(
                        'No se pudieron cargar las provincias.'
                    );
                }

                return response.json();
            })
            .then((result) => {
                setProvincias(result.provincias ?? []);
            })
            .catch((error) => {
                if (error.name === 'AbortError') {
                    return;
                }

                setProvincias([]);

                Swal.fire({
                    title: 'Error',
                    text: 'No se pudieron cargar las provincias del departamento seleccionado.',
                    icon: 'error',
                    confirmButtonText: 'Aceptar',
                });
            })
            .finally(() => {
                setCargandoProvincias(false);
            });

        return () => {
            controladorFetch.current?.abort();
        };
    }, [idDepa]);

    /**
     * Envía los filtros mediante AJAX con Inertia.
     */
    const filtrar = async (
    termino = buscar,
    departamento = idDepa,
    provincia = idProv,
    pagina = 1,
    mantenerScroll = true
) => {
    setCargando(true);

    try {
        const response = await axios.post(
            route('distritos.filtrar'),
            {
                buscar: termino.trim(),
                idDepa: departamento || null,
                idProv: provincia || null,
                page: pagina,
            },
            {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            }
        );

        setDistritos(response.data.distritos);

        if (response.data.provincias) {
            setProvincias(response.data.provincias);
        }

        if (!mantenerScroll) {
            window.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
        }
    } catch (error) {
        let mensaje = 'No se pudo realizar el filtrado.';

        if (error.response?.status === 422) {
            const errores = error.response.data?.errors;

            mensaje =
                errores?.buscar?.[0] ??
                errores?.idDepa?.[0] ??
                errores?.idProv?.[0] ??
                errores?.page?.[0] ??
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
    }
};

    /**
     * Ejecuta el filtro automáticamente.
     */
    useEffect(() => {
        if (primeraCarga.current) {
            primeraCarga.current = false;
            return;
        }

        const temporizador = setTimeout(() => {
            filtrar(
                buscar,
                idDepa,
                idProv,
                1
            );
        }, 400);

        return () => clearTimeout(temporizador);
    }, [buscar, idDepa, idProv]);

    /**
     * Limpia todos los filtros.
     */
    const limpiarFiltros = () => {
        setBuscar('');
        setIdDepa('');
        setIdProv('');
        setProvincias([]);
    };

    /**
     * Cambia de página manteniendo los filtros.
     */
    const cambiarPagina = (pagina) => {
        if (
            pagina < 1 ||
            pagina > distritos.last_page ||
            pagina === distritos.current_page ||
            cargando
        ) {
            return;
        }

        filtrar(
            buscar,
            idDepa,
            idProv,
            pagina,
            false
        );
    };

    /**
     * Elimina un distrito.
     */
    const eliminar = async (item) => {
        const result = await Swal.fire({
            title: '¿Eliminar distrito?',
            text: item.Distrito,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
        });

        if (!result.isConfirmed) {
            return;
        }

        router.delete(
            route('distritos.destroy', item.idDist),
            {
                preserveScroll: true,

                onStart: () => {
                    Swal.fire({
                        title: 'Eliminando...',
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        didOpen: () => {
                            Swal.showLoading();
                        },
                    });
                },

                onSuccess: (page) => {
                    const mensaje =
                        page.props?.flash?.success ??
                        'El distrito fue eliminado correctamente.';

                    Swal.fire({
                        title: 'Distrito eliminado',
                        text: mensaje,
                        icon: 'success',
                        timer: 1800,
                        showConfirmButton: false,
                    });
                },

                onError: (errors) => {
                    Swal.fire({
                        title: 'No se pudo eliminar',
                        text:
                            errors?.distrito ??
                            errors?.error ??
                            'El distrito puede tener institutos relacionados.',
                        icon: 'error',
                        confirmButtonText: 'Aceptar',
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

    /**
     * Obtiene las páginas visibles de la paginación.
     */
    const obtenerPaginas = () => {
        const paginaActual = distritos.current_page;
        const ultimaPagina = distritos.last_page;
        const paginas = [];

        let inicio = Math.max(1, paginaActual - 2);
        let fin = Math.min(
            ultimaPagina,
            paginaActual + 2
        );

        if (paginaActual <= 3) {
            fin = Math.min(5, ultimaPagina);
        }

        if (paginaActual >= ultimaPagina - 2) {
            inicio = Math.max(
                1,
                ultimaPagina - 4
            );
        }

        for (
            let pagina = inicio;
            pagina <= fin;
            pagina++
        ) {
            paginas.push(pagina);
        }

        return paginas;
    };

    const tieneFiltros =
        buscar !== '' ||
        idDepa !== '' ||
        idProv !== '';

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Distritos
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Mantenimiento de distritos.
                        </p>
                    </div>

                    <Link
                        href={route('distritos.create')}
                        className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#274b63]"
                    >
                        Nuevo distrito
                    </Link>
                </div>
            }
        >
            <Head title="Distritos" />

            {/* Filtros */}
            <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div>
                        <label
                            htmlFor="buscar"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Buscar distrito
                        </label>

                        <div className="relative">
                            <input
                                id="buscar"
                                type="search"
                                value={buscar}
                                onChange={(event) =>
                                    setBuscar(event.target.value)
                                }
                                placeholder="Escriba el nombre del distrito..."
                                autoComplete="off"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-20 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                            />

                            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
                                {cargando && (
                                    <span
                                        className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#315d7a]"
                                        aria-label="Buscando"
                                    />
                                )}

                                {buscar !== '' && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setBuscar('')
                                        }
                                        className="flex h-6 w-6 items-center justify-center rounded-full text-lg font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                        aria-label="Limpiar búsqueda"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="idDepa"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Departamento
                        </label>

                        <select
                            id="idDepa"
                            value={idDepa}
                            onChange={(event) =>
                                setIdDepa(event.target.value)
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                        >
                            <option value="">
                                Todos los departamentos
                            </option>

                            {departamentos.map((item) => (
                                <option
                                    key={item.idDepa}
                                    value={item.idDepa}
                                >
                                    {item.Departamento}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="idProv"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Provincia
                        </label>

                        <div className="relative">
                            <select
                                id="idProv"
                                value={idProv}
                                onChange={(event) =>
                                    setIdProv(event.target.value)
                                }
                                disabled={
                                    !idDepa ||
                                    cargandoProvincias
                                }
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                            >
                                <option value="">
                                    {!idDepa
                                        ? 'Seleccione un departamento'
                                        : cargandoProvincias
                                          ? 'Cargando provincias...'
                                          : 'Todas las provincias'}
                                </option>

                                {provincias.map((item) => (
                                    <option
                                        key={item.idProv}
                                        value={item.idProv}
                                    >
                                        {item.Provincia}
                                    </option>
                                ))}
                            </select>

                            {cargandoProvincias && (
                                <span
                                    className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-300 border-t-[#315d7a]"
                                    aria-label="Cargando provincias"
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                        Los resultados se actualizan automáticamente.
                    </p>

                    {tieneFiltros && (
                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            </div>

            {/* Tabla */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Distrito
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Provincia
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Departamento
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Acciones
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {distritos.data.length > 0 ? (
                                distritos.data.map((item) => (
                                    <tr
                                        key={item.idDist}
                                        className="transition hover:bg-slate-50"
                                    >
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                                            {item.Distrito}
                                        </td>

                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {item.provincia
                                                ?.Provincia ?? '—'}
                                        </td>

                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {item.provincia
                                                ?.departamento
                                                ?.Departamento ?? '—'}
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={route(
                                                        'distritos.edit',
                                                        item.idDist
                                                    )}
                                                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                                >
                                                    Editar
                                                </Link>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        eliminar(item)
                                                    }
                                                    className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-12 text-center"
                                    >
                                        <p className="text-sm font-semibold text-slate-600">
                                            No se encontraron distritos.
                                        </p>

                                        <p className="mt-1 text-xs text-slate-400">
                                            Pruebe con otros criterios de
                                            búsqueda.
                                        </p>

                                        {tieneFiltros && (
                                            <button
                                                type="button"
                                                onClick={
                                                    limpiarFiltros
                                                }
                                                className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                            >
                                                Limpiar filtros
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {distritos.total > 0 && (
                    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                            Mostrando{' '}
                            <span className="font-semibold text-slate-700">
                                {distritos.from}
                            </span>{' '}
                            a{' '}
                            <span className="font-semibold text-slate-700">
                                {distritos.to}
                            </span>{' '}
                            de{' '}
                            <span className="font-semibold text-slate-700">
                                {distritos.total}
                            </span>{' '}
                            registros
                        </p>

                        {distritos.last_page > 1 && (
                            <div className="flex flex-wrap items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() =>
                                        cambiarPagina(
                                            distritos.current_page - 1
                                        )
                                    }
                                    disabled={
                                        distritos.current_page === 1 ||
                                        cargando
                                    }
                                    className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Anterior
                                </button>

                                {obtenerPaginas().map((pagina) => (
                                    <button
                                        key={pagina}
                                        type="button"
                                        onClick={() =>
                                            cambiarPagina(pagina)
                                        }
                                        disabled={cargando}
                                        className={`h-8 min-w-8 rounded-md px-2 text-xs font-semibold transition ${
                                            pagina ===
                                            distritos.current_page
                                                ? 'bg-[#315d7a] text-white'
                                                : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        {pagina}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    onClick={() =>
                                        cambiarPagina(
                                            distritos.current_page + 1
                                        )
                                    }
                                    disabled={
                                        distritos.current_page ===
                                            distritos.last_page ||
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