import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useMemo, useRef, useState, useEffect } from 'react';

export default function Create({
    colegios = [],
    mediosPago = [],
    generos = [],
    lenguasMaternas = [],
    fuentesInscripcion = [],
}) {
    const [buscandoDni, setBuscandoDni] = useState(false);
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [mostrarPasswordConf, setMostrarPasswordConf] = useState(false);

    const {
        data,
        setData,
        post,
        processing,
        errors,
        clearErrors,
    } = useForm({
        codigo_postulante: '',
        dni: '',
        nombres: '',
        apellidos: '',
        email: '',
        telefono: '',
        genero: '',
        fecha_nacimiento: '',
        lengua_materna: '',
        direccion: '',
        id_colegio: '',
        año_egreso: '',
        discapacidad: false,
        nombre_discapacidad: '',
        id_medio_pago: '',
        fuente_inscripcion: '',
        grado: 'Estudiante', 
        username: '',
        password: '',
        password_confirmation: '',
        foto_postulante: null,
        certificado_estudios: null,
        partida_nacimiento: null,
        comprobante_pago: null,
        copia_dni: null,
        curriculum_archivo: null,
    });

    // Validación de requisitos de seguridad de contraseña para Moodle
    const requisitosMoodle = useMemo(() => {
        const pass = data.password || '';
        return {
            minimo: pass.length >= 8,
            mayuscula: /[A-Z]/.test(pass),
            minuscula: /[a-z]/.test(pass),
            numero: /[0-9]/.test(pass),
            especial: /[^a-zA-Z0-9]/.test(pass),
        };
    }, [data.password]);

    const esPasswordValidaMoodle = useMemo(() => {
        return Object.values(requisitosMoodle).every(Boolean);
    }, [requisitosMoodle]);

    const obtenerInputClass = (hasError) =>
        `w-full rounded-lg border px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:ring-2 ${
            hasError
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/10'
                : 'border-slate-300 focus:border-[#315d7a] focus:ring-[#315d7a]/20'
        } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500`;

    const obtenerNombreMedioPago = (medio) =>
        medio.nombre ?? medio.tipo_pago ?? medio.descripcion ?? `Medio ${medio.id_tipo_pago}`;

    const cambiarArchivo = (campo, archivo) => {
        setData(campo, archivo ?? null);
        clearErrors(campo);
    };

    const cambiarDiscapacidad = (valor) => {
        setData('discapacidad', valor);
        if (!valor) {
            setData('nombre_discapacidad', '');
            clearErrors('nombre_discapacidad');
        }
    };

    const normalizarUsuario = (valor) =>
        String(valor ?? '')
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[^a-z0-9._-]/g, '')
            .slice(0, 100);

    const filtrarSoloLetras = (valor) => {
        return valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
    };

    const consultarReniecDni = async (dniConsultar) => {
        const dniLimpio = String(dniConsultar || data.dni || '').trim();

        if (dniLimpio.length !== 8) {
            Swal.fire('Atención', 'Ingrese un DNI válido de 8 dígitos.', 'warning');
            return;
        }

        setBuscandoDni(true);

        try {
            const response = await axios.post(
                route('estudiantes.consultar.dni'),
                { dni: dniLimpio },
                { headers: { Accept: 'application/json' } }
            );

            if (response.data.success) {
                const { nombres, apellidos, direccion } = response.data;
                const passwordSugerida = `${dniLimpio}@Est2026`;

                setData((prev) => ({
                    ...prev,
                    nombres: nombres || prev.nombres,
                    apellidos: apellidos || prev.apellidos,
                    direccion: direccion || prev.direccion,
                    username: prev.username || dniLimpio,
                    password: prev.password || passwordSugerida,
                    password_confirmation: prev.password_confirmation || passwordSugerida,
                    email: prev.email || `${dniLimpio}@instituto.edu.pe`,
                }));

                clearErrors('nombres', 'apellidos', 'dni', 'username', 'password', 'password_confirmation');

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

    const handleDniChange = (val) => {
        const dniValue = val.replace(/\D/g, '').slice(0, 8);
        setData('dni', dniValue);

        if (dniValue.length === 8) {
            consultarReniecDni(dniValue);
        }
    };

    const validarAntesDeEnviar = async () => {
        if (data.dni.length !== 8) {
            await Swal.fire('DNI no válido', 'El DNI debe contener exactamente 8 dígitos.', 'warning');
            return false;
        }
        if (!data.nombres.trim()) {
            await Swal.fire('Nombres requeridos', 'Debe ingresar los nombres del estudiante.', 'warning');
            return false;
        }
        if (!data.apellidos.trim()) {
            await Swal.fire('Apellidos requeridos', 'Debe ingresar los apellidos del estudiante.', 'warning');
            return false;
        }
        if (!data.username.trim()) {
            await Swal.fire('Usuario requerido', 'Debe ingresar el nombre de usuario de acceso.', 'warning');
            return false;
        }
        if (!esPasswordValidaMoodle) {
            await Swal.fire(
                'Contraseña no cumple requisitos de Moodle',
                'La contraseña debe tener mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un caracter especial (ej. @Doc2026).',
                'warning'
            );
            return false;
        }
        if (data.password !== data.password_confirmation) {
            await Swal.fire('Contraseñas no coinciden', 'La contraseña y su confirmación deben ser iguales.', 'warning');
            return false;
        }
        return true;
    };

    const submit = async (event) => {
        event.preventDefault();

        const formularioValido = await validarAntesDeEnviar();
        if (!formularioValido) return;

        const confirmacion = await Swal.fire({
            title: '¿Registrar estudiante?',
            html: `
                <div style="text-align:left; line-height:1.7;">
                    <p><strong>Estudiante:</strong> ${data.nombres.trim()} ${data.apellidos.trim()}</p>
                    <p><strong>DNI:</strong> ${data.dni.trim()}</p>
                    <p><strong>Usuario:</strong> ${data.username.trim()}</p>
                    <p><strong>Condición:</strong> Estudiante</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, registrar',
            cancelButtonText: 'Revisar',
            confirmButtonColor: '#315d7a',
            cancelButtonColor: '#64748b',
            reverseButtons: true,
        });

        if (!confirmacion.isConfirmed) return;

        post(route('estudiantes.store'), {
            forceFormData: true,
            preserveScroll: true,
            onStart: () => {
                Swal.fire({
                    title: 'Registrando estudiante y sincronizando con Moodle...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading(),
                });
            },
            onSuccess: () => Swal.close(),
            onError: (errores) => {
                const primerError = Object.values(errores ?? {})[0];
                Swal.fire('Revise el formulario', primerError ?? 'Existen campos incorrectos.', 'warning');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Nuevo estudiante</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Registre los datos del estudiante de forma individual y configure sus accesos institucionales.
                    </p>
                </div>
            }
        >
            <Head title="Nuevo estudiante" />

            <form onSubmit={submit} className="w-full space-y-6" encType="multipart/form-data">
                {/* SECCIÓN 1: DATOS PERSONALES */}
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-lg font-bold text-slate-900">Datos personales</h2>
                        <p className="mt-1 text-sm text-slate-500">Información básica y de contacto del estudiante.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        <CampoTexto
                            id="codigo_postulante"
                            label="Código"
                            value={data.codigo_postulante}
                            onChange={(val) => setData('codigo_postulante', val)}
                            error={errors.codigo_postulante}
                            disabled={processing}
                            placeholder="Código del estudiante"
                            className={obtenerInputClass}
                        />

                        {/* DNI CON BOTÓN RENIEC */}
                        <div>
                            <label htmlFor="dni" className="mb-2 block text-sm font-semibold text-slate-700">
                                DNI <span className="ml-1 text-rose-500">*</span>
                            </label>
                            <div className="relative flex items-center">
                                <input
                                    id="dni"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={8}
                                    value={data.dni}
                                    onChange={(e) => handleDniChange(e.target.value)}
                                    disabled={processing}
                                    placeholder="8 dígitos"
                                    className={`${obtenerInputClass(!!errors.dni)} pr-24 font-mono`}
                                />
                                <button
                                    type="button"
                                    disabled={buscandoDni || data.dni.length !== 8 || processing}
                                    onClick={() => consultarReniecDni(data.dni)}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-[#315d7a] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#274b63] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-xs"
                                >
                                    {buscandoDni ? 'Buscando...' : '🔍 RENIEC'}
                                </button>
                            </div>
                            {errors.dni && <p className="mt-1 text-sm text-rose-600">{errors.dni}</p>}
                        </div>

                        <CampoTexto
                            id="nombres"
                            label="Nombres"
                            required
                            value={data.nombres}
                            onChange={(val) => setData('nombres', filtrarSoloLetras(val))}
                            error={errors.nombres}
                            disabled={processing}
                            placeholder="Ingrese los nombres"
                            className={obtenerInputClass}
                        />

                        <CampoTexto
                            id="apellidos"
                            label="Apellidos"
                            required
                            value={data.apellidos}
                            onChange={(val) => setData('apellidos', filtrarSoloLetras(val))}
                            error={errors.apellidos}
                            disabled={processing}
                            placeholder="Ingrese los apellidos"
                            className={obtenerInputClass}
                        />

                        <CampoTexto
                            id="email"
                            label="Correo electrónico"
                            type="email"
                            value={data.email}
                            onChange={(val) => setData('email', val)}
                            error={errors.email}
                            disabled={processing}
                            placeholder="correo@ejemplo.com"
                            className={obtenerInputClass}
                        />

                        <CampoTexto
                            id="telefono"
                            label="Teléfono"
                            value={data.telefono}
                            onChange={(val) => setData('telefono', val.replace(/\D/g, '').slice(0, 15))}
                            error={errors.telefono}
                            disabled={processing}
                            placeholder="Solo números"
                            inputMode="numeric"
                            maxLength={15}
                            className={obtenerInputClass}
                        />

                        <CampoSelect
                            id="genero"
                            label="Género"
                            value={data.genero}
                            onChange={(val) => setData('genero', val)}
                            error={errors.genero}
                            disabled={processing}
                            className={obtenerInputClass}
                        >
                            <option value="">Seleccione</option>
                            {generos.map((g) => <option key={g} value={g}>{g}</option>)}
                        </CampoSelect>

                        <CampoTexto
                            id="fecha_nacimiento"
                            label="Fecha de nacimiento"
                            type="date"
                            value={data.fecha_nacimiento}
                            onChange={(val) => setData('fecha_nacimiento', val)}
                            error={errors.fecha_nacimiento}
                            disabled={processing}
                            className={obtenerInputClass}
                        />

                        <CampoSelect
                            id="lengua_materna"
                            label="Lengua materna"
                            value={data.lengua_materna}
                            onChange={(val) => setData('lengua_materna', val)}
                            error={errors.lengua_materna}
                            disabled={processing}
                            className={obtenerInputClass}
                        >
                            <option value="">Seleccione</option>
                            {lenguasMaternas.map((l) => <option key={l} value={l}>{l}</option>)}
                        </CampoSelect>

                        <div className="md:col-span-2 xl:col-span-3">
                            <label htmlFor="direccion" className="mb-2 block text-sm font-semibold text-slate-700"> Dirección </label>
                            <textarea
                                id="direccion"
                                rows={3}
                                value={data.direccion}
                                onChange={(e) => setData('direccion', e.target.value)}
                                disabled={processing}
                                maxLength={100}
                                placeholder="Ingrese la dirección"
                                className={obtenerInputClass(!!errors.direccion)}
                            />
                            {errors.direccion && <p className="mt-1 text-sm text-rose-600">{errors.direccion}</p>}
                        </div>
                    </div>
                </section>

                {/* SECCIÓN 2: ACCESO AL SISTEMA Y MOODLE (CON VER CLAVE Y REQUISITOS) */}
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-lg font-bold text-slate-900">Acceso al sistema y Moodle</h2>
                        <p className="mt-1 text-sm text-slate-500">Credenciales sincronizadas automáticamente con el Aula Virtual.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                        <CampoTexto
                            id="username"
                            label="Nombre de usuario"
                            required
                            value={data.username}
                            onChange={(val) => setData('username', normalizarUsuario(val))}
                            error={errors.username}
                            disabled={processing}
                            placeholder="Ejemplo: 78154961"
                            maxLength={100}
                            autoComplete="username"
                            className={obtenerInputClass}
                        />

                        {/* CONTRASEÑA CON BOTÓN VER/OCULTAR */}
                        <div>
                            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                                Contraseña <span className="ml-1 text-rose-500">*</span>
                            </label>
                            <div className="relative flex items-center">
                                <input
                                    id="password"
                                    type={mostrarPassword ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    disabled={processing}
                                    placeholder="Ej. 78154961@Est2026"
                                    autoComplete="new-password"
                                    className={`${obtenerInputClass(!!errors.password)} pr-11 font-mono text-sm`}
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setMostrarPassword(!mostrarPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                                    title={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                >
                                    {mostrarPassword ? (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {errors.password && <p className="mt-1 text-sm text-rose-600">{errors.password}</p>}
                        </div>

                        {/* CONFIRMAR CONTRASEÑA */}
                        <div>
                            <label htmlFor="password_confirmation" className="mb-2 block text-sm font-semibold text-slate-700">
                                Confirmar contraseña <span className="ml-1 text-rose-500">*</span>
                            </label>
                            <div className="relative flex items-center">
                                <input
                                    id="password_confirmation"
                                    type={mostrarPasswordConf ? 'text' : 'password'}
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    disabled={processing}
                                    placeholder="Repita la contraseña"
                                    autoComplete="new-password"
                                    className={`${obtenerInputClass(!!errors.password_confirmation)} pr-11 font-mono text-sm`}
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setMostrarPasswordConf(!mostrarPasswordConf)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                                    title={mostrarPasswordConf ? 'Ocultar contraseña' : 'Ver contraseña'}
                                >
                                    {mostrarPasswordConf ? (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {errors.password_confirmation && <p className="mt-1 text-sm text-rose-600">{errors.password_confirmation}</p>}
                        </div>
                    </div>

                    {/* PANEL DE REQUISITOS MOODLE EN TIEMPO REAL */}
                    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs">
                        <p className="font-semibold text-slate-700 mb-1.5">
                            Requisitos obligatorios de la contraseña para Moodle:
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                            <span className={`inline-flex items-center gap-1 ${requisitosMoodle.minimo ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                                {requisitosMoodle.minimo ? '✓' : '○'} Mínimo 8 dígitos
                            </span>
                            <span className={`inline-flex items-center gap-1 ${requisitosMoodle.mayuscula ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                                {requisitosMoodle.mayuscula ? '✓' : '○'} 1 Mayúscula (A-Z)
                            </span>
                            <span className={`inline-flex items-center gap-1 ${requisitosMoodle.minuscula ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                                {requisitosMoodle.minuscula ? '✓' : '○'} 1 Minúscula (a-z)
                            </span>
                            <span className={`inline-flex items-center gap-1 ${requisitosMoodle.numero ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                                {requisitosMoodle.numero ? '✓' : '○'} 1 Número (0-9)
                            </span>
                            <span className={`inline-flex items-center gap-1 ${requisitosMoodle.especial ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                                {requisitosMoodle.especial ? '✓' : '○'} 1 Especial (@, #, *)
                            </span>
                        </div>
                    </div>
                </section>

                {/* SECCIÓN 3: INFORMACIÓN ACADÉMICA CON SELECT2 */}
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-lg font-bold text-slate-900">Información académica</h2>
                        <p className="mt-1 text-sm text-slate-500">Detalles de procedencia de la institución educativa.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        <div>
                            <label htmlFor="grado_display" className="mb-2 block text-sm font-semibold text-slate-700">Condición</label>
                            <input
                                id="grado_display"
                                type="text"
                                value="Estudiante"
                                disabled
                                className={obtenerInputClass(false)}
                            />
                            <p className="mt-1 text-xs text-slate-500">La condición se asigna automáticamente al guardar.</p>
                        </div>

                        <Select2Colegios
                            colegios={colegios}
                            value={data.id_colegio}
                            onChange={(val) => setData('id_colegio', val)}
                            error={errors.id_colegio}
                            disabled={processing}
                        />

                        <CampoTexto
                            id="año_egreso"
                            label="Año de egreso"
                            value={data.año_egreso}
                            onChange={(val) => setData('año_egreso', val.replace(/\D/g, '').slice(0, 4))}
                            error={errors.año_egreso}
                            disabled={processing}
                            placeholder="Ejemplo: 2025"
                            inputMode="numeric"
                            maxLength={4}
                            className={obtenerInputClass}
                        />

                        <CampoSelect
                            id="fuente_inscripcion"
                            label="Fuente de inscripción"
                            value={data.fuente_inscripcion}
                            onChange={(val) => setData('fuente_inscripcion', val)}
                            error={errors.fuente_inscripcion}
                            disabled={processing}
                            className={obtenerInputClass}
                        >
                            <option value="">Seleccione</option>
                            {fuentesInscripcion.map((f) => <option key={f} value={f}>{f}</option>)}
                        </CampoSelect>

                        <CampoSelect
                            id="id_medio_pago"
                            label="Medio de pago"
                            value={data.id_medio_pago}
                            onChange={(val) => setData('id_medio_pago', val)}
                            error={errors.id_medio_pago}
                            disabled={processing}
                            className={obtenerInputClass}
                        >
                            <option value="">Seleccione</option>
                            {mediosPago.map((m) => (
                                <option key={m.id_tipo_pago} value={m.id_tipo_pago}>
                                    {obtenerNombreMedioPago(m)}
                                </option>
                            ))}
                        </CampoSelect>
                    </div>
                </section>

                {/* SECCIÓN 4: DISCAPACIDAD */}
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-lg font-bold text-slate-900">Discapacidad</h2>
                        <p className="mt-1 text-sm text-slate-500">Indicar solo bajo justificación formal.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <CampoSelect
                            id="discapacidad"
                            label="¿Presenta discapacidad?"
                            required
                            value={data.discapacidad ? '1' : '0'}
                            onChange={(val) => cambiarDiscapacidad(val === '1')}
                            error={errors.discapacidad}
                            disabled={processing}
                            className={obtenerInputClass}
                        >
                            <option value="0">No</option>
                            <option value="1">Sí</option>
                        </CampoSelect>

                        {data.discapacidad && (
                            <CampoTexto
                                id="nombre_discapacidad"
                                label="Tipo de discapacidad"
                                required
                                value={data.nombre_discapacidad}
                                onChange={(val) => setData('nombre_discapacidad', filtrarSoloLetras(val))}
                                error={errors.nombre_discapacidad}
                                disabled={processing}
                                placeholder="Indique la discapacidad"
                                className={obtenerInputClass}
                            />
                        )}
                    </div>
                </section>

                {/* SECCIÓN 5: DOCUMENTOS */}
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-lg font-bold text-slate-900">Fotografía y documentos</h2>
                        <p className="mt-1 text-sm text-slate-500">Formatos permitidos: PDF, JPG, PNG o DOCX dependiendo del campo.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        <CampoArchivo id="foto_postulante" label="Fotografía" accept=".jpg,.jpeg,.png,.webp" error={errors.foto_postulante} disabled={processing} onChange={(f) => cambiarArchivo('foto_postulante', f)} />
                        <CampoArchivo id="copia_dni" label="Copia de DNI" accept=".pdf,.jpg,.jpeg,.png" error={errors.copia_dni} disabled={processing} onChange={(f) => cambiarArchivo('copia_dni', f)} />
                        <CampoArchivo id="certificado_estudios" label="Certificado de estudios" accept=".pdf,.jpg,.jpeg,.png" error={errors.certificado_estudios} disabled={processing} onChange={(f) => cambiarArchivo('certificado_estudios', f)} />
                        <CampoArchivo id="partida_nacimiento" label="Partida de nacimiento" accept=".pdf,.jpg,.jpeg,.png" error={errors.partida_nacimiento} disabled={processing} onChange={(f) => cambiarArchivo('partida_nacimiento', f)} />
                        <CampoArchivo id="comprobante_pago" label="Comprobante de pago" accept=".pdf,.jpg,.jpeg,.png" error={errors.comprobante_pago} disabled={processing} onChange={(f) => cambiarArchivo('comprobante_pago', f)} />
                        <CampoArchivo id="curriculum_archivo" label="Currículum" accept=".pdf,.doc,.docx" error={errors.curriculum_archivo} disabled={processing} onChange={(f) => cambiarArchivo('curriculum_archivo', f)} />
                    </div>
                </section>

                {/* BOTONES DE ACCIÓN */}
                <div className="flex flex-wrap justify-end gap-3">
                    <Link
                        href={route('estudiantes.index')}
                        className="flex h-[42px] items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                        Cancelar
                    </Link>

                    <button
                        type="submit"
                        disabled={processing}
                        className="flex h-[42px] items-center justify-center rounded-lg bg-[#315d7a] px-5 text-sm font-semibold text-white transition hover:bg-[#274b63] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer shadow-sm"
                    >
                        {processing ? 'Registrando...' : 'Registrar estudiante'}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

function Select2Colegios({ colegios = [], value, onChange, error, disabled }) {
    const [abierto, setAbierto] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const contenedorRef = useRef(null);
    const inputBusquedaRef = useRef(null);

    const colegiosNormalizados = useMemo(() => {
        return colegios.map((c) => ({
            id: c.id_colegio,
            nombre: c.nombre ?? c.nombre_colegio ?? c.descripcion ?? `Colegio ${c.id_colegio}`,
        }));
    }, [colegios]);

    const colegioSeleccionado = useMemo(() => {
        return colegiosNormalizados.find((c) => String(c.id) === String(value));
    }, [colegiosNormalizados, value]);

    const colegiosFiltrados = useMemo(() => {
        if (!busqueda.trim()) return colegiosNormalizados.slice(0, 100);
        const query = busqueda.toLowerCase();
        return colegiosNormalizados
            .filter((c) => c.nombre.toLowerCase().includes(query))
            .slice(0, 100);
    }, [colegiosNormalizados, busqueda]);

    useEffect(() => {
        const handleClickFuera = (e) => {
            if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
                setAbierto(false);
            }
        };
        document.addEventListener('mousedown', handleClickFuera);
        return () => document.removeEventListener('mousedown', handleClickFuera);
    }, []);

    useEffect(() => {
        if (abierto && inputBusquedaRef.current) {
            inputBusquedaRef.current.focus();
        }
    }, [abierto]);

    return (
        <div ref={contenedorRef} className="relative">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
                Colegio de procedencia
            </label>

            <button
                type="button"
                disabled={disabled}
                onClick={() => setAbierto(!abierto)}
                className={`flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2.5 text-left text-sm transition focus:ring-2 ${
                    error
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-[#315d7a] focus:ring-[#315d7a]/20'
                } disabled:cursor-not-allowed disabled:bg-slate-100`}
            >
                <span className={colegioSeleccionado ? 'text-slate-800 font-medium truncate' : 'text-slate-400'}>
                    {colegioSeleccionado ? colegioSeleccionado.nombre : 'Buscar o seleccionar colegio...'}
                </span>
                <span className="ml-2 text-slate-400 text-xs">▼</span>
            </button>

            {abierto && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
                    <input
                        ref={inputBusquedaRef}
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Escriba para filtrar colegio..."
                        className="mb-2 w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs outline-none focus:border-[#315d7a]"
                    />

                    <div className="max-h-60 overflow-y-auto space-y-0.5">
                        <div
                            onClick={() => {
                                onChange('');
                                setAbierto(false);
                                setBusqueda('');
                            }}
                            className="cursor-pointer rounded px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100"
                        >
                            -- Ninguno / Sin seleccionar --
                        </div>

                        {colegiosFiltrados.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-400">
                                No se encontraron colegios con "{busqueda}"
                            </div>
                        ) : (
                            colegiosFiltrados.map((c) => (
                                <div
                                    key={c.id}
                                    onClick={() => {
                                        onChange(c.id);
                                        setAbierto(false);
                                        setBusqueda('');
                                    }}
                                    className={`cursor-pointer rounded px-2.5 py-2 text-xs transition ${
                                        String(value) === String(c.id)
                                            ? 'bg-[#315d7a] font-bold text-white'
                                            : 'text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    {c.nombre}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {error && <p className="mt-1 text-sm text-rose-600">{error}</p>}
        </div>
    );
}

function CampoTexto({ id, label, required = false, type = 'text', value, onChange, error, disabled, placeholder = '', className, ...props }) {
    return (
        <div>
            <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-700">
                {label} {required && <span className="ml-1 text-rose-500">*</span>}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder={placeholder}
                className={className(!!error)}
                {...props}
            />
            {error && <p className="mt-1 text-sm text-rose-600">{error}</p>}
        </div>
    );
}

function CampoSelect({ id, label, required = false, value, onChange, error, disabled, className, children }) {
    return (
        <div>
            <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-700">
                {label} {required && <span className="ml-1 text-rose-500">*</span>}
            </label>
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={className(!!error)}
            >
                {children}
            </select>
            {error && <p className="mt-1 text-sm text-rose-600">{error}</p>}
        </div>
    );
}

function CampoArchivo({ id, label, accept, error, disabled, onChange }) {
    return (
        <div>
            <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
            <input
                id={id}
                type="file"
                accept={accept}
                disabled={disabled}
                onChange={(e) => onChange(e.target.files?.[0] ?? null)}
                className={`block w-full rounded-lg border bg-white text-sm text-slate-600 file:mr-4 file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200 ${
                    error ? 'border-rose-400' : 'border-slate-300'
                }`}
            />
            {error && <p className="mt-1 text-sm text-rose-600">{error}</p>}
        </div>
    );
}