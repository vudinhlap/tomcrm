import React, { useState, useMemo } from 'react';
import { Transaction, Wallet, Category, CustomField } from '../types';
import { formatMoney } from '../utils';
import { Icons } from './Icons';
import { flowColor, flowBg, flowLabel } from '../constants';
import { EmptyState } from './ui';

interface TransactionListTabProps {
  txns: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  customFields: CustomField[];
  onDelete?: (id: string) => void;
}

export default function TransactionListTab({ txns, wallets, categories, customFields, onDelete }: TransactionListTabProps) {
  const [search, setSearch] = useState("");
  const [filterFlow, setFilterFlow] = useState<string>("ALL");
  const [filterWallet, setFilterWallet] = useState("ALL");

  const filtered = useMemo(() => {
    return txns.filter(t => {
      if (filterFlow !== "ALL" && t.flow !== filterFlow) return false;
      if (filterWallet !== "ALL" && t.wallet_id !== filterWallet) return false;
      if (search) {
        const q = search.toLowerCase();
        const cat = categories.find(c => c.id === t.category_id);
        const w = wallets.find(w2 => w2.id === t.wallet_id);
        const haystack = `${cat?.name || ""} ${t.note || ""} ${w?.name || ""} ${JSON.stringify(t.custom_fields)}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => b.txn_date.localeCompare(a.txn_date) || b.created_at.localeCompare(a.created_at));
  }, [txns, filterFlow, filterWallet, search, categories, wallets]);

  return (
    <div className="p-4 animate-[fadeIn_0.3s_ease]">
      {/* Search & filters */}
      <div className="bg-white rounded-[14px] border border-borderLight shadow-sm p-3 mb-3">
        <div className="relative mb-2.5">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-textMuted"><Icons.Search /></span>
          <input className="w-full py-3 pr-3 pl-9 border-[1.5px] border-border rounded-lg bg-surface text-base transition-all focus:outline-none focus:ring-4 focus:ring-primaryLight focus:border-primary"
            value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm..." />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["ALL", "INCOME", "EXPENSE", "TRANSFER"].map(f => {
            const isActive = filterFlow === f;
            const isAll = f === "ALL";
            const baseClass = "px-3.5 py-2 rounded-lg text-[13px] font-bold border-[1.5px] transition-all";
            let activeClass = "";
            if (isActive) {
              if (isAll) activeClass = "bg-primaryLight text-primary border-primary";
              else if (f === "INCOME") activeClass = "bg-incomeLight text-income border-income";
              else if (f === "EXPENSE") activeClass = "bg-expenseLight text-expense border-expense";
              else if (f === "TRANSFER") activeClass = "bg-transferLight text-transfer border-transfer";
            } else {
              activeClass = "bg-surfaceAlt text-textMuted border-transparent";
            }

            return (
              <button key={f} className={`${baseClass} ${activeClass}`} onClick={() => setFilterFlow(f)}>
                {f === "ALL" ? "Tất cả" : flowLabel(f as any)}
              </button>
            );
          })}
          <select className="px-2.5 py-2 border-[1.5px] border-border rounded-lg bg-surface text-[13px] flex-1 min-w-[80px]"
            value={filterWallet} onChange={e => setFilterWallet(e.target.value)}>
            <option value="ALL">Tất cả ví</option>
            {wallets.filter(w => w.is_active).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
      </div>

      <div className="text-sm text-textMuted mb-2 font-semibold">{filtered.length} giao dịch</div>

      {/* Transaction list */}
      {filtered.map(t => {
        const cat = categories.find(c => c.id === t.category_id);
        const w = wallets.find(w2 => w2.id === t.wallet_id);
        const tw = wallets.find(w2 => w2.id === t.to_wallet_id);
        const cf = t.custom_fields || {};
        const cfEntries = Object.entries(cf).filter(([, v]) => v);

        return (
          <div key={t.id} className="bg-white rounded-[14px] border border-borderLight shadow-sm p-3.5 mb-2 animate-[slideIn_0.3s_ease]">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`px-3 py-1 rounded-full text-[13px] font-bold tracking-wide flex items-center gap-1 ${flowBg(t.flow)} ${flowColor(t.flow)}`}>
                    {t.flow === "INCOME" && <Icons.ArrowUp />}
                    {t.flow === "EXPENSE" && <Icons.ArrowDown />}
                    {t.flow === "TRANSFER" && <Icons.Transfer />}
                    {flowLabel(t.flow)}
                  </span>
                  <span className="text-sm text-textMuted">{t.txn_date}</span>
                </div>
                <div className="text-base font-bold mb-1">
                  {t.flow === "TRANSFER" ? `${w?.name} → ${tw?.name}` : cat?.name || "—"}
                </div>
                {t.note && <div className="text-sm text-textSecondary mb-1">{t.note}</div>}
                <div className="text-[13px] text-textMuted flex items-center gap-1">
                  <Icons.Wallet /> {w?.name}
                  {cfEntries.length > 0 && (
                    <span className="ml-1.5">
                      {cfEntries.map(([k, v]) => `${k}: ${v}`).join(" · ")}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold font-numeric ${flowColor(t.flow)}`}>
                  {t.flow === "INCOME" ? "+" : t.flow === "EXPENSE" ? "-" : ""}{formatMoney(t.amount)}đ
                </div>
                {onDelete && (
                  <button className="flex items-center gap-1 bg-expenseLight text-danger hover:bg-danger hover:text-white rounded px-2.5 py-1 text-[12px] mt-1 ml-auto transition-colors"
                    onClick={() => onDelete(t.id)}>
                    <Icons.Delete /> Xoá
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {filtered.length === 0 && <EmptyState message="Không có giao dịch nào" />}
    </div>
  );
}