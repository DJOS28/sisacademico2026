import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';

// Módulos parciales
import SesionesTab from './Partials/SesionesTab';
import AsistenciaTab from './Partials/AsistenciaTab';
import MaterialesTab from './Partials/MaterialesTab';
import NotasTab from './Partials/NotasTab';
import ClaseEnVivoTab from './Partials/ClaseEnVivoTab';
import TareasTab from './Partials/TareasTab';
import SilaboTab from './Partials/SilaboTab';
import EvaluacionesTab from './Partials/EvaluacionesTab';
function Icon({ name, className = 'h-5 w-5' }) {
    const props = {
        className,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
    };

    const icons = {
        arrowLeft: (
            <>
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
            </>
        ),
        bookOpen: (
            <>
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </>
        ),
        calendar: (
            <>
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
            </>
        ),
        folder: (
            <>
                <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
            </>
        ),
        fileText: (
            <>
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                <path d="M10 9H8" />
                <path d="M16 13H8" />
                <path d="M16 17H8" />
            </>
        ),
        checkSquare: (
            <>
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </>
        ),
        messageSquare: (
            <>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </>
        ),
        clock: (
            <>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
            </>
        ),
        barChart: (
            <>
                <line x1="12" x2="12" y1="20" y2="10" />
                <line x1="18" x2="18" y1="20" y2="4" />
                <line x1="6" x2="6" y1="20" y2="16" />
            </>
        ),
        award: (
            <>
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
            </>
        ),
        plus: (
            <>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
            </>
        ),
        video: (
            <>
                <path d="m22 8-6 4 6 4V8Z" />
                <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
            </>
        )
    };

    return <svg {...props}>{icons[name] ?? null}</svg>;
}

export default function GestionarIndex({ curso, seccion, periodo, sesiones = [], materiales = [], subcomponentes = [] }) {
    const { auth } = usePage().props;
    
    // Pestaña activa por defecto
    const [activeTab, setActiveTab] = useState('sesiones');
    const [startCall, setStartCall] = useState(false);

    // Módulos del Panel de Gestión del Curso
    const tabs = [
        { id: 'silabo', label: 'Sílabo', icon: 'bookOpen' },
        { id: 'sesiones', label: 'Sesiones / Semanas', icon: 'calendar' },
        { id: 'materiales', label: 'Materiales', icon: 'folder' },
        { id: 'clase_en_vivo', label: 'Clase en Vivo', icon: 'video' },
        { id: 'tareas', label: 'Tareas y Trabajos', icon: 'fileText' },
        { id: 'evaluaciones', label: 'Evaluaciones', icon: 'checkSquare' },
        { id: 'foros', label: 'Foros', icon: 'messageSquare' },
        { id: 'asistencia', label: 'Asistencia', icon: 'clock' },
        { id: 'notas', label: 'Registro de Notas', icon: 'barChart' },
    ];

    // Redirección POST al módulo de Logros
    const irALogros = () => {
        router.post(route('cursos.logros'), {
            curso_id: curso.id,
            seccion_id: seccion.id,
            periodo_id: periodo?.id,
        });
    };

    // Nombre único de sala para aislar por Curso, Sección y Periodo
    const roomName = `LMS_Curso_${curso?.id}_Sec_${seccion?.id}_Per_${periodo?.id}`;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => router.get(route('docente.cursos'))}
                            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-2xs cursor-pointer"
                            title="Volver a mis cursos"
                        >
                            <Icon name="arrowLeft" className="h-5 w-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                {seccion?.nombre && (
                                    <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                        Sección {seccion.nombre}
                                    </span>
                                )}
                                {periodo?.nombre && (
                                    <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                                        Periodo {periodo.nombre}
                                    </span>
                                )}
                                {curso?.semestre && (
                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                                        {curso.semestre}
                                    </span>
                                )}
                            </div>
                            <h1 className="mt-1 text-xl font-bold text-slate-900">
                                Gestión del Curso: <span className="text-[#315d7a]">{curso?.nombre}</span>
                            </h1>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={irALogros}
                        className="inline-flex items-center gap-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                    >
                        <Icon name="award" className="h-4 w-4 text-amber-600" />
                        <span>Ver Logros de Aprendizaje</span>
                    </button>
                </div>
            }
        >
            <Head title={`Gestionar - ${curso?.nombre || 'Curso'}`} />

            <div className="space-y-6">

                {/* MENÚ DE PESTAÑAS (TABS) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs overflow-x-auto">
                    <div className="flex gap-1 min-w-max">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                        isActive
                                            ? 'bg-[#315d7a] text-white shadow-xs'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    <Icon name={tab.icon} className="h-4 w-4" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* CONTENIDO DE CADA PESTAÑA */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs min-h-[420px]">

                    {/* 1. SÍLABO */}
                    {activeTab === 'silabo' && (
                        <SilaboTab
                            cursoId={curso.id}
                            seccionId={seccion.id_seccion}
                            periodoId={periodo.id}
                        />
                    )}

                    {/* 2. SESIONES DE CLASE / SEMANAS */}
                    {activeTab === 'sesiones' && (
                        <SesionesTab sesiones={sesiones} />
                    )}

                    {/* 3. MATERIALES */}
                    {activeTab === 'materiales' && (
                        <MaterialesTab materiales={materiales} sesiones={sesiones} />
                    )}

                    {/* 4. CLASE EN VIVO */}
                    {activeTab === 'clase_en_vivo' && (
                        <ClaseEnVivoTab sesiones={sesiones} />
                    )}

                    {/* 5. TAREAS Y TRABAJOS */}
                    {activeTab === 'tareas' && (
                        <TareasTab 
                            curso={curso}
                            seccion={seccion}
                            periodo={periodo}
                            sesiones={sesiones} 
                            subcomponentes={subcomponentes} 
                        />
                    )}

                    {/* 6. EVALUACIONES */}
                    {activeTab === 'evaluaciones' && (
                        <EvaluacionesTab 
                            curso={curso} 
                            seccion={seccion} 
                            periodo={periodo} 
                        />
                    )}

                    {/* 7. FOROS */}
                    {activeTab === 'foros' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <Icon name="messageSquare" className="h-5 w-5 text-[#315d7a]" />
                                        Foros de Discusión y Consultas
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Espacio para debates académicos y atención de dudas de los estudiantes.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1.5 bg-[#315d7a] hover:bg-[#254860] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                                >
                                    <Icon name="plus" className="h-4 w-4" />
                                    <span>Nuevo Foro</span>
                                </button>
                            </div>
                            <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center bg-slate-50/50">
                                <Icon name="messageSquare" className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                                <p className="text-xs font-medium text-slate-500">No existen temas de discusión activos.</p>
                            </div>
                        </div>
                    )}

                    {/* 8. ASISTENCIA */}
                    {activeTab === 'asistencia' && (
                        <AsistenciaTab sesiones={sesiones} />
                    )}

                    {/* 9. REGISTRO DE NOTAS */}
                    {activeTab === 'notas' && (
                        <NotasTab />
                    )}

                </div>

            </div>
        </AuthenticatedLayout>
    );
}