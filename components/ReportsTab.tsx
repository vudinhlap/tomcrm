import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Transaction, Wallet, Category } from '../types';
import { formatDate, formatMoney } from '../utils';
import { COLORS, CHART_COLORS } from '../constants';
import { useWalletRangeBalances } from '../hooks/useWalletBalance';
import { useSummary } from '../hooks/useSummary';
import { FormLabel, FormInput } from './ui';

interface ReportsTabProps {
  txns: Transaction[];
  wallets: Wallet[];
  categories: Category[];
}

export default function ReportsTab({ txns, wallets, categories }: ReportsTabProps) {
  const [reportType, setReportType] = useState("summary");
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(1); return formatDate(d); });
  const [dateTo, setDateTo] = useState(formatDate(new Date()));

  const filtered = useMemo(() => txns.filter(t => t.txn_date >= dateFrom && t.txn_date <= dateTo), [txns, dateFrom, dateTo]);

  const summary = useSummary(filtered);

  const byCategory = useMemo(() => {
    const map: Record<string, any> = {};
    filtered.filter(t => t.flow !== "TRANSFER").forEach(t => {
      const cat = categories.find(c => c.id === t.category_id);
      const key = `${t.flow}_${cat?.name || "Khác"}`;
      if (!map[key]) map[key] = { category: cat?.name || "Khác", flow: t.flow, total: 0 };
      map[key].total += t.amount;
    });
    return Object.values(map).sort((a: any, b: any) => b.total - a.total);
  }, [filtered, categories]);

  const dailyCashflow = useMemo(() => {
    const map: Record<string, any> = {};
    filtered.forEach(t => {
      if (!map[t.txn_date]) map[t.txn_date] = { date: t.txn_date, cash_in: 0, cash_out: 0 };
      if (t.flow === "INCOME") map[t.txn_date].cash_in += t.amount;
      if (t.flow === "EXPENSE") map[t.txn_date].cash_out += t.amount;
    });
    return Object.values(map).map((d: any) => ({ ...d, net: d.cash_in - d.cash_out })).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [filtered]);

  const walletBalances = useWalletRangeBalances(wallets, txns, dateFrom, dateTo);

  const reportTabs = [
    { key: "summary", label: "Tổng hợp" },
    { key: "cashflow", label: "Dòng tiền" },
    { key: "category", label: "Danh mục" },
    { key: "wallet", label: "Số dư ví" },
  ];

  return (
    <div className="p-4 animate-[fadeIn_0.3s_ease]">
      {/* Date filters */}
      <div className="bg-white rounded-[14px] border border-borderLight shadow-sm p-3 mb-3">
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <FormLabel>Từ ngày</FormLabel>
            <FormInput sizing="sm" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="flex-1">
            <FormLabel>Đến ngày</FormLabel>
            <FormInput sizing="sm" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Report type tabs */}
      <div className="flex gap-1 mb-3 overflow-x-auto">
        {reportTabs.map(rt => (
          <button key={rt.key} onClick={() => setReportType(rt.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs border-[1.5px] transition-all whitespace-nowrap font-semibold
              ${reportType === rt.key ? "bg-primary text-white border-primary" : "bg-white text-textSecondary border-border"}`}>
            {rt.label}
          </button>
        ))}
      </div>

      {/* Summary report */}
      {reportType === "summary" && (
        <div className="bg-white rounded-[14px] border border-borderLight shadow-sm p-5">
          <div className="text-[15px] font-bold mb-4">Báo cáo tổng hợp</div>
          <div className="grid gap-3">
            <div className="flex justify-between p-3 bg-incomeLight rounded-[10px]">
              <span className="font-semibold text-income">Tổng thu nhập</span>
              <span className="font-extrabold text-income text-base">{formatMoney(summary.income)}đ</span>
            </div>
            <div className="flex justify-between p-3 bg-expenseLight rounded-[10px]">
              <span className="font-semibold text-expense">Tổng chi phí</span>
              <span className="font-extrabold text-expense text-base">{formatMoney(summary.expense)}đ</span>
            </div>
            <div className={`flex justify-between p-3.5 rounded-[10px] border-2 
              ${summary.profit >= 0 ? "bg-incomeLight border-income" : "bg-expenseLight border-expense"}`}>
              <span className="font-bold text-[15px]">Lợi nhuận</span>
              <span className={`font-extrabold text-[18px] ${summary.profit >= 0 ? "text-income" : "text-expense"}`}>{formatMoney(summary.profit)}đ</span>
            </div>
          </div>
          <div className="mt-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[{ name: "Thu", value: summary.income }, { name: "Chi", value: summary.expense }]}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderLight} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => (v / 1000000).toFixed(0) + "M"} />
                <Tooltip formatter={(v: number) => formatMoney(v) + "đ"} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  <Cell fill={COLORS.income} />
                  <Cell fill={COLORS.expense} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Cashflow report */}
      {reportType === "cashflow" && (
        <div className="bg-white rounded-[14px] border border-borderLight shadow-sm p-5">
          <div className="text-[15px] font-bold mb-4">Dòng tiền theo ngày</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyCashflow}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderLight} />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => (v / 1000000).toFixed(0) + "M"} />
              <Tooltip formatter={(v: number) => formatMoney(v) + "đ"} labelFormatter={l => `Ngày ${l}`} />
              <Legend />
              <Bar dataKey="cash_in" name="Thu" fill={COLORS.income} radius={[4, 4, 0, 0]} />
              <Bar dataKey="cash_out" name="Chi" fill={COLORS.expense} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={dailyCashflow}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderLight} />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => (v / 1000000).toFixed(0) + "M"} />
                <Tooltip formatter={(v: number) => formatMoney(v) + "đ"} />
                <Line type="monotone" dataKey="net" name="Dòng tiền ròng" stroke={COLORS.primary} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left p-1.5 font-bold">Ngày</th>
                  <th className="text-right p-1.5 font-bold text-income">Thu</th>
                  <th className="text-right p-1.5 font-bold text-expense">Chi</th>
                  <th className="text-right p-1.5 font-bold">Ròng</th>
                </tr>
              </thead>
              <tbody>
                {dailyCashflow.map((d: any) => (
                  <tr key={d.date} className="border-b border-borderLight">
                    <td className="p-1.5">{d.date}</td>
                    <td className="text-right p-1.5 text-income">{formatMoney(d.cash_in)}</td>
                    <td className="text-right p-1.5 text-expense">{formatMoney(d.cash_out)}</td>
                    <td className={`text-right p-1.5 font-bold ${d.net >= 0 ? "text-income" : "text-expense"}`}>{formatMoney(d.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category report */}
      {reportType === "category" && (
        <div className="bg-white rounded-[14px] border border-borderLight shadow-sm p-5">
          <div className="text-[15px] font-bold mb-4">Chi tiết theo danh mục</div>
          {["INCOME", "EXPENSE"].map(flow => {
            const items = byCategory.filter((c: any) => c.flow === flow);
            const total = items.reduce((s: number, i: any) => s + i.total, 0);
            if (items.length === 0) return null;
            return (
              <div key={flow} className="mb-5">
                <div className={`text-[13px] font-bold mb-2 ${flow === "INCOME" ? "text-income" : "text-expense"}`}>
                  {flow === "INCOME" ? "Thu nhập" : "Chi phí"} — {formatMoney(total)}đ
                </div>
                {items.map((item: any, i: number) => {
                  const pct = total > 0 ? (item.total / total * 100) : 0;
                  return (
                    <div key={i} className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">{item.category}</span>
                        <span className="font-bold">{formatMoney(item.total)}đ ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="h-1.5 bg-surfaceAlt rounded-full">
                        <div className={`h-full rounded-full transition-all duration-500 ${flow === "INCOME" ? "bg-income" : "bg-expense"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
          {byCategory.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byCategory.filter((c: any) => c.flow === "EXPENSE")} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={80} innerRadius={40} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10 }}>
                  {byCategory.filter((c: any) => c.flow === "EXPENSE").map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatMoney(v) + "đ"} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Wallet balance report */}
      {reportType === "wallet" && (
        <div className="bg-white rounded-[14px] border border-borderLight shadow-sm p-5">
          <div className="text-[15px] font-bold mb-4">Số dư ví</div>
          {walletBalances.map((w, i) => (
            <div key={i} className="p-3.5 bg-surfaceAlt rounded-[10px] mb-2">
              <div className="text-sm font-bold mb-2">{w.name}</div>
              <div className="flex justify-between">
                <div>
                  <div className="text-[11px] text-textMuted">Đầu kỳ</div>
                  <div className="text-[15px] font-bold">{formatMoney(w.balance_open)}đ</div>
                </div>
                <div className="text-[20px] text-textMuted flex items-center">→</div>
                <div className="text-right">
                  <div className="text-[11px] text-textMuted">Cuối kỳ</div>
                  <div className="text-[15px] font-bold text-primary">{formatMoney(w.balance_close)}đ</div>
                </div>
              </div>
              <div className={`text-xs font-semibold mt-1 text-center ${w.balance_close - w.balance_open >= 0 ? "text-income" : "text-expense"}`}>
                {w.balance_close - w.balance_open >= 0 ? "+" : ""}{formatMoney(w.balance_close - w.balance_open)}đ
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}