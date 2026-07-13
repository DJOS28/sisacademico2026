import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useState } from 'react';
import DocenteForm from './Partials/DocenteForm';

export default function Create({ estados }) {
    const [values, setValues] = useState({
        nombre: '',
        apellido: '',
        dni: '',
        email: '',
        telefono: '',
        direccion: '',
        departamento: '',
        cargo: '',
        username: '',
        password: '',
        password_confirmation: '',
        status: 'Activo',
        moodle_user_id: '',
        img: null,
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
            if (value !== null && value !== '') {
                formData.append(key, value);
            }
        });

        try {
            const response = await axios.post(route('docentes.store'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            await Swal.fire({
                title: 'Registro correcto',
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
                title: 'No se pudo registrar',
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
                        Registrar docente
                    </h1>
                </div>
            }
        >
            <Head title="Registrar docente" />

            <form onSubmit={submit} className="space-y-5">
                <DocenteForm
                    values={values}
                    setValue={setValue}
                    errors={errors}
                    estados={estados}
                    imagePreview={imagePreview}
                    setImagePreview={setImagePreview}
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
                        {processing ? 'Registrando...' : 'Registrar docente'}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
