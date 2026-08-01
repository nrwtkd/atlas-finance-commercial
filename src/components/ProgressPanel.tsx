import { useMemo, useState, type FormEvent } from "react";
import type { FinancialWin, FinancialWinCategory, FinanceState } from "../types";

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

const categories: Array<{ value: FinancialWinCategory; label: string }> = [
  { value: "awareness", label: "Lebih sadar" },
  { value: "consistency", label: "Lebih konsisten" },
  { value: "restraint", label: "Berhasil menahan diri" },
  { value: "income", label: "Pemasukan" },
  { value: "budget", label: "Anggaran" },
  { value: "emergency", label: "Dana darurat" },
  { value: "goal", label: "Tujuan keuangan" },
  { value: "debt", label: "Utang berkurang" },
  { value: "learning", label: "Belajar keuangan" },
  { value: "other", label: "Kemenangan lainnya" }
];

function automaticProgress(finance: FinanceState) {
  const items: Array<{ title: string; text: string }> = [];
  if (finance.transactions.length) items.push({ title: "Berani melihat kenyataan", text: "Kamu sudah mulai mencatat, bukan hanya menebak kondisi keuanganmu." });
  if (finance.budgetPlans.length) items.push({ title: "Uangmu sudah punya arah", text: "Kamu telah membuat rencana anggaran yang bisa dievaluasi." });
  const deposits = finance.transactions.filter((item) => item.type === "allocation" && item.allocationAction !== "withdrawal");
  if (deposits.length) items.push({ title: "Mendahulukan masa depan", text: `${rupiah.format(deposits.reduce((sum, item) => sum + item.amount, 0))} sudah diarahkan ke tujuan keuangan.` });
  if (finance.learningProgress.length) items.push({ title: "Belajar sambil berjalan", text: `${finance.learningProgress.length} materi sudah kamu tandai dipahami.` });
  return items;
}

export default function ProgressPanel({ finance, onSave }: { finance: FinanceState; onSave: (entry: FinancialWin) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<FinancialWinCategory>("awareness");
  const [busy, setBusy] = useState(false);
  const automatic = useMemo(() => automaticProgress(finance), [finance]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const now = new Date().toISOString();
      await onSave({ id: crypto.randomUUID(), date: now.slice(0, 10), title: title.trim(), description: description.trim(), amount: Number(amount) || undefined, category, createdAt: now, updatedAt: now });
      setTitle(""); setDescription(""); setAmount("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="winsLayout">
      <section className="card automaticWins">
        <span className="eyebrow">YANG ATLAS LIHAT</span>
        <h3>Kemenangan yang mungkin terlalu kecil untuk kamu sadari.</h3>
        <p>Kemajuan finansial bukan hanya saldo besar. Kejujuran, konsistensi, dan keputusan yang lebih sadar juga layak dirayakan.</p>
        {automatic.length ? automatic.map((item) => <article key={item.title}><span>✦</span><div><strong>{item.title}</strong><p>{item.text}</p></div></article>) : <p>Mulai dengan satu transaksi, rencana, atau materi belajar. Atlas akan membantu melihat progresmu.</p>}
      </section>

      <form className="card reflectionForm" onSubmit={submit}>
        <span className="eyebrow">KEMENANGAN VERSIMU</span>
        <h3>Apa keputusan baik yang ingin kamu ingat?</h3>
        <p>Tidak harus besar. Berhenti sebelum checkout atau berani melihat utang juga bisa menjadi kemenangan.</p>
        <label>Jenis kemenangan<select value={category} onChange={(event) => setCategory(event.target.value as FinancialWinCategory)}>{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label>Judul singkat<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} placeholder="Contoh: memilih membawa bekal minggu ini" required /></label>
        <label>Ceritanya<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={280} placeholder="Apa yang membuat keputusan ini berarti untukmu?" /></label>
        <label>Nominal terkait, opsional<input type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Contoh: 150000" /></label>
        <button className="primary" disabled={busy}>{busy ? "Menyimpan…" : "Simpan kemenangan"}</button>
      </form>

      <section className="card recentReflection">
        <span className="eyebrow">JURNAL KEMENANGAN</span>
        {finance.financialWins.length ? finance.financialWins.slice(0, 12).map((item) => <article key={item.id}><div><strong>{item.title}</strong>{item.amount && <span>{rupiah.format(item.amount)}</span>}</div>{item.description && <p>{item.description}</p>}<small>{new Date(`${item.date}T00:00:00`).toLocaleDateString("id-ID")}</small></article>) : <p>Belum ada kemenangan yang kamu simpan sendiri.</p>}
      </section>
    </div>
  );
}
