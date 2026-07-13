import InputError from '@/Components/InputError';

export default function Form({
    data,
    setData,
    errors,
    processing,
    semestres,
    modulos,
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
                        Nombre del curso
                    </label>

                    <input
                        type="text"
                        value={data.nombre}
                        onChange={(event) =>
                            setData('nombre', event.target.value)
                        }
                        className={inputClass}
                        maxLength={100}
                    />

                    <InputError
                        message={errors.nombre}
                        className="mt-2"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Semestre
                    </label>

                    <select
                        value={data.semestre_id}
                        onChange={(event) =>
                            setData(
                                'semestre_id',
                                event.target.value
                            )
                        }
                        className={inputClass}
                    >
                        <option value="">
                            Seleccione un semestre
                        </option>

                        {semestres.map((semestre) => (
                            <option
                                key={semestre.id}
                                value={semestre.id}
                            >
                                {semestre.nombre}
                                {!semestre.activo
                                    ? ' - Inactivo'
                                    : ''}
                            </option>
                        ))}
                    </select>

                    <InputError
                        message={errors.semestre_id}
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
                            <option key={tipo} value={tipo}>
                                {tipo}
                            </option>
                        ))}
                    </select>

                    <InputError
                        message={errors.tipo}
                        className="mt-2"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Módulo formativo
                    </label>

                    <select
                        value={data.id_modulo}
                        onChange={(event) =>
                            setData(
                                'id_modulo',
                                event.target.value
                            )
                        }
                        className={inputClass}
                    >
                        <option value="">
                            Seleccione un módulo
                        </option>

                        {modulos.map((modulo) => (
                            <option
                                key={modulo.id_modulo}
                                value={modulo.id_modulo}
                            >
                                {modulo.plan_estudio?.nombre ||
                                    'Sin plan'}{' '}
                                — Módulo {modulo.num_modulo}:{' '}
                                {modulo.nombre}
                            </option>
                        ))}
                    </select>

                    <InputError
                        message={errors.id_modulo}
                        className="mt-2"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Créditos
                    </label>

                    <input
                        type="number"
                        min="0"
                        max="99.99"
                        step="0.01"
                        value={data.creditos}
                        onChange={(event) =>
                            setData(
                                'creditos',
                                event.target.value
                            )
                        }
                        className={inputClass}
                        placeholder="Ejemplo: 3.50"
                    />

                    <InputError
                        message={errors.creditos}
                        className="mt-2"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Horas semestrales
                    </label>

                    <input
                        type="number"
                        min="1"
                        value={data.horas_semestrales}
                        onChange={(event) =>
                            setData(
                                'horas_semestrales',
                                event.target.value
                            )
                        }
                        className={inputClass}
                    />

                    <InputError
                        message={errors.horas_semestrales}
                        className="mt-2"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Orden
                    </label>

                    <input
                        type="number"
                        min="1"
                        value={data.orden}
                        onChange={(event) =>
                            setData('orden', event.target.value)
                        }
                        className={inputClass}
                    />

                    <InputError
                        message={errors.orden}
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
                        className={`${inputClass} min-h-28 resize-y`}
                        maxLength={3000}
                    />

                    <InputError
                        message={errors.descripcion}
                        className="mt-2"
                    />
                </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 pt-5">
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-lg bg-[#315d7a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#274c64] disabled:opacity-60"
                >
                    {processing
                        ? 'Guardando...'
                        : editing
                          ? 'Actualizar curso'
                          : 'Registrar curso'}
                </button>
            </div>
        </div>
    );
}
