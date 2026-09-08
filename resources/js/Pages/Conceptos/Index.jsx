import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';

export default function ConceptosIndex({ conceptos = [] }) {
    const [editando, setEditando] = useState(null);
    const [modalRegistro, setModalRegistro] = useState(false);
    const [modalImportar, setModalImportar] = useState(false);

    // Formulario para Crear / Editar Manualmente
    const form = useForm({
        nombre: '',
        precio: '',
        tipo_concepto: 'General',
        activo: 1,
    });

    // Formulario para Importar Excel
    const formImport = useForm({
        archivo: null,
    });

    // Formulario para Eliminar
    const formDelete = useForm({});

    const abrirModalNuevo = () => {
        setEditando(null);
        form.reset();
        setModalRegistro(true);
    };

    const handleEditar = (c) => {
        setEditando(c);
        form.setData({
            nombre: c.nombre,
            precio: c.precio,
            tipo_concepto: c.tipo_concepto || 'General',
            activo: c.activo,
        });
        setModalRegistro(true);
    };

    const cerrarModalRegistro = () => {
        setModalRegistro(false);
        setEditando(null);
        form.reset();
    };

    // Envío del Formulario Manual (Crear / Editar)
    const handleSubmitManual = (e) => {
        e.preventDefault();
        if (editando) {
            form.put(route('conceptos.update', editando.id_concepto), {
                onSuccess: () => {
                    Swal.fire('Éxito', 'Concepto actualizado correctamente', 'success');
                    cerrarModalRegistro();
                },
            });
        } else {
            form.post(route('conceptos.store'), {
                onSuccess: () => {
                    Swal.fire('Éxito', 'Concepto registrado correctamente', 'success');
                    cerrarModalRegistro();
                },
            });
        }
    };

    // Confirmación y Eliminación de Registro
    const handleEliminar = (id, nombre) => {
        Swal.fire({
            title: '¿Eliminar concepto?',
            text: `¿Estás seguro de eliminar "${nombre}"? Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            if (result.isConfirmed) {
                formDelete.delete(route('conceptos.destroy', id), {
                    onSuccess: () => {
                        Swal.fire('Eliminado', 'El concepto ha sido eliminado.', 'success');
                    },
                    onError: () => {
                        Swal.fire('Error', 'No se pudo eliminar el concepto.', 'error');
                    },
                });
            }
        });
    };

    // Envío de Importación Excel
    const handleImportarExcel = (e) => {
        e.preventDefault();
        if (!formImport.data.archivo) {
            Swal.fire('Atención', 'Seleccione un archivo Excel primero', 'warning');
            return;
        }

        formImport.post(route('conceptos.importar'), {
            onSuccess: () => {
                Swal.fire('Éxito', 'Conceptos importados desde Excel', 'success');
                setModalImportar(false);
                formImport.reset();
            },
            onError: (err) => {
                Swal.fire('Error', err.error || 'Ocurrió un error al procesar el archivo', 'error');
            }
        });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-slate-800">Catálogo de Conceptos y Tarifas</h1>}>
            <Head title="Conceptos de Pago" />

            <div className="space-y-6">
                {/* Cabecera con Botones de Acción */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div>
                        <h2 className="text-base font-bold text-slate-800">Gestión de Tarifario</h2>
                        <p className="text-xs text-slate-500">Administra los precios de trámites, matrículas y derechos de pago de la institución.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Botón 1: Registrar Nuevo Concepto */}
                        <button
                            onClick={abrirModalNuevo}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-slate-800 transition cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Nuevo Concepto
                        </button>

                        {/* Botón 2: Importar Excel */}
                        <button
                            onClick={() => setModalImportar(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 transition cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Importar desde Excel
                        </button>
                    </div>
                </div>

                {/* Tabla de Tarifario */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
                    <h3 className="text-sm font-bold text-slate-800">Tarifario Registrado ({conceptos.length})</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 uppercase text-slate-500 font-bold border-b">
                                <tr>
                                    <th className="p-3">#</th>
                                    <th className="p-3">Concepto</th>
                                    <th className="p-3">Categoría / Tipo</th>
                                    <th className="p-3">Precio</th>
                                    <th className="p-3 text-center">Estado</th>
                                    <th className="p-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {conceptos.map((c, index) => (
                                    <tr key={c.id_concepto} className="hover:bg-slate-50 transition">
                                        <td className="p-3 font-bold text-slate-400">{index + 1}</td>
                                        <td className="p-3 font-semibold text-slate-800">{c.nombre}</td>
                                        <td className="p-3 text-slate-500">{c.tipo_concepto || 'General'}</td>
                                        <td className="p-3 font-bold text-slate-800">S/ {parseFloat(c.precio).toFixed(2)}</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {c.activo ? 'ACTIVO' : 'INACTIVO'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => handleEditar(c)}
                                                    className="rounded bg-slate-100 px-3 py-1 font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleEliminar(c.id_concepto, c.nombre)}
                                                    className="rounded bg-rose-100 px-3 py-1 font-bold text-rose-700 hover:bg-rose-200 transition cursor-pointer"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL 1: REGISTRO / EDICIÓN MANUAL */}
            {modalRegistro && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="text-base font-bold text-slate-800">
                                {editando ? `Editando Concepto: ${editando.nombre}` : 'Nuevo Concepto de Pago'}
                            </h3>
                            <button
                                onClick={cerrarModalRegistro}
                                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmitManual} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Nombre del Concepto *
                                </label>
                                <input
                                    type="text"
                                    value={form.data.nombre}
                                    onChange={(e) => form.setData('nombre', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#315d7a] outline-none"
                                    placeholder="Ej: Certificado de Estudios"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Precio (S/) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.data.precio}
                                        onChange={(e) => form.setData('precio', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#315d7a] outline-none"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Tipo / Categoría
                                    </label>
                                    <input
                                        type="text"
                                        value={form.data.tipo_concepto}
                                        onChange={(e) => form.setData('tipo_concepto', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#315d7a] outline-none"
                                        placeholder="Ej: Trámite, Matrícula"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="activo_check"
                                    checked={form.data.activo == 1}
                                    onChange={(e) => form.setData('activo', e.target.checked ? 1 : 0)}
                                    className="rounded border-slate-300 text-slate-800 focus:ring-slate-500"
                                />
                                <label htmlFor="activo_check" className="text-xs font-semibold text-slate-700 cursor-pointer">
                                    Concepto Activo para Cobros
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 border-t pt-4">
                                <button
                                    type="button"
                                    onClick={cerrarModalRegistro}
                                    className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 shadow transition cursor-pointer"
                                >
                                    {editando ? 'Guardar Cambios' : 'Registrar Concepto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: IMPORTACIÓN EXCEL CON INSTRUCCIONES */}
            {modalImportar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="text-base font-bold text-slate-800">Importación Masiva de Conceptos</h3>
                            <button
                                onClick={() => setModalImportar(false)}
                                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Instrucciones del archivo */}
                        <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-4 text-xs space-y-2 text-slate-700">
                            <p className="font-bold text-blue-900">Instrucciones del archivo Excel:</p>
                            <ul className="list-disc list-inside space-y-1 text-[11px]">
                                <li>El archivo debe estar en formato <strong>.xlsx, .xls o .csv</strong>.</li>
                                <li>La primera fila debe ser la cabecera obligatoria con los nombres exactos:</li>
                            </ul>

                            <div className="overflow-x-auto rounded border border-blue-200 bg-white mt-2">
                                <table className="w-full text-left text-[10px]">
                                    <thead className="bg-blue-100 font-bold text-blue-900">
                                        <tr>
                                            <th className="p-1.5">nombre</th>
                                            <th className="p-1.5">precio</th>
                                            <th className="p-1.5">tipo_concepto</th>
                                            <th className="p-1.5">activo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-slate-600">
                                        <tr>
                                            <td className="p-1.5">Derecho de Examen</td>
                                            <td className="p-1.5">50.00</td>
                                            <td className="p-1.5">Trámite</td>
                                            <td className="p-1.5">1</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-[10px] text-slate-500">
                                * Nota: Si el nombre del concepto ya existe, su precio y estado se actualizarán automáticamente.
                            </p>
                        </div>

                        <form onSubmit={handleImportarExcel} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Seleccionar Archivo Excel
                                </label>
                                <input
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={(e) => formImport.setData('archivo', e.target.files[0])}
                                    className="w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-2 border-t pt-4">
                                <button
                                    type="button"
                                    onClick={() => setModalImportar(false)}
                                    className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={formImport.processing}
                                    className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow transition cursor-pointer"
                                >
                                    {formImport.processing ? 'Procesando...' : 'Subir e Importar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}