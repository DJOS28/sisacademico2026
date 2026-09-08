import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function Matriculados({ periodos = [], semestres = [], planes = [] }) {
    const [periodoId, setPeriodoId] = useState('');
    const [semestreId, setSemestreId] = useState('');
    const [planId, setPlanId] = useState('');

    const [matriculados, setMatriculados] = useState([]);
    const [cargando, setCargando] = useState(false);

    // Consulta en segundo plano vía Axios al seleccionar los 3 filtros principales
    useEffect(() => {
        if (!periodoId || !semestreId || !planId) {
            setMatriculados([]);
            return;
        }

        const consultarMatriculados = async () => {
            setCargando(true);
            try {
                const response = await axios.get(route('reportes.matriculados.ajax'), {
                    params: {
                        periodo_id: periodoId,
                        semestre_id: semestreId,
                        plan_estudio_id: planId,
                    },
                });
                setMatriculados(response.data.matriculados || []);
            } catch (error) {
                console.error('Error al consultar reportes vía Axios:', error);
                Swal.fire('Error', 'No se pudieron recuperar los registros.', 'error');
            } finally {
                setCargando(false);
            }
        };

        consultarMatriculados();
    }, [periodoId, semestreId, planId]);

    /**
     * Genera la petición POST usando Axios + Blob.
     * Esto evita el error 419 (Page Expired) al reutilizar la sesión activa 
     * y abre la vista PDF en una URL Blob en memoria sin exponer parámetros en la URL.
     */
    const verPdfSeguro = async () => {
        if (!periodoId || !semestreId || !planId) return;

        try {
            Swal.fire({
                title: 'Generando PDF...',
                text: 'Por favor espere un momento',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const response = await axios.post(
                route('reportes.matriculados.pdf'),
                {
                    periodo_id: periodoId,
                    semestre_id: semestreId,
                    plan_estudio_id: planId,
                },
                { responseType: 'blob' }
            );

            Swal.close();

            // Crear una URL temporal del Blob
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);

            // Abrir en nueva pestaña
            window.open(fileURL, '_blank');
        } catch (error) {
            Swal.close();
            console.error('Error al generar el PDF:', error);
            Swal.fire('Error', 'No se pudo generar el reporte en PDF.', 'error');
        }
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-slate-900">Reporte de Matriculados</h1>}>
            <Head title="Reporte de Matrículas" />

            <div className="space-y-6">
                {/* Panel de Filtros Asíncronos */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-2">
                        Filtros de Búsqueda
                    </h2>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">Periodo Lectivo *</label>
                            <select
                                value={periodoId}
                                onChange={(e) => setPeriodoId(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#315d7a]"
                            >
                                <option value="">-- Seleccionar Periodo --</option>
                                {periodos.map((p) => (
                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">Ciclo / Semestre *</label>
                            <select
                                value={semestreId}
                                onChange={(e) => setSemestreId(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#315d7a]"
                            >
                                <option value="">-- Seleccionar Semestre --</option>
                                {semestres.map((s) => (
                                    <option key={s.id} value={s.id}>{s.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">Plan de Estudios *</label>
                            <select
                                value={planId}
                                onChange={(e) => setPlanId(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#315d7a]"
                            >
                                <option value="">-- Seleccionar Plan --</option>
                                {planes.map((pe) => (
                                    <option key={pe.id} value={pe.id}>{pe.nombre} ({pe.codigo})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tabla y Botón de Previsualización */}
                {periodoId && semestreId && planId && (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm space-y-4 p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">
                                    Estudiantes Matriculados ({matriculados.length})
                                </h3>
                                <p className="text-xs text-slate-500">Alumnos inscritos confirmados en este ciclo y periodo.</p>
                            </div>

                            <button
                                onClick={verPdfSeguro}
                                disabled={matriculados.length === 0 || cargando}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-red-700 disabled:opacity-50 transition cursor-pointer"
                            >
                                Ver PDF en Pantalla
                            </button>
                        </div>

                        {cargando ? (
                            <div className="p-10 text-center text-sm font-semibold text-[#315d7a]">
                                Buscando estudiantes matriculados...
                            </div>
                        ) : matriculados.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-700">
                                        <tr>
                                            <th className="px-6 py-3 text-center w-12">#</th>
                                            <th className="px-6 py-3">Cód. Matrícula</th>
                                            <th className="px-6 py-3">Código / DNI</th>
                                            <th className="px-6 py-3">Estudiante</th>
                                            <th className="px-6 py-3">Correo Electrónico</th>
                                            <th className="px-6 py-3 text-center">Teléfono</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {matriculados.map((m, index) => (
                                            <tr key={m.id} className="hover:bg-slate-50 transition">
                                                <td className="px-6 py-3.5 text-center font-bold text-slate-400">{index + 1}</td>
                                                <td className="px-6 py-3.5 font-mono text-xs font-bold text-[#315d7a]">{m.codigo_matricula}</td>
                                                <td className="px-6 py-3.5 font-mono text-xs text-slate-800">
                                                    <div>{m.codigo_alumno || 'S/C'}</div>
                                                    <div className="text-[11px] text-slate-400">DNI: {m.dni}</div>
                                                </td>
                                                <td className="px-6 py-3.5 font-semibold text-slate-800">{m.apellidos}, {m.nombres}</td>
                                                <td className="px-6 py-3.5 text-xs text-slate-600">{m.email}</td>
                                                <td className="px-6 py-3.5 text-center text-xs text-slate-600">{m.telefono || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-sm text-slate-400 italic">
                                No hay estudiantes matriculados bajo estos criterios de búsqueda.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}