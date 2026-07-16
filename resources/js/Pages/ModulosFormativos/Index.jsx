import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Head,
    Link,
    router,
    usePage,
} from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
    useEffect,
    useRef,
    useState,
} from 'react';

export default function Index({
    modulos: modulosIniciales,
    planesEstudio,
}) {
    const { flash } = usePage().props;

    const [modulos, setModulos] =
        useState(modulosIniciales);

    const [buscar, setBuscar] =
        useState('');

    const [
        planEstudioId,
        setPlanEstudioId,
    ] = useState('');

    const [cargando, setCargando] =
        useState(false);

    const primeraCarga = useRef(true);

    const abortControllerRef =
        useRef(null);

    useEffect(() => {
        if (flash?.success) {
            Swal.fire({
                icon: 'success',
                title: 'Operación completada',
                text: flash.success,
            });
        }

        if (flash?.error) {
            Swal.fire({
                icon: 'error',
                title: 'No se pudo completar',
                text: flash.error,
            });
        }
    }, [flash]);

    const filtrarModulos = async (
        page = 1
    ) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller =
            new AbortController();

        abortControllerRef.current =
            controller;

        setCargando(true);

        try {
            const response = await axios.post(
                route(
                    'modulos-formativos.filtrar'
                ),
                {
                    buscar:
                        buscar.trim() || null,

                    plan_estudio_id:
                        planEstudioId || null,

                    page,
                },
                {
                    signal: controller.signal,

                    headers: {
                        Accept:
                            'application/json',

                        'X-Requested-With':
                            'XMLHttpRequest',
                    },
                }
            );

            setModulos(
                response.data.modulos
            );
        } catch (error) {
            if (
                error.code ===
                    'ERR_CANCELED' ||
                error.name ===
                    'CanceledError'
            ) {
                return;
            }

            Swal.fire({
                icon: 'error',
                title: 'Error al filtrar',

                text:
                    error.response?.data
                        ?.message ||
                    'No se pudieron cargar los módulos formativos.',
            });
        } finally {
            if (
                abortControllerRef.current ===
                controller
            ) {
                setCargando(false);
            }
        }
    };

    useEffect(() => {
        if (primeraCarga.current) {
            primeraCarga.current = false;
            return;
        }

        const timer =
            window.setTimeout(() => {
                filtrarModulos(1);
            }, 350);

        return () => {
            window.clearTimeout(timer);
        };
    }, [
        buscar,
        planEstudioId,
    ]);

    const limpiarFiltros = () => {
        setBuscar('');
        setPlanEstudioId('');
    };

    const obtenerPagina = (url) => {
        if (!url) {
            return 1;
        }

        try {
            const urlObjeto = new URL(
                url,
                window.location.origin
            );

            return Number(
                urlObjeto.searchParams.get(
                    'page'
                ) || 1
            );
        } catch {
            return 1;
        }
    };

    const eliminar = async (
        modulo
    ) => {
        const resultado =
            await Swal.fire({
                title:
                    '¿Eliminar módulo formativo?',

                text: `Se eliminará "${modulo.nombre}".`,

                icon: 'warning',

                showCancelButton: true,

                confirmButtonColor:
                    '#dc2626',

                confirmButtonText:
                    'Sí, eliminar',

                cancelButtonText:
                    'Cancelar',
            });

        if (!resultado.isConfirmed) {
            return;
        }

        router.delete(
            route(
                'modulos-formativos.destroy',
                modulo.id_modulo
            ),
            {
                preserveScroll: true,

                onSuccess: () => {
                    filtrarModulos(
                        modulos.current_page ??
                            1
                    );
                },
            }
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Módulos formativos
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Gestión de módulos por plan de estudio.
                        </p>
                    </div>

                    <Link
                        href={route(
                            'modulos-formativos.create'
                        )}
                        className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#274c64]"
                    >
                        Nuevo módulo
                    </Link>
                </div>
            }
        >
            <Head title="Módulos formativos" />

            <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 md:grid-cols-3">
                    <input
                        type="search"
                        value={buscar}
                        onChange={(event) =>
                            setBuscar(
                                event.target.value
                            )
                        }
                        placeholder="Buscar módulo, plan, horas o créditos"
                        className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1] md:col-span-2"
                    />

                    <select
                        value={planEstudioId}
                        onChange={(event) =>
                            setPlanEstudioId(
                                event.target.value
                            )
                        }
                        className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a]"
                    >
                        <option value="">
                            Todos los planes
                        </option>

                        {planesEstudio.map(
                            (plan) => (
                                <option
                                    key={plan.id}
                                    value={plan.id}
                                >
                                    {plan.nombre}

                                    {plan.codigo
                                        ? ` (${plan.codigo})`
                                        : ''}
                                </option>
                            )
                        )}
                    </select>
                </div>

                <div className="mt-3 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={
                            limpiarFiltros
                        }
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                        Limpiar filtros
                    </button>

                    {cargando && (
                        <span className="text-sm font-semibold text-[#315d7a]">
                            Cargando resultados...
                        </span>
                    )}
                </div>
            </div>

            <div
                className={[
                    'overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm transition',
                    cargando
                        ? 'pointer-events-none opacity-60'
                        : '',
                ].join(' ')}
            >
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            {[
                                'Módulo',
                                'Plan de estudio',
                                'Horas',
                                'Créditos',
                                'Acciones',
                            ].map(
                                (
                                    encabezado
                                ) => (
                                    <th
                                        key={
                                            encabezado
                                        }
                                        className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                                    >
                                        {
                                            encabezado
                                        }
                                    </th>
                                )
                            )}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {modulos.data.map(
                            (modulo) => (
                                <tr
                                    key={
                                        modulo.id_modulo
                                    }
                                    className="hover:bg-slate-50"
                                >
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-semibold text-slate-900">
                                            Módulo{' '}
                                            {
                                                modulo.num_modulo
                                            }
                                        </p>

                                        <p className="mt-1 text-sm text-slate-600">
                                            {
                                                modulo.nombre
                                            }
                                        </p>
                                    </td>

                                    <td className="px-4 py-3">
                                        <p className="text-sm font-semibold text-slate-700">
                                            {modulo
                                                .plan_estudio
                                                ?.nombre ||
                                                'Sin plan'}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-400">
                                            {modulo
                                                .plan_estudio
                                                ?.codigo ||
                                                'Sin código'}
                                        </p>
                                    </td>

                                    <td className="px-4 py-3 text-sm text-slate-600">
                                        {
                                            modulo.horas
                                        }
                                    </td>

                                    <td className="px-4 py-3 text-sm text-slate-600">
                                        {
                                            modulo.creditos
                                        }
                                    </td>

                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-2">
                                            <Link
                                                href={route(
                                                    'modulos-formativos.edit',
                                                    modulo.id_modulo
                                                )}
                                                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                            >
                                                Editar
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    eliminar(
                                                        modulo
                                                    )
                                                }
                                                className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        )}
                    </tbody>
                </table>

                {modulos.data.length ===
                    0 && (
                    <div className="p-10 text-center">
                        <p className="text-sm font-semibold text-slate-700">
                            No se encontraron módulos formativos.
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                            Registre un módulo o modifique los filtros.
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {modulos.links.map(
                    (link, index) => (
                        <button
                            key={index}
                            type="button"
                            disabled={
                                !link.url ||
                                cargando
                            }
                            onClick={() =>
                                filtrarModulos(
                                    obtenerPagina(
                                        link.url
                                    )
                                )
                            }
                            className={[
                                'rounded-md border px-3 py-2 text-sm',
                                link.active
                                    ? 'border-[#315d7a] bg-[#315d7a] text-white'
                                    : 'border-slate-200 bg-white text-slate-600',
                                !link.url
                                    ? 'cursor-not-allowed opacity-40'
                                    : '',
                            ].join(' ')}
                            dangerouslySetInnerHTML={{
                                __html:
                                    link.label,
                            }}
                        />
                    )
                )}
            </div>
        </AuthenticatedLayout>
    );
}