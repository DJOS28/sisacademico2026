import { useState, useEffect, Fragment } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function NotasTab({ curso, seccion, periodo }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [estudiantes, setEstudiantes] = useState([]);
    const [logros, setLogros] = useState([]);

    const [subData, setSubData] = useState({});     // { `${est_id}_${sub_id}`: nota }
    const [logroData, setLogroData] = useState({}); // { `${est_id}_${logro_id}`: nota }
    const [finalData, setFinalData] = useState({}); // { `${est_id}`: nota }

    // Estados para el Modal de Moodle
    const [showMoodleModal, setShowMoodleModal] = useState(false);
    const [moodleEvaluaciones, setMoodleEvaluaciones] = useState([]);
    const [loadingMoodle, setLoadingMoodle] = useState(false);
    const [importingMoodle, setImportingMoodle] = useState(false);

    const [moodleForm, setMoodleForm] = useState({
        moodle_item_id: '',
        destino_tipo: 'final',
        subcomponente_id: '',
        logro_curso_id: '',
    });

    useEffect(() => {
        fetchMatriz();
    }, []);

    const fetchMatriz = async () => {
        setLoading(true);
        try {
            const res = await axios.get(route('cursos.notas.matriz'));
            const { estudiantes, logros, notas_subcomponentes, notas_logros, notas_finales } = res.data;

            setEstudiantes(estudiantes || []);
            setLogros(logros || []);

            const subObj = {};
            (notas_subcomponentes || []).forEach(n => { 
                subObj[`${n.estudiante_id}_${n.subcomponente_id}`] = n.nota; 
            });
            setSubData(subObj);

            const logroObj = {};
            (notas_logros || []).forEach(nl => { 
                logroObj[`${nl.estudiante_id}_${nl.logro_curso_id}`] = nl.nota; 
            });
            setLogroData(logroObj);

            const finalObj = {};
            (notas_finales || []).forEach(nf => { 
                finalObj[nf.estudiante_id] = nf.promedio; 
            });
            setFinalData(finalObj);

            recalcularTodosLosPromedios(estudiantes, logros, subObj, logroObj, finalObj);

        } catch (error) {
            Swal.fire('Error', 'No se pudieron cargar las calificaciones.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const formatNotaInput = (value) => {
        if (value === '' || value === null) return '';
        let val = parseFloat(value);
        if (isNaN(val)) return '';
        if (val < 0) return 0;
        if (val > 20) return 20;
        return value;
    };

    const recalcularTodosLosPromedios = (listEstudiantes, listLogros, currentSub, currentLogro, currentFinal) => {
        let newLogroData = { ...currentLogro };
        let newFinalData = { ...currentFinal };

        // Si NO hay logros configurados, mantener y pintar las notas finales directas
        if (!listLogros || listLogros.length === 0) {
            setLogroData(newLogroData);
            setFinalData(newFinalData);
            return;
        }

        listEstudiantes.forEach(est => {
            const estId = est.estudiante_id;
            let sumaNotasLogros = 0;
            let logrosConNotaCount = 0;

            listLogros.forEach(logro => {
                const tieneSubcomponentes = logro.subcomponentes && logro.subcomponentes.length > 0;

                if (tieneSubcomponentes) {
                    let sumaPonderada = 0;
                    let pesoTotalIngresado = 0;

                    logro.subcomponentes.forEach(sub => {
                        const val = currentSub[`${estId}_${sub.id}`];
                        if (val !== undefined && val !== '' && !isNaN(val)) {
                            const peso = parseFloat(sub.peso) || 0;
                            sumaPonderada += parseFloat(val) * peso;
                            pesoTotalIngresado += peso;
                        }
                    });

                    if (pesoTotalIngresado > 0) {
                        const notaCalculada = Math.round((sumaPonderada / pesoTotalIngresado) * 10) / 10;
                        newLogroData[`${estId}_${logro.id}`] = notaCalculada;
                        sumaNotasLogros += notaCalculada;
                        logrosConNotaCount++;
                    } else {
                        delete newLogroData[`${estId}_${logro.id}`];
                    }
                } else {
                    const valDirecto = currentLogro[`${estId}_${logro.id}`];
                    if (valDirecto !== undefined && valDirecto !== '' && !isNaN(valDirecto)) {
                        sumaNotasLogros += parseFloat(valDirecto);
                        logrosConNotaCount++;
                    }
                }
            });

            if (logrosConNotaCount > 0) {
                newFinalData[estId] = Math.round(sumaNotasLogros / logrosConNotaCount);
            } else {
                delete newFinalData[estId];
            }
        });

        setLogroData(newLogroData);
        setFinalData(newFinalData);
    };

    const handleSubChange = (estId, subId, value) => {
        const valValidado = formatNotaInput(value);
        const updatedSub = { ...subData, [`${estId}_${subId}`]: valValidado };
        setSubData(updatedSub);
        recalcularTodosLosPromedios(estudiantes, logros, updatedSub, logroData, finalData);
    };

    const handleLogroChange = (estId, logroId, value) => {
        const valValidado = formatNotaInput(value);
        const updatedLogro = { ...logroData, [`${estId}_${logroId}`]: valValidado };
        setLogroData(updatedLogro);
        recalcularTodosLosPromedios(estudiantes, logros, subData, updatedLogro, finalData);
    };

    const handleFinalDirectChange = (estId, value) => {
        const valValidado = formatNotaInput(value);
        setFinalData(prev => ({
            ...prev,
            [estId]: valValidado,
        }));
    };

    const handleOpenMoodleModal = async () => {
        setShowMoodleModal(true);
        setLoadingMoodle(true);

        const tieneLogros = logros && logros.length > 0;
        const tieneSubcomponentes = tieneLogros && logros.some(l => l.subcomponentes?.length > 0);

        let defaultTipo = 'final';
        if (tieneSubcomponentes) {
            defaultTipo = 'subcomponente';
        } else if (tieneLogros) {
            defaultTipo = 'logro';
        }

        setMoodleForm({
            moodle_item_id: '',
            destino_tipo: defaultTipo,
            subcomponente_id: '',
            logro_curso_id: '',
        });

        try {
            const res = await axios.get(route('evaluaciones.moodle.disponibles'));
            setMoodleEvaluaciones(res.data.evaluaciones || []);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error de Conexión',
                text: error.response?.data?.error || 'No se pudieron consultar las evaluaciones de Moodle.',
                customClass: { popup: 'rounded-2xl' }
            });
        } finally {
            setLoadingMoodle(false);
        }
    };

    const handleImportarMoodle = async (e) => {
        e.preventDefault();

        if (!moodleForm.moodle_item_id) {
            Swal.fire('Atención', 'Seleccione una evaluación de Moodle.', 'warning');
            return;
        }

        const tieneLogros = logros && logros.length > 0;

        if (tieneLogros) {
            if (moodleForm.destino_tipo === 'subcomponente' && !moodleForm.subcomponente_id) {
                Swal.fire('Atención', 'Seleccione el subcomponente de destino.', 'warning');
                return;
            }

            if (moodleForm.destino_tipo === 'logro' && !moodleForm.logro_curso_id) {
                Swal.fire('Atención', 'Seleccione el logro de destino.', 'warning');
                return;
            }
        }

        setImportingMoodle(true);

        // Anuncio SweetAlert2 con spinner y bloqueo de pantalla
        Swal.fire({
            title: 'Sincronizando con el Aula Virtual',
            html: `
                <div class="space-y-2 text-xs text-slate-600 text-left mt-2">
                    <p>• Conectando con el Libro de Calificaciones de Moodle...</p>
                    <p>• Vinculando cuentas de todos los estudiantes matriculados...</p>
                    <p>• Convirtiendo notas a escala vigesimal (0 a 20)...</p>
                    <p class="text-amber-700 font-semibold mt-2">⚠️ Por favor, espere y no cierre esta ventana.</p>
                </div>
            `,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            },
            customClass: { popup: 'rounded-2xl' }
        });

        try {
            const payload = {
                moodle_item_id: moodleForm.moodle_item_id,
                es_nota_final: !tieneLogros || moodleForm.destino_tipo === 'final',
                subcomponente_id: tieneLogros && moodleForm.destino_tipo === 'subcomponente' ? moodleForm.subcomponente_id : null,
                logro_curso_id: tieneLogros && moodleForm.destino_tipo === 'logro' ? moodleForm.logro_curso_id : null,
            };

            const res = await axios.post(route('notas.importar.moodle'), payload);

            setShowMoodleModal(false);

            Swal.fire({
                icon: 'success',
                title: '¡Sincronización Completada!',
                text: res.data.message,
                timer: 2000,
                showConfirmButton: false,
                customClass: { popup: 'rounded-2xl' }
            });

            // Refrescar la matriz para mostrar las notas de todos los alumnos
            fetchMatriz();
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error al Importar',
                text: error.response?.data?.error || 'Ocurrió un error al importar las calificaciones.',
                customClass: { popup: 'rounded-2xl' }
            });
        } finally {
            setImportingMoodle(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const tieneLogros = logros && logros.length > 0;

            let payload = {
                notas_subcomponentes: [],
                notas_logros_manuales: [],
                notas_finales_directas: [],
            };

            if (tieneLogros) {
                payload.notas_subcomponentes = Object.keys(subData).map(k => {
                    const [estudiante_id, subcomponente_id] = k.split('_');
                    return {
                        estudiante_id: parseInt(estudiante_id),
                        subcomponente_id: parseInt(subcomponente_id),
                        nota: subData[k] !== '' && subData[k] !== undefined ? parseFloat(subData[k]) : null,
                    };
                });

                logros.forEach(logro => {
                    estudiantes.forEach(est => {
                        const val = logroData[`${est.estudiante_id}_${logro.id}`];
                        if (val !== undefined && val !== '' && val !== null) {
                            payload.notas_logros_manuales.push({
                                estudiante_id: est.estudiante_id,
                                logro_curso_id: logro.id,
                                nota: parseFloat(val),
                            });
                        }
                    });
                });

                payload.notas_finales_directas = estudiantes.map(est => ({
                    estudiante_id: est.estudiante_id,
                    nota: finalData[est.estudiante_id] !== undefined && finalData[est.estudiante_id] !== '' 
                        ? parseFloat(finalData[est.estudiante_id]) 
                        : null,
                }));

            } else {
                payload.notas_finales_directas = estudiantes.map(est => ({
                    estudiante_id: est.estudiante_id,
                    nota: finalData[est.estudiante_id] !== undefined && finalData[est.estudiante_id] !== '' 
                        ? parseFloat(finalData[est.estudiante_id]) 
                        : null,
                }));
            }

            const res = await axios.post(route('cursos.notas.guardar'), payload);

            if (res.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Notas Guardadas!',
                    text: res.data.message,
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-2xl' },
                });
                fetchMatriz();
            }
        } catch (error) {
            Swal.fire('Error', 'Ocurrió un error al guardar las calificaciones.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleExportPdf = () => {
        window.open(route('cursos.notas.pdf'), '_blank');
    };

    const handleExportNominaPdf = () => {
        const url = route('reportes.nomina_matriculados', {
            curso_id: curso?.id,
            seccion_id: seccion?.id,
            periodo_id: periodo?.id,
        });
        window.open(url, '_blank');
    };

    const handleExportRankingPdf = () => {
        window.open(route('cursos.ranking.pdf'), '_blank');
    };

    if (loading) {
        return <div className="py-12 text-center text-xs text-slate-500 font-medium">Cargando matriz de calificaciones...</div>;
    }

    const tieneLogros = logros && logros.length > 0;
    const tieneSubcomponentesGlobal = tieneLogros && logros.some(l => l.subcomponentes && l.subcomponentes.length > 0);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                    <h2 className="text-base font-bold text-slate-900">Registro de Calificaciones</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {tieneLogros 
                            ? 'Ingrese notas por subcomponente o por logro. Los promedios se calculan automáticamente.'
                            : 'Este curso no tiene logros ni subcomponentes configurados. Ingrese la nota final directamente.'
                        }
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={handleOpenMoodleModal}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                    >
                        <span>📥 Importar de Moodle</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleExportPdf}
                        className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                    >
                        📄 Reporte PDF
                    </button>

                    <button
                        type="button"
                        onClick={handleExportNominaPdf}
                        className="bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                    >
                        📋 Nómina
                    </button>

                    <button
                        type="button"
                        onClick={handleExportRankingPdf}
                        className="bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                    >
                        🏆 Top 5
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-[#315d7a] hover:bg-[#254860] text-white px-4 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                        {saving ? 'Guardando...' : 'Guardar Calificaciones'}
                    </button>
                </div>
            </div>

            {/* Matriz Dinámica */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        {/* Fila 1: Logros */}
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                            <th className="p-3 font-bold border-r border-slate-200 min-w-[220px]" rowSpan={tieneSubcomponentesGlobal ? 2 : 1}>
                                Alumno
                            </th>

                            {tieneLogros && logros.map(logro => {
                                const subCount = logro.subcomponentes ? logro.subcomponentes.length : 0;
                                const colSpanTotal = subCount > 0 ? subCount + 1 : 1;

                                return (
                                    <th
                                        key={logro.id}
                                        colSpan={colSpanTotal}
                                        className="p-2 text-center border-r border-slate-200 bg-slate-200/60 font-bold"
                                    >
                                        {logro.nombre}
                                    </th>
                                );
                            })}

                            <th className="p-3 font-bold text-center bg-sky-100/70 text-sky-900 min-w-[100px]" rowSpan={tieneSubcomponentesGlobal ? 2 : 1}>
                                Nota Final
                            </th>
                        </tr>

                        {/* Fila 2: Subcomponentes */}
                        {tieneSubcomponentesGlobal && (
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px]">
                                {logros.map(logro => (
                                    <Fragment key={logro.id}>
                                        {logro.subcomponentes && logro.subcomponentes.length > 0 ? (
                                            <>
                                                {logro.subcomponentes.map(sub => (
                                                    <th key={sub.id} className="p-2 text-center border-r border-slate-200 font-semibold min-w-[85px]">
                                                        {sub.nombre}
                                                        <span className="block text-[10px] text-slate-400 font-normal">({sub.peso}%)</span>
                                                    </th>
                                                ))}
                                                <th className="p-2 text-center border-r border-slate-200 font-bold bg-amber-50 text-amber-800 min-w-[65px]">
                                                    Prom.
                                                </th>
                                            </>
                                        ) : (
                                            <th className="p-2 text-center border-r border-slate-200 font-normal text-slate-400 italic min-w-[90px]">
                                                Nota Directa
                                            </th>
                                        )}
                                    </Fragment>
                                ))}
                            </tr>
                        )}
                    </thead>

                    <tbody className="divide-y divide-slate-200">
                        {estudiantes.map(est => {
                            const estId = est.estudiante_id;

                            return (
                                <tr key={estId} className="hover:bg-slate-50 transition">
                                    {/* Alumno */}
                                    <td className="p-3 font-semibold text-slate-800 border-r border-slate-200">
                                        <div className="font-bold">{est.nombre_completo}</div>
                                        <div className="text-[10px] text-slate-400">{est.codigo}</div>
                                    </td>

                                    {/* Logros */}
                                    {tieneLogros && logros.map(logro => {
                                        const tieneSubs = logro.subcomponentes && logro.subcomponentes.length > 0;

                                        return (
                                            <Fragment key={logro.id}>
                                                {tieneSubs ? (
                                                    <>
                                                        {logro.subcomponentes.map(sub => {
                                                            const key = `${estId}_${sub.id}`;
                                                            return (
                                                                <td key={sub.id} className="p-1 border-r border-slate-200 text-center">
                                                                    <input
                                                                        type="number" min="0" max="20" step="0.1"
                                                                        value={subData[key] ?? ''}
                                                                        onChange={(e) => handleSubChange(estId, sub.id, e.target.value)}
                                                                        className="w-14 text-center text-xs font-bold py-1 rounded-lg border-slate-200 focus:border-[#315d7a]"
                                                                    />
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="p-2 text-center font-bold text-amber-900 bg-amber-50/50 border-r border-slate-200">
                                                            {logroData[`${estId}_${logro.id}`] ?? '-'}
                                                        </td>
                                                    </>
                                                ) : (
                                                    <td className="p-1 border-r border-slate-200 text-center bg-slate-50/30">
                                                        <input
                                                            type="number" min="0" max="20" step="0.1"
                                                            value={logroData[`${estId}_${logro.id}`] ?? ''}
                                                            onChange={(e) => handleLogroChange(estId, logro.id, e.target.value)}
                                                            className="w-16 text-center text-xs font-bold py-1 rounded-lg border-slate-200 focus:border-[#315d7a]"
                                                        />
                                                    </td>
                                                )}
                                            </Fragment>
                                        );
                                    })}

                                    {/* Nota Final */}
                                    <td className="p-1.5 text-center font-black text-sm bg-sky-50 text-sky-900">
                                        {tieneLogros ? (
                                            <span>{finalData[estId] ?? '-'}</span>
                                        ) : (
                                            <input
                                                type="number"
                                                min="0"
                                                max="20"
                                                step="1"
                                                value={finalData[estId] ?? ''}
                                                onChange={(e) => handleFinalDirectChange(estId, e.target.value)}
                                                className="w-16 text-center text-xs font-bold py-1 rounded-lg border-slate-200 focus:border-[#315d7a] bg-white shadow-sm"
                                                placeholder="0-20"
                                            />
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal Moodle */}
            {showMoodleModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <span>📥 Importar Calificaciones de Moodle</span>
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Descarga notas de tareas/exámenes y vuelca los valores a tu registro auxiliar.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowMoodleModal(false)}
                                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {loadingMoodle ? (
                            <div className="py-12 text-center text-xs text-slate-500 font-medium flex justify-center items-center gap-2">
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></span>
                                Conectando con el Libro de Calificaciones de Moodle...
                            </div>
                        ) : (
                            <form onSubmit={handleImportarMoodle} className="flex-1 overflow-y-auto py-4 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        1. Actividad / Tarea de Moodle *
                                    </label>
                                    {moodleEvaluaciones.length > 0 ? (
                                        <select
                                            value={moodleForm.moodle_item_id}
                                            onChange={(e) => setMoodleForm({ ...moodleForm, moodle_item_id: e.target.value })}
                                            required
                                            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-600 font-medium"
                                        >
                                            <option value="">-- Seleccionar actividad de Moodle --</option>
                                            {moodleEvaluaciones.map((ev) => (
                                                <option key={ev.item_id} value={ev.item_id}>
                                                    [{ev.tipo?.toUpperCase()}] {ev.nombre} (Puntaje Máx: {ev.nota_maxima} pts)
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                                            No se encontraron actividades calificables en este curso de Moodle.
                                        </div>
                                    )}
                                </div>

                                {tieneLogros ? (
                                    <>
                                        {tieneSubcomponentesGlobal && (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    2. ¿Dónde deseas cargar las notas? *
                                                </label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                                                        moodleForm.destino_tipo === 'subcomponente'
                                                            ? 'border-amber-500 bg-amber-50/50 text-amber-900'
                                                            : 'border-slate-200 text-slate-700'
                                                    }`}>
                                                        <input
                                                            type="radio"
                                                            name="destino_tipo"
                                                            value="subcomponente"
                                                            checked={moodleForm.destino_tipo === 'subcomponente'}
                                                            onChange={(e) => setMoodleForm({ ...moodleForm, destino_tipo: e.target.value })}
                                                            className="text-amber-600"
                                                        />
                                                        <span>A un Subcomponente</span>
                                                    </label>

                                                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                                                        moodleForm.destino_tipo === 'logro'
                                                            ? 'border-amber-500 bg-amber-50/50 text-amber-900'
                                                            : 'border-slate-200 text-slate-700'
                                                    }`}>
                                                        <input
                                                            type="radio"
                                                            name="destino_tipo"
                                                            value="logro"
                                                            checked={moodleForm.destino_tipo === 'logro'}
                                                            onChange={(e) => setMoodleForm({ ...moodleForm, destino_tipo: e.target.value })}
                                                            className="text-amber-600"
                                                        />
                                                        <span>A un Logro Directo</span>
                                                    </label>
                                                </div>
                                            </div>
                                        )}

                                        {moodleForm.destino_tipo === 'subcomponente' && tieneSubcomponentesGlobal ? (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    3. Subcomponente de Destino *
                                                </label>
                                                <select
                                                    value={moodleForm.subcomponente_id}
                                                    onChange={(e) => setMoodleForm({ ...moodleForm, subcomponente_id: e.target.value })}
                                                    required
                                                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-600 font-medium"
                                                >
                                                    <option value="">-- Seleccionar Subcomponente --</option>
                                                    {logros.map((l) => (
                                                        <optgroup key={l.id} label={l.nombre}>
                                                            {(l.subcomponentes || []).map((sc) => (
                                                                <option key={sc.id} value={sc.id}>
                                                                    {sc.nombre} ({sc.peso}%)
                                                                </option>
                                                            ))}
                                                        </optgroup>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    3. Logro de Destino *
                                                </label>
                                                <select
                                                    value={moodleForm.logro_curso_id}
                                                    onChange={(e) => setMoodleForm({ ...moodleForm, logro_curso_id: e.target.value })}
                                                    required
                                                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-600 font-medium"
                                                >
                                                    <option value="">-- Seleccionar Logro --</option>
                                                    {logros.map((l) => (
                                                        <option key={l.id} value={l.id}>
                                                            {l.nombre}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-800">
                                        ℹ️ <strong>Destino Automático:</strong> Este curso no tiene logros configurados; las calificaciones se asignarán directamente como <strong>Nota Final</strong> del estudiante.
                                    </div>
                                )}

                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
                                    💡 <strong>Conversión Automática:</strong> Las notas se adaptan proporcionalmente a la escala vigesimal (<strong>0 a 20</strong>) y se asignan a los alumnos matriculados.
                                </div>

                                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowMoodleModal(false)}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={importingMoodle || moodleEvaluaciones.length === 0}
                                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                                    >
                                        {importingMoodle ? 'Importando...' : 'Importar y Actualizar Matriz'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}