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

    useEffect(() => {
        fetchMatriz();
    }, []);

    const fetchMatriz = async () => {
        setLoading(true);
        try {
            const res = await axios.get(route('cursos.notas.matriz'));
            const { estudiantes, logros, notas_subcomponentes, notas_logros, notas_finales } = res.data;

            setEstudiantes(estudiantes);
            setLogros(logros);

            const subObj = {};
            (notas_subcomponentes || []).forEach(n => { 
                subObj[`${n.estudiante_id}_${n.subcomponente_id}`] = n.nota; 
            });
            setSubData(subObj);

            const logroObj = {};
            (notas_logros || []).forEach(nl => { 
                logroObj[`${nl.estudiante_id}_${nl.logro_curso_id}`] = nl.nota; 
            });

            const finalObj = {};
            (notas_finales || []).forEach(nf => { 
                finalObj[nf.estudiante_id] = nf.promedio; 
            });

            // Recalcular promedios iniciales basados en lo que viene de la BD
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

    // Función pura para recalcular promedios en vivo
    const recalcularTodosLosPromedios = (listEstudiantes, listLogros, currentSub, currentLogro, currentFinal) => {
        if (!listLogros || listLogros.length === 0) return;

        let newLogroData = { ...currentLogro };
        let newFinalData = { ...currentFinal };

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

                    // Si hay notas de subcomponentes ingresadas
                    if (pesoTotalIngresado > 0) {
                        // Calcula el promedio ponderado correcto (escalado a base 100% de los componentes ingresados)
                        const notaCalculada = Math.round((sumaPonderada / pesoTotalIngresado) * 10) / 10;
                        newLogroData[`${estId}_${logro.id}`] = notaCalculada;
                        sumaNotasLogros += notaCalculada;
                        logrosConNotaCount++;
                    } else {
                        delete newLogroData[`${estId}_${logro.id}`];
                    }
                } else {
                    // Logro de nota manual directa
                    const valDirecto = currentLogro[`${estId}_${logro.id}`];
                    if (valDirecto !== undefined && valDirecto !== '' && !isNaN(valDirecto)) {
                        sumaNotasLogros += parseFloat(valDirecto);
                        logrosConNotaCount++;
                    }
                }
            });

            // Cálculo de Nota Final Promedio
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
                // 1. Array de Notas por Subcomponentes
                payload.notas_subcomponentes = Object.keys(subData).map(k => {
                    const [estudiante_id, subcomponente_id] = k.split('_');
                    return {
                        estudiante_id: parseInt(estudiante_id),
                        subcomponente_id: parseInt(subcomponente_id),
                        nota: subData[k] !== '' && subData[k] !== undefined ? parseFloat(subData[k]) : null,
                    };
                });

                // 2. Array de Notas por Logros (INCLUYE TANTO MANUALES COMO CALCULADOS)
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

                // 3. Array de Notas Finales Promedio
                payload.notas_finales_directas = estudiantes.map(est => ({
                    estudiante_id: est.estudiante_id,
                    nota: finalData[est.estudiante_id] !== undefined && finalData[est.estudiante_id] !== '' 
                        ? parseFloat(finalData[est.estudiante_id]) 
                        : null,
                }));

            } else {
                // Si no hay logros, se guarda la nota final directa
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
                            ? 'Ingrese notas por subcomponente o por logro según corresponda. Los promedios se calculan automáticamente.'
                            : 'Este curso no tiene logros ni subcomponentes configurados. Ingrese la nota final directamente.'
                        }
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Botón Reporte PDF General */}
                    <button
                        type="button"
                        onClick={handleExportPdf}
                        className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                        📄 Reporte PDF
                    </button>

                    {/* Botón Reporte Nómina de Matriculados */}
                    <button
                        type="button"
                        onClick={handleExportNominaPdf}
                        className="bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                        📋 Nómina Matriculados
                    </button>

                    {/* Botón Reporte Ranking Top 5 */}
                    <button
                        type="button"
                        onClick={handleExportRankingPdf}
                        className="bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                        🏆 Top 5 Ranking
                    </button>

                    {/* Botón Guardar Calificaciones */}
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-[#315d7a] hover:bg-[#254860] text-white px-4 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-2xs"
                    >
                        {saving ? 'Guardando...' : 'Guardar Calificaciones'}
                    </button>
                </div>
            </div>

            {/* Matriz Dinámica */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs">
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
                                                className="w-16 text-center text-xs font-bold py-1 rounded-lg border-slate-200 focus:border-[#315d7a] bg-white shadow-2xs"
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
        </div>
    );
}