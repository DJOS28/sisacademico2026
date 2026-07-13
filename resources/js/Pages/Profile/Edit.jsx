import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

function SectionHeader({ title, description }) {
    return (
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <h3 className="text-base font-bold text-slate-900">
                {title}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
                {description}
            </p>
        </div>
    );
}

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <p className="text-sm font-semibold text-[#315d7a]">
                        Seguridad y sistema
                    </p>
                    <h1 className="mt-1 text-2xl font-bold text-slate-900">
                        Mi perfil
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Administra tu información personal, contraseña y cuenta de acceso.
                    </p>
                </div>
            }
        >
            <Head title="Mi perfil" />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <SectionHeader
                        title="Información del perfil"
                        description="Actualiza tus datos personales y la información asociada a tu cuenta."
                    />

                    <div className="p-5 sm:p-6">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-3xl"
                        />
                    </div>
                </section>

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <SectionHeader
                        title="Cambiar contraseña"
                        description="Utiliza una contraseña segura y diferente a las usadas anteriormente."
                    />

                    <div className="p-5 sm:p-6">
                        <UpdatePasswordForm className="max-w-3xl" />
                    </div>
                </section>

                <section className="overflow-hidden rounded-xl border border-rose-200 bg-white">
                    <div className="border-b border-rose-100 bg-rose-50 px-5 py-4 sm:px-6">
                        <h3 className="text-base font-bold text-rose-800">
                            Eliminar cuenta
                        </h3>
                        <p className="mt-1 text-sm text-rose-600">
                            Esta acción es permanente y elimina el acceso del usuario al sistema.
                        </p>
                    </div>

                    <div className="p-5 sm:p-6">
                        <DeleteUserForm className="max-w-3xl" />
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}