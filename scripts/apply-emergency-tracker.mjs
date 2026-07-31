import { readFile, writeFile } from "node:fs/promises";

const appPath = new URL("../src/App.tsx", import.meta.url);
let source = await readFile(appPath, "utf8");
let changed = false;

if (!source.includes('import EmergencyFundTracker from "./components/EmergencyFundTracker";')) {
  const anchor = 'import DataPortability from "./components/DataPortability";';
  if (source.includes(anchor)) {
    source = source.replace(
      anchor,
      `${anchor}\nimport EmergencyFundTracker from "./components/EmergencyFundTracker";`
    );
    changed = true;
  } else {
    console.warn("Atlas: titik impor tracker dana darurat tidak ditemukan.");
  }
}

if (!source.includes("<EmergencyFundTracker")) {
  const anchor = '<BudgetSnapshot plan={currentPlan} transactions={monthlyTransactions} onBudget={onBudget} />';
  if (source.includes(anchor)) {
    source = source.replace(
      anchor,
      `${anchor}\n\n      <EmergencyFundTracker plan={currentPlan} transactions={finance.transactions} />`
    );
    changed = true;
  } else {
    console.warn("Atlas: titik dashboard tracker dana darurat tidak ditemukan.");
  }
}

if (changed) {
  await writeFile(appPath, source, "utf8");
  console.log("Atlas: tracker dana darurat terhubung ke dashboard.");
} else {
  console.log("Atlas: tracker dana darurat sudah terhubung.");
}
