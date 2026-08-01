import { localMonthKey } from "../lib/localDate";
import type { FinanceState } from "../types";
import AtlasCompanion, { type AtlasCompanionMood } from "./AtlasCompanion";
import "./ReviewCompanion.css";

function getReviewMessage(finance: FinanceState): {
  mood: AtlasCompanionMood;
  eyebrow: string;
  title: string;
  text: string;
} {
  const month = localMonthKey();
  const currentTransactions = finance.transactions.filter((item) => item.date.startsWith(month));
  const monthClosed = finance.monthlyReflections.some((item) => item.month === month && item.closedAt);
  const latestWin = finance.financialWins[0];
  const currentAllocations = currentTransactions.filter((item) => item.type === "allocation" && item.allocationAction !== "withdrawal");

  if (monthClosed) {
    return {
      mood: "cheer",
      eyebrow: "TALA MERAYAKANMU",
      title: "Kamu sudah berani melihat satu bulan dengan jujur.",
      text: "Menutup bulan bukan tentang sempurna. Kamu sudah mengambil pelajaran dan membawa satu langkah yang lebih jelas ke depan."
    };
  }

  if (latestWin) {
    return {
      mood: "cheer",
      eyebrow: "KEMENANGAN TERBARU",
      title: latestWin.title,
      text: latestWin.description || "Keputusan baik ini layak diingat. Kemajuan finansial juga tumbuh dari pilihan kecil yang terus diulang."
    };
  }

  if (currentAllocations.length) {
    return {
      mood: "cheer",
      eyebrow: "YANG SUDAH KAMU LAKUKAN",
      title: "Kamu tidak hanya mencatat—kamu sudah memberi arah pada uangmu.",
      text: `${currentAllocations.length} alokasi bulan ini menunjukkan bahwa masa depanmu sudah mulai mendapat tempat. Aku jadi tim hore-mu.`
    };
  }

  if (currentTransactions.length >= 5) {
    return {
      mood: "calm",
      eyebrow: "PROGRES YANG TERLIHAT",
      title: "Kamu sedang membangun gambaran yang makin jernih.",
      text: `${currentTransactions.length} catatan bulan ini sudah cukup untuk mulai menemukan pola. Tidak perlu menunggu datanya sempurna.`
    };
  }

  if (currentTransactions.length > 0) {
    return {
      mood: "guide",
      eyebrow: "LANGKAH PERTAMA",
      title: "Kamu sudah mulai melihat uangmu, bukan menghindarinya.",
      text: "Setiap catatan kecil memberi Atlas lebih banyak konteks untuk membantumu memahami pola tanpa menghakimi."
    };
  }

  return {
    mood: "think",
    eyebrow: "TALA MENEMANIMU",
    title: "Kita belum perlu punya semua jawabannya.",
    text: "Mulai dari satu catatan atau satu perasaan tentang uang hari ini. Review yang baik tumbuh dari kenyataan, bukan tebakan."
  };
}

export default function ReviewCompanion({ finance }: { finance: FinanceState }) {
  const message = getReviewMessage(finance);

  return (
    <aside className={`reviewCompanion reviewCompanion--${message.mood}`} aria-label="Pendamping review Atlas">
      <AtlasCompanion mood={message.mood} size="medium" />
      <div className="reviewCompanionBubble">
        <span className="eyebrow">{message.eyebrow}</span>
        <strong>{message.title}</strong>
        <p>{message.text}</p>
      </div>
    </aside>
  );
}
