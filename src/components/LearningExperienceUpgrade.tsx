import { useEffect } from "react";

type Concept = {
  title: string;
  text: string;
};

type Lesson = {
  title: string;
  outcomes: string[];
  explanation: string[];
  concepts: Concept[];
  exampleTitle: string;
  example: string[];
  practice: string[];
  watchOut: string;
  reflection: string;
};

const lessons: Lesson[] = [
  {
    title: "Kenali tiga jenis pergerakan uang",
    outcomes: [
      "Membedakan pemasukan, pengeluaran, dan alokasi dana tanpa mencampur ketiganya.",
      "Menghitung dana yang benar-benar masih tersedia untuk digunakan.",
      "Membaca laporan bulanan tanpa terkecoh oleh saldo rekening semata."
    ],
    explanation: [
      "Angka keuangan baru bermanfaat ketika kita memahami apa yang sebenarnya terjadi di baliknya. Uang yang masuk belum tentu seluruhnya bebas digunakan. Sebagian mungkin harus membayar kebutuhan, memenuhi kewajiban, atau dipindahkan ke tujuan masa depan.",
      "Pemasukan adalah uang yang menambah sumber daya, seperti gaji, uang saku, hasil usaha, honor, atau hadiah. Pengeluaran adalah uang yang benar-benar digunakan dan tidak lagi berada dalam kendali kita, seperti makan, transportasi, tagihan, obat, atau hiburan.",
      "Alokasi dana berbeda dari pengeluaran. Saat kamu memindahkan uang ke dana darurat, tabungan pendidikan, atau tujuan rumah, uang itu belum habis. Uang hanya berpindah tugas. Karena itu Atlas memisahkannya agar pengeluaran konsumsi tidak tampak lebih besar dari keadaan sebenarnya.",
      "Gambaran sederhana dana yang masih tersedia adalah: pemasukan dikurangi pengeluaran dan dana yang dialokasikan, lalu ditambah kembali dana yang ditarik dari tujuan. Angka ini membantu menentukan apakah rencana bulan berjalan masih aman atau perlu disesuaikan."
    ],
    concepts: [
      { title: "Pemasukan", text: "Uang yang menambah kemampuan finansialmu pada periode tertentu." },
      { title: "Pengeluaran", text: "Uang yang digunakan untuk kebutuhan, kewajiban, keinginan, atau aktivitas lain." },
      { title: "Alokasi dana", text: "Uang yang tetap menjadi milikmu, tetapi dipindahkan untuk tujuan yang lebih spesifik." },
      { title: "Dana tersedia", text: "Sisa uang yang belum digunakan atau diarahkan ke tujuan tertentu." }
    ],
    exampleTitle: "Contoh membaca satu bulan",
    example: [
      "Pemasukan: Rp5.000.000.",
      "Pengeluaran kebutuhan dan kewajiban: Rp3.000.000.",
      "Alokasi dana darurat: Rp500.000.",
      "Dana yang masih tersedia: Rp1.500.000. Dana darurat tidak dianggap sebagai belanja, tetapi progres menuju rasa aman."
    ],
    practice: [
      "Buka transaksi bulan ini dan tandai mana yang benar-benar pemasukan.",
      "Pisahkan uang yang sudah habis digunakan dari uang yang hanya dipindahkan ke tujuan.",
      "Bandingkan dana tersedia dengan saldo rekeningmu. Catat alasan jika hasilnya berbeda.",
      "Pilih satu perbaikan pencatatan yang akan kamu lakukan mulai hari ini."
    ],
    watchOut: "Saldo rekening yang masih besar tidak otomatis berarti uang bebas digunakan. Bisa jadi sebagian sudah memiliki tugas untuk tagihan, cicilan, atau tujuan tertentu.",
    reflection: "Selama ini, uang mana yang sering kamu anggap sudah habis padahal sebenarnya hanya sedang kamu simpan untuk tujuan lain?"
  },
  {
    title: "Anggaran adalah arah, bukan hukuman",
    outcomes: [
      "Menyusun pembagian uang berdasarkan keadaan nyata, bukan standar hidup orang lain.",
      "Membedakan pos wajib, fleksibel, perlindungan, tujuan, dan ruang menikmati hidup.",
      "Mengevaluasi anggaran dari data aktual tanpa menyalahkan diri sendiri."
    ],
    explanation: [
      "Anggaran bukan daftar larangan. Anggaran adalah keputusan tentang pekerjaan apa yang akan dilakukan oleh uangmu sebelum uang itu habis tanpa arah. Rencana yang baik membantu kebutuhan hari ini tetap terpenuhi sambil memberi ruang untuk masa depan.",
      "Tidak ada satu persentase yang cocok untuk semua orang. Mahasiswa dengan uang saku, pekerja tetap, pekerja lepas, pelaku usaha, orang yang hidup sendiri, keluarga dengan tanggungan, dan orang yang memasuki masa pensiun memiliki struktur kebutuhan yang berbeda.",
      "Mulailah dari angka yang sulit diubah: tempat tinggal, makan pokok, transportasi penting, kesehatan, pendidikan, cicilan minimum, serta kewajiban lain. Setelah itu tentukan perlindungan dan tujuan. Ruang untuk keinginan tetap boleh ada selama tidak mengorbankan kebutuhan utama dan komitmen yang telah dibuat.",
      "Anggaran perlu dibandingkan dengan kenyataan. Ketika satu pos melampaui rencana, pertanyaannya bukan hanya ‘kenapa aku gagal’, tetapi ‘apakah rencananya terlalu kecil, ada kejadian khusus, atau kebiasaan tertentu perlu diubah?’"
    ],
    concepts: [
      { title: "Pos wajib", text: "Kebutuhan dan kewajiban yang harus dipenuhi agar kehidupan tetap berjalan." },
      { title: "Pos fleksibel", text: "Pengeluaran yang jumlah dan waktunya masih dapat disesuaikan." },
      { title: "Pos perlindungan", text: "Dana untuk mengurangi dampak risiko, termasuk dana darurat dan perlindungan yang relevan." },
      { title: "Pos tujuan", text: "Uang yang diarahkan untuk kebutuhan masa depan yang jelas." }
    ],
    exampleTitle: "Contoh penyesuaian yang sehat",
    example: [
      "Rencana makan Rp1.000.000, tetapi aktual Rp1.250.000 karena beberapa kali lembur.",
      "Evaluasinya bukan langsung memotong makan bulan depan. Cek apakah kebutuhan kerja memang berubah, apakah bekal realistis dilakukan, dan dari pos mana penyesuaian paling aman diambil.",
      "Anggaran yang baik membantu membuat keputusan, bukan menghasilkan rasa bersalah."
    ],
    practice: [
      "Masukkan total pemasukan yang benar-benar dapat digunakan bulan ini.",
      "Tuliskan kebutuhan dan kewajiban yang tidak dapat ditunda.",
      "Tentukan satu pos perlindungan dan satu tujuan yang ingin tetap bergerak.",
      "Sisakan ruang realistis untuk kebutuhan fleksibel dan menikmati hidup.",
      "Di akhir bulan, ubah rencana berdasarkan pola nyata—bukan berdasarkan rasa malu."
    ],
    watchOut: "Anggaran yang terlalu ketat sering terlihat bagus di awal, tetapi sulit dijalankan. Rencana yang berkelanjutan lebih bernilai daripada rencana sempurna yang hanya bertahan beberapa hari.",
    reflection: "Bagian anggaran mana yang selama ini paling sering membuatmu merasa gagal, dan apakah targetnya memang realistis untuk kehidupanmu?"
  },
  {
    title: "Dana darurat membangun ruang bernapas",
    outcomes: [
      "Memahami fungsi dana darurat dan membedakannya dari tabungan tujuan biasa.",
      "Menentukan target secara bertahap berdasarkan kondisi hidup dan kestabilan pemasukan.",
      "Membuat aturan kapan dana boleh digunakan dan bagaimana mengisinya kembali."
    ],
    explanation: [
      "Dana darurat adalah penyangga ketika terjadi kebutuhan mendesak, penting, dan tidak direncanakan. Tujuannya bukan membuat kita kebal dari semua masalah, tetapi memberi waktu untuk berpikir dan bertindak tanpa langsung bergantung pada utang baru.",
      "Target dana darurat tidak harus sama untuk semua orang. Penghasilan yang tidak tetap, jumlah tanggungan, kebutuhan kesehatan, kestabilan pekerjaan, akses perlindungan, dan besarnya kebutuhan pokok memengaruhi seberapa besar penyangga yang dibutuhkan.",
      "Membangunnya boleh bertahap. Mulai dari target kecil yang terasa mungkin dicapai, lalu naikkan sampai target yang lebih kuat. Progres kecil tetap berarti karena setiap rupiah menambah ruang bernapas.",
      "Dana darurat idealnya dipisahkan dari uang belanja harian, mudah dicairkan saat benar-benar dibutuhkan, dan tidak ditempatkan pada pilihan yang nilainya mudah berubah tajam. Setelah digunakan, buat rencana pengisian kembali tanpa mengabaikan kebutuhan utama."
    ],
    concepts: [
      { title: "Mendesak", text: "Perlu ditangani segera dan tidak aman bila ditunda." },
      { title: "Penting", text: "Berkaitan dengan kebutuhan pokok, kesehatan, keselamatan, atau keberlangsungan penghasilan." },
      { title: "Tidak direncanakan", text: "Belum tersedia pos khusus dan waktunya tidak dapat dipastikan sebelumnya." },
      { title: "Likuid", text: "Dapat diakses dengan cukup cepat ketika kondisi darurat benar-benar terjadi." }
    ],
    exampleTitle: "Darurat atau bukan?",
    example: [
      "Perbaikan kendaraan yang diperlukan agar tetap dapat bekerja dapat menjadi keadaan darurat.",
      "Diskon liburan yang hanya berlaku hari ini bukan keadaan darurat.",
      "Biaya tahunan yang sudah diketahui seharusnya disiapkan sebagai dana berkala, bukan diambil dari dana darurat."
    ],
    practice: [
      "Hitung kebutuhan pokok rata-rata per bulan dari data aktualmu.",
      "Nilai kestabilan pemasukan dan jumlah pihak yang bergantung pada uang tersebut.",
      "Tentukan target tahap pertama yang terasa mungkin dicapai.",
      "Buat tujuan Dana Darurat di Atlas dan masukkan dana awal yang sudah tersedia.",
      "Tuliskan tiga kondisi yang boleh dan tiga kondisi yang tidak boleh menggunakan dana tersebut."
    ],
    watchOut: "Jangan memakai dana darurat untuk biaya yang sebenarnya dapat diperkirakan, seperti pajak tahunan, uang sekolah, hari raya, servis rutin, atau liburan. Buat tujuan atau dana berkala terpisah.",
    reflection: "Peristiwa tidak terduga apa yang paling berpotensi mengganggu kondisi keuanganmu saat ini?"
  },
  {
    title: "Satu tujuan, satu rencana",
    outcomes: [
      "Mengubah keinginan besar menjadi target yang dapat diukur dan dijalankan.",
      "Menghitung kebutuhan setoran dari target, dana awal, dan waktu yang tersedia.",
      "Memilih prioritas ketika ada banyak tujuan tetapi kemampuan menabung terbatas."
    ],
    explanation: [
      "Keinginan seperti ‘ingin punya rumah’, ‘ingin kuliah lagi’, atau ‘ingin umrah’ baru menjadi rencana ketika memiliki bentuk yang jelas: apa tujuannya, berapa dana yang diperlukan, kapan ingin dicapai, dan berapa dana yang sudah tersedia.",
      "Rumus dasarnya sederhana: sisa kebutuhan dibagi jumlah periode yang tersedia. Namun hasil hitungan bukan perintah kaku. Setoran perlu disesuaikan dengan arus kas, kebutuhan utama, tingkat kepentingan, serta perubahan biaya yang mungkin terjadi.",
      "Ketika memiliki banyak tujuan, jangan memaksa semuanya bergerak sama cepat. Bedakan tujuan yang mendesak, penting, dan masih dapat menunggu. Memberi prioritas bukan berarti menyerah pada tujuan lain; itu berarti menjaga rencana tetap realistis.",
      "Setiap alokasi dana di Atlas dapat diarahkan ke tujuan tertentu. Dengan begitu, progres tidak hanya menjadi angka motivasi, tetapi berasal dari pergerakan uang yang benar-benar tercatat."
    ],
    concepts: [
      { title: "Target nominal", text: "Perkiraan dana yang perlu tersedia agar tujuan dapat diwujudkan." },
      { title: "Dana awal", text: "Uang yang sudah dimiliki sebelum rencana baru dimulai." },
      { title: "Tenggat", text: "Waktu yang dituju, bukan janji mutlak yang tidak boleh berubah." },
      { title: "Setoran berkala", text: "Jumlah yang direncanakan untuk dialokasikan secara rutin." }
    ],
    exampleTitle: "Contoh mengubah keinginan menjadi rencana",
    example: [
      "Target biaya pendidikan Rp24.000.000, dana awal Rp6.000.000, waktu 18 bulan.",
      "Sisa kebutuhan Rp18.000.000. Gambaran setoran rata-rata Rp1.000.000 per bulan.",
      "Bila angka itu belum realistis, pilihan yang dapat dievaluasi adalah memperpanjang waktu, menambah pemasukan, menurunkan target, atau mengubah urutan prioritas."
    ],
    practice: [
      "Pilih satu tujuan yang paling bermakna dalam 12–36 bulan ke depan.",
      "Cari perkiraan biayanya dan tambahkan ruang untuk perubahan harga bila relevan.",
      "Masukkan dana awal, target, tenggat, dan rencana setoran di Pusat Tujuan Atlas.",
      "Uji apakah setoran tersebut masih menyisakan ruang untuk kebutuhan pokok dan perlindungan.",
      "Tentukan tanggal evaluasi, bukan hanya tanggal akhir."
    ],
    watchOut: "Target yang terlalu banyak dapat membuat semua tujuan bergerak sangat lambat dan menimbulkan frustrasi. Pilih beberapa prioritas aktif, sementara tujuan lain tetap disimpan untuk tahap berikutnya.",
    reflection: "Tujuan mana yang benar-benar milikmu, dan mana yang muncul karena merasa tertinggal dari orang lain?"
  },
  {
    title: "Utang perlu peta pelunasan",
    outcomes: [
      "Membuat gambaran utang yang lengkap tanpa menghindari angkanya.",
      "Memilih urutan pelunasan yang sesuai dengan biaya dan kebutuhan psikologis.",
      "Menjaga pembayaran utang tanpa mengorbankan kebutuhan dasar dan dana aman minimum."
    ],
    explanation: [
      "Utang terasa lebih menakutkan ketika hanya muncul sebagai potongan tagihan yang terpisah. Peta utang menyatukan seluruh informasi: pemberi pinjaman, saldo, cicilan minimum, biaya, tanggal jatuh tempo, jangka waktu, serta konsekuensi keterlambatan.",
      "Setelah peta terbentuk, pilih strategi. Mendahulukan utang dengan biaya paling tinggi dapat mengurangi total biaya. Mendahulukan saldo paling kecil dapat memberi kemenangan lebih cepat dan menjaga motivasi. Strategi terbaik adalah strategi yang dipahami dan dapat dijalankan secara konsisten.",
      "Tetap lindungi kebutuhan pokok. Pelunasan agresif yang membuat makan, tempat tinggal, kesehatan, atau transportasi kerja terganggu dapat memicu utang baru. Karena itu rencana pelunasan perlu berjalan bersama anggaran dan dana aman dasar.",
      "Catat pembayaran pokok sebagai alokasi menuju tujuan pelunasan utang bila kamu ingin melihat progres saldo secara terpisah dari biaya atau bunga yang benar-benar menjadi pengeluaran."
    ],
    concepts: [
      { title: "Saldo pokok", text: "Jumlah kewajiban utama yang masih perlu dilunasi." },
      { title: "Biaya utang", text: "Bunga, margin, denda, atau biaya lain yang menambah total pembayaran." },
      { title: "Cicilan minimum", text: "Pembayaran paling sedikit yang diwajibkan pada periode tertentu." },
      { title: "Ruang pelunasan", text: "Dana tambahan yang tersedia setelah kebutuhan utama dan kewajiban minimum terpenuhi." }
    ],
    exampleTitle: "Contoh memilih strategi",
    example: [
      "Utang A memiliki saldo kecil tetapi biaya sedang. Utang B memiliki saldo besar dan biaya jauh lebih tinggi.",
      "Strategi biaya tertinggi akan menambah pembayaran ke Utang B. Strategi saldo terkecil akan menuntaskan Utang A lebih dulu.",
      "Keduanya dapat benar selama pembayaran minimum seluruh utang tetap terpenuhi dan strategi tidak menimbulkan utang baru."
    ],
    practice: [
      "Tuliskan semua utang tanpa mengecualikan nominal kecil.",
      "Catat saldo, pembayaran minimum, biaya, dan tanggal jatuh tempo.",
      "Tentukan jumlah tambahan yang benar-benar aman untuk pelunasan.",
      "Pilih urutan pembayaran dan tuliskan alasanmu.",
      "Buat tujuan Pelunasan Utang di Atlas untuk memantau penurunan kewajiban."
    ],
    watchOut: "Jangan menutup satu utang dengan utang baru tanpa memahami total biaya, jangka waktu, dan risiko. Cicilan yang tampak lebih kecil belum tentu membuat beban keseluruhan lebih ringan.",
    reflection: "Apa yang paling membuatmu sulit melihat utang dengan jernih: takut pada totalnya, bingung harus mulai dari mana, atau pola pengeluaran yang masih berulang?"
  },
  {
    title: "Proteksi menjaga rencana tetap berjalan",
    outcomes: [
      "Memahami perlindungan sebagai sistem, bukan sekadar pembelian produk.",
      "Mengenali risiko yang dapat mengguncang arus kas dan tujuan.",
      "Mengevaluasi perlindungan berdasarkan kebutuhan, manfaat, biaya, dan batasannya."
    ],
    explanation: [
      "Proteksi bertujuan menjaga kehidupan dan rencana keuangan tetap berjalan ketika risiko terjadi. Bentuknya dapat berupa dana darurat, akses layanan kesehatan, perlindungan sosial, asuransi yang relevan, dokumen penting yang tertata, hingga pembagian tanggung jawab yang jelas.",
      "Mulailah dari risiko, bukan dari produk. Tanyakan: kejadian apa yang paling mungkin atau paling berat dampaknya? Apakah kehilangan penghasilan, biaya kesehatan, kecelakaan, kerusakan aset penting, atau tanggung jawab terhadap pihak lain?",
      "Setelah itu lihat perlindungan yang sudah ada. Hindari membayar dua kali untuk manfaat yang sama, tetapi jangan pula merasa aman hanya karena memiliki satu produk. Pahami manfaat, masa tunggu, pengecualian, batas klaim, kontribusi atau premi, dan kemampuan membayarnya dalam jangka panjang.",
      "Proteksi yang sehat harus selaras dengan arus kas. Perlindungan yang terlalu mahal dapat mengganggu kebutuhan hari ini, sementara perlindungan yang tidak memadai dapat membuat seluruh tujuan runtuh ketika risiko terjadi."
    ],
    concepts: [
      { title: "Risiko", text: "Peristiwa tidak pasti yang dapat menimbulkan kerugian finansial atau mengganggu rencana." },
      { title: "Dampak", text: "Besarnya konsekuensi bila risiko benar-benar terjadi." },
      { title: "Perlindungan yang ada", text: "Dana, layanan, program, aset, dan dukungan yang sudah dapat digunakan." },
      { title: "Celah perlindungan", text: "Bagian risiko yang belum tertutup oleh kemampuan dan perlindungan saat ini." }
    ],
    exampleTitle: "Contoh melihat sistem perlindungan",
    example: [
      "Seorang pekerja lepas memiliki dana darurat, tetapi tidak memiliki perlindungan kesehatan yang memadai.",
      "Dana darurat membantu membayar kebutuhan sementara, tetapi biaya kesehatan besar dapat menghabiskannya.",
      "Solusinya bukan otomatis membeli produk termahal, melainkan memetakan kebutuhan, perlindungan yang tersedia, biaya yang sanggup dijaga, dan celah yang paling penting."
    ],
    practice: [
      "Tuliskan tiga risiko yang paling dapat mengganggu hidup dan penghasilanmu.",
      "Catat perlindungan yang sudah tersedia untuk setiap risiko.",
      "Baca kembali manfaat, biaya, masa tunggu, dan pengecualian perlindungan yang dimiliki.",
      "Tentukan satu celah paling penting untuk diperbaiki terlebih dahulu.",
      "Masukkan biaya perlindungan yang dipilih ke anggaran agar keberlanjutannya terlihat."
    ],
    watchOut: "Jangan memutuskan perlindungan hanya karena takut, tekanan penjual, atau ilustrasi manfaat. Pastikan kamu memahami dokumen, kemampuan membayar, dan kesesuaiannya dengan risiko nyata.",
    reflection: "Risiko apa yang paling membuatmu cemas, dan bagian mana yang sebenarnya sudah terlindungi atau masih terbuka?"
  },
  {
    title: "Investasi mengikuti tujuan",
    outcomes: [
      "Memulai keputusan investasi dari tujuan dan waktu, bukan dari tren produk.",
      "Memahami hubungan potensi hasil, risiko perubahan nilai, dan kebutuhan likuiditas.",
      "Mengenali kapan kondisi keuangan dasar perlu diperkuat sebelum menambah risiko."
    ],
    explanation: [
      "Investasi adalah alat untuk membantu tujuan, bukan perlombaan mencari hasil tertinggi. Produk yang sesuai untuk tujuan jangka panjang belum tentu sesuai untuk dana yang akan digunakan dalam waktu dekat.",
      "Mulailah dari empat pertanyaan: untuk apa uang ini, kapan akan digunakan, seberapa besar perubahan nilai yang sanggup dihadapi, dan seberapa cepat uang harus dapat dicairkan. Jawaban tersebut membantu mempersempit pilihan secara lebih masuk akal.",
      "Potensi hasil yang lebih tinggi biasanya datang bersama ketidakpastian yang lebih besar. Karena itu jangan menggunakan dana kebutuhan pokok, tagihan dekat, dana darurat, atau uang yang tidak sanggup berkurang nilainya untuk mengambil risiko yang tidak dipahami.",
      "Sebelum memilih, pahami cara kerja, biaya, risiko, legalitas, akses pencairan, pajak yang relevan, dan kecocokannya dengan tujuan. Diversifikasi dapat membantu mengurangi ketergantungan pada satu pilihan, tetapi tidak menghapus seluruh risiko."
    ],
    concepts: [
      { title: "Jangka waktu", text: "Lama waktu sebelum dana direncanakan untuk digunakan." },
      { title: "Risiko", text: "Kemungkinan hasil berbeda dari harapan, termasuk penurunan nilai atau kesulitan pencairan." },
      { title: "Likuiditas", text: "Kemudahan mengubah aset menjadi uang yang dapat digunakan." },
      { title: "Diversifikasi", text: "Menyebarkan penempatan agar tidak seluruh hasil bergantung pada satu sumber risiko." }
    ],
    exampleTitle: "Tujuan berbeda, kebutuhan berbeda",
    example: [
      "Dana untuk biaya kuliah enam bulan lagi membutuhkan kestabilan dan akses yang berbeda dari dana pensiun puluhan tahun lagi.",
      "Memilih hanya berdasarkan imbal hasil tertinggi dapat membuat uang tidak tersedia ketika dibutuhkan atau nilainya sedang turun.",
      "Karena itu keputusan dimulai dari tujuan dan waktu, baru kemudian melihat pilihan alat."
    ],
    practice: [
      "Pilih satu tujuan yang ingin dibantu melalui investasi.",
      "Tuliskan tenggat, dana awal, kebutuhan setoran, dan kapan dana harus dapat dicairkan.",
      "Jelaskan dengan bahasamu sendiri bagaimana pilihan yang dipertimbangkan menghasilkan dan dapat merugi.",
      "Periksa biaya, legalitas, risiko, serta aturan pencairannya.",
      "Batalkan atau tunda keputusan bila kamu belum memahami cara kerjanya."
    ],
    watchOut: "Waspadai janji hasil tinggi yang terdengar pasti, dorongan untuk segera transfer, tekanan membawa anggota baru, atau penjelasan risiko yang tidak jelas. Tidak memahami produk adalah alasan yang cukup untuk tidak membeli.",
    reflection: "Saat tertarik pada suatu investasi, apakah kamu lebih dahulu memikirkan tujuanmu atau lebih dahulu terpikat oleh potensi hasilnya?"
  }
];

