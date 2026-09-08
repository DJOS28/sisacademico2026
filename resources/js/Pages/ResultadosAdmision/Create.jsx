import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function Create({ admisiones = [], idProcesoSeleccionado = null, postulantesInscritos = [] }) {
    const [idProceso, setIdProceso] = useState(idProcesoSeleccionado || '');
    const [listaResultados, setListaResultados] = useState([]);

    const { data, setData, post, processing, errors } = useForm({
        id_proceso: idProcesoSeleccionado || '',
        resultados: [],
    });

    // Cambiar proceso y consultar inscritos vía AJAX
    const handleProcesoChange = (e) => {
        const selectedId = e.target.value;
        setIdProceso(selectedId);
        setData('id_proceso', selectedId);

        if (selectedId) {
            router.get(
                route('resultados-admision.create'),
                { id_proceso: selectedId },
                { preserveState: true, preserveScroll: true }
            );
        }
    };

    // Al cargar postulantesInscritos, llenar la matriz editable
    useEffect(() => {
        if (postulantesInscritos.length > 0) {
            const iniciales = postulantesInscritos.map((item) => ({
                postulante_id: item.id_postulante,
                codigo_postulante: item.codigo_postulante,
                nombre_completo: `${item.apellidos}, ${item.nombres}`,
                dni: item.dni,
                plan_estudio_id: item.plan_estudio_id,
                plan_nombre: item.plan_nombre,
                nota: item.nota !== '' ? item.nota : '0.00',
                estado: item.estado || 'con_vacante',
                ya_registrado: item.ya_registrado,
            }));
            setListaResultados(iniciales);
            setData('resultados', iniciales);
        } else {
            setListaResultados([]);
            setData('resultados', []);
        }
    }, [postulantesInscritos]);

    const handleItemChange = (index, field, value) => {
        const copia = [...listaResultados];
        copia[index][field] = value;
        setListaResultados(copia);
        setData('resultados', copia);
    };

    const guardarResultados = (e) => {
        e.preventDefault();
        post(route('resultados-admision.store'), {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: '¡Guardado!',
                    text: 'Las calificaciones del examen de admisión han sido procesadas correctamente.',
                    icon: 'success',
                    confirmButtonColor: '#315d7a',
                });
            },
            onError: () => {
                Swal.fire({
                    title: 'Verifique las Notas',
                    text: 'Asegúrese de ingresar puntajes válidos entre 0 y 20.',
                    icon: 'warning',
                    confirmButtonColor: '#315d7a',
                });
            },
        });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-slate-900">Registrar Resultados de Examen</h1>}>
            <Head title="Cargar Resultados de Admisión" />

            <div className="w-full space-y-6">
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Cargar Notas por Proceso</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Seleccione el proceso de admisión para cargar la lista de postulantes inscritos.
                        </p>
                    </div>

                    <Link
                        href={route('resultados-admision.index')}
                        className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Volver a Resultados
                    </Link>
                </div>

                {/* PASO 1: SELECCIÓN DE PROCESO DE ADMISIÓN */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">
                        1. Seleccione el Proceso de Admisión <span className="text-rose-600">*</span>
                    </label>
                    <select
                        value={idProceso}
                        onChange={handleProcesoChange}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                    >
                        <option value="">-- Seleccionar Proceso --</option>
                        {admisiones.map((a) => (
                            <option key={a.id_admision} value={a.id_admision}>
                                {a.nombre}
                            </option>
                        ))}
                    </select>
                    {errors.id_proceso && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.id_proceso}</p>}
                </div>

                {/* PASO 2: MATRIZ DE POSTULANTES E INGRESO DE NOTAS */}
                {idProceso && (
                    <form onSubmit={guardarResultados} className="space-y-6">
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-800">
                                    2. Postulantes Inscritos ({listaResultados.length})
                                </h3>
                                <span className="text-xs text-slate-500 font-medium">Escala de calificación: 0 a 20</span>
                            </div>

                            {listaResultados.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-slate-600">
                                        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-700">
                                            <tr>
                                                <th className="px-6 py-3">#</th>
                                                <th className="px-6 py-3">Postulante / DNI</th>
                                                <th className="px-6 py-3">Programa Principal</th>
                                                <th className="px-6 py-3 text-center w-36">Nota Examen (0-20)</th>
                                                <th className="px-6 py-3 text-center w-48">Condición / Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {listaResultados.map((item, idx) => (
                                                <tr key={item.postulante_id} className="hover:bg-slate-50/50">
                                                    <td className="px-6 py-3.5 text-xs text-slate-400 font-bold">{idx + 1}</td>
                                                    <td className="px-6 py-3.5">
                                                        <div className="font-bold text-slate-800">{item.nombre_completo}</div>
                                                        <div className="text-xs text-slate-500 font-mono">DNI: {item.dni} | Code: {item.codigo_postulante}</div>
                                                    </td>
                                                    <td className="px-6 py-3.5 text-xs font-semibold text-slate-700">
                                                        {item.plan_nombre}
                                                    </td>
                                                    <td className="px-6 py-3.5 text-center">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            max="20"
                                                            value={item.nota}
                                                            onChange={(e) => handleItemChange(idx, 'nota', e.target.value)}
                                                            className="w-28 text-center rounded-lg border border-slate-300 font-mono text-sm font-bold text-[#315d7a] py-1.5 outline-none focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                                            required
                                                        />
                                                    </td>
                                                    <td className="px-6 py-3.5 text-center">
                                                        <select
                                                            value={item.estado}
                                                            onChange={(e) => handleItemChange(idx, 'estado', e.target.value)}
                                                            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold outline-none focus:border-[#315d7a]"
                                                        >
                                                            <option value="con_vacante" className="text-emerald-700 font-bold">✓ Con Vacante</option>
                                                            <option value="sin_vacante" className="text-rose-700 font-bold">✕ Sin Vacante</option>
                                                            <option value="ausente" className="text-amber-700 font-bold">⚑ Ausente</option>
                                                            <option value="anulado" className="text-slate-700 font-bold">⊘ Anulado</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-sm text-slate-500 italic">
                                    No hay postulantes inscritos registrados en este proceso de admisión.
                                </div>
                            )}
                        </div>

                        {listaResultados.length > 0 && (
                            <div className="flex justify-end gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                <Link
                                    href={route('resultados-admision.index')}
                                    className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Cancelar
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-lg bg-[#315d7a] px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-[#274b63] disabled:opacity-60 cursor-pointer"
                                >
                                    {processing ? 'Guardando...' : 'Guardar Todos los Resultados'}
                                </button>
                            </div>
                        )}
                    </form>
                )}
            </div>
        </AuthenticatedLayout>
    );
}