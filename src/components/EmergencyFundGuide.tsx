import { useMemo } from "react";
import { getPersonalizedBudgetRecommendation } from "../domain/personalization";
import { localMonthKey } from "../lib/localDate";
import type { BudgetPlan, FinanceState, FinanceTransaction, FinancialGoal } from "../types";
import AtlasCompanion from "./AtlasCompanion";
import AtlasIcon from "./AtlasIcon";
import "./EmergencyFundGuide.css";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

function goalBalance(goal: FinancialGoal | undefined, transactions: FinanceTransaction[]) {
  if (!goal) return 0;
  const movement = transactions
    .filter((item) => item.type === "allocation" && item.goalId === goal.id)
    .reduce((total, item) => total + (item.allocationAction === "withdrawal" ? -item.amount : item.amount), 0);
  return Math.max(0, goal.initialAmount + movement);
}

function actualEssentialSpending(finance: FinanceState) {
  const month = localMonthKey();
  return finance.transactions
    .filter((item) => item.date.startsWith(month)
      && item.type === "expense"
      && (item.budgetBucket === "Kebutuhan pokok" || item.budgetBucket === "Kewajiban dan utang"))
    .reduce((total, item) => total + item.amount, 0);
}

function plannedEssentialSpending(plan?: BudgetPlan) {
  if (!plan?.monthlyIncome) return 0;
  const percent = plan.allocations
    .filter((item) => item.bucket === "Kebutuhan pokok" || item.bucket === "Kewajiban dan utang")
    .reduce((total, item) => total + item.percent, 0);
  return Math.round(plan.monthlyIncome * percent / 100);
}

