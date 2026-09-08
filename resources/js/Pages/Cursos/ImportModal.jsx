import InputError from '@/Components/InputError';
import { useForm } from '@inertiajs/react';

export default function ImportModal({
    open,
    onClose,
}) {
    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
    } = useForm({
        archivo: null,
    });

    if (!open) {
        return null;
    }

    // Generador dinámico de plantilla Excel/CSV sin archivos en el servidor
    const descargarPlantilla = (e) => {
        e.preventDefault();

        const cabeceras = [
            'nombre',
            'plan_estudio',
            'semestre',
            'modulo',
            'tipo',
            'creditos',
            'horas_semestrales',
            'orden',
            'descripcion',
        ];

        const filasEjemplo = [
            [
                'Algoritmos y Programación',
                'DSI-2024',
                'I',
                '1',
                'Especialidad',
                '4.00',
                '64',
                '1',
                'Lógica de programación y estructuras de control',
            ],
            [
                'Comunicación Efectiva',
                'DSI-2024',
                'I',
                '1',
                'Empleabilidad',
                '2.00',
                '32',
                '2',
                'Habilidades comunicativas y redacción técnica',
            ],
        ];

        // Codificación UTF-8 con BOM (\uFEFF) para soporte de tildes y caracteres especiales en Excel
        const contenidoCsv =
            '\uFEFF' +
            [
                cabeceras.join(';'),
                ...filasEjemplo.map((fila) =>
                    fila.map((campo) => `"${campo.replace(/"/g, '""')}"`).join(';')
                ),
            ].join('\r\n');

        const blob = new Blob([contenidoCsv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'plantilla_importacion_cursos.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const submit = (event) => {
        event.preventDefault();

        post(route('cursos.importar'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4">
            <form
                onSubmit={submit}
                className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl"
            >
                <div className="border-b border-slate-200 px-6 py-4">
                    <h2 className="text-lg font-bold text-slate-900">
                        Importar cursos
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Cargue un archivo Excel o CSV con los datos de las asignaturas.
                    </p>
                </div>

                <div className="space-y-4 p-6">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 space-y-1">
                        <p className="font-semibold">Columnas obligatorias por nombre/código:</p>
                        <p className="text-xs text-blue-700">
                            <strong>nombre</strong>, <strong>plan_estudio</strong> (código o nombre), <strong>semestre</strong> (ej. I), <strong>modulo</strong> (número o nombre), <strong>tipo</strong>, <strong>creditos</strong>, <strong>horas_semestrales</strong> y <strong>orden</strong>.
                        </p>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Archivo Excel / CSV
                        </label>

                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={(event) =>
                                setData(
                                    'archivo',
                                    event.target.files?.[0] ?? null
                                )
                            }
                            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-[#315d7a] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-[#264960] cursor-pointer"
                        />

                        <InputError
                            message={errors.archivo}
                            className="mt-2"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={descargarPlantilla}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#315d7a] hover:underline"
                    >
                        <span>📥</span> Descargar plantilla de importación
                    </button>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        disabled={processing || !data.archivo}
                        className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264960] disabled:opacity-60"
                    >
                        {processing ? 'Importando...' : 'Importar archivo'}
                    </button>
                </div>
            </form>
        </div>
    );
}