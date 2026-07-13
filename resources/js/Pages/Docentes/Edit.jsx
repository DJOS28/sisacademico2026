import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useState } from 'react';
import DocenteForm from './Partials/DocenteForm';

export default function Edit({ docente, estados }) {
    const [values, setValues] = useState({
        nombre: docente.nombre || '',
        apellido: docente.apellido || '',
        dni: docente.dni || '',
        email: docente.email || '',
        telefono: docente.telefono || '',
        direccion: docente.direccion || '',
        departamento: docente.departamento || '',
        cargo: docente.cargo || '',
        username: docente.usuario?.username || '',
        password: '',
        password_confirmation: '',
        status: docente.usuario?.status || 'Disponible',
        moodle_user_id: docente.usuario?.moodle_user_id || '',
        img: null,
        current_img: docente.usuario?.img || null,
        remove_img: false,
    });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    const setValue = (field, value) => {
        setValues((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: null }));
    };

    const submit = async (event) => {
        event.preventDefault();
        setProcessing(true);
        setErrors({});

        const formData = new FormData();

        Object.entries(values).forEach(([key, value]) => {
            if (key === 'current_img') return;

            if (typeof value === 'boolean') {
                formData.append(key, value ? '1' : '0');
            } else if (value !== null && value !== '') {
                formData.append(key, value);
            }
        });

        formData.append('_method', 'PUT');

        try {
            const response = await axios.post(
                route('docentes.update', docente.id),
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } },
            );

            await Swal.fire({
                title: 'Actualización correcta',
                text: response.data.message,
                icon: 'success',
                confirmButtonColor: '#315d7a',
            });

            router.visit(response.data.redirect || route('docentes.index'));
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
            }

            Swal.fire({
                title: 'No se pudo actualizar',
                text:
                    error.response?.data?.message ||
                    'Revisa los datos ingresados.',
                icon: 'error',
                confirmButtonColor: '#315d7a',
            });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <p className="text-sm font-semibold text-[#315d7a]">
                        Gestión académica
                    </p>
                    <h1 className="mt-1 text-2xl font-bold text-slate-900">
                        Editar docente
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {docente.nombre_completo}
                    </p>
                </div>
            }
        >
            <Head title={`Editar ${docente.nombre_completo}`} />

            <form onSubmit={submit} className="space-y-5">
                <DocenteForm
                    values={values}
                    setValue={setValue}
                    errors={errors}
                    estados={estados}
                    imagePreview={imagePreview}
                    setImagePreview={setImagePreview}
                    isEdit
                />

                <div className="flex flex-col-reverse gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:justify-end">
                    <Link
                        href={route('docentes.index')}
                        className="rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-[#315d7a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#274c64] disabled:opacity-60"
                    >
                        {processing ? 'Actualizando...' : 'Guardar cambios'}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
