import { Link } from '@inertiajs/react';

function Icon({ name, className = 'h-4 w-4' }) {
    const icons = {
        clipboard: (
            <>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </>
        ),
        clock: (
            <>
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" points="12 6 12 12 16 14" />
            </>
        ),
        checkCircle: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        ),
        play: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        ),
        lock: (
            <>
                <rect x="5" y="11" width="14" height="10" rx="2" strokeWidth="2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 018 0v4" />
            </>
        )
    };

    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
            {icons[name] ?? null}
        </svg>
    );
}

export default function TabEvaluaciones({ evaluaciones = [] }) {
    // Función auxiliar para parsear fechas de forma segura cross-browser
    const parsearFechaHora = (fecha, hora) => {
        if (!fecha) return new Date();
        // Normaliza el formato reemplazando guiones si es necesario y asegurando los segundos
        const fechaLimpia = String(fecha).split('T')[0];
        const horaLimpia = hora ? (hora.length === 5 ? `${hora}:00` : hora) : '00:00:00';
        return new Date(`${fechaLimpia}T${horaLimpia}`);
    };

    // Función auxiliar para determinar el estado de la evaluación según la fecha/hora actual
    const obtenerEstadoEvaluacion = (ev) => {
        const ahora = new Date();
        const inicio = parsearFechaHora(ev.fecha_inicio, ev.hora_inicio);
        const fin = parsearFechaHora(ev.fecha_fin, ev.hora_fin);

        if (ahora < inicio) {
            return { estado: 'PROXIMA', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', texto: 'Próximamente' };
        } else if (ahora >= inicio && ahora <= fin) {
            return { estado: 'DISPONIBLE', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', texto: 'En Curso / Disponible' };
        } else {
            return { estado: 'FINALIZADA', badgeClass: 'bg-slate-100 text-slate-600 border-slate-200', texto: 'Finalizada' };
        }
    };

    if (!evaluaciones.length) {
        return (
            <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Icon name="clipboard" className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">No hay evaluaciones programadas para este curso.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Cabecera */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                    <h3 className="text-sm font-bold text-slate-900">Evaluaciones y Exámenes</h3>
                    <p className="text-[11px] text-slate-400">Rinde tus exámenes y cuestionarios dentro del rango de tiempo establecido.</p>
                </div>
                <span className="text-xs font-bold text-[#315d7a] bg-[#315d7a]/10 px-3 py-1 rounded-xl">
                    {evaluaciones.length} Registradas
                </span>
            </div>

            {/* Listado de Evaluaciones */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {evaluaciones.map((ev) => {
                    const { estado, badgeClass, texto } = obtenerEstadoEvaluacion(ev);
                    const evalId = ev.id || ev.id_evaluacion;

                    return (
                        <div
                            key={evalId}
                            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4"
                        >
                            <div className="space-y-3">
                                {/* Badge Estado y Título */}
                                <div className="flex items-center justify-between gap-2">
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase border px-2.5 py-0.5 rounded-md ${badgeClass}`}>
                                        <Icon name={estado === 'DISPONIBLE' ? 'play' : estado === 'PROXIMA' ? 'clock' : 'checkCircle'} className="h-3 w-3" />
                                        {texto}
                                    </span>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 leading-snug">{ev.titulo}</h4>
                                </div>

                                {/* Información de Fechas e Horarios */}
                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-1.5 text-slate-600">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-slate-400">Apertura:</span>
                                        <span className="font-bold">{ev.fecha_inicio} - {ev.hora_inicio}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-slate-400">Cierre:</span>
                                        <span className="font-bold text-red-500">{ev.fecha_fin} - {ev.hora_fin}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Botón de Acción */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                                {estado === 'DISPONIBLE' && (
                                    <Link
                                        href={route('estudiante.evaluaciones.rendir', evalId)}
                                        className="w-full text-center px-4 py-2 bg-[#315d7a] hover:bg-[#274b63] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs"
                                    >
                                        <Icon name="play" className="h-3.5 w-3.5" />
                                        <span>Rendir Evaluación</span>
                                    </Link>
                                )}

                                {estado === 'PROXIMA' && (
                                    <button
                                        disabled
                                        className="w-full px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                                    >
                                        <Icon name="lock" className="h-3.5 w-3.5" />
                                        <span>No Disponible Aún</span>
                                    </button>
                                )}

                                {estado === 'FINALIZADA' && (
                                    <button
                                        disabled
                                        className="w-full px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                                    >
                                        <Icon name="checkCircle" className="h-3.5 w-3.5" />
                                        <span>Evaluación Concluida</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}