import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Show({ tramite }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{tramite.nombre}</h1>
                        <p className="mt-1 text-sm text-slate-500">Detalle del trámite</p>
                    </div>

                    <div className="flex gap-2">
                        <Link
                            href={route('tramites.edit', tramite.id)}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Editar
                        </Link>

                        <Link
                            href={route('tramites.index')}
                            className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#274c64]"
                        >
                            Volver al listado
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={tramite.nombre} />

            <div className="mx-auto max-w-3xl space-y-6">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Estado
                            </p>
                            <span
                                className={[
                                    'mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                                    tramite.estado === 'Activo'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-slate-100 text-slate-600',
                                ].join(' ')}
                            >
                                {tramite.estado}
                            </span>
                        </div>

                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Costo</p>
                            <p className="mt-1 text-sm text-slate-800">
                                {tramite.costo ? `S/ ${Number(tramite.costo).toFixed(2)}` : 'Sin costo'}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Tiempo de atención
                            </p>
                            <p className="mt-1 text-sm text-slate-800">{tramite.tiempo || '—'}</p>
                        </div>

                        <div className="sm:col-span-2">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Descripción
                            </p>
                            <p className="mt-1 text-sm text-slate-800">
                                {tramite.descripcion || 'Sin descripción'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Requisitos exigidos
                    </p>

                    {tramite.requisitos?.length ? (
                        <ul className="space-y-2">
                            {tramite.requisitos.map((requisito) => (
                                <li
                                    key={requisito.id}
                                    className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700"
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#315d7a]" />
                                    {requisito.descripcion}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-slate-500">Este trámite no tiene requisitos asignados.</p>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}