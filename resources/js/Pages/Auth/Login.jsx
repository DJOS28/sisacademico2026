import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

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
                <path d="M20 21 a8 8 0 0 0 -16 0" />
            </>
        ),
        lock: (
            <>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11 V7 a5 5 0 0 1 10 0 v4" />
            </>
        ),
        eye: (
            <>
                <path d="M1 12 s4 -8 11 -8 11 8 11 8 -4 8 -11 8 -11 -8 -11 -8 z" />
                <circle cx="12" cy="12" r="3" />
            </>
        ),
        'eye-off': (
            <>
                <path d="M17.94 17.94 A10.07 10.07 0 0 1 12 20 c-7 0 -11 -8 -11 -8 a18.45 18.45 0 0 1 5.06 -5.94 M9.9 4.24 A9.12 9.12 0 0 1 12 4 c7 0 11 8 11 8 a18.5 18.45 0 0 1 -2.16 3.19 m-6.72 -1.07 a3 3 0 1 1 -4.24 -4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
            </>
        ),
        shield: (
            <>
                <path d="M12 22 s8 -4 8 -10 V5 l-8 -3 -8 3 v7 c0 6 8 10 8 10 z" />
                <path d="M9 12 l2 2 4 -4" />
            </>
        ),
        users: (
            <>
                <path d="M17 21 v-2 a4 4 0 0 0 -4 -4 H5 a4 4 0 0 0 -4 4 v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21 v-2 a4 4 0 0 0 -3 -3.87" />
                <path d="M16 3.13 a4 4 0 0 1 0 7.75" />
            </>
        ),
        file: (
            <>
                <path d="M14 2 H6 a2 2 0 0 0 -2 2 v16 a2 2 0 0 0 2 2 h12 a2 2 0 0 0 2 -2 V8 Z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
            </>
        ),
        calendar: (
            <>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </>
        ),
        academic: (
            <>
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </>
        ),
        money: (
            <>
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <circle cx="12" cy="12" r="2" />
                <path d="M6 12h.01M18 12h.01" />
            </>
        ),
        arrow: (
            <>
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
            </>
        ),
        key: (
            <>
                <circle cx="7.5" cy="15.5" r="4.5" />
                <path d="M21 2 L11.4 11.6" />
                <path d="M15.5 7.5 L18.5 10.5" />
            </>
        ),
    };

    return <svg {...props}>{icons[name] || icons.shield}</svg>;
}

const modules = [
    { icon: 'users', label: 'Gestión de usuarios y accesos' },
    { icon: 'file', label: 'Admisión y postulantes' },
    { icon: 'calendar', label: 'Matrícula académica' },
    { icon: 'academic', label: 'Cursos, horarios y asistencia' },
    { icon: 'shield', label: 'Evaluaciones y seguimiento' },
    { icon: 'money', label: 'Caja, pagos y trámites' },
];

