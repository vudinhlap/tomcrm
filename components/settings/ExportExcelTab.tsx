import React, { useState, useMemo } from 'react';
import * as XLSX from "xlsx";
import { Transaction, Wallet, Category, CustomField, AuditLog } from '../../types';
import { formatDate, formatMoney, formatAmountInput, parseAmount } from '../../utils';
import { Icons } from '../Icons';
import { FormLabel, FormInput, FormSelect } from '../ui';

interface ExportExcelTabProps {
    transactions: Transaction[];
    wallets: Wallet[];
    categories: Category[];
    customFields: CustomField[];
    auditLogs: AuditLog[];
    showNotification: (msg: string, type?: "success" | "error") => void;
    addAuditLog: (action: any, entity: string, entity_id: any, before_data: any, after_data: any) => void;
}

export default function ExportExcelTab({ transactions, wallets, categories, customFields, auditLogs, showNotification, addAuditLog }: ExportExcelTabProps) {
    const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(1); return formatDate(d); });
    const [dateTo, setDateTo] = useState(formatDate(new Date()));
    const [filterWallet, setFilterWallet] = useState("ALL");
    const [includeAudit, setIncludeAudit] = useState(false);
    const [includeCustomFields, setIncludeCustomFields] = useState(true);
    const [exporting, setExporting] = useState(false);

    const filtered = useMemo(() => {
        return transactions.filter(t => {
            if (t.txn_date < dateFrom || t.txn_date > dateTo) return false;
            if (filterWallet !== "ALL" && t.wallet_id !== filterWallet && t.to_wallet_id !== filterWallet) return false;
            return true;
        }).sort((a, b) => a.txn_date.localeCompare(b.txn_date));
    }, [transactions, dateFrom, dateTo, filterWallet]);

    const handleExport = () => {
        setExporting(true);
        try {
            const wb = XLSX.utils.book_new();

            const readmeData = [
                ["BÁO CÁO TÀI CHÍNH - TômCRM"],
                [],
                ["Ngày xuất", new Date().toLocaleString("vi-VN")],
                ["Kỳ báo cáo", `${dateFrom} đến ${dateTo}`],
                ["Lọc ví", filterWallet === "ALL" ? "Tất cả" : wallets.find(w => w.id === filterWallet)?.name || "—"],
                ["Tổng giao dịch", filtered.length],
                [],
                ["Ghi chú: File này được xuất tự động từ TômCRM."],
            ];
            const wsReadme = XLSX.utils.aoa_to_sheet(readmeData);
            wsReadme["!cols"] = [{ wch: 20 }, { wch: 40 }];
            XLSX.utils.book_append_sheet(wb, wsReadme, "README");

            const txnHeaders = ["Ngày", "Loại", "Số tiền", "Ví", "Ví đích", "Danh mục", "Ghi chú", "Ngày tạo"];
            const activeFields = customFields.filter(f => f.is_active);
            if (includeCustomFields) activeFields.forEach(f => txnHeaders.push(f.field_name));

            const txnRows = filtered.map(t => {
                const w = wallets.find(w2 => w2.id === t.wallet_id);
                const tw = wallets.find(w2 => w2.id === t.to_wallet_id);
                const cat = categories.find(c => c.id === t.category_id);
                const flowLabel = t.flow === "INCOME" ? "Thu" : t.flow === "EXPENSE" ? "Chi" : "Chuyển khoản";
                const row: any[] = [t.txn_date, flowLabel, t.amount, w?.name || "", tw?.name || "", cat?.name || "", t.note || "", t.created_at || ""];
                if (includeCustomFields) {
                    activeFields.forEach(f => { row.push(t.custom_fields?.[f.field_key] || ""); });
                }
                return row;
            });
            const wsTxn = XLSX.utils.aoa_to_sheet([txnHeaders, ...txnRows]);
            wsTxn["!cols"] = txnHeaders.map(h => ({ wch: Math.max(h.length + 2, 14) }));
            XLSX.utils.book_append_sheet(wb, wsTxn, "GIAO_DICH");

            const catMap: Record<string, any> = {};
            filtered.filter(t => t.flow !== "TRANSFER").forEach(t => {
                const cat = categories.find(c => c.id === t.category_id);
                const key = `${t.flow}_${cat?.name || "Khác"}`;
                if (!catMap[key]) catMap[key] = { category: cat?.name || "Khác", flow: t.flow === "INCOME" ? "Thu" : "Chi", total: 0 };
                catMap[key].total += t.amount;
            });
            const catRows = Object.values(catMap).sort((a: any, b: any) => b.total - a.total);
            const wsCat = XLSX.utils.aoa_to_sheet([
                ["Danh mục", "Loại", "Tổng tiền"],
                ...catRows.map((r: any) => [r.category, r.flow, r.total]),
            ]);
            wsCat["!cols"] = [{ wch: 25 }, { wch: 10 }, { wch: 18 }];
            XLSX.utils.book_append_sheet(wb, wsCat, "THEO_DANH_MUC");

            const fileName = `TomCRM_${dateFrom}_${dateTo}.xlsx`;
            XLSX.writeFile(wb, fileName);

            addAuditLog("EXPORT", "EXPORT", null, null, { dateFrom, dateTo, filterWallet, txnCount: filtered.length, fileName });
            showNotification(`Đã xuất ${filtered.length} giao dịch ra file Excel!`);
        } catch (err: any) {
            console.error(err);
            showNotification("Lỗi khi xuất Excel: " + err.message, "error");
        } finally {
            setExporting(false);
        }
    };

    let previewIncome = 0, previewExpense = 0;
    filtered.forEach(t => {
        if (t.flow === "INCOME") previewIncome += t.amount;
        if (t.flow === "EXPENSE") previewExpense += t.amount;
    });

    return (
        <div className="bg-white rounded-[14px] border border-borderLight shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1.5">
                <Icons.Download />
                <div className="text-[15px] font-bold">Xuất dữ liệu Excel</div>
            </div>
            <div className="text-xs text-textMuted mb-4">Xuất file Excel nhiều sheet để đối soát và lưu trữ</div>

            <div className="flex gap-2 mb-3">
                <div className="flex-1">
                    <FormLabel>Từ ngày</FormLabel>
                    <FormInput sizing="sm" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </div>
                <div className="flex-1">
                    <FormLabel>Đến ngày</FormLabel>
                    <FormInput sizing="sm" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </div>
            </div>

            <div className="mb-3">
                <FormLabel>Lọc theo ví</FormLabel>
                <FormSelect sizing="sm" value={filterWallet} onChange={e => setFilterWallet(e.target.value)}>
                    <option value="ALL">Tất cả ví</option>
                    {wallets.filter(w => w.is_active).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </FormSelect>
            </div>

            <div className="mb-4">
                <FormLabel>Tuỳ chọn</FormLabel>
                <div className="flex flex-col gap-2 mt-1">
                    <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                        <input type="checkbox" checked={includeCustomFields} onChange={e => setIncludeCustomFields(e.target.checked)}
                            className="w-4 h-4 accent-primary" />
                        <span>Bao gồm trường tuỳ biến (Ao, Vụ, Đối tác...)</span>
                    </label>
                    <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                        <input type="checkbox" checked={includeAudit} onChange={e => setIncludeAudit(e.target.checked)}
                            className="w-4 h-4 accent-primary" />
                        <span>Bao gồm nhật ký kiểm soát (Audit log)</span>
                    </label>
                </div>
            </div>

            <div className="bg-surfaceAlt rounded-[10px] p-3.5 mb-4">
                <div className="text-xs font-bold text-textSecondary mb-2 uppercase tracking-wide">Xem trước</div>
                <div className="grid grid-cols-2 gap-2 text-[13px]">
                    <div>Giao dịch: <b>{filtered.length}</b></div>
                    <div>Tổng thu: <b className="text-income">{formatMoney(previewIncome)}đ</b></div>
                    <div>Tổng chi: <b className="text-expense">{formatMoney(previewExpense)}đ</b></div>
                    <div>Lợi nhuận: <b className={previewIncome - previewExpense >= 0 ? "text-income" : "text-expense"}>{formatMoney(previewIncome - previewExpense)}đ</b></div>
                </div>
            </div>

            <button className="w-full flex justify-center items-center gap-2 p-3.5 bg-primary text-white rounded-lg font-semibold text-[15px] hover:bg-primaryDark disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleExport} disabled={exporting || filtered.length === 0}>
                <Icons.Download />
                {exporting ? "Đang xuất..." : filtered.length === 0 ? "Không có dữ liệu để xuất" : `Xuất Excel (${filtered.length} giao dịch)`}
            </button>
        </div>
    );
}
