import { readFile, writeFile } from "node:fs/promises";

const appPath = new URL("../src/App.tsx", import.meta.url);
let source = await readFile(appPath, "utf8");

const anchor = '  const [allocations, setAllocations] = useState<BudgetAllocation[]>(plan?.allocations ?? recommendation.allocations.map((item) => ({ ...item })));';
if (source.includes(anchor)) {
  const replacement = `  const startingAllocations = (() => {
    const base = (plan?.allocations ?? recommendation.allocations).map((item) => ({ ...item }));
    if (base.some((item) => item.bucket === "Investasi dan pensiun")) return base;
    return base.flatMap((item) => {
      if (item.bucket !== "Tujuan masa depan") return [item];
      const goalPercent = Math.ceil(item.percent / 2);
      return [
        { ...item, percent: goalPercent },
        { bucket: "Investasi dan pensiun" as BudgetBucket, percent: item.percent - goalPercent }
      ];
    });
  })();
  const [allocations, setAllocations] = useState<BudgetAllocation[]>(startingAllocations);`;
  source = source.replace(anchor, replacement);
  await writeFile(appPath, source, "utf8");
}

console.log("Atlas existing budget plans migrated to investment bucket");
