import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function KpiDashboard({ instituto, periodos = [], periodoId, kpis, fechaEmision }) {
    const [idPeriodo, setIdPeriodo] = useState(periodoId || '');
    const [cargando, setCargando] = useState(false);
    const [dataKpis, setDataKpis] = useState(kpis);
    const [emision, setEmision] = useState(fechaEmision);

    const cambiarPeriodo = (nuevoPeriodoId) => {
        setIdPeriodo(nuevoPeriodoId);
        setCargando(true);

        window.axios
            .post(route('reportes.kpi.data'), { periodo_id: nuevoPeriodoId })
            .then((res) => {
                setDataKpis(res.data.kpis);
                setEmision(res.data.fechaEmision);
            })
            .catch(() => {
                router.get(route('reportes.kpi.index'), { periodo_id: nuevoPeriodoId }, { preserveState: true });
            })
            .finally(() => setCargando(false));
    };

    // Componente SVG: Medidor Circular (Gauge Radial)
    const RadialProgress = ({ percentage, colorClass, trackClass = "text-slate-100", size = 100, stroke = 9, label = "" }) => {
        const radius = (size - stroke) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (Math.min(Math.max(percentage, 0), 100) / 100) * circumference;

        return (
            <div className="relative inline-flex flex-col items-center justify-center">
                <svg width={size} height={size} className="rotate-[-90deg] transition-all duration-700 ease-out">
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        className={trackClass}
                        strokeWidth={stroke}
                        stroke="currentColor"
                        fill="transparent"
                    />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        className={colorClass}
                        strokeWidth={stroke}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                    />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-slate-900 tracking-tight">{percentage}%</span>
                    {label && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{label}</span>}
                </div>
            </div>
        );
    };

    // Gráfico de Barras Proporcionales de Programas de Estudio
    const maxPrograma = Math.max(...(dataKpis.matricula.por_programa?.map(p => p.total) || [1]), 1);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#315d7a]">
                            <span>{instituto?.nombre || 'IESTP'}</span>
                            <span>•</span>
                            <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-mono">DRE ÁNCASH 12.17.3</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 mt-1">Tablero Estadístico de Rendimiento & KPI</h1>
                        <p className="text-xs text-slate-500">
                            Corte oficial emitido: <span className="font-semibold text-slate-800">{emision}</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                            <span className="text-xs font-bold text-slate-600 uppercase">Periodo:</span>
                            <select
                                value={idPeriodo}
                                onChange={(e) => cambiarPeriodo(e.target.value)}
                                disabled={cargando}
                                className="border-none bg-transparent p-0 text-xs font-black text-[#315d7a] focus:ring-0 cursor-pointer"
                            >
                                {periodos.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.nombre} {p.activo ? '● Vigente' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <a
                            href={route('reportes.kpi.exportar', { periodo_id: idPeriodo })}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-black text-white shadow-md hover:from-emerald-700 hover:to-teal-700 transition"
                        >
                            <span>📥 Descargar Auditoría Oficial (CSV)</span>
                        </a>
                    </div>
                </div>
            }
        >
            <Head title="Tablero KPI Institucional" />

            <div className={`space-y-6 transition-opacity duration-300 ${cargando ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>

                {/* 1. TARJETAS PRINCIPALES CON GRADIENTES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/20 to-blue-50/50 p-5 shadow-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-900">Total Matriculados</span>
                            <span className="rounded-full bg-blue-100 p-2 text-blue-600">👥</span>
                        </div>
                        <div className="mt-3">
                            <span className="text-3xl font-black text-slate-900">{dataKpis.matricula.total}</span>
                            <span className="text-xs font-semibold text-slate-500 ml-1">alumnos</span>
                        </div>
                        <div className="mt-4 space-y-1.5">
                            <div className="flex justify-between text-[11px] font-semibold">
                                <span className="text-slate-600">Regulares ({dataKpis.matricula.tasa_regulares}%)</span>
                                <span className="text-blue-700">{dataKpis.matricula.regulares}</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500" style={{ width: `${dataKpis.matricula.tasa_regulares}%` }} />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/20 to-emerald-50/50 p-5 shadow-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">Rendimiento Académico</span>
                            <span className="rounded-full bg-emerald-100 p-2 text-emerald-600">📈</span>
                        </div>
                        <div className="mt-3">
                            <span className="text-3xl font-black text-emerald-700">{dataKpis.evaluacion.tasa_aprobacion}%</span>
                            <span className="text-xs font-semibold text-slate-500 ml-1">aprobados</span>
                        </div>
                        <div className="mt-4 space-y-1.5">
                            <div className="flex justify-between text-[11px] font-semibold">
                                <span className="text-slate-600">Promedio General</span>
                                <span className="text-emerald-700 font-bold">{dataKpis.evaluacion.promedio_general} / 20</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500" style={{ width: `${dataKpis.evaluacion.tasa_aprobacion}%` }} />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/20 to-indigo-50/50 p-5 shadow-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">Asistencia Efectiva</span>
                            <span className="rounded-full bg-indigo-100 p-2 text-indigo-600">🕒</span>
                        </div>
                        <div className="mt-3">
                            <span className="text-3xl font-black text-indigo-900">{dataKpis.asistencia.tasa_asistencia}%</span>
                            <span className="text-xs font-semibold text-slate-500 ml-1">asistencia</span>
                        </div>
                        <div className="mt-4 space-y-1.5">
                            <div className="flex justify-between text-[11px] font-semibold">
                                <span className="text-slate-600">Frecuencia de Falta</span>
                                <span className="text-indigo-700">{dataKpis.asistencia.tasa_inasistencia}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-500" style={{ width: `${dataKpis.asistencia.tasa_asistencia}%` }} />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-br from-white via-rose-50/20 to-rose-50/50 p-5 shadow-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-rose-900">Riesgo de Deserción</span>
                            <span className="rounded-full bg-rose-100 p-2 text-rose-600">⚠️</span>
                        </div>
                        <div className="mt-3">
                            <span className="text-3xl font-black text-rose-600">{dataKpis.trayectoria.tasa_desercion}%</span>
                            <span className="text-xs font-semibold text-slate-500 ml-1">retirados</span>
                        </div>
                        <div className="mt-4 space-y-1.5">
                            <div className="flex justify-between text-[11px] font-semibold">
                                <span className="text-slate-600">Permanencia Total</span>
                                <span className="text-emerald-600 font-bold">{(100 - dataKpis.trayectoria.tasa_desercion).toFixed(1)}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-rose-400 to-pink-600 transition-all duration-500" style={{ width: `${dataKpis.trayectoria.tasa_desercion}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. FILA DE GRÁFICOS ANALÍTICOS NUEVOS: RANGOS DE NOTAS & POBLACIÓN POR CARRERA */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* GRÁFICO A: Distribución de Notas por Niveles de Rendimiento (MINEDU) */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                                    Distribución de Calificaciones (Escala Vigesimal)
                                </h3>
                                <p className="text-xs text-slate-500">Segmentación de notas finales registradas en el periodo.</p>
                            </div>
                            <span className="rounded bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                {dataKpis.evaluacion.total_evaluados} notas
                            </span>
                        </div>

                        <div className="pt-5 space-y-3.5">
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-emerald-700">Excelente (17 - 20)</span>
                                    <span className="text-slate-800 font-mono">{dataKpis.evaluacion.distribucion.excelente_17_20} alumno(s)</span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500" 
                                        style={{ width: `${dataKpis.evaluacion.total_evaluados ? (dataKpis.evaluacion.distribucion.excelente_17_20 / dataKpis.evaluacion.total_evaluados) * 100 : 0}%` }} 
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-blue-700">Aprobado / Bueno (13 - 16)</span>
                                    <span className="text-slate-800 font-mono">{dataKpis.evaluacion.distribucion.bueno_13_16} alumno(s)</span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500" 
                                        style={{ width: `${dataKpis.evaluacion.total_evaluados ? (dataKpis.evaluacion.distribucion.bueno_13_16 / dataKpis.evaluacion.total_evaluados) * 100 : 0}%` }} 
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-amber-600">Regular / Recuperación (11 - 12)</span>
                                    <span className="text-slate-800 font-mono">{dataKpis.evaluacion.distribucion.regular_11_12} alumno(s)</span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500" 
                                        style={{ width: `${dataKpis.evaluacion.total_evaluados ? (dataKpis.evaluacion.distribucion.regular_11_12 / dataKpis.evaluacion.total_evaluados) * 100 : 0}%` }} 
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-rose-600">Crítico / Desaprobado (00 - 10)</span>
                                    <span className="text-slate-800 font-mono">{dataKpis.evaluacion.distribucion.critico_0_10} alumno(s)</span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-rose-500 to-red-600 rounded-full transition-all duration-500" 
                                        style={{ width: `${dataKpis.evaluacion.total_evaluados ? (dataKpis.evaluacion.distribucion.critico_0_10 / dataKpis.evaluacion.total_evaluados) * 100 : 0}%` }} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* GRÁFICO B: Población Estudiantil por Programa de Estudios */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                                    Matrícula por Programa de Estudios
                                </h3>
                                <p className="text-xs text-slate-500">Demanda y distribución de vacantes matriculadas.</p>
                            </div>
                            <span className="rounded bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                                {dataKpis.matricula.por_programa?.length || 0} Programas
                            </span>
                        </div>

                        <div className="pt-4 space-y-3">
                            {dataKpis.matricula.por_programa && dataKpis.matricula.por_programa.length > 0 ? (
                                dataKpis.matricula.por_programa.map((prog, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between text-xs font-semibold mb-1">
                                            <span className="text-slate-700 truncate max-w-[280px]">{prog.nombre}</span>
                                            <span className="font-mono font-black text-[#315d7a]">{prog.total} alumnos</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500"
                                                style={{ width: `${(prog.total / maxPrograma) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center text-xs text-slate-400 italic">
                                    No hay matrículas vinculadas a planes de estudio en este periodo.
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* 3. GRÁFICOS RADIALES & SEGUIMIENTO PEDAGÓGICO */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Gráfico 1: Monitoreo & Supervisión Docente */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Supervisión Pedagógica</h3>
                                <span className="text-[10px] font-bold text-slate-400">12.17.3 g</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Cumplimiento en sesiones y avance silábico.</p>
                        </div>

                        <div className="py-6 flex items-center justify-around">
                            <RadialProgress
                                percentage={dataKpis.supervision.tasa_cumplimiento}
                                colorClass="text-emerald-500"
                                size={110}
                                stroke={10}
                                label="Aprobado"
                            />
                            <div className="space-y-1.5 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                    <span className="text-slate-600 font-medium">Aprobadas ({dataKpis.supervision.aprobadas})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                                    <span className="text-slate-600 font-medium">Observadas ({dataKpis.supervision.observadas})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                                    <span className="text-slate-600 font-medium">Críticas ({dataKpis.supervision.criticas})</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 flex justify-between font-semibold">
                            <span>Docentes Dictando:</span>
                            <span className="font-bold text-slate-900">{dataKpis.docentes.total_docentes} docentes</span>
                        </div>
                    </div>

                    {/* Gráfico 2: Desglose de Asistencia */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Control de Asistencia</h3>
                                <span className="text-[10px] font-bold text-slate-400">12.17.3 c</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Desglose de asistencia en sesiones de clase.</p>
                        </div>

                        <div className="py-6 flex items-center justify-around">
                            <RadialProgress
                                percentage={dataKpis.asistencia.tasa_asistencia}
                                colorClass="text-indigo-600"
                                size={110}
                                stroke={10}
                                label="Efectiva"
                            />
                            <div className="space-y-1 text-[11px]">
                                <div className="flex justify-between gap-3 text-slate-600">
                                    <span>● Presentes:</span>
                                    <span className="font-bold text-emerald-600">{dataKpis.asistencia.presentes}</span>
                                </div>
                                <div className="flex justify-between gap-3 text-slate-600">
                                    <span>● Tardanzas:</span>
                                    <span className="font-bold text-amber-600">{dataKpis.asistencia.tardanzas}</span>
                                </div>
                                <div className="flex justify-between gap-3 text-slate-600">
                                    <span>● Justificadas:</span>
                                    <span className="font-bold text-blue-600">{dataKpis.asistencia.justificados}</span>
                                </div>
                                <div className="flex justify-between gap-3 text-slate-600">
                                    <span>● Inasistencias:</span>
                                    <span className="font-bold text-rose-600">{dataKpis.asistencia.faltas}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl bg-indigo-50 p-3 text-xs text-indigo-900 flex justify-between font-semibold">
                            <span>Total de Registros:</span>
                            <span className="font-mono font-bold">{dataKpis.asistencia.total_registros} marcas</span>
                        </div>
                    </div>

                    {/* Gráfico 3: Aula Virtual Moodle */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Aula Virtual Moodle</h3>
                                <span className="text-[10px] font-bold text-slate-400">12.17.3 h</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Cursos sincronizados con el LMS institucional.</p>
                        </div>

                        <div className="py-6 flex items-center justify-around">
                            <RadialProgress
                                percentage={dataKpis.moodle.tasa_digitalizacion}
                                colorClass="text-purple-600"
                                size={110}
                                stroke={10}
                                label="Moodle"
                            />
                            <div className="space-y-1.5 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-purple-600" />
                                    <span className="text-slate-600">En Moodle: {dataKpis.moodle.cursos_con_moodle}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                                    <span className="text-slate-600">Ofertados: {dataKpis.moodle.cursos_ofertados}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-700 font-bold">
                                    <span>Archivos: {dataKpis.moodle.archivos_digitales}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl bg-purple-50 p-3 text-xs text-purple-900 flex justify-between font-semibold">
                            <span>Interoperabilidad LMS:</span>
                            <span className="font-mono font-bold">100% Conectado</span>
                        </div>
                    </div>
                </div>

                {/* 4. BLOQUE OPERATIVO: TRÁMITES, CAJA & BOLSA LABORAL */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Trámites */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-800">Mesa de Partes</span>
                            <span className="text-xs font-bold text-teal-600 font-mono">{dataKpis.tramites.tasa_resolucion}% Eficiencia</span>
                        </div>
                        <div className="mt-3 flex gap-2 h-3 rounded-full bg-slate-100 overflow-hidden">
                            <div 
                                title="Completados" 
                                className="bg-teal-500 h-full transition-all" 
                                style={{ width: `${dataKpis.tramites.total ? (dataKpis.tramites.completados / dataKpis.tramites.total) * 100 : 0}%` }} 
                            />
                            <div 
                                title="Pendientes" 
                                className="bg-amber-400 h-full transition-all" 
                                style={{ width: `${dataKpis.tramites.total ? (dataKpis.tramites.pendientes / dataKpis.tramites.total) * 100 : 0}%` }} 
                            />
                            <div 
                                title="Rechazados" 
                                className="bg-rose-400 h-full transition-all" 
                                style={{ width: `${dataKpis.tramites.total ? (dataKpis.tramites.rechazados / dataKpis.tramites.total) * 100 : 0}%` }} 
                            />
                        </div>
                        <div className="mt-3 flex justify-between text-xs text-slate-500 font-medium">
                            <span className="text-teal-700">✔ {dataKpis.tramites.completados} Listos</span>
                            <span className="text-amber-700">⏳ {dataKpis.tramites.pendientes} En trámite</span>
                            <span className="text-rose-700">✖ {dataKpis.tramites.rechazados} Rechazados</span>
                        </div>
                    </div>

                    {/* Finanzas */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-800">Recaudación en Caja</span>
                            <span className="text-xs font-bold text-emerald-600">Auditado</span>
                        </div>
                        <div className="mt-2">
                            <span className="text-2xl font-black font-mono text-emerald-700">
                                S/ {Number(dataKpis.caja.total_ingresos).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-xs text-slate-400 block mt-0.5">Ingresos directos por ventanilla</span>
                        </div>
                        <div className="mt-3 text-xs text-slate-600 flex justify-between border-t border-slate-100 pt-2">
                            <span>Comprobantes emitidos:</span>
                            <span className="font-bold text-slate-900">{dataKpis.caja.operaciones} transacciones</span>
                        </div>
                    </div>

                    {/* Bolsa Laboral */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-800">Bolsa Laboral & Egresados</span>
                            <span className="text-xs font-bold text-sky-600 font-mono">{dataKpis.bolsa.tasa_colocacion}% Inserción</span>
                        </div>
                        <div className="mt-2">
                            <span className="text-2xl font-black text-sky-700">{dataKpis.bolsa.colocados}</span>
                            <span className="text-xs text-slate-400 font-medium ml-1">egresados colocados</span>
                        </div>
                        <div className="mt-3 text-xs text-slate-600 flex justify-between border-t border-slate-100 pt-2">
                            <span>Convocatorias vigentes:</span>
                            <span className="font-bold text-slate-900">{dataKpis.bolsa.ofertas_activas} ofertas activas</span>
                        </div>
                    </div>
                </div>

                {/* 5. TABLA RESUMEN EJECUTIVA DE TRAZABILIDAD */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                                Cuadro de Mando Integral (Directiva DRE 12.17.3)
                            </h2>
                            <p className="text-xs text-slate-500">Métricas analíticas calculadas con base en las tablas transaccionales del sistema.</p>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                            Auditoría Conforme
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600">
                            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3">Eje Temático</th>
                                    <th className="px-6 py-3">Métrica Principal</th>
                                    <th className="px-6 py-3">Datos Transaccionales</th>
                                    <th className="px-6 py-3 text-center">Porcentaje / Tasa</th>
                                    <th className="px-6 py-3 text-right">Semáforo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                <tr className="hover:bg-slate-50/50">
                                    <td className="px-6 py-3.5 font-bold text-slate-900">Matrícula y Carga</td>
                                    <td className="px-6 py-3.5">Población Estudiantil</td>
                                    <td className="px-6 py-3.5">{dataKpis.matricula.total} inscritos ({dataKpis.avance.asignaturas_cursadas} asignaturas asignadas)</td>
                                    <td className="px-6 py-3.5 text-center font-mono font-bold text-blue-600">{dataKpis.matricula.tasa_regulares}% Regular</td>
                                    <td className="px-6 py-3.5 text-right">
                                        <span className="inline-block px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-bold">VIGENTE</span>
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-50/50">
                                    <td className="px-6 py-3.5 font-bold text-slate-900">Rendimiento Académico</td>
                                    <td className="px-6 py-3.5">Evaluación Ordinaria</td>
                                    <td className="px-6 py-3.5">{dataKpis.evaluacion.aprobados} aprobados | {dataKpis.evaluacion.desaprobados} desaprobados (Prom: {dataKpis.evaluacion.promedio_general})</td>
                                    <td className="px-6 py-3.5 text-center font-mono font-bold text-emerald-600">{dataKpis.evaluacion.tasa_aprobacion}% Aprobación</td>
                                    <td className="px-6 py-3.5 text-right">
                                        <span className="inline-block px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-bold">ÓPTIMO</span>
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-50/50">
                                    <td className="px-6 py-3.5 font-bold text-slate-900">Control de Asistencia</td>
                                    <td className="px-6 py-3.5">Registro en Sesiones</td>
                                    <td className="px-6 py-3.5">{dataKpis.asistencia.presentes} asistencias | {dataKpis.asistencia.faltas} inasistencias</td>
                                    <td className="px-6 py-3.5 text-center font-mono font-bold text-indigo-600">{dataKpis.asistencia.tasa_asistencia}% Asistencia</td>
                                    <td className="px-6 py-3.5 text-right">
                                        <span className="inline-block px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 font-bold">REGULAR</span>
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-50/50">
                                    <td className="px-6 py-3.5 font-bold text-slate-900">Supervisión Pedagógica</td>
                                    <td className="px-6 py-3.5">Monitoreo Docente</td>
                                    <td className="px-6 py-3.5">{dataKpis.supervision.total_supervisiones} auditorías ({dataKpis.docentes.total_docentes} docentes)</td>
                                    <td className="px-6 py-3.5 text-center font-mono font-bold text-emerald-600">{dataKpis.supervision.tasa_cumplimiento}% Conforme</td>
                                    <td className="px-6 py-3.5 text-right">
                                        <span className="inline-block px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-bold">CONTROLADO</span>
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-50/50">
                                    <td className="px-6 py-3.5 font-bold text-slate-900">Digitalización Moodle</td>
                                    <td className="px-6 py-3.5">Aula Virtual Sincronizada</td>
                                    <td className="px-6 py-3.5">{dataKpis.moodle.cursos_con_moodle} cursos sincronizados con materiales didácticos</td>
                                    <td className="px-6 py-3.5 text-center font-mono font-bold text-purple-600">{dataKpis.moodle.tasa_digitalizacion}% Cobertura</td>
                                    <td className="px-6 py-3.5 text-right">
                                        <span className="inline-block px-2.5 py-1 rounded bg-purple-50 text-purple-700 font-bold">CONECTADO</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}