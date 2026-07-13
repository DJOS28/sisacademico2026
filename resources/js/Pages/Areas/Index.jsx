import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { useEffect, useState } from 'react';

export default function Index({ areas, filtros }) {
    const { flash } = usePage().props;
    const [buscar, setBuscar] = useState(filtros.buscar ?? '');
    const [estado, setEstado] = useState(filtros.estado ?? '');

    useEffect(() => {
        if (flash?.success) Swal.fire('Correcto', flash.success, 'success');
        if (flash?.error) Swal.fire('Atención', flash.error, 'error');
    }, [flash]);

    const filtrar = (e) => {
        e.preventDefault();
        router.get(route('areas.index'), { buscar, estado }, { preserveState: true, replace: true });
    };

    const cambiarEstado = async (area) => {
        const nuevoEstado = area.estado === 'Activo' ? 'Inactivo' : 'Activo';
        const result = await Swal.fire({
            title: `¿Cambiar a ${nuevoEstado}?`,
            text: area.nombre,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar',
        });
        if (!result.isConfirmed) return;
        router.put(route('areas.estado', area.id), { estado: nuevoEstado }, { preserveScroll: true });
    };

    const eliminar = async (area) => {
        const result = await Swal.fire({
            title: '¿Eliminar área?',
            text: area.nombre,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        });
        if (!result.isConfirmed) return;
        router.delete(route('areas.destroy', area.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Áreas administrativas</h1>
                        <p className="mt-1 text-sm text-slate-500">Gestión de unidades organizacionales.</p>
                    </div>
                    <Link href={route('areas.create')} className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white">Nueva área</Link>
                </div>
            }
        >
            <Head title="Áreas" />

            <form onSubmit={filtrar} className="mb-5 flex flex-wrap gap-3 rounded-xl border bg-white p-4">
                <input
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)}
                    placeholder="Buscar por nombre o descripción"
                    className="min-w-[280px] flex-1 rounded-lg border px-3 py-2.5 text-sm"
                />
                <select value={estado} onChange={(e) => setEstado(e.target.value)} className="rounded-lg border px-3 py-2.5 text-sm">
                    <option value="">Todos los estados</option>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                </select>
                <button className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Buscar</button>
            </form>

            <div className="overflow-x-auto rounded-xl border bg-white">
                <table className="min-w-full divide-y">
                    <thead className="bg-slate-50">
                        <tr>
                            {['Área', 'Descripción', 'Personal', 'Usuarios', 'Estado', 'Acciones'].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {areas.data.map((area) => (
                            <tr key={area.id}>
                                <td className="px-4 py-3 text-sm font-semibold">{area.nombre}</td>
                                <td className="max-w-md px-4 py-3 text-sm text-slate-600">{area.descripcion || 'Sin descripción'}</td>
                                <td className="px-4 py-3 text-sm">{area.personal_count ?? 0}</td>
                                <td className="px-4 py-3 text-sm">{area.usuarios_count ?? 0}</td>
                                <td className="px-4 py-3">
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${area.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                        {area.estado}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-2">
                                        <Link href={route('areas.edit', area.id)} className="rounded-md border px-3 py-1.5 text-xs font-semibold">Editar</Link>
                                        <button onClick={() => cambiarEstado(area)} className="rounded-md border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700">
                                            {area.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                                        </button>
                                        <button onClick={() => eliminar(area)} className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600">Eliminar</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {areas.data.length === 0 && (
                    <div className="p-8 text-center text-sm text-slate-500">No se encontraron áreas.</div>
                )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {areas.links.map((link, index) => (
                    <button
                        key={index}
                        disabled={!link.url}
                        onClick={() => link.url && router.visit(link.url, { preserveState: true })}
                        className={`rounded-md border px-3 py-2 text-sm ${link.active ? 'bg-[#315d7a] text-white' : 'bg-white text-slate-600'} disabled:opacity-40`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </div>
        </AuthenticatedLayout>
    );
}
