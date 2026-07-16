import InputError from '@/Components/InputError';
import { useMemo } from 'react';

export default function Form({
    data,
    setData,
    errors,
    processing,
    planesEstudio,
    semestres,
    modulos,
    tipos,
    editing = false,
}) {
    const inputClass =
        'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]';

    const modulosFiltrados = useMemo(() => {
        if (!data.plan_estudio_id) {
            return [];
        }

        return modulos.filter(
            (modulo) =>
                String(modulo.id_plan_estudio) ===
                String(data.plan_estudio_id)
        );
    }, [modulos, data.plan_estudio_id]);

    const cambiarPlan = (event) => {
        const nuevoPlanId = event.target.value;

        setData((actual) => ({
            ...actual,
            plan_estudio_id: nuevoPlanId,
            id_modulo: '',
        }));
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Plan de estudio
                    </label>

                    <select
                        value={data.plan_estudio_id}
                        onChange={cambiarPlan}
                        className={inputClass}
                    >
                        <option value="">
                            Seleccione un plan
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
                            </option>
                        ))}
                    </select>

                    <InputError
                        message={errors.plan_estudio_id}
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
                            </option>
                        ))}
                    </select>

                    <InputError
                        message={errors.semestre_id}
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
                        disabled={!data.plan_estudio_id}
                    >
                        <option value="">
                            {data.plan_estudio_id
                                ? 'Seleccione un módulo'
                                : 'Primero seleccione un plan'}
                        </option>

                        {modulosFiltrados.map((modulo) => (
                            <option
                                key={modulo.id_modulo}
                                value={modulo.id_modulo}
                            >
                                Módulo {modulo.num_modulo}: {modulo.nombre}
                            </option>
                        ))}
                    </select>

                    <InputError
                        message={errors.id_modulo}
                        className="mt-2"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Nombre del curso
                    </label>

                    <input
                        type="text"
                        value={data.nombre}
                        onChange={(event) =>
                            setData(
                                'nombre',
                                event.target.value
                            )
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
                        Tipo
                    </label>

                    <select
                        value={data.tipo}
                        onChange={(event) =>
                            setData(
                                'tipo',
                                event.target.value
                            )
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
                            setData(
                                'orden',
                                event.target.value
                            )
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
                    className="rounded-lg bg-[#315d7a] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
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
