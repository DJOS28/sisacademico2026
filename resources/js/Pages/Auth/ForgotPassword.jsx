import ApplicationLogo from '@/Components/ApplicationLogo';
import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';

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
        mail: (
            <>
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <path d="m4 7 8 6 8-6" />
            </>
        ),
        arrowLeft: (
            <>
                <path d="M19 12H5" />
                <path d="m11 18-6-6 6-6" />
            </>
        ),
        send: (
            <>
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
            </>
        ),
        shield: (
            <>
                <path d="M12 3 5 6v5c0 4.6 2.8 8.3 7 10 4.2-1.7 7-5.4 7-10V6l-7-3Z" />
                <path d="m9 12 2 2 4-4" />
            </>
        ),
        key: (
            <>
                <circle cx="8.5" cy="15.5" r="4.5" />
                <path d="m12 12 9-9" />
                <path d="m18 6 2 2" />
                <path d="m15 9 2 2" />
            </>
        ),
    };

    return <svg {...props}>{icons[name]}</svg>;
}

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (event) => {
        event.preventDefault();

        post(route('password.email'));
    };

    return (
        <>
            <Head title="Recuperar contraseña" />

            <div className="relative min-h-screen overflow-hidden bg-[#f5f7fb]">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-indigo-200/35 blur-3xl" />
                    <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-violet-200/35 blur-3xl" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#e8edf5_1px,transparent_1px),linear-gradient(to_bottom,#e8edf5_1px,transparent_1px)] bg-[size:42px_42px] opacity-40" />
                </div>

                <div className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
                    <div className="w-full max-w-5xl">
                        <div className="mb-6 flex justify-center lg:justify-start">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-3 rounded-2xl px-2 py-2 text-slate-700 transition hover:bg-white/70 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
                                    <ApplicationLogo className="h-7 w-7 fill-current text-indigo-600" />
                                </div>

                                <div>
                                    <p className="text-sm font-bold tracking-tight text-slate-900">
                                        Sistema Académico
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Plataforma de gestión institucional
                                    </p>
                                </div>
                            </Link>
                        </div>

                        <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_30px_90px_-28px_rgba(15,23,42,0.34)]">
                            <div className="grid min-h-[560px] lg:grid-cols-[0.95fr_1.05fr]">
                                <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.55),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.35),transparent_36%)]" />
                                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:46px_46px] opacity-20" />

                                    <div className="relative">
                                        <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-md">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-700 shadow-lg shadow-indigo-950/20">
                                                <Icon name="key" />
                                            </div>

                                            <div>
                                                <p className="text-sm font-semibold">
                                                    Recuperación de acceso
                                                </p>
                                                <p className="text-xs text-white/60">
                                                    Proceso seguro y verificado
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-16 max-w-lg">
                                            <span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                                                Restablece tu acceso
                                            </span>

                                            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
                                                Recupera tu contraseña de forma rápida y segura.
                                            </h1>

                                            <p className="mt-6 max-w-md text-base leading-7 text-slate-300">
                                                Te enviaremos un enlace de recuperación al correo asociado
                                                a tu cuenta para que puedas crear una nueva contraseña.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="relative rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-cyan-200">
                                                <Icon name="shield" />
                                            </div>

                                            <div>
                                                <p className="text-sm font-semibold text-white">
                                                    Tu información está protegida
                                                </p>
                                                <p className="mt-1 text-xs leading-5 text-slate-400">
                                                    El enlace de recuperación tendrá una vigencia limitada
                                                    y solo podrá utilizarse una vez.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="flex items-center bg-white px-6 py-10 sm:px-10 lg:px-14 xl:px-16">
                                    <div className="mx-auto w-full max-w-md">
                                        <div className="mb-8 lg:hidden">
                                            <div className="inline-flex items-center gap-3 rounded-2xl bg-indigo-50 px-4 py-3 text-indigo-700">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                                                    <Icon name="key" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">
                                                        Recuperar contraseña
                                                    </p>
                                                    <p className="text-xs text-indigo-500">
                                                        Acceso institucional
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-8">
                                            <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                                                Recuperación de cuenta
                                            </span>

                                            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                                                ¿Olvidaste tu contraseña?
                                            </h2>

                                            <p className="mt-3 text-sm leading-6 text-slate-500">
                                                Ingresa tu correo electrónico y te enviaremos un enlace
                                                para restablecerla.
                                            </p>
                                        </div>

                                        {status && (
                                            <div
                                                role="status"
                                                className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
                                            >
                                                {status}
                                            </div>
                                        )}

                                        <form onSubmit={submit} className="space-y-5">
                                            <div>
                                                <label
                                                    htmlFor="email"
                                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                                >
                                                    Correo electrónico
                                                </label>

                                                <div className="relative">
                                                    <Icon
                                                        name="mail"
                                                        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                                                    />

                                                    <input
                                                        id="email"
                                                        type="email"
                                                        name="email"
                                                        value={data.email}
                                                        className={[
                                                            'block w-full rounded-xl border bg-white py-3.5 pl-12 pr-4',
                                                            'text-sm font-medium text-slate-900 placeholder:font-normal placeholder:text-slate-400',
                                                            'shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-all duration-200',
                                                            errors.email
                                                                ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'
                                                                : 'border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100',
                                                        ].join(' ')}
                                                        autoComplete="email"
                                                        autoFocus
                                                        required
                                                        placeholder="nombre@institucion.edu.pe"
                                                        aria-invalid={Boolean(errors.email)}
                                                        onChange={(event) =>
                                                            setData('email', event.target.value)
                                                        }
                                                    />
                                                </div>

                                                <InputError message={errors.email} className="mt-2" />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {processing ? (
                                                    <>
                                                        <svg
                                                            className="h-5 w-5 animate-spin"
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
                                                        Enviando enlace...
                                                    </>
                                                ) : (
                                                    <>
                                                        Enviar enlace de recuperación
                                                        <Icon
                                                            name="send"
                                                            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                                                        />
                                                    </>
                                                )}
                                            </button>
                                        </form>

                                        <div className="mt-8 border-t border-slate-100 pt-6">
                                            <Link
                                                href={route('login')}
                                                className="mx-auto inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-indigo-700"
                                            >
                                                <Icon name="arrowLeft" className="h-4 w-4" />
                                                Volver al inicio de sesión
                                            </Link>

                                            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                                                <Icon name="shield" className="h-4 w-4" />
                                                <span>Proceso seguro y protegido</span>
                                            </div>

                                            <p className="mt-3 text-center text-xs text-slate-400">
                                                © {new Date().getFullYear()} Sistema Académico
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}