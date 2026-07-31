import type { BudgetPlan, FinanceTransaction } from "../types";
import "../emergency-tracker.css";

type EmergencyFundTrackerProps = {
  plan?: BudgetPlan;
  transactions: FinanceTransaction[];
};

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

function isEmergencyFundContribution(item: FinanceTransaction): boolean {
  if (item.type !== "expense") return false;

  const activity = item.activity.trim().toLocaleLowerCase("id-ID");
  const category = item.category.trim().toLocaleLowerCase("id-ID");
  const note = item.note.trim().toLocaleLowerCase("id-ID");

  return activity === "dana darurat"
    || activity === "setoran dana darurat"
    || activity === "emergency fund"
    || (category === "dana darurat dan perlindungan" && note.includes("dana darurat"));
}

export default function EmergencyFundTracker({ plan, transactions }: EmergencyFundTrackerProps) {
  const contributions = transactions.filter(isEmergencyFundContribution);
  const saved = contributions.reduce((total, item) => total + item.amount, 0);
  const monthlyNeeds = plan
    ? plan.monthlyIncome * (plan.allocations.find((item) => item.bucket === "Kebutuhan pokok")?.percent ?? 0) / 100
    : 0;
  const target = monthlyNeeds * 6;
  const progress = target > 0 ? Math.min(100, Math.round(saved / target * 100)) : 0;
  const remaining = Math.max(0, target - saved);

  if (!plan && saved === 0) return null;

  return (
    <section className="card emergencyTracker" aria-labelledby="emergency-tracker-title">
      <div className="emergencyTrackerHeader">
        <div>
          <span className="eyebrow">DANA DARURAT</span>
          <h2 id="emergency-tracker-title">Rasa aman yang sedang kamu bangun.</h2>
        </div>
        <span className="automaticBadge">Terhubung otomatis</span>
      </div>

      <div className="emergencyTrackerNumbers">
        <p>
          <span>Sudah terkumpul</span>
          <strong>{rupiah.format(saved)}</strong>
        </p>
        <p>
          <span>{target > 0 ? "Gambaran target" : "Setoran tercatat"}</span>
          <strong>{target > 0 ? rupiah.format(target) : `${contributions.length} transaksi`}</strong>
        </p>
      </div>

      {target > 0 && (
        <>
          <div className="emergencyProgress" aria-label={`Capaian dana darurat ${progress}%`}>
            <i style={{ width: `${progress}%` }} />
          </div>
          <div className="emergencyProgressMeta">
            <strong>{progress}% tercapai</strong>
            <span>{remaining > 0 ? `${rupiah.format(remaining)} lagi menuju gambaran target` : "Gambaran target sudah tercapai"}</span>
          </div>
        </>
      )}

      <p className="emergencyTrackerHelp">
        Setiap pengeluaran dengan aktivitas <strong>Dana darurat</strong> otomatis dihitung sebagai setoran ke tracker ini.
        Gambaran target memakai enam bulan pos kebutuhan pokok dari rencana anggaranmu dan tetap dapat disesuaikan pada pengembangan berikutnya.
      </p>
    </section>
  );
}
