import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import ModalFormTipoContrato from './ModalFormTipoContrato';

export default function Index({ tiposContrato }) {
    const [buscar, setBuscar] = useState('');
    const [listaTipos, setListaTipos] = useState(tiposContrato.data || []);
    const [totalRegistros, setTotalRegistros] = useState(tiposContrato.total || 0);
    const [buscando, setBuscando] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [itemEditar, setItemEditar] = useState(null);

    // Sincronizar estado cuando Inertia recargue las props (al crear/editar/eliminar)
    useEffect(() => {
        setListaTipos(tiposContrato.data || []);
        setTotalRegistros(tiposContrato.total || 0);
    }, [tiposContrato]);

    // Búsqueda AJAX silenciosa con Axios
    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setBuscando(true);

        try {
            const res = await axios.get(route('tipos-contrato.index'), {
                params: { 
                    buscar: buscar.trim(),
                    ajax_search: 1 // 👈 Identificador para que el controlador devuelva respuesta JSON
                }
            });

            if (res.data.data) {
                setListaTipos(res.data.data);
                setTotalRegistros(res.data.total);
            } else if (Array.isArray(res.data)) {
                setListaTipos(res.data);
                setTotalRegistros(res.data.length);
            }
        } catch (error) {
            console.error('Error al realizar la búsqueda:', error);
        } finally {
            setBuscando(false);
        }
    };

    const handleOpenCrear = () => {
        setItemEditar(null);
        setShowModal(true);
    };

    const handleOpenEditar = (item) => {
        setItemEditar(item);
        setShowModal(true);
    };

    const handleEliminar = (id) => {
        Swal.fire({
            title: '¿Confirmar eliminación?',
            text: 'Esta acción eliminará el tipo de contrato seleccionado.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(`/tipos-contrato/${id}`, {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire({
                            title: '¡Eliminado!',
                            text: 'El tipo de contrato fue eliminado con éxito.',
                            icon: 'success',
                            confirmButtonColor: '#315d7a',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                    onError: (errors) => {
                        Swal.fire({
                            title: 'No se puede eliminar',
                            text: errors.error || 'Ocurrió un inconveniente al intentar eliminar este registro.',
                            icon: 'error',
                            confirmButtonColor: '#315d7a',
                        });
                    },
                });
            }
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h1 className="text-2xl font-bold text-slate-900">
                    Modalidades de Contratación
                </h1>
            }
        >
            <Head title="Tipos de Contrato - Bolsa Laboral" />

            <div className="w-full space-y-6">
                {/* BLOQUE DE BÚSQUEDA Y NUEVO REGISTRO */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        {/* BUSCADOR AJAX */}
                        <div className="w-full md:max-w-lg">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Buscar Modalidad
                            </label>
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <input
                                    type="text"
                                    value={buscar}
                                    onChange={(e) => setBuscar(e.target.value)}
                                    placeholder="Ej. Prácticas Preprofesionales, Tiempo Completo..."
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                />
                                <button
                                    type="submit"
                                    disabled={buscando}
                                    className="rounded-lg bg-[#315d7a] px-4 py-2 text-xs font-semibold text-white shadow hover:bg-[#274b63] transition disabled:opacity-50"
                                >
                                    {buscando ? 'Buscando...' : 'Buscar'}
                                </button>
                            </form>
                        </div>

                        {/* BOTÓN REGISTRAR */}
                        <div>
                            <button
                                onClick={handleOpenCrear}
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 transition"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Nuevo Tipo de Contrato
                            </button>
                        </div>
                    </div>
                </div>

                {/* TABLA DE TIPOS DE CONTRATO */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                    <div className="border-b pb-3 flex justify-between items-center">
                        <h2 className="text-base font-bold text-slate-800">
                            Catálogo de Modalidades de Contratación
                        </h2>
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-semibold border border-slate-200">
                            Total: {totalRegistros}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-50 text-xs font-bold text-slate-600 uppercase border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Modalidad / Descripción</th>
                                    <th className="px-4 py-3 text-center">Estado</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {listaTipos.length > 0 ? (
                                    listaTipos.map((item) => (
                                        <tr key={item.id_tipo_contrato} className="hover:bg-slate-50/80 transition">
                                            <td className="px-4 py-3 font-semibold text-slate-800">
                                                {item.nombre_tipo_contrato}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                                                    item.estado === 'Activo' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                                }`}>
                                                    {item.estado}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right space-x-2">
                                                <button
                                                    onClick={() => handleOpenEditar(item)}
                                                    className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleEliminar(item.id_tipo_contrato)}
                                                    className="rounded border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                                                >
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="px-4 py-8 text-center text-slate-400 text-xs">
                                            No se encontraron modalidades de contrato registradas.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL CREAR / EDITAR */}
            {showModal && (
                <ModalFormTipoContrato
                    tipoContrato={itemEditar}
                    onClose={() => setShowModal(false)}
                />
            )}
        </AuthenticatedLayout>
    );
}