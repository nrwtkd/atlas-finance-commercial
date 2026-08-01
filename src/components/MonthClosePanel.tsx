import { useMemo, useState, type FormEvent } from "react";
import { getPersonalizedBudgetRecommendation } from "../domain/personalization";
import type {
  BudgetAllocation,
  BudgetBucket,
  BudgetPlan,
  FinanceState,
  FinanceTransaction,
  FinancialGoal,
  MonthCloseAction,
  MonthlyReflection
} from "../types";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function nextMonthKey() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return monthKey(date);
}

function monthLabel(key: string) {
  return new Date(`${key}-01T00:00:00`).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric"
  });
}

function sum(items: FinanceTransaction[]) {
  return items.reduce((total, item) => total + item.amount, 0);
}

function goalBalance(goal: FinancialGoal, transactions: FinanceTransaction[]) {
  const movement = transactions
    .filter((item) => item.type === "allocation" && item.goalId === goal.id)
    .reduce((total, item) => total + (item.allocationAction === "withdrawal" ? -item.amount : item.amount), 0);
  return Math.max(0, goal.initialAmount + movement);
}

function move(
  values: Record<BudgetBucket, number>,
  from: BudgetBucket,
  to: BudgetBucket,
  amount: number
) {
  const actual = Math.min(amount, Math.max(0, values[from]));
  values[from] -= actual;
  values[to] += actual;
}

function normalize(values: Record<BudgetBucket, number>): BudgetAllocation[] {
  const entries = Object.entries(values) as Array<[BudgetBucket, number]>;
  const rounded = entries.map(([bucket, value]) => ({ bucket, percent: Math.max(0, Math.round(value)) }));
  const total = rounded.reduce((result, item) => result + item.percent, 0);
  const difference = 100 - total;
  const needs = rounded.find((item) => item.bucket === "Kebutuhan pokok");
  if (needs) needs.percent = Math.max(0, needs.percent + difference);
  return rounded;
}

function buildNextMonthAllocations(finance: FinanceState, transactions: FinanceTransaction[], currentPlan?: BudgetPlan) {
  const fallback: BudgetAllocation[] = currentPlan?.allocations ?? [
    { bucket: "Kebutuhan pokok", percent: 50 },
    { bucket: "Kewajiban dan utang", percent: 15 },
    { bucket: "Dana darurat dan perlindungan", percent: 10 },
    { bucket: "Tujuan masa depan", percent: 10 },
    { bucket: "Keinginan dan gaya hidup", percent: 10 },
    { bucket: "Berbagi dan ibadah", percent: 5 }
  ];
  const recommendation = finance.financialProfile
    ? getPersonalizedBudgetRecommendation(finance.financialProfile)
    : null;
  const base = recommendation?.allocations ?? fallback;
  const values = Object.fromEntries(base.map((item) => [item.bucket, item.percent])) as Record<BudgetBucket, number>;

  const expense = sum(transactions.filter((item) => item.type === "expense"));
  const impulse = sum(transactions.filter((item) => item.type === "expense" && item.awareness === "Impulse"));
  const impulsePercent = expense ? Math.round(impulse / expense * 100) : 0;

  if (impulsePercent >= 20) {
    move(values, "Keinginan dan gaya hidup", "Dana darurat dan perlindungan", 3);
  }

  if (currentPlan?.monthlyIncome) {
    const usage = currentPlan.allocations.map((allocation) => {
      const planned = currentPlan.monthlyIncome * allocation.percent / 100;
      const actual = sum(transactions.filter((item) => item.budgetBucket === allocation.bucket && (
        item.type === "expense" || (item.type === "allocation" && item.allocationAction !== "withdrawal")
      )));
      return { bucket: allocation.bucket, planned, actual, ratio: planned ? actual / planned : 0 };
    });
    const pressured = usage
      .filter((item) => item.ratio > 1.12 && item.bucket !== "Keinginan dan gaya hidup")
      .sort((a, b) => b.ratio - a.ratio)[0];
    if (pressured) {
      move(values, "Keinginan dan gaya hidup", pressured.bucket, 2);
    }
  }

  if (finance.financialProfile?.debtCondition === "heavy") {
    move(values, "Tujuan masa depan", "Kewajiban dan utang", 3);
  }
  if (finance.financialProfile?.emergencyFundLevel === "none") {
    move(values, "Tujuan masa depan", "Dana darurat dan perlindungan", 2);
  }

  return {
    scenario: recommendation?.scenario ?? currentPlan?.scenario ?? "seimbang",
    allocations: normalize(values),
    reasons: recommendation?.reasons ?? []
  };
}

