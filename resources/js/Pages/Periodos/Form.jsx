import InputError from '@/Components/InputError';

export default function Form({
    data,
    setData,
    errors,
    processing,
    editing = false,
}) {
    const inputClass =
        'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]';

    return (
        <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Nombre del periodo
                    </label>

                    <input
                        type="text"
                        value={data.nombre}
                        onChange={(event) =>
                            setData('nombre', event.target.value)
                        }
                        className={inputClass}
                        placeholder="Ejemplo: 2026-I"
                        maxLength={50}
                    />

                    <InputError
                        message={errors.nombre}
                        className="mt-2"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Fecha de inicio
                    </label>

                    <input
                        type="date"
                        value={data.fecha_inicio}
                        onChange={(event) =>
                            setData('fecha_inicio', event.target.value)
                        }
                        className={inputClass}
                    />

                    <InputError
                        message={errors.fecha_inicio}
                        className="mt-2"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Fecha de fin
                    </label>

                    <input
                        type="date"
                        value={data.fecha_fin}
                        onChange={(event) =>
                            setData('fecha_fin', event.target.value)
                        }
                        className={inputClass}
                    />

                    <InputError
                        message={errors.fecha_fin}
                        className="mt-2"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Descripción
                    </label>

                    <textarea
                        value={data.descripcion}
                        onChange={(event) =>
                            setData('descripcion', event.target.value)
                        }
                        className={`${inputClass} min-h-32 resize-y`}
                        placeholder="Descripción del periodo académico"
                        maxLength={1000}
                    />

                    <InputError
                        message={errors.descripcion}
                        className="mt-2"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <input
                            type="checkbox"
                            checked={Boolean(data.activo)}
                            onChange={(event) =>
                                setData('activo', event.target.checked)
                            }
                            className="mt-1 rounded border-slate-300"
                        />

                        <span>
                            <span className="block text-sm font-semibold text-slate-800">
                                Establecer como periodo activo
                            </span>

                            <span className="mt-1 block text-xs text-slate-500">
                                Al activar este periodo, cualquier otro periodo activo será desactivado automáticamente.
                            </span>
                        </span>
                    </label>

                    <InputError
                        message={errors.activo}
                        className="mt-2"
                    />
                </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 pt-5">
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-lg bg-[#315d7a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#274c64] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processing
                        ? 'Guardando...'
                        : editing
                          ? 'Actualizar periodo'
                          : 'Registrar periodo'}
                </button>
            </div>
        </div>
    );
}
