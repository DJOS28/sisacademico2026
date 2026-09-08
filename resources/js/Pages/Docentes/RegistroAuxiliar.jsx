import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useState, useEffect, Fragment, useRef } from 'react';
import * as XLSX from 'xlsx';

export default function RegistroAuxiliar({
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

    // Selección de curso, sección y periodo
    const [cursoId, setCursoId] = useState(cursoSeleccionado?.id || (horariosDocente[0]?.curso_id ?? ''));
    const [seccionId, setSeccionId] = useState(seccionSeleccionada?.id || (horariosDocente[0]?.seccion_id ?? ''));
    const [periodoId, setPeriodoId] = useState(periodoSeleccionado?.id || periodoActivo?.id || '');

    // Estudiantes, Logros y Pestaña activa
    const [estudiantes, setEstudiantes] = useState([]);
    const [logros, setLogros] = useState([]);
    const [indicadorActivoIndex, setIndicadorActivoIndex] = useState(0);

    // Notas de Criterios -> { `${est_id}_${criterio_id}`: nota }
    const [criteriosData, setCriteriosData] = useState({});

    // Promedios calculados
    const [promediosDecimal, setPromediosDecimal] = useState({});
    const [logroData, setLogroData] = useState({});
    const [recuperaciones, setRecuperaciones] = useState({});

    // Deduplicar opciones del selector de cursos
    const cursosUnicos = Array.from(
        new Map(horariosDocente.map((h) => [`${h.curso_id}_${h.seccion_id}`, h])).values()
    );

    // Alerta de Periodo Cerrado
    useEffect(() => {
        if (periodoCerrado) {
            Swal.fire({
                icon: 'warning',
                title: 'Periodo Cerrado',
                text: 'La fecha límite ha vencido o el periodo académico se encuentra inactivo. El registro auxiliar está en modo solo lectura.',
                confirmButtonColor: '#315d7a',
                customClass: { popup: 'rounded-2xl' },
            });
        }
    }, [periodoCerrado, cursoId, seccionId]);

    useEffect(() => {
        if (cursoId && seccionId) {
            fetchMatriz(cursoId, seccionId, periodoId);
        }
    }, [cursoId, seccionId, periodoId]);

    const fetchMatriz = async (cId, sId, pId) => {
        setLoading(true);
        try {
            const res = await axios.get(route('docente.registro-auxiliar.matriz'), {
                params: {
                    curso_id: cId,
                    seccion_id: sId,
                    periodo_id: pId,
                },
            });

            const {
                estudiantes: estList,
                logros: logList,
                notas_criterios,
                notas_logros,
            } = res.data;

            const safeEstudiantes = estList || [];
            const safeLogros = logList || [];

            setEstudiantes(safeEstudiantes);
            setLogros(safeLogros);

            const critObj = {};
            (notas_criterios || []).forEach((nc) => {
                critObj[`${nc.estudiante_id}_${nc.criterio_id}`] = nc.nota;
            });
            setCriteriosData(critObj);

            const logObj = {};
            (notas_logros || []).forEach((nl) => {
                logObj[`${nl.estudiante_id}_${nl.logro_curso_id}`] = nl.nota !== null ? Math.round(nl.nota) : null;
            });
            setLogroData(logObj);

            recalcularTodos(safeEstudiantes, safeLogros, critObj, logObj, recuperaciones);
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudieron cargar las calificaciones de este curso.', 'error');
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
        setIndicadorActivoIndex(0);

        router.post(
            route('docente.registro-auxiliar.select'),
            {
                curso_id: cId,
                seccion_id: sId,
                periodo_id: periodoId,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const formatNotaInput = (value) => {
        if (value === '' || value === null) return '';
        let val = parseFloat(value);
        if (isNaN(val)) return '';
        if (val < 0) return 0;
        if (val > 20) return 20;
        return value;
    };

    const recalcularTodos = (listEstudiantes, listLogros, currentCrit, currentLogro, currentRecup) => {
        let newPromDecimal = {};
        let newLogroData = { ...currentLogro };

        if (!listLogros || listLogros.length === 0) {
            setPromediosDecimal(newPromDecimal);
            setLogroData(newLogroData);
            return;
        }

        listEstudiantes.forEach((est) => {
            const estId = est.estudiante_id;

            listLogros.forEach((logro) => {
                const subcomponentes = logro.subcomponentes || [];
                let sumaPromediosDimension = 0;
                let dimensionesEvaluadas = 0;

                subcomponentes.forEach((sub) => {
                    const criteriosList = sub.criterios || [];
                    let sumaCriterios = 0;
                    let criteriosLlenados = 0;

                    criteriosList.forEach((crit) => {
                        const val = currentCrit[`${estId}_${crit.id}`];
                        if (val !== undefined && val !== '' && !isNaN(val)) {
                            sumaCriterios += parseFloat(val);
                            criteriosLlenados++;
                        }
                    });

                    if (criteriosLlenados > 0) {
                        const promDim = sumaCriterios / criteriosLlenados;
                        sumaPromediosDimension += promDim;
                        dimensionesEvaluadas++;
                    }
                });

                if (dimensionesEvaluadas > 0) {
                    const promedioExacto = sumaPromediosDimension / dimensionesEvaluadas;
                    newPromDecimal[`${estId}_${logro.id}`] = promedioExacto.toFixed(2);

                    let notaIndicadorRedondeada = Math.round(promedioExacto);

                    const recupVal = currentRecup[`${estId}_${logro.id}`];
                    if (recupVal !== undefined && recupVal !== '' && !isNaN(recupVal)) {
                        notaIndicadorRedondeada = Math.max(notaIndicadorRedondeada, Math.round(parseFloat(recupVal)));
                    }

                    newLogroData[`${estId}_${logro.id}`] = notaIndicadorRedondeada;
                } else {
                    delete newPromDecimal[`${estId}_${logro.id}`];
                    delete newLogroData[`${estId}_${logro.id}`];
                }
            });
        });

        setPromediosDecimal(newPromDecimal);
        setLogroData(newLogroData);
    };

    const handleCriterioChange = (estId, criterioId, value) => {
        if (periodoCerrado) return;
        const valValidado = formatNotaInput(value);
        const updatedCrit = { ...criteriosData, [`${estId}_${criterioId}`]: valValidado };
        setCriteriosData(updatedCrit);
        recalcularTodos(estudiantes, logros, updatedCrit, logroData, recuperaciones);
    };

    const handleRecuperacionChange = (estId, logroId, value) => {
        if (periodoCerrado) return;
        const valValidado = formatNotaInput(value);
        const updatedRecup = { ...recuperaciones, [`${estId}_${logroId}`]: valValidado };
        setRecuperaciones(updatedRecup);
        recalcularTodos(estudiantes, logros, criteriosData, logroData, updatedRecup);
    };

    const logroActivo = logros[indicadorActivoIndex] || logros[0];
    const cursoActualInfo = cursosUnicos.find(
        (h) => String(h.curso_id) === String(cursoId) && String(h.seccion_id) === String(seccionId)
    );

    // Descargar Plantilla Excel
    const handleDescargarPlantillaExcel = () => {
        if (!logroActivo) return;

        const subcomponentes = logroActivo.subcomponentes || [];
        const wsData = [];

        wsData.push([`REGISTRO DE EVALUACIÓN - PLANTILLA DE ENTRADA`]);
        wsData.push([`UNIDAD DIDÁCTICA: ${cursoActualInfo?.curso_nombre || 'CURSO'}`, '', '', `SECCIÓN: ${cursoActualInfo?.seccion_nombre || 'A'}`]);
        wsData.push([`INDICADOR: ${logroActivo.nombre || 'Indicador 1'}`]);
        wsData.push([]);

        const rowHeader1 = ['N°', 'DNI / CÓDIGO', 'APELLIDOS Y NOMBRES'];
        const rowHeader2 = ['', '', ''];

        const merges = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
            { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
            { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } },
            { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } },
            { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } },
        ];

        let currentCol = 3;

        subcomponentes.forEach((sub) => {
            const numCrit = sub.criterios?.length || 1;
            const startCol = currentCol;
            const endCol = currentCol + numCrit - 1;

            rowHeader1.push(sub.nombre.toUpperCase());
            for (let i = 1; i < numCrit; i++) {
                rowHeader1.push('');
            }

            if (numCrit > 1) {
                merges.push({ s: { r: 4, c: startCol }, e: { r: 4, c: endCol } });
            }

            (sub.criterios || []).forEach((crit) => {
                rowHeader2.push(crit.codigo);
            });

            currentCol += numCrit;
        });

        rowHeader1.push('RECUPERACIÓN');
        rowHeader2.push('');
        merges.push({ s: { r: 4, c: currentCol }, e: { r: 5, c: currentCol } });

        wsData.push(rowHeader1);
        wsData.push(rowHeader2);

        estudiantes.forEach((est, idx) => {
            const rowStudent = [
                idx + 1,
                est.codigo,
                est.nombre_completo,
            ];

            subcomponentes.forEach((sub) => {
                (sub.criterios || []).forEach((crit) => {
                    const nota = criteriosData[`${est.estudiante_id}_${crit.id}`] ?? '';
                    rowStudent.push(nota !== '' ? parseFloat(nota) : '');
                });
            });

            const recup = recuperaciones[`${est.estudiante_id}_${logroActivo.id}`] ?? '';
            rowStudent.push(recup !== '' ? parseFloat(recup) : '');

            wsData.push(rowStudent);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!merges'] = merges;

        ws['!cols'] = [
            { wch: 5 },
            { wch: 14 },
            { wch: 34 },
            ...Array(currentCol + 1).fill({ wch: 9 }),
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `INDICADOR_${indicadorActivoIndex + 1}`);

        const nombreArchivo = `Plantilla_${(cursoActualInfo?.curso_nombre || 'Curso').replace(/[^a-zA-Z0-9]/g, '_')}_Logro_${indicadorActivoIndex + 1}.xlsx`;
        XLSX.writeFile(wb, nombreArchivo);
    };

    // Importar Excel
    const handleFileUpload = (e) => {
        if (periodoCerrado) {
            Swal.fire('Acción Bloqueada', 'No se pueden importar calificaciones en un periodo cerrado.', 'warning');
            return;
        }

        const file = e.target.files?.[0];
        if (!file || !logroActivo) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];

                const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

                const criteriosOrdenados = [];
                (logroActivo.subcomponentes || []).forEach((sub) => {
                    (sub.criterios || []).forEach((crit) => {
                        criteriosOrdenados.push(crit.id);
                    });
                });

                let updatedCrit = { ...criteriosData };
                let updatedRecup = { ...recuperaciones };
                let rowsProcessed = 0;

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
                        const estId = estEncontrado.estudiante_id;
                        let colIndex = 3;

                        criteriosOrdenados.forEach((critId) => {
                            const val = row[colIndex];
                            if (val !== '' && val !== null && !isNaN(val)) {
                                const numVal = Math.min(20, Math.max(0, parseFloat(val)));
                                updatedCrit[`${estId}_${critId}`] = numVal;
                            }
                            colIndex++;
                        });

                        const valRecup = row[colIndex];
                        if (valRecup !== '' && valRecup !== null && !isNaN(valRecup)) {
                            const numRecup = Math.min(20, Math.max(0, parseFloat(valRecup)));
                            updatedRecup[`${estId}_${logroActivo.id}`] = numRecup;
                        }

                        rowsProcessed++;
                    }
                }

                setCriteriosData(updatedCrit);
                setRecuperaciones(updatedRecup);
                recalcularTodos(estudiantes, logros, updatedCrit, logroData, updatedRecup);

                Swal.fire({
                    icon: 'success',
                    title: '¡Notas Importadas!',
                    text: `Se cargaron las calificaciones de ${rowsProcessed} estudiante(s). Recuerda hacer clic en "Guardar Registro".`,
                    timer: 2200,
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

    // Guardar Notas
    const handleSave = async () => {
        if (periodoCerrado) {
            Swal.fire({
                icon: 'error',
                title: 'Periodo Cerrado',
                text: 'El periodo académico está cerrado. No se pueden guardar modificaciones.',
                confirmButtonColor: '#315d7a',
                customClass: { popup: 'rounded-2xl' },
            });
            return;
        }

        setSaving(true);
        try {
            // 1. Subcomponentes calculados
            const subcomponentesPayload = [];
            logros.forEach((logro) => {
                (logro.subcomponentes || []).forEach((sub) => {
                    estudiantes.forEach((est) => {
                        const criteriosList = sub.criterios || [];
                        let sumaCrit = 0;
                        let count = 0;
                        criteriosList.forEach((crit) => {
                            const val = criteriosData[`${est.estudiante_id}_${crit.id}`];
                            if (val !== undefined && val !== '' && !isNaN(val)) {
                                sumaCrit += parseFloat(val);
                                count++;
                            }
                        });
                        if (count > 0) {
                            subcomponentesPayload.push({
                                estudiante_id: est.estudiante_id,
                                subcomponente_id: sub.id,
                                nota: parseFloat((sumaCrit / count).toFixed(2)),
                            });
                        }
                    });
                });
            });

            // 2. Logros
            const logrosPayload = logros.flatMap((logro) =>
                estudiantes
                    .map((est) => {
                        const val = logroData[`${est.estudiante_id}_${logro.id}`];
                        if (val !== undefined && val !== null && val !== '') {
                            return {
                                estudiante_id: est.estudiante_id,
                                logro_curso_id: logro.id,
                                nota: Math.round(parseFloat(val)),
                            };
                        }
                        return null;
                    })
                    .filter(Boolean)
            );

            // 3. Notas Finales
            const finalesPayload = estudiantes
                .map((est) => {
                    let suma = 0;
                    let count = 0;
                    logros.forEach((l) => {
                        const n = logroData[`${est.estudiante_id}_${l.id}`];
                        if (n !== undefined && n !== null && n !== '') {
                            suma += parseFloat(n);
                            count++;
                        }
                    });

                    if (count > 0) {
                        return {
                            estudiante_id: est.estudiante_id,
                            nota: Math.round(suma / count),
                        };
                    }
                    return null;
                })
                .filter(Boolean);

            const payload = {
                curso_id: parseInt(cursoId),
                seccion_id: parseInt(seccionId),
                periodo_id: parseInt(periodoId),
                notas_criterios: Object.keys(criteriosData).map((k) => {
                    const [estudiante_id, criterio_id] = k.split('_');
                    return {
                        estudiante_id: parseInt(estudiante_id),
                        criterio_id: parseInt(criterio_id),
                        nota: criteriosData[k] !== '' && criteriosData[k] !== undefined ? parseFloat(criteriosData[k]) : null,
                    };
                }),
                notas_subcomponentes: subcomponentesPayload,
                notas_logros: logrosPayload,
                notas_finales: finalesPayload,
            };

            const res = await axios.post(route('docente.registro-auxiliar.guardar'), payload);

            if (res.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Registro Guardado!',
                    text: 'Calificaciones, subcomponentes y notas finales sincronizados correctamente.',
                    timer: 1600,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-2xl' },
                });
                fetchMatriz(cursoId, seccionId, periodoId);
            }
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.error || 'No se pudo guardar el registro auxiliar.';
            Swal.fire('Error al Guardar', errorMsg, 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                Formato Oficial MINEDU
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
                        <h1 className="mt-1 text-2xl font-black text-slate-900">
                            REGISTRO AUXILIAR DE EVALUACIÓN
                        </h1>
                        <p className="text-xs text-slate-500">
                            Evaluación continua por dimensiones formativas (Actitudinal, Conceptual y Procedimental).
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => window.open(route('cursos.notas.pdf'), '_blank')}
                            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                            📄 Exportar PDF
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || !cursoId || periodoCerrado}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                                periodoCerrado
                                    ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                                    : 'bg-[#315d7a] hover:bg-[#254860] text-white cursor-pointer disabled:opacity-50'
                            }`}
                        >
                            {periodoCerrado ? '🔒 Periodo Cerrado' : saving ? 'Guardando...' : 'Guardar Registro'}
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Registro Auxiliar de Evaluación" />

            <div className="space-y-4">
                {/* Input oculto para subir archivo Excel */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".xlsx, .xls, .csv"
                    disabled={periodoCerrado}
                    className="hidden"
                />

                {/* Banner de Periodo Cerrado */}
                {periodoCerrado && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-medium">
                        <span className="text-base">⚠️</span>
                        <div>
                            <strong>Periodo Cerrado:</strong> La fecha de cierre del periodo académico ha culminado. Las calificaciones se encuentran en modo de solo lectura y no pueden ser modificadas.
                        </div>
                    </div>
                )}

                {/* Selector de Asignatura / Sección */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Unidad Didáctica:
                        </label>
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

                    {cursoActualInfo && (
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>Carrera: <strong className="text-slate-800">{cursoActualInfo.plan_nombre}</strong></span>
                            <span>Matriculados: <strong className="text-slate-800">{estudiantes.length}</strong></span>
                        </div>
                    )}
                </div>

                {/* ========================================================================= */}
                {/* PESTAÑAS DE INDICADORES COMPACTAS + BANNER CONTEXTUAL DEL LOGRO */}
                {/* ========================================================================= */}
                {logros.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200">
                            {/* Pestañas limpias estilo Hoja de Cálculo */}
                            <div className="flex items-center gap-1 overflow-x-auto">
                                {logros.map((logro, idx) => {
                                    const isActive = indicadorActivoIndex === idx;
                                    return (
                                        <button
                                            key={logro.id}
                                            type="button"
                                            onClick={() => setIndicadorActivoIndex(idx)}
                                            title={logro.nombre}
                                            className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition cursor-pointer border-t border-x ${
                                                isActive
                                                    ? 'bg-white text-[#315d7a] border-slate-300 shadow-xs font-black'
                                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 border-transparent'
                                            }`}
                                        >
                                            <span
                                                className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-black ${
                                                    isActive ? 'bg-[#315d7a] text-white' : 'bg-slate-200 text-slate-600'
                                                }`}
                                            >
                                                L{idx + 1}
                                            </span>
                                            <span className="max-w-[130px] truncate sm:max-w-[180px]">
                                                {logro.nombre || `Logro ${idx + 1}`}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Acciones de Excel */}
                            <div className="flex items-center gap-2 shrink-0 pb-1">
                                <button
                                    type="button"
                                    onClick={handleDescargarPlantillaExcel}
                                    className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
                                    title="Descargar plantilla de entrada para este indicador"
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
                                    title={periodoCerrado ? 'Periodo cerrado: importación deshabilitada' : 'Cargar notas desde archivo Excel'}
                                >
                                    <span>📤 Importar Excel</span>
                                </button>
                            </div>
                        </div>

                        {/* Banner Contextual con la información detallada del Logro Activo */}
                        {logroActivo && (
                            <div className="bg-sky-50/70 border border-sky-100 rounded-xl px-4 py-2.5 flex items-start gap-3 shadow-2xs">
                                <span className="bg-[#315d7a] text-white text-[11px] font-black px-2 py-0.5 rounded-md shrink-0 mt-0.5">
                                    LOGRO {indicadorActivoIndex + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-900 leading-tight">
                                        {logroActivo.nombre}
                                    </p>
                                    {logroActivo.descripcion && (
                                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                            {logroActivo.descripcion}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tabla Matriz del Indicador Activo */}
                {loading ? (
                    <div className="py-16 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
                        Cargando registro auxiliar del indicador...
                    </div>
                ) : logroActivo ? (
                    <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-xs bg-white">
                        <table className="w-full text-left text-xs border-collapse font-sans">
                            <thead>
                                {/* Fila 1: Dimensiones */}
                                <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 text-center font-bold">
                                    <th className="p-2 border-r border-slate-300 w-10 text-center" rowSpan={2}>N°</th>
                                    <th className="p-2 border-r border-slate-300 min-w-[220px] text-left" rowSpan={2}>APELLIDOS Y NOMBRES</th>

                                    {(logroActivo.subcomponentes || []).map((sub) => {
                                        const totalCrit = sub.criterios?.length || 1;
                                        return (
                                            <th
                                                key={sub.id}
                                                colSpan={totalCrit + 1}
                                                className="p-2 border-r border-slate-300 uppercase tracking-wider bg-slate-200/70 font-black"
                                            >
                                                {sub.nombre} {sub.peso ? `(${Number(sub.peso).toFixed(0)}%)` : ''}
                                            </th>
                                        );
                                    })}

                                    {/* Columnas Finales */}
                                    <th className="p-2 border-r border-slate-300 bg-slate-200/90 text-slate-800 font-bold min-w-[70px]" rowSpan={2}>
                                        PROMEDIO
                                    </th>
                                    <th className="p-2 border-r border-slate-300 bg-amber-100 text-amber-950 font-black min-w-[85px]" rowSpan={2}>
                                        PROMEDIO GENERAL
                                    </th>
                                    <th className="p-2 bg-slate-200 text-slate-800 font-bold min-w-[75px]" rowSpan={2}>
                                        RECUPERACIÓN
                                    </th>
                                </tr>

                                {/* Fila 2: Criterios C1..C4 y Promedio de cada Dimensión */}
                                <tr className="bg-slate-50 text-slate-600 border-b border-slate-300 text-center text-[11px] font-bold">
                                    {(logroActivo.subcomponentes || []).map((sub) => (
                                        <Fragment key={sub.id}>
                                            {(sub.criterios || []).map((crit) => (
                                                <th key={crit.id} className="p-1 border-r border-slate-300 w-11 bg-white font-mono font-bold text-slate-700" title={crit.nombre || crit.codigo}>
                                                    {crit.codigo}
                                                </th>
                                            ))}
                                            <th className="p-1 border-r border-slate-300 w-12 bg-slate-100 text-slate-900 font-bold">
                                                PROM.
                                            </th>
                                        </Fragment>
                                    ))}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-200">
                                {estudiantes.map((est, index) => {
                                    const estId = est.estudiante_id;
                                    const promExactoDecimal = promediosDecimal[`${estId}_${logroActivo.id}`];
                                    const promGeneralEntero = logroData[`${estId}_${logroActivo.id}`];

                                    return (
                                        <tr key={estId} className="hover:bg-slate-50 transition">
                                            {/* N° Orden */}
                                            <td className="p-2 text-center border-r border-slate-200 font-mono text-slate-400">
                                                {index + 1}
                                            </td>

                                            {/* Alumno */}
                                            <td className="p-2 border-r border-slate-200 font-bold text-slate-900">
                                                <div>{est.nombre_completo}</div>
                                                <div className="text-[10px] text-slate-400 font-mono">{est.codigo}</div>
                                            </td>

                                            {/* Criterios y Promedio Decimal de cada Dimensión */}
                                            {(logroActivo.subcomponentes || []).map((sub) => {
                                                const criteriosList = sub.criterios || [];
                                                let sumaCrit = 0;
                                                let countLlenados = 0;

                                                criteriosList.forEach((crit) => {
                                                    const val = criteriosData[`${estId}_${crit.id}`];
                                                    if (val !== undefined && val !== '' && !isNaN(val)) {
                                                        sumaCrit += parseFloat(val);
                                                        countLlenados++;
                                                    }
                                                });

                                                const promDimension = countLlenados > 0 ? (sumaCrit / countLlenados).toFixed(2) : '-';

                                                return (
                                                    <Fragment key={sub.id}>
                                                        {criteriosList.map((crit) => {
                                                            const valor = criteriosData[`${estId}_${crit.id}`] ?? '';

                                                            return (
                                                                <td key={crit.id} className="p-1 text-center border-r border-slate-200">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max="20"
                                                                        step="0.1"
                                                                        disabled={periodoCerrado}
                                                                        value={valor}
                                                                        onChange={(e) => handleCriterioChange(estId, crit.id, e.target.value)}
                                                                        placeholder="-"
                                                                        className={`w-10 text-center text-xs font-bold py-1 px-0.5 rounded border border-slate-200 focus:outline-none ${
                                                                            periodoCerrado
                                                                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                                                                : valor !== '' && parseFloat(valor) < 13
                                                                                ? 'text-rose-600 bg-rose-50/40 focus:border-[#315d7a]'
                                                                                : 'text-slate-800 focus:border-[#315d7a]'
                                                                        }`}
                                                                    />
                                                                </td>
                                                            );
                                                        })}

                                                        {/* Promedio Parcial de Dimensión */}
                                                        <td className="p-1 text-center font-bold border-r border-slate-300 bg-slate-100/60 text-slate-900 font-mono">
                                                            {promDimension}
                                                        </td>
                                                    </Fragment>
                                                );
                                            })}

                                            {/* Columna 1: PROMEDIO (Decimal exacto) */}
                                            <td className="p-2 text-center font-bold text-xs border-r border-slate-300 bg-slate-50 text-slate-800 font-mono">
                                                {promExactoDecimal !== undefined ? promExactoDecimal : '-'}
                                            </td>

                                            {/* Columna 2: PROMEDIO GENERAL (Entero Redondeado) */}
                                            <td className="p-2 text-center font-black text-sm border-r border-slate-300 bg-amber-50/70 text-amber-950 font-mono">
                                                {promGeneralEntero !== undefined ? promGeneralEntero : '-'}
                                            </td>

                                            {/* Columna 3: RECUPERACIÓN */}
                                            <td className="p-1 text-center bg-slate-50">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="20"
                                                    step="0.1"
                                                    disabled={periodoCerrado}
                                                    value={recuperaciones[`${estId}_${logroActivo.id}`] ?? ''}
                                                    onChange={(e) => handleRecuperacionChange(estId, logroActivo.id, e.target.value)}
                                                    placeholder="-"
                                                    className={`w-12 text-center text-xs font-bold py-1 rounded border border-slate-200 ${
                                                        periodoCerrado
                                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                            : 'focus:border-[#315d7a]'
                                                    }`}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
                        <h3 className="text-sm font-bold text-slate-800">No hay indicadores de logro configurados</h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Dirígete a la sección de Logros de Aprendizaje para generar las dimensiones y criterios oficiales de este curso.
                        </p>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}