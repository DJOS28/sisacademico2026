import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

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
        award: (
            <>
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
            </>
        ),
        plus: (
            <>
                <path d="M5 12h14" />
                <path d="M12 5v14" />
            </>
        ),
        pencil: (
            <>
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </>
        ),
        trash: (
            <>
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </>
        ),
        layers: (
            <>
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
            </>
        ),
    };

    return <svg {...props}>{icons[name] ?? null}</svg>;
}

export default function LogrosIndex({ curso, seccion, periodo, logros = [], filters = {} }) {
    // Estados para Modales
    const [modalLogro, setModalLogro] = useState(false);
    const [editingLogro, setEditingLogro] = useState(null); // Null = Crear, Objeto = Editar
    const [selectedLogroForSub, setSelectedLogroForSub] = useState(null);

    // Formulario para Crear / Editar Logro
    const {
        data: dataLogro,
        setData: setDataLogro,
        post: postLogro,
        put: putLogro,
        reset: resetLogro,
        errors: errorsLogro,
        processing: processingLogro,
        clearErrors: clearErrorsLogro,
    } = useForm({
        curso_id: curso.id,
        seccion_id: seccion.id,
        periodo_id: periodo?.id ?? '',
        nombre: '',
        descripcion: '',
    });

    // Formulario para Crear Subcomponente
    const {
        data: dataSub,
        setData: setDataSub,
        post: postSub,
        reset: resetSub,
        errors: errorsSub,
        processing: processingSub,
        clearErrors: clearErrorsSub,
    } = useForm({
        nombre: '',
        descripcion: '',
        peso: '',
    });

    // Abrir modal de creación de logro
    const openCreateLogroModal = () => {
        clearErrorsLogro();
        setEditingLogro(null);
        setDataLogro({
            curso_id: curso.id,
            seccion_id: seccion.id,
            periodo_id: periodo?.id ?? '',
            nombre: '',
            descripcion: '',
        });
        setModalLogro(true);
    };

    // Abrir modal de edición de logro
    const openEditLogroModal = (logro) => {
        clearErrorsLogro();
        setEditingLogro(logro);
        setDataLogro({
            curso_id: curso.id,
            seccion_id: seccion.id,
            periodo_id: periodo?.id ?? '',
            nombre: logro.nombre,
            descripcion: logro.descripcion || '',
        });
        setModalLogro(true);
    };

    // Guardar o Actualizar Logro
    const handleSaveLogro = (e) => {
        e.preventDefault();

        if (editingLogro) {
            // Actualizar logro existente
            putLogro(route('logros.update', editingLogro.id), {
                onSuccess: () => {
                    setModalLogro(false);
                    resetLogro();
                    setEditingLogro(null);
                },
            });
        } else {
            // Crear nuevo logro
            postLogro(route('cursos.logros.store'), {
                onSuccess: () => {
                    setModalLogro(false);
                    resetLogro();
                },
            });
        }
    };

    // Eliminar Logro
    const handleDeleteLogro = (logroId) => {
        if (confirm('¿Deseas eliminar este logro de aprendizaje y todos sus subcomponentes?')) {
            router.delete(route('logros.destroy', logroId));
        }
    };

    // Abrir Modal de Subcomponente
    const openSubcomponenteModal = (logro) => {
        clearErrorsSub();
        setSelectedLogroForSub(logro);
        resetSub();
    };

    // Guardar Subcomponente
    const handleStoreSubcomponente = (e) => {
        e.preventDefault();
        if (!selectedLogroForSub) return;

        postSub(route('logros.subcomponentes.store', selectedLogroForSub.id), {
            onSuccess: () => {
                setSelectedLogroForSub(null);
                resetSub();
            },
        });
    };

    // Eliminar Subcomponente
    const handleDeleteSubcomponente = (subId) => {
        if (confirm('¿Deseas eliminar este subcomponente de evaluación?')) {
            router.delete(route('subcomponentes.destroy', subId));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => router.get(route('docente.cursos'))}
                            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
                            title="Volver a mis cursos"
                        >
                            <Icon name="arrowLeft" className="h-5 w-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                    Sec. {seccion.nombre}
                                </span>
                                <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                                    Periodo {periodo?.nombre}
                                </span>
                            </div>
                            <h1 className="mt-1 text-xl font-bold text-slate-900">
                                Logros de Aprendizaje: <span className="text-[#315d7a]">{curso.nombre}</span>
                            </h1>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateLogroModal}
                        className="inline-flex items-center gap-2 bg-[#315d7a] hover:bg-[#254860] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs"
                    >
                        <Icon name="plus" className="h-4 w-4" />
                        <span>Nuevo Logro</span>
                    </button>
                </div>
            }
        >
            <Head title={`Logros - ${curso.nombre}`} />

            <div className="space-y-6">

                {/* LISTA DE LOGROS DE APRENDIZAJE */}
                {logros.length > 0 ? (
                    <div className="space-y-5">
                        {logros.map((logro, index) => {
                            const totalPeso = logro.subcomponentes?.reduce((acc, item) => acc + Number(item.peso), 0) || 0;

                            return (
                                <div key={logro.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                                    
                                    {/* Encabezado del Logro */}
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
                                        <div className="flex items-start gap-3">
                                            <div className="h-9 w-9 shrink-0 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold text-sm">
                                                L{index + 1}
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900">{logro.nombre}</h3>
                                                {logro.descripcion && (
                                                    <p className="text-xs text-slate-500 mt-0.5">{logro.descripcion}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => openSubcomponenteModal(logro)}
                                                className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                                            >
                                                <Icon name="plus" className="h-3.5 w-3.5 text-[#315d7a]" />
                                                <span>Añadir Criterio</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => openEditLogroModal(logro)}
                                                className="p-1.5 rounded-lg text-slate-500 hover:text-[#315d7a] hover:bg-slate-100 transition"
                                                title="Editar Logro"
                                            >
                                                <Icon name="pencil" className="h-4 w-4" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDeleteLogro(logro.id)}
                                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                                                title="Eliminar Logro"
                                            >
                                                <Icon name="trash" className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Subcomponentes / Criterios */}
                                    <div className="pl-0 sm:pl-12">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                <Icon name="layers" className="h-3.5 w-3.5 text-[#315d7a]" />
                                                Subcomponentes de evaluación ({logro.subcomponentes?.length || 0})
                                            </span>
                                            <span className={`text-xs font-bold ${totalPeso === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                Peso Total: {totalPeso}% {totalPeso !== 100 && '(Recomendado: 100%)'}
                                            </span>
                                        </div>

                                        {logro.subcomponentes && logro.subcomponentes.length > 0 ? (
                                            <div className="grid gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                                {logro.subcomponentes.map((sub) => (
                                                    <div key={sub.id} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-slate-800 truncate">{sub.nombre}</p>
                                                            {sub.descripcion && <p className="text-[11px] text-slate-400 truncate">{sub.descripcion}</p>}
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className="bg-white border border-slate-200 text-[#315d7a] text-[11px] font-bold px-2 py-0.5 rounded-md">
                                                                {sub.peso}%
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteSubcomponente(sub.id)}
                                                                className="text-slate-400 hover:text-rose-600 transition"
                                                                title="Eliminar Subcomponente"
                                                            >
                                                                <Icon name="trash" className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 italic bg-slate-50 border border-dashed border-slate-200 p-3 rounded-xl text-center">
                                                No hay subcomponentes asignados a este logro aún.
                                            </p>
                                        )}
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
                        <div className="mx-auto h-12 w-12 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-3">
                            <Icon name="award" className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">No has registrado logros de aprendizaje</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            Comienza agregando los logros que los estudiantes alcanzarán en esta asignatura para la Sección {seccion.nombre}.
                        </p>
                    </div>
                )}

            </div>

            {/* MODAL CREAR / EDITAR LOGRO */}
            {modalLogro && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
                        <h3 className="text-base font-bold text-slate-900">
                            {editingLogro ? 'Editar Logro de Aprendizaje' : 'Registrar Nuevo Logro'}
                        </h3>
                        
                        <form onSubmit={handleSaveLogro} className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Logro *</label>
                                <input
                                    type="text"
                                    required
                                    value={dataLogro.nombre}
                                    onChange={(e) => setDataLogro('nombre', e.target.value)}
                                    placeholder="Ej. Logro 1: Aplica pruebas serológicas..."
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-[#315d7a]"
                                />
                                {errorsLogro.nombre && <p className="text-[11px] text-rose-500 mt-1">{errorsLogro.nombre}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción</label>
                                <textarea
                                    rows={3}
                                    value={dataLogro.descripcion}
                                    onChange={(e) => setDataLogro('descripcion', e.target.value)}
                                    placeholder="Detalles sobre las competencias a evaluar..."
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-[#315d7a]"
                                />
                                {errorsLogro.descripcion && <p className="text-[11px] text-rose-500 mt-1">{errorsLogro.descripcion}</p>}
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setModalLogro(false);
                                        setEditingLogro(null);
                                    }}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingLogro}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#315d7a] hover:bg-[#254860] disabled:opacity-50"
                                >
                                    {editingLogro ? 'Actualizar Logro' : 'Guardar Logro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL CREAR SUBCOMPONENTE */}
            {selectedLogroForSub && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
                        <h3 className="text-base font-bold text-slate-900">
                            Agregar Criterio a: <span className="text-[#315d7a]">{selectedLogroForSub.nombre}</span>
                        </h3>

                        <form onSubmit={handleStoreSubcomponente} className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Criterio *</label>
                                <input
                                    type="text"
                                    required
                                    value={dataSub.nombre}
                                    onChange={(e) => setDataSub('nombre', e.target.value)}
                                    placeholder="Ej. Examen Teórico, Práctica de Laboratorio..."
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-[#315d7a]"
                                />
                                {errorsSub.nombre && <p className="text-[11px] text-rose-500 mt-1">{errorsSub.nombre}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Peso / Porcentaje (%) *</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max="100"
                                    value={dataSub.peso}
                                    onChange={(e) => setDataSub('peso', e.target.value)}
                                    placeholder="Ej. 40"
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-[#315d7a]"
                                />
                                {errorsSub.peso && <p className="text-[11px] text-rose-500 mt-1">{errorsSub.peso}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción</label>
                                <input
                                    type="text"
                                    value={dataSub.descripcion}
                                    onChange={(e) => setDataSub('descripcion', e.target.value)}
                                    placeholder="Opcional..."
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-[#315d7a]"
                                />
                                {errorsSub.descripcion && <p className="text-[11px] text-rose-500 mt-1">{errorsSub.descripcion}</p>}
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedLogroForSub(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingSub}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#315d7a] hover:bg-[#254860] disabled:opacity-50"
                                >
                                    Guardar Criterio
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </AuthenticatedLayout>
    );
}