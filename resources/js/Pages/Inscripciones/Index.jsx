import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function Index({ inscripciones, filtros, admisiones = [], planesEstudio = [], resumen }) {
    const [search, setSearch] = useState(filtros.buscar || '');
    const [admisionId, setAdmisionId] = useState(filtros.admision_id || '');
    const [planId, setPlanId] = useState(filtros.plan_id || '');
    const [estado, setEstado] = useState(filtros.estado || 'todos');

    // Filtro AJAX Automático
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                route('inscripciones.index'),
                { buscar: search, admision_id: admisionId, plan_id: planId, estado },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [search, admisionId, planId, estado]);

    const cambiarEstadoInscripcion = (ins, nuevoEstado) => {
        router.patch(
            route('inscripciones.cambiar-estado', ins.id_inscripcion),
            { estado: nuevoEstado },
            { preserveScroll: true }
        );
    };

    const eliminarInscripcion = (ins) => {
        Swal.fire({
            title: '¿Eliminar inscripción?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Eliminar',
        }).then((res) => {
            if (res.isConfirmed) {
                router.delete(route('inscripciones.destroy', ins.id_inscripcion), {
                    preserveScroll: true,
                    onSuccess: () => Swal.fire('Eliminado', '', 'success'),
                });
            }
        });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-slate-900">Inscripciones</h1>}>
            <Head title="Inscripciones" />

            <div className="w-full space-y-6">
                <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Procesos de Inscripción</h2>
                        <p className="mt-1 text-sm text-slate-500">Gestione y supervise las postulaciónes recibidas.</p>
                    </div>

                    <Link
                        href={route('inscripciones.create')}
                        className="inline-flex justify-center rounded-lg bg-[#315d7a] px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-[#274b63]"
                    >
                        + Nueva Inscripción
                    </Link>
                </div>

                {/* FILTROS EN TIEMPO REAL */}
                <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
                    <input
                        type="text"
                        placeholder="Buscar DNI, código o nombres..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#315d7a]/20"
                    />

                    <select
                        value={admisionId}
                        onChange={(e) => setAdmisionId(e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#315d7a]/20"
                    >
                        <option value="">Todas las admisiones</option>
                        {admisiones.map((a) => (
                            <option key={a.id_admision} value={a.id_admision}>{a.nombre}</option>
                        ))}
                    </select>

                    <select
                        value={planId}
                        onChange={(e) => setPlanId(e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#315d7a]/20"
                    >
                        <option value="">Todos los planes</option>
                        {planesEstudio.map((p) => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                    </select>

                    <select
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#315d7a]/20"
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="inscrito">Inscrito</option>
                        <option value="observado">Observado</option>
                        <option value="subsanado">Subsanado</option>
                        <option value="aceptado">Aceptado</option>
                        <option value="matriculado">Matriculado</option>
                    </select>
                </div>

                {/* TABLA */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                            <tr>
                                <th className="px-4 py-3">Postulante</th>
                                <th className="px-4 py-3">Admisión</th>
                                <th className="px-4 py-3">Plan de Estudio</th>
                                <th className="px-4 py-3 text-center">Estado</th>
                                <th className="px-4 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {inscripciones.data && inscripciones.data.length > 0 ? (
                                inscripciones.data.map((ins) => (
                                    <tr key={ins.id_inscripcion} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-semibold text-slate-800">
                                            {ins.postulante ? `${ins.postulante.apellidos}, ${ins.postulante.nombres}` : '—'}
                                            <div className="font-mono text-[11px] font-normal text-slate-400">DNI: {ins.postulante?.dni}</div>
                                        </td>
                                        <td className="px-4 py-3">{ins.admision?.nombre || '—'}</td>
                                        <td className="px-4 py-3">{ins.plan_estudio?.nombre || '—'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <select
                                                value={ins.estado}
                                                onChange={(e) => cambiarEstadoInscripcion(ins, e.target.value)}
                                                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold outline-none cursor-pointer"
                                            >
                                                <option value="inscrito">Inscrito</option>
                                                <option value="observado">Observado</option>
                                                <option value="subsanado">Subsanado</option>
                                                <option value="aceptado">Aceptado</option>
                                                <option value="matriculado">Matriculado</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <Link
                                                href={route('inscripciones.edit', ins.id_inscripcion)}
                                                className="inline-flex rounded border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                            >
                                                Editar
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => eliminarInscripcion(ins)}
                                                className="inline-flex rounded border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                                        No se encontraron inscripciones.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}