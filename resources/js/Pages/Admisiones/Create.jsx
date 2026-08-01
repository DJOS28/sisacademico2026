import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function Create({
    periodos = [],
    tiposAdmision = [],
    requisitos = [],
    tiposPago = [],
}) {
    const { data, setData, post, processing, errors } = useForm({
        id_periodo: '',
        id_tipo_admision: '',
        nombre: '',
        inicio_proceso: '',
        fin_proceso: '',
        inicio_inscripciones: '',
        fin_inscripciones: '',
        inicio_extemporaneo: '',
        fin_extemporaneo: '',
        fecha_examen: '',
        direccion: '',
        activo: true,
        requisitos: [],
        tipos_pago: [],
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
        const todosSeleccionados = ids.every((id) =>
            data[campo].includes(id)
        );

        setData(campo, todosSeleccionados ? [] : ids);
    };

    const guardar = (event) => {
        event.preventDefault();

        post(route('admisiones.store'), {
            preserveScroll: true,

            onSuccess: () => {
                Swal.fire({
                    title: '¡Correcto!',
                    text: 'El proceso de admisión fue registrado correctamente.',
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
        <AuthenticatedLayout
            header={
                <h1 className="text-2xl font-bold text-slate-900">
                    Nueva Admisión
                </h1>
            }
        >
            <Head title="Nueva Admisión" />

            <div className="w-full space-y-6">
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Registrar proceso de admisión
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Complete las fechas, requisitos y medios de pago.
                        </p>
                    </div>

                    <Link
                        href={route('admisiones.index')}
                        className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        Volver al listado
                    </Link>
                </div>

                <form onSubmit={guardar} className="space-y-6">
                    {/* INFORMACIÓN GENERAL */}
                    <Seccion
                        titulo="Información general"
                        descripcion="Datos principales del proceso de admisión."
                    >
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <CampoSelect
                                label="Periodo académico"
                                value={data.id_periodo}
                                onChange={(event) =>
                                    setData('id_periodo', event.target.value)
                                }
                                error={errors.id_periodo}
                                required
                            >
                                <option value="">Seleccione un periodo</option>

                                {periodos.map((periodo) => (
                                    <option
                                        key={periodo.id}
                                        value={periodo.id}
                                    >
                                        {periodo.nombre}
                                    </option>
                                ))}
                            </CampoSelect>

                            <CampoSelect
                                label="Tipo de admisión"
                                value={data.id_tipo_admision}
                                onChange={(event) =>
                                    setData(
                                        'id_tipo_admision',
                                        event.target.value
                                    )
                                }
                                error={errors.id_tipo_admision}
                                required
                            >
                                <option value="">
                                    Seleccione un tipo de admisión
                                </option>

                                {tiposAdmision.map((tipo) => (
                                    <option
                                        key={tipo.id_tipo_admision}
                                        value={tipo.id_tipo_admision}
                                    >
                                        {tipo.nombre}
                                        {tipo.monto !== null &&
                                        tipo.monto !== undefined
                                            ? ` - S/ ${Number(
                                                  tipo.monto
                                              ).toFixed(2)}`
                                            : ''}
                                    </option>
                                ))}
                            </CampoSelect>

                            <div className="md:col-span-2">
                                <CampoTexto
                                    label="Nombre del proceso"
                                    value={data.nombre}
                                    onChange={(event) =>
                                        setData('nombre', event.target.value)
                                    }
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
                                    onChange={(event) =>
                                        setData(
                                            'direccion',
                                            event.target.value
                                        )
                                    }
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
                                        onChange={(event) =>
                                            setData(
                                                'activo',
                                                event.target.checked
                                            )
                                        }
                                        className="h-4 w-4 rounded border-slate-300 text-[#315d7a] focus:ring-[#315d7a]"
                                    />

                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">
                                            Proceso activo
                                        </p>

                                        <p className="text-xs text-slate-500">
                                            El proceso estará disponible para
                                            las operaciones correspondientes.
                                        </p>
                                    </div>
                                </label>

                                {errors.activo && (
                                    <MensajeError mensaje={errors.activo} />
                                )}
                            </div>
                        </div>
                    </Seccion>

                    {/* CRONOGRAMA */}
                    <Seccion
                        titulo="Cronograma"
                        descripcion="Defina las fechas de cada etapa del proceso."
                    >
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                            <CampoFecha
                                label="Inicio del proceso"
                                value={data.inicio_proceso}
                                onChange={(event) =>
                                    setData(
                                        'inicio_proceso',
                                        event.target.value
                                    )
                                }
                                error={errors.inicio_proceso}
                                required
                            />

                            <CampoFecha
                                label="Fin del proceso"
                                value={data.fin_proceso}
                                onChange={(event) =>
                                    setData(
                                        'fin_proceso',
                                        event.target.value
                                    )
                                }
                                error={errors.fin_proceso}
                                min={data.inicio_proceso}
                                required
                            />

                            <CampoFecha
                                label="Fecha del examen"
                                value={data.fecha_examen}
                                onChange={(event) =>
                                    setData(
                                        'fecha_examen',
                                        event.target.value
                                    )
                                }
                                error={errors.fecha_examen}
                                min={data.inicio_inscripciones}
                                max={data.fin_proceso}
                                required
                            />

                            <CampoFecha
                                label="Inicio de inscripciones"
                                value={data.inicio_inscripciones}
                                onChange={(event) =>
                                    setData(
                                        'inicio_inscripciones',
                                        event.target.value
                                    )
                                }
                                error={errors.inicio_inscripciones}
                                min={data.inicio_proceso}
                                max={data.fin_proceso}
                                required
                            />

                            <CampoFecha
                                label="Fin de inscripciones"
                                value={data.fin_inscripciones}
                                onChange={(event) =>
                                    setData(
                                        'fin_inscripciones',
                                        event.target.value
                                    )
                                }
                                error={errors.fin_inscripciones}
                                min={data.inicio_inscripciones}
                                max={data.fin_proceso}
                                required
                            />

                            <div className="hidden xl:block" />

                            <CampoFecha
                                label="Inicio extemporáneo"
                                value={data.inicio_extemporaneo}
                                onChange={(event) =>
                                    setData(
                                        'inicio_extemporaneo',
                                        event.target.value
                                    )
                                }
                                error={errors.inicio_extemporaneo}
                                min={data.fin_inscripciones}
                                max={data.fin_proceso}
                            />

                            <CampoFecha
                                label="Fin extemporáneo"
                                value={data.fin_extemporaneo}
                                onChange={(event) =>
                                    setData(
                                        'fin_extemporaneo',
                                        event.target.value
                                    )
                                }
                                error={errors.fin_extemporaneo}
                                min={data.inicio_extemporaneo}
                                max={data.fin_proceso}
                            />
                        </div>

                        <p className="mt-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                            Las fechas extemporáneas son opcionales. Si registra
                            una de ellas, deberá completar ambas.
                        </p>
                    </Seccion>

                    {/* REQUISITOS */}
                    <Seccion
                        titulo="Requisitos"
                        descripcion="Seleccione los documentos requeridos para la postulación."
                        accion={
                            requisitos.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        seleccionarTodos(
                                            'requisitos',
                                            requisitos,
                                            'id_requisito'
                                        )
                                    }
                                    className="text-xs font-semibold text-[#315d7a] hover:underline"
                                >
                                    Seleccionar o limpiar todos
                                </button>
                            )
                        }
                    >
                        {requisitos.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {requisitos.map((requisito) => {
                                    const id = Number(
                                        requisito.id_requisito
                                    );
                                    const seleccionado =
                                        data.requisitos.includes(id);

                                    return (
                                        <label
                                            key={id}
                                            className={`cursor-pointer rounded-lg border p-4 transition ${
                                                seleccionado
                                                    ? 'border-[#315d7a] bg-[#315d7a]/5 ring-1 ring-[#315d7a]/20'
                                                    : 'border-slate-200 bg-white hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={seleccionado}
                                                    onChange={() =>
                                                        cambiarSeleccion(
                                                            'requisitos',
                                                            id
                                                        )
                                                    }
                                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#315d7a] focus:ring-[#315d7a]"
                                                />

                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">
                                                        {requisito.nombre}
                                                    </p>

                                                    {requisito.descripcion && (
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {
                                                                requisito.descripcion
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        ) : (
                            <MensajeVacio mensaje="No existen requisitos activos registrados." />
                        )}

                        {(errors.requisitos ||
                            errors['requisitos.0']) && (
                            <MensajeError
                                mensaje={
                                    errors.requisitos ||
                                    errors['requisitos.0']
                                }
                            />
                        )}
                    </Seccion>

                    {/* TIPOS DE PAGO */}
                    <Seccion
                        titulo="Medios de pago"
                        descripcion="Seleccione los medios de pago disponibles para este proceso."
                        accion={
                            tiposPago.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        seleccionarTodos(
                                            'tipos_pago',
                                            tiposPago,
                                            'id_tipo_pago'
                                        )
                                    }
                                    className="text-xs font-semibold text-[#315d7a] hover:underline"
                                >
                                    Seleccionar o limpiar todos
                                </button>
                            )
                        }
                    >
                        {tiposPago.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {tiposPago.map((tipoPago) => {
                                    const id = Number(
                                        tipoPago.id_tipo_pago
                                    );
                                    const seleccionado =
                                        data.tipos_pago.includes(id);

                                    return (
                                        <label
                                            key={id}
                                            className={`cursor-pointer rounded-lg border p-4 transition ${
                                                seleccionado
                                                    ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-200'
                                                    : 'border-slate-200 bg-white hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={seleccionado}
                                                    onChange={() =>
                                                        cambiarSeleccion(
                                                            'tipos_pago',
                                                            id
                                                        )
                                                    }
                                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                                                />

                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">
                                                        {tipoPago.nombre}
                                                    </p>

                                                    {tipoPago.banco_o_entidad && (
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {
                                                                tipoPago.banco_o_entidad
                                                            }
                                                        </p>
                                                    )}

                                                    {tipoPago.numero_cuenta && (
                                                        <p className="mt-1 text-[11px] text-slate-400">
                                                            Cuenta:{' '}
                                                            {
                                                                tipoPago.numero_cuenta
                                                            }
                                                        </p>
                                                    )}

                                                    {tipoPago.cci && (
                                                        <p className="text-[11px] text-slate-400">
                                                            CCI: {tipoPago.cci}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        ) : (
                            <MensajeVacio mensaje="No existen medios de pago activos registrados." />
                        )}

                        {(errors.tipos_pago ||
                            errors['tipos_pago.0']) && (
                            <MensajeError
                                mensaje={
                                    errors.tipos_pago ||
                                    errors['tipos_pago.0']
                                }
                            />
                        )}
                    </Seccion>

                    {/* ACCIONES */}
                    <div className="flex flex-col-reverse justify-end gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row">
                        <Link
                            href={route('admisiones.index')}
                            className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            Cancelar
                        </Link>

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#315d7a] px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-[#274b63] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {processing && (
                                <svg
                                    className="h-4 w-4 animate-spin"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />

                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                    />
                                </svg>
                            )}

                            {processing
                                ? 'Guardando...'
                                : 'Guardar admisión'}
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
                    <h2 className="text-base font-bold text-slate-800">
                        {titulo}
                    </h2>

                    {descripcion && (
                        <p className="mt-1 text-xs text-slate-500">
                            {descripcion}
                        </p>
                    )}
                </div>

                {accion}
            </div>

            {children}
        </section>
    );
}

function CampoTexto({
    label,
    error,
    required = false,
    className = '',
    ...props
}) {
    return (
        <div className={className}>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
                {label}
                {required && <span className="ml-1 text-rose-600">*</span>}
            </label>

            <input
                type="text"
                {...props}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 outline-none transition focus:ring-2 ${
                    error
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-[#315d7a] focus:ring-[#315d7a]/20'
                }`}
            />

            {error && <MensajeError mensaje={error} />}
        </div>
    );
}

function CampoFecha({
    label,
    error,
    required = false,
    min,
    max,
    ...props
}) {
    return (
        <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
                {label}
                {required && <span className="ml-1 text-rose-600">*</span>}
            </label>

            <input
                type="date"
                {...props}
                min={min || undefined}
                max={max || undefined}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 outline-none transition focus:ring-2 ${
                    error
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-[#315d7a] focus:ring-[#315d7a]/20'
                }`}
            />

            {error && <MensajeError mensaje={error} />}
        </div>
    );
}

function CampoSelect({
    label,
    error,
    required = false,
    children,
    ...props
}) {
    return (
        <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
                {label}
                {required && <span className="ml-1 text-rose-600">*</span>}
            </label>

            <select
                {...props}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 outline-none transition focus:ring-2 ${
                    error
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-[#315d7a] focus:ring-[#315d7a]/20'
                }`}
            >
                {children}
            </select>

            {error && <MensajeError mensaje={error} />}
        </div>
    );
}

function MensajeError({ mensaje }) {
    return (
        <p className="mt-1 text-xs font-medium text-rose-600">{mensaje}</p>
    );
}

function MensajeVacio({ mensaje }) {
    return (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            {mensaje}
        </div>
    );
}