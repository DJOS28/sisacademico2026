import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useEffect, useRef, useState } from 'react';

export default function Index({ docentes: initialDocentes }) {
    const [docentes, setDocentes] = useState(initialDocentes);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const firstRender = useRef(true);
    const requestController = useRef(null);

    // Estados para el Modal de Importación Masiva
    const [showModalImport, setShowModalImport] = useState(false);
    const [archivoExcel, setArchivoExcel] = useState(null);
    const [importando, setImportando] = useState(false);
    const fileInputRef = useRef(null);

    const consultarDocentes = async ({
        page = 1,
        searchValue = search,
        statusValue = status,
        showAlert = false,
    } = {}) => {
        if (requestController.current) {
            requestController.current.abort();
        }

        requestController.current = new AbortController();
        setLoading(true);

        if (showAlert) {
            Swal.fire({
                title: 'Buscando docentes',
                text: 'Espere un momento...',
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => Swal.showLoading(),
            });
        }

        try {
            const response = await axios.post(
                route('docentes.buscar'),
                {
                    search: searchValue.trim(),
                    status: statusValue,
                    page,
                },
                {
                    signal: requestController.current.signal,
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            setDocentes(response.data.docentes);

            if (showAlert) {
                Swal.close();
            }
        } catch (error) {
            if (error.name === 'CanceledError' || error.name === 'AbortError') return;

            await Swal.fire({
                title: 'Error de consulta',
                text: error.response?.data?.message || 'No se pudo consultar el listado de docentes.',
                icon: 'error',
                confirmButtonColor: '#315d7a',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            consultarDocentes({
                page: 1,
                searchValue: search,
                statusValue: status,
            });
        }, 400);

        return () => clearTimeout(timer);
    }, [search, status]);

    useEffect(() => {
        return () => {
            if (requestController.current) {
                requestController.current.abort();
            }
        };
    }, []);

    const buscar = async (event) => {
        event.preventDefault();
        await consultarDocentes({
            page: 1,
            searchValue: search,
            statusValue: status,
            showAlert: true,
        });
    };

    const limpiar = async () => {
        setSearch('');
        setStatus('');
        await consultarDocentes({
            page: 1,
            searchValue: '',
            statusValue: '',
        });
    };

    const cambiarPagina = async (page) => {
        if (!page || page === docentes.current_page || loading) return;

        await consultarDocentes({
            page,
            searchValue: search,
            statusValue: status,
        });

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    const eliminar = async (docente) => {
        const result = await Swal.fire({
            title: '¿Eliminar docente?',
            html: `Se eliminará a <strong>${docente.nombre_completo}</strong> y su cuenta de acceso institucional.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#b42318',
            cancelButtonColor: '#64748b',
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        try {
            Swal.fire({
                title: 'Eliminando docente',
                text: 'Espere un momento...',
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => Swal.showLoading(),
            });

            const response = await axios.delete(route('docentes.destroy', docente.id), {
                headers: { Accept: 'application/json' },
            });

            await Swal.fire({
                title: 'Eliminado',
                text: response.data.message || 'El docente fue eliminado correctamente.',
                icon: 'success',
                confirmButtonColor: '#315d7a',
            });

            await consultarDocentes({
                page: docentes.current_page,
                searchValue: search,
                statusValue: status,
            });
        } catch (error) {
            await Swal.fire({
                title: 'No se pudo eliminar',
                text: error.response?.data?.message || 'Ocurrió un error al eliminar el docente.',
                icon: 'error',
                confirmButtonColor: '#315d7a',
            });
        }
    };

    // Procesar la subida masiva del archivo Excel (.xlsx / .xls / .csv)
    const handleImportarSubmit = async (e) => {
        e.preventDefault();
        if (!archivoExcel) {
            Swal.fire('Atención', 'Seleccione un archivo Excel (.xlsx, .xls) o CSV.', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('archivo_excel', archivoExcel);

        setImportando(true);

        try {
            const response = await axios.post(route('docentes.importar'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setShowModalImport(false);
            setArchivoExcel(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

            let mensajeHtml = `<p class="font-semibold text-slate-800">${response.data.message}</p>`;
            if (response.data.errores?.length > 0) {
                mensajeHtml += `
                    <div class="mt-3 max-h-48 overflow-y-auto text-left text-xs bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                        <p class="font-bold text-amber-800 mb-1">Observaciones / Omitidos (${response.data.omitidos}):</p>
                        <ul class="list-disc pl-4 space-y-0.5 text-amber-700">
                            ${response.data.errores.map((err) => `<li>${err}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            await Swal.fire({
                title: 'Importación Completada',
                html: mensajeHtml,
                icon: response.data.procesados > 0 ? 'success' : 'warning',
                confirmButtonColor: '#315d7a',
            });

            await consultarDocentes({ page: 1, searchValue: '', statusValue: '' });
        } catch (error) {
            await Swal.fire({
                title: 'Error de importación',
                text: error.response?.data?.message || 'No se pudo procesar el archivo Excel.',
                icon: 'error',
                confirmButtonColor: '#315d7a',
            });
        } finally {
            setImportando(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-[#315d7a]">Gestión académica</p>
                        <h1 className="mt-1 text-2xl font-bold text-slate-900">Docentes</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Administración de docentes, cuentas de acceso y sincronización con Moodle.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowModalImport(true)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-50 px-3.5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition shadow-2xs cursor-pointer"
                        >
                            📊 Importar Excel
                        </button>

                        <Link
                            href={route('docentes.create')}
                            className="inline-flex items-center justify-center rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#274c64] transition shadow-2xs"
                        >
                            + Nuevo docente
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Docentes" />

            <div className="space-y-5">
                {/* BARRA DE FILTROS */}
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                    <form onSubmit={buscar} className="grid gap-3 md:grid-cols-[1fr_220px_auto_auto]">
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Buscar por nombre, DNI, correo o usuario..."
                            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]"
                        />

                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]"
                        >
                            <option value="">Todos los estados</option>
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                        </select>

                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#274c64] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                        >
                            {loading ? 'Buscando...' : 'Buscar'}
                        </button>

                        <button
                            type="button"
                            onClick={limpiar}
                            disabled={loading}
                            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
                        >
                            Limpiar
                        </button>
                    </form>

                    <p className="mt-3 text-xs text-slate-400">
                        La búsqueda se realiza mediante AJAX sin modificar la URL.
                    </p>
                </section>

                {/* TABLA PRINCIPAL DE DOCENTES */}
                <section className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                    {loading && (
                        <div className="absolute inset-x-0 top-0 z-10 h-1 overflow-hidden bg-slate-100">
                            <div className="h-full w-1/3 animate-pulse bg-[#315d7a]" />
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    <th className="px-4 py-3">Docente</th>
                                    <th className="px-4 py-3">DNI</th>
                                    <th className="px-4 py-3">Contacto</th>
                                    <th className="px-4 py-3">Usuario / rol</th>
                                    <th className="px-4 py-3">Estado</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {docentes.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="px-4 py-12 text-center text-sm text-slate-500"
                                        >
                                            No se encontraron docentes registrados.
                                        </td>
                                    </tr>
                                ) : (
                                    docentes.data.map((docente) => (
                                        <tr key={docente.id} className="hover:bg-slate-50/70">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#eaf1f6] text-sm font-bold text-[#315d7a]">
                                                        {docente.usuario?.img ? (
                                                            <img
                                                                src={docente.usuario.img}
                                                                alt={docente.nombre_completo}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            docente.nombre_completo?.charAt(0)?.toUpperCase()
                                                        )}
                                                    </div>

                                                    <div>
                                                        <p className="font-semibold text-slate-900">
                                                            {docente.nombre_completo}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {docente.cargo || 'Docente'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 text-sm text-slate-700 font-mono">
                                                {docente.dni}
                                            </td>

                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                <p>{docente.email || '—'}</p>
                                                <p className="text-xs text-slate-400 font-mono">
                                                    {docente.telefono || 'Sin teléfono'}
                                                </p>
                                            </td>

                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                <p className="font-medium text-slate-800">
                                                    {docente.usuario?.username || 'Sin usuario'}
                                                </p>
                                                <p className="text-xs text-[#315d7a]">
                                                    {docente.usuario?.roles?.join(', ') || 'Docente'}
                                                </p>
                                            </td>

                                            <td className="px-4 py-3">
                                                <span
                                                    className={[
                                                        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                                                        docente.usuario?.status === 'Activo'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-slate-100 text-slate-600 border border-slate-200',
                                                    ].join(' ')}
                                                >
                                                    ● {docente.usuario?.status || 'Activo'}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={route('docentes.show', docente.id)}
                                                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                                    >
                                                        Ver
                                                    </Link>

                                                    <Link
                                                        href={route('docentes.edit', docente.id)}
                                                        className="rounded-md border border-[#b9ccd8] px-3 py-1.5 text-xs font-semibold text-[#315d7a] hover:bg-[#eef3f7]"
                                                    >
                                                        Editar
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() => eliminar(docente)}
                                                        className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 cursor-pointer"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINACIÓN */}
                    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                            Mostrando {docentes.from || 0} a {docentes.to || 0} de {docentes.total || 0} registros
                        </p>

                        <div className="flex flex-wrap gap-1">
                            <button
                                type="button"
                                disabled={!docentes.prev_page_url || loading}
                                onClick={() => cambiarPagina(docentes.current_page - 1)}
                                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                            >
                                Anterior
                            </button>

                            {Array.from({ length: docentes.last_page || 1 }, (_, index) => index + 1)
                                .filter(
                                    (page) =>
                                        page === 1 ||
                                        page === docentes.last_page ||
                                        Math.abs(page - docentes.current_page) <= 2,
                                )
                                .map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        disabled={loading}
                                        onClick={() => cambiarPagina(page)}
                                        className={[
                                            'rounded-md border px-3 py-1.5 text-sm cursor-pointer',
                                            page === docentes.current_page
                                                ? 'border-[#315d7a] bg-[#315d7a] text-white'
                                                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50',
                                        ].join(' ')}
                                    >
                                        {page}
                                    </button>
                                ))}

                            <button
                                type="button"
                                disabled={!docentes.next_page_url || loading}
                                onClick={() => cambiarPagina(docentes.current_page + 1)}
                                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {/* MODAL DE IMPORTACIÓN MASIVA VÍA EXCEL */}
            {showModalImport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                        {/* Cabecera del modal */}
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Importación Masiva de Docentes
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Carga y crea cuentas de docentes masivamente vinculadas con Moodle.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowModalImport(false)}
                                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Cuerpo en 2 columnas: Instrucciones y Formulario */}
                        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                            {/* Panel Izquierdo: Instrucciones y Descarga de Plantilla XLSX */}
                            <div className="md:col-span-5 space-y-4 rounded-xl bg-sky-50/60 p-4 border border-sky-100">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-[#315d7a]">
                                    📋 Instrucciones de Formato
                                </h4>
                                <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
                                    <li>
                                        El archivo debe estar en formato <strong>.xlsx o .xls</strong>.
                                    </li>
                                    <li>
                                        Las columnas obligatorias son: <code className="font-mono text-[11px] text-rose-600">dni</code>, <code className="font-mono text-[11px] text-rose-600">nombres</code>, <code className="font-mono text-[11px] text-rose-600">apellidos</code>, <code className="font-mono text-[11px] text-rose-600">email</code>.
                                    </li>
                                    <li>
                                        Columnas opcionales: <code className="font-mono text-[11px]">telefono</code>, <code className="font-mono text-[11px]">direccion</code>, <code className="font-mono text-[11px]">departamento</code>, <code className="font-mono text-[11px]">cargo</code>.
                                    </li>
                                    <li>
                                        La contraseña inicial generada para el usuario y Moodle será su <code className="font-mono text-[11px] text-slate-800 font-bold">DNI</code>.
                                    </li>
                                </ul>

                                <div className="pt-2">
                                    <a
                                        href={route('docentes.plantilla.excel')}
                                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-600 bg-white px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition shadow-2xs cursor-pointer"
                                    >
                                        📊 Descargar Plantilla (.XLSX)
                                    </a>
                                </div>
                            </div>

                            {/* Panel Derecho: Subida de Archivo */}
                            <form onSubmit={handleImportarSubmit} className="md:col-span-7 flex flex-col justify-between space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-2">
                                        Selecciona el archivo Excel (.xlsx / .xls):
                                    </label>

                                    <div
                                        className="border-2 border-dashed border-slate-300 hover:border-[#315d7a] rounded-xl p-6 text-center bg-slate-50/50 transition cursor-pointer"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <div className="text-3xl mb-2">📊</div>
                                        <p className="text-xs font-medium text-slate-700">
                                            {archivoExcel ? archivoExcel.name : 'Haz clic aquí para seleccionar el archivo'}
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-1">
                                            Formatos permitidos: .xlsx, .xls (Máx. 20 MB)
                                        </p>
                                    </div>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={(e) => setArchivoExcel(e.target.files[0])}
                                        className="hidden"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModalImport(false)}
                                        disabled={importando}
                                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={importando || !archivoExcel}
                                        className="rounded-xl bg-[#315d7a] px-5 py-2 text-xs font-bold text-white hover:bg-[#274c64] disabled:opacity-60 transition shadow-xs cursor-pointer"
                                    >
                                        {importando ? 'Procesando e importando...' : 'Iniciar Importación'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}