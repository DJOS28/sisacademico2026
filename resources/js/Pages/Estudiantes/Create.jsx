import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function Create({
    colegios = [],
    mediosPago = [],
    generos = [],
    lenguasMaternas = [],
    fuentesInscripcion = [],
}) {
    const {
        data,
        setData,
        post,
        processing,
        errors,
        clearErrors,
    } = useForm({
        codigo_postulante: '',
        nombres: '',
        apellidos: '',
        dni: '',
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

    const obtenerInputClass = (hasError) =>
        `w-full rounded-lg border px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:ring-2 ${
            hasError
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/10'
                : 'border-slate-300 focus:border-[#315d7a] focus:ring-[#315d7a]/20'
        } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500`;

    const obtenerNombreColegio = (colegio) =>
        colegio.nombre ?? colegio.nombre_colegio ?? colegio.descripcion ?? `Colegio ${colegio.id_colegio}`;

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

    // Filtro estricto para permitir solo letras y espacios individuales
    const filtrarSoloLetras = (valor) => {
        return valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñ&Ntilde;üÜ\s]/g, '');
    };

    const validarAntesDeEnviar = async () => {
        if (!data.nombres.trim()) {
            await Swal.fire('Nombres requeridos', 'Debe ingresar los nombres del estudiante.', 'warning');
            return false;
        }
        if (!data.apellidos.trim()) {
            await Swal.fire('Apellidos requeridos', 'Debe ingresar los apellidos del estudiante.', 'warning');
            return false;
        }
        if (data.dni.length !== 8) {
            await Swal.fire('DNI no válido', 'El DNI debe contener exactamente 8 dígitos.', 'warning');
            return false;
        }
        if (!data.username.trim()) {
            await Swal.fire('Usuario requerido', 'Debe ingresar el nombre de usuario de acceso.', 'warning');
            return false;
        }
        if (data.password.length < 8) {
            await Swal.fire('Contraseña corta', 'La contraseña debe contener al menos 8 caracteres.', 'warning');
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
                    title: 'Registrando estudiante...',
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
                        Registre los datos del estudiante de forma individual y configure sus accesos.
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
                            id="dni"
                            label="DNI"
                            required
                            value={data.dni}
                            onChange={(val) => setData('dni', val.replace(/\D/g, '').slice(0, 8))}
                            error={errors.dni}
                            disabled={processing}
                            placeholder="Solo 8 números"
                            inputMode="numeric"
                            maxLength={8}
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

                {/* SECCIÓN 2: ACCESO AL SISTEMA */}
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-lg font-bold text-slate-900">Acceso al sistema</h2>
                        <p className="mt-1 text-sm text-slate-500">Credenciales que utilizará el estudiante para ingresar.</p>
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
                            placeholder="Ejemplo: jperez"
                            maxLength={100}
                            autoComplete="username"
                            className={obtenerInputClass}
                        />

                        <CampoTexto
                            id="password"
                            label="Contraseña"
                            type="password"
                            required
                            value={data.password}
                            onChange={(val) => setData('password', val)}
                            error={errors.password}
                            disabled={processing}
                            placeholder="Mínimo 8 caracteres"
                            autoComplete="new-password"
                            className={obtenerInputClass}
                        />

                        <CampoTexto
                            id="password_confirmation"
                            label="Confirmar contraseña"
                            type="password"
                            required
                            value={data.password_confirmation}
                            onChange={(val) => setData('password_confirmation', val)}
                            error={errors.password_confirmation}
                            disabled={processing}
                            placeholder="Repita la contraseña"
                            autoComplete="new-password"
                            className={obtenerInputClass}
                        />
                    </div>
                </section>

                {/* SECCIÓN 3: INFORMACIÓN ACADÉMICA */}
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

                        <CampoSelect
                            id="id_colegio"
                            label="Colegio de procedencia"
                            value={data.id_colegio}
                            onChange={(val) => setData('id_colegio', val)}
                            error={errors.id_colegio}
                            disabled={processing}
                            className={obtenerInputClass}
                        >
                            <option value="">Seleccione</option>
                            {colegios.map((c) => (
                                <option key={c.id_colegio} value={c.id_colegio}>
                                    {obtenerNombreColegio(c)}
                                </option>
                            ))}
                        </CampoSelect>

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
                        className="flex h-[42px] items-center justify-center rounded-lg bg-[#315d7a] px-5 text-sm font-semibold text-white transition hover:bg-[#274b63] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processing ? 'Registrando...' : 'Registrar estudiante'}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
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