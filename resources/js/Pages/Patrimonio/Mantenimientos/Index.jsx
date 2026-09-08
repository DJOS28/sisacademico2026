import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import { Head, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useEffect, useRef, useState } from 'react';

const ESTADOS_CONFIG = {
    En_Proceso: { label: 'En Proceso', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    Finalizado: { label: 'Finalizado', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    Irreparable: { label: 'Irreparable', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export default function Index({
    mantenimientos: mantenimientosIniciales,
    bienes = [],
    tipos = [],
    estados = [],
    filtros: filtrosIniciales,
}) {
    const { flash } = usePage().props;

    const [mantenimientos, setMantenimientos] = useState(mantenimientosIniciales);
    const [buscar, setBuscar] = useState(filtrosIniciales?.buscar || '');
    const [tipo, setTipo] = useState(filtrosIniciales?.tipo || '');
    const [estado, setEstado] = useState(filtrosIniciales?.estado || '');
    const [bienId, setBienId] = useState(filtrosIniciales?.bien_id || '');
    const [fechaInicio, setFechaInicio] = useState(filtrosIniciales?.fecha_inicio || '');
    const [fechaFin, setFechaFin] = useState(filtrosIniciales?.fecha_fin || '');
    const [cargando, setCargando] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [mantenimientoEnEdicion, setMantenimientoEnEdicion] = useState(null);

    const primeraCarga = useRef(true);
    const abortControllerRef = useRef(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        bien_id: '',
        tipo: 'Correctivo',
        diagnostico: '',
        acciones_realizadas: '',
        costo: '',
        proveedor_tecnico: '',
        fecha_ingreso: new Date().toISOString().split('T')[0],
        fecha_salida: '',
        estado: 'En_Proceso',
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

    const filtrarMantenimientos = async (page = 1) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        setCargando(true);

        try {
            const response = await axios.post(
                route('patrimonio-mantenimientos.filtrar'),
                {
                    buscar: buscar.trim() || null,
                    tipo: tipo || null,
                    estado: estado || null,
                    bien_id: bienId || null,
                    fecha_inicio: fechaInicio || null,
                    fecha_fin: fechaFin || null,
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

            setMantenimientos(response.data.mantenimientos);
        } catch (error) {
            if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
                return;
            }
            Swal.fire({
                icon: 'error',
                title: 'Error al filtrar',
                text: error.response?.data?.message || 'No se pudieron consultar los mantenimientos.',
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
            filtrarMantenimientos(1);
        }, 350);

        return () => clearTimeout(timer);
    }, [buscar, tipo, estado, bienId, fechaInicio, fechaFin]);

    const abrirModalCrear = () => {
        setMantenimientoEnEdicion(null);
        reset();
        clearErrors();
        setData({
            bien_id: '',
            tipo: 'Correctivo',
            diagnostico: '',
            acciones_realizadas: '',
            costo: '',
            proveedor_tecnico: '',
            fecha_ingreso: new Date().toISOString().split('T')[0],
            fecha_salida: '',
            estado: 'En_Proceso',
        });
        setModalOpen(true);
    };

    const abrirModalEditar = (mant) => {
        setMantenimientoEnEdicion(mant);
        clearErrors();
        setData({
            bien_id: mant.bien_id || '',
            tipo: mant.tipo || 'Correctivo',
            diagnostico: mant.diagnostico || '',
            acciones_realizadas: mant.acciones_realizadas || '',
            costo: mant.costo || '',
            proveedor_tecnico: mant.proveedor_tecnico || '',
            fecha_ingreso: mant.fecha_ingreso || '',
            fecha_salida: mant.fecha_salida || '',
            estado: mant.estado || 'En_Proceso',
        });
        setModalOpen(true);
    };

    const cerrarModal = () => {
        setModalOpen(false);
        setMantenimientoEnEdicion(null);
        reset();
        clearErrors();
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (mantenimientoEnEdicion) {
            put(route('patrimonio-mantenimientos.update', mantenimientoEnEdicion.id), {
                preserveScroll: true,
                onSuccess: () => {
                    cerrarModal();
                    filtrarMantenimientos(mantenimientos.current_page ?? 1);
                },
            });
        } else {
            post(route('patrimonio-mantenimientos.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    cerrarModal();
                    filtrarMantenimientos(1);
                },
            });
        }
    };

    const eliminarMantenimiento = async (mant) => {
        const result = await Swal.fire({
            title: '¿Eliminar orden de mantenimiento?',
            text: 'Se removerá este registro del historial técnico.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        });

        if (!result.isConfirmed) return;

        axios.delete(route('patrimonio-mantenimientos.destroy', mant.id))
            .then(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'Eliminado',
                    text: 'Orden eliminada con éxito.',
                    timer: 1500,
                    showConfirmButton: false,
                });
                filtrarMantenimientos(mantenimientos.current_page ?? 1);
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
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Mantenimiento y Servicio Técnico</h1>
                        <p className="text-xs text-slate-500">Control preventivo, correctivo y reparaciones de bienes patrimoniales.</p>
                    </div>
                    <button
                        type="button"
                        onClick={abrirModalCrear}
                        className="rounded-xl bg-[#315d7a] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#274b63] shadow-xs cursor-pointer"
                    >
                        + Nueva Orden Técnica
                    </button>
                </div>
            }
        >
            <Head title="Mantenimientos de Patrimonio" />

            <div className="space-y-5">
                {/* FILTROS */}
                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:grid-cols-6">
                    <input
                        type="search"
                        value={buscar}
                        onChange={(e) => setBuscar(e.target.value)}
                        placeholder="Buscar por falla, técnico o bien..."
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs md:col-span-2 outline-none focus:border-[#315d7a]"
                    />

                    <select
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-[#315d7a]"
                    >
                        <option value="">Todos los tipos</option>
                        {tipos.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>

                    <select
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-[#315d7a]"
                    >
                        <option value="">Todos los estados</option>
                        {estados.map((est) => (
                            <option key={est} value={est}>{ESTADOS_CONFIG[est]?.label || est}</option>
                        ))}
                    </select>

                    <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        title="Desde fecha de ingreso"
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-[#315d7a]"
                    />

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setBuscar('');
                                setTipo('');
                                setEstado('');
                                setBienId('');
                                setFechaInicio('');
                                setFechaFin('');
                            }}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer w-full"
                        >
                            Limpiar
                        </button>
                        {cargando && <span className="text-[11px] font-medium text-[#315d7a]">Buscando...</span>}
                    </div>
                </div>

                {/* TABLA DE MANTENIMIENTOS */}
                <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition ${cargando ? 'opacity-60 pointer-events-none' : ''}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-4 w-12 text-center">#</th>
                                    <th className="py-3 px-4 min-w-[200px]">Activo / Código</th>
                                    <th className="py-3 px-4 text-center w-28">Tipo</th>
                                    <th className="py-3 px-4 min-w-[220px]">Diagnóstico y Acciones</th>
                                    <th className="py-3 px-4 text-center min-w-[140px]">Fechas (Ing./Sal.)</th>
                                    <th className="py-3 px-4 min-w-[150px]">Costo y Proveedor</th>
                                    <th className="py-3 px-4 text-center w-28">Estado</th>
                                    <th className="py-3 px-4 text-right min-w-[120px]">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {mantenimientos?.data?.length > 0 ? (
                                    mantenimientos.data.map((mant, idx) => {
                                        const configEstado = ESTADOS_CONFIG[mant.estado] || { label: mant.estado, bg: 'bg-slate-100' };

                                        return (
                                            <tr key={mant.id} className="hover:bg-slate-50 transition">
                                                <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                                                    {(mantenimientos.current_page - 1) * mantenimientos.per_page + idx + 1}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-mono font-bold text-[#315d7a] block">
                                                        {mant.bien?.codigo_patrimonial}
                                                    </span>
                                                    <span className="font-bold text-slate-900 leading-snug block line-clamp-1">
                                                        {mant.bien?.denominacion}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                        mant.tipo === 'Preventivo'
                                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                            : 'bg-orange-50 text-orange-700 border-orange-200'
                                                    }`}>
                                                        {mant.tipo}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <strong className="text-slate-800 block text-[11px]">
                                                        {mant.diagnostico}
                                                    </strong>
                                                    {mant.acciones_realizadas && (
                                                        <span className="text-[10px] text-slate-500 block line-clamp-1">
                                                            {mant.acciones_realizadas}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-center font-mono text-[11px]">
                                                    <span className="text-slate-800 block font-semibold">
                                                        Ing: {mant.fecha_ingreso}
                                                    </span>
                                                    <span className="text-slate-500 text-[10px] block">
                                                        Sal: {mant.fecha_salida || 'Pendiente'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-bold text-slate-900 font-mono text-[11px] block">
                                                        S/ {Number(mant.costo || 0).toFixed(2)}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 block truncate max-w-[150px]">
                                                        {mant.proveedor_tecnico || 'Taller Interno'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${configEstado.bg}`}>
                                                        {configEstado.label}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => abrirModalEditar(mant)}
                                                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => eliminarMantenimiento(mant)}
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
                                        <td colSpan={8} className="py-12 text-center text-slate-400 text-xs italic">
                                            No se encontraron órdenes de mantenimiento registradas.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* PAGINACIÓN */}
                {mantenimientos?.links?.length > 3 && (
                    <div className="flex flex-wrap justify-end gap-1">
                        {mantenimientos.links.map((link, index) => (
                            <button
                                key={index}
                                type="button"
                                disabled={!link.url || cargando}
                                onClick={() => {
                                    const pageNum = new URL(link.url).searchParams.get('page') || 1;
                                    filtrarMantenimientos(Number(pageNum));
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

            {/* MODAL CREAR / EDITAR MANTENIMIENTO */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    {mantenimientoEnEdicion ? 'Editar Orden de Mantenimiento' : 'Nueva Orden de Mantenimiento'}
                                </h3>
                                <p className="text-xs text-slate-500">Registro de fallas, servicio técnico y actualización operativa.</p>
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
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Bien Patrimonial a Intervenir <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.bien_id}
                                    onChange={(e) => setData('bien_id', e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                >
                                    <option value="">-- Seleccione el activo --</option>
                                    {bienes.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            [{b.codigo_patrimonial}] {b.denominacion}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.bien_id} className="mt-1" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Tipo de Mantenimiento <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.tipo}
                                        onChange={(e) => setData('tipo', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#315d7a]"
                                    >
                                        <option value="Correctivo">Correctivo (Reparación de Avería)</option>
                                        <option value="Preventivo">Preventivo (Limpieza / Calibración)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Estado de la Orden <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.estado}
                                        onChange={(e) => setData('estado', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#315d7a]"
                                    >
                                        <option value="En_Proceso">⏳ En Proceso (Activo en Mantenimiento)</option>
                                        <option value="Finalizado">✅ Finalizado (Activo Operativo)</option>
                                        <option value="Irreparable">❌ Irreparable (Activo Inoperativo)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Diagnóstico Técnico / Falla Detectada <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={2}
                                    value={data.diagnostico}
                                    onChange={(e) => setData('diagnostico', e.target.value)}
                                    placeholder="Descripción de la falla reportada o motivo de ingreso al taller..."
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                />
                                <InputError message={errors.diagnostico} className="mt-1" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Acciones Realizadas / Repuestos Utilizados
                                </label>
                                <textarea
                                    rows={2}
                                    value={data.acciones_realizadas}
                                    onChange={(e) => setData('acciones_realizadas', e.target.value)}
                                    placeholder="Detalles del trabajo técnico efectuado, cambio de piezas, formateo, etc."
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Fecha de Ingreso <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={data.fecha_ingreso}
                                        onChange={(e) => setData('fecha_ingreso', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                    />
                                    <InputError message={errors.fecha_ingreso} className="mt-1" />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Fecha de Salida / Conclusión
                                    </label>
                                    <input
                                        type="date"
                                        value={data.fecha_salida}
                                        onChange={(e) => setData('fecha_salida', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                    />
                                    <InputError message={errors.fecha_salida} className="mt-1" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Costo del Servicio / Repuestos (S/)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.costo}
                                        onChange={(e) => setData('costo', e.target.value)}
                                        placeholder="0.00"
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 font-mono outline-none focus:border-[#315d7a]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Proveedor Técnico / Especialista
                                    </label>
                                    <input
                                        type="text"
                                        value={data.proveedor_tecnico}
                                        onChange={(e) => setData('proveedor_tecnico', e.target.value)}
                                        placeholder="Ej. Soporte TI Interno / Tech Solutions S.A.C."
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
                                    {processing ? 'Guardando...' : mantenimientoEnEdicion ? 'Actualizar Orden' : 'Guardar Orden'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}