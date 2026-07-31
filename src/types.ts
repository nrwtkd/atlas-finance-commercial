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

export type LifeStage =
  | "student"
  | "starting"
  | "working"
  | "freelance_business"
  | "family"
  | "retired"
  | "other";

export type IncomePattern = "none" | "allowance" | "fixed" | "variable" | "mixed";
export type ManagedFor = "self" | "partner" | "children" | "parents" | "business" | "other";
export type DebtCondition = "none" | "manageable" | "heavy";
export type EmergencyFundLevel = "none" | "under_one" | "one_to_three" | "over_three";
export type FinancialPriority = "understand" | "budget" | "emergency" | "debt" | "goal" | "learn";
export type BudgetStyle = "structured" | "balanced" | "flexible";

export type MoneyEmotion =
  | "calm"
  | "safe"
  | "grateful"
  | "happy"
  | "anxious"
  | "pressured"
  | "guilty"
  | "tired"
  | "afraid"
  | "confused";

export type EmotionTrigger =
  | "balance"
  | "income"
  | "needs"
  | "bills"
  | "shopping"
  | "saving"
  | "debt"
  | "conversation"
  | "future"
  | "other";

export type SupportNeed =
  | "pause"
  | "clarity"
  | "small_plan"
  | "support"
  | "reduce_temptation"
  | "celebrate";

export type FinancialWinCategory =
  | "awareness"
  | "consistency"
  | "restraint"
  | "income"
  | "budget"
  | "emergency"
  | "goal"
  | "debt"
  | "learning"
  | "other";

export interface FinancialProfile {
  lifeStage: LifeStage;
  incomePattern: IncomePattern;
  managedFor: ManagedFor[];
  dependents: number;
  debtCondition: DebtCondition;
  emergencyFundLevel: EmergencyFundLevel;
  priorities: FinancialPriority[];
  budgetStyle: BudgetStyle;
  completedAt: string;
  updatedAt: string;
}

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

export interface EmotionalCheckIn {
  id: string;
  date: string;
  emotion: MoneyEmotion;
  intensity: number;
  trigger: EmotionTrigger;
  supportNeed: SupportNeed;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialWin {
  id: string;
  date: string;
  title: string;
  description: string;
  amount?: number;
  category: FinancialWinCategory;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyReflection {
  id: string;
  month: string;
  proudOf: string;
  worthIt: string;
  patternToChange: string;
  nextStep: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceState {
  schemaVersion: 5;
  profileName: string;
  financialProfile?: FinancialProfile;
  householdMembers: string[];
  customCategories: Record<string, string[]>;
  budgetPlans: BudgetPlan[];
  goals: FinancialGoal[];
  learningProgress: string[];
  emotionalCheckIns: EmotionalCheckIn[];
  financialWins: FinancialWin[];
  monthlyReflections: MonthlyReflection[];
  transactions: FinanceTransaction[];
  lastUpdatedAt: string;
}

export interface Entitlement {
  status: "active" | "inactive" | "refunded" | "expired" | "unknown";
  productCode: string | null;
  source: "supabase" | "preview";
}
