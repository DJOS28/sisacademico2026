import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useEffect, useRef, useState } from 'react';

export default function Index({
    turnos: turnosIniciales,
    filtros = {},
}) {
    const { flash } = usePage().props;

    const [turnos, setTurnos] = useState(turnosIniciales);
    const [buscar, setBuscar] = useState(filtros.buscar ?? '');
    const [cargando, setCargando] = useState(false);

    const primeraCarga = useRef(true);
    const controladorFiltro = useRef(null);

    useEffect(() => {
        setTurnos(turnosIniciales);
    }, [turnosIniciales]);

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
                route('turnos.filtrar'),
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

            setTurnos(response.data.turnos);

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
                'No se pudo realizar la búsqueda de turnos.';

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
            pagina > turnos.last_page ||
            pagina === turnos.current_page ||
            cargando
        ) {
            return;
        }

        filtrar(buscar, pagina, false);
    };

    const eliminar = async (turno) => {
        const resultado = await Swal.fire({
            title: '¿Eliminar turno?',
            text: turno.nombre,
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
            route('turnos.destroy', turno.id),
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
                        'El turno fue eliminado correctamente.';

                    await Swal.fire({
                        title: 'Turno eliminado',
                        text: mensaje,
                        icon: 'success',
                        timer: 1700,
                        showConfirmButton: false,
                    });

                    const paginaObjetivo =
                        turnos.data.length === 1 &&
                        turnos.current_page > 1
                            ? turnos.current_page - 1
                            : turnos.current_page;

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
                            errors?.turno ??
                            errors?.error ??
                            'El turno puede tener registros relacionados.',
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
        const paginaActual = turnos.current_page;
        const ultimaPagina = turnos.last_page;
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
            pagina += 1
        ) {
            paginas.push(pagina);
        }

        return paginas;
    };

    const formatearHora = (hora) => {
        if (!hora) {
            return '—';
        }

        return hora.substring(0, 5);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Turnos
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Mantenimiento de turnos académicos.
                        </p>
                    </div>

                    <Link
                        href={route('turnos.create')}
                        className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#274b63]"
                    >
                        Nuevo turno
                    </Link>
                </div>
            }
        >
            <Head title="Turnos" />

            <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <label
                    htmlFor="buscar"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                >
                    Buscar turno
                </label>

                <div className="relative">
                    <input
                        id="buscar"
                        type="search"
                        value={buscar}
                        onChange={(event) =>
                            setBuscar(event.target.value)
                        }
                        placeholder="Buscar por nombre u hora..."
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
                                    Turno
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Hora de inicio
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Hora de fin
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Duración
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Acciones
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {turnos.data.length > 0 ? (
                                turnos.data.map((turno) => (
                                    <tr
                                        key={turno.id}
                                        className="transition hover:bg-slate-50"
                                    >
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                                            {turno.nombre}
                                        </td>

                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {formatearHora(
                                                turno.hora_inicio
                                            )}
                                        </td>

                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {formatearHora(
                                                turno.hora_fin
                                            )}
                                        </td>

                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {turno.duracion ??
                                                '—'}
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={route(
                                                        'turnos.edit',
                                                        turno.id
                                                    )}
                                                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                                >
                                                    Editar
                                                </Link>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        eliminar(turno)
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
                                        colSpan={5}
                                        className="px-4 py-12 text-center"
                                    >
                                        <p className="text-sm font-semibold text-slate-600">
                                            No se encontraron turnos.
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

                {turnos.total > 0 && (
                    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                            Mostrando{' '}
                            <span className="font-semibold text-slate-700">
                                {turnos.from}
                            </span>{' '}
                            a{' '}
                            <span className="font-semibold text-slate-700">
                                {turnos.to}
                            </span>{' '}
                            de{' '}
                            <span className="font-semibold text-slate-700">
                                {turnos.total}
                            </span>{' '}
                            registros
                        </p>

                        {turnos.last_page > 1 && (
                            <div className="flex flex-wrap items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() =>
                                        cambiarPagina(
                                            turnos.current_page - 1
                                        )
                                    }
                                    disabled={
                                        turnos.current_page === 1 ||
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
                                            turnos.current_page
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
                                            turnos.current_page + 1
                                        )
                                    }
                                    disabled={
                                        turnos.current_page ===
                                            turnos.last_page ||
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