function textBlock(tag: keyof HTMLElementTagNameMap, className: string, text: string) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

function lessonSection(label: string) {
  const section = document.createElement("section");
  section.appendChild(textBlock("span", "lessonLabel", label));
  return section;
}

function buildLesson(lesson: Lesson) {
  const root = document.createElement("div");
  root.className = "lessonBody richLessonBody";

  const outcomes = lessonSection("SETELAH MEMPELAJARI INI");
  outcomes.classList.add("lessonOutcomes");
  const outcomesList = document.createElement("ul");
  lesson.outcomes.forEach((item) => outcomesList.appendChild(textBlock("li", "", item)));
  outcomes.appendChild(outcomesList);
  root.appendChild(outcomes);

  const explanation = lessonSection("PELAJARAN INTI");
  explanation.classList.add("lessonExplanation");
  lesson.explanation.forEach((paragraph) => explanation.appendChild(textBlock("p", "", paragraph)));
  root.appendChild(explanation);

  const concepts = lessonSection("KONSEP PENTING");
  const conceptGrid = document.createElement("div");
  conceptGrid.className = "conceptGrid";
  lesson.concepts.forEach((concept) => {
    const card = document.createElement("article");
    card.appendChild(textBlock("strong", "", concept.title));
    card.appendChild(textBlock("p", "", concept.text));
    conceptGrid.appendChild(card);
  });
  concepts.appendChild(conceptGrid);
  root.appendChild(concepts);

  const example = lessonSection("CONTOH PENERAPAN");
  example.classList.add("lessonExample");
  example.appendChild(textBlock("h4", "", lesson.exampleTitle));
  const exampleList = document.createElement("ul");
  lesson.example.forEach((item) => exampleList.appendChild(textBlock("li", "", item)));
  example.appendChild(exampleList);
  root.appendChild(example);

  const practice = lessonSection("COBA SEKARANG");
  practice.classList.add("practiceBox");
  practice.appendChild(textBlock("h4", "", "Latihan singkat di Atlas"));
  const practiceList = document.createElement("ol");
  lesson.practice.forEach((item) => practiceList.appendChild(textBlock("li", "", item)));
  practice.appendChild(practiceList);
  root.appendChild(practice);

  const warning = lessonSection("PERLU DIINGAT");
  warning.classList.add("watchOutBox");
  warning.appendChild(textBlock("strong", "", "Jangan lewatkan bagian ini"));
  warning.appendChild(textBlock("p", "", lesson.watchOut));
  root.appendChild(warning);

  const reflection = document.createElement("section");
  reflection.className = "reflectionQuestion";
  reflection.appendChild(textBlock("span", "", "◇"));
  const reflectionText = document.createElement("div");
  reflectionText.appendChild(textBlock("strong", "", "Pertanyaan untuk dirimu"));
  reflectionText.appendChild(textBlock("p", "", lesson.reflection));
  reflection.appendChild(reflectionText);
  root.appendChild(reflection);

  const note = textBlock(
    "p",
    "lessonDisclaimer",
    "Materi ini adalah edukasi umum. Keputusan finansial tetap perlu disesuaikan dengan kondisi, tujuan, kemampuan, dan risiko masing-masing pengguna."
  );
  root.appendChild(note);

  return root;
}

