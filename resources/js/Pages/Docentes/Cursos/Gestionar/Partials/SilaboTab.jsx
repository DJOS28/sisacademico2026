import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function SilaboTab({ cursoId, seccionId, periodoId }) {
    const [silabo, setSilabo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [archivo, setArchivo] = useState(null);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

    // Cargar el sílabo actual al montar el componente o cambiar de contexto
    const cargarSilabo = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/docente/silabos/obtener', {
                params: {
                    curso_id: cursoId,
                    seccion_id: seccionId,
                    periodo_id: periodoId
                }
            });
            if (response.data.success) {
                setSilabo(response.data.silabo);
            }
        } catch (error) {
            console.error('Error al cargar el sílabo:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (cursoId) {
            cargarSilabo();
        }
    }, [cursoId, seccionId, periodoId]);

    // Manejar subida/reemplazo de sílabo
    const handleGuardar = async (e) => {
        e.preventDefault();
        if (!archivo) {
            setMensaje({ tipo: 'error', texto: 'Por favor, selecciona un archivo (PDF o Word).' });
            return;
        }

        const formData = new FormData();
        formData.append('curso_id', cursoId);
        if (seccionId) formData.append('seccion_id', seccionId);
        if (periodoId) formData.append('periodo_id', periodoId);
        formData.append('archivo', archivo);

        setUploading(true);
        setMensaje({ tipo: '', texto: '' });

        try {
            const response = await axios.post('/docente/silabos/guardar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setMensaje({ tipo: 'exito', texto: 'Sílabo subido correctamente.' });
            setArchivo(null);
            // Resetear el input file
            document.getElementById('silabo-input-file').value = '';
            cargarSilabo();
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Error al subir el archivo.';
            setMensaje({ tipo: 'error', texto: errorMsg });
        } finally {
            setUploading(false);
        }
    };

    // Eliminar el sílabo actual
    const handleEliminar = async (idSilabo) => {
        if (!confirm('¿Está seguro de eliminar el sílabo de esta sección?')) return;

        try {
            await axios.delete(`/docente/silabos/eliminar/${idSilabo}`);
            setMensaje({ tipo: 'exito', texto: 'Sílabo eliminado exitosamente.' });
            setSilabo(null);
        } catch (error) {
            setMensaje({ tipo: 'error', texto: 'Error al eliminar el sílabo.' });
        }
    };

    if (loading) {
        return (
            <div className="p-6 text-center text-gray-500">
                <i className="fas fa-spinner fa-spin mr-2"></i> Cargando sílabo...
            </div>
        );
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Sílabo de la Unidad Didáctica
            </h3>

            {/* Alertas de Feedback */}
            {mensaje.texto && (
                <div className={`p-3 mb-4 text-sm rounded-md ${
                    mensaje.tipo === 'exito' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {mensaje.texto}
                </div>
            )}

            {/* Vista cuando EXISTE un sílabo */}
            {silabo ? (
                <div className="border rounded-lg p-4 bg-gray-50 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800">
                                {silabo.archivo ? silabo.archivo.split('/').pop() : 'Silabo_Curso.pdf'}
                            </p>
                            <p className="text-xs text-gray-500">
                                Subido el: {silabo.fecha_subida ? new Date(silabo.fecha_subida).toLocaleString('es-PE') : 'Fecha no disponible'}
                            </p>
                            {silabo.usuario && (
                                <p className="text-xs text-gray-500">
                                    Por: {silabo.usuario.nombre_completo || silabo.usuario.username}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Botón Ver / Descargar */}
                        <a
                            href={`/docente/silabos/ver/${silabo.id_silabo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Ver Sílabo
                        </a>

                        {/* Botón Eliminar */}
                        <button
                            type="button"
                            onClick={() => handleEliminar(silabo.id_silabo)}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 border border-red-200 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Eliminar
                        </button>
                    </div>
                </div>
            ) : (
                <div className="p-4 mb-6 text-sm text-amber-800 bg-amber-50 rounded-lg border border-amber-200">
                    No se ha adjuntado ningún sílabo para este curso en la sección/periodo actual.
                </div>
            )}

            {/* Formulario para Subir o Reemplazar */}
            <form onSubmit={handleGuardar} className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {silabo ? 'Reemplazar Sílabo' : 'Subir Nuevo Sílabo (PDF o Word, máx. 10MB)'}
                </label>

                <div className="flex items-center gap-3">
                    <input
                        id="silabo-input-file"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setArchivo(e.target.files[0])}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border rounded-md"
                    />

                    <button
                        type="submit"
                        disabled={uploading}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                        {uploading ? (
                            <>
                                <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                                Guardando...
                            </>
                        ) : (
                            silabo ? 'Reemplazar File' : 'Subir Archivo'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}