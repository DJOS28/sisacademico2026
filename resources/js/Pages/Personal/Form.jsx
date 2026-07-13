import InputError from '@/Components/InputError';

export default function Form({ data, setData, errors, processing, roles, areas, editing = false }) {
    const inputClass =
        'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]';

    const toggleRole = (id) => {
        const current = data.role_ids ?? [];
        setData('role_ids', current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    };

    const toggleArea = (id) => {
        const current = data.area_ids ?? [];
        setData('area_ids', current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    };

    return (
        <div className="space-y-7">
            <section>
                <h2 className="mb-4 text-base font-bold text-slate-900">Datos personales</h2>
                <div className="grid gap-5 md:grid-cols-2">
                    <Field label="DNI" error={errors.dni}>
                        <input className={inputClass} value={data.dni} onChange={(e) => setData('dni', e.target.value)} />
                    </Field>
                    <Field label="Puesto" error={errors.puesto}>
                        <input className={inputClass} value={data.puesto} onChange={(e) => setData('puesto', e.target.value)} />
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
                </div>
            </section>

            <section className="border-t border-slate-200 pt-6">
                <h2 className="mb-4 text-base font-bold text-slate-900">Cuenta de acceso</h2>
                <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Usuario" error={errors.username}>
                        <input className={inputClass} value={data.username} onChange={(e) => setData('username', e.target.value)} />
                    </Field>
                    <Field label="Estado" error={errors.status}>
                        <select className={inputClass} value={data.status} onChange={(e) => setData('status', e.target.value)}>
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                        </select>
                    </Field>
                    <Field label={editing ? 'Nueva contraseña (opcional)' : 'Contraseña'} error={errors.password}>
                        <input type="password" className={inputClass} value={data.password} onChange={(e) => setData('password', e.target.value)} />
                    </Field>
                    <Field label="Confirmar contraseña" error={errors.password_confirmation}>
                        <input type="password" className={inputClass} value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} />
                    </Field>
                    <Field label="URL de imagen" error={errors.img} full>
                        <input className={inputClass} value={data.img} onChange={(e) => setData('img', e.target.value)} />
                    </Field>
                </div>
            </section>

            <section className="border-t border-slate-200 pt-6">
                <h2 className="mb-4 text-base font-bold text-slate-900">Área principal</h2>
                <Field label="Área principal" error={errors.id_area}>
                    <select className={inputClass} value={data.id_area} onChange={(e) => setData('id_area', Number(e.target.value))}>
                        <option value="">Seleccione un área</option>
                        {areas.map((area) => <option key={area.id} value={area.id}>{area.nombre}</option>)}
                    </select>
                </Field>
            </section>

            <section className="border-t border-slate-200 pt-6">
                <h2 className="mb-2 text-base font-bold text-slate-900">Roles asignados</h2>
                <p className="mb-4 text-sm text-slate-500">Seleccione uno o varios roles administrativos.</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {roles.map((rol) => (
                        <label key={rol.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3">
                            <input
                                type="checkbox"
                                checked={(data.role_ids ?? []).includes(rol.id)}
                                onChange={() => toggleRole(rol.id)}
                                className="mt-1 rounded border-slate-300"
                            />
                            <span>
                                <span className="block text-sm font-semibold text-slate-800">{rol.nombre}</span>
                                {rol.descripcion && <span className="mt-1 block text-xs text-slate-500">{rol.descripcion}</span>}
                            </span>
                        </label>
                    ))}
                </div>
                <InputError message={errors.role_ids || errors['role_ids.0']} className="mt-2" />
            </section>

            <section className="border-t border-slate-200 pt-6">
                <h2 className="mb-2 text-base font-bold text-slate-900">Áreas adicionales</h2>
                <p className="mb-4 text-sm text-slate-500">El área principal se incluirá automáticamente.</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {areas.map((area) => (
                        <label key={area.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3">
                            <input
                                type="checkbox"
                                checked={(data.area_ids ?? []).includes(area.id)}
                                onChange={() => toggleArea(area.id)}
                                className="rounded border-slate-300"
                            />
                            <span className="text-sm font-semibold text-slate-700">{area.nombre}</span>
                        </label>
                    ))}
                </div>
                <InputError message={errors.area_ids} className="mt-2" />
            </section>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-lg bg-[#315d7a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#274c64] disabled:opacity-60"
                >
                    {processing ? 'Guardando...' : editing ? 'Actualizar personal' : 'Registrar personal'}
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
