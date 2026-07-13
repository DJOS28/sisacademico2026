import InputError from '@/Components/InputError';

export default function Form({
    data,
    setData,
    errors,
    processing,
    planesEstudio,
    editing = false,
}) {
    const inputClass =
        'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]';

    return (
        <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Plan de estudio
                    </label>

                    <select
                        value={data.id_plan_estudio}
                        onChange={(event) =>
                            setData(
                                'id_plan_estudio',
                                event.target.value
                            )
                        }
                        className={inputClass}
                    >
                        <option value="">
                            Seleccione un plan de estudio
                        </option>

                        {planesEstudio.map((plan) => (
                            <option
                                key={plan.id}
                                value={plan.id}
                            >
                                {plan.nombre}
                                {plan.codigo
                                    ? ` (${plan.codigo})`
                                    : ''}
                                {!plan.activo
                                    ? ' - Inactivo'
                                    : ''}
                            </option>
                        ))}
                    </select>

                    <InputError
                        message={errors.id_plan_estudio}
                        className="mt-2"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Nombre del módulo formativo
                    </label>

                    <input
                        type="text"
                        value={data.nombre}
                        onChange={(event) =>
                            setData('nombre', event.target.value)
                        }
                        className={inputClass}
                        placeholder="Ejemplo: Gestión de aplicaciones web"
                        maxLength={100}
                    />

                    <InputError
                        message={errors.nombre}
                        className="mt-2"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Número de módulo
                    </label>

                    <input
                        type="number"
                        min="0"
                        value={data.num_modulo}
                        onChange={(event) =>
                            setData(
                                'num_modulo',
                                event.target.value
                            )
                        }
                        className={inputClass}
                        placeholder="Ejemplo: 1"
                    />

                    <InputError
                        message={errors.num_modulo}
                        className="mt-2"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Horas
                    </label>

                    <input
                        type="number"
                        min="1"
                        value={data.horas}
                        onChange={(event) =>
                            setData('horas', event.target.value)
                        }
                        className={inputClass}
                        placeholder="Ejemplo: 320"
                    />

                    <InputError
                        message={errors.horas}
                        className="mt-2"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Créditos
                    </label>

                    <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={data.creditos}
                        onChange={(event) =>
                            setData(
                                'creditos',
                                event.target.value
                            )
                        }
                        className={inputClass}
                        placeholder="Ejemplo: 20"
                    />

                    <InputError
                        message={errors.creditos}
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
                          ? 'Actualizar módulo'
                          : 'Registrar módulo'}
                </button>
            </div>
        </div>
    );
}
