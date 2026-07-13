import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function Index({ institutos }) {
    const eliminar = async (item) => {
        const result = await Swal.fire({
            title: '¿Eliminar instituto?',
            text: item.nombre,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        });

        if (!result.isConfirmed) return;
        router.delete(route('instituto.destroy', item.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Instituto</h1>
                        <p className="mt-1 text-sm text-slate-500">Datos institucionales y ubicación.</p>
                    </div>
                    <Link href={route('instituto.create')} className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white">
                        Nuevo instituto
                    </Link>
                </div>
            }
        >
            <Head title="Instituto" />

            <div className="overflow-x-auto rounded-xl border bg-white">
                <table className="min-w-full divide-y">
                    <thead className="bg-slate-50">
                        <tr>
                            {['Nombre', 'Código modular', 'Distrito', 'Provincia', 'Departamento', 'Acciones'].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {institutos.data.map((item) => (
                            <tr key={item.id}>
                                <td className="px-4 py-3 text-sm font-semibold">{item.nombre}</td>
                                <td className="px-4 py-3 text-sm">{item.codigo_modular}</td>
                                <td className="px-4 py-3 text-sm">{item.distrito?.Distrito}</td>
                                <td className="px-4 py-3 text-sm">{item.distrito?.provincia?.Provincia}</td>
                                <td className="px-4 py-3 text-sm">{item.distrito?.provincia?.departamento?.Departamento}</td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <Link href={route('instituto.edit', item.id)} className="rounded-md border px-3 py-1.5 text-xs font-semibold">Editar</Link>
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
