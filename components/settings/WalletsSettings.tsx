import React, { useState } from 'react';
import { Wallet } from '../../types';
import { formatMoney, formatAmountInput, parseAmount } from '../../utils';
import { Icons } from '../Icons';
import { FormInput, FormSelect, ConfirmDelete } from '../ui';

interface WalletsSettingsProps {
    wallets: Wallet[];
    showNotification: (msg: string, type?: "success" | "error") => void;
    addAuditLog: (action: any, entity: string, entity_id: any, before_data: any, after_data: any) => void;
    onAdd?: (w: Omit<Wallet, 'id'>) => Promise<Wallet | null>;
    onUpdate?: (id: string, updates: Partial<Wallet>) => Promise<boolean>;
    onDelete?: (id: string) => Promise<boolean>;
    readOnly?: boolean;
}

export default function WalletsSettings({ wallets, showNotification, addAuditLog, onAdd, onUpdate, onDelete, readOnly }: WalletsSettingsProps) {
    const [newName, setNewName] = useState("");
    const [newType, setNewType] = useState("CASH");
    const [newBalance, setNewBalance] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editType, setEditType] = useState("");
    const [editBalance, setEditBalance] = useState("");
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const addWallet = async () => {
        if (!newName.trim() || !onAdd) return;
        const w = await onAdd({ name: newName.trim(), type: newType as any, opening_balance: parseAmount(newBalance), is_active: true });
        if (w) {
            addAuditLog("CREATE", "WALLET", w.id, null, w);
            showNotification("Đã thêm ví: " + w.name);
            setNewName(""); setNewBalance("");
        }
    };

    const startEdit = (w: Wallet) => {
        setEditingId(w.id); setEditName(w.name); setEditType(w.type);
        setEditBalance(formatAmountInput(String(w.opening_balance)));
        setConfirmDeleteId(null);
    };

    const saveEdit = async (w: Wallet) => {
        if (!editName.trim() || !onUpdate) return;
        const updates = { name: editName.trim(), type: editType as any, opening_balance: parseAmount(editBalance) };
        const ok = await onUpdate(w.id, updates);
        if (ok) {
            addAuditLog("UPDATE", "WALLET", w.id, w, { ...w, ...updates });
            showNotification("Đã cập nhật ví: " + updates.name);
        }
        setEditingId(null);
    };

    const cancelEdit = () => { setEditingId(null); };

    const deleteWallet = async (w: Wallet) => {
        if (!onDelete) return;
        const ok = await onDelete(w.id);
        if (ok) {
            addAuditLog("DELETE", "WALLET", w.id, w, null);
            showNotification("Đã xoá ví: " + w.name);
        }
        setConfirmDeleteId(null);
    };

    const toggleActive = async (w: Wallet) => {
        if (!onUpdate) return;
        await onUpdate(w.id, { is_active: !w.is_active });
    };

    return (
        <div className="bg-white rounded-[14px] border border-borderLight shadow-sm p-4">
            <div className="text-[15px] font-bold mb-3.5">Quản lý ví</div>
            {wallets.map(w => (
                <div key={w.id} className="py-2.5 border-b border-borderLight">
                    {editingId === w.id && !readOnly ? (
                        <div className="animate-[slideIn_0.2s_ease]">
                            <div className="flex gap-1.5 mb-1.5">
                                <FormInput sizing="sm" className="flex-1" value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                                    onKeyDown={e => { if (e.key === "Enter") saveEdit(w); if (e.key === "Escape") cancelEdit(); }} />
                                <FormSelect sizing="sm" className="!w-[110px]" value={editType} onChange={e => setEditType(e.target.value)}>
                                    <option value="CASH">Tiền mặt</option>
                                    <option value="BANK">Ngân hàng</option>
                                </FormSelect>
                            </div>
                            <div className="flex gap-1.5 mb-1.5">
                                <div className="flex-1">
                                    <label className="block text-[11px] font-bold text-textMuted uppercase mb-0.5">Số dư ban đầu</label>
                                    <FormInput sizing="sm" type="text" inputMode="numeric" value={editBalance} onChange={e => setEditBalance(formatAmountInput(e.target.value))}
                                        onKeyDown={e => { if (e.key === "Enter") saveEdit(w); if (e.key === "Escape") cancelEdit(); }} />
                                </div>
                            </div>
                            <div className="flex gap-1.5 justify-end">
                                <button className="flex items-center gap-1 bg-transparent text-textSecondary hover:bg-primaryLight hover:text-primary rounded px-2.5 py-1 text-[11px] font-semibold" onClick={cancelEdit}>
                                    <Icons.X /> Huỷ
                                </button>
                                <button className="flex items-center gap-1 bg-primary text-white hover:bg-primaryDark rounded px-3 py-1 text-[11px] font-semibold" onClick={() => saveEdit(w)}>
                                    <Icons.Check /> Lưu
                                </button>
                            </div>
                        </div>
                    ) : confirmDeleteId === w.id && !readOnly ? (
                        <ConfirmDelete label={`Xoá ví "${w.name}"?`} onCancel={() => setConfirmDeleteId(null)} onConfirm={() => deleteWallet(w)} />
                    ) : (
                        <div className="flex justify-between items-center">
                            <div>
                                <div className={`text-sm font-semibold ${w.is_active ? "opacity-100" : "opacity-40"}`}>{w.name}</div>
                                <div className="text-[11px] text-textMuted">
                                    {w.type === "CASH" ? "Tiền mặt" : "Ngân hàng"} · Số dư ban đầu: {formatMoney(w.opening_balance)}đ
                                </div>
                            </div>
                            {!readOnly && (
                                <div className="flex gap-0.5">
                                    <button className="p-1 text-primary hover:bg-primaryLight rounded" onClick={() => startEdit(w)}><Icons.Edit /></button>
                                    <button className="p-1 text-danger hover:bg-expenseLight rounded" onClick={() => { setConfirmDeleteId(w.id); setEditingId(null); }}><Icons.Delete /></button>
                                    <button className="p-1 text-textSecondary hover:bg-surfaceAlt rounded text-[10px]" onClick={() => toggleActive(w)}>
                                        {w.is_active ? "Ẩn" : "Hiện"}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}

            {!readOnly && (
                <div className="border-t border-border pt-3.5 mt-3">
                    <div className="text-[13px] font-semibold mb-2">Thêm ví mới</div>
                    <div className="grid gap-2">
                        <div className="flex gap-1.5">
                            <FormInput sizing="sm" className="flex-1" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Tên ví" />
                            <FormSelect sizing="sm" className="!w-[110px]" value={newType} onChange={e => setNewType(e.target.value)}>
                                <option value="CASH">Tiền mặt</option>
                                <option value="BANK">Ngân hàng</option>
                            </FormSelect>
                        </div>
                        <div className="flex gap-1.5">
                            <FormInput sizing="sm" className="flex-1" type="text" inputMode="numeric" value={newBalance} onChange={e => setNewBalance(formatAmountInput(e.target.value))} placeholder="Số dư ban đầu" />
                            <button className="bg-primary text-white rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap hover:bg-primaryDark" onClick={addWallet}>Thêm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