export default function EmergencyFundGuide({
  finance,
  currentPlan,
  onOpenGoals,
  onOpenBudget
}: {
  finance: FinanceState;
  currentPlan?: BudgetPlan;
  onOpenGoals: () => void;
  onOpenBudget: () => void;
}) {
  const calculation = useMemo(() => {
    const profile = finance.financialProfile;
    const targetMonths = profile
      ? getPersonalizedBudgetRecommendation(profile).emergencyTargetMonths
      : 3;
    const planned = plannedEssentialSpending(currentPlan);
    const actual = actualEssentialSpending(finance);
    const monthlyEssentials = planned || actual;
    const target = monthlyEssentials * targetMonths;
    const emergencyGoal = finance.goals.find((item) => item.type === "emergency" && !item.isArchived);
    const saved = goalBalance(emergencyGoal, finance.transactions);
    const progressTarget = target || emergencyGoal?.targetAmount || 0;
    const progress = progressTarget ? Math.min(100, Math.round(saved / progressTarget * 100)) : 0;
    const monthsCovered = monthlyEssentials ? saved / monthlyEssentials : 0;

    return {
      targetMonths,
      monthlyEssentials,
      target,
      saved,
      progress,
      monthsCovered,
      manualTarget: emergencyGoal?.targetAmount ?? 0
    };
  }, [finance, currentPlan]);

  const hasEstimate = calculation.monthlyEssentials > 0;
  const reachedFirstMonth = calculation.monthsCovered >= 1;
  const reachedTarget = calculation.target > 0 && calculation.saved >= calculation.target;

  const companionMessage = reachedTarget
    ? "Kamu sudah membangun bantalan yang kuat. Sekarang jaga agar dana ini tetap siap saat benar-benar dibutuhkan."
    : reachedFirstMonth
      ? `Hebat, kamu sudah punya sekitar ${calculation.monthsCovered.toFixed(1).replace(".0", "")} bulan ruang bernapas. Kita lanjut pelan-pelan.`
      : calculation.saved > 0
        ? "Setoran kecil tetap berarti. Kamu sedang membeli lebih banyak waktu untuk dirimu di masa sulit."
        : "Kita tidak perlu langsung mengejar angka besar. Target pertama cukup satu bulan kebutuhan wajib.";

  return (
    <section className="emergencyGuide" aria-labelledby="emergency-guide-title">
      <div className="emergencyGuideMain">
        <div className="emergencyGuideIntro">
          <span className="eyebrow">DANA DARURAT</span>
          <h2 id="emergency-guide-title">Berapa ruang aman yang perlu kamu kumpulkan?</h2>
          <p>
            Atlas menghitung dari kebutuhan pokok dan kewajiban minimum dalam anggaranmu—bukan dari seluruh pemasukan.
          </p>
        </div>

        {hasEstimate ? (
          <>
            <div className="emergencyNumbers">
              <article>
                <span>Kebutuhan wajib per bulan</span>
                <strong>{rupiah.format(calculation.monthlyEssentials)}</strong>
                <small>Kebutuhan pokok + kewajiban minimum</small>
              </article>
              <article className="emergencyTargetNumber">
                <span>Target perlindungan Atlas</span>
                <strong>{rupiah.format(calculation.target)}</strong>
                <small>{calculation.targetMonths} bulan × kebutuhan wajib</small>
              </article>
              <article>
                <span>Sudah terkumpul</span>
                <strong>{rupiah.format(calculation.saved)}</strong>
                <small>{calculation.monthsCovered > 0 ? `Setara ${calculation.monthsCovered.toFixed(1)} bulan` : "Mulai dari nominal yang mungkin"}</small>
              </article>
            </div>

            <div className="emergencyProgress" aria-label={`Progres dana darurat ${calculation.progress} persen`}>
              <div><span>Progres menuju target</span><strong>{calculation.progress}%</strong></div>
              <div className="emergencyProgressTrack"><i style={{ width: `${calculation.progress}%` }} /></div>
              <div className="emergencyMilestones">
                <span className={calculation.monthsCovered >= 1 ? "reached" : ""}>1 bulan</span>
                <span className={calculation.monthsCovered >= Math.ceil(calculation.targetMonths / 2) ? "reached" : ""}>Setengah jalan</span>
                <span className={reachedTarget ? "reached" : ""}>{calculation.targetMonths} bulan</span>
              </div>
            </div>

            {calculation.manualTarget > 0 && calculation.manualTarget !== calculation.target && (
              <p className="emergencyManualTarget">
                Target yang pernah kamu pasang: <strong>{rupiah.format(calculation.manualTarget)}</strong>. Kamu boleh menyesuaikannya setelah menilai kebutuhan nyata.
              </p>
            )}
          </>
        ) : (
          <div className="emergencyNeedsPlan">
            <AtlasIcon name="plan" size={21} />
            <div>
              <strong>Atlas perlu satu angka dasar.</strong>
              <p>Susun anggaran bulan ini agar kebutuhan pokok dan kewajiban minimummu dapat dihitung otomatis.</p>
            </div>
            <button className="secondary" type="button" onClick={onOpenBudget}>Susun anggaran</button>
          </div>
        )}

        <div className="emergencyActions">
          <button className="primary" type="button" onClick={onOpenGoals}>Buka tujuan dana darurat</button>
          {hasEstimate && <button className="secondary" type="button" onClick={onOpenBudget}>Periksa dasar hitungan</button>}
        </div>
      </div>

      <aside className="emergencyCompanionPanel">
        <AtlasCompanion mood={reachedTarget || calculation.saved > 0 ? "cheer" : "guide"} size="large" />
        <div className="companionSpeech">
          <span className="eyebrow">TALA, TEMAN ATLAS</span>
          <strong>{reachedTarget ? "Ruang amanmu sudah terbentuk!" : "Aku jadi tim hore-mu."}</strong>
          <p>{companionMessage}</p>
        </div>

        <details className="emergencyPurpose">
          <summary>Dana darurat itu sebenarnya buat apa?</summary>
          <div>
            <p><strong>Untuk membeli waktu</strong> ketika hidup berubah sebelum kita sempat menyiapkan rencana baru.</p>
            <ul>
              <li>Menjaga kebutuhan pokok saat pemasukan berhenti atau terlambat.</li>
              <li>Membayar kebutuhan kesehatan mendadak yang penting.</li>
              <li>Menangani perbaikan penting agar rumah, kendaraan kerja, atau penghasilan tetap berjalan.</li>
            </ul>
            <p className="emergencyNotFor"><strong>Bukan untuk:</strong> liburan, diskon mendadak, atau tagihan tahunan yang sebenarnya sudah dapat diperkirakan.</p>
          </div>
        </details>
      </aside>
    </section>
  );
}
