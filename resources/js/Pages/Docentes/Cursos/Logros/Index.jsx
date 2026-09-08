import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
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
        bolt: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
    };

    return <svg {...props}>{icons[name] ?? null}</svg>;
}

export default function LogrosIndex({ curso, seccion, periodo, logros = [] }) {
    // Modales de Logro
    const [modalLogro, setModalLogro] = useState(false);
    const [editingLogro, setEditingLogro] = useState(null);

    // Modales de Subcomponente / Dimensión
    const [modalSub, setModalSub] = useState(false);
    const [editingSub, setEditingSub] = useState(null);
    const [selectedLogroForSub, setSelectedLogroForSub] = useState(null);

    // Modales de Criterio
    const [modalCriterio, setModalCriterio] = useState(false);
    const [editingCriterio, setEditingCriterio] = useState(null);
    const [selectedSubForCrit, setSelectedSubForCrit] = useState(null);
    const [criterioForm, setCriterioForm] = useState({ codigo: '', nombre: '', peso: 0 });
    const [generating, setGenerating] = useState(false);

    // Formulario de Logro
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

    // Formulario de Subcomponente (Dimensión) con Peso
    const {
        data: dataSub,
        setData: setDataSub,
        post: postSub,
        put: putSub,
        reset: resetSub,
        errors: errorsSub,
        processing: processingSub,
        clearErrors: clearErrorsSub,
    } = useForm({
        nombre: '',
        descripcion: '',
        peso: '33.33',
    });

    // -------------------------------------------------------------
    // GESTIÓN DE LOGROS
    // -------------------------------------------------------------
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

    const handleSaveLogro = (e) => {
        e.preventDefault();
        if (editingLogro) {
            putLogro(route('logros.update', editingLogro.id), {
                onSuccess: () => {
                    setModalLogro(false);
                    resetLogro();
                    setEditingLogro(null);
                },
            });
        } else {
            postLogro(route('cursos.logros.store'), {
                onSuccess: () => {
                    setModalLogro(false);
                    resetLogro();
                },
            });
        }
    };

    const handleDeleteLogro = (logroId) => {
        Swal.fire({
            title: '¿Eliminar Logro?',
            text: 'Se eliminarán sus dimensiones, criterios y notas asociadas.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        }).then((res) => {
            if (res.isConfirmed) {
                router.delete(route('logros.destroy', logroId));
            }
        });
    };

    // -------------------------------------------------------------
    // GESTIÓN DE SUBCOMPONENTES / DIMENSIONES (CON PESO)
    // -------------------------------------------------------------
    const openCreateSubModal = (logro) => {
        clearErrorsSub();
        setSelectedLogroForSub(logro);
        setEditingSub(null);
        setDataSub({
            nombre: '',
            descripcion: '',
            peso: '33.33',
        });
        setModalSub(true);
    };

    const openEditSubModal = (sub) => {
        clearErrorsSub();
        setSelectedLogroForSub(null);
        setEditingSub(sub);
        setDataSub({
            nombre: sub.nombre,
            descripcion: sub.descripcion || '',
            peso: sub.peso ? String(sub.peso) : '0',
        });
        setModalSub(true);
    };

    const handleSaveSubcomponente = (e) => {
        e.preventDefault();
        if (editingSub) {
            putSub(route('subcomponentes.update', editingSub.id), {
                onSuccess: () => {
                    setModalSub(false);
                    setEditingSub(null);
                    resetSub();
                },
            });
        } else if (selectedLogroForSub) {
            postSub(route('logros.subcomponentes.store', selectedLogroForSub.id), {
                onSuccess: () => {
                    setModalSub(false);
                    setSelectedLogroForSub(null);
                    resetSub();
                },
            });
        }
    };

    const handleDeleteSubcomponente = (subId) => {
        if (confirm('¿Deseas eliminar esta dimensión y todos sus criterios?')) {
            router.delete(route('subcomponentes.destroy', subId));
        }
    };

    // -------------------------------------------------------------
    // GESTIÓN DE CRITERIOS (CON PESO)
    // -------------------------------------------------------------
    const openCreateCriterioModal = (sub) => {
        setSelectedSubForCrit(sub);
        setEditingCriterio(null);
        setCriterioForm({
            codigo: `C${(sub.criterios?.length || 0) + 1}`,
            nombre: '',
            peso: 25,
        });
        setModalCriterio(true);
    };

    const openEditCriterioModal = (sub, crit) => {
        setSelectedSubForCrit(sub);
        setEditingCriterio(crit);
        setCriterioForm({
            codigo: crit.codigo,
            nombre: crit.nombre || '',
            peso: crit.peso ?? 0,
        });
        setModalCriterio(true);
    };

    const handleSaveCriterio = async (e) => {
        e.preventDefault();
        try {
            if (editingCriterio) {
                await axios.put(route('criterios.update', editingCriterio.id), {
                    codigo: criterioForm.codigo,
                    nombre: criterioForm.nombre,
                    peso: criterioForm.peso,
                });
            } else {
                await axios.post(route('criterios.store'), {
                    subcomponente_id: selectedSubForCrit.id,
                    codigo: criterioForm.codigo,
                    nombre: criterioForm.nombre,
                    peso: criterioForm.peso,
                    orden: (selectedSubForCrit.criterios?.length || 0) + 1,
                });
            }
            setModalCriterio(false);
            setEditingCriterio(null);
            router.reload({ only: ['logros'] });
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'No se pudo guardar el criterio.', 'error');
        }
    };

    const handleDeleteCriterio = async (critId) => {
        if (confirm('¿Deseas eliminar este criterio de evaluación?')) {
            try {
                await axios.delete(route('criterios.destroy', critId));
                router.reload({ only: ['logros'] });
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar el criterio.', 'error');
            }
        }
    };

    const handleGenerarCriteriosDefecto = async (subId) => {
        try {
            await axios.post(route('criterios.generar_defecto', subId));
            Swal.fire({
                icon: 'success',
                title: '¡Criterios C1-C4 Creados!',
                text: 'Se asignó 25% de peso a cada uno.',
                timer: 1300,
                showConfirmButton: false,
            });
            router.reload({ only: ['logros'] });
        } catch (error) {
            Swal.fire('Error', 'No se pudieron generar los criterios.', 'error');
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
                            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer"
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
                                Estructura de Logros y Criterios: <span className="text-[#315d7a]">{curso.nombre}</span>
                            </h1>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateLogroModal}
                        className="inline-flex items-center gap-2 bg-[#315d7a] hover:bg-[#254860] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                        <Icon name="plus" className="h-4 w-4" />
                        <span>Nuevo Logro</span>
                    </button>
                </div>
            }
        >
            <Head title={`Logros - ${curso.nombre}`} />

            <div className="space-y-6">
                {logros.length > 0 ? (
                    <div className="space-y-5">
                        {logros.map((logro, index) => {
                            const subcomponentes = logro.subcomponentes || [];

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

                                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                            <button
                                                type="button"
                                                onClick={() => openCreateSubModal(logro)}
                                                className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                                            >
                                                <Icon name="plus" className="h-3.5 w-3.5 text-[#315d7a]" />
                                                <span>+ Dimensión</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => openEditLogroModal(logro)}
                                                className="p-1.5 rounded-lg text-slate-500 hover:text-[#315d7a] hover:bg-slate-100 transition cursor-pointer"
                                                title="Editar Logro"
                                            >
                                                <Icon name="pencil" className="h-4 w-4" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDeleteLogro(logro.id)}
                                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                                                title="Eliminar Logro"
                                            >
                                                <Icon name="trash" className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Subcomponentes / Dimensiones */}
                                    <div className="pl-0 sm:pl-12">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                <Icon name="layers" className="h-3.5 w-3.5 text-[#315d7a]" />
                                                Dimensiones de Evaluación ({subcomponentes.length})
                                            </span>
                                        </div>

                                        {subcomponentes.length > 0 ? (
                                            <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
                                                {subcomponentes.map((sub) => {
                                                    const criteriosList = sub.criterios || [];

                                                    return (
                                                        <div key={sub.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 flex flex-col justify-between">
                                                            <div>
                                                                <div className="flex items-center justify-between gap-1">
                                                                    <div>
                                                                        <span className="text-xs font-black text-slate-900 tracking-wide uppercase">
                                                                            {sub.nombre}
                                                                        </span>
                                                                        <span className="ml-2 text-[11px] font-bold text-[#16A6A1] bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded">
                                                                            {Number(sub.peso || 0).toFixed(1)}%
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => openEditSubModal(sub)}
                                                                            className="text-slate-400 hover:text-[#315d7a] p-1 cursor-pointer"
                                                                            title="Editar Dimensión y Peso"
                                                                        >
                                                                            <Icon name="pencil" className="h-3.5 w-3.5" />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDeleteSubcomponente(sub.id)}
                                                                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                                                                            title="Eliminar Dimensión"
                                                                        >
                                                                            <Icon name="trash" className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {sub.descripcion && (
                                                                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{sub.descripcion}</p>
                                                                )}

                                                                {/* Chips de Criterios (con peso y botón editar/eliminar) */}
                                                                <div className="pt-2">
                                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                                                        Criterios ({criteriosList.length}):
                                                                    </span>
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {criteriosList.map((crit) => (
                                                                            <span
                                                                                key={crit.id}
                                                                                className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-800 text-[11px] font-mono font-bold px-2 py-0.5 rounded shadow-2xs group"
                                                                            >
                                                                                <span title={crit.nombre || crit.codigo}>{crit.codigo}</span>
                                                                                <span className="text-[9px] font-sans font-semibold text-teal-700 bg-teal-50 px-1 rounded">
                                                                                    {Number(crit.peso || 0).toFixed(0)}%
                                                                                </span>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => openEditCriterioModal(sub, crit)}
                                                                                    className="text-slate-300 hover:text-[#315d7a] ml-0.5 cursor-pointer"
                                                                                    title="Editar Criterio"
                                                                                >
                                                                                    ✎
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleDeleteCriterio(crit.id)}
                                                                                    className="text-slate-300 hover:text-rose-500 cursor-pointer"
                                                                                    title="Eliminar Criterio"
                                                                                >
                                                                                    ✕
                                                                                </button>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Acciones del Subcomponente */}
                                                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1">
                                                                {criteriosList.length === 0 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleGenerarCriteriosDefecto(sub.id)}
                                                                        className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                                                                    >
                                                                        + Auto C1-C4
                                                                    </button>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openCreateCriterioModal(sub)}
                                                                    className="text-[11px] font-bold text-[#315d7a] hover:underline cursor-pointer ml-auto"
                                                                >
                                                                    + Criterio
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                                                <p className="text-xs text-slate-400 italic">
                                                    No hay dimensiones configuradas para este logro.
                                                </p>
                                            </div>
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
                                    placeholder="Ej. Indicador 1: Fundamentos..."
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
                                    placeholder="Detalles del logro..."
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-[#315d7a]"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setModalLogro(false); setEditingLogro(null); }}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingLogro}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#315d7a] hover:bg-[#254860] disabled:opacity-50 cursor-pointer"
                                >
                                    {editingLogro ? 'Actualizar Logro' : 'Guardar Logro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL CREAR / EDITAR SUBCOMPONENTE (DIMENSIÓN) */}
            {modalSub && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
                        <h3 className="text-base font-bold text-slate-900">
                            {editingSub ? `Editar Dimensión: ${editingSub.nombre}` : `Agregar Dimensión a: ${selectedLogroForSub?.nombre}`}
                        </h3>
                        <form onSubmit={handleSaveSubcomponente} className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de la Dimensión *</label>
                                <input
                                    type="text"
                                    required
                                    value={dataSub.nombre}
                                    onChange={(e) => setDataSub('nombre', e.target.value)}
                                    placeholder="Ej. ACTITUDINAL, CONCEPTUAL, PROCEDIMENTAL..."
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-[#315d7a]"
                                />
                                {errorsSub.nombre && <p className="text-[11px] text-rose-500 mt-1">{errorsSub.nombre}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Peso Ponderado (%) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    required
                                    value={dataSub.peso}
                                    onChange={(e) => setDataSub('peso', e.target.value)}
                                    placeholder="Ej. 33.33 o 50"
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none font-bold focus:border-[#315d7a]"
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
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setModalSub(false); setEditingSub(null); setSelectedLogroForSub(null); }}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingSub}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#315d7a] hover:bg-[#254860] disabled:opacity-50 cursor-pointer"
                                >
                                    {editingSub ? 'Actualizar Dimensión' : 'Guardar Dimensión'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL CREAR / EDITAR CRITERIO INDIVIDUAL */}
            {modalCriterio && selectedSubForCrit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-6 space-y-4">
                        <h3 className="text-base font-bold text-slate-900">
                            {editingCriterio ? `Editar Criterio ${editingCriterio.codigo}` : `Nuevo Criterio en: ${selectedSubForCrit.nombre}`}
                        </h3>

                        <form onSubmit={handleSaveCriterio} className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Código *</label>
                                    <input
                                        type="text"
                                        required
                                        value={criterioForm.codigo}
                                        onChange={(e) => setCriterioForm({ ...criterioForm, codigo: e.target.value })}
                                        placeholder="Ej: C1, C2"
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono font-bold uppercase outline-none focus:border-[#315d7a]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Peso (%) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        required
                                        value={criterioForm.peso}
                                        onChange={(e) => setCriterioForm({ ...criterioForm, peso: e.target.value })}
                                        placeholder="Ej: 25"
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold outline-none focus:border-[#315d7a]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción / Instrumento</label>
                                <input
                                    type="text"
                                    value={criterioForm.nombre}
                                    onChange={(e) => setCriterioForm({ ...criterioForm, nombre: e.target.value })}
                                    placeholder="Ej: Examen escrito, Rúbrica..."
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-[#315d7a]"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setModalCriterio(false); setEditingCriterio(null); }}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#315d7a] hover:bg-[#254860] cursor-pointer"
                                >
                                    {editingCriterio ? 'Actualizar Criterio' : 'Guardar Criterio'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}