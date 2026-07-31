import { useState } from "react";
import EmotionPanel, { emotionLabel } from "./EmotionPanel";
import ProgressPanel from "./ProgressPanel";
import MonthlyReviewPanel from "./MonthlyReviewPanel";
import type { EmotionalCheckIn, FinancialWin, FinanceState, MonthlyReflection } from "../types";
import "./ReflectionCenter.css";

type Tab = "emotion" | "wins" | "monthly";

type Props = {
  finance: FinanceState;
  onSaveCheckIn: (entry: EmotionalCheckIn) => Promise<void>;
  onSaveWin: (entry: FinancialWin) => Promise<void>;
  onSaveMonthly: (entry: MonthlyReflection) => Promise<void>;
  onOpenLearning: () => void;
};

export function ReflectionSnapshot({ finance, onOpen }: { finance: FinanceState; onOpen: () => void }) {
  const latest = finance.emotionalCheckIns[0];
  const count = finance.financialWins.length;
  return (
    <section className="card reflectionSnapshot">
      <div><span className="eyebrow">CERITA DI BALIK ANGKA</span><h2>{latest ? `Terakhir kamu merasa ${emotionLabel(latest.emotion).toLowerCase()}.` : "Bagaimana rasanya mengelola uang akhir-akhir ini?"}</h2><p>Atlas tidak hanya membaca jumlah uang. Perasaan, keberanian, dan keputusan kecilmu juga layak diperhatikan.</p></div>
      <div className="reflectionSnapshotAction"><span><strong>{count}</strong><small>kemenangan tersimpan</small></span><button className="secondary" type="button" onClick={onOpen}>Buka ruang refleksi</button></div>
    </section>
  );
}

export default function ReflectionCenter({ finance, onSaveCheckIn, onSaveWin, onSaveMonthly, onOpenLearning }: Props) {
  const [tab, setTab] = useState<Tab>("emotion");
  const [message, setMessage] = useState("");
  return (
    <section className="reflectionPage">
      <div className="pageIntro"><span className="eyebrow">RUANG REFLEKSI</span><h2>Angka penting. Cerita di baliknya juga penting.</h2><p>Kenali perasaanmu tentang uang, rayakan keputusan baik yang sering luput, lalu pilih langkah berikutnya tanpa menghakimi diri sendiri.</p></div>
      <div className="reflectionTabs"><button type="button" className={tab === "emotion" ? "active" : ""} onClick={() => setTab("emotion")}>Perasaan</button><button type="button" className={tab === "wins" ? "active" : ""} onClick={() => setTab("wins")}>Kemenangan</button><button type="button" className={tab === "monthly" ? "active" : ""} onClick={() => setTab("monthly")}>Bulanan</button></div>
      {message && <button className="reflectionMessage" type="button" onClick={() => setMessage("")}>{message}</button>}
      {tab === "emotion" && <EmotionPanel finance={finance} onSave={async (entry) => { await onSaveCheckIn(entry); setMessage("Check-in tersimpan. Terima kasih sudah jujur pada dirimu sendiri."); }} />}
      {tab === "wins" && <ProgressPanel finance={finance} onSave={async (entry) => { await onSaveWin(entry); setMessage("Kemenanganmu tersimpan. Progres kecil tetap progres."); }} />}
      {tab === "monthly" && <MonthlyReviewPanel finance={finance} onSave={async (entry) => { await onSaveMonthly(entry); setMessage("Refleksi bulan ini sudah disimpan."); }} onOpenLearning={onOpenLearning} />}
    </section>
  );
}
