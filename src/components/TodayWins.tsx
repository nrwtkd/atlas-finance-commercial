import type { FinanceState, FinanceTransaction, FinancialWin } from "../types";
import { nutritionFoodLabelList } from "../domain/nutrition";
import AtlasCompanion from "./AtlasCompanion";
import "./TodayWins.css";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

type WinCard = {
  eyebrow: string;
  title: string;
  text: string;
  prompt?: boolean;
};

function newest<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
}

function cardFromWin(win: FinancialWin, eyebrow: string): WinCard {
  return {
    eyebrow,
    title: win.title,
    text: win.description || "Langkah baik ini layak dilihat dan diingat."
  };
}

function financialCard(finance: FinanceState): WinCard {
  const wins = finance.financialWins ?? [];
  const savedWin = newest(wins.filter((item) => item.category !== "nutrition"));
  if (savedWin) return cardFromWin(savedWin, "KEMENANGAN KEUANGAN");

  const transactions = [...finance.transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const directed = transactions.find(
    (item) => item.type === "allocation" && item.allocationAction !== "withdrawal"
  );
  if (directed) {
    const goal = finance.goals.find((item) => item.id === directed.goalId);
    return {
      eyebrow: "KEMENANGAN KEUANGAN",
      title: "Kamu sudah memberi arah pada uangmu.",
      text: `${rupiah.format(directed.amount)} sudah kamu tempatkan untuk ${goal?.name ?? "tujuan keuanganmu"}. Masa depan dibangun dari keputusan yang benar-benar dilakukan.`
    };
  }

  const investment = transactions.find(
    (item) => item.type === "expense" && item.budgetBucket === "Investasi dan pensiun"
  );
  if (investment) {
    return {
      eyebrow: "KEMENANGAN KEUANGAN",
      title: "Kamu sedang menyiapkan masa depan.",
      text: `${rupiah.format(investment.amount)} sudah diarahkan untuk ${investment.activity.toLowerCase()}. Uang yang sengaja tidak dipakai hari ini sedang mendapat tugas baru.`
    };
  }

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthlyRecords = finance.transactions.filter((item) => item.date.startsWith(month));
  if (monthlyRecords.length > 0) {
    return {
      eyebrow: "KEMENANGAN KEUANGAN",
      title: "Kamu memilih melihat uangmu dengan jujur.",
      text: `${monthlyRecords.length} catatan bulan ini sudah membuat gambaran keuanganmu lebih jelas. Kesadaran adalah kemajuan yang nyata.`
    };
  }

  return {
    eyebrow: "LANGKAH KEUANGAN",
    title: "Satu catatan kecil sudah cukup untuk memulai.",
    text: "Catat satu uang masuk atau keluar hari ini. Tara akan membantumu melihat kemajuan yang sebelumnya mudah terlewat.",
    prompt: true
  };
}

function latestNutritionTransaction(transactions: FinanceTransaction[]) {
  return newest(transactions.filter((item) => item.nutritionTags?.length));
}

function nutritionCard(finance: FinanceState): WinCard | null {
  if (!finance.financialProfile?.nutritionTrackingEnabled) return null;

  const wins = finance.financialWins ?? [];
  const savedWin = newest(wins.filter((item) => item.category === "nutrition"));
  if (savedWin) return cardFromWin(savedWin, "KEMENANGAN MERAWAT KELUARGA");

  const transaction = latestNutritionTransaction(finance.transactions);
  if (transaction?.nutritionTags?.length) {
    return {
      eyebrow: "KEMENANGAN MERAWAT KELUARGA",
      title: "Pilihan bergizi sudah mendapat tempat.",
      text: `Kamu ikut menyediakan ${nutritionFoodLabelList(transaction.nutritionTags)}. Merawat keluarga juga terlihat dari keputusan belanja yang sederhana.`
    };
  }

  return {
    eyebrow: "PERHATIAN UNTUK KELUARGA",
    title: "Belanja berikutnya bisa ikut bercerita.",
    text: "Saat mencatat belanja bahan makanan, tandai pangan yang ikut kamu sediakan. Tara akan merayakan kehadiran dan variasinya—bukan mahalnya belanja.",
    prompt: true
  };
}

export default function TodayWins({ finance }: { finance: FinanceState }) {
  const financeWin = financialCard(finance);
  const familyWin = nutritionCard(finance);
  const cards = [financeWin, familyWin].filter((item): item is WinCard => Boolean(item));
  const hasRealWin = cards.some((item) => !item.prompt);

  return (
    <section className="todayWins" aria-labelledby="tara-today-title">
      <div className="todayWinsCompanion">
        <AtlasCompanion
          mood={hasRealWin ? "cheer" : "guide"}
          size="large"
          label="Tara menemani dan melihat kemenangan hari ini"
        />
        <div>
          <span className="eyebrow">TARA HARI INI</span>
          <h2 id="tara-today-title">Yang layak diperhatikan dan dirayakan.</h2>
          <p>Tara melihat cara kamu menjaga uang sekaligus merawat orang-orang yang kamu sayangi.</p>
        </div>
      </div>

      <div className={`todayWinsGrid ${cards.length === 1 ? "todayWinsGrid--single" : ""}`}>
        {cards.map((card) => (
          <article className={card.prompt ? "todayWinCard todayWinCard--prompt" : "todayWinCard"} key={card.eyebrow}>
            <span>{card.eyebrow}</span>
            <strong>{card.title}</strong>
            <p>{card.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
