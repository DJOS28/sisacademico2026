import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ anuncios, planesEstudio = [], filtros = {} }) {
    const [listaAnuncios, setListaAnuncios] = useState(anuncios.data || []);
    const [buscar, setBuscar] = useState(filtros.buscar || '');
    const [planEstudioId, setPlanEstudioId] = useState(filtros.plan_estudio_id || '');
    const [activo, setActivo] = useState(filtros.activo !== undefined && filtros.activo !== null ? filtros.activo : '');
    const [cargando, setCargando] = useState(false);

    // Modales
    const [modalAbierto, setModalAbierto] = useState(false);
    const [anuncioEnEdicion, setAnuncioEnEdicion] = useState(null);
    const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
    const [anuncioAEliminar, setAnuncioAEliminar] = useState(null);

    const form = useForm({
        titulo: '',
        contenido: '',
        plan_estudio_id: '',
        activo: true,
    });

    const abrirCrear = () => {
        setAnuncioEnEdicion(null);
        form.reset();
        form.clearErrors();
        form.setData({
            titulo: '',
            contenido: '',
            plan_estudio_id: planesEstudio[0]?.id || '',
            activo: true,
        });
        setModalAbierto(true);
    };

    const abrirEditar = (anuncio) => {
        setAnuncioEnEdicion(anuncio);
        form.clearErrors();
        form.setData({
            titulo: anuncio.titulo,
            contenido: anuncio.contenido,
            plan_estudio_id: anuncio.plan_estudio_id,
            activo: Boolean(anuncio.activo),
        });
        setModalAbierto(true);
    };

    const guardarAnuncio = (e) => {
        e.preventDefault();

        if (anuncioEnEdicion) {
            form.put(route('anuncios.update', anuncioEnEdicion.id_anuncio), {
                preserveScroll: true,
                onSuccess: () => {
                    setModalAbierto(false);
                    ejecutarFiltro();
                },
            });
        } else {
            form.post(route('anuncios.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    setModalAbierto(false);
                    ejecutarFiltro();
                },
            });
        }
    };

    const confirmarEliminar = (anuncio) => {
        setAnuncioAEliminar(anuncio);
        setModalEliminarAbierto(true);
    };

    const eliminarAnuncio = () => {
        if (!anuncioAEliminar) return;

        router.delete(route('anuncios.destroy', anuncioAEliminar.id_anuncio), {
            preserveScroll: true,
            onSuccess: () => {
                setModalEliminarAbierto(false);
                setAnuncioAEliminar(null);
                ejecutarFiltro();
            },
        });
    };

    const alternarEstado = (anuncio) => {
        window.axios
            .patch(route('anuncios.toggle-estado', anuncio.id_anuncio))
            .then((res) => {
                if (res.data.success) {
                    setListaAnuncios((prev) =>
                        prev.map((item) =>
                            item.id_anuncio === anuncio.id_anuncio ? { ...item, activo: res.data.activo } : item
                        )
                    );
                }
            })
            .catch(() => ejecutarFiltro());
    };

    const ejecutarFiltro = () => {
        setCargando(true);
        window.axios
            .post(route('anuncios.filtrar'), {
                buscar,
                plan_estudio_id: planEstudioId,
                activo,
            })
            .then((res) => {
                setListaAnuncios(res.data.anuncios.data || []);
            })
            .catch(() => {
                router.get(
                    route('anuncios.index'),
                    { buscar, plan_estudio_id: planEstudioId, activo },
                    { preserveState: true }
                );
            })
            .finally(() => setCargando(false));
    };

    const limpiarFiltros = () => {
        setBuscar('');
        setPlanEstudioId('');
        setActivo('');
        setCargando(true);

        window.axios
            .post(route('anuncios.filtrar'), {
                buscar: '',
                plan_estudio_id: '',
                activo: '',
            })
            .then((res) => {
                setListaAnuncios(res.data.anuncios.data || []);
            })
            .finally(() => setCargando(false));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-[#315d7a]">
                            Servicios e Interacción
                        </div>
                        <h1 className="text-xl font-bold text-slate-800 mt-0.5">Gestión de Avisos y Anuncios</h1>
                        <p className="text-xs text-slate-500">Publicaciones de comunicados por programa formativo.</p>
                    </div>

                    <button
                        type="button"
                        onClick={abrirCrear}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#315d7a] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#254860] transition"
                    >
                        <span>+ Publicar Nuevo Aviso</span>
                    </button>
                </div>
            }
        >
            <Head title="Avisos y Anuncios" />

            <div className="space-y-4">
                {/* BARRA DE FILTRADO EN UNA SOLA LÍNEA */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                    <div className="flex items-end gap-3">
                        {/* Búsqueda por texto */}
                        <div className="flex-1 min-w-[220px]">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Buscar por título o contenido:
                            </label>
                            <input
                                type="text"
                                value={buscar}
                                onChange={(e) => setBuscar(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && ejecutarFiltro()}
                                placeholder="Escribe y presiona Enter..."
                                className="h-9 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#315d7a] focus:ring-1 focus:ring-[#315d7a]"
                            />
                        </div>

                        {/* Programa de Estudio */}
                        <div className="w-64 flex-shrink-0">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Programa de Estudio:
                            </label>
                            <select
                                value={planEstudioId}
                                onChange={(e) => setPlanEstudioId(e.target.value)}
                                className="h-9 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 focus:border-[#315d7a] focus:ring-1 focus:ring-[#315d7a]"
                            >
                                <option value="">Todos los programas</option>
                                {planesEstudio.map((plan) => (
                                    <option key={plan.id} value={plan.id}>
                                        {plan.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Estado */}
                        <div className="w-40 flex-shrink-0">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Estado:
                            </label>
                            <select
                                value={activo}
                                onChange={(e) => setActivo(e.target.value)}
                                className="h-9 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 focus:border-[#315d7a] focus:ring-1 focus:ring-[#315d7a]"
                            >
                                <option value="">Todos</option>
                                <option value="1">Activos</option>
                                <option value="0">Ocultos / Inactivos</option>
                            </select>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                                type="button"
                                onClick={ejecutarFiltro}
                                disabled={cargando}
                                className="h-9 px-5 inline-flex items-center justify-center rounded-lg bg-[#315d7a] text-xs font-semibold text-white hover:bg-[#254860] transition disabled:opacity-50"
                            >
                                {cargando ? '...' : 'Filtrar'}
                            </button>
                            {(buscar !== '' || planEstudioId !== '' || activo !== '') && (
                                <button
                                    type="button"
                                    onClick={limpiarFiltros}
                                    title="Limpiar filtros"
                                    className="h-9 px-3 inline-flex items-center justify-center rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-100 transition text-xs font-bold"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* LISTADO DE ANUNCIOS */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Comunicados Registrados ({listaAnuncios.length})
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {listaAnuncios.length > 0 ? (
                            listaAnuncios.map((anuncio) => (
                                <div key={anuncio.id_anuncio} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition">
                                    <div className="space-y-1.5 max-w-2xl">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
                                                {anuncio.plan_estudio?.nombre || 'General'}
                                            </span>
                                            <span className="text-[11px] text-slate-400">
                                                {new Date(anuncio.created_at).toLocaleDateString('es-PE', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-900">{anuncio.titulo}</h3>
                                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                                            {anuncio.contenido}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => alternarEstado(anuncio)}
                                            className={`h-8 px-3 rounded-lg text-xs font-semibold border transition ${
                                                anuncio.activo
                                                    ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                                    : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                                            }`}
                                        >
                                            {anuncio.activo ? '● Publicado' : '○ Borrador'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => abrirEditar(anuncio)}
                                            className="h-8 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                        >
                                            Editar
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => confirmarEliminar(anuncio)}
                                            className="h-8 px-3 rounded-lg border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-10 text-center text-xs text-slate-400 italic">
                                No se encontraron avisos registrados con los criterios seleccionados.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL CREAR / EDITAR */}
            {modalAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="w-full max-w-lg rounded-xl bg-white shadow-xl overflow-hidden">
                        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3.5 flex justify-between items-center">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                {anuncioEnEdicion ? 'Modificar Anuncio' : 'Publicar Nuevo Anuncio'}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setModalAbierto(false)}
                                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={guardarAnuncio} className="p-5 space-y-3.5">
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    Título del Comunicado:
                                </label>
                                <input
                                    type="text"
                                    value={form.data.titulo}
                                    onChange={(e) => form.setData('titulo', e.target.value)}
                                    placeholder="Ej: Inicio de matrícula extemporánea 2026-I"
                                    className="h-9 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 focus:border-[#315d7a] focus:ring-1 focus:ring-[#315d7a]"
                                    required
                                />
                                {form.errors.titulo && <span className="text-[11px] text-red-600 font-semibold">{form.errors.titulo}</span>}
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    Programa de Estudio:
                                </label>
                                <select
                                    value={form.data.plan_estudio_id}
                                    onChange={(e) => form.setData('plan_estudio_id', e.target.value)}
                                    className="h-9 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 focus:border-[#315d7a] focus:ring-1 focus:ring-[#315d7a]"
                                    required
                                >
                                    <option value="">Selecciona el programa</option>
                                    {planesEstudio.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.nombre} {p.codigo ? `(${p.codigo})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.plan_estudio_id && <span className="text-[11px] text-red-600 font-semibold">{form.errors.plan_estudio_id}</span>}
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    Contenido del Aviso:
                                </label>
                                <textarea
                                    rows={4}
                                    value={form.data.contenido}
                                    onChange={(e) => form.setData('contenido', e.target.value)}
                                    placeholder="Escribe el cuerpo del comunicado..."
                                    className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-800 focus:border-[#315d7a] focus:ring-1 focus:ring-[#315d7a]"
                                    required
                                />
                                {form.errors.contenido && <span className="text-[11px] text-red-600 font-semibold">{form.errors.contenido}</span>}
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="check_activo"
                                    checked={form.data.activo}
                                    onChange={(e) => form.setData('activo', e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-[#315d7a] focus:ring-[#315d7a]"
                                />
                                <label htmlFor="check_activo" className="text-xs font-semibold text-slate-700 cursor-pointer">
                                    Publicar y hacer visible a los estudiantes
                                </label>
                            </div>

                            <div className="border-t border-slate-100 pt-3 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setModalAbierto(false)}
                                    className="h-8 px-4 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="h-8 px-4 rounded-lg bg-[#315d7a] text-xs font-semibold text-white hover:bg-[#254860] transition disabled:opacity-50"
                                >
                                    {form.processing ? 'Guardando...' : anuncioEnEdicion ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL ELIMINAR */}
            {modalEliminarAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl space-y-4">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">¿Eliminar comunicado?</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Se eliminará el aviso <span className="font-semibold text-slate-800">"{anuncioAEliminar?.titulo}"</span> permanentemente.
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setModalEliminarAbierto(false)}
                                className="h-8 px-4 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={eliminarAnuncio}
                                className="h-8 px-4 rounded-lg bg-red-600 text-xs font-semibold text-white hover:bg-red-700 transition"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}