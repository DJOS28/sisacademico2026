import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Form from './Form';

export default function Edit({
    modulo,
    planesEstudio,
}) {
    const {
        data,
        setData,
        put,
        processing,
        errors,
    } = useForm({
        id_plan_estudio:
            modulo.id_plan_estudio ?? '',
        nombre: modulo.nombre ?? '',
        num_modulo: modulo.num_modulo ?? '',
        horas: modulo.horas ?? '',
        creditos: modulo.creditos ?? '',
    });

    const submit = (event) => {
        event.preventDefault();

        put(
            route(
                'modulos-formativos.update',
                modulo.id_modulo
            )
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Editar módulo formativo
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Actualice la información del módulo.
                    </p>
                </div>
            }
        >
            <Head title="Editar módulo formativo" />

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
                    editing
                />
            </form>
        </AuthenticatedLayout>
    );
}
