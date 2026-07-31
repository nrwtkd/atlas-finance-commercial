import { readFile, writeFile } from "node:fs/promises";

const appPath = new URL("../src/App.tsx", import.meta.url);
let source = await readFile(appPath, "utf8");
let changed = false;

const anchor = '            onSaveMonthly={(entry) => persist({ ...finance, monthlyReflections: [entry, ...finance.monthlyReflections.filter((item) => item.month !== entry.month)] })}\n            onOpenLearning={() => setScreen("learn")}';
const replacement = '            onSaveMonthly={(entry) => persist({ ...finance, monthlyReflections: [entry, ...finance.monthlyReflections.filter((item) => item.month !== entry.month)] })}\n            onCommitFinance={(nextFinance) => persist(nextFinance)}\n            onOpenLearning={() => setScreen("learn")}';

if (!source.includes('onCommitFinance={(nextFinance) => persist(nextFinance)}')) {
  if (!source.includes(anchor)) {
    throw new Error("Atlas insight close anchor missing");
  }
  source = source.replace(anchor, replacement);
  changed = true;
}

if (changed) await writeFile(appPath, source, "utf8");
console.log("Atlas personal insights and month close ready");
