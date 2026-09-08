import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function PagosCreate({ cajaAbierta, conceptos = [] }) {
    const [busquedaPostulante, setBusquedaPostulante] = useState('');
    const [resultadosPostulantes, setResultadosPostulantes] = useState([]);
    const [postulanteSeleccionado, setPostulanteSeleccionado] = useState(null);
    const [cargando, setCargando] = useState(false);

    const form = useForm({
        postulante_id: '',
        concepto_id: '',
        monto: '',
        observacion: '',
    });

    // Búsqueda AJAX interactiva
    useEffect(() => {
        if (busquedaPostulante.trim().length >= 2 && !postulanteSeleccionado) {
            setCargando(true);
            const timer = setTimeout(() => {
                axios.get(route('pagos.buscar'), { params: { query: busquedaPostulante } })
                    .then((res) => {
                        setResultadosPostulantes(Array.isArray(res.data) ? res.data : []);
                    })
                    .catch(() => setResultadosPostulantes([]))
                    .finally(() => setCargando(false));
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setResultadosPostulantes([]);
            setCargando(false);
        }
    }, [busquedaPostulante]);

    const seleccionarPostulante = (p) => {
        setPostulanteSeleccionado(p);
        form.setData('postulante_id', p.id_postulante);
        setBusquedaPostulante(`${p.dni} - ${p.nombre_completo || p.nombres}`);
        setResultadosPostulantes([]);
    };

    const limpiarPostulante = () => {
        setPostulanteSeleccionado(null);
        setBusquedaPostulante('');
        form.setData('postulante_id', '');
    };

    const handleConceptoChange = (e) => {
        const id = e.target.value;
        const c = conceptos.find((item) => item.id_concepto == id);
        form.setData((prev) => ({
            ...prev,
            concepto_id: id,
            monto: c ? parseFloat(c.precio).toFixed(2) : '',
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!cajaAbierta) {
            Swal.fire('Atención', 'Debe aperturar la caja antes de procesar un pago', 'warning');
            return;
        }

        if (!form.data.postulante_id) {
            Swal.fire('Atención', 'Seleccione un estudiante de la lista desplegable', 'warning');
            return;
        }

        form.post(route('pagos.store'), {
            onSuccess: () => Swal.fire('Éxito', 'Pago registrado correctamente', 'success'),
        });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-slate-800">Registrar Cobro de Estudiante</h1>}>
            <Head title="Nuevo Pago" />

            {/* Contenedor w-full a todo el ancho */}
            <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                    <div>
                        <h2 className="text-base font-bold text-slate-800">Ingreso de Cobro Institucional</h2>
                        <p className="text-xs text-slate-500">Busca por DNI, nombres, apellidos, teléfono o código.</p>
                    </div>
                    <Link
                        href={route('pagos.index')}
                        className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
                    >
                        ← Volver al Listado
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* BUSCADOR AJAX COMPLETO */}
                    <div className="relative">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Buscar Estudiante (DNI, Nombres, Apellidos o Código) *
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={busquedaPostulante}
                                onChange={(e) => {
                                    setBusquedaPostulante(e.target.value);
                                    if (postulanteSeleccionado) setPostulanteSeleccionado(null);
                                }}
                                placeholder="Ingrese criterio de búsqueda..."
                                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-xs focus:border-[#315d7a] outline-none"
                                required
                            />
                            {postulanteSeleccionado && (
                                <button
                                    type="button"
                                    onClick={limpiarPostulante}
                                    className="rounded-lg bg-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-300 transition"
                                >
                                    Cambiar
                                </button>
                            )}
                        </div>

                        {/* Estado Cargando */}
                        {cargando && (
                            <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-500 shadow-xl">
                                Buscando en el registro de postulantes/estudiantes...
                            </div>
                        )}

                        {/* Opciones Desplegables */}
                        {resultadosPostulantes.length > 0 && !postulanteSeleccionado && (
                            <div className="absolute z-30 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-2xl max-h-60 overflow-y-auto divide-y text-xs">
                                {resultadosPostulantes.map((p) => (
                                    <div
                                        key={p.id_postulante}
                                        onClick={() => seleccionarPostulante(p)}
                                        className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition"
                                    >
                                        <div>
                                            <p className="font-bold text-slate-800">
                                                {p.nombre_completo || `${p.nombres} ${p.apellidos}`}
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                                DNI: {p.dni} {p.codigo_postulante ? `| Código: ${p.codigo_postulante}` : ''}
                                            </p>
                                        </div>
                                        <span className="text-emerald-600 font-bold text-[11px]">Seleccionar →</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ESTUDIANTE SELECCIONADO */}
                    {postulanteSeleccionado && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 text-xs flex justify-between items-center">
                            <div>
                                <p className="font-bold text-emerald-950 text-sm">
                                    {postulanteSeleccionado.nombre_completo || `${postulanteSeleccionado.nombres} ${postulanteSeleccionado.apellidos}`}
                                </p>
                                <p className="text-xs text-emerald-800">
                                    DNI: {postulanteSeleccionado.dni} | Correo: {postulanteSeleccionado.email || 'N/A'}
                                </p>
                            </div>
                            <span className="bg-emerald-600 text-white font-bold px-3 py-1 rounded text-[10px] tracking-wide">
                                SELECCIONADO
                            </span>
                        </div>
                    )}

                    {/* DATOS DEL PAGO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Concepto de Pago *</label>
                            <select
                                value={form.data.concepto_id}
                                onChange={handleConceptoChange}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#315d7a] outline-none"
                                required
                            >
                                <option value="">-- Seleccionar Tarifa --</option>
                                {conceptos.map((c) => (
                                    <option key={c.id_concepto} value={c.id_concepto}>
                                        {c.nombre} (S/ {parseFloat(c.precio).toFixed(2)})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Monto a Cobrar (S/) *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.data.monto}
                                onChange={(e) => form.setData('monto', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#315d7a] outline-none"
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Observaciones / Nro. Operación</label>
                        <input
                            type="text"
                            value={form.data.observacion}
                            onChange={(e) => form.setData('observacion', e.target.value)}
                            placeholder="Detalles adicionales del cobro..."
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#315d7a] outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={form.processing || !cajaAbierta}
                        className="w-full rounded-lg bg-emerald-600 py-3 text-xs font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer"
                    >
                        Procesar Cobro e Imprimir Comprobante
                    </button>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}