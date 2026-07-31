import { readFile, writeFile } from "node:fs/promises";

const appPath = new URL("../src/App.tsx", import.meta.url);
let source = await readFile(appPath, "utf8");
let changed = false;

function patch(anchor, replacement, marker) {
  if (marker && source.includes(marker)) return;
  if (!source.includes(anchor)) throw new Error(`Atlas onboarding anchor missing: ${anchor.slice(0, 70)}`);
  source = source.replace(anchor, replacement);
  changed = true;
}

patch(
  'import ReflectionCenter, { ReflectionSnapshot } from "./components/ReflectionCenter";',
  'import ReflectionCenter, { ReflectionSnapshot } from "./components/ReflectionCenter";\nimport FinancialOnboarding from "./components/FinancialOnboarding";\nimport { getFinancialProfileSummary, getPersonalizedBudgetRecommendation } from "./domain/personalization";',
  'import FinancialOnboarding from "./components/FinancialOnboarding";'
);

patch(
  '  FinanceTransaction,\n  FinancialGoal,',
  '  FinanceTransaction,\n  FinancialProfile,\n  FinancialGoal,',
  '  FinancialProfile,\n'
);

if (source.includes("schemaVersion: 4")) {
  source = source.replaceAll("schemaVersion: 4", "schemaVersion: 5");
  changed = true;
}

patch(
  '    profileName,\n    householdMembers: members.length ? members : [profileName],',
  '    profileName,\n    financialProfile: input.financialProfile,\n    householdMembers: members.length ? members : [profileName],',
  '    financialProfile: input.financialProfile,'
);

patch(
  '  const currentPlan = finance.budgetPlans.find((item) => item.month === monthKey());',
  `  if (!finance.financialProfile) {\n    return (\n      <FinancialOnboarding\n        name={finance.profileName}\n        onComplete={async (profile) => {\n          await persist({ ...finance, financialProfile: profile });\n          setPlanTab("budget");\n          setScreen("plan");\n        }}\n      />\n    );\n  }\n\n  const currentPlan = finance.budgetPlans.find((item) => item.month === monthKey());`,
  '<FinancialOnboarding\n        name={finance.profileName}'
);

patch(
  '                plan={currentPlan}\n                actualIncome={stats.income}',
  '                plan={currentPlan}\n                profile={finance.financialProfile}\n                actualIncome={stats.income}',
  'profile={finance.financialProfile}'
);

patch(
  '            onUpdateMembers={(members) => persist({ ...finance, householdMembers: members })}\n            onLock=',
  '            onUpdateMembers={(members) => persist({ ...finance, householdMembers: members })}\n            onEditProfile={() => persist({ ...finance, financialProfile: undefined })}\n            onLock=',
  'onEditProfile={() => persist({ ...finance, financialProfile: undefined })}'
);

patch(
  'function BudgetPlanner({ plan, actualIncome, transactions, onSave }: { plan?: BudgetPlan; actualIncome: number; transactions: FinanceTransaction[]; onSave: (plan: BudgetPlan) => Promise<void> }) {',
  'function BudgetPlanner({ plan, profile, actualIncome, transactions, onSave }: { plan?: BudgetPlan; profile: FinancialProfile; actualIncome: number; transactions: FinanceTransaction[]; onSave: (plan: BudgetPlan) => Promise<void> }) {',
  'profile: FinancialProfile; actualIncome'
);

patch(
  '  const [income, setIncome] = useState(String(plan?.monthlyIncome || actualIncome || "")); const [scenario, setScenario] = useState<BudgetScenario>(plan?.scenario ?? "seimbang"); const [allocations, setAllocations] = useState<BudgetAllocation[]>(plan?.allocations ?? getScenario("seimbang").allocations.map((item) => ({ ...item }))); const [busy, setBusy] = useState(false); const numericIncome = Number(income) || 0; const totalPercent = allocations.reduce((sum, item) => sum + item.percent, 0); const scenarioInfo = getScenario(scenario);',
  '  const recommendation = getPersonalizedBudgetRecommendation(profile);\n  const [income, setIncome] = useState(String(plan?.monthlyIncome || actualIncome || ""));\n  const [scenario, setScenario] = useState<BudgetScenario>(plan?.scenario ?? recommendation.scenario);\n  const [allocations, setAllocations] = useState<BudgetAllocation[]>(plan?.allocations ?? recommendation.allocations.map((item) => ({ ...item })));\n  const [busy, setBusy] = useState(false);\n  const numericIncome = Number(income) || 0;\n  const totalPercent = allocations.reduce((sum, item) => sum + item.percent, 0);\n  const scenarioInfo = getScenario(scenario);',
  'const recommendation = getPersonalizedBudgetRecommendation(profile);'
);

patch(
  '}<label>Kondisi yang paling mendekati saat ini<select value={scenario}',
  `}<aside className="personalBudgetRecommendation">\n    <span className="eyebrow">REKOMENDASI BERDASARKAN KONDISIMU</span>\n    <h3>{recommendation.label}</h3>\n    <p>{recommendation.description}</p>\n    <ul>{recommendation.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>\n    <span className="emergencyHint">Gambaran target dana darurat: {recommendation.emergencyTargetMonths} bulan kebutuhan pokok</span>\n  </aside><label>Kondisi yang paling mendekati saat ini<select value={scenario}`,
  'className="personalBudgetRecommendation"'
);

patch(
  'function MySpace({ finance, onUpdateMembers, onLock, onSignOut, onReset }: { finance: FinanceState; onUpdateMembers: (members: string[]) => Promise<void>; onLock: () => void; onSignOut: () => void; onReset: () => Promise<void> }) {',
  'function MySpace({ finance, onUpdateMembers, onEditProfile, onLock, onSignOut, onReset }: { finance: FinanceState; onUpdateMembers: (members: string[]) => Promise<void>; onEditProfile: () => Promise<void>; onLock: () => void; onSignOut: () => void; onReset: () => Promise<void> }) {',
  'onEditProfile: () => Promise<void>'
);

patch(
  '  const [member, setMember] = useState("");\n  return <section className="spacePage">',
  '  const [member, setMember] = useState("");\n  const profileSummary = finance.financialProfile ? getFinancialProfileSummary(finance.financialProfile) : null;\n  return <section className="spacePage">',
  'const profileSummary = finance.financialProfile'
);

patch(
  '</p></div><section className="card memberCard">',
  `</p></div>{profileSummary && <section className="card profileContextCard"><div><span className="eyebrow">KENALI KONDISIMU</span><h3>{profileSummary.stage}</h3><p>{profileSummary.income} · Fokus: {profileSummary.priorities}</p></div><button className="secondary" type="button" onClick={() => void onEditProfile()}>Perbarui kondisiku</button></section>}<section className="card memberCard">`,
  'className="card profileContextCard"'
);

if (changed) await writeFile(appPath, source, "utf8");
console.log("Atlas personalized onboarding ready");
