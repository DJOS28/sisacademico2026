import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import Form from './Form';

export default function Edit({ instituto, departamentos, provincias, distritos, idDepa, idProv }) {
    const { data, setData, post, processing, errors } = useForm({
        nombre: instituto.nombre ?? '',
        direccion: instituto.direccion ?? '',
        telefono: instituto.telefono ?? '',
        codigo_modular: instituto.codigo_modular ?? '',
        dre: instituto.dre ?? '',
        idDist: instituto.idDist ?? '',
        logo: null,
        remove_logo: false,
        _method: 'PUT',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('instituto.update', instituto.id), { forceFormData: true });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Editar instituto</h1>}>
            <Head title="Editar instituto" />
            <form onSubmit={submit} className="rounded-xl border bg-white p-6">
                <Form
                    {...{ data, setData, errors, departamentos, processing }}
                    provinciasIniciales={provincias}
                    distritosIniciales={distritos}
                    idDepaInicial={idDepa}
                    idProvInicial={idProv}
                    editing
                    logoUrl={instituto.logo_url}
                />
            </form>
        </AuthenticatedLayout>
    );
}
