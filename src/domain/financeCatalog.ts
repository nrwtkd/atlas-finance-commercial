import type { Awareness, BudgetAllocation, BudgetBucket, BudgetScenario } from "../types";

export const awarenessOptions: Array<{
  value: Awareness;
  label: string;
  description: string;
  example: string;
}> = [
  {
    value: "Need",
    label: "Kebutuhan",
    description: "Penting untuk hidup, kesehatan, pekerjaan, atau tanggung jawab sehari-hari.",
    example: "Contoh: makan pokok, obat, ongkos kerja, kebutuhan sekolah."
  },
  {
    value: "Want",
    label: "Keinginan",
    description: "Membuat hidup lebih nyaman atau menyenangkan, tetapi masih bisa ditunda.",
    example: "Contoh: nongkrong, dekorasi tambahan, peningkatan barang yang masih layak."
  },
  {
    value: "Impulse",
    label: "Impulsif",
    description: "Terjadi spontan, tidak direncanakan, atau dipicu suasana hati dan promosi.",
    example: "Contoh: membeli karena diskon padahal sebelumnya tidak berniat."
  },
  {
    value: "Fixed",
    label: "Wajib atau rutin",
    description: "Tagihan atau komitmen berkala yang perlu dibayar sesuai jadwal.",
    example: "Contoh: listrik, sewa, cicilan, uang sekolah, iuran."
  },
  {
    value: "Future",
    label: "Masa depan",
    description: "Uang yang sengaja diarahkan untuk tujuan dan kebutuhan mendatang.",
    example: "Contoh: dana pendidikan, rumah, pensiun, investasi sesuai tujuan."
  },
  {
    value: "Protection",
    label: "Perlindungan",
    description: "Menjaga keluarga dari guncangan keuangan yang tidak terduga.",
    example: "Contoh: dana darurat, asuransi, pemeriksaan kesehatan pencegahan."
  },
  {
    value: "Payoff",
    label: "Pelunasan utang",
    description: "Pembayaran yang mengurangi kewajiban dan memperbaiki ruang gerak keuangan.",
    example: "Contoh: cicilan pokok, pelunasan kartu kredit, percepatan utang."
  }
];

export const budgetBuckets: BudgetBucket[] = [
  "Kebutuhan pokok",
  "Kewajiban dan utang",
  "Dana darurat dan perlindungan",
  "Tujuan masa depan",
  "Keinginan dan gaya hidup",
  "Berbagi dan ibadah"
];

export const expenseCategories: Array<{
  name: string;
  bucket: BudgetBucket;
  activities: string[];
}> = [
  {
    name: "Makan dan minum",
    bucket: "Kebutuhan pokok",
    activities: ["Belanja bahan makanan", "Makan di luar", "Jajan dan minuman", "Bekal", "Acara keluarga"]
  },
  {
    name: "Rumah dan tempat tinggal",
    bucket: "Kebutuhan pokok",
    activities: ["Sewa atau KPR", "Listrik", "Air", "Internet", "Gas", "Perawatan rumah", "Perabot dan perlengkapan"]
  },
  {
    name: "Transportasi",
    bucket: "Kebutuhan pokok",
    activities: ["Bahan bakar", "Transportasi umum", "Ojek atau taksi", "Servis kendaraan", "Pajak kendaraan", "Parkir dan tol"]
  },
  {
    name: "Kesehatan",
    bucket: "Kebutuhan pokok",
    activities: ["Konsultasi dokter", "Obat", "Pemeriksaan", "Rawat inap", "Terapi", "Vitamin dan suplemen", "Perawatan gigi", "Alat kesehatan"]
  },
  {
    name: "Pendidikan dan pengembangan",
    bucket: "Kebutuhan pokok",
    activities: ["Uang sekolah atau kuliah", "Buku dan alat belajar", "Kursus", "Pelatihan", "Sertifikasi", "Kegiatan sekolah"]
  },
  {
    name: "Pekerjaan dan usaha",
    bucket: "Kebutuhan pokok",
    activities: ["Peralatan kerja", "Aplikasi dan langganan", "Bahan usaha", "Promosi", "Perjalanan dinas", "Administrasi usaha"]
  },
  {
    name: "Tagihan dan kewajiban",
    bucket: "Kewajiban dan utang",
    activities: ["Cicilan rumah", "Cicilan kendaraan", "Kartu kredit", "Pinjaman", "Iuran wajib", "Pajak", "Kewajiban keluarga"]
  },
  {
    name: "Dana darurat dan perlindungan",
    bucket: "Dana darurat dan perlindungan",
    activities: ["Dana darurat", "Asuransi kesehatan", "Asuransi jiwa", "Proteksi aset", "Dana kesehatan", "Dana kehilangan penghasilan"]
  },
  {
    name: "Tujuan dan investasi",
    bucket: "Tujuan masa depan",
    activities: ["Dana pendidikan", "Dana rumah", "Dana kendaraan", "Dana pensiun", "Dana ibadah", "Dana liburan", "Investasi sesuai tujuan", "Tabungan tujuan lainnya"]
  },
  {
    name: "Keinginan dan gaya hidup",
    bucket: "Keinginan dan gaya hidup",
    activities: ["Hiburan", "Hobi", "Belanja pribadi", "Perawatan diri", "Nongkrong", "Liburan", "Hadiah untuk diri"]
  },
  {
    name: "Berbagi dan ibadah",
    bucket: "Berbagi dan ibadah",
    activities: ["Zakat", "Infak", "Sedekah", "Hadiah", "Bantuan keluarga", "Kegiatan sosial", "Donasi"]
  }
];

