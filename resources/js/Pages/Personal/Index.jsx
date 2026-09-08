import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Index({ personal: personalInicial, areas, filtros }) {
    const [listadoPersonal, setListadoPersonal] = useState(personalInicial);
    const [buscar, setBuscar] = useState(filtros.buscar ?? '');
    const [estado, setEstado] = useState(filtros.estado ?? '');
    const [areaId, setAreaId] = useState(filtros.area_id ?? '');
    const [cargando, setCargando] = useState(false);

    const isFirstRender = useRef(true);

    /**
     * Búsqueda AJAX directa al endpoint dedicado /personal/buscar.
     * Mantiene la URL http://127.0.0.1:8000/personal completamente limpia.
     */
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timer = setTimeout(async () => {
            setCargando(true);

            const params = {};
            if (buscar.trim() !== '') params.buscar = buscar.trim();
            if (estado !== '') params.estado = estado;
            if (areaId !== '') params.area_id = areaId;

            try {
                const { data } = await axios.get(route('personal.buscar'), { params });
                setListadoPersonal(data);
            } catch (error) {
                console.error('Error al filtrar personal:', error);
            } finally {
                setCargando(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [buscar, estado, areaId]);

    const limpiarFiltros = () => {
        setBuscar('');
        setEstado('');
        setAreaId('');
    };

    const cambiarEstado = async (item) => {
        const estadoActual = item.usuario?.status ?? 'Activo';
        const nuevoEstado = estadoActual === 'Activo' ? 'Inactivo' : 'Activo';

        const result = await Swal.fire({
            title: `¿Cambiar estado a "${nuevoEstado}"?`,
            text: `El colaborador ${item.nombre} ${item.apellido} pasará a estar ${nuevoEstado.toLowerCase()}.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, cambiar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#315d7a',
        });

        if (!result.isConfirmed) return;

        router.put(
            route('personal.estado', item.id),
            { status: nuevoEstado },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setListadoPersonal((prev) => ({
                        ...prev,
                        data: prev.data.map((p) =>
                            p.id === item.id
                                ? { ...p, usuario: { ...p.usuario, status: nuevoEstado } }
                                : p
                        ),
                    }));

                    Swal.fire({
                        icon: 'success',
                        title: 'Estado Actualizado',
                        text: `El usuario ahora se encuentra ${nuevoEstado}.`,
                        timer: 2000,
                        showConfirmButton: false,
                    });
                },
            }
        );
    };

    const cambiarPagina = async (url) => {
        if (!url) return;
        setCargando(true);
        try {
            const { data } = await axios.get(url);
            setListadoPersonal(data);
        } catch (error) {
            console.error('Error al cambiar de página:', error);
        } finally {
            setCargando(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Personal Registrado</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Gestión de colaboradores, asignación de áreas y roles administrativos.
                        </p>
                    </div>
                    <Link
                        href={route('personal.create')}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#274c64] transition shadow-xs"
                    >
                        <span>➕ Nuevo Personal</span>
                    </Link>
                </div>
            }
        >
            <Head title="Personal" />

            {/* BARRA DE FILTROS LIMPIA */}
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex flex-wrap items-center gap-3">
                    {/* BÚSQUEDA POR TEXTO / DNI */}
                    <div className="relative min-w-[260px] flex-1">
                        <input
                            type="text"
                            value={buscar}
                            onChange={(e) => setBuscar(e.target.value)}
                            placeholder="Buscar por DNI, nombre, puesto, correo o usuario..."
                            className="w-full rounded-lg border border-slate-300 pl-9 pr-4 py-2.5 text-sm outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1] transition"
                        />
                        <span className="absolute left-3 top-3 text-slate-400 text-xs">🔍</span>
                    </div>

                    {/* FILTRO ÁREA */}
                    <select
                        value={areaId}
                        onChange={(e) => setAreaId(e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1] bg-white transition"
                    >
                        <option value="">Todas las áreas</option>
                        {areas.map((area) => (
                            <option key={area.id} value={area.id}>
                                {area.nombre}
                            </option>
                        ))}
                    </select>

                    {/* FILTRO ESTADO */}
                    <select
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1] bg-white transition"
                    >
                        <option value="">Todos los estados</option>
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                    </select>

                    {/* BOTÓN LIMPIAR */}
                    {(buscar || estado || areaId) && (
                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                        >
                            Limpiar
                        </button>
                    )}

                    {/* SPINNER AJAX */}
                    {cargando && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#315d7a]">
                            <svg className="animate-spin h-4 w-4 text-[#315d7a]" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Filtrando...
                        </span>
                    )}
                </div>
            </div>

            {/* TABLA DE RESULTADOS */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            {['DNI', 'Nombre Completo', 'Puesto / Cargo', 'Área Principal', 'Roles Asignados', 'Estado', 'Acciones'].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {listadoPersonal.data.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition">
                                <td className="px-4 py-3.5 text-sm font-medium text-slate-700">{item.dni}</td>
                                <td className="px-4 py-3.5 text-sm font-bold text-slate-900">
                                    {item.nombre} {item.apellido}
                                    <span className="block text-[11px] font-normal text-slate-400">{item.email}</span>
                                </td>
                                <td className="px-4 py-3.5 text-sm text-slate-600">{item.puesto}</td>
                                <td className="px-4 py-3.5 text-sm font-medium text-slate-800">
                                    {item.area?.nombre ?? <span className="text-slate-400 italic">Sin área</span>}
                                </td>
                                <td className="px-4 py-3.5">
                                    <div className="flex flex-wrap gap-1">
                                        {(item.usuario?.roles ?? []).map((rol) => (
                                            <span
                                                key={rol.id}
                                                className="rounded-full bg-[#eef3f7] px-2.5 py-0.5 text-[11px] font-bold text-[#315d7a]"
                                            >
                                                {rol.nombre || rol.name}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-3.5">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                            item.usuario?.status === 'Activo'
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                                        }`}
                                    >
                                        {item.usuario?.status ?? 'Sin Cuenta'}
                                    </span>
                                </td>
                                <td className="px-4 py-3.5">
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={route('personal.edit', item.id)}
                                            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                                        >
                                            Editar
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => cambiarEstado(item)}
                                            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                        >
                                            {item.usuario?.status === 'Activo' ? 'Desactivar' : 'Activar'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* MENSAJE DE RESULTADOS VACÍOS */}
                {listadoPersonal.data.length === 0 && (
                    <div className="p-12 text-center text-sm font-semibold text-slate-500">
                        🚫 No se encontraron registros que coincidan con los criterios de búsqueda.
                    </div>
                )}
            </div>

            {/* PAGINACIÓN */}
            {listadoPersonal.links?.length > 1 && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-1">
                    {listadoPersonal.links.map((link, index) => (
                        <button
                            key={index}
                            disabled={!link.url}
                            onClick={() => cambiarPagina(link.url)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                                link.active
                                    ? 'bg-[#315d7a] text-white border-[#315d7a]'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            } disabled:opacity-40 cursor-pointer`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
        </AuthenticatedLayout>
    );
}