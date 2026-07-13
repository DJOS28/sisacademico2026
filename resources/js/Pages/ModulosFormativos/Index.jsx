import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { useEffect, useState } from 'react';

export default function Index({
    modulos,
    planesEstudio,
    filtros,
}) {
    const { flash } = usePage().props;

    const [buscar, setBuscar] = useState(
        filtros.buscar ?? ''
    );

    const [
        planEstudioId,
        setPlanEstudioId,
    ] = useState(
        filtros.plan_estudio_id ?? ''
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
    }, [flash]);

    const buscarModulos = (event) => {
        event.preventDefault();

        router.get(
            route('modulos-formativos.index'),
            {
                buscar,
                plan_estudio_id: planEstudioId,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const limpiarFiltros = () => {
        setBuscar('');
        setPlanEstudioId('');

        router.get(
            route('modulos-formativos.index'),
            {},
            {
                replace: true,
            }
        );
    };

    const eliminar = async (modulo) => {
        const resultado = await Swal.fire({
            title: '¿Eliminar módulo formativo?',
            text: `Se eliminará "${modulo.nombre}".`,
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
            route(
                'modulos-formativos.destroy',
                modulo.id_modulo
            ),
            {
                preserveScroll: true,
            }
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Módulos formativos
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Gestión de módulos por plan de estudio.
                        </p>
                    </div>

                    <Link
                        href={route(
                            'modulos-formativos.create'
                        )}
                        className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#274c64]"
                    >
                        Nuevo módulo
                    </Link>
                </div>
            }
        >
            <Head title="Módulos formativos" />

            <form
                onSubmit={buscarModulos}
                className="mb-5 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
                <input
                    type="search"
                    value={buscar}
                    onChange={(event) =>
                        setBuscar(event.target.value)
                    }
                    placeholder="Buscar módulo, plan, horas o créditos"
                    className="min-w-[260px] flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]"
                />

                <select
                    value={planEstudioId}
                    onChange={(event) =>
                        setPlanEstudioId(event.target.value)
                    }
                    className="min-w-[240px] rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a]"
                >
                    <option value="">
                        Todos los planes
                    </option>

                    {planesEstudio.map((plan) => (
                        <option
                            key={plan.id}
                            value={plan.id}
                        >
                            {plan.nombre}
                            {plan.codigo
                                ? ` (${plan.codigo})`
                                : ''}
                        </option>
                    ))}
                </select>

                <button
                    type="submit"
                    className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
                >
                    Buscar
                </button>

                <button
                    type="button"
                    onClick={limpiarFiltros}
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
                                'Módulo',
                                'Plan de estudio',
                                'Horas',
                                'Créditos',
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
                        {modulos.data.map((modulo) => (
                            <tr
                                key={modulo.id_modulo}
                                className="hover:bg-slate-50"
                            >
                                <td className="px-4 py-3">
                                    <p className="text-sm font-semibold text-slate-900">
                                        Módulo {modulo.num_modulo}
                                    </p>

                                    <p className="mt-1 text-sm text-slate-600">
                                        {modulo.nombre}
                                    </p>
                                </td>

                                <td className="px-4 py-3">
                                    <p className="text-sm font-semibold text-slate-700">
                                        {modulo.plan_estudio?.nombre ||
                                            'Sin plan'}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                        {modulo.plan_estudio?.codigo ||
                                            'Sin código'}
                                    </p>
                                </td>

                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {modulo.horas}
                                </td>

                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {modulo.creditos}
                                </td>

                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-2">
                                        <Link
                                            href={route(
                                                'modulos-formativos.edit',
                                                modulo.id_modulo
                                            )}
                                            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            Editar
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                eliminar(modulo)
                                            }
                                            className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {modulos.data.length === 0 && (
                    <div className="p-10 text-center">
                        <p className="text-sm font-semibold text-slate-700">
                            No se encontraron módulos formativos.
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                            Registre un módulo o modifique los filtros.
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {modulos.links.map((link, index) => (
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
