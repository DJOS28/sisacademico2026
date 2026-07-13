import InputError from '@/Components/InputError';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

function Icon({ name, className = 'h-5 w-5' }) {
    const props = {
        className,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
    };

    const icons = {
        lock: (
            <>
                <rect x="4" y="10" width="16" height="11" rx="2.5" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </>
        ),
        key: (
            <>
                <circle cx="8" cy="15" r="4" />
                <path d="m11 12 8-8" />
                <path d="m15 8 2 2" />
                <path d="m17 6 2 2" />
            </>
        ),
        eye: (
            <>
                <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                <circle cx="12" cy="12" r="2.5" />
            </>
        ),
        'eye-off': (
            <>
                <path d="m3 3 18 18" />
                <path d="M10.6 6.2A9.8 9.8 0 0 1 12 6c6 0 9.5 6 9.5 6a17.4 17.4 0 0 1-3.1 3.7" />
                <path d="M6.2 6.2C3.8 7.8 2.5 12 2.5 12s3.5 6 9.5 6a9.5 9.5 0 0 0 3-.5" />
            </>
        ),
        save: (
            <>
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
                <path d="M17 21v-8H7v8" />
                <path d="M7 3v5h8" />
            </>
        ),
        check: <path d="m5 12 4 4L19 6" />,
        shield: (
            <>
                <path d="M12 3 5 6v5c0 4.6 2.8 8.3 7 10 4.2-1.7 7-5.4 7-10V6l-7-3Z" />
                <path d="m9 12 2 2 4-4" />
            </>
        ),
    };

    return <svg {...props}>{icons[name]}</svg>;
}

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (event) => {
        event.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (validationErrors) => {
                if (validationErrors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (validationErrors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    const inputClass = (hasError) =>
        [
            'block w-full rounded-lg border bg-white py-3 pl-11 pr-12',
            'text-sm text-slate-900 placeholder:text-slate-400 outline-none transition',
            hasError
                ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'
                : 'border-slate-300 hover:border-slate-400 focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]',
        ].join(' ');

    return (
        <section className={className}>
            <form onSubmit={updatePassword} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <label
                            htmlFor="current_password"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Contraseña actual
                            <span className="ml-1 text-rose-600">*</span>
                        </label>

                        <div className="relative">
                            <Icon
                                name="lock"
                                className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                id="current_password"
                                ref={currentPasswordInput}
                                value={data.current_password}
                                onChange={(event) =>
                                    setData(
                                        'current_password',
                                        event.target.value,
                                    )
                                }
                                type={
                                    showCurrentPassword ? 'text' : 'password'
                                }
                                className={inputClass(
                                    Boolean(errors.current_password),
                                )}
                                autoComplete="current-password"
                                required
                                placeholder="Ingrese su contraseña actual"
                                aria-invalid={Boolean(
                                    errors.current_password,
                                )}
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowCurrentPassword((value) => !value)
                                }
                                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#dfeaf1]"
                                aria-label={
                                    showCurrentPassword
                                        ? 'Ocultar contraseña actual'
                                        : 'Mostrar contraseña actual'
                                }
                            >
                                <Icon
                                    name={
                                        showCurrentPassword
                                            ? 'eye-off'
                                            : 'eye'
                                    }
                                />
                            </button>
                        </div>

                        <InputError
                            message={errors.current_password}
                            className="mt-2"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Nueva contraseña
                            <span className="ml-1 text-rose-600">*</span>
                        </label>

                        <div className="relative">
                            <Icon
                                name="key"
                                className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                id="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(event) =>
                                    setData('password', event.target.value)
                                }
                                type={showNewPassword ? 'text' : 'password'}
                                className={inputClass(Boolean(errors.password))}
                                autoComplete="new-password"
                                required
                                placeholder="Mínimo 8 caracteres"
                                aria-invalid={Boolean(errors.password)}
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowNewPassword((value) => !value)
                                }
                                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#dfeaf1]"
                                aria-label={
                                    showNewPassword
                                        ? 'Ocultar nueva contraseña'
                                        : 'Mostrar nueva contraseña'
                                }
                            >
                                <Icon
                                    name={
                                        showNewPassword ? 'eye-off' : 'eye'
                                    }
                                />
                            </button>
                        </div>

                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password_confirmation"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Confirmar nueva contraseña
                            <span className="ml-1 text-rose-600">*</span>
                        </label>

                        <div className="relative">
                            <Icon
                                name="shield"
                                className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                id="password_confirmation"
                                value={data.password_confirmation}
                                onChange={(event) =>
                                    setData(
                                        'password_confirmation',
                                        event.target.value,
                                    )
                                }
                                type={showConfirmation ? 'text' : 'password'}
                                className={inputClass(
                                    Boolean(errors.password_confirmation),
                                )}
                                autoComplete="new-password"
                                required
                                placeholder="Repita la nueva contraseña"
                                aria-invalid={Boolean(
                                    errors.password_confirmation,
                                )}
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowConfirmation((value) => !value)
                                }
                                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#dfeaf1]"
                                aria-label={
                                    showConfirmation
                                        ? 'Ocultar confirmación'
                                        : 'Mostrar confirmación'
                                }
                            >
                                <Icon
                                    name={
                                        showConfirmation ? 'eye-off' : 'eye'
                                    }
                                />
                            </button>
                        </div>

                        <InputError
                            message={errors.password_confirmation}
                            className="mt-2"
                        />
                    </div>
                </div>

                <div className="rounded-lg border border-[#dce3ea] bg-[#f8fafc] p-4">
                    <div className="flex items-start gap-3">
                        <Icon
                            name="shield"
                            className="mt-0.5 h-5 w-5 shrink-0 text-[#315d7a]"
                        />

                        <div>
                            <p className="text-sm font-semibold text-slate-800">
                                Recomendación de seguridad
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                Utilice una contraseña de al menos 8 caracteres,
                                combinando letras, números y símbolos. Evite usar
                                información personal o contraseñas anteriores.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#315d7a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#274c64] focus:outline-none focus:ring-4 focus:ring-[#dfeaf1] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processing ? (
                            <>
                                <svg
                                    className="h-4 w-4 animate-spin"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden="true"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4Z"
                                    />
                                </svg>
                                Actualizando...
                            </>
                        ) : (
                            <>
                                <Icon name="save" className="h-4 w-4" />
                                Actualizar contraseña
                            </>
                        )}
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                            <Icon name="check" className="h-4 w-4" />
                            Contraseña actualizada correctamente.
                        </div>
                    </Transition>
                </div>
            </form>
        </section>
    );
}