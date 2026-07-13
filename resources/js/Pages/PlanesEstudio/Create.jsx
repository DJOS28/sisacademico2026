import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Form from './Form';

export default function Create({ tipos }) {
    const {
        data,
        setData,
        post,
        processing,
        errors,
    } = useForm({
        nombre: '',
        descripcion: '',
        activo: true,
        moodle_category_id: '',
        codigo: '',
        resolucion: '',
        tipo: '',
    });

    const submit = (event) => {
        event.preventDefault();

        post(route('planes-estudio.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Nuevo plan de estudio
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Registre la información principal del plan.
                    </p>
                </div>
            }
        >
            <Head title="Nuevo plan de estudio" />

            <div className="mb-4">
                <Link
                    href={route('planes-estudio.index')}
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
                        tipos,
                    }}
                />
            </form>
        </AuthenticatedLayout>
    );
}
