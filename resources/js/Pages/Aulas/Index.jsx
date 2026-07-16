import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useEffect, useRef, useState } from 'react';

export default function Index({
    aulas: aulasIniciales,
    pabellones = [],
    tipos = [],
    filtros = {},
}) {
    const { flash } = usePage().props;

    const [aulas, setAulas] = useState(aulasIniciales);
    const [buscar, setBuscar] = useState(filtros.buscar ?? '');

    const [idPabellon, setIdPabellon] = useState(
        filtros.id_pabellon
            ? String(filtros.id_pabellon)
            : ''
    );

    const [tipo, setTipo] = useState(
        filtros.tipo ?? ''
    );

    const [cargando, setCargando] = useState(false);

    const primeraCarga = useRef(true);
    const controladorFiltro = useRef(null);

    useEffect(() => {
        setAulas(aulasIniciales);
    }, [aulasIniciales]);

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
        pabellon = idPabellon,
        tipoSeleccionado = tipo,
        pagina = 1,
        mantenerScroll = true
    ) => {
        controladorFiltro.current?.abort();
        controladorFiltro.current = new AbortController();

        setCargando(true);

        try {
            const response = await axios.post(
                route('aulas.filtrar'),
                {
                    buscar: termino.trim(),
                    id_pabellon: pabellon || null,
                    tipo: tipoSeleccionado || null,
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

            setAulas(response.data.aulas);

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
                'No se pudo realizar la búsqueda de aulas.';

            if (error.response?.status === 422) {
                const errores = error.response.data?.errors;

                mensaje =
                    errores?.buscar?.[0] ??
                    errores?.id_pabellon?.[0] ??
                    errores?.tipo?.[0] ??
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
            filtrar(
                buscar,
                idPabellon,
                tipo,
                1
            );
        }, 400);

        return () => {
            window.clearTimeout(temporizador);
        };
    }, [buscar, idPabellon, tipo]);

    const limpiarFiltros = () => {
        setBuscar('');
        setIdPabellon('');
        setTipo('');
    };

    const cambiarPagina = (pagina) => {
        if (
            pagina < 1 ||
            pagina > aulas.last_page ||
            pagina === aulas.current_page ||
            cargando
        ) {
            return;
        }

        filtrar(
            buscar,
            idPabellon,
            tipo,
            pagina,
            false
        );
    };

    const eliminar = async (aula) => {
        const resultado = await Swal.fire({
            title: '¿Eliminar aula?',
            text: aula.nombre,
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
            route('aulas.destroy', aula.id),
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
                        'El aula fue eliminada correctamente.';

                    await Swal.fire({
                        title: 'Aula eliminada',
                        text: mensaje,
                        icon: 'success',
                        timer: 1700,
                        showConfirmButton: false,
                    });

                    const paginaObjetivo =
                        aulas.data.length === 1 &&
                        aulas.current_page > 1
                            ? aulas.current_page - 1
                            : aulas.current_page;

                    filtrar(
                        buscar,
                        idPabellon,
                        tipo,
                        paginaObjetivo,
                        true
                    );
                },

                onError: (errors) => {
                    Swal.fire({
                        title: 'No se pudo eliminar',
                        text:
                            errors?.aula ??
                            errors?.error ??
                            'El aula puede tener registros relacionados.',
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
        const paginaActual = aulas.current_page;
        const ultimaPagina = aulas.last_page;
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

    const tieneFiltros =
        buscar !== '' ||
        idPabellon !== '' ||
        tipo !== '';

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Aulas
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Mantenimiento de aulas institucionales.
                        </p>
                    </div>

                    <Link
                        href={route('aulas.create')}
                        className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#274b63]"
                    >
                        Nueva aula
                    </Link>
                </div>
            }
        >
            <Head title="Aulas" />

           <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 items-end">

        {/* Buscar aula */}
        <div className="flex flex-col">
            <label
                htmlFor="buscar"
                className="mb-2 text-sm font-semibold text-slate-700"
            >
                Buscar aula
            </label>

            <div className="relative">
                <input
                    id="buscar"
                    type="search"
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)}
                    placeholder="Nombre, número o tipo..."
                    autoComplete="off"
                    className="h-11 w-full rounded-lg border border-slate-300 px-3 pr-14 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                />

                <div className="absolute inset-y-0 right-3 flex items-center gap-2">
                    {cargando && (
                        <span
                            className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#315d7a]"
                        />
                    )}

                    {buscar !== '' && (
                        <button
                            type="button"
                            onClick={() => setBuscar('')}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Pabellón */}
        <div className="flex flex-col">
            <label
                htmlFor="id_pabellon"
                className="mb-2 text-sm font-semibold text-slate-700"
            >
                Pabellón
            </label>

            <select
                id="id_pabellon"
                value={idPabellon}
                onChange={(e) => setIdPabellon(e.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
            >
                <option value="">
                    Todos los pabellones
                </option>

                {pabellones.map((pabellon) => (
                    <option
                        key={pabellon.id}
                        value={pabellon.id}
                    >
                        {pabellon.nombre}
                    </option>
                ))}
            </select>
        </div>

        {/* Tipo */}
        <div className="flex flex-col">
            <label
                htmlFor="tipo"
                className="mb-2 text-sm font-semibold text-slate-700"
            >
                Tipo
            </label>

            <select
                id="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
            >
                <option value="">
                    Todos los tipos
                </option>

                {tipos.map((tipoItem) => (
                    <option
                        key={tipoItem}
                        value={tipoItem}
                    >
                        {tipoItem}
                    </option>
                ))}
            </select>
        </div>

        {/* Acción */}
        <div className="flex flex-col">
            <label
                htmlFor="limpiar-filtros"
                className="mb-2 text-sm font-semibold text-slate-700"
            >
                Acción
            </label>

            <button
                id="limpiar-filtros"
                type="button"
                onClick={limpiarFiltros}
                disabled={!tieneFiltros}
                className="h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-[#315d7a] hover:bg-[#315d7a] hover:text-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            >
                Limpiar filtros
            </button>
        </div>

    </div>

    <p className="mt-3 text-xs text-slate-500">
        Los resultados se actualizan automáticamente.
    </p>
</div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                {[
                                    'Aula',
                                    'Número',
                                    'Pabellón',
                                    'Tipo',
                                    'Capacidad',
                                    'Acciones',
                                ].map((encabezado) => (
                                    <th
                                        key={encabezado}
                                        className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                                    >
                                        {encabezado}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {aulas.data.length > 0 ? (
                                aulas.data.map((aula) => (
                                    <tr
                                        key={aula.id}
                                        className="transition hover:bg-slate-50"
                                    >
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                                            {aula.nombre}
                                        </td>

                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {aula.numero_aula || '—'}
                                        </td>

                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {aula.pabellon?.nombre || '—'}
                                        </td>

                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {aula.tipo || '—'}
                                        </td>

                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                                {aula.capacidad ?? 0}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={route(
                                                        'aulas.edit',
                                                        aula.id
                                                    )}
                                                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                                >
                                                    Editar
                                                </Link>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        eliminar(aula)
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
                                        colSpan={6}
                                        className="px-4 py-12 text-center"
                                    >
                                        <p className="text-sm font-semibold text-slate-600">
                                            No se encontraron aulas.
                                        </p>

                                        <p className="mt-1 text-xs text-slate-400">
                                            Pruebe con otros criterios de búsqueda.
                                        </p>

                                        {tieneFiltros && (
                                            <button
                                                type="button"
                                                onClick={limpiarFiltros}
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

                {aulas.total > 0 && (
                    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                            Mostrando{' '}
                            <span className="font-semibold text-slate-700">
                                {aulas.from}
                            </span>{' '}
                            a{' '}
                            <span className="font-semibold text-slate-700">
                                {aulas.to}
                            </span>{' '}
                            de{' '}
                            <span className="font-semibold text-slate-700">
                                {aulas.total}
                            </span>{' '}
                            registros
                        </p>

                        {aulas.last_page > 1 && (
                            <div className="flex flex-wrap items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() =>
                                        cambiarPagina(
                                            aulas.current_page - 1
                                        )
                                    }
                                    disabled={
                                        aulas.current_page === 1 ||
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
                                            pagina === aulas.current_page
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
                                            aulas.current_page + 1
                                        )
                                    }
                                    disabled={
                                        aulas.current_page ===
                                            aulas.last_page ||
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