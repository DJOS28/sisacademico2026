import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function Edit({ inscripcion, admisiones = [], planesEstudio = [] }) {
    const { data, setData, put, processing, errors } = useForm({
        id_admision: inscripcion.id_admision || '',
        id_plan: inscripcion.id_plan || '',
        segunda_opcion: inscripcion.segunda_opcion || '',
        estado: inscripcion.estado || 'inscrito',
        observacion: inscripcion.observacion || '',
    });

    const postulante = inscripcion.postulante || {};

    const actualizar = (e) => {
        e.preventDefault();
        put(route('inscripciones.update', inscripcion.id_inscripcion), {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: '¡Actualizado!',
                    text: 'La inscripción fue actualizada con éxito.',
                    icon: 'success',
                    confirmButtonColor: '#315d7a',
                });
            },
            onError: () => {
                Swal.fire({
                    title: 'Error',
                    text: 'Revise la información ingresada en el formulario.',
                    icon: 'warning',
                    confirmButtonColor: '#315d7a',
                });
            },
        });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-slate-900">Editar Inscripción</h1>}>
            <Head title="Editar Inscripción" />

            <div className="w-full space-y-6">
                {/* ENCABEZADO Y BOTÓN VOLVER */}
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Modificar Ficha de Inscripción</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Actualice la asignación académica, estado u observaciones administrativas.
                        </p>
                    </div>

                    <Link
                        href={route('inscripciones.index')}
                        className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        Volver al listado
                    </Link>
                </div>

                {/* TARJETA DE INFORMACIÓN DEL POSTULANTE */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Postulante Registrado:</p>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-800">
                        <div>
                            <span className="font-semibold text-slate-500">Nombres:</span>{' '}
                            <strong className="text-slate-900">{postulante.apellidos}, {postulante.nombres}</strong>
                        </div>
                        <div>
                            <span className="font-semibold text-slate-500">Código:</span>{' '}
                            <span className="font-mono font-bold text-[#315d7a]">{postulante.codigo_postulante || 'S/C'}</span>
                        </div>
                        <div>
                            <span className="font-semibold text-slate-500">DNI / Documento:</span>{' '}
                            <span className="font-mono">{postulante.dni || '—'}</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={actualizar} className="space-y-6">
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                        <div className="border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-800">Datos de la Inscripción</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {/* PROCESO DE ADMISIÓN */}
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

                            {/* PLAN DE ESTUDIO / CARRERA */}
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Programa / Carrera Principal <span className="text-rose-600">*</span></label>
                                <select
                                    value={data.id_plan}
                                    onChange={(e) => setData('id_plan', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                    required
                                >
                                    <option value="">-- Seleccione plan --</option>
                                    {planesEstudio.map((pe) => (
                                        <option key={pe.id} value={pe.id}>
                                            {pe.nombre} {pe.codigo ? `(${pe.codigo})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {errors.id_plan && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.id_plan}</p>}
                            </div>

                            {/* SEGUNDA OPCIÓN */}
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

                            {/* ESTADO */}
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Estado de la Inscripción <span className="text-rose-600">*</span></label>
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

                            {/* OBSERVACIÓN */}
                            <div className="md:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Observaciones Administrativas</label>
                                <textarea
                                    value={data.observacion}
                                    onChange={(e) => setData('observacion', e.target.value)}
                                    rows="3"
                                    placeholder="Notas sobre el pago, validación de requisitos, etc."
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                />
                                {errors.observacion && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.observacion}</p>}
                            </div>
                        </div>
                    </section>

                    {/* BOTONES DE ACCIÓN */}
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
                            {processing ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}