import { useMemo, useState } from "react";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

type LearningModule = {
  number: string;
  title: string;
  summary: string;
  outcomes: string[];
  lessons: string[];
  concepts: { title: string; description: string }[];
  practice: { title: string; steps: string[] };
  watchOut: string;
  reflection: string;
};

const modules: LearningModule[] = [
  {
    number: "01",
    title: "Kenali arus kasmu",
    summary: "Pahami apa yang benar-benar masuk, digunakan, dan dialokasikan agar keputusan tidak dibuat hanya dari perasaan.",
    outcomes: [
      "Membedakan pemasukan, pengeluaran, dan alokasi dana.",
      "Menghitung dana yang masih tersedia tanpa mencampurnya dengan tabungan tujuan.",
      "Mengenali pola yang berulang dalam satu bulan."
    ],
    lessons: [
      "Arus kas adalah cerita tentang pergerakan uang dalam suatu periode. Pemasukan menambah uang yang dapat dikelola. Pengeluaran memakai uang untuk kebutuhan atau keinginan. Alokasi dana memindahkan uang ke tujuan tertentu, sehingga uang itu belum habis tetapi tidak lagi bebas digunakan.",
      "Saldo rekening tidak selalu sama dengan uang yang aman untuk dibelanjakan. Sebagian saldo mungkin sudah memiliki tugas untuk membayar tagihan, membangun dana darurat, atau memenuhi tujuan lain. Karena itu Atlas memisahkan dana tersedia dari dana yang sudah dialokasikan.",
      "Satu transaksi besar dapat terasa menakutkan, tetapi keputusan yang baik perlu melihat pola. Periksa pengeluaran berulang, biaya kecil yang sering muncul, waktu ketika pengeluaran meningkat, dan selisih antara pemasukan dengan seluruh penggunaan uang."
    ],
    concepts: [
      { title: "Dana tersedia", description: "Pemasukan dikurangi pengeluaran dan dana yang dialokasikan, lalu ditambah dana tujuan yang ditarik kembali." },
      { title: "Arus kas positif", description: "Masih ada dana tersedia setelah kebutuhan, kewajiban, dan alokasi bulan tersebut. Ini belum otomatis berarti seluruh fondasi keuangan sudah aman." },
      { title: "Arus kas negatif", description: "Penggunaan uang lebih besar daripada pemasukan periode tersebut. Cari penyebabnya sebelum langsung menyalahkan diri sendiri." }
    ],
    practice: {
      title: "Latihan 15 menit: baca satu bulanmu",
      steps: [
        "Catat seluruh sumber pemasukan yang benar-benar diterima.",
        "Kelompokkan pengeluaran menjadi wajib, kebutuhan, keinginan, dan impulsif.",
        "Pisahkan uang yang dialokasikan untuk tujuan dari pengeluaran konsumsi.",
        "Pilih satu pola yang paling ingin kamu pahami, bukan langsung mengubah semuanya."
      ]
    },
    watchOut: "Jangan menilai kesehatan keuangan hanya dari saldo hari ini. Saldo dapat terlihat besar tepat sebelum tagihan jatuh tempo atau karena ada uang tujuan yang belum dipisahkan.",
    reflection: "Bagian mana dari arus kasmu yang selama ini paling sering tidak terlihat?"
  },
  {
    number: "02",
    title: "Susun anggaran yang realistis",
    summary: "Beri tugas pada uang sebelum habis, tanpa membuat rencana yang terlalu ketat untuk dijalani.",
    outcomes: [
      "Menyusun urutan prioritas berdasarkan kondisi nyata.",
      "Membedakan anggaran wajib, fleksibel, dan tujuan.",
      "Meninjau anggaran sebagai rencana yang boleh disesuaikan."
    ],
    lessons: [
      "Anggaran bukan daftar larangan. Anggaran adalah keputusan sadar tentang bagian hidup yang perlu dijaga, tujuan yang ingin dibangun, serta ruang yang tetap boleh dinikmati. Anggaran yang baik membantu sebelum uang digunakan, bukan sekadar menjelaskan ke mana uang sudah pergi.",
      "Mulailah dari pemasukan yang benar-benar dapat digunakan. Setelah itu tempatkan kewajiban, kebutuhan pokok, perlindungan dasar, dan kebutuhan yang waktunya sudah dekat. Baru kemudian arahkan uang ke tujuan masa depan, keinginan, serta berbagi sesuai nilai dan kemampuanmu.",
      "Tidak ada persentase tunggal yang cocok untuk semua orang. Mahasiswa, pekerja lepas, orang dengan tanggungan, pengguna dengan biaya kesehatan khusus, dan orang yang sedang memulihkan utang membutuhkan pembagian berbeda. Rekomendasi Atlas adalah titik awal yang perlu diuji dengan kenyataan."
    ],
    concepts: [
      { title: "Pos wajib", description: "Kewajiban yang harus dipenuhi agar kehidupan dasar dan komitmen tetap berjalan, seperti tempat tinggal, tagihan utama, atau cicilan minimum." },
      { title: "Pos fleksibel", description: "Jumlahnya dapat diatur dari bulan ke bulan, seperti makan di luar, hiburan, atau belanja pribadi." },
      { title: "Bayar diri masa depan", description: "Mengalokasikan dana untuk keamanan dan tujuan sebelum seluruh uang terserap oleh kebutuhan hari ini." }
    ],
    practice: {
      title: "Latihan: susun anggaran dari nol",
      steps: [
        "Masukkan pemasukan yang paling realistis, bukan angka terbaik yang mungkin terjadi.",
        "Tuliskan seluruh kewajiban dan kebutuhan pokok beserta nominalnya.",
        "Tentukan satu prioritas utama: dana aman, utang, atau tujuan tertentu.",
        "Sisakan ruang untuk keinginan agar rencana tidak terasa seperti hukuman.",
        "Pastikan total pembagian tidak melebihi pemasukan yang direncanakan."
      ]
    },
    watchOut: "Anggaran yang terlihat sempurna di atas kertas tetapi selalu gagal dijalankan biasanya perlu dibuat lebih realistis, bukan dijalani dengan rasa bersalah yang lebih besar.",
    reflection: "Pos mana yang paling mencerminkan nilai hidupmu, dan pos mana yang selama ini berjalan otomatis tanpa dipilih?"
  },
  {
    number: "03",
    title: "Bangun dana darurat",
    summary: "Ciptakan penyangga agar kejadian tak terduga tidak langsung mengganggu kebutuhan utama atau menambah utang.",
    outcomes: [
      "Memahami fungsi dana darurat dan kapan ia boleh digunakan.",
      "Menentukan target bertahap sesuai kestabilan pemasukan dan tanggungan.",
      "Memisahkan dana darurat dari dana berkala dan investasi."
    ],
    lessons: [
      "Dana darurat digunakan untuk kejadian penting yang tidak direncanakan dan perlu segera ditangani, misalnya kehilangan pemasukan, kebutuhan kesehatan mendesak, atau perbaikan penting. Pengeluaran tahunan yang sudah dapat diperkirakan bukan keadaan darurat; kebutuhan seperti itu sebaiknya masuk dana berkala.",
      "Target tidak harus langsung besar. Mulailah dengan penyangga awal yang terasa mungkin dicapai, lalu lanjutkan menuju beberapa bulan kebutuhan pokok. Orang dengan penghasilan tidak tetap, satu sumber pemasukan, atau tanggungan lebih banyak biasanya memerlukan ruang aman yang lebih besar.",
      "Dana darurat perlu mudah dicairkan, nilainya relatif stabil, dan tidak tercampur dengan uang belanja. Tujuannya bukan mengejar hasil tertinggi, melainkan memberi waktu untuk berpikir ketika keadaan berubah."
    ],
    concepts: [
      { title: "Kebutuhan pokok bulanan", description: "Biaya minimum untuk menjaga tempat tinggal, makan, kesehatan, transportasi penting, dan kewajiban dasar tetap berjalan." },
      { title: "Target bertahap", description: "Bangun dari penyangga kecil, kemudian satu bulan kebutuhan pokok, lalu tingkatkan sesuai kondisi dan risiko." },
      { title: "Likuid dan stabil", description: "Dana dapat diakses saat diperlukan tanpa bergantung pada perubahan harga yang tajam atau proses pencairan yang lama." }
    ],
    practice: {
      title: "Latihan: tentukan target dana aman",
      steps: [
        "Hitung kebutuhan pokok minimum per bulan.",
        "Nilai kestabilan pemasukan, jumlah sumber pemasukan, dan tanggungan.",
        "Pilih target awal yang dapat dicapai lebih dahulu.",
        "Tentukan alokasi rutin dan catat melalui menu Alokasi dana.",
        "Tuliskan kondisi yang menurutmu layak disebut darurat agar penggunaannya tetap jelas."
      ]
    },
    watchOut: "Jangan memakai dana darurat untuk pengeluaran yang sebenarnya sudah diketahui waktunya. Buat dana berkala agar penyangga darurat tetap tersedia.",
    reflection: "Kejadian apa yang paling ingin kamu hadapi dengan lebih tenang karena memiliki dana penyangga?"
  },
  {
    number: "04",
    title: "Siapkan dana berkala",
    summary: "Ubah pengeluaran besar yang bisa diperkirakan menjadi setoran kecil yang disiapkan dari jauh hari.",
    outcomes: [
      "Membedakan dana berkala dari dana darurat.",
      "Menghitung kebutuhan setoran bulanan berdasarkan tenggat.",
      "Mencegah pengeluaran musiman merusak anggaran bulanan."
    ],
    lessons: [
      "Tidak semua pengeluaran datang setiap bulan. Pajak kendaraan, biaya pendidikan, hari raya, perawatan rumah, pemeriksaan kesehatan, perjalanan, dan penggantian perangkat dapat muncul beberapa bulan atau setahun sekali. Karena waktunya dapat diperkirakan, pengeluaran tersebut perlu direncanakan.",
      "Cara paling sederhana adalah menentukan target, mengurangi dana yang sudah tersedia, lalu membagi sisanya dengan jumlah bulan menuju waktu pembayaran. Setoran kecil yang konsisten membuat kebutuhan besar tidak terasa seperti keadaan darurat.",
      "Buat tujuan terpisah untuk kebutuhan yang penting atau bernilai besar. Pemisahan ini membantu kamu melihat tujuan mana yang sudah cukup dan mana yang masih kekurangan."
    ],
    concepts: [
      { title: "Dana berkala", description: "Uang yang dikumpulkan untuk kebutuhan yang waktunya dapat diperkirakan tetapi tidak muncul setiap bulan." },
      { title: "Tenggat", description: "Waktu ketika dana akan digunakan. Tenggat membantu menghitung setoran yang perlu disiapkan." },
      { title: "Setoran bulanan", description: "Sisa target dibagi jumlah bulan menuju tenggat, lalu disesuaikan dengan kemampuan arus kas." }
    ],
    practice: {
      title: "Latihan: buat kalender kebutuhan tahunan",
      steps: [
        "Lihat dua belas bulan ke depan dan tulis pengeluaran nonbulanan yang sudah dapat diperkirakan.",
        "Tentukan target dan bulan penggunaannya.",
        "Urutkan berdasarkan penting dan dekatnya tenggat.",
        "Buat tujuan di Atlas dan mulai alokasi dari kebutuhan paling mendesak."
      ]
    },
    watchOut: "Terlalu banyak tujuan aktif sekaligus dapat membuat semuanya bergerak sangat lambat. Prioritaskan beberapa tujuan yang paling penting atau paling dekat terlebih dahulu.",
    reflection: "Pengeluaran tahunan apa yang paling sering membuat anggaranmu terasa tiba-tiba berantakan?"
  },
  {
    number: "05",
    title: "Kelola risiko dan utang",
    summary: "Kurangi kerentanan keuangan dengan memahami kewajiban, perlindungan, dan urutan tindakan yang paling masuk akal.",
    outcomes: [
      "Membuat gambaran utang yang lengkap dan jujur.",
      "Membedakan perlindungan dasar dari produk yang tidak dipahami.",
      "Memilih strategi pembayaran utang yang dapat dipertahankan."
    ],
    lessons: [
      "Utang perlu dilihat sebagai keseluruhan: sisa pokok, cicilan minimum, biaya atau bunga, jatuh tempo, serta konsekuensi jika terlambat. Tanpa daftar yang lengkap, keputusan pembayaran mudah didorong oleh rasa takut dan bukan prioritas yang jelas.",
      "Ada orang yang termotivasi dengan melunasi saldo terkecil terlebih dahulu, sementara yang lain memilih kewajiban dengan biaya tertinggi. Keduanya dapat digunakan selama pembayaran minimum tetap terpenuhi, kebutuhan pokok terlindungi, dan strategi tersebut benar-benar dijalankan.",
      "Perlindungan keuangan bertujuan mencegah satu kejadian besar menghancurkan fondasi yang sedang dibangun. Pahami risiko yang perlu dilindungi, manfaat, batasan, biaya, dan pengecualian sebelum memilih produk. Jangan membeli hanya karena takut atau karena istilahnya terdengar menjanjikan."
    ],
    concepts: [
      { title: "Rasio cicilan", description: "Bagian pemasukan yang habis untuk cicilan. Semakin besar porsinya, semakin sempit ruang untuk kebutuhan dan tujuan lain." },
      { title: "Metode saldo terkecil", description: "Memprioritaskan saldo utang paling kecil untuk membangun momentum psikologis." },
      { title: "Metode biaya tertinggi", description: "Memprioritaskan utang dengan biaya atau bunga tertinggi untuk mengurangi beban total secara matematis." }
    ],
    practice: {
      title: "Latihan: buat peta kewajiban",
      steps: [
        "Daftar seluruh utang, cicilan minimum, biaya, dan tanggal jatuh tempo.",
        "Pastikan kebutuhan pokok dan pembayaran minimum tetap aman.",
        "Pilih satu utang prioritas dan tentukan tambahan pembayaran yang realistis.",
        "Periksa perlindungan yang sudah dimiliki dan pahami manfaat serta batasannya.",
        "Evaluasi kembali ketika pemasukan atau tanggungan berubah."
      ]
    },
    watchOut: "Jangan mengorbankan makan, tempat tinggal, kesehatan, atau seluruh dana penyangga hanya untuk terlihat lebih cepat bebas utang. Strategi perlu kuat sekaligus dapat dijalani.",
    reflection: "Langkah kecil apa yang dapat membuat kewajibanmu terasa lebih jelas dan terkendali minggu ini?"
  },
  {
    number: "06",
    title: "Arahkan uang menuju tujuan",
    summary: "Ubah keinginan masa depan menjadi target yang memiliki nilai, waktu, dan langkah nyata.",
    outcomes: [
      "Menyusun tujuan yang jelas dan dapat dipantau.",
      "Menyesuaikan cara menyimpan dana dengan jarak waktu dan kemampuan menghadapi risiko.",
      "Meninjau progres tanpa mengejar tren atau hasil yang tidak dipahami."
    ],
    lessons: [
      "Tujuan keuangan menjadi lebih mudah dikerjakan ketika memiliki nama yang bermakna, target nominal, tenggat, dana awal, dan rencana setoran. Tujuan yang terlalu umum seperti ingin kaya sulit diterjemahkan menjadi tindakan bulanan.",
      "Jarak waktu memengaruhi cara dana dikelola. Uang yang akan digunakan dalam waktu dekat membutuhkan kestabilan dan kemudahan akses. Tujuan yang masih jauh dapat memiliki ruang lebih besar untuk pertumbuhan, tetapi tetap perlu menyesuaikan kemampuan dan kenyamanan menghadapi perubahan nilai.",
      "Investasi adalah alat untuk tujuan, bukan tujuan itu sendiri. Pahami cara kerja, risiko, biaya, kemudahan pencairan, dan kesesuaiannya dengan waktumu. Hasil masa lalu atau popularitas suatu produk tidak menjamin hasil di masa depan."
    ],
    concepts: [
      { title: "Jangka pendek", description: "Tujuan yang waktunya dekat, sehingga kestabilan dan akses dana biasanya lebih penting daripada mengejar pertumbuhan tinggi." },
      { title: "Jangka menengah", description: "Tujuan beberapa tahun ke depan yang memerlukan keseimbangan antara stabilitas dan pertumbuhan sesuai toleransi risiko." },
      { title: "Jangka panjang", description: "Tujuan yang masih jauh dan dapat memberi waktu lebih panjang untuk menghadapi naik-turun nilai, selama risikonya dipahami." }
    ],
    practice: {
      title: "Latihan: hidupkan satu tujuan",
      steps: [
        "Pilih satu tujuan yang paling penting, bukan yang paling menarik dilihat orang lain.",
        "Tentukan target nominal dan tenggat yang masuk akal.",
        "Masukkan dana awal yang sudah tersedia.",
        "Hitung setoran rutin yang mampu dilakukan tanpa merusak kebutuhan dasar.",
        "Tinjau progres dan sesuaikan ketika keadaan hidup berubah."
      ]
    },
    watchOut: "Jangan memilih tempat menyimpan atau mengembangkan dana hanya berdasarkan janji hasil, tren, atau rekomendasi orang lain tanpa memahami risikonya.",
    reflection: "Tujuan mana yang benar-benar mewakili hidup yang kamu inginkan, bukan sekadar standar yang kamu lihat dari orang lain?"
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
        <h2>Bukan sekadar tahu istilah. Kamu perlu memahami cara mengambil keputusan.</h2>
        <p>
          Setiap modul berisi penjelasan, konsep penting, latihan, hal yang perlu diwaspadai,
          dan pertanyaan refleksi. Buka satu materi yang paling relevan dengan kondisimu hari ini.
        </p>
        <div className="learningPromise">
          <span aria-hidden="true">✦</span>
          <p>Kamu tidak harus menyelesaikan semuanya sekaligus. Satu pemahaman yang dipraktikkan lebih berguna daripada banyak materi yang hanya dibaca.</p>
        </div>
      </div>

      <div className="learningHeading">
        <div>
          <span className="eyebrow">JALUR BELAJAR</span>
          <h3>Fondasi perencanaan keuangan</h3>
        </div>
        <p>Mulai dari membaca kondisi saat ini, lalu membangun anggaran, keamanan, dan tujuan secara berurutan.</p>
      </div>

      <div className="learningModules richLearningModules">
        {modules.map((module) => (
          <details className="learningModule richLearningModule" key={module.number}>
            <summary>
              <span className="moduleNumber">{module.number}</span>
              <span>
                <strong>{module.title}</strong>
                <small>{module.summary}</small>
              </span>
            </summary>

            <div className="lessonBody">
              <section className="lessonOutcomes">
                <span className="lessonLabel">SETELAH MEMPELAJARI INI</span>
                <ul>{module.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul>
              </section>

              <section className="lessonExplanation">
                <span className="lessonLabel">PELAJARAN INTI</span>
                {module.lessons.map((lesson) => <p key={lesson}>{lesson}</p>)}
              </section>

              <section>
                <span className="lessonLabel">KONSEP PENTING</span>
                <div className="conceptGrid">
                  {module.concepts.map((concept) => (
                    <article key={concept.title}>
                      <strong>{concept.title}</strong>
                      <p>{concept.description}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="practiceBox">
                <span className="lessonLabel">COBA SEKARANG</span>
                <h4>{module.practice.title}</h4>
                <ol>{module.practice.steps.map((step) => <li key={step}>{step}</li>)}</ol>
              </section>

              <aside className="watchOutBox">
                <strong>Perlu diingat</strong>
                <p>{module.watchOut}</p>
              </aside>

              <aside className="reflectionQuestion">
                <span aria-hidden="true">◇</span>
                <div><strong>Pertanyaan untuk dirimu</strong><p>{module.reflection}</p></div>
              </aside>
            </div>
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
            Pertimbangkan kestabilan dan jumlah sumber pemasukan, tanggungan, perlindungan yang tersedia,
            serta kebutuhan khusus yang perlu tetap berjalan.
          </small>
        </div>
      </article>

      <p className="learningNote">
        Materi Atlas bersifat edukasi umum, bukan rekomendasi produk atau keputusan keuangan personal.
        Sesuaikan setiap langkah dengan kondisi, nilai, tujuan, kemampuan, dan risiko yang dapat kamu tanggung.
      </p>
    </section>
  );
}
