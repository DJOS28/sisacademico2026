import { Head, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

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

export default function ForgotPasswordOtp({ step: stepProp = 1, usuario_id = null, otp_id = null, status = null }) {
    const { errors } = usePage().props;
    const [step, setStep] = useState(stepProp);
    const [showPassword, setShowPassword] = useState(false);

    // Formulario Paso 1
    const formPaso1 = useForm({ username: '' });
    // Formulario Paso 2
    const formPaso2 = useForm({ usuario_id: usuario_id ?? '', codigo: '' });
    // Formulario Paso 3
    const formPaso3 = useForm({ usuario_id: usuario_id ?? '', otp_id: otp_id ?? '', password: '', password_confirmation: '' });

    useEffect(() => {
        if (stepProp) {
            setStep(stepProp);
        }
        if (usuario_id) {
            formPaso2.setData('usuario_id', usuario_id);
            formPaso3.setData('usuario_id', usuario_id);
        }
        if (otp_id) {
            formPaso3.setData('otp_id', otp_id);
        }
    }, [stepProp, usuario_id, otp_id]);

    const submitPaso1 = (e) => {
        e.preventDefault();
        formPaso1.post(route('password.otp.send'), {
            preserveScroll: true,
        });
    };

    const submitPaso2 = (e) => {
        e.preventDefault();
        formPaso2.post(route('password.otp.verify'), {
            preserveScroll: true,
        });
    };

    const submitPaso3 = (e) => {
        e.preventDefault();
        formPaso3.post(route('password.otp.reset'), {
            preserveScroll: true,
        });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
            <Head title="Recuperar Contraseña" />

            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl space-y-6">
                <div className="text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#eaf1f6] text-[#315d7a]">
                        <Icon name="key" className="h-6 w-6" />
                    </div>
                    <h1 className="text-xl font-black text-[#315d7a]">Recuperación de Contraseña</h1>
                    <p className="mt-1 text-xs text-slate-500">
                        {step === 1 && 'Ingresa tu nombre de usuario registrado.'}
                        {step === 2 && 'Ingresa el código de 6 dígitos enviado a tu correo.'}
                        {step === 3 && 'Crea tu nueva contraseña de acceso.'}
                    </p>
                </div>

                {status && (
                    <div className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200 text-center">
                        {status}
                    </div>
                )}

                {/* PASO 1: USERNAME */}
                {step === 1 && (
                    <form onSubmit={submitPaso1} className="space-y-4">
                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Nombre de Usuario *</label>
                            <div className="relative">
                                <Icon name="user" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={formPaso1.data.username}
                                    onChange={(e) => formPaso1.setData('username', e.target.value)}
                                    placeholder="Ej. 47856213 o admin"
                                    className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-xs outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]"
                                    required
                                    autoFocus
                                />
                            </div>
                            {errors.username && <p className="mt-1 text-xs font-bold text-rose-600">{errors.username}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={formPaso1.processing}
                            className="w-full rounded-xl bg-[#315d7a] py-3 text-xs font-bold text-white hover:bg-[#274c64] transition shadow-xs cursor-pointer disabled:opacity-50"
                        >
                            {formPaso1.processing ? 'Enviando Código...' : 'Enviar Código al Correo'}
                        </button>
                    </form>
                )}

                {/* PASO 2: CÓDIGO OTP */}
                {step === 2 && (
                    <form onSubmit={submitPaso2} className="space-y-4">
                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Código de 6 Dígitos *</label>
                            <input
                                type="text"
                                maxLength={6}
                                value={formPaso2.data.codigo}
                                onChange={(e) => formPaso2.setData('codigo', e.target.value)}
                                placeholder="123456"
                                className="w-full text-center text-xl font-black tracking-widest rounded-xl border border-slate-300 p-3 outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]"
                                required
                                autoFocus
                            />
                            {errors.codigo && <p className="mt-1 text-xs font-bold text-rose-600">{errors.codigo}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={formPaso2.processing}
                            className="w-full rounded-xl bg-[#315d7a] py-3 text-xs font-bold text-white hover:bg-[#274c64] transition shadow-xs cursor-pointer disabled:opacity-50"
                        >
                            {formPaso2.processing ? 'Verificando...' : 'Validar Código'}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="w-full text-center text-xs font-bold text-slate-500 hover:underline cursor-pointer"
                        >
                            ← Volver
                        </button>
                    </form>
                )}

                {/* PASO 3: NUEVA CLAVE */}
                {step === 3 && (
                    <form onSubmit={submitPaso3} className="space-y-4">
                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Nueva Contraseña *</label>
                            <div className="relative">
                                <Icon name="lock" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formPaso3.data.password}
                                    onChange={(e) => formPaso3.setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-10 text-xs outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <Icon name={showPassword ? 'eye-off' : 'eye'} className="h-4 w-4" />
                                </button>
                            </div>
                            {errors.password && <p className="mt-1 text-xs font-bold text-rose-600">{errors.password}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Confirmar Contraseña *</label>
                            <div className="relative">
                                <Icon name="lock" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formPaso3.data.password_confirmation}
                                    onChange={(e) => formPaso3.setData('password_confirmation', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-xs outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={formPaso3.processing}
                            className="w-full rounded-xl bg-emerald-700 py-3 text-xs font-bold text-white hover:bg-emerald-800 transition shadow-xs cursor-pointer disabled:opacity-50"
                        >
                            {formPaso3.processing ? 'Guardando...' : 'Cambiar Contraseña'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}