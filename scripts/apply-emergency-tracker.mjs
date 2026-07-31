import { readFile, writeFile } from "node:fs/promises";

const appPath = new URL("../src/App.tsx", import.meta.url);
let source = await readFile(appPath, "utf8");
let changed = false;

const legacyImport = 'import EmergencyFundTracker from "./components/EmergencyFundTracker";\n';
if (source.includes(legacyImport)) {
  source = source.replace(legacyImport, "");
  changed = true;
}

const legacyMount = '\n\n      <EmergencyFundTracker plan={currentPlan} transactions={finance.transactions} />';
if (source.includes(legacyMount)) {
  source = source.replace(legacyMount, "");
  changed = true;
}

if (changed) {
  await writeFile(appPath, source, "utf8");
}

console.log("Atlas: tracker dana darurat lama dipensiunkan; kartu terpadu menjadi sumber tunggal.");
