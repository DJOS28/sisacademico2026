import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function Index({ requisitos, filtros, resumen }) {
    const cambiarEstado = (requisito) => {
        router.patch(
            route('requisitos.cambiar-estado', requisito.id_requisito),
            { activo: !requisito.activo },
            {
                preserveScroll: true,
                onSuccess: () => Swal.fire('Estado actualizado', '', 'success'),
            }
        );
    };

    const eliminarRequisito = (requisito) => {
        Swal.fire({
            title: '¿Eliminar requisito?',
            text: `Se eliminará "${requisito.nombre}". Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('requisitos.destroy', requisito.id_requisito), {
                    preserveScroll: true,
                    onSuccess: () => Swal.fire('Eliminado', 'El requisito fue eliminado.', 'success'),
                    onError: (errors) => Swal.fire('Error', errors.error || 'No se pudo eliminar.', 'error'),
                });
            }
        });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-slate-900">Gestión de Requisitos</h1>}>
            <Head title="Requisitos" />

            <div className="w-full space-y-6">
                {/* CABECERA */}
                <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Listado de Requisitos</h2>
                        <p className="mt-1 text-sm text-slate-500">Documentos y requisitos exigidos en las admisiones.</p>
                    </div>

                    <Link
                        href={route('requisitos.create')}
                        className="inline-flex justify-center rounded-lg bg-[#315d7a] px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-[#274b63]"
                    >
                        + Nuevo Requisito
                    </Link>
                </div>

                {/* RESUMEN */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 border-l-4 border-l-slate-600 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase text-slate-500">Total Requisitos</p>
                        <p className="mt-1 text-2xl font-black text-slate-800">{resumen?.total ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 border-l-4 border-l-emerald-500 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase text-slate-500">Activos</p>
                        <p className="mt-1 text-2xl font-black text-slate-800">{resumen?.activos ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 border-l-4 border-l-rose-500 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase text-slate-500">Inactivos</p>
                        <p className="mt-1 text-2xl font-black text-slate-800">{resumen?.inactivos ?? 0}</p>
                    </div>
                </div>

                {/* TABLA DE REQUISITOS */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                            <tr>
                                <th className="px-4 py-3">Nombre</th>
                                <th className="px-4 py-3">Descripción</th>
                                <th className="px-4 py-3 text-center">Admisiones Vinculadas</th>
                                <th className="px-4 py-3 text-center">Estado</th>
                                <th className="px-4 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {requisitos.data && requisitos.data.length > 0 ? (
                                requisitos.data.map((req) => (
                                    <tr key={req.id_requisito} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-semibold text-slate-800">{req.nombre}</td>
                                        <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{req.descripcion || '—'}</td>
                                        <td className="px-4 py-3 text-center font-bold">{req.admisiones_count ?? 0}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => cambiarEstado(req)}
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold cursor-pointer ${
                                                    req.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                                }`}
                                            >
                                                {req.activo ? 'Activo' : 'Inactivo'}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <Link
                                                href={route('requisitos.edit', req.id_requisito)}
                                                className="inline-flex rounded border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                            >
                                                Editar
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => eliminarRequisito(req)}
                                                className="inline-flex rounded border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                                        No hay requisitos registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}