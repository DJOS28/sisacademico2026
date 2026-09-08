import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import { Head, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useEffect, useRef, useState } from 'react';

export default function Index({
    titulaciones: titulacionesIniciales,
    planes = [],
    librosDisponibles = [],
    filtros: filtrosIniciales,
}) {
    const { flash } = usePage().props;

    const [titulaciones, setTitulaciones] = useState(titulacionesIniciales);
    const [buscar, setBuscar] = useState(filtrosIniciales?.buscar || '');
    const [planEstudioId, setPlanEstudioId] = useState(filtrosIniciales?.plan_estudio_id || '');
    const [libro, setLibro] = useState(filtrosIniciales?.libro || '');
    const [estadoRegistro, setEstadoRegistro] = useState(filtrosIniciales?.estado_registro || '');
    const [cargando, setCargando] = useState(false);

    // Modal de asentamiento de título
    const [modalOpen, setModalOpen] = useState(false);
    const [titulacionActual, setTitulacionActual] = useState(null);

    const primeraCarga = useRef(true);
    const abortControllerRef = useRef(null);

    const { data, setData, post, processing, errors, clearErrors } = useForm({
        resolucion_director: '',
        numero_diploma: '',
        libro: 'LIB-01',
        folio: '',
        codigo_registro_minedu: '',
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

    const filtrarLibro = async (page = 1) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        setCargando(true);

        try {
            const response = await axios.post(
                route('titulacion-registro.filtrar'),
                {
                    buscar: buscar.trim() || null,
                    plan_estudio_id: planEstudioId || null,
                    libro: libro || null,
                    estado_registro: estadoRegistro || null,
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

            setTitulaciones(response.data.titulaciones);
        } catch (error) {
            if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
                return;
            }
            Swal.fire({
                icon: 'error',
                title: 'Error al filtrar',
                text: error.response?.data?.message || 'No se pudo consultar el Libro de Títulos.',
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
            filtrarLibro(1);
        }, 350);

        return () => clearTimeout(timer);
    }, [buscar, planEstudioId, libro, estadoRegistro]);

    const abrirModalRegistro = (item) => {
        setTitulacionActual(item);
        clearErrors();
        setData({
            resolucion_director: item.acta?.resolucion_director || `R.D. N° ${new Date().getFullYear()}-IES`,
            numero_diploma: item.acta?.numero_diploma || `DIP-${String(item.id).padStart(5, '0')}`,
            libro: item.acta?.libro || 'LIB-01',
            folio: item.acta?.folio || String(item.id),
            codigo_registro_minedu: item.acta?.codigo_registro_minedu || '',
        });
        setModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('titulacion-registro.diploma', titulacionActual.id), {
            preserveScroll: true,
            onSuccess: () => {
                setModalOpen(false);
                setTitulacionActual(null);
                filtrarLibro(titulaciones.current_page ?? 1);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Libro de Títulos y Grados Oficiales</h1>
                        <p className="text-xs text-slate-500">Asentamiento registral, emisión de diplomas y códigos MINEDU.</p>
                    </div>
                </div>
            }
        >
            <Head title="Libro de Títulos Oficial" />

            <div className="space-y-5">
                {/* BARRA DE FILTROS */}
                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:grid-cols-5">
                    <input
                        type="search"
                        value={buscar}
                        onChange={(e) => setBuscar(e.target.value)}
                        placeholder="Buscar diploma, R.D., DNI o egresado..."
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs md:col-span-2 outline-none focus:border-[#315d7a]"
                    />

                    <select
                        value={planEstudioId}
                        onChange={(e) => setPlanEstudioId(e.target.value)}
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-[#315d7a]"
                    >
                        <option value="">Todos los programas</option>
                        {planes.map((p) => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                    </select>

                    <select
                        value={estadoRegistro}
                        onChange={(e) => setEstadoRegistro(e.target.value)}
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-[#315d7a]"
                    >
                        <option value="">Todos los registros</option>
                        <option value="Registrado">Asentados (Con Diploma)</option>
                        <option value="Pendiente">Pendientes de Asentar</option>
                    </select>

                    <div className="flex items-center gap-2">
                        <select
                            value={libro}
                            onChange={(e) => setLibro(e.target.value)}
                            className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-[#315d7a] w-full"
                        >
                            <option value="">Todos los Libros</option>
                            {librosDisponibles.map((lib) => (
                                <option key={lib} value={lib}>Libro {lib}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => {
                                setBuscar('');
                                setPlanEstudioId('');
                                setLibro('');
                                setEstadoRegistro('');
                            }}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                        >
                            Limpiar
                        </button>
                    </div>
                </div>

                {/* TABLA DEL LIBRO DE TÍTULOS */}
                <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition ${cargando ? 'opacity-60 pointer-events-none' : ''}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-4 w-12 text-center">#</th>
                                    <th className="py-3 px-4 min-w-[200px]">Titulado(a) / DNI</th>
                                    <th className="py-3 px-4 min-w-[180px]">Programa Académico</th>
                                    <th className="py-3 px-4 min-w-[160px]">Diploma y Resolución</th>
                                    <th className="py-3 px-4 text-center min-w-[130px]">Libro y Folio</th>
                                    <th className="py-3 px-4 text-center min-w-[140px]">Código MINEDU</th>
                                    <th className="py-3 px-4 text-right min-w-[130px]">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {titulaciones.data.length > 0 ? (
                                    titulaciones.data.map((item, idx) => {
                                        const tieneDiploma = Boolean(item.acta?.numero_diploma);

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50 transition">
                                                <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                                                    {(titulaciones.current_page - 1) * titulaciones.per_page + idx + 1}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-bold text-slate-900 block">
                                                        {item.estudiante?.apellidos}, {item.estudiante?.nombres}
                                                    </span>
                                                    <span className="text-[11px] text-slate-500 font-mono">
                                                        DNI: {item.estudiante?.dni}
                                                    </span>
                                                    <span className="inline-block bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-100 mt-0.5">
                                                        🎓 {item.estudiante?.grado || 'Titulado'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-semibold text-slate-800 text-[11px] block">
                                                        {item.plan_estudio?.nombre}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-mono block">
                                                        Acta: {item.acta?.numero_acta}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {tieneDiploma ? (
                                                        <div className="space-y-0.5 font-mono text-[11px]">
                                                            <strong className="text-[#315d7a] block">
                                                                📜 {item.acta.numero_diploma}
                                                            </strong>
                                                            <span className="text-slate-500 text-[10px] block">
                                                                {item.acta.resolucion_director}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-amber-600 font-semibold text-[11px] italic">
                                                            ⏳ Pendiente de asentar
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-center font-mono text-[11px]">
                                                    {tieneDiploma ? (
                                                        <div className="space-y-0.5">
                                                            <span className="font-bold text-slate-800 block">
                                                                Libro: {item.acta.libro}
                                                            </span>
                                                            <span className="text-slate-500 text-[10px] block">
                                                                Folio: {item.acta.folio}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic">---</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-center font-mono">
                                                    {item.acta?.codigo_registro_minedu ? (
                                                        <span className="inline-block bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-lg border border-emerald-200 text-[10px]">
                                                            {item.acta.codigo_registro_minedu}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 text-[10px] italic">No registrado</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => abrirModalRegistro(item)}
                                                            className="rounded-lg bg-[#315d7a] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#274b63] transition shadow-2xs cursor-pointer"
                                                        >
                                                            {tieneDiploma ? 'Editar' : 'Registrar'}
                                                        </button>
                                                        {tieneDiploma && (
                                                            <a
                                                                href={route('titulacion-registro.pdf', item.id)}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                title="Constancia de Registro de Título"
                                                                className="rounded-lg border border-purple-200 bg-white p-1 text-purple-700 hover:bg-purple-50 transition shadow-2xs"
                                                            >
                                                                📄
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
                                            No se encontraron títulos registrados en el Libro Oficial.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* PAGINACIÓN */}
                {titulaciones.links?.length > 3 && (
                    <div className="flex flex-wrap justify-end gap-1">
                        {titulaciones.links.map((link, index) => (
                            <button
                                key={index}
                                type="button"
                                disabled={!link.url || cargando}
                                onClick={() => {
                                    const pageNum = new URL(link.url).searchParams.get('page') || 1;
                                    filtrarLibro(Number(pageNum));
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

            {/* MODAL PARA ASENTAR TÍTULO EN LIBRO OFICIAL */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Asentar Título en Libro Oficial
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {titulacionActual?.estudiante?.apellidos}, {titulacionActual?.estudiante?.nombres} (DNI: {titulacionActual?.estudiante?.dni})
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

                        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Resolución Directoral de Otorgamiento <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.resolucion_director}
                                    onChange={(e) => setData('resolucion_director', e.target.value)}
                                    placeholder="ej. R.D. N° 045-2026-IES-T"
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 font-bold outline-none focus:border-[#315d7a]"
                                />
                                <InputError message={errors.resolucion_director} className="mt-1" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Número de Diploma <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.numero_diploma}
                                        onChange={(e) => setData('numero_diploma', e.target.value)}
                                        placeholder="ej. DIP-2026-00123"
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 font-mono font-bold outline-none focus:border-[#315d7a]"
                                    />
                                    <InputError message={errors.numero_diploma} className="mt-1" />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Código Registro MINEDU / REGISTRA
                                    </label>
                                    <input
                                        type="text"
                                        value={data.codigo_registro_minedu}
                                        onChange={(e) => setData('codigo_registro_minedu', e.target.value)}
                                        placeholder="ej. 26-0123-REG"
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 font-mono outline-none focus:border-[#315d7a]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Libro de Grados y Títulos <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.libro}
                                        onChange={(e) => setData('libro', e.target.value)}
                                        placeholder="ej. LIB-01"
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 font-mono font-bold outline-none focus:border-[#315d7a]"
                                    />
                                    <InputError message={errors.libro} className="mt-1" />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Número de Folio <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.folio}
                                        onChange={(e) => setData('folio', e.target.value)}
                                        placeholder="ej. 045"
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 font-mono font-bold outline-none focus:border-[#315d7a]"
                                    />
                                    <InputError message={errors.folio} className="mt-1" />
                                </div>
                            </div>

                            <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 text-[11px] text-purple-800">
                                💡 Al asentar el título, la condición académica del egresado cambiará oficialmente a <strong>Titulado</strong>.
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
                                    {processing ? 'Asentando...' : 'Asentar en Libro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}