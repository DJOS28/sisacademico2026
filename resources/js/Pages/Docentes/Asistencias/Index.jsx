import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

export default function AsistenciasIndex({
    periodos = [],
    periodoActivo,
    periodoSeleccionado,
    periodoCerrado = false,
    horariosDocente = [],
    cursoSeleccionado,
    seccionSeleccionada,
}) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);

    const [cursoId, setCursoId] = useState(cursoSeleccionado?.id || (horariosDocente[0]?.curso_id ?? ''));
    const [seccionId, setSeccionId] = useState(seccionSeleccionada?.id || (horariosDocente[0]?.seccion_id ?? ''));
    const [periodoId, setPeriodoId] = useState(periodoSeleccionado?.id || periodoActivo?.id || '');

    const [estudiantes, setEstudiantes] = useState([]);
    const [sesiones, setSesiones] = useState([]);
    const [sesionActivaIndex, setSesionActivaIndex] = useState(0);

    // Mapa de asistencias: { [`${sesion_id}_${matricula_id}`]: { estado, observaciones } }
    const [asistenciasMap, setAsistenciasMap] = useState({});

    const cursosUnicos = Array.from(
        new Map(horariosDocente.map((h) => [`${h.curso_id}_${h.seccion_id}`, h])).values()
    );

    const cursoActualInfo = cursosUnicos.find(
        (h) => String(h.curso_id) === String(cursoId) && String(h.seccion_id) === String(seccionId)
    );

    useEffect(() => {
        if (periodoCerrado) {
            Swal.fire({
                icon: 'warning',
                title: 'Periodo Cerrado',
                text: 'La fecha límite ha vencido o el periodo académico está inactivo. Las asistencias se encuentran en modo solo lectura.',
                confirmButtonColor: '#315d7a',
                customClass: { popup: 'rounded-2xl' },
            });
        }
    }, [periodoCerrado, cursoId, seccionId]);

    useEffect(() => {
        if (cursoId && seccionId) {
            cargarMatriz(cursoId, seccionId, periodoId);
        }
    }, [cursoId, seccionId, periodoId]);

    const cargarMatriz = async (cId, sId, pId) => {
        setLoading(true);
        try {
            const res = await axios.get(route('docente.asistencias.matriz'), {
                params: { curso_id: cId, seccion_id: sId, periodo_id: pId },
            });

            const { estudiantes: estList, sesiones: sesList, asistencias: asisList } = res.data;

            const listaEstudiantesOrdenada = (estList || []).sort((a, b) =>
                a.nombre_completo.localeCompare(b.nombre_completo, 'es', { sensitivity: 'base' })
            );

            setEstudiantes(listaEstudiantesOrdenada);
            setSesiones(sesList || []);

            const mapa = {};
            (asisList || []).forEach((a) => {
                mapa[`${a.sesion_id}_${a.matricula_curso_id}`] = {
                    estado: a.estado,
                    observaciones: a.observaciones || '',
                };
            });

            setAsistenciasMap(mapa);
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudieron cargar los datos de asistencia.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCurso = (e) => {
        const val = e.target.value;
        if (!val) return;
        const [cId, sId] = val.split('_');
        setCursoId(cId);
        setSeccionId(sId);
        setSesionActivaIndex(0);

        router.post(
            route('docente.asistencias.select'),
            { curso_id: cId, seccion_id: sId, periodo_id: periodoId },
            { preserveState: true, preserveScroll: true }
        );
    };

    const sesionActual = sesiones[sesionActivaIndex];

    const getEstadoEstudiante = (sesionIdVal, matId) => {
        return asistenciasMap[`${sesionIdVal}_${matId}`]?.estado || 'presente';
    };

    const getObservacionEstudiante = (sesionIdVal, matId) => {
        return asistenciasMap[`${sesionIdVal}_${matId}`]?.observaciones || '';
    };

    const handleCambiarEstado = (matId, nuevoEstado) => {
        if (periodoCerrado || !sesionActual) return;
        setAsistenciasMap((prev) => ({
            ...prev,
            [`${sesionActual.id_sesion}_${matId}`]: {
                ...prev[`${sesionActual.id_sesion}_${matId}`],
                estado: nuevoEstado,
            },
        }));
    };

    const handleCambiarObservacion = (matId, obs) => {
        if (periodoCerrado || !sesionActual) return;
        setAsistenciasMap((prev) => ({
            ...prev,
            [`${sesionActual.id_sesion}_${matId}`]: {
                ...prev[`${sesionActual.id_sesion}_${matId}`],
                observaciones: obs,
            },
        }));
    };

    const handleMarcarTodos = (estado) => {
        if (periodoCerrado || !sesionActual) return;
        const nuevoMapa = { ...asistenciasMap };
        estudiantes.forEach((est) => {
            nuevoMapa[`${sesionActual.id_sesion}_${est.matricula_curso_id}`] = {
                ...nuevoMapa[`${sesionActual.id_sesion}_${est.matricula_curso_id}`],
                estado: estado,
            };
        });
        setAsistenciasMap(nuevoMapa);
    };

    // ==========================================
    // 1. DESCARGAR PLANTILLA EXCEL
    // ==========================================
    const handleDescargarPlantillaExcel = () => {
        if (sesiones.length === 0 || estudiantes.length === 0) {
            Swal.fire('Atención', 'No hay sesiones o estudiantes para generar la plantilla.', 'warning');
            return;
        }

        const wsData = [];

        wsData.push([`REGISTRO CONSOLIDADO DE ASISTENCIAS`]);
        wsData.push([`UNIDAD DIDÁCTICA: ${cursoActualInfo?.curso_nombre || 'CURSO'}`, '', `SECCIÓN: ${cursoActualInfo?.seccion_nombre || 'A'}`]);
        wsData.push([`LEYENDA: P = Presente | F = Falta | T = Tardanza | J = Justificado`]);
        wsData.push([]);

        const rowHeader1 = ['N°', 'DNI / CÓDIGO', 'APELLIDOS Y NOMBRES'];
        const rowHeader2 = ['', '', ''];

        const merges = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: sesiones.length + 2 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
            { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
            { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } },
            { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } },
            { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } },
        ];

        sesiones.forEach((s) => {
            rowHeader1.push(s.nombre.toUpperCase());
            rowHeader2.push(s.fecha || 'Sin fecha');
        });

        wsData.push(rowHeader1);
        wsData.push(rowHeader2);

        const estadoToLetra = { presente: 'P', falta: 'F', tardanza: 'T', justificado: 'J' };

        estudiantes.forEach((est, idx) => {
            const rowStudent = [idx + 1, est.codigo, est.nombre_completo];

            sesiones.forEach((s) => {
                const estadoLargo = getEstadoEstudiante(s.id_sesion, est.matricula_curso_id);
                rowStudent.push(estadoToLetra[estadoLargo] || 'P');
            });

            wsData.push(rowStudent);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!merges'] = merges;
        ws['!cols'] = [{ wch: 5 }, { wch: 14 }, { wch: 36 }, ...Array(sesiones.length).fill({ wch: 14 })];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'ASISTENCIAS');

        const nombreArchivo = `Plantilla_Asistencias_${(cursoActualInfo?.curso_nombre || 'Curso').replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
        XLSX.writeFile(wb, nombreArchivo);
    };

    // ==========================================
    // 2. IMPORTAR ASISTENCIAS DESDE EXCEL
    // ==========================================
    const handleFileUpload = (e) => {
        if (periodoCerrado) {
            Swal.fire('Acción Bloqueada', 'No se pueden importar asistencias en un periodo cerrado.', 'warning');
            return;
        }

        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];

                const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

                if (rows.length < 7) {
                    throw new Error('El archivo no contiene registros válidos.');
                }

                const letraToEstado = {
                    p: 'presente', presente: 'presente',
                    f: 'falta', falta: 'falta',
                    t: 'tardanza', tardanza: 'tardanza',
                    j: 'justificado', justificado: 'justificado',
                };

                let nuevoMapa = { ...asistenciasMap };
                let alumnosProcesados = 0;

                for (let r = 6; r < rows.length; r++) {
                    const row = rows[r];
                    if (!row || row.length === 0) continue;

                    const dniOrCode = String(row[1] || '').trim();
                    const nombre = String(row[2] || '').trim().toLowerCase();

                    const estEncontrado = estudiantes.find(
                        (est) =>
                            (dniOrCode && String(est.codigo).trim() === dniOrCode) ||
                            (nombre && est.nombre_completo.toLowerCase().includes(nombre))
                    );

                    if (estEncontrado) {
                        const matId = estEncontrado.matricula_curso_id;

                        sesiones.forEach((s, idx) => {
                            const colVal = String(row[3 + idx] || '').trim().toLowerCase();
                            if (colVal !== '') {
                                const estadoMapeado = letraToEstado[colVal] || 'presente';
                                nuevoMapa[`${s.id_sesion}_${matId}`] = {
                                    ...nuevoMapa[`${s.id_sesion}_${matId}`],
                                    estado: estadoMapeado,
                                };
                            }
                        });

                        alumnosProcesados++;
                    }
                }

                setAsistenciasMap(nuevoMapa);

                Swal.fire({
                    icon: 'success',
                    title: '¡Asistencias Importadas!',
                    text: `Se cargaron los estados de ${alumnosProcesados} estudiante(s) para todas las sesiones. Recuerda hacer clic en "Guardar Asistencia".`,
                    timer: 2500,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-2xl' },
                });
            } catch (err) {
                console.error(err);
                Swal.fire('Error', 'No se pudo leer el archivo Excel. Asegúrate de usar la plantilla descargada.', 'error');
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };

        reader.readAsBinaryString(file);
    };

    // ==========================================
    // 3. GUARDAR ASISTENCIAS
    // ==========================================
    const handleGuardar = async () => {
        if (periodoCerrado) {
            Swal.fire('Periodo Cerrado', 'No se pueden guardar asistencias en un periodo inactivo o vencido.', 'warning');
            return;
        }

        if (!sesionActual) return;

        setSaving(true);
        try {
            const payload = {
                sesion_id: sesionActual.id_sesion,
                fecha: sesionActual.fecha || new Date().toISOString().split('T')[0],
                periodo_id: parseInt(periodoId),
                asistencias: estudiantes.map((est) => ({
                    matricula_curso_id: est.matricula_curso_id,
                    estado: getEstadoEstudiante(sesionActual.id_sesion, est.matricula_curso_id),
                    observaciones: getObservacionEstudiante(sesionActual.id_sesion, est.matricula_curso_id),
                })),
            };

            const res = await axios.post(route('docente.asistencias.guardar'), payload);

            if (res.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Asistencia Guardada!',
                    text: `Se registró la asistencia de ${sesionActual.nombre} correctamente.`,
                    timer: 1600,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-2xl' },
                });
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', error.response?.data?.error || 'No se pudo guardar la asistencia.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleExportPdf = () => {
        window.open(
            route('docente.asistencias.pdf', {
                curso_id: cursoId,
                seccion_id: seccionId,
                periodo_id: periodoId,
            }),
            '_blank'
        );
    };

    const conteo = estudiantes.reduce(
        (acc, est) => {
            if (!sesionActual) return acc;
            const st = getEstadoEstudiante(sesionActual.id_sesion, est.matricula_curso_id);
            acc[st] = (acc[st] || 0) + 1;
            return acc;
        },
        { presente: 0, falta: 0, tardanza: 0, justificado: 0 }
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                Control de Asistencia Diaria
                            </span>
                            {periodoCerrado ? (
                                <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
                                    🔒 Periodo Cerrado (Solo Lectura)
                                </span>
                            ) : (
                                <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                                    Periodo {periodoActivo?.nombre}
                                </span>
                            )}
                        </div>
                        <h1 className="mt-1 text-2xl font-black text-slate-900">REGISTRO DE ASISTENCIA</h1>
                        <p className="text-xs text-slate-500">
                            Gestiona y actualiza la asistencia de los estudiantes por cada sesión académica o importa masivamente desde Excel.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleExportPdf}
                            disabled={!cursoId}
                            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                        >
                            📄 Exportar Reporte PDF
                        </button>
                        <button
                            type="button"
                            onClick={handleGuardar}
                            disabled={saving || !sesionActual || periodoCerrado}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                                periodoCerrado
                                    ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                                    : 'bg-[#315d7a] hover:bg-[#254860] text-white cursor-pointer disabled:opacity-50'
                            }`}
                        >
                            {periodoCerrado ? '🔒 Periodo Cerrado' : saving ? 'Guardando...' : 'Guardar Asistencia'}
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Registro de Asistencia" />

            <div className="space-y-4">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".xlsx, .xls, .csv"
                    disabled={periodoCerrado}
                    className="hidden"
                />

                {/* Selector de Curso */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Unidad Didáctica:</label>
                        <select
                            value={`${cursoId}_${seccionId}`}
                            onChange={handleSelectCurso}
                            className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#315d7a] focus:bg-white"
                        >
                            {cursosUnicos.length === 0 && (
                                <option value="">No tienes unidades didácticas asignadas</option>
                            )}
                            {cursosUnicos.map((h) => (
                                <option key={`${h.curso_id}_${h.seccion_id}`} value={`${h.curso_id}_${h.seccion_id}`}>
                                    {h.curso_nombre} — Sección {h.seccion_nombre} ({h.plan_nombre} - Semestre {h.semestre})
                                </option>
                            ))}
                        </select>
                    </div>

                    {sesionActual && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleMarcarTodos('presente')}
                                disabled={periodoCerrado}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer disabled:opacity-50"
                            >
                                ✓ Todos Presentes
                            </button>
                            <button
                                type="button"
                                onClick={() => handleMarcarTodos('falta')}
                                disabled={periodoCerrado}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition cursor-pointer disabled:opacity-50"
                            >
                                ✕ Todos Faltas
                            </button>
                        </div>
                    )}
                </div>

                {/* Pestañas de Sesiones + Botones de Plantilla e Importación Excel */}
                {sesiones.length > 0 ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-1">
                        <div className="flex items-center gap-1.5 overflow-x-auto">
                            {sesiones.map((s, idx) => (
                                <button
                                    key={s.id_sesion}
                                    type="button"
                                    onClick={() => setSesionActivaIndex(idx)}
                                    className={`px-4 py-2 rounded-t-xl text-xs font-bold transition whitespace-nowrap border-t border-x cursor-pointer ${
                                        sesionActivaIndex === idx
                                            ? 'bg-white text-[#315d7a] border-slate-300 shadow-xs font-black'
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border-transparent'
                                    }`}
                                >
                                    📅 {s.nombre} ({s.fecha || 'Sin fecha'})
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={handleDescargarPlantillaExcel}
                                className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
                                title="Descargar plantilla de todas las sesiones"
                            >
                                <span>📥 Plantilla Excel</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={periodoCerrado}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs ${
                                    periodoCerrado
                                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-pointer'
                                }`}
                                title="Cargar asistencia de todas las sesiones desde Excel"
                            >
                                <span>📤 Importar Excel</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                        No hay sesiones registradas para este curso. Genera o crea las sesiones en la sección de gestión académica.
                    </div>
                )}

                {/* Resumen de la sesión activa */}
                {sesionActual && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                            <span className="text-xs font-bold text-emerald-800">Presentes</span>
                            <p className="text-lg font-black text-emerald-900">{conteo.presente}</p>
                        </div>
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
                            <span className="text-xs font-bold text-rose-800">Faltas</span>
                            <p className="text-lg font-black text-rose-900">{conteo.falta}</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                            <span className="text-xs font-bold text-amber-800">Tardanzas</span>
                            <p className="text-lg font-black text-amber-900">{conteo.tardanza}</p>
                        </div>
                        <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-center">
                            <span className="text-xs font-bold text-sky-800">Justificados</span>
                            <p className="text-lg font-black text-sky-900">{conteo.justificado}</p>
                        </div>
                    </div>
                )}

                {/* Tabla de Asistencia */}
                {loading ? (
                    <div className="py-16 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
                        Cargando lista de estudiantes...
                    </div>
                ) : sesionActual && estudiantes.length > 0 ? (
                    <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                                    <th className="p-3 w-10 text-center">N°</th>
                                    <th className="p-3 min-w-[240px]">APELLIDOS Y NOMBRES</th>
                                    <th className="p-3 min-w-[280px] text-center">ESTADO DE ASISTENCIA</th>
                                    <th className="p-3 min-w-[200px]">OBSERVACIONES</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {estudiantes.map((est, idx) => {
                                    const estado = getEstadoEstudiante(sesionActual.id_sesion, est.matricula_curso_id);
                                    const obs = getObservacionEstudiante(sesionActual.id_sesion, est.matricula_curso_id);

                                    return (
                                        <tr key={est.matricula_curso_id} className="hover:bg-slate-50 transition">
                                            <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                                            <td className="p-3 font-bold text-slate-900">
                                                <div>{est.nombre_completo}</div>
                                                <div className="text-[10px] text-slate-400 font-mono">{est.codigo}</div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50 gap-1">
                                                    {[
                                                        { key: 'presente', label: 'Presente', color: 'bg-emerald-600 text-white' },
                                                        { key: 'tardanza', label: 'Tardanza', color: 'bg-amber-500 text-white' },
                                                        { key: 'falta', label: 'Falta', color: 'bg-rose-600 text-white' },
                                                        { key: 'justificado', label: 'Justificado', color: 'bg-sky-600 text-white' },
                                                    ].map((item) => (
                                                        <button
                                                            key={item.key}
                                                            type="button"
                                                            disabled={periodoCerrado}
                                                            onClick={() => handleCambiarEstado(est.matricula_curso_id, item.key)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                                                estado === item.key
                                                                    ? `${item.color} shadow-xs`
                                                                    : 'text-slate-600 hover:bg-slate-200/60'
                                                            }`}
                                                        >
                                                            {item.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    type="text"
                                                    disabled={periodoCerrado}
                                                    value={obs}
                                                    placeholder="Observación opcional..."
                                                    onChange={(e) => handleCambiarObservacion(est.matricula_curso_id, e.target.value)}
                                                    className={`w-full text-xs rounded-xl border px-3 py-1.5 focus:outline-none ${
                                                        periodoCerrado
                                                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                                            : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#315d7a]'
                                                    }`}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </div>
        </AuthenticatedLayout>
    );
}