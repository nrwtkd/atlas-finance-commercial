import { readFile, writeFile } from "node:fs/promises";

const appPath = new URL("../src/App.tsx", import.meta.url);
let source = await readFile(appPath, "utf8");
const anchor = "  const displayAllocations = [";
if (source.includes(anchor)) {
  source = source.replace(anchor, "  const displayAllocations: BudgetAllocation[] = [");
  await writeFile(appPath, source, "utf8");
}
console.log("Atlas exact budget display allocation types fixed");
