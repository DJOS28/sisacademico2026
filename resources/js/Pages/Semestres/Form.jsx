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
                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Nombre del semestre
                    </label>

                    <input
                        type="text"
                        value={data.nombre}
                        onChange={(event) =>
                            setData('nombre', event.target.value)
                        }
                        className={inputClass}
                        placeholder="Ejemplo: Primer semestre"
                        maxLength={50}
                    />

                    <InputError
                        message={errors.nombre}
                        className="mt-2"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Estado
                    </label>

                    <select
                        value={data.activo ? '1' : '0'}
                        onChange={(event) =>
                            setData(
                                'activo',
                                event.target.value === '1'
                            )
                        }
                        className={inputClass}
                    >
                        <option value="1">Activo</option>
                        <option value="0">Inactivo</option>
                    </select>

                    <InputError
                        message={errors.activo}
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
                        placeholder="Descripción del semestre"
                        maxLength={1000}
                    />

                    <div className="mt-1 flex items-center justify-between">
                        <InputError
                            message={errors.descripcion}
                        />

                        <span className="text-xs text-slate-400">
                            {data.descripcion.length}/1000
                        </span>
                    </div>
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
                          ? 'Actualizar semestre'
                          : 'Registrar semestre'}
                </button>
            </div>
        </div>
    );
}
