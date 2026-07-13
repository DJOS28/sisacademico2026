import InputError from '@/Components/InputError';

export default function Form({ data, setData, errors, processing, estados, editing = false }) {
    const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]';

    return (
        <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Nombre del área</label>
                    <input
                        value={data.nombre}
                        onChange={(e) => setData('nombre', e.target.value)}
                        className={inputClass}
                        maxLength={100}
                    />
                    <InputError message={errors.nombre} className="mt-2" />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Estado</label>
                    <select
                        value={data.estado}
                        onChange={(e) => setData('estado', e.target.value)}
                        className={inputClass}
                    >
                        {estados.map((estado) => (
                            <option key={estado} value={estado}>{estado}</option>
                        ))}
                    </select>
                    <InputError message={errors.estado} className="mt-2" />
                </div>

                <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Descripción</label>
                    <textarea
                        value={data.descripcion}
                        onChange={(e) => setData('descripcion', e.target.value)}
                        className={`${inputClass} min-h-32`}
                        maxLength={1000}
                    />
                    <InputError message={errors.descripcion} className="mt-2" />
                </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 pt-5">
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-lg bg-[#315d7a] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                    {processing ? 'Guardando...' : editing ? 'Actualizar área' : 'Registrar área'}
                </button>
            </div>
        </div>
    );
}
