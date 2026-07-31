import { useMemo, useState } from "react";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

const modules = [
  {
    number: "01",
    title: "Kenali arus kasmu",
    summary: "Bedakan uang yang masuk, kebutuhan yang wajib dijaga, dan ruang yang masih bisa diarahkan.",
    points: [
      "Catat pemasukan dan pengeluaran yang benar-benar terjadi.",
      "Lihat pola bulanan, bukan hanya satu transaksi yang terasa besar.",
      "Gunakan kategori kesadaran untuk memahami alasan di balik pengeluaran."
    ]
  },
  {
    number: "02",
    title: "Susun anggaran yang realistis",
    summary: "Anggaran bukan hukuman. Ia adalah keputusan tentang apa yang paling penting untuk hidupmu.",
    points: [
      "Mulai dari kewajiban dan kebutuhan dasar.",
      "Sediakan ruang untuk keinginan agar rencana tetap manusiawi.",
      "Tinjau dan sesuaikan ketika kondisi keluarga berubah."
    ]
  },
  {
    number: "03",
    title: "Bangun dana darurat",
    summary: "Siapkan penyangga agar kejadian tak terduga tidak langsung mengganggu kebutuhan utama atau menambah utang.",
    points: [
      "Hitung kebutuhan pokok bulanan, bukan seluruh gaya hidup.",
      "Tentukan target berdasarkan kestabilan penghasilan dan jumlah tanggungan.",
      "Bangun bertahap dan simpan di tempat yang mudah diakses saat benar-benar diperlukan."
    ]
  },
  {
    number: "04",
    title: "Siapkan dana berkala",
    summary: "Pengeluaran yang tidak muncul tiap bulan tetap perlu disiapkan sejak jauh hari.",
    points: [
      "Contohnya pajak kendaraan, daftar ulang sekolah, kurban, mudik, atau perawatan rumah.",
      "Bagi total kebutuhan dengan jumlah bulan menuju waktu pembayaran.",
      "Pisahkan dari dana darurat agar tujuan keduanya tidak tercampur."
    ]
  },
  {
    number: "05",
    title: "Kelola risiko dan utang",
    summary: "Lindungi fondasi keuangan dan kurangi kewajiban dengan urutan yang paling masuk akal.",
    points: [
      "Pastikan perlindungan dasar sesuai kondisi dan kemampuan.",
      "Kenali total cicilan, biaya, dan tanggal jatuh tempo.",
      "Prioritaskan utang yang paling membebani tanpa mengabaikan kebutuhan hidup pokok."
    ]
  },
  {
    number: "06",
    title: "Arahkan uang menuju tujuan",
    summary: "Setelah fondasi lebih kuat, susun tujuan jangka pendek, menengah, dan panjang secara bertahap.",
    points: [
      "Tentukan tujuan, waktu, dan nilai yang ingin dicapai.",
      "Pilih cara menabung atau berinvestasi yang sesuai tujuan dan profil risiko.",
      "Tinjau kemajuan secara berkala, bukan hanya saat keadaan terasa sulit."
    ]
  }
];

export default function LearningHub() {
  const [monthlyNeeds, setMonthlyNeeds] = useState("");
  const [targetMonths, setTargetMonths] = useState("3");

  const emergencyTarget = useMemo(() => {
    const needs = Number(monthlyNeeds);
    const months = Number(targetMonths);
    return needs > 0 && months > 0 ? needs * months : 0;
  }, [monthlyNeeds, targetMonths]);

  return (
    <section className="learningHub">
      <div className="learningHero">
        <span className="eyebrow">BELAJAR BERSAMA ATLAS</span>
        <h2>Keuangan yang lebih tenang dimulai dari pemahaman.</h2>
        <p>
          Atlas tidak hanya membantumu mencatat. Di sini kamu belajar menyusun anggaran, membangun
          perlindungan, dan mengarahkan uang menuju hidup yang kamu inginkan—selangkah demi selangkah.
        </p>
        <div className="learningPromise">
          <span aria-hidden="true">✦</span>
          <p>Tidak perlu menguasai semuanya sekaligus. Pelajari yang paling relevan dengan kondisimu hari ini.</p>
        </div>
      </div>

      <div className="learningHeading">
        <div>
          <span className="eyebrow">JALUR BELAJAR</span>
          <h3>Fondasi perencanaan keuangan</h3>
        </div>
        <p>Urutannya membantu kamu membangun dasar sebelum melangkah ke tujuan yang lebih jauh.</p>
      </div>

      <div className="learningModules">
        {modules.map((module) => (
          <details className="learningModule" key={module.number}>
            <summary>
              <span className="moduleNumber">{module.number}</span>
              <span>
                <strong>{module.title}</strong>
                <small>{module.summary}</small>
              </span>
            </summary>
            <ul>
              {module.points.map((point) => <li key={point}>{point}</li>)}
            </ul>
          </details>
        ))}
      </div>

      <article className="card emergencyCalculator">
        <div className="calculatorIntro">
          <span className="calculatorIcon" aria-hidden="true">⌂</span>
          <div>
            <span className="eyebrow">LATIHAN DANA DARURAT</span>
            <h3>Hitung gambaran targetmu.</h3>
            <p>
              Masukkan kebutuhan pokok bulanan dan pilih berapa bulan penyangga yang ingin kamu bangun.
              Angka ini adalah bahan perencanaan awal, bukan aturan yang sama untuk semua orang.
            </p>
          </div>
        </div>

        <div className="calculatorFields">
          <label>
            Kebutuhan pokok per bulan
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={monthlyNeeds}
              onChange={(event) => setMonthlyNeeds(event.target.value)}
              placeholder="Contoh: 5.000.000"
            />
          </label>
          <label>
            Target bulan penyangga
            <select value={targetMonths} onChange={(event) => setTargetMonths(event.target.value)}>
              {[1, 2, 3, 4, 5, 6, 9, 12].map((month) => (
                <option key={month} value={month}>{month} bulan</option>
              ))}
            </select>
          </label>
        </div>

        <div className="calculatorResult">
          <span>Gambaran target dana darurat</span>
          <strong>{rupiah.format(emergencyTarget)}</strong>
          <small>
            Pertimbangkan kestabilan penghasilan, jumlah tanggungan, perlindungan yang tersedia,
            serta kebutuhan khusus keluargamu.
          </small>
        </div>
      </article>

      <p className="learningNote">
        Materi Atlas bersifat edukasi umum. Keputusan keuangan tetap perlu disesuaikan dengan kondisi,
        nilai, tujuan, dan kemampuan masing-masing pengguna.
      </p>
    </section>
  );
}
