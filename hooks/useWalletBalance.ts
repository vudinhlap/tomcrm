import { useMemo } from 'react';
import { Transaction, Wallet } from '../types';

export interface WalletBalance extends Wallet {
    balance: number;
}

export interface WalletRangeBalance {
    name: string;
    balance_open: number;
    balance_close: number;
}

function computeDelta(t: Transaction, walletId: string): number {
    let d = 0;
    if (t.flow === "INCOME" && t.wallet_id === walletId) d = t.amount;
    if (t.flow === "EXPENSE" && t.wallet_id === walletId) d = -t.amount;
    if (t.flow === "TRANSFER" && t.wallet_id === walletId) d = -t.amount;
    if (t.flow === "TRANSFER" && t.to_wallet_id === walletId) d = t.amount;
    return d;
}

/** Compute current (all-time) balance for each active wallet */
export function useWalletBalances(wallets: Wallet[], txns: Transaction[]): WalletBalance[] {
    return useMemo(() => {
        return wallets.filter(w => w.is_active).map(w => {
            let balance = w.opening_balance;
            txns.forEach(t => { balance += computeDelta(t, w.id); });
            return { ...w, balance };
        });
    }, [wallets, txns]);
}

/** Compute opening/closing balance within a date range */
export function useWalletRangeBalances(
    wallets: Wallet[], txns: Transaction[], dateFrom: string, dateTo: string
): WalletRangeBalance[] {
    return useMemo(() => {
        return wallets.filter(w => w.is_active).map(w => {
            let before = w.opening_balance;
            let inRange = 0;
            txns.forEach(t => {
                const d = computeDelta(t, w.id);
                if (t.txn_date < dateFrom) before += d;
                else if (t.txn_date >= dateFrom && t.txn_date <= dateTo) inRange += d;
            });
            return { name: w.name, balance_open: before, balance_close: before + inRange };
        });
    }, [wallets, txns, dateFrom, dateTo]);
}
