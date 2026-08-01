import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function Edit({ tipoPago, admisiones = [], admisionesSeleccionadas = [] }) {
    const { data, setData, put, processing, errors } = useForm({
        nombre: tipoPago.nombre || '',
        banco_o_entidad: tipoPago.banco_o_entidad || '',
        numero_cuenta: tipoPago.numero_cuenta || '',
        cci: tipoPago.cci || '',
        nombre_titular: tipoPago.nombre_titular || '',
        activo: Boolean(tipoPago.activo),
        // Array con los IDs asignados previamente
        admisiones_ids: admisionesSeleccionadas || [],
    });

    // Manejo de checkboxes para la selección de admisiones
    const handleAdmisionToggle = (id) => {
        const idNum = Number(id);
        if (data.admisiones_ids.includes(idNum)) {
            setData('admisiones_ids', data.admisiones_ids.filter((item) => item !== idNum));
        } else {
            setData('admisiones_ids', [...data.admisiones_ids, idNum]);
        }
    };

    // Seleccionar o desmarcar todas las admisiones
    const handleSelectAllAdmisiones = () => {
        if (data.admisiones_ids.length === admisiones.length) {
            setData('admisiones_ids', []);
        } else {
            setData('admisiones_ids', admisiones.map((a) => a.id_admision));
        }
    };

    const actualizar = (e) => {
        e.preventDefault();
        put(route('tipos-pago.update', tipoPago.id_tipo_pago), {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: '¡Actualizado!',
                    text: 'El medio de pago y sus asignaciones fueron actualizados correctamente.',
                    icon: 'success',
                    confirmButtonColor: '#315d7a',
                });
            },
            onError: () => {
                Swal.fire({
                    title: 'Error',
                    text: 'Revisa los campos del formulario.',
                    icon: 'warning',
                    confirmButtonColor: '#315d7a',
                });
            },
        });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-slate-900">Editar Medio de Pago</h1>}>
            <Head title={`Editar - ${tipoPago.nombre}`} />

            <div className="w-full space-y-6">
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Modificar Medio de Pago</h2>
                        <p className="mt-1 text-sm text-slate-500">Actualice la información bancaria y sus asignaciones a procesos de admisión.</p>
                    </div>

                    <Link
                        href={route('tipos-pago.index')}
                        className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        Volver al listado
                    </Link>
                </div>

                <form onSubmit={actualizar} className="space-y-6">
                    {/* SECCIÓN 1: DATOS BANCARIOS */}
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">1. Información de la Cuenta Bancaria</h3>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Nombre del método <span className="text-rose-600">*</span></label>
                                <input
                                    type="text"
                                    value={data.nombre}
                                    onChange={(e) => setData('nombre', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                    required
                                />
                                {errors.nombre && <p className="mt-1 text-xs text-rose-600">{errors.nombre}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Banco o Entidad <span className="text-rose-600">*</span></label>
                                <input
                                    type="text"
                                    value={data.banco_o_entidad}
                                    onChange={(e) => setData('banco_o_entidad', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                    required
                                />
                                {errors.banco_o_entidad && <p className="mt-1 text-xs text-rose-600">{errors.banco_o_entidad}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Número de Cuenta <span className="text-rose-600">*</span></label>
                                <input
                                    type="text"
                                    value={data.numero_cuenta}
                                    onChange={(e) => setData('numero_cuenta', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                    required
                                />
                                {errors.numero_cuenta && <p className="mt-1 text-xs text-rose-600">{errors.numero_cuenta}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">CCI (Código Interbancario) <span className="text-rose-600">*</span></label>
                                <input
                                    type="text"
                                    value={data.cci}
                                    onChange={(e) => setData('cci', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                    required
                                />
                                {errors.cci && <p className="mt-1 text-xs text-rose-600">{errors.cci}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Nombre del Titular <span className="text-rose-600">*</span></label>
                                <input
                                    type="text"
                                    value={data.nombre_titular}
                                    onChange={(e) => setData('nombre_titular', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] focus:ring-2 focus:ring-[#315d7a]/20"
                                    required
                                />
                                {errors.nombre_titular && <p className="mt-1 text-xs text-rose-600">{errors.nombre_titular}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <input
                                        type="checkbox"
                                        checked={data.activo}
                                        onChange={(e) => setData('activo', e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-[#315d7a] focus:ring-[#315d7a]"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">Medio activo</p>
                                        <p className="text-xs text-slate-500">Estará disponible para asignarse a procesos de admisión.</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* SECCIÓN 2: ASIGNACIÓN DE PROCESOS DE ADMISIÓN (TABLA PIVOTE) */}
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">2. Procesos de Admisión Habilitados</h3>
                                <p className="text-xs text-slate-500">Marque o desmarque las admisiones donde estará disponible este medio de pago.</p>
                            </div>
                            {admisiones.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleSelectAllAdmisiones}
                                    className="text-xs font-bold text-[#315d7a] hover:underline cursor-pointer"
                                >
                                    {data.admisiones_ids.length === admisiones.length ? 'Desmarcar todos' : 'Marcar todos'}
                                </button>
                            )}
                        </div>

                        {admisiones.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                                {admisiones.map((adm) => {
                                    const isChecked = data.admisiones_ids.includes(adm.id_admision);
                                    return (
                                        <label
                                            key={adm.id_admision}
                                            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${
                                                isChecked
                                                    ? 'border-[#315d7a] bg-[#315d7a]/5 shadow-xs'
                                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleAdmisionToggle(adm.id_admision)}
                                                className="h-4 w-4 rounded border-slate-300 text-[#315d7a] focus:ring-[#315d7a]"
                                            />
                                            <span className="text-xs font-bold text-slate-800">{adm.nombre}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs italic text-slate-500">No hay procesos de admisión activos registrados actualmente.</p>
                        )}
                        {errors.admisiones_ids && <p className="mt-1 text-xs text-rose-600">{errors.admisiones_ids}</p>}
                    </section>

                    {/* BOTONES */}
                    <div className="flex flex-col-reverse justify-end gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row">
                        <Link href={route('tipos-pago.index')} className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                            Cancelar
                        </Link>
                        <button type="submit" disabled={processing} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#315d7a] px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-[#274b63] disabled:opacity-60 cursor-pointer">
                            {processing ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}