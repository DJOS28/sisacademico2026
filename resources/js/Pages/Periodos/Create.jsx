import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Form from './Form';

export default function Create() {
    const {
        data,
        setData,
        post,
        processing,
        errors,
    } = useForm({
        nombre: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_fin: '',
        activo: false,
    });

    const submit = (event) => {
        event.preventDefault();

        post(route('periodos.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Nuevo periodo académico
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Registre un nuevo periodo académico.
                    </p>
                </div>
            }
        >
            <Head title="Nuevo periodo" />

            <div className="mb-4">
                <Link
                    href={route('periodos.index')}
                    className="text-sm font-semibold text-[#315d7a] hover:underline"
                >
                    ← Volver al listado
                </Link>
            </div>

            <form
                onSubmit={submit}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
                <Form
                    {...{
                        data,
                        setData,
                        errors,
                        processing,
                    }}
                />
            </form>
        </AuthenticatedLayout>
    );
}
