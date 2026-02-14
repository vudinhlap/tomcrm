import React from 'react';

/* ─── FormLabel ─── */
export function FormLabel({ children }: { children: React.ReactNode }) {
    return (
        <label className="block text-xs font-semibold text-textSecondary mb-1 uppercase tracking-wider">
            {children}
        </label>
    );
}

/* ─── FormInput ─── */
export function FormInput({ sizing = 'md', className = '', ...props }: { sizing?: 'sm' | 'md' | 'lg' } & React.InputHTMLAttributes<HTMLInputElement>) {
    const sizeClasses: Record<string, string> = {
        sm: 'p-2 text-xs',
        md: 'p-2.5 text-sm',
        lg: 'p-3.5 text-[22px] font-extrabold text-center',
    };
    return (
        <input
            className={`w-full border-[1.5px] border-border rounded-lg bg-surface transition-all focus:outline-none focus:ring-4 focus:ring-primaryLight focus:border-primary ${sizeClasses[sizing]} ${className}`}
            {...props}
        />
    );
}

/* ─── FormSelect ─── */
export function FormSelect({ sizing = 'md', className = '', children, ...props }: { sizing?: 'sm' | 'md' } & React.SelectHTMLAttributes<HTMLSelectElement>) {
    const sizeClass = sizing === 'sm' ? 'p-2 text-xs' : 'p-2.5 text-sm';
    return (
        <select
            className={`w-full border-[1.5px] border-border rounded-lg bg-surface transition-all focus:outline-none focus:ring-4 focus:ring-primaryLight focus:border-primary ${sizeClass} ${className}`}
            {...props}
        >
            {children}
        </select>
    );
}

/* ─── EmptyState ─── */
export function EmptyState({ message = "Không có dữ liệu" }: { message?: string }) {
    return (
        <div className="text-center p-10 text-textMuted text-[13px]">{message}</div>
    );
}

/* ─── ConfirmDelete ─── */
export function ConfirmDelete({ label, onCancel, onConfirm }: { label: string; onCancel: () => void; onConfirm: () => void }) {
    return (
        <div className="animate-[slideIn_0.2s_ease]">
            <div className="text-xs text-danger font-semibold mb-1.5 p-1 px-2 bg-expenseLight rounded-md">
                {label}
            </div>
            <div className="flex gap-1.5 justify-end">
                <button className="flex items-center gap-1 bg-transparent text-textSecondary hover:bg-primaryLight hover:text-primary rounded px-2.5 py-1 text-[11px] font-semibold" onClick={onCancel}>
                    ✕ Huỷ
                </button>
                <button className="flex items-center gap-1 bg-expenseLight text-danger hover:bg-danger hover:text-white rounded px-3 py-1 text-[11px] font-semibold" onClick={onConfirm}>
                    🗑 Xác nhận xoá
                </button>
            </div>
        </div>
    );
}
