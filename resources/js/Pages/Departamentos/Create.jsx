import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { Field, inputClass } from '@/Pages/Ubicacion/FormHelpers';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        Departamento: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('departamentos.store'));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Nuevo departamento</h1>}>
            <Head title="Nuevo departamento" />
            <form onSubmit={submit} className="max-w-2xl rounded-xl border bg-white p-6">
                <Field label="Departamento" error={errors.Departamento}>
                    <input className={inputClass} value={data.Departamento} onChange={(e) => setData('Departamento', e.target.value)} />
                </Field>
                <div className="mt-5 flex justify-end">
                    <button disabled={processing} className="rounded-lg bg-[#315d7a] px-5 py-2.5 text-sm font-semibold text-white">
                        Guardar
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
