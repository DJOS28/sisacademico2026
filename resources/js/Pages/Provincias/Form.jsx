import { Field, inputClass } from '@/Pages/Ubicacion/FormHelpers';

export default function Form({ data, setData, errors, departamentos, processing, editing = false }) {
    return (
        <div className="grid gap-5 md:grid-cols-2">
            <Field label="Departamento" error={errors.idDepa}>
                <select className={inputClass} value={data.idDepa} onChange={(e) => setData('idDepa', Number(e.target.value))}>
                    <option value="">Seleccione</option>
                    {departamentos.map((item) => (
                        <option key={item.idDepa} value={item.idDepa}>{item.Departamento}</option>
                    ))}
                </select>
            </Field>
            <Field label="Provincia" error={errors.Provincia}>
                <input className={inputClass} value={data.Provincia} onChange={(e) => setData('Provincia', e.target.value)} />
            </Field>
            <div className="md:col-span-2 flex justify-end">
                <button disabled={processing} className="rounded-lg bg-[#315d7a] px-5 py-2.5 text-sm font-semibold text-white">
                    {editing ? 'Actualizar' : 'Guardar'}
                </button>
            </div>
        </div>
    );
}
