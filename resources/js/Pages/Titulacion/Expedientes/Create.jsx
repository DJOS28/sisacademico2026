import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useRef, useState, useEffect } from 'react';

export default function Create({
    estudiantes = [],
    planes = [],
    modalidades = [],
    asesores = [],
    requisitos = [],
}) {
    const [select2Abierto, setSelect2Abierto] = useState(false);
    const [busquedaEstudiante, setBusquedaEstudiante] = useState('');
    const select2Ref = useRef(null);

    const { data, setData, post, processing, errors } = useForm({
        estudiante_id: '',
        plan_estudio_id: '',
        modalidad_id: modalidades[0]?.id || '',
        asesor_id: '',
        titulo_proyecto: '',
        fecha_solicitud: new Date().toISOString().split('T')[0],
        archivo_proyecto: null,
    });

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (select2Ref.current && !select2Ref.current.contains(e.target)) {
                setSelect2Abierto(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const estudiantesFiltrados = useMemo(() => {
        if (!busquedaEstudiante.trim()) return estudiantes;
        const q = busquedaEstudiante.toLowerCase();
        return estudiantes.filter(
            (e) =>
                (e.dni || '').toLowerCase().includes(q) ||
                (e.apellidos || '').toLowerCase().includes(q) ||
                (e.nombres || '').toLowerCase().includes(q)
        );
    }, [estudiantes, busquedaEstudiante]);

    const estudianteSeleccionado = useMemo(() => {
        return estudiantes.find((e) => String(e.id_postulante) === String(data.estudiante_id));
    }, [estudiantes, data.estudiante_id]);

    const seleccionarEstudiante = (est) => {
        setData('estudiante_id', est ? est.id_postulante : '');
        setSelect2Abierto(false);
        setBusquedaEstudiante('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('titulaciones.store'), {
            forceFormData: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Aperturar Expediente de Titulación</h1>
                        <p className="text-xs text-slate-500">Registro inicial de solicitud de grado y generación de checklist de requisitos.</p>
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
            <Head title="Aperturar Expediente de Titulación" />

            <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                    {/* SECCIÓN 1: DATOS DEL EGRESADO Y PROGRAMA */}
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2 mb-4">
                            1. Datos del Egresado y Programa Académico
                        </h2>

                        <div className="space-y-4">
                            {/* SELECT2 DE ESTUDIANTE */}
                            <div className="relative" ref={select2Ref}>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Egresado Postulante al Título <span className="text-rose-500">*</span>
                                </label>

                                <div
                                    onClick={() => setSelect2Abierto(!select2Abierto)}
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 bg-white cursor-pointer flex justify-between items-center hover:border-slate-400 focus:border-[#315d7a] transition"
                                >
                                    <span className={estudianteSeleccionado ? 'font-bold text-slate-900' : 'text-slate-400'}>
                                        {estudianteSeleccionado
                                            ? `DNI: ${estudianteSeleccionado.dni} — ${estudianteSeleccionado.apellidos}, ${estudianteSeleccionado.nombres}`
                                            : '-- Seleccione al egresado --'}
                                    </span>
                                    <span className="text-slate-400 text-xs">{select2Abierto ? '▲' : '▼'}</span>
                                </div>

                                {select2Abierto && (
                                    <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                        <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                                            <input
                                                type="text"
                                                autoFocus
                                                value={busquedaEstudiante}
                                                onChange={(e) => setBusquedaEstudiante(e.target.value)}
                                                placeholder="Buscar por DNI o apellidos..."
                                                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs outline-none focus:border-[#315d7a] bg-white"
                                            />
                                        </div>

                                        <div className="max-h-52 overflow-y-auto divide-y divide-slate-50 text-xs">
                                            {estudiantesFiltrados.length > 0 ? (
                                                estudiantesFiltrados.map((est) => (
                                                    <div
                                                        key={est.id_postulante}
                                                        onClick={() => seleccionarEstudiante(est)}
                                                        className={`px-3.5 py-2 hover:bg-sky-50 cursor-pointer transition flex items-center justify-between ${
                                                            String(data.estudiante_id) === String(est.id_postulante)
                                                                ? 'bg-sky-50 font-bold text-[#315d7a]'
                                                                : 'text-slate-800'
                                                        }`}
                                                    >
                                                        <span>
                                                            <strong className="font-mono text-slate-900">DNI: {est.dni}</strong> — {est.apellidos}, {est.nombres}
                                                        </span>
                                                        {String(data.estudiante_id) === String(est.id_postulante) && (
                                                            <span className="text-[#315d7a] text-xs">✓</span>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-3.5 py-4 text-center text-slate-400 text-xs italic">
                                                    No se encontraron egresados.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <InputError message={errors.estudiante_id} className="mt-1" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Programa de Estudios / Carrera <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.plan_estudio_id}
                                        onChange={(e) => setData('plan_estudio_id', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                    >
                                        <option value="">-- Seleccione Programa --</option>
                                        {planes.map((p) => (
                                            <option key={p.id} value={p.id}>[{p.codigo}] {p.nombre}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.plan_estudio_id} className="mt-1" />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Modalidad de Titulación <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.modalidad_id}
                                        onChange={(e) => setData('modalidad_id', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                    >
                                        {modalidades.map((m) => (
                                            <option key={m.id} value={m.id}>{m.nombre}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.modalidad_id} className="mt-1" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 2: PROYECTO DE INVESTIGACIÓN Y ASESOR */}
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2 mb-4">
                            2. Proyecto / Tesis y Asesoría
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Título del Proyecto / Tesis / Memoria Técnica
                                </label>
                                <textarea
                                    rows={2}
                                    value={data.titulo_proyecto}
                                    onChange={(e) => setData('titulo_proyecto', e.target.value)}
                                    placeholder="Ingrese la denominación completa del proyecto de titulación..."
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                />
                                <InputError message={errors.titulo_proyecto} className="mt-1" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Docente Asesor Asignado
                                    </label>
                                    <select
                                        value={data.asesor_id}
                                        onChange={(e) => setData('asesor_id', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                    >
                                        <option value="">-- Por asignar / Sin asesor --</option>
                                        {asesores.map((doc) => (
                                            <option key={doc.id} value={doc.id}>
                                                {doc.nombre} {doc.apellido}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.asesor_id} className="mt-1" />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Fecha de Solicitud de Apertura <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={data.fecha_solicitud}
                                        onChange={(e) => setData('fecha_solicitud', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                    />
                                    <InputError message={errors.fecha_solicitud} className="mt-1" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Documento del Proyecto (PDF / Word - Máx. 25MB)
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,.docx,.doc"
                                    onChange={(e) => setData('archivo_proyecto', e.target.files[0])}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-800 file:mr-3 file:rounded-lg file:border-0 file:bg-[#315d7a] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-[#274b63] cursor-pointer"
                                />
                                <InputError message={errors.archivo_proyecto} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* AVISO DEL CHECKLIST AUTOMÁTICO */}
                    <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 text-xs text-[#315d7a] flex items-start gap-3">
                        <span className="text-lg">ℹ️</span>
                        <div>
                            <strong className="block font-bold">Generación Automática de Requisitos:</strong>
                            Al registrar el expediente se creará automáticamente el checklist con los <strong>{requisitos.length} requisitos</strong> configurados en el sistema para su posterior validación y carga documental.
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Link
                            href={route('titulaciones.index')}
                            className="rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl bg-[#315d7a] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#274b63] transition shadow-xs disabled:opacity-50 cursor-pointer"
                        >
                            {processing ? 'Aperturando...' : 'Aperturar Expediente'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}