import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function Edit({
    admision,
    periodos = [],
    tiposAdmision = [],
    requisitos = [],
    tiposPago = [],
}) {
    const { data, setData, put, processing, errors } = useForm({
        id_periodo: admision.id_periodo || '',
        id_tipo_admision: admision.id_tipo_admision || '',
        nombre: admision.nombre || '',
        inicio_proceso: admision.inicio_proceso || '',
        fin_proceso: admision.fin_proceso || '',
        inicio_inscripciones: admision.inicio_inscripciones || '',
        fin_inscripciones: admision.fin_inscripciones || '',
        inicio_extemporaneo: admision.inicio_extemporaneo || '',
        fin_extemporaneo: admision.fin_extemporaneo || '',
        fecha_examen: admision.fecha_examen || '',
        direccion: admision.direccion || '',
        activo: Boolean(admision.activo),
        requisitos: admision.requisitos || [],
        tipos_pago: admision.tipos_pago || [],
    });

    const cambiarSeleccion = (campo, id) => {
        const valor = Number(id);
        const seleccionados = data[campo];

        setData(
            campo,
            seleccionados.includes(valor)
                ? seleccionados.filter((item) => item !== valor)
                : [...seleccionados, valor]
        );
    };

    const seleccionarTodos = (campo, elementos, llave) => {
        const ids = elementos.map((elemento) => Number(elemento[llave]));
        const todosSeleccionados = ids.every((id) => data[campo].includes(id));
        setData(campo, todosSeleccionados ? [] : ids);
    };

    const actualizar = (event) => {
        event.preventDefault();

        put(route('admisiones.update', admision.id_admision), {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: '¡Actualizado!',
                    text: 'El proceso de admisión fue actualizado correctamente.',
                    icon: 'success',
                    confirmButtonColor: '#315d7a',
                });
            },
            onError: () => {
                Swal.fire({
                    title: 'Revisa la información',
                    text: 'Existen campos pendientes o datos que deben corregirse.',
                    icon: 'warning',
                    confirmButtonColor: '#315d7a',
                });
            },
        });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-slate-900">Editar Admisión</h1>}>
            <Head title={`Editar - ${admision.nombre}`} />

            <div className="w-full space-y-6">
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Modificar proceso de admisión</h2>
                        <p className="mt-1 text-sm text-slate-500">Actualice la configuración del proceso registrado.</p>
                    </div>

                    <div className="flex gap-2">
                        <Link
                            href={route('admisiones.show', admision.id_admision)}
                            className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            Ver detalle
                        </Link>
                        <Link
                            href={route('admisiones.index')}
                            className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            Volver al listado
                        </Link>
                    </div>
                </div>

                <form onSubmit={actualizar} className="space-y-6">
                    {/* INFORMACIÓN GENERAL */}
                    <Seccion titulo="Información general" descripcion="Datos principales del proceso de admisión.">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <CampoSelect
                                label="Periodo académico"
                                value={data.id_periodo}
                                onChange={(e) => setData('id_periodo', e.target.value)}
                                error={errors.id_periodo}
                                required
                            >
                                <option value="">Seleccione un periodo</option>
                                {periodos.map((p) => (
                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                ))}
                            </CampoSelect>

                            <CampoSelect
                                label="Tipo de admisión"
                                value={data.id_tipo_admision}
                                onChange={(e) => setData('id_tipo_admision', e.target.value)}
                                error={errors.id_tipo_admision}
                                required
                            >
                                <option value="">Seleccione un tipo</option>
                                {tiposAdmision.map((t) => (
                                    <option key={t.id_tipo_admision} value={t.id_tipo_admision}>
                                        {t.nombre} {t.monto !== null && ` - S/ ${Number(t.monto).toFixed(2)}`}
                                    </option>
                                ))}
                            </CampoSelect>

                            <div className="md:col-span-2">
                                <CampoTexto
                                    label="Nombre del proceso"
                                    value={data.nombre}
                                    onChange={(e) => setData('nombre', e.target.value)}
                                    error={errors.nombre}
                                    placeholder="Ejemplo: Admisión Ordinaria 2026-II"
                                    maxLength={255}
                                    required
                                />
                            </div>

                            <div className="md:col-span-2">
                                <CampoTexto
                                    label="Dirección del examen"
                                    value={data.direccion}
                                    onChange={(e) => setData('direccion', e.target.value)}
                                    error={errors.direccion}
                                    placeholder="Ingrese la dirección donde se realizará el examen"
                                    maxLength={500}
                                    required
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <input
                                        type="checkbox"
                                        checked={data.activo}
                                        onChange={(e) => setData('activo', e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-[#315d7a] focus:ring-[#315d7a]"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">Proceso activo</p>
                                        <p className="text-xs text-slate-500">El proceso estará disponible para las operaciones correspondientes.</p>
                                    </div>
                                </label>
                                {errors.activo && <MensajeError mensaje={errors.activo} />}
                            </div>
                        </div>
                    </Seccion>

                    {/* CRONOGRAMA */}
                    <Seccion titulo="Cronograma" descripcion="Defina las fechas de cada etapa del proceso.">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                            <CampoFecha label="Inicio del proceso" value={data.inicio_proceso} onChange={(e) => setData('inicio_proceso', e.target.value)} error={errors.inicio_proceso} required />
                            <CampoFecha label="Fin del proceso" value={data.fin_proceso} onChange={(e) => setData('fin_proceso', e.target.value)} error={errors.fin_proceso} min={data.inicio_proceso} required />
                            <CampoFecha label="Fecha del examen" value={data.fecha_examen} onChange={(e) => setData('fecha_examen', e.target.value)} error={errors.fecha_examen} min={data.inicio_inscripciones} max={data.fin_proceso} required />
                            <CampoFecha label="Inicio de inscripciones" value={data.inicio_inscripciones} onChange={(e) => setData('inicio_inscripciones', e.target.value)} error={errors.inicio_inscripciones} min={data.inicio_proceso} max={data.fin_proceso} required />
                            <CampoFecha label="Fin de inscripciones" value={data.fin_inscripciones} onChange={(e) => setData('fin_inscripciones', e.target.value)} error={errors.fin_inscripciones} min={data.inicio_inscripciones} max={data.fin_proceso} required />
                            <div className="hidden xl:block" />
                            <CampoFecha label="Inicio extemporáneo" value={data.inicio_extemporaneo} onChange={(e) => setData('inicio_extemporaneo', e.target.value)} error={errors.inicio_extemporaneo} min={data.fin_inscripciones} max={data.fin_proceso} />
                            <CampoFecha label="Fin extemporáneo" value={data.fin_extemporaneo} onChange={(e) => setData('fin_extemporaneo', e.target.value)} error={errors.fin_extemporaneo} min={data.inicio_extemporaneo} max={data.fin_proceso} />
                        </div>
                    </Seccion>

                    {/* REQUISITOS */}
                    <Seccion
                        titulo="Requisitos"
                        descripcion="Seleccione los documentos requeridos para la postulación."
                        accion={requisitos.length > 0 && (
                            <button type="button" onClick={() => seleccionarTodos('requisitos', requisitos, 'id_requisito')} className="text-xs font-semibold text-[#315d7a] hover:underline">
                                Seleccionar o limpiar todos
                            </button>
                        )}
                    >
                        {requisitos.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {requisitos.map((req) => {
                                    const id = Number(req.id_requisito);
                                    const seleccionado = data.requisitos.includes(id);
                                    return (
                                        <label key={id} className={`cursor-pointer rounded-lg border p-4 transition ${seleccionado ? 'border-[#315d7a] bg-[#315d7a]/5 ring-1 ring-[#315d7a]/20' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                                            <div className="flex items-start gap-3">
                                                <input type="checkbox" checked={seleccionado} onChange={() => cambiarSeleccion('requisitos', id)} className="mt-1 h-4 w-4 rounded border-slate-300 text-[#315d7a] focus:ring-[#315d7a]" />
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">{req.nombre}</p>
                                                    {req.descripcion && <p className="mt-1 text-xs text-slate-500">{req.descripcion}</p>}
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        ) : <MensajeVacio mensaje="No existen requisitos disponibles." />}
                        {(errors.requisitos || errors['requisitos.0']) && <MensajeError mensaje={errors.requisitos || errors['requisitos.0']} />}
                    </Seccion>

                    {/* MEDIOS DE PAGO */}
                    <Seccion
                        titulo="Medios de pago"
                        descripcion="Seleccione los medios de pago disponibles."
                        accion={tiposPago.length > 0 && (
                            <button type="button" onClick={() => seleccionarTodos('tipos_pago', tiposPago, 'id_tipo_pago')} className="text-xs font-semibold text-[#315d7a] hover:underline">
                                Seleccionar o limpiar todos
                            </button>
                        )}
                    >
                        {tiposPago.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {tiposPago.map((tp) => {
                                    const id = Number(tp.id_tipo_pago);
                                    const seleccionado = data.tipos_pago.includes(id);
                                    return (
                                        <label key={id} className={`cursor-pointer rounded-lg border p-4 transition ${seleccionado ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-200' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                                            <div className="flex items-start gap-3">
                                                <input type="checkbox" checked={seleccionado} onChange={() => cambiarSeleccion('tipos_pago', id)} className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600" />
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">{tp.nombre}</p>
                                                    {tp.banco_o_entidad && <p className="mt-1 text-xs text-slate-500">{tp.banco_o_entidad}</p>}
                                                    {tp.numero_cuenta && <p className="mt-1 text-[11px] text-slate-400">Cuenta: {tp.numero_cuenta}</p>}
                                                    {tp.cci && <p className="text-[11px] text-slate-400">CCI: {tp.cci}</p>}
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        ) : <MensajeVacio mensaje="No existen medios de pago disponibles." />}
                        {(errors.tipos_pago || errors['tipos_pago.0']) && <MensajeError mensaje={errors.tipos_pago || errors['tipos_pago.0']} />}
                    </Seccion>

                    {/* ACCIONES */}
                    <div className="flex flex-col-reverse justify-end gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row">
                        <Link href={route('admisiones.index')} className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                            Cancelar
                        </Link>
                        <button type="submit" disabled={processing} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#315d7a] px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-[#274b63] disabled:cursor-not-allowed disabled:opacity-60">
                            {processing ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}

function Seccion({ titulo, descripcion, accion = null, children }) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col justify-between gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-base font-bold text-slate-800">{titulo}</h2>
                    {descripcion && <p className="mt-1 text-xs text-slate-500">{descripcion}</p>}
                </div>
                {accion}
            </div>
            {children}
        </section>
    );
}

function CampoTexto({ label, error, required = false, ...props }) {
    return (
        <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
                {label} {required && <span className="text-rose-600">*</span>}
            </label>
            <input type="text" {...props} className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 outline-none transition focus:ring-2 ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-[#315d7a] focus:ring-[#315d7a]/20'}`} />
            {error && <MensajeError mensaje={error} />}
        </div>
    );
}

function CampoFecha({ label, error, required = false, ...props }) {
    return (
        <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
                {label} {required && <span className="text-rose-600">*</span>}
            </label>
            <input type="date" {...props} className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 outline-none transition focus:ring-2 ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-[#315d7a] focus:ring-[#315d7a]/20'}`} />
            {error && <MensajeError mensaje={error} />}
        </div>
    );
}

function CampoSelect({ label, error, required = false, children, ...props }) {
    return (
        <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
                {label} {required && <span className="text-rose-600">*</span>}
            </label>
            <select {...props} className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 outline-none transition focus:ring-2 ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-[#315d7a] focus:ring-[#315d7a]/20'}`}>
                {children}
            </select>
            {error && <MensajeError mensaje={error} />}
        </div>
    );
}

function MensajeError({ mensaje }) {
    return <p className="mt-1 text-xs font-medium text-rose-600">{mensaje}</p>;
}

function MensajeVacio({ mensaje }) {
    return <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">{mensaje}</div>;
}