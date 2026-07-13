import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Form from './Form';

export default function Create({
    semestres,
    modulos,
    tipos,
}) {
    const {
        data,
        setData,
        post,
        processing,
        errors,
    } = useForm({
        nombre: '',
        descripcion: '',
        semestre_id: '',
        tipo: '',
        id_modulo: '',
        creditos: '',
        horas_semestrales: '',
        orden: '',
    });

    const submit = (event) => {
        event.preventDefault();

        post(route('cursos.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Nuevo curso
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Registre un curso dentro de la estructura académica.
                    </p>
                </div>
            }
        >
            <Head title="Nuevo curso" />

            <div className="mb-4">
                <Link
                    href={route('cursos.index')}
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
                        semestres,
                        modulos,
                        tipos,
                    }}
                />
            </form>
        </AuthenticatedLayout>
    );
}