export default function Login({ status, instituto = null }) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        password: '',
    });

    const nombreInstituto =
        instituto?.nombre || 'Sistema de Gestión Académica';

    const descripcionInstituto =
        instituto?.descripcion ||
        'Plataforma institucional para la gestión académica y administrativa.';

    const submit = (event) => {
        event.preventDefault();

        post(route('login'), {
            preserveScroll: true,
            onFinish: () => reset('password'),
        });
    };

    const inputClass = (hasError) =>
        [
            'block w-full rounded-lg border bg-white py-3.5 pl-11 pr-4',
            'text-sm text-slate-900 placeholder:text-slate-400',
            'shadow-sm outline-none transition duration-200',
            hasError
                ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'
                : 'border-slate-300 hover:border-slate-400 focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]',
        ].join(' ');

    return (
        <>
            <Head title="Iniciar sesión" />

            <div className="min-h-screen bg-[#f4f6f8] px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
                    <div className="w-full overflow-hidden rounded-2xl border border-[#dce3ea] bg-white shadow-[0_18px_50px_rgba(31,41,55,0.08)]">
                        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
                            <section className="border-b border-[#dce3ea] bg-[#f8fafc] px-6 py-8 sm:px-10 lg:border-b-0 lg:border-r lg:px-12 lg:py-12">
                                <div className="mx-auto max-w-xl">
                                    {instituto?.logo && (
                                        <div className="mb-8">
                                            <img
                                                src={instituto.logo}
                                                alt={nombreInstituto}
                                                className="h-20 w-auto max-w-[240px] object-contain"
                                            />
                                        </div>
                                    )}

                                    <div className="mb-8">
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#3b6d8c]">
                                            Información institucional
                                        </p>

                                        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                            {nombreInstituto}
                                        </h1>

                                        <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">
                                            {descripcionInstituto}
                                        </p>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                                        {modules.map((item) => (
                                            <div
                                                key={item.label}
                                                className="flex items-center gap-3 rounded-xl border border-[#dce3ea] bg-white px-4 py-3"
                                            >
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eaf1f6] text-[#315d7a]">
                                                    <Icon name={item.icon} className="h-4.5 w-4.5" />
                                                </div>

                                                <span className="text-sm font-medium text-slate-700">
                                                    {item.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-8 rounded-xl border border-[#dce3ea] bg-[#eef3f7] p-4">
                                        <div className="flex items-start gap-3">
                                            <Icon
                                                name="shield"
                                                className="mt-0.5 h-5 w-5 shrink-0 text-[#315d7a]"
                                            />
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">
                                                    Uso exclusivo de personal autorizado
                                                </p>
                                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                                    Toda actividad realizada en la plataforma puede ser registrada
                                                    para fines de seguridad y auditoría institucional.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {(instituto?.direccion || instituto?.telefono) && (
                                        <div className="mt-6 text-xs leading-5 text-slate-500">
                                            {instituto?.direccion && (
                                                <p>{instituto.direccion}</p>
                                            )}
                                            {instituto?.telefono && (
                                                <p>Teléfono: {instituto.telefono}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section className="flex items-center bg-white px-6 py-10 sm:px-10 lg:px-12">
                                <div className="mx-auto w-full max-w-md">
                                    <div className="mb-8">
                                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#eaf1f6] text-[#315d7a]">
                                            <Icon name="shield" className="h-6 w-6" />
                                        </div>

                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#3b6d8c]">
                                            Acceso al sistema
                                        </p>

                                        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                                            Iniciar sesión
                                        </h2>

                                        <p className="mt-3 text-sm leading-6 text-slate-500">
                                            Ingresa tu nombre de usuario y contraseña para continuar.
                                        </p>
                                    </div>

                                    {status && (
                                        <div
                                            role="status"
                                            className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
                                        >
                                            {status}
                                        </div>
                                    )}

                                    <form onSubmit={submit} className="space-y-5">
                                        <div>
                                            <label
                                                htmlFor="username"
                                                className="mb-2 block text-sm font-semibold text-slate-700"
                                            >
                                                Nombre de usuario
                                            </label>

                                            <div className="relative">
                                                <Icon
                                                    name="user"
                                                    className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                                                />

                                                <input
                                                    id="username"
                                                    type="text"
                                                    name="username"
                                                    value={data.username}
                                                    className={inputClass(Boolean(errors.username))}
                                                    autoComplete="username"
                                                    autoFocus
                                                    required
                                                    maxLength={50}
                                                    placeholder="Ingrese su usuario"
                                                    aria-invalid={Boolean(errors.username)}
                                                    onChange={(event) =>
                                                        setData('username', event.target.value)
                                                    }
                                                />
                                            </div>

                                            <InputError
                                                message={errors.username}
                                                className="mt-2"
                                            />
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="password"
                                                className="mb-2 block text-sm font-semibold text-slate-700"
                                            >
                                                Contraseña
                                            </label>

                                            <div className="relative">
                                                <Icon
                                                    name="lock"
                                                    className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                                                />

                                                <input
                                                    id="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    name="password"
                                                    value={data.password}
                                                    className={`${inputClass(
                                                        Boolean(errors.password),
                                                    )} pr-12`}
                                                    autoComplete="current-password"
                                                    required
                                                    placeholder="Ingrese su contraseña"
                                                    aria-invalid={Boolean(errors.password)}
                                                    onChange={(event) =>
                                                        setData('password', event.target.value)
                                                    }
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowPassword((current) => !current)
                                                    }
                                                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#dfeaf1]"
                                                    aria-label={
                                                        showPassword
                                                            ? 'Ocultar contraseña'
                                                            : 'Mostrar contraseña'
                                                    }
                                                    aria-pressed={showPassword}
                                                >
                                                    <Icon
                                                        name={showPassword ? 'eye-off' : 'eye'}
                                                    />
                                                </button>
                                            </div>

                                            <InputError
                                                message={errors.password}
                                                className="mt-2"
                                            />
                                        </div>

                                        {/* ENLACE PARA RECUPERAR CONTRASEÑA */}
                                        <div className="flex items-center justify-end pt-1">
                                            <Link
                                                href={route('password.otp.show')}
                                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#315d7a] transition hover:text-[#274c64] hover:underline focus:outline-none focus:ring-2 focus:ring-[#315d7a] focus:ring-offset-1 rounded-sm"
                                            >
                                                <Icon name="key" className="h-3.5 w-3.5" />
                                                ¿Olvidaste tu contraseña?
                                            </Link>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="group flex w-full items-center justify-center gap-2 rounded-lg bg-[#315d7a] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-[#274c64] focus:outline-none focus:ring-4 focus:ring-[#dfeaf1] disabled:cursor-not-allowed disabled:opacity-60"
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
                                                    Validando acceso...
                                                </>
                                            ) : (
                                                <>
                                                    Ingresar al sistema
                                                    <Icon
                                                        name="arrow"
                                                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                                                    />
                                                </>
                                            )}
                                        </button>
                                    </form>

                                    <div className="mt-8 border-t border-slate-200 pt-6 text-center">
                                        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                                            <Icon
                                                name="shield"
                                                className="h-4 w-4 text-[#315d7a]"
                                            />
                                            <span>Conexión segura y acceso protegido</span>
                                        </div>

                                        <p className="mt-3 text-xs text-slate-400">
                                            © {new Date().getFullYear()} {nombreInstituto}
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}