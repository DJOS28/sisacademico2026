import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useMemo } from 'react';

export default function Index({ horarios = [] }) {
    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    // Normalizar horas a formato HH:MM
    const formatTime = (timeStr) => timeStr?.substring(0, 5) || '';

    // Convertir HH:MM a minutos para ordenamiento numérico
    const toMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    };

    // Extraer únicamente los rangos de horas reales donde el docente TIENE clase y ordenarlos
    const rangosHorarios = useMemo(() => {
        const rangosMap = new Map();

        horarios.forEach((h) => {
            if (h.hora_inicio && h.hora_fin) {
                const label = `${formatTime(h.hora_inicio)} - ${formatTime(h.hora_fin)}`;
                if (!rangosMap.has(label)) {
                    rangosMap.set(label, {
                        label,
                        inicioMin: toMinutes(h.hora_inicio),
                    });
                }
            }
        });

        return Array.from(rangosMap.values()).sort((a, b) => a.inicioMin - b.inicioMin);
    }, [horarios]);

    // Buscar si existe una clase asignada para un día y rango horario específico
    const getClaseEnRango = (dia, rangoLabel) => {
        return horarios.find((h) => {
            const coincideDia =
                h.dia_semana?.toLowerCase() === dia.toLowerCase() ||
                h.dia?.toLowerCase() === dia.toLowerCase();

            const rangoClase = `${formatTime(h.hora_inicio)} - ${formatTime(h.hora_fin)}`;
            return coincideDia && rangoClase === rangoLabel;
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <p className="text-sm font-semibold text-[#315d7a]">
                        Mi actividad académica
                    </p>
                    <h1 className="mt-0.5 text-2xl font-bold text-slate-900">
                        Mi horario académico
                    </h1>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Matriz semanal de clases, secciones y aulas asignadas para el ciclo activo.
                    </p>
                </div>
            }
        >
            <Head title="Mi horario académico" />

            <div className="space-y-6">
                {/* Tabla Matriz de Horarios */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 divide-x divide-slate-200">
                                    <th className="w-36 px-4 py-3.5 font-bold uppercase tracking-wider text-slate-500 text-center">
                                        Horario
                                    </th>
                                    {diasSemana.map((dia) => (
                                        <th
                                            key={dia}
                                            className="px-4 py-3.5 font-bold uppercase tracking-wider text-[#315d7a] text-center"
                                        >
                                            {dia}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {rangosHorarios.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="px-4 py-12 text-center text-slate-400 font-medium"
                                        >
                                            No tienes clases ni horarios asignados en este periodo.
                                        </td>
                                    </tr>
                                ) : (
                                    rangosHorarios.map((rango) => (
                                        <tr key={rango.label} className="divide-x divide-slate-200 hover:bg-slate-50/30">
                                            {/* Columna Lateral de Hora */}
                                            <td className="bg-slate-50/70 px-3 py-4 text-center font-bold text-slate-700 align-middle">
                                                <span className="inline-block rounded-md bg-white border border-slate-200 px-2.5 py-1 font-mono text-[11px] text-[#315d7a] shadow-2xs font-extrabold">
                                                    ⏰ {rango.label}
                                                </span>
                                            </td>

                                            {/* Columnas de los Días de la Semana */}
                                            {diasSemana.map((dia) => {
                                                const clase = getClaseEnRango(dia, rango.label);

                                                return (
                                                    <td
                                                        key={`${dia}-${rango.label}`}
                                                        className="p-2 align-middle h-20 min-w-[150px]"
                                                    >
                                                        {clase ? (
                                                            <div className="flex flex-col justify-between h-full rounded-xl border border-[#315d7a]/25 bg-[#f4f8fa] p-2.5 transition hover:border-[#315d7a] hover:bg-white hover:shadow-sm">
                                                                <div className="flex items-center justify-between gap-1 mb-1">
                                                                    <span className="rounded-md border border-[#dfeaf1] bg-[#eaf1f6] px-1.5 py-0.5 text-[9px] font-extrabold text-[#315d7a]">
                                                                        Sec. {clase.seccion?.nombre || 'S/N'}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-slate-500">
                                                                        📍 {clase.aula?.nombre || clase.aula || 'AULA'}
                                                                    </span>
                                                                </div>

                                                                <h4 className="font-bold text-slate-900 leading-tight text-xs line-clamp-2">
                                                                    {clase.curso?.nombre || 'Curso no asignado'}
                                                                </h4>
                                                            </div>
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-[11px] text-slate-300">
                                                                —
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}