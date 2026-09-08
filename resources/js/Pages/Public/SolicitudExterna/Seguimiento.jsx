import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Seguimiento({ codigoInicial = '', solicitud = null }) {
    const [codigo, setCodigo] = useState(codigoInicial);

    const handleBuscar = (e) => {
        e.preventDefault();
        if (!codigo.trim()) return;

        router.get(
            route('solicitud-externa.seguimiento', { codigo: codigo.trim() }),
            {},
            { preserveState: true }
        );
    };

    const getBadgeEstado = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'pendiente':
                return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full border border-amber-200">⏳ Pendiente de Revisión</span>;
            case 'procesado':
            case 'en_proceso':
                return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">⚙️ En Trámite / Proceso</span>;
            case 'derivado':
                return <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full border border-purple-200">↗️ Derivado</span>;
            case 'completado':
                return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">✅ Completado / Finalizado</span>;
            case 'rechazado':
                return <span className="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full border border-rose-200">❌ Observado / Rechazado</span>;
            default:
                return <span className="bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1 rounded-full">{estado}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 font-sans text-slate-800 antialiased">
            <Head title="Consulta de Trámite - Mesa de Partes Virtual" />

            {/* HERO BAR INSTITUCIONAL */}
            <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white shadow-md">
                <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 border border-blue-400/30">
                                🔍 Sistema de Seguimiento en Línea
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-2">
                                Consulta el Estado de tu Trámite
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                                Ingresa tu Código de Seguimiento Oficial para conocer la ubicación actual y el historial de atención de tu expediente.
                            </p>
                        </div>

                        <a
                            href={route('solicitud-externa.create')}
                            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition backdrop-blur-sm"
                        >
                            📝 Registrar Nueva Solicitud
                        </a>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">

                {/* CAJA DE BÚSQUEDA DEL CÓDIGO */}
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={codigo}
                                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                                placeholder="Ej. TRM-2026-X89A"
                                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold tracking-wider text-slate-900 outline-none uppercase focus:border-blue-700 focus:bg-white focus:ring-4 focus:ring-blue-100 transition"
                            />
                        </div>
                        <button
                            type="submit"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-900 px-8 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-blue-950 transition cursor-pointer"
                        >
                            🔍 Consultar Estado
                        </button>
                    </form>
                </section>

                {/* RESULTADO DE LA CONSULTA */}
                {solicitud ? (
                    <div className="space-y-8">

                        {/* TARJETA 1: DATOS GENERALES DEL EXPEDIENTE */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Código de Seguimiento</span>
                                    <h2 className="text-xl font-black text-blue-950 tracking-wider">{solicitud.codigo_seguimiento}</h2>
                                </div>
                                <div>{getBadgeEstado(solicitud.estado)}</div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                                <div>
                                    <p className="font-bold text-slate-400 uppercase text-[10px]">Trámite Solicitado</p>
                                    <p className="font-bold text-slate-800 text-sm mt-0.5">{solicitud.tramite}</p>
                                </div>

                                <div>
                                    <p className="font-bold text-slate-400 uppercase text-[10px]">Solicitante</p>
                                    <p className="font-bold text-slate-800 text-sm mt-0.5">{solicitud.solicitante}</p>
                                </div>

                                <div>
                                    <p className="font-bold text-slate-400 uppercase text-[10px]">Ubicación Actual / Área</p>
                                    <p className="font-bold text-blue-900 text-sm mt-0.5">🏢 {solicitud.area_actual}</p>
                                </div>

                                <div>
                                    <p className="font-bold text-slate-400 uppercase text-[10px]">Fecha de Ingreso</p>
                                    <p className="font-medium text-slate-700 mt-0.5">{solicitud.fecha_solicitud}</p>
                                </div>

                                {solicitud.fecha_resolucion && (
                                    <div>
                                        <p className="font-bold text-slate-400 uppercase text-[10px]">Fecha de Finalización</p>
                                        <p className="font-medium text-slate-700 mt-0.5">{solicitud.fecha_resolucion}</p>
                                    </div>
                                )}
                            </div>

                            {solicitud.motivo_rechazo && (
                                <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 text-xs space-y-1">
                                    <p className="font-bold text-rose-900">⚠️ Motivo de Observación / Rechazo:</p>
                                    <p className="text-rose-800">{solicitud.motivo_rechazo}</p>
                                </div>
                            )}
                        </section>

                        {/* TARJETA 2: DOCUMENTOS REQUISITOS REGISTRADOS */}
                        {solicitud.archivos?.length > 0 && (
                            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-2">
                                    Documentos y Requisitos Entregados
                                </h3>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {solicitud.archivos.map((adj) => (
                                        <div key={adj.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                                            <div className="space-y-0.5">
                                                <p className="font-bold text-slate-800">📄 {adj.requisito}</p>
                                                <p className="text-[10px] text-slate-400">{adj.nombre_original}</p>
                                            </div>
                                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                                Recibido
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* TARJETA 3: LÍNEA DE TIEMPO / HISTORIAL DE DERIVACIONES */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-2">
                                Historial de Recorrido y Derivaciones del Expediente
                            </h3>

                            <div className="relative border-l-2 border-blue-200 ml-4 pl-6 space-y-8">
                                
                                {/* PASO 0: RECEPCIÓN INICIAL EN MESA DE PARTES */}
                                <div className="relative">
                                    <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 ring-4 ring-white" />
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-bold text-slate-900">Ingreso a Mesa de Partes General</p>
                                            <span className="text-[10px] font-semibold text-slate-400">{solicitud.fecha_solicitud}</span>
                                        </div>
                                        <p className="text-xs text-slate-600">
                                            La solicitud e información digital ingresó al sistema de la institución para su evaluación preliminar.
                                        </p>
                                    </div>
                                </div>

                                {/* PASOS N: HISTORIAL DE DERIVACIONES REGISTRADAS */}
                                {solicitud.historial?.length > 0 ? (
                                    solicitud.historial.map((der, idx) => (
                                        <div key={der.id || idx} className="relative">
                                            <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-900 ring-4 ring-white" />
                                            <div className="space-y-1 bg-slate-50 border border-slate-200 rounded-xl p-4">
                                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                                                    <p className="text-xs font-bold text-blue-950">
                                                        Derivado de <span className="underline">{der.area_origen}</span> ➔ <span className="underline">{der.area_destino}</span>
                                                    </p>
                                                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border">
                                                        {der.fecha_derivacion}
                                                    </span>
                                                </div>

                                                {der.observacion && (
                                                    <p className="text-xs text-slate-700 pt-1">
                                                        <strong>Observación del área:</strong> {der.observacion}
                                                    </p>
                                                )}

                                                {der.comentarios && (
                                                    <p className="text-xs text-slate-600 italic">
                                                        "{der.comentarios}"
                                                    </p>
                                                )}

                                                {der.fecha_aceptacion && (
                                                    <p className="text-[10px] text-emerald-700 font-semibold pt-1">
                                                        ✓ Recepcionado por {der.area_destino} el {der.fecha_aceptacion}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="relative">
                                        <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 ring-4 ring-white" />
                                        <p className="text-xs text-slate-500 italic">
                                            El expediente se encuentra actualmente en evaluación por Mesa de Partes antes de ser derivado a su oficina correspondiente.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>

                    </div>
                ) : (
                    codigoInicial && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center space-y-2">
                            <span className="text-2xl">⚠️</span>
                            <h3 className="text-sm font-bold text-rose-900">No se encontró información</h3>
                            <p className="text-xs text-rose-700">
                                No existe ningún expediente registrado con el código <strong>"{codigoInicial}"</strong>. Por favor verifica que el código esté escrito correctamente.
                            </p>
                        </div>
                    )
                )}

                {/* FOOTER */}
                <footer className="mt-12 text-center text-xs text-slate-400 space-y-2 border-t border-slate-200 pt-6">
                    <p>Mesa de Partes Virtual © Sistema de Gestión Documentaria Institucional</p>
                </footer>
            </main>
        </div>
    );
}