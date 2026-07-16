import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Edit({ turno }) {
    const {
        data,
        setData,
        put,
        processing,
        errors,
    } = useForm({
        nombre: turno?.nombre ?? '',
        hora_inicio: turno?.hora_inicio ?? '',
        hora_fin: turno?.hora_fin ?? '',
    });

    const submit = (event) => {
        event.preventDefault();

        put(route('turnos.update', turno.id), {
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
                        Editar turno
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Actualice la información del turno.
                    </p>
                </div>
            }
        >
            <Head title="Editar turno" />

            <form
                onSubmit={submit}
                className="max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <label
                            htmlFor="nombre"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Nombre del turno
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
                            placeholder="Ejemplo: Turno mañana"
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

                    <div>
                        <label
                            htmlFor="hora_inicio"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Hora de inicio
                        </label>

                        <input
                            id="hora_inicio"
                            type="time"
                            value={data.hora_inicio}
                            onChange={(event) =>
                                setData(
                                    'hora_inicio',
                                    event.target.value
                                )
                            }
                            disabled={processing}
                            className={inputClass(
                                errors.hora_inicio
                            )}
                        />

                        {errors.hora_inicio && (
                            <p className="mt-1 text-sm text-rose-600">
                                {errors.hora_inicio}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="hora_fin"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Hora de fin
                        </label>

                        <input
                            id="hora_fin"
                            type="time"
                            value={data.hora_fin}
                            onChange={(event) =>
                                setData(
                                    'hora_fin',
                                    event.target.value
                                )
                            }
                            disabled={processing}
                            className={inputClass(
                                errors.hora_fin
                            )}
                        />

                        {errors.hora_fin && (
                            <p className="mt-1 text-sm text-rose-600">
                                {errors.hora_fin}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <Link
                        href={route('turnos.index')}
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