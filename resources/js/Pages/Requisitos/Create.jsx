import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        nombre: '',
        descripcion: '',
        activo: true,
    });

    const guardar = (e) => {
        e.preventDefault();
        post(route('requisitos.store'), {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: '¡Correcto!',
                    text: 'El requisito fue registrado correctamente.',
                    icon: 'success',
                    confirmButtonColor: '#315d7a',
                });
            },
            onError: () => {
                Swal.fire({
                    title: 'Error',
                    text: 'Revisa los campos del formulario.',
                    icon: 'warning',
                    confirmButtonColor: '#315d7a',
                });
            },
        });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-slate-900">Nuevo Requisito</h1>}>
            <Head title="Nuevo Requisito" />

            <div className="w-full space-y-6">
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Registrar Requisito</h2>
                        <p className="mt-1 text-sm text-slate-500">Añada los detalles del documento solicitado.</p>
                    </div>

                    <Link
                        href={route('requisitos.index')}
                        className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        Volver al listado
                    </Link>
                </div>

                <form onSubmit={guardar} className="space-y-6">
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">
                                Nombre del Requisito <span className="text-rose-600">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.nombre}
                                onChange={(e) => setData('nombre', e.target.value)}
                                placeholder="Ejemplo: Certificado de Estudios Original"
                                className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 outline-none transition focus:ring-2 ${
                                    errors.nombre ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-[#315d7a] focus:ring-[#315d7a]/20'
                                }`}
                                required
                            />
                            {errors.nombre && <p className="mt-1 text-xs text-rose-600">{errors.nombre}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">Descripción</label>
                            <textarea
                                value={data.descripcion}
                                onChange={(e) => setData('descripcion', e.target.value)}
                                placeholder="Breve especificación o indicación para el postulante"
                                rows="3"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                            />
                        </div>

                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <input
                                type="checkbox"
                                checked={data.activo}
                                onChange={(e) => setData('activo', e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-[#315d7a] focus:ring-[#315d7a]"
                            />
                            <div>
                                <p className="text-sm font-semibold text-slate-800">Requisito activo</p>
                                <p className="text-xs text-slate-500">Estará disponible para seleccionarse en nuevos procesos de admisión.</p>
                            </div>
                        </label>
                    </section>

                    <div className="flex flex-col-reverse justify-end gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row">
                        <Link href={route('requisitos.index')} className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                            Cancelar
                        </Link>
                        <button type="submit" disabled={processing} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#315d7a] px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-[#274b63] disabled:opacity-60">
                            {processing ? 'Guardando...' : 'Guardar Requisito'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}