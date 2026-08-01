import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function Create({ admisiones = [], postulantes = [], planesEstudio = [] }) {
    const [busqueda, setBusqueda] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        id_admision: '',
        id_postulante: '',
        id_plan: '',
        segunda_opcion: '',
        estado: 'inscrito',
        observacion: '',
    });

    // Búsqueda AJAX interactiva de postulantes sin recargar formulario
    useEffect(() => {
        const timer = setTimeout(() => {
            if (busqueda.trim() !== '') {
                router.get(
                    route('inscripciones.create'),
                    { buscar_postulante: busqueda },
                    { preserveState: true, preserveScroll: true, only: ['postulantes'] }
                );
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [busqueda]);

    const guardar = (e) => {
        e.preventDefault();
        post(route('inscripciones.store'), {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire('¡Registrado!', 'La inscripción fue registrada con éxito.', 'success');
            },
            onError: () => {
                Swal.fire('Error', 'Verifique los campos requeridos.', 'warning');
            },
        });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-slate-900">Nueva Inscripción</h1>}>
            <Head title="Nueva Inscripción" />

            <div className="w-full space-y-6">
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Registrar Inscripción</h2>
                        <p className="mt-1 text-sm text-slate-500">Asigne el postulante a un proceso y programa.</p>
                    </div>

                    <Link
                        href={route('inscripciones.index')}
                        className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        Volver al listado
                    </Link>
                </div>

                <form onSubmit={guardar} className="space-y-6">
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {/* ADMISIÓN */}
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Proceso de Admisión *</label>
                                <select
                                    value={data.id_admision}
                                    onChange={(e) => setData('id_admision', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#315d7a]/20"
                                    required
                                >
                                    <option value="">Seleccione proceso</option>
                                    {admisiones.map((a) => (
                                        <option key={a.id_admision} value={a.id_admision}>{a.nombre}</option>
                                    ))}
                                </select>
                                {errors.id_admision && <p className="mt-1 text-xs text-rose-600">{errors.id_admision}</p>}
                            </div>

                            {/* BUSCADOR Y SELECTOR DE POSTULANTE (AJAX) */}
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Filtrar Postulante (AJAX)</label>
                                <input
                                    type="text"
                                    placeholder="Escriba DNI o Apellido para filtrar..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className="mb-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none"
                                />

                                <select
                                    value={data.id_postulante}
                                    onChange={(e) => setData('id_postulante', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#315d7a]/20"
                                    required
                                >
                                    <option value="">Seleccione postulante</option>
                                    {postulantes.map((p) => (
                                        <option key={p.id_postulante} value={p.id_postulante}>
                                            {p.apellidos}, {p.nombres} ({p.dni})
                                        </option>
                                    ))}
                                </select>
                                {errors.id_postulante && <p className="mt-1 text-xs text-rose-600">{errors.id_postulante}</p>}
                            </div>

                            {/* PLAN PRINCIPAL */}
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Programa / Plan de Estudio *</label>
                                <select
                                    value={data.id_plan}
                                    onChange={(e) => setData('id_plan', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#315d7a]/20"
                                    required
                                >
                                    <option value="">Seleccione plan</option>
                                    {planesEstudio.map((pe) => (
                                        <option key={pe.id} value={pe.id}>{pe.nombre}</option>
                                    ))}
                                </select>
                                {errors.id_plan && <p className="mt-1 text-xs text-rose-600">{errors.id_plan}</p>}
                            </div>

                            {/* SEGUNDA OPCIÓN */}
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Segunda Opción (Opcional)</label>
                                <input
                                    type="text"
                                    value={data.segunda_opcion}
                                    onChange={(e) => setData('segunda_opcion', e.target.value)}
                                    placeholder="Ej: Contabilidad"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#315d7a]/20"
                                />
                            </div>

                            {/* ESTADO */}
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Estado Inicial *</label>
                                <select
                                    value={data.estado}
                                    onChange={(e) => setData('estado', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#315d7a]/20"
                                >
                                    <option value="inscrito">Inscrito</option>
                                    <option value="observado">Observado</option>
                                    <option value="subsanado">Subsanado</option>
                                    <option value="aceptado">Aceptado</option>
                                    <option value="matriculado">Matriculado</option>
                                </select>
                            </div>

                            {/* OBSERVACIÓN */}
                            <div className="md:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Observaciones</label>
                                <textarea
                                    value={data.observacion}
                                    onChange={(e) => setData('observacion', e.target.value)}
                                    rows="2"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#315d7a]/20"
                                />
                            </div>
                        </div>
                    </section>

                    <div className="flex flex-col-reverse justify-end gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row">
                        <Link href={route('inscripciones.index')} className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                            Cancelar
                        </Link>
                        <button type="submit" disabled={processing} className="inline-flex justify-center rounded-lg bg-[#315d7a] px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-[#274b63] disabled:opacity-60">
                            {processing ? 'Guardando...' : 'Guardar Inscripción'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}