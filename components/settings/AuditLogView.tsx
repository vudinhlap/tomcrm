import React, { useState } from 'react';
import { AuditLog } from '../../types';
import { formatDateTime, formatMoney } from '../../utils';
import { Icons } from '../Icons';
import { EmptyState } from '../ui';

interface AuditLogViewProps {
    auditLogs: AuditLog[];
}

const ACTION_COLOR: Record<string, string> = { CREATE: "text-income", UPDATE: "text-accent", DELETE: "text-expense", UNDO: "text-transfer", EXPORT: "text-primary" };
const ACTION_BG: Record<string, string> = { CREATE: "bg-incomeLight", UPDATE: "bg-accentLight", DELETE: "bg-expenseLight", UNDO: "bg-transferLight", EXPORT: "bg-primaryLight" };

export default function AuditLogView({ auditLogs }: AuditLogViewProps) {
    const [filterAction, setFilterAction] = useState("ALL");

    const filtered = filterAction === "ALL" ? auditLogs : auditLogs.filter(l => l.action === filterAction);

    return (
        <div className="bg-white rounded-[14px] border border-borderLight shadow-sm p-4">
            <div className="text-[15px] font-bold mb-1.5">Nhật ký kiểm soát</div>
            <div className="text-xs text-textMuted mb-3">Mọi thao tác đều được ghi lại</div>

            <div className="flex gap-1 mb-3 flex-wrap">
                {["ALL", "CREATE", "UPDATE", "DELETE", "UNDO", "EXPORT"].map(a => (
                    <button key={a} onClick={() => setFilterAction(a)}
                        className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all
            ${filterAction === a ? (a === "ALL" ? "bg-primary text-white" : `${ACTION_COLOR[a]} ${ACTION_BG[a]} border border-current`) : "bg-surfaceAlt text-textMuted"}`}>
                        {a === "ALL" ? "Tất cả" : a}
                    </button>
                ))}
            </div>

            {filtered.length === 0 && <EmptyState message="Chưa có nhật ký nào" />}

            {filtered.map((log: AuditLog) => (
                <div key={log.id} className="py-2.5 border-b border-borderLight">
                    <div className="flex items-center gap-1.5 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ACTION_BG[log.action]} ${ACTION_COLOR[log.action]}`}>
                            {log.action}
                        </span>
                        <span className="text-xs font-semibold">{log.entity}</span>
                        <span className="text-[11px] text-textMuted ml-auto flex items-center gap-1">
                            <Icons.Clock /> {formatDateTime(log.created_at)}
                        </span>
                    </div>
                    {log.after_data && (
                        <div className="text-[11px] text-textSecondary bg-surfaceAlt p-2 rounded-md mt-1 overflow-x-auto whitespace-nowrap">
                            {typeof log.after_data === "object" ? (
                                log.after_data.flow ? `${log.after_data.flow} · ${formatMoney(log.after_data.amount)}đ · ${log.after_data.note || ""}` : JSON.stringify(log.after_data).slice(0, 100)
                            ) : String(log.after_data).slice(0, 100)}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
