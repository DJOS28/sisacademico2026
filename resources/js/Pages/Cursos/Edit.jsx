import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Form from './Form';

export default function Edit({
    curso,
    semestres,
    modulos,
    tipos,
}) {
    const {
        data,
        setData,
        put,
        processing,
        errors,
    } = useForm({
        nombre: curso.nombre ?? '',
        descripcion: curso.descripcion ?? '',
        semestre_id: curso.semestre_id ?? '',
        tipo: curso.tipo ?? '',
        id_modulo: curso.id_modulo ?? '',
        creditos: curso.creditos ?? '',
        horas_semestrales:
            curso.horas_semestrales ?? '',
        orden: curso.orden ?? '',
    });

    const submit = (event) => {
        event.preventDefault();

        put(route('cursos.update', curso.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Editar curso
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Actualice la información académica del curso.
                    </p>
                </div>
            }
        >
            <Head title="Editar curso" />

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
                    editing
                />
            </form>
        </AuthenticatedLayout>
    );
}
