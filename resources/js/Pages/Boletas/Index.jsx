import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function Index({ periodoActivo }) {
    const [dniBusqueda, setDniBusqueda] = useState('');
    const [buscando, setBuscando] = useState(false);
    const [estudianteInfo, setEstudianteInfo] = useState(null);
    const [cursosMatriculados, setCursosMatriculados] = useState([]);
    const [urlPdf, setUrlPdf] = useState('');
    const [mensaje, setMensaje] = useState('');

    const buscarBoleta = async (e) => {
        if (e) e.preventDefault();

        if (!dniBusqueda.trim()) {
            Swal.fire({
                title: 'Atención',
                text: 'Ingrese el número de DNI del estudiante.',
                icon: 'warning',
                confirmButtonColor: '#315d7a',
            });
            return;
        }

        if (!periodoActivo) {
            Swal.fire({
                title: 'Error',
                text: 'No hay un periodo lectivo activo configurado en el sistema.',
                icon: 'error',
                confirmButtonColor: '#315d7a',
            });
            return;
        }

        setBuscando(true);
        setEstudianteInfo(null);
        setCursosMatriculados([]);
        setUrlPdf('');
        setMensaje('');

        try {
            const res = await axios.get(route('boleta_notas.buscar'), {
                params: {
                    dni: dniBusqueda.trim(),
                    periodo_id: periodoActivo.id,
                },
            });

            if (!res.data.encontrado || !res.data.matriculado) {
                setMensaje(res.data.mensaje);
                return;
            }

            setEstudianteInfo(res.data.estudiante);
            setCursosMatriculados(res.data.cursos);
            setUrlPdf(res.data.url_pdf); // 👈 Captura la URL firmada enviada desde Laravel
        } catch (error) {
            console.error('Error al consultar la boleta:', error);
            Swal.fire({
                title: 'Error',
                text: 'Ocurrió un inconveniente al consultar la información del estudiante.',
                icon: 'error',
                confirmButtonColor: '#315d7a',
            });
        } finally {
            setBuscando(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h1 className="text-2xl font-bold text-slate-900">
                    Consulta y Emisión de Boleta de Notas
                </h1>
            }
        >
            <Head title="Boleta de Notas" />

            <div className="w-full space-y-6">
                {/* BLOQUE DE BÚSQUEDA DNI Y PERIODO */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        {/* BUSCADOR DNI */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                DNI del Estudiante *
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={dniBusqueda}
                                    onChange={(e) => setDniBusqueda(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && buscarBoleta(e)}
                                    placeholder="Ej. 71851590"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                />
                                <button
                                    onClick={buscarBoleta}
                                    disabled={buscando}
                                    className="rounded-lg bg-[#315d7a] px-4 py-2 text-xs font-semibold text-white shadow hover:bg-[#274b63] transition disabled:opacity-50"
                                >
                                    {buscando ? 'Consultando...' : 'Buscar'}
                                </button>
                            </div>
                        </div>

                        {/* PERIODO LECTIVO */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Periodo Lectivo Activo
                            </label>
                            <input
                                type="text"
                                disabled
                                value={periodoActivo ? periodoActivo.nombre : 'Sin periodo activo'}
                                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 cursor-not-allowed"
                            />
                        </div>

                        {/* BOTÓN IMPRIMIR PDF SEGURO */}
                        {estudianteInfo && urlPdf && (
                            <div className="flex justify-end">
                                <a
                                    href={urlPdf} // 👈 Enlace directo firmado con token temporal de 30 minutos
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 transition"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    Imprimir Boleta PDF
                                </a>
                            </div>
                        )}
                    </div>

                    {/* MENSAJE DE ADVERTENCIA */}
                    {mensaje && (
                        <div className="mt-4 p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
                            <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>{mensaje}</span>
                        </div>
                    )}
                </div>

                {/* TABLA DE ASIGNATURAS Y NOTAS */}
                {estudianteInfo && (
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                        <div className="border-b pb-3 flex justify-between items-center">
                            <div>
                                <h2 className="text-base font-bold text-slate-800">
                                    {estudianteInfo.apellidos}, {estudianteInfo.nombres}
                                </h2>
                                <p className="text-xs text-slate-500">DNI: {estudianteInfo.dni}</p>
                            </div>
                            <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-semibold border border-slate-200">
                                Carga Lectiva Registrada
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-700">
                                <thead className="bg-slate-50 text-xs font-bold text-slate-600 uppercase border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">Asignatura / Unidad Didáctica</th>
                                        <th className="px-4 py-3 text-center">Créditos</th>
                                        <th className="px-4 py-3 text-center">Condición</th>
                                        <th className="px-4 py-3 text-right">Promedio Final</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {cursosMatriculados.map((c) => (
                                        <tr key={c.curso_id} className="hover:bg-slate-50/80 transition">
                                            <td className="px-4 py-3 font-semibold text-slate-800">
                                                {c.nombre}
                                            </td>
                                            <td className="px-4 py-3 text-center text-xs text-slate-600">
                                                {Number(c.creditos).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                                                    c.estado === 'Convalidado' ? 'bg-indigo-100 text-indigo-800' :
                                                    c.estado === 'Repitencia' ? 'bg-rose-100 text-rose-800' :
                                                    'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {c.estado || 'Inscrito'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-base">
                                                {c.promedio !== null ? (
                                                    <span className={c.promedio >= 13 ? 'text-emerald-700' : 'text-rose-600'}>
                                                        {Number(c.promedio).toFixed(1)}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs font-normal">Sin Nota</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}