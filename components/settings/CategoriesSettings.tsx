import React, { useState } from 'react';
import { Category } from '../../types';
import { Icons } from '../Icons';
import { FormInput, FormSelect, ConfirmDelete } from '../ui';

interface CategoriesSettingsProps {
    categories: Category[];
    showNotification: (msg: string, type?: "success" | "error") => void;
    addAuditLog: (action: any, entity: string, entity_id: any, before_data: any, after_data: any) => void;
    onAdd?: (c: Omit<Category, 'id'>) => Promise<Category | null>;
    onUpdate?: (id: string, updates: Partial<Category>) => Promise<boolean>;
    onDelete?: (id: string) => Promise<boolean>;
    readOnly?: boolean;
}

export default function CategoriesSettings({ categories, showNotification, addAuditLog, onAdd, onUpdate, onDelete, readOnly }: CategoriesSettingsProps) {
    const [newName, setNewName] = useState("");
    const [newFlow, setNewFlow] = useState<Category['flow']>("EXPENSE");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editFlow, setEditFlow] = useState("");
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const addCategory = async () => {
        if (!newName.trim() || !onAdd) return;
        const cat = await onAdd({ name: newName.trim(), flow: newFlow, parent_id: null, sort_order: categories.length, is_active: true });
        if (cat) {
            addAuditLog("CREATE", "CATEGORY", cat.id, null, cat);
            showNotification("Đã thêm danh mục: " + cat.name);
            setNewName("");
        }
    };

    const startEdit = (c: Category) => {
        setEditingId(c.id);
        setEditName(c.name);
        setEditFlow(c.flow);
        setConfirmDeleteId(null);
    };

    const saveEdit = async (c: Category) => {
        if (!editName.trim() || !onUpdate) return;
        const updates = { name: editName.trim(), flow: editFlow as Category['flow'] };
        const ok = await onUpdate(c.id, updates);
        if (ok) {
            addAuditLog("UPDATE", "CATEGORY", c.id, c, { ...c, ...updates });
            showNotification("Đã cập nhật: " + updates.name);
        }
        setEditingId(null);
    };

    const cancelEdit = () => { setEditingId(null); setEditName(""); setEditFlow(""); };

    const deleteCategory = async (c: Category) => {
        if (!onDelete) return;
        const ok = await onDelete(c.id);
        if (ok) {
            addAuditLog("DELETE", "CATEGORY", c.id, c, null);
            showNotification("Đã xoá danh mục: " + c.name);
        }
        setConfirmDeleteId(null);
    };

    const toggleActive = async (c: Category) => {
        if (!onUpdate) return;
        await onUpdate(c.id, { is_active: !c.is_active });
    };

    return (
        <div className="bg-white rounded-[14px] border border-borderLight shadow-sm p-4">
            <div className="text-[15px] font-bold mb-3.5">Danh mục thu/chi</div>
            {(["INCOME", "EXPENSE"] as const).map(flow => (
                <div key={flow} className="mb-4">
                    <div className={`text-xs font-bold mb-1.5 uppercase ${flow === "INCOME" ? "text-income" : "text-expense"}`}>
                        {flow === "INCOME" ? "Thu nhập" : "Chi phí"}
                    </div>
                    {categories.filter(c => c.flow === flow).map(c => (
                        <div key={c.id} className="border-b border-borderLight py-2">
                            {editingId === c.id && !readOnly ? (
                                <div className="animate-[slideIn_0.2s_ease]">
                                    <div className="flex gap-1.5 mb-1.5">
                                        <FormInput sizing="sm" className="flex-1" value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                                            onKeyDown={e => { if (e.key === "Enter") saveEdit(c); if (e.key === "Escape") cancelEdit(); }} />
                                        <FormSelect sizing="sm" className="!w-[100px]" value={editFlow} onChange={e => setEditFlow(e.target.value)}>
                                            <option value="EXPENSE">Chi phí</option>
                                            <option value="INCOME">Thu nhập</option>
                                        </FormSelect>
                                    </div>
                                    <div className="flex gap-1.5 justify-end">
                                        <button className="flex items-center gap-1 bg-transparent text-textSecondary hover:bg-primaryLight hover:text-primary rounded px-2.5 py-1 text-[11px] font-semibold" onClick={cancelEdit}>
                                            <Icons.X /> Huỷ
                                        </button>
                                        <button className="flex items-center gap-1 bg-primary text-white hover:bg-primaryDark rounded px-3 py-1 text-[11px] font-semibold" onClick={() => saveEdit(c)}>
                                            <Icons.Check /> Lưu
                                        </button>
                                    </div>
                                </div>
                            ) : confirmDeleteId === c.id && !readOnly ? (
                                <ConfirmDelete label={`Xoá danh mục "${c.name}"?`} onCancel={() => setConfirmDeleteId(null)} onConfirm={() => deleteCategory(c)} />
                            ) : (
                                <div className="flex justify-between items-center">
                                    <span className={`text-[13px] font-medium ${c.is_active ? "opacity-100" : "opacity-40"}`}>{c.name}</span>
                                    {!readOnly && (
                                        <div className="flex gap-0.5">
                                            <button className="p-1 text-primary hover:bg-primaryLight rounded" onClick={() => startEdit(c)}><Icons.Edit /></button>
                                            <button className="p-1 text-danger hover:bg-expenseLight rounded" onClick={() => { setConfirmDeleteId(c.id); setEditingId(null); }}><Icons.Delete /></button>
                                            <button className="p-1 text-textSecondary hover:bg-surfaceAlt rounded text-[10px]" onClick={() => toggleActive(c)}>{c.is_active ? "Ẩn" : "Hiện"}</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ))}

            {!readOnly && (
                <div className="border-t border-border pt-3.5 mt-2">
                    <div className="text-[13px] font-semibold mb-2">Thêm danh mục mới</div>
                    <div className="flex gap-1.5 mb-2">
                        <FormSelect sizing="sm" className="!w-[100px]" value={newFlow} onChange={e => setNewFlow(e.target.value as any)}>
                            <option value="EXPENSE">Chi phí</option>
                            <option value="INCOME">Thu nhập</option>
                        </FormSelect>
                        <FormInput sizing="sm" className="flex-1" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Tên danh mục"
                            onKeyDown={e => { if (e.key === "Enter") addCategory(); }} />
                        <button className="bg-primary text-white rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap hover:bg-primaryDark" onClick={addCategory}>
                            Thêm
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
