import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Form from './Form';

export default function Create({
    planesEstudio,
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
        plan_estudio_id: '',
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
        <AuthenticatedLayout>
            <Head title="Nuevo curso" />

            <div className="mb-4">
                <Link
                    href={route('cursos.index')}
                    className="text-sm font-semibold text-[#315d7a]"
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
                        semestres,
                        modulos,
                        tipos,
                    }}
                />
            </form>
        </AuthenticatedLayout>
    );
}
