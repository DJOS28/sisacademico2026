import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import { Head, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { useRef, useState } from 'react';

export default function Show({ docente, cursosHistorial = [] }) {
    const fileInputRef = useRef(null);
    const [previewImg, setPreviewImg] = useState(docente.usuario?.img || null);

    const { data, setData, post, processing, errors, reset } = useForm({
        telefono: docente.telefono || '',
        direccion: docente.direccion || '',
        email: docente.email || '',
        current_password: '',
        password: '',
        password_confirmation: '',
        img: null,
        remove_img: false,
    });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData((prev) => ({ ...prev, img: file, remove_img: false }));
            setPreviewImg(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setData((prev) => ({ ...prev, img: null, remove_img: true }));
        setPreviewImg(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        post(route('docente.perfil.update'), {
            preserveScroll: true,
            onSuccess: () => {
                reset('current_password', 'password', 'password_confirmation');
                Swal.fire({
                    icon: 'success',
                    title: 'Perfil actualizado',
                    text: 'Tus datos profesionales se guardaron correctamente.',
                    timer: 2000,
                    showConfirmButton: false,
                });
            },
            onError: () => {
                Swal.fire({
                    icon: 'error',
                    title: 'Revisa los campos',
                    text: 'Corrige los errores indicados en el formulario.',
                });
            },
        });
    };

    const totalCursosDictados = cursosHistorial.reduce(
        (acc, item) => acc + (item.cursos?.length || 0),
        0
    );

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <p className="text-sm font-semibold text-[#315d7a]">Mi cuenta institucional</p>
                    <h1 className="mt-0.5 text-2xl font-bold text-slate-900">Mi Perfil Profesional</h1>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Expediente académico docente, datos de contacto y credenciales de acceso al sistema.
                    </p>
                </div>
            }
        >
            <Head title="Mi Perfil Docente" />

            <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
                <form onSubmit={handleSubmit} className="w-full space-y-6">
                    {/* CONTENEDOR PRINCIPAL DOS COLUMNAS */}
                    <div className="w-full flex flex-col lg:flex-row gap-6 items-start">
                        
                        {/* COLUMNA IZQUIERDA: RESUMEN Y FOTO DE PERFIL (35% ANCHO) */}
                        <div className="w-full lg:w-1/3 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs text-center min-w-0">
                            
                            {/* Avatar */}
                            <div className="relative mx-auto w-32 h-32 mb-4">
                                {previewImg ? (
                                    <img
                                        src={previewImg}
                                        alt="Foto de perfil"
                                        className="w-32 h-32 rounded-2xl object-cover border-2 border-[#315d7a]/20 shadow-sm mx-auto"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-[#315d7a] to-[#1c3c52] flex items-center justify-center text-white text-3xl font-black shadow-sm mx-auto">
                                        {docente.nombre?.charAt(0)}
                                        {docente.apellido?.charAt(0)}
                                    </div>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleImageChange}
                                className="hidden"
                            />

                            <div className="flex justify-center gap-2 mb-4">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                                >
                                    📷 Cambiar foto
                                </button>
                                {previewImg && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                                        title="Eliminar foto"
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                            <InputError message={errors.img} className="mb-2" />

                            <h2 className="text-base font-bold text-slate-900 leading-snug">
                                {docente.nombre} {docente.apellido}
                            </h2>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">DNI: {docente.dni}</p>

                            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                                <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                                    ● {docente.usuario?.status || 'Activo'}
                                </span>
                                <span className="inline-block rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold text-[#315d7a] border border-sky-200">
                                    Docente Institucional
                                </span>
                            </div>

                            <div className="mt-6 border-t border-slate-100 pt-4 text-left space-y-3 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Departamento:</span>
                                    <span className="font-semibold text-slate-800">{docente.departamento || 'Académico'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Cargo:</span>
                                    <span className="font-semibold text-slate-800">{docente.cargo || 'Docente'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Usuario:</span>
                                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                                        {docente.usuario?.username}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Asignaturas Totales:</span>
                                    <span className="font-bold text-[#315d7a]">{totalCursosDictados} cursos</span>
                                </div>
                            </div>
                        </div>

                        {/* COLUMNA DERECHA: CAMPOS DE FORMULARIO (65% ANCHO) */}
                        <div className="w-full lg:w-2/3 space-y-6 min-w-0">
                            
                            {/* 1. INFORMACIÓN DE CONTACTO */}
                            <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                                <div className="border-b border-slate-100 pb-3">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                        1. Datos de Contacto Personal
                                    </h3>
                                    <p className="text-xs text-slate-500">Información para notificaciones y comunicación institucional.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Correo Electrónico <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                        />
                                        <InputError message={errors.email} className="mt-1" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Teléfono / Celular
                                        </label>
                                        <input
                                            type="tel"
                                            value={data.telefono}
                                            onChange={(e) => setData('telefono', e.target.value)}
                                            placeholder="Ej. 987654321"
                                            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 font-mono outline-none focus:border-[#315d7a]"
                                        />
                                        <InputError message={errors.telefono} className="mt-1" />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Dirección Residencial
                                        </label>
                                        <input
                                            type="text"
                                            value={data.direccion}
                                            onChange={(e) => setData('direccion', e.target.value)}
                                            placeholder="Ej. Av. España 123, Trujillo"
                                            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                        />
                                        <InputError message={errors.direccion} className="mt-1" />
                                    </div>
                                </div>
                            </div>

                            {/* 2. SEGURIDAD Y CAMBIO DE CONTRASEÑA */}
                            <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                                <div className="border-b border-slate-100 pb-3">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                        2. Seguridad y Contraseña
                                    </h3>
                                    <p className="text-xs text-slate-500">Completa estos campos únicamente si deseas actualizar tu clave de ingreso.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Contraseña Actual
                                        </label>
                                        <input
                                            type="password"
                                            value={data.current_password}
                                            onChange={(e) => setData('current_password', e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                        />
                                        <InputError message={errors.current_password} className="mt-1" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Nueva Contraseña
                                        </label>
                                        <input
                                            type="password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder="Mínimo 8 caracteres"
                                            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                        />
                                        <InputError message={errors.password} className="mt-1" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Confirmar Contraseña
                                        </label>
                                        <input
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            placeholder="Repetir nueva contraseña"
                                            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#315d7a]"
                                        />
                                        <InputError message={errors.password_confirmation} className="mt-1" />
                                    </div>
                                </div>
                            </div>

                            {/* BOTÓN GUARDAR CAMBIOS */}
                            <div className="w-full flex justify-end rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-xl bg-[#315d7a] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-[#274c64] disabled:opacity-60 shadow-xs cursor-pointer"
                                >
                                    {processing ? 'Guardando cambios...' : 'Guardar Actualizaciones'}
                                </button>
                            </div>

                        </div>
                    </div>
                </form>

                {/* 3. HISTORIAL ACADÉMICO / ASIGNATURAS DICTADAS */}
                <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                    <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                3. Trayectoria y Cursos Asignados
                            </h3>
                            <p className="text-xs text-slate-500">Historial consolidado de unidades didácticas y secciones dictadas por periodo.</p>
                        </div>
                        <span className="bg-sky-50 text-[#315d7a] text-xs font-bold px-3 py-1 rounded-full border border-sky-200 self-start">
                            {cursosHistorial.length} Periodos Registrados
                        </span>
                    </div>

                    {cursosHistorial.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400 italic">
                            No se encontraron asignaciones lectivas en el historial del docente.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cursosHistorial.map((grupo, idx) => (
                                <div key={idx} className="w-full rounded-xl border border-slate-200 overflow-hidden">
                                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-xs text-[#315d7a] flex items-center justify-between">
                                        <span>📅 Periodo Académico: {grupo.periodo}</span>
                                        <span className="text-[11px] font-semibold text-slate-600 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                                            {grupo.cursos?.length || 0} cursos dictados
                                        </span>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {grupo.cursos.map((c, cIdx) => (
                                            <div key={cIdx} className="px-4 py-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 transition">
                                                <div>
                                                    <span className="font-bold text-slate-900 block text-xs">{c.curso}</span>
                                                    <span className="text-[11px] text-slate-400 font-mono">Código: {c.codigo || 'S/C'}</span>
                                                </div>
                                                <span className="inline-block rounded-lg bg-slate-100 border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700 self-start sm:self-auto">
                                                    Sección: {c.seccion || 'Única'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}