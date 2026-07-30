export type TransactionType = "income" | "expense";

export type Awareness =
  | "Need"
  | "Want"
  | "Impulse"
  | "Fixed"
  | "Future"
  | "Protection"
  | "Payoff";

export interface FinanceTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  area: string;
  activity: string;
  awareness: Awareness;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceState {
  schemaVersion: 1;
  profileName: string;
  transactions: FinanceTransaction[];
  lastUpdatedAt: string;
}

export interface Entitlement {
  status: "active" | "inactive" | "refunded" | "expired" | "unknown";
  productCode: string | null;
  source: "supabase" | "preview";
}
