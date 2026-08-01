import type { BudgetPlan, BudgetBucket, FinanceTransaction } from "../types";
import AtlasCompanion from "./AtlasCompanion";
import "./FundingAwarenessCard.css";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

function budgetLimit(plan: BudgetPlan, bucket: BudgetBucket) {
  const allocation = plan.allocations.find((item) => item.bucket === bucket);
  if (!allocation) return 0;
  if (allocation.basis === "amount" && typeof allocation.amount === "number") return Math.max(0, allocation.amount);
  return Math.max(0, plan.monthlyIncome * allocation.percent / 100);
}

export default function FundingAwarenessCard({
  plan,
  actualIncome,
  transactions,
  onOpenBudget
}: {
  plan?: BudgetPlan;
  actualIncome: number;
  transactions: FinanceTransaction[];
  onOpenBudget: () => void;
}) {
  if (!plan?.monthlyIncome) return null;

  const ratio = Math.min(100, Math.round(actualIncome / plan.monthlyIncome * 100));
  const remainingIncome = Math.max(0, plan.monthlyIncome - actualIncome);
  const movementByBucket = new Map<BudgetBucket, number>();

  for (const item of transactions) {
    if (!item.budgetBucket) continue;
    let movement = 0;
    if (item.type === "expense") movement = item.amount;
    if (item.type === "allocation") movement = item.allocationAction === "withdrawal" ? -item.amount : item.amount;
    movementByBucket.set(item.budgetBucket, (movementByBucket.get(item.budgetBucket) ?? 0) + movement);
  }

  const unplannedMovements = Array.from(movementByBucket.entries())
    .map(([bucket, amount]) => ({ bucket, amount: Math.max(0, amount) }))
    .filter(({ bucket, amount }) => amount > 0 && budgetLimit(plan, bucket) <= 1)
    .sort((a, b) => b.amount - a.amount);

  if (ratio >= 100 && unplannedMovements.length === 0) return null;

  const lowFunding = ratio < 50;
  const moderateFunding = ratio >= 50 && ratio < 100;
  const hasUnplannedMovement = unplannedMovements.length > 0;

  return (
    <section className={`fundingAwareness ${lowFunding ? "fundingAwareness--low" : ""} ${hasUnplannedMovement ? "fundingAwareness--warning" : ""}`} aria-labelledby="funding-awareness-title">
      <div className="fundingAwarenessCompanion">
        <AtlasCompanion
          mood={hasUnplannedMovement ? "warn" : "guide"}
          size="medium"
          label={hasUnplannedMovement ? "Tala mengingatkan ada uang keluar tanpa anggaran" : "Tala membantu menjaga langkah bulan ini"}
        />
      </div>

      <div className="fundingAwarenessBody">
        <span className="eyebrow">{hasUnplannedMovement ? "TALA MENGINGATKAN" : "JAGA LANGKAH BULAN INI"}</span>
        <h2 id="funding-awareness-title">
          {hasUnplannedMovement
            ? "Ada uang yang sudah bergerak sebelum posnya mendapat anggaran."
            : lowFunding
              ? "Rencanamu belum sepenuhnya didanai."
              : moderateFunding
                ? "Pemasukan bulan ini masih bertahap."
                : "Mari jaga pembagian uang yang sudah tersedia."}
        </h2>

        {ratio < 100 && (
          <>
            <p>
              Baru <strong>{rupiah.format(actualIncome)}</strong> dari rencana pemasukan <strong>{rupiah.format(plan.monthlyIncome)}</strong> yang sudah tercatat.
              Atlas tidak menganggap sisa pemasukan pasti akan datang sampai benar-benar dicatat.
            </p>
            <div className="fundingProgress" aria-label={`${ratio} persen rencana pemasukan sudah masuk`}>
              <div><span>Pemasukan yang sudah tersedia</span><strong>{ratio}%</strong></div>
              <div><i style={{ width: `${ratio}%` }} /></div>
              <small>{rupiah.format(remainingIncome)} masih belum masuk</small>
            </div>
            <p className="fundingAdvice">
              {lowFunding
                ? "Utamakan kebutuhan wajib dan kewajiban yang jatuh tempo. Tunda dulu pengeluaran fleksibel serta tambahan yang belum mendesak."
                : "Kamu boleh melanjutkan rencana, tetapi gunakan uang yang sudah benar-benar tersedia—bukan seluruh angka proyeksi."}
            </p>
          </>
        )}

        {hasUnplannedMovement && (
          <div className="unplannedMovement" aria-label="Pergerakan tanpa anggaran">
            {unplannedMovements.map(({ bucket, amount }) => (
              <article key={bucket}>
                <strong>Hei, {rupiah.format(amount)} sudah keluar untuk {bucket}.</strong>
                <p>Pos ini belum punya anggaran. Catatannya tetap aman, tetapi pembagian bulan ini perlu diperbarui agar keputusan berikutnya tidak memakai ruang yang sebenarnya belum tersedia.</p>
              </article>
            ))}
          </div>
        )}
      </div>
      <button className="secondary" type="button" onClick={onOpenBudget}>Sesuaikan anggaran</button>
    </section>
  );
}
