import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useEffect, useRef, useState } from 'react';

export default function Index({ modalidades: modalidadesIniciales, filtros: filtrosIniciales }) {
    const { flash } = usePage().props;

    const [modalidades, setModalidades] = useState(modalidadesIniciales);
    const [buscar, setBuscar] = useState(filtrosIniciales?.buscar || '');
    const [estado, setEstado] = useState(filtrosIniciales?.estado || '');
    const [cargando, setCargando] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalidadEnEdicion, setModalidadEnEdicion] = useState(null);

    const primeraCarga = useRef(true);
    const abortControllerRef = useRef(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nombre: '',
        descripcion: '',
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

    // Filtrado asíncrono con Axios
    const filtrarModalidades = async (page = 1) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        setCargando(true);

        try {
            const response = await axios.post(
                route('titulacion-modalidades.filtrar'),
                {
                    buscar: buscar.trim() || null,
                    estado: estado || null,
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

            setModalidades(response.data.modalidades);
        } catch (error) {
            if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
                return;
            }
            Swal.fire({
                icon: 'error',
                title: 'Error al filtrar',
                text: error.response?.data?.message || 'No se pudieron consultar las modalidades.',
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
            filtrarModalidades(1);
        }, 350);

        return () => clearTimeout(timer);
    }, [buscar, estado]);

    const abrirModalCrear = () => {
        setModalidadEnEdicion(null);
        reset();
        clearErrors();
        setData({
            nombre: '',
            descripcion: '',
            activo: true,
        });
        setModalOpen(true);
    };

    const abrirModalEditar = (modalidad) => {
        setModalidadEnEdicion(modalidad);
        clearErrors();
        setData({
            nombre: modalidad.nombre || '',
            descripcion: modalidad.descripcion || '',
            activo: Boolean(modalidad.activo),
        });
        setModalOpen(true);
    };

    const cerrarModal = () => {
        setModalOpen(false);
        setModalidadEnEdicion(null);
        reset();
        clearErrors();
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (modalidadEnEdicion) {
            put(route('titulacion-modalidades.update', modalidadEnEdicion.id), {
                preserveScroll: true,
                onSuccess: () => {
                    cerrarModal();
                    filtrarModalidades(modalidades.current_page ?? 1);
                },
            });
        } else {
            post(route('titulacion-modalidades.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    cerrarModal();
                    filtrarModalidades(1);
                },
            });
        }
    };

    const toggleEstado = (modalidad) => {
        router.patch(
            route('titulacion-modalidades.estado', modalidad.id),
            { activo: !modalidad.activo },
            {
                preserveScroll: true,
                onSuccess: () => filtrarModalidades(modalidades.current_page ?? 1),
            }
        );
    };

    const eliminarModalidad = async (modalidad) => {
        const result = await Swal.fire({
            title: '¿Eliminar modalidad?',
            text: `Se removerá la modalidad "${modalidad.nombre}". Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        });

        if (!result.isConfirmed) return;

        router.delete(route('titulacion-modalidades.destroy', modalidad.id), {
            preserveScroll: true,
            onSuccess: () => filtrarModalidades(modalidades.current_page ?? 1),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Modalidades de Titulación</h1>
                        <p className="text-xs text-slate-500">Configuración de vías reglamentarias para obtención de título profesional.</p>
                    </div>
                    <button
                        type="button"
                        onClick={abrirModalCrear}
                        className="rounded-xl bg-[#315d7a] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#274b63] shadow-xs cursor-pointer"
                    >
                        + Nueva Modalidad
                    </button>
                </div>
            }
        >
            <Head title="Modalidades de Titulación" />

            <div className="space-y-5">
                {/* BARRA DE BÚSQUEDA Y FILTRO */}
                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:grid-cols-4">
                    <input
                        type="search"
                        value={buscar}
                        onChange={(e) => setBuscar(e.target.value)}
                        placeholder="Buscar modalidad o descripción..."
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs md:col-span-2 outline-none focus:border-[#315d7a]"
                    />

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
                                    <th className="py-3 px-4">Modalidad Reglamentaria</th>
                                    <th className="py-3 px-4">Descripción / Alcance</th>
                                    <th className="py-3 px-4 text-center w-36">Expedientes</th>
                                    <th className="py-3 px-4 text-center w-28">Estado</th>
                                    <th className="py-3 px-4 text-right w-36">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {modalidades.data.length > 0 ? (
                                    modalidades.data.map((mod, idx) => (
                                        <tr key={mod.id} className="hover:bg-slate-50 transition">
                                            <td className="py-3 px-4 text-center font-mono text-slate-400">
                                                {(modalidades.current_page - 1) * modalidades.per_page + idx + 1}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="font-bold text-slate-900 block">{mod.nombre}</span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-600 max-w-sm truncate">
                                                {mod.descripcion || <span className="text-slate-400 italic">Sin descripción</span>}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="bg-sky-50 text-[#315d7a] font-bold font-mono px-2.5 py-0.5 rounded-full border border-sky-200 text-[11px]">
                                                    {mod.titulaciones_count ?? 0} egresados
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleEstado(mod)}
                                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer border ${
                                                        mod.activo
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                                    }`}
                                                >
                                                    {mod.activo ? 'Activo' : 'Inactivo'}
                                                </button>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => abrirModalEditar(mod)}
                                                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => eliminarModalidad(mod)}
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
                                            No se encontraron modalidades de titulación registradas.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* PAGINACIÓN */}
                {modalidades.links?.length > 3 && (
                    <div className="flex flex-wrap justify-end gap-1">
                        {modalidades.links.map((link, index) => (
                            <button
                                key={index}
                                type="button"
                                disabled={!link.url || cargando}
                                onClick={() => {
                                    const pageNum = new URL(link.url).searchParams.get('page') || 1;
                                    filtrarModalidades(Number(pageNum));
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
                                    {modalidadEnEdicion ? 'Editar Modalidad de Titulación' : 'Nueva Modalidad de Titulación'}
                                </h3>
                                <p className="text-xs text-slate-500">Defina la vía oficial para la obtención del título.</p>
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
                                    Nombre de la Modalidad <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.nombre}
                                    onChange={(e) => setData('nombre', e.target.value)}
                                    placeholder="Ej. Tesis de Investigación, Examen de Suficiencia..."
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                />
                                <InputError message={errors.nombre} className="mt-1" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Descripción / Base Reglamentaria (Opcional)
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.descripcion}
                                    onChange={(e) => setData('descripcion', e.target.value)}
                                    placeholder="Requisitos específicos o lineamientos de la modalidad..."
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                />
                                <InputError message={errors.descripcion} className="mt-1" />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="activo_modalidad"
                                    checked={data.activo}
                                    onChange={(e) => setData('activo', e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-[#315d7a] focus:ring-[#315d7a]"
                                />
                                <label htmlFor="activo_modalidad" className="text-xs font-semibold text-slate-700 cursor-pointer">
                                    Modalidad activa para trámites de egresados
                                </label>
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
                                    {processing ? 'Guardando...' : modalidadEnEdicion ? 'Actualizar' : 'Guardar Modalidad'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}