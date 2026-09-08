import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';

export default function InscripcionForm({ admisiones = [], planesEstudio = [], admisionSeleccionadaId }) {
    // 1. Estado para previsualizar nombres de archivos cargados
    const [fileNames, setFileNames] = useState({});

    // 2. Inicialización del formulario con todos los campos necesarios
    const { data, setData, post, processing, errors, reset } = useForm({
        id_admision: admisionSeleccionadaId || (admisiones[0]?.id_admision ?? ''),
        id_plan: '',
        segunda_opcion: '',

        nombres: '',
        apellidos: '',
        dni: '',
        email: '',
        telefono: '',
        genero: 'Masculino',
        fecha_nacimiento: '',
        direccion: '',

        id_medio_pago: '',
        copia_dni: null,
        certificado_estudios: null,
        partida_nacimiento: null,
        comprobante_pago: null,
    });

    // 3. Buscar la admisión actual seleccionada
    const admisionActual = admisiones.find((a) => String(a.id_admision) === String(data.id_admision));

    // Normalización de tipos de pago (garantiza soporte para tiposPago o tipos_pago)
    const mediosPago = admisionActual?.tipos_pago || admisionActual?.tiposPago || [];

    // Manejo de cambio de archivos con visualización de nombre
    const handleFileChange = (field, file) => {
        setData(field, file);
        setFileNames((prev) => ({
            ...prev,
            [field]: file ? file.name : null,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        post(route('inscripcion.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: (page) => {
                // Alerta SweetAlert2 con el mensaje proveniente de Laravel
                Swal.fire({
                    title: '¡Postulación Recibida!',
                    text: page.props.flash?.success || 'Tu ficha de inscripción se ha enviado correctamente. Revisaremos tu documentación.',
                    icon: 'success',
                    confirmButtonColor: '#315d7a',
                    confirmButtonText: 'Aceptar',
                });

                // Limpiar datos del formulario y nombres de archivos cargados
                reset();
                setFileNames({});
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
            onError: (err) => {
                console.error(err);
                Swal.fire({
                    title: 'Verifique los Datos',
                    text: 'Existen errores en el formulario. Revisa los campos marcados en rojo.',
                    icon: 'warning',
                    confirmButtonColor: '#315d7a',
                });
            },
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased pb-16">
            <Head title="Ficha de Inscripción en Línea" />

            {/* ENCABEZADO PRINCIPAL */}
            <header className="border-b border-slate-200 bg-white py-8 shadow-xs">
                <div className="mx-auto max-w-4xl px-4 text-center">
                    <span className="inline-block rounded-full bg-[#315d7a]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#315d7a]">
                        Proceso de Admisión Vigente
                    </span>
                    <h1 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
                        Ficha de Inscripción en Línea
                    </h1>
                    <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
                        Complete sus datos personales, seleccione su carrera de preferencia y adjunte la documentación requerida.
                    </p>
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-4 mt-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* SECCIÓN 1: PROCESO Y PROGRAMA DE ESTUDIOS */}
                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#315d7a] text-xs font-bold text-white">1</span>
                            <h2 className="text-base font-bold text-slate-800">Programa Académico y Proceso</h2>
                        </div>

                        <div className="p-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Proceso de Admisión <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.id_admision}
                                    onChange={(e) => setData('id_admision', e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                    required
                                >
                                    <option value="">-- Seleccione Proceso --</option>
                                    {admisiones.map((a) => (
                                        <option key={a.id_admision} value={a.id_admision}>
                                            {a.nombre}
                                        </option>
                                    ))}
                                </select>
                                {errors.id_admision && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.id_admision}</p>}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Carrera Principal (Primera Opción) <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.id_plan}
                                    onChange={(e) => setData('id_plan', e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                    required
                                >
                                    <option value="">-- Seleccione Carrera --</option>
                                    {planesEstudio.map((pe) => (
                                        <option key={pe.id} value={pe.id}>
                                            {pe.nombre} {pe.codigo ? `(${pe.codigo})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {errors.id_plan && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.id_plan}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Segunda Opción de Carrera (Opcional)
                                </label>
                                <select
                                    value={data.segunda_opcion}
                                    onChange={(e) => setData('segunda_opcion', e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                >
                                    <option value="">-- Ninguna / Opcional --</option>
                                    {planesEstudio
                                        .filter((pe) => String(pe.id) !== String(data.id_plan))
                                        .map((pe) => (
                                            <option key={pe.id} value={pe.nombre}>
                                                {pe.nombre}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* SECCIÓN 2: DATOS PERSONALES DEL POSTULANTE */}
                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#315d7a] text-xs font-bold text-white">2</span>
                            <h2 className="text-base font-bold text-slate-800">Datos Personales del Postulante</h2>
                        </div>

                        <div className="p-6 grid grid-cols-1 gap-5 md:grid-cols-3">
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Nombres <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.nombres}
                                    onChange={(e) => setData('nombres', e.target.value)}
                                    placeholder="Ej: Juan Carlos"
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                    required
                                />
                                {errors.nombres && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.nombres}</p>}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Apellidos <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.apellidos}
                                    onChange={(e) => setData('apellidos', e.target.value)}
                                    placeholder="Ej: Pérez Gómez"
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                    required
                                />
                                {errors.apellidos && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.apellidos}</p>}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    DNI / Documento <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    maxLength="15"
                                    value={data.dni}
                                    onChange={(e) => setData('dni', e.target.value)}
                                    placeholder="Número de DNI"
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                    required
                                />
                                {errors.dni && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.dni}</p>}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Correo Electrónico <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="correo@ejemplo.com"
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                    required
                                />
                                {errors.email && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Teléfono / WhatsApp <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.telefono}
                                    onChange={(e) => setData('telefono', e.target.value)}
                                    placeholder="Ej: 987654321"
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                    required
                                />
                                {errors.telefono && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.telefono}</p>}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Género
                                </label>
                                <select
                                    value={data.genero}
                                    onChange={(e) => setData('genero', e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                >
                                    <option value="Masculino">Masculino</option>
                                    <option value="Femenino">Femenino</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Fecha de Nacimiento
                                </label>
                                <input
                                    type="date"
                                    value={data.fecha_nacimiento}
                                    onChange={(e) => setData('fecha_nacimiento', e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Dirección de Domicilio
                                </label>
                                <input
                                    type="text"
                                    value={data.direccion}
                                    onChange={(e) => setData('direccion', e.target.value)}
                                    placeholder="Av. / Calle / Mz. y Lote"
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                />
                            </div>
                        </div>
                    </section>

                    {/* SECCIÓN 3: REQUISITOS Y DOCUMENTACIÓN ESCANEADA */}
                    {admisionActual && (
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#315d7a] text-xs font-bold text-white">3</span>
                                    <h2 className="text-base font-bold text-slate-800">Adjuntar Requisitos Obligatorios</h2>
                                </div>
                                <span className="text-xs text-slate-500 font-medium">Formatos: PDF, JPG, PNG (Máx 4MB)</span>
                            </div>

                            <div className="p-6 space-y-6">
                                {admisionActual.requisitos?.length > 0 && (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900">
                                        <p className="font-bold mb-1">Requisitos exigidos en este proceso:</p>
                                        <ul className="list-disc pl-4 space-y-0.5">
                                            {admisionActual.requisitos.map((req) => (
                                                <li key={req.id_requisito}>
                                                    <strong>{req.nombre}</strong> {req.descripcion ? `— ${req.descripcion}` : ''}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    {/* COPIA DNI */}
                                    <div className="rounded-xl border border-dashed border-slate-300 p-4 transition hover:border-[#315d7a]">
                                        <label className="block text-xs font-bold text-slate-700">Copia de DNI (Ambos lados)</label>
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => handleFileChange('copia_dni', e.target.files[0])}
                                            className="mt-2 w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-[#315d7a]/10 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#315d7a]"
                                        />
                                        {fileNames.copia_dni && (
                                            <p className="mt-1.5 text-[11px] font-semibold text-emerald-600">✓ {fileNames.copia_dni}</p>
                                        )}
                                    </div>

                                    {/* CERTIFICADO DE ESTUDIOS */}
                                    <div className="rounded-xl border border-dashed border-slate-300 p-4 transition hover:border-[#315d7a]">
                                        <label className="block text-xs font-bold text-slate-700">Certificado de Estudios / Secundarios</label>
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => handleFileChange('certificado_estudios', e.target.files[0])}
                                            className="mt-2 w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-[#315d7a]/10 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#315d7a]"
                                        />
                                        {fileNames.certificado_estudios && (
                                            <p className="mt-1.5 text-[11px] font-semibold text-emerald-600">✓ {fileNames.certificado_estudios}</p>
                                        )}
                                    </div>

                                    {/* PARTIDA DE NACIMIENTO */}
                                    <div className="rounded-xl border border-dashed border-slate-300 p-4 transition hover:border-[#315d7a]">
                                        <label className="block text-xs font-bold text-slate-700">Partida de Nacimiento (Opcional)</label>
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => handleFileChange('partida_nacimiento', e.target.files[0])}
                                            className="mt-2 w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-[#315d7a]/10 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#315d7a]"
                                        />
                                        {fileNames.partida_nacimiento && (
                                            <p className="mt-1.5 text-[11px] font-semibold text-emerald-600">✓ {fileNames.partida_nacimiento}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* SECCIÓN 4: MEDIOS DE PAGO Y COMPROBANTE */}
                    {admisionActual && (
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center gap-3">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#315d7a] text-xs font-bold text-white">4</span>
                                <h2 className="text-base font-bold text-slate-800">Derecho de Inscripción y Pago</h2>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Cuentas Bancarias Habilitadas */}
                                {mediosPago.length > 0 ? (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Cuentas Autorizadas para Depósito / Transferencia:</p>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            {mediosPago.map((tp) => (
                                                <div key={tp.id_tipo_pago} className="rounded-lg border border-slate-200 bg-white p-3 text-xs space-y-1">
                                                    <p className="font-extrabold text-[#315d7a]">{tp.nombre}</p>
                                                    <p className="text-slate-600"><strong>Banco:</strong> {tp.banco_o_entidad}</p>
                                                    <p className="font-mono text-slate-800"><strong>N° Cta:</strong> {tp.numero_cuenta}</p>
                                                    <p className="font-mono text-slate-500"><strong>CCI:</strong> {tp.cci}</p>
                                                    <p className="text-slate-500 text-[11px]"><strong>Titular:</strong> {tp.nombre_titular}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500 italic">No hay medios de pago específicos vinculados a este proceso.</p>
                                )}

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                            Medio donde realizó el depósito/pago
                                        </label>
                                        <select
                                            value={data.id_medio_pago}
                                            onChange={(e) => setData('id_medio_pago', e.target.value)}
                                            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                        >
                                            <option value="">-- Seleccione Cuenta / Banco --</option>
                                            {mediosPago.map((tp) => (
                                                <option key={tp.id_tipo_pago} value={tp.id_tipo_pago}>
                                                    {tp.nombre} ({tp.banco_o_entidad})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/30 p-4">
                                        <label className="block text-xs font-bold text-emerald-900">Adjuntar Comprobante de Pago (Voucher)</label>
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => handleFileChange('comprobante_pago', e.target.files[0])}
                                            className="mt-2 w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
                                        />
                                        {fileNames.comprobante_pago && (
                                            <p className="mt-1.5 text-[11px] font-bold text-emerald-700">✓ Voucher: {fileNames.comprobante_pago}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* BOTÓN DE ENVÍO FINAL */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-2xl bg-[#315d7a] py-4 text-center text-base font-extrabold text-white shadow-lg shadow-[#315d7a]/20 transition hover:bg-[#274b63] focus:outline-none focus:ring-4 focus:ring-[#315d7a]/30 disabled:opacity-60 cursor-pointer"
                        >
                            {processing ? (
                                <span className="inline-flex items-center gap-2">
                                    <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Enviando Registro de Postulación...
                                </span>
                            ) : (
                                'Completar y Confirmar Inscripción en Línea'
                            )}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}