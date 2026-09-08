import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useEffect, useRef, useState, useMemo } from 'react';

export default function Index({ autores: autoresIniciales, estudiantes = [], filtros: filtrosIniciales }) {
    const { flash } = usePage().props;

    const [autores, setAutores] = useState(autoresIniciales);
    const [buscar, setBuscar] = useState(filtrosIniciales?.buscar || '');
    const [estado, setEstado] = useState(filtrosIniciales?.estado || '');
    const [cargando, setCargando] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [autorEnEdicion, setAutorEnEdicion] = useState(null);

    // Estado del selector buscable (Select2)
    const [select2Abierto, setSelect2Abierto] = useState(false);
    const [busquedaEstudiante, setBusquedaEstudiante] = useState('');
    const select2Ref = useRef(null);

    const primeraCarga = useRef(true);
    const abortControllerRef = useRef(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nombre: '',
        email: '',
        biografia: '',
        estudiante_id: '',
        activo: true,
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

    // Cerrar el dropdown del Select2 al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (select2Ref.current && !select2Ref.current.contains(event.target)) {
                setSelect2Abierto(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filtrado asíncrono de la tabla de autores
    const filtrarAutores = async (page = 1) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        setCargando(true);

        try {
            const response = await axios.post(
                route('repositorio-autores.filtrar'),
                {
                    buscar: buscar.trim() || null,
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

            setAutores(response.data.autores);
        } catch (error) {
            if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
                return;
            }
            Swal.fire({
                icon: 'error',
                title: 'Error al filtrar',
                text: error.response?.data?.message || 'No se pudieron consultar los autores.',
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
            filtrarAutores(1);
        }, 350);

        return () => clearTimeout(timer);
    }, [buscar, estado]);

    // Filtrado de estudiantes para el Select2
    const estudiantesFiltrados = useMemo(() => {
        if (!busquedaEstudiante.trim()) return estudiantes;
        const q = busquedaEstudiante.toLowerCase();
        return estudiantes.filter(
            (e) =>
                (e.dni || '').toLowerCase().includes(q) ||
                (e.apellidos || '').toLowerCase().includes(q) ||
                (e.nombres || '').toLowerCase().includes(q)
        );
    }, [estudiantes, busquedaEstudiante]);

    const estudianteSeleccionado = useMemo(() => {
        return estudiantes.find((e) => String(e.id_postulante) === String(data.estudiante_id));
    }, [estudiantes, data.estudiante_id]);

    const seleccionarEstudiante = (est) => {
        if (!est) {
            setData((prev) => ({
                ...prev,
                estudiante_id: '',
            }));
        } else {
            setData((prev) => ({
                ...prev,
                estudiante_id: est.id_postulante,
                nombre: `${est.nombres} ${est.apellidos}`,
            }));
        }
        setSelect2Abierto(false);
        setBusquedaEstudiante('');
    };

    const abrirModalCrear = () => {
        setAutorEnEdicion(null);
        reset();
        clearErrors();
        setBusquedaEstudiante('');
        setSelect2Abierto(false);
        setData({
            nombre: '',
            email: '',
            biografia: '',
            estudiante_id: '',
            activo: true,
        });
        setModalOpen(true);
    };

    const abrirModalEditar = (autor) => {
        setAutorEnEdicion(autor);
        clearErrors();
        setBusquedaEstudiante('');
        setSelect2Abierto(false);
        setData({
            nombre: autor.nombre || '',
            email: autor.email || '',
            biografia: autor.biografia || '',
            estudiante_id: autor.estudiante_id || '',
            activo: Boolean(autor.activo),
        });
        setModalOpen(true);
    };

    const cerrarModal = () => {
        setModalOpen(false);
        setAutorEnEdicion(null);
        reset();
        clearErrors();
        setSelect2Abierto(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (autorEnEdicion) {
            put(route('repositorio-autores.update', autorEnEdicion.id), {
                preserveScroll: true,
                onSuccess: () => {
                    cerrarModal();
                    filtrarAutores(autores.current_page ?? 1);
                },
            });
        } else {
            post(route('repositorio-autores.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    cerrarModal();
                    filtrarAutores(1);
                },
            });
        }
    };

    const toggleEstado = (autor) => {
        router.patch(
            route('repositorio-autores.estado', autor.id),
            { activo: !autor.activo },
            {
                preserveScroll: true,
                onSuccess: () => filtrarAutores(autores.current_page ?? 1),
            }
        );
    };

    const eliminarAutor = async (autor) => {
        const result = await Swal.fire({
            title: '¿Eliminar autor?',
            text: `Se removerá al autor "${autor.nombre}". Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        });

        if (!result.isConfirmed) return;

        router.delete(route('repositorio-autores.destroy', autor.id), {
            preserveScroll: true,
            onSuccess: () => filtrarAutores(autores.current_page ?? 1),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Autores e Investigadores</h1>
                        <p className="text-xs text-slate-500">Gestión de autores, tesistas e investigadores institucionales.</p>
                    </div>
                    <button
                        type="button"
                        onClick={abrirModalCrear}
                        className="rounded-xl bg-[#315d7a] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#274b63] shadow-xs cursor-pointer"
                    >
                        + Nuevo Autor
                    </button>
                </div>
            }
        >
            <Head title="Autores del Repositorio" />

            <div className="space-y-5">
                {/* BARRA DE BÚSQUEDA Y FILTRO */}
                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:grid-cols-4">
                    <input
                        type="search"
                        value={buscar}
                        onChange={(e) => setBuscar(e.target.value)}
                        placeholder="Buscar por nombre, correo o DNI..."
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs md:col-span-2 outline-none focus:border-[#315d7a]"
                    />

                    <select
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-[#315d7a]"
                    >
                        <option value="">Todos los estados</option>
                        <option value="Activo">Activos</option>
                        <option value="Inactivo">Inactivos</option>
                    </select>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setBuscar('');
                                setEstado('');
                            }}
                            className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                        >
                            Limpiar
                        </button>
                        {cargando && <span className="text-xs font-medium text-[#315d7a]">Consultando...</span>}
                    </div>
                </div>

                {/* TABLA DE RESULTADOS */}
                <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition ${cargando ? 'opacity-60 pointer-events-none' : ''}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-4 w-12 text-center">#</th>
                                    <th className="py-3 px-4">Autor / Investigador</th>
                                    <th className="py-3 px-4">Contacto</th>
                                    <th className="py-3 px-4">Estudiante Vinculado</th>
                                    <th className="py-3 px-4 text-center w-32">Publicaciones</th>
                                    <th className="py-3 px-4 text-center w-28">Estado</th>
                                    <th className="py-3 px-4 text-right w-36">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {autores.data.length > 0 ? (
                                    autores.data.map((autor, idx) => (
                                        <tr key={autor.id} className="hover:bg-slate-50 transition">
                                            <td className="py-3 px-4 text-center font-mono text-slate-400">
                                                {(autores.current_page - 1) * autores.per_page + idx + 1}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="font-bold text-slate-900 block">{autor.nombre}</span>
                                                {autor.biografia && (
                                                    <span className="text-[11px] text-slate-500 line-clamp-1">
                                                        {autor.biografia}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 font-mono text-slate-600">
                                                {autor.email || <span className="text-slate-400 italic">No registrado</span>}
                                            </td>
                                            <td className="py-3 px-4">
                                                {autor.estudiante ? (
                                                    <span className="inline-flex items-center gap-1 bg-sky-50 text-[#315d7a] font-semibold px-2 py-0.5 rounded-lg border border-sky-100 text-[11px]">
                                                        🎓 DNI: {autor.estudiante.dni}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 italic">Externo / No vinculado</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="bg-purple-50 text-purple-700 font-bold font-mono px-2.5 py-0.5 rounded-full border border-purple-200 text-[11px]">
                                                    {autor.recursos_count ?? 0} obras
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleEstado(autor)}
                                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer border ${
                                                        autor.activo
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                                    }`}
                                                >
                                                    {autor.activo ? 'Activo' : 'Inactivo'}
                                                </button>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => abrirModalEditar(autor)}
                                                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => eliminarAutor(autor)}
                                                        className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400 text-xs italic">
                                            No se encontraron autores registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* PAGINACIÓN */}
                {autores.links?.length > 3 && (
                    <div className="flex flex-wrap justify-end gap-1">
                        {autores.links.map((link, index) => (
                            <button
                                key={index}
                                type="button"
                                disabled={!link.url || cargando}
                                onClick={() => {
                                    const pageNum = new URL(link.url).searchParams.get('page') || 1;
                                    filtrarAutores(Number(pageNum));
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

            {/* MODAL CREAR / EDITAR */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    {autorEnEdicion ? 'Editar Autor' : 'Nuevo Autor / Investigador'}
                                </h3>
                                <p className="text-xs text-slate-500">Datos personales y filiación institucional.</p>
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
                            {/* COMPONENTE SELECT2 BUSCABLE */}
                            <div className="relative" ref={select2Ref}>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Vincular con Alumno / Postulante (Opcional)
                                </label>

                                <div
                                    onClick={() => setSelect2Abierto(!select2Abierto)}
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 bg-white cursor-pointer flex justify-between items-center focus:border-[#315d7a] hover:border-slate-400 transition"
                                >
                                    <span className={estudianteSeleccionado ? 'font-semibold text-slate-900' : 'text-slate-400'}>
                                        {estudianteSeleccionado
                                            ? `DNI: ${estudianteSeleccionado.dni} — ${estudianteSeleccionado.apellidos}, ${estudianteSeleccionado.nombres}`
                                            : '-- Ninguno (Autor externo / Docente) --'}
                                    </span>
                                    <span className="text-slate-400 text-xs">{select2Abierto ? '▲' : '▼'}</span>
                                </div>

                                {select2Abierto && (
                                    <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                        <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                                            <input
                                                type="text"
                                                autoFocus
                                                value={busquedaEstudiante}
                                                onChange={(e) => setBusquedaEstudiante(e.target.value)}
                                                placeholder="Escriba DNI o apellidos para filtrar..."
                                                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs outline-none focus:border-[#315d7a] bg-white"
                                            />
                                        </div>

                                        <div className="max-h-52 overflow-y-auto divide-y divide-slate-50 text-xs">
                                            <div
                                                onClick={() => seleccionarEstudiante(null)}
                                                className="px-3.5 py-2 hover:bg-slate-100 cursor-pointer text-slate-500 italic"
                                            >
                                                -- Ninguno (Autor externo / Docente) --
                                            </div>

                                            {estudiantesFiltrados.length > 0 ? (
                                                estudiantesFiltrados.map((est) => (
                                                    <div
                                                        key={est.id_postulante}
                                                        onClick={() => seleccionarEstudiante(est)}
                                                        className={`px-3.5 py-2 hover:bg-sky-50 cursor-pointer transition flex items-center justify-between ${
                                                            String(data.estudiante_id) === String(est.id_postulante)
                                                                ? 'bg-sky-50/80 font-bold text-[#315d7a]'
                                                                : 'text-slate-800'
                                                        }`}
                                                    >
                                                        <span>
                                                            <strong className="font-mono text-slate-900">DNI: {est.dni}</strong> — {est.apellidos}, {est.nombres}
                                                        </span>
                                                        {String(data.estudiante_id) === String(est.id_postulante) && (
                                                            <span className="text-[#315d7a] text-xs">✓</span>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-3.5 py-4 text-center text-slate-400 text-xs italic">
                                                    No se encontraron coincidencias.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <InputError message={errors.estudiante_id} className="mt-1" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Nombre Completo <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.nombre}
                                    onChange={(e) => setData('nombre', e.target.value)}
                                    placeholder="Nombres y Apellidos del autor"
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                />
                                <InputError message={errors.nombre} className="mt-1" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Correo Electrónico
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="ejemplo@instituto.edu.pe"
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                />
                                <InputError message={errors.email} className="mt-1" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Biografía / Perfil Profesional
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.biografia}
                                    onChange={(e) => setData('biografia', e.target.value)}
                                    placeholder="Breve reseña profesional o grado académico del autor..."
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                />
                                <InputError message={errors.biografia} className="mt-1" />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="activo_autor"
                                    checked={data.activo}
                                    onChange={(e) => setData('activo', e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-[#315d7a] focus:ring-[#315d7a]"
                                />
                                <label htmlFor="activo_autor" className="text-xs font-semibold text-slate-700 cursor-pointer">
                                    Autor activo en el repositorio
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
                                    {processing ? 'Guardando...' : autorEnEdicion ? 'Actualizar' : 'Guardar Autor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}