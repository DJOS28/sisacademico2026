import { Field, inputClass } from '@/Pages/Ubicacion/FormHelpers';
import { useEffect, useState } from 'react';

export default function Form({
    data,
    setData,
    errors,
    departamentos,
    provinciasIniciales = [],
    idDepaInicial = '',
    processing,
    editing = false,
}) {
    const [idDepa, setIdDepa] = useState(idDepaInicial);
    const [provincias, setProvincias] = useState(provinciasIniciales);

    useEffect(() => {
        if (!idDepa) {
            setProvincias([]);
            setData('idProv', '');
            return;
        }

        fetch(route('provincias.por-departamento', idDepa), {
            headers: { Accept: 'application/json' },
        })
            .then((response) => response.json())
            .then((result) => setProvincias(result.provincias ?? []));
    }, [idDepa]);

    return (
        <div className="grid gap-5 md:grid-cols-3">
            <Field label="Departamento">
                <select className={inputClass} value={idDepa} onChange={(e) => setIdDepa(Number(e.target.value))}>
                    <option value="">Seleccione</option>
                    {departamentos.map((item) => <option key={item.idDepa} value={item.idDepa}>{item.Departamento}</option>)}
                </select>
            </Field>
            <Field label="Provincia" error={errors.idProv}>
                <select className={inputClass} value={data.idProv} onChange={(e) => setData('idProv', Number(e.target.value))}>
                    <option value="">Seleccione</option>
                    {provincias.map((item) => <option key={item.idProv} value={item.idProv}>{item.Provincia}</option>)}
                </select>
            </Field>
            <Field label="Distrito" error={errors.Distrito}>
                <input className={inputClass} value={data.Distrito} onChange={(e) => setData('Distrito', e.target.value)} />
            </Field>
            <div className="md:col-span-3 flex justify-end">
                <button disabled={processing} className="rounded-lg bg-[#315d7a] px-5 py-2.5 text-sm font-semibold text-white">
                    {editing ? 'Actualizar' : 'Guardar'}
                </button>
            </div>
        </div>
    );
}
