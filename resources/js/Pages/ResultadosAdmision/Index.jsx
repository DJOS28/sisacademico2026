import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';

export default function Index({ resultados, filtros, admisiones = [], planesEstudio = [] }) {
    const [search, setSearch] = useState(filtros.buscar || '');
    const [procesoId, setProcesoId] = useState(filtros.id_proceso || '');
    const [planId, setPlanId] = useState(filtros.plan_estudio_id || '');
    const [estado, setEstado] = useState(filtros.estado || '');
    const [modalImportar, setModalImportar] = useState(false);

    // Formulario para carga masiva de Excel/CSV
    const {
        data: formExcel,
        setData: setFormExcel,
        post: postImportar,
        processing: subiendo,
        errors: excelErrors,
        reset: resetExcel,
        clearErrors: clearExcelErrors,
    } = useForm({
        id_proceso: filtros.id_proceso || '',
        archivo_excel: null,
    });

    const aplicarFiltros = (e) => {
        e.preventDefault();
        router.get(
            route('resultados-admision.index'),
            {
                buscar: search,
                id_proceso: procesoId,
                plan_estudio_id: planId,
                estado: estado,
            },
            { preserveState: true, replace: true }
        );
    };

    const limpiarFiltros = () => {
        setSearch('');
        setProcesoId('');
        setPlanId('');
        setEstado('');
        router.get(route('resultados-admision.index'));
    };

    const eliminarResultado = (id) => {
        Swal.fire({
            title: '¿Eliminar resultado?',
            text: 'Esta acción eliminará la calificación asignada al postulante.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('resultados-admision.destroy', id), {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire('Eliminado', 'El resultado fue removido correctamente.', 'success');
                    },
                });
            }
        });
    };

    const manejarSubida = (e) => {
        e.preventDefault();
        postImportar(route('resultados-admision.importar'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setModalImportar(false);
                resetExcel();
                clearExcelErrors();
                Swal.fire({
                    icon: 'success',
                    title: '¡Importación completada!',
                    text: 'Los resultados se procesaron y guardaron correctamente.',
                    confirmButtonColor: '#315d7a',
                });
            },
        });
    };

    const getEstadoBadge = (est) => {
        switch (est) {
            case 'con_vacante':
                return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">✓ Alcanzó Vacante</span>;
            case 'sin_vacante':
                return <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">✕ Sin Vacante</span>;
            case 'ausente':
                return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">⚑ Ausente</span>;
            case 'anulado':
                return <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">⊘ Anulado</span>;
            default:
                return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{est}</span>;
        }
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-slate-900">Resultados de Admisión</h1>}>
            <Head title="Resultados de Admisión" />

            <div className="w-full space-y-6">
                {/* CABECERA Y ACCIONES */}
                <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Calificaciones y Asignación de Vacantes</h2>
                        <p className="mt-1 text-sm text-slate-500">Gestione los puntajes e ingrese postulantes seleccionados por proceso.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <a
                            href={route('resultados-admision.plantilla')}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            📥 Plantilla Excel
                        </a>
                        <button
                            type="button"
                            onClick={() => {
                                clearExcelErrors();
                                setModalImportar(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                            📊 Subir Excel
                        </button>
                        <Link
                            href={route('resultados-admision.create')}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#315d7a] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#274b63]"
                        >
                            + Registro Manual
                        </Link>
                    </div>
                </div>

                {/* FILTROS DE BÚSQUEDA Y PROCESO */}
                <form onSubmit={aplicarFiltros} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <div className="lg:col-span-2">
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Buscar Postulante</label>
                            <input
                                type="text"
                                placeholder="DNI, Nombres, Apellidos o Código..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a]"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Proceso de Admisión</label>
                            <select
                                value={procesoId}
                                onChange={(e) => setProcesoId(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a]"
                            >
                                <option value="">-- Todos los procesos --</option>
                                {admisiones.map((a) => (
                                    <option key={a.id_admision} value={a.id_admision}>
                                        {a.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Programa de Estudio</label>
                            <select
                                value={planId}
                                onChange={(e) => setPlanId(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a]"
                            >
                                <option value="">-- Todos los programas --</option>
                                {planesEstudio.map((pe) => (
                                    <option key={pe.id} value={pe.id}>
                                        {pe.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Estado Vacante</label>
                            <select
                                value={estado}
                                onChange={(e) => setEstado(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a]"
                            >
                                <option value="">-- Todos --</option>
                                <option value="con_vacante">Con Vacante</option>
                                <option value="sin_vacante">Sin Vacante</option>
                                <option value="ausente">Ausente</option>
                                <option value="anulado">Anulado</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                            Limpiar
                        </button>
                        <button
                            type="submit"
                            className="rounded-lg bg-[#315d7a] px-5 py-2 text-xs font-bold text-white shadow hover:bg-[#274b63]"
                        >
                            Filtrar Resultados
                        </button>
                    </div>
                </form>

                {/* TABLA DE RESULTADOS */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-700">
                                <tr>
                                    <th className="px-6 py-3.5">Código / DNI</th>
                                    <th className="px-6 py-3.5">Postulante</th>
                                    <th className="px-6 py-3.5">Proceso</th>
                                    <th className="px-6 py-3.5">Programa / Carrera</th>
                                    <th className="px-6 py-3.5 text-center">Nota Final</th>
                                    <th className="px-6 py-3.5 text-center">Condición</th>
                                    <th className="px-6 py-3.5 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {resultados.data.length > 0 ? (
                                    resultados.data.map((res) => (
                                        <tr key={res.id} className="hover:bg-slate-50/80 transition">
                                            <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900">
                                                <div>{res.postulante?.codigo_postulante || 'S/C'}</div>
                                                <div className="text-[11px] font-normal text-slate-400">DNI: {res.postulante?.dni}</div>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-900">
                                                {res.postulante?.apellidos}, {res.postulante?.nombres}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-600">
                                                {res.admision?.nombre}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-700">
                                                {res.plan_estudio?.nombre}
                                            </td>
                                            <td className="px-6 py-4 text-center font-mono text-base font-extrabold text-[#315d7a]">
                                                {Number(res.nota).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {getEstadoBadge(res.estado)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <Link
                                                        href={route('resultados-admision.show', res.id)}
                                                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                                                    >
                                                        Ver
                                                    </Link>
                                                    <Link
                                                        href={route('resultados-admision.edit', res.id)}
                                                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#315d7a] hover:bg-slate-100"
                                                    >
                                                        Editar
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => eliminarResultado(res.id)}
                                                        className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-10 text-center text-sm italic text-slate-400">
                                            No se encontraron resultados de admisión para el filtro seleccionado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINACIÓN */}
                    {resultados.links && resultados.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3.5 text-xs text-slate-500">
                            <div>Mostrando {resultados.from} a {resultados.to} de {resultados.total} resultados</div>
                            <div className="flex gap-1">
                                {resultados.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                                            link.active
                                                ? 'bg-[#315d7a] text-white'
                                                : link.url
                                                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                : 'text-slate-300 pointer-events-none'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DE IMPORTACIÓN MASIVA */}
            {modalImportar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-800">Carga Masiva de Resultados</h3>
                            <button
                                type="button"
                                onClick={() => setModalImportar(false)}
                                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={manejarSubida} className="mt-4 space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Proceso de Admisión Destino *
                                </label>
                                <select
                                    required
                                    value={formExcel.id_proceso}
                                    onChange={(e) => setFormExcel('id_proceso', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a]"
                                >
                                    <option value="">-- Seleccione Proceso --</option>
                                    {admisiones.map((a) => (
                                        <option key={a.id_admision} value={a.id_admision}>
                                            {a.nombre}
                                        </option>
                                    ))}
                                </select>
                                {excelErrors.id_proceso && (
                                    <p className="mt-1 text-xs text-rose-600">{excelErrors.id_proceso}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Archivo Excel / CSV *
                                </label>
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    required
                                    onChange={(e) => setFormExcel('archivo_excel', e.target.files[0])}
                                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-[#315d7a]/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#315d7a]"
                                />
                                {excelErrors.archivo_excel && (
                                    <div className="mt-2 max-h-36 overflow-y-auto rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
                                        {Array.isArray(excelErrors.archivo_excel) ? (
                                            excelErrors.archivo_excel.map((err, i) => <div key={i}>• {err}</div>)
                                        ) : (
                                            <div>{excelErrors.archivo_excel}</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setModalImportar(false)}
                                    className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={subiendo}
                                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {subiendo ? (
                                        <>
                                            <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4Z" />
                                            </svg>
                                            Procesando...
                                        </>
                                    ) : (
                                        'Procesar e Importar'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}