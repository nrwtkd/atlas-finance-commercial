import { useMemo } from "react";
import type { BudgetBucket, FinanceState, FinanceTransaction, MoneyEmotion } from "../types";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

const emotionLabels: Record<MoneyEmotion, string> = {
  calm: "tenang",
  safe: "aman",
  grateful: "bersyukur",
  happy: "senang",
  anxious: "cemas",
  pressured: "tertekan",
  guilty: "bersalah",
  tired: "lelah",
  afraid: "takut",
  confused: "bingung"
};

function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function previousMonthKey() {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return monthKey(date);
}

function sum(items: FinanceTransaction[]) {
  return items.reduce((total, item) => total + item.amount, 0);
}

function monthTransactions(finance: FinanceState, month: string) {
  return finance.transactions.filter((item) => item.date.startsWith(month));
}

function topExpenseCategory(items: FinanceTransaction[]) {
  const totals = new Map<string, number>();
  items
    .filter((item) => item.type === "expense")
    .forEach((item) => totals.set(item.category, (totals.get(item.category) ?? 0) + item.amount));
  return [...totals.entries()].sort((a, b) => b[1] - a[1])[0];
}

function uniqueRecordedDays(items: FinanceTransaction[]) {
  return new Set(items.map((item) => item.date)).size;
}

