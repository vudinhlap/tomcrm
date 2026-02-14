import React, { useMemo } from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Transaction, Wallet, Category } from '../types';
import { formatMoney } from '../utils';
import { COLORS, CHART_COLORS, flowColor } from '../constants';
import { useWalletBalances } from '../hooks/useWalletBalance';
import { useSummary } from '../hooks/useSummary';

interface OverviewTabProps {
  txns: Transaction[];
  wallets: Wallet[];
  categories: Category[];
}

export default function OverviewTab({ txns, wallets, categories }: OverviewTabProps) {
  const today = new Date();

  const last30 = useMemo(() => {
    const from = new Date(today);
    from.setDate(from.getDate() - 30);
    return txns.filter(t => new Date(t.txn_date) >= from);
  }, [txns]);

  const summary = useSummary(last30);
  const walletBalances = useWalletBalances(wallets, txns);

  const dailyData = useMemo(() => {
    const map: Record<string, any> = {};
    last30.forEach(t => {
      if (!map[t.txn_date]) map[t.txn_date] = { date: t.txn_date, income: 0, expense: 0 };
      if (t.flow === "INCOME") map[t.txn_date].income += t.amount;
      if (t.flow === "EXPENSE") map[t.txn_date].expense += t.amount;
    });
    return Object.values(map).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [last30]);

  const topExpenses = useMemo(() => {
    const map: Record<string, number> = {};
    last30.filter(t => t.flow === "EXPENSE").forEach(t => {
      const cat = categories.find(c => c.id === t.category_id);
      const name = cat?.name || "Khác";
      map[name] = (map[name] || 0) + t.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [last30, categories]);

  const totalWalletBalance = walletBalances.reduce((s, w) => s + (w.balance || 0), 0);

  return (
    <div className="p-4 animate-[fadeIn_0.3s_ease]">
      {/* Total Balance */}
      <div className="bg-gradient-to-br from-primaryDark to-primary text-white p-6 mb-4 rounded-[14px] text-center shadow-lg border-none">
        <div className="text-xs font-semibold opacity-80 uppercase tracking-widest">Tổng số dư</div>
        <div className="text-[32px] font-extrabold mt-1 font-serif">
          {formatMoney(totalWalletBalance)}đ
        </div>
        <div className="flex gap-4 justify-center mt-4 flex-wrap">
          {walletBalances.map(w => (
            <div key={w.id} className="bg-white/15 rounded-lg py-2 px-4 backdrop-blur-sm">
              <div className="text-[11px] opacity-80">{w.name}</div>
              <div className="text-[15px] font-bold">{formatMoney(w.balance)}đ</div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <div className="bg-white rounded-[14px] border border-borderLight shadow-sm p-3.5 hover:shadow-md transition-shadow">
          <div className="text-[11px] text-textMuted font-semibold">Thu nhập</div>
          <div className="text-[17px] font-extrabold text-income mt-0.5">{formatMoney(summary.income)}</div>
        </div>
        <div className="bg-white rounded-[14px] border border-borderLight shadow-sm p-3.5 hover:shadow-md transition-shadow">
          <div className="text-[11px] text-textMuted font-semibold">Chi phí</div>
          <div className="text-[17px] font-extrabold text-expense mt-0.5">{formatMoney(summary.expense)}</div>
        </div>
        <div className="bg-white rounded-[14px] border border-borderLight shadow-sm p-3.5 hover:shadow-md transition-shadow">
          <div className="text-[11px] text-textMuted font-semibold">Lợi nhuận</div>
          <div className={`text-[17px] font-extrabold mt-0.5 ${summary.profit >= 0 ? "text-income" : "text-expense"}`}>
            {formatMoney(summary.profit)}
          </div>
        </div>
      </div>

      {/* Cash flow chart */}
      <div className="bg-white rounded-[14px] border border-borderLight shadow-sm p-4 mb-4">
        <div className="text-sm font-bold mb-3 flex items-center gap-1.5">
          Dòng tiền 30 ngày
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={dailyData}>
            <defs>
              <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.income} stopOpacity={0.3} />
                <stop offset="100%" stopColor={COLORS.income} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.expense} stopOpacity={0.3} />
                <stop offset="100%" stopColor={COLORS.expense} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderLight} />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => (v / 1000000).toFixed(0) + "M"} />
            <Tooltip formatter={(v: number) => formatMoney(v) + "đ"} labelFormatter={l => `Ngày ${l}`} />
            <Area type="monotone" dataKey="income" stroke={COLORS.income} fill="url(#gIncome)" strokeWidth={2} name="Thu" />
            <Area type="monotone" dataKey="expense" stroke={COLORS.expense} fill="url(#gExpense)" strokeWidth={2} name="Chi" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top expenses */}
      {topExpenses.length > 0 && (
        <div className="bg-white rounded-[14px] border border-borderLight shadow-sm p-4">
          <div className="text-sm font-bold mb-3">Chi phí theo danh mục</div>
          <div className="flex gap-4 items-center">
            <div className="w-[120px] h-[120px] shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={topExpenses} dataKey="value" cx="50%" cy="50%" outerRadius={55} innerRadius={30}>
                    {topExpenses.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 text-xs">
              {topExpenses.slice(0, 5).map((e, i) => (
                <div key={i} className={`flex justify-between items-center py-1 ${i < 4 ? "border-b border-borderLight" : ""}`}>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="font-medium">{e.name}</span>
                  </div>
                  <span className="font-bold text-expense">{formatMoney(e.value)}đ</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="bg-white rounded-[14px] border border-borderLight shadow-sm p-4 mt-4">
        <div className="text-sm font-bold mb-2.5">Giao dịch gần đây</div>
        {txns.slice(0, 5).map(t => {
          const cat = categories.find(c => c.id === t.category_id);
          const w = wallets.find(w2 => w2.id === t.wallet_id);
          return (
            <div key={t.id} className="flex justify-between items-center py-2 border-b border-borderLight last:border-0">
              <div>
                <div className="text-[13px] font-semibold">{t.flow === "TRANSFER" ? "Chuyển khoản" : cat?.name || "—"}</div>
                <div className="text-[11px] text-textMuted">{t.txn_date} · {w?.name}</div>
              </div>
              <div className={`text-sm font-bold ${flowColor(t.flow)}`}>
                {t.flow === "INCOME" ? "+" : t.flow === "EXPENSE" ? "-" : ""}{formatMoney(t.amount)}đ
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}