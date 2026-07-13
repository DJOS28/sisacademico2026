import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useEffect, useRef, useState } from 'react';

function Icon({ name, className = 'h-5 w-5' }) {
    const props = {
        className,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
    };

    const icons = {
        users: (
            <>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </>
        ),
        search: (
            <>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
            </>
        ),
        key: (
            <>
                <circle cx="8" cy="15" r="4" />
                <path d="m11 12 8-8" />
                <path d="m15 8 2 2" />
                <path d="m17 6 2 2" />
            </>
        ),
        shield: (
            <>
                <path d="M12 3 5 6v5c0 4.6 2.8 8.3 7 10 4.2-1.7 7-5.4 7-10V6l-7-3Z" />
                <path d="m9 12 2 2 4-4" />
            </>
        ),
        refresh: (
            <>
                <path d="M20 7h-5V2" />
                <path d="M20 2a9 9 0 1 0 2 9" />
            </>
        ),
        eye: (
            <>
                <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                <circle cx="12" cy="12" r="2.5" />
            </>
        ),
        lock: (
            <>
                <rect x="4" y="10" width="16" height="11" rx="2.5" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </>
        ),
    };

    return <svg {...props}>{icons[name]}</svg>;
}

const escapeHtml = (value = '') =>
    String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

export default function Index({
    usuarios: initialUsuarios,
    roles,
}) {
    const [usuarios, setUsuarios] = useState(initialUsuarios);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [rolId, setRolId] = useState('');
    const [loading, setLoading] = useState(false);

    const firstRender = useRef(true);
    const requestController = useRef(null);

    const consultarUsuarios = async ({
        page = 1,
        searchValue = search,
        statusValue = status,
        rolValue = rolId,
    } = {}) => {
        if (requestController.current) {
            requestController.current.abort();
        }

        requestController.current = new AbortController();
        setLoading(true);

        try {
            const response = await axios.post(
                route('usuarios.buscar'),
                {
                    search: searchValue.trim(),
                    status: statusValue,
                    rol_id: rolValue || null,
                    page,
                },
                {
                    signal: requestController.current.signal,
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            setUsuarios(response.data.usuarios);
        } catch (error) {
            if (
                error.code === 'ERR_CANCELED' ||
                error.name === 'CanceledError'
            ) {
                return;
            }

            await Swal.fire({
                title: 'No se pudo consultar',
                text:
                    error.response?.data?.message ||
                    'Ocurrió un error al consultar los usuarios.',
                icon: 'error',
                confirmButtonColor: '#315d7a',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            consultarUsuarios({
                page: 1,
                searchValue: search,
                statusValue: status,
                rolValue: rolId,
            });
        }, 400);

        return () => clearTimeout(timer);
    }, [search, status, rolId]);

    useEffect(() => {
        return () => {
            requestController.current?.abort();
        };
    }, []);

    const limpiar = async () => {
        setSearch('');
        setStatus('');
        setRolId('');

        await consultarUsuarios({
            page: 1,
            searchValue: '',
            statusValue: '',
            rolValue: '',
        });
    };

    const cambiarPagina = async (page) => {
        if (!page || page === usuarios.current_page || loading) return;

        await consultarUsuarios({ page });

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    const verUsuario = async (usuario) => {
        const rolesHtml = usuario.roles?.length
            ? usuario.roles
                  .map(
                      (rol) =>
                          `<span style="display:inline-flex;margin:4px;padding:6px 10px;border-radius:999px;background:#eef3f7;color:#315d7a;font-size:12px;font-weight:700">${escapeHtml(rol.nombre)}</span>`,
                  )
                  .join('')
            : '<span style="color:#64748b">Sin roles asignados</span>';

        await Swal.fire({
            title: 'Detalle del usuario',
            html: `
                <div style="text-align:left">
                    <div style="padding:14px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc">
                        <p style="margin:0 0 8px"><strong>Usuario:</strong> ${escapeHtml(usuario.username)}</p>
                        <p style="margin:0 0 8px"><strong>Estado:</strong> ${escapeHtml(usuario.status)}</p>
                        <p style="margin:0 0 8px"><strong>ID Moodle:</strong> ${escapeHtml(usuario.moodle_user_id || 'No registrado')}</p>
                        <p style="margin:0 0 8px"><strong>Creado:</strong> ${escapeHtml(usuario.created_at || '—')}</p>
                        <p style="margin:0"><strong>Actualizado:</strong> ${escapeHtml(usuario.updated_at || '—')}</p>
                    </div>

                    <div style="margin-top:16px">
                        <p style="margin-bottom:8px;font-weight:700;color:#334155">Roles asignados</p>
                        <div>${rolesHtml}</div>
                    </div>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#315d7a',
            width: 560,
        });
    };

    const asignarRoles = async (usuario) => {
        const rolesActuales = new Set(
            (usuario.roles || []).map((rol) => Number(rol.id)),
        );

        const listaRoles = roles
            .map(
                (rol) => `
                    <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:8px;cursor:pointer">
                        <input
                            type="checkbox"
                            class="rol-checkbox"
                            value="${Number(rol.id)}"
                            ${rolesActuales.has(Number(rol.id)) ? 'checked' : ''}
                            style="width:17px;height:17px"
                        />
                        <span style="font-size:14px;color:#334155;font-weight:600">
                            ${escapeHtml(rol.nombre)}
                        </span>
                    </label>
                `,
            )
            .join('');

        const result = await Swal.fire({
            title: 'Asignar roles',
            html: `
                <div style="text-align:left">
                    <p style="margin-bottom:12px;color:#64748b">
                        Usuario: <strong>${escapeHtml(usuario.username)}</strong>
                    </p>
                    <div style="max-height:330px;overflow-y:auto;padding-right:4px">
                        ${listaRoles || '<p>No hay roles registrados.</p>'}
                    </div>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Guardar roles',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#315d7a',
            cancelButtonColor: '#64748b',
            reverseButtons: true,
            width: 560,
            preConfirm: () => {
                return Array.from(
                    document.querySelectorAll('.rol-checkbox:checked'),
                ).map((input) => Number(input.value));
            },
        });

        if (!result.isConfirmed) return;

        try {
            Swal.fire({
                title: 'Guardando roles',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const response = await axios.put(
                route('usuarios.actualizar-roles', usuario.id),
                {
                    role_ids: result.value,
                },
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            await Swal.fire({
                title: 'Roles actualizados',
                text: response.data.message,
                icon: 'success',
                confirmButtonColor: '#315d7a',
            });

            await consultarUsuarios({
                page: usuarios.current_page,
            });
        } catch (error) {
            await Swal.fire({
                title: 'No se pudieron actualizar los roles',
                text:
                    error.response?.data?.message ||
                    'Ocurrió un error al asignar los roles.',
                icon: 'error',
                confirmButtonColor: '#315d7a',
            });
        }
    };

    const cambiarClave = async (usuario) => {
        const result = await Swal.fire({
            title: 'Cambiar contraseña',
            html: `
                <div style="text-align:left">
                    <p style="margin-bottom:14px;color:#64748b">
                        Usuario: <strong>${escapeHtml(usuario.username)}</strong>
                    </p>

                    <label style="display:block;margin-bottom:6px;font-size:13px;font-weight:700;color:#334155">
                        Nueva contraseña
                    </label>
                    <input
                        id="swal-password"
                        type="password"
                        class="swal2-input"
                        placeholder="Mínimo 8 caracteres"
                        style="width:100%;margin:0 0 14px"
                    />

                    <label style="display:block;margin-bottom:6px;font-size:13px;font-weight:700;color:#334155">
                        Confirmar contraseña
                    </label>
                    <input
                        id="swal-password-confirmation"
                        type="password"
                        class="swal2-input"
                        placeholder="Repita la contraseña"
                        style="width:100%;margin:0"
                    />
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Actualizar contraseña',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#315d7a',
            cancelButtonColor: '#64748b',
            reverseButtons: true,
            focusConfirm: false,
            preConfirm: () => {
                const password =
                    document.getElementById('swal-password').value;
                const confirmation = document.getElementById(
                    'swal-password-confirmation',
                ).value;

                if (password.length < 8) {
                    Swal.showValidationMessage(
                        'La contraseña debe tener al menos 8 caracteres.',
                    );
                    return false;
                }

                if (password !== confirmation) {
                    Swal.showValidationMessage(
                        'La confirmación de contraseña no coincide.',
                    );
                    return false;
                }

                return {
                    password,
                    password_confirmation: confirmation,
                };
            },
        });

        if (!result.isConfirmed) return;

        try {
            const response = await axios.put(
                route('usuarios.cambiar-clave', usuario.id),
                result.value,
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            await Swal.fire({
                title: 'Contraseña actualizada',
                text: response.data.message,
                icon: 'success',
                confirmButtonColor: '#315d7a',
            });
        } catch (error) {
            const validationErrors = error.response?.data?.errors || {};
            const message =
                Object.values(validationErrors).flat()[0] ||
                error.response?.data?.message ||
                'Ocurrió un error al actualizar la contraseña.';

            await Swal.fire({
                title: 'No se pudo actualizar',
                text: message,
                icon: 'error',
                confirmButtonColor: '#315d7a',
            });
        }
    };

    const resetearClave = async (usuario) => {
        const result = await Swal.fire({
            title: '¿Resetear contraseña?',
            html: `
                La contraseña de <strong>${escapeHtml(usuario.username)}</strong>
                será restablecida a <strong>123456</strong>.
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, resetear',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#b45309',
            cancelButtonColor: '#64748b',
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        try {
            const response = await axios.post(
                route('usuarios.resetear-clave', usuario.id),
                {},
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            await Swal.fire({
                title: 'Contraseña restablecida',
                html: `
                    <p>${escapeHtml(response.data.message)}</p>
                    <p style="margin-top:10px">
                        Clave temporal:
                        <strong style="font-size:18px;color:#315d7a">123456</strong>
                    </p>
                `,
                icon: 'success',
                confirmButtonColor: '#315d7a',
            });
        } catch (error) {
            await Swal.fire({
                title: 'No se pudo resetear',
                text:
                    error.response?.data?.message ||
                    'Ocurrió un error al resetear la contraseña.',
                icon: 'error',
                confirmButtonColor: '#315d7a',
            });
        }
    };

    const cambiarEstado = async (usuario) => {
        const nuevoEstado =
            usuario.status === 'Activo' ? 'Inactivo' : 'Activo';

        const result = await Swal.fire({
            title: `¿Cambiar a ${nuevoEstado}?`,
            text: `Se actualizará el estado del usuario ${usuario.username}.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, cambiar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#315d7a',
            cancelButtonColor: '#64748b',
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        try {
            const response = await axios.put(
                route('usuarios.actualizar-estado', usuario.id),
                {
                    status: nuevoEstado,
                },
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            await Swal.fire({
                title: 'Estado actualizado',
                text: response.data.message,
                icon: 'success',
                confirmButtonColor: '#315d7a',
            });

            await consultarUsuarios({
                page: usuarios.current_page,
            });
        } catch (error) {
            await Swal.fire({
                title: 'No se pudo actualizar',
                text:
                    error.response?.data?.message ||
                    'Ocurrió un error al cambiar el estado.',
                icon: 'error',
                confirmButtonColor: '#315d7a',
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <p className="text-sm font-semibold text-[#315d7a]">
                        Configuración y seguridad
                    </p>
                    <h1 className="mt-1 text-2xl font-bold text-slate-900">
                        Usuarios
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Administra cuentas, contraseñas, estados y roles del sistema.
                    </p>
                </div>
            }
        >
            <Head title="Usuarios" />

            <div className="space-y-5">
                <section className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-nowrap items-center gap-3 overflow-x-auto">
                        <div className="relative min-w-[320px] flex-1">
                            <Icon
                                name="search"
                                className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Buscar por usuario o ID Moodle..."
                                className="w-full rounded-lg border border-slate-300 py-2.5 pl-11 pr-3 text-sm outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]"
                            />
                        </div>

                        <select
                            value={status}
                            onChange={(event) =>
                                setStatus(event.target.value)
                            }
                            className="w-[190px] shrink-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]"
                        >
                            <option value="">Todos los estados</option>
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                        </select>

                        <select
                            value={rolId}
                            onChange={(event) =>
                                setRolId(event.target.value)
                            }
                            className="w-[220px] shrink-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]"
                        >
                            <option value="">Todos los roles</option>
                            {roles.map((rol) => (
                                <option key={rol.id} value={rol.id}>
                                    {rol.nombre}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={limpiar}
                            disabled={loading}
                            className="shrink-0 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                        >
                            Limpiar
                        </button>
                    </div>
                </section>

                <section className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {loading && (
                        <div className="absolute inset-x-0 top-0 z-10 h-1 overflow-hidden bg-slate-100">
                            <div className="h-full w-1/3 animate-pulse bg-[#315d7a]" />
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    <th className="px-4 py-3">Usuario</th>
                                    <th className="px-4 py-3">Roles</th>
                                    <th className="px-4 py-3">ID Moodle</th>
                                    <th className="px-4 py-3">Estado</th>
                                    <th className="px-4 py-3">Registro</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {usuarios.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="px-4 py-12 text-center text-sm text-slate-500"
                                        >
                                            No se encontraron usuarios.
                                        </td>
                                    </tr>
                                ) : (
                                    usuarios.data.map((usuario) => (
                                        <tr
                                            key={usuario.id}
                                            className="hover:bg-slate-50/70"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#eaf1f6] text-sm font-bold text-[#315d7a]">
                                                        {usuario.img ? (
                                                            <img
                                                                src={usuario.img}
                                                                alt={usuario.username}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            usuario.username
                                                                .charAt(0)
                                                                .toUpperCase()
                                                        )}
                                                    </div>

                                                    <div>
                                                        <p className="font-semibold text-slate-900">
                                                            {usuario.username}
                                                        </p>
                                                        <p className="text-xs text-slate-400">
                                                            ID interno: {usuario.id}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex max-w-xs flex-wrap gap-1">
                                                    {usuario.roles?.length ? (
                                                        usuario.roles.map((rol) => (
                                                            <span
                                                                key={rol.id}
                                                                className="inline-flex rounded-full bg-[#eef3f7] px-2.5 py-1 text-xs font-semibold text-[#315d7a]"
                                                            >
                                                                {rol.nombre}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-sm text-slate-400">
                                                            Sin roles
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {usuario.moodle_user_id || '—'}
                                            </td>

                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        cambiarEstado(usuario)
                                                    }
                                                    className={[
                                                        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold transition',
                                                        usuario.status === 'Activo'
                                                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                                                    ].join(' ')}
                                                >
                                                    {usuario.status}
                                                </button>
                                            </td>

                                            <td className="px-4 py-3 text-sm text-slate-500">
                                                {usuario.created_at || '—'}
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            verUsuario(usuario)
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                                    >
                                                        <Icon
                                                            name="eye"
                                                            className="h-4 w-4"
                                                        />
                                                        Ver
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            asignarRoles(usuario)
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-md border border-[#b9ccd8] px-3 py-1.5 text-xs font-semibold text-[#315d7a] hover:bg-[#eef3f7]"
                                                    >
                                                        <Icon
                                                            name="shield"
                                                            className="h-4 w-4"
                                                        />
                                                        Roles
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            cambiarClave(usuario)
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                                                    >
                                                        <Icon
                                                            name="key"
                                                            className="h-4 w-4"
                                                        />
                                                        Clave
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            resetearClave(usuario)
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                                    >
                                                        <Icon
                                                            name="refresh"
                                                            className="h-4 w-4"
                                                        />
                                                        Resetear
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                            Mostrando {usuarios.from || 0} a {usuarios.to || 0} de{' '}
                            {usuarios.total || 0} registros
                        </p>

                        <div className="flex flex-wrap gap-1">
                            <button
                                type="button"
                                disabled={
                                    !usuarios.prev_page_url || loading
                                }
                                onClick={() =>
                                    cambiarPagina(usuarios.current_page - 1)
                                }
                                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Anterior
                            </button>

                            {Array.from(
                                { length: usuarios.last_page || 1 },
                                (_, index) => index + 1,
                            )
                                .filter(
                                    (page) =>
                                        page === 1 ||
                                        page === usuarios.last_page ||
                                        Math.abs(
                                            page - usuarios.current_page,
                                        ) <= 2,
                                )
                                .map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        disabled={loading}
                                        onClick={() => cambiarPagina(page)}
                                        className={[
                                            'rounded-md border px-3 py-1.5 text-sm',
                                            page === usuarios.current_page
                                                ? 'border-[#315d7a] bg-[#315d7a] text-white'
                                                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50',
                                        ].join(' ')}
                                    >
                                        {page}
                                    </button>
                                ))}

                            <button
                                type="button"
                                disabled={
                                    !usuarios.next_page_url || loading
                                }
                                onClick={() =>
                                    cambiarPagina(usuarios.current_page + 1)
                                }
                                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}