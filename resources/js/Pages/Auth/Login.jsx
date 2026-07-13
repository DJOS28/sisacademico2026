import InputError from '@/Components/InputError';
import { Head, useForm } from '@inertiajs/react';
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
                <path d="M4 21a8 8 0 0 1 16 0" />
            </>
        ),
        lock: (
            <>
                <rect x="4" y="10" width="16" height="11" rx="2.5" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
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
        shield: (
            <>
                <path d="M12 3 5 6v5c0 4.6 2.8 8.3 7 10 4.2-1.7 7-5.4 7-10V6l-7-3Z" />
                <path d="m9 12 2 2 4-4" />
            </>
        ),
        users: (
            <>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </>
        ),
        file: (
            <>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                <path d="M14 2v6h6" />
                <path d="M8 13h8" />
                <path d="M8 17h6" />
            </>
        ),
        calendar: (
            <>
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4" />
                <path d="M8 3v4" />
                <path d="M3 10h18" />
            </>
        ),
        academic: (
            <>
                <path d="m3 10 9-5 9 5-9 5-9-5Z" />
                <path d="M7 12.5V17c3 2 7 2 10 0v-4.5" />
                <path d="M21 10v6" />
            </>
        ),
        money: (
            <>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="12" cy="12" r="3" />
                <path d="M7 8h.01" />
                <path d="M17 16h.01" />
            </>
        ),
        arrow: (
            <>
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
            </>
        ),
    };

    return <svg {...props}>{icons[name]}</svg>;
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