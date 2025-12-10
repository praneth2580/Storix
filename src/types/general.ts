export interface BatchEntry {
  id?: string;
  [key: string]: unknown;
}

export interface BatchResponseItem {
  results: BatchEntry[];
  status: string;
}

export type PaymentMethodType =
  | "other"
  | "cash"
  | "card"
  | "upi"
  | "cheque"
  | "none"
  | "bank";