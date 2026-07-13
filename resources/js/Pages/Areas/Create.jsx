import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Form from './Form';

export default function Create({ estados }) {
    const { data, setData, post, processing, errors } = useForm({
        nombre: '',
        descripcion: '',
        estado: 'Activo',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('areas.store'));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Nueva área administrativa</h1>}>
            <Head title="Nueva área" />
            <Link href={route('areas.index')} className="mb-4 inline-block text-sm font-semibold text-[#315d7a]">← Volver</Link>
            <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-6">
                <Form {...{ data, setData, errors, processing, estados }} />
            </form>
        </AuthenticatedLayout>
    );
}
