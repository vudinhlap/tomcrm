import { useMemo } from 'react';
import { Transaction } from '../types';

export interface Summary {
    income: number;
    expense: number;
    profit: number;
}

/** Compute income, expense, profit totals for a list of transactions */
export function useSummary(txns: Transaction[]): Summary {
    return useMemo(() => {
        let income = 0, expense = 0;
        txns.forEach(t => {
            if (t.flow === "INCOME") income += t.amount;
            if (t.flow === "EXPENSE") expense += t.amount;
        });
        return { income, expense, profit: income - expense };
    }, [txns]);
}
