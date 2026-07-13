import InputError from '@/Components/InputError';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';

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
        user: (
            <>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
            </>
        ),
        mail: (
            <>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
            </>
        ),
        save: (
            <>
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
                <path d="M17 21v-8H7v8" />
                <path d="M7 3v5h8" />
            </>
        ),
        check: (
            <>
                <path d="m5 12 4 4L19 6" />
            </>
        ),
        alert: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
            </>
        ),
    };

    return <svg {...props}>{icons[name]}</svg>;
}

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name:
                user.nombre_completo ||
                [user.perfil?.nombre, user.perfil?.apellido]
                    .filter(Boolean)
                    .join(' ') ||
                user.name ||
                '',
            email: user.perfil?.email || user.email || '',
        });

    const submit = (event) => {
        event.preventDefault();

        patch(route('profile.update'), {
            preserveScroll: true,
        });
    };

    const inputClass = (hasError) =>
        [
            'block w-full rounded-lg border bg-white py-3 pl-11 pr-4',
            'text-sm text-slate-900 placeholder:text-slate-400 outline-none transition',
            hasError
                ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'
                : 'border-slate-300 hover:border-slate-400 focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]',
        ].join(' ');

    return (
        <section className={className}>
            <form onSubmit={submit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                    <div>
                        <label
                            htmlFor="name"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Nombre completo
                            <span className="ml-1 text-rose-600">*</span>
                        </label>

                        <div className="relative">
                            <Icon
                                name="user"
                                className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={data.name}
                                onChange={(event) =>
                                    setData('name', event.target.value)
                                }
                                className={inputClass(Boolean(errors.name))}
                                required
                                autoFocus
                                autoComplete="name"
                                maxLength={150}
                                placeholder="Ingrese su nombre completo"
                                aria-invalid={Boolean(errors.name)}
                            />
                        </div>

                        <InputError
                            className="mt-2"
                            message={errors.name}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="email"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Correo electrónico
                            <span className="ml-1 text-rose-600">*</span>
                        </label>

                        <div className="relative">
                            <Icon
                                name="mail"
                                className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={data.email}
                                onChange={(event) =>
                                    setData('email', event.target.value)
                                }
                                className={inputClass(Boolean(errors.email))}
                                required
                                autoComplete="email"
                                maxLength={150}
                                placeholder="usuario@instituto.edu.pe"
                                aria-invalid={Boolean(errors.email)}
                            />
                        </div>

                        <InputError
                            className="mt-2"
                            message={errors.email}
                        />
                    </div>
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-start gap-3">
                            <Icon
                                name="alert"
                                className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
                            />

                            <div>
                                <p className="text-sm font-semibold text-amber-800">
                                    Correo electrónico no verificado
                                </p>

                                <p className="mt-1 text-sm leading-6 text-amber-700">
                                    Su dirección de correo todavía no ha sido verificada.
                                </p>

                                <Link
                                    href={route('verification.send')}
                                    method="post"
                                    as="button"
                                    className="mt-2 inline-flex rounded-md text-sm font-semibold text-[#315d7a] underline underline-offset-2 hover:text-[#274c64] focus:outline-none focus:ring-4 focus:ring-[#dfeaf1]"
                                >
                                    Reenviar correo de verificación
                                </Link>

                                {status === 'verification-link-sent' && (
                                    <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                                        Se envió un nuevo enlace de verificación a su correo electrónico.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

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
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Icon name="save" className="h-4 w-4" />
                                Guardar cambios
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
                            Información actualizada correctamente.
                        </div>
                    </Transition>
                </div>
            </form>
        </section>
    );
}