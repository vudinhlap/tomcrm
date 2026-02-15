import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Wallet, Category, CustomField, Transaction, AuditLog, FeedJournal } from '../types';

interface SupabaseData {
    wallets: Wallet[];
    categories: Category[];
    customFields: CustomField[];
    transactions: Transaction[];
    auditLogs: AuditLog[];
    feedJournals: FeedJournal[];
    loading: boolean;
    /* CRUD */
    addWallet: (w: Omit<Wallet, 'id'>) => Promise<Wallet | null>;
    updateWallet: (id: string, updates: Partial<Wallet>) => Promise<boolean>;
    deleteWallet: (id: string) => Promise<boolean>;
    addCategory: (c: Omit<Category, 'id'>) => Promise<Category | null>;
    updateCategory: (id: string, updates: Partial<Category>) => Promise<boolean>;
    deleteCategory: (id: string) => Promise<boolean>;
    addCustomField: (cf: Omit<CustomField, 'id'>) => Promise<CustomField | null>;
    updateCustomField: (id: string, updates: Partial<CustomField>) => Promise<boolean>;
    deleteCustomField: (id: string) => Promise<boolean>;
    addTransaction: (t: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => Promise<Transaction | null>;
    softDeleteTransaction: (id: string) => Promise<boolean>;
    addAuditLog: (log: Omit<AuditLog, 'id' | 'created_at'>) => Promise<void>;
    addFeedJournal: (entry: { journal_date: string; image_url: string; note: string; tags: string[] }) => Promise<FeedJournal | null>;
    deleteFeedJournal: (id: string) => Promise<boolean>;
    uploadFeedImage: (file: File) => Promise<string | null>;
    refresh: () => Promise<void>;
}

export function useSupabaseData(ownerId: string | null): SupabaseData {
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [feedJournals, setFeedJournals] = useState<FeedJournal[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        if (!ownerId) return;
        setLoading(true);

        const [wRes, cRes, cfRes, tRes, aRes, fjRes] = await Promise.all([
            supabase.from('wallets').select('*').eq('owner_id', ownerId).order('created_at'),
            supabase.from('categories').select('*').eq('owner_id', ownerId).order('sort_order'),
            supabase.from('custom_fields').select('*').eq('owner_id', ownerId).order('sort_order'),
            supabase.from('transactions').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false }),
            supabase.from('audit_logs').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false }).limit(200),
            supabase.from('feed_journals').select('*').eq('owner_id', ownerId).order('journal_date', { ascending: false }),
        ]);

        if (wRes.data) setWallets(wRes.data.map(mapWallet));
        if (cRes.data) setCategories(cRes.data.map(mapCategory));
        if (cfRes.data) setCustomFields(cfRes.data.map(mapCustomField));
        if (tRes.data) setTransactions(tRes.data.map(mapTransaction));
        if (aRes.data) setAuditLogs(aRes.data.map(mapAuditLog));
        if (fjRes.data) {
            console.log('Fetched Feed Journals:', fjRes.data);
            setFeedJournals(fjRes.data.map(mapFeedJournal));
        }

        setLoading(false);
    }, [ownerId]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    /* ---- Wallets ---- */
    const addWallet = useCallback(async (w: Omit<Wallet, 'id'>): Promise<Wallet | null> => {
        const { data, error } = await supabase.from('wallets')
            .insert({ owner_id: ownerId, name: w.name, type: w.type, opening_balance: w.opening_balance, is_active: w.is_active })
            .select().single();
        if (error || !data) return null;
        const mapped = mapWallet(data);
        setWallets(prev => [...prev, mapped]);
        return mapped;
    }, [ownerId]);

    const updateWallet = useCallback(async (id: string, updates: Partial<Wallet>): Promise<boolean> => {
        const { error } = await supabase.from('wallets').update(updates).eq('id', id);
        if (error) return false;
        setWallets(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
        return true;
    }, []);

    const deleteWallet = useCallback(async (id: string): Promise<boolean> => {
        const { error } = await supabase.from('wallets').delete().eq('id', id);
        if (error) return false;
        setWallets(prev => prev.filter(w => w.id !== id));
        return true;
    }, []);

    /* ---- Categories ---- */
    const addCategory = useCallback(async (c: Omit<Category, 'id'>): Promise<Category | null> => {
        const { data, error } = await supabase.from('categories')
            .insert({ owner_id: ownerId, name: c.name, flow: c.flow, parent_id: c.parent_id, sort_order: c.sort_order, is_active: c.is_active })
            .select().single();
        if (error || !data) return null;
        const mapped = mapCategory(data);
        setCategories(prev => [...prev, mapped]);
        return mapped;
    }, [ownerId]);

    const updateCategory = useCallback(async (id: string, updates: Partial<Category>): Promise<boolean> => {
        const { error } = await supabase.from('categories').update(updates).eq('id', id);
        if (error) return false;
        setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
        return true;
    }, []);

    const deleteCategory = useCallback(async (id: string): Promise<boolean> => {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) return false;
        setCategories(prev => prev.filter(c => c.id !== id));
        return true;
    }, []);

    /* ---- Custom Fields ---- */
    const addCustomField = useCallback(async (cf: Omit<CustomField, 'id'>): Promise<CustomField | null> => {
        const { data, error } = await supabase.from('custom_fields')
            .insert({
                owner_id: ownerId, field_key: cf.field_key, field_name: cf.field_name,
                field_type: cf.field_type, config: cf.config, is_active: cf.is_active, sort_order: cf.sort_order,
            })
            .select().single();
        if (error || !data) return null;
        const mapped = mapCustomField(data);
        setCustomFields(prev => [...prev, mapped]);
        return mapped;
    }, [ownerId]);

    const updateCustomField = useCallback(async (id: string, updates: Partial<CustomField>): Promise<boolean> => {
        const { error } = await supabase.from('custom_fields').update(updates).eq('id', id);
        if (error) return false;
        setCustomFields(prev => prev.map(cf => cf.id === id ? { ...cf, ...updates } : cf));
        return true;
    }, []);

    const deleteCustomField = useCallback(async (id: string): Promise<boolean> => {
        const { error } = await supabase.from('custom_fields').delete().eq('id', id);
        if (error) return false;
        setCustomFields(prev => prev.filter(cf => cf.id !== id));
        return true;
    }, []);

    /* ---- Transactions ---- */
    const addTransaction = useCallback(async (t: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction | null> => {
        const { data, error } = await supabase.from('transactions')
            .insert({
                owner_id: ownerId, txn_date: t.txn_date, flow: t.flow, amount: t.amount,
                wallet_id: t.wallet_id, to_wallet_id: t.to_wallet_id, category_id: t.category_id,
                note: t.note, custom_fields: t.custom_fields, is_deleted: false,
            })
            .select().single();
        if (error || !data) return null;
        const mapped = mapTransaction(data);
        setTransactions(prev => [mapped, ...prev]);
        return mapped;
    }, [ownerId]);

    const softDeleteTransaction = useCallback(async (id: string): Promise<boolean> => {
        const { error } = await supabase.from('transactions').update({ is_deleted: true, updated_at: new Date().toISOString() }).eq('id', id);
        if (error) return false;
        setTransactions(prev => prev.map(t => t.id === id ? { ...t, is_deleted: true } : t));
        return true;
    }, []);

    /* ---- Audit Logs ---- */
    const addAuditLogFn = useCallback(async (log: Omit<AuditLog, 'id' | 'created_at'>) => {
        const { data } = await supabase.from('audit_logs')
            .insert({ owner_id: ownerId, actor: log.actor, action: log.action, entity: log.entity, entity_id: log.entity_id, before_data: log.before_data, after_data: log.after_data })
            .select().single();
        if (data) {
            setAuditLogs(prev => [mapAuditLog(data), ...prev]);
        }
    }, [ownerId]);

    /* ---- Feed Journals ---- */
    const addFeedJournal = useCallback(async (entry: { journal_date: string; image_url: string; note: string; tags: string[] }): Promise<FeedJournal | null> => {
        const { data, error } = await supabase.from('feed_journals')
            .insert({ owner_id: ownerId, journal_date: entry.journal_date, image_url: entry.image_url, note: entry.note, tags: entry.tags })
            .select().single();

        if (error) {
            console.error('Error adding feed journal:', error);
            return null;
        }

        if (!data) return null;
        const mapped = mapFeedJournal(data);
        setFeedJournals(prev => [mapped, ...prev]);
        return mapped;
    }, [ownerId]);

    const deleteFeedJournal = useCallback(async (id: string): Promise<boolean> => {
        const { error } = await supabase.from('feed_journals').delete().eq('id', id);
        if (error) return false;
        setFeedJournals(prev => prev.filter(fj => fj.id !== id));
        return true;
    }, []);

    const uploadFeedImage = useCallback(async (file: File): Promise<string | null> => {
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${ownerId}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('feed-images').upload(path, file, {
            cacheControl: '3600',
            upsert: false,
        });
        if (error) {
            console.error('Upload error:', error);
            return null;
        }
        const { data: urlData } = supabase.storage.from('feed-images').getPublicUrl(path);
        return urlData?.publicUrl || null;
    }, [ownerId]);

    return {
        wallets, categories, customFields, transactions, auditLogs, feedJournals, loading,
        addWallet, updateWallet, deleteWallet,
        addCategory, updateCategory, deleteCategory,
        addCustomField, updateCustomField, deleteCustomField,
        addTransaction, softDeleteTransaction,
        addAuditLog: addAuditLogFn,
        addFeedJournal, deleteFeedJournal, uploadFeedImage,
        refresh: fetchAll,
    };
}

