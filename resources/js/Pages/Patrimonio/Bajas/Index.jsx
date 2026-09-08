import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import { Head, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useEffect, useRef, useState } from 'react';

const CAUSALES_CONFIG = {
    Obsolescencia: { label: 'Obsolescencia Técnica', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
    Inoperativo: { label: 'Inoperativo / Avería Total', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    Robo_Hurto: { label: 'Robo / Hurto', bg: 'bg-red-100 text-red-800 border-red-300' },
    Perdida: { label: 'Pérdida / Extravío', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    Donacion: { label: 'Donación / Transferencia', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
    Otro: { label: 'Otro Motivo', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export default function Index({
    bajas: bajasIniciales,
    bienesDisponibles = [],
    causales = [],
    filtros: filtrosIniciales,
}) {
    const { flash } = usePage().props;

    const [bajas, setBajas] = useState(bajasIniciales);
    const [buscar, setBuscar] = useState(filtrosIniciales?.buscar || '');
    const [causal, setCausal] = useState(filtrosIniciales?.causal || '');
    const [fechaInicio, setFechaInicio] = useState(filtrosIniciales?.fecha_inicio || '');
    const [fechaFin, setFechaFin] = useState(filtrosIniciales?.fecha_fin || '');
    const [cargando, setCargando] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);

    const primeraCarga = useRef(true);
    const abortControllerRef = useRef(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        bien_id: '',
        causal: 'Obsolescencia',
        resolucion_director: `R.D. N° ${new Date().getFullYear()}-IES/PAT`,
        informe_tecnico: '',
        fecha_baja: new Date().toISOString().split('T')[0],
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

    const filtrarBajas = async (page = 1) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        setCargando(true);

        try {
            const response = await axios.post(
                route('patrimonio-bajas.filtrar'),
                {
                    buscar: buscar.trim() || null,
                    causal: causal || null,
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

            setBajas(response.data.bajas);
        } catch (error) {
            if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
                return;
            }
            Swal.fire({
                icon: 'error',
                title: 'Error al filtrar',
                text: error.response?.data?.message || 'No se pudieron consultar las bajas.',
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
            filtrarBajas(1);
        }, 350);

        return () => clearTimeout(timer);
    }, [buscar, causal, fechaInicio, fechaFin]);

    const abrirModalCrear = () => {
        reset();
        clearErrors();
        setData({
            bien_id: '',
            causal: 'Obsolescencia',
            resolucion_director: `R.D. N° ${new Date().getFullYear()}-IES/PAT`,
            informe_tecnico: '',
            fecha_baja: new Date().toISOString().split('T')[0],
        });
        setModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        post(route('patrimonio-bajas.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setModalOpen(false);
                filtrarBajas(1);
            },
        });
    };

    const revertirBaja = async (baja) => {
        const result = await Swal.fire({
            title: '¿Revertir baja patrimonial?',
            text: `El bien "${baja.bien?.denominacion}" volverá a ser inventariado en estado Inoperativo.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d97706',
            confirmButtonText: 'Sí, revertir',
            cancelButtonText: 'Cancelar',
        });

        if (!result.isConfirmed) return;

        axios.delete(route('patrimonio-bajas.destroy', baja.id))
            .then(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'Baja revertida',
                    text: 'El activo retornó al inventario general.',
                    timer: 1500,
                    showConfirmButton: false,
                });
                filtrarBajas(bajas.current_page ?? 1);
            })
            .catch((err) => {
                Swal.fire('Error', err.response?.data?.message || 'No se pudo revertir la baja.', 'error');
            });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bajas y Desincorporación de Bienes</h1>
                        <p className="text-xs text-slate-500">Expedientes de retiro definitivo, resoluciones directorales e informes técnicos.</p>
                    </div>
                    <button
                        type="button"
                        onClick={abrirModalCrear}
                        className="rounded-xl bg-[#315d7a] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#274b63] shadow-xs cursor-pointer"
                    >
                        + Asentar Baja de Activo
                    </button>
                </div>
            }
        >
            <Head title="Bajas de Patrimonio" />

            <div className="space-y-5">
                {/* FILTROS */}
                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:grid-cols-5">
                    <input
                        type="search"
                        value={buscar}
                        onChange={(e) => setBuscar(e.target.value)}
                        placeholder="Buscar por resolución, código o bien..."
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs md:col-span-2 outline-none focus:border-[#315d7a]"
                    />

                    <select
                        value={causal}
                        onChange={(e) => setCausal(e.target.value)}
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-[#315d7a]"
                    >
                        <option value="">Todas las causales</option>
                        {causales.map((c) => (
                            <option key={c} value={c}>{CAUSALES_CONFIG[c]?.label || c}</option>
                        ))}
                    </select>

                    <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        title="Desde fecha de baja"
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-[#315d7a]"
                    />

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setBuscar('');
                                setCausal('');
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

                {/* TABLA DE BAJAS */}
                <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition ${cargando ? 'opacity-60 pointer-events-none' : ''}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-4 w-12 text-center">#</th>
                                    <th className="py-3 px-4 min-w-[200px]">Activo Desincorporado</th>
                                    <th className="py-3 px-4 min-w-[150px]">Causal de Baja</th>
                                    <th className="py-3 px-4 min-w-[160px]">Resolución y Fecha</th>
                                    <th className="py-3 px-4 min-w-[220px]">Informe Técnico / Motivo</th>
                                    <th className="py-3 px-4 text-center w-28">Valor Registrado</th>
                                    <th className="py-3 px-4 text-right min-w-[120px]">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {bajas?.data?.length > 0 ? (
                                    bajas.data.map((baja, idx) => {
                                        const configCausal = CAUSALES_CONFIG[baja.causal] || { label: baja.causal, bg: 'bg-slate-100' };

                                        return (
                                            <tr key={baja.id} className="hover:bg-slate-50 transition">
                                                <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                                                    {(bajas.current_page - 1) * bajas.per_page + idx + 1}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-mono font-bold text-[#315d7a] block">
                                                        {baja.bien?.codigo_patrimonial}
                                                    </span>
                                                    <span className="font-bold text-slate-900 leading-snug block line-clamp-1">
                                                        {baja.bien?.denominacion}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 block font-mono">
                                                        S/N: {baja.bien?.serie || 'N/D'} • Cat: {baja.bien?.categoria?.nombre}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${configCausal.bg}`}>
                                                        {configCausal.label}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <strong className="text-slate-800 font-mono block text-[11px]">
                                                        {baja.resolucion_director || 'Sin R.D. Asignada'}
                                                    </strong>
                                                    <span className="text-slate-500 font-mono text-[10px] block">
                                                        Fecha: {baja.fecha_baja}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                                                    <p className="line-clamp-2">{baja.informe_tecnico}</p>
                                                </td>
                                                <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                                                    S/ {Number(baja.bien?.valor_adquisicion || 0).toFixed(2)}
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex justify-end gap-1.5">
                                                        <a
                                                            href={route('patrimonio-bajas.pdf', baja.id)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            title="Descargar Acta Oficial de Baja"
                                                            className="rounded-lg border border-purple-200 bg-white p-1 text-purple-700 hover:bg-purple-50 transition shadow-2xs font-bold text-xs"
                                                        >
                                                            📜 PDF
                                                        </a>
                                                        <button
                                                            type="button"
                                                            onClick={() => revertirBaja(baja)}
                                                            title="Revertir baja e ingresar al inventario"
                                                            className="rounded-lg border border-amber-200 bg-white p-1 text-amber-600 hover:bg-amber-50 transition shadow-2xs"
                                                        >
                                                            ↩️
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400 text-xs italic">
                                            No se encontraron expedientes de bajas patrimoniales.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* PAGINACIÓN */}
                {bajas?.links?.length > 3 && (
                    <div className="flex flex-wrap justify-end gap-1">
                        {bajas.links.map((link, index) => (
                            <button
                                key={index}
                                type="button"
                                disabled={!link.url || cargando}
                                onClick={() => {
                                    const pageNum = new URL(link.url).searchParams.get('page') || 1;
                                    filtrarBajas(Number(pageNum));
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

            {/* MODAL ASENTAR BAJA */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Desincorporar Activo (Asentar Baja)
                                </h3>
                                <p className="text-xs text-slate-500">Este proceso liberará la ubicación física y asignará el estado 'De Baja'.</p>
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
                                    Activo Patrimonial a Desincorporar <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.bien_id}
                                    onChange={(e) => setData('bien_id', e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                >
                                    <option value="">-- Seleccionar bien del inventario --</option>
                                    {bienesDisponibles.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            [{b.codigo_patrimonial}] {b.denominacion} — Estado: {b.estado_conservacion} ({b.situacion})
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.bien_id} className="mt-1" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Causal de Baja <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.causal}
                                        onChange={(e) => setData('causal', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#315d7a]"
                                    >
                                        {causales.map((c) => (
                                            <option key={c} value={c}>{CAUSALES_CONFIG[c]?.label || c}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.causal} className="mt-1" />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Fecha Oficial de Baja <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={data.fecha_baja}
                                        onChange={(e) => setData('fecha_baja', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                    />
                                    <InputError message={errors.fecha_baja} className="mt-1" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Resolución Directoral de Baja (Opcional)
                                </label>
                                <input
                                    type="text"
                                    value={data.resolucion_director}
                                    onChange={(e) => setData('resolucion_director', e.target.value)}
                                    placeholder="Ej. R.D. N° 012-2026-IES-T"
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 font-bold outline-none focus:border-[#315d7a]"
                                />
                                <InputError message={errors.resolucion_director} className="mt-1" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Informe Técnico / Justificación y Destino Final <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.informe_tecnico}
                                    onChange={(e) => setData('informe_tecnico', e.target.value)}
                                    placeholder="Explicación detallada del estado inservible, informe de peritaje técnico o denuncia policial según corresponda..."
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                />
                                <InputError message={errors.informe_tecnico} className="mt-1" />
                            </div>

                            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 text-[11px] text-rose-800">
                                ⚠️ <strong>Advertencia:</strong> Al registrar la baja, el bien cambiará su situación a <strong>De Baja</strong> y se desvinculará automáticamente del aula/área y del personal responsable.
                            </div>

                            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
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
                                    className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-50 shadow-xs cursor-pointer"
                                >
                                    {processing ? 'Desincorporando...' : 'Asentar Baja'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}