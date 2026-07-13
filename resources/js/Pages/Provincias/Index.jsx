import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { useState } from 'react';

export default function Index({ provincias, departamentos, filtros }) {
    const [buscar, setBuscar] = useState(filtros.buscar ?? '');
    const [idDepa, setIdDepa] = useState(filtros.idDepa ?? '');

    const submit = (e) => {
        e.preventDefault();
        router.get(route('provincias.index'), { buscar, idDepa }, { preserveState: true, replace: true });
    };

    const eliminar = async (item) => {
        const result = await Swal.fire({
            title: '¿Eliminar provincia?',
            text: item.Provincia,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        });

        if (!result.isConfirmed) return;
        router.delete(route('provincias.destroy', item.idProv), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Provincias</h1>
                        <p className="mt-1 text-sm text-slate-500">Mantenimiento de provincias.</p>
                    </div>
                    <Link href={route('provincias.create')} className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white">Nueva provincia</Link>
                </div>
            }
        >
            <Head title="Provincias" />
            <form onSubmit={submit} className="mb-5 flex flex-wrap gap-3 rounded-xl border bg-white p-4">
                <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar provincia" className="min-w-[260px] flex-1 rounded-lg border px-3 py-2.5 text-sm" />
                <select value={idDepa} onChange={(e) => setIdDepa(e.target.value)} className="rounded-lg border px-3 py-2.5 text-sm">
                    <option value="">Todos los departamentos</option>
                    {departamentos.map((item) => <option key={item.idDepa} value={item.idDepa}>{item.Departamento}</option>)}
                </select>
                <button className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Buscar</button>
            </form>

            <div className="overflow-x-auto rounded-xl border bg-white">
                <table className="min-w-full divide-y">
                    <thead className="bg-slate-50">
                        <tr>
                            {['Provincia', 'Departamento', 'Distritos', 'Acciones'].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {provincias.data.map((item) => (
                            <tr key={item.idProv}>
                                <td className="px-4 py-3 text-sm font-semibold">{item.Provincia}</td>
                                <td className="px-4 py-3 text-sm">{item.departamento?.Departamento}</td>
                                <td className="px-4 py-3 text-sm">{item.distritos_count}</td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <Link href={route('provincias.edit', item.idProv)} className="rounded-md border px-3 py-1.5 text-xs font-semibold">Editar</Link>
                                        <button onClick={() => eliminar(item)} className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600">Eliminar</button>
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
