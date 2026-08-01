import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { useEffect, useRef, useState } from 'react';

export default function Index({ convalidaciones, periodos, estados, filtros = {} }) {
    const [buscar, setBuscar] = useState(filtros.buscar ?? '');
    const [periodoId, setPeriodoId] = useState(filtros.periodo_id ?? '');
    const [estado, setEstado] = useState(filtros.estado ?? '');
    const [cargando, setCargando] = useState(false);

    const primeraCarga = useRef(true);

    // Modal de edición rápida
    const [modalEditar, setModalEditar] = useState(false);
    const [itemEditar, setItemEditar] = useState(null);
    const [formEdit, setFormEdit] = useState({
        institucion_origen: '',
        curso_origen: '',
        nota_origen: '',
        fecha_convalidacion: '',
        estado: 'Pendiente',
        observaciones: '',
    });

    /**
     * Ejecuta el filtro mediante POST preserving state y scroll.
     */
    const filtrar = (
        termino = buscar,
        periodo = periodoId,
        est = estado,
        pagina = 1,
        mantenerScroll = true
    ) => {
        setCargando(true);

        router.post(
            route('convalidaciones.filtrar'),
            {
                buscar: termino.trim(),
                periodo_id: periodo,
                estado: est,
                page: pagina,
            },
            {
                preserveState: true,
                preserveScroll: mantenerScroll,
                replace: true,
                only: ['convalidaciones', 'filtros'],

                onError: () => {
                    Swal.fire({
                        title: 'Error',
                        text: 'No se pudo realizar la búsqueda.',
                        icon: 'error',
                        confirmButtonText: 'Aceptar',
                    });
                },

                onFinish: () => {
                    setCargando(false);
                },
            }
        );
    };

    /**
     * Debounce de búsqueda automática.
     */
    useEffect(() => {
        if (primeraCarga.current) {
            primeraCarga.current = false;
            return;
        }

        const temporizador = setTimeout(() => {
            filtrar(buscar, periodoId, estado, 1);
        }, 400);

        return () => clearTimeout(temporizador);
    }, [buscar, periodoId, estado]);

    /**
     * Paginación.
     */
    const cambiarPagina = (pagina) => {
        if (
            pagina < 1 ||
            pagina > convalidaciones.last_page ||
            pagina === convalidaciones.current_page
        ) {
            return;
        }

        filtrar(buscar, periodoId, estado, pagina, false);
    };

    /**
     * SweetAlert2 para eliminar.
     */
    const eliminar = async (item) => {
        const result = await Swal.fire({
            title: '¿Eliminar expediente?',
            text: `Se eliminará la convalidación de ${item.estudiante?.nombres} en ${item.curso_destino?.nombre}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        router.delete(route('convalidaciones.destroy', item.id), {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: 'Eliminado',
                    text: 'El expediente fue eliminado correctamente.',
                    icon: 'success',
                    timer: 1800,
                    showConfirmButton: false,
                });
            },
            onError: (errors) => {
                Swal.fire({
                    title: 'No se pudo eliminar',
                    text: errors?.error ?? 'Error inesperado al intentar eliminar.',
                    icon: 'error',
                    confirmButtonText: 'Aceptar',
                });
            },
        });
    };

    /**
     * Edición modal.
     */
    const abrirModalEditar = (item) => {
        setItemEditar(item);
        setFormEdit({
            institucion_origen: item.institucion_origen || '',
            curso_origen: item.curso_origen || '',
            nota_origen: item.nota_origen || '',
            fecha_convalidacion: item.fecha_convalidacion || '',
            estado: item.estado || 'Pendiente',
            observaciones: item.observaciones || '',
        });
        setModalEditar(true);
    };

    const guardarEdicion = (e) => {
        e.preventDefault();
        router.put(route('convalidaciones.update', itemEditar.id), formEdit, {
            preserveScroll: true,
            onSuccess: () => {
                setModalEditar(false);
                Swal.fire({
                    title: 'Guardado',
                    text: 'La convalidación fue actualizada.',
                    icon: 'success',
                    timer: 1800,
                    showConfirmButton: false,
                });
            },
        });
    };

    const obtenerPaginas = () => {
        const paginaActual = convalidaciones.current_page;
        const ultimaPagina = convalidaciones.last_page;
        const paginas = [];

        let inicio = Math.max(1, paginaActual - 2);
        let fin = Math.min(ultimaPagina, paginaActual + 2);

        if (paginaActual <= 3) fin = Math.min(5, ultimaPagina);
        if (paginaActual >= ultimaPagina - 2) inicio = Math.max(1, ultimaPagina - 4);

        for (let pagina = inicio; pagina <= fin; pagina++) {
            paginas.push(pagina);
        }

        return paginas;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Convalidaciones Académicas
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Acreditación y homologación de asignaturas cursadas.
                        </p>
                    </div>

                    <Link
                        href={route('convalidaciones.create')}
                        className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#274b63]"
                    >
                        Nuevo expediente
                    </Link>
                </div>
            }
        >
            <Head title="Convalidaciones" />

            {/* Panel de Filtros */}
            <div className="mb-5 grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Buscar (DNI, Estudiante, Curso)
                    </label>
                    <div className="relative">
                        <input
                            type="search"
                            value={buscar}
                            onChange={(e) => setBuscar(e.target.value)}
                            placeholder="Escriba para buscar..."
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                        />
                        {cargando && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#315d7a]" />
                        )}
                    </div>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Periodo Lectivo
                    </label>
                    <select
                        value={periodoId}
                        onChange={(e) => setPeriodoId(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                    >
                        <option value="">-- Todos los Periodos --</option>
                        {periodos?.map((p) => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Estado
                    </label>
                    <select
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                    >
                        <option value="">-- Todos los Estados --</option>
                        {estados?.map((e) => (
                            <option key={e} value={e}>{e}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tabla principal */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Estudiante
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Curso Destino
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Curso / Inst. Origen
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Nota
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Estado
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Acciones
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {convalidaciones.data.length > 0 ? (
                                convalidaciones.data.map((item) => (
                                    <tr key={item.id} className="transition hover:bg-slate-50">
                                        <td className="px-4 py-3 text-sm">
                                            <div className="font-semibold text-slate-800">
                                                {item.estudiante ? `${item.estudiante.apellidos}, ${item.estudiante.nombres}` : '---'}
                                            </div>
                                            <div className="text-xs text-slate-400">DNI: {item.estudiante?.dni || '---'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                                            {item.curso_destino?.nombre || '---'}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div className="text-slate-800 font-medium">{item.curso_origen}</div>
                                            <div className="text-xs text-slate-400">{item.institucion_origen}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-800">
                                            {item.nota_origen ? Number(item.nota_origen).toFixed(1) : '---'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                item.estado === 'Aprobado' ? 'bg-emerald-100 text-emerald-800' :
                                                item.estado === 'Rechazado' ? 'bg-rose-100 text-rose-800' :
                                                'bg-amber-100 text-amber-800'
                                            }`}>
                                                {item.estado}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end items-center gap-1.5">
                                                {/* BOTÓN VER CONSTANCIA PDF */}
                                                <a
                                                    href={route('convalidaciones.pdf', item.id)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-teal-200 bg-teal-50 text-teal-700 transition hover:bg-teal-100 hover:text-teal-800 shadow-sm"
                                                    title="Descargar Constancia PDF"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6M16 13H8m8 4H8m2-8H8" />
                                                    </svg>
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => abrirModalEditar(item)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100"
                                                    title="Editar Convalidación"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => eliminar(item)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                                                    title="Eliminar Expediente"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center">
                                        <p className="text-sm font-semibold text-slate-600">No se encontraron expedientes.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {convalidaciones.total > 0 && (
                    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                            Mostrando <span className="font-semibold text-slate-700">{convalidaciones.from}</span> a <span className="font-semibold text-slate-700">{convalidaciones.to}</span> de <span className="font-semibold text-slate-700">{convalidaciones.total}</span> registros
                        </p>

                        {convalidaciones.last_page > 1 && (
                            <div className="flex flex-wrap items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => cambiarPagina(convalidaciones.current_page - 1)}
                                    disabled={convalidaciones.current_page === 1 || cargando}
                                    className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
                                >
                                    Anterior
                                </button>

                                {obtenerPaginas().map((pagina) => (
                                    <button
                                        key={pagina}
                                        type="button"
                                        onClick={() => cambiarPagina(pagina)}
                                        disabled={cargando}
                                        className={`h-8 min-w-8 rounded-md px-2 text-xs font-semibold transition ${
                                            pagina === convalidaciones.current_page
                                                ? 'bg-[#315d7a] text-white'
                                                : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        {pagina}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => cambiarPagina(convalidaciones.current_page + 1)}
                                    disabled={convalidaciones.current_page === convalidaciones.last_page || cargando}
                                    className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de edición */}
            {modalEditar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="font-bold text-slate-800">Actualizar Convalidación</h3>
                            <button onClick={() => setModalEditar(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
                        </div>
                        <form onSubmit={guardarEdicion} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Institución Origen</label>
                                <input
                                    type="text"
                                    required
                                    value={formEdit.institucion_origen}
                                    onChange={(e) => setFormEdit({ ...formEdit, institucion_origen: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 text-sm focus:border-[#315d7a] focus:ring-[#315d7a]/20"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Curso Origen</label>
                                <input
                                    type="text"
                                    required
                                    value={formEdit.curso_origen}
                                    onChange={(e) => setFormEdit({ ...formEdit, curso_origen: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 text-sm focus:border-[#315d7a] focus:ring-[#315d7a]/20"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nota Origen (0 - 20)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="20"
                                        required
                                        value={formEdit.nota_origen}
                                        onChange={(e) => setFormEdit({ ...formEdit, nota_origen: e.target.value })}
                                        className="w-full rounded-lg border-slate-300 text-sm focus:border-[#315d7a] focus:ring-[#315d7a]/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha</label>
                                    <input
                                        type="date"
                                        required
                                        value={formEdit.fecha_convalidacion}
                                        onChange={(e) => setFormEdit({ ...formEdit, fecha_convalidacion: e.target.value })}
                                        className="w-full rounded-lg border-slate-300 text-sm focus:border-[#315d7a] focus:ring-[#315d7a]/20"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Estado</label>
                                <select
                                    value={formEdit.estado}
                                    onChange={(e) => setFormEdit({ ...formEdit, estado: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 text-sm focus:border-[#315d7a] focus:ring-[#315d7a]/20"
                                >
                                    {estados?.map((est) => (
                                        <option key={est} value={est}>{est}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Observaciones</label>
                                <textarea
                                    rows="2"
                                    value={formEdit.observaciones}
                                    onChange={(e) => setFormEdit({ ...formEdit, observaciones: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 text-sm focus:border-[#315d7a] focus:ring-[#315d7a]/20"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t">
                                <button
                                    type="button"
                                    onClick={() => setModalEditar(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-semibold text-white bg-[#315d7a] hover:bg-[#274b63] rounded-lg transition"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}