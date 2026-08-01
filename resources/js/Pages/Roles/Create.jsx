import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Head,
    Link,
    useForm,
} from '@inertiajs/react';
import Swal from 'sweetalert2';
import {
    useMemo,
    useState,
} from 'react';

export default function Create({
    modulos = [],
    estados = [],
}) {
    const {
        data,
        setData,
        post,
        processing,
        errors,
        clearErrors,
    } = useForm({
        nombre: '',
        descripcion: '',
        estado: '1',
        modulos: [],
    });

    const [buscarModulo, setBuscarModulo] =
        useState('');

    const inputClass = (error) =>
        `w-full rounded-lg border px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:ring-2 ${
            error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                : 'border-slate-300 focus:border-[#315d7a] focus:ring-[#315d7a]/20'
        } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`;

    const modulosFiltrados = useMemo(() => {
        const termino = buscarModulo
            .trim()
            .toLowerCase();

        if (!termino) {
            return modulos;
        }

        return modulos.filter((modulo) => {
            const nombre = String(
                modulo.nombre ?? ''
            ).toLowerCase();

            const descripcion = String(
                modulo.descripcion ?? ''
            ).toLowerCase();

            return (
                nombre.includes(termino) ||
                descripcion.includes(termino)
            );
        });
    }, [
        buscarModulo,
        modulos,
    ]);

    const todosSeleccionados =
        modulos.length > 0 &&
        modulos.every((modulo) =>
            data.modulos.includes(
                Number(modulo.id)
            )
        );

    const visiblesSeleccionados =
        modulosFiltrados.length > 0 &&
        modulosFiltrados.every((modulo) =>
            data.modulos.includes(
                Number(modulo.id)
            )
        );

    const alternarModulo = (moduloId) => {
        const id = Number(moduloId);

        const seleccionado =
            data.modulos.includes(id);

        setData(
            'modulos',
            seleccionado
                ? data.modulos.filter(
                      (item) => item !== id
                  )
                : [
                      ...data.modulos,
                      id,
                  ]
        );

        clearErrors(
            'modulos',
            'modulos.0'
        );
    };

    const alternarTodos = () => {
        if (todosSeleccionados) {
            setData('modulos', []);
            return;
        }

        setData(
            'modulos',
            modulos.map((modulo) =>
                Number(modulo.id)
            )
        );

        clearErrors(
            'modulos',
            'modulos.0'
        );
    };

    const alternarVisibles = () => {
        const idsVisibles =
            modulosFiltrados.map(
                (modulo) =>
                    Number(modulo.id)
            );

        if (visiblesSeleccionados) {
            setData(
                'modulos',
                data.modulos.filter(
                    (id) =>
                        !idsVisibles.includes(id)
                )
            );

            return;
        }

        setData(
            'modulos',
            Array.from(
                new Set([
                    ...data.modulos,
                    ...idsVisibles,
                ])
            )
        );

        clearErrors(
            'modulos',
            'modulos.0'
        );
    };

    const submit = async (event) => {
        event.preventDefault();

        const confirmacion =
            await Swal.fire({
                title: '¿Registrar rol?',

                html: `
                    <div style="
                        text-align:left;
                        line-height:1.7;
                    ">
                        <p>
                            <strong>Nombre:</strong>
                            ${
                                data.nombre.trim() ||
                                'No ingresado'
                            }
                        </p>

                        <p>
                            <strong>Estado:</strong>
                            ${
                                String(data.estado) ===
                                '1'
                                    ? 'Activo'
                                    : 'Inactivo'
                            }
                        </p>

                        <p>
                            <strong>Módulos autorizados:</strong>
                            ${data.modulos.length}
                        </p>
                    </div>
                `,

                icon: 'question',
                showCancelButton: true,
                confirmButtonText:
                    'Sí, registrar',
                cancelButtonText:
                    'Revisar',
                confirmButtonColor:
                    '#315d7a',
                cancelButtonColor:
                    '#64748b',
                reverseButtons: true,
            });

        if (!confirmacion.isConfirmed) {
            return;
        }

        post(route('roles.store'), {
            preserveScroll: true,

            onStart: () => {
                Swal.fire({
                    title:
                        'Registrando rol...',

                    allowOutsideClick:
                        false,

                    allowEscapeKey:
                        false,

                    didOpen: () => {
                        Swal.showLoading();
                    },
                });
            },

            onSuccess: () => {
                Swal.close();
            },

            onError: (errores) => {
                const primerError =
                    Object.values(
                        errores ?? {}
                    )[0];

                Swal.fire({
                    title:
                        'Revise el formulario',

                    text:
                        primerError ??
                        'Existen campos incompletos o datos no válidos.',

                    icon:
                        'warning',

                    confirmButtonText:
                        'Aceptar',
                });

                window.scrollTo({
                    top: 0,
                    behavior: 'smooth',
                });
            },

            onFinish: () => {
                if (Swal.isLoading()) {
                    Swal.close();
                }
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Nuevo rol
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Registre el rol y seleccione los
                        módulos autorizados.
                    </p>
                </div>
            }
        >
            <Head title="Nuevo rol" />

            <form
                onSubmit={submit}
                className="w-full space-y-6"
            >
                <section className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-lg font-bold text-slate-900">
                            Información del rol
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Ingrese los datos principales
                            del rol.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                            <label
                                htmlFor="nombre"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Nombre del rol

                                <span className="ml-1 text-rose-500">
                                    *
                                </span>
                            </label>

                            <input
                                id="nombre"
                                type="text"
                                value={data.nombre}
                                onChange={(event) =>
                                    setData(
                                        'nombre',
                                        event.target.value
                                    )
                                }
                                maxLength={100}
                                disabled={processing}
                                autoComplete="off"
                                placeholder="Ejemplo: Coordinador académico"
                                className={inputClass(
                                    errors.nombre
                                )}
                            />

                            {errors.nombre && (
                                <p className="mt-1 text-sm text-rose-600">
                                    {errors.nombre}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="estado"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Estado

                                <span className="ml-1 text-rose-500">
                                    *
                                </span>
                            </label>

                            <select
                                id="estado"
                                value={data.estado}
                                onChange={(event) =>
                                    setData(
                                        'estado',
                                        event.target.value
                                    )
                                }
                                disabled={processing}
                                className={inputClass(
                                    errors.estado
                                )}
                            >
                                {estados.length > 0 ? (
                                    estados.map(
                                        (estado) => (
                                            <option
                                                key={
                                                    estado.value
                                                }
                                                value={String(
                                                    estado.value
                                                )}
                                            >
                                                {
                                                    estado.label
                                                }
                                            </option>
                                        )
                                    )
                                ) : (
                                    <>
                                        <option value="1">
                                            Activo
                                        </option>

                                        <option value="0">
                                            Inactivo
                                        </option>
                                    </>
                                )}
                            </select>

                            {errors.estado && (
                                <p className="mt-1 text-sm text-rose-600">
                                    {errors.estado}
                                </p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label
                                htmlFor="descripcion"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Descripción
                            </label>

                            <textarea
                                id="descripcion"
                                value={data.descripcion}
                                onChange={(event) =>
                                    setData(
                                        'descripcion',
                                        event.target.value
                                    )
                                }
                                rows={4}
                                maxLength={500}
                                disabled={processing}
                                placeholder="Describa las responsabilidades y alcance del rol..."
                                className={inputClass(
                                    errors.descripcion
                                )}
                            />

                            <div className="mt-1 flex items-start justify-between gap-4">
                                <div>
                                    {errors.descripcion && (
                                        <p className="text-sm text-rose-600">
                                            {
                                                errors.descripcion
                                            }
                                        </p>
                                    )}
                                </div>

                                <p className="text-xs text-slate-400">
                                    {
                                        data.descripcion
                                            .length
                                    }
                                    /500
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Módulos autorizados
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Seleccione los módulos que podrá
                                visualizar y administrar este rol.
                            </p>
                        </div>

                        <span className="rounded-full bg-[#315d7a]/10 px-3 py-1.5 text-sm font-semibold text-[#315d7a]">
                            {data.modulos.length} de{' '}
                            {modulos.length} seleccionados
                        </span>
                    </div>

                    <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end">
                        <div className="lg:col-span-7">
                            <label
                                htmlFor="buscar_modulo"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Buscar módulo
                            </label>

                            <input
                                id="buscar_modulo"
                                type="search"
                                value={buscarModulo}
                                onChange={(event) =>
                                    setBuscarModulo(
                                        event.target.value
                                    )
                                }
                                autoComplete="off"
                                placeholder="Buscar por nombre o descripción..."
                                className={inputClass(
                                    false
                                )}
                            />
                        </div>

                        <div className="lg:col-span-5">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={
                                        alternarVisibles
                                    }
                                    disabled={
                                        processing ||
                                        modulosFiltrados.length ===
                                            0
                                    }
                                    className="flex h-[42px] items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {visiblesSeleccionados
                                        ? 'Quitar visibles'
                                        : 'Seleccionar visibles'}
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        alternarTodos
                                    }
                                    disabled={
                                        processing ||
                                        modulos.length === 0
                                    }
                                    className="flex h-[42px] items-center justify-center rounded-lg border border-[#315d7a] bg-white px-4 text-sm font-semibold text-[#315d7a] transition hover:bg-[#315d7a]/5 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {todosSeleccionados
                                        ? 'Quitar todos'
                                        : 'Seleccionar todos'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {(errors.modulos ||
                        errors['modulos.0']) && (
                        <p className="mb-4 text-sm text-rose-600">
                            {errors.modulos ??
                                errors['modulos.0']}
                        </p>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {modulosFiltrados.length >
                        0 ? (
                            modulosFiltrados.map(
                                (modulo) => {
                                    const seleccionado =
                                        data.modulos.includes(
                                            Number(
                                                modulo.id
                                            )
                                        );

                                    return (
                                        <label
                                            key={
                                                modulo.id
                                            }
                                            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                                                seleccionado
                                                    ? 'border-[#315d7a] bg-[#315d7a]/5 shadow-sm'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={
                                                    seleccionado
                                                }
                                                onChange={() =>
                                                    alternarModulo(
                                                        modulo.id
                                                    )
                                                }
                                                disabled={
                                                    processing
                                                }
                                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#315d7a] focus:ring-[#315d7a]"
                                            />

                                            <span className="min-w-0">
                                                <span className="block text-sm font-semibold text-slate-900">
                                                    {
                                                        modulo.nombre
                                                    }
                                                </span>

                                                <span className="mt-1 block text-xs leading-5 text-slate-500">
                                                    {modulo.descripcion ??
                                                        'Sin descripción'}
                                                </span>
                                            </span>
                                        </label>
                                    );
                                }
                            )
                        ) : (
                            <div className="rounded-lg border border-dashed border-slate-300 px-4 py-12 text-center md:col-span-2 xl:col-span-3">
                                <p className="text-sm font-semibold text-slate-600">
                                    No se encontraron módulos.
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    Cambie el texto de búsqueda.
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                <div className="flex flex-wrap justify-end gap-3">
                    <Link
                        href={route('roles.index')}
                        className="flex h-[42px] items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                        Cancelar
                    </Link>

                    <button
                        type="submit"
                        disabled={processing}
                        className="flex h-[42px] items-center justify-center rounded-lg bg-[#315d7a] px-5 text-sm font-semibold text-white transition hover:bg-[#274b63] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processing
                            ? 'Registrando...'
                            : 'Registrar rol'}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}