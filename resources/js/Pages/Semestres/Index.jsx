import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { useEffect, useState } from 'react';

export default function Index({ semestres, filtros }) {
    const { flash } = usePage().props;

    const [buscar, setBuscar] = useState(
        filtros.buscar ?? ''
    );

    const [estado, setEstado] = useState(
        filtros.estado ?? ''
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

    const buscarSemestres = (event) => {
        event.preventDefault();

        router.get(
            route('semestres.index'),
            {
                buscar,
                estado,
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

        router.get(
            route('semestres.index'),
            {},
            {
                replace: true,
            }
        );
    };

    const cambiarEstado = async (semestre) => {
        const nuevoEstado = !semestre.activo;

        const resultado = await Swal.fire({
            title: nuevoEstado
                ? '¿Activar semestre?'
                : '¿Desactivar semestre?',
            text: semestre.nombre,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar',
        });

        if (!resultado.isConfirmed) {
            return;
        }

        router.put(
            route('semestres.estado', semestre.id),
            {
                activo: nuevoEstado,
            },
            {
                preserveScroll: true,
            }
        );
    };

    const eliminar = async (semestre) => {
        const resultado = await Swal.fire({
            title: '¿Eliminar semestre?',
            text: `Se eliminará "${semestre.nombre}".`,
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
            route('semestres.destroy', semestre.id),
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
                            Semestres
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Gestión de semestres académicos.
                        </p>
                    </div>

                    <Link
                        href={route('semestres.create')}
                        className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#274c64]"
                    >
                        Nuevo semestre
                    </Link>
                </div>
            }
        >
            <Head title="Semestres" />

            <form
                onSubmit={buscarSemestres}
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

                <select
                    value={estado}
                    onChange={(event) =>
                        setEstado(event.target.value)
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a]"
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
                                'Semestre',
                                'Descripción',
                                'Fecha de creación',
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
                        {semestres.data.map((semestre) => (
                            <tr
                                key={semestre.id}
                                className="hover:bg-slate-50"
                            >
                                <td className="px-4 py-3">
                                    <p className="text-sm font-semibold text-slate-900">
                                        {semestre.nombre}
                                    </p>
                                </td>

                                <td className="max-w-md px-4 py-3 text-sm text-slate-600">
                                    <p className="line-clamp-2">
                                        {semestre.descripcion ||
                                            'Sin descripción'}
                                    </p>
                                </td>

                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {semestre.fecha_creacion || '—'}
                                </td>

                                <td className="px-4 py-3">
                                    <span
                                        className={[
                                            'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                                            semestre.activo
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'bg-slate-100 text-slate-600',
                                        ].join(' ')}
                                    >
                                        {semestre.activo
                                            ? 'Activo'
                                            : 'Inactivo'}
                                    </span>
                                </td>

                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-2">
                                        <Link
                                            href={route(
                                                'semestres.edit',
                                                semestre.id
                                            )}
                                            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            Editar
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                cambiarEstado(
                                                    semestre
                                                )
                                            }
                                            className="rounded-md border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                                        >
                                            {semestre.activo
                                                ? 'Desactivar'
                                                : 'Activar'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                eliminar(semestre)
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

                {semestres.data.length === 0 && (
                    <div className="p-10 text-center">
                        <p className="text-sm font-semibold text-slate-700">
                            No se encontraron semestres.
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {semestres.links.map((link, index) => (
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
