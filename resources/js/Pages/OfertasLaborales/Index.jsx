import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function Index({ ofertas, empresas = [], tiposContrato = [], filters = {} }) {
    const initialStateFilters = {
        buscar: filters.buscar || '',
        empresa_id: filters.empresa_id || '',
        tipo_contrato_id: filters.tipo_contrato_id || '',
        modalidad: filters.modalidad || '',
        estado: filters.estado || '',
    };

    const [formFilters, setFormFilters] = useState(initialStateFilters);
    const [listaOfertas, setListaOfertas] = useState(ofertas.data || []);
    const [totalRegistros, setTotalRegistros] = useState(ofertas.total || 0);
    const [buscando, setBuscando] = useState(false);

    useEffect(() => {
        setListaOfertas(ofertas.data || []);
        setTotalRegistros(ofertas.total || 0);
    }, [ofertas]);

    const handleFilterChange = (key, value) => {
        setFormFilters((prev) => ({ ...prev, [key]: value }));
    };

    // Función auxiliar para formatear fechas a YYYY-MM-DD
    const formatDate = (dateString) => {
        if (!dateString) return '---';
        return dateString.split('T')[0].split(' ')[0];
    };

    // Búsqueda AJAX silenciosa con Axios
    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setBuscando(true);

        try {
            const res = await axios.get(route('ofertas-laborales.index'), {
                params: {
                    ...formFilters,
                    ajax_search: 1,
                },
            });

            if (res.data.data) {
                setListaOfertas(res.data.data);
                setTotalRegistros(res.data.total);
            }
        } catch (error) {
            console.error('Error al filtrar ofertas:', error);
        } finally {
            setBuscando(false);
        }
    };

    // Resetear Filtros y recargar lista completa por AJAX
    const handleLimpiarFiltros = async () => {
        const resetFilters = {
            buscar: '',
            empresa_id: '',
            tipo_contrato_id: '',
            modalidad: '',
            estado: '',
        };
        setFormFilters(resetFilters);
        setBuscando(true);

        try {
            const res = await axios.get(route('ofertas-laborales.index'), {
                params: { ajax_search: 1 },
            });

            if (res.data.data) {
                setListaOfertas(res.data.data);
                setTotalRegistros(res.data.total);
            }
        } catch (error) {
            console.error('Error al resetear filtros:', error);
        } finally {
            setBuscando(false);
        }
    };

    const handleEliminar = (id) => {
        Swal.fire({
            title: '¿Confirmar eliminación?',
            text: 'Esta acción eliminará la oferta laboral seleccionada.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(`/ofertas-laborales/${id}`, {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire({
                            title: '¡Eliminado!',
                            text: 'La oferta laboral fue eliminada con éxito.',
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
                    Bolsa Laboral - Ofertas Empleo
                </h1>
            }
        >
            <Head title="Ofertas Laborales" />

            <div className="w-full space-y-6">
                {/* PANEL DE FILTROS AVANZADOS */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                    
                    {/* CABECERA: TÍTULO Y BOTÓN NUEVA OFERTA */}
                    <div className="flex justify-between items-center border-b pb-3">
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                            Filtros de Búsqueda
                        </h2>
                        <Link
                            href={route('ofertas-laborales.create')}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-700 transition"
                        >
                            <span>+ Nueva Oferta</span>
                        </Link>
                    </div>

                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* BUSCAR */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Buscar Título / Lugar
                                </label>
                                <input
                                    type="text"
                                    value={formFilters.buscar}
                                    onChange={(e) => handleFilterChange('buscar', e.target.value)}
                                    placeholder="Ej. Desarrollador Web..."
                                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                />
                            </div>

                            {/* EMPRESA */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Empresa
                                </label>
                                <select
                                    value={formFilters.empresa_id}
                                    onChange={(e) => handleFilterChange('empresa_id', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                >
                                    <option value="">Todas las empresas</option>
                                    {empresas.map((e) => (
                                        <option key={e.id_empresa} value={e.id_empresa}>
                                            {e.nombre_empresa}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* TIPO CONTRATO */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Tipo Contrato
                                </label>
                                <select
                                    value={formFilters.tipo_contrato_id}
                                    onChange={(e) => handleFilterChange('tipo_contrato_id', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                >
                                    <option value="">Todos los tipos</option>
                                    {tiposContrato.map((t) => (
                                        <option key={t.id_tipo_contrato} value={t.id_tipo_contrato}>
                                            {t.nombre_tipo_contrato}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* MODALIDAD Y ESTADO */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Modalidad
                                    </label>
                                    <select
                                        value={formFilters.modalidad}
                                        onChange={(e) => handleFilterChange('modalidad', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                    >
                                        <option value="">Todas</option>
                                        <option value="Presencial">Presencial</option>
                                        <option value="Remoto">Remoto</option>
                                        <option value="Hibrido">Híbrido</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Estado
                                    </label>
                                    <select
                                        value={formFilters.estado}
                                        onChange={(e) => handleFilterChange('estado', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                    >
                                        <option value="">Todos</option>
                                        <option value="Publicada">Publicada</option>
                                        <option value="Borrador">Borrador</option>
                                        <option value="Cerrada">Cerrada</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* PIE DE FORMULARIO: REGISTROS Y BOTONES APLICAR/LIMPIAR FILTROS JUNTOS */}
                        <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-xs text-slate-500 font-medium">
                                Total de registros: {totalRegistros}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleLimpiarFiltros}
                                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                >
                                    Limpiar Filtros
                                </button>
                                <button
                                    type="submit"
                                    disabled={buscando}
                                    className="rounded-lg bg-[#315d7a] px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-[#274b63] transition disabled:opacity-50"
                                >
                                    {buscando ? 'Filtrando...' : 'Aplicar Filtros'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* TABLA DE OFERTAS LABORALES */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-50 text-xs font-bold text-slate-600 uppercase border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Puesto / Oferta</th>
                                    <th className="px-4 py-3">Empresa</th>
                                    <th className="px-4 py-3 text-center">Modalidad / Tipo</th>
                                    <th className="px-4 py-3 text-center">Fecha Pub.</th>
                                    <th className="px-4 py-3 text-center">Fecha Límite</th>
                                    <th className="px-4 py-3 text-center">Estado</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {listaOfertas.length > 0 ? (
                                    listaOfertas.map((of) => (
                                        <tr key={of.id_oferta} className="hover:bg-slate-50/80 transition">
                                            <td className="px-4 py-3">
                                                <div className="font-bold text-slate-800">{of.titulo}</div>
                                                <div className="text-xs text-slate-500 font-normal">
                                                    Lugar: {of.lugar || 'No especificada'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-700 font-semibold">
                                                {of.empresa?.nombre_empresa || '---'}
                                            </td>
                                            <td className="px-4 py-3 text-center text-xs">
                                                <span className="font-semibold block">{of.modalidad}</span>
                                                <span className="text-slate-400">{of.tipo_contrato?.nombre_tipo_contrato}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-xs font-medium text-slate-600">
                                                {formatDate(of.fecha_publicacion)}
                                            </td>
                                            <td className="px-4 py-3 text-center text-xs font-medium text-slate-600">
                                                {formatDate(of.fecha_limite)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                                                    of.estado === 'Publicada' ? 'bg-emerald-100 text-emerald-800' :
                                                    of.estado === 'Borrador' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                                                }`}>
                                                    {of.estado}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right space-x-2">
                                                <Link
                                                    href={route('ofertas-laborales.edit', of.id_oferta)}
                                                    className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                                                >
                                                    Editar
                                                </Link>
                                                <button
                                                    onClick={() => handleEliminar(of.id_oferta)}
                                                    className="rounded border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                                                >
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-slate-400 text-xs">
                                            No se encontraron ofertas laborales registradas.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}