export const incomeCategories = [
  "Gaji atau upah",
  "Pendapatan usaha",
  "Proyek atau pekerjaan lepas",
  "Bonus atau THR",
  "Hasil investasi",
  "Pemberian",
  "Pengembalian dana",
  "Pemasukan lainnya"
];

export const budgetScenarios: Array<{
  value: BudgetScenario;
  label: string;
  description: string;
  allocations: BudgetAllocation[];
}> = [
  {
    value: "seimbang",
    label: "Mulai seimbang",
    description: "Cocok sebagai titik awal ketika arus kas relatif stabil dan tidak ada tekanan utang besar.",
    allocations: [
      { bucket: "Kebutuhan pokok", percent: 50 },
      { bucket: "Kewajiban dan utang", percent: 15 },
      { bucket: "Dana darurat dan perlindungan", percent: 10 },
      { bucket: "Tujuan masa depan", percent: 10 },
      { bucket: "Keinginan dan gaya hidup", percent: 10 },
      { bucket: "Berbagi dan ibadah", percent: 5 }
    ]
  },
  {
    value: "bangun_dana_darurat",
    label: "Bangun rasa aman",
    description: "Memberi ruang lebih besar untuk dana darurat dan perlindungan ketika cadangan masih tipis.",
    allocations: [
      { bucket: "Kebutuhan pokok", percent: 50 },
      { bucket: "Kewajiban dan utang", percent: 15 },
      { bucket: "Dana darurat dan perlindungan", percent: 20 },
      { bucket: "Tujuan masa depan", percent: 5 },
      { bucket: "Keinginan dan gaya hidup", percent: 5 },
      { bucket: "Berbagi dan ibadah", percent: 5 }
    ]
  },
  {
    value: "prioritas_utang",
    label: "Pulihkan dari utang",
    description: "Mengarahkan ruang lebih besar untuk mengurangi utang tanpa mengabaikan kebutuhan pokok dan dana aman minimum.",
    allocations: [
      { bucket: "Kebutuhan pokok", percent: 50 },
      { bucket: "Kewajiban dan utang", percent: 25 },
      { bucket: "Dana darurat dan perlindungan", percent: 10 },
      { bucket: "Tujuan masa depan", percent: 5 },
      { bucket: "Keinginan dan gaya hidup", percent: 5 },
      { bucket: "Berbagi dan ibadah", percent: 5 }
    ]
  },
  {
    value: "penghasilan_tidak_tetap",
    label: "Penghasilan tidak tetap",
    description: "Mengutamakan kebutuhan pokok dan cadangan agar bulan dengan pemasukan rendah tetap lebih terlindungi.",
    allocations: [
      { bucket: "Kebutuhan pokok", percent: 55 },
      { bucket: "Kewajiban dan utang", percent: 15 },
      { bucket: "Dana darurat dan perlindungan", percent: 15 },
      { bucket: "Tujuan masa depan", percent: 5 },
      { bucket: "Keinginan dan gaya hidup", percent: 5 },
      { bucket: "Berbagi dan ibadah", percent: 5 }
    ]
  }
];

export function getActivities(category: string, customCategories: Record<string, string[]>): string[] {
  return expenseCategories.find((item) => item.name === category)?.activities
    ?? customCategories[category]
    ?? [];
}

export function inferBudgetBucket(category: string, awareness: Awareness): BudgetBucket {
  if (awareness === "Payoff") return "Kewajiban dan utang";
  if (awareness === "Protection") return "Dana darurat dan perlindungan";
  if (awareness === "Future") return "Tujuan masa depan";
  if (awareness === "Want" || awareness === "Impulse") return "Keinginan dan gaya hidup";
  return expenseCategories.find((item) => item.name === category)?.bucket ?? "Kebutuhan pokok";
}

export function getScenario(value: BudgetScenario) {
  return budgetScenarios.find((item) => item.value === value) ?? budgetScenarios[0];
}
