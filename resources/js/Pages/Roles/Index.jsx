import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Head,
    Link,
    router,
} from '@inertiajs/react';
import axios from 'axios';
import Select from 'react-select';
import Swal from 'sweetalert2';
import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

const selectStyles = () => ({
    control: (base, state) => ({
        ...base,
        minHeight: '42px',
        height: '42px',
        borderRadius: '0.5rem',
        borderColor: state.isFocused
            ? '#315d7a'
            : '#cbd5e1',
        boxShadow: state.isFocused
            ? '0 0 0 2px rgba(49, 93, 122, 0.18)'
            : 'none',
        backgroundColor: state.isDisabled
            ? '#f1f5f9'
            : '#ffffff',
        fontSize: '0.875rem',

        '&:hover': {
            borderColor: '#315d7a',
        },
    }),

    valueContainer: (base) => ({
        ...base,
        height: '40px',
        padding: '0 12px',
    }),

    input: (base) => ({
        ...base,
        margin: 0,
        padding: 0,
    }),

    indicatorsContainer: (base) => ({
        ...base,
        height: '40px',
    }),

    placeholder: (base) => ({
        ...base,
        color: '#94a3b8',
    }),

    singleValue: (base) => ({
        ...base,
        color: '#334155',
    }),

    menu: (base) => ({
        ...base,
        zIndex: 60,
        fontSize: '0.875rem',
    }),

    option: (base, state) => ({
        ...base,
        cursor: 'pointer',
        backgroundColor: state.isSelected
            ? '#315d7a'
            : state.isFocused
              ? '#f1f5f9'
              : '#ffffff',
        color: state.isSelected
            ? '#ffffff'
            : '#334155',
    }),
});

