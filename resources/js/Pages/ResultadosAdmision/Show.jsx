import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Show({ resultado }) {
    const postulante = resultado.postulante || {};

    const getEstadoBadge = (est) => {
        switch (est) {
            case 'con_vacante':
                return <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">✓ Alcanzó Vacante</span>;
            case 'sin_vacante':
                return <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800">✕ Sin Vacante</span>;
            case 'ausente':
                return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">⚑ Ausente</span>;
            case 'anulado':
                return <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">⊘ Anulado</span>;
            default:
                return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{est}</span>;
        }
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-slate-900">Detalle de Resultado</h1>}>
            <Head title="Detalle de Resultado" />

            <div className="w-full space-y-6 max-w-3xl mx-auto">
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Resultado Individual de Admisión</h2>
                        <p className="mt-1 text-sm text-slate-500">Ficha oficial de calificación obtenida en el examen.</p>
                    </div>

                    <div className="flex gap-2">
                        <Link
                            href={route('resultados-admision.edit', resultado.id)}
                            className="rounded-lg bg-[#315d7a] px-4 py-2 text-xs font-bold text-white shadow hover:bg-[#274b63]"
                        >
                            Editar
                        </Link>
                        <Link
                            href={route('resultados-admision.index', { id_proceso: resultado.id_proceso })}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Volver
                        </Link>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                    {/* ENCABEZADO RESUMEN NOTA */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Condición Final:</p>
                            <div className="mt-1">{getEstadoBadge(resultado.estado)}</div>
                        </div>

                        <div className="text-right">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Puntaje / Nota:</p>
                            <p className="text-3xl font-extrabold text-[#315d7a] font-mono mt-1">
                                {Number(resultado.nota).toFixed(2)}
                            </p>
                        </div>
                    </div>

                    {/* DATOS DEL POSTULANTE */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Datos del Postulante</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-lg bg-slate-50 p-4 text-sm">
                            <div>
                                <span className="block text-xs font-semibold text-slate-500">Nombres y Apellidos</span>
                                <strong className="text-slate-900">{postulante.apellidos}, {postulante.nombres}</strong>
                            </div>
                            <div>
                                <span className="block text-xs font-semibold text-slate-500">DNI / Documento</span>
                                <span className="font-mono text-slate-800">{postulante.dni || '—'}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-semibold text-slate-500">Código de Postulante</span>
                                <span className="font-mono font-bold text-[#315d7a]">{postulante.codigo_postulante || 'S/C'}</span>
                            </div>
                        </div>
                    </div>

                    {/* DATOS DE LA ADMISIÓN */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Datos Académicos</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-lg bg-slate-50 p-4 text-sm">
                            <div>
                                <span className="block text-xs font-semibold text-slate-500">Proceso de Admisión</span>
                                <span className="font-bold text-slate-800">{resultado.admision?.nombre}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-semibold text-slate-500">Carrera / Programa</span>
                                <span className="font-bold text-slate-800">{resultado.plan_estudio?.nombre}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}