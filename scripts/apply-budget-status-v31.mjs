import { readFile, writeFile } from "node:fs/promises";

const appPath = new URL("../src/App.tsx", import.meta.url);
let source = await readFile(appPath, "utf8");

const budgetSnapshot = `function BudgetSnapshot({ plan, transactions, onBudget }: { plan?: BudgetPlan; transactions: FinanceTransaction[]; onBudget: () => void }) {
  if (!plan) return <section className="card emptyBudgetCard"><div><span className="eyebrow">RENCANA BULAN INI</span><h2>Belum ada pembagian anggaran.</h2><p>Masukkan pemasukan, lalu Atlas memberi rekomendasi awal yang tetap bisa kamu ubah.</p></div><button className="secondary" type="button" onClick={onBudget}>Buat rencana</button></section>;

  const normalizedPlanAllocations = normalizeBudgetAllocationsV26(plan.allocations);
  const transactionBuckets = Array.from(new Set(
    transactions
      .map((item) => item.budgetBucket)
      .filter((bucket): bucket is BudgetBucket => Boolean(bucket))
  ));
  const displayAllocations: BudgetAllocation[] = [
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

  return <section className="card budgetSnapshot budgetSnapshotReconciled budgetSnapshotStatus">
    <div className="budgetSnapshotTop"><div><span className="eyebrow">RENCANA BULAN INI</span><h2>{rupiah.format(plan.monthlyIncome)}</h2></div><button type="button" onClick={onBudget}>Atur ulang</button></div>
    <div className="budgetSnapshotNumbers budgetSnapshotNumbersFour">
      <p><span>Pengeluaran yang habis</span><strong>{rupiah.format(consumed)}</strong></p>
      <p><span>Investasi & pensiun</span><strong>{rupiah.format(invested)}</strong></p>
      <p><span>Tersimpan ke tujuan</span><strong>{rupiah.format(directed)}</strong></p>
      <p><span>Belum diberi tugas</span><strong>{rupiah.format(Math.max(0, plan.monthlyIncome - used))}</strong></p>
    </div>
    <div className="budgetMiniGrid">{displayAllocations.map((allocation) => {
      const limit = allocation.basis === "amount" && typeof allocation.amount === "number"
        ? allocation.amount
        : plan.monthlyIncome * allocation.percent / 100;
      const budgetPercent = plan.monthlyIncome ? limit / plan.monthlyIncome * 100 : 0;
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
      const hasBudget = limit > 1;
      const remaining = Math.max(0, limit - actual);
      const isOver = hasBudget && actual > limit + 1;
      const isFinished = hasBudget && actual >= limit - 1;
      const percent = hasBudget ? Math.min(100, Math.round(actual / limit * 100)) : 0;
      const movementLabel = bucketExpense > 0 && bucketDirected > 0
        ? "Sudah digunakan"
        : bucketDirected > 0
          ? "Sudah disimpan"
          : allocation.bucket === "Investasi dan pensiun"
            ? "Sudah diinvestasikan"
            : "Sudah dipakai";
      const statusText = !hasBudget
        ? (actual > 0 ? movementLabel + " " + rupiah.format(actual) : "Pos ini belum mendapat anggaran.")
        : isOver
          ? movementLabel + " " + rupiah.format(actual) + " · melewati " + rupiah.format(actual - limit)
          : isFinished
            ? "Anggaran bulan ini sudah terpakai."
            : "Sisa bisa dipakai " + rupiah.format(remaining);
      const statusClass = !hasBudget ? "isMissing" : isOver ? "isOver" : isFinished ? "isFinished" : undefined;
      return <article className={statusClass} key={allocation.bucket}>
        <div>
          <span>{allocation.bucket}</span>
          {!hasBudget
            ? <span className="budgetStatusStamp budgetStatusStamp--missing">Belum Ada</span>
            : isFinished
              ? <span className="budgetStatusStamp budgetStatusStamp--finished">Habis</span>
              : <strong>{budgetPercent.toLocaleString("id-ID", { maximumFractionDigits: 4 })}%</strong>}
        </div>
        <div className="progressTrack"><i style={{ width: percent + "%" }} /></div>
        <small>{statusText}</small>
      </article>;
    })}</div>
  </section>;
}`;

const budgetPattern = /function BudgetSnapshot\([\s\S]*?(?=\nfunction Record)/;
if (!budgetPattern.test(source)) throw new Error("Atlas budget status snapshot anchor missing");
source = source.replace(budgetPattern, budgetSnapshot);
await writeFile(appPath, source, "utf8");

console.log("Atlas budget status stamps and remaining balance copy ready");
