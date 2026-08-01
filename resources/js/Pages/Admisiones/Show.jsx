import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function Show({ admision }) {
    const eliminarProceso = () => {
        Swal.fire({
            title: '¿Eliminar este proceso?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('admisiones.destroy', admision.id_admision), {
                    onSuccess: () => {
                        Swal.fire('Eliminado', 'El proceso de admisión ha sido eliminado.', 'success');
                    },
                    onError: (errors) => {
                        Swal.fire('Error', errors.error || 'No se pudo eliminar el proceso.', 'error');
                    },
                });
            }
        });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-slate-900">Detalle de Admisión</h1>}>
            <Head title={admision.nombre} />

            <div className="w-full space-y-6">
                {/* CABECERA */}
                <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-slate-800">{admision.nombre}</h2>
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${admision.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                {admision.activo ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                            Periodo: <strong className="font-semibold text-slate-700">{admision.periodo?.nombre || 'N/A'}</strong> | Tipo: <strong className="font-semibold text-slate-700">{admision.tipo_admision?.nombre || 'N/A'}</strong>
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={route('admisiones.edit', admision.id_admision)}
                            className="inline-flex justify-center rounded-lg bg-[#315d7a] px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-[#274b63]"
                        >
                            Editar
                        </Link>
                        <button
                            type="button"
                            onClick={eliminarProceso}
                            className="inline-flex justify-center rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                        >
                            Eliminar
                        </button>
                        <Link
                            href={route('admisiones.index')}
                            className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            Volver al listado
                        </Link>
                    </div>
                </div>

                {/* TARJETAS RESUMEN DE CONTEOS */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <TarjetaMetrica titulo="Inscripciones" valor={admision.inscripciones_count ?? 0} color="border-l-blue-500" />
                    <TarjetaMetrica titulo="Requisitos" valor={admision.requisitos_count ?? 0} color="border-l-indigo-500" />
                    <TarjetaMetrica titulo="Medios de Pago" valor={admision.tipos_pago_count ?? 0} color="border-l-emerald-500" />
                    <TarjetaMetrica titulo="Resultados" valor={admision.resultados_count ?? 0} color="border-l-purple-500" />
                </div>

                {/* DETALLES Y CRONOGRAMA */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* INFORMACIÓN GENERAL */}
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="border-b border-slate-200 pb-3 text-base font-bold text-slate-800">Información General</h3>
                        <dl className="mt-4 space-y-3 text-sm">
                            <ItemDetalle etiqueta="Dirección de examen" valor={admision.direccion} />
                            <ItemDetalle etiqueta="Monto Regular" valor={admision.tipo_admision?.monto ? `S/ ${Number(admision.tipo_admision.monto).toFixed(2)}` : 'N/A'} />
                            <ItemDetalle etiqueta="Monto Extemporáneo" valor={admision.tipo_admision?.monto_extemporaneo ? `S/ ${Number(admision.tipo_admision.monto_extemporaneo).toFixed(2)}` : 'N/A'} />
                        </dl>
                    </section>

                    {/* CRONOGRAMA */}
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="border-b border-slate-200 pb-3 text-base font-bold text-slate-800">Cronograma del Proceso</h3>
                        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                            <ItemDetalle etiqueta="Inicio del proceso" valor={admision.inicio_proceso} />
                            <ItemDetalle etiqueta="Fin del proceso" valor={admision.fin_proceso} />
                            <ItemDetalle etiqueta="Inicio inscripciones" valor={admision.inicio_inscripciones} />
                            <ItemDetalle etiqueta="Fin inscripciones" valor={admision.fin_inscripciones} />
                            <ItemDetalle etiqueta="Fecha de examen" valor={admision.fecha_examen} destacada />
                            <ItemDetalle etiqueta="Periodo Extemporáneo" valor={admision.inicio_extemporaneo ? `${admision.inicio_extemporaneo} al ${admision.fin_extemporaneo}` : 'Sin extemporáneo'} />
                        </dl>
                    </section>
                </div>

                {/* REQUISITOS Y MEDIOS DE PAGO */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* REQUISITOS */}
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="border-b border-slate-200 pb-3 text-base font-bold text-slate-800">
                            Requisitos Exigidos ({admision.requisitos?.length || 0})
                        </h3>
                        <ul className="mt-4 divide-y divide-slate-100">
                            {admision.requisitos && admision.requisitos.length > 0 ? (
                                admision.requisitos.map((req) => (
                                    <li key={req.id_requisito} className="py-2.5">
                                        <p className="text-sm font-semibold text-slate-800">{req.nombre}</p>
                                        {req.descripcion && <p className="text-xs text-slate-500">{req.descripcion}</p>}
                                    </li>
                                ))
                            ) : (
                                <p className="py-4 text-xs text-slate-500">No se asignaron requisitos a este proceso.</p>
                            )}
                        </ul>
                    </section>

                    {/* MEDIOS DE PAGO */}
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="border-b border-slate-200 pb-3 text-base font-bold text-slate-800">
                            Medios de Pago Habilitados ({admision.tipos_pago?.length || 0})
                        </h3>
                        <ul className="mt-4 divide-y divide-slate-100">
                            {admision.tipos_pago && admision.tipos_pago.length > 0 ? (
                                admision.tipos_pago.map((tp) => (
                                    <li key={tp.id_tipo_pago} className="py-2.5">
                                        <p className="text-sm font-semibold text-slate-800">{tp.nombre}</p>
                                        <div className="flex flex-wrap gap-x-4 text-xs text-slate-500">
                                            {tp.banco_o_entidad && <span>Entidad: {tp.banco_o_entidad}</span>}
                                            {tp.numero_cuenta && <span>Cuenta: {tp.numero_cuenta}</span>}
                                            {tp.cci && <span>CCI: {tp.cci}</span>}
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <p className="py-4 text-xs text-slate-500">No se asignaron medios de pago a este proceso.</p>
                            )}
                        </ul>
                    </section>
                </div>

                {/* ÚLTIMAS INSCRIPCIONES */}
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="border-b border-slate-200 pb-3 text-base font-bold text-slate-800">
                        Últimas Inscripciones Registradas
                    </h3>
                    <div className="mt-4 overflow-x-auto">
                        {admision.inscripciones && admision.inscripciones.length > 0 ? (
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                                    <tr>
                                        <th className="px-3 py-2">Código</th>
                                        <th className="px-3 py-2">Postulante</th>
                                        <th className="px-3 py-2">DNI</th>
                                        <th className="px-3 py-2">Programa / Plan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {admision.inscripciones.map((ins) => (
                                        <tr key={ins.id_inscripcion || ins.id} className="hover:bg-slate-50">
                                            <td className="px-3 py-2 font-mono font-medium">{ins.postulante?.codigo_postulante || 'S/C'}</td>
                                            <td className="px-3 py-2 font-semibold text-slate-800">
                                                {ins.postulante ? `${ins.postulante.nombres} ${ins.postulante.apellidos}` : 'N/A'}
                                            </td>
                                            <td className="px-3 py-2">{ins.postulante?.dni || '-'}</td>
                                            <td className="px-3 py-2">{ins.plan_estudio?.nombre || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="py-4 text-xs text-slate-500">No hay inscripciones registradas en este proceso aún.</p>
                        )}
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

function TarjetaMetrica({ titulo, valor, color }) {
    return (
        <div className={`rounded-xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm ${color}`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{titulo}</p>
            <p className="mt-1 text-2xl font-black text-slate-800">{valor}</p>
        </div>
    );
}

function ItemDetalle({ etiqueta, valor, destacada = false }) {
    return (
        <div className={destacada ? 'rounded-lg bg-blue-50 p-2 text-blue-900' : ''}>
            <dt className="text-xs font-semibold text-slate-500">{etiqueta}</dt>
            <dd className="mt-0.5 font-medium text-slate-800">{valor || '—'}</dd>
        </div>
    );
}