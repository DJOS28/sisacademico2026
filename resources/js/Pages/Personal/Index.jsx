import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { useState } from 'react';

export default function Index({ personal, areas, filtros }) {
    const [buscar, setBuscar] = useState(filtros.buscar ?? '');
    const [estado, setEstado] = useState(filtros.estado ?? '');
    const [areaId, setAreaId] = useState(filtros.area_id ?? '');

    const filtrar = (e) => {
        e.preventDefault();
        router.get(route('personal.index'), { buscar, estado, area_id: areaId }, { preserveState: true, replace: true });
    };

    const cambiarEstado = async (item) => {
        const nuevoEstado = item.usuario.status === 'Activo' ? 'Inactivo' : 'Activo';
        const result = await Swal.fire({
            title: `¿Cambiar a ${nuevoEstado}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar',
        });

        if (!result.isConfirmed) return;

        router.put(route('personal.estado', item.id), { status: nuevoEstado }, {
            preserveScroll: true,
            onSuccess: () => Swal.fire('Actualizado', 'Estado actualizado correctamente.', 'success'),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Personal</h1>
                        <p className="mt-1 text-sm text-slate-500">Gestión de personal, roles y áreas.</p>
                    </div>
                    <Link href={route('personal.create')} className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white">
                        Nuevo personal
                    </Link>
                </div>
            }
        >
            <Head title="Personal" />

            <form onSubmit={filtrar} className="mb-5 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <input
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)}
                    placeholder="Buscar por DNI, nombre, puesto, correo o usuario"
                    className="min-w-[280px] flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                />
                <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
                    <option value="">Todas las áreas</option>
                    {areas.map((area) => <option key={area.id} value={area.id}>{area.nombre}</option>)}
                </select>
                <select value={estado} onChange={(e) => setEstado(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
                    <option value="">Todos los estados</option>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                </select>
                <button className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Buscar</button>
            </form>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            {['DNI', 'Nombre', 'Puesto', 'Área', 'Roles', 'Estado', 'Acciones'].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {personal.data.map((item) => (
                            <tr key={item.id}>
                                <td className="px-4 py-3 text-sm">{item.dni}</td>
                                <td className="px-4 py-3 text-sm font-semibold">{item.nombre} {item.apellido}</td>
                                <td className="px-4 py-3 text-sm">{item.puesto}</td>
                                <td className="px-4 py-3 text-sm">{item.area?.nombre ?? 'Sin área'}</td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {(item.usuario?.roles ?? []).map((rol) => (
                                            <span key={rol.id} className="rounded-full bg-[#eef3f7] px-2 py-1 text-[11px] font-semibold text-[#315d7a]">{rol.nombre}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.usuario?.status === 'Activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                        {item.usuario?.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <Link href={route('personal.edit', item.id)} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold">Editar</Link>
                                        <button onClick={() => cambiarEstado(item)} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold">
                                            {item.usuario?.status === 'Activo' ? 'Desactivar' : 'Activar'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {personal.data.length === 0 && (
                    <div className="p-8 text-center text-sm text-slate-500">No se encontraron registros.</div>
                )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {personal.links.map((link, index) => (
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
