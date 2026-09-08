import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useEffect, useRef, useState } from 'react';

export default function Index({ requisitos: requisitosIniciales, filtros: filtrosIniciales }) {
    const { flash } = usePage().props;

    const [requisitos, setRequisitos] = useState(requisitosIniciales);
    const [buscar, setBuscar] = useState(filtrosIniciales?.buscar || '');
    const [estado, setEstado] = useState(filtrosIniciales?.estado || '');
    const [esObligatorio, setEsObligatorio] = useState(filtrosIniciales?.es_obligatorio || '');
    const [cargando, setCargando] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [requisitoEnEdicion, setRequisitoEnEdicion] = useState(null);

    const primeraCarga = useRef(true);
    const abortControllerRef = useRef(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nombre: '',
        descripcion: '',
        es_obligatorio: true,
        activo: true,
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

    const filtrarRequisitos = async (page = 1) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        setCargando(true);

        try {
            const response = await axios.post(
                route('titulacion-requisitos.filtrar'),
                {
                    buscar: buscar.trim() || null,
                    estado: estado || null,
                    es_obligatorio: esObligatorio || null,
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

            setRequisitos(response.data.requisitos);
        } catch (error) {
            if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
                return;
            }
            Swal.fire({
                icon: 'error',
                title: 'Error al filtrar',
                text: error.response?.data?.message || 'No se pudieron consultar los requisitos.',
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
            filtrarRequisitos(1);
        }, 350);

        return () => clearTimeout(timer);
    }, [buscar, estado, esObligatorio]);

    const abrirModalCrear = () => {
        setRequisitoEnEdicion(null);
        reset();
        clearErrors();
        setData({
            nombre: '',
            descripcion: '',
            es_obligatorio: true,
            activo: true,
        });
        setModalOpen(true);
    };

    const abrirModalEditar = (req) => {
        setRequisitoEnEdicion(req);
        clearErrors();
        setData({
            nombre: req.nombre || '',
            descripcion: req.descripcion || '',
            es_obligatorio: Boolean(req.es_obligatorio),
            activo: Boolean(req.activo),
        });
        setModalOpen(true);
    };

    const cerrarModal = () => {
        setModalOpen(false);
        setRequisitoEnEdicion(null);
        reset();
        clearErrors();
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (requisitoEnEdicion) {
            put(route('titulacion-requisitos.update', requisitoEnEdicion.id), {
                preserveScroll: true,
                onSuccess: () => {
                    cerrarModal();
                    filtrarRequisitos(requisitos.current_page ?? 1);
                },
            });
        } else {
            post(route('titulacion-requisitos.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    cerrarModal();
                    filtrarRequisitos(1);
                },
            });
        }
    };

    const toggleObligatorio = (req) => {
        router.patch(
            route('titulacion-requisitos.obligatorio', req.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => filtrarRequisitos(requisitos.current_page ?? 1),
            }
        );
    };

    const toggleEstado = (req) => {
        router.patch(
            route('titulacion-requisitos.estado', req.id),
            { activo: !req.activo },
            {
                preserveScroll: true,
                onSuccess: () => filtrarRequisitos(requisitos.current_page ?? 1),
            }
        );
    };

    const eliminarRequisito = async (req) => {
        const result = await Swal.fire({
            title: '¿Eliminar requisito?',
            text: `Se removerá "${req.nombre}". Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        });

        if (!result.isConfirmed) return;

        router.delete(route('titulacion-requisitos.destroy', req.id), {
            preserveScroll: true,
            onSuccess: () => filtrarRequisitos(requisitos.current_page ?? 1),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Requisitos Previos de Titulación</h1>
                        <p className="text-xs text-slate-500">Documentos obligatorios y acreditaciones previas al expediente.</p>
                    </div>
                    <button
                        type="button"
                        onClick={abrirModalCrear}
                        className="rounded-xl bg-[#315d7a] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#274b63] shadow-xs cursor-pointer"
                    >
                        + Nuevo Requisito
                    </button>
                </div>
            }
        >
            <Head title="Requisitos de Titulación" />

            <div className="space-y-5">
                {/* FILTROS */}
                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:grid-cols-4">
                    <input
                        type="search"
                        value={buscar}
                        onChange={(e) => setBuscar(e.target.value)}
                        placeholder="Buscar requisito o descripción..."
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-[#315d7a]"
                    />

                    <select
                        value={esObligatorio}
                        onChange={(e) => setEsObligatorio(e.target.value)}
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-[#315d7a]"
                    >
                        <option value="">Todas las condiciones</option>
                        <option value="1">Obligatorios</option>
                        <option value="0">Opcionales / Facultativos</option>
                    </select>

                    <select
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-[#315d7a]"
                    >
                        <option value="">Todos los estados</option>
                        <option value="Activo">Activos</option>
                        <option value="Inactivo">Inactivos</option>
                    </select>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setBuscar('');
                                setEsObligatorio('');
                                setEstado('');
                            }}
                            className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                        >
                            Limpiar
                        </button>
                        {cargando && <span className="text-xs font-medium text-[#315d7a]">Consultando...</span>}
                    </div>
                </div>

                {/* TABLA DE RESULTADOS */}
                <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition ${cargando ? 'opacity-60 pointer-events-none' : ''}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-4 w-12 text-center">#</th>
                                    <th className="py-3 px-4">Documento / Requisito</th>
                                    <th className="py-3 px-4">Descripción / Normativa</th>
                                    <th className="py-3 px-4 text-center w-36">Carácter</th>
                                    <th className="py-3 px-4 text-center w-28">Estado</th>
                                    <th className="py-3 px-4 text-right w-36">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {requisitos.data.length > 0 ? (
                                    requisitos.data.map((req, idx) => (
                                        <tr key={req.id} className="hover:bg-slate-50 transition">
                                            <td className="py-3 px-4 text-center font-mono text-slate-400">
                                                {(requisitos.current_page - 1) * requisitos.per_page + idx + 1}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="font-bold text-slate-900 block">{req.nombre}</span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-600 max-w-sm truncate">
                                                {req.descripcion || <span className="text-slate-400 italic">Sin especificación</span>}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleObligatorio(req)}
                                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                                                        req.es_obligatorio
                                                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    {req.es_obligatorio ? '⚠️ Obligatorio' : 'Opcional'}
                                                </button>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleEstado(req)}
                                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer border ${
                                                        req.activo
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                                    }`}
                                                >
                                                    {req.activo ? 'Activo' : 'Inactivo'}
                                                </button>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => abrirModalEditar(req)}
                                                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => eliminarRequisito(req)}
                                                        className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400 text-xs italic">
                                            No se encontraron requisitos registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* PAGINACIÓN */}
                {requisitos.links?.length > 3 && (
                    <div className="flex flex-wrap justify-end gap-1">
                        {requisitos.links.map((link, index) => (
                            <button
                                key={index}
                                type="button"
                                disabled={!link.url || cargando}
                                onClick={() => {
                                    const pageNum = new URL(link.url).searchParams.get('page') || 1;
                                    filtrarRequisitos(Number(pageNum));
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

            {/* MODAL CREAR / EDITAR */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    {requisitoEnEdicion ? 'Editar Requisito' : 'Nuevo Requisito de Titulación'}
                                </h3>
                                <p className="text-xs text-slate-500">Defina el documento o acreditación exigida al egresado.</p>
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
                                    Nombre del Requisito <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.nombre}
                                    onChange={(e) => setData('nombre', e.target.value)}
                                    placeholder="Ej. Constancia de EFSRT / Prácticas Pre-profesionales..."
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                />
                                <InputError message={errors.nombre} className="mt-1" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Descripción / Observación Legal
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.descripcion}
                                    onChange={(e) => setData('descripcion', e.target.value)}
                                    placeholder="Detalles sobre qué entidad emite el documento o vigencia..."
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                />
                                <InputError message={errors.descripcion} className="mt-1" />
                            </div>

                            <div className="space-y-2 pt-1">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="es_obligatorio"
                                        checked={data.es_obligatorio}
                                        onChange={(e) => setData('es_obligatorio', e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-[#315d7a] focus:ring-[#315d7a]"
                                    />
                                    <label htmlFor="es_obligatorio" className="text-xs font-semibold text-slate-700 cursor-pointer">
                                        Requisito obligatorio (Imprescindible para ser declarado Apto)
                                    </label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="activo_req"
                                        checked={data.activo}
                                        onChange={(e) => setData('activo', e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-[#315d7a] focus:ring-[#315d7a]"
                                    />
                                    <label htmlFor="activo_req" className="text-xs font-semibold text-slate-700 cursor-pointer">
                                        Requisito habilitado en el sistema
                                    </label>
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
                                    {processing ? 'Guardando...' : requisitoEnEdicion ? 'Actualizar' : 'Guardar Requisito'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}