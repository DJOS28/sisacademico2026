import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import Form from './Form';

export default function Edit({ provincia, departamentos }) {
    const { data, setData, put, processing, errors } = useForm({
        Provincia: provincia.Provincia ?? '',
        idDepa: provincia.idDepa ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('provincias.update', provincia.idProv));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Editar provincia</h1>}>
            <Head title="Editar provincia" />
            <form onSubmit={submit} className="rounded-xl border bg-white p-6">
                <Form {...{ data, setData, errors, departamentos, processing }} editing />
            </form>
        </AuthenticatedLayout>
    );
}
