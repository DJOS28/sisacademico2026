import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import Form from './Form';

export default function Create({ departamentos }) {
    const { data, setData, post, processing, errors } = useForm({
        Provincia: '',
        idDepa: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('provincias.store'));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Nueva provincia</h1>}>
            <Head title="Nueva provincia" />
            <form onSubmit={submit} className="rounded-xl border bg-white p-6">
                <Form {...{ data, setData, errors, departamentos, processing }} />
            </form>
        </AuthenticatedLayout>
    );
}
