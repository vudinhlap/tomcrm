import React, { useState, useMemo } from 'react';
import * as XLSX from "xlsx";
import { Transaction, Wallet, Category, CustomField, AuditLog, FeedJournal } from '../../types';
import { formatDate, formatMoney } from '../../utils';
import { Icons } from '../Icons';
import { FormLabel, FormInput, FormSelect } from '../ui';

interface ExportExcelTabProps {
    transactions: Transaction[];
    wallets: Wallet[];
    categories: Category[];
    customFields: CustomField[];
    auditLogs: AuditLog[];
    feedJournals: FeedJournal[];
    showNotification: (msg: string, type?: "success" | "error") => void;
    addAuditLog: (action: any, entity: string, entity_id: any, before_data: any, after_data: any) => void;
}

export default function ExportExcelTab({ transactions, wallets, categories, customFields, auditLogs, feedJournals, showNotification, addAuditLog }: ExportExcelTabProps) {
    const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(1); return formatDate(d); });
    const [dateTo, setDateTo] = useState(formatDate(new Date()));
    const [filterWallet, setFilterWallet] = useState("ALL");
    const [exportingFinance, setExportingFinance] = useState(false);
    const [exportingJournal, setExportingJournal] = useState(false);

    const filtered = useMemo(() => {
        return transactions.filter(t => {
            if (t.txn_date < dateFrom || t.txn_date > dateTo) return false;
            if (filterWallet !== "ALL" && t.wallet_id !== filterWallet && t.to_wallet_id !== filterWallet) return false;
            return true;
        }).sort((a, b) => a.txn_date.localeCompare(b.txn_date));
    }, [transactions, dateFrom, dateTo, filterWallet]);

    const filteredJournals = useMemo(() => {
        return feedJournals.filter(j => {
            if (j.journal_date < dateFrom || j.journal_date > dateTo) return false;
            return true;
        }).sort((a, b) => a.journal_date.localeCompare(b.journal_date));
    }, [feedJournals, dateFrom, dateTo]);

    /* ── Export Financial Data ── */
    const handleExportFinance = () => {
        setExportingFinance(true);
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
            activeFields.forEach(f => txnHeaders.push(f.field_name));

            const txnRows = filtered.map(t => {
                const w = wallets.find(w2 => w2.id === t.wallet_id);
                const tw = wallets.find(w2 => w2.id === t.to_wallet_id);
                const cat = categories.find(c => c.id === t.category_id);
                const flowLabel = t.flow === "INCOME" ? "Thu" : t.flow === "EXPENSE" ? "Chi" : "Chuyển khoản";
                const row: any[] = [t.txn_date, flowLabel, t.amount, w?.name || "", tw?.name || "", cat?.name || "", t.note || "", t.created_at || ""];
                activeFields.forEach(f => { row.push(t.custom_fields?.[f.field_key] || ""); });
                return row;
            });
            const wsTxn = XLSX.utils.aoa_to_sheet([txnHeaders, ...txnRows]);
            wsTxn["!cols"] = txnHeaders.map(h => ({ wch: Math.max(h.length + 2, 14) }));
            XLSX.utils.book_append_sheet(wb, wsTxn, "GIAO_DICH");

            // Category summary
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

            const fileName = `TomCRM_TaiChinh_${dateFrom}_${dateTo}.xlsx`;
            XLSX.writeFile(wb, fileName);

            addAuditLog("EXPORT", "EXPORT_FINANCE", null, null, { dateFrom, dateTo, filterWallet, txnCount: filtered.length, fileName });
            showNotification(`Đã xuất ${filtered.length} giao dịch tài chính!`);
        } catch (err: any) {
            console.error(err);
            showNotification("Lỗi khi xuất Excel: " + err.message, "error");
        } finally {
            setExportingFinance(false);
        }
    };

    /* ── Export Feed Journal ── */
    const handleExportJournal = () => {
        setExportingJournal(true);
        try {
            const wb = XLSX.utils.book_new();

            const readmeData = [
                ["NHẬT KÝ THỨC ĂN - TômCRM"],
                [],
                ["Ngày xuất", new Date().toLocaleString("vi-VN")],
                ["Kỳ báo cáo", `${dateFrom} đến ${dateTo}`],
                ["Tổng nhật ký", filteredJournals.length],
                [],
                ["Ghi chú: Cột 'Hình ảnh' chứa đường dẫn URL đến hình ảnh đã tải lên."],
            ];
            const wsReadme = XLSX.utils.aoa_to_sheet(readmeData);
            wsReadme["!cols"] = [{ wch: 20 }, { wch: 50 }];
            XLSX.utils.book_append_sheet(wb, wsReadme, "README");

            const journalHeaders = ["Ngày", "Ghi chú", "Hình ảnh (URL)", "Ngày tạo"];
            const journalRows = filteredJournals.map(j => [
                j.journal_date,
                j.note || "",
                j.image_url || "",
                j.created_at || "",
            ]);
            const wsJournal = XLSX.utils.aoa_to_sheet([journalHeaders, ...journalRows]);
            wsJournal["!cols"] = [{ wch: 14 }, { wch: 40 }, { wch: 60 }, { wch: 22 }];
            XLSX.utils.book_append_sheet(wb, wsJournal, "NHAT_KY_THUC_AN");

            const fileName = `TomCRM_NhatKy_${dateFrom}_${dateTo}.xlsx`;
            XLSX.writeFile(wb, fileName);

            addAuditLog("EXPORT", "EXPORT_JOURNAL", null, null, { dateFrom, dateTo, count: filteredJournals.length, fileName });
            showNotification(`Đã xuất ${filteredJournals.length} nhật ký thức ăn!`);
        } catch (err: any) {
            console.error(err);
            showNotification("Lỗi khi xuất Excel: " + err.message, "error");
        } finally {
            setExportingJournal(false);
        }
    };

    let previewExpense = 0;
    filtered.forEach(t => {
        if (t.flow === "EXPENSE") previewExpense += t.amount;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Date range filter (shared) */}
            <div className="bg-white rounded-[14px] border border-borderLight shadow-sm p-4">
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>
                    📅 Chọn khoảng thời gian
                </div>
                <div className="flex gap-2 mb-3">
                    <div className="flex-1">
                        <FormLabel>Từ ngày</FormLabel>
                        <FormInput type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                    </div>
                    <div className="flex-1">
                        <FormLabel>Đến ngày</FormLabel>
                        <FormInput type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Section 1: Financial Export */}
            <div className="bg-white rounded-[14px] border border-borderLight shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Icons.Download />
                    <div style={{ fontSize: 17, fontWeight: 700 }}>💰 Xuất dữ liệu tài chính</div>
                </div>
                <div style={{ fontSize: 14, color: '#8a9e96', marginBottom: 14 }}>
                    Xuất giao dịch thu/chi, tổng hợp theo danh mục
                </div>

                <div className="mb-3">
                    <FormLabel>Lọc theo ví</FormLabel>
                    <FormSelect value={filterWallet} onChange={e => setFilterWallet(e.target.value)}>
                        <option value="ALL">Tất cả ví</option>
                        {wallets.filter(w => w.is_active).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </FormSelect>
                </div>

                <div className="bg-surfaceAlt rounded-[10px] p-3.5 mb-4">
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#5a7068', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Xem trước</div>
                    <div className="grid grid-cols-2 gap-2" style={{ fontSize: 15 }}>
                        <div>Giao dịch: <b>{filtered.length}</b></div>
                        <div>Tổng chi: <b className="text-expense">{formatMoney(previewExpense)}đ</b></div>
                    </div>
                </div>

                <button
                    className="w-full flex justify-center items-center gap-2 p-4 bg-primary text-white rounded-lg font-bold text-[17px] hover:bg-primaryDark disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 transition-all"
                    onClick={handleExportFinance} disabled={exportingFinance || filtered.length === 0}>
                    <Icons.Download />
                    {exportingFinance ? "Đang xuất..." : filtered.length === 0 ? "Không có dữ liệu" : `Xuất tài chính (${filtered.length} giao dịch)`}
                </button>
            </div>

            {/* Section 2: Feed Journal Export */}
            <div className="bg-white rounded-[14px] border border-borderLight shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Icons.Download />
                    <div style={{ fontSize: 17, fontWeight: 700 }}>🦐 Xuất nhật ký thức ăn</div>
                </div>
                <div style={{ fontSize: 14, color: '#8a9e96', marginBottom: 14 }}>
                    Xuất nhật ký kèm hình ảnh (URL), thời gian, ghi chú
                </div>

                <div className="bg-surfaceAlt rounded-[10px] p-3.5 mb-4">
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#5a7068', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Xem trước</div>
                    <div style={{ fontSize: 15 }}>
                        Nhật ký: <b>{filteredJournals.length}</b> mục
                    </div>
                </div>

                <button
                    className="w-full flex justify-center items-center gap-2 p-4 bg-[#0d6e5b] text-white rounded-lg font-bold text-[17px] hover:bg-[#0a5548] disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 transition-all"
                    onClick={handleExportJournal} disabled={exportingJournal || filteredJournals.length === 0}>
                    <Icons.Download />
                    {exportingJournal ? "Đang xuất..." : filteredJournals.length === 0 ? "Không có nhật ký" : `Xuất nhật ký (${filteredJournals.length} mục)`}
                </button>
            </div>
        </div>
    );
}
