import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useEffect, useRef, useState } from 'react';

export default function Index({
    recursos: recursosIniciales,
    categorias = [],
    autores = [],
    planes = [],
    asesores = [],
    filtros: filtrosIniciales,
}) {
    const { flash } = usePage().props;

    const [recursos, setRecursos] = useState(recursosIniciales);
    const [buscar, setBuscar] = useState(filtrosIniciales?.buscar || '');
    const [categoriaId, setCategoriaId] = useState(filtrosIniciales?.categoria_id || '');
    const [autorId, setAutorId] = useState(filtrosIniciales?.autor_id || '');
    const [estado, setEstado] = useState(filtrosIniciales?.estado || '');
    const [cargando, setCargando] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [recursoEnEdicion, setRecursoEnEdicion] = useState(null);

    const primeraCarga = useRef(true);
    const abortControllerRef = useRef(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        titulo: '',
        descripcion: '',
        plan_estudio_id: '',
        asesor_id: '',
        anio_publicacion: new Date().getFullYear(),
        palabras_clave: '',
        activo: true,
        autor_ids: [],
        categoria_ids: [],
        archivo: null,
    });

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

    // Filtrado asíncrono AJAX
    const filtrarRecursos = async (page = 1) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        setCargando(true);

        try {
            const response = await axios.post(
                route('repositorio-recursos.filtrar'),
                {
                    buscar: buscar.trim() || null,
                    categoria_id: categoriaId || null,
                    autor_id: autorId || null,
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

            setRecursos(response.data.recursos);
        } catch (error) {
            if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
                return;
            }
            Swal.fire({
                icon: 'error',
                title: 'Error al filtrar',
                text: error.response?.data?.message || 'No se pudieron consultar los documentos.',
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
            filtrarRecursos(1);
        }, 350);

        return () => clearTimeout(timer);
    }, [buscar, categoriaId, autorId, estado]);

    const abrirModalCrear = () => {
        setRecursoEnEdicion(null);
        reset();
        clearErrors();
        setData({
            titulo: '',
            descripcion: '',
            plan_estudio_id: '',
            asesor_id: '',
            anio_publicacion: new Date().getFullYear(),
            palabras_clave: '',
            activo: true,
            autor_ids: [],
            categoria_ids: [],
            archivo: null,
        });
        setModalOpen(true);
    };

    const abrirModalEditar = (recurso) => {
        setRecursoEnEdicion(recurso);
        clearErrors();
        setData({
            titulo: recurso.titulo || '',
            descripcion: recurso.descripcion || '',
            plan_estudio_id: recurso.plan_estudio_id || '',
            asesor_id: recurso.asesor_id || '',
            anio_publicacion: recurso.anio_publicacion || new Date().getFullYear(),
            palabras_clave: recurso.palabras_clave || '',
            activo: Boolean(recurso.activo),
            autor_ids: recurso.autores ? recurso.autores.map((a) => a.id) : [],
            categoria_ids: recurso.categorias ? recurso.categorias.map((c) => c.id) : [],
            archivo: null,
        });
        setModalOpen(true);
    };

    const cerrarModal = () => {
        setModalOpen(false);
        setRecursoEnEdicion(null);
        reset();
        clearErrors();
    };

    const toggleAutorId = (id) => {
        const numId = Number(id);
        if (!numId) return;
        if (data.autor_ids.includes(numId)) {
            setData('autor_ids', data.autor_ids.filter((item) => item !== numId));
        } else {
            setData('autor_ids', [...data.autor_ids, numId]);
        }
    };

    const toggleCategoriaId = (id) => {
        const numId = Number(id);
        if (!numId) return;
        if (data.categoria_ids.includes(numId)) {
            setData('categoria_ids', data.categoria_ids.filter((item) => item !== numId));
        } else {
            setData('categoria_ids', [...data.categoria_ids, numId]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (recursoEnEdicion) {
            post(route('repositorio-recursos.update', recursoEnEdicion.id), {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    cerrarModal();
                    filtrarRecursos(recursos.current_page ?? 1);
                },
            });
        } else {
            post(route('repositorio-recursos.store'), {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    cerrarModal();
                    filtrarRecursos(1);
                },
            });
        }
    };

    const toggleEstado = (recurso) => {
        router.patch(
            route('repositorio-recursos.estado', recurso.id),
            { activo: !recurso.activo },
            {
                preserveScroll: true,
                onSuccess: () => filtrarRecursos(recursos.current_page ?? 1),
            }
        );
    };

    const eliminarRecurso = async (recurso) => {
        const result = await Swal.fire({
            title: '¿Eliminar documento?',
            text: `Se eliminará permanentemente "${recurso.titulo}" y su archivo adjunto.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        });

        if (!result.isConfirmed) return;

        router.delete(route('repositorio-recursos.destroy', recurso.id), {
            preserveScroll: true,
            onSuccess: () => filtrarRecursos(recursos.current_page ?? 1),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Repositorio Digital Institucional</h1>
                        <p className="text-xs text-slate-500">Publicaciones, tesis, artículos y proyectos académicos.</p>
                    </div>
                    <button
                        type="button"
                        onClick={abrirModalCrear}
                        className="rounded-xl bg-[#315d7a] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#274b63] shadow-xs cursor-pointer"
                    >
                        + Publicar Documento
                    </button>
                </div>
            }
        >
            <Head title="Repositorio Digital" />

            <div className="space-y-5">
                {/* BARRA DE FILTROS */}
                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:grid-cols-5">
                    <input
                        type="search"
                        value={buscar}
                        onChange={(e) => setBuscar(e.target.value)}
                        placeholder="Buscar por título, palabras clave o autor..."
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs md:col-span-2 outline-none focus:border-[#315d7a]"
                    />

                    <select
                        value={categoriaId}
                        onChange={(e) => setCategoriaId(e.target.value)}
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-[#315d7a]"
                    >
                        <option value="">Todas las categorías</option>
                        {categorias.map((c) => (
                            <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                    </select>

                    <select
                        value={autorId}
                        onChange={(e) => setAutorId(e.target.value)}
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-[#315d7a]"
                    >
                        <option value="">Todos los autores</option>
                        {autores.map((a) => (
                            <option key={a.id} value={a.id}>{a.nombre}</option>
                        ))}
                    </select>

                    <div className="flex items-center gap-2">
                        <select
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                            className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-[#315d7a] w-full"
                        >
                            <option value="">Todos</option>
                            <option value="Activo">Activos</option>
                            <option value="Inactivo">Inactivos</option>
                        </select>
                        <button
                            type="button"
                            onClick={() => {
                                setBuscar('');
                                setCategoriaId('');
                                setAutorId('');
                                setEstado('');
                            }}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                        >
                            Limpiar
                        </button>
                    </div>
                </div>

                {/* TABLA DE PUBLICACIONES */}
                <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition ${cargando ? 'opacity-60 pointer-events-none' : ''}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-4 w-12 text-center">#</th>
                                    <th className="py-3 px-4 min-w-[280px]">Título y Resumen</th>
                                    <th className="py-3 px-4 min-w-[180px]">Autor(es) / Asesor</th>
                                    <th className="py-3 px-4 min-w-[150px]">Carrera / Categoría</th>
                                    <th className="py-3 px-4 text-center w-28">Métricas</th>
                                    <th className="py-3 px-4 text-center w-24">Estado</th>
                                    <th className="py-3 px-4 text-right min-w-[140px]">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recursos.data.length > 0 ? (
                                    recursos.data.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition">
                                            <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                                                {(recursos.current_page - 1) * recursos.per_page + idx + 1}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="space-y-1">
                                                    <span className="font-bold text-slate-900 leading-snug block">
                                                        {item.titulo}
                                                    </span>
                                                    {item.descripcion && (
                                                        <p className="text-[11px] text-slate-500 line-clamp-2">
                                                            {item.descripcion}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-2 pt-0.5 text-[10px] text-slate-400 font-mono">
                                                        <span>Año: {item.anio_publicacion || 'N/D'}</span>
                                                        <span>•</span>
                                                        <span className="uppercase uppercase font-bold text-[#315d7a]">
                                                            {item.tipo_archivo || 'PDF'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="space-y-1">
                                                    <div className="flex flex-wrap gap-1">
                                                        {item.autores && item.autores.length > 0 ? (
                                                            item.autores.map((a) => (
                                                                <span
                                                                    key={a.id}
                                                                    className="bg-sky-50 text-[#315d7a] px-2 py-0.5 rounded-md text-[10px] font-semibold border border-sky-100"
                                                                >
                                                                    👤 {a.nombre}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-slate-400 italic">Sin autores</span>
                                                        )}
                                                    </div>
                                                    {item.asesor && (
                                                        <span className="text-[10px] text-slate-500 block font-medium">
                                                            Asesor: {item.asesor.nombre} {item.asesor.apellido}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="space-y-1">
                                                    {item.plan_estudio && (
                                                        <span className="font-semibold text-slate-800 text-[11px] block truncate max-w-[180px]">
                                                            🎓 {item.plan_estudio.nombre}
                                                        </span>
                                                    )}
                                                    <div className="flex flex-wrap gap-1">
                                                        {item.categorias && item.categorias.map((c) => (
                                                            <span
                                                                key={c.id}
                                                                className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-mono"
                                                            >
                                                                {c.nombre}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <div className="space-y-1 font-mono text-[10px]">
                                                    <span className="inline-block bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                                        👁️ {item.visitas}
                                                    </span>
                                                    <span className="inline-block bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                                                        ⬇️ {item.descargas}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleEstado(item)}
                                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer border ${
                                                        item.activo
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                                    }`}
                                                >
                                                    {item.activo ? 'Activo' : 'Inactivo'}
                                                </button>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex justify-end gap-1.5">
                                                    <a
                                                        href={route('repositorio-recursos.ver', item.id)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Ver documento"
                                                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 transition shadow-2xs"
                                                    >
                                                        👁️
                                                    </a>
                                                    <a
                                                        href={route('repositorio-recursos.descargar', item.id)}
                                                        title="Descargar archivo"
                                                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-emerald-600 hover:bg-emerald-50 transition shadow-2xs"
                                                    >
                                                        ⬇️
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => abrirModalEditar(item)}
                                                        title="Editar datos"
                                                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-[#315d7a] hover:bg-slate-100 transition shadow-2xs cursor-pointer"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => eliminarRecurso(item)}
                                                        title="Eliminar publicación"
                                                        className="rounded-lg border border-rose-200 bg-white p-1.5 text-rose-600 hover:bg-rose-50 transition shadow-2xs cursor-pointer"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400 text-xs italic">
                                            No se encontraron documentos registrados en el repositorio.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* PAGINACIÓN */}
                {recursos.links?.length > 3 && (
                    <div className="flex flex-wrap justify-end gap-1">
                        {recursos.links.map((link, index) => (
                            <button
                                key={index}
                                type="button"
                                disabled={!link.url || cargando}
                                onClick={() => {
                                    const pageNum = new URL(link.url).searchParams.get('page') || 1;
                                    filtrarRecursos(Number(pageNum));
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

            {/* MODAL CREAR / EDITAR PUBLICACIÓN */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    {recursoEnEdicion ? 'Editar Documento del Repositorio' : 'Publicar Nuevo Documento'}
                                </h3>
                                <p className="text-xs text-slate-500">Metadatos, archivos y filiaciones de la investigación.</p>
                            </div>
                            <button
                                type="button"
                                onClick={cerrarModal}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Título de la Publicación / Tesis <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.titulo}
                                    onChange={(e) => setData('titulo', e.target.value)}
                                    placeholder="Ej. Sistema Web para la Optimización de Procesos..."
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                />
                                <InputError message={errors.titulo} className="mt-1" />
                            </div>

                            {/* SELECCIÓN MÚLTIPLE DE AUTORES */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Autores / Tesistas <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    onChange={(e) => {
                                        toggleAutorId(e.target.value);
                                        e.target.value = '';
                                    }}
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                >
                                    <option value="">+ Seleccionar y agregar autor...</option>
                                    {autores.map((a) => (
                                        <option key={a.id} value={a.id} disabled={data.autor_ids.includes(a.id)}>
                                            {a.nombre} {a.estudiante ? `(DNI: ${a.estudiante.dni})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {data.autor_ids.map((id) => {
                                        const autor = autores.find((a) => a.id === id);
                                        return (
                                            <span
                                                key={id}
                                                className="inline-flex items-center gap-1 bg-sky-50 text-[#315d7a] px-2.5 py-1 rounded-lg text-xs font-semibold border border-sky-200"
                                            >
                                                👤 {autor?.nombre}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleAutorId(id)}
                                                    className="ml-1 text-slate-400 hover:text-rose-600 font-bold"
                                                >
                                                    ✕
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                                <InputError message={errors.autor_ids} className="mt-1" />
                            </div>

                            {/* SELECCIÓN MÚLTIPLE DE CATEGORÍAS */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Categorías / Colecciones <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    onChange={(e) => {
                                        toggleCategoriaId(e.target.value);
                                        e.target.value = '';
                                    }}
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                >
                                    <option value="">+ Asignar categoría temática...</option>
                                    {categorias.map((c) => (
                                        <option key={c.id} value={c.id} disabled={data.categoria_ids.includes(c.id)}>
                                            {c.nombre}
                                        </option>
                                    ))}
                                </select>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {data.categoria_ids.map((id) => {
                                        const cat = categorias.find((c) => c.id === id);
                                        return (
                                            <span
                                                key={id}
                                                className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200"
                                            >
                                                📁 {cat?.nombre}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleCategoriaId(id)}
                                                    className="ml-1 text-slate-400 hover:text-rose-600 font-bold"
                                                >
                                                    ✕
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                                <InputError message={errors.categoria_ids} className="mt-1" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Programa de Estudios / Carrera
                                    </label>
                                    <select
                                        value={data.plan_estudio_id}
                                        onChange={(e) => setData('plan_estudio_id', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                    >
                                        <option value="">-- No especificado --</option>
                                        {planes.map((p) => (
                                            <option key={p.id} value={p.id}>[{p.codigo}] {p.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Docente Asesor / Tutor
                                    </label>
                                    <select
                                        value={data.asesor_id}
                                        onChange={(e) => setData('asesor_id', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                    >
                                        <option value="">-- Sin asesor registrado --</option>
                                        {asesores.map((doc) => (
                                            <option key={doc.id} value={doc.id}>
                                                {doc.nombre} {doc.apellido}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Año de Publicación
                                    </label>
                                    <input
                                        type="number"
                                        min="1990"
                                        max={new Date().getFullYear()}
                                        value={data.anio_publicacion}
                                        onChange={(e) => setData('anio_publicacion', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Palabras Clave (Separadas por comas)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.palabras_clave}
                                        onChange={(e) => setData('palabras_clave', e.target.value)}
                                        placeholder="ej. Inteligencia artificial, Web, Salud"
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Resumen / Abstract
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.descripcion}
                                    onChange={(e) => setData('descripcion', e.target.value)}
                                    placeholder="Breve sumilla o abstract de la investigación..."
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Archivo Digital (PDF o Word - Máx. 30MB) {!recursoEnEdicion && <span className="text-rose-500">*</span>}
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,.docx,.doc"
                                    onChange={(e) => setData('archivo', e.target.files[0])}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-800 file:mr-3 file:rounded-lg file:border-0 file:bg-[#315d7a] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-[#274b63] cursor-pointer"
                                />
                                <InputError message={errors.archivo} className="mt-1" />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="activo_recurso"
                                    checked={data.activo}
                                    onChange={(e) => setData('activo', e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-[#315d7a] focus:ring-[#315d7a]"
                                />
                                <label htmlFor="activo_recurso" className="text-xs font-semibold text-slate-700 cursor-pointer">
                                    Documento visible y activo en el repositorio
                                </label>
                            </div>

                            <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={cerrarModal}
                                    disabled={processing}
                                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-xl bg-[#315d7a] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#274b63] disabled:opacity-50 shadow-xs cursor-pointer"
                                >
                                    {processing ? 'Guardando...' : recursoEnEdicion ? 'Actualizar Documento' : 'Publicar Documento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}