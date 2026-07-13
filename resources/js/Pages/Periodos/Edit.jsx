import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Form from './Form';

export default function Edit({ periodo }) {
    const {
        data,
        setData,
        put,
        processing,
        errors,
    } = useForm({
        nombre: periodo.nombre ?? '',
        descripcion: periodo.descripcion ?? '',
        fecha_inicio: periodo.fecha_inicio ?? '',
        fecha_fin: periodo.fecha_fin ?? '',
        activo: Boolean(periodo.activo),
    });

    const submit = (event) => {
        event.preventDefault();

        put(route('periodos.update', periodo.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Editar periodo académico
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Actualice las fechas y configuración del periodo.
                    </p>
                </div>
            }
        >
            <Head title="Editar periodo" />

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
                    editing
                />
            </form>
        </AuthenticatedLayout>
    );
}
