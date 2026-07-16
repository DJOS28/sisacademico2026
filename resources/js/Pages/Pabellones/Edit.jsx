import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Edit({ pabellon }) {
    const {
        data,
        setData,
        put,
        processing,
        errors,
    } = useForm({
        nombre: pabellon.nombre ?? '',
        descripcion: pabellon.descripcion ?? '',
    });

    const submit = (event) => {
        event.preventDefault();

        put(
            route(
                'pabellones.update',
                pabellon.id
            ),
            {
                preserveScroll: true,
            }
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Editar pabellón
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Actualice la información del pabellón.
                    </p>
                </div>
            }
        >
            <Head title="Editar pabellón" />

            <form
                onSubmit={submit}
                className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
                <div>
                    <label
                        htmlFor="nombre"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                        Nombre del pabellón
                    </label>

                    <input
                        id="nombre"
                        type="text"
                        value={data.nombre}
                        onChange={(event) =>
                            setData(
                                'nombre',
                                event.target.value
                            )
                        }
                        maxLength={100}
                        autoComplete="off"
                        autoFocus
                        disabled={processing}
                        className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${
                            errors.nombre
                                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                                : 'border-slate-300 focus:border-[#315d7a] focus:ring-[#315d7a]/20'
                        }`}
                    />

                    {errors.nombre && (
                        <p className="mt-1 text-sm text-rose-600">
                            {errors.nombre}
                        </p>
                    )}
                </div>

                <div className="mt-5">
                    <label
                        htmlFor="descripcion"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                        Descripción
                    </label>

                    <textarea
                        id="descripcion"
                        value={data.descripcion}
                        onChange={(event) =>
                            setData(
                                'descripcion',
                                event.target.value
                            )
                        }
                        rows={4}
                        maxLength={1000}
                        disabled={processing}
                        className={`w-full resize-y rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${
                            errors.descripcion
                                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                                : 'border-slate-300 focus:border-[#315d7a] focus:ring-[#315d7a]/20'
                        }`}
                    />

                    {errors.descripcion && (
                        <p className="mt-1 text-sm text-rose-600">
                            {errors.descripcion}
                        </p>
                    )}
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <Link
                        href={route('pabellones.index')}
                        className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                        Cancelar
                    </Link>

                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-[#315d7a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#274b63] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processing
                            ? 'Actualizando...'
                            : 'Actualizar'}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}