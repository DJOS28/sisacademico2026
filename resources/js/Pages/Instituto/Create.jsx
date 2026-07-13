import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import Form from './Form';

export default function Create({ departamentos }) {
    const { data, setData, post, processing, errors } = useForm({
        nombre: '',
        direccion: '',
        telefono: '',
        codigo_modular: '',
        dre: '',
        idDist: '',
        logo: null,
        remove_logo: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('instituto.store'), { forceFormData: true });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Nuevo instituto</h1>}>
            <Head title="Nuevo instituto" />
            <form onSubmit={submit} className="rounded-xl border bg-white p-6">
                <Form {...{ data, setData, errors, departamentos, processing }} />
            </form>
        </AuthenticatedLayout>
    );
}
