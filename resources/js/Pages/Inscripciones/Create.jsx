import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function Create({ admisiones = [], planesEstudio = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        // 1. Proceso Académico
        id_admision: admisiones[0]?.id_admision ?? '',
        id_plan: '',
        segunda_opcion: '',
        estado: 'inscrito',
        observacion: '',

        // 2. Datos Personales del Nuevo Postulante
        nombres: '',
        apellidos: '',
        dni: '',
        email: '',
        telefono: '',
        genero: 'Masculino',
        fecha_nacimiento: '',
        direccion: '',
    });

    const guardar = (e) => {
        e.preventDefault();
        post(route('inscripciones.store'), {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: '¡Registrado!',
                    text: 'El postulante y su inscripción fueron guardados con éxito.',
                    icon: 'success',
                    confirmButtonColor: '#315d7a',
                });
            },
            onError: () => {
                Swal.fire({
                    title: 'Verifique los Datos',
                    text: 'Existen errores o campos requeridos sin completar.',
                    icon: 'warning',
                    confirmButtonColor: '#315d7a',
                });
            },
        });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-slate-900">Nueva Inscripción</h1>}>
            <Head title="Nueva Inscripción Presencial" />

            <div className="w-full space-y-6">
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Registro Completo de Inscripción</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Cree la ficha del postulante e inscríbalo directamente en un proceso de admisión.
                        </p>
                    </div>

                    <Link
                        href={route('inscripciones.index')}
                        className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        Volver al listado
                    </Link>
                </div>

                <form onSubmit={guardar} className="space-y-6">
                    {/* SECCIÓN 1: DATOS PERSONALES DEL POSTULANTE */}
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                        <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#315d7a] text-xs font-bold text-white">1</span>
                            <h3 className="text-sm font-bold text-slate-800">Datos Personales del Postulante</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Nombres <span className="text-rose-600">*</span></label>
                                <input
                                    type="text"
                                    value={data.nombres}
                                    onChange={(e) => setData('nombres', e.target.value)}
                                    placeholder="Ej: Juan Carlos"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                    required
                                />
                                {errors.nombres && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.nombres}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Apellidos <span className="text-rose-600">*</span></label>
                                <input
                                    type="text"
                                    value={data.apellidos}
                                    onChange={(e) => setData('apellidos', e.target.value)}
                                    placeholder="Ej: Pérez Gómez"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                    required
                                />
                                {errors.apellidos && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.apellidos}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">DNI / Documento <span className="text-rose-600">*</span></label>
                                <input
                                    type="text"
                                    maxLength="15"
                                    value={data.dni}
                                    onChange={(e) => setData('dni', e.target.value)}
                                    placeholder="Número de DNI"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                    required
                                />
                                {errors.dni && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.dni}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Correo Electrónico <span className="text-rose-600">*</span></label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="correo@ejemplo.com"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                    required
                                />
                                {errors.email && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Teléfono / Celular <span className="text-rose-600">*</span></label>
                                <input
                                    type="text"
                                    value={data.telefono}
                                    onChange={(e) => setData('telefono', e.target.value)}
                                    placeholder="Ej: 987654321"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                    required
                                />
                                {errors.telefono && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.telefono}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Género</label>
                                <select
                                    value={data.genero}
                                    onChange={(e) => setData('genero', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                >
                                    <option value="Masculino">Masculino</option>
                                    <option value="Femenino">Femenino</option>
                                    <option value="Otro">Otro</option>
                                </select>
                                {errors.genero && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.genero}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Fecha de Nacimiento</label>
                                <input
                                    type="date"
                                    value={data.fecha_nacimiento}
                                    onChange={(e) => setData('fecha_nacimiento', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                />
                                {errors.fecha_nacimiento && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.fecha_nacimiento}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Dirección de Domicilio</label>
                                <input
                                    type="text"
                                    value={data.direccion}
                                    onChange={(e) => setData('direccion', e.target.value)}
                                    placeholder="Av. / Calle / Mz. y Lote"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                />
                                {errors.direccion && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.direccion}</p>}
                            </div>
                        </div>
                    </section>

                    {/* SECCIÓN 2: PROCESO Y PROGRAMA ACADÉMICO */}
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                        <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#315d7a] text-xs font-bold text-white">2</span>
                            <h3 className="text-sm font-bold text-slate-800">Proceso Académico y Estado de Inscripción</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Proceso de Admisión <span className="text-rose-600">*</span></label>
                                <select
                                    value={data.id_admision}
                                    onChange={(e) => setData('id_admision', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                    required
                                >
                                    <option value="">-- Seleccione proceso --</option>
                                    {admisiones.map((a) => (
                                        <option key={a.id_admision} value={a.id_admision}>{a.nombre}</option>
                                    ))}
                                </select>
                                {errors.id_admision && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.id_admision}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Programa / Carrera Principal <span className="text-rose-600">*</span></label>
                                <select
                                    value={data.id_plan}
                                    onChange={(e) => setData('id_plan', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                    required
                                >
                                    <option value="">-- Seleccione carrera --</option>
                                    {planesEstudio.map((pe) => (
                                        <option key={pe.id} value={pe.id}>
                                            {pe.nombre} {pe.codigo ? `(${pe.codigo})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {errors.id_plan && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.id_plan}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Segunda Opción de Carrera (Opcional)</label>
                                <select
                                    value={data.segunda_opcion}
                                    onChange={(e) => setData('segunda_opcion', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                >
                                    <option value="">-- Ninguna / Opcional --</option>
                                    {planesEstudio
                                        .filter((pe) => String(pe.id) !== String(data.id_plan))
                                        .map((pe) => (
                                            <option key={pe.id} value={pe.nombre}>
                                                {pe.nombre}
                                            </option>
                                        ))}
                                </select>
                                {errors.segunda_opcion && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.segunda_opcion}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Estado Inicial <span className="text-rose-600">*</span></label>
                                <select
                                    value={data.estado}
                                    onChange={(e) => setData('estado', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                    required
                                >
                                    <option value="inscrito">Inscrito</option>
                                    <option value="observado">Observado</option>
                                    <option value="subsanado">Subsanado</option>
                                    <option value="aceptado">Aceptado</option>
                                    <option value="matriculado">Matriculado</option>
                                </select>
                                {errors.estado && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.estado}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Observaciones Administrativas</label>
                                <textarea
                                    value={data.observacion}
                                    onChange={(e) => setData('observacion', e.target.value)}
                                    rows="2"
                                    placeholder="Notas sobre el estado de la documentación, comprobante de pago presencial, etc."
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                />
                                {errors.observacion && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.observacion}</p>}
                            </div>
                        </div>
                    </section>

                    {/* ACCIONES */}
                    <div className="flex flex-col-reverse justify-end gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row">
                        <Link
                            href={route('inscripciones.index')}
                            className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex justify-center rounded-lg bg-[#315d7a] px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-[#274b63] disabled:opacity-60 transition cursor-pointer"
                        >
                            {processing ? 'Guardando...' : 'Registrar Postulante e Inscripción'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}