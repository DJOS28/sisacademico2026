import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useEffect, useRef, useState } from 'react';

export default function Index({ tramites: tramitesIniciales, filtros }) {
    const { flash } = usePage().props;

    const [tramites, setTramites] = useState(tramitesIniciales);
    const [buscar, setBuscar] = useState(filtros?.buscar ?? '');
    const [estado, setEstado] = useState(filtros?.estado ?? '');
    const [cargando, setCargando] = useState(false);

    const primerRender = useRef(true);

    useEffect(() => {
        if (flash?.success) {
            Swal.fire({ icon: 'success', title: 'Operación completada', text: flash.success });
        }
        if (flash?.error) {
            Swal.fire({ icon: 'error', title: 'No se pudo completar', text: flash.error });
        }
    }, [flash]);

    useEffect(() => {
        if (primerRender.current) {
            primerRender.current = false;
            return;
        }

        const delay = setTimeout(() => {
            buscarTramites();
        }, 400);

        return () => clearTimeout(delay);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [buscar, estado]);

    const buscarTramites = async (url = route('tramites.index')) => {
        setCargando(true);
        try {
            const { data } = await axios.get(url, {
                params: url === route('tramites.index') ? { buscar, estado } : undefined,
            });
            setTramites(data);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error al buscar',
                text: 'No se pudo cargar el listado de trámites.',
            });
        } finally {
            setCargando(false);
        }
    };

    const limpiarFiltros = () => {
        setBuscar('');
        setEstado('');
    };

    const irAPagina = (link) => {
        if (!link.url) return;
        buscarTramites(link.url);
    };

    const cambiarEstado = async (tramite) => {
        const nuevoEstado = tramite.estado === 'Activo' ? 'Inactivo' : 'Activo';

        const resultado = await Swal.fire({
            title: nuevoEstado === 'Activo' ? '¿Activar trámite?' : '¿Desactivar trámite?',
            text: tramite.nombre,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar',
        });

        if (!resultado.isConfirmed) return;

        try {
            const { data } = await axios.put(route('tramites.estado', tramite.id), {
                estado: nuevoEstado,
            });

            await buscarTramites();

            Swal.fire({
                icon: 'success',
                title: 'Operación completada',
                text: data.message,
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'No se pudo completar',
                text: error.response?.data?.message ?? 'Ocurrió un error inesperado.',
            });
        }
    };

    const eliminar = async (tramite) => {
        const resultado = await Swal.fire({
            title: '¿Eliminar trámite?',
            text: `Se eliminará "${tramite.nombre}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        });

        if (!resultado.isConfirmed) return;

        try {
            const { data } = await axios.delete(route('tramites.destroy', tramite.id));

            await buscarTramites();

            Swal.fire({
                icon: 'success',
                title: 'Operación completada',
                text: data.message,
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'No se pudo eliminar',
                text: error.response?.data?.message ?? 'Ocurrió un error inesperado.',
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Trámites</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Catálogo de trámites disponibles y sus requisitos.
                        </p>
                    </div>

                    <Link
                        href={route('tramites.create')}
                        className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#274c64]"
                    >
                        Nuevo trámite
                    </Link>
                </div>
            }
        >
            <Head title="Trámites" />

            <div className="mb-5 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <input
                    type="search"
                    value={buscar}
                    onChange={(event) => setBuscar(event.target.value)}
                    placeholder="Buscar por nombre o descripción"
                    className="min-w-[280px] flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]"
                />

                <select
                    value={estado}
                    onChange={(event) => setEstado(event.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a]"
                >
                    <option value="">Todos los estados</option>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                </select>

                <button
                    type="button"
                    onClick={limpiarFiltros}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600"
                >
                    Limpiar
                </button>

                {cargando && (
                    <span className="flex items-center px-2 text-xs font-semibold text-slate-400">
                        Buscando...
                    </span>
                )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            {['Trámite', 'Costo', 'Tiempo', 'Requisitos', 'Estado', 'Acciones'].map(
                                (encabezado) => (
                                    <th
                                        key={encabezado}
                                        className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                                    >
                                        {encabezado}
                                    </th>
                                )
                            )}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {tramites.data.map((tramite) => (
                            <tr key={tramite.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3">
                                    <p className="text-sm font-semibold text-slate-900">{tramite.nombre}</p>
                                    <p className="line-clamp-1 text-xs text-slate-500">
                                        {tramite.descripcion || 'Sin descripción'}
                                    </p>
                                </td>

                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {tramite.costo ? `S/ ${Number(tramite.costo).toFixed(2)}` : '—'}
                                </td>

                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {tramite.tiempo || '—'}
                                </td>

                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {tramite.requisitos_count ?? 0}
                                </td>

                                <td className="px-4 py-3">
                                    <span
                                        className={[
                                            'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                                            tramite.estado === 'Activo'
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'bg-slate-100 text-slate-600',
                                        ].join(' ')}
                                    >
                                        {tramite.estado}
                                    </span>
                                </td>

                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-2">
                                        <Link
                                            href={route('tramites.show', tramite.id)}
                                            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            Ver
                                        </Link>

                                        <Link
                                            href={route('tramites.edit', tramite.id)}
                                            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            Editar
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={() => cambiarEstado(tramite)}
                                            className="rounded-md border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                                        >
                                            {tramite.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => eliminar(tramite)}
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

                {tramites.data.length === 0 && (
                    <div className="p-10 text-center">
                        <p className="text-sm font-semibold text-slate-700">No se encontraron trámites.</p>
                    </div>
                )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {tramites.links?.map((link, index) => (
                    <button
                        key={index}
                        type="button"
                        disabled={!link.url}
                        onClick={() => irAPagina(link)}
                        className={[
                            'rounded-md border px-3 py-2 text-sm',
                            link.active
                                ? 'border-[#315d7a] bg-[#315d7a] text-white'
                                : 'border-slate-200 bg-white text-slate-600',
                            !link.url ? 'cursor-not-allowed opacity-40' : '',
                        ].join(' ')}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </div>
        </AuthenticatedLayout>
    );
}