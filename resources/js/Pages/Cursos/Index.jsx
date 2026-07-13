import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { useEffect, useState } from 'react';
import ImportModal from './ImportModal';

export default function Index({
    cursos,
    semestres,
    modulos,
    tipos,
    filtros,
}) {
    const { flash } = usePage().props;

    const [buscar, setBuscar] =
        useState(filtros.buscar ?? '');

    const [semestreId, setSemestreId] =
        useState(filtros.semestre_id ?? '');

    const [moduloId, setModuloId] =
        useState(filtros.id_modulo ?? '');

    const [tipo, setTipo] =
        useState(filtros.tipo ?? '');

    const [importOpen, setImportOpen] =
        useState(false);

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

        if (flash?.import_errors?.length) {
            const detalle = flash.import_errors
                .map(
                    (item) =>
                        `Fila ${item.fila}: ${item.mensaje.join(
                            ' '
                        )}`
                )
                .join('<br>');

            Swal.fire({
                icon: 'warning',
                title: 'Filas omitidas',
                html: `<div style="text-align:left;max-height:300px;overflow:auto">${detalle}</div>`,
                width: 760,
            });
        }
    }, [flash]);

    const buscarCursos = (event) => {
        event.preventDefault();

        router.get(
            route('cursos.index'),
            {
                buscar,
                semestre_id: semestreId,
                id_modulo: moduloId,
                tipo,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
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
            }
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Cursos
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Gestión e importación masiva de cursos.
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

            <form
                onSubmit={buscarCursos}
                className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5"
            >
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
                    value={semestreId}
                    onChange={(event) =>
                        setSemestreId(event.target.value)
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
                        setModuloId(event.target.value)
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                >
                    <option value="">
                        Todos los módulos
                    </option>

                    {modulos.map((modulo) => (
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
                        <option key={item} value={item}>
                            {item}
                        </option>
                    ))}
                </select>

                <div className="flex gap-3 md:col-span-5">
                    <button
                        type="submit"
                        className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
                    >
                        Buscar
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            router.get(
                                route('cursos.index')
                            )
                        }
                        className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600"
                    >
                        Limpiar
                    </button>
                </div>
            </form>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            {[
                                'Orden',
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
                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {curso.orden}
                                </td>

                                <td className="px-4 py-3">
                                    <p className="text-sm font-semibold text-slate-900">
                                        {curso.nombre}
                                    </p>
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
                        disabled={!link.url}
                        onClick={() =>
                            link.url &&
                            router.visit(link.url, {
                                preserveState: true,
                            })
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
