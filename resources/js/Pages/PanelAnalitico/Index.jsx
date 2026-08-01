import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement
);

export default function Index({ kpis, graficos, ultimasPostulaciones = [] }) {
    // Configuración Gráfico de Dona: Modalidades
    const dataModalidad = {
        labels: Object.keys(graficos?.modalidades || {}),
        datasets: [
            {
                data: Object.values(graficos?.modalidades || {}),
                backgroundColor: ['#315d7a', '#10b981', '#f59e0b', '#6366f1'],
                borderWidth: 1,
            },
        ],
    };

    // Configuración Gráfico de Barras: Estado de Postulaciones
    const dataEstados = {
        labels: Object.keys(graficos?.estadosPostulacion || {}),
        datasets: [
            {
                label: 'Cantidad de Postulaciones',
                data: Object.values(graficos?.estadosPostulacion || {}),
                backgroundColor: '#315d7a',
                borderRadius: 6,
            },
        ],
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Panel Analítico
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Métricas generales de empleabilidad, postulaciones y convocatorias activas.
                    </p>
                </div>
            }
        >
            <Head title="Panel Analítico" />

            <div className="w-full space-y-6 pb-10">
                {/* 1. TARJETAS DE KPIS PRINCIPALES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <span className="text-xs text-slate-500 font-semibold uppercase">
                            Ofertas Activas
                        </span>
                        <div className="text-3xl font-extrabold text-emerald-600 mt-2">
                            {kpis?.ofertas_activas || 0}
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <span className="text-xs text-slate-500 font-semibold uppercase">
                            Ofertas Vencidas
                        </span>
                        <div className="text-3xl font-extrabold text-rose-600 mt-2">
                            {kpis?.ofertas_vencidas || 0}
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <span className="text-xs text-slate-500 font-semibold uppercase">
                            Total Postulaciones
                        </span>
                        <div className="text-3xl font-extrabold text-[#315d7a] mt-2">
                            {kpis?.postulaciones || 0}
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <span className="text-xs text-slate-500 font-semibold uppercase">
                            Empresas Participantes
                        </span>
                        <div className="text-3xl font-extrabold text-amber-600 mt-2">
                            {kpis?.empresas || 0}
                        </div>
                    </div>
                </div>

                {/* 2. SECCIÓN DE GRÁFICOS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* GRÁFICO 1: MODALIDAD */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 border-b pb-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#315d7a]"></span>
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                Ofertas por Modalidad
                            </h2>
                        </div>
                        <div className="h-64 flex justify-center items-center">
                            {Object.keys(graficos?.modalidades || {}).length > 0 ? (
                                <Doughnut data={dataModalidad} options={{ maintainAspectRatio: false }} />
                            ) : (
                                <span className="text-xs text-slate-400">Sin datos registrados</span>
                            )}
                        </div>
                    </div>

                    {/* GRÁFICO 2: ESTADO DE POSTULACIONES */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 border-b pb-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#315d7a]"></span>
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                Estado de Postulaciones
                            </h2>
                        </div>
                        <div className="h-64">
                            {Object.keys(graficos?.estadosPostulacion || {}).length > 0 ? (
                                <Bar data={dataEstados} options={{ maintainAspectRatio: false, responsive: true }} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                                    Sin datos registrados
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. TABLA RESUMEN DE ÚLTIMAS POSTULACIONES */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b pb-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#315d7a]"></span>
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                            Últimas Postulaciones Recibidas
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Postulante</th>
                                    <th className="px-4 py-3">Puesto / Oferta</th>
                                    <th className="px-4 py-3">Empresa</th>
                                    <th className="px-4 py-3 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {ultimasPostulaciones.length > 0 ? (
                                    ultimasPostulaciones.map((post) => (
                                        <tr key={post.id_postulacion} className="hover:bg-slate-50/80 transition">
                                            <td className="px-4 py-2.5 font-semibold text-slate-800">
                                                {post.postulante?.nombres || `Postulante #${post.id_postulante}`}
                                            </td>
                                            <td className="px-4 py-2.5">{post.oferta?.titulo || '---'}</td>
                                            <td className="px-4 py-2.5">{post.oferta?.empresa?.nombre_empresa || '---'}</td>
                                            <td className="px-4 py-2.5 text-center">
                                                <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                                                    {post.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-6 text-center text-slate-400">
                                            No hay postulaciones recientes.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}