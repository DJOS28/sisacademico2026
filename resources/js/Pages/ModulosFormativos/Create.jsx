import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Form from './Form';

export default function Create({ planesEstudio }) {
    const {
        data,
        setData,
        post,
        processing,
        errors,
    } = useForm({
        id_plan_estudio: '',
        nombre: '',
        num_modulo: '',
        horas: '',
        creditos: '',
    });

    const submit = (event) => {
        event.preventDefault();

        post(route('modulos-formativos.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Nuevo módulo formativo
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Registre un módulo dentro de un plan de estudio.
                    </p>
                </div>
            }
        >
            <Head title="Nuevo módulo formativo" />

            <div className="mb-4">
                <Link
                    href={route('modulos-formativos.index')}
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
                        planesEstudio,
                    }}
                />
            </form>
        </AuthenticatedLayout>
    );
}