export default function PersonalInsightsPanel({ finance }: { finance: FinanceState }) {
  const insight = useMemo(() => {
    const currentMonth = monthKey();
    const previousMonth = previousMonthKey();
    const current = monthTransactions(finance, currentMonth);
    const previous = monthTransactions(finance, previousMonth);
    const plan = finance.budgetPlans.find((item) => item.month === currentMonth);

    const income = sum(current.filter((item) => item.type === "income"));
    const expense = sum(current.filter((item) => item.type === "expense"));
    const allocated = sum(current.filter((item) => item.type === "allocation" && item.allocationAction !== "withdrawal"));
    const withdrawn = sum(current.filter((item) => item.type === "allocation" && item.allocationAction === "withdrawal"));
    const available = income - expense - allocated + withdrawn;
    const impulse = sum(current.filter((item) => item.type === "expense" && item.awareness === "Impulse"));
    const impulsePercent = expense ? Math.round((impulse / expense) * 100) : 0;

    const previousExpense = sum(previous.filter((item) => item.type === "expense"));
    const previousImpulse = sum(previous.filter((item) => item.type === "expense" && item.awareness === "Impulse"));
    const previousImpulsePercent = previousExpense ? Math.round((previousImpulse / previousExpense) * 100) : 0;

    const cards: Array<{ title: string; body: string; tone: "calm" | "watch" | "grow" }> = [];

    if (!current.length) {
      cards.push({
        title: "Atlas masih membutuhkan sedikit cerita.",
        body: "Catat beberapa pemasukan, pengeluaran, atau alokasi dana agar insight tidak dibuat dari dugaan.",
        tone: "calm"
      });
    }

    if (plan) {
      const bucketUsage = plan.allocations.map((allocation) => {
        const actual = sum(current.filter((item) => item.budgetBucket === allocation.bucket && (
          item.type === "expense" || (item.type === "allocation" && item.allocationAction !== "withdrawal")
        )));
        const budget = plan.monthlyIncome * allocation.percent / 100;
        return { bucket: allocation.bucket, actual, budget, ratio: budget ? actual / budget : 0 };
      }).sort((a, b) => b.ratio - a.ratio);
      const highest = bucketUsage[0];
      if (highest && highest.actual > 0) {
        cards.push({
          title: highest.ratio > 1 ? `${highest.bucket} sudah melewati rencana.` : `${highest.bucket} paling banyak memakai ruang.`,
          body: highest.ratio > 1
            ? `Terpakai ${rupiah.format(highest.actual)} dari rencana ${rupiah.format(highest.budget)}. Ini bukan kegagalan—cek apakah anggarannya terlalu kecil atau kebutuhannya memang berubah.`
            : `Pos ini sudah menggunakan ${Math.round(highest.ratio * 100)}% dari rencana bulan ini. Perhatikan sisa kebutuhan sampai akhir bulan.`,
          tone: highest.ratio > 1 ? "watch" : "calm"
        });
      }
    } else if (income > 0) {
      cards.push({
        title: "Pemasukanmu sudah tercatat, tetapi belum diberi arah.",
        body: `Ada ${rupiah.format(income)} pemasukan bulan ini. Rencana anggaran akan membantu membedakan uang untuk kebutuhan, keamanan, tujuan, dan ruang menikmati hidup.`,
        tone: "watch"
      });
    }

    if (impulsePercent >= 15) {
      const category = topExpenseCategory(current.filter((item) => item.awareness === "Impulse"));
      cards.push({
        title: "Pengeluaran spontan sedang mengambil ruang.",
        body: `${impulsePercent}% pengeluaran bulan ini ditandai impulsif${category ? `, paling banyak pada ${category[0]}` : ""}. Atlas belum dapat menyimpulkan penyebabnya, tetapi pola ini layak diperhatikan tanpa menyalahkan diri.`,
        tone: "watch"
      });
    } else if (previousImpulsePercent > 0 && impulsePercent < previousImpulsePercent) {
      cards.push({
        title: "Ruang untuk keputusan sadar mulai bertambah.",
        body: `Porsi impulsif turun dari ${previousImpulsePercent}% menjadi ${impulsePercent}% dibanding bulan sebelumnya. Perubahan kecil seperti ini adalah kemenangan nyata.`,
        tone: "grow"
      });
    }

    const difficultEmotionDates = new Set(
      finance.emotionalCheckIns
        .filter((item) => item.date.startsWith(currentMonth) && ["anxious", "pressured", "guilty", "tired", "afraid", "confused"].includes(item.emotion))
        .map((item) => item.date)
    );
    const nearbyImpulse = current.filter((item) => item.type === "expense" && item.awareness === "Impulse" && difficultEmotionDates.has(item.date));
    if (nearbyImpulse.length >= 2) {
      cards.push({
        title: "Perasaan dan belanja spontan beberapa kali muncul berdekatan.",
        body: `Ada ${nearbyImpulse.length} pengeluaran impulsif pada hari ketika kamu juga mencatat perasaan yang berat. Ini bukan bukti sebab-akibat, tetapi bisa menjadi bahan refleksi yang berguna.`,
        tone: "calm"
      });
    }

    if (allocated > 0) {
      cards.push({
        title: "Kamu tidak hanya membayar hari ini.",
        body: `${rupiah.format(allocated)} sudah diarahkan ke dana darurat atau tujuan lain. Uang itu tidak hilang—ia sedang bekerja untuk hidup yang ingin kamu bangun.`,
        tone: "grow"
      });
    }

    const wins: string[] = [];
    const recordedDays = uniqueRecordedDays(current);
    if (recordedDays >= 3) wins.push(`Mencatat pada ${recordedDays} hari berbeda bulan ini.`);
    if (plan) wins.push("Sudah memberi arah pada pemasukan melalui anggaran.");
    if (allocated > 0) wins.push(`Mengalokasikan ${rupiah.format(allocated)} untuk masa depan.`);
    if (previousImpulsePercent > impulsePercent && previousImpulsePercent > 0) wins.push("Menurunkan porsi pengeluaran impulsif dibanding bulan lalu.");
    if (finance.learningProgress.length > 0) wins.push(`Menyelesaikan ${finance.learningProgress.length} materi belajar.`);
    if (finance.emotionalCheckIns.some((item) => item.date.startsWith(currentMonth))) wins.push("Berani jujur mencatat perasaan tentang uang.");

    let nextStep = "Catat satu transaksi nyata hari ini agar Atlas punya dasar yang lebih jernih.";
    if (!plan && income > 0) {
      nextStep = "Buka Rencana dan susun pembagian pemasukan bulan ini.";
    } else if (available < 0) {
      const top = topExpenseCategory(current);
      nextStep = top
        ? `Tinjau kembali pengeluaran ${top[0]}. Pos ini paling banyak memakai dana bulan ini.`
        : "Tinjau pengeluaran terbesar dan tentukan satu penyesuaian yang paling mungkin dilakukan.";
    } else if (finance.financialProfile?.emergencyFundLevel === "none" && allocated === 0 && income > 0) {
      nextStep = `Mulai dana darurat dengan alokasi kecil, misalnya ${rupiah.format(Math.max(10000, Math.round(income * 0.05)))}.`;
    } else if (impulsePercent >= 15) {
      const category = topExpenseCategory(current.filter((item) => item.awareness === "Impulse"));
      nextStep = category
        ? `Buat jeda 24 jam sebelum pengeluaran berikutnya pada kategori ${category[0]}.`
        : "Gunakan jeda 24 jam sebelum satu pembelian yang belum direncanakan.";
    } else if (available > 0) {
      nextStep = `Tentukan arah untuk sebagian dana tersedia ${rupiah.format(available)} sebelum bulan berganti.`;
    }

    const latestEmotion = finance.emotionalCheckIns.find((item) => item.date.startsWith(currentMonth));

    return {
      cards: cards.slice(0, 4),
      wins: wins.slice(0, 4),
      nextStep,
      latestEmotion: latestEmotion ? emotionLabels[latestEmotion.emotion] : null,
      available
    };
  }, [finance]);

  return (
    <div className="personalInsights">
      <section className="insightHero">
        <div><span className="eyebrow">YANG ATLAS LIHAT</span><h3>Angkamu mulai membentuk cerita.</h3><p>Insight dibuat dari data yang benar-benar kamu catat. Atlas menunjukkan pola, bukan memberi vonis.</p></div>
        {insight.latestEmotion && <span className="emotionBadge">Perasaan terakhir: {insight.latestEmotion}</span>}
      </section>

      <div className="insightCardGrid">
        {insight.cards.map((item) => (
          <article className={`insightCard ${item.tone}`} key={`${item.title}-${item.body}`}>
            <span aria-hidden="true">{item.tone === "grow" ? "✦" : item.tone === "watch" ? "◌" : "◇"}</span>
            <div><h4>{item.title}</h4><p>{item.body}</p></div>
          </article>
        ))}
      </div>

      <section className="card nextStepCard">
        <span className="eyebrow">SATU LANGKAH BERIKUTNYA</span>
        <h3>{insight.nextStep}</h3>
        <p>Satu tindakan yang dijalankan lebih berguna daripada banyak saran yang hanya dibaca.</p>
      </section>

      <section className="card automaticWinsCard">
        <div><span className="eyebrow">KEMENANGAN YANG MUNGKIN TERLEWAT</span><h3>Progresmu tidak selalu berbentuk angka besar.</h3></div>
        {insight.wins.length ? (
          <ul>{insight.wins.map((win) => <li key={win}><span>✓</span>{win}</li>)}</ul>
        ) : (
          <p>Belum ada cukup data bulan ini. Mulai dari satu catatan, satu keputusan sadar, atau satu materi belajar.</p>
        )}
      </section>
    </div>
  );
}
