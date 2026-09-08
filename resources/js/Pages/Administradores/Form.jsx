import InputError from '@/Components/InputError';
import { Link } from '@inertiajs/react';

export default function Form({ data, setData, errors, processing, editing = false }) {
    const inputClass = (hasError) =>
        [
            'w-full rounded-lg border px-3.5 py-2.5 text-sm transition outline-none',
            hasError
                ? 'border-rose-300 bg-rose-50/30 text-slate-900 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'
                : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]',
        ].join(' ');

    return (
        <div className="space-y-8">
            {/* SECCIÓN 1: DATOS PERSONALES */}
            <div>
                <div className="border-b border-slate-200 pb-3 mb-5">
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#315d7a]/10 text-xs font-bold text-[#315d7a]">
                            1
                        </span>
                        Información Personal y Contacto
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Identidad del colaborador institucional y vías de comunicación directa.
                    </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    <Field label="DNI" error={errors.dni} required>
                        <input
                            type="text"
                            maxLength={8}
                            placeholder="Ej. 72481920"
                            className={inputClass(Boolean(errors.dni))}
                            value={data.dni}
                            onChange={(e) => setData('dni', e.target.value)}
                        />
                    </Field>

                    <Field label="Correo Institucional / Personal" error={errors.email} required>
                        <input
                            type="email"
                            placeholder="admin@instituto.edu.pe"
                            className={inputClass(Boolean(errors.email))}
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                    </Field>

                    <Field label="Nombres" error={errors.nombre} required>
                        <input
                            type="text"
                            placeholder="Nombres completos"
                            className={inputClass(Boolean(errors.nombre))}
                            value={data.nombre}
                            onChange={(e) => setData('nombre', e.target.value)}
                        />
                    </Field>

                    <Field label="Apellidos" error={errors.apellido} required>
                        <input
                            type="text"
                            placeholder="Apellidos completos"
                            className={inputClass(Boolean(errors.apellido))}
                            value={data.apellido}
                            onChange={(e) => setData('apellido', e.target.value)}
                        />
                    </Field>

                    <Field label="Teléfono / Celular" error={errors.telefono}>
                        <input
                            type="text"
                            placeholder="Ej. 987654321"
                            className={inputClass(Boolean(errors.telefono))}
                            value={data.telefono}
                            onChange={(e) => setData('telefono', e.target.value)}
                        />
                    </Field>

                    <Field label="Dirección domiciliaria" error={errors.direccion}>
                        <input
                            type="text"
                            placeholder="Av. / Jr. / Calle y número"
                            className={inputClass(Boolean(errors.direccion))}
                            value={data.direccion}
                            onChange={(e) => setData('direccion', e.target.value)}
                        />
                    </Field>
                </div>
            </div>

            {/* SECCIÓN 2: CUENTA Y ACCESO */}
            <div>
                <div className="border-b border-slate-200 pb-3 mb-5">
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#315d7a]/10 text-xs font-bold text-[#315d7a]">
                            2
                        </span>
                        Credenciales de Acceso al Sistema
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Definición de usuario y contraseña para ingresar a la plataforma.
                    </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Nombre de Usuario" error={errors.username} required>
                        <div className="relative">
                            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                                @
                            </span>
                            <input
                                type="text"
                                placeholder="usuario.acceso"
                                className={`${inputClass(Boolean(errors.username))} pl-8 font-mono`}
                                value={data.username}
                                onChange={(e) => setData('username', e.target.value)}
                            />
                        </div>
                    </Field>

                    <Field label="Estado de la Cuenta" error={errors.status} required>
                        <select
                            className={inputClass(Boolean(errors.status))}
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value)}
                        >
                            <option value="Activo">Activo (Habilitado)</option>
                            <option value="Inactivo">Inactivo (Suspendido)</option>
                            {editing && <option value="Desactivado">Desactivado (Bloqueo por Intentos)</option>}
                        </select>
                    </Field>

                    <Field 
                        label={editing ? 'Nueva Contraseña (dejar en blanco para mantener la actual)' : 'Contraseña'} 
                        error={errors.password} 
                        required={!editing}
                    >
                        <input
                            type="password"
                            placeholder="••••••••"
                            className={inputClass(Boolean(errors.password))}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                        />
                    </Field>

                    <Field 
                        label="Confirmar Contraseña" 
                        error={errors.password_confirmation} 
                        required={Boolean(data.password)}
                    >
                        <input
                            type="password"
                            placeholder="••••••••"
                            className={inputClass(Boolean(errors.password_confirmation))}
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                        />
                    </Field>
                </div>
            </div>

            {/* SECCIÓN 3: PERFIL Y DETALLES EXTRA */}
            <div>
                <div className="border-b border-slate-200 pb-3 mb-5">
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#315d7a]/10 text-xs font-bold text-[#315d7a]">
                            3
                        </span>
                        Foto de Perfil y Privilegios
                    </h2>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    <Field label="URL de Imagen / Avatar" error={errors.img}>
                        <input
                            type="url"
                            placeholder="https://servidor.com/avatar.jpg"
                            className={inputClass(Boolean(errors.img))}
                            value={data.img}
                            onChange={(e) => setData('img', e.target.value)}
                        />
                    </Field>

                    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                            🛡️
                        </div>
                        <div>
                            <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                                Rol Asignado: Administrador
                            </p>
                            <p className="text-xs text-blue-700/90 mt-0.5 leading-relaxed">
                                Este usuario contará con acceso y permisos de administración general del sistema.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-6">
                <Link
                    href={route('administradores.index')}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                    Cancelar
                </Link>

                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#315d7a] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#254960] focus:outline-none focus:ring-4 focus:ring-[#315d7a]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processing ? (
                        <>
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4Z" />
                            </svg>
                            Guardando cambios...
                        </>
                    ) : (
                        <span>{editing ? 'Actualizar Administrador' : 'Guardar Administrador'}</span>
                    )}
                </button>
            </div>
        </div>
    );
}

function Field({ label, error, children, required = false }) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            {children}
            <InputError message={error} className="mt-1.5 text-xs font-medium text-rose-600" />
        </div>
    );
}