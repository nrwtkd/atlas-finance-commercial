import { readFile, writeFile } from "node:fs/promises";

const appPath = new URL("../src/App.tsx", import.meta.url);
let source = await readFile(appPath, "utf8");
let changed = false;

const legacyImport = 'import EmergencyFundTracker from "./components/EmergencyFundTracker";\n';
if (source.includes(legacyImport)) { source = source.replace(legacyImport, ""); changed = true; }
source = source.replace(/\n\s*<EmergencyFundTracker[\s\S]*?\/>/g, "");

if (!source.includes('{ type: "gold", label: "Emas dan investasi"')) {
  const anchor = '  { type: "retirement", label: "Pensiun", defaultName: "Dana pensiun", bucket: "Tujuan masa depan" },';
  if (!source.includes(anchor)) throw new Error("Atlas gold goal anchor missing");
  source = source.replace(anchor, `${anchor}\n  { type: "gold", label: "Emas dan investasi", defaultName: "Alokasi emas", bucket: "Tujuan masa depan" },`);
  changed = true;
}

if (changed) await writeFile(appPath, source, "utf8");
console.log("Atlas unified emergency card and gold allocation ready");
