import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import React, { useState } from 'react';

export default function MallaCurricular({ planes = [], semestres = [] }) {
    const [planIdSeleccionado, setPlanIdSeleccionado] = useState('');
    const [planData, setPlanData] = useState(null);
    const [cursosPorSemestre, setCursosPorSemestre] = useState({});
    const [totales, setTotales] = useState(null);
    const [cargando, setCargando] = useState(false);

    const cargarMalla = async (id) => {
        setPlanIdSeleccionado(id);
        if (!id) {
            setPlanData(null);
            setCursosPorSemestre({});
            setTotales(null);
            return;
        }

        setCargando(true);
        try {
            const response = await axios.post(route('planes.malla.ajax'), { plan_id: id });
            setPlanData(response.data.plan);
            setCursosPorSemestre(response.data.cursosPorSemestre || {});
            setTotales(response.data.totales);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error al consultar',
                text: error.response?.data?.message || 'No se pudo cargar la malla curricular.',
                confirmButtonColor: '#315d7a',
            });
            setPlanData(null);
        } finally {
            setCargando(false);
        }
    };

    const getTipoAbreviado = (tipo) => {
        const t = (tipo || '').toLowerCase();
        if (t.includes('especialidad')) return { abrev: 'O', nombre: 'Obligatorio / Especialidad' };
        if (t.includes('empleabilidad')) return { abrev: 'EMP', nombre: 'Empleabilidad' };
        if (t.includes('transversal')) return { abrev: 'TR', nombre: 'Transversal' };
        return { abrev: 'O', nombre: tipo || 'General' };
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Plan de Estudios Oficial</h1>
                        <p className="text-xs text-slate-500">Estructura curricular formal agrupada por Periodos lectivos.</p>
                    </div>
                    {planData && (
                        <a
                            href={route('planes.malla.pdf', planData.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-[#1f3c88] px-4 py-2 text-xs font-bold text-white hover:bg-[#162d4a] transition shadow-xs cursor-pointer"
                        >
                            <span>📄</span> Descargar / Ver PDF
                        </a>
                    )}
                </div>
            }
        >
            <Head title="Plan de Estudios Oficial" />

            <div className="space-y-6">
                {/* SELECTOR DE PROGRAMA (Oculto al imprimir) */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">📋</span>
                        <div>
                            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">Programa Académico</label>
                            <span className="text-xs text-slate-500">Seleccione el plan de estudios a consultar</span>
                        </div>
                    </div>

                    <div className="w-full md:w-96">
                        <select
                            value={planIdSeleccionado}
                            onChange={(e) => cargarMalla(e.target.value)}
                            disabled={cargando}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                        >
                            <option value="">-- Seleccionar Plan de Estudios --</option>
                            {planes.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.codigo ? `[${p.codigo}] ` : ''}{p.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* CONTENEDOR DEL DOCUMENTO FORMAL */}
                {cargando ? (
                    <div className="bg-white p-16 rounded-xl border border-slate-200 text-center shadow-xs">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#315d7a] mb-2"></div>
                        <p className="text-xs font-semibold text-slate-600">Cargando estructura académica...</p>
                    </div>
                ) : planData ? (
                    <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-300 shadow-xs space-y-6 text-slate-800 font-sans">
                        
                        {/* ENCABEZADO INSTITUCIONAL */}
                        <div className="text-center space-y-1 border-b border-slate-300 pb-4">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">Sistema de Gestión Académica</h2>
                            <h1 className="text-lg font-black uppercase text-slate-900">Estructura del Plan de Estudios</h1>
                        </div>

                        {/* METADATOS DEL PLAN */}
                        <div className="max-w-2xl mx-auto overflow-hidden rounded border border-slate-400">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-200 text-slate-900 border-b border-slate-400 font-bold">
                                        <th colSpan={2} className="py-1.5 px-3 text-center uppercase tracking-wider">Datos del Plan Curricular</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-300 text-[11px]">
                                    <tr>
                                        <td className="py-1.5 px-3 font-bold bg-slate-50 w-44 border-r border-slate-300 uppercase">Programa / Carrera:</td>
                                        <td className="py-1.5 px-3 font-semibold text-slate-900 uppercase">{planData.nombre}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-1.5 px-3 font-bold bg-slate-50 border-r border-slate-300 uppercase">Código del Plan:</td>
                                        <td className="py-1.5 px-3 font-mono text-slate-800">{planData.codigo || '—'}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-1.5 px-3 font-bold bg-slate-50 border-r border-slate-300 uppercase">Resolución:</td>
                                        <td className="py-1.5 px-3 text-slate-800">{planData.resolucion || 'Aprobado'}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-1.5 px-3 font-bold bg-slate-50 border-r border-slate-300 uppercase">Régimen / Tipo:</td>
                                        <td className="py-1.5 px-3 text-slate-800 uppercase">{planData.tipo || 'Modular'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* TABLA PRINCIPAL DE ASIGNATURAS POR CICLO */}
                        <div className="overflow-x-auto border border-slate-400 rounded">
                            <table className="w-full text-xs border-collapse">
                                <thead>
                                    <tr className="bg-slate-300 text-slate-900 font-bold border-b border-slate-400 text-center uppercase text-[11px]">
                                        <th className="py-2 px-2 border-r border-slate-400 w-20">Código</th>
                                        <th className="py-2 px-2 border-r border-slate-400 w-12">Ord.</th>
                                        <th className="py-2 px-3 border-r border-slate-400 text-left">Asignatura / Unidad Didáctica</th>
                                        <th className="py-2 px-3 border-r border-slate-400 text-left">Módulo Formativo</th>
                                        <th className="py-2 px-2 border-r border-slate-400 w-14">Tipo</th>
                                        <th className="py-2 px-2 border-r border-slate-400 w-16">Créd.</th>
                                        <th className="py-2 px-2 w-16">Horas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {semestres.map((sem) => {
                                        const cursosCiclo = cursosPorSemestre[sem.id] || [];
                                        const totalCredCiclo = cursosCiclo.reduce((acc, c) => acc + (c.creditos || 0), 0);
                                        const totalHorasCiclo = cursosCiclo.reduce((acc, c) => acc + (c.horas_semestrales || 0), 0);

                                        return (
                                            <React.Fragment key={sem.id}>
                                                {/* CABECERA DEL SEMESTRE */}
                                                <tr className="bg-slate-200 text-slate-900 font-bold border-y border-slate-400">
                                                    <td colSpan={7} className="py-1.5 px-3 uppercase tracking-wide text-xs">
                                                        Periodo Académico {sem.nombre}
                                                    </td>
                                                </tr>

                                                {/* LISTADO DE CURSOS */}
                                                {cursosCiclo.length > 0 ? (
                                                    cursosCiclo.map((c, idx) => (
                                                        <tr key={c.id} className={`border-b border-slate-300 hover:bg-slate-50 text-[11px] ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                                                            <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-700 border-r border-slate-300">
                                                                {c.codigo}
                                                            </td>
                                                            <td className="py-1.5 px-2 text-center font-mono text-slate-500 border-r border-slate-300">
                                                                {c.orden || (idx + 1)}
                                                            </td>
                                                            <td className="py-1.5 px-3 font-semibold text-slate-900 border-r border-slate-300">
                                                                {c.nombre}
                                                            </td>
                                                            <td className="py-1.5 px-3 text-slate-600 border-r border-slate-300 truncate max-w-[220px]">
                                                                {c.modulo ? `M${c.modulo.num_modulo}: ${c.modulo.nombre}` : '—'}
                                                            </td>
                                                            <td className="py-1.5 px-2 text-center font-bold border-r border-slate-300" title={getTipoAbreviado(c.tipo).nombre}>
                                                                {getTipoAbreviado(c.tipo).abrev}
                                                            </td>
                                                            <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-800 border-r border-slate-300">
                                                                {Number(c.creditos).toFixed(1)}
                                                            </td>
                                                            <td className="py-1.5 px-2 text-center font-mono text-slate-700">
                                                                {c.horas_semestrales}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr className="border-b border-slate-300 bg-white">
                                                        <td colSpan={7} className="py-3 text-center text-slate-400 italic text-[11px]">
                                                            Sin asignaturas registradas en este ciclo
                                                        </td>
                                                    </tr>
                                                )}

                                                {/* SUBTOTAL DEL SEMESTRE */}
                                                {cursosCiclo.length > 0 && (
                                                    <tr className="bg-slate-100 font-bold border-b-2 border-slate-400 text-[11px]">
                                                        <td colSpan={5} className="py-1.5 px-3 text-right text-slate-700 uppercase">
                                                            Total Periodo Académico {sem.nombre}:
                                                        </td>
                                                        <td className="py-1.5 px-2 text-center font-mono text-[#315d7a] border-r border-slate-300">
                                                            {totalCredCiclo.toFixed(1)}
                                                        </td>
                                                        <td className="py-1.5 px-2 text-center font-mono text-slate-900">
                                                            {totalHorasCiclo}
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}

                                    {/* TOTAL GENERAL ACUMULADO */}
                                    {totales && (
                                        <tr className="bg-slate-800 text-white font-bold text-xs uppercase border-t-2 border-slate-900">
                                            <td colSpan={5} className="py-2.5 px-4 text-right tracking-wider">
                                                Total General del Plan ({totales.total_cursos} Cursos):
                                            </td>
                                            <td className="py-2.5 px-2 text-center font-mono text-sky-200">
                                                {totales.total_creditos.toFixed(1)}
                                            </td>
                                            <td className="py-2.5 px-2 text-center font-mono text-emerald-200">
                                                {totales.total_horas}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* LEYENDA FORMAL AL PIE */}
                        <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 space-y-1 font-mono">
                            <p><strong>LEYENDA TIPO:</strong> O = Obligatorio / Especialidad | EMP = Empleabilidad | TR = Transversal.</p>
                            <p><strong>NOTA:</strong> Estructura curricular regulada según la normativa y plan de estudios vigente.</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-16 text-center rounded-xl border border-slate-200 shadow-xs">
                        <span className="text-4xl block mb-2">📑</span>
                        <h3 className="text-sm font-bold text-slate-800">Seleccione un Plan de Estudios</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                            Elija un programa en el menú superior para cargar la estructura curricular formal.
                        </p>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}