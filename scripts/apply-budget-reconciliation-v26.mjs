import { readFile, writeFile } from "node:fs/promises";

const appPath = new URL("../src/App.tsx", import.meta.url);
let source = await readFile(appPath, "utf8");
let changed = false;

if (!source.includes("function normalizeBudgetAllocationsV26")) {
  const anchor = "\nfunction normalizeFinanceState";
  if (!source.includes(anchor)) throw new Error("Atlas budget normalization anchor missing");
  const helper = `
function normalizeBudgetAllocationsV26(allocations: BudgetAllocation[]): BudgetAllocation[] {
  const copied = allocations.map((item) => ({ ...item }));
  if (copied.some((item) => item.bucket === "Investasi dan pensiun")) return copied;
  const future = copied.find((item) => item.bucket === "Tujuan masa depan");
  if (!future) return [...copied, { bucket: "Investasi dan pensiun", percent: 0 }];
  const investmentPercent = Math.floor(future.percent / 2);
  return copied.flatMap((item) => item.bucket === "Tujuan masa depan"
    ? [
        { ...item, percent: item.percent - investmentPercent },
        { bucket: "Investasi dan pensiun" as BudgetBucket, percent: investmentPercent }
      ]
    : [item]);
}
`;
  source = source.replace(anchor, `${helper}${anchor}`);
  changed = true;
}

if (source.includes("budgetPlans: input.budgetPlans ?? [],")) {
  source = source.replace(
    "budgetPlans: input.budgetPlans ?? [],",
    "budgetPlans: (input.budgetPlans ?? []).map((plan) => ({ ...plan, allocations: normalizeBudgetAllocationsV26(plan.allocations) })),"
  );
  changed = true;
}

if (source.includes("const migratedInvestmentTransactions") && !source.includes("const reconciledInvestmentTransactionsV26")) {
  const anchor = "\n\n  return {\n    schemaVersion:";
  if (!source.includes(anchor)) throw new Error("Atlas transaction reconciliation anchor missing");
  const reconciliation = `

  const reconciledInvestmentTransactionsV26 = migratedInvestmentTransactions.map((item) => {
    const text = (item.category + " " + item.activity).toLowerCase();
    const isInvestmentExpense = item.type === "expense"
      && /(dplk|logam mulia|emas|dana pensiun|reksa dana|saham|investasi)/i.test(text);
    if (!isInvestmentExpense) return item;
    return {
      ...item,
      category: "Investasi dan pensiun",
      awareness: "Future" as const,
      budgetBucket: "Investasi dan pensiun" as const,
      goalId: undefined,
      allocationAction: undefined
    };
  });`;
  source = source.replace(anchor, `${reconciliation}${anchor}`);
  source = source.replace(
    "transactions: migratedInvestmentTransactions,",
    "transactions: reconciledInvestmentTransactionsV26,"
  );
  changed = true;
}

