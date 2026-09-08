import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useState } from 'react';

export default function AsignacionPlanes({ planes: initialPlanes, usuariosDisponibles }) {
    const [planes, setPlanes] = useState(initialPlanes || []);
    const [planSeleccionado, setPlanSeleccionado] = useState(null);
    const [usuarioId, setUsuarioId] = useState('');
    const [saving, setSaving] = useState(false);
    const [busqueda, setBusqueda] = useState('');

    const handleAsignar = async (e) => {
        e.preventDefault();
        if (!planSeleccionado || !usuarioId) return;

        setSaving(true);
        try {
            const res = await axios.post(route('supervision.planes.store'), {
                plan_estudio_id: planSeleccionado.id,
                usuario_id: parseInt(usuarioId),
            });

            if (res.data.success) {
                setPlanes(prev => prev.map(p => {
                    if (p.id === planSeleccionado.id) {
                        const existe = p.supervisores.some(s => s.usuario_id === parseInt(usuarioId));
                        const nuevosSupervisores = existe
                            ? p.supervisores.map(s => s.usuario_id === parseInt(usuarioId) ? res.data.data : s)
                            : [...p.supervisores, res.data.data];
                        return { ...p, supervisores: nuevosSupervisores };
                    }
                    return p;
                }));

                setPlanSeleccionado(prev => ({
                    ...prev,
                    supervisores: prev.supervisores.some(s => s.usuario_id === parseInt(usuarioId))
                        ? prev.supervisores.map(s => s.usuario_id === parseInt(usuarioId) ? res.data.data : s)
                        : [...prev.supervisores, res.data.data]
                }));

                setUsuarioId('');
                Swal.fire({
                    icon: 'success',
                    title: '¡Asignado!',
                    text: res.data.message,
                    timer: 1500,
                    showConfirmButton: false,
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'No se pudo asignar el supervisor.',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleEstado = async (asignacionId) => {
        try {
            const res = await axios.patch(route('supervision.planes.toggle', asignacionId));
            if (res.data.success) {
                const actualizar = (sups) => sups.map(s => s.id === asignacionId ? { ...s, activo: res.data.activo } : s);

                setPlanes(prev => prev.map(p => ({ ...p, supervisores: actualizar(p.supervisores) })));
                if (planSeleccionado) {
                    setPlanSeleccionado(prev => ({ ...prev, supervisores: actualizar(prev.supervisores) }));
                }
            }
        } catch (error) {
            Swal.fire('Error', 'No se pudo cambiar el estado de la asignación.', 'error');
        }
    };

    const handleEliminar = (asignacionId, nombreSupervisor) => {
        Swal.fire({
            title: '¿Desvincular Supervisor?',
            html: `¿Desea retirar a <strong>${nombreSupervisor}</strong> de este plan de estudios?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, desvincular',
            cancelButtonText: 'Cancelar',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await axios.delete(route('supervision.planes.destroy', asignacionId));
                    if (res.data.success) {
                        const filtrar = (sups) => sups.filter(s => s.id !== asignacionId);

                        setPlanes(prev => prev.map(p => ({ ...p, supervisores: filtrar(p.supervisores) })));
                        if (planSeleccionado) {
                            setPlanSeleccionado(prev => ({ ...prev, supervisores: filtrar(prev.supervisores) }));
                        }

                        Swal.fire({
                            icon: 'success',
                            title: '¡Desvinculado!',
                            timer: 1400,
                            showConfirmButton: false,
                        });
                    }
                } catch (error) {
                    Swal.fire('Error', 'No se pudo eliminar la asignación.', 'error');
                }
            }
        });
    };

    const planesFiltrados = planes.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.codigo && p.codigo.toLowerCase().includes(busqueda.toLowerCase()))
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Asignación de Supervisores por Carrera</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Configure los usuarios autorizados para auditar las unidades didácticas de cada plan de estudios.
                        </p>
                    </div>

                    <Link
                        href={route('supervision.index')}
                        className="rounded-lg bg-[#315d7a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#274c64]"
                    >
                        Volver a Monitoreo
                    </Link>
                </div>
            }
        >
            <Head title="Asignación de Supervisores" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Panel Izquierdo: Lista de Planes de Estudio */}
                <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                    <div className="border-b border-slate-100 pb-2">
                        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Planes de Estudio ({planesFiltrados.length})
                        </h2>
                    </div>

                    <input
                        type="search"
                        placeholder="Buscar carrera o código..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#315d7a]"
                    />

                    <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto pr-1 space-y-1">
                        {planesFiltrados.map((plan) => {
                            const isSelected = planSeleccionado?.id === plan.id;
                            const totalSups = plan.supervisores.filter(s => s.activo).length;

                            return (
                                <div
                                    key={plan.id}
                                    onClick={() => setPlanSeleccionado(plan)}
                                    className={`p-3 rounded-lg cursor-pointer transition flex items-center justify-between ${
                                        isSelected
                                            ? 'bg-blue-50 border border-blue-200 text-blue-900'
                                            : 'hover:bg-slate-50 text-slate-700'
                                    }`}
                                >
                                    <div>
                                        <p className="font-semibold text-sm">{plan.nombre}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {plan.codigo || 'S/C'} • {plan.resolucion || 'Sin Resolución'}
                                        </p>
                                    </div>
                                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                        totalSups > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {totalSups} {totalSups === 1 ? 'supervisor' : 'supervisores'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Panel Derecho: Asignación de Supervisores */}
                <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    {planSeleccionado ? (
                        <div className="space-y-6">
                            <div className="border-b border-slate-100 pb-3">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Plan Seleccionado</span>
                                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{planSeleccionado.nombre}</h3>
                            </div>

                            {/* Formulario Asignar */}
                            <form onSubmit={handleAsignar} className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <div className="flex-1 w-full">
                                    <select
                                        value={usuarioId}
                                        onChange={(e) => setUsuarioId(e.target.value)}
                                        required
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#315d7a]"
                                    >
                                        <option value="">-- Seleccionar Usuario / Personal --</option>
                                        {usuariosDisponibles.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.nombre_completo} ({u.username})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving || !usuarioId}
                                    className="w-full sm:w-auto rounded-lg bg-[#315d7a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#274c64] disabled:opacity-50"
                                >
                                    {saving ? 'Asignando...' : 'Asignar'}
                                </button>
                            </form>

                            {/* Lista de Supervisores */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Supervisores Habilitados ({planSeleccionado.supervisores.length})
                                </h4>

                                {planSeleccionado.supervisores.length > 0 ? (
                                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                                        {planSeleccionado.supervisores.map((sup) => (
                                            <div key={sup.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{sup.nombre_completo}</p>
                                                    <p className="text-xs text-slate-400">
                                                        Usuario: {sup.username} • Asignado el: {sup.asignado_el}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleEstado(sup.id)}
                                                        className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                                                            sup.activo
                                                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                        }`}
                                                    >
                                                        {sup.activo ? 'Activo' : 'Inactivo'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEliminar(sup.id, sup.nombre_completo)}
                                                        className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                                                    >
                                                        Quitar
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                                        No hay supervisores asignados a este plan de estudio.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="py-24 text-center text-slate-400 text-sm">
                            Seleccione un plan de estudio en la lista izquierda para gestionar sus supervisores.
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}