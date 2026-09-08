import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
import axios from 'axios';
import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import ImportModal from './ImportModal';

export default function Index({
    cursos: cursosIniciales,
    planesEstudio = [],
    semestres,
    modulos,
    tipos,
}) {
    const { flash } = usePage().props;

    const [cursos, setCursos] =
        useState(cursosIniciales);

    const [buscar, setBuscar] =
        useState('');

    const [planEstudioId, setPlanEstudioId] =
        useState('');

    const [semestreId, setSemestreId] =
        useState('');

    const [moduloId, setModuloId] =
        useState('');

    const [tipo, setTipo] =
        useState('');

    const [importOpen, setImportOpen] =
        useState(false);

    const [cargando, setCargando] =
        useState(false);

    const primeraCarga = useRef(true);
    const abortControllerRef = useRef(null);

    const modulosFiltrados = useMemo(() => {
        if (!planEstudioId) {
            return modulos;
        }

        return modulos.filter(
            (modulo) =>
                String(modulo.id_plan_estudio) ===
                String(planEstudioId)
        );
    }, [modulos, planEstudioId]);

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

    const filtrarCursos = async (page = 1) => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setCargando(true);

    try {
        const response = await axios.post(
            route('cursos.filtrar'),
            {
                buscar: buscar.trim() || null,
                plan_estudio_id:
                    planEstudioId || null,
                semestre_id:
                    semestreId || null,
                id_modulo:
                    moduloId || null,
                tipo: tipo || null,
                page,
            },
            {
                signal: controller.signal,
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With':
                        'XMLHttpRequest',
                },
            }
        );

        setCursos(response.data.cursos);
    } catch (error) {
        if (
            error.name === 'CanceledError' ||
            error.code === 'ERR_CANCELED'
        ) {
            return;
        }

        Swal.fire({
            icon: 'error',
            title: 'Error al filtrar',
            text:
                error.response?.data?.message ||
                'No se pudieron cargar los cursos.',
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

        const timer = window.setTimeout(() => {
            filtrarCursos(1);
        }, 350);

        return () => {
            window.clearTimeout(timer);
        };
    }, [
        buscar,
        planEstudioId,
        semestreId,
        moduloId,
        tipo,
    ]);

    const cambiarPlan = (event) => {
        const value = event.target.value;

        setPlanEstudioId(value);
        setModuloId('');
    };

    const limpiarFiltros = () => {
        setBuscar('');
        setPlanEstudioId('');
        setSemestreId('');
        setModuloId('');
        setTipo('');
    };

    const eliminar = async (curso) => {
        const result = await Swal.fire({
            title: '¿Eliminar curso?',
            text: curso.nombre,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        });

        if (!result.isConfirmed) {
            return;
        }

        router.delete(
            route('cursos.destroy', curso.id),
            {
                preserveScroll: true,
                onSuccess: () =>
                    filtrarCursos(
                        cursos.current_page ?? 1
                    ),
            }
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Unidades Didacticas
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Filtros automáticos sin modificar la URL.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                setImportOpen(true)
                            }
                            className="rounded-lg border border-[#315d7a] bg-white px-4 py-2.5 text-sm font-semibold text-[#315d7a]"
                        >
                            Importar Excel
                        </button>

                        <Link
                            href={route('cursos.create')}
                            className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white"
                        >
                            Nuevo curso
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Cursos" />

            <div className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-6">
                <input
                    type="search"
                    value={buscar}
                    onChange={(event) =>
                        setBuscar(event.target.value)
                    }
                    placeholder="Buscar curso"
                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm md:col-span-2"
                />

                <select
                    value={planEstudioId}
                    onChange={cambiarPlan}
                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                >
                    <option value="">
                        Todos los planes
                    </option>

                    {planesEstudio.map((plan) => (
                        <option
                            key={plan.id}
                            value={plan.id}
                        >
                            {plan.nombre}
                        </option>
                    ))}
                </select>

                <select
                    value={semestreId}
                    onChange={(event) =>
                        setSemestreId(
                            event.target.value
                        )
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                >
                    <option value="">
                        Todos los semestres
                    </option>

                    {semestres.map((semestre) => (
                        <option
                            key={semestre.id}
                            value={semestre.id}
                        >
                            {semestre.nombre}
                        </option>
                    ))}
                </select>

                <select
                    value={moduloId}
                    onChange={(event) =>
                        setModuloId(
                            event.target.value
                        )
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                >
                    <option value="">
                        Todos los módulos
                    </option>

                    {modulosFiltrados.map((modulo) => (
                        <option
                            key={modulo.id_modulo}
                            value={modulo.id_modulo}
                        >
                            Módulo {modulo.num_modulo} —{' '}
                            {modulo.nombre}
                        </option>
                    ))}
                </select>

                <select
                    value={tipo}
                    onChange={(event) =>
                        setTipo(event.target.value)
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                >
                    <option value="">
                        Todos los tipos
                    </option>

                    {tipos.map((item) => (
                        <option
                            key={item}
                            value={item}
                        >
                            {item}
                        </option>
                    ))}
                </select>

                <div className="flex items-center gap-3 md:col-span-6">
                    <button
                        type="button"
                        onClick={limpiarFiltros}
                        className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600"
                    >
                        Limpiar filtros
                    </button>

                    {cargando && (
                        <span className="text-sm font-medium text-[#315d7a]">
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
                                'Plan de estudio',
                                'Curso',
                                'Semestre',
                                'Módulo',
                                'Tipo',
                                'Créditos',
                                'Horas',
                                'Acciones',
                            ].map((header) => (
                                <th
                                    key={header}
                                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {cursos.data.map((curso) => (
                            <tr
                                key={curso.id}
                                className="hover:bg-slate-50"
                            >
                                <td className="px-4 py-3">
                                    {curso.planes_estudio?.length >
                                    0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {curso.planes_estudio.map(
                                                (plan) => (
                                                    <span
                                                        key={plan.id}
                                                        className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"
                                                    >
                                                        {plan.nombre}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-sm text-slate-400">
                                            Sin plan
                                        </span>
                                    )}
                                </td>

                                <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                                    {curso.nombre}
                                </td>

                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {curso.semestre?.nombre ||
                                        '—'}
                                </td>

                                <td className="px-4 py-3">
                                    <p className="text-sm font-semibold text-slate-700">
                                        Módulo{' '}
                                        {curso.modulo
                                            ?.num_modulo || '—'}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        {curso.modulo?.nombre ||
                                            'Sin módulo'}
                                    </p>
                                </td>

                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {curso.tipo}
                                </td>

                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {curso.creditos}
                                </td>

                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {curso.horas_semestrales}
                                </td>

                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <Link
                                            href={route(
                                                'cursos.edit',
                                                curso.id
                                            )}
                                            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                                        >
                                            Editar
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                eliminar(curso)
                                            }
                                            className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {cursos.data.length === 0 && (
                    <div className="p-10 text-center text-sm text-slate-500">
                        No se encontraron cursos.
                    </div>
                )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {cursos.links.map((link, index) => (
                    <button
                        key={index}
                        type="button"
                        disabled={!link.url || cargando}
                        onClick={() =>
                            filtrarCursos(
                                Number(
                                    new URL(
                                        link.url
                                    ).searchParams.get(
                                        'page'
                                    ) || 1
                                )
                            )
                        }
                        className={[
                            'rounded-md border px-3 py-2 text-sm',
                            link.active
                                ? 'border-[#315d7a] bg-[#315d7a] text-white'
                                : 'border-slate-200 bg-white text-slate-600',
                            !link.url
                                ? 'opacity-40'
                                : '',
                        ].join(' ')}
                        dangerouslySetInnerHTML={{
                            __html: link.label,
                        }}
                    />
                ))}
            </div>

            <ImportModal
                open={importOpen}
                onClose={() =>
                    setImportOpen(false)
                }
            />
        </AuthenticatedLayout>
    );
}
