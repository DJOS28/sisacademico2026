import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { useEffect, useState } from 'react';

export default function Index({ distritos, departamentos, provincias: iniciales, filtros }) {
    const [buscar, setBuscar] = useState(filtros.buscar ?? '');
    const [idDepa, setIdDepa] = useState(filtros.idDepa ?? '');
    const [idProv, setIdProv] = useState(filtros.idProv ?? '');
    const [provincias, setProvincias] = useState(iniciales ?? []);

    useEffect(() => {
        if (!idDepa) {
            setProvincias([]);
            setIdProv('');
            return;
        }

        fetch(route('provincias.por-departamento', idDepa), {
            headers: { Accept: 'application/json' },
        })
            .then((response) => response.json())
            .then((result) => setProvincias(result.provincias ?? []));
    }, [idDepa]);

    const submit = (e) => {
        e.preventDefault();
        router.get(route('distritos.index'), { buscar, idDepa, idProv }, { preserveState: true, replace: true });
    };

    const eliminar = async (item) => {
        const result = await Swal.fire({
            title: '¿Eliminar distrito?',
            text: item.Distrito,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        });

        if (!result.isConfirmed) return;
        router.delete(route('distritos.destroy', item.idDist), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Distritos</h1>
                        <p className="mt-1 text-sm text-slate-500">Mantenimiento de distritos.</p>
                    </div>
                    <Link href={route('distritos.create')} className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white">Nuevo distrito</Link>
                </div>
            }
        >
            <Head title="Distritos" />
            <form onSubmit={submit} className="mb-5 flex flex-wrap gap-3 rounded-xl border bg-white p-4">
                <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar distrito" className="min-w-[240px] flex-1 rounded-lg border px-3 py-2.5 text-sm" />
                <select value={idDepa} onChange={(e) => setIdDepa(e.target.value)} className="rounded-lg border px-3 py-2.5 text-sm">
                    <option value="">Todos los departamentos</option>
                    {departamentos.map((item) => <option key={item.idDepa} value={item.idDepa}>{item.Departamento}</option>)}
                </select>
                <select value={idProv} onChange={(e) => setIdProv(e.target.value)} className="rounded-lg border px-3 py-2.5 text-sm">
                    <option value="">Todas las provincias</option>
                    {provincias.map((item) => <option key={item.idProv} value={item.idProv}>{item.Provincia}</option>)}
                </select>
                <button className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Buscar</button>
            </form>

            <div className="overflow-x-auto rounded-xl border bg-white">
                <table className="min-w-full divide-y">
                    <thead className="bg-slate-50">
                        <tr>
                            {['Distrito', 'Provincia', 'Departamento', 'Acciones'].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {distritos.data.map((item) => (
                            <tr key={item.idDist}>
                                <td className="px-4 py-3 text-sm font-semibold">{item.Distrito}</td>
                                <td className="px-4 py-3 text-sm">{item.provincia?.Provincia}</td>
                                <td className="px-4 py-3 text-sm">{item.provincia?.departamento?.Departamento}</td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <Link href={route('distritos.edit', item.idDist)} className="rounded-md border px-3 py-1.5 text-xs font-semibold">Editar</Link>
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
