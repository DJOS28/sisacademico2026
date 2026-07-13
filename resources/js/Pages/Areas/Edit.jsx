import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Form from './Form';

export default function Edit({ area, estados }) {
    const { data, setData, put, processing, errors } = useForm({
        nombre: area.nombre ?? '',
        descripcion: area.descripcion ?? '',
        estado: area.estado ?? 'Activo',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('areas.update', area.id));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Editar área administrativa</h1>}>
            <Head title="Editar área" />
            <Link href={route('areas.index')} className="mb-4 inline-block text-sm font-semibold text-[#315d7a]">← Volver</Link>
            <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-6">
                <Form {...{ data, setData, errors, processing, estados }} editing />
            </form>
        </AuthenticatedLayout>
    );
}
