import React, { useState } from 'react';
import { Transaction, Wallet, Category, CustomField, TransactionFlow } from '../types';
import { generateId, formatDate, formatAmountInput, parseAmount } from '../utils';
import { Icons } from './Icons';
import { FormLabel, FormInput, FormSelect } from './ui';

interface InputTabProps {
  wallets: Wallet[];
  categories: Category[];
  customFields: CustomField[];
  onSave: (txn: Transaction) => void;
}

export default function InputTab({ wallets, categories, customFields, onSave }: InputTabProps) {
  const [flow, setFlow] = useState<TransactionFlow>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [walletId, setWalletId] = useState(wallets[0]?.id || "");
  const [toWalletId, setToWalletId] = useState(wallets[1]?.id || "");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [txnDate, setTxnDate] = useState(formatDate(new Date()));
  const [cfValues, setCfValues] = useState<Record<string, any>>({});

  const filteredCats = categories.filter(c => c.flow === flow && c.is_active);
  const activeFields = customFields.filter(f => f.is_active);

  const handleSave = () => {
    const numAmount = parseAmount(amount);
    if (!amount || numAmount <= 0) return;
    if (flow !== "TRANSFER" && !categoryId) return;
    if (flow === "TRANSFER" && walletId === toWalletId) return;

    const txn: Transaction = {
      id: generateId(),
      txn_date: txnDate,
      flow,
      amount: numAmount,
      wallet_id: walletId,
      to_wallet_id: flow === "TRANSFER" ? toWalletId : null,
      category_id: flow === "TRANSFER" ? null : categoryId,
      note,
      custom_fields: cfValues,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
    };
    onSave(txn);
    setAmount(""); setNote(""); setCfValues({});
  };

  const flowBtns = [
    { key: "EXPENSE" as const, label: "Chi", color: "text-expense", bg: "bg-expenseLight", border: "border-expense" },
    { key: "INCOME" as const, label: "Thu", color: "text-income", bg: "bg-incomeLight", border: "border-income" },
    { key: "TRANSFER" as const, label: "Chuyển", color: "text-transfer", bg: "bg-transferLight", border: "border-transfer" },
  ];

  return (
    <div className="p-4 animate-[fadeIn_0.3s_ease]">
      <div className="bg-white rounded-[14px] border border-borderLight shadow-sm p-5">
        <div className="text-base font-bold mb-4">Nhập giao dịch mới</div>

        {/* Flow selector */}
        <div className="flex gap-2 mb-5 bg-surfaceAlt p-1 rounded-[10px]">
          {flowBtns.map(f => (
            <button key={f.key}
              onClick={() => { setFlow(f.key); setCategoryId(""); }}
              className={`flex-1 flex justify-center py-2.5 px-2 rounded-lg text-sm transition-all duration-200 border-2
                ${flow === f.key ? `${f.bg} ${f.color} ${f.border} font-bold` : "bg-transparent text-textMuted border-transparent font-medium"}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="mb-3.5">
          <FormLabel>Số tiền (VNĐ)</FormLabel>
          <FormInput sizing="lg"
            className={flow === "INCOME" ? "text-income" : flow === "EXPENSE" ? "text-expense" : "text-transfer"}
            type="text" inputMode="numeric" value={amount} onChange={e => setAmount(formatAmountInput(e.target.value))}
            placeholder="0" />
        </div>

        {/* Date */}
        <div className="mb-3.5">
          <FormLabel>Ngày</FormLabel>
          <FormInput type="date" value={txnDate} onChange={e => setTxnDate(e.target.value)} />
        </div>

        {/* Wallet */}
        <div className="mb-3.5">
          <FormLabel>{flow === "TRANSFER" ? "Ví nguồn" : "Ví"}</FormLabel>
          <FormSelect value={walletId} onChange={e => setWalletId(e.target.value)}>
            {wallets.filter(w => w.is_active).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </FormSelect>
        </div>

        {flow === "TRANSFER" && (
          <div className="mb-3.5">
            <FormLabel>Ví đích</FormLabel>
            <FormSelect value={toWalletId} onChange={e => setToWalletId(e.target.value)}>
              {wallets.filter(w => w.is_active && w.id !== walletId).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </FormSelect>
          </div>
        )}

        {/* Category */}
        {flow !== "TRANSFER" && (
          <div className="mb-3.5">
            <FormLabel>Danh mục</FormLabel>
            <FormSelect value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              <option value="">-- Chọn danh mục --</option>
              {filteredCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </FormSelect>
          </div>
        )}

        {/* Custom fields */}
        {activeFields.length > 0 && flow !== "TRANSFER" && (
          <div className="border-t border-borderLight pt-3.5 mb-3.5">
            <div className="text-xs font-bold text-textMuted mb-2 uppercase tracking-wider">Thông tin thêm</div>
            {activeFields.map(f => (
              <div key={f.id} className="mb-2.5">
                <FormLabel>{f.field_name}</FormLabel>
                {f.field_type === "single_select" ? (
                  <FormSelect value={cfValues[f.field_key] || ""} onChange={e => setCfValues(prev => ({ ...prev, [f.field_key]: e.target.value }))}>
                    <option value="">-- Chọn --</option>
                    {(f.config.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                  </FormSelect>
                ) : f.field_type === "number" ? (
                  <FormInput type="number" value={cfValues[f.field_key] || ""} onChange={e => setCfValues(prev => ({ ...prev, [f.field_key]: e.target.value }))} />
                ) : (
                  <FormInput type="text" value={cfValues[f.field_key] || ""} onChange={e => setCfValues(prev => ({ ...prev, [f.field_key]: e.target.value }))} placeholder={f.field_name} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Note */}
        <div className="mb-4.5">
          <FormLabel>Ghi chú</FormLabel>
          <textarea className="w-full p-2.5 border-[1.5px] border-border rounded-lg bg-surface text-sm transition-all resize-y focus:outline-none focus:ring-4 focus:ring-primaryLight focus:border-primary"
            value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Nhập ghi chú..." />
        </div>

        <button className="w-full flex justify-center items-center gap-1.5 p-3.5 bg-primary text-white rounded-lg font-semibold text-[15px] hover:bg-primaryDark active:scale-95 transition-all" onClick={handleSave}>
          <Icons.Check /> Lưu giao dịch
        </button>
      </div>
    </div>
  );
}