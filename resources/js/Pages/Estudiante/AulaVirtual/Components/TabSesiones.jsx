import { useState } from 'react';

function Icon({ name, className = 'h-4 w-4' }) {
    const icons = {
        fileText: (
            <>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" points="14 2 14 8 20 8" />
            </>
        ),
        video: (
            <>
                <polygon strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </>
        ),
        download: (
            <>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </>
        ),
        folder: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        ),
        calendar: (
            <>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </>
        ),
    };

    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
            {icons[name] ?? null}
        </svg>
    );
}

export default function TabSesiones({ sesiones = [], materiales = [] }) {
    if (!sesiones.length) {
        return (
            <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Icon name="folder" className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">No hay sesiones de clase programadas aún.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Cabecera del Módulo */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                    <h3 className="text-sm font-bold text-slate-900">Sesiones y Avance Académico</h3>
                    <p className="text-[11px] text-slate-400">Accede a las guías y materiales correspondientes a cada clase.</p>
                </div>
                <span className="text-xs font-bold text-[#315d7a] bg-[#315d7a]/10 px-3 py-1 rounded-xl">
                    {sesiones.length} Sesiones
                </span>
            </div>

            {/* REJILLA DE TARJETAS (CARDS GRID) */}
            <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {sesiones.map((s, idx) => {
                    const matsSesion = materiales.filter((m) => m.sesion_id === s.id);

                    return (
                        <div
                            key={s.id}
                            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden border-t-4 border-t-[#315d7a]"
                        >
                            <div className="p-5 space-y-4">
                                {/* Encabezado de la Tarjeta */}
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-[#315d7a] bg-[#eaf1f6] px-2.5 py-1 rounded-lg">
                                        Sesión #{idx + 1}
                                    </span>
                                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                                        <Icon name="calendar" className="h-3.5 w-3.5 shrink-0" />
                                        <span>{s.fecha}</span>
                                    </div>
                                </div>

                                {/* Título de la Sesión */}
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 leading-snug">
                                        {s.nombre}
                                    </h4>
                                    {s.fecha_fin && s.fecha_fin !== s.fecha && (
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                            Hasta el {s.fecha_fin}
                                        </p>
                                    )}
                                </div>

                                {/* Botón / Descarga Guía Principal (Si existe) */}
                                {s.archivo_url && (
                                    <a
                                        href={s.archivo_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full p-2.5 rounded-xl bg-sky-50/80 hover:bg-sky-100/80 border border-sky-200/60 flex items-center justify-between text-[#315d7a] transition group"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Icon name="fileText" className="h-4 w-4 shrink-0 text-[#315d7a]" />
                                            <span className="text-xs font-bold truncate">Guía de Sesión</span>
                                        </div>
                                        <Icon name="download" className="h-4 w-4 shrink-0 group-hover:translate-y-0.5 transition" />
                                    </a>
                                )}

                                {/* Recursos adicionales vinculados a la sesión */}
                                {matsSesion.length > 0 && (
                                    <div className="pt-2 border-t border-slate-100 space-y-2">
                                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                            Material Adjunto ({matsSesion.length}):
                                        </p>
                                        <div className="space-y-1.5">
                                            {matsSesion.map((m) => (
                                                <a
                                                    key={m.id}
                                                    href={m.ruta}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center justify-between transition group"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0 pr-2">
                                                        <Icon
                                                            name={m.tipo === 'video' ? 'video' : 'fileText'}
                                                            className="h-3.5 w-3.5 text-slate-500 shrink-0"
                                                        />
                                                        <span className="text-xs font-bold text-slate-700 group-hover:text-[#315d7a] truncate">
                                                            {m.nombre}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-[#315d7a] shrink-0">
                                                        {m.tipo === 'video' ? 'Ver' : 'Abrir'} →
                                                    </span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer de la tarjeta si no tiene archivos */}
                            {!s.archivo_url && matsSesion.length === 0 && (
                                <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 text-center">
                                    <span className="text-[11px] text-slate-400 font-medium italic">
                                        Sin recursos adjuntos
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}