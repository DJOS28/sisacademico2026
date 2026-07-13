import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Form from './Form';

export default function Edit({ semestre }) {
    const {
        data,
        setData,
        put,
        processing,
        errors,
    } = useForm({
        nombre: semestre.nombre ?? '',
        descripcion: semestre.descripcion ?? '',
        activo: Boolean(semestre.activo),
    });

    const submit = (event) => {
        event.preventDefault();

        put(route('semestres.update', semestre.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Editar semestre
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Actualice la información del semestre.
                    </p>
                </div>
            }
        >
            <Head title="Editar semestre" />

            <div className="mb-4">
                <Link
                    href={route('semestres.index')}
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
                    editing
                />
            </form>
        </AuthenticatedLayout>
    );
}
