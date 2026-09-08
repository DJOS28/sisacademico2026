import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import { Head, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useEffect, useRef, useState } from 'react';

const TIPOS_CONFIG = {
    Asignacion: { label: 'Asignación Inicial', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    Reubicacion: { label: 'Reubicación / Traslado', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
    Prestamo: { label: 'Préstamo Temporal', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    Retorno: { label: 'Retorno / Devolución', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export default function Index({
    movimientos: movimientosIniciales,
    bienes = [],
    aulas = [],
    areas = [],
    personal = [],
    tiposMovimiento = [],
    filtros: filtrosIniciales,
}) {
    const { flash } = usePage().props;

    const [movimientos, setMovimientos] = useState(movimientosIniciales);
    const [buscar, setBuscar] = useState(filtrosIniciales?.buscar || '');
    const [tipoMovimiento, setTipoMovimiento] = useState(filtrosIniciales?.tipo_movimiento || '');
    const [bienId, setBienId] = useState(filtrosIniciales?.bien_id || '');
    const [fechaInicio, setFechaInicio] = useState(filtrosIniciales?.fecha_inicio || '');
    const [fechaFin, setFechaFin] = useState(filtrosIniciales?.fecha_fin || '');
    const [cargando, setCargando] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [bienSeleccionado, setBienSeleccionado] = useState(null);

    const primeraCarga = useRef(true);
    const abortControllerRef = useRef(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        bien_id: '',
        tipo_movimiento: 'Reubicacion',
        aula_destino_id: '',
        area_destino_id: '',
        personal_destino_id: '',
        fecha_movimiento: new Date().toISOString().slice(0, 16),
        motivo: '',
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

    const filtrarMovimientos = async (page = 1) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        setCargando(true);

        try {
            const response = await axios.post(
                route('patrimonio-movimientos.filtrar'),
                {
                    buscar: buscar.trim() || null,
                    tipo_movimiento: tipoMovimiento || null,
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

            setMovimientos(response.data.movimientos);
        } catch (error) {
            if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
                return;
            }
            Swal.fire({
                icon: 'error',
                title: 'Error al filtrar',
                text: error.response?.data?.message || 'No se pudieron consultar los movimientos.',
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
            filtrarMovimientos(1);
        }, 350);

        return () => clearTimeout(timer);
    }, [buscar, tipoMovimiento, bienId, fechaInicio, fechaFin]);

    const abrirModalCrear = () => {
        reset();
        clearErrors();
        setBienSeleccionado(null);
        setData({
            bien_id: '',
            tipo_movimiento: 'Reubicacion',
            aula_destino_id: '',
            area_destino_id: '',
            personal_destino_id: '',
            fecha_movimiento: new Date().toISOString().slice(0, 16),
            motivo: '',
        });
        setModalOpen(true);
    };

    const handleSelectBien = (id) => {
        setData('bien_id', id);
        const bien = bienes.find((b) => String(b.id) === String(id));
        setBienSeleccionado(bien || null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        post(route('patrimonio-movimientos.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setModalOpen(false);
                filtrarMovimientos(1);
            },
        });
    };

    const eliminarMovimiento = async (mov) => {
        const result = await Swal.fire({
            title: '¿Eliminar registro histórico?',
            text: 'Se removerá este asiento del historial de movimientos.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        });

        if (!result.isConfirmed) return;

        axios.delete(route('patrimonio-movimientos.destroy', mov.id))
            .then(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'Eliminado',
                    text: 'Registro eliminado del historial.',
                    timer: 1500,
                    showConfirmButton: false,
                });
                filtrarMovimientos(movimientos.current_page ?? 1);
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
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Movimientos y Reasignaciones</h1>
                        <p className="text-xs text-slate-500">Historial y trazabilidad de traslados, préstamos y cambios de custodio.</p>
                    </div>
                    <button
                        type="button"
                        onClick={abrirModalCrear}
                        className="rounded-xl bg-[#315d7a] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#274b63] shadow-xs cursor-pointer"
                    >
                        + Registrar Movimiento
                    </button>
                </div>
            }
        >
            <Head title="Movimientos de Patrimonio" />

            <div className="space-y-5">
                {/* FILTROS */}
                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:grid-cols-6">
                    <input
                        type="search"
                        value={buscar}
                        onChange={(e) => setBuscar(e.target.value)}
                        placeholder="Buscar por motivo, código o bien..."
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs md:col-span-2 outline-none focus:border-[#315d7a]"
                    />

                    <select
                        value={tipoMovimiento}
                        onChange={(e) => setTipoMovimiento(e.target.value)}
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-[#315d7a]"
                    >
                        <option value="">Todos los tipos</option>
                        {tiposMovimiento.map((t) => (
                            <option key={t} value={t}>{TIPOS_CONFIG[t]?.label || t}</option>
                        ))}
                    </select>

                    <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        title="Desde"
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-[#315d7a]"
                    />

                    <input
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        title="Hasta"
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-[#315d7a]"
                    />

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setBuscar('');
                                setTipoMovimiento('');
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

                {/* TABLA DE MOVIMIENTOS */}
                <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition ${cargando ? 'opacity-60 pointer-events-none' : ''}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-4 w-12 text-center">#</th>
                                    <th className="py-3 px-4 min-w-[200px]">Activo / Código</th>
                                    <th className="py-3 px-4 text-center w-36">Tipo y Fecha</th>
                                    <th className="py-3 px-4 min-w-[180px]">Ubicación y Custodio Origen</th>
                                    <th className="py-3 px-4 min-w-[180px]">Ubicación y Custodio Destino</th>
                                    <th className="py-3 px-4 min-w-[180px]">Motivo / Justificación</th>
                                    <th className="py-3 px-4 text-right w-20">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {movimientos?.data?.length > 0 ? (
                                    movimientos.data.map((mov, idx) => {
                                        const configTipo = TIPOS_CONFIG[mov.tipo_movimiento] || { label: mov.tipo_movimiento, bg: 'bg-slate-100' };

                                        return (
                                            <tr key={mov.id} className="hover:bg-slate-50 transition">
                                                <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                                                    {(movimientos.current_page - 1) * movimientos.per_page + idx + 1}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-mono font-bold text-[#315d7a] block">
                                                        {mov.bien?.codigo_patrimonial}
                                                    </span>
                                                    <span className="font-bold text-slate-900 leading-snug block line-clamp-1">
                                                        {mov.bien?.denominacion}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border mb-1 ${configTipo.bg}`}>
                                                        {configTipo.label}
                                                    </span>
                                                    <span className="font-mono text-slate-500 text-[10px] block">
                                                        {mov.fecha_movimiento ? mov.fecha_movimiento.replace('T', ' ').substring(0, 16) : '---'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-slate-700">
                                                    <span className="font-medium text-[11px] block text-slate-800">
                                                        📍 {mov.aula_origen ? `Aula ${mov.aula_origen.nombre}` : mov.area_origen ? `Área ${mov.area_origen.nombre}` : <span className="text-slate-400 italic">Sin ubicación previa</span>}
                                                    </span>
                                                    {mov.personal_origen && (
                                                        <span className="text-[10px] text-slate-500 block">
                                                            👤 {mov.personal_origen.nombre} {mov.personal_origen.apellido}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-slate-700">
                                                    <span className="font-bold text-[11px] block text-[#315d7a]">
                                                        ➡️ {mov.aula_destino ? `Aula ${mov.aula_destino.nombre}` : mov.area_destino ? `Área ${mov.area_destino.nombre}` : <span className="text-slate-400 italic">No especificada</span>}
                                                    </span>
                                                    {mov.personal_destino && (
                                                        <span className="text-[10px] text-slate-600 font-semibold block">
                                                            👤 {mov.personal_destino.nombre} {mov.personal_destino.apellido}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                                                    {mov.motivo || <span className="text-slate-400 italic">Sin observaciones</span>}
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => eliminarMovimiento(mov)}
                                                        title="Eliminar asiento"
                                                        className="rounded-lg border border-rose-200 p-1 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                                    >
                                                        🗑️
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400 text-xs italic">
                                            No se encontraron movimientos o reasignaciones registradas.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* PAGINACIÓN */}
                {movimientos?.links?.length > 3 && (
                    <div className="flex flex-wrap justify-end gap-1">
                        {movimientos.links.map((link, index) => (
                            <button
                                key={index}
                                type="button"
                                disabled={!link.url || cargando}
                                onClick={() => {
                                    const pageNum = new URL(link.url).searchParams.get('page') || 1;
                                    filtrarMovimientos(Number(pageNum));
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

            {/* MODAL REGISTRAR MOVIMIENTO */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Registrar Movimiento / Reasignación
                                </h3>
                                <p className="text-xs text-slate-500">Actualizará la ubicación y responsable del bien en tiempo real.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Seleccionar Activo Patrimonial <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.bien_id}
                                    onChange={(e) => handleSelectBien(e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                >
                                    <option value="">-- Seleccione el bien --</option>
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
                                        Tipo de Desplazamiento <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.tipo_movimiento}
                                        onChange={(e) => setData('tipo_movimiento', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#315d7a]"
                                    >
                                        {tiposMovimiento.map((t) => (
                                            <option key={t} value={t}>{TIPOS_CONFIG[t]?.label || t}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Fecha y Hora de Traslado <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={data.fecha_movimiento}
                                        onChange={(e) => setData('fecha_movimiento', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                    />
                                    <InputError message={errors.fecha_movimiento} className="mt-1" />
                                </div>
                            </div>

                            {/* UBICACIÓN DESTINO */}
                            <div className="border-t border-slate-100 pt-3">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block mb-2">
                                    Nuevo Destino y Responsable
                                </label>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Destino: Aula (Docencia)
                                        </label>
                                        <select
                                            value={data.aula_destino_id}
                                            onChange={(e) => {
                                                setData('aula_destino_id', e.target.value);
                                                if (e.target.value) setData('area_destino_id', '');
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
                                            Destino: Área Administrativa
                                        </label>
                                        <select
                                            value={data.area_destino_id}
                                            onChange={(e) => {
                                                setData('area_destino_id', e.target.value);
                                                if (e.target.value) setData('aula_destino_id', '');
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
                                            Nuevo Custodio Responsable
                                        </label>
                                        <select
                                            value={data.personal_destino_id}
                                            onChange={(e) => setData('personal_destino_id', e.target.value)}
                                            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                        >
                                            <option value="">-- Sin asignar --</option>
                                            {personal.map((p) => (
                                                <option key={p.id} value={p.id}>{p.apellido}, {p.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Motivo del Movimiento / Autorización
                                </label>
                                <textarea
                                    rows={2}
                                    value={data.motivo}
                                    onChange={(e) => setData('motivo', e.target.value)}
                                    placeholder="Ej. Requerimiento por inicio de semestre lectivo / Reasignación por rotación de personal..."
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                />
                            </div>

                            <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
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
                                    {processing ? 'Guardando...' : 'Asentar Movimiento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}