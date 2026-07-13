import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { Field, inputClass } from '@/Pages/Ubicacion/FormHelpers';

export default function Edit({ departamento }) {
    const { data, setData, put, processing, errors } = useForm({
        Departamento: departamento.Departamento ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('departamentos.update', departamento.idDepa));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Editar departamento</h1>}>
            <Head title="Editar departamento" />
            <form onSubmit={submit} className="max-w-2xl rounded-xl border bg-white p-6">
                <Field label="Departamento" error={errors.Departamento}>
                    <input className={inputClass} value={data.Departamento} onChange={(e) => setData('Departamento', e.target.value)} />
                </Field>
                <div className="mt-5 flex justify-end">
                    <button disabled={processing} className="rounded-lg bg-[#315d7a] px-5 py-2.5 text-sm font-semibold text-white">
                        Actualizar
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
