import InputError from '@/Components/InputError';

export function Field({ label, error, children }) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
                {label}
            </label>
            {children}
            <InputError message={error} className="mt-2" />
        </div>
    );
}

export const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#315d7a] focus:ring-4 focus:ring-[#dfeaf1]';
