import { useState, type FormEvent } from "react";
import type { FinanceState, MonthlyReflection } from "../types";

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const monthKey = () => new Date().toISOString().slice(0, 7);

export default function MonthlyReviewPanel({ finance, onSave, onOpenLearning }: { finance: FinanceState; onSave: (entry: MonthlyReflection) => Promise<void>; onOpenLearning: () => void }) {
  const month = monthKey();
  const existing = finance.monthlyReflections.find((item) => item.month === month);
  const [proudOf, setProudOf] = useState(existing?.proudOf ?? "");
  const [worthIt, setWorthIt] = useState(existing?.worthIt ?? "");
  const [patternToChange, setPatternToChange] = useState(existing?.patternToChange ?? "");
  const [nextStep, setNextStep] = useState(existing?.nextStep ?? "");
  const [busy, setBusy] = useState(false);

  const transactions = finance.transactions.filter((item) => item.date.startsWith(month));
  const income = transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expense = transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const allocation = transactions.filter((item) => item.type === "allocation" && item.allocationAction !== "withdrawal").reduce((sum, item) => sum + item.amount, 0);
  const impulse = transactions.filter((item) => item.type === "expense" && item.awareness === "Impulse").reduce((sum, item) => sum + item.amount, 0);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const now = new Date().toISOString();
      await onSave({
        id: existing?.id ?? crypto.randomUUID(),
        month,
        proudOf: proudOf.trim(),
        worthIt: worthIt.trim(),
        patternToChange: patternToChange.trim(),
        nextStep: nextStep.trim(),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="monthlyLayout">
      <section className="card monthlyNumbers">
        <span className="eyebrow">CERMIN BULAN INI</span>
        <h3>{new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</h3>
        <div className="monthlyNumberGrid">
          <p><span>Pemasukan</span><strong>{rupiah.format(income)}</strong></p>
          <p><span>Pengeluaran</span><strong>{rupiah.format(expense)}</strong></p>
          <p><span>Dialokasikan</span><strong>{rupiah.format(allocation)}</strong></p>
          <p><span>Impulsif</span><strong>{rupiah.format(impulse)}</strong></p>
        </div>
        <aside><strong>Angka bukan nilai dirimu.</strong><p>Gunakan angka sebagai bahan percakapan yang jujur, bukan alasan menyalahkan diri.</p></aside>
      </section>

      <form className="card reflectionForm" onSubmit={submit}>
        <span className="eyebrow">REFLEKSI BULANAN</span>
        <h3>Apa yang ingin kamu bawa ke bulan berikutnya?</h3>
        <label>Kemenangan yang paling kubanggakan<textarea value={proudOf} onChange={(event) => setProudOf(event.target.value)} maxLength={360} placeholder="Keputusan, kebiasaan, atau keberanian apa yang membuatmu bangga?" /></label>
        <label>Pengeluaran yang terasa sepadan<textarea value={worthIt} onChange={(event) => setWorthIt(event.target.value)} maxLength={360} placeholder="Apa yang benar-benar memberi manfaat atau kebahagiaan?" /></label>
        <label>Pola yang ingin kuubah<textarea value={patternToChange} onChange={(event) => setPatternToChange(event.target.value)} maxLength={360} placeholder="Tanpa menghakimi, pola apa yang mulai kamu sadari?" /></label>
        <label>Satu langkah realistis bulan depan<textarea value={nextStep} onChange={(event) => setNextStep(event.target.value)} maxLength={360} placeholder="Pilih satu langkah kecil yang mungkin benar-benar dilakukan." /></label>
        <button className="primary" disabled={busy}>{busy ? "Menyimpan…" : existing ? "Perbarui refleksi" : "Simpan refleksi bulan ini"}</button>
      </form>

      <section className="card learningBridge">
        <div><span className="eyebrow">DARI REFLEKSI KE PENGETAHUAN</span><h3>Temukan alasan di balik rekomendasi Atlas.</h3><p>Pelajari arus kas, anggaran, dana darurat, utang, proteksi, dan tujuan keuangan.</p></div>
        <button className="secondary" type="button" onClick={onOpenLearning}>Buka ruang belajar</button>
      </section>
    </div>
  );
}
