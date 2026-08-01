import { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import axios from 'axios';

export default function AsistenciaTab({ sesiones = [] }) {
    const [sesionSeleccionada, setSesionSeleccionada] = useState(sesiones[0]?.id_sesion || '');
    const [loading, setLoading] = useState(false);

    const { data, setData, post, processing } = useForm({
        sesion_id: sesiones[0]?.id_sesion || '',
        fecha: sesiones[0]?.fecha || new Date().toISOString().split('T')[0],
        asistencias: [],
    });

    useEffect(() => {
        if (!sesionSeleccionada) return;

        const sesionActual = sesiones.find(s => s.id_sesion === Number(sesionSeleccionada));
        
        setLoading(true);
        axios.get(route('cursos.asistencias.obtener', sesionSeleccionada))
            .then((res) => {
                setData({
                    sesion_id: sesionSeleccionada,
                    fecha: sesionActual?.fecha || new Date().toISOString().split('T')[0],
                    asistencias: res.data,
                });
            })
            .catch(() => {
                Swal.fire('Error', 'No se pudieron cargar los alumnos de esta sesión.', 'error');
            })
            .finally(() => setLoading(false));
    }, [sesionSeleccionada]);

    const handleEstadoChange = (index, nuevoEstado) => {
        const nuevasAsistencias = [...data.asistencias];
        nuevasAsistencias[index].estado = nuevoEstado;
        setData('asistencias', nuevasAsistencias);
    };

    const marcartodos = (estado) => {
        const nuevasAsistencias = data.asistencias.map(item => ({
            ...item,
            estado: estado,
        }));
        setData('asistencias', nuevasAsistencias);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('cursos.asistencias.guardar'), {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    icon: 'success',
                    title: '¡Asistencia Guardada!',
                    text: 'El registro de asistencia ha sido actualizado.',
                    timer: 1800,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-2xl' },
                });
            },
        });
    };

    // Función para exportar reporte PDF de asistencia
    const handleExportPdf = () => {
        window.open(route('cursos.asistencias.pdf'), '_blank');
    };

    return (
        <div className="space-y-5">
            {/* Cabecera y Controles */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                    <h2 className="text-base font-bold text-slate-900">Control de Asistencia</h2>
                    <p className="text-xs text-slate-500">Selecciona una sesión de clase y toma asistencia a la sección.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-700">Sesión / Clase:</label>
                        <select
                            value={sesionSeleccionada}
                            onChange={(e) => setSesionSeleccionada(e.target.value)}
                            className="text-xs rounded-xl border-slate-200 focus:border-[#315d7a] focus:ring-[#315d7a]"
                        >
                            {sesiones.map((s) => (
                                <option key={s.id_sesion} value={s.id_sesion}>
                                    {s.nombre} ({s.fecha})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Botón de Exportar Reporte PDF */}
                    <button
                        type="button"
                        onClick={handleExportPdf}
                        className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                        📄 Reporte PDF
                    </button>
                </div>
            </div>

            {/* Acciones Rápidas */}
            {data.asistencias.length > 0 && (
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-600">Marcar a todos como:</span>
                    <div className="flex gap-1.5">
                        <button
                            type="button"
                            onClick={() => marcartodos('presente')}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition cursor-pointer"
                        >
                            Todos Presentes
                        </button>
                        <button
                            type="button"
                            onClick={() => marcartodos('falta')}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-red-100 text-red-800 hover:bg-red-200 transition cursor-pointer"
                        >
                            Todos Faltas
                        </button>
                    </div>
                </div>
            )}

            {/* Tabla de Alumnos */}
            {loading ? (
                <div className="p-8 text-center text-xs text-slate-500">Cargando lista de estudiantes...</div>
            ) : data.asistencias.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">
                    No hay estudiantes matriculados en esta sección.
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                                <tr>
                                    <th className="p-3">#</th>
                                    <th className="p-3">Código</th>
                                    <th className="p-3">Estudiante</th>
                                    <th className="p-3 text-center">Estado de Asistencia</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.asistencias.map((alumno, index) => (
                                    <tr key={alumno.matricula_curso_id} className="hover:bg-slate-50/50">
                                        <td className="p-3 font-semibold text-slate-500">{index + 1}</td>
                                        <td className="p-3 font-mono text-slate-600">{alumno.codigo_alumno}</td>
                                        <td className="p-3 font-bold text-slate-800">{alumno.nombre_completo}</td>
                                        <td className="p-3">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {[
                                                    { key: 'presente', label: 'Presente', color: 'peer-checked:bg-emerald-600 peer-checked:text-white' },
                                                    { key: 'tardanza', label: 'Tardanza', color: 'peer-checked:bg-amber-500 peer-checked:text-white' },
                                                    { key: 'falta', label: 'Falta', color: 'peer-checked:bg-red-600 peer-checked:text-white' },
                                                    { key: 'justificado', label: 'Justificado', color: 'peer-checked:bg-sky-600 peer-checked:text-white' },
                                                ].map((st) => (
                                                    <label key={st.key} className="cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name={`asistencia_${alumno.matricula_curso_id}`}
                                                            value={st.key}
                                                            checked={alumno.estado === st.key}
                                                            onChange={() => handleEstadoChange(index, st.key)}
                                                            className="peer sr-only"
                                                        />
                                                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-200 bg-white text-slate-600 transition ${st.color}`}>
                                                            {st.label}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-[#315d7a] hover:bg-[#254860] text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
                        >
                            {processing ? 'Guardando...' : 'Guardar Asistencia'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}