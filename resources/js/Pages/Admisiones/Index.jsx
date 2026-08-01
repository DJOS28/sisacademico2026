import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

export default function Index({
    admisiones,
    filtros = {},
    periodos = [],
    tiposAdmision = [],
    resumen = {},
}) {
    const { flash = {} } = usePage().props;

    const [buscar, setBuscar] = useState(filtros.buscar ?? '');
    const [periodoId, setPeriodoId] = useState(filtros.periodo_id ?? '');
    const [tipoAdmisionId, setTipoAdmisionId] = useState(
        filtros.tipo_admision_id ?? ''
    );
    const [estado, setEstado] = useState(filtros.estado ?? 'todos');
    const [porPagina, setPorPagina] = useState(filtros.por_pagina ?? 10);
    const [buscando, setBuscando] = useState(false);

    /**
     * Mostrar mensajes enviados por Laravel.
     */
    useEffect(() => {
        if (flash.success) {
            Swal.fire({
                title: '¡Correcto!',
                text: flash.success,
                icon: 'success',
                confirmButtonColor: '#315d7a',
                timer: 2200,
                showConfirmButton: false,
            });
        }

        if (flash.error) {
            Swal.fire({
                title: 'No se pudo completar',
                text: flash.error,
                icon: 'error',
                confirmButtonColor: '#315d7a',
            });
        }
    }, [flash.success, flash.error]);

    /**
     * Enviar filtros al controlador mediante Inertia.
     */
    const consultarAdmisiones = (event = null, filtrosAdicionales = {}) => {
        if (event) {
            event.preventDefault();
        }

        setBuscando(true);

        router.get(
            route('admisiones.index'),
            {
                buscar: buscar.trim(),
                periodo_id: periodoId || undefined,
                tipo_admision_id: tipoAdmisionId || undefined,
                estado: estado || 'todos',
                por_pagina: porPagina,
                ...filtrosAdicionales,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => setBuscando(false),
            }
        );
    };

    /**
     * Restablecer todos los filtros.
     */
    const limpiarFiltros = () => {
        setBuscar('');
        setPeriodoId('');
        setTipoAdmisionId('');
        setEstado('todos');
        setPorPagina(10);
        setBuscando(true);

        router.get(
            route('admisiones.index'),
            {},
            {
                preserveState: false,
                preserveScroll: true,
                replace: true,
                onFinish: () => setBuscando(false),
            }
        );
    };

    /**
     * Cambiar cantidad de registros por página.
     */
    const cambiarPorPagina = (event) => {
        const cantidad = Number(event.target.value);

        setPorPagina(cantidad);
        setBuscando(true);

        router.get(
            route('admisiones.index'),
            {
                buscar: buscar.trim(),
                periodo_id: periodoId || undefined,
                tipo_admision_id: tipoAdmisionId || undefined,
                estado,
                por_pagina: cantidad,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => setBuscando(false),
            }
        );
    };

    /**
     * Activar o desactivar un proceso.
     */
    const cambiarEstado = (admision) => {
        const activar = !Boolean(admision.activo);

        Swal.fire({
            title: activar
                ? '¿Activar proceso de admisión?'
                : '¿Desactivar proceso de admisión?',
            text: activar
                ? 'El proceso volverá a estar disponible.'
                : 'El proceso dejará de estar disponible para nuevas operaciones.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: activar ? '#059669' : '#d97706',
            cancelButtonColor: '#64748b',
            confirmButtonText: activar ? 'Sí, activar' : 'Sí, desactivar',
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            if (!result.isConfirmed) {
                return;
            }

            router.patch(
                route('admisiones.cambiar-estado', admision.id_admision),
                {
                    activo: activar,
                },
                {
                    preserveScroll: true,
                    onError: (errors) => {
                        Swal.fire({
                            title: 'No se pudo cambiar el estado',
                            text:
                                errors.activo ||
                                errors.error ||
                                'Ocurrió un inconveniente al actualizar el proceso.',
                            icon: 'error',
                            confirmButtonColor: '#315d7a',
                        });
                    },
                }
            );
        });
    };

    /**
     * Eliminar un proceso sin registros asociados.
     */
    const eliminarAdmision = (admision) => {
        Swal.fire({
            title: '¿Confirmar eliminación?',
            text: `Se eliminará el proceso "${admision.nombre}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            if (!result.isConfirmed) {
                return;
            }

            router.delete(
                route('admisiones.destroy', admision.id_admision),
                {
                    preserveScroll: true,
                    onError: (errors) => {
                        Swal.fire({
                            title: 'No se puede eliminar',
                            text:
                                errors.error ||
                                'El proceso tiene información relacionada o no pudo eliminarse.',
                            icon: 'error',
                            confirmButtonColor: '#315d7a',
                        });
                    },
                }
            );
        });
    };

    /**
     * Convertir una fecha YYYY-MM-DD a formato peruano.
     */
    const formatearFecha = (fecha) => {
        if (!fecha) {
            return '—';
        }

        const fechaLimpia = String(fecha).substring(0, 10);
        const [anio, mes, dia] = fechaLimpia.split('-');

        if (!anio || !mes || !dia) {
            return fecha;
        }

        return `${dia}/${mes}/${anio}`;
    };

    const registros = admisiones?.data ?? [];
    const linksPaginacion = admisiones?.links ?? [];

    return (
        <AuthenticatedLayout
            header={
                <h1 className="text-2xl font-bold text-slate-900">
                    Procesos de Admisión
                </h1>
            }
        >
            <Head title="Procesos de Admisión" />

            <div className="w-full space-y-6">
                {/* INDICADORES */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <TarjetaResumen
                        titulo="Total de procesos"
                        valor={resumen.total ?? 0}
                        color="slate"
                    />

                    <TarjetaResumen
                        titulo="Procesos activos"
                        valor={resumen.activas ?? 0}
                        color="emerald"
                    />

                    <TarjetaResumen
                        titulo="Procesos inactivos"
                        valor={resumen.inactivas ?? 0}
                        color="rose"
                    />

                    <TarjetaResumen
                        titulo="Con inscripciones"
                        valor={resumen.con_inscripciones ?? 0}
                        color="blue"
                    />
                </div>

                {/* FILTROS Y NUEVO REGISTRO */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <form
                        onSubmit={consultarAdmisiones}
                        className="space-y-4"
                    >
                        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
                            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                                        Buscar proceso
                                    </label>

                                    <input
                                        type="text"
                                        value={buscar}
                                        onChange={(event) =>
                                            setBuscar(event.target.value)
                                        }
                                        placeholder="Nombre del proceso..."
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                                        Periodo académico
                                    </label>

                                    <select
                                        value={periodoId}
                                        onChange={(event) =>
                                            setPeriodoId(event.target.value)
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                    >
                                        <option value="">
                                            Todos los periodos
                                        </option>

                                        {periodos.map((periodo) => (
                                            <option
                                                key={periodo.id}
                                                value={periodo.id}
                                            >
                                                {periodo.nombre}
                                                {!periodo.activo
                                                    ? ' - Inactivo'
                                                    : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                                        Tipo de admisión
                                    </label>

                                    <select
                                        value={tipoAdmisionId}
                                        onChange={(event) =>
                                            setTipoAdmisionId(
                                                event.target.value
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                    >
                                        <option value="">
                                            Todos los tipos
                                        </option>

                                        {tiposAdmision.map((tipo) => (
                                            <option
                                                key={tipo.id_tipo_admision}
                                                value={tipo.id_tipo_admision}
                                            >
                                                {tipo.nombre}
                                                {!tipo.activo
                                                    ? ' - Inactivo'
                                                    : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                                        Estado
                                    </label>

                                    <select
                                        value={estado}
                                        onChange={(event) =>
                                            setEstado(event.target.value)
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                    >
                                        <option value="todos">
                                            Todos
                                        </option>
                                        <option value="activos">
                                            Activos
                                        </option>
                                        <option value="inactivos">
                                            Inactivos
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 xl:flex-nowrap">
                                <button
                                    type="submit"
                                    disabled={buscando}
                                    className="rounded-lg bg-[#315d7a] px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-[#274b63] disabled:opacity-50"
                                >
                                    {buscando ? 'Buscando...' : 'Buscar'}
                                </button>

                                <button
                                    type="button"
                                    onClick={limpiarFiltros}
                                    disabled={buscando}
                                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Limpiar
                                </button>

                                <Link
                                    href={route('admisiones.create')}
                                    className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-emerald-700"
                                >
                                    <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M12 4v16m8-8H4"
                                        />
                                    </svg>

                                    Nueva Admisión
                                </Link>
                            </div>
                        </div>
                    </form>
                </div>

                {/* TABLA */}
                <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col justify-between gap-3 border-b pb-3 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-base font-bold text-slate-800">
                                Procesos de admisión registrados
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                Administración de fechas, requisitos, pagos e
                                inscripciones.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <select
                                value={porPagina}
                                onChange={cambiarPorPagina}
                                className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-700 focus:border-[#315d7a] focus:ring-[#315d7a]/20"
                            >
                                <option value="10">10 por página</option>
                                <option value="15">15 por página</option>
                                <option value="25">25 por página</option>
                                <option value="50">50 por página</option>
                            </select>

                            <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                Total: {admisiones?.total ?? 0}
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-600">
                                <tr>
                                    <th className="px-4 py-3">
                                        Proceso
                                    </th>
                                    <th className="px-4 py-3">
                                        Periodo / Tipo
                                    </th>
                                    <th className="px-4 py-3">
                                        Fechas
                                    </th>
                                    <th className="px-4 py-3 text-center">
                                        Inscripciones
                                    </th>
                                    <th className="px-4 py-3 text-center">
                                        Estado
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {registros.length > 0 ? (
                                    registros.map((admision) => (
                                        <tr
                                            key={admision.id_admision}
                                            className="transition hover:bg-slate-50/80"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-slate-800">
                                                    {admision.nombre}
                                                </div>

                                                <div className="mt-1 max-w-xs truncate text-xs text-slate-500">
                                                    {admision.direccion ||
                                                        'Dirección no registrada'}
                                                </div>

                                                <div className="mt-1 text-[11px] text-slate-400">
                                                    Código: ADM-
                                                    {String(
                                                        admision.id_admision
                                                    ).padStart(4, '0')}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-700">
                                                    {admision.periodo?.nombre ||
                                                        'Sin periodo'}
                                                </div>

                                                <div className="mt-1 text-xs text-slate-500">
                                                    {admision.tipo_admision
                                                        ?.nombre ||
                                                        'Sin tipo de admisión'}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="text-xs text-slate-700">
                                                    <span className="font-semibold">
                                                        Proceso:
                                                    </span>{' '}
                                                    {formatearFecha(
                                                        admision.inicio_proceso
                                                    )}{' '}
                                                    al{' '}
                                                    {formatearFecha(
                                                        admision.fin_proceso
                                                    )}
                                                </div>

                                                <div className="mt-1 text-xs text-slate-500">
                                                    <span className="font-semibold">
                                                        Examen:
                                                    </span>{' '}
                                                    {formatearFecha(
                                                        admision.fecha_examen
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex min-w-8 justify-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                                                    {admision.inscripciones_count ??
                                                        0}
                                                </span>

                                                <div className="mt-1 text-[11px] text-slate-400">
                                                    {admision.requisitos_count ??
                                                        0}{' '}
                                                    requisitos
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        cambiarEstado(admision)
                                                    }
                                                    className={`inline-flex rounded px-2.5 py-1 text-[11px] font-semibold transition ${
                                                        admision.activo
                                                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                                    }`}
                                                    title="Cambiar estado"
                                                >
                                                    {admision.activo
                                                        ? 'Activo'
                                                        : 'Inactivo'}
                                                </button>
                                            </td>

                                            <td className="px-4 py-3 text-right">
                                                <div className="flex flex-wrap justify-end gap-2">
                                                    <Link
                                                        href={route(
                                                            'admisiones.show',
                                                            admision.id_admision
                                                        )}
                                                        className="rounded border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                                                    >
                                                        Ver
                                                    </Link>

                                                    <Link
                                                        href={route(
                                                            'admisiones.edit',
                                                            admision.id_admision
                                                        )}
                                                        className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                                                    >
                                                        Editar
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            eliminarAdmision(
                                                                admision
                                                            )
                                                        }
                                                        className="rounded border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
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
                                            colSpan="6"
                                            className="px-4 py-10 text-center text-xs text-slate-400"
                                        >
                                            No se encontraron procesos de
                                            admisión registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINACIÓN */}
                    {linksPaginacion.length > 3 && (
                        <div className="flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
                            <p className="text-xs text-slate-500">
                                Mostrando {admisiones.from ?? 0} a{' '}
                                {admisiones.to ?? 0} de{' '}
                                {admisiones.total ?? 0} registros
                            </p>

                            <div className="flex flex-wrap justify-center gap-1">
                                {linksPaginacion.map((link, index) => (
                                    <Link
                                        key={`${link.label}-${index}`}
                                        href={link.url || '#'}
                                        preserveScroll
                                        preserveState
                                        className={`rounded border px-3 py-1.5 text-xs font-semibold transition ${
                                            link.active
                                                ? 'border-[#315d7a] bg-[#315d7a] text-white'
                                                : link.url
                                                  ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                                  : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

/**
 * Tarjetas superiores del resumen.
 */
function TarjetaResumen({ titulo, valor, color = 'slate' }) {
    const colores = {
        slate: 'border-slate-200 bg-slate-50 text-slate-800',
        emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        rose: 'border-rose-200 bg-rose-50 text-rose-800',
        blue: 'border-blue-200 bg-blue-50 text-blue-800',
    };

    return (
        <div
            className={`rounded-xl border p-5 shadow-sm ${
                colores[color] ?? colores.slate
            }`}
        >
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                {titulo}
            </p>

            <p className="mt-2 text-3xl font-bold">{valor}</p>
        </div>
    );
}