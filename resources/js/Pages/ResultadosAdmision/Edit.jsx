import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function Edit({ resultado, planesEstudio = [] }) {
    const { data, setData, put, processing, errors } = useForm({
        plan_estudio_id: resultado.plan_estudio_id || '',
        nota: resultado.nota || '0.00',
        estado: resultado.estado || 'con_vacante',
    });

    const postulante = resultado.postulante || {};

    const actualizar = (e) => {
        e.preventDefault();
        put(route('resultados-admision.update', resultado.id), {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: '¡Actualizado!',
                    text: 'El resultado fue modificado correctamente.',
                    icon: 'success',
                    confirmButtonColor: '#315d7a',
                });
            },
            onError: () => {
                Swal.fire({
                    title: 'Error',
                    text: 'Revise los campos ingresados.',
                    icon: 'warning',
                    confirmButtonColor: '#315d7a',
                });
            },
        });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-slate-900">Editar Calificación</h1>}>
            <Head title="Editar Resultado" />

            <div className="w-full space-y-6 max-w-3xl mx-auto">
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Modificar Calificación Individual</h2>
                        <p className="mt-1 text-sm text-slate-500">Ajuste la nota final o la condición del postulante.</p>
                    </div>

                    <Link
                        href={route('resultados-admision.index', { id_proceso: resultado.id_proceso })}
                        className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Volver a Resultados
                    </Link>
                </div>

                {/* TARJETA POSTULANTE Y PROCESO */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Información del Postulante:</p>
                    <div className="text-base font-extrabold text-slate-900">{postulante.apellidos}, {postulante.nombres}</div>
                    <div className="flex gap-4 text-xs text-slate-600 font-mono">
                        <span><strong>Código:</strong> {postulante.codigo_postulante || 'S/C'}</span>
                        <span><strong>DNI:</strong> {postulante.dni}</span>
                        <span><strong>Proceso:</strong> {resultado.admision?.nombre}</span>
                    </div>
                </div>

                <form onSubmit={actualizar} className="space-y-6">
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Programa / Carrera Principal <span className="text-rose-600">*</span></label>
                                <select
                                    value={data.plan_estudio_id}
                                    onChange={(e) => setData('plan_estudio_id', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a]"
                                    required
                                >
                                    <option value="">-- Seleccionar Plan --</option>
                                    {planesEstudio.map((pe) => (
                                        <option key={pe.id} value={pe.id}>
                                            {pe.nombre} {pe.codigo ? `(${pe.codigo})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {errors.plan_estudio_id && <p className="mt-1 text-xs text-rose-600">{errors.plan_estudio_id}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Nota del Examen (0 - 20) <span className="text-rose-600">*</span></label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="20"
                                    value={data.nota}
                                    onChange={(e) => setData('nota', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 font-mono text-base font-bold text-[#315d7a] px-3 py-2 outline-none focus:border-[#315d7a]"
                                    required
                                />
                                {errors.nota && <p className="mt-1 text-xs text-rose-600">{errors.nota}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Condición Vacante <span className="text-rose-600">*</span></label>
                                <select
                                    value={data.estado}
                                    onChange={(e) => setData('estado', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#315d7a]"
                                    required
                                >
                                    <option value="con_vacante">✓ Con Vacante</option>
                                    <option value="sin_vacante">✕ Sin Vacante</option>
                                    <option value="ausente">⚑ Ausente</option>
                                    <option value="anulado">⊘ Anulado</option>
                                </select>
                                {errors.estado && <p className="mt-1 text-xs text-rose-600">{errors.estado}</p>}
                            </div>
                        </div>
                    </section>

                    <div className="flex justify-end gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <Link
                            href={route('resultados-admision.index', { id_proceso: resultado.id_proceso })}
                            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-[#315d7a] px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-[#274b63] disabled:opacity-60 cursor-pointer"
                        >
                            {processing ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}