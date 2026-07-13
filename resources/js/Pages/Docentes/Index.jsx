import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useEffect, useRef, useState } from 'react';

export default function Index({ docentes: initialDocentes }) {
    const [docentes, setDocentes] = useState(initialDocentes);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const firstRender = useRef(true);
    const requestController = useRef(null);

    const consultarDocentes = async ({
        page = 1,
        searchValue = search,
        statusValue = status,
        showAlert = false,
    } = {}) => {
        if (requestController.current) {
            requestController.current.abort();
        }

        requestController.current = new AbortController();
        setLoading(true);

        if (showAlert) {
            Swal.fire({
                title: 'Buscando docentes',
                text: 'Espere un momento...',
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => Swal.showLoading(),
            });
        }

        try {
            const response = await axios.post(
                route('docentes.buscar'),
                {
                    search: searchValue.trim(),
                    status: statusValue,
                    page,
                },
                {
                    signal: requestController.current.signal,
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            setDocentes(response.data.docentes);

            if (showAlert) {
                Swal.close();
            }
        } catch (error) {
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors || {};

                setErrors(validationErrors);

                const mensajes = Object.values(validationErrors)
                    .flat()
                    .map((mensaje) => `<li class="text-left">${mensaje}</li>`)
                    .join('');

                await Swal.fire({
                    title: 'Revise los datos ingresados',
                    html: mensajes
                        ? `
                    <div class="text-left">
                        <p style="margin-bottom: 10px;">
                            Se encontraron los siguientes errores:
                        </p>
                        <ul style="padding-left: 20px; list-style: disc;">
                            ${mensajes}
                        </ul>
                    </div>
                `
                        : 'No se pudo validar la información ingresada.',
                    icon: 'warning',
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#315d7a',
                });

                return;
            }

            await Swal.fire({
                title: 'No se pudo registrar',
                text:
                    error.response?.data?.message ||
                    'Ocurrió un error al registrar al docente.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
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
            consultarDocentes({
                page: 1,
                searchValue: search,
                statusValue: status,
            });
        }, 400);

        return () => clearTimeout(timer);
    }, [search, status]);

    useEffect(() => {
        return () => {
            if (requestController.current) {
                requestController.current.abort();
            }
        };
    }, []);

    const buscar = async (event) => {
        event.preventDefault();

        await consultarDocentes({
            page: 1,
            searchValue: search,
            statusValue: status,
            showAlert: true,
        });
    };

    const limpiar = async () => {
        setSearch('');
        setStatus('');

        await consultarDocentes({
            page: 1,
            searchValue: '',
            statusValue: '',
        });
    };

    const cambiarPagina = async (page) => {
        if (!page || page === docentes.current_page || loading) {
            return;
        }

        await consultarDocentes({
            page,
            searchValue: search,
            statusValue: status,
        });

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    const eliminar = async (docente) => {
        const result = await Swal.fire({
            title: '¿Eliminar docente?',
            html: `Se eliminará a <strong>${docente.nombre_completo}</strong> y su cuenta de acceso.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#b42318',
            cancelButtonColor: '#64748b',
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        try {
            Swal.fire({
                title: 'Eliminando docente',
                text: 'Espere un momento...',
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => Swal.showLoading(),
            });

            const response = await axios.delete(
                route('docentes.destroy', docente.id),
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            await Swal.fire({
                title: 'Eliminado',
                text:
                    response.data.message ||
                    'El docente fue eliminado correctamente.',
                icon: 'success',
                confirmButtonColor: '#315d7a',
            });

            await consultarDocentes({
                page: docentes.current_page,
                searchValue: search,
                statusValue: status,
            });
        } catch (error) {
            await Swal.fire({
                title: 'No se pudo eliminar',
                text:
                    error.response?.data?.message ||
                    'Ocurrió un error al eliminar el docente.',
                icon: 'error',
                confirmButtonColor: '#315d7a',
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-[#315d7a]">
                            Gestión académica
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-slate-900">
                            Docentes
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Administración de docentes y cuentas de acceso.
                        </p>
                    </div>

                    <Link
                        href={route('docentes.create')}
                        className="inline-flex items-center justify-center rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#274c64]"
                    >
                        Nuevo docente
                    </Link>
                </div>
            }
        >
            <Head title="Docentes" />

            <div className="space-y-5">
                <section className="rounded-xl border border-slate-200 bg-white p-4">
                    <form
                        onSubmit={buscar}
                        className="grid gap-3 md:grid-cols-[1fr_220px_auto_auto]"
                    >
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Buscar por nombre, DNI, correo o usuario..."
                            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]"
                        />

                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]"
                        >
                            <option value="">Todos los estados</option>
                            <option value="Disponible">Disponible</option>
                            <option value="No disponible">No disponible</option>
                        </select>

                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#274c64] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? 'Buscando...' : 'Buscar'}
                        </button>

                        <button
                            type="button"
                            onClick={limpiar}
                            disabled={loading}
                            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                        >
                            Limpiar
                        </button>
                    </form>

                    <p className="mt-3 text-xs text-slate-400">
                        La búsqueda se realiza mediante AJAX sin modificar la URL.
                    </p>
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
                                    <th className="px-4 py-3">Docente</th>
                                    <th className="px-4 py-3">DNI</th>
                                    <th className="px-4 py-3">Contacto</th>
                                    <th className="px-4 py-3">Usuario / rol</th>
                                    <th className="px-4 py-3">Estado</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {docentes.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="px-4 py-12 text-center text-sm text-slate-500"
                                        >
                                            No se encontraron docentes.
                                        </td>
                                    </tr>
                                ) : (
                                    docentes.data.map((docente) => (
                                        <tr
                                            key={docente.id}
                                            className="hover:bg-slate-50/70"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#eaf1f6] text-sm font-bold text-[#315d7a]">
                                                        {docente.usuario?.img ? (
                                                            <img
                                                                src={docente.usuario.img}
                                                                alt={docente.nombre_completo}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            docente.nombre_completo
                                                                .charAt(0)
                                                                .toUpperCase()
                                                        )}
                                                    </div>

                                                    <div>
                                                        <p className="font-semibold text-slate-900">
                                                            {docente.nombre_completo}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {docente.cargo ||
                                                                'Sin cargo registrado'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 text-sm text-slate-700">
                                                {docente.dni}
                                            </td>

                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                <p>{docente.email || '—'}</p>
                                                <p className="text-xs text-slate-400">
                                                    {docente.telefono ||
                                                        'Sin teléfono'}
                                                </p>
                                            </td>

                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                <p className="font-medium text-slate-800">
                                                    {docente.usuario?.username ||
                                                        'Sin usuario'}
                                                </p>
                                                <p className="text-xs text-[#315d7a]">
                                                    {docente.usuario?.roles?.join(
                                                        ', ',
                                                    ) || 'Sin rol'}
                                                </p>
                                            </td>

                                            <td className="px-4 py-3">
                                                <span
                                                    className={[
                                                        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                                                        docente.usuario?.status ===
                                                            'Disponible'
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : 'bg-slate-100 text-slate-600',
                                                    ].join(' ')}
                                                >
                                                    {docente.usuario?.status ||
                                                        'Sin estado'}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={route(
                                                            'docentes.show',
                                                            docente.id,
                                                        )}
                                                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                                    >
                                                        Ver
                                                    </Link>

                                                    <Link
                                                        href={route(
                                                            'docentes.edit',
                                                            docente.id,
                                                        )}
                                                        className="rounded-md border border-[#b9ccd8] px-3 py-1.5 text-xs font-semibold text-[#315d7a] hover:bg-[#eef3f7]"
                                                    >
                                                        Editar
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            eliminar(docente)
                                                        }
                                                        className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                                    >
                                                        Eliminar
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
                            Mostrando {docentes.from || 0} a {docentes.to || 0} de{' '}
                            {docentes.total || 0} registros
                        </p>

                        <div className="flex flex-wrap gap-1">
                            <button
                                type="button"
                                disabled={
                                    !docentes.prev_page_url || loading
                                }
                                onClick={() =>
                                    cambiarPagina(docentes.current_page - 1)
                                }
                                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Anterior
                            </button>

                            {Array.from(
                                { length: docentes.last_page || 1 },
                                (_, index) => index + 1,
                            )
                                .filter(
                                    (page) =>
                                        page === 1 ||
                                        page === docentes.last_page ||
                                        Math.abs(
                                            page - docentes.current_page,
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
                                            page === docentes.current_page
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
                                    !docentes.next_page_url || loading
                                }
                                onClick={() =>
                                    cambiarPagina(docentes.current_page + 1)
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
