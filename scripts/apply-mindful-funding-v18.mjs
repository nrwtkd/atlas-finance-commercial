import { readFile, writeFile } from "node:fs/promises";

const appPath = new URL("../src/App.tsx", import.meta.url);
let source = await readFile(appPath, "utf8");
let changed = false;

function replaceOnce(anchor, replacement, label) {
  if (!source.includes(anchor)) throw new Error(`Atlas mindful funding anchor missing: ${label}`);
  source = source.replace(anchor, replacement);
  changed = true;
}

if (source.includes('import EarlyAccessFeedback from "./components/EarlyAccessFeedback";\n')) {
  source = source.replace('import EarlyAccessFeedback from "./components/EarlyAccessFeedback";\n', "");
  changed = true;
}
if (source.includes('<EarlyAccessFeedback finance={finance} />')) {
  source = source.replace('<EarlyAccessFeedback finance={finance} />', "");
  changed = true;
}

if (!source.includes('import FundingAwarenessCard from "./components/FundingAwarenessCard";')) {
  replaceOnce(
    'import EmergencyFundGuide from "./components/EmergencyFundGuide";',
    'import EmergencyFundGuide from "./components/EmergencyFundGuide";\nimport FundingAwarenessCard from "./components/FundingAwarenessCard";',
    "funding import"
  );
}

if (!source.includes('<FundingAwarenessCard\n        plan={currentPlan}')) {
  const anchor = '      <GuidanceModeCard style={finance.financialProfile?.budgetStyle ?? "balanced"} />';
  const block = `      <FundingAwarenessCard\n        plan={currentPlan}\n        actualIncome={stats.income}\n        transactions={monthlyTransactions}\n        onOpenBudget={onBudget}\n      />\n${anchor}`;
  replaceOnce(anchor, block, "funding home mount");
}

if (!source.includes('plan={currentPlan}\n            monthlyTransactions={monthlyTransactions}')) {
  replaceOnce(
    '            goals={activeGoals}\n            onOpenGoals={openGoals}',
    '            goals={activeGoals}\n            plan={currentPlan}\n            monthlyTransactions={monthlyTransactions}\n            onOpenGoals={openGoals}',
    "record props"
  );
}

const oldSignature = 'function Record({ profileName, members, customCategories, goals, onOpenGoals, onCancel, onSave }: { profileName: string; members: string[]; customCategories: Record<string, string[]>; goals: FinancialGoal[]; onOpenGoals: () => void; onCancel: () => void;';
if (!source.includes('plan, monthlyTransactions, onOpenGoals')) {
  replaceOnce(
    oldSignature,
    'function Record({ profileName, members, customCategories, goals, plan, monthlyTransactions, onOpenGoals, onCancel, onSave }: { profileName: string; members: string[]; customCategories: Record<string, string[]>; goals: FinancialGoal[]; plan?: BudgetPlan; monthlyTransactions: FinanceTransaction[]; onOpenGoals: () => void; onCancel: () => void;',
    "record signature"
  );
}

if (!source.includes('const plannedBucketPercent = bucket ?')) {
  const anchor = '  const availableMembers = Array.from(new Set([...members, ...addedMembers]));';
  const addition = `${anchor}\n  const plannedBucketPercent = bucket ? (plan?.allocations.find((item) => item.bucket === bucket)?.percent ?? 0) : 0;\n  const plannedBucketLimit = plan && bucket ? plan.monthlyIncome * plannedBucketPercent / 100 : 0;\n  const currentBucketUse = bucket ? monthlyTransactions.filter((item) => item.budgetBucket === bucket && (item.type === "expense" || (item.type === "allocation" && item.allocationAction !== "withdrawal"))).reduce((total, item) => total + item.amount, 0) : 0;\n  const projectedBucketUse = currentBucketUse + (Number(amount) || 0);\n  const outsideBudget = Boolean(plan && bucket && plannedBucketPercent === 0 && Number(amount) > 0);\n  const aboveBudget = Boolean(plan && bucket && plannedBucketLimit > 0 && projectedBucketUse > plannedBucketLimit);`;
  replaceOnce(anchor, addition, "record budget calculations");
}

if (!source.includes('className="recordBudgetWarning"')) {
  const anchor = '    <label>Catatan<input value={note}';
  const warning = `    {(outsideBudget || aboveBudget) && <aside className="recordBudgetWarning" role="status"><AtlasIcon name="insight" size={18} /><div><strong>{outsideBudget ? "Pos ini belum masuk anggaran bulan ini." : "Catatan ini akan melewati batas pos."}</strong><p>{outsideBudget ? \`Pergerakan tetap boleh disimpan, tetapi ${bucket} masih memiliki rencana Rp0. Setelah menyimpan, tinjau anggaran agar tujuan ini mendapat porsi yang nyata.\` : \`Setelah catatan ini, penggunaan ${bucket} menjadi ${rupiah.format(projectedBucketUse)} dari rencana ${rupiah.format(plannedBucketLimit)}.\`}</p></div></aside>}\n${anchor}`;
  replaceOnce(anchor, warning, "record warning mount");
}

if (changed) await writeFile(appPath, source, "utf8");
console.log("Atlas mindful funding and quieter beta feedback ready");
