import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create() {
    const {
        data,
        setData,
        post,
        processing,
        errors,
    } = useForm({
        nombre: '',
        descripcion: '',
    });

    const submit = (event) => {
        event.preventDefault();

        post(route('secciones.store'), {
            preserveScroll: true,
        });
    };

    const inputClass = (error) =>
        `w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${
            error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                : 'border-slate-300 focus:border-[#315d7a] focus:ring-[#315d7a]/20'
        }`;

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Nueva sección
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Registre una nueva sección académica.
                    </p>
                </div>
            }
        >
            <Head title="Nueva sección" />

            <form
                onSubmit={submit}
                className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
                <div>
                    <label
                        htmlFor="nombre"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                        Nombre de la sección
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
                        placeholder="Ejemplo: Sección A"
                        maxLength={50}
                        autoComplete="off"
                        autoFocus
                        disabled={processing}
                        className={inputClass(errors.nombre)}
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
                        placeholder="Ingrese una descripción de la sección"
                        rows={4}
                        maxLength={1000}
                        disabled={processing}
                        className={`${inputClass(
                            errors.descripcion
                        )} resize-y`}
                    />

                    {errors.descripcion && (
                        <p className="mt-1 text-sm text-rose-600">
                            {errors.descripcion}
                        </p>
                    )}
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <Link
                        href={route('secciones.index')}
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
                            ? 'Guardando...'
                            : 'Guardar'}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}