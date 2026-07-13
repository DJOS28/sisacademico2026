import { useMemo, useState } from 'react';

export default function PeriodosModal({
    open,
    plan,
    periodos,
    seleccionados,
    guardando,
    onToggle,
    onClose,
    onSave,
}) {
    const [buscar, setBuscar] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos');

    const periodosFiltrados = useMemo(() => {
        const texto = buscar.trim().toLowerCase();

        return periodos.filter((periodo) => {
            const coincideTexto =
                texto === '' ||
                periodo.nombre?.toLowerCase().includes(texto) ||
                periodo.descripcion?.toLowerCase().includes(texto);

            const coincideEstado =
                filtroEstado === 'todos' ||
                (filtroEstado === 'activos' && periodo.activo) ||
                (filtroEstado === 'inactivos' && !periodo.activo);

            return coincideTexto && coincideEstado;
        });
    }, [periodos, buscar, filtroEstado]);

    const cantidadSeleccionados = seleccionados.length;

    const seleccionarVisibles = () => {
        periodosFiltrados.forEach((periodo) => {
            if (!seleccionados.includes(periodo.id)) {
                onToggle(periodo.id);
            }
        });
    };

    const limpiarVisibles = () => {
        periodosFiltrados.forEach((periodo) => {
            if (seleccionados.includes(periodo.id)) {
                onToggle(periodo.id);
            }
        });
    };

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4">
            <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
                <div className="shrink-0 border-b border-slate-200 px-6 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Asociar periodos
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Plan: {plan?.nombre}
                            </p>
                        </div>

                        <span className="rounded-full bg-[#eef3f7] px-3 py-1 text-sm font-semibold text-[#315d7a]">
                            {cantidadSeleccionados} seleccionado
                            {cantidadSeleccionados === 1 ? '' : 's'}
                        </span>
                    </div>
                </div>

                <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-6 py-4">
                    <div className="flex flex-wrap gap-3">
                        <input
                            type="search"
                            value={buscar}
                            onChange={(event) =>
                                setBuscar(event.target.value)
                            }
                            placeholder="Buscar periodo..."
                            className="min-w-[240px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]"
                        />

                        <select
                            value={filtroEstado}
                            onChange={(event) =>
                                setFiltroEstado(event.target.value)
                            }
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#315d7a]"
                        >
                            <option value="todos">
                                Todos los estados
                            </option>
                            <option value="activos">
                                Solo activos
                            </option>
                            <option value="inactivos">
                                Solo inactivos
                            </option>
                        </select>

                        <button
                            type="button"
                            onClick={seleccionarVisibles}
                            className="rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                        >
                            Seleccionar visibles
                        </button>

                        <button
                            type="button"
                            onClick={limpiarVisibles}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                        >
                            Limpiar visibles
                        </button>
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-6">
                    {periodosFiltrados.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
                            <p className="text-sm font-semibold text-slate-700">
                                No se encontraron periodos.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {periodosFiltrados.map((periodo) => {
                                const seleccionado =
                                    seleccionados.includes(periodo.id);

                                return (
                                    <label
                                        key={periodo.id}
                                        className={[
                                            'flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-4 transition',
                                            seleccionado
                                                ? 'border-[#315d7a] bg-[#eef3f7]'
                                                : 'border-slate-200 hover:bg-slate-50',
                                        ].join(' ')}
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={seleccionado}
                                                onChange={() =>
                                                    onToggle(periodo.id)
                                                }
                                                className="shrink-0 rounded border-slate-300"
                                            />

                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-slate-800">
                                                    {periodo.nombre}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    {periodo.fecha_inicio ||
                                                        'Sin fecha'}{' '}
                                                    —{' '}
                                                    {periodo.fecha_fin ||
                                                        'Sin fecha'}
                                                </p>
                                            </div>
                                        </div>

                                        <span
                                            className={[
                                                'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                                                periodo.activo
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-slate-100 text-slate-500',
                                            ].join(' ')}
                                        >
                                            {periodo.activo
                                                ? 'Activo'
                                                : 'Inactivo'}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-slate-500">
                            Mostrando {periodosFiltrados.length} de{' '}
                            {periodos.length} periodos
                        </p>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={guardando}
                                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-50"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={onSave}
                                disabled={
                                    guardando ||
                                    seleccionados.length === 0
                                }
                                className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {guardando
                                    ? 'Guardando...'
                                    : 'Guardar cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}