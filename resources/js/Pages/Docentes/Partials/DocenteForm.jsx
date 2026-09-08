import InputError from '@/Components/InputError';
import axios from 'axios';
import Swal from 'sweetalert2';
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
    const [buscandoDni, setBuscandoDni] = useState(false);

    const inputClass = (error) =>
        [
            'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition',
            error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'
                : 'border-slate-300 focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]',
        ].join(' ');

    // Validación reactiva de la política de seguridad de contraseñas de Moodle
    const passwordChecks = useMemo(() => {
        const pass = values.password || '';
        return {
            length: pass.length >= 8,
            upper: /[A-Z]/.test(pass),
            lower: /[a-z]/.test(pass),
            number: /[0-9]/.test(pass),
            special: /[^A-Za-z0-9]/.test(pass),
        };
    }, [values.password]);

    const handleImage = (event) => {
        const file = event.target.files?.[0] ?? null;
        setValue('img', file);

        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    /**
     * Consulta a RENIEC vía DeColecta y autorrellena datos con contraseña válida para Moodle
     */
    const consultarReniecDni = async (dniConsultar) => {
        const dniLimpio = String(dniConsultar || values.dni || '').trim();

        if (dniLimpio.length !== 8) {
            Swal.fire('Atención', 'Ingrese un DNI válido de 8 dígitos.', 'warning');
            return;
        }

        setBuscandoDni(true);

        try {
            const response = await axios.post(
                route('docentes.consultar.dni'),
                { dni: dniLimpio },
                { headers: { Accept: 'application/json' } }
            );

            if (response.data.success) {
                const { nombres, apellidos } = response.data;

                if (nombres) setValue('nombre', nombres);
                if (apellidos) setValue('apellido', apellidos);

                // Si es un nuevo registro, generar contraseña que cumple con Moodle (ej: 46871521@Doc2026)
                if (!isEdit) {
                    const passwordMoodleValida = `${dniLimpio}@Doc2026`;
                    if (!values.username) setValue('username', dniLimpio);
                    if (!values.password) setValue('password', passwordMoodleValida);
                    if (!values.password_confirmation) setValue('password_confirmation', passwordMoodleValida);
                }

                Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2500,
                    timerProgressBar: true,
                }).fire({
                    icon: 'success',
                    title: 'Datos obtenidos de RENIEC',
                });
            }
        } catch (error) {
            Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            }).fire({
                icon: 'info',
                title: error.response?.data?.message || 'DNI no encontrado en RENIEC. Ingrese los datos manualmente.',
            });
        } finally {
            setBuscandoDni(false);
        }
    };

    const handleDniInput = (e) => {
        const dniValue = e.target.value.replace(/\D/g, '').slice(0, 8);
        setValue('dni', dniValue);

        // Si se completan los 8 dígitos en creación y no hay password, sugerir la compatible con Moodle
        if (dniValue.length === 8 && !isEdit) {
            consultarReniecDni(dniValue);
        }
    };

    return (
        <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="mb-5 border-b border-slate-100 pb-3">
                    <h2 className="text-base font-bold text-slate-900">
                        Datos personales
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Información general del docente.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* CAMPO DNI CON BUSCADOR RENIEC */}
                    <Field label="DNI" required error={errors.dni}>
                        <div className="relative flex items-center">
                            <input
                                value={values.dni}
                                onChange={handleDniInput}
                                inputMode="numeric"
                                className={`${inputClass(errors.dni)} pr-24 font-mono`}
                                maxLength={8}
                                placeholder="8 dígitos"
                            />
                            <button
                                type="button"
                                disabled={buscandoDni || (values.dni?.length !== 8)}
                                onClick={() => consultarReniecDni(values.dni)}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-[#315d7a] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#274c64] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-2xs"
                            >
                                {buscandoDni ? 'Buscando...' : '🔍 RENIEC'}
                            </button>
                        </div>
                    </Field>

                    <Field label="Correo electrónico" required error={errors.email}>
                        <input
                            type="email"
                            value={values.email}
                            onChange={(e) => setValue('email', e.target.value)}
                            className={inputClass(errors.email)}
                            maxLength={100}
                            placeholder="ejemplo@instituto.edu.pe"
                        />
                    </Field>

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

                    <Field label="Teléfono" error={errors.telefono}>
                        <input
                            value={values.telefono}
                            onChange={(e) => setValue('telefono', e.target.value)}
                            className={inputClass(errors.telefono)}
                            maxLength={15}
                            placeholder="Ej.: 987654321"
                        />
                    </Field>

                    <Field label="Departamento" error={errors.departamento}>
                        <input
                            value={values.departamento}
                            onChange={(e) => setValue('departamento', e.target.value)}
                            className={inputClass(errors.departamento)}
                            maxLength={50}
                            placeholder="Ej.: Ciencias de la Salud"
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
                            placeholder="Ej.: Av. Las Palmeras 123"
                        />
                    </Field>
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="mb-5 border-b border-slate-100 pb-3">
                    <h2 className="text-base font-bold text-slate-900">
                        Cuenta de acceso y Moodle
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Credenciales sincronizadas automáticamente con el Aula Virtual Moodle.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Nombre de usuario" required error={errors.username}>
                        <input
                            value={values.username}
                            onChange={(e) =>
                                setValue('username', e.target.value.toLowerCase().replace(/\s/g, ''))
                            }
                            className={inputClass(errors.username)}
                            maxLength={50}
                            autoComplete="username"
                            placeholder="En minúsculas (ej. DNI)"
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

                    {/* CAMPO CONTRASEÑA */}
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
                                className={`${inputClass(errors.password)} pr-12 font-mono`}
                                autoComplete="new-password"
                                placeholder={
                                    isEdit
                                        ? 'Déjala vacía para conservar la actual'
                                        : 'Ej. 46871521@Doc2026'
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

                    {/* CONFIRMAR CONTRASEÑA */}
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
                            className={`${inputClass(errors.password_confirmation)} font-mono`}
                            autoComplete="new-password"
                            placeholder="Repetir contraseña exacta"
                        />
                    </Field>

                    {/* CAJA INFORMATIVA DE REQUISITOS MOODLE */}
                    {(!isEdit || values.password) && (
                        <div className="md:col-span-2 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs space-y-1.5">
                            <p className="font-bold text-slate-700">
                                🔒 Requisitos de Contraseña para Moodle:
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                                <span className={passwordChecks.length ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                                    {passwordChecks.length ? '✓' : '○'} Mínimo 8 carac.
                                </span>
                                <span className={passwordChecks.upper ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                                    {passwordChecks.upper ? '✓' : '○'} 1 Mayúscula
                                </span>
                                <span className={passwordChecks.lower ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                                    {passwordChecks.lower ? '✓' : '○'} 1 Minúscula
                                </span>
                                <span className={passwordChecks.number ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                                    {passwordChecks.number ? '✓' : '○'} 1 Número
                                </span>
                                <span className={passwordChecks.special ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                                    {passwordChecks.special ? '✓' : '○'} 1 Símbolo (@#$.)
                                </span>
                            </div>
                        </div>
                    )}

                    <Field label="ID de Moodle (Opcional)" error={errors.moodle_user_id}>
                        <input
                            type="number"
                            min="1"
                            value={values.moodle_user_id || ''}
                            onChange={(e) =>
                                setValue('moodle_user_id', e.target.value)
                            }
                            placeholder="Se creará y vinculará automáticamente"
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