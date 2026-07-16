import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useEffect, useRef, useState } from 'react';

export default function Index({
    secciones: seccionesIniciales,
    filtros = {},
}) {
    const { flash } = usePage().props;

    const [secciones, setSecciones] = useState(
        seccionesIniciales
    );

    const [buscar, setBuscar] = useState(
        filtros.buscar ?? ''
    );

    const [cargando, setCargando] = useState(false);

    const primeraCarga = useRef(true);
    const controladorFiltro = useRef(null);

    useEffect(() => {
        setSecciones(seccionesIniciales);
    }, [seccionesIniciales]);

    useEffect(() => {
        if (flash?.success) {
            Swal.fire({
                title: 'Correcto',
                text: flash.success,
                icon: 'success',
                confirmButtonText: 'Aceptar',
            });
        }

        if (flash?.error) {
            Swal.fire({
                title: 'Atención',
                text: flash.error,
                icon: 'error',
                confirmButtonText: 'Aceptar',
            });
        }
    }, [flash]);

    const filtrar = async (
        termino = buscar,
        pagina = 1,
        mantenerScroll = true
    ) => {
        controladorFiltro.current?.abort();
        controladorFiltro.current = new AbortController();

        setCargando(true);

        try {
            const response = await axios.post(
                route('secciones.filtrar'),
                {
                    buscar: termino.trim(),
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

            setSecciones(response.data.secciones);

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
                'No se pudo realizar la búsqueda de secciones.';

            if (error.response?.status === 422) {
                const errores = error.response.data?.errors;

                mensaje =
                    errores?.buscar?.[0] ??
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

    useEffect(() => {
        if (primeraCarga.current) {
            primeraCarga.current = false;
            return;
        }

        const temporizador = window.setTimeout(() => {
            filtrar(buscar, 1);
        }, 400);

        return () => {
            window.clearTimeout(temporizador);
        };
    }, [buscar]);

    const cambiarPagina = (pagina) => {
        if (
            pagina < 1 ||
            pagina > secciones.last_page ||
            pagina === secciones.current_page ||
            cargando
        ) {
            return;
        }

        filtrar(
            buscar,
            pagina,
            false
        );
    };

    const eliminar = async (seccion) => {
        const resultado = await Swal.fire({
            title: '¿Eliminar sección?',
            text: seccion.nombre,
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
            route('secciones.destroy', seccion.id),
            {
                preserveScroll: true,

                onStart: () => {
                    Swal.fire({
                        title: 'Eliminando...',
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        didOpen: () => Swal.showLoading(),
                    });
                },

                onSuccess: async (page) => {
                    const mensaje =
                        page.props?.flash?.success ??
                        'La sección fue eliminada correctamente.';

                    await Swal.fire({
                        title: 'Sección eliminada',
                        text: mensaje,
                        icon: 'success',
                        timer: 1700,
                        showConfirmButton: false,
                    });

                    const paginaObjetivo =
                        secciones.data.length === 1 &&
                        secciones.current_page > 1
                            ? secciones.current_page - 1
                            : secciones.current_page;

                    filtrar(
                        buscar,
                        paginaObjetivo,
                        true
                    );
                },

                onError: (errors) => {
                    Swal.fire({
                        title: 'No se pudo eliminar',
                        text:
                            errors?.seccion ??
                            errors?.error ??
                            'La sección puede tener registros relacionados.',
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

    const obtenerPaginas = () => {
        const paginaActual = secciones.current_page;
        const ultimaPagina = secciones.last_page;
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

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Secciones
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Mantenimiento de secciones académicas.
                        </p>
                    </div>

                    <Link
                        href={route('secciones.create')}
                        className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#274b63]"
                    >
                        Nueva sección
                    </Link>
                </div>
            }
        >
            <Head title="Secciones" />

            <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <label
                    htmlFor="buscar"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                >
                    Buscar sección
                </label>

                <div className="relative">
                    <input
                        id="buscar"
                        type="search"
                        value={buscar}
                        onChange={(event) =>
                            setBuscar(event.target.value)
                        }
                        placeholder="Buscar por nombre o descripción..."
                        autoComplete="off"
                        className="h-[42px] w-full rounded-lg border border-slate-300 px-3 pr-16 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                    />

                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center gap-2">
                        {cargando && (
                            <span
                                className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#315d7a]"
                                aria-label="Buscando"
                            />
                        )}

                        {buscar !== '' && (
                            <button
                                type="button"
                                onClick={() => setBuscar('')}
                                className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full p-0 text-base font-semibold leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                aria-label="Limpiar búsqueda"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                    Los resultados se actualizan automáticamente.
                </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Sección
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Descripción
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Acciones
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {secciones.data.length > 0 ? (
                                secciones.data.map((seccion) => (
                                    <tr
                                        key={seccion.id}
                                        className="transition hover:bg-slate-50"
                                    >
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                                            {seccion.nombre}
                                        </td>

                                        <td className="max-w-xl px-4 py-3 text-sm text-slate-600">
                                            {seccion.descripcion ||
                                                'Sin descripción'}
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={route(
                                                        'secciones.edit',
                                                        seccion.id
                                                    )}
                                                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                                >
                                                    Editar
                                                </Link>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        eliminar(seccion)
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
                                        colSpan={3}
                                        className="px-4 py-12 text-center"
                                    >
                                        <p className="text-sm font-semibold text-slate-600">
                                            No se encontraron secciones.
                                        </p>

                                        <p className="mt-1 text-xs text-slate-400">
                                            Pruebe con otro término de búsqueda.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {secciones.total > 0 && (
                    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                            Mostrando{' '}
                            <span className="font-semibold text-slate-700">
                                {secciones.from}
                            </span>{' '}
                            a{' '}
                            <span className="font-semibold text-slate-700">
                                {secciones.to}
                            </span>{' '}
                            de{' '}
                            <span className="font-semibold text-slate-700">
                                {secciones.total}
                            </span>{' '}
                            registros
                        </p>

                        {secciones.last_page > 1 && (
                            <div className="flex flex-wrap items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() =>
                                        cambiarPagina(
                                            secciones.current_page - 1
                                        )
                                    }
                                    disabled={
                                        secciones.current_page === 1 ||
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
                                            secciones.current_page
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
                                            secciones.current_page + 1
                                        )
                                    }
                                    disabled={
                                        secciones.current_page ===
                                            secciones.last_page ||
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