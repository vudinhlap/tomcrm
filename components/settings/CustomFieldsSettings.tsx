import React, { useState } from 'react';
import { CustomField } from '../../types';
import { Icons } from '../Icons';
import { FormInput, FormSelect, ConfirmDelete } from '../ui';

const TYPE_LABEL: Record<string, string> = { text: "Văn bản", number: "Số", date: "Ngày", single_select: "Chọn 1", multi_select: "Chọn nhiều" };

interface CustomFieldsSettingsProps {
    customFields: CustomField[];
    showNotification: (msg: string, type?: "success" | "error") => void;
    addAuditLog: (action: any, entity: string, entity_id: any, before_data: any, after_data: any) => void;
    onAdd?: (cf: Omit<CustomField, 'id'>) => Promise<CustomField | null>;
    onUpdate?: (id: string, updates: Partial<CustomField>) => Promise<boolean>;
    onDelete?: (id: string) => Promise<boolean>;
    readOnly?: boolean;
}

export default function CustomFieldsSettings({ customFields, showNotification, addAuditLog, onAdd, onUpdate, onDelete, readOnly }: CustomFieldsSettingsProps) {
    const [newKey, setNewKey] = useState("");
    const [newName, setNewName] = useState("");
    const [newType, setNewType] = useState("text");
    const [newOptions, setNewOptions] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editKey, setEditKey] = useState("");
    const [editName, setEditName] = useState("");
    const [editType, setEditType] = useState("");
    const [editOptions, setEditOptions] = useState("");
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const addField = async () => {
        if (!newKey.trim() || !newName.trim() || !onAdd) return;
        const field = await onAdd({
            field_key: newKey.trim(), field_name: newName.trim(),
            field_type: newType as any,
            config: newType.includes("select") ? { options: newOptions.split(",").map(s => s.trim()).filter(Boolean) } : {},
            is_active: true, sort_order: customFields.length,
        });
        if (field) {
            addAuditLog("CREATE", "CUSTOM_FIELD", field.id, null, field);
            showNotification("Đã thêm trường: " + field.field_name);
            setNewKey(""); setNewName(""); setNewOptions("");
        }
    };

    const startEdit = (f: CustomField) => {
        setEditingId(f.id); setEditKey(f.field_key); setEditName(f.field_name);
        setEditType(f.field_type); setEditOptions((f.config.options || []).join(", "));
        setConfirmDeleteId(null);
    };

    const saveEdit = async (f: CustomField) => {
        if (!editKey.trim() || !editName.trim() || !onUpdate) return;
        const updates = {
            field_key: editKey.trim(), field_name: editName.trim(), field_type: editType as any,
            config: editType.includes("select") ? { options: editOptions.split(",").map(s => s.trim()).filter(Boolean) } : {},
        };
        const ok = await onUpdate(f.id, updates);
        if (ok) {
            addAuditLog("UPDATE", "CUSTOM_FIELD", f.id, f, { ...f, ...updates });
            showNotification("Đã cập nhật trường: " + updates.field_name);
        }
        setEditingId(null);
    };

    const cancelEdit = () => { setEditingId(null); };

    const deleteField = async (f: CustomField) => {
        if (!onDelete) return;
        const ok = await onDelete(f.id);
        if (ok) {
            addAuditLog("DELETE", "CUSTOM_FIELD", f.id, f, null);
            showNotification("Đã xoá trường: " + f.field_name);
        }
        setConfirmDeleteId(null);
    };

    const toggleActive = async (f: CustomField) => {
        if (!onUpdate) return;
        await onUpdate(f.id, { is_active: !f.is_active });
    };

    return (
        <div className="bg-white rounded-[14px] border border-borderLight shadow-sm p-4">
            <div className="text-[15px] font-bold mb-1.5">Trường tuỳ biến (Lark-like)</div>
            <div className="text-xs text-textMuted mb-3.5">Thêm các trường tùy biến cho giao dịch (Ao, Vụ, Đối tác...)</div>

            {customFields.map(f => (
                <div key={f.id} className="py-2 border-b border-borderLight">
                    {editingId === f.id && !readOnly ? (
                        <div className="animate-[slideIn_0.2s_ease]">
                            <div className="flex gap-1.5 mb-1.5">
                                <FormInput sizing="sm" className="flex-1" value={editKey} onChange={e => setEditKey(e.target.value)} placeholder="Key"
                                    onKeyDown={e => { if (e.key === "Enter") saveEdit(f); if (e.key === "Escape") cancelEdit(); }} />
                                <FormInput sizing="sm" className="flex-1" value={editName} onChange={e => setEditName(e.target.value)} autoFocus placeholder="Tên"
                                    onKeyDown={e => { if (e.key === "Enter") saveEdit(f); if (e.key === "Escape") cancelEdit(); }} />
                            </div>
                            <div className="mb-1.5">
                                <FormSelect sizing="sm" value={editType} onChange={e => setEditType(e.target.value)}>
                                    {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </FormSelect>
                            </div>
                            {editType.includes("select") && (
                                <div className="mb-1.5">
                                    <FormInput sizing="sm" value={editOptions} onChange={e => setEditOptions(e.target.value)} placeholder="Các tùy chọn (cách bởi dấu phẩy)" />
                                </div>
                            )}
                            <div className="flex gap-1.5 justify-end">
                                <button className="flex items-center gap-1 bg-transparent text-textSecondary hover:bg-primaryLight hover:text-primary rounded px-2.5 py-1 text-[11px] font-semibold" onClick={cancelEdit}>
                                    <Icons.X /> Huỷ
                                </button>
                                <button className="flex items-center gap-1 bg-primary text-white hover:bg-primaryDark rounded px-3 py-1 text-[11px] font-semibold" onClick={() => saveEdit(f)}>
                                    <Icons.Check /> Lưu
                                </button>
                            </div>
                        </div>
                    ) : confirmDeleteId === f.id && !readOnly ? (
                        <ConfirmDelete label={`Xoá trường "${f.field_name}" (${f.field_key})?`} onCancel={() => setConfirmDeleteId(null)} onConfirm={() => deleteField(f)} />
                    ) : (
                        <div className="flex justify-between items-center">
                            <div>
                                <div className={`text-[13px] font-semibold ${f.is_active ? "opacity-100" : "opacity-40"}`}>{f.field_name} <span className="text-[11px] text-textMuted">({f.field_key})</span></div>
                                <div className="text-[11px] text-textMuted">
                                    {TYPE_LABEL[f.field_type]}
                                    {f.config.options && f.config.options.length > 0 && ` · ${f.config.options.join(", ")}`}
                                </div>
                            </div>
                            {!readOnly && (
                                <div className="flex gap-0.5">
                                    <button className="p-1 text-primary hover:bg-primaryLight rounded" onClick={() => startEdit(f)}><Icons.Edit /></button>
                                    <button className="p-1 text-danger hover:bg-expenseLight rounded" onClick={() => { setConfirmDeleteId(f.id); setEditingId(null); }}><Icons.Delete /></button>
                                    <button className="p-1 text-textSecondary hover:bg-surfaceAlt rounded text-[10px]" onClick={() => toggleActive(f)}>{f.is_active ? "Ẩn" : "Hiện"}</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}

            {!readOnly && (
                <div className="border-t border-border pt-3.5 mt-3">
                    <div className="text-[13px] font-semibold mb-2">Thêm trường mới</div>
                    <div className="grid gap-2">
                        <div className="flex gap-1.5">
                            <FormInput sizing="sm" className="flex-1" value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="Key (vd: pond)" />
                            <FormInput sizing="sm" className="flex-1" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Tên (vd: Ao)" />
                        </div>
                        <div className="flex gap-1.5">
                            <FormSelect sizing="sm" value={newType} onChange={e => setNewType(e.target.value)}>
                                {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </FormSelect>
                        </div>
                        {newType.includes("select") && (
                            <FormInput sizing="sm" value={newOptions} onChange={e => setNewOptions(e.target.value)} placeholder="Các tùy chọn (cách bởi dấu phẩy)" />
                        )}
                        <button className="bg-primary text-white rounded-lg px-3 py-2 text-xs font-semibold hover:bg-primaryDark" onClick={addField}>Thêm trường</button>
                    </div>
                </div>
            )}
        </div>
    );
}
