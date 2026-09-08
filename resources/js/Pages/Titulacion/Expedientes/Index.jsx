import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useEffect, useRef, useState } from 'react';

const ESTADOS_CONFIG = {
    Iniciado: { label: 'Iniciado', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
    En_Revision: { label: 'En Revisión', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    Apto_Sustentacion: { label: 'Apto Sustentación', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    Sustentado: { label: 'Sustentado', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
    Titulado: { label: 'Titulado', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
    Observado: { label: 'Observado', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    Rechazado: { label: 'Rechazado', bg: 'bg-red-100 text-red-800 border-red-200' },
};

export default function Index({
    titulaciones: titulacionesIniciales,
    modalidades = [],
    planes = [],
    estados = [],
    filtros: filtrosIniciales,
}) {
    const { flash } = usePage().props;

    const [titulaciones, setTitulaciones] = useState(titulacionesIniciales);
    const [buscar, setBuscar] = useState(filtrosIniciales?.buscar || '');
    const [modalidadId, setModalidadId] = useState(filtrosIniciales?.modalidad_id || '');
    const [planEstudioId, setPlanEstudioId] = useState(filtrosIniciales?.plan_estudio_id || '');
    const [estado, setEstado] = useState(filtrosIniciales?.estado || '');
    const [cargando, setCargando] = useState(false);

    const primeraCarga = useRef(true);
    const abortControllerRef = useRef(null);

    useEffect(() => {
        if (flash?.success) {
            Swal.fire({
                icon: 'success',
                title: 'Operación completada',
                text: flash.success,
                timer: 2000,
                showConfirmButton: false,
            });
        }
        if (flash?.error) {
            Swal.fire({
                icon: 'error',
                title: 'No se pudo completar',
                text: flash.error,
            });
        }
    }, [flash]);

    const filtrarExpedientes = async (page = 1) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        setCargando(true);

        try {
            const response = await axios.post(
                route('titulaciones.filtrar'),
                {
                    buscar: buscar.trim() || null,
                    modalidad_id: modalidadId || null,
                    plan_estudio_id: planEstudioId || null,
                    estado: estado || null,
                    page,
                },
                {
                    signal: controller.signal,
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                }
            );

            setTitulaciones(response.data.titulaciones);
        } catch (error) {
            if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
                return;
            }
            Swal.fire({
                icon: 'error',
                title: 'Error al filtrar',
                text: error.response?.data?.message || 'No se pudieron consultar los expedientes.',
            });
        } finally {
            if (abortControllerRef.current === controller) {
                setCargando(false);
            }
        }
    };

    useEffect(() => {
        if (primeraCarga.current) {
            primeraCarga.current = false;
            return;
        }

        const timer = setTimeout(() => {
            filtrarExpedientes(1);
        }, 350);

        return () => clearTimeout(timer);
    }, [buscar, modalidadId, planEstudioId, estado]);

    const eliminarExpediente = async (titulacion) => {
        const result = await Swal.fire({
            title: '¿Eliminar expediente de titulación?',
            text: `Se eliminará el expediente ${titulacion.codigo_expediente} y todos sus documentos adjuntos.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        });

        if (!result.isConfirmed) return;

        router.delete(route('titulaciones.destroy', titulacion.id), {
            preserveScroll: true,
            onSuccess: () => filtrarExpedientes(titulaciones.current_page ?? 1),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Expedientes de Titulación</h1>
                        <p className="text-xs text-slate-500">Gestión de trámites de titulación, revisión de requisitos y aptitud.</p>
                    </div>
                    <Link
                        href={route('titulaciones.create')}
                        className="rounded-xl bg-[#315d7a] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#274b63] shadow-xs inline-block text-center"
                    >
                        + Aperturar Expediente
                    </Link>
                </div>
            }
        >
            <Head title="Expedientes de Titulación" />

            <div className="space-y-5">
                {/* FILTROS DE BÚSQUEDA */}
                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:grid-cols-5">
                    <input
                        type="search"
                        value={buscar}
                        onChange={(e) => setBuscar(e.target.value)}
                        placeholder="Buscar por código, DNI, alumno o título..."
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs md:col-span-2 outline-none focus:border-[#315d7a]"
                    />

                    <select
                        value={modalidadId}
                        onChange={(e) => setModalidadId(e.target.value)}
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-[#315d7a]"
                    >
                        <option value="">Todas las modalidades</option>
                        {modalidades.map((m) => (
                            <option key={m.id} value={m.id}>{m.nombre}</option>
                        ))}
                    </select>

                    <select
                        value={planEstudioId}
                        onChange={(e) => setPlanEstudioId(e.target.value)}
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-[#315d7a]"
                    >
                        <option value="">Todos los programas</option>
                        {planes.map((p) => (
                            <option key={p.id} value={p.id}>{p.codigo} - {p.nombre}</option>
                        ))}
                    </select>

                    <div className="flex items-center gap-2">
                        <select
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                            className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-[#315d7a] w-full"
                        >
                            <option value="">Todos los estados</option>
                            {estados.map((est) => (
                                <option key={est} value={est}>
                                    {ESTADOS_CONFIG[est]?.label || est}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => {
                                setBuscar('');
                                setModalidadId('');
                                setPlanEstudioId('');
                                setEstado('');
                            }}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                        >
                            Limpiar
                        </button>
                    </div>
                </div>

                {/* TABLA DE EXPEDIENTES */}
                <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition ${cargando ? 'opacity-60 pointer-events-none' : ''}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-4 w-12 text-center">#</th>
                                    <th className="py-3 px-4 min-w-[170px]">Expediente</th>
                                    <th className="py-3 px-4 min-w-[200px]">Egresado / DNI</th>
                                    <th className="py-3 px-4 min-w-[220px]">Programa y Modalidad</th>
                                    <th className="py-3 px-4 text-center min-w-[130px]">Requisitos</th>
                                    <th className="py-3 px-4 text-center w-36">Estado</th>
                                    <th className="py-3 px-4 text-right min-w-[120px]">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {titulaciones.data.length > 0 ? (
                                    titulaciones.data.map((item, idx) => {
                                        const configEstado = ESTADOS_CONFIG[item.estado] || { label: item.estado, bg: 'bg-slate-100 text-slate-700' };
                                        const totalReq = item.requisitos_expediente_count || 0;
                                        const aprobadosReq = item.requisitos_aprobados_count || 0;
                                        const porcentajeReq = totalReq > 0 ? Math.round((aprobadosReq / totalReq) * 100) : 0;

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50 transition">
                                                <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                                                    {(titulaciones.current_page - 1) * titulaciones.per_page + idx + 1}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-bold text-[#315d7a] font-mono block">
                                                        {item.codigo_expediente}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400 font-mono">
                                                        Sol: {item.fecha_solicitud}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-bold text-slate-900 block">
                                                        {item.estudiante?.apellidos}, {item.estudiante?.nombres}
                                                    </span>
                                                    <span className="text-[11px] text-slate-500 font-mono">
                                                        DNI: {item.estudiante?.dni}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-semibold text-slate-800 text-[11px] block truncate max-w-[220px]">
                                                        🎓 {item.plan_estudio?.nombre}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 block">
                                                        Modalidad: <strong className="text-slate-700">{item.modalidad?.nombre}</strong>
                                                    </span>
                                                    {item.asesor && (
                                                        <span className="text-[10px] text-slate-400 block">
                                                            Asesor: {item.asesor.nombre} {item.asesor.apellido}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <div className="space-y-1">
                                                        <span className="font-mono text-[11px] font-bold text-slate-700">
                                                            {aprobadosReq} / {totalReq} ({porcentajeReq}%)
                                                        </span>
                                                        <div className="w-24 mx-auto h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${
                                                                    porcentajeReq === 100 ? 'bg-emerald-500' : 'bg-[#315d7a]'
                                                                }`}
                                                                style={{ width: `${porcentajeReq}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${configEstado.bg}`}>
                                                        {configEstado.label}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex justify-end gap-1.5">
                                                        <Link
                                                            href={route('titulaciones.show', item.id)}
                                                            className="rounded-lg bg-[#315d7a] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#274b63] transition shadow-2xs"
                                                        >
                                                            Ver Trámite
                                                        </Link>
                                                        <Link
                                                            href={route('titulaciones.edit', item.id)}
                                                            title="Editar datos del expediente"
                                                            className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 transition shadow-2xs"
                                                        >
                                                            ✏️
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() => eliminarExpediente(item)}
                                                            title="Eliminar expediente"
                                                            className="rounded-lg border border-rose-200 bg-white p-1 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400 text-xs italic">
                                            No se encontraron expedientes de titulación.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* PAGINACIÓN */}
                {titulaciones.links?.length > 3 && (
                    <div className="flex flex-wrap justify-end gap-1">
                        {titulaciones.links.map((link, index) => (
                            <button
                                key={index}
                                type="button"
                                disabled={!link.url || cargando}
                                onClick={() => {
                                    const pageNum = new URL(link.url).searchParams.get('page') || 1;
                                    filtrarExpedientes(Number(pageNum));
                                }}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                                    link.active
                                        ? 'border-[#315d7a] bg-[#315d7a] text-white'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                } ${!link.url ? 'opacity-30 cursor-not-allowed' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}