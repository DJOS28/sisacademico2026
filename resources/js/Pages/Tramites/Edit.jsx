import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useMemo, useState } from 'react';

export default function Edit({ tramite, requisitosDisponibles = [] }) {
    const [form, setForm] = useState({
        nombre: tramite.nombre ?? '',
        descripcion: tramite.descripcion ?? '',
        estado: tramite.estado ?? 'Activo',
        costo: tramite.costo ?? '',
        tiempo: tramite.tiempo ?? '',
        requisitos: tramite.requisitos?.map((r) => r.id) ?? [],
    });

    const [filtroRequisito, setFiltroRequisito] = useState('');
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);

    // Filtrado dinámico de requisitos
    const requisitosFiltrados = useMemo(() => {
        if (!filtroRequisito.trim()) return requisitosDisponibles;
        const query = filtroRequisito.toLowerCase();
        return requisitosDisponibles.filter((r) =>
            r.descripcion?.toLowerCase().includes(query)
        );
    }, [filtroRequisito, requisitosDisponibles]);

    const toggleRequisito = (id) => {
        setForm((prev) => ({
            ...prev,
            requisitos: prev.requisitos.includes(id)
                ? prev.requisitos.filter((r) => r !== id)
                : [...prev.requisitos, id],
        }));
    };

    const seleccionarTodos = () => {
        const idsVisibles = requisitosFiltrados.map((r) => r.id);
        const combinados = Array.from(new Set([...form.requisitos, ...idsVisibles]));
        setForm((prev) => ({ ...prev, requisitos: combinados }));
    };

    const deseleccionarTodos = () => {
        setForm((prev) => ({ ...prev, requisitos: [] }));
    };

    const guardar = async (event) => {
        event.preventDefault();
        setGuardando(true);
        setErrores({});

        try {
            const { data } = await axios.put(route('tramites.update', tramite.id), form);

            await Swal.fire({
                icon: 'success',
                title: 'Trámite actualizado',
                text: data.message ?? 'Los cambios y requisitos se guardaron con éxito.',
                timer: 2000,
                showConfirmButton: false,
            });

            router.visit(route('tramites.index'));
        } catch (error) {
            if (error.response?.status === 422) {
                setErrores(error.response.data.errors ?? {});
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'No se pudo completar',
                    text: error.response?.data?.message ?? 'Ocurrió un error inesperado.',
                });
            }
        } finally {
            setGuardando(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Editar Trámite Institucional</h1>
                        <p className="text-xs text-slate-500">Modificación de información arancelaria y requisitos obligatorios: <span className="font-semibold text-slate-700">{tramite.nombre}</span></p>
                    </div>
                    <Link
                        href={route('tramites.index')}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition self-start shadow-2xs"
                    >
                        ← Volver al catálogo
                    </Link>
                </div>
            }
        >
            <Head title={`Editar - ${tramite.nombre}`} />

            <form onSubmit={guardar} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* PANEL IZQUIERDO: INFORMACIÓN GENERAL DEL TRÁMITE */}
                    <div className="lg:col-span-5 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                        <div className="border-b border-slate-100 pb-3">
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                1. Datos Generales
                            </h2>
                            <p className="text-xs text-slate-500">Configuración de parámetros y disponibilidad.</p>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Nombre del Trámite <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.nombre}
                                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                placeholder="Ej. Certificado Modular / Constancia de Matrícula"
                                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                autoFocus
                            />
                            {errores.nombre && (
                                <p className="mt-1 text-xs font-semibold text-rose-600">{errores.nombre[0]}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Descripción y Alcance
                            </label>
                            <textarea
                                rows={4}
                                value={form.descripcion}
                                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                                placeholder="Detalles sobre cuándo aplica este trámite y a quién está dirigido..."
                                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                            />
                            {errores.descripcion && (
                                <p className="mt-1 text-xs font-semibold text-rose-600">{errores.descripcion[0]}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Costo (S/)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={form.costo}
                                    onChange={(e) => setForm({ ...form, costo: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 font-mono outline-none focus:border-[#315d7a]"
                                />
                                {errores.costo && (
                                    <p className="mt-1 text-xs font-semibold text-rose-600">{errores.costo[0]}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Tiempo Estimado
                                </label>
                                <input
                                    type="text"
                                    value={form.tiempo}
                                    onChange={(e) => setForm({ ...form, tiempo: e.target.value })}
                                    placeholder="Ej. 3 días hábiles"
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                />
                                {errores.tiempo && (
                                    <p className="mt-1 text-xs font-semibold text-rose-600">{errores.tiempo[0]}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Estado del Trámite
                            </label>
                            <select
                                value={form.estado}
                                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                            >
                                <option value="Activo">Activo (Visible en mesa de partes)</option>
                                <option value="Inactivo">Inactivo (Oculto)</option>
                            </select>
                        </div>
                    </div>

                    {/* PANEL DERECHO: SELECTOR MASIVO Y ESCALABLE DE REQUISITOS */}
                    <div className="lg:col-span-7 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                    2. Requisitos Exigidos
                                </h2>
                                <p className="text-xs text-slate-500">Documentos y condiciones obligatorias para este trámite.</p>
                            </div>
                            <span className="bg-[#315d7a]/10 text-[#315d7a] font-bold text-xs px-3 py-1 rounded-full border border-[#315d7a]/20 self-start">
                                {form.requisitos.length} asignados
                            </span>
                        </div>

                        {/* BARRA DE BÚSQUEDA Y ACCIONES MASIVAS */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="search"
                                value={filtroRequisito}
                                onChange={(e) => setFiltroRequisito(e.target.value)}
                                placeholder="🔍 Buscar requisito..."
                                className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-[#315d7a]"
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={seleccionarTodos}
                                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                >
                                    Todos
                                </button>
                                <button
                                    type="button"
                                    onClick={deseleccionarTodos}
                                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                >
                                    Limpiar
                                </button>
                            </div>
                        </div>

                        {/* LISTADO CON SCROLL Y TARJETAS SELECCIONABLES */}
                        <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-50">
                            {requisitosFiltrados.length > 0 ? (
                                requisitosFiltrados.map((requisito) => {
                                    const seleccionado = form.requisitos.includes(requisito.id);
                                    return (
                                        <label
                                            key={requisito.id}
                                            className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                                                seleccionado
                                                    ? 'bg-sky-50/70 border-sky-300 ring-1 ring-sky-300'
                                                    : 'bg-white border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={seleccionado}
                                                onChange={() => toggleRequisito(requisito.id)}
                                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#315d7a] focus:ring-[#315d7a]"
                                            />
                                            <div className="flex-1 text-xs">
                                                <span className={`font-semibold block ${seleccionado ? 'text-[#315d7a]' : 'text-slate-800'}`}>
                                                    {requisito.descripcion}
                                                </span>
                                                {requisito.tipo && (
                                                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                                                        Tipo: {requisito.tipo}
                                                    </span>
                                                )}
                                            </div>
                                        </label>
                                    );
                                })
                            ) : (
                                <div className="py-12 text-center text-xs text-slate-400 italic">
                                    No se encontraron requisitos que coincidan con la búsqueda.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* BOTONERA INFERIOR */}
                <div className="flex justify-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                    <Link
                        href={route('tramites.index')}
                        className="rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={guardando}
                        className="rounded-xl bg-[#315d7a] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-[#274c64] disabled:opacity-60 shadow-xs cursor-pointer"
                    >
                        {guardando ? 'Guardando cambios...' : 'Actualizar Trámite'}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}