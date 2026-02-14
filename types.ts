export type TransactionFlow = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface Wallet {
  id: string;
  name: string;
  type: 'CASH' | 'BANK';
  opening_balance: number;
  is_active: boolean;
  balance?: number; // Calculated field
}

export interface Category {
  id: string;
  name: string;
  flow: 'INCOME' | 'EXPENSE';
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface CustomFieldConfig {
  options?: string[];
}

export interface CustomField {
  id: string;
  field_key: string;
  field_name: string;
  field_type: 'text' | 'number' | 'date' | 'single_select' | 'multi_select';
  config: CustomFieldConfig;
  is_active: boolean;
  sort_order: number;
}

export interface Transaction {
  id: string;
  txn_date: string;
  flow: TransactionFlow;
  amount: number;
  wallet_id: string;
  to_wallet_id: string | null;
  category_id: string | null;
  note: string;
  custom_fields: Record<string, any>;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'UNDO' | 'EXPORT';
  entity: string;
  entity_id: string | null;
  before_data: any;
  after_data: any;
  created_at: string;
}

export interface NotificationState {
  msg: string;
  type: 'success' | 'error';
}