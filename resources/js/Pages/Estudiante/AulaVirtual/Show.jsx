import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import TabSesiones from './Components/TabSesiones';
import TabTareas from './Components/TabTareas'; 
import TabEvaluaciones from './Components/TabEvaluaciones';

export default function AulaVirtualShow({
    curso = {},
    sesiones = [],
    materiales = [],
    tareas = [],
    evaluaciones = [],
    clasesVivo = [],
    silabo = null,
}) {
    const [tab, setTab] = useState('sesiones');

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <Link
                        href={route('estudiante.cursos')}
                        className="text-xs font-bold text-[#315d7a] hover:underline mb-1 inline-block"
                    >
                        ← Volver a Mis Cursos
                    </Link>
                    <div className="flex items-center gap-3">
                        <span className="bg-sky-50 text-[#315d7a] border border-sky-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase">
                            Aula Virtual
                        </span>
                        <span className="text-xs text-slate-400 font-bold">Sec. {curso.seccion}</span>
                    </div>
                    <h1 className="mt-1 text-2xl font-bold text-slate-900">{curso.nombre}</h1>
                    <p className="text-xs text-slate-500">Docente: {curso.docente || 'Sin docente asignado'}</p>
                </div>
            }
        >
            <Head title={`Aula Virtual - ${curso.nombre}`} />

            <div className="space-y-6">
                {/* NAVEGACIÓN DE PESTAÑAS */}
                <div className="flex border-b border-slate-200 space-x-2 bg-white px-4 pt-2 rounded-t-2xl overflow-x-auto">
                    {[
                        { id: 'sesiones', label: 'Sesiones de Clase' },
                        { id: 'materiales', label: 'Todos los Materiales' },
                        { id: 'tareas', label: 'Tareas y Entregables' },
                        { id: 'evaluaciones', label: 'Evaluaciones' },
                        { id: 'clases_vivo', label: 'Clases en Vivo' },
                        { id: 'silabo', label: 'Sílabo' },
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`py-3 px-4 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                                tab === t.id
                                    ? 'border-[#315d7a] text-[#315d7a]'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* CONTENIDO PRINCIPAL */}
                <div className="bg-white p-6 rounded-b-2xl border border-slate-200/90 shadow-2xs min-h-[300px]">
                    
                    {/* 1. SESIONES DE CLASE */}
                    {tab === 'sesiones' && (
                        <TabSesiones sesiones={sesiones} materiales={materiales} />
                    )}

                    {/* 2. MATERIALES GENERALES */}
                    {tab === 'materiales' && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-800">Biblioteca de Recursos y Archivos</h3>
                            {materiales.length > 0 ? (
                                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                                    {materiales.map((m) => (
                                        <div key={m.id} className="p-4 rounded-xl border border-slate-200 flex justify-between items-center bg-white">
                                            <div>
                                                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                                    {m.tipo}
                                                </span>
                                                <h4 className="text-xs font-bold text-slate-800 mt-1">{m.nombre}</h4>
                                                <p className="text-[10px] text-slate-400">{m.fecha}</p>
                                            </div>
                                            <a
                                                href={m.ruta}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-3 py-1.5 bg-[#315d7a] text-white rounded-lg text-xs font-bold hover:bg-[#274b63] transition"
                                            >
                                                {m.tipo === 'video' ? 'Ver enlace' : 'Descargar'}
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 font-medium">No se han subido recursos aún.</p>
                            )}
                        </div>
                    )}

                    {/* 3. TAREAS */}
                    {tab === 'tareas' && (
                        <TabTareas tareas={tareas} />
                    )}

                    {/* 4. EVALUACIONES (Corregido: tab === 'evaluaciones') */}
                    {tab === 'evaluaciones' && (
                        <TabEvaluaciones evaluaciones={evaluaciones} />
                    )}

                    {/* 5. CLASES EN VIVO */}
                    {tab === 'clases_vivo' && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-800">Sesiones Sincrónicas en Vivo</h3>
                            {clasesVivo.length > 0 ? (
                                <div className="space-y-3">
                                    {clasesVivo.map((c) => (
                                        <div key={c.id} className="p-4 rounded-xl bg-sky-50/50 border border-sky-100 flex justify-between items-center">
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-800">{c.titulo}</h4>
                                                <p className="text-[10px] text-slate-500">Horario: {c.fecha_hora}</p>
                                            </div>
                                            <a
                                                href={c.enlace_zoom}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-4 py-2 bg-[#315d7a] text-white rounded-xl text-xs font-bold hover:bg-[#274b63] transition"
                                            >
                                                Unirse a la Sesión
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 font-medium">No hay videoconferencias agendadas.</p>
                            )}
                        </div>
                    )}

                    {/* 6. SÍLABO */}
                    {tab === 'silabo' && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-800">Sílabo Oficial del Curso</h3>
                            {silabo ? (
                                <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50">
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">Plan de Estudios General</p>
                                        <p className="text-[10px] text-slate-400">Documento PDF cargado por la coordinación/docente</p>
                                    </div>
                                    <a
                                        href={silabo}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-4 py-2 bg-[#315d7a] text-white rounded-xl text-xs font-bold hover:bg-[#274b63] transition"
                                    >
                                        Ver / Descargar Sílabo
                                    </a>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 font-medium">El sílabo aún no está disponible.</p>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}