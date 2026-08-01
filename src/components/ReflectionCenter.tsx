import { useState } from "react";
import EmotionPanel, { emotionLabel } from "./EmotionPanel";
import ProgressPanel from "./ProgressPanel";
import MonthlyReviewPanel from "./MonthlyReviewPanel";
import PersonalInsightsPanel from "./PersonalInsightsPanel";
import MonthClosePanel from "./MonthClosePanel";
import AtlasIcon, { type AtlasIconName } from "./AtlasIcon";
import type { EmotionalCheckIn, FinancialWin, FinanceState, MonthlyReflection } from "../types";
import "./ReflectionCenter.css";
import "./InsightClose.css";

type Tab = "insights" | "emotion" | "wins" | "monthly" | "close";

type Props = {
  finance: FinanceState;
  onSaveCheckIn: (entry: EmotionalCheckIn) => Promise<void>;
  onSaveWin: (entry: FinancialWin) => Promise<void>;
  onSaveMonthly: (entry: MonthlyReflection) => Promise<void>;
  onCommitFinance: (next: FinanceState) => Promise<void>;
  onOpenLearning: () => void;
};

const reflectionTabs: Array<{ value: Tab; label: string; icon: AtlasIconName }> = [
  { value: "insights", label: "Insight", icon: "insight" },
  { value: "emotion", label: "Perasaan", icon: "heart" },
  { value: "wins", label: "Kemenangan", icon: "trophy" },
  { value: "monthly", label: "Refleksi bulanan", icon: "calendar" },
  { value: "close", label: "Tutup bulan", icon: "target" }
];

export function ReflectionSnapshot({ finance, onOpen }: { finance: FinanceState; onOpen: () => void }) {
  const latest = finance.emotionalCheckIns[0];
  const count = finance.financialWins.length;
  const month = new Date().toISOString().slice(0, 7);
  const isClosed = finance.monthlyReflections.some((item) => item.month === month && item.closedAt);
  return (
    <section className="card reflectionSnapshot">
      <span className="reflectionSnapshotIcon" aria-hidden="true"><AtlasIcon name="reflect" size={23} /></span>
      <div>
        <span className="eyebrow">CERITA DI BALIK ANGKA</span>
        <h2>{latest ? `Terakhir kamu merasa ${emotionLabel(latest.emotion).toLowerCase()}.` : "Atlas mulai membaca cerita di balik angkamu."}</h2>
        <p>Temukan pola personal, rayakan keputusan kecil, dan tutup bulan dengan arah yang lebih jernih.</p>
      </div>
      <div className="reflectionSnapshotAction">
        <span><strong>{count}</strong><small>kemenangan tersimpan</small></span>
        <span><strong>{isClosed ? <AtlasIcon name="check" size={19} /> : "—"}</strong><small>{isClosed ? "bulan sudah ditutup" : "bulan belum ditutup"}</small></span>
        <button className="secondary" type="button" onClick={onOpen}>Buka insight dan refleksi</button>
      </div>
    </section>
  );
}

export default function ReflectionCenter({
  finance,
  onSaveCheckIn,
  onSaveWin,
  onSaveMonthly,
  onCommitFinance,
  onOpenLearning
}: Props) {
  const [tab, setTab] = useState<Tab>("insights");
  const [message, setMessage] = useState("");
  return (
    <section className="reflectionPage">
      <div className="pageIntro">
        <span className="eyebrow">INSIGHT DAN REFLEKSI</span>
        <h2>Angka penting. Cerita dan keputusan setelahnya juga penting.</h2>
        <p>Atlas membaca pola dari data yang kamu catat, membantumu memahami perasaan, merayakan progres, dan menyiapkan bulan berikutnya.</p>
      </div>
      <div className="reflectionTabs expandedTabs" aria-label="Bagian ruang refleksi">
        {reflectionTabs.map((item) => (
          <button key={item.value} type="button" className={tab === item.value ? "active" : ""} onClick={() => setTab(item.value)}>
            <AtlasIcon name={item.icon} size={17} /><span>{item.label}</span>
          </button>
        ))}
      </div>
      {message && <button className="reflectionMessage" type="button" onClick={() => setMessage("")}>{message}</button>}
      {tab === "insights" && <PersonalInsightsPanel finance={finance} />}
      {tab === "emotion" && <EmotionPanel finance={finance} onSave={async (entry) => { await onSaveCheckIn(entry); setMessage("Check-in tersimpan. Terima kasih sudah jujur pada dirimu sendiri."); }} />}
      {tab === "wins" && <ProgressPanel finance={finance} onSave={async (entry) => { await onSaveWin(entry); setMessage("Kemenanganmu tersimpan. Progres kecil tetap progres."); }} />}
      {tab === "monthly" && <MonthlyReviewPanel finance={finance} onSave={async (entry) => { await onSaveMonthly(entry); setMessage("Refleksi bulan ini sudah disimpan."); }} onOpenLearning={onOpenLearning} />}
      {tab === "close" && <MonthClosePanel finance={finance} onCommit={onCommitFinance} />}
    </section>
  );
}
