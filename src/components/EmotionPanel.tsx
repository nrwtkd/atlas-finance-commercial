import { useState, type FormEvent } from "react";
import type { EmotionalCheckIn, EmotionTrigger, FinanceState, MoneyEmotion, SupportNeed } from "../types";

const moods: Array<{ value: MoneyEmotion; label: string }> = [
  { value: "calm", label: "Tenang" },
  { value: "safe", label: "Lega" },
  { value: "grateful", label: "Bersyukur" },
  { value: "happy", label: "Semangat" },
  { value: "anxious", label: "Waspada" },
  { value: "pressured", label: "Penuh pikiran" },
  { value: "guilty", label: "Kurang nyaman" },
  { value: "tired", label: "Lelah" },
  { value: "afraid", label: "Ragu" },
  { value: "confused", label: "Bingung" }
];

const triggers: Array<{ value: EmotionTrigger; label: string }> = [
  { value: "balance", label: "Melihat saldo atau kondisi keuangan" },
  { value: "income", label: "Menerima pemasukan" },
  { value: "needs", label: "Membayar kebutuhan sehari-hari" },
  { value: "bills", label: "Membayar tagihan atau kewajiban" },
  { value: "shopping", label: "Berbelanja atau ingin membeli" },
  { value: "saving", label: "Menabung atau mengalokasikan dana" },
  { value: "debt", label: "Memikirkan atau membayar utang" },
  { value: "conversation", label: "Membicarakan uang dengan orang lain" },
  { value: "future", label: "Memikirkan masa depan" },
  { value: "other", label: "Hal lainnya" }
];

const needs: Array<{ value: SupportNeed; label: string }> = [
  { value: "pause", label: "Jeda sejenak" },
  { value: "clarity", label: "Melihat angka lebih jelas" },
  { value: "small_plan", label: "Satu rencana kecil" },
  { value: "support", label: "Dukungan atau teman bicara" },
  { value: "reduce_temptation", label: "Mengurangi godaan belanja" },
  { value: "celebrate", label: "Merayakan progres" }
];

export function emotionLabel(value: MoneyEmotion) {
  return moods.find((item) => item.value === value)?.label ?? value;
}

export default function EmotionPanel({ finance, onSave }: { finance: FinanceState; onSave: (entry: EmotionalCheckIn) => Promise<void> }) {
  const [emotion, setEmotion] = useState<MoneyEmotion>("calm");
  const [intensity, setIntensity] = useState(3);
  const [trigger, setTrigger] = useState<EmotionTrigger>("balance");
  const [supportNeed, setSupportNeed] = useState<SupportNeed>("clarity");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const now = new Date().toISOString();
      await onSave({ id: crypto.randomUUID(), date: now.slice(0, 10), emotion, intensity, trigger, supportNeed, note: note.trim(), createdAt: now, updatedAt: now });
      setNote("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="reflectionGrid">
      <form className="card reflectionForm" onSubmit={submit}>
        <div><span className="eyebrow">CHECK-IN PERASAAN</span><h3>Apa yang muncul saat kamu memikirkan uang hari ini?</h3><p>Tidak ada jawaban yang salah. Kenali dulu, lalu pilih langkah yang paling membantu.</p></div>
        <label>Perasaan yang paling kuat<select value={emotion} onChange={(event) => setEmotion(event.target.value as MoneyEmotion)}>{moods.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label>Seberapa kuat?<div className="intensityRow">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" className={intensity === value ? "active" : ""} onClick={() => setIntensity(value)}>{value}</button>)}</div><small>1 ringan · 5 sangat kuat</small></label>
        <label>Apa pemicunya?<select value={trigger} onChange={(event) => setTrigger(event.target.value as EmotionTrigger)}>{triggers.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label>Apa yang paling membantu sekarang?<select value={supportNeed} onChange={(event) => setSupportNeed(event.target.value as SupportNeed)}>{needs.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label>Ceritakan sedikit, bila perlu<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={280} placeholder="Contoh: banyak tagihan jatuh tempo dan aku belum tahu jumlah lengkapnya." /></label>
        <aside className="reflectionResponse"><strong>Atlas mendengarmu.</strong><p>Kamu tidak harus menyelesaikan semuanya sekarang. Satu langkah kecil yang jelas lebih berguna daripada memaksa diri membereskan semuanya sekaligus.</p></aside>
        <button className="primary" disabled={busy}>{busy ? "Menyimpan…" : "Simpan check-in"}</button>
      </form>
      <aside className="card recentReflection"><span className="eyebrow">CHECK-IN TERBARU</span>{finance.emotionalCheckIns.length ? finance.emotionalCheckIns.slice(0, 6).map((item) => <article key={item.id}><div><strong>{emotionLabel(item.emotion)}</strong><span>{item.intensity}/5</span></div><small>{new Date(`${item.date}T00:00:00`).toLocaleDateString("id-ID")}</small>{item.note && <p>{item.note}</p>}</article>) : <p>Belum ada check-in. Satu kalimat pendek sudah cukup untuk mulai.</p>}</aside>
    </div>
  );
}
