import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Form from './Form';

export default function Edit({ plan, tipos }) {
    const {
        data,
        setData,
        put,
        processing,
        errors,
    } = useForm({
        nombre: plan.nombre ?? '',
        descripcion: plan.descripcion ?? '',
        activo: Boolean(plan.activo),
        moodle_category_id:
            plan.moodle_category_id ?? '',
        codigo: plan.codigo ?? '',
        resolucion: plan.resolucion ?? '',
        tipo: plan.tipo ?? '',
    });

    const submit = (event) => {
        event.preventDefault();

        put(route('planes-estudio.update', plan.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Editar plan de estudio
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Actualice la información del plan.
                    </p>
                </div>
            }
        >
            <Head title="Editar plan de estudio" />

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
                    editing
                />
            </form>
        </AuthenticatedLayout>
    );
}
