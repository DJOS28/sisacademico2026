import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function Index({ horarios = [], periodo = '' }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#315d7a]">
                            Portal Estudiante
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-slate-900">
                            Mi Horario Semanal
                        </h1>
                        <p className="mt-1 text-xs text-slate-500">
                            Consulta la programación semanal de tus clases.
                        </p>
                    </div>
                    <div className="bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700">
                        {periodo}
                    </div>
                </div>
            }
        >
            <Head title="Mi Horario - Estudiante" />

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    {diasSemana.map((dia) => {
                        const clasesDelDia = horarios.filter((h) => h.dia === dia);

                        return (
                            <div key={dia} className="flex flex-col gap-2">
                                <div className="bg-slate-100 text-slate-700 text-center py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-slate-200/60">
                                    {dia}
                                </div>

                                {clasesDelDia.length > 0 ? (
                                    clasesDelDia.map((h, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-sky-50/70 border border-sky-200/80 p-3 rounded-xl space-y-1 hover:shadow-2xs transition"
                                        >
                                            <p className="text-[11px] font-extrabold text-[#315d7a]">
                                                {h.hora_inicio.substring(0, 5)} - {h.hora_fin.substring(0, 5)}
                                            </p>
                                            <p className="text-xs font-bold text-slate-900 leading-snug">
                                                {h.curso_nombre}
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                                Aula: {h.aula_nombre ?? 'Por definir'}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-medium truncate">
                                                Prof: {h.docente_nombre ?? 'N/A'}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="border border-dashed border-slate-200/80 rounded-xl p-4 text-center text-[11px] text-slate-400 font-medium">
                                        Sin clases
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}