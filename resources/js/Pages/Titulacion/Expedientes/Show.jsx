import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { useEffect, useState } from 'react';

const ESTADOS_CONFIG = {
    Iniciado: { label: 'Iniciado', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
    En_Revision: { label: 'En Revisión', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    Apto_Sustentacion: { label: 'Apto para Sustentación', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    Sustentado: { label: 'Sustentado', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
    Titulado: { label: 'Titulado', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
    Observado: { label: 'Observado', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    Rechazado: { label: 'Rechazado', bg: 'bg-red-100 text-red-800 border-red-200' },
};

export default function Show({ titulacion, docentes = [] }) {
    const { flash } = usePage().props;

    // Estado del modal de subida de archivo para un requisito
    const [modalSubirOpen, setModalSubirOpen] = useState(false);
    const [requisitoSeleccionado, setRequisitoSeleccionado] = useState(null);

    // Estado del modal de evaluación de requisito
    const [modalEvaluarOpen, setModalEvaluarOpen] = useState(false);
    const [requisitoAEvaluar, setRequisitoAEvaluar] = useState(null);

    // Formulario de subida de archivo
    const { data: uploadData, setData: setUploadData, post: postUpload, processing: uploadProcessing, errors: uploadErrors, reset: resetUpload } = useForm({
        archivo: null,
    });

    // Formulario de evaluación
    const { data: evalData, setData: setEvalData, patch: patchEval, processing: evalProcessing, errors: evalErrors, reset: resetEval } = useForm({
        estado: 'Aprobado',
        observacion: '',
    });

    useEffect(() => {
        if (flash?.success) {
            Swal.fire({
                icon: 'success',
                title: 'Completado',
                text: flash.success,
                timer: 2000,
                showConfirmButton: false,
            });
        }
        if (flash?.error) {
            Swal.fire({
                icon: 'error',
                title: 'Atención',
                text: flash.error,
            });
        }
    }, [flash]);

    const abrirModalSubir = (reqExp) => {
        setRequisitoSeleccionado(reqExp);
        resetUpload();
        setModalSubirOpen(true);
    };

    const handleSubirArchivo = (e) => {
        e.preventDefault();
        postUpload(route('titulaciones.requisito.subir', requisitoSeleccionado.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setModalSubirOpen(false);
                setRequisitoSeleccionado(null);
            },
        });
    };

    const abrirModalEvaluar = (reqExp) => {
        setRequisitoAEvaluar(reqExp);
        setEvalData({
            estado: reqExp.estado === 'Aprobado' ? 'Aprobado' : 'Aprobado',
            observacion: reqExp.observacion || '',
        });
        setModalEvaluarOpen(true);
    };

    const handleEvaluarRequisito = (e) => {
        e.preventDefault();
        patchEval(route('titulaciones.requisito.evaluar', requisitoAEvaluar.id), {
            preserveScroll: true,
            onSuccess: () => {
                setModalEvaluarOpen(false);
                setRequisitoAEvaluar(null);
            },
        });
    };

    const handleCambiarEstadoExpediente = (nuevoEstado) => {
        router.patch(
            route('titulaciones.estado', titulacion.id),
            { estado: nuevoEstado },
            { preserveScroll: true }
        );
    };

    const configEstado = ESTADOS_CONFIG[titulacion.estado] || { label: titulacion.estado, bg: 'bg-slate-100 text-slate-700' };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-mono">
                                {titulacion.codigo_expediente}
                            </h1>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${configEstado.bg}`}>
                                {configEstado.label}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">Expediente de Titulación y Seguimiento de Requisitos.</p>
                    </div>
                    <Link
                        href={route('titulaciones.index')}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                        Volver a la lista
                    </Link>
                </div>
            }
        >
            <Head title={`Expediente ${titulacion.codigo_expediente}`} />

            <div className="space-y-6">
                {/* 1. RESUMEN PRINCIPAL DEL EXPEDIENTE */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Datos del Egresado y Carrera */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                            Datos del Postulante
                        </h2>
                        <div className="space-y-1.5 text-xs">
                            <div>
                                <span className="text-slate-400 block text-[11px]">Egresado:</span>
                                <strong className="text-slate-900 text-sm">
                                    {titulacion.estudiante?.apellidos}, {titulacion.estudiante?.nombres}
                                </strong>
                            </div>
                            <div>
                                <span className="text-slate-400 block text-[11px]">DNI:</span>
                                <strong className="text-slate-800 font-mono">{titulacion.estudiante?.dni}</strong>
                            </div>
                            <div>
                                <span className="text-slate-400 block text-[11px]">Programa de Estudios:</span>
                                <span className="font-semibold text-[#315d7a]">
                                    🎓 {titulacion.plan_estudio?.nombre}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 block text-[11px]">Modalidad de Titulación:</span>
                                <span className="font-semibold text-slate-700">
                                    {titulacion.modalidad?.nombre}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Datos del Proyecto y Asesor */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                            Proyecto / Tesis
                        </h2>
                        <div className="space-y-2 text-xs">
                            <div>
                                <span className="text-slate-400 block text-[11px]">Título:</span>
                                <p className="font-bold text-slate-900 leading-snug">
                                    {titulacion.titulo_proyecto || <span className="text-slate-400 italic">No especificado</span>}
                                </p>
                            </div>
                            <div>
                                <span className="text-slate-400 block text-[11px]">Docente Asesor:</span>
                                <strong className="text-slate-700">
                                    {titulacion.asesor ? `${titulacion.asesor.nombre} ${titulacion.asesor.apellido}` : 'Sin asesor asignado'}
                                </strong>
                            </div>
                            {titulacion.archivo_proyecto && (
                                <a
                                    href={route('titulaciones.descargar', ['proyecto', titulacion.id])}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 bg-sky-50 text-[#315d7a] font-bold px-3 py-1.5 rounded-xl border border-sky-200 text-xs hover:bg-sky-100 transition"
                                >
                                    📄 Ver Documento del Proyecto
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Control de Estado del Expediente */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                            Gestión del Estado
                        </h2>
                        <div className="space-y-3 text-xs">
                            <div>
                                <span className="text-slate-400 block text-[11px] mb-1">Cambiar Estado Manualmente:</span>
                                <select
                                    value={titulacion.estado}
                                    onChange={(e) => handleCambiarEstadoExpediente(e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#315d7a]"
                                >
                                    <option value="Iniciado">Iniciado</option>
                                    <option value="En_Revision">En Revisión</option>
                                    <option value="Apto_Sustentacion">Apto para Sustentación</option>
                                    <option value="Sustentado">Sustentado</option>
                                    <option value="Titulado">Titulado</option>
                                    <option value="Observado">Observado</option>
                                    <option value="Rechazado">Rechazado</option>
                                </select>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                                💡 Cuando todos los requisitos obligatorios son aprobados, el expediente pasa automáticamente al estado <strong>Apto para Sustentación</strong>.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. CHECKLIST Y AUDITORÍA DE REQUISITOS DOCUMENTALES */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                Checklist de Requisitos Documentales
                            </h2>
                            <p className="text-xs text-slate-500">Suba y dictamine los documentos presentados por el egresado.</p>
                        </div>
                        <span className="font-mono text-xs font-bold text-[#315d7a] bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
                            {titulacion.requisitos_expediente?.filter((r) => r.estado === 'Aprobado').length || 0} / {titulacion.requisitos_expediente?.length || 0} Aprobados
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-4 w-10 text-center">#</th>
                                    <th className="py-3 px-4 min-w-[220px]">Requisito / Documento</th>
                                    <th className="py-3 px-4 text-center w-28">Carácter</th>
                                    <th className="py-3 px-4 text-center min-w-[130px]">Archivo Adjunto</th>
                                    <th className="py-3 px-4 text-center w-32">Dictamen</th>
                                    <th className="py-3 px-4 min-w-[180px]">Observaciones del Revisor</th>
                                    <th className="py-3 px-4 text-right min-w-[150px]">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {titulacion.requisitos_expediente && titulacion.requisitos_expediente.length > 0 ? (
                                    titulacion.requisitos_expediente.map((reqExp, idx) => {
                                        return (
                                            <tr key={reqExp.id} className="hover:bg-slate-50 transition">
                                                <td className="py-3 px-4 text-center font-mono text-slate-400">
                                                    {idx + 1}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="font-bold text-slate-900 block">{reqExp.requisito?.nombre}</span>
                                                    {reqExp.requisito?.descripcion && (
                                                        <span className="text-[11px] text-slate-400 line-clamp-1">{reqExp.requisito?.descripcion}</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                        reqExp.requisito?.es_obligatorio
                                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                            : 'bg-slate-100 text-slate-600 border-slate-200'
                                                    }`}>
                                                        {reqExp.requisito?.es_obligatorio ? 'Obligatorio' : 'Opcional'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {reqExp.archivo_adjunto ? (
                                                        <a
                                                            href={route('titulaciones.descargar', ['requisito', reqExp.id])}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg font-bold border border-emerald-200 text-[11px] hover:bg-emerald-100 transition"
                                                        >
                                                            📄 Ver Archivo
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-400 italic text-[11px]">No subido</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                                        reqExp.estado === 'Aprobado'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : reqExp.estado === 'Observado'
                                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                            : 'bg-slate-100 text-slate-600 border-slate-200'
                                                    }`}>
                                                        {reqExp.estado}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-slate-600 text-[11px]">
                                                    {reqExp.observacion || <span className="text-slate-400 italic">Sin observaciones</span>}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => abrirModalSubir(reqExp)}
                                                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                                        >
                                                            Subir
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => abrirModalEvaluar(reqExp)}
                                                            className="rounded-lg bg-[#315d7a] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#274b63] transition cursor-pointer"
                                                        >
                                                            Evaluar
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-10 text-center text-slate-400 text-xs italic">
                                            No hay requisitos configurados en este expediente.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL PARA SUBIR DOCUMENTO DE UN REQUISITO */}
            {modalSubirOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Subir Archivo de Requisito</h3>
                                <p className="text-xs text-slate-500 font-semibold">{requisitoSeleccionado?.requisito?.nombre}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalSubirOpen(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubirArchivo} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Seleccione Archivo (PDF, JPG, PNG - Máx. 15MB) <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setUploadData('archivo', e.target.files[0])}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 file:mr-3 file:rounded-lg file:border-0 file:bg-[#315d7a] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-[#274b63] cursor-pointer"
                                />
                                <InputError message={uploadErrors.archivo} className="mt-1" />
                            </div>

                            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setModalSubirOpen(false)}
                                    disabled={uploadProcessing}
                                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploadProcessing || !uploadData.archivo}
                                    className="rounded-xl bg-[#315d7a] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#274b63] disabled:opacity-50 shadow-xs cursor-pointer"
                                >
                                    {uploadProcessing ? 'Subiendo...' : 'Cargar Documento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL PARA EVALUAR REQUISITO */}
            {modalEvaluarOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Evaluar Requisito</h3>
                                <p className="text-xs text-slate-500 font-semibold">{requisitoAEvaluar?.requisito?.nombre}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalEvaluarOpen(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleEvaluarRequisito} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Dictamen de Verificación <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={evalData.estado}
                                    onChange={(e) => setEvalData('estado', e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 font-bold outline-none focus:border-[#315d7a]"
                                >
                                    <option value="Aprobado">✅ Aprobado / Conforme</option>
                                    <option value="Observado">⚠️ Observado (Requiere subsanación)</option>
                                    <option value="Pendiente">⏳ Pendiente de revisión</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Observaciones / Motivo (Opcional)
                                </label>
                                <textarea
                                    rows={3}
                                    value={evalData.observacion}
                                    onChange={(e) => setEvalData('observacion', e.target.value)}
                                    placeholder="Indique las observaciones encontradas en el documento o detalles de validación..."
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                />
                                <InputError message={evalErrors.observacion} className="mt-1" />
                            </div>

                            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setModalEvaluarOpen(false)}
                                    disabled={evalProcessing}
                                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={evalProcessing}
                                    className="rounded-xl bg-[#315d7a] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#274b63] disabled:opacity-50 shadow-xs cursor-pointer"
                                >
                                    {evalProcessing ? 'Guardando...' : 'Guardar Evaluación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}