export default function Index({
    roles: rolesIniciales,
    estados = [],
    filtros = {},
}) {
    const [roles, setRoles] = useState(
        rolesIniciales
    );

    const [buscar, setBuscar] = useState(
        filtros.buscar ?? ''
    );

    const [estado, setEstado] = useState(
        filtros.estado !== undefined &&
            filtros.estado !== null
            ? String(filtros.estado)
            : ''
    );

    const [cargando, setCargando] =
        useState(false);

    const [consultandoModulos, setConsultandoModulos] =
        useState(false);

    const primeraCarga = useRef(true);
    const controladorFiltro = useRef(null);
    const controladorModulos = useRef(null);

    useEffect(() => {
        setRoles(rolesIniciales);
    }, [rolesIniciales]);

    const opcionesEstados = useMemo(
        () => [
            {
                value: '',
                label: 'Todos los estados',
            },
            ...estados.map((item) => ({
                value: String(item.value),
                label: item.label,
            })),
        ],
        [estados]
    );

    const buscarOpcion = (
        opciones,
        valor
    ) =>
        opciones.find(
            (opcion) =>
                String(opcion.value) ===
                String(valor)
        ) ?? null;

    const formatearFecha = (fecha) => {
        if (!fecha) {
            return '—';
        }

        const date = new Date(fecha);

        if (Number.isNaN(date.getTime())) {
            return fecha;
        }

        return new Intl.DateTimeFormat(
            'es-PE',
            {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }
        ).format(date);
    };

    const filtrar = async (
        pagina = 1,
        mantenerScroll = true
    ) => {
        controladorFiltro.current?.abort();

        controladorFiltro.current =
            new AbortController();

        setCargando(true);

        try {
            const response = await axios.post(
                route('roles.filtrar'),
                {
                    buscar: buscar.trim(),

                    estado:
                        estado === ''
                            ? null
                            : estado,

                    page: pagina,
                },
                {
                    headers: {
                        Accept:
                            'application/json',

                        'X-Requested-With':
                            'XMLHttpRequest',
                    },

                    signal:
                        controladorFiltro.current
                            .signal,
                }
            );

            setRoles(
                response.data.roles
            );

            if (!mantenerScroll) {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth',
                });
            }
        } catch (error) {
            if (
                error.code === 'ERR_CANCELED' ||
                error.name === 'CanceledError'
            ) {
                return;
            }

            let mensaje =
                'No se pudo realizar la búsqueda de roles.';

            if (
                error.response?.status === 422
            ) {
                const errores =
                    error.response.data?.errors ??
                    {};

                mensaje =
                    Object.values(
                        errores
                    )?.[0]?.[0] ??
                    mensaje;
            }

            Swal.fire({
                title: 'Error',
                text: mensaje,
                icon: 'error',
                confirmButtonText: 'Aceptar',
            });
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        if (primeraCarga.current) {
            primeraCarga.current = false;
            return;
        }

        const temporizador =
            window.setTimeout(() => {
                filtrar(1, true);
            }, 400);

        return () => {
            window.clearTimeout(
                temporizador
            );
        };
    }, [
        buscar,
        estado,
    ]);

    const limpiarFiltros = () => {
        setBuscar('');
        setEstado('');
    };

    const tieneFiltros =
        buscar !== '' ||
        estado !== '';

    const cambiarPagina = (pagina) => {
        if (
            pagina < 1 ||
            pagina > roles.last_page ||
            pagina === roles.current_page ||
            cargando
        ) {
            return;
        }

        filtrar(pagina, false);
    };

    const verModulos = async (rol) => {
        controladorModulos.current?.abort();

        controladorModulos.current =
            new AbortController();

        setConsultandoModulos(true);

        Swal.fire({
            title: 'Consultando permisos...',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        try {
            const response = await axios.get(
                route(
                    'roles.modulos',
                    rol.id
                ),
                {
                    headers: {
                        Accept:
                            'application/json',

                        'X-Requested-With':
                            'XMLHttpRequest',
                    },

                    signal:
                        controladorModulos.current
                            .signal,
                }
            );

            const modulos =
                response.data.modulos ?? [];

            const contenido =
                modulos.length > 0
                    ? `
                        <div style="
                            max-height:360px;
                            overflow-y:auto;
                            text-align:left;
                        ">
                            ${modulos
                                .map(
                                    (
                                        modulo,
                                        indice
                                    ) => `
                                        <div style="
                                            border:1px solid #e2e8f0;
                                            border-radius:8px;
                                            padding:10px 12px;
                                            margin-bottom:8px;
                                            background:#f8fafc;
                                        ">
                                            <div style="
                                                display:flex;
                                                align-items:center;
                                                gap:8px;
                                            ">
                                                <span style="
                                                    display:inline-flex;
                                                    width:24px;
                                                    height:24px;
                                                    align-items:center;
                                                    justify-content:center;
                                                    border-radius:6px;
                                                    background:#315d7a;
                                                    color:white;
                                                    font-size:11px;
                                                    font-weight:700;
                                                ">
                                                    ${indice + 1}
                                                </span>

                                                <strong style="
                                                    color:#1e293b;
                                                    font-size:14px;
                                                ">
                                                    ${modulo.nombre}
                                                </strong>
                                            </div>

                                            ${
                                                modulo.descripcion
                                                    ? `
                                                        <div style="
                                                            margin-top:5px;
                                                            padding-left:32px;
                                                            color:#64748b;
                                                            font-size:12px;
                                                        ">
                                                            ${modulo.descripcion}
                                                        </div>
                                                    `
                                                    : ''
                                            }
                                        </div>
                                    `
                                )
                                .join('')}
                        </div>
                    `
                    : `
                        <div style="
                            padding:18px;
                            color:#64748b;
                            text-align:center;
                        ">
                            Este rol no tiene módulos asignados.
                        </div>
                    `;

            await Swal.fire({
                title:
                    response.data.rol?.nombre ??
                    rol.nombre,

                html: `
                    <div style="
                        margin-bottom:12px;
                        color:#64748b;
                        font-size:13px;
                    ">
                        Módulos autorizados:
                        <strong style="color:#315d7a">
                            ${modulos.length}
                        </strong>
                    </div>

                    ${contenido}
                `,

                icon:
                    modulos.length > 0
                        ? 'info'
                        : 'warning',

                width: 620,

                confirmButtonText:
                    'Cerrar',

                confirmButtonColor:
                    '#315d7a',
            });
        } catch (error) {
            if (
                error.code === 'ERR_CANCELED' ||
                error.name === 'CanceledError'
            ) {
                return;
            }

            Swal.fire({
                title: 'Error',
                text: 'No se pudieron consultar los módulos asignados al rol.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
            });
        } finally {
            setConsultandoModulos(false);
        }
    };

    const cambiarEstado = async (rol) => {
        const nuevoEstado =
            !Boolean(rol.estado);

        const resultado =
            await Swal.fire({
                title: nuevoEstado
                    ? '¿Activar rol?'
                    : '¿Desactivar rol?',

                html: `
                    <div style="
                        text-align:left;
                        line-height:1.6;
                    ">
                        <p>
                            <strong>Rol:</strong>
                            ${rol.nombre}
                        </p>

                        <p>
                            El rol quedará como
                            <strong>
                                ${
                                    nuevoEstado
                                        ? 'Activo'
                                        : 'Inactivo'
                                }
                            </strong>.
                        </p>
                    </div>
                `,

                icon: 'question',
                showCancelButton: true,

                confirmButtonText:
                    nuevoEstado
                        ? 'Sí, activar'
                        : 'Sí, desactivar',

                cancelButtonText:
                    'Cancelar',

                confirmButtonColor:
                    nuevoEstado
                        ? '#059669'
                        : '#d97706',

                cancelButtonColor:
                    '#64748b',

                reverseButtons: true,
            });

        if (!resultado.isConfirmed) {
            return;
        }

        router.put(
            route(
                'roles.estado',
                rol.id
            ),
            {
                estado:
                    nuevoEstado,
            },
            {
                preserveScroll: true,

                onStart: () => {
                    Swal.fire({
                        title:
                            nuevoEstado
                                ? 'Activando rol...'
                                : 'Desactivando rol...',

                        allowOutsideClick:
                            false,

                        allowEscapeKey:
                            false,

                        didOpen: () =>
                            Swal.showLoading(),
                    });
                },

                onSuccess: async (page) => {
                    const error =
                        page.props?.flash?.error;

                    if (error) {
                        await Swal.fire({
                            title:
                                'No se pudo cambiar el estado',

                            text:
                                error,

                            icon:
                                'error',

                            confirmButtonText:
                                'Aceptar',
                        });

                        return;
                    }

                    await Swal.fire({
                        title:
                            nuevoEstado
                                ? 'Rol activado'
                                : 'Rol desactivado',

                        text:
                            page.props?.flash
                                ?.success ??
                            'El estado se actualizó correctamente.',

                        icon:
                            'success',

                        timer:
                            1600,

                        showConfirmButton:
                            false,
                    });

                    filtrar(
                        roles.current_page,
                        true
                    );
                },

                onError: (errores) => {
                    const mensaje =
                        errores?.estado ??
                        errores?.error ??
                        'No se pudo cambiar el estado del rol.';

                    Swal.fire({
                        title:
                            'No se pudo cambiar el estado',

                        text:
                            mensaje,

                        icon:
                            'error',

                        confirmButtonText:
                            'Aceptar',
                    });
                },

                onFinish: () => {
                    if (Swal.isLoading()) {
                        Swal.close();
                    }
                },
            }
        );
    };

    const eliminar = async (rol) => {
        const resultado =
            await Swal.fire({
                title: '¿Eliminar rol?',

                html: `
                    <div style="
                        text-align:left;
                        line-height:1.6;
                    ">
                        <p>
                            <strong>Rol:</strong>
                            ${rol.nombre}
                        </p>

                        <p>
                            <strong>Usuarios asignados:</strong>
                            ${rol.usuarios_count ?? 0}
                        </p>

                        <p>
                            <strong>Módulos asignados:</strong>
                            ${rol.modulos_count ?? 0}
                        </p>

                        <p style="
                            margin-top:10px;
                            color:#dc2626;
                        ">
                            Esta acción no se puede deshacer.
                        </p>
                    </div>
                `,

                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar',
                reverseButtons: true,
            });

        if (!resultado.isConfirmed) {
            return;
        }

        router.delete(
            route(
                'roles.destroy',
                rol.id
            ),
            {
                preserveScroll: true,

                onStart: () => {
                    Swal.fire({
                        title: 'Eliminando rol...',
                        allowOutsideClick: false,
                        allowEscapeKey: false,

                        didOpen: () =>
                            Swal.showLoading(),
                    });
                },

                onSuccess: async (page) => {
                    const error =
                        page.props?.flash?.error;

                    if (error) {
                        await Swal.fire({
                            title:
                                'No se pudo eliminar',

                            text:
                                error,

                            icon:
                                'error',

                            confirmButtonText:
                                'Aceptar',
                        });

                        return;
                    }

                    await Swal.fire({
                        title: 'Rol eliminado',

                        text:
                            page.props?.flash
                                ?.success ??
                            'Rol eliminado correctamente.',

                        icon: 'success',

                        timer: 1600,

                        showConfirmButton:
                            false,
                    });

                    const paginaObjetivo =
                        roles.data.length === 1 &&
                        roles.current_page > 1
                            ? roles.current_page - 1
                            : roles.current_page;

                    filtrar(
                        paginaObjetivo,
                        true
                    );
                },

                onError: (errores) => {
                    const mensaje =
                        errores?.rol ??
                        errores?.error ??
                        'No se pudo eliminar el rol.';

                    Swal.fire({
                        title:
                            'No se pudo eliminar',

                        text:
                            mensaje,

                        icon:
                            'error',

                        confirmButtonText:
                            'Aceptar',
                    });
                },

                onFinish: () => {
                    if (Swal.isLoading()) {
                        Swal.close();
                    }
                },
            }
        );
    };

    const obtenerPaginas = () => {
        const paginaActual =
            roles.current_page;

        const ultimaPagina =
            roles.last_page;

        const paginas = [];

        let inicio = Math.max(
            1,
            paginaActual - 2
        );

        let fin = Math.min(
            ultimaPagina,
            paginaActual + 2
        );

        if (paginaActual <= 3) {
            fin = Math.min(
                5,
                ultimaPagina
            );
        }

        if (
            paginaActual >=
            ultimaPagina - 2
        ) {
            inicio = Math.max(
                1,
                ultimaPagina - 4
            );
        }

        for (
            let pagina = inicio;
            pagina <= fin;
            pagina += 1
        ) {
            paginas.push(pagina);
        }

        return paginas;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Roles y permisos
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Administre los roles y los módulos autorizados.
                        </p>
                    </div>

                    <Link
                        href={route(
                            'roles.create'
                        )}
                        className="flex h-[42px] items-center justify-center rounded-lg bg-[#315d7a] px-4 text-sm font-semibold text-white transition hover:bg-[#274b63]"
                    >
                        Nuevo rol
                    </Link>
                </div>
            }
        >
            <Head title="Roles y permisos" />

            <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
                    <div className="md:col-span-7">
                        <label
                            htmlFor="buscar"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Buscar
                        </label>

                        <div className="relative">
                            <input
                                id="buscar"
                                type="search"
                                value={buscar}
                                onChange={(event) =>
                                    setBuscar(
                                        event.target.value
                                    )
                                }
                                placeholder="Buscar por nombre o descripción..."
                                autoComplete="off"
                                className="h-[42px] w-full rounded-lg border border-slate-300 px-3 pr-12 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                            />

                            {cargando && (
                                <span
                                    className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-300 border-t-[#315d7a]"
                                    aria-label="Buscando"
                                />
                            )}
                        </div>
                    </div>

                    <div className="md:col-span-3">
                        <label
                            htmlFor="estado"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Estado
                        </label>

                        <Select
                            inputId="estado"
                            options={
                                opcionesEstados
                            }
                            value={buscarOpcion(
                                opcionesEstados,
                                estado
                            )}
                            onChange={(opcion) =>
                                setEstado(
                                    opcion?.value ?? ''
                                )
                            }
                            placeholder="Todos los estados"
                            noOptionsMessage={() =>
                                'Sin resultados'
                            }
                            isSearchable={false}
                            isClearable={false}
                            isDisabled={cargando}
                            styles={selectStyles()}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            disabled={
                                !tieneFiltros ||
                                cargando
                            }
                            className="flex h-[42px] w-full items-center justify-center whitespace-nowrap rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Rol
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Descripción
                                </th>

                                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Módulos
                                </th>

                                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Usuarios
                                </th>

                                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Estado
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Registro
                                </th>

                                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Acciones
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {roles.data?.length > 0 ? (
                                roles.data.map((rol) => (
                                    <tr
                                        key={rol.id}
                                        className="transition hover:bg-slate-50"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#315d7a]/10 text-sm font-bold text-[#315d7a]">
                                                    {String(
                                                        rol.nombre ??
                                                            'R'
                                                    )
                                                        .trim()
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>

                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {rol.nombre}
                                                    </p>

                                                    <p className="mt-0.5 text-xs text-slate-400">
                                                        ID interno: {rol.id}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="max-w-md px-4 py-3">
                                            <p className="line-clamp-2 text-sm text-slate-600">
                                                {rol.descripcion ??
                                                    'Sin descripción'}
                                            </p>
                                        </td>

                                        <td className="px-4 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    verModulos(
                                                        rol
                                                    )
                                                }
                                                disabled={
                                                    consultandoModulos
                                                }
                                                className="inline-flex min-w-[70px] items-center justify-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
                                            >
                                                {rol.modulos_count ??
                                                    0}{' '}
                                                módulos
                                            </button>
                                        </td>

                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex min-w-[70px] items-center justify-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                                {rol.usuarios_count ??
                                                    0}{' '}
                                                usuarios
                                            </span>
                                        </td>

                                        <td className="px-4 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    cambiarEstado(
                                                        rol
                                                    )
                                                }
                                                className={`inline-flex min-w-[72px] items-center justify-center rounded-full px-3 py-1 text-xs font-semibold transition ${
                                                    Boolean(
                                                        rol.estado
                                                    )
                                                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                            >
                                                {Boolean(
                                                    rol.estado
                                                )
                                                    ? 'Activo'
                                                    : 'Inactivo'}
                                            </button>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                                            {formatearFecha(
                                                rol.created_at
                                            )}
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        verModulos(
                                                            rol
                                                        )
                                                    }
                                                    className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                                                >
                                                    Permisos
                                                </button>

                                                <Link
                                                    href={route(
                                                        'roles.edit',
                                                        rol.id
                                                    )}
                                                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                                >
                                                    Editar
                                                </Link>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        eliminar(
                                                            rol
                                                        )
                                                    }
                                                    disabled={
                                                        Number(
                                                            rol.usuarios_count ??
                                                                0
                                                        ) > 0
                                                    }
                                                    title={
                                                        Number(
                                                            rol.usuarios_count ??
                                                                0
                                                        ) > 0
                                                            ? 'No se puede eliminar porque tiene usuarios asignados'
                                                            : 'Eliminar rol'
                                                    }
                                                    className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-12 text-center"
                                    >
                                        <p className="text-sm font-semibold text-slate-600">
                                            No se encontraron roles.
                                        </p>

                                        <p className="mt-1 text-xs text-slate-400">
                                            Pruebe cambiando los filtros de búsqueda.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {roles.total > 0 && (
                    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                            Mostrando{' '}
                            <span className="font-semibold text-slate-700">
                                {roles.from}
                            </span>{' '}
                            a{' '}
                            <span className="font-semibold text-slate-700">
                                {roles.to}
                            </span>{' '}
                            de{' '}
                            <span className="font-semibold text-slate-700">
                                {roles.total}
                            </span>{' '}
                            registros
                        </p>

                        {roles.last_page > 1 && (
                            <div className="flex flex-wrap items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() =>
                                        cambiarPagina(
                                            roles.current_page -
                                                1
                                        )
                                    }
                                    disabled={
                                        roles.current_page ===
                                            1 ||
                                        cargando
                                    }
                                    className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Anterior
                                </button>

                                {obtenerPaginas().map(
                                    (pagina) => (
                                        <button
                                            key={pagina}
                                            type="button"
                                            onClick={() =>
                                                cambiarPagina(
                                                    pagina
                                                )
                                            }
                                            disabled={cargando}
                                            className={`h-8 min-w-8 rounded-md px-2 text-xs font-semibold transition ${
                                                pagina ===
                                                roles.current_page
                                                    ? 'bg-[#315d7a] text-white'
                                                    : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            {pagina}
                                        </button>
                                    )
                                )}

                                <button
                                    type="button"
                                    onClick={() =>
                                        cambiarPagina(
                                            roles.current_page +
                                                1
                                        )
                                    }
                                    disabled={
                                        roles.current_page ===
                                            roles.last_page ||
                                        cargando
                                    }
                                    className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}