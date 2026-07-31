export type TransactionType = "income" | "expense" | "allocation";

export type AllocationAction = "deposit" | "withdrawal";

export type Awareness =
  | "Need"
  | "Want"
  | "Impulse"
  | "Fixed"
  | "Future"
  | "Protection"
  | "Payoff";

export type BudgetBucket =
  | "Kebutuhan pokok"
  | "Kewajiban dan utang"
  | "Dana darurat dan perlindungan"
  | "Tujuan masa depan"
  | "Keinginan dan gaya hidup"
  | "Berbagi dan ibadah";

export type BudgetScenario =
  | "belajar_mengelola"
  | "seimbang"
  | "bangun_dana_darurat"
  | "prioritas_utang"
  | "penghasilan_tidak_tetap"
  | "jaga_stabilitas";

export type GoalType =
  | "emergency"
  | "education"
  | "home"
  | "vehicle"
  | "worship"
  | "vacation"
  | "retirement"
  | "debt"
  | "wedding"
  | "custom";

export interface BudgetAllocation {
  bucket: BudgetBucket;
  percent: number;
}

export interface BudgetPlan {
  id: string;
  month: string;
  monthlyIncome: number;
  scenario: BudgetScenario;
  allocations: BudgetAllocation[];
  createdAt: string;
  updatedAt: string;
}

export interface FinancialGoal {
  id: string;
  name: string;
  type: GoalType;
  targetAmount: number;
  initialAmount: number;
  monthlyTarget?: number;
  deadline?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  beneficiaries: string[];
  category: string;
  activity: string;
  awareness: Awareness;
  budgetBucket?: BudgetBucket;
  goalId?: string;
  allocationAction?: AllocationAction;
  note: string;
  createdAt: string;
  updatedAt: string;
  area?: string;
}

export interface FinanceState {
  schemaVersion: 3;
  profileName: string;
  householdMembers: string[];
  customCategories: Record<string, string[]>;
  budgetPlans: BudgetPlan[];
  goals: FinancialGoal[];
  learningProgress: string[];
  transactions: FinanceTransaction[];
  lastUpdatedAt: string;
}

export interface Entitlement {
  status: "active" | "inactive" | "refunded" | "expired" | "unknown";
  productCode: string | null;
  source: "supabase" | "preview";
}
