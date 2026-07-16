import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useEffect, useRef, useState } from 'react';

export default function Index({
    pabellones: pabellonesIniciales,
    filtros = {},
}) {
    const { flash } = usePage().props;

    const [pabellones, setPabellones] = useState(
        pabellonesIniciales
    );

    const [buscar, setBuscar] = useState(
        filtros.buscar ?? ''
    );

    const [cargando, setCargando] = useState(false);

    const primeraCarga = useRef(true);
    const controladorFiltro = useRef(null);

    useEffect(() => {
        setPabellones(pabellonesIniciales);
    }, [pabellonesIniciales]);

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
                route('pabellones.filtrar'),
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

            setPabellones(response.data.pabellones);

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
                'No se pudo realizar la búsqueda de pabellones.';

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

    const limpiarFiltro = () => {
        setBuscar('');
    };

    const cambiarPagina = (pagina) => {
        if (
            pagina < 1 ||
            pagina > pabellones.last_page ||
            pagina === pabellones.current_page ||
            cargando
        ) {
            return;
        }

        filtrar(buscar, pagina, false);
    };

    const eliminar = async (pabellon) => {
        const resultado = await Swal.fire({
            title: '¿Eliminar pabellón?',
            text: pabellon.nombre,
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
            route('pabellones.destroy', pabellon.id),
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
                        'El pabellón fue eliminado correctamente.';

                    await Swal.fire({
                        title: 'Pabellón eliminado',
                        text: mensaje,
                        icon: 'success',
                        timer: 1700,
                        showConfirmButton: false,
                    });

                    const paginaObjetivo =
                        pabellones.data.length === 1 &&
                        pabellones.current_page > 1
                            ? pabellones.current_page - 1
                            : pabellones.current_page;

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
                            errors?.pabellon ??
                            errors?.error ??
                            'El pabellón puede tener aulas relacionadas.',
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
        const paginaActual = pabellones.current_page;
        const ultimaPagina = pabellones.last_page;
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
                            Pabellones
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Mantenimiento de pabellones institucionales.
                        </p>
                    </div>

                    <Link
                        href={route('pabellones.create')}
                        className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#274b63]"
                    >
                        Nuevo pabellón
                    </Link>
                </div>
            }
        >
            <Head title="Pabellones" />

            <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <label
                    htmlFor="buscar"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                >
                    Buscar pabellón
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
                                onClick={limpiarFiltro}
                                className="flex h-6 w-6 items-center justify-center rounded-full text-lg font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
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
                                    Pabellón
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Descripción
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Aulas
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Acciones
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {pabellones.data.length > 0 ? (
                                pabellones.data.map((pabellon) => (
                                    <tr
                                        key={pabellon.id}
                                        className="transition hover:bg-slate-50"
                                    >
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                                            {pabellon.nombre}
                                        </td>

                                        <td className="max-w-lg px-4 py-3 text-sm text-slate-600">
                                            {pabellon.descripcion ||
                                                'Sin descripción'}
                                        </td>

                                        <td className="px-4 py-3">
                                            <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                                                {pabellon.aulas_count ?? 0}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={route(
                                                        'pabellones.edit',
                                                        pabellon.id
                                                    )}
                                                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                                >
                                                    Editar
                                                </Link>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        eliminar(pabellon)
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
                                            No se encontraron pabellones.
                                        </p>

                                        <p className="mt-1 text-xs text-slate-400">
                                            Pruebe con otro término de búsqueda.
                                        </p>

                                        {buscar !== '' && (
                                            <button
                                                type="button"
                                                onClick={limpiarFiltro}
                                                className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                            >
                                                Limpiar búsqueda
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {pabellones.total > 0 && (
                    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                            Mostrando{' '}
                            <span className="font-semibold text-slate-700">
                                {pabellones.from}
                            </span>{' '}
                            a{' '}
                            <span className="font-semibold text-slate-700">
                                {pabellones.to}
                            </span>{' '}
                            de{' '}
                            <span className="font-semibold text-slate-700">
                                {pabellones.total}
                            </span>{' '}
                            registros
                        </p>

                        {pabellones.last_page > 1 && (
                            <div className="flex flex-wrap items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() =>
                                        cambiarPagina(
                                            pabellones.current_page - 1
                                        )
                                    }
                                    disabled={
                                        pabellones.current_page === 1 ||
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
                                            pabellones.current_page
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
                                            pabellones.current_page + 1
                                        )
                                    }
                                    disabled={
                                        pabellones.current_page ===
                                            pabellones.last_page ||
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