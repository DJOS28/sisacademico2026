import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { useEffect, useState } from 'react';

export default function Index({ periodos, filtros }) {
    const { flash } = usePage().props;

    const [buscar, setBuscar] = useState(
        filtros.buscar ?? ''
    );

    useEffect(() => {
        if (flash?.success) {
            Swal.fire({
                icon: 'success',
                title: 'Operación completada',
                text: flash.success,
            });
        }

        if (flash?.error) {
            Swal.fire({
                icon: 'error',
                title: 'No se pudo completar',
                text: flash.error,
            });
        }

        if (flash?.info) {
            Swal.fire({
                icon: 'info',
                title: 'Información',
                text: flash.info,
            });
        }
    }, [flash]);

    const buscarPeriodos = (event) => {
        event.preventDefault();

        router.get(
            route('periodos.index'),
            { buscar },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const activar = async (periodo) => {
        const resultado = await Swal.fire({
            title: '¿Activar este periodo?',
            text: `Se activará "${periodo.nombre}" y los demás periodos quedarán inactivos.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, activar',
            cancelButtonText: 'Cancelar',
        });

        if (!resultado.isConfirmed) {
            return;
        }

        router.put(
            route('periodos.activar', periodo.id),
            {},
            {
                preserveScroll: true,
            }
        );
    };

    const desactivar = async (periodo) => {
        const resultado = await Swal.fire({
            title: '¿Desactivar periodo?',
            text: periodo.nombre,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, desactivar',
            cancelButtonText: 'Cancelar',
        });

        if (!resultado.isConfirmed) {
            return;
        }

        router.put(
            route('periodos.desactivar', periodo.id),
            {},
            {
                preserveScroll: true,
            }
        );
    };

    const eliminar = async (periodo) => {
        const resultado = await Swal.fire({
            title: '¿Eliminar periodo?',
            text: `Se eliminará "${periodo.nombre}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        });

        if (!resultado.isConfirmed) {
            return;
        }

        router.delete(
            route('periodos.destroy', periodo.id),
            {
                preserveScroll: true,
            }
        );
    };

    const formatDate = (value) => {
    if (!value) {
        return '—';
    }

    try {
        /*
         * Laravel puede enviar:
         * 2026-03-01
         * 2026-03-01T00:00:00.000000Z
         * 2026-03-01 00:00:00
         */
        const datePart = String(value).substring(0, 10);
        const parts = datePart.split('-');

        if (parts.length !== 3) {
            return '—';
        }

        const [year, month, day] = parts.map(Number);

        if (
            !year ||
            !month ||
            !day ||
            month < 1 ||
            month > 12 ||
            day < 1 ||
            day > 31
        ) {
            return '—';
        }

        return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    } catch {
        return '—';
    }
};

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Periodos académicos
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Solo puede existir un periodo activo.
                        </p>
                    </div>

                    <Link
                        href={route('periodos.create')}
                        className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#274c64]"
                    >
                        Nuevo periodo
                    </Link>
                </div>
            }
        >
            <Head title="Periodos académicos" />

            <form
                onSubmit={buscarPeriodos}
                className="mb-5 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
                <input
                    type="search"
                    value={buscar}
                    onChange={(event) =>
                        setBuscar(event.target.value)
                    }
                    placeholder="Buscar por nombre o descripción"
                    className="min-w-[280px] flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]"
                />

                <button
                    type="submit"
                    className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
                >
                    Buscar
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setBuscar('');
                        router.get(route('periodos.index'));
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600"
                >
                    Limpiar
                </button>
            </form>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            {[
                                'Periodo',
                                'Descripción',
                                'Fecha de inicio',
                                'Fecha de fin',
                                'Estado',
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
                        {periodos.data.map((periodo) => (
                            <tr
                                key={periodo.id}
                                className="hover:bg-slate-50"
                            >
                                <td className="px-4 py-3">
                                    <p className="text-sm font-semibold text-slate-900">
                                        {periodo.nombre}
                                    </p>
                                </td>

                                <td className="max-w-md px-4 py-3 text-sm text-slate-600">
                                    <p className="line-clamp-2">
                                        {periodo.descripcion ||
                                            'Sin descripción'}
                                    </p>
                                </td>

                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {formatDate(periodo.fecha_inicio)}
                                </td>

                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {formatDate(periodo.fecha_fin)}
                                </td>

                                <td className="px-4 py-3">
                                    <span
                                        className={[
                                            'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                                            periodo.activo
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'bg-slate-100 text-slate-600',
                                        ].join(' ')}
                                    >
                                        {periodo.activo
                                            ? 'Activo'
                                            : 'Inactivo'}
                                    </span>
                                </td>

                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-2">
                                        <Link
                                            href={route(
                                                'periodos.edit',
                                                periodo.id
                                            )}
                                            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            Editar
                                        </Link>

                                        {periodo.activo ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    desactivar(periodo)
                                                }
                                                className="rounded-md border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                                            >
                                                Desactivar
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    activar(periodo)
                                                }
                                                className="rounded-md border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                                            >
                                                Activar
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                eliminar(periodo)
                                            }
                                            disabled={periodo.activo}
                                            className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {periodos.data.length === 0 && (
                    <div className="p-10 text-center">
                        <p className="text-sm font-semibold text-slate-700">
                            No se encontraron periodos.
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {periodos.links.map((link, index) => (
                    <button
                        key={index}
                        type="button"
                        disabled={!link.url}
                        onClick={() =>
                            link.url &&
                            router.visit(link.url, {
                                preserveState: true,
                            })
                        }
                        className={[
                            'rounded-md border px-3 py-2 text-sm',
                            link.active
                                ? 'border-[#315d7a] bg-[#315d7a] text-white'
                                : 'border-slate-200 bg-white text-slate-600',
                            !link.url
                                ? 'cursor-not-allowed opacity-40'
                                : '',
                        ].join(' ')}
                        dangerouslySetInnerHTML={{
                            __html: link.label,
                        }}
                    />
                ))}
            </div>
        </AuthenticatedLayout>
    );
}
