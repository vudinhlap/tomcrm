import { TransactionFlow } from './types';

export const COLORS = {
    income: "#0a8754",
    expense: "#c4432b",
    transfer: "#5b6abf",
    primary: "#0d6e5b",
    primaryDark: "#094d3f",
    borderLight: "#e8efeb",
    textMuted: "#8a9e96",
    surfaceAlt: "#f7faf9",
    border: "#d4e0db",
};

export const CHART_COLORS = ["#0d6e5b", "#d4883e", "#5b6abf", "#c4432b", "#0a8754", "#8e6cc0", "#2d8fb5", "#c7753e"];

export const flowColor = (f: TransactionFlow) =>
    f === "INCOME" ? "text-income" : f === "EXPENSE" ? "text-expense" : "text-transfer";

export const flowBg = (f: TransactionFlow) =>
    f === "INCOME" ? "bg-incomeLight" : f === "EXPENSE" ? "bg-expenseLight" : "bg-transferLight";

export const flowLabel = (f: TransactionFlow) =>
    f === "INCOME" ? "Thu" : f === "EXPENSE" ? "Chi" : "Chuyển";