const budgetSnapshot = `function BudgetSnapshot({ plan, transactions, onBudget }: { plan?: BudgetPlan; transactions: FinanceTransaction[]; onBudget: () => void }) {
  if (!plan) return <section className="card emptyBudgetCard"><div><span className="eyebrow">RENCANA BULAN INI</span><h2>Belum ada pembagian anggaran.</h2><p>Masukkan pemasukan, lalu Atlas memberi rekomendasi awal yang tetap bisa kamu ubah.</p></div><button className="secondary" type="button" onClick={onBudget}>Buat rencana</button></section>;

  const normalizedPlanAllocations = normalizeBudgetAllocationsV26(plan.allocations);
  const transactionBuckets = Array.from(new Set(
    transactions
      .map((item) => item.budgetBucket)
      .filter((bucket): bucket is BudgetBucket => Boolean(bucket))
  ));
  const displayAllocations = [
    ...normalizedPlanAllocations,
    ...transactionBuckets
      .filter((bucket) => !normalizedPlanAllocations.some((item) => item.bucket === bucket))
      .map((bucket) => ({ bucket, percent: 0 }))
  ];

  const consumed = transactions
    .filter((item) => item.type === "expense" && item.budgetBucket !== "Investasi dan pensiun")
    .reduce((sum, item) => sum + item.amount, 0);
  const invested = transactions
    .filter((item) => item.type === "expense" && item.budgetBucket === "Investasi dan pensiun")
    .reduce((sum, item) => sum + item.amount, 0);
  const allocatedIn = transactions
    .filter((item) => item.type === "allocation" && item.allocationAction !== "withdrawal")
    .reduce((sum, item) => sum + item.amount, 0);
  const allocatedOut = transactions
    .filter((item) => item.type === "allocation" && item.allocationAction === "withdrawal")
    .reduce((sum, item) => sum + item.amount, 0);
  const directed = Math.max(0, allocatedIn - allocatedOut);
  const used = consumed + invested + directed;

  return <section className="card budgetSnapshot budgetSnapshotReconciled">
    <div className="budgetSnapshotTop"><div><span className="eyebrow">RENCANA BULAN INI</span><h2>{rupiah.format(plan.monthlyIncome)}</h2></div><button type="button" onClick={onBudget}>Atur ulang</button></div>
    <div className="budgetSnapshotNumbers budgetSnapshotNumbersFour">
      <p><span>Pengeluaran yang habis</span><strong>{rupiah.format(consumed)}</strong></p>
      <p><span>Investasi & pensiun</span><strong>{rupiah.format(invested)}</strong></p>
      <p><span>Tersimpan ke tujuan</span><strong>{rupiah.format(directed)}</strong></p>
      <p><span>Belum diberi tugas</span><strong>{rupiah.format(Math.max(0, plan.monthlyIncome - used))}</strong></p>
    </div>
    <div className="budgetMiniGrid">{displayAllocations.map((allocation) => {
      const limit = plan.monthlyIncome * allocation.percent / 100;
      const bucketExpense = transactions
        .filter((item) => item.type === "expense" && item.budgetBucket === allocation.bucket)
        .reduce((sum, item) => sum + item.amount, 0);
      const bucketAllocatedIn = transactions
        .filter((item) => item.type === "allocation" && item.allocationAction !== "withdrawal" && item.budgetBucket === allocation.bucket)
        .reduce((sum, item) => sum + item.amount, 0);
      const bucketAllocatedOut = transactions
        .filter((item) => item.type === "allocation" && item.allocationAction === "withdrawal" && item.budgetBucket === allocation.bucket)
        .reduce((sum, item) => sum + item.amount, 0);
      const bucketDirected = Math.max(0, bucketAllocatedIn - bucketAllocatedOut);
      const actual = bucketExpense + bucketDirected;
      const isOver = actual > limit + 1;
      const percent = limit ? Math.min(100, Math.round(actual / limit * 100)) : actual > 0 ? 100 : 0;
      const detailParts: string[] = [];
      if (bucketExpense > 0) detailParts.push(
        allocation.bucket === "Investasi dan pensiun"
          ? "Diinvestasikan " + rupiah.format(bucketExpense)
          : "Dipakai " + rupiah.format(bucketExpense)
      );
      if (bucketDirected > 0) detailParts.push("Disimpan " + rupiah.format(bucketDirected));
      if (!detailParts.length) detailParts.push("Belum digunakan");
      const overText = isOver ? " · melewati " + rupiah.format(actual - limit) : "";
      return <article className={isOver ? "isOver" : undefined} key={allocation.bucket}>
        <div><span>{allocation.bucket}</span><strong>{allocation.percent.toFixed(2).replace(".00", "")}%</strong></div>
        <div className="progressTrack"><i style={{ width: percent + "%" }} /></div>
        <small>{detailParts.join(" · ")} · batas {rupiah.format(limit)}{overText}</small>
      </article>;
    })}</div>
  </section>;
}`;

const budgetPattern = /function BudgetSnapshot\([\s\S]*?(?=\nfunction Record)/;
if (!budgetPattern.test(source)) throw new Error("Atlas reconciled budget snapshot anchor missing");
source = source.replace(budgetPattern, budgetSnapshot);
changed = true;

if (changed) await writeFile(appPath, source, "utf8");
console.log("Atlas budget totals and bucket details reconciled");
