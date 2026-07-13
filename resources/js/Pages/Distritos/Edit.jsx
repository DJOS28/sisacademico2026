import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import Form from './Form';

export default function Edit({ distrito, departamentos, provincias, idDepa }) {
    const { data, setData, put, processing, errors } = useForm({
        Distrito: distrito.Distrito ?? '',
        idProv: distrito.idProv ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('distritos.update', distrito.idDist));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Editar distrito</h1>}>
            <Head title="Editar distrito" />
            <form onSubmit={submit} className="rounded-xl border bg-white p-6">
                <Form
                    {...{ data, setData, errors, departamentos, processing }}
                    provinciasIniciales={provincias}
                    idDepaInicial={idDepa}
                    editing
                />
            </form>
        </AuthenticatedLayout>
    );
}
