import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useEffect, useRef, useState } from 'react';

export default function Index({ requisitos: requisitosIniciales, filtros }) {
    const { flash } = usePage().props;

    const [requisitos, setRequisitos] = useState(requisitosIniciales);
    const [buscar, setBuscar] = useState(filtros?.buscar ?? '');
    const [estado, setEstado] = useState(filtros?.estado ?? '');
    const [cargando, setCargando] = useState(false);

    const [modalAbierto, setModalAbierto] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [errores, setErrores] = useState({});
    const [form, setForm] = useState({ id: null, descripcion: '', estado: 'Activo' });

    const primerRender = useRef(true);

    useEffect(() => {
        if (flash?.success) {
            Swal.fire({ icon: 'success', title: 'Operación completada', text: flash.success });
        }
        if (flash?.error) {
            Swal.fire({ icon: 'error', title: 'No se pudo completar', text: flash.error });
        }
    }, [flash]);

    // Búsqueda automática por AJAX (debounced) cada vez que cambia el texto o el estado
    useEffect(() => {
        if (primerRender.current) {
            primerRender.current = false;
            return;
        }

        const delay = setTimeout(() => {
            buscarRequisitos();
        }, 400);

        return () => clearTimeout(delay);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [buscar, estado]);

    const buscarRequisitos = async (url = route('requisitos-tramite.index')) => {
        setCargando(true);
        try {
            const { data } = await axios.get(url, {
                params: url === route('requisitos-tramite.index') ? { buscar, estado } : undefined,
            });
            setRequisitos(data);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error al buscar',
                text: 'No se pudo cargar el listado de requisitos.',
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
        buscarRequisitos(link.url);
    };

    const abrirModalCrear = () => {
        setModoEdicion(false);
        setForm({ id: null, descripcion: '', estado: 'Activo' });
        setErrores({});
        setModalAbierto(true);
    };

    const abrirModalEditar = (requisito) => {
        setModoEdicion(true);
        setForm({ id: requisito.id, descripcion: requisito.descripcion, estado: requisito.estado });
        setErrores({});
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        if (guardando) return;
        setModalAbierto(false);
    };

    const guardar = async (event) => {
        event.preventDefault();
        setGuardando(true);
        setErrores({});

        try {
            const url = modoEdicion
                ? route('requisitos-tramite.update', form.id)
                : route('requisitos-tramite.store');

            const metodo = modoEdicion ? 'put' : 'post';

            const { data } = await axios[metodo](url, {
                descripcion: form.descripcion,
                estado: form.estado,
            });

            setModalAbierto(false);
            await buscarRequisitos();

            Swal.fire({
                icon: 'success',
                title: 'Operación completada',
                text: data.message,
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (error) {
            if (error.response?.status === 422) {
                setErrores(error.response.data.errors ?? {});
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'No se pudo completar',
                    text: error.response?.data?.message ?? 'Ocurrió un error inesperado.',
                });
            }
        } finally {
            setGuardando(false);
        }
    };

    const cambiarEstado = async (requisito) => {
        const nuevoEstado = requisito.estado === 'Activo' ? 'Inactivo' : 'Activo';

        const resultado = await Swal.fire({
            title: nuevoEstado === 'Activo' ? '¿Activar requisito?' : '¿Desactivar requisito?',
            text: requisito.descripcion,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar',
        });

        if (!resultado.isConfirmed) return;

        try {
            const { data } = await axios.put(route('requisitos-tramite.estado', requisito.id), {
                estado: nuevoEstado,
            });

            await buscarRequisitos();

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

    const eliminar = async (requisito) => {
        const resultado = await Swal.fire({
            title: '¿Eliminar requisito?',
            text: `Se eliminará "${requisito.descripcion}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        });

        if (!resultado.isConfirmed) return;

        try {
            const { data } = await axios.delete(route('requisitos-tramite.destroy', requisito.id));

            await buscarRequisitos();

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
                        <h1 className="text-2xl font-bold text-slate-900">Requisitos de Trámite</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Catálogo de requisitos que pueden exigir los trámites.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={abrirModalCrear}
                        className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#274c64]"
                    >
                        Nuevo requisito
                    </button>
                </div>
            }
        >
            <Head title="Requisitos de Trámite" />

            <div className="mb-5 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <input
                    type="search"
                    value={buscar}
                    onChange={(event) => setBuscar(event.target.value)}
                    placeholder="Buscar por descripción"
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
                            {['Descripción', 'Estado', 'Acciones'].map((encabezado) => (
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
                        {requisitos.data.map((requisito) => (
                            <tr key={requisito.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3">
                                    <p className="text-sm font-semibold text-slate-900">
                                        {requisito.descripcion}
                                    </p>
                                </td>

                                <td className="px-4 py-3">
                                    <span
                                        className={[
                                            'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                                            requisito.estado === 'Activo'
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'bg-slate-100 text-slate-600',
                                        ].join(' ')}
                                    >
                                        {requisito.estado}
                                    </span>
                                </td>

                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => abrirModalEditar(requisito)}
                                            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            Editar
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => cambiarEstado(requisito)}
                                            className="rounded-md border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                                        >
                                            {requisito.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => eliminar(requisito)}
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

                {requisitos.data.length === 0 && (
                    <div className="p-10 text-center">
                        <p className="text-sm font-semibold text-slate-700">
                            No se encontraron requisitos.
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {requisitos.links?.map((link, index) => (
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

            {/* Modal crear / editar */}
            {modalAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                        <h2 className="text-lg font-bold text-slate-900">
                            {modoEdicion ? 'Editar requisito' : 'Nuevo requisito'}
                        </h2>

                        <form onSubmit={guardar} className="mt-4 space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">
                                    Descripción
                                </label>
                                <input
                                    type="text"
                                    value={form.descripcion}
                                    onChange={(event) =>
                                        setForm({ ...form, descripcion: event.target.value })
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]"
                                    placeholder="Ej. Copia de DNI"
                                    autoFocus
                                />
                                {errores.descripcion && (
                                    <p className="mt-1 text-xs font-semibold text-rose-600">
                                        {errores.descripcion[0]}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">
                                    Estado
                                </label>
                                <select
                                    value={form.estado}
                                    onChange={(event) =>
                                        setForm({ ...form, estado: event.target.value })
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a]"
                                >
                                    <option value="Activo">Activo</option>
                                    <option value="Inactivo">Inactivo</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={cerrarModal}
                                    disabled={guardando}
                                    className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={guardando}
                                    className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#274c64] disabled:opacity-60"
                                >
                                    {guardando ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}