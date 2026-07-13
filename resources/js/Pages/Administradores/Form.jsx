import InputError from '@/Components/InputError';

export default function Form({ data, setData, errors, processing, editing = false }) {
    const inputClass =
        'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]';

    return (
        <div className="grid gap-5 md:grid-cols-2">
            <Field label="DNI" error={errors.dni}>
                <input className={inputClass} value={data.dni} onChange={(e) => setData('dni', e.target.value)} />
            </Field>
            <Field label="Usuario" error={errors.username}>
                <input className={inputClass} value={data.username} onChange={(e) => setData('username', e.target.value)} />
            </Field>
            <Field label="Nombres" error={errors.nombre}>
                <input className={inputClass} value={data.nombre} onChange={(e) => setData('nombre', e.target.value)} />
            </Field>
            <Field label="Apellidos" error={errors.apellido}>
                <input className={inputClass} value={data.apellido} onChange={(e) => setData('apellido', e.target.value)} />
            </Field>
            <Field label="Correo" error={errors.email}>
                <input type="email" className={inputClass} value={data.email} onChange={(e) => setData('email', e.target.value)} />
            </Field>
            <Field label="Teléfono" error={errors.telefono}>
                <input className={inputClass} value={data.telefono} onChange={(e) => setData('telefono', e.target.value)} />
            </Field>
            <Field label="Dirección" error={errors.direccion} full>
                <input className={inputClass} value={data.direccion} onChange={(e) => setData('direccion', e.target.value)} />
            </Field>
            <Field label={editing ? 'Nueva contraseña (opcional)' : 'Contraseña'} error={errors.password}>
                <input type="password" className={inputClass} value={data.password} onChange={(e) => setData('password', e.target.value)} />
            </Field>
            <Field label="Confirmar contraseña" error={errors.password_confirmation}>
                <input type="password" className={inputClass} value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} />
            </Field>
            <Field label="Estado" error={errors.status}>
                <select className={inputClass} value={data.status} onChange={(e) => setData('status', e.target.value)}>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                </select>
            </Field>
            <Field label="URL de imagen" error={errors.img}>
                <input className={inputClass} value={data.img} onChange={(e) => setData('img', e.target.value)} />
            </Field>

            <div className="md:col-span-2 rounded-lg border border-[#dce3ea] bg-[#eef3f7] px-4 py-3 text-sm text-[#315d7a]">
                El rol Administrador se asignará automáticamente.
            </div>

            <div className="md:col-span-2 flex justify-end">
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-lg bg-[#315d7a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#274c64] disabled:opacity-60"
                >
                    {processing ? 'Guardando...' : editing ? 'Actualizar administrador' : 'Registrar administrador'}
                </button>
            </div>
        </div>
    );
}

function Field({ label, error, children, full = false }) {
    return (
        <div className={full ? 'md:col-span-2' : ''}>
            <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
            {children}
            <InputError message={error} className="mt-2" />
        </div>
    );
}
