import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { useEffect, useState } from 'react';
import PeriodosModal from './PeriodosModal';

export default function Index({
    planes,
    filtros,
    tipos,
}) {
    const { flash } = usePage().props;

    const [buscar, setBuscar] = useState(
        filtros.buscar ?? ''
    );

    const [estado, setEstado] = useState(
        filtros.estado ?? ''
    );

    const [tipo, setTipo] = useState(
        filtros.tipo ?? ''
    );

    const [modalOpen, setModalOpen] =
        useState(false);

    const [planSeleccionado, setPlanSeleccionado] =
        useState(null);

    const [periodos, setPeriodos] =
        useState([]);

    const [
        periodosSeleccionados,
        setPeriodosSeleccionados,
    ] = useState([]);

    const [guardandoPeriodos, setGuardandoPeriodos] =
        useState(false);

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

    const buscarPlanes = (event) => {
        event.preventDefault();

        router.get(
            route('planes-estudio.index'),
            {
                buscar,
                estado,
                tipo,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const limpiarFiltros = () => {
        setBuscar('');
        setEstado('');
        setTipo('');

        router.get(
            route('planes-estudio.index'),
            {},
            {
                replace: true,
            }
        );
    };

    const abrirModalPeriodos = async (plan) => {
        try {
            const response = await fetch(
                route(
                    'planes-estudio.periodos',
                    plan.id
                ),
                {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With':
                            'XMLHttpRequest',
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    'No se pudieron cargar los periodos.'
                );
            }

            const result = await response.json();

            setPlanSeleccionado(result.plan);
            setPeriodos(result.periodos ?? []);
            setPeriodosSeleccionados(
                (result.periodos ?? [])
                    .filter(
                        (periodo) =>
                            periodo.seleccionado
                    )
                    .map((periodo) => periodo.id)
            );

            setModalOpen(true);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text:
                    error.message ||
                    'No se pudieron cargar los periodos.',
            });
        }
    };

    const cerrarModal = () => {
        if (guardandoPeriodos) {
            return;
        }

        setModalOpen(false);
        setPlanSeleccionado(null);
        setPeriodos([]);
        setPeriodosSeleccionados([]);
    };

    const togglePeriodo = (periodoId) => {
        setPeriodosSeleccionados(
            (actuales) =>
                actuales.includes(periodoId)
                    ? actuales.filter(
                          (id) => id !== periodoId
                      )
                    : [...actuales, periodoId]
        );
    };

    const guardarPeriodos = () => {
        if (
            !planSeleccionado ||
            periodosSeleccionados.length === 0
        ) {
            Swal.fire({
                icon: 'warning',
                title: 'Seleccione un periodo',
                text:
                    'Debe seleccionar por lo menos un periodo.',
            });

            return;
        }

        setGuardandoPeriodos(true);

        router.put(
            route(
                'planes-estudio.periodos.sync',
                planSeleccionado.id
            ),
            {
                periodo_ids:
                    periodosSeleccionados,
            },
            {
                preserveScroll: true,

                onSuccess: () => {
                    cerrarModal();
                },

                onError: (errors) => {
                    Swal.fire({
                        icon: 'error',
                        title: 'No se pudo guardar',
                        text:
                            errors.periodo_ids ||
                            'Revise los periodos seleccionados.',
                    });
                },

                onFinish: () => {
                    setGuardandoPeriodos(false);
                },
            }
        );
    };

    const cambiarEstado = async (plan) => {
        const nuevoEstado = !plan.activo;

        const resultado = await Swal.fire({
            title: nuevoEstado
                ? '¿Activar plan?'
                : '¿Desactivar plan?',
            text: plan.nombre,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar',
        });

        if (!resultado.isConfirmed) {
            return;
        }

        router.put(
            route(
                'planes-estudio.estado',
                plan.id
            ),
            {
                activo: nuevoEstado,
            },
            {
                preserveScroll: true,
            }
        );
    };

    const eliminar = async (plan) => {
        const resultado = await Swal.fire({
            title: '¿Eliminar plan de estudio?',
            text: `Se eliminará "${plan.nombre}".`,
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
                'planes-estudio.destroy',
                plan.id
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
                            Planes de estudio
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Gestión de planes y asociación de periodos.
                        </p>
                    </div>

                    <Link
                        href={route(
                            'planes-estudio.create'
                        )}
                        className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#274c64]"
                    >
                        Nuevo plan
                    </Link>
                </div>
            }
        >
            <Head title="Planes de estudio" />

            <form
                onSubmit={buscarPlanes}
                className="mb-5 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
                <input
                    type="search"
                    value={buscar}
                    onChange={(event) =>
                        setBuscar(event.target.value)
                    }
                    placeholder="Buscar por nombre, código o resolución"
                    className="min-w-[260px] flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]"
                />

                <select
                    value={tipo}
                    onChange={(event) =>
                        setTipo(event.target.value)
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                >
                    <option value="">
                        Todos los tipos
                    </option>

                    {tipos.map((item) => (
                        <option
                            key={item.value}
                            value={item.value}
                        >
                            {item.label}
                        </option>
                    ))}
                </select>

                <select
                    value={estado}
                    onChange={(event) =>
                        setEstado(event.target.value)
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                >
                    <option value="">
                        Todos los estados
                    </option>
                    <option value="Activo">
                        Activo
                    </option>
                    <option value="Inactivo">
                        Inactivo
                    </option>
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
                                'Plan de estudio',
                                'Tipo',
                                'Resolución',
                                'Periodos',
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
                        {planes.data.map((plan) => (
                            <tr
                                key={plan.id}
                                className="hover:bg-slate-50"
                            >
                                <td className="px-4 py-3">
                                    <p className="text-sm font-semibold text-slate-900">
                                        {plan.nombre}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Código:{' '}
                                        {plan.codigo || '—'}
                                    </p>
                                </td>

                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {plan.tipo || '—'}
                                </td>

                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {plan.resolucion || '—'}
                                </td>

                                <td className="px-4 py-3">
                                    <div className="flex max-w-sm flex-wrap gap-1.5">
                                        {plan.periodos?.length >
                                        0 ? (
                                            plan.periodos.map(
                                                (periodo) => (
                                                    <span
                                                        key={
                                                            periodo.id
                                                        }
                                                        className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"
                                                    >
                                                        {
                                                            periodo.nombre
                                                        }
                                                    </span>
                                                )
                                            )
                                        ) : (
                                            <span className="text-sm text-slate-400">
                                                Sin periodos
                                            </span>
                                        )}
                                    </div>
                                </td>

                                <td className="px-4 py-3">
                                    <span
                                        className={[
                                            'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                                            plan.activo
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'bg-slate-100 text-slate-600',
                                        ].join(' ')}
                                    >
                                        {plan.activo
                                            ? 'Activo'
                                            : 'Inactivo'}
                                    </span>
                                </td>

                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-2">
                                        <Link
                                            href={route(
                                                'planes-estudio.edit',
                                                plan.id
                                            )}
                                            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            Editar
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                abrirModalPeriodos(
                                                    plan
                                                )
                                            }
                                            className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                        >
                                            Asignar periodos
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                cambiarEstado(
                                                    plan
                                                )
                                            }
                                            className="rounded-md border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                                        >
                                            {plan.activo
                                                ? 'Desactivar'
                                                : 'Activar'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                eliminar(plan)
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

                {planes.data.length === 0 && (
                    <div className="p-10 text-center">
                        <p className="text-sm font-semibold text-slate-700">
                            No se encontraron planes de estudio.
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {planes.links.map((link, index) => (
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

            <PeriodosModal
                open={modalOpen}
                plan={planSeleccionado}
                periodos={periodos}
                seleccionados={
                    periodosSeleccionados
                }
                guardando={guardandoPeriodos}
                onToggle={togglePeriodo}
                onClose={cerrarModal}
                onSave={guardarPeriodos}
            />
        </AuthenticatedLayout>
    );
}
