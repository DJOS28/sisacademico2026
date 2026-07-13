import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import Form from './Form';

export default function Edit({ personal, roles, areas }) {
    const { data, setData, put, processing, errors } = useForm({
        dni: personal.dni ?? '',
        nombre: personal.nombre ?? '',
        apellido: personal.apellido ?? '',
        direccion: personal.direccion ?? '',
        telefono: personal.telefono ?? '',
        email: personal.email ?? '',
        puesto: personal.puesto ?? '',
        id_area: personal.id_area ?? '',
        area_ids: personal.area_ids ?? [],
        role_ids: personal.role_ids ?? [],
        username: personal.usuario?.username ?? '',
        password: '',
        password_confirmation: '',
        status: personal.usuario?.status ?? 'Activo',
        img: personal.usuario?.img ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('personal.update', personal.id));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-slate-900">Editar personal</h1>}>
            <Head title="Editar personal" />
            <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-6">
                <Form {...{ data, setData, errors, processing, roles, areas }} editing />
            </form>
        </AuthenticatedLayout>
    );
}
