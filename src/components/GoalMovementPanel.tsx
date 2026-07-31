import { useMemo, useState, type FormEvent } from "react";
import { localDateKey } from "../lib/localDate";
import type { BudgetBucket, BudgetPlan, FinanceTransaction, FinancialGoal } from "../types";
import AtlasIcon from "./AtlasIcon";
import "./GoalMovementPanel.css";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

function bucketForGoal(goal: FinancialGoal): BudgetBucket {
  if (goal.type === "emergency") return "Dana darurat dan perlindungan";
  if (goal.type === "debt") return "Kewajiban dan utang";
  if (goal.type === "worship") return "Berbagi dan ibadah";
  return "Tujuan masa depan";
}

function goalBalance(goal: FinancialGoal, transactions: FinanceTransaction[]) {
  const movement = transactions
    .filter((item) => item.type === "allocation" && item.goalId === goal.id)
    .reduce((total, item) => total + (item.allocationAction === "withdrawal" ? -item.amount : item.amount), 0);
  return Math.max(0, goal.initialAmount + movement);
}

function actionLabel(goal: FinancialGoal, action: "deposit" | "withdrawal") {
  if (action === "withdrawal") return "Terpaksa mengambil dana darurat";
  if (goal.type === "retirement") return "Tambah setoran pensiun";
  if (goal.type === "gold") return "Catat pembelian emas";
  if (goal.type === "emergency") return "Tambah dana darurat";
  return `Tambah dana ke ${goal.name}`;
}

