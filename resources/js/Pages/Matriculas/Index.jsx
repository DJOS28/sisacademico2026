import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

export default function Index({
    matriculas: matriculasIniciales,
    periodos = [],
    semestres = [],
    estados = [],
    filtros = {},
}) {
    const [matriculas, setMatriculas] = useState(matriculasIniciales);
    const [buscar, setBuscar] = useState(filtros.buscar ?? '');
    const [periodoId, setPeriodoId] = useState(filtros.periodo_id ?? '');
    const [semestreId, setSemestreId] = useState(filtros.semestre_id ?? '');
    const [estado, setEstado] = useState(filtros.estado ?? '');
    const [cargando, setCargando] = useState(false);

    // Estado del modal de importación
    const [modalImportarAbierto, setModalImportarAbierto] = useState(false);

    // Formulario reactivo para la importación
    const { data: formImport, setData: setFormImport, post: postImport, processing: importando, errors: erroresImport, reset: resetFormImport } = useForm({
        periodo_id: periodos.find(p => p.activo)?.id ?? (periodos[0]?.id ?? ''),
        archivo: null,
    });

    const primeraCarga = useRef(true);
    const controladorFiltro = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        setMatriculas(matriculasIniciales);
    }, [matriculasIniciales]);

    const tieneFiltros = useMemo(
        () => buscar.trim() !== '' || periodoId !== '' || semestreId !== '' || estado !== '',
        [buscar, periodoId, semestreId, estado]
    );

    const formatearFecha = (fecha) => {
        if (!fecha) return '—';
        const date = new Date(fecha);
        if (Number.isNaN(date.getTime())) return fecha;
        return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    };

    const filtrar = async (pagina = 1, moverArriba = false) => {
        controladorFiltro.current?.abort();
        controladorFiltro.current = new AbortController();
        setCargando(true);

        try {
            const response = await axios.post(
                route('matriculas.filtrar'),
                {
                    buscar: buscar.trim(),
                    periodo_id: periodoId,
                    semestre_id: semestreId,
                    estado,
                    page: pagina,
                },
                {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    signal: controladorFiltro.current.signal,
                }
            );

            setMatriculas(response.data.matriculas);

            if (moverArriba) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (error) {
            if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') return;

            let mensaje = 'No se pudo realizar la búsqueda de matrículas.';
            if (error.response?.status === 422) {
                const errores = error.response.data?.errores ?? {};
                mensaje = Object.values(errores)?.[0]?.[0] ?? mensaje;
            }

            Swal.fire({ title: 'Error', text: mensaje, icon: 'error', confirmButtonText: 'Aceptar' });
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        if (primeraCarga.current) {
            primeraCarga.current = false;
            return;
        }

        const temporizador = window.setTimeout(() => {
            filtrar(1);
        }, 400);

        return () => window.clearTimeout(temporizador);
    }, [buscar, periodoId, semestreId, estado]);

    const limpiarFiltros = () => {
        setBuscar('');
        setPeriodoId('');
        setSemestreId('');
        setEstado('');
    };

    const cambiarPagina = (pagina) => {
        if (pagina < 1 || pagina > matriculas.last_page || pagina === matriculas.current_page || cargando) return;
        filtrar(pagina, true);
    };

    const obtenerPaginas = () => {
        const paginaActual = matriculas.current_page;
        const ultimaPagina = matriculas.last_page;
        const paginas = [];

        let inicio = Math.max(1, paginaActual - 2);
        let fin = Math.min(ultimaPagina, paginaActual + 2);

        if (paginaActual <= 3) fin = Math.min(5, ultimaPagina);
        if (paginaActual >= ultimaPagina - 2) inicio = Math.max(1, ultimaPagina - 4);

        for (let pagina = inicio; pagina <= fin; pagina += 1) {
            paginas.push(pagina);
        }
        return paginas;
    };

    const badgeEstado = (estadoActual) => {
        const clases = {
            Pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
            Matriculado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            Retirado: 'bg-rose-50 text-rose-700 border-rose-200',
            Convalidado: 'bg-blue-50 text-blue-700 border-blue-200',
            Repitencia: 'bg-purple-50 text-purple-700 border-purple-200',
        };
        return clases[estadoActual] ?? 'bg-slate-100 text-slate-700';
    };

    const eliminarMatricula = (matricula) => {
        const nombreEstudiante = matricula.postulante 
            ? `${matricula.postulante.nombres} ${matricula.postulante.apellidos}`
            : 'este estudiante';

        Swal.fire({
            title: '¿Eliminar Matrícula?',
            html: `Está a punto de remover la matrícula <strong>${matricula.codigo_matricula ?? ''}</strong> de <strong>${nombreEstudiante}</strong>. Se eliminará también su carga horaria asociada y la sincronización con Moodle.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
            customClass: { popup: 'rounded-2xl' }
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('matriculas.destroy', matricula.id), {
                    onSuccess: () => {
                        Swal.fire({
                            icon: 'success',
                            title: '¡Eliminado!',
                            text: 'La matrícula fue removida del sistema.',
                            timer: 1800,
                            showConfirmButton: false,
                            customClass: { popup: 'rounded-2xl' }
                        });
                    },
                    onError: (err) => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: err.error || 'No se pudo eliminar la matrícula.',
                            customClass: { popup: 'rounded-2xl' }
                        });
                    }
                });
            }
        });
    };

    // GENERAR Y DESCARGAR PLANTILLA EXCEL (ENFOQUE 2)
    const descargarPlantillaExcel = () => {
        const dataPlantilla = [
            ['DNI_ESTUDIANTE', 'CODIGO_CURSO', 'SECCION', 'TURNO', 'CONDICION'],
            ['70140514', 'CUR-001', 'A', 'Mañana', 'Inscrito'],
            ['70140514', 'CUR-002', 'A', 'Mañana', 'Inscrito'],
            ['60128237', 'CUR-001', 'B', 'Noche', 'Repitencia'],
            ['60128237', 'CUR-003', 'A', 'Mañana', 'Cargo'],
        ];

        const ws = XLSX.utils.aoa_to_sheet(dataPlantilla);
        ws['!cols'] = [
            { wch: 18 },
            { wch: 18 },
            { wch: 12 },
            { wch: 14 },
            { wch: 16 },
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Matricula');
        XLSX.writeFile(wb, 'Plantilla_Matricula_Masiva.xlsx');
    };

    // PROCESAR FORMULARIO DE IMPORTACIÓN
    const handleSubirArchivoMasivo = (e) => {
        e.preventDefault();

        if (!formImport.archivo) {
            Swal.fire('Atención', 'Debe seleccionar un archivo Excel para continuar.', 'warning');
            return;
        }

        postImport(route('matriculas.importar_masivo'), {
            preserveScroll: true,
            onStart: () => {
                Swal.fire({
                    title: 'Procesando matrículas...',
                    text: 'Registrando estudiantes y sincronizando con Moodle...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading(),
                    customClass: { popup: 'rounded-2xl' },
                });
            },
            onSuccess: () => {
                setModalImportarAbierto(false);
                resetFormImport();
                if (fileInputRef.current) fileInputRef.current.value = '';
                Swal.fire({
                    icon: 'success',
                    title: '¡Proceso Finalizado!',
                    text: 'Las matrículas y grupos de Moodle se han sincronizado correctamente.',
                    customClass: { popup: 'rounded-2xl' },
                });
            },
            onError: (err) => {
                const msg = err.error || 'Ocurrió un inconveniente al procesar el archivo.';
                Swal.fire({
                    icon: 'error',
                    title: 'Error en la importación',
                    text: msg,
                    customClass: { popup: 'rounded-2xl' },
                });
            }
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Matrículas Académicas</h1>
                        <p className="mt-1 text-sm text-slate-500">Gestione las cargas académicas, periodos y estados de matrícula.</p>
                    </div>
                    
                    {/* BOTONES DE ACCIÓN */}
                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => setModalImportarAbierto(true)}
                            className="flex h-[42px] items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 shadow-xs cursor-pointer"
                        >
                            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span>Importación Masiva</span>
                        </button>

                        <Link
                            href={route('matriculas.create')}
                            className="flex h-[42px] items-center justify-center rounded-lg bg-[#315d7a] px-4 text-sm font-semibold text-white transition hover:bg-[#274b63] shadow-xs cursor-pointer"
                        >
                            Nueva matrícula
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Matrículas" />

            {/* SECCIÓN DE FILTROS */}
            <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12 xl:items-end">
                    <div className="xl:col-span-4">
                        <label htmlFor="buscar" className="mb-2 block text-sm font-semibold text-slate-700">Buscar</label>
                        <div className="relative">
                            <input
                                id="buscar"
                                type="search"
                                value={buscar}
                                onChange={(e) => setBuscar(e.target.value)}
                                autoComplete="off"
                                placeholder="Código matrícula, DNI o apellidos del estudiante..."
                                className="h-[42px] w-full rounded-lg border border-slate-300 px-3 pr-11 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                            />
                            {cargando && <span className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-300 border-t-[#315d7a]" />}
                        </div>
                    </div>

                    <div className="xl:col-span-2">
                        <label htmlFor="periodo" className="mb-2 block text-sm font-semibold text-slate-700">Periodo</label>
                        <select
                            id="periodo"
                            value={periodoId}
                            onChange={(e) => setPeriodoId(e.target.value)}
                            className="h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                        >
                            <option value="">Todos</option>
                            {periodos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                    </div>

                    <div className="xl:col-span-2">
                        <label htmlFor="semestre" className="mb-2 block text-sm font-semibold text-slate-700">Semestre</label>
                        <select
                            id="semestre"
                            value={semestreId}
                            onChange={(e) => setSemestreId(e.target.value)}
                            className="h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                        >
                            <option value="">Todos</option>
                            {semestres.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                    </div>

                    <div className="xl:col-span-2">
                        <label htmlFor="estado" className="mb-2 block text-sm font-semibold text-slate-700">Estado</label>
                        <select
                            id="estado"
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                            className="h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                        >
                            <option value="">Todos</option>
                            {estados.map((est) => <option key={est} value={est}>{est}</option>)}
                        </select>
                    </div>

                    <div className="xl:col-span-2">
                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            disabled={!tieneFiltros || cargando}
                            className="flex h-[42px] w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* TABLA DE RESULTADOS */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Cód. Matrícula</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Estudiante</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Plan de Estudio</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Estructura Temporal</th>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">Estado</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Fecha Matrícula</th>
                                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Acciones</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {matriculas.data?.length > 0 ? (
                                matriculas.data.map((matricula) => (
                                    <tr key={matricula.id} className="transition hover:bg-slate-50">
                                        <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-slate-900">
                                            {matricula.codigo_matricula ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="min-w-[200px]">
                                                <p className="text-sm font-semibold text-slate-800">
                                                    {matricula.postulante ? `${matricula.postulante.nombres} ${matricula.postulante.apellidos}` : 'No asignado'}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-0.5">DNI: {matricula.postulante?.dni ?? '—'}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            <div className="max-w-[180px] truncate" title={matricula.plan_estudio?.nombre}>
                                                {matricula.plan_estudio?.nombre ?? '—'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            <p><span className="font-medium text-slate-700">Periodo:</span> {matricula.periodo?.nombre ?? '—'}</p>
                                            <p className="text-xs text-slate-400 mt-0.5"><span className="font-medium">Ciclo:</span> {matricula.semestre?.nombre ?? '—'}</p>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex min-w-[90px] items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeEstado(matricula.estado)}`}>
                                                {matricula.estado}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                                            {formatearFecha(matricula.fecha_matricula)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end items-center gap-1.5">
                                                <a
                                                    href={route('matriculas.ficha', matricula.id)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-teal-200 bg-teal-50 text-teal-700 transition hover:bg-teal-100 hover:text-teal-800 shadow-sm"
                                                    title="Ver Ficha de Matrícula (PDF)"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6M16 13H8m8 4H8m2-8H8" />
                                                    </svg>
                                                </a>

                                                <Link
                                                    href={route('matriculas.edit', matricula.id)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 shadow-sm"
                                                    title="Editar Carga Horaria"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </Link>

                                                <button
                                                    type="button"
                                                    onClick={() => eliminarMatricula(matricula)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100 hover:text-rose-800 shadow-sm"
                                                    title="Eliminar Matrícula"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <p className="text-sm font-semibold text-slate-600">No se encontraron registros de matrícula.</p>
                                        <p className="mt-1 text-xs text-slate-400">Modifique los criterios de búsqueda o proceda a asentar una nueva.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINACIÓN */}
                {matriculas.total > 0 && (
                    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                            Mostrando <span className="font-semibold text-slate-700">{matriculas.from}</span> a{' '}
                            <span className="font-semibold text-slate-700">{matriculas.to}</span> de{' '}
                            <span className="font-semibold text-slate-700">{matriculas.total}</span> registros
                        </p>

                        {matriculas.last_page > 1 && (
                            <div className="flex flex-wrap items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => cambiarPagina(matriculas.current_page - 1)}
                                    disabled={matriculas.current_page === 1 || cargando}
                                    className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Anterior
                                </button>

                                {obtenerPaginas().map((pagina) => (
                                    <button
                                        key={pagina}
                                        type="button"
                                        onClick={() => cambiarPagina(pagina)}
                                        disabled={cargando}
                                        className={`h-8 min-w-8 rounded-md px-2 text-xs font-semibold transition ${
                                            pagina === matriculas.current_page
                                                ? 'bg-[#315d7a] text-white'
                                                : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        {pagina}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => cambiarPagina(matriculas.current_page + 1)}
                                    disabled={matriculas.current_page === matriculas.last_page || cargando}
                                    className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* MODAL DE IMPORTACIÓN MASIVA Y DESCARGA DE PLANTILLA */}
            {modalImportarAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl transition-all border border-slate-200">
                        
                        {/* Cabecera del Modal */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Importación Masiva de Matrículas</h3>
                                    <p className="text-xs text-slate-500">Cargue asignaturas por lote y sincronice el Aula Virtual en bloque.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalImportarAbierto(false)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubirArchivoMasivo} className="mt-4 space-y-4">
                            {/* Paso 1: Descargar Plantilla Oficial */}
                            <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold text-sky-900">1. Descargar Formato Oficial</p>
                                    <p className="text-[11px] text-sky-700 mt-0.5">
                                        Plantilla preconfigurada con las columnas obligatorias del sistema.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={descargarPlantillaExcel}
                                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs shrink-0 cursor-pointer"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    <span>Descargar Plantilla (.xlsx)</span>
                                </button>
                            </div>

                            {/* Instrucciones de llenado */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 space-y-2">
                                <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                                    Instrucciones para el llenado del archivo:
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                                    <li><strong>DNI_ESTUDIANTE:</strong> DNI del alumno (debe estar registrado previamente como postulante/estudiante).</li>
                                    <li><strong>CODIGO_CURSO:</strong> Código del curso (ej: <code className="text-[#315d7a] font-bold">CUR-001</code> o simplemente <code className="text-[#315d7a] font-bold">1</code>).</li>
                                    <li><strong>SECCION:</strong> Sección programada en el horario (ej: <code className="font-bold">A</code>, <code className="font-bold">B</code>).</li>
                                    <li><strong>TURNO:</strong> Turno correspondiente (ej: <code className="font-bold">Mañana</code>, <code className="font-bold">Noche</code>).</li>
                                    <li><strong>CONDICION:</strong> Estado de la asignatura (<code className="text-emerald-700 font-bold">Inscrito</code>, <code className="text-purple-700 font-bold">Repitencia</code>, o <code className="text-amber-700 font-bold">Cargo</code>).</li>
                                </ul>
                            </div>

                            {/* Selección de Periodo */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Periodo Lectivo de Destino:
                                </label>
                                <select
                                    value={formImport.periodo_id}
                                    onChange={(e) => setFormImport('periodo_id', e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#315d7a]"
                                >
                                    {periodos.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.nombre} {p.activo ? '(Activo)' : ''}
                                        </option>
                                    ))}
                                </select>
                                {erroresImport.periodo_id && (
                                    <p className="mt-1 text-[11px] text-rose-600">{erroresImport.periodo_id}</p>
                                )}
                            </div>

                            {/* Selector de Archivo Excel */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Seleccionar Archivo Completado (.xlsx, .xls, .csv):
                                </label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept=".xlsx, .xls, .csv"
                                    onChange={(e) => setFormImport('archivo', e.target.files?.[0] || null)}
                                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#315d7a]/10 file:text-[#315d7a] hover:file:bg-[#315d7a]/20 cursor-pointer border border-slate-300 rounded-xl p-1 bg-white"
                                />
                                {erroresImport.archivo && (
                                    <p className="mt-1 text-[11px] text-rose-600">{erroresImport.archivo}</p>
                                )}
                            </div>

                            {/* Botones de Acción */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setModalImportarAbierto(false)}
                                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={importando || !formImport.archivo}
                                    className="inline-flex items-center gap-2 rounded-lg bg-[#315d7a] px-4 py-2 text-xs font-bold text-white hover:bg-[#274b63] transition disabled:opacity-50 cursor-pointer shadow-xs"
                                >
                                    {importando ? (
                                        <>
                                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            <span>Importando...</span>
                                        </>
                                    ) : (
                                        <span>Procesar Importación</span>
                                    )}
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}