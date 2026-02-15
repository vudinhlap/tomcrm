import React from 'react';
import { Transaction, Wallet, Category, CustomField, AuditLog, FeedJournal } from '../types';
import CategoriesSettings from './settings/CategoriesSettings';
import WalletsSettings from './settings/WalletsSettings';
import CustomFieldsSettings from './settings/CustomFieldsSettings';
import ExportExcelTab from './settings/ExportExcelTab';
import AuditLogView from './settings/AuditLogView';

interface SupabaseDataProps {
  addWallet: (w: Omit<Wallet, 'id'>) => Promise<Wallet | null>;
  updateWallet: (id: string, updates: Partial<Wallet>) => Promise<boolean>;
  deleteWallet: (id: string) => Promise<boolean>;
  addCategory: (c: Omit<Category, 'id'>) => Promise<Category | null>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  addCustomField: (cf: Omit<CustomField, 'id'>) => Promise<CustomField | null>;
  updateCustomField: (id: string, updates: Partial<CustomField>) => Promise<boolean>;
  deleteCustomField: (id: string) => Promise<boolean>;
}

interface SettingsTabProps {
  subTab: string;
  setSubTab: (t: string) => void;
  wallets: Wallet[];
  setWallets: any; // kept for backward compat, unused
  categories: Category[];
  setCategories: any;
  customFields: CustomField[];
  setCustomFields: any;
  auditLogs: AuditLog[];
  showNotification: (msg: string, type?: "success" | "error") => void;
  addAuditLog: (action: any, entity: string, entity_id: any, before_data: any, after_data: any) => void;
  transactions: Transaction[];
  feedJournals: FeedJournal[];
  readOnly?: boolean;
  supabaseData?: SupabaseDataProps;
}

export default function SettingsTab({
  subTab, setSubTab, wallets, categories, customFields,
  auditLogs, showNotification, addAuditLog, transactions,
  feedJournals, readOnly, supabaseData,
}: SettingsTabProps) {
  const subTabs = [
    { key: "categories", label: "Danh mục" },
    { key: "wallets", label: "Ví" },
    { key: "export", label: "Xuất Excel" },
    { key: "auditlog", label: "Nhật ký" },
  ];

  return (
    <div className="p-4 animate-[fadeIn_0.3s_ease]">
      {readOnly && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '8px 14px', marginBottom: 12, fontSize: 12, color: '#9a3412', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          🔒 Chế độ chỉ đọc — bạn không thể thêm hoặc sửa dữ liệu
        </div>
      )}
      <div className="flex gap-1 mb-3.5 overflow-x-auto">
        {subTabs.map(st => (
          <button key={st.key} onClick={() => setSubTab(st.key)}
            className={`px-4 py-2 whitespace-nowrap rounded-lg text-sm font-semibold border-[1.5px] transition-all
              ${subTab === st.key ? "bg-primary text-white border-primary" : "bg-white text-textSecondary border-border"}`}>
            {st.label}
          </button>
        ))}
      </div>

      {subTab === "categories" && (
        <CategoriesSettings
          categories={categories} showNotification={showNotification} addAuditLog={addAuditLog}
          onAdd={supabaseData?.addCategory} onUpdate={supabaseData?.updateCategory} onDelete={supabaseData?.deleteCategory}
          readOnly={readOnly}
        />
      )}
      {subTab === "wallets" && (
        <WalletsSettings
          wallets={wallets} showNotification={showNotification} addAuditLog={addAuditLog}
          onAdd={supabaseData?.addWallet} onUpdate={supabaseData?.updateWallet} onDelete={supabaseData?.deleteWallet}
          readOnly={readOnly}
        />
      )}
      {subTab === "customfields" && (
        <CustomFieldsSettings
          customFields={customFields} showNotification={showNotification} addAuditLog={addAuditLog}
          onAdd={supabaseData?.addCustomField} onUpdate={supabaseData?.updateCustomField} onDelete={supabaseData?.deleteCustomField}
          readOnly={readOnly}
        />
      )}
      {subTab === "export" && <ExportExcelTab transactions={transactions} wallets={wallets} categories={categories} customFields={customFields} auditLogs={auditLogs} feedJournals={feedJournals} showNotification={showNotification} addAuditLog={addAuditLog} />}
      {subTab === "auditlog" && <AuditLogView auditLogs={auditLogs} />}
    </div>
  );
}