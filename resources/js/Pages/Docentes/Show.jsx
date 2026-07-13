import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

function DataItem({ label, value }) {
    return (
        <div className="border-b border-slate-100 py-3 last:border-b-0">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {label}
            </p>
            <p className="mt-1 break-words text-sm font-medium text-slate-800">
                {value || '—'}
            </p>
        </div>
    );
}

export default function Show({ docente }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-[#315d7a]">
                            Gestión académica
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-slate-900">
                            Información del docente
                        </h1>
                    </div>

                    <div className="flex gap-2">
                        <Link
                            href={route('docentes.index')}
                            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                        >
                            Volver
                        </Link>
                        <Link
                            href={route('docentes.edit', docente.id)}
                            className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#274c64]"
                        >
                            Editar
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={docente.nombre_completo} />

            <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
                <aside className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-col items-center text-center">
                        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl bg-[#eaf1f6] text-3xl font-bold text-[#315d7a]">
                            {docente.usuario?.img ? (
                                <img
                                    src={docente.usuario.img}
                                    alt={docente.nombre_completo}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                docente.nombre_completo.charAt(0).toUpperCase()
                            )}
                        </div>

                        <h2 className="mt-4 text-lg font-bold text-slate-900">
                            {docente.nombre_completo}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {docente.cargo || 'Docente'}
                        </p>

                        <span
                            className={[
                                'mt-4 rounded-full px-3 py-1 text-xs font-semibold',
                                docente.usuario?.status === 'Disponible'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-slate-100 text-slate-600',
                            ].join(' ')}
                        >
                            {docente.usuario?.status || 'Sin estado'}
                        </span>
                    </div>
                </aside>

                <div className="grid gap-5 md:grid-cols-2">
                    <section className="rounded-xl border border-slate-200 bg-white p-5">
                        <h3 className="border-b border-slate-100 pb-3 text-base font-bold text-slate-900">
                            Datos personales
                        </h3>
                        <DataItem label="Nombres" value={docente.nombre} />
                        <DataItem label="Apellidos" value={docente.apellido} />
                        <DataItem label="DNI" value={docente.dni} />
                        <DataItem label="Correo" value={docente.email} />
                        <DataItem label="Teléfono" value={docente.telefono} />
                        <DataItem label="Dirección" value={docente.direccion} />
                        <DataItem label="Departamento" value={docente.departamento} />
                        <DataItem label="Cargo" value={docente.cargo} />
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white p-5">
                        <h3 className="border-b border-slate-100 pb-3 text-base font-bold text-slate-900">
                            Cuenta y acceso
                        </h3>
                        <DataItem
                            label="Nombre de usuario"
                            value={docente.usuario?.username}
                        />
                        <DataItem
                            label="Roles"
                            value={docente.usuario?.roles?.join(', ')}
                        />
                        <DataItem
                            label="Estado"
                            value={docente.usuario?.status}
                        />
                        <DataItem
                            label="ID Moodle"
                            value={docente.usuario?.moodle_user_id}
                        />
                        <DataItem
                            label="Fecha de registro"
                            value={docente.created_at}
                        />
                        <DataItem
                            label="Última actualización"
                            value={docente.updated_at}
                        />
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
