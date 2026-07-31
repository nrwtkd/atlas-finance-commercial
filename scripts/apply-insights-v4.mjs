import { readFile, writeFile } from "node:fs/promises";

const appPath = new URL("../src/App.tsx", import.meta.url);
let source = await readFile(appPath, "utf8");
let changed = false;

function patch(anchor, replacement, marker) {
  if (marker && source.includes(marker)) return;
  if (!source.includes(anchor)) throw new Error(`Atlas patch anchor missing: ${anchor.slice(0, 48)}`);
  source = source.replace(anchor, replacement);
  changed = true;
}

patch(
  'import DataPortability from "./components/DataPortability";',
  'import DataPortability from "./components/DataPortability";\nimport ReflectionCenter, { ReflectionSnapshot } from "./components/ReflectionCenter";',
  'import ReflectionCenter, { ReflectionSnapshot } from "./components/ReflectionCenter";'
);

patch(
  'type Screen = "home" | "record" | "plan" | "learn" | "history" | "space";',
  'type Screen = "home" | "record" | "plan" | "reflect" | "learn" | "history" | "space";',
  '| "reflect" |'
);

if (source.includes("schemaVersion: 3")) {
  source = source.replaceAll("schemaVersion: 3", "schemaVersion: 4");
  changed = true;
}

patch(
  '    learningProgress: [],\n    transactions: [],',
  '    learningProgress: [],\n    emotionalCheckIns: [],\n    financialWins: [],\n    monthlyReflections: [],\n    transactions: [],',
  '    emotionalCheckIns: [],'
);

patch(
  '    learningProgress: input.learningProgress ?? [],\n    transactions,',
  '    learningProgress: input.learningProgress ?? [],\n    emotionalCheckIns: input.emotionalCheckIns ?? [],\n    financialWins: input.financialWins ?? [],\n    monthlyReflections: input.monthlyReflections ?? [],\n    transactions,',
  '    emotionalCheckIns: input.emotionalCheckIns ?? [],'
);

if (changed) await writeFile(appPath, source, "utf8");
console.log("Atlas insights data ready");
