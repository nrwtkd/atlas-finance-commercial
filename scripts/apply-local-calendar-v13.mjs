import { readFile, writeFile } from "node:fs/promises";

async function edit(relativePath, transform) {
  const path = new URL(`../${relativePath}`, import.meta.url);
  const source = await readFile(path, "utf8");
  const next = transform(source);
  if (next !== source) await writeFile(path, next, "utf8");
}

function addImport(source, anchor, addition, marker = addition) {
  if (source.includes(marker)) return source;
  if (!source.includes(anchor)) throw new Error(`Atlas local calendar import anchor missing in ${anchor}`);
  return source.replace(anchor, `${anchor}\n${addition}`);
}

await edit("src/App.tsx", (input) => {
  let source = addImport(
    input,
    'import { loadFinanceState, saveFinanceState, vaultExists } from "./lib/cryptoVault";',
    'import { localDateKey, localMonthKey } from "./lib/localDate";',
    'from "./lib/localDate"'
  );
  source = source.replace(
    'const monthKey = () => new Date().toISOString().slice(0, 7);',
    'const monthKey = () => localMonthKey();'
  );
  source = source.replaceAll('new Date().toISOString().slice(0, 10)', 'localDateKey()');
  return source;
});

await edit("src/components/PersonalInsightsPanel.tsx", (input) => {
  let source = addImport(
    input,
    'import { useMemo } from "react";',
    'import { localMonthKey, previousLocalMonthKey } from "../lib/localDate";',
    'from "../lib/localDate"'
  );
  source = source.replace(/function monthKey\(date = new Date\(\)\) \{[\s\S]*?function previousMonthKey\(\) \{[\s\S]*?\n\}\n\n/, "");
  source = source.replace('const currentMonth = monthKey();', 'const currentMonth = localMonthKey();');
  source = source.replace('const previousMonth = previousMonthKey();', 'const previousMonth = previousLocalMonthKey();');
  return source;
});

await edit("src/components/ReflectionCenter.tsx", (input) => {
  let source = addImport(
    input,
    'import { useState } from "react";',
    'import { localMonthKey } from "../lib/localDate";',
    'from "../lib/localDate"'
  );
  source = source.replace('const month = new Date().toISOString().slice(0, 7);', 'const month = localMonthKey();');
  return source;
});

await edit("src/components/MonthlyReviewPanel.tsx", (input) => {
  let source = addImport(
    input,
    'import { useState, type FormEvent } from "react";',
    'import { localMonthKey } from "../lib/localDate";',
    'from "../lib/localDate"'
  );
  source = source.replace('const monthKey = () => new Date().toISOString().slice(0, 7);\n', '');
  source = source.replace('const month = monthKey();', 'const month = localMonthKey();');
  return source;
});

for (const component of ["EmotionPanel.tsx", "ProgressPanel.tsx"]) {
  await edit(`src/components/${component}`, (input) => {
    let source = addImport(
      input,
      component === "EmotionPanel.tsx"
        ? 'import { useState, type FormEvent } from "react";'
        : 'import { useMemo, useState, type FormEvent } from "react";',
      'import { localDateKey } from "../lib/localDate";',
      'from "../lib/localDate"'
    );
    source = source.replaceAll('date: now.slice(0, 10)', 'date: localDateKey()');
    return source;
  });
}

await edit("src/components/MonthClosePanel.tsx", (input) => {
  let source = addImport(
    input,
    'import { getPersonalizedBudgetRecommendation } from "../domain/personalization";',
    'import { localMonthKey, monthEndDateKey, monthLabelFromKey, shiftMonthKey } from "../lib/localDate";',
    'from "../lib/localDate"'
  );
  source = source.replace(/function monthKey\(date = new Date\(\)\) \{[\s\S]*?function monthLabel\(key: string\) \{[\s\S]*?\n\}\n\n/, "");
  const sumAnchor = 'function sum(items: FinanceTransaction[]) {\n  return items.reduce((total, item) => total + item.amount, 0);\n}\n';
  const helper = `${sumAnchor}\nfunction defaultClosingMonth(finance: FinanceState) {\n  const current = localMonthKey();\n  const previous = shiftMonthKey(current, -1);\n  const previousHasActivity = finance.transactions.some((item) => item.date.startsWith(previous))\n    || finance.budgetPlans.some((item) => item.month === previous);\n  const previousClosed = finance.monthlyReflections.some((item) => item.month === previous && item.closedAt);\n  return new Date().getDate() <= 7 && previousHasActivity && !previousClosed ? previous : current;\n}\n`;
  if (!source.includes('function defaultClosingMonth(finance: FinanceState)')) {
    if (!source.includes(sumAnchor)) throw new Error("Month close sum anchor missing");
    source = source.replace(sumAnchor, helper);
  }
  source = source.replace('const month = monthKey();\n  const nextMonth = nextMonthKey();', 'const month = defaultClosingMonth(finance);\n  const nextMonth = shiftMonthKey(month, 1);');
  source = source.replace('const date = new Date().toISOString().slice(0, 10);', 'const date = monthEndDateKey(month);');
  source = source.replaceAll('monthLabel(', 'monthLabelFromKey(');
  return source;
});

await edit("src/components/DataPortability.tsx", (input) => {
  let source = addImport(
    input,
    'import { decryptVaultEnvelope, type VaultEnvelope } from "../lib/cryptoVault";',
    'import { localDateKey } from "../lib/localDate";',
    'from "../lib/localDate"'
  );
  source = source.replace('const date = now.toISOString().slice(0, 10);', 'const date = localDateKey(now);');
  return source;
});

console.log("Atlas local calendar dates ready");
