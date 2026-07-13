import InputError from '@/Components/InputError';
import { useMemo, useState } from 'react';

function Field({ label, required = false, error, children }) {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                {label}
                {required && <span className="ml-1 text-rose-600">*</span>}
            </label>
            {children}
            <InputError message={error} className="mt-1.5" />
        </div>
    );
}

export default function DocenteForm({
    values,
    setValue,
    errors,
    estados,
    imagePreview,
    setImagePreview,
    isEdit = false,
}) {
    const [showPassword, setShowPassword] = useState(false);

    const inputClass = (error) =>
        [
            'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition',
            error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'
                : 'border-slate-300 focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]',
        ].join(' ');

    const handleImage = (event) => {
        const file = event.target.files?.[0] ?? null;
        setValue('img', file);

        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-5 border-b border-slate-100 pb-3">
                    <h2 className="text-base font-bold text-slate-900">
                        Datos personales
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Información general del docente.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Nombres" required error={errors.nombre}>
                        <input
                            value={values.nombre}
                            onChange={(e) => setValue('nombre', e.target.value)}
                            className={inputClass(errors.nombre)}
                            maxLength={100}
                        />
                    </Field>

                    <Field label="Apellidos" required error={errors.apellido}>
                        <input
                            value={values.apellido}
                            onChange={(e) => setValue('apellido', e.target.value)}
                            className={inputClass(errors.apellido)}
                            maxLength={100}
                        />
                    </Field>

                    <Field label="DNI" required error={errors.dni}>
                        <input
                            value={values.dni}
                            onChange={(e) =>
                                setValue(
                                    'dni',
                                    e.target.value.replace(/\D/g, '').slice(0, 8),
                                )
                            }
                            inputMode="numeric"
                            className={inputClass(errors.dni)}
                            maxLength={8}
                        />
                    </Field>

                    <Field label="Correo electrónico" error={errors.email}>
                        <input
                            type="email"
                            value={values.email}
                            onChange={(e) => setValue('email', e.target.value)}
                            className={inputClass(errors.email)}
                            maxLength={100}
                        />
                    </Field>

                    <Field label="Teléfono" error={errors.telefono}>
                        <input
                            value={values.telefono}
                            onChange={(e) => setValue('telefono', e.target.value)}
                            className={inputClass(errors.telefono)}
                            maxLength={15}
                        />
                    </Field>

                    <Field label="Departamento" error={errors.departamento}>
                        <input
                            value={values.departamento}
                            onChange={(e) => setValue('departamento', e.target.value)}
                            className={inputClass(errors.departamento)}
                            maxLength={50}
                        />
                    </Field>

                    <Field label="Cargo" error={errors.cargo}>
                        <input
                            value={values.cargo}
                            onChange={(e) => setValue('cargo', e.target.value)}
                            className={inputClass(errors.cargo)}
                            maxLength={50}
                            placeholder="Ej.: Docente contratado"
                        />
                    </Field>

                    <Field label="Dirección" error={errors.direccion}>
                        <input
                            value={values.direccion}
                            onChange={(e) => setValue('direccion', e.target.value)}
                            className={inputClass(errors.direccion)}
                            maxLength={100}
                        />
                    </Field>
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-5 border-b border-slate-100 pb-3">
                    <h2 className="text-base font-bold text-slate-900">
                        Cuenta de acceso
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Credenciales para ingresar al sistema.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Nombre de usuario" required error={errors.username}>
                        <input
                            value={values.username}
                            onChange={(e) =>
                                setValue('username', e.target.value.replace(/\s/g, ''))
                            }
                            className={inputClass(errors.username)}
                            maxLength={50}
                            autoComplete="username"
                        />
                    </Field>

                    <Field label="Estado" required error={errors.status}>
                        <select
                            value={values.status}
                            onChange={(e) => setValue('status', e.target.value)}
                            className={inputClass(errors.status)}
                        >
                            {estados.map((estado) => (
                                <option key={estado} value={estado}>
                                    {estado}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field
                        label={isEdit ? 'Nueva contraseña' : 'Contraseña'}
                        required={!isEdit}
                        error={errors.password}
                    >
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={values.password}
                                onChange={(e) => setValue('password', e.target.value)}
                                className={`${inputClass(errors.password)} pr-12`}
                                autoComplete="new-password"
                                placeholder={
                                    isEdit
                                        ? 'Déjala vacía para conservar la actual'
                                        : 'Mínimo 8 caracteres'
                                }
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((value) => !value)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-[#315d7a] hover:bg-[#eef3f7]"
                            >
                                {showPassword ? 'Ocultar' : 'Ver'}
                            </button>
                        </div>
                    </Field>

                    <Field
                        label="Confirmar contraseña"
                        required={!isEdit}
                        error={errors.password_confirmation}
                    >
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={values.password_confirmation}
                            onChange={(e) =>
                                setValue('password_confirmation', e.target.value)
                            }
                            className={inputClass(errors.password_confirmation)}
                            autoComplete="new-password"
                        />
                    </Field>

                    <Field label="ID de Moodle" error={errors.moodle_user_id}>
                        <input
                            type="number"
                            min="1"
                            value={values.moodle_user_id}
                            onChange={(e) =>
                                setValue('moodle_user_id', e.target.value)
                            }
                            className={inputClass(errors.moodle_user_id)}
                        />
                    </Field>

                    <Field label="Fotografía" error={errors.img}>
                        <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp"
                            onChange={handleImage}
                            className={inputClass(errors.img)}
                        />
                    </Field>
                </div>

                {(imagePreview || values.current_img) && (
                    <div className="mt-4 flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <img
                            src={imagePreview || values.current_img}
                            alt="Vista previa"
                            className="h-20 w-20 rounded-lg border border-slate-200 bg-white object-cover"
                        />
                        <div>
                            <p className="text-sm font-semibold text-slate-700">
                                Fotografía del docente
                            </p>
                            {isEdit && values.current_img && (
                                <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(values.remove_img)}
                                        onChange={(e) =>
                                            setValue('remove_img', e.target.checked)
                                        }
                                    />
                                    Eliminar fotografía actual
                                </label>
                            )}
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
