import InputError from '@/Components/InputError';
import { Link } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function Form({ data, setData, errors, processing, roles = [], areas = [], editing = false }) {
    const [buscandoDni, setBuscandoDni] = useState(false);

    const inputClass =
        'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1] transition';

    /**
     * Búsqueda en RENIEC (DeColecta API)
     * Separa los nombres y apellidos paterno/materno automáticamente
     */
    const buscarDniReniec = async () => {
        const dniVal = String(data.dni || '').trim();

        if (!dniVal || dniVal.length !== 8 || !/^\d+$/.test(dniVal)) {
            Swal.fire({
                icon: 'warning',
                title: 'DNI Inválido',
                text: 'El DNI debe contener exactamente 8 dígitos numéricos.',
                confirmButtonColor: '#315d7a',
            });
            return;
        }

        setBuscandoDni(true);

        try {
            const { data: response } = await axios.get(route('solicitud-externa.consultar-dni', dniVal));

            if (response.success && response.data) {
                const info = response.data;

                const nombres = info.first_name || info.nombres || '';
                const apePaterno = info.first_last_name || info.apellidoPaterno || '';
                const apeMaterno = info.second_last_name || info.apellidoMaterno || '';
                const apellidos = `${apePaterno} ${apeMaterno}`.trim();

                setData((prev) => ({
                    ...prev,
                    nombre: nombres,
                    apellido: apellidos,
                }));

                Swal.fire({
                    icon: 'success',
                    title: 'Persona Encontrada',
                    text: `${nombres} ${apellidos}`,
                    timer: 2000,
                    showConfirmButton: false,
                });
            } else {
                throw new Error(response.message || 'No se encontró información para el DNI ingresado.');
            }
        } catch (error) {
            Swal.fire({
                icon: 'info',
                title: 'Sin Resultados Automáticos',
                text: error.response?.data?.message || error.message || 'No se pudo consultar RENIEC. Puedes ingresar los datos manualmente.',
                confirmButtonColor: '#315d7a',
            });
        } finally {
            setBuscandoDni(false);
        }
    };

    const toggleRole = (id) => {
        const current = data.role_ids ?? [];
        setData('role_ids', current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    };

    const toggleArea = (id) => {
        const current = data.area_ids ?? [];
        setData('area_ids', current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    };

    return (
        <div className="space-y-8">
            
            {/* SECCIÓN 1: DATOS PERSONALES (DISTRIBUIDO EN 3 COLUMNAS) */}
            <section>
                <h2 className="mb-4 text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                    Datos personales
                </h2>
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    
                    {/* DNI CON BOTÓN RENIEC INTEGRADO */}
                    <Field label="DNI" error={errors.dni}>
                        <div className="flex gap-2">
                            <input
                                maxLength={8}
                                className={inputClass}
                                value={data.dni}
                                onChange={(e) => setData('dni', e.target.value)}
                                placeholder="8 dígitos"
                            />
                            <button
                                type="button"
                                onClick={buscarDniReniec}
                                disabled={buscandoDni}
                                title="Buscar en RENIEC"
                                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#315d7a] px-3.5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#274c64] disabled:opacity-60 transition cursor-pointer"
                            >
                                {buscandoDni ? (
                                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                ) : (
                                    <span>🔍 RENIEC</span>
                                )}
                            </button>
                        </div>
                    </Field>

                    <Field label="Nombres" error={errors.nombre}>
                        <input className={inputClass} value={data.nombre} onChange={(e) => setData('nombre', e.target.value)} placeholder="Nombres completos" />
                    </Field>

                    <Field label="Apellidos" error={errors.apellido}>
                        <input className={inputClass} value={data.apellido} onChange={(e) => setData('apellido', e.target.value)} placeholder="Apellidos completos" />
                    </Field>

                    <Field label="Puesto / Cargo" error={errors.puesto}>
                        <input className={inputClass} value={data.puesto} onChange={(e) => setData('puesto', e.target.value)} placeholder="Ej. Especialista de Mesa de Partes" />
                    </Field>

                    <Field label="Correo Electrónico" error={errors.email}>
                        <input type="email" className={inputClass} value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="correo@institucion.edu.pe" />
                    </Field>

                    <Field label="Teléfono / Celular" error={errors.telefono}>
                        <input className={inputClass} value={data.telefono} onChange={(e) => setData('telefono', e.target.value)} placeholder="Ej. 987654321" />
                    </Field>

                    <Field label="Dirección Domiciliaria" error={errors.direccion} full>
                        <input className={inputClass} value={data.direccion} onChange={(e) => setData('direccion', e.target.value)} placeholder="Av. Principal #123" />
                    </Field>
                </div>
            </section>

            {/* SECCIÓN 2: CUENTA DE ACCESO (DISTRIBUIDO EN 3 COLUMNAS) */}
            <section className="border-t border-slate-200 pt-6">
                <h2 className="mb-4 text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                    Cuenta de acceso
                </h2>
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    <Field label="Usuario" error={errors.username}>
                        <input className={inputClass} value={data.username} onChange={(e) => setData('username', e.target.value)} placeholder="Ej. jperez" />
                    </Field>

                    <Field label="Estado" error={errors.status}>
                        <select className={inputClass} value={data.status} onChange={(e) => setData('status', e.target.value)}>
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                        </select>
                    </Field>

                    <Field label="Área principal" error={errors.id_area}>
                        <select className={inputClass} value={data.id_area} onChange={(e) => setData('id_area', Number(e.target.value))}>
                            <option value="">Seleccione un área</option>
                            {areas.map((area) => <option key={area.id} value={area.id}>{area.nombre}</option>)}
                        </select>
                    </Field>

                    <Field label={editing ? 'Nueva contraseña (opcional)' : 'Contraseña'} error={errors.password}>
                        <input type="password" className={inputClass} value={data.password} onChange={(e) => setData('password', e.target.value)} placeholder="••••••••" />
                    </Field>

                    <Field label="Confirmar contraseña" error={errors.password_confirmation}>
                        <input type="password" className={inputClass} value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} placeholder="••••••••" />
                    </Field>

                    <Field label="URL de imagen" error={errors.img} full>
                        <input className={inputClass} value={data.img} onChange={(e) => setData('img', e.target.value)} placeholder="https://..." />
                    </Field>
                </div>
            </section>

            {/* SECCIÓN 3: ROLES ASIGNADOS */}
            <section className="border-t border-slate-200 pt-6">
                <h2 className="mb-1 text-base font-bold text-slate-900">Roles asignados</h2>
                <p className="mb-4 text-sm text-slate-500">Seleccione uno o varios roles administrativos para los permisos del usuario.</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {roles.map((rol) => (
                        <label key={rol.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50 transition">
                            <input
                                type="checkbox"
                                checked={(data.role_ids ?? []).includes(rol.id)}
                                onChange={() => toggleRole(rol.id)}
                                className="mt-1 rounded border-slate-300 text-[#315d7a] focus:ring-[#315d7a]"
                            />
                            <span>
                                <span className="block text-sm font-semibold text-slate-800">{rol.nombre || rol.name}</span>
                                {rol.descripcion && <span className="mt-0.5 block text-xs text-slate-500">{rol.descripcion}</span>}
                            </span>
                        </label>
                    ))}
                </div>
                <InputError message={errors.role_ids || errors['role_ids.0']} className="mt-2" />
            </section>

            {/* SECCIÓN 4: ÁREAS ADICIONALES */}
            <section className="border-t border-slate-200 pt-6">
                <h2 className="mb-1 text-base font-bold text-slate-900">Áreas adicionales</h2>
                <p className="mb-4 text-sm text-slate-500">El área principal se incluirá automáticamente en los accesos del colaborador.</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {areas.map((area) => (
                        <label key={area.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50 transition">
                            <input
                                type="checkbox"
                                checked={(data.area_ids ?? []).includes(area.id)}
                                onChange={() => toggleArea(area.id)}
                                className="rounded border-slate-300 text-[#315d7a] focus:ring-[#315d7a]"
                            />
                            <span className="text-sm font-semibold text-slate-700">{area.nombre}</span>
                        </label>
                    ))}
                </div>
                <InputError message={errors.area_ids} className="mt-2" />
            </section>

            {/* ACCIONES DEL FORMULARIO */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
                <Link
                    href={route('personal.index')}
                    className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                    Cancelar
                </Link>

                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-lg bg-[#315d7a] px-8 py-2.5 text-sm font-semibold text-white hover:bg-[#274c64] disabled:opacity-60 transition cursor-pointer shadow-xs"
                >
                    {processing ? 'Guardando...' : editing ? 'Actualizar personal' : 'Registrar personal'}
                </button>
            </div>
        </div>
    );
}

function Field({ label, error, children, full = false }) {
    return (
        <div className={full ? 'md:col-span-2 lg:col-span-3' : ''}>
            <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
            {children}
            <InputError message={error} className="mt-2" />
        </div>
    );
}