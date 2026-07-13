import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { useState } from 'react';

export default function Index({ departamentos, filtros }) {
    const [buscar, setBuscar] = useState(filtros.buscar ?? '');

    const submit = (e) => {
        e.preventDefault();
        router.get(
            route('departamentos.index'),
            { buscar },
            { preserveState: true, replace: true }
        );
    };

    const eliminar = async (item) => {
        const result = await Swal.fire({
            title: '¿Eliminar departamento?',
            text: item.Departamento,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        });

        if (!result.isConfirmed) return;

        router.delete(route('departamentos.destroy', item.idDepa), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Departamentos</h1>
                        <p className="mt-1 text-sm text-slate-500">Mantenimiento de departamentos.</p>
                    </div>
                    <Link href={route('departamentos.create')} className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white">
                        Nuevo departamento
                    </Link>
                </div>
            }
        >
            <Head title="Departamentos" />

            <form onSubmit={submit} className="mb-5 flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <input
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)}
                    placeholder="Buscar departamento"
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                />
                <button className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Buscar</button>
            </form>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Departamento</th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Provincias</th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {departamentos.data.map((item) => (
                            <tr key={item.idDepa}>
                                <td className="px-4 py-3 text-sm font-semibold">{item.Departamento}</td>
                                <td className="px-4 py-3 text-sm">{item.provincias_count}</td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <Link href={route('departamentos.edit', item.idDepa)} className="rounded-md border px-3 py-1.5 text-xs font-semibold">
                                            Editar
                                        </Link>
                                        <button onClick={() => eliminar(item)} className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600">
                                            Eliminar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AuthenticatedLayout>
    );
}