function decorateLearningCards() {
  const list = document.querySelector<HTMLElement>(".learningList");
  if (!list) return;

  list.classList.add("richLearningModules");
  const cards = Array.from(list.querySelectorAll<HTMLDetailsElement>("details.learningCard"));

  cards.forEach((card) => {
    const title = card.querySelector("summary h3")?.textContent?.trim();
    if (!title) return;
    const lesson = lessons.find((item) => item.title === title);
    if (!lesson) return;

    card.classList.add("richLearningModule");
    const body = card.querySelector<HTMLElement>(".moduleBody");
    if (!body || body.dataset.atlasRich === "true") return;

    const oldIntro = body.querySelector<HTMLElement>(":scope > p");
    if (oldIntro) oldIntro.classList.add("lessonLegacyIntro");

    const action = body.querySelector<HTMLElement>(":scope > button");
    const richBody = buildLesson(lesson);
    if (action) body.insertBefore(richBody, action);
    else body.appendChild(richBody);

    body.dataset.atlasRich = "true";

    if (card.dataset.atlasAccordion !== "true") {
      card.dataset.atlasAccordion = "true";
      card.open = false;
      card.addEventListener("toggle", () => {
        if (!card.open) return;
        cards.forEach((other) => {
          if (other !== card) other.open = false;
        });
      });
    }
  });
}

export default function LearningExperienceUpgrade() {
  useEffect(() => {
    let queued = false;
    const schedule = () => {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(() => {
        queued = false;
        decorateLearningCards();
      });
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
