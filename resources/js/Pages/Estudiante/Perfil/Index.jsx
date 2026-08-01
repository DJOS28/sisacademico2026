import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import Select from 'react-select';

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
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </>
        ),
        check: <polyline points="20 6 9 17 4 12" />,
        shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
        file: (
            <>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
            </>
        ),
        school: (
            <>
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </>
        ),
    };

    return <svg {...props}>{icons[name] ?? null}</svg>;
}

export default function Index({ estudiante = {}, colegios = [], usuario = {} }) {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        _method: 'put',
        nombres: estudiante?.nombres ?? '',
        apellidos: estudiante?.apellidos ?? '',
        dni: estudiante?.dni ?? '',
        email: estudiante?.email ?? usuario?.email ?? '',
        telefono: estudiante?.telefono ?? '',
        direccion: estudiante?.direccion ?? '',
        fecha_nacimiento: estudiante?.fecha_nacimiento ? estudiante.fecha_nacimiento.substring(0, 10) : '',
        genero: estudiante?.genero ?? '',
        lengua_materna: estudiante?.lengua_materna ?? '',
        id_colegio: estudiante?.id_colegio ?? '',
        año_egreso: estudiante?.año_egreso ?? '',
        discapacidad: estudiante?.discapacidad ? true : false,
        nombre_discapacidad: estudiante?.nombre_discapacidad ?? '',

        // Archivos
        foto_postulante: null,
        certificado_estudios: null,
        partida_nacimiento: null,
        copia_dni: null,
        comprobante_pago: null,
        curriculum_archivo: null,
    });

    // Mapeo de opciones para el Select2 (react-select)
    const opcionesColegios = Array.isArray(colegios)
        ? colegios.map((col) => ({
              value: col.id_colegio,
              label: col.nombre_colegio ?? col.nombre ?? col.colegio ?? `Colegio #${col.id_colegio}`,
          }))
        : [];

    // Estilos personalizados para Tailwind/UI del Select2
    const customSelectStyles = {
        control: (styles, { isFocused }) => ({
            ...styles,
            backgroundColor: 'white',
            borderColor: isFocused ? '#315d7a' : '#e2e8f0',
            borderRadius: '0.75rem',
            padding: '2px 4px',
            fontSize: '0.75rem',
            fontWeight: '600',
            boxShadow: isFocused ? '0 0 0 1px #315d7a' : 'none',
            '&:hover': {
                borderColor: '#315d7a',
            },
        }),
        option: (styles, { isFocused, isSelected }) => ({
            ...styles,
            fontSize: '0.75rem',
            fontWeight: '600',
            backgroundColor: isSelected
                ? '#315d7a'
                : isFocused
                ? '#eaf1f6'
                : 'white',
            color: isSelected ? 'white' : '#1e293b',
            cursor: 'pointer',
        }),
        menu: (styles) => ({
            ...styles,
            borderRadius: '0.75rem',
            overflow: 'hidden',
            boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)',
            zIndex: 50,
        }),
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('estudiante.perfil.update'), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#315d7a]/10 text-[#315d7a] text-[11px] font-extrabold uppercase tracking-wider">
                        Portal Estudiante
                    </span>
                    <h1 className="mt-1 text-2xl font-bold text-slate-900 tracking-tight">
                        Mis Datos Personales y Documentos
                    </h1>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Actualiza tu información personal, procedencia escolar y expediente adjunto.
                    </p>
                </div>
            }
        >
            <Head title="Mi Perfil - Estudiante" />

            <div className="w-full space-y-6">

                {/* ALERTA DE ÉXITO */}
                {flash?.success && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-2xs">
                        <Icon name="check" className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* TARJETA CABECERA SOLA LECTURA */}
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 px-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-2xs">
                            {estudiante?.foto_postulante ? (
                                <img src={estudiante.foto_postulante} alt="Foto" className="h-full w-full object-cover" />
                            ) : (
                                <Icon name="user" className="h-6 w-6 text-slate-400" />
                            )}
                        </div>
                        <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                Código de Estudiante
                            </span>
                            <span className="text-sm font-bold text-slate-800">
                                {estudiante?.codigo_postulante ?? 'Sin asignar'}
                            </span>
                        </div>
                    </div>

                    <div className="text-right">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Condición Académica
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-sky-50 text-[#315d7a] border border-sky-200 font-extrabold text-xs mt-0.5">
                            {estudiante?.grado ?? 'Estudiante'}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* SECCIÓN 1: DATOS PERSONALES Y CONTACTO */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="h-10 w-10 rounded-xl bg-[#eaf1f6] text-[#315d7a] flex items-center justify-center shrink-0">
                                <Icon name="user" className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">1. Información Personal y Filiación</h3>
                                <p className="text-xs text-slate-400">Datos principales de contacto e identificación personal.</p>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Nombres *</label>
                                <input
                                    type="text"
                                    value={data.nombres}
                                    onChange={(e) => setData('nombres', e.target.value)}
                                    className="w-full rounded-xl border-slate-200 text-xs font-semibold focus:border-[#315d7a] focus:ring-[#315d7a]"
                                />
                                {errors.nombres && <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.nombres}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Apellidos Completos *</label>
                                <input
                                    type="text"
                                    value={data.apellidos}
                                    onChange={(e) => setData('apellidos', e.target.value)}
                                    className="w-full rounded-xl border-slate-200 text-xs font-semibold focus:border-[#315d7a] focus:ring-[#315d7a]"
                                />
                                {errors.apellidos && <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.apellidos}</span>}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">DNI / Documento *</label>
                                <input
                                    type="text"
                                    value={data.dni}
                                    onChange={(e) => setData('dni', e.target.value)}
                                    className="w-full rounded-xl border-slate-200 text-xs font-semibold focus:border-[#315d7a] focus:ring-[#315d7a]"
                                />
                                {errors.dni && <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.dni}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico *</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full rounded-xl border-slate-200 text-xs font-semibold focus:border-[#315d7a] focus:ring-[#315d7a]"
                                />
                                {errors.email && <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.email}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono / Celular</label>
                                <input
                                    type="text"
                                    value={data.telefono}
                                    onChange={(e) => setData('telefono', e.target.value)}
                                    className="w-full rounded-xl border-slate-200 text-xs font-semibold focus:border-[#315d7a] focus:ring-[#315d7a]"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Dirección de Domicilio</label>
                                <input
                                    type="text"
                                    value={data.direccion}
                                    onChange={(e) => setData('direccion', e.target.value)}
                                    className="w-full rounded-xl border-slate-200 text-xs font-semibold focus:border-[#315d7a] focus:ring-[#315d7a]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Nacimiento</label>
                                <input
                                    type="date"
                                    value={data.fecha_nacimiento}
                                    onChange={(e) => setData('fecha_nacimiento', e.target.value)}
                                    className="w-full rounded-xl border-slate-200 text-xs font-semibold focus:border-[#315d7a] focus:ring-[#315d7a]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Género</label>
                                <select
                                    value={data.genero}
                                    onChange={(e) => setData('genero', e.target.value)}
                                    className="w-full rounded-xl border-slate-200 text-xs font-semibold focus:border-[#315d7a] focus:ring-[#315d7a]"
                                >
                                    <option value="">Seleccione</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Femenino">Femenino</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Lengua Materna</label>
                                <input
                                    type="text"
                                    value={data.lengua_materna}
                                    onChange={(e) => setData('lengua_materna', e.target.value)}
                                    className="w-full rounded-xl border-slate-200 text-xs font-semibold focus:border-[#315d7a] focus:ring-[#315d7a]"
                                    placeholder="Ej. Español, Quechua..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 2: COLEGIO Y SALUD/INCLUSIÓN */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="h-10 w-10 rounded-xl bg-[#eaf1f6] text-[#315d7a] flex items-center justify-center shrink-0">
                                <Icon name="school" className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">2. Procedencia e Inclusión</h3>
                                <p className="text-xs text-slate-400">Datos escolares de origen e información sobre necesidades especiales.</p>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            {/* SELECT2 PARA COLEGIO */}
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Colegio de Procedencia</label>
                                <Select
                                    options={opcionesColegios}
                                    value={opcionesColegios.find((opt) => opt.value === Number(data.id_colegio)) || null}
                                    onChange={(selectedOption) => setData('id_colegio', selectedOption ? selectedOption.value : '')}
                                    placeholder="Escribe para buscar colegio..."
                                    isClearable
                                    isSearchable
                                    styles={customSelectStyles}
                                    noOptionsMessage={() => 'No se encontraron colegios'}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Año de Egreso Escolar</label>
                                <input
                                    type="text"
                                    maxLength="4"
                                    value={data.año_egreso}
                                    onChange={(e) => setData('año_egreso', e.target.value)}
                                    className="w-full rounded-xl border-slate-200 text-xs font-semibold focus:border-[#315d7a] focus:ring-[#315d7a]"
                                    placeholder="AAAA"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3 items-center">
                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="check-discapacidad"
                                    checked={data.discapacidad}
                                    onChange={(e) => setData('discapacidad', e.target.checked)}
                                    className="rounded border-slate-300 text-[#315d7a] focus:ring-[#315d7a]"
                                />
                                <label htmlFor="check-discapacidad" className="text-xs font-bold text-slate-700 cursor-pointer">
                                    Presenta Discapacidad
                                </label>
                            </div>

                            {data.discapacidad && (
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Especifique Discapacidad</label>
                                    <input
                                        type="text"
                                        value={data.nombre_discapacidad}
                                        onChange={(e) => setData('nombre_discapacidad', e.target.value)}
                                        className="w-full rounded-xl border-slate-200 text-xs font-semibold focus:border-[#315d7a] focus:ring-[#315d7a]"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECCIÓN 3: ARCHIVOS Y DOCUMENTACIÓN */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="h-10 w-10 rounded-xl bg-[#eaf1f6] text-[#315d7a] flex items-center justify-center shrink-0">
                                <Icon name="file" className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">3. Archivos y Documentos Adjuntos</h3>
                                <p className="text-xs text-slate-400">Sube o actualiza tus requisitos digitales (PDF o Imágenes, máx. 5MB).</p>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {/* Foto Perfil */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Foto de Perfil</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setData('foto_postulante', e.target.files[0])}
                                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#315d7a] file:text-white"
                                />
                                {estudiante?.foto_postulante && (
                                    <a href={estudiante.foto_postulante} target="_blank" rel="noreferrer" className="text-[10px] text-[#315d7a] font-bold mt-1 inline-block hover:underline">
                                        Ver Foto Actual
                                    </a>
                                )}
                            </div>

                            {/* Certificado de Estudios */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Certificado de Estudios</label>
                                <input
                                    type="file"
                                    onChange={(e) => setData('certificado_estudios', e.target.files[0])}
                                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#315d7a] file:text-white"
                                />
                                {estudiante?.certificado_estudios && (
                                    <a href={estudiante.certificado_estudios} target="_blank" rel="noreferrer" className="text-[10px] text-[#315d7a] font-bold mt-1 inline-block hover:underline">
                                        Ver Documento
                                    </a>
                                )}
                            </div>

                            {/* Partida de Nacimiento */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Partida de Nacimiento</label>
                                <input
                                    type="file"
                                    onChange={(e) => setData('partida_nacimiento', e.target.files[0])}
                                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#315d7a] file:text-white"
                                />
                                {estudiante?.partida_nacimiento && (
                                    <a href={estudiante.partida_nacimiento} target="_blank" rel="noreferrer" className="text-[10px] text-[#315d7a] font-bold mt-1 inline-block hover:underline">
                                        Ver Documento
                                    </a>
                                )}
                            </div>

                            {/* Copia de DNI */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Copia de DNI</label>
                                <input
                                    type="file"
                                    onChange={(e) => setData('copia_dni', e.target.files[0])}
                                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#315d7a] file:text-white"
                                />
                                {estudiante?.copia_dni && (
                                    <a href={estudiante.copia_dni} target="_blank" rel="noreferrer" className="text-[10px] text-[#315d7a] font-bold mt-1 inline-block hover:underline">
                                        Ver Documento
                                    </a>
                                )}
                            </div>

                            {/* Comprobante de Pago */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Comprobante de Pago</label>
                                <input
                                    type="file"
                                    onChange={(e) => setData('comprobante_pago', e.target.files[0])}
                                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#315d7a] file:text-white"
                                />
                                {estudiante?.comprobante_pago && (
                                    <a href={estudiante.comprobante_pago} target="_blank" rel="noreferrer" className="text-[10px] text-[#315d7a] font-bold mt-1 inline-block hover:underline">
                                        Ver Documento
                                    </a>
                                )}
                            </div>

                            {/* Curriculum Vitae */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Curriculum Vitae (PDF)</label>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => setData('curriculum_archivo', e.target.files[0])}
                                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#315d7a] file:text-white"
                                />
                                {estudiante?.curriculum_archivo && (
                                    <a href={estudiante.curriculum_archivo} target="_blank" rel="noreferrer" className="text-[10px] text-[#315d7a] font-bold mt-1 inline-block hover:underline">
                                        Ver CV Actual
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* BOTÓN GUARDAR */}
                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-3 rounded-xl bg-[#315d7a] hover:bg-[#274b63] text-white font-bold text-xs transition shadow-md disabled:opacity-50 cursor-pointer"
                        >
                            {processing ? 'Guardando cambios y archivos...' : 'Guardar Todos los Cambios'}
                        </button>
                    </div>

                </form>

            </div>
        </AuthenticatedLayout>
    );
}