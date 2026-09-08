import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import { Head, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useEffect, useRef, useState } from 'react';

const RESULTADOS_CONFIG = {
    Aprobado_Unanimidad: { label: 'Aprobado por Unanimidad', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    Aprobado_Mayoria: { label: 'Aprobado por Mayoría', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
    Desaprobado: { label: 'Desaprobado', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export default function Index({
    sustentaciones: sustentacionesIniciales,
    aptosSinProgramar = [],
    docentes = [],
    resultados = [],
    filtros: filtrosIniciales,
}) {
    const { flash } = usePage().props;

    const [sustentaciones, setSustentaciones] = useState(sustentacionesIniciales);
    const [buscar, setBuscar] = useState(filtrosIniciales?.buscar || '');
    const [resultadoFiltro, setResultadoFiltro] = useState(filtrosIniciales?.resultado || '');
    const [cargando, setCargando] = useState(false);

    // Estado del modal de programación y acta
    const [modalOpen, setModalOpen] = useState(false);
    const [titulacionActual, setTitulacionActual] = useState(null);

    const primeraCarga = useRef(true);
    const abortControllerRef = useRef(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        fecha_sustentacion: '',
        lugar_aula: 'Auditorio Principal',
        nota_promedio: '',
        resultado: 'Aprobado_Unanimidad',
        observaciones: '',
        jurados: [
            { docente_id: '', cargo: 'Presidente' },
            { docente_id: '', cargo: 'Secretario' },
            { docente_id: '', cargo: 'Vocal' },
        ],
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
                title: 'Atención',
                text: flash.error,
            });
        }
    }, [flash]);

    const filtrarSustentaciones = async (page = 1) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        setCargando(true);

        try {
            const response = await axios.post(
                route('titulacion-sustentaciones.filtrar'),
                {
                    buscar: buscar.trim() || null,
                    resultado: resultadoFiltro || null,
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

            setSustentaciones(response.data.sustentaciones);
        } catch (error) {
            if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
                return;
            }
            Swal.fire({
                icon: 'error',
                title: 'Error al filtrar',
                text: error.response?.data?.message || 'No se pudieron consultar las sustentaciones.',
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
            filtrarSustentaciones(1);
        }, 350);

        return () => clearTimeout(timer);
    }, [buscar, resultadoFiltro]);

    const abrirModalGestion = (titulacion) => {
        setTitulacionActual(titulacion);
        clearErrors();

        // Cargar jurados si ya existen o dejar los 3 puestos base
        const juradosCargados = titulacion.jurados && titulacion.jurados.length > 0
            ? titulacion.jurados.map((j) => ({ docente_id: j.docente_id, cargo: j.cargo }))
            : [
                { docente_id: '', cargo: 'Presidente' },
                { docente_id: '', cargo: 'Secretario' },
                { docente_id: '', cargo: 'Vocal' },
            ];

        setData({
            fecha_sustentacion: titulacion.acta?.fecha_sustentacion ? titulacion.acta.fecha_sustentacion.replace(' ', 'T').substring(0, 16) : '',
            lugar_aula: titulacion.acta?.lugar_aula || 'Auditorio Principal',
            nota_promedio: titulacion.acta?.nota_promedio || '',
            resultado: titulacion.acta?.resultado || 'Aprobado_Unanimidad',
            observaciones: titulacion.acta?.observaciones || '',
            jurados: juradosCargados,
        });

        setModalOpen(true);
    };

    const actualizarJurado = (index, docente_id) => {
        const nuevosJurados = [...data.jurados];
        nuevosJurados[index].docente_id = docente_id;
        setData('jurados', nuevosJurados);
    };

    const agregarAccesitario = () => {
        setData('jurados', [...data.jurados, { docente_id: '', cargo: 'Accesitario' }]);
    };

    const removerJurado = (index) => {
        if (data.jurados.length <= 3) {
            Swal.fire('Atención', 'La mesa debe contar con al menos 3 jurados evaluadores.', 'warning');
            return;
        }
        setData('jurados', data.jurados.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('titulacion-sustentaciones.guardar', titulacionActual.id), {
            preserveScroll: true,
            onSuccess: () => {
                setModalOpen(false);
                setTitulacionActual(null);
                filtrarSustentaciones(sustentaciones.current_page ?? 1);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sustentaciones y Actas Oficiales</h1>
                        <p className="text-xs text-slate-500">Programación de defensas orales, mesa de jurados y emisión de actas.</p>
                    </div>
                </div>
            }
        >
            <Head title="Sustentaciones y Actas" />

            <div className="space-y-6">
                {/* BANDEJA DE EXPEDIENTES APTOS PENDIENTES DE PROGRAMACIÓN */}
                {aptosSinProgramar.length > 0 && (
                    <div className="bg-sky-50/70 border border-sky-200 p-4 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-bold text-[#315d7a] uppercase tracking-wider flex items-center gap-1.5">
                                🔔 Expedientes Aptos para Sustentación ({aptosSinProgramar.length})
                            </h2>
                            <span className="text-[11px] text-[#315d7a] font-semibold">Listos para asignar jurado</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {aptosSinProgramar.map((apto) => (
                                <div key={apto.id} className="bg-white p-3 rounded-xl border border-sky-100 shadow-2xs flex justify-between items-center text-xs">
                                    <div>
                                        <span className="font-bold text-slate-900 block font-mono">{apto.codigo_expediente}</span>
                                        <p className="text-slate-600 truncate max-w-[200px]">{apto.estudiante?.apellidos}, {apto.estudiante?.nombres}</p>
                                        <span className="text-[10px] text-slate-400 block">{apto.plan_estudio?.nombre}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => abrirModalGestion(apto)}
                                        className="rounded-lg bg-[#315d7a] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#274b63] transition shadow-xs cursor-pointer flex-shrink-0"
                                    >
                                        Programar
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* FILTROS */}
                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:grid-cols-4">
                    <input
                        type="search"
                        value={buscar}
                        onChange={(e) => setBuscar(e.target.value)}
                        placeholder="Buscar por código, acta, egresado o DNI..."
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs md:col-span-2 outline-none focus:border-[#315d7a]"
                    />

                    <select
                        value={resultadoFiltro}
                        onChange={(e) => setResultadoFiltro(e.target.value)}
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-[#315d7a]"
                    >
                        <option value="">Todos los resultados</option>
                        {resultados.map((r) => (
                            <option key={r} value={r}>{RESULTADOS_CONFIG[r]?.label || r}</option>
                        ))}
                    </select>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setBuscar('');
                                setResultadoFiltro('');
                            }}
                            className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                        >
                            Limpiar
                        </button>
                        {cargando && <span className="text-xs font-medium text-[#315d7a]">Consultando...</span>}
                    </div>
                </div>

                {/* TABLA DE SUSTENTACIONES */}
                <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition ${cargando ? 'opacity-60 pointer-events-none' : ''}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-4 w-12 text-center">#</th>
                                    <th className="py-3 px-4 min-w-[170px]">Expediente y Acta</th>
                                    <th className="py-3 px-4 min-w-[200px]">Egresado / Carrera</th>
                                    <th className="py-3 px-4 min-w-[200px]">Mesa de Jurados</th>
                                    <th className="py-3 px-4 text-center min-w-[140px]">Fecha y Lugar</th>
                                    <th className="py-3 px-4 text-center min-w-[140px]">Calificación y Dictamen</th>
                                    <th className="py-3 px-4 text-right min-w-[130px]">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sustentaciones.data.length > 0 ? (
                                    sustentaciones.data.map((item, idx) => {
                                        const configRes = item.acta ? RESULTADOS_CONFIG[item.acta.resultado] : null;

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50 transition">
                                                <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                                                    {(sustentaciones.current_page - 1) * sustentaciones.per_page + idx + 1}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-bold text-[#315d7a] font-mono block">
                                                        {item.codigo_expediente}
                                                    </span>
                                                    {item.acta ? (
                                                        <span className="font-mono text-emerald-700 font-bold text-[11px] block">
                                                            📜 {item.acta.numero_acta}
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-600 font-semibold text-[10px]">
                                                            ⏳ Sin acta emitida
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-bold text-slate-900 block">
                                                        {item.estudiante?.apellidos}, {item.estudiante?.nombres}
                                                    </span>
                                                    <span className="text-[11px] text-slate-500 font-mono block">
                                                        DNI: {item.estudiante?.dni}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 block truncate max-w-[200px]">
                                                        {item.plan_estudio?.nombre}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="space-y-1">
                                                        {item.jurados && item.jurados.length > 0 ? (
                                                            item.jurados.map((j) => (
                                                                <div key={j.id} className="text-[11px]">
                                                                    <strong className="text-[#315d7a]">{j.cargo}:</strong> {j.docente?.nombre} {j.docente?.apellido}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <span className="text-slate-400 italic">Mesa sin conformar</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    {item.acta?.fecha_sustentacion ? (
                                                        <div className="space-y-0.5 font-mono text-[11px]">
                                                            <span className="block text-slate-800 font-bold">
                                                                {item.acta.fecha_sustentacion.substring(0, 10)}
                                                            </span>
                                                            <span className="text-slate-500 text-[10px] block">
                                                                {item.acta.fecha_sustentacion.substring(11, 16)} hrs
                                                            </span>
                                                            <span className="text-slate-400 text-[10px] block">
                                                                📍 {item.acta.lugar_aula}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic">No programada</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    {item.acta ? (
                                                        <div className="space-y-1">
                                                            {item.acta.nota_promedio && (
                                                                <span className="font-mono font-extrabold text-sm text-slate-900 block">
                                                                    Nota: {item.acta.nota_promedio}
                                                                </span>
                                                            )}
                                                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${configRes?.bg || 'bg-slate-100'}`}>
                                                                {configRes?.label || item.acta.resultado}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Pendiente</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => abrirModalGestion(item)}
                                                            title="Calificar y Acta"
                                                            className="rounded-lg bg-[#315d7a] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#274b63] transition shadow-2xs cursor-pointer"
                                                        >
                                                            {item.acta ? 'Editar Acta' : 'Evaluar'}
                                                        </button>
                                                        {item.acta && (
                                                            <a
                                                                href={route('titulacion-sustentaciones.pdf', item.id)}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                title="Descargar Acta en PDF"
                                                                className="rounded-lg border border-emerald-200 bg-white p-1 text-emerald-700 hover:bg-emerald-50 transition shadow-2xs"
                                                            >
                                                                📜 PDF
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400 text-xs italic">
                                            No se encontraron sustentaciones registradas.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* PAGINACIÓN */}
                {sustentaciones.links?.length > 3 && (
                    <div className="flex flex-wrap justify-end gap-1">
                        {sustentaciones.links.map((link, index) => (
                            <button
                                key={index}
                                type="button"
                                disabled={!link.url || cargando}
                                onClick={() => {
                                    const pageNum = new URL(link.url).searchParams.get('page') || 1;
                                    filtrarSustentaciones(Number(pageNum));
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

            {/* MODAL PARA PROGRAMAR, ASIGNAR JURADOS Y EMITIR ACTA */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Sustentación y Acta Oficial de Titulación
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {titulacionActual?.codigo_expediente} — {titulacionActual?.estudiante?.apellidos}, {titulacionActual?.estudiante?.nombres}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
                            {/* 1. MESA DE JURADOS EVALUADORES */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                        1. Mesa de Jurados Evaluadores <span className="text-rose-500">*</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={agregarAccesitario}
                                        className="text-[11px] font-bold text-[#315d7a] hover:underline cursor-pointer"
                                    >
                                        + Agregar Accesitario
                                    </button>
                                </div>

                                <div className="space-y-2.5">
                                    {data.jurados.map((jurado, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <span className="w-24 text-xs font-bold text-slate-700 font-mono">
                                                {jurado.cargo}:
                                            </span>
                                            <select
                                                value={jurado.docente_id}
                                                onChange={(e) => actualizarJurado(index, e.target.value)}
                                                className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                            >
                                                <option value="">-- Seleccionar Docente --</option>
                                                {docentes.map((doc) => (
                                                    <option key={doc.id} value={doc.id}>
                                                        {doc.apellido}, {doc.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                            {jurado.cargo === 'Accesitario' && (
                                                <button
                                                    type="button"
                                                    onClick={() => removerJurado(index)}
                                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <InputError message={errors.jurados} className="mt-1" />
                            </div>

                            {/* 2. PROGRAMACIÓN Y ACTA */}
                            <div className="border-t border-slate-100 pt-4">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block mb-3">
                                    2. Datos de la Sustentación y Dictamen
                                </label>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Fecha y Hora de Sustentación <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={data.fecha_sustentacion}
                                            onChange={(e) => setData('fecha_sustentacion', e.target.value)}
                                            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                        />
                                        <InputError message={errors.fecha_sustentacion} className="mt-1" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Lugar / Aula / Enlace <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.lugar_aula}
                                            onChange={(e) => setData('lugar_aula', e.target.value)}
                                            placeholder="ej. Auditorio Central o Sala Zoom"
                                            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                        />
                                        <InputError message={errors.lugar_aula} className="mt-1" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Calificación Promedio (Escala 0 - 20)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="20"
                                            value={data.nota_promedio}
                                            onChange={(e) => setData('nota_promedio', e.target.value)}
                                            placeholder="ej. 17.50"
                                            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 font-bold outline-none focus:border-[#315d7a]"
                                        />
                                        <InputError message={errors.nota_promedio} className="mt-1" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Resultado del Dictamen <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={data.resultado}
                                            onChange={(e) => setData('resultado', e.target.value)}
                                            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#315d7a]"
                                        >
                                            <option value="Aprobado_Unanimidad">✅ Aprobado por Unanimidad</option>
                                            <option value="Aprobado_Mayoria">✅ Aprobado por Mayoría</option>
                                            <option value="Desaprobado">❌ Desaprobado</option>
                                        </select>
                                        <InputError message={errors.resultado} className="mt-1" />
                                    </div>
                                </div>

                                <div className="mt-3.5">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Observaciones del Jurado en Acta
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={data.observaciones}
                                        onChange={(e) => setData('observaciones', e.target.value)}
                                        placeholder="Menciones de felicitación, recomendaciones o detalles del acto..."
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                    />
                                </div>
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
                                    className="rounded-xl bg-[#315d7a] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#274b63] disabled:opacity-50 shadow-xs cursor-pointer"
                                >
                                    {processing ? 'Guardando...' : 'Guardar y Emitir Acta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}