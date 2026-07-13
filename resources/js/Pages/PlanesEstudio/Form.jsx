import InputError from '@/Components/InputError';

export default function Form({
    data,
    setData,
    errors,
    processing,
    tipos,
    editing = false,
}) {
    const inputClass =
        'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]';

    return (
        <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Nombre del plan de estudio
                    </label>

                    <input
                        type="text"
                        value={data.nombre}
                        onChange={(event) =>
                            setData('nombre', event.target.value)
                        }
                        className={inputClass}
                        placeholder="Ejemplo: Plan de Estudios DSI 2026"
                        maxLength={100}
                    />

                    <InputError
                        message={errors.nombre}
                        className="mt-2"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Código
                    </label>

                    <input
                        type="text"
                        value={data.codigo}
                        onChange={(event) =>
                            setData('codigo', event.target.value)
                        }
                        className={inputClass}
                        placeholder="Ejemplo: PE-DSI-2026"
                        maxLength={50}
                    />

                    <InputError
                        message={errors.codigo}
                        className="mt-2"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Resolución
                    </label>

                    <input
                        type="text"
                        value={data.resolucion}
                        onChange={(event) =>
                            setData('resolucion', event.target.value)
                        }
                        className={inputClass}
                        placeholder="Ejemplo: RD N.º 025-2026"
                        maxLength={50}
                    />

                    <InputError
                        message={errors.resolucion}
                        className="mt-2"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Tipo
                    </label>

                    <select
                        value={data.tipo}
                        onChange={(event) =>
                            setData('tipo', event.target.value)
                        }
                        className={inputClass}
                    >
                        <option value="">
                            Seleccione un tipo
                        </option>

                        {tipos.map((tipo) => (
                            <option
                                key={tipo.value}
                                value={tipo.value}
                            >
                                {tipo.label}
                            </option>
                        ))}
                    </select>

                    <InputError
                        message={errors.tipo}
                        className="mt-2"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Categoría Moodle
                    </label>

                    <input
                        type="number"
                        min="1"
                        value={data.moodle_category_id}
                        onChange={(event) =>
                            setData(
                                'moodle_category_id',
                                event.target.value
                            )
                        }
                        className={inputClass}
                        placeholder="ID de la categoría Moodle"
                    />

                    <InputError
                        message={errors.moodle_category_id}
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
                            setData(
                                'descripcion',
                                event.target.value
                            )
                        }
                        className={`${inputClass} min-h-32 resize-y`}
                        placeholder="Descripción del plan de estudio"
                        maxLength={2000}
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
                                setData(
                                    'activo',
                                    event.target.checked
                                )
                            }
                            className="mt-1 rounded border-slate-300"
                        />

                        <span>
                            <span className="block text-sm font-semibold text-slate-800">
                                Plan de estudio activo
                            </span>

                            <span className="mt-1 block text-xs text-slate-500">
                                Los planes inactivos se conservan, pero no deben emplearse en nuevas asignaciones.
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
                          ? 'Actualizar plan'
                          : 'Registrar plan'}
                </button>
            </div>
        </div>
    );
}
