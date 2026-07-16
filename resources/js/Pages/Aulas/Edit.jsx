import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Edit({
    aula,
    pabellones = [],
    tipos = [],
}) {
    const {
        data,
        setData,
        put,
        processing,
        errors,
    } = useForm({
        nombre: aula?.nombre ?? '',
        numero_aula: aula?.numero_aula ?? '',
        capacidad: aula?.capacidad ?? 0,
        id_pabellon: aula?.id_pabellon
            ? String(aula.id_pabellon)
            : '',
        tipo: aula?.tipo ?? '',
    });

    const submit = (event) => {
        event.preventDefault();

        put(route('aulas.update', aula.id), {
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
                        Editar aula
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Actualice la información del aula.
                    </p>
                </div>
            }
        >
            <Head title="Editar aula" />

            <form
                onSubmit={submit}
                className="max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                        <label
                            htmlFor="nombre"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Nombre del aula
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
                            placeholder="Ejemplo: Laboratorio de cómputo"
                            maxLength={50}
                            autoFocus
                            autoComplete="off"
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
                            htmlFor="numero_aula"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Número o código
                        </label>

                        <input
                            id="numero_aula"
                            type="text"
                            value={data.numero_aula}
                            onChange={(event) =>
                                setData(
                                    'numero_aula',
                                    event.target.value
                                )
                            }
                            placeholder="Ejemplo: A-101"
                            maxLength={20}
                            autoComplete="off"
                            disabled={processing}
                            className={inputClass(
                                errors.numero_aula
                            )}
                        />

                        {errors.numero_aula && (
                            <p className="mt-1 text-sm text-rose-600">
                                {errors.numero_aula}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="id_pabellon"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Pabellón
                        </label>

                        <select
                            id="id_pabellon"
                            value={data.id_pabellon}
                            onChange={(event) =>
                                setData(
                                    'id_pabellon',
                                    event.target.value
                                )
                            }
                            disabled={processing}
                            className={`${inputClass(
                                errors.id_pabellon
                            )} bg-white`}
                        >
                            <option value="">
                                Seleccione un pabellón
                            </option>

                            {pabellones.map((pabellon) => (
                                <option
                                    key={pabellon.id}
                                    value={pabellon.id}
                                >
                                    {pabellon.nombre}
                                </option>
                            ))}
                        </select>

                        {errors.id_pabellon && (
                            <p className="mt-1 text-sm text-rose-600">
                                {errors.id_pabellon}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="capacidad"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Capacidad
                        </label>

                        <input
                            id="capacidad"
                            type="number"
                            min={0}
                            max={10000}
                            value={data.capacidad}
                            onChange={(event) =>
                                setData(
                                    'capacidad',
                                    event.target.value
                                )
                            }
                            placeholder="Ejemplo: 50"
                            disabled={processing}
                            className={inputClass(
                                errors.capacidad
                            )}
                        />

                        {errors.capacidad && (
                            <p className="mt-1 text-sm text-rose-600">
                                {errors.capacidad}
                            </p>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <label
                            htmlFor="tipo"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Tipo de aula
                        </label>

                        <input
                            id="tipo"
                            type="text"
                            list="tipos-aula"
                            value={data.tipo}
                            onChange={(event) =>
                                setData(
                                    'tipo',
                                    event.target.value
                                )
                            }
                            placeholder="Ejemplo: Aula teórica, laboratorio o taller"
                            maxLength={50}
                            autoComplete="off"
                            disabled={processing}
                            className={inputClass(errors.tipo)}
                        />

                        <datalist id="tipos-aula">
                            {tipos.map((tipoItem) => (
                                <option
                                    key={tipoItem}
                                    value={tipoItem}
                                />
                            ))}
                        </datalist>

                        {errors.tipo && (
                            <p className="mt-1 text-sm text-rose-600">
                                {errors.tipo}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <Link
                        href={route('aulas.index')}
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