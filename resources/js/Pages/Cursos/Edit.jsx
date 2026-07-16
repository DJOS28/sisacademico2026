import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Form from './Form';

export default function Edit({
    curso,
    planesEstudio,
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
        plan_estudio_id:
            curso.plan_estudio_id ?? '',
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
        <AuthenticatedLayout>
            <Head title="Editar curso" />

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
                    editing
                />
            </form>
        </AuthenticatedLayout>
    );
}
