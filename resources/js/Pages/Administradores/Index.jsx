import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { useState } from 'react';

export default function Index({ administradores, filtros }) {
    const [buscar, setBuscar] = useState(filtros.buscar ?? '');
    const [estado, setEstado] = useState(filtros.estado ?? '');

    const filtrar = (e) => {
        e.preventDefault();
        router.get(route('administradores.index'), { buscar, estado }, { preserveState: true, replace: true });
    };

    const cambiarEstado = async (item) => {
        const nuevoEstado = item.usuario.status === 'Activo' ? 'Inactivo' : 'Activo';
        const result = await Swal.fire({
            title: `¿Cambiar a ${nuevoEstado}?`,
            text: `Usuario: ${item.usuario?.username}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar',
        });

        if (!result.isConfirmed) return;

        router.put(route('administradores.estado', item.id), { status: nuevoEstado }, {
            preserveScroll: true,
            onSuccess: () => Swal.fire('Actualizado', 'Estado actualizado correctamente.', 'success'),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Administradores</h1>
                        <p className="mt-1 text-sm text-slate-500">Gestión de cuentas y accesos del sistema.</p>
                    </div>
                    <Link href={route('administradores.create')} className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#274c64]">
                        Nuevo administrador
                    </Link>
                </div>
            }
        >
            <Head title="Administradores" />

            <form onSubmit={filtrar} className="mb-5 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <input
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)}
                    placeholder="Buscar por DNI, nombre, correo o usuario"
                    className="min-w-[280px] flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                />
                <select 
                    value={estado} 
                    onChange={(e) => setEstado(e.target.value)} 
                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a]"
                >
                    <option value="">Todos los estados</option>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="Desactivado">Desactivado (Bloqueado)</option>
                </select>
                <button className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                    Buscar
                </button>
            </form>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            {['Personal', 'Cuenta de Usuario', 'DNI', 'Contacto', 'Estado', 'Acciones'].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {administradores.data.map((item) => {
                            const rol = item.usuario?.roles?.[0]?.nombre ?? item.usuario?.rol_principal ?? 'Administrador';
                            const iniciales = `${item.nombre?.[0] ?? ''}${item.apellido?.[0] ?? ''}`.toUpperCase();

                            return (
                                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                                    {/* Identidad del Personal */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#315d7a]/10 font-bold text-xs text-[#315d7a]">
                                                {iniciales || 'AD'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">
                                                    {item.nombre} {item.apellido}
                                                </p>
                                                <p className="text-xs text-slate-400">ID: #{item.id}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Cuenta de Usuario y Rol */}
                                    <td className="px-4 py-3">
                                        <div className="space-y-1">
                                            <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                <span>@{item.usuario?.username ?? 'sin_usuario'}</span>
                                            </div>
                                            <div>
                                                <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 border border-blue-200">
                                                    {rol}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* DNI */}
                                    <td className="px-4 py-3 text-sm font-mono text-slate-600">
                                        {item.dni || '—'}
                                    </td>

                                    {/* Correo y Teléfono */}
                                    <td className="px-4 py-3 text-xs text-slate-600 space-y-0.5">
                                        <p className="font-medium text-slate-800">{item.email}</p>
                                        <p className="text-slate-400">{item.telefono ? `Tel: ${item.telefono}` : 'Sin teléfono'}</p>
                                    </td>

                                    {/* Estado */}
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                            item.usuario?.status === 'Activo'
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : item.usuario?.status === 'Desactivado'
                                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                                        }`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${
                                                item.usuario?.status === 'Activo'
                                                    ? 'bg-emerald-500'
                                                    : item.usuario?.status === 'Desactivado'
                                                    ? 'bg-amber-500'
                                                    : 'bg-rose-500'
                                            }`} />
                                            {item.usuario?.status ?? 'Inactivo'}
                                        </span>
                                    </td>

                                    {/* Acciones */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Link 
                                                href={route('administradores.edit', item.id)} 
                                                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                            >
                                                Editar
                                            </Link>
                                            <button 
                                                onClick={() => cambiarEstado(item)} 
                                                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                            >
                                                {item.usuario?.status === 'Activo' ? 'Desactivar' : 'Activar'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {administradores.data.length === 0 && (
                    <div className="p-8 text-center text-sm text-slate-500">No se encontraron administradores.</div>
                )}
            </div>

            {/* Paginación */}
            <div className="mt-4 flex flex-wrap gap-2">
                {administradores.links.map((link, index) => (
                    <button
                        key={index}
                        disabled={!link.url}
                        onClick={() => link.url && router.visit(link.url, { preserveState: true })}
                        className={`rounded-md border px-3 py-1.5 text-sm ${link.active ? 'bg-[#315d7a] text-white' : 'bg-white text-slate-600'} disabled:opacity-40`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </div>
        </AuthenticatedLayout>
    );
}