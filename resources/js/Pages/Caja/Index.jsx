import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';

export default function CajaIndex({ cajaAbierta, conceptos = [], transacciones = [], pagosEstudiantes = [], resumen = {} }) {
    const [modalMovimiento, setModalMovimiento] = useState(false);
    const [modalCierre, setModalCierre] = useState(false);

    // Estados para el Select2 (Buscador de Conceptos)
    const [busquedaConcepto, setBusquedaConcepto] = useState('');
    const [dropdownAbierto, setDropdownAbierto] = useState(false);
    const [conceptoSeleccionado, setConceptoSeleccionado] = useState(null);

    // Formulario de Apertura
    const formApertura = useForm({
        nombre: 'Caja Principal',
        apertura: '0.00',
        observacion: '',
    });

    // Formulario de Cierre
    const formCierre = useForm({
        observacion: '',
    });

    // Formulario de Transacción (Ingreso / Egreso)
    const formTransaccion = useForm({
        tipo: 'ingreso',
        monto: '',
        concepto_id: '',
        dni: '',
        nombres: '',
        apellidos: '',
        observacion: '',
    });

    const formAnular = useForm({});

    // Filtrar conceptos según la búsqueda
    const conceptosFiltrados = conceptos.filter((c) =>
        c.nombre.toLowerCase().includes(busquedaConcepto.toLowerCase()) ||
        (c.tipo_concepto && c.tipo_concepto.toLowerCase().includes(busquedaConcepto.toLowerCase()))
    );

    // Seleccionar Concepto y Auto-completar Monto
    const handleSeleccionarConcepto = (concepto) => {
        if (concepto) {
            setConceptoSeleccionado(concepto);
            formTransaccion.setData((prev) => ({
                ...prev,
                concepto_id: concepto.id_concepto,
                monto: parseFloat(concepto.precio).toFixed(2),
            }));
        } else {
            // Limpiar selección (Otro ingreso / egreso vario)
            setConceptoSeleccionado(null);
            formTransaccion.setData((prev) => ({
                ...prev,
                concepto_id: '',
            }));
        }
        setDropdownAbierto(false);
        setBusquedaConcepto('');
    };

    // Enviar Apertura
    const handleAperturar = (e) => {
        e.preventDefault();
        formApertura.post(route('caja.aperturar'), {
            onSuccess: () => {
                Swal.fire('Éxito', 'Caja aperturada correctamente', 'success');
                formApertura.reset();
            },
        });
    };

    // Enviar Cierre
    const handleCerrarCaja = (e) => {
        e.preventDefault();
        Swal.fire({
            title: '¿Cerrar Sesión de Caja?',
            text: `El saldo final calculado es de S/ ${resumen.saldo_calculado?.toFixed(2)}. ¿Deseas confirmar el cierre?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0f172a',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, cerrar caja',
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            if (result.isConfirmed) {
                formCierre.post(route('caja.cerrar'), {
                    onSuccess: () => {
                        Swal.fire('Cerrado', 'La sesión de caja ha sido cerrada.', 'success');
                        setModalCierre(false);
                        formCierre.reset();
                    },
                });
            }
        });
    };

    // Enviar Transacción
    const handleRegistrarMovimiento = (e) => {
        e.preventDefault();

        if (!formTransaccion.data.concepto_id && !formTransaccion.data.observacion) {
            Swal.fire('Atención', 'Si no selecciona un concepto, debe escribir una observación/descripción obligatoriamente.', 'warning');
            return;
        }

        formTransaccion.post(route('caja.transaccion'), {
            onSuccess: () => {
                Swal.fire('Éxito', 'Movimiento registrado correctamente', 'success');
                setModalMovimiento(false);
                setConceptoSeleccionado(null);
                formTransaccion.reset();
            },
        });
    };

    // Anular Transacción
    const handleAnular = (id) => {
        Swal.fire({
            title: '¿Anular transacción?',
            text: 'El monto de este movimiento dejará de contarse en los saldos.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, anular',
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            if (result.isConfirmed) {
                formAnular.delete(route('caja.anular', id), {
                    onSuccess: () => {
                        Swal.fire('Anulado', 'La transacción ha sido anulada.', 'success');
                    },
                });
            }
        });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-slate-800">Control de Caja y Sesiones</h1>}>
            <Head title="Caja General" />

            <div className="space-y-6">
                {!cajaAbierta ? (
                    /* SI NO HAY CAJA ABIERTA */
                    <div className="max-w-xl mx-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                        <div className="border-b pb-3">
                            <h2 className="text-base font-bold text-slate-800">Aperturar Nueva Sesión de Caja</h2>
                            <p className="text-xs text-slate-500">Ingresa el monto inicial para comenzar a recibir cobros y registrar operaciones.</p>
                        </div>

                        <form onSubmit={handleAperturar} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre / Identificador de Caja *</label>
                                <input
                                    type="text"
                                    value={formApertura.data.nombre}
                                    onChange={(e) => formApertura.setData('nombre', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#315d7a] outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Monto Inicial / Apertura (S/) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formApertura.data.apertura}
                                    onChange={(e) => formApertura.setData('apertura', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#315d7a] outline-none"
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Observación</label>
                                <textarea
                                    value={formApertura.data.observacion}
                                    onChange={(e) => formApertura.setData('observacion', e.target.value)}
                                    rows="2"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#315d7a] outline-none"
                                    placeholder="Detalles sobre el inicio del turno..."
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={formApertura.processing}
                                className="w-full rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700 transition cursor-pointer"
                            >
                                Aperturar Caja
                            </button>
                        </form>
                    </div>
                ) : (
                    /* SI HAY CAJA ABIERTA */
                    <div className="space-y-6">
                        {/* Cabecera Estado y Acciones */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                    </span>
                                    <h2 className="text-base font-bold text-slate-800">{cajaAbierta.nombre} - SESIÓN ACTIVA</h2>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Aperturado el: <strong>{cajaAbierta.fecha_apertura}</strong>
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setModalMovimiento(true)}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-slate-800 transition cursor-pointer"
                                >
                                    + Registrar Movimiento
                                </button>
                                <button
                                    onClick={() => setModalCierre(true)}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-rose-700 transition cursor-pointer"
                                >
                                    Cerrar Caja
                                </button>
                            </div>
                        </div>

                        {/* Tarjetas de Resumen Financiero */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-[11px] font-bold uppercase text-slate-400">Monto Inicial</p>
                                <p className="text-lg font-extrabold text-slate-800 mt-1">S/ {resumen.apertura?.toFixed(2)}</p>
                            </div>

                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
                                <p className="text-[11px] font-bold uppercase text-emerald-600">Cobros Alumnos</p>
                                <p className="text-lg font-extrabold text-emerald-700 mt-1">+ S/ {resumen.total_pagos_alumnos?.toFixed(2)}</p>
                            </div>

                            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
                                <p className="text-[11px] font-bold uppercase text-blue-600">Ingresos Varios</p>
                                <p className="text-lg font-extrabold text-blue-700 mt-1">+ S/ {resumen.total_ingresos_varios?.toFixed(2)}</p>
                            </div>

                            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-sm">
                                <p className="text-[11px] font-bold uppercase text-rose-600">Egresos / Gastos</p>
                                <p className="text-lg font-extrabold text-rose-700 mt-1">- S/ {resumen.total_egresos?.toFixed(2)}</p>
                            </div>

                            <div className="rounded-xl border border-slate-900 bg-slate-900 p-4 shadow-sm text-white">
                                <p className="text-[11px] font-bold uppercase text-slate-300">Saldo Actual</p>
                                <p className="text-xl font-black mt-1">S/ {resumen.saldo_calculado?.toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Tabla de Movimientos Generales de Caja */}
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
                            <h3 className="text-sm font-bold text-slate-800">Transacciones Operativas Realizadas ({transacciones.length})</h3>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 uppercase text-slate-500 font-bold border-b">
                                        <tr>
                                            <th className="p-3">#</th>
                                            <th className="p-3">Tipo</th>
                                            <th className="p-3">Concepto / Descripción</th>
                                            <th className="p-3">Persona / DNI</th>
                                            <th className="p-3">Monto</th>
                                            <th className="p-3 text-center">Estado</th>
                                            <th className="p-3 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {transacciones.map((t, index) => (
                                            <tr key={t.id_transaccion} className="hover:bg-slate-50 transition">
                                                <td className="p-3 font-bold text-slate-400">{index + 1}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.tipo === 'ingreso' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                        {t.tipo}
                                                    </span>
                                                </td>
                                                <td className="p-3 font-semibold text-slate-800">
                                                    {t.concepto ? t.concepto.nombre : (t.observacion || 'Sin concepto específico')}
                                                    {t.concepto && t.observacion && (
                                                        <span className="block text-[10px] text-slate-400 font-normal">{t.observacion}</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-slate-600">
                                                    {t.nombres ? `${t.nombres} ${t.apellidos || ''}` : '-'}
                                                    {t.dni && <span className="block text-[10px] text-slate-400">DNI: {t.dni}</span>}
                                                </td>
                                                <td className="p-3 font-bold text-slate-800">S/ {parseFloat(t.monto).toFixed(2)}</td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.estado === 'aceptado' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
                                                        {t.estado}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    {t.estado === 'aceptado' && (
                                                        <button
                                                            onClick={() => handleAnular(t.id_transaccion)}
                                                            className="rounded bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                                                        >
                                                            Anular
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL PARA REGISTRAR MOVIMIENTO CON SELECT2 BUSCADOR */}
            {modalMovimiento && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="text-base font-bold text-slate-800">Registrar Movimiento de Caja</h3>
                            <button onClick={() => setModalMovimiento(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">✕</button>
                        </div>

                        <form onSubmit={handleRegistrarMovimiento} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Operación *</label>
                                    <select
                                        value={formTransaccion.data.tipo}
                                        onChange={(e) => formTransaccion.setData('tipo', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#315d7a] outline-none font-bold"
                                    >
                                        <option value="ingreso">INGRESO (+)</option>
                                        <option value="egreso">EGRESO (-)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Monto (S/) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formTransaccion.data.monto}
                                        onChange={(e) => formTransaccion.setData('monto', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#315d7a] outline-none font-bold text-slate-800"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>

                            {/* COMPONENTE BUSCADOR SELECT2 EN REACT */}
                            <div className="relative">
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Concepto (Opcional)
                                </label>
                                
                                <button
                                    type="button"
                                    onClick={() => setDropdownAbierto(!dropdownAbierto)}
                                    className="w-full text-left rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs flex justify-between items-center focus:border-[#315d7a]"
                                >
                                    <span className={conceptoSeleccionado ? 'font-semibold text-slate-800' : 'text-slate-400'}>
                                        {conceptoSeleccionado
                                            ? `${conceptoSeleccionado.nombre} (S/ ${conceptoSeleccionado.precio})`
                                            : '-- Sin concepto (Otro Ingreso / Egreso) --'}
                                    </span>
                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Desplegable con buscador */}
                                {dropdownAbierto && (
                                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-xl p-2 space-y-2">
                                        <input
                                            type="text"
                                            value={busquedaConcepto}
                                            onChange={(e) => setBusquedaConcepto(e.target.value)}
                                            placeholder="Buscar en tarifario..."
                                            className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs outline-none focus:border-[#315d7a]"
                                            autoFocus
                                        />

                                        <div className="max-h-48 overflow-y-auto space-y-1 divide-y text-xs">
                                            <button
                                                type="button"
                                                onClick={() => handleSeleccionarConcepto(null)}
                                                className="w-full text-left px-2 py-1.5 hover:bg-slate-100 text-slate-500 font-semibold"
                                            >
                                                -- Sin concepto específico --
                                            </button>

                                            {conceptosFiltrados.length > 0 ? (
                                                conceptosFiltrados.map((c) => (
                                                    <button
                                                        key={c.id_concepto}
                                                        type="button"
                                                        onClick={() => handleSeleccionarConcepto(c)}
                                                        className="w-full text-left px-2 py-1.5 hover:bg-slate-100 flex justify-between items-center"
                                                    >
                                                        <span className="font-semibold text-slate-800">{c.nombre}</span>
                                                        <span className="font-bold text-emerald-600">S/ {parseFloat(c.precio).toFixed(2)}</span>
                                                    </button>
                                                ))
                                            ) : (
                                                <p className="p-2 text-slate-400 text-center">No hay coincidencias</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">DNI Persona</label>
                                    <input
                                        type="text"
                                        value={formTransaccion.data.dni}
                                        onChange={(e) => formTransaccion.setData('dni', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#315d7a] outline-none"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nombres / Razón Social</label>
                                    <input
                                        type="text"
                                        value={formTransaccion.data.nombres}
                                        onChange={(e) => formTransaccion.setData('nombres', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#315d7a] outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Observación / Descripción {!formTransaccion.data.concepto_id && '*'}
                                </label>
                                <input
                                    type="text"
                                    value={formTransaccion.data.observacion}
                                    onChange={(e) => formTransaccion.setData('observacion', e.target.value)}
                                    placeholder={formTransaccion.data.concepto_id ? "Detalle opcional..." : "Escriba la descripción del movimiento (Obligatorio si no hay concepto)"}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#315d7a] outline-none"
                                    required={!formTransaccion.data.concepto_id}
                                />
                            </div>

                            <div className="flex justify-end gap-2 border-t pt-4">
                                <button type="button" onClick={() => setModalMovimiento(false)} className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer">Cancelar</button>
                                <button type="submit" disabled={formTransaccion.processing} className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 shadow cursor-pointer">Guardar Transacción</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL CERRAR CAJA */}
            {modalCierre && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="text-base font-bold text-slate-800">Cierre de Sesión de Caja</h3>
                            <button onClick={() => setModalCierre(false)} className="text-slate-400 font-bold text-lg cursor-pointer">✕</button>
                        </div>

                        <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 text-xs space-y-1">
                            <div className="flex justify-between"><span>Apertura:</span><span className="font-bold">S/ {resumen.apertura?.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>+ Ingresos Totales:</span><span className="font-bold text-emerald-600">S/ {(resumen.total_pagos_alumnos + resumen.total_ingresos_varios)?.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>- Egresos Totales:</span><span className="font-bold text-rose-600">S/ {resumen.total_egresos?.toFixed(2)}</span></div>
                            <div className="flex justify-between border-t pt-2 text-sm font-black"><span>Saldo Arqueado:</span><span className="text-slate-900">S/ {resumen.saldo_calculado?.toFixed(2)}</span></div>
                        </div>

                        <form onSubmit={handleCerrarCaja} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Observaciones Finales</label>
                                <textarea
                                    value={formCierre.data.observacion}
                                    onChange={(e) => formCierre.setData('observacion', e.target.value)}
                                    rows="2"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#315d7a] outline-none"
                                    placeholder="Novedades o incidencias del turno..."
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-2 border-t pt-4">
                                <button type="button" onClick={() => setModalCierre(false)} className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600">Cancelar</button>
                                <button type="submit" disabled={formCierre.processing} className="rounded-lg bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-rose-700">Confirmar Cierre</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}