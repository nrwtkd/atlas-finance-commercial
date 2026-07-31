import type { BudgetPlan, FinanceTransaction } from "../types";
import AtlasIcon from "./AtlasIcon";
import "./FundingAwarenessCard.css";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

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
  const plannedBuckets = new Map(plan.allocations.map((item) => [item.bucket, item.percent]));
  const unplannedBuckets = Array.from(new Set(
    transactions
      .filter((item) => (item.type === "expense" || (item.type === "allocation" && item.allocationAction !== "withdrawal"))
        && item.budgetBucket
        && (plannedBuckets.get(item.budgetBucket) ?? 0) === 0)
      .map((item) => item.budgetBucket!)
  ));

  if (ratio >= 100 && unplannedBuckets.length === 0) return null;

  const lowFunding = ratio < 50;
  const moderateFunding = ratio >= 50 && ratio < 100;

  return (
    <section className={`fundingAwareness ${lowFunding ? "fundingAwareness--low" : ""}`} aria-labelledby="funding-awareness-title">
      <span className="fundingAwarenessIcon" aria-hidden="true">
        <AtlasIcon name={unplannedBuckets.length ? "insight" : "wallet"} size={21} />
      </span>
      <div className="fundingAwarenessBody">
        <span className="eyebrow">JAGA LANGKAH BULAN INI</span>
        <h2 id="funding-awareness-title">
          {lowFunding
            ? "Rencanamu belum sepenuhnya didanai."
            : moderateFunding
              ? "Pemasukan bulan ini masih bertahap."
              : "Ada pergerakan uang di luar pembagian awal."}
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
                ? "Utamakan kebutuhan wajib dan kewajiban yang jatuh tempo. Tunda dulu pengeluaran fleksibel serta alokasi tambahan yang belum mendesak."
                : "Kamu boleh melanjutkan rencana, tetapi gunakan uang yang sudah benar-benar tersedia—bukan seluruh angka proyeksi."}
            </p>
          </>
        )}

        {unplannedBuckets.length > 0 && (
          <div className="unplannedMovement">
            <strong>Belum mendapat porsi dalam anggaran:</strong>
            <span>{unplannedBuckets.join(", ")}</span>
            <p>Pergerakannya tetap dicatat, tetapi rencana bulan ini perlu disesuaikan supaya laporan tidak menunjukkan target Rp0.</p>
          </div>
        )}
      </div>
      <button className="secondary" type="button" onClick={onOpenBudget}>Tinjau anggaran</button>
    </section>
  );
}
