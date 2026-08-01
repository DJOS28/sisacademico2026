import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import ModalFormEmpresa from './ModalFormEmpresa';

export default function Index({ empresas, filters }) {
    const [buscar, setBuscar] = useState('');
    const [listaEmpresas, setListaEmpresas] = useState(empresas.data || []);
    const [totalRegistros, setTotalRegistros] = useState(empresas.total || 0);
    const [buscando, setBuscando] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [empresaEditar, setEmpresaEditar] = useState(null);

    // Sincronizar estado local al recibir actualizaciones de Inertia (Creación/Edición/Eliminación)
    useEffect(() => {
        setListaEmpresas(empresas.data || []);
        setTotalRegistros(empresas.total || 0);
    }, [empresas]);

    // Búsqueda AJAX silenciosa con Axios
    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setBuscando(true);

        try {
            const res = await axios.get(route('empresas.index'), {
                params: { 
                    buscar: buscar.trim(),
                    ajax_search: 1 // 👈 Fuerza respuesta JSON en Laravel
                }
            });

            if (res.data.data) {
                setListaEmpresas(res.data.data);
                setTotalRegistros(res.data.total);
            } else if (Array.isArray(res.data)) {
                setListaEmpresas(res.data);
                setTotalRegistros(res.data.length);
            }
        } catch (error) {
            console.error('Error al realizar la búsqueda:', error);
        } finally {
            setBuscando(false);
        }
    };

    const handleOpenCrear = () => {
        setEmpresaEditar(null);
        setShowModal(true);
    };

    const handleOpenEditar = (empresa) => {
        setEmpresaEditar(empresa);
        setShowModal(true);
    };

    const handleEliminar = (id) => {
        Swal.fire({
            title: '¿Confirmar eliminación?',
            text: 'Esta acción eliminará el registro de la empresa seleccionada.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(`/empresas/${id}`, {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire({
                            title: '¡Eliminado!',
                            text: 'La empresa fue eliminada con éxito.',
                            icon: 'success',
                            confirmButtonColor: '#315d7a',
                            timer: 2000,
                            showConfirmButton: false,
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
                    Gestión de Empresas Aliadas
                </h1>
            }
        >
            <Head title="Empresas - Bolsa Laboral" />

            <div className="w-full space-y-6">
                {/* BLOQUE DE BÚSQUEDA Y NUEVO REGISTRO */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        {/* BUSCADOR AJAX */}
                        <div className="w-full md:max-w-lg">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Buscar Empresa
                            </label>
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <input
                                    type="text"
                                    value={buscar}
                                    onChange={(e) => setBuscar(e.target.value)}
                                    placeholder="Buscar por RUC, nombre o contacto..."
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
                                Nueva Empresa
                            </button>
                        </div>
                    </div>
                </div>

                {/* TABLA DE EMPRESAS */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                    <div className="border-b pb-3 flex justify-between items-center">
                        <h2 className="text-base font-bold text-slate-800">
                            Directorio de Empresas Conveniadas
                        </h2>
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-semibold border border-slate-200">
                            Total: {totalRegistros}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-50 text-xs font-bold text-slate-600 uppercase border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Empresa / RUC</th>
                                    <th className="px-4 py-3">Contacto Principal</th>
                                    <th className="px-4 py-3">Teléfono / Correo</th>
                                    <th className="px-4 py-3 text-center">Estado</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {listaEmpresas.length > 0 ? (
                                    listaEmpresas.map((emp) => (
                                        <tr key={emp.id_empresa} className="hover:bg-slate-50/80 transition">
                                            <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-3">
                                                {emp.logo_empresa ? (
                                                    <img
                                                        src={`/storage/${emp.logo_empresa}`}
                                                        alt="Logo"
                                                        className="w-9 h-9 object-cover rounded-lg border border-slate-200"
                                                    />
                                                ) : (
                                                    <div className="w-9 h-9 bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center font-bold text-xs rounded-lg">
                                                        {emp.nombre_empresa.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="text-slate-900 font-bold">{emp.nombre_empresa}</div>
                                                    <div className="text-xs text-slate-500 font-normal">RUC: {emp.ruc || 'Sin RUC'}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-700">
                                                {emp.nombre_contacto || '---'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 text-xs">
                                                <div className="font-semibold text-slate-800">{emp.telefono_empresa || '---'}</div>
                                                <div className="text-slate-400">{emp.email_contacto || ''}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                                                    emp.estado === 'Activo' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                                }`}>
                                                    {emp.estado}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right space-x-2">
                                                <button
                                                    onClick={() => handleOpenEditar(emp)}
                                                    className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleEliminar(emp.id_empresa)}
                                                    className="rounded border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                                                >
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-slate-400 text-xs">
                                            No se encontraron empresas registradas en el sistema.
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
                <ModalFormEmpresa
                    empresa={empresaEditar}
                    onClose={() => setShowModal(false)}
                />
            )}
        </AuthenticatedLayout>
    );
}