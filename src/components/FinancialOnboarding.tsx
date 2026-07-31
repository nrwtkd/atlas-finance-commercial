import { useMemo, useState } from "react";
import {
  getPersonalizedBudgetRecommendation,
  incomePatternOptions,
  lifeStageOptions,
  managedForOptions,
  priorityOptions
} from "../domain/personalization";
import type {
  BudgetStyle,
  DebtCondition,
  EmergencyFundLevel,
  FinancialPriority,
  FinancialProfile,
  IncomePattern,
  LifeStage,
  ManagedFor
} from "../types";

const rupiahPercent = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

export default function FinancialOnboarding({
  name,
  onComplete
}: {
  name: string;
  onComplete: (profile: FinancialProfile) => Promise<void>;
}) {
  const [step, setStep] = useState(1);
  const [lifeStage, setLifeStage] = useState<LifeStage>("working");
  const [incomePattern, setIncomePattern] = useState<IncomePattern>("fixed");
  const [managedFor, setManagedFor] = useState<ManagedFor[]>(["self"]);
  const [dependents, setDependents] = useState(0);
  const [debtCondition, setDebtCondition] = useState<DebtCondition>("none");
  const [emergencyFundLevel, setEmergencyFundLevel] = useState<EmergencyFundLevel>("none");
  const [priorities, setPriorities] = useState<FinancialPriority[]>(["budget"]);
  const [budgetStyle, setBudgetStyle] = useState<BudgetStyle>("balanced");
  const [busy, setBusy] = useState(false);

  const draft = useMemo<FinancialProfile>(() => ({
    lifeStage,
    incomePattern,
    managedFor,
    dependents,
    debtCondition,
    emergencyFundLevel,
    priorities,
    budgetStyle,
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }), [lifeStage, incomePattern, managedFor, dependents, debtCondition, emergencyFundLevel, priorities, budgetStyle]);

  const recommendation = useMemo(() => getPersonalizedBudgetRecommendation(draft), [draft]);

  function toggleManagedFor(value: ManagedFor) {
    setManagedFor((current) => current.includes(value)
      ? current.length === 1 ? current : current.filter((item) => item !== value)
      : [...current, value]);
  }

  function togglePriority(value: FinancialPriority) {
    setPriorities((current) => current.includes(value)
      ? current.length === 1 ? current : current.filter((item) => item !== value)
      : current.length >= 3 ? [...current.slice(1), value] : [...current, value]);
  }

  async function finish() {
    setBusy(true);
    try {
      const timestamp = new Date().toISOString();
      await onComplete({ ...draft, completedAt: timestamp, updatedAt: timestamp });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="financialOnboarding">
      <section className="onboardingShell">
        <header className="onboardingHeader">
          <div className="onboardingBrand"><span>A</span><div><b>ATLAS FINANCE</b><small>Kenali kondisimu</small></div></div>
          <div className="onboardingProgress" aria-label={`Langkah ${step} dari 5`}>
            <span>Langkah {step} dari 5</span>
            <div><i style={{ width: `${step * 20}%` }} /></div>
          </div>
        </header>

        {step === 1 && (
          <section className="onboardingStep">
            <div className="onboardingIntro">
              <span className="eyebrow">MULAI DARI KEADAANMU</span>
              <h1>Halo, {name}. Hidupmu sedang berada di tahap mana?</h1>
              <p>Tidak ada jawaban yang lebih baik. Atlas menggunakan konteks ini agar rekomendasi anggaran tidak terasa seperti rumus untuk semua orang.</p>
            </div>
            <div className="choiceGrid">
              {lifeStageOptions.map((item) => (
                <button key={item.value} type="button" className={lifeStage === item.value ? "choiceCard active" : "choiceCard"} onClick={() => setLifeStage(item.value)}>
                  <strong>{item.label}</strong><span>{item.description}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="onboardingStep">
            <div className="onboardingIntro"><span className="eyebrow">POLA PEMASUKAN</span><h1>Uang biasanya datang dengan pola seperti apa?</h1><p>Pemasukan tetap dan pemasukan yang berubah-ubah membutuhkan cadangan serta ritme budgeting yang berbeda.</p></div>
            <div className="choiceGrid twoColumns">
              {incomePatternOptions.map((item) => (
                <button key={item.value} type="button" className={incomePattern === item.value ? "choiceCard active" : "choiceCard"} onClick={() => setIncomePattern(item.value)}>
                  <strong>{item.label}</strong><span>{item.description}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="onboardingStep">
            <div className="onboardingIntro"><span className="eyebrow">TANGGUNG JAWAB</span><h1>Keuangan ini kamu kelola untuk siapa?</h1><p>Pilih semua yang sesuai. Pengguna yang hidup sendiri cukup memilih diri sendiri.</p></div>
            <div className="chipChoiceGrid">
              {managedForOptions.map((item) => (
                <button key={item.value} type="button" className={managedFor.includes(item.value) ? "onboardingChip active" : "onboardingChip"} onClick={() => toggleManagedFor(item.value)}>
                  {managedFor.includes(item.value) ? "✓ " : "+ "}{item.label}
                </button>
              ))}
            </div>
            <label className="dependentsField">Berapa orang yang kebutuhan rutinnya menjadi tanggunganmu?
              <div><button type="button" onClick={() => setDependents((value) => Math.max(0, value - 1))}>−</button><strong>{dependents}</strong><button type="button" onClick={() => setDependents((value) => Math.min(20, value + 1))}>+</button></div>
              <small>Tidak termasuk dirimu sendiri. Isi 0 bila belum memiliki tanggungan.</small>
            </label>
          </section>
        )}

        {step === 4 && (
          <section className="onboardingStep">
            <div className="onboardingIntro"><span className="eyebrow">RUANG AMAN DAN KEWAJIBAN</span><h1>Apa yang paling menggambarkan kondisimu saat ini?</h1><p>Jawaban ini membantu Atlas menjaga keseimbangan antara kebutuhan, utang, dan dana aman.</p></div>
            <div className="onboardingSplit">
              <fieldset><legend>Kondisi utang atau cicilan</legend>
                {[
                  ["none", "Tidak ada atau sudah lunas", "Belum ada kewajiban utang yang perlu diprioritaskan."],
                  ["manageable", "Ada, tetapi masih terkendali", "Cicilan berjalan dan masih dapat dibayar tanpa mengganggu kebutuhan utama."],
                  ["heavy", "Terasa berat", "Pembayaran utang mulai menekan kebutuhan atau membuat keuangan sulit bernapas."]
                ].map(([value, label, description]) => <button key={value} type="button" className={debtCondition === value ? "choiceCard active" : "choiceCard"} onClick={() => setDebtCondition(value as DebtCondition)}><strong>{label}</strong><span>{description}</span></button>)}
              </fieldset>
              <fieldset><legend>Dana darurat yang sudah tersedia</legend>
                {[
                  ["none", "Belum ada", "Belum memiliki cadangan khusus untuk keadaan mendesak."],
                  ["under_one", "Kurang dari 1 bulan kebutuhan", "Sudah mulai, tetapi bantalan masih tipis."],
                  ["one_to_three", "Sekitar 1–3 bulan kebutuhan", "Sudah memiliki cadangan awal yang cukup berarti."],
                  ["over_three", "Lebih dari 3 bulan kebutuhan", "Cadangan sudah relatif kuat dan dapat dilanjutkan bertahap."]
                ].map(([value, label, description]) => <button key={value} type="button" className={emergencyFundLevel === value ? "choiceCard active" : "choiceCard"} onClick={() => setEmergencyFundLevel(value as EmergencyFundLevel)}><strong>{label}</strong><span>{description}</span></button>)}
              </fieldset>
            </div>
          </section>
        )}

        {step === 5 && (
          <section className="onboardingStep">
            <div className="onboardingIntro"><span className="eyebrow">ARAH TERDEKAT</span><h1>Apa yang paling ingin kamu bangun sekarang?</h1><p>Pilih maksimal tiga. Atlas akan menonjolkan langkah dan pembelajaran yang paling relevan.</p></div>
            <div className="priorityGrid">
              {priorityOptions.map((item) => (
                <button key={item.value} type="button" className={priorities.includes(item.value) ? "choiceCard active" : "choiceCard"} onClick={() => togglePriority(item.value)}>
                  <strong>{item.label}</strong><span>{item.description}</span>
                </button>
              ))}
            </div>
            <fieldset className="budgetStyleField"><legend>Gaya anggaran yang terasa paling mungkin kamu jalani</legend>
              {[
                ["structured", "Terstruktur", "Aku nyaman dengan batas yang jelas dan cukup tegas."],
                ["balanced", "Seimbang", "Aku ingin arahan yang jelas, tetapi masih punya ruang menyesuaikan."],
                ["flexible", "Fleksibel", "Aku butuh ruang gerak agar anggaran tidak terasa menekan."]
              ].map(([value, label, description]) => <button key={value} type="button" className={budgetStyle === value ? "choiceCard active" : "choiceCard"} onClick={() => setBudgetStyle(value as BudgetStyle)}><strong>{label}</strong><span>{description}</span></button>)}
            </fieldset>

            <aside className="recommendationPreview">
              <div><span className="eyebrow">REKOMENDASI AWAL ATLAS</span><h2>{recommendation.label}</h2><p>{recommendation.description}</p></div>
              <div className="recommendationPercentages">
                {recommendation.allocations.map((item) => <p key={item.bucket}><span>{item.bucket}</span><strong>{rupiahPercent.format(item.percent)}%</strong></p>)}
              </div>
              <small>Ini titik awal, bukan aturan wajib. Semua persentase tetap dapat kamu ubah.</small>
            </aside>
          </section>
        )}

        <footer className="onboardingFooter">
          <button className="secondary" type="button" disabled={step === 1 || busy} onClick={() => setStep((value) => Math.max(1, value - 1))}>Kembali</button>
          {step < 5
            ? <button className="primary" type="button" onClick={() => setStep((value) => Math.min(5, value + 1))}>Lanjutkan</button>
            : <button className="primary" type="button" disabled={busy} onClick={() => void finish()}>{busy ? "Menyiapkan rekomendasi…" : "Buat rencana pertamaku"}</button>}
        </footer>
      </section>
    </main>
  );
}
