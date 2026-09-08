import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function PagosIndex({ pagos = { data: [] }, filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const formAnular = useForm({});

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('pagos.index'), { search }, { preserveState: true });
    };

    const imprimirTicket = async (id) => {
        try {
            const response = await axios.post(route('pagos.ticket', id), {}, { responseType: 'blob' });
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');
        } catch (error) {
            Swal.fire('Error', 'No se pudo generar el ticket PDF', 'error');
        }
    };

    const handleAnular = (id, alumno) => {
        Swal.fire({
            title: '¿Anular este pago?',
            text: `Se anulará el cobro realizado a ${alumno}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, anular',
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            if (result.isConfirmed) {
                formAnular.delete(route('pagos.anular', id), {
                    onSuccess: () => Swal.fire('Anulado', 'El pago ha sido anulado.', 'success'),
                });
            }
        });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-slate-800">Historial de Cobros de Estudiantes</h1>}>
            <Head title="Cobros de Pago" />

            <div className="space-y-6">
                {/* Cabecera de Acciones */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por DNI o Nombre..."
                            className="w-full sm:w-64 rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#315d7a] outline-none"
                        />
                        <button type="submit" className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-900 transition">
                            Buscar
                        </button>
                    </form>

                    <Link
                        href={route('pagos.create')}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Nuevo Cobro
                    </Link>
                </div>

                {/* Tabla de Pagos */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 uppercase text-slate-500 font-bold border-b">
                                <tr>
                                    <th className="p-3"># Ticket</th>
                                    <th className="p-3">Estudiante / Postulante</th>
                                    <th className="p-3">Concepto</th>
                                    <th className="p-3">Monto</th>
                                    <th className="p-3">Fecha</th>
                                    <th className="p-3 text-center">Estado</th>
                                    <th className="p-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {pagos.data.map((p) => (
                                    <tr key={p.id_pagos} className="hover:bg-slate-50 transition">
                                        <td className="p-3 font-bold text-slate-800">#{String(p.id_pagos).padStart(6, '0')}</td>
                                        <td className="p-3 font-semibold text-slate-800">
                                            {p.postulante?.nombres} {p.postulante?.apellido_paterno}
                                            <span className="block text-[10px] text-slate-400 font-normal">DNI: {p.postulante?.nro_documento}</span>
                                        </td>
                                        <td className="p-3 text-slate-600">{p.concepto?.nombre}</td>
                                        <td className="p-3 font-bold text-slate-900">S/ {parseFloat(p.monto).toFixed(2)}</td>
                                        <td className="p-3 text-slate-500">{p.fecha}</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.estado === 'aceptado' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {p.estado?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => imprimirTicket(p.id_pagos)}
                                                    className="rounded bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                                                >
                                                    🖨️ PDF
                                                </button>
                                                {p.estado === 'aceptado' && (
                                                    <button
                                                        onClick={() => handleAnular(p.id_pagos, `${p.postulante?.nombres} ${p.postulante?.apellido_paterno}`)}
                                                        className="rounded bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-200 transition cursor-pointer"
                                                    >
                                                        Anular
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}