function allocationTransaction(
  profileName: string,
  goal: FinancialGoal,
  amount: number,
  note: string,
  date: string
): FinanceTransaction {
  const now = new Date().toISOString();
  const bucket: BudgetBucket = goal.type === "emergency"
    ? "Dana darurat dan perlindungan"
    : goal.type === "debt"
      ? "Kewajiban dan utang"
      : goal.type === "worship"
        ? "Berbagi dan ibadah"
        : "Tujuan masa depan";
  return {
    id: crypto.randomUUID(),
    type: "allocation",
    amount,
    date,
    beneficiaries: [profileName],
    category: "Tujuan keuangan",
    activity: `Setoran ${goal.name}`,
    awareness: goal.type === "debt" ? "Payoff" : goal.type === "emergency" ? "Protection" : "Future",
    budgetBucket: bucket,
    goalId: goal.id,
    allocationAction: "deposit",
    note,
    createdAt: now,
    updatedAt: now
  };
}

export default function MonthClosePanel({
  finance,
  onCommit
}: {
  finance: FinanceState;
  onCommit: (next: FinanceState) => Promise<void>;
}) {
  const month = monthKey();
  const nextMonth = nextMonthKey();
  const existing = finance.monthlyReflections.find((item) => item.month === month);
  const transactions = finance.transactions.filter((item) => item.date.startsWith(month));
  const currentPlan = finance.budgetPlans.find((item) => item.month === month);
  const nextExistingPlan = finance.budgetPlans.find((item) => item.month === nextMonth);

  const income = sum(transactions.filter((item) => item.type === "income"));
  const expense = sum(transactions.filter((item) => item.type === "expense"));
  const allocated = sum(transactions.filter((item) => item.type === "allocation" && item.allocationAction !== "withdrawal"));
  const withdrawn = sum(transactions.filter((item) => item.type === "allocation" && item.allocationAction === "withdrawal"));
  const available = Math.max(0, income - expense - allocated + withdrawn);
  const impulse = sum(transactions.filter((item) => item.type === "expense" && item.awareness === "Impulse"));
  const impulsePercent = expense ? Math.round(impulse / expense * 100) : 0;

  const emergencyGoal = finance.goals.find((item) => item.type === "emergency" && !item.isArchived);
  const debtGoal = finance.goals.find((item) => item.type === "debt" && !item.isArchived);
  const regularGoals = finance.goals.filter((item) => !item.isArchived && item.type !== "emergency" && item.type !== "debt");

  const suggested = useMemo(
    () => buildNextMonthAllocations(finance, transactions, currentPlan),
    [finance, transactions, currentPlan]
  );

  const [proudOf, setProudOf] = useState(existing?.proudOf ?? "");
  const [worthIt, setWorthIt] = useState(existing?.worthIt ?? "");
  const [patternToChange, setPatternToChange] = useState(existing?.patternToChange ?? "");
  const [nextStep, setNextStep] = useState(existing?.nextStep ?? "");
  const [action, setAction] = useState<MonthCloseAction>(existing?.remainingAction ?? "carry");
  const [remainingAmount, setRemainingAmount] = useState(String(existing?.remainingAmount ?? available));
  const [goalId, setGoalId] = useState(existing?.remainingGoalId ?? regularGoals[0]?.id ?? "");
  const [nextIncome, setNextIncome] = useState(String(nextExistingPlan?.monthlyIncome ?? currentPlan?.monthlyIncome ?? income || ""));
  const [createNextPlan, setCreateNextPlan] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(existing?.closedAt ? `Bulan ini ditutup pada ${new Date(existing.closedAt).toLocaleDateString("id-ID")}.` : "");

  const amount = Math.min(available, Math.max(0, Number(remainingAmount) || 0));
  const selectedGoal = finance.goals.find((item) => item.id === goalId && !item.isArchived);
  const actionUnavailable = (action === "emergency" && !emergencyGoal)
    || (action === "debt" && !debtGoal)
    || ((action === "goal" || action === "split") && !selectedGoal);

  const budgetRows = currentPlan?.allocations.map((allocation) => {
    const planned = currentPlan.monthlyIncome * allocation.percent / 100;
    const actual = sum(transactions.filter((item) => item.budgetBucket === allocation.bucket && (
      item.type === "expense" || (item.type === "allocation" && item.allocationAction !== "withdrawal")
    )));
    return { ...allocation, planned, actual, percentUsed: planned ? Math.round(actual / planned * 100) : 0 };
  }) ?? [];

  const emotionCounts = new Map<string, number>();
  finance.emotionalCheckIns
    .filter((item) => item.date.startsWith(month))
    .forEach((item) => emotionCounts.set(item.emotion, (emotionCounts.get(item.emotion) ?? 0) + 1));
  const dominantEmotion = [...emotionCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (actionUnavailable) return;
    setBusy(true);
    setMessage("");
    try {
      const now = new Date().toISOString();
      const date = new Date().toISOString().slice(0, 10);
      const oldGeneratedIds = new Set(existing?.generatedTransactionIds ?? []);
      const baseTransactions = finance.transactions.filter((item) => !oldGeneratedIds.has(item.id));
      const generated: FinanceTransaction[] = [];

      if (amount > 0 && action === "emergency" && emergencyGoal) {
        generated.push(allocationTransaction(finance.profileName, emergencyGoal, amount, "Arah sisa dana saat tutup bulan", date));
      }
      if (amount > 0 && action === "goal" && selectedGoal) {
        generated.push(allocationTransaction(finance.profileName, selectedGoal, amount, "Arah sisa dana saat tutup bulan", date));
      }
      if (amount > 0 && action === "debt" && debtGoal) {
        generated.push(allocationTransaction(finance.profileName, debtGoal, amount, "Arah sisa dana saat tutup bulan", date));
      }
      if (amount > 0 && action === "split" && emergencyGoal && selectedGoal) {
        const first = Math.floor(amount / 2);
        const second = amount - first;
        if (first > 0) generated.push(allocationTransaction(finance.profileName, emergencyGoal, first, "Pembagian sisa dana saat tutup bulan", date));
        if (second > 0) generated.push(allocationTransaction(finance.profileName, selectedGoal, second, "Pembagian sisa dana saat tutup bulan", date));
      }

      let nextMonthPlanId = existing?.nextMonthPlanId;
      let budgetPlans = finance.budgetPlans;
      const numericNextIncome = Number(nextIncome) || 0;
      if (createNextPlan && numericNextIncome > 0) {
        const plan: BudgetPlan = {
          id: nextExistingPlan?.id ?? existing?.nextMonthPlanId ?? crypto.randomUUID(),
          month: nextMonth,
          monthlyIncome: numericNextIncome,
          scenario: suggested.scenario,
          allocations: suggested.allocations,
          createdAt: nextExistingPlan?.createdAt ?? now,
          updatedAt: now
        };
        nextMonthPlanId = plan.id;
        budgetPlans = [plan, ...finance.budgetPlans.filter((item) => item.month !== nextMonth)];
      }

      const reflection: MonthlyReflection = {
        id: existing?.id ?? crypto.randomUUID(),
        month,
        proudOf: proudOf.trim(),
        worthIt: worthIt.trim(),
        patternToChange: patternToChange.trim(),
        nextStep: nextStep.trim(),
        closedAt: now,
        closingAvailable: available,
        remainingAction: action,
        remainingAmount: amount,
        remainingGoalId: action === "goal" || action === "split" ? selectedGoal?.id : action === "emergency" ? emergencyGoal?.id : action === "debt" ? debtGoal?.id : undefined,
        generatedTransactionIds: generated.map((item) => item.id),
        nextMonthPlanId,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };

      await onCommit({
        ...finance,
        transactions: [...generated, ...baseTransactions],
        budgetPlans,
        monthlyReflections: [reflection, ...finance.monthlyReflections.filter((item) => item.month !== month)]
      });
      setMessage(`Bulan ${monthLabel(month)} sudah ditutup. Rencana ${monthLabel(nextMonth)} juga sudah disiapkan.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="monthClose" onSubmit={submit}>
      <section className="closeHero">
        <div><span className="eyebrow">TUTUP BULAN BERSAMA ATLAS</span><h3>Berhenti sebentar, lihat kenyataan, lalu bawa pelajarannya ke depan.</h3><p>Penutupan bulan bukan ujian lulus atau gagal. Ini cara memberi makna pada angka sebelum membuat rencana baru.</p></div>
        <span>{monthLabel(month)}</span>
      </section>

      {message && <button className="reflectionMessage" type="button" onClick={() => setMessage("")}>{message}</button>}

      <section className="closeSummaryGrid">
        <article><span>Pemasukan</span><strong>{rupiah.format(income)}</strong></article>
        <article><span>Pengeluaran</span><strong>{rupiah.format(expense)}</strong></article>
        <article><span>Dialokasikan</span><strong>{rupiah.format(allocated)}</strong></article>
        <article className="available"><span>Dana tersedia</span><strong>{rupiah.format(available)}</strong></article>
      </section>

      <section className="card planRealityCard">
        <div><span className="eyebrow">RENCANA DAN KENYATAAN</span><h3>Pos mana yang perlu dipahami, bukan disalahkan?</h3></div>
        {budgetRows.length ? (
          <div className="planRealityRows">
            {budgetRows.map((row) => (
              <article key={row.bucket}>
                <div><strong>{row.bucket}</strong><span>{row.percentUsed}% terpakai</span></div>
                <div className="progressTrack"><i style={{ width: `${Math.min(100, row.percentUsed)}%` }} /></div>
                <small>{rupiah.format(row.actual)} dari rencana {rupiah.format(row.planned)}</small>
              </article>
            ))}
          </div>
        ) : <p>Belum ada anggaran bulan ini. Atlas tetap dapat menyiapkan titik awal personal untuk bulan depan.</p>}
      </section>

      <section className="closeSignalGrid">
        <article className="card"><span className="eyebrow">IMPULSIF</span><strong>{impulsePercent}%</strong><p>dari seluruh pengeluaran bulan ini.</p></article>
        <article className="card"><span className="eyebrow">PERASAAN YANG SERING MUNCUL</span><strong>{dominantEmotion ?? "Belum tercatat"}</strong><p>Gunakan sebagai petunjuk refleksi, bukan diagnosis.</p></article>
        <article className="card"><span className="eyebrow">PROGRES TUJUAN</span><strong>{rupiah.format(allocated)}</strong><p>dialokasikan untuk dana aman atau tujuan.</p></article>
      </section>

      <section className="card closeReflectionCard">
        <span className="eyebrow">BAWA PELAJARANNYA</span>
        <h3>Empat catatan untuk dirimu sendiri.</h3>
        <div className="closeReflectionGrid">
          <label>Yang paling kubanggakan<textarea value={proudOf} onChange={(event) => setProudOf(event.target.value)} maxLength={360} /></label>
          <label>Pengeluaran yang terasa sepadan<textarea value={worthIt} onChange={(event) => setWorthIt(event.target.value)} maxLength={360} /></label>
          <label>Pola yang ingin kuubah<textarea value={patternToChange} onChange={(event) => setPatternToChange(event.target.value)} maxLength={360} /></label>
          <label>Satu langkah realistis bulan depan<textarea value={nextStep} onChange={(event) => setNextStep(event.target.value)} maxLength={360} /></label>
        </div>
      </section>

      <section className="card remainingDirectionCard">
        <div><span className="eyebrow">ARAHKAN SISA DANA</span><h3>{available > 0 ? `${rupiah.format(available)} masih punya pilihan.` : "Belum ada sisa dana yang perlu diarahkan."}</h3><p>Dana yang diarahkan ke tujuan akan otomatis masuk ke tracker. Membawanya sebagai saldo awal tidak dihitung sebagai pemasukan baru.</p></div>
        <label>Jumlah yang ingin diarahkan<input type="number" min="0" max={available} inputMode="numeric" value={remainingAmount} onChange={(event) => setRemainingAmount(event.target.value)} disabled={!available} /></label>
        <div className="closeActionGrid">
          {[
            ["carry", "Bawa sebagai saldo awal", "Simpan sebagai ruang bernapas untuk bulan berikutnya."],
            ["emergency", "Masukkan ke dana darurat", "Tracker dana darurat bertambah otomatis."],
            ["goal", "Arahkan ke satu tujuan", "Pilih tujuan yang paling penting sekarang."],
            ["debt", "Tambahkan untuk pelunasan utang", "Tersedia bila kamu sudah membuat tujuan pelunasan utang."],
            ["split", "Bagi ke dana darurat dan tujuan", "Membagi nominal sama rata ke dua arah."]
          ].map(([value, label, description]) => (
            <button key={value} type="button" className={action === value ? "closeAction active" : "closeAction"} onClick={() => setAction(value as MonthCloseAction)} disabled={!available && value !== "carry"}>
              <strong>{label}</strong><span>{description}</span>
            </button>
          ))}
        </div>
        {(action === "goal" || action === "split") && (
          <label>Tujuan yang dipilih<select value={goalId} onChange={(event) => setGoalId(event.target.value)}>{regularGoals.map((goal) => <option key={goal.id} value={goal.id}>{goal.name} · {rupiah.format(goalBalance(goal, finance.transactions))}</option>)}</select></label>
        )}
        {action === "emergency" && !emergencyGoal && <p className="formMessage">Buat tujuan dana darurat terlebih dahulu.</p>}
        {action === "debt" && !debtGoal && <p className="formMessage">Buat tujuan pelunasan utang terlebih dahulu.</p>}
        {(action === "goal" || action === "split") && !regularGoals.length && <p className="formMessage">Buat satu tujuan keuangan terlebih dahulu.</p>}
      </section>

      <section className="card nextPlanCard">
        <div><span className="eyebrow">RENCANA {monthLabel(nextMonth).toUpperCase()}</span><h3>Atlas menyesuaikan rencana dari kondisimu dan pelajaran bulan ini.</h3><p>Rekomendasi tidak sekadar menyalin bulan lama. Tekanan pos, belanja impulsif, utang, dana darurat, dan profilmu ikut dipertimbangkan.</p></div>
        <label className="togglePlan"><input type="checkbox" checked={createNextPlan} onChange={(event) => setCreateNextPlan(event.target.checked)} /> Siapkan rencana anggaran bulan berikutnya</label>
        {createNextPlan && <>
          <label>Perkiraan pemasukan bulan depan<input type="number" min="0" inputMode="numeric" value={nextIncome} onChange={(event) => setNextIncome(event.target.value)} /></label>
          <div className="nextPlanAllocationGrid">{suggested.allocations.map((item) => <p key={item.bucket}><span>{item.bucket}</span><strong>{item.percent}%</strong></p>)}</div>
          {suggested.reasons.length > 0 && <ul className="nextPlanReasons">{suggested.reasons.slice(0, 3).map((reason) => <li key={reason}>{reason}</li>)}</ul>}
        </>}
      </section>

      <button className="primary closeSubmit" disabled={busy || actionUnavailable || (createNextPlan && !(Number(nextIncome) > 0))}>
        {busy ? "Menutup bulan…" : existing?.closedAt ? "Perbarui penutupan bulan" : "Tutup bulan dan siapkan rencana baru"}
      </button>
      <p className="fine closeFine">Semua data penutupan bulan tetap tersimpan terenkripsi di perangkatmu.</p>
    </form>
  );
}
