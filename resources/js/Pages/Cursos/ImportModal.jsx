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
                        Cargue un archivo Excel con la estructura proporcionada.
                    </p>
                </div>

                <div className="space-y-4 p-6">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                        Columnas obligatorias: nombre, semestre_id,
                        tipo, id_modulo, creditos,
                        horas_semestrales y orden.
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Archivo Excel
                        </label>

                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={(event) =>
                                setData(
                                    'archivo',
                                    event.target.files?.[0] ??
                                        null
                                )
                            }
                            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                        />

                        <InputError
                            message={errors.archivo}
                            className="mt-2"
                        />
                    </div>

                    <a
                        href="/plantillas/plantilla_importacion_cursos.xlsx"
                        className="inline-flex text-sm font-semibold text-[#315d7a] hover:underline"
                    >
                        Descargar plantilla de importación
                    </a>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        disabled={processing || !data.archivo}
                        className="rounded-lg bg-[#315d7a] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    >
                        {processing
                            ? 'Importando...'
                            : 'Importar archivo'}
                    </button>
                </div>
            </form>
        </div>
    );
}
