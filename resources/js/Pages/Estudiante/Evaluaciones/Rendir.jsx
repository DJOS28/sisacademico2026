import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function Rendir({ evaluacion }) {
    // Estado para guardar las respuestas seleccionadas { pregunta_id: opcion_id }
    const [respuestas, setRespuestas] = useState({});
    const [enviando, setEnviando] = useState(false);

    const evalId = evaluacion.id || evaluacion.id_evaluacion;

    const handleOpcionSelect = (preguntaId, opcionId) => {
        setRespuestas((prev) => ({
            ...prev,
            [preguntaId]: opcionId,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const totalPreguntas = evaluacion.preguntas?.length || 0;
        const respondidas = Object.keys(respuestas).length;

        if (respondidas < totalPreguntas) {
            Swal.fire({
                icon: 'warning',
                title: 'Preguntas pendientes',
                text: `Has respondido ${respondidas} de ${totalPreguntas} preguntas. ¿Deseas enviar la evaluación de todas formas?`,
                showCancelButton: true,
                confirmButtonColor: '#315d7a',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, enviar examen',
                cancelButtonText: 'Continuar respondiendo',
            }).then((result) => {
                if (result.isConfirmed) {
                    enviarEvaluacion();
                }
            });
        } else {
            enviarEvaluacion();
        }
    };

    const enviarEvaluacion = async () => {
        setEnviando(true);

        try {
            const response = await axios.post(route('estudiante.evaluaciones.guardar', evalId), {
                respuestas: respuestas,
            });

            await Swal.fire({
                icon: 'success',
                title: '¡Evaluación completada!',
                text: response.data.message || 'Tus respuestas han sido registradas correctamente.',
                confirmButtonColor: '#315d7a',
            });

            // Regresa al Aula Virtual tras confirmar
            window.history.back();
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error al enviar',
                text: error.response?.data?.message || 'Ocurrió un problema al guardar tus respuestas. Inténtalo nuevamente.',
                confirmButtonColor: '#315d7a',
            });
        } finally {
            setEnviando(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="text-xs font-bold text-[#315d7a] hover:underline mb-1 inline-block bg-transparent border-0 cursor-pointer p-0"
                        >
                            ← Volver al Aula Virtual
                        </button>
                        <h1 className="text-xl font-bold text-slate-900">{evaluacion.nombre}</h1>
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black px-3 py-1 rounded-xl uppercase">
                        En Evaluación
                    </span>
                </div>
            }
        >
            <Head title={`Rendir - ${evaluacion.nombre}`} />

            <div className="max-w-4xl mx-auto space-y-6 pb-12">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {evaluacion.preguntas && evaluacion.preguntas.length > 0 ? (
                        evaluacion.preguntas.map((pregunta, index) => {
                            const pregId = pregunta.id || pregunta.id_pregunta;

                            return (
                                <div
                                    key={pregId || index}
                                    className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="bg-[#315d7a]/10 text-[#315d7a] font-black text-xs h-6 w-6 rounded-lg flex items-center justify-center shrink-0">
                                            {index + 1}
                                        </span>
                                        <h3 className="text-sm font-bold text-slate-800 leading-snug pt-0.5">
                                            {pregunta.enunciado || pregunta.pregunta}
                                        </h3>
                                    </div>

                                    {/* Opciones de respuesta */}
                                    <div className="grid gap-2 pl-9">
                                        {pregunta.opciones?.map((opcion) => {
                                            const opcId = opcion.id || opcion.id_opcion;
                                            const seleccionada = respuestas[pregId] === opcId;

                                            return (
                                                <label
                                                    key={opcId}
                                                    onClick={() => handleOpcionSelect(pregId, opcId)}
                                                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium cursor-pointer transition ${
                                                        seleccionada
                                                            ? 'border-[#315d7a] bg-[#315d7a]/5 text-[#315d7a] font-bold'
                                                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`pregunta_${pregId}`}
                                                        checked={seleccionada}
                                                        onChange={() => {}}
                                                        className="text-[#315d7a] focus:ring-0"
                                                    />
                                                    <span>{opcion.texto || opcion.opcion}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
                            <p className="text-xs font-bold text-slate-500">
                                Esta evaluación aún no tiene preguntas configuradas.
                            </p>
                        </div>
                    )}

                    {/* Botón Finalizar */}
                    {evaluacion.preguntas?.length > 0 && (
                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={enviando}
                                className="px-6 py-3 bg-[#315d7a] hover:bg-[#274b63] text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50"
                            >
                                {enviando ? 'Enviando respuestas...' : 'Finalizar y Enviar Examen'}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </AuthenticatedLayout>
    );
}