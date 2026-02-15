import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Transaction, Wallet, Category } from '../types';
import { formatMoney, formatDate } from '../utils';
import { COLORS } from '../constants';
import { useSummary } from '../hooks/useSummary';

const PIE_COLORS = ['#c4432b', '#e67e22', '#2980b9', '#8e44ad', '#27ae60', '#d35400', '#16a085', '#c0392b', '#7f8c8d', '#f39c12'];

interface OverviewTabProps {
  txns: Transaction[];
  wallets: Wallet[];
  categories: Category[];
}

export default function OverviewTab({ txns, wallets, categories }: OverviewTabProps) {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [dateFrom, setDateFrom] = useState(formatDate(thirtyDaysAgo));
  const [dateTo, setDateTo] = useState(formatDate(today));

  // All time expenses
  const allExpenses = useMemo(() => txns.filter(t => t.flow === "EXPENSE"), [txns]);
  const totalExpense = useMemo(() => allExpenses.reduce((s, t) => s + t.amount, 0), [allExpenses]);

  // Expense by category for pie chart
  const expenseByCategory = useMemo(() => {
    const map: Record<string, { name: string; value: number }> = {};
    allExpenses.forEach(t => {
      const cat = categories.find(c => c.id === t.category_id);
      const name = cat?.name || "Khác";
      if (!map[name]) map[name] = { name, value: 0 };
      map[name].value += t.amount;
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [allExpenses, categories]);

  // Filter transactions for chart by date range
  const rangeTxns = useMemo(() => {
    return txns.filter(t => {
      const d = t.txn_date;
      return d >= dateFrom && d <= dateTo;
    });
  }, [txns, dateFrom, dateTo]);

  const rangeSummary = useSummary(rangeTxns);

  const dailyData = useMemo(() => {
    const map: Record<string, any> = {};
    rangeTxns.forEach(t => {
      if (!map[t.txn_date]) map[t.txn_date] = { date: t.txn_date, income: 0, expense: 0 };
      if (t.flow === "INCOME") map[t.txn_date].income += t.amount;
      if (t.flow === "EXPENSE") map[t.txn_date].expense += t.amount;
    });
    return Object.values(map).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [rangeTxns]);

  return (
    <div className="p-4 animate-[fadeIn_0.3s_ease]">
      {/* Chi phí label card */}
      <div style={{
        background: 'linear-gradient(135deg, #c4432b 0%, #e05a43 100%)',
        borderRadius: 18,
        padding: '32px 24px 20px',
        marginBottom: 16,
        textAlign: 'center',
        color: '#fff',
        boxShadow: '0 8px 32px rgba(196,67,43,0.25)',
      }}>
        <div style={{
          fontSize: 20,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: 4,
          opacity: 0.9,
          marginBottom: 6,
        }}>Chi phí</div>
        <div style={{
          fontSize: 16,
          opacity: 0.8,
          fontWeight: 600,
        }}>Tổng chi tiêu tất cả</div>
      </div>

      {/* Amount card */}
      <div style={{
        background: '#fff',
        borderRadius: 18,
        padding: '28px 20px',
        marginBottom: 16,
        textAlign: 'center',
        border: '1.5px solid #e8efeb',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          fontSize: 42,
          fontWeight: 700,
          color: '#c4432b',
          fontFamily: '"Outfit", sans-serif',
          letterSpacing: -1,
        }}>
          {formatMoney(totalExpense)}đ
        </div>
      </div>

      {/* Expense by category pie chart */}
      {expenseByCategory.length > 0 && (
        <div className="bg-white rounded-[14px] border border-borderLight shadow-sm p-4 mb-4">
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
            Chi phí theo danh mục
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={expenseByCategory}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {expenseByCategory.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatMoney(v) + "đ"} />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {expenseByCategory.map((item, i) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: 3,
                  background: PIE_COLORS[i % PIE_COLORS.length],
                  flexShrink: 0,
                }} />
                <span style={{ fontWeight: 600, color: '#1a2e28' }}>{item.name}</span>
                <span className="font-numeric" style={{ color: '#8a9e96', fontWeight: 500 }}>{formatMoney(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cash flow chart with date range */}
      <div className="bg-white rounded-[14px] border border-borderLight shadow-sm p-4 mb-4">
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
          Dòng tiền
        </div>

        {/* Date range picker */}
        <div style={{
          display: 'flex',
          gap: 10,
          marginBottom: 16,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: '#5a7068', display: 'block', marginBottom: 6 }}>Từ ngày</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1.5px solid #d4e0db',
                borderRadius: 10,
                fontSize: 16,
                background: '#f7faf9',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: '#5a7068', display: 'block', marginBottom: 6 }}>Đến ngày</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1.5px solid #d4e0db',
                borderRadius: 10,
                fontSize: 16,
                background: '#f7faf9',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Summary for range — only Chi (expense) */}
        <div style={{
          display: 'flex',
          gap: 10,
          marginBottom: 14,
        }}>
          <div style={{
            flex: 1,
            background: '#fce8e4',
            borderRadius: 12,
            padding: '12px 14px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 13, color: '#5a7068', fontWeight: 700 }}>Chi trong kỳ</div>
            <div className="font-numeric" style={{ fontSize: 24, fontWeight: 700, color: '#c4432b' }}>{formatMoney(rangeSummary.expense)}đ</div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
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
            <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={v => v.slice(5)} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => (v / 1000000).toFixed(0) + "M"} />
            <Tooltip formatter={(v: number) => formatMoney(v) + "đ"} labelFormatter={l => `Ngày ${l}`} />
            <Area type="monotone" dataKey="income" stroke={COLORS.income} fill="url(#gIncome)" strokeWidth={2} name="Thu" />
            <Area type="monotone" dataKey="expense" stroke={COLORS.expense} fill="url(#gExpense)" strokeWidth={2} name="Chi" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}