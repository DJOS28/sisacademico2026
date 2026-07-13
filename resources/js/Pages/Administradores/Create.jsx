import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import Form from './Form';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        dni: '',
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        direccion: '',
        username: '',
        password: '',
        password_confirmation: '',
        status: 'Activo',
        img: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('administradores.store'));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-slate-900">Nuevo administrador</h1>}>
            <Head title="Nuevo administrador" />
            <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-6">
                <Form {...{ data, setData, errors, processing }} />
            </form>
        </AuthenticatedLayout>
    );
}
