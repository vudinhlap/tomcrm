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
  const flow: TransactionFlow = "EXPENSE";
  const [amount, setAmount] = useState("");
  const [walletId, setWalletId] = useState(wallets[0]?.id || "");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [txnDate, setTxnDate] = useState(formatDate(new Date()));
  const [cfValues, setCfValues] = useState<Record<string, any>>({});

  const filteredCats = categories.filter(c => c.flow === "EXPENSE" && c.is_active);
  const activeFields = customFields.filter(f => f.is_active);

  const handleSave = () => {
    const numAmount = parseAmount(amount);
    if (!amount || numAmount <= 0) return;
    if (!categoryId) return;

    const txn: Transaction = {
      id: generateId(),
      txn_date: txnDate,
      flow,
      amount: numAmount,
      wallet_id: walletId,
      to_wallet_id: null,
      category_id: categoryId,
      note,
      custom_fields: cfValues,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
    };
    onSave(txn);
    setAmount(""); setNote(""); setCfValues({});
  };

  return (
    <div className="p-4 animate-[fadeIn_0.3s_ease]">
      <div className="bg-white rounded-[14px] border border-borderLight shadow-sm p-5">
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Nhập chi phí</div>

        {/* Amount */}
        <div className="mb-3.5">
          <FormLabel>Số tiền (VNĐ)</FormLabel>
          <FormInput sizing="lg"
            className="text-expense font-numeric text-3xl font-bold h-16"
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
          <FormLabel>Ví</FormLabel>
          <FormSelect value={walletId} onChange={e => setWalletId(e.target.value)}>
            {wallets.filter(w => w.is_active).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </FormSelect>
        </div>

        {/* Category */}
        <div className="mb-3.5">
          <FormLabel>Danh mục</FormLabel>
          <FormSelect value={categoryId} onChange={e => setCategoryId(e.target.value)}>
            <option value="">-- Chọn danh mục --</option>
            {filteredCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </FormSelect>
        </div>

        {/* Custom fields */}
        {activeFields.length > 0 && (
          <div className="border-t border-borderLight pt-3.5 mb-3.5">
            <div style={{ fontSize: 14, fontWeight: 700, color: '#8a9e96', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thông tin thêm</div>
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
          <textarea className="w-full p-3 border-[1.5px] border-border rounded-lg bg-surface text-base transition-all resize-y focus:outline-none focus:ring-4 focus:ring-primaryLight focus:border-primary"
            value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Nhập ghi chú..." />
        </div>

        <button className="w-full flex justify-center items-center gap-2 p-5 bg-primary text-white rounded-xl font-bold text-xl hover:bg-primaryDark active:scale-95 transition-all shadow-lg" onClick={handleSave}>
          <Icons.Check /> Lưu chi phí
        </button>
      </div>
    </div>
  );
}