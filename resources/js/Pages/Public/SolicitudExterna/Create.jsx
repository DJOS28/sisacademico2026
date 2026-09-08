import { Head } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useMemo, useState, useRef, useEffect } from 'react';

export default function Create({ tramites = [] }) {
    const [form, setForm] = useState({
        tramite_id: '',
        tipo_documento: 'DNI',
        numero_documento: '',
        nombre_razon_social: '',
        rep_legal_dni: '',
        rep_legal_nombres: '',
        rep_legal_cargo: '',
        email: '',
        telefono: '',
        direccion: '',
        archivo: null,
    });

    // Estado para la búsqueda automática (DeColecta Service)
    const [buscandoDoc, setBuscandoDoc] = useState(false);

    // Estado del buscador personalizado de trámites (Select2)
    const [busquedaTramite, setBusquedaTramite] = useState('');
    const [comboAbierto, setComboAbierto] = useState(false);
    const comboRef = useRef(null);

    // Mapeo de archivos independientes por id de requisito: { [requisito_id]: File }
    const [archivosRequisitos, setArchivosRequisitos] = useState({});
    const [errores, setErrores] = useState({});
    const [enviando, setEnviando] = useState(false);

    // Cerrar el combo al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (comboRef.current && !comboRef.current.contains(e.target)) {
                setComboAbierto(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const tramiteSeleccionado = useMemo(
        () => tramites.find((t) => String(t.id) === String(form.tramite_id)),
        [form.tramite_id, tramites]
    );

    // Filtrar trámites según la búsqueda
    const tramitesFiltrados = useMemo(() => {
        if (!busquedaTramite.trim()) return tramites;
        return tramites.filter((t) =>
            t.nombre.toLowerCase().includes(busquedaTramite.toLowerCase())
        );
    }, [busquedaTramite, tramites]);

    const actualizar = (campo, valor) => {
        setForm((prev) => ({ ...prev, [campo]: valor }));
        if (errores[campo]) {
            setErrores((prev) => ({ ...prev, [campo]: null }));
        }
    };

    const seleccionarTramite = (tramite) => {
        actualizar('tramite_id', tramite.id);
        setBusquedaTramite('');
        setComboAbierto(false);
        setArchivosRequisitos({}); // Limpiar archivos previos al cambiar de trámite
    };

    const handleFileRequisito = (requisitoId, file) => {
        setArchivosRequisitos((prev) => ({
            ...prev,
            [requisitoId]: file,
        }));
    };

    /**
     * Búsqueda automática de DNI o RUC consumiendo DeColectaService desde Laravel
     */
    const buscarDocumento = async () => {
        const num = form.numero_documento.trim();

        if (!num) {
            Swal.fire({
                icon: 'warning',
                title: 'Atención',
                text: 'Ingresa un número de documento para realizar la búsqueda.',
                confirmButtonColor: '#1e3a8a',
            });
            return;
        }

        if (form.tipo_documento === 'DNI' && num.length !== 8) {
            Swal.fire({
                icon: 'warning',
                title: 'DNI Inválido',
                text: 'El DNI debe contener exactamente 8 dígitos.',
                confirmButtonColor: '#1e3a8a',
            });
            return;
        }

        if (form.tipo_documento === 'RUC' && num.length !== 11) {
            Swal.fire({
                icon: 'warning',
                title: 'RUC Inválido',
                text: 'El RUC debe contener exactamente 11 dígitos.',
                confirmButtonColor: '#1e3a8a',
            });
            return;
        }

        setBuscandoDoc(true);

        try {
            if (form.tipo_documento === 'DNI') {
                const { data } = await axios.get(route('solicitud-externa.consultar-dni', num));

                if (data.success && data.data) {
                    const info = data.data;

                    let nombreFormateado = '';
                    if (info.first_name && info.first_last_name) {
                        nombreFormateado = `${info.first_name} ${info.first_last_name} ${info.second_last_name ?? ''}`.trim();
                    } else if (info.full_name) {
                        nombreFormateado = info.full_name;
                    } else if (info.nombre_completo) {
                        nombreFormateado = info.nombre_completo;
                    } else {
                        nombreFormateado = `${info.nombres ?? ''} ${info.apellidoPaterno ?? ''} ${info.apellidoMaterno ?? ''}`.trim();
                    }

                    actualizar('nombre_razon_social', nombreFormateado);

                    Swal.fire({
                        icon: 'success',
                        title: 'Persona Encontrada',
                        text: `Datos autocompletados: ${nombreFormateado}`,
                        timer: 2000,
                        showConfirmButton: false,
                    });
                } else {
                    throw new Error(data.message || 'No se encontró información para el DNI ingresado.');
                }
            } else if (form.tipo_documento === 'RUC') {
                const { data } = await axios.get(route('solicitud-externa.consultar-ruc', num));

                if (data.success && data.data) {
                    const info = data.data;

                    const razonSocial = info.razon_social || info.razonSocial || info.full_name || info.name || info.nombre || '';
                    actualizar('nombre_razon_social', razonSocial);

                    const direccion = info.direccion || info.direccion_fiscal || info.direccionCompleta || info.address || '';
                    if (direccion) {
                        actualizar('direccion', direccion);
                    }

                    // Extraer Representante Legal si SUNAT lo retorna
                    const representantes = info.representantes_legales || info.representantesLegales;
                    if (Array.isArray(representantes) && representantes.length > 0) {
                        const rep = representantes[0];
                        actualizar('rep_legal_dni', rep.document_number || rep.numero_documento || rep.doc || '');
                        actualizar('rep_legal_nombres', rep.full_name || rep.nombre || rep.nombreCompleto || '');
                        actualizar('rep_legal_cargo', rep.position || rep.cargo || '');
                    }

                    Swal.fire({
                        icon: 'success',
                        title: 'Empresa Encontrada',
                        text: `Razón Social: ${razonSocial}`,
                        timer: 2000,
                        showConfirmButton: false,
                    });
                } else {
                    throw new Error(data.message || 'No se encontró información para el RUC ingresado.');
                }
            }
        } catch (error) {
            Swal.fire({
                icon: 'info',
                title: 'Sin Resultados Automáticos',
                text: error.response?.data?.message || error.message || 'No se pudo consultar el documento. Puedes ingresar tus datos manualmente.',
                confirmButtonColor: '#1e3a8a',
            });
        } finally {
            setBuscandoDoc(false);
        }
    };

    const enviar = async (event) => {
        event.preventDefault();
        setEnviando(true);
        setErrores({});

        try {
            const payload = new FormData();

            // Adjuntar campos de texto
            Object.entries(form).forEach(([clave, valor]) => {
                if (valor !== null && valor !== '') {
                    payload.append(clave, valor);
                }
            });

            // Adjuntar múltiples archivos mapeados por id de requisito
            Object.entries(archivosRequisitos).forEach(([reqId, file]) => {
                if (file) {
                    payload.append(`archivos[${reqId}]`, file);
                }
            });

            const { data } = await axios.post(route('solicitud-externa.store'), payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            await Swal.fire({
                icon: 'success',
                title: 'Solicitud Recibida Correctamente',
                html: `
                    <div style="text-align:center; padding: 10px 0;">
                        <p style="font-size:14px; color:#334155; margin-bottom:12px">
                            ${data.message || 'Tu documentación ha ingresado a la bandeja de Mesa de Partes para su revisión.'}
                        </p>
                        <div style="background:#f0fdf4; border: 1px dashed #86efac; border-radius:10px; padding:16px; margin: 10px 0;">
                            <p style="font-size:12px; font-weight:700; color:#166534; text-transform:uppercase; margin-bottom:4px">
                                📩 Notificación enviada
                            </p>
                            <p style="font-size:12px; color:#15803d; margin:0">
                                Hemos enviado un correo de confirmación a <strong>${form.email}</strong>. 
                                Una vez que Mesa de Partes apruebe tu expediente, recibirás un segundo correo con tu <strong>Código de Seguimiento Oficial</strong>.
                            </p>
                        </div>
                    </div>
                `,
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#1e3a8a',
            });

            // Resetear formulario
            setForm({
                tramite_id: '',
                tipo_documento: 'DNI',
                numero_documento: '',
                nombre_razon_social: '',
                rep_legal_dni: '',
                rep_legal_nombres: '',
                rep_legal_cargo: '',
                email: '',
                telefono: '',
                direccion: '',
                archivo: null,
            });
            setArchivosRequisitos({});
            const inputArchivo = document.getElementById('input-archivo');
            if (inputArchivo) inputArchivo.value = '';
        } catch (error) {
            if (error.response?.status === 422) {
                setErrores(error.response.data.errors ?? {});
                Swal.fire({
                    icon: 'warning',
                    title: 'Formulario Incompleto',
                    text: 'Por favor, verifica los campos marcados en rojo antes de enviar.',
                    confirmButtonColor: '#1e3a8a',
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error de Servidor',
                    text: error.response?.data?.message ?? 'No se pudo procesar la solicitud. Intenta nuevamente.',
                    confirmButtonColor: '#1e3a8a',
                });
            }
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 font-sans text-slate-800 antialiased">
            <Head title="Mesa de Partes Virtual" />

            {/* HERO BAR INSTITUCIONAL */}
            <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white shadow-md">
                <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-700/60 pb-6">
                        <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 border border-blue-400/30">
                                🏛️ Portal Institucional de Atención
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-2">
                                Mesa de Partes Virtual
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                                Registra tus trámites y adjunta la documentación solicitada sin necesidad de contar con usuario o contraseña.
                            </p>
                        </div>

                        {/* BOTÓN CONSULTA DE ESTADO QUE REDIRIGE A LA VISTA DE SEGUIMIENTO */}
                        <div className="shrink-0">
                            <a
                                href={route('solicitud-externa.seguimiento')}
                                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition backdrop-blur-sm"
                            >
                                🔍 Consultar Estado de Trámite
                            </a>
                        </div>
                    </div>

                    {/* INDICADORES DE PASOS */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 text-xs text-slate-300">
                        <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-[11px]">1</span>
                            <span>Busca y selecciona tu trámite</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-[11px]">2</span>
                            <span>Ingresa tus datos personales o RUC</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-[11px]">3</span>
                            <span>Adjunta requisitos y confirma</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* CONTENEDOR PRINCIPAL */}
            <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <form onSubmit={enviar} className="space-y-8">

                    {/* SECCIÓN 1: SELECCIÓN DEL TRÁMITE (SELECT2 BUSCABLE) */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-800 text-xs font-bold">1</span>
                                Selección de Requerimiento
                            </h2>
                            <span className="text-[11px] font-semibold text-rose-600">* Campo obligatorio</span>
                        </div>

                        {/* COMBOBOX CUSTOMIZADO (SELECT2 REPLACEMENT) */}
                        <div className="relative" ref={comboRef}>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                Buscar o Seleccionar Trámite *
                            </label>

                            <button
                                type="button"
                                onClick={() => setComboAbierto(!comboAbierto)}
                                className={`w-full text-left rounded-xl border px-4 py-3 text-xs sm:text-sm font-medium outline-none transition flex items-center justify-between bg-white ${
                                    errores.tramite_id
                                        ? 'border-rose-400 bg-rose-50/30 text-rose-900'
                                        : 'border-slate-300 text-slate-800 focus:border-blue-700 focus:ring-4 focus:ring-blue-100'
                                }`}
                            >
                                <span className={tramiteSeleccionado ? 'font-bold text-blue-950' : 'text-slate-400'}>
                                    {tramiteSeleccionado
                                        ? `${tramiteSeleccionado.nombre} ${
                                              tramiteSeleccionado.costo
                                                  ? `— S/ ${Number(tramiteSeleccionado.costo).toFixed(2)}`
                                                  : '— (Gratuito)'
                                          }`
                                        : '🔍 Haz clic para buscar y seleccionar un trámite...'}
                                </span>
                                <span className="text-xs text-slate-400">▼</span>
                            </button>

                            {/* MENÚ DESPLEGABLE CON BUSCADOR */}
                            {comboAbierto && (
                                <div className="absolute z-50 mt-1 w-full rounded-2xl border border-slate-200 bg-white shadow-xl max-h-72 overflow-hidden flex flex-col">
                                    <div className="p-2 border-b border-slate-100 bg-slate-50">
                                        <input
                                            type="text"
                                            value={busquedaTramite}
                                            onChange={(e) => setBusquedaTramite(e.target.value)}
                                            placeholder="Escribe para buscar trámite..."
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium outline-none focus:border-blue-700"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="overflow-y-auto divide-y divide-slate-100 max-h-56">
                                        {tramitesFiltrados.length > 0 ? (
                                            tramitesFiltrados.map((t) => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => seleccionarTramite(t)}
                                                    className={`w-full text-left px-4 py-2.5 text-xs transition hover:bg-blue-50 flex items-center justify-between ${
                                                        String(t.id) === String(form.tramite_id)
                                                            ? 'bg-blue-50/80 font-bold text-blue-900'
                                                            : 'text-slate-700'
                                                    }`}
                                                >
                                                    <span>{t.nombre}</span>
                                                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                                        {t.costo ? `S/ ${Number(t.costo).toFixed(2)}` : 'Gratuito'}
                                                    </span>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-xs text-slate-400">
                                                No se encontraron trámites con ese nombre.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {errores.tramite_id && (
                                <p className="mt-1.5 text-xs font-bold text-rose-600">{errores.tramite_id[0]}</p>
                            )}
                        </div>

                        {/* TARJETA DETALLE DEL TRÁMITE SELECCIONADO */}
                        {tramiteSeleccionado && (
                            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-5 space-y-3">
                                {tramiteSeleccionado.descripcion && (
                                    <p className="text-xs text-slate-700 leading-relaxed">
                                        <strong className="text-slate-900">Descripción:</strong> {tramiteSeleccionado.descripcion}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-700 pt-1">
                                    {tramiteSeleccionado.tiempo && (
                                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1 border border-blue-200/80 shadow-2xs">
                                            ⏱️ Tiempo estimado: {tramiteSeleccionado.tiempo}
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1 border border-blue-200/80 shadow-2xs">
                                        💵 Costo: {tramiteSeleccionado.costo ? `S/ ${Number(tramiteSeleccionado.costo).toFixed(2)}` : 'Gratuito'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* SECCIÓN 2: DATOS DEL SOLICITANTE */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-800 text-xs font-bold">2</span>
                                Datos de Identificación y Contacto
                            </h2>
                            <span className="text-[11px] text-slate-400">Campos marcados con * son requeridos</span>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Tipo de Documento *
                                </label>
                                <select
                                    value={form.tipo_documento}
                                    onChange={(e) => actualizar('tipo_documento', e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-700 focus:bg-white focus:ring-4 focus:ring-blue-100"
                                >
                                    <option value="DNI">DNI (Persona Natural)</option>
                                    <option value="CE">Carné de Extranjería</option>
                                    <option value="PASAPORTE">Pasaporte</option>
                                    <option value="RUC">RUC (Empresa / Jurídica)</option>
                                </select>
                            </div>

                            {/* INPUT CON BOTÓN DE BÚSQUEDA AUTOMÁTICA RENIEC/SUNAT */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Número de Documento *
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={form.numero_documento}
                                        onChange={(e) => actualizar('numero_documento', e.target.value)}
                                        className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium outline-none transition ${
                                            errores.numero_documento
                                                ? 'border-rose-400 bg-rose-50/30 text-rose-900'
                                                : 'border-slate-300 bg-slate-50/50 text-slate-800 focus:border-blue-700 focus:bg-white focus:ring-4 focus:ring-blue-100'
                                        }`}
                                        placeholder={
                                            form.tipo_documento === 'DNI'
                                                ? '8 dígitos'
                                                : form.tipo_documento === 'RUC'
                                                ? '11 dígitos'
                                                : 'Número de documento'
                                        }
                                    />

                                    {(form.tipo_documento === 'DNI' || form.tipo_documento === 'RUC') && (
                                        <button
                                            type="button"
                                            onClick={buscarDocumento}
                                            disabled={buscandoDoc}
                                            title="Buscar automáticamente en RENIEC / SUNAT"
                                            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-blue-900 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-950 disabled:opacity-50 transition cursor-pointer"
                                        >
                                            {buscandoDoc ? (
                                                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                            ) : (
                                                <span>🔍 RENIEC/SUNAT</span>
                                            )}
                                        </button>
                                    )}
                                </div>
                                {errores.numero_documento && (
                                    <p className="mt-1 text-xs font-bold text-rose-600">{errores.numero_documento[0]}</p>
                                )}
                            </div>

                            <div className="sm:col-span-2 lg:col-span-1">
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    {form.tipo_documento === 'RUC' ? 'Razón Social *' : 'Nombres y Apellidos *'}
                                </label>
                                <input
                                    type="text"
                                    value={form.nombre_razon_social}
                                    onChange={(e) => actualizar('nombre_razon_social', e.target.value)}
                                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium outline-none transition ${
                                        errores.nombre_razon_social
                                            ? 'border-rose-400 bg-rose-50/30 text-rose-900'
                                            : 'border-slate-300 bg-slate-50/50 text-slate-800 focus:border-blue-700 focus:bg-white focus:ring-4 focus:ring-blue-100'
                                    }`}
                                    placeholder={
                                        form.tipo_documento === 'RUC'
                                            ? 'Ej. Empresa Constructora S.A.C.'
                                            : 'Ej. Juan Pérez Rodríguez'
                                    }
                                />
                                {errores.nombre_razon_social && (
                                    <p className="mt-1 text-xs font-bold text-rose-600">{errores.nombre_razon_social[0]}</p>
                                )}
                            </div>

                            {/* BLOQUE DINÁMICO PARA REPRESENTANTE LEGAL (SI ES RUC) */}
                            {form.tipo_documento === 'RUC' && (
                                <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                                    <div className="flex items-center gap-2 border-b border-amber-200 pb-2">
                                        <span className="text-base">👤</span>
                                        <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
                                            Datos del Representante Legal (Obligatorio para RUC)
                                        </p>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div>
                                            <label className="mb-1 block text-xs font-bold text-slate-700">DNI Representante *</label>
                                            <input
                                                type="text"
                                                value={form.rep_legal_dni}
                                                onChange={(e) => actualizar('rep_legal_dni', e.target.value)}
                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-amber-600"
                                                placeholder="8 dígitos"
                                            />
                                            {errores.rep_legal_dni && (
                                                <p className="mt-1 text-[11px] font-bold text-rose-600">{errores.rep_legal_dni[0]}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-bold text-slate-700">Nombres y Apellidos *</label>
                                            <input
                                                type="text"
                                                value={form.rep_legal_nombres}
                                                onChange={(e) => actualizar('rep_legal_nombres', e.target.value)}
                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-amber-600"
                                                placeholder="Nombre completo"
                                            />
                                            {errores.rep_legal_nombres && (
                                                <p className="mt-1 text-[11px] font-bold text-rose-600">{errores.rep_legal_nombres[0]}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-bold text-slate-700">Cargo (Opcional)</label>
                                            <input
                                                type="text"
                                                value={form.rep_legal_cargo}
                                                onChange={(e) => actualizar('rep_legal_cargo', e.target.value)}
                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-amber-600"
                                                placeholder="Ej. Gerente General"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Correo Electrónico *
                                </label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => actualizar('email', e.target.value)}
                                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium outline-none transition ${
                                        errores.email
                                            ? 'border-rose-400 bg-rose-50/30 text-rose-900'
                                            : 'border-slate-300 bg-slate-50/50 text-slate-800 focus:border-blue-700 focus:bg-white focus:ring-4 focus:ring-blue-100'
                                    }`}
                                    placeholder="tucorreo@ejemplo.com"
                                />
                                {errores.email && (
                                    <p className="mt-1 text-xs font-bold text-rose-600">{errores.email[0]}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Teléfono / Celular
                                </label>
                                <input
                                    type="text"
                                    value={form.telefono}
                                    onChange={(e) => actualizar('telefono', e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-700 focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    placeholder="Ej. 987654321"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Dirección Domiciliaria
                                </label>
                                <input
                                    type="text"
                                    value={form.direccion}
                                    onChange={(e) => actualizar('direccion', e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-700 focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    placeholder="Av. Principal #123"
                                />
                            </div>
                        </div>
                    </section>

                    {/* SECCIÓN 3: DOCUMENTACIÓN Y REQUISITOS ADJUNTOS */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                        <div className="border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-800 text-xs font-bold">3</span>
                                Requisitos y Expediente Adjunto
                            </h2>
                        </div>

                        {/* ARCHIVOS POR CADA REQUISITO EXIGIDO */}
                        {tramiteSeleccionado?.requisitos?.length > 0 ? (
                            <div className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50/40 p-5">
                                <p className="text-xs font-bold uppercase tracking-wider text-blue-900">
                                    Documentos exigidos para este trámite:
                                </p>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    {tramiteSeleccionado.requisitos.map((req) => {
                                        const archivoCargado = archivosRequisitos[req.id];
                                        return (
                                            <div
                                                key={req.id}
                                                className={`rounded-xl border p-4 space-y-2 transition ${
                                                    archivoCargado
                                                        ? 'border-emerald-300 bg-emerald-50/30'
                                                        : 'border-blue-100 bg-white'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-bold text-slate-800">📌 {req.descripcion}</p>
                                                    <span
                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                                            archivoCargado
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : 'bg-blue-100 text-blue-800'
                                                        }`}
                                                    >
                                                        {archivoCargado ? '✓ Cargado' : 'Requisito'}
                                                    </span>
                                                </div>

                                                <input
                                                    type="file"
                                                    onChange={(e) => handleFileRequisito(req.id, e.target.files[0] ?? null)}
                                                    className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2 text-xs text-slate-600 outline-none file:mr-3 file:rounded-md file:border-0 file:bg-blue-900 file:px-3 file:py-1 file:text-xs file:font-bold file:text-white hover:file:bg-blue-950 transition cursor-pointer"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            /* INPUT GENERAL DE ARCHIVO SI NO HAY REQUISITOS ESPECÍFICOS */
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Adjuntar Documento Principal (PDF, JPG, PNG)
                                </label>
                                <input
                                    id="input-archivo"
                                    type="file"
                                    onChange={(e) => actualizar('archivo', e.target.files[0] ?? null)}
                                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-2 text-xs text-slate-600 outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-blue-900 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-blue-950 transition cursor-pointer"
                                />
                                <p className="mt-1.5 text-[11px] text-slate-400">
                                    Formatos permitidos: PDF, JPG o PNG. Tamaño máximo: 10MB.
                                </p>
                                {errores.archivo && (
                                    <p className="mt-1 text-xs font-bold text-rose-600">{errores.archivo[0]}</p>
                                )}
                            </div>
                        )}
                    </section>

                    {/* PIE DE FORMULARIO CON BOTÓN DE ENVÍO */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-xs text-slate-500">
                            Al enviar, declaras bajo juramento que la información y documentos adjuntados son verdaderos.
                        </p>

                        <button
                            type="submit"
                            disabled={enviando}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-900 px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-blue-950 disabled:opacity-50 transition cursor-pointer"
                        >
                            {enviando ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    <span>Procesando Solicitud...</span>
                                </>
                            ) : (
                                <span>🚀 Registrar Solicitud</span>
                            )}
                        </button>
                    </div>
                </form>

                {/* FOOTER */}
                <footer className="mt-12 text-center text-xs text-slate-400 space-y-2 border-t border-slate-200 pt-6">
                    <p>Mesa de Partes Virtual © Sistema de Gestión Documentaria Institucional</p>
                </footer>
            </main>
        </div>
    );
}