/* ---- Mappers (DB row → app type) ---- */
function mapWallet(r: any): Wallet {
    return { id: r.id, name: r.name, type: r.type, opening_balance: Number(r.opening_balance), is_active: r.is_active };
}
function mapCategory(r: any): Category {
    return { id: r.id, name: r.name, flow: r.flow, parent_id: r.parent_id, sort_order: r.sort_order, is_active: r.is_active };
}
function mapCustomField(r: any): CustomField {
    return { id: r.id, field_key: r.field_key, field_name: r.field_name, field_type: r.field_type, config: r.config || {}, is_active: r.is_active, sort_order: r.sort_order };
}
function mapTransaction(r: any): Transaction {
    return {
        id: r.id, txn_date: r.txn_date, flow: r.flow, amount: Number(r.amount),
        wallet_id: r.wallet_id, to_wallet_id: r.to_wallet_id, category_id: r.category_id,
        note: r.note || '', custom_fields: r.custom_fields || {}, is_deleted: r.is_deleted,
        created_at: r.created_at, updated_at: r.updated_at,
    };
}
function mapAuditLog(r: any): AuditLog {
    return { id: r.id, actor: r.actor, action: r.action, entity: r.entity, entity_id: r.entity_id, before_data: r.before_data, after_data: r.after_data, created_at: r.created_at };
}
function mapFeedJournal(r: any): FeedJournal {
    return { id: r.id, owner_id: r.owner_id, journal_date: r.journal_date, image_url: r.image_url, note: r.note || '', tags: r.tags || [], created_at: r.created_at };
}