export default function GoalMovementPanel({
  goal,
  action,
  profileName,
  plan,
  monthlyTransactions,
  allTransactions,
  initialTransaction,
  onCancel,
  onSave
}: {
  goal: FinancialGoal;
  action: "deposit" | "withdrawal";
  profileName: string;
  plan?: BudgetPlan;
  monthlyTransactions: FinanceTransaction[];
  allTransactions: FinanceTransaction[];
  initialTransaction?: FinanceTransaction;
  onCancel: () => void;
  onSave: (transaction: FinanceTransaction) => Promise<void>;
}) {
  const lockedGoal = goal.type === "retirement";
  const effectiveAction = lockedGoal ? "deposit" : action;
  const [amount, setAmount] = useState(initialTransaction ? String(initialTransaction.amount) : "");
  const [date, setDate] = useState(initialTransaction?.date ?? localDateKey());
  const [note, setNote] = useState(initialTransaction?.note ?? "");
  const [busy, setBusy] = useState(false);

  const currentBalance = useMemo(() => goalBalance(goal, allTransactions), [goal, allTransactions]);
  const bucket = bucketForGoal(goal);
  const plannedPercent = plan?.allocations.find((item) => item.bucket === bucket)?.percent ?? 0;
  const plannedLimit = plan ? plan.monthlyIncome * plannedPercent / 100 : 0;
  const currentDirected = monthlyTransactions
    .filter((item) => item.id !== initialTransaction?.id
      && item.type === "allocation"
      && item.goalId === goal.id
      && item.allocationAction !== "withdrawal")
    .reduce((total, item) => total + item.amount, 0);
  const projected = currentDirected + (Number(amount) || 0);
  const outsideBudget = effectiveAction === "deposit" && Boolean(plan && plannedPercent === 0 && Number(amount) > 0);
  const aboveBudget = effectiveAction === "deposit" && Boolean(plan && plannedLimit > 0 && projected > plannedLimit);
  const tooMuch = effectiveAction === "withdrawal" && Number(amount) > currentBalance;
  const reasonRequired = effectiveAction === "withdrawal" && !note.trim();

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!value || tooMuch || reasonRequired) return;
    setBusy(true);
    try {
      const timestamp = new Date().toISOString();
      await onSave({
        id: initialTransaction?.id ?? crypto.randomUUID(),
        type: "allocation",
        amount: value,
        date,
        beneficiaries: [profileName],
        category: "Tujuan keuangan",
        activity: effectiveAction === "withdrawal" ? `Pengambilan dari ${goal.name}` : `Setoran ke ${goal.name}`,
        awareness: goal.type === "debt" ? "Payoff" : goal.type === "emergency" ? "Protection" : "Future",
        budgetBucket: bucket,
        goalId: goal.id,
        allocationAction: effectiveAction,
        note: note.trim(),
        createdAt: initialTransaction?.createdAt ?? timestamp,
        updatedAt: timestamp
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="goalMovementPage">
      <div className="heading atlasSectionHeading">
        <div>
          <span className="eyebrow">{effectiveAction === "withdrawal" ? "SAAT RENCANA PERLU MENOLONGMU" : "ARAHKAN UANG KE TUJUAN"}</span>
          <h2>{actionLabel(goal, effectiveAction)}</h2>
          <p>
            {effectiveAction === "withdrawal"
              ? "Catat dengan jujur agar Atlas memahami bahwa dana aman sedang dipakai, bukan menganggapnya sebagai pemasukan baru."
              : `Setoran ini tetap menjadi bagian dari asetmu dan tidak dimasukkan sebagai pengeluaran konsumsi.`}
          </p>
        </div>
        <button type="button" onClick={onCancel}>Batal</button>
      </div>

      <form className="card form goalMovementForm" onSubmit={submit}>
        <div className={`goalMovementIdentity goalMovementIdentity--${goal.type}`}>
          <span><AtlasIcon name={goal.type === "emergency" ? "shield" : goal.type === "retirement" ? "lock" : "target"} size={22} /></span>
          <div>
            <small>{goal.type === "retirement" ? "DANA TERKUNCI" : goal.type === "emergency" ? "DANA SIAP PAKAI SAAT DARURAT" : "TUJUAN KEUANGAN"}</small>
            <strong>{goal.name}</strong>
            <p>Saldo tercatat {rupiah.format(currentBalance)}</p>
          </div>
        </div>

        {lockedGoal && (
          <aside className="lockedGoalNote">
            <AtlasIcon name="lock" size={17} />
            <div><strong>Atlas memperlakukan dana pensiun sebagai uang lupa.</strong><p>Tujuan ini hanya memiliki jalur setoran. Tombol penarikan tidak disediakan karena dana seperti DPLK memang tidak tersedia untuk kebutuhan harian.</p></div>
          </aside>
        )}

        {effectiveAction === "withdrawal" && (
          <aside className="emergencyWithdrawalNote">
            <AtlasIcon name="shield" size={18} />
            <div><strong>Mengambil dana darurat bukan kegagalan.</strong><p>Dana ini memang dibangun untuk dipakai ketika keadaan penting dan tidak terencana terjadi. Setelah keadaan membaik, Atlas akan membantumu membangunnya kembali.</p></div>
          </aside>
        )}

        <label>Nominal<input type="number" inputMode="numeric" min="1" max={effectiveAction === "withdrawal" ? currentBalance : undefined} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Contoh: 250000" required /></label>
        <label>Tanggal<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
        <label>{effectiveAction === "withdrawal" ? "Untuk apa dana ini terpaksa diambil?" : "Catatan"}<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={180} required={effectiveAction === "withdrawal"} placeholder={effectiveAction === "withdrawal" ? "Contoh: biaya obat dan pemeriksaan mendadak" : goal.type === "retirement" ? "Contoh: setoran DPLK Agustus" : "Contoh: setoran rutin bulan ini"} /></label>

        {tooMuch && <p className="goalMovementError">Nominal melebihi saldo {goal.name} yang tercatat.</p>}
        {(outsideBudget || aboveBudget) && (
          <aside className="recordBudgetWarning" role="status">
            <AtlasIcon name="insight" size={18} />
            <div>
              <strong>{outsideBudget ? "Tujuan ini belum mendapat porsi anggaran bulan ini." : "Setoran ini melewati porsi tujuan bulan ini."}</strong>
              <p>{outsideBudget ? "Setoran tetap boleh disimpan. Setelahnya, tinjau anggaran agar keputusan rutin ini punya porsi yang terlihat." : `Setoran ke tujuan ini menjadi ${rupiah.format(projected)}, sedangkan batas pos ${bucket} adalah ${rupiah.format(plannedLimit)}.`}</p>
            </div>
          </aside>
        )}

        <button className={effectiveAction === "withdrawal" ? "secondary goalWithdrawalSubmit" : "primary"} disabled={busy || tooMuch || reasonRequired}>
          {busy ? "Menyimpan…" : initialTransaction ? "Simpan perubahan" : effectiveAction === "withdrawal" ? "Catat pengambilan dana" : actionLabel(goal, effectiveAction)}
        </button>
      </form>
    </section>
  );
}
