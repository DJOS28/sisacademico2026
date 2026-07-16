import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Field, inputClass } from '@/Pages/Ubicacion/FormHelpers';

export default function Edit({ departamento }) {
    const { data, setData, put, processing, errors } = useForm({
        Departamento: departamento.Departamento ?? '',
    });

    const submit = (e) => {
        e.preventDefault();

        put(route('departamentos.update', departamento.idDepa), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Editar departamento
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Actualice la información del departamento.
                    </p>
                </div>
            }
        >
            <Head title="Editar departamento" />

            <form
                onSubmit={submit}
                className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
                <Field
                    label="Departamento"
                    error={errors.Departamento}
                >
                    <input
                        type="text"
                        className={inputClass}
                        value={data.Departamento}
                        onChange={(e) =>
                            setData('Departamento', e.target.value)
                        }
                        autoFocus
                    />
                </Field>

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <Link
                        href={route('departamentos.index')}
                        className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                        Cancelar
                    </Link>

                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-[#315d7a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#274b63] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processing ? 'Actualizando...' : 'Actualizar'}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}