import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import Form from './Form';

export default function Edit({ administrador }) {
    const { data, setData, put, processing, errors } = useForm({
        dni: administrador?.dni ?? '',
        nombre: administrador?.nombre ?? '',
        apellido: administrador?.apellido ?? '',
        email: administrador?.email ?? '',
        telefono: administrador?.telefono ?? '',
        direccion: administrador?.direccion ?? '',
        username: administrador?.usuario?.username ?? '',
        password: '',
        password_confirmation: '',
        status: administrador?.usuario?.status ?? 'Activo',
        img: administrador?.usuario?.img ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('administradores.update', administrador.id));
    };

    return (
        <AuthenticatedLayout 
            header={
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Editar administrador</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Actualiza la información personal y credenciales de acceso.
                    </p>
                </div>
            }
        >
            <Head title={`Editar - ${administrador?.nombre ?? ''} ${administrador?.apellido ?? ''}`} />

            {/* Contenedor a todo el ancho (w-full) respetando el diseño original del panel */}
            <div className="w-full">
                <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <Form {...{ data, setData, errors, processing }} editing />
                </form>
            </div>
        </AuthenticatedLayout>
    );
}