import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function Create({ empresas, tiposContrato, planesEstudio = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        id_empresa: '',
        id_tipo_contrato: '',
        id_plan_estudio: '',
        titulo: '',
        descripcion: '',
        fecha_publicacion: new Date().toISOString().split('T')[0],
        fecha_limite: '',
        lugar: '',
        modalidad: 'Presencial',
        tipo_oferta: 'Empleo',
        remuneracion: '',
        vacantes: 1,
        experiencia: '',
        pasos_postular: '',
        estado: 'Publicada',
        archivo_pdf: null,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('ofertas-laborales.store'), {
            forceFormData: true,
            onSuccess: () => {
                Swal.fire({
                    title: '¡Registrado!',
                    text: 'La oferta laboral fue creada exitosamente.',
                    icon: 'success',
                    confirmButtonColor: '#315d7a',
                    timer: 2000,
                    showConfirmButton: false,
                });
            },
            onError: () => {
                Swal.fire({
                    title: 'Atención',
                    text: 'Por favor verifique los campos obligatorios.',
                    icon: 'warning',
                    confirmButtonColor: '#315d7a',
                });
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center w-full">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Crear Oferta Laboral
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Completa los datos requeridos organizados en las siguientes secciones.
                        </p>
                    </div>
                    <Link
                        href={route('ofertas-laborales.index')}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition flex items-center gap-1"
                    >
                        ← Volver al listado
                    </Link>
                </div>
            }
        >
            <Head title="Nueva Oferta Laboral" />

            {/* CONTENEDOR ANCHO COMPLETO (Se eliminó max-w-5xl y mx-auto) */}
            <div className="w-full pb-10">
                <form onSubmit={handleSubmit} className="space-y-6 w-full">

                    {/* SECCIÓN 1: CLASIFICACIÓN Y EMPRESA */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 w-full">
                        <div className="border-b pb-3 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#315d7a]"></span>
                                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                    1. Clasificación y Empresa
                                </h2>
                            </div>
                            <span className="text-xs text-slate-400 font-medium">Campos obligatorios (*)</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                                    Empresa *
                                </label>
                                <select
                                    value={data.id_empresa}
                                    onChange={(e) => setData('id_empresa', e.target.value)}
                                    className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] ${
                                        errors.id_empresa ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                                    }`}
                                >
                                    <option value="">-- Seleccionar Empresa --</option>
                                    {empresas.map((emp) => (
                                        <option key={emp.id_empresa} value={emp.id_empresa}>
                                            {emp.nombre_empresa}
                                        </option>
                                    ))}
                                </select>
                                {errors.id_empresa && <span className="text-xs text-rose-500 mt-1 block font-medium">{errors.id_empresa}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                                    Tipo de Contrato *
                                </label>
                                <select
                                    value={data.id_tipo_contrato}
                                    onChange={(e) => setData('id_tipo_contrato', e.target.value)}
                                    className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] ${
                                        errors.id_tipo_contrato ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                                    }`}
                                >
                                    <option value="">-- Seleccionar Modalidad --</option>
                                    {tiposContrato.map((t) => (
                                        <option key={t.id_tipo_contrato} value={t.id_tipo_contrato}>
                                            {t.nombre_tipo_contrato}
                                        </option>
                                    ))}
                                </select>
                                {errors.id_tipo_contrato && <span className="text-xs text-rose-500 mt-1 block font-medium">{errors.id_tipo_contrato}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                                    Carrera / Programa Académico
                                </label>
                                <select
                                    value={data.id_plan_estudio}
                                    onChange={(e) => setData('id_plan_estudio', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a]"
                                >
                                    <option value="">-- Dirigido a Todos / General --</option>
                                    {planesEstudio.map((plan) => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.nombre || plan.nombre_carrera || `Programa #${plan.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 2: DETALLES DEL PUESTO Y PERFIL */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5 w-full">
                        <div className="border-b pb-3 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#315d7a]"></span>
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                2. Detalles del Puesto y Perfil
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-3">
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                                    Título de la Oferta *
                                </label>
                                <input
                                    type="text"
                                    value={data.titulo}
                                    onChange={(e) => setData('titulo', e.target.value)}
                                    placeholder="Ej. Asistente Contable / Desarrollador Web Junior"
                                    className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] ${
                                        errors.titulo ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                                    }`}
                                />
                                {errors.titulo && <span className="text-xs text-rose-500 mt-1 block font-medium">{errors.titulo}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                                    Tipo de Oferta
                                </label>
                                <select
                                    value={data.tipo_oferta}
                                    onChange={(e) => setData('tipo_oferta', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a]"
                                >
                                    <option value="Empleo">Empleo</option>
                                    <option value="Practicas Preprofesionales">Prácticas Preprofesionales</option>
                                    <option value="Practicas Profesionales">Prácticas Profesionales</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                                Descripción General *
                            </label>
                            <textarea
                                rows={5}
                                value={data.descripcion}
                                onChange={(e) => setData('descripcion', e.target.value)}
                                placeholder="Describe ampliamente las funciones principales, responsabilidades y el perfil buscado para la vacante..."
                                className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a] ${
                                    errors.descripcion ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                                }`}
                            ></textarea>
                            {errors.descripcion && <span className="text-xs text-rose-500 mt-1 block font-medium">{errors.descripcion}</span>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                                Experiencia Requerida
                            </label>
                            <input
                                type="text"
                                value={data.experiencia}
                                onChange={(e) => setData('experiencia', e.target.value)}
                                placeholder="Ej. Mínimo 6 meses en puestos similares / Sin experiencia requerida"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                                Pasos o Instrucciones para Postular
                            </label>
                            <textarea
                                rows={3}
                                value={data.pasos_postular}
                                onChange={(e) => setData('pasos_postular', e.target.value)}
                                placeholder="Ej. 1. Enviar CV actualizado al correo rrhh@empresa.com con asunto CV-ASISTENTE. 2. Adjuntar certificados de estudio."
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a]"
                            ></textarea>
                        </div>
                    </div>

                    {/* SECCIÓN 3: CONDICIONES DE CONTRATACIÓN */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 w-full">
                        <div className="border-b pb-3 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#315d7a]"></span>
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                3. Condiciones de Contratación
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                                    Vacantes *
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={data.vacantes}
                                    onChange={(e) => setData('vacantes', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                                    Remuneración (S/)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.remuneracion}
                                    onChange={(e) => setData('remuneracion', e.target.value)}
                                    placeholder="0.00"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                                    Modalidad *
                                </label>
                                <select
                                    value={data.modalidad}
                                    onChange={(e) => setData('modalidad', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a]"
                                >
                                    <option value="Presencial">Presencial</option>
                                    <option value="Remoto">Remoto</option>
                                    <option value="Hibrido">Híbrido</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                                    Lugar / Ubicación
                                </label>
                                <input
                                    type="text"
                                    value={data.lugar}
                                    onChange={(e) => setData('lugar', e.target.value)}
                                    placeholder="Ej. Trujillo, La Libertad"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 4: PUBLICACIÓN Y DOCUMENTOS */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 w-full">
                        <div className="border-b pb-3 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#315d7a]"></span>
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                4. Publicación y Documentos
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                                    Fecha Publicación *
                                </label>
                                <input
                                    type="date"
                                    value={data.fecha_publicacion}
                                    onChange={(e) => setData('fecha_publicacion', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                                    Fecha Límite
                                </label>
                                <input
                                    type="date"
                                    value={data.fecha_limite}
                                    onChange={(e) => setData('fecha_limite', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                                    Estado *
                                </label>
                                <select
                                    value={data.estado}
                                    onChange={(e) => setData('estado', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#315d7a]"
                                >
                                    <option value="Publicada">Publicada</option>
                                    <option value="Borrador">Borrador</option>
                                    <option value="Cerrada">Cerrada</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                                    Bases / Flyer (PDF)
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setData('archivo_pdf', e.target.files[0])}
                                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    {/* BOTONES DE ACCIÓN */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex justify-end gap-3 w-full">
                        <Link
                            href={route('ofertas-laborales.index')}
                            className="px-5 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-2.5 bg-[#315d7a] text-white rounded-lg text-xs font-bold hover:bg-[#274b63] transition shadow disabled:opacity-50"
                        >
                            {processing ? 'Guardando...' : 'Publicar Oferta'}
                        </button>
                    </div>

                </form>
            </div>
        </AuthenticatedLayout>
    );
}