export const generateId = () => crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9);

export const formatDate = (d: Date) => d.toISOString().split("T")[0];

export const formatMoney = (n: number | null | undefined) => {
  if (n == null) return "0";
  return new Intl.NumberFormat("vi-VN").format(Math.round(n));
};

export const formatDateTime = (d: string) => new Date(d).toLocaleString("vi-VN");

export const formatAmountInput = (v: string) => {
  const digits = v.replace(/[^\d]/g, "");
  if (!digits) return "";
  return new Intl.NumberFormat("vi-VN").format(parseInt(digits, 10));
};

export const parseAmount = (v: string) => {
  const digits = v.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
};
