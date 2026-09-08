import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import { Head, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useEffect, useRef, useState } from 'react';

const SITUACIONES_CONFIG = {
    Operativo: { label: 'Operativo', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    En_Mantenimiento: { label: 'En Mantenimiento', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    Inoperativo: { label: 'Inoperativo', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    De_Baja: { label: 'De Baja', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const ESTADOS_CONSERVACION_CONFIG = {
    Nuevo: 'bg-blue-50 text-blue-700 border-blue-200',
    Bueno: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Regular: 'bg-amber-50 text-amber-700 border-amber-200',
    Malo: 'bg-orange-50 text-orange-700 border-orange-200',
    Chatarra: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function Index({
    bienes: bienesIniciales,
    categorias = [],
    aulas = [],
    areas = [],
    personal = [],
    situaciones = [],
    estadosConservacion = [],
    filtros: filtrosIniciales,
}) {
    const { flash } = usePage().props;

    const [bienes, setBienes] = useState(bienesIniciales);
    const [buscar, setBuscar] = useState(filtrosIniciales?.buscar || '');
    const [categoriaId, setCategoriaId] = useState(filtrosIniciales?.categoria_id || '');
    const [situacion, setSituacion] = useState(filtrosIniciales?.situacion || '');
    const [estadoConservacion, setEstadoConservacion] = useState(filtrosIniciales?.estado_conservacion || '');
    const [aulaId, setAulaId] = useState(filtrosIniciales?.aula_id || '');
    const [areaId, setAreaId] = useState(filtrosIniciales?.area_id || '');
    const [cargando, setCargando] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [bienEnEdicion, setBienEnEdicion] = useState(null);

    const primeraCarga = useRef(true);
    const abortControllerRef = useRef(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        codigo_patrimonial: '',
        categoria_id: '',
        denominacion: '',
        marca: '',
        modelo: '',
        serie: '',
        color: '',
        dimensiones: '',
        estado_conservacion: 'Bueno',
        situacion: 'Operativo',
        valor_adquisicion: '',
        fecha_adquisicion: '',
        aula_id: '',
        area_id: '',
        responsable_personal_id: '',
        foto: null,
        observaciones: '',
    });

    useEffect(() => {
        if (flash?.success) {
            Swal.fire({
                icon: 'success',
                title: 'Operación completada',
                text: flash.success,
                timer: 2000,
                showConfirmButton: false,
            });
        }
        if (flash?.error) {
            Swal.fire({
                icon: 'error',
                title: 'No se pudo completar',
                text: flash.error,
            });
        }
    }, [flash]);

    // Filtrado AJAX asíncrono
    const filtrarBienes = async (page = 1) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        setCargando(true);

        try {
            const response = await axios.post(
                route('patrimonio-bienes.filtrar'),
                {
                    buscar: buscar.trim() || null,
                    categoria_id: categoriaId || null,
                    situacion: situacion || null,
                    estado_conservacion: estadoConservacion || null,
                    aula_id: aulaId || null,
                    area_id: areaId || null,
                    page,
                },
                {
                    signal: controller.signal,
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                }
            );

            setBienes(response.data.bienes);
        } catch (error) {
            if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
                return;
            }
            Swal.fire({
                icon: 'error',
                title: 'Error al filtrar',
                text: error.response?.data?.message || 'No se pudieron consultar los bienes.',
            });
        } finally {
            if (abortControllerRef.current === controller) {
                setCargando(false);
            }
        }
    };

    useEffect(() => {
        if (primeraCarga.current) {
            primeraCarga.current = false;
            return;
        }

        const timer = setTimeout(() => {
            filtrarBienes(1);
        }, 350);

        return () => clearTimeout(timer);
    }, [buscar, categoriaId, situacion, estadoConservacion, aulaId, areaId]);

    const abrirModalCrear = () => {
        setBienEnEdicion(null);
        reset();
        clearErrors();
        setData({
            codigo_patrimonial: '',
            categoria_id: categorias[0]?.id || '',
            denominacion: '',
            marca: '',
            modelo: '',
            serie: '',
            color: '',
            dimensiones: '',
            estado_conservacion: 'Bueno',
            situacion: 'Operativo',
            valor_adquisicion: '',
            fecha_adquisicion: '',
            aula_id: '',
            area_id: '',
            responsable_personal_id: '',
            foto: null,
            observaciones: '',
        });
        setModalOpen(true);
    };

    const abrirModalEditar = (bien) => {
        setBienEnEdicion(bien);
        clearErrors();
        setData({
            codigo_patrimonial: bien.codigo_patrimonial || '',
            categoria_id: bien.categoria_id || '',
            denominacion: bien.denominacion || '',
            marca: bien.marca || '',
            modelo: bien.modelo || '',
            serie: bien.serie || '',
            color: bien.color || '',
            dimensiones: bien.dimensiones || '',
            estado_conservacion: bien.estado_conservacion || 'Bueno',
            situacion: bien.situacion || 'Operativo',
            valor_adquisicion: bien.valor_adquisicion || '',
            fecha_adquisicion: bien.fecha_adquisicion || '',
            aula_id: bien.aula_id || '',
            area_id: bien.area_id || '',
            responsable_personal_id: bien.responsable_personal_id || '',
            foto: null,
            observaciones: bien.observaciones || '',
        });
        setModalOpen(true);
    };

    const cerrarModal = () => {
        setModalOpen(false);
        setBienEnEdicion(null);
        reset();
        clearErrors();
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (bienEnEdicion) {
            post(route('patrimonio-bienes.update', bienEnEdicion.id), {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    cerrarModal();
                    filtrarBienes(bienes.current_page ?? 1);
                },
            });
        } else {
            post(route('patrimonio-bienes.store'), {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    cerrarModal();
                    filtrarBienes(1);
                },
            });
        }
    };

    const eliminarBien = async (bien) => {
        const result = await Swal.fire({
            title: '¿Eliminar bien patrimonial?',
            text: `Se desincorporará permanentemente "${bien.denominacion}" (${bien.codigo_patrimonial}).`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        });

        if (!result.isConfirmed) return;

        axios.delete(route('patrimonio-bienes.destroy', bien.id))
            .then(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'Eliminado',
                    text: 'Bien eliminado del inventario.',
                    timer: 1500,
                    showConfirmButton: false,
                });
                filtrarBienes(bienes.current_page ?? 1);
            })
            .catch((err) => {
                Swal.fire('Error', err.response?.data?.message || 'No se pudo eliminar.', 'error');
            });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inventario de Bienes Patrimoniales</h1>
                        <p className="text-xs text-slate-500">Control físico, técnico, ubicaciones y asignaciones de activos.</p>
                    </div>
                    <button
                        type="button"
                        onClick={abrirModalCrear}
                        className="rounded-xl bg-[#315d7a] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#274b63] shadow-xs cursor-pointer"
                    >
                        + Nuevo Activo
                    </button>
                </div>
            }
        >
            <Head title="Inventario de Patrimonio" />

            <div className="space-y-5">
                {/* BARRA DE FILTROS */}
                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:grid-cols-6">
                    <input
                        type="search"
                        value={buscar}
                        onChange={(e) => setBuscar(e.target.value)}
                        placeholder="Buscar por código, serie, marca o nombre..."
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs md:col-span-2 outline-none focus:border-[#315d7a]"
                    />

                    <select
                        value={categoriaId}
                        onChange={(e) => setCategoriaId(e.target.value)}
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-[#315d7a]"
                    >
                        <option value="">Todas las categorías</option>
                        {categorias.map((c) => (
                            <option key={c.id} value={c.id}>[{c.codigo}] {c.nombre}</option>
                        ))}
                    </select>

                    <select
                        value={situacion}
                        onChange={(e) => setSituacion(e.target.value)}
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-[#315d7a]"
                    >
                        <option value="">Todas las situaciones</option>
                        {situaciones.map((s) => (
                            <option key={s} value={s}>{SITUACIONES_CONFIG[s]?.label || s}</option>
                        ))}
                    </select>

                    <select
                        value={estadoConservacion}
                        onChange={(e) => setEstadoConservacion(e.target.value)}
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-[#315d7a]"
                    >
                        <option value="">Cualquier estado</option>
                        {estadosConservacion.map((ec) => (
                            <option key={ec} value={ec}>{ec}</option>
                        ))}
                    </select>

                    <div className="flex items-center gap-2">
                        <select
                            value={aulaId}
                            onChange={(e) => {
                                setAulaId(e.target.value);
                                if (e.target.value) setAreaId('');
                            }}
                            className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-[#315d7a] w-full"
                        >
                            <option value="">Ubicación: Aulas</option>
                            {aulas.map((a) => (
                                <option key={a.id} value={a.id}>{a.nombre} {a.pabellon ? `(${a.pabellon.nombre})` : ''}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => {
                                setBuscar('');
                                setCategoriaId('');
                                setSituacion('');
                                setEstadoConservacion('');
                                setAulaId('');
                                setAreaId('');
                            }}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                        >
                            Limpiar
                        </button>
                    </div>
                </div>

                {/* TABLA DE BIENES */}
                <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition ${cargando ? 'opacity-60 pointer-events-none' : ''}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-4 w-12 text-center">#</th>
                                    <th className="py-3 px-4 min-w-[220px]">Activo / Código</th>
                                    <th className="py-3 px-4 min-w-[180px]">Familia y Detalles</th>
                                    <th className="py-3 px-4 min-w-[180px]">Ubicación y Custodio</th>
                                    <th className="py-3 px-4 text-center w-28">Estado</th>
                                    <th className="py-3 px-4 text-center w-32">Situación</th>
                                    <th className="py-3 px-4 text-right min-w-[130px]">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {bienes?.data?.length > 0 ? (
                                    bienes.data.map((bien, idx) => {
                                        const configSit = SITUACIONES_CONFIG[bien.situacion] || { label: bien.situacion, bg: 'bg-slate-100' };
                                        const bgConserv = ESTADOS_CONSERVACION_CONFIG[bien.estado_conservacion] || 'bg-slate-100';

                                        return (
                                            <tr key={bien.id} className="hover:bg-slate-50 transition">
                                                <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                                                    {(bienes.current_page - 1) * bienes.per_page + idx + 1}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-3">
                                                        {bien.foto ? (
                                                            <img
                                                                src={`/storage/${bien.foto}`}
                                                                alt={bien.denominacion}
                                                                className="h-10 w-10 rounded-lg object-cover border border-slate-200 shadow-2xs flex-shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold border border-slate-200 text-xs flex-shrink-0">
                                                                📦
                                                            </div>
                                                        )}
                                                        <div>
                                                            <span className="font-mono font-bold text-[#315d7a] block">
                                                                {bien.codigo_patrimonial}
                                                            </span>
                                                            <span className="font-bold text-slate-900 leading-snug block line-clamp-1">
                                                                {bien.denominacion}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-semibold text-slate-800 text-[11px] block">
                                                        📁 {bien.categoria?.nombre}
                                                    </span>
                                                    <div className="text-[10px] text-slate-500 font-mono pt-0.5">
                                                        <span>M: {bien.marca || 'N/D'}</span>
                                                        {bien.modelo && <span> • Mod: {bien.modelo}</span>}
                                                        {bien.serie && <span> • S/N: {bien.serie}</span>}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {bien.aula ? (
                                                        <span className="font-semibold text-slate-800 text-[11px] block">
                                                            🏫 Aula: {bien.aula.nombre} {bien.aula.pabellon ? `[${bien.aula.pabellon.nombre}]` : ''}
                                                        </span>
                                                    ) : bien.area ? (
                                                        <span className="font-semibold text-slate-800 text-[11px] block">
                                                            🏢 Área: {bien.area.nombre}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 italic text-[11px] block">Sin ubicación fija</span>
                                                    )}
                                                    {bien.responsable && (
                                                        <span className="text-[10px] text-slate-500 font-medium block">
                                                            👤 {bien.responsable.nombre} {bien.responsable.apellido}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${bgConserv}`}>
                                                        {bien.estado_conservacion}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${configSit.bg}`}>
                                                        {configSit.label}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => abrirModalEditar(bien)}
                                                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => eliminarBien(bien)}
                                                            className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400 text-xs italic">
                                            No se encontraron bienes registrados en el inventario patrimonial.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* PAGINACIÓN */}
                {bienes?.links?.length > 3 && (
                    <div className="flex flex-wrap justify-end gap-1">
                        {bienes.links.map((link, index) => (
                            <button
                                key={index}
                                type="button"
                                disabled={!link.url || cargando}
                                onClick={() => {
                                    const pageNum = new URL(link.url).searchParams.get('page') || 1;
                                    filtrarBienes(Number(pageNum));
                                }}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                                    link.active
                                        ? 'border-[#315d7a] bg-[#315d7a] text-white'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                } ${!link.url ? 'opacity-30 cursor-not-allowed' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL CREAR / EDITAR BIEN */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    {bienEnEdicion ? 'Editar Activo Patrimonial' : 'Incorporar Nuevo Activo al Inventario'}
                                </h3>
                                <p className="text-xs text-slate-500">Datos técnicos, clasificación física y custodio responsable.</p>
                            </div>
                            <button
                                type="button"
                                onClick={cerrarModal}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Código Patrimonial (Opcional - Autogenerable)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.codigo_patrimonial}
                                        onChange={(e) => setData('codigo_patrimonial', e.target.value.toUpperCase())}
                                        placeholder="Ej. PAT-2026-000123"
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 font-mono font-bold uppercase outline-none focus:border-[#315d7a]"
                                    />
                                    <InputError message={errors.codigo_patrimonial} className="mt-1" />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Familia / Categoría <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.categoria_id}
                                        onChange={(e) => setData('categoria_id', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                    >
                                        <option value="">-- Seleccionar Categoría --</option>
                                        {categorias.map((c) => (
                                            <option key={c.id} value={c.id}>[{c.codigo}] {c.nombre}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.categoria_id} className="mt-1" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Denominación / Descripción del Bien <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.denominacion}
                                    onChange={(e) => setData('denominacion', e.target.value)}
                                    placeholder="Ej. Laptop Dell Inspiron 15 / Escritorio de Madera 3 Cajones"
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                />
                                <InputError message={errors.denominacion} className="mt-1" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Marca</label>
                                    <input
                                        type="text"
                                        value={data.marca}
                                        onChange={(e) => setData('marca', e.target.value)}
                                        placeholder="Ej. Lenovo / HP"
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Modelo</label>
                                    <input
                                        type="text"
                                        value={data.modelo}
                                        onChange={(e) => setData('modelo', e.target.value)}
                                        placeholder="Ej. ThinkPad E14"
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">N° de Serie</label>
                                    <input
                                        type="text"
                                        value={data.serie}
                                        onChange={(e) => setData('serie', e.target.value)}
                                        placeholder="Ej. SN893247923"
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 font-mono outline-none focus:border-[#315d7a]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Color</label>
                                    <input
                                        type="text"
                                        value={data.color}
                                        onChange={(e) => setData('color', e.target.value)}
                                        placeholder="Ej. Negro / Gris"
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Conservación <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.estado_conservacion}
                                        onChange={(e) => setData('estado_conservacion', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 font-bold outline-none focus:border-[#315d7a]"
                                    >
                                        {estadosConservacion.map((ec) => (
                                            <option key={ec} value={ec}>{ec}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Situación <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.situacion}
                                        onChange={(e) => setData('situacion', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 font-bold outline-none focus:border-[#315d7a]"
                                    >
                                        {situaciones.map((s) => (
                                            <option key={s} value={s}>{SITUACIONES_CONFIG[s]?.label || s}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Valor Adquisición (S/)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.valor_adquisicion}
                                        onChange={(e) => setData('valor_adquisicion', e.target.value)}
                                        placeholder="0.00"
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 font-mono outline-none focus:border-[#315d7a]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha Adquisición</label>
                                    <input
                                        type="date"
                                        value={data.fecha_adquisicion}
                                        onChange={(e) => setData('fecha_adquisicion', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                    />
                                </div>
                            </div>

                            {/* UBICACIÓN Y RESPONSABLE */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 border-t border-slate-100 pt-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Asignar a Aula (Docencia)
                                    </label>
                                    <select
                                        value={data.aula_id}
                                        onChange={(e) => {
                                            setData('aula_id', e.target.value);
                                            if (e.target.value) setData('area_id', '');
                                        }}
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                    >
                                        <option value="">-- Ninguna --</option>
                                        {aulas.map((a) => (
                                            <option key={a.id} value={a.id}>{a.nombre} {a.pabellon ? `(${a.pabellon.nombre})` : ''}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Asignar a Área Administrativa
                                    </label>
                                    <select
                                        value={data.area_id}
                                        onChange={(e) => {
                                            setData('area_id', e.target.value);
                                            if (e.target.value) setData('aula_id', '');
                                        }}
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                    >
                                        <option value="">-- Ninguna --</option>
                                        {areas.map((ar) => (
                                            <option key={ar.id} value={ar.id}>{ar.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Custodio / Responsable
                                    </label>
                                    <select
                                        value={data.responsable_personal_id}
                                        onChange={(e) => setData('responsable_personal_id', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                    >
                                        <option value="">-- Sin asignar --</option>
                                        {personal.map((p) => (
                                            <option key={p.id} value={p.id}>{p.apellido}, {p.nombre} (DNI: {p.dni})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Fotografía del Activo (JPG, PNG, WebP - Máx. 5MB)
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setData('foto', e.target.files[0])}
                                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-800 file:mr-3 file:rounded-lg file:border-0 file:bg-[#315d7a] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-[#274b63] cursor-pointer"
                                    />
                                    <InputError message={errors.foto} className="mt-1" />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Observaciones Técnicas / Accesorios
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={data.observaciones}
                                        onChange={(e) => setData('observaciones', e.target.value)}
                                        placeholder="Cargador, cable HDMI, detalles estéticos..."
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={cerrarModal}
                                    disabled={processing}
                                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-xl bg-[#315d7a] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#274b63] disabled:opacity-50 shadow-xs cursor-pointer"
                                >
                                    {processing ? 'Guardando...' : bienEnEdicion ? 'Actualizar Activo' : 'Incorporar Activo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}