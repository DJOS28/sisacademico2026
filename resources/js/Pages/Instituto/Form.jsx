import InputError from '@/Components/InputError';
import { useEffect, useState } from 'react';

const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]';

function Field({ label, error, children }) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
            {children}
            <InputError message={error} className="mt-2" />
        </div>
    );
}

export default function Form({
    data,
    setData,
    errors,
    departamentos,
    provinciasIniciales = [],
    distritosIniciales = [],
    idDepaInicial = '',
    idProvInicial = '',
    processing,
    editing = false,
    logoUrl = null,
}) {
    const [idDepa, setIdDepa] = useState(idDepaInicial);
    const [idProv, setIdProv] = useState(idProvInicial);
    const [provincias, setProvincias] = useState(provinciasIniciales);
    const [distritos, setDistritos] = useState(distritosIniciales);

    useEffect(() => {
        if (!idDepa) {
            setProvincias([]);
            setDistritos([]);
            setIdProv('');
            setData('idDist', '');
            return;
        }

        fetch(route('provincias.por-departamento', idDepa), {
            headers: { Accept: 'application/json' },
        })
            .then((response) => response.json())
            .then((result) => setProvincias(result.provincias ?? []));
    }, [idDepa]);

    useEffect(() => {
        if (!idProv) {
            setDistritos([]);
            setData('idDist', '');
            return;
        }

        fetch(route('distritos.por-provincia', idProv), {
            headers: { Accept: 'application/json' },
        })
            .then((response) => response.json())
            .then((result) => setDistritos(result.distritos ?? []));
    }, [idProv]);

    return (
        <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
                <Field label="Nombre" error={errors.nombre}>
                    <input className={inputClass} value={data.nombre} onChange={(e) => setData('nombre', e.target.value)} />
                </Field>
                <Field label="Código modular" error={errors.codigo_modular}>
                    <input className={inputClass} value={data.codigo_modular} onChange={(e) => setData('codigo_modular', e.target.value)} />
                </Field>
                <Field label="DRE" error={errors.dre}>
                    <input className={inputClass} value={data.dre} onChange={(e) => setData('dre', e.target.value)} />
                </Field>
                <Field label="Teléfono" error={errors.telefono}>
                    <input className={inputClass} value={data.telefono} onChange={(e) => setData('telefono', e.target.value)} />
                </Field>
                <Field label="Dirección" error={errors.direccion}>
                    <input className={inputClass} value={data.direccion} onChange={(e) => setData('direccion', e.target.value)} />
                </Field>
                <Field label="Logo" error={errors.logo}>
                    <input type="file" accept="image/*" className={inputClass} onChange={(e) => setData('logo', e.target.files?.[0] ?? null)} />
                </Field>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
                <Field label="Departamento">
                    <select className={inputClass} value={idDepa} onChange={(e) => setIdDepa(Number(e.target.value))}>
                        <option value="">Seleccione</option>
                        {departamentos.map((item) => <option key={item.idDepa} value={item.idDepa}>{item.Departamento}</option>)}
                    </select>
                </Field>
                <Field label="Provincia">
                    <select className={inputClass} value={idProv} onChange={(e) => setIdProv(Number(e.target.value))}>
                        <option value="">Seleccione</option>
                        {provincias.map((item) => <option key={item.idProv} value={item.idProv}>{item.Provincia}</option>)}
                    </select>
                </Field>
                <Field label="Distrito" error={errors.idDist}>
                    <select className={inputClass} value={data.idDist} onChange={(e) => setData('idDist', Number(e.target.value))}>
                        <option value="">Seleccione</option>
                        {distritos.map((item) => <option key={item.idDist} value={item.idDist}>{item.Distrito}</option>)}
                    </select>
                </Field>
            </div>

            {editing && logoUrl && (
                <label className="flex items-center gap-3 text-sm text-slate-700">
                    <input type="checkbox" checked={Boolean(data.remove_logo)} onChange={(e) => setData('remove_logo', e.target.checked)} />
                    Eliminar logo actual
                </label>
            )}

            <div className="flex justify-end">
                <button disabled={processing} className="rounded-lg bg-[#315d7a] px-5 py-2.5 text-sm font-semibold text-white">
                    {editing ? 'Actualizar instituto' : 'Registrar instituto'}
                </button>
            </div>
        </div>
    );
}
