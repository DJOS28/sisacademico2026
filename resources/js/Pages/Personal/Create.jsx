import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import Form from './Form';

export default function Create({ roles, areas }) {
    const { data, setData, post, processing, errors } = useForm({
        dni: '',
        nombre: '',
        apellido: '',
        direccion: '',
        telefono: '',
        email: '',
        puesto: '',
        id_area: '',
        area_ids: [],
        role_ids: [],
        username: '',
        password: '',
        password_confirmation: '',
        status: 'Activo',
        img: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('personal.store'));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-slate-900">Nuevo personal</h1>}>
            <Head title="Nuevo personal" />
            <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-6">
                <Form {...{ data, setData, errors, processing, roles, areas }} />
            </form>
        </AuthenticatedLayout>
    );
}
