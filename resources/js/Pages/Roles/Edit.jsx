import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Head,
    Link,
    useForm,
} from '@inertiajs/react';
import Swal from 'sweetalert2';
import {
    useEffect,
    useMemo,
    useState,
} from 'react';

export default function Edit({
    rol,
    modulos = [],
    estados = [],
    reglasModulos = {},
}) {
    const {
        data,
        setData,
        put,
        processing,
        errors,
        clearErrors,
    } = useForm({
        nombre: rol?.nombre ?? '',
        descripcion: rol?.descripcion ?? '',
        estado: rol?.estado ? '1' : '0',
        modulos: Array.isArray(rol?.modulos)
            ? rol.modulos.map((id) => Number(id))
            : [],
    });

    const [buscarModulo, setBuscarModulo] =
        useState('');

    const inputClass = (error) =>
        `w-full rounded-lg border px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:ring-2 ${
            error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                : 'border-slate-300 focus:border-[#315d7a] focus:ring-[#315d7a]/20'
        } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`;

    const normalizarTexto = (texto) =>
        String(texto ?? '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(
                /[\u0300-\u036f]/g,
                ''
            );

    const nombreRolNormalizado =
        useMemo(
            () =>
                normalizarTexto(
                    data.nombre
                ),
            [data.nombre]
        );

    const moduloEstudianteId =
        reglasModulos
            ?.modulo_estudiante_id
            ? Number(
                  reglasModulos
                      .modulo_estudiante_id
              )
            : null;

    const moduloDocenteId =
        reglasModulos
            ?.modulo_docente_id
            ? Number(
                  reglasModulos
                      .modulo_docente_id
              )
            : null;

    const moduloEstudiante =
        useMemo(
            () =>
                modulos.find(
                    (modulo) =>
                        Number(modulo.id) ===
                        moduloEstudianteId
                ) ??
                modulos.find(
                    (modulo) =>
                        normalizarTexto(
                            modulo.nombre
                        ) ===
                        'estudiante'
                ) ??
                null,
            [
                modulos,
                moduloEstudianteId,
            ]
        );

    const moduloDocente =
        useMemo(
            () =>
                modulos.find(
                    (modulo) =>
                        Number(modulo.id) ===
                        moduloDocenteId
                ) ??
                modulos.find(
                    (modulo) =>
                        normalizarTexto(
                            modulo.nombre
                        ) ===
                        'docente'
                ) ??
                null,
            [
                modulos,
                moduloDocenteId,
            ]
        );

    const modulosPermitidos =
        useMemo(() => {
            if (
                nombreRolNormalizado ===
                'estudiante'
            ) {
                return moduloEstudiante
                    ? [moduloEstudiante]
                    : [];
            }

            if (
                nombreRolNormalizado ===
                'docente'
            ) {
                return modulos.filter(
                    (modulo) =>
                        Number(
                            modulo.id
                        ) !==
                        Number(
                            moduloEstudiante
                                ?.id
                        )
                );
            }

            return modulos.filter(
                (modulo) => {
                    const id =
                        Number(
                            modulo.id
                        );

                    return (
                        id !==
                            Number(
                                moduloEstudiante
                                    ?.id
                            ) &&
                        id !==
                            Number(
                                moduloDocente
                                    ?.id
                            )
                    );
                }
            );
        }, [
            modulos,
            nombreRolNormalizado,
            moduloEstudiante,
            moduloDocente,
        ]);

    useEffect(() => {
        if (
            nombreRolNormalizado ===
            'estudiante'
        ) {
            const idEstudiante =
                moduloEstudiante
                    ? Number(
                          moduloEstudiante.id
                      )
                    : null;

            const seleccionCorrecta =
                idEstudiante !== null &&
                data.modulos.length ===
                    1 &&
                data.modulos.includes(
                    idEstudiante
                );

            if (!seleccionCorrecta) {
                setData(
                    'modulos',
                    idEstudiante
                        ? [idEstudiante]
                        : []
                );
            }

            return;
        }

        const idsPermitidos =
            modulosPermitidos.map(
                (modulo) =>
                    Number(modulo.id)
            );

        const seleccionDepurada =
            data.modulos.filter(
                (id) =>
                    idsPermitidos.includes(
                        Number(id)
                    )
            );

        const cambio =
            seleccionDepurada.length !==
                data.modulos.length ||
            seleccionDepurada.some(
                (id, indice) =>
                    Number(id) !==
                    Number(
                        data.modulos[
                            indice
                        ]
                    )
            );

        if (cambio) {
            setData(
                'modulos',
                seleccionDepurada
            );
        }
    }, [
        nombreRolNormalizado,
        moduloEstudiante?.id,
        moduloDocente?.id,
        modulosPermitidos,
    ]);

    const modulosFiltrados =
        useMemo(() => {
            const termino =
                normalizarTexto(
                    buscarModulo
                );

            if (!termino) {
                return modulosPermitidos;
            }

            return modulosPermitidos.filter(
                (modulo) => {
                    const nombre =
                        normalizarTexto(
                            modulo.nombre
                        );

                    const descripcion =
                        normalizarTexto(
                            modulo.descripcion
                        );

                    return (
                        nombre.includes(
                            termino
                        ) ||
                        descripcion.includes(
                            termino
                        )
                    );
                }
            );
        }, [
            buscarModulo,
            modulosPermitidos,
        ]);

    const todosSeleccionados =
        modulosPermitidos.length > 0 &&
        modulosPermitidos.every(
            (modulo) =>
                data.modulos.includes(
                    Number(modulo.id)
                )
        );

    const visiblesSeleccionados =
        modulosFiltrados.length > 0 &&
        modulosFiltrados.every(
            (modulo) =>
                data.modulos.includes(
                    Number(modulo.id)
                )
        );

    const alternarModulo = (
        moduloId
    ) => {
        if (
            nombreRolNormalizado ===
            'estudiante'
        ) {
            return;
        }

        const id =
            Number(moduloId);

        const permitido =
            modulosPermitidos.some(
                (modulo) =>
                    Number(modulo.id) ===
                    id
            );

        if (!permitido) {
            return;
        }

        const seleccionado =
            data.modulos.includes(id);

        setData(
            'modulos',
            seleccionado
                ? data.modulos.filter(
                      (item) =>
                          Number(item) !== id
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
        if (
            nombreRolNormalizado ===
            'estudiante'
        ) {
            return;
        }

        if (todosSeleccionados) {
            setData('modulos', []);
            return;
        }

        setData(
            'modulos',
            modulosPermitidos.map(
                (modulo) =>
                    Number(modulo.id)
            )
        );

        clearErrors(
            'modulos',
            'modulos.0'
        );
    };

    const alternarVisibles = () => {
        if (
            nombreRolNormalizado ===
            'estudiante'
        ) {
            return;
        }

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
                        !idsVisibles.includes(
                            Number(id)
                        )
                )
            );

            return;
        }

        setData(
            'modulos',
            Array.from(
                new Set([
                    ...data.modulos.map(
                        Number
                    ),
                    ...idsVisibles,
                ])
            )
        );

        clearErrors(
            'modulos',
            'modulos.0'
        );
    };

    const obtenerMensajeRegla =
        () => {
            if (
                nombreRolNormalizado ===
                'estudiante'
            ) {
                return 'El rol Estudiante solo puede tener asignado el módulo Estudiante.';
            }

            if (
                nombreRolNormalizado ===
                'docente'
            ) {
                return 'El rol Docente puede acceder a los módulos disponibles, excepto al módulo Estudiante.';
            }

            return 'Los demás roles pueden tener módulos administrativos, excepto los módulos Estudiante y Docente.';
        };

    const modulosSeleccionados =
        useMemo(
            () =>
                modulos.filter(
                    (modulo) =>
                        data.modulos.includes(
                            Number(modulo.id)
                        )
                ),
            [
                modulos,
                data.modulos,
            ]
        );

    const submit = async (event) => {
        event.preventDefault();

        const confirmacion =
            await Swal.fire({
                title:
                    '¿Actualizar rol?',

                html: `
                    <div style="
                        text-align:left;
                        line-height:1.7;
                    ">
                        <p>
                            <strong>Rol:</strong>
                            ${
                                data.nombre.trim() ||
                                'No ingresado'
                            }
                        </p>

                        <p>
                            <strong>Estado:</strong>
                            ${
                                String(
                                    data.estado
                                ) === '1'
                                    ? 'Activo'
                                    : 'Inactivo'
                            }
                        </p>

                        <p>
                            <strong>Módulos autorizados:</strong>
                            ${
                                data.modulos
                                    .length
                            }
                        </p>
                    </div>
                `,

                icon: 'question',
                showCancelButton: true,
                confirmButtonText:
                    'Sí, actualizar',
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

        put(
            route(
                'roles.update',
                rol.id
            ),
            {
                preserveScroll: true,

                onStart: () => {
                    Swal.fire({
                        title:
                            'Actualizando rol...',

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
                    if (
                        Swal.isLoading()
                    ) {
                        Swal.close();
                    }
                },
            }
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Editar rol
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Actualice los datos y módulos
                        autorizados del rol.
                    </p>
                </div>
            }
        >
            <Head title="Editar rol" />

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
                            Modifique el nombre, descripción
                            y estado del rol.
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
                                onChange={(
                                    event
                                ) =>
                                    setData(
                                        'nombre',
                                        event.target
                                            .value
                                    )
                                }
                                maxLength={100}
                                disabled={
                                    processing
                                }
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
                                onChange={(
                                    event
                                ) =>
                                    setData(
                                        'estado',
                                        event.target
                                            .value
                                    )
                                }
                                disabled={
                                    processing
                                }
                                className={inputClass(
                                    errors.estado
                                )}
                            >
                                {estados.length >
                                0 ? (
                                    estados.map(
                                        (
                                            estado
                                        ) => (
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
                                value={
                                    data.descripcion
                                }
                                onChange={(
                                    event
                                ) =>
                                    setData(
                                        'descripcion',
                                        event.target
                                            .value
                                    )
                                }
                                rows={4}
                                maxLength={500}
                                disabled={
                                    processing
                                }
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
                                Seleccione los módulos que
                                podrá visualizar este rol.
                            </p>
                        </div>

                        <span className="rounded-full bg-[#315d7a]/10 px-3 py-1.5 text-sm font-semibold text-[#315d7a]">
                            {data.modulos.length} de{' '}
                            {
                                modulosPermitidos.length
                            }{' '}
                            permitidos
                        </span>
                    </div>

                    <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                        <strong>
                            Regla aplicada:
                        </strong>{' '}
                        {obtenerMensajeRegla()}
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
                                value={
                                    buscarModulo
                                }
                                onChange={(
                                    event
                                ) =>
                                    setBuscarModulo(
                                        event.target
                                            .value
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
                                            0 ||
                                        nombreRolNormalizado ===
                                            'estudiante'
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
                                        modulosPermitidos.length ===
                                            0 ||
                                        nombreRolNormalizado ===
                                            'estudiante'
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
                                errors[
                                    'modulos.0'
                                ]}
                        </p>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {modulosFiltrados.length >
                        0 ? (
                            modulosFiltrados.map(
                                (modulo) => {
                                    const id =
                                        Number(
                                            modulo.id
                                        );

                                    const seleccionado =
                                        data.modulos.includes(
                                            id
                                        );

                                    const bloqueado =
                                        processing ||
                                        nombreRolNormalizado ===
                                            'estudiante';

                                    return (
                                        <label
                                            key={
                                                modulo.id
                                            }
                                            className={`flex items-start gap-3 rounded-lg border p-4 transition ${
                                                bloqueado
                                                    ? 'cursor-not-allowed opacity-75'
                                                    : 'cursor-pointer'
                                            } ${
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
                                                    bloqueado
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
                                    No se encontraron módulos permitidos.
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    Revise el nombre del rol
                                    o cambie la búsqueda.
                                </p>
                            </div>
                        )}
                    </div>

                    {modulosSeleccionados.length >
                        0 && (
                        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm font-semibold text-slate-700">
                                Módulos seleccionados
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                                {modulosSeleccionados.map(
                                    (modulo) => (
                                        <span
                                            key={
                                                modulo.id
                                            }
                                            className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                                        >
                                            {
                                                modulo.nombre
                                            }
                                        </span>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </section>

                <div className="flex flex-wrap justify-end gap-3">
                    <Link
                        href={route(
                            'roles.index'
                        )}
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
                            ? 'Actualizando...'
                            : 'Actualizar rol'}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}