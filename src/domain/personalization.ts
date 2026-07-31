import type {
  BudgetAllocation,
  BudgetBucket,
  BudgetScenario,
  FinancialProfile,
  FinancialPriority,
  IncomePattern,
  LifeStage
} from "../types";

export const lifeStageOptions: Array<{ value: LifeStage; label: string; description: string }> = [
  { value: "student", label: "Pelajar atau mahasiswa", description: "Masih belajar dan mungkin mengelola uang saku, beasiswa, atau pemasukan awal." },
  { value: "starting", label: "Baru mulai mandiri", description: "Baru membangun kebiasaan keuangan dan menata kebutuhan sendiri." },
  { value: "working", label: "Bekerja", description: "Memiliki pekerjaan dan ingin membuat pemasukan lebih terarah." },
  { value: "freelance_business", label: "Pekerja lepas atau pelaku usaha", description: "Pemasukan dapat berubah dan perlu cadangan untuk bulan yang lebih sepi." },
  { value: "family", label: "Sedang membangun keluarga", description: "Mengelola kebutuhan diri bersama pasangan, anak, atau tanggungan lain." },
  { value: "retired", label: "Masa pensiun", description: "Berfokus menjaga kestabilan, kesehatan, perlindungan, dan keberlanjutan dana." },
  { value: "other", label: "Kondisi lainnya", description: "Atlas tetap dapat menyesuaikan rekomendasi dari jawabanmu yang lain." }
];

export const incomePatternOptions: Array<{ value: IncomePattern; label: string; description: string }> = [
  { value: "none", label: "Belum punya pemasukan sendiri", description: "Kebutuhan masih ditopang pihak lain atau tabungan yang sudah ada." },
  { value: "allowance", label: "Uang saku atau dukungan keluarga", description: "Jumlahnya relatif terbatas dan perlu dibagi dengan sadar." },
  { value: "fixed", label: "Pemasukan tetap", description: "Jumlah dan waktunya relatif dapat diperkirakan setiap bulan." },
  { value: "variable", label: "Pemasukan tidak tetap", description: "Jumlah atau waktunya berubah dari bulan ke bulan." },
  { value: "mixed", label: "Campuran", description: "Ada pemasukan tetap sekaligus tambahan yang berubah-ubah." }
];

export const managedForOptions = [
  { value: "self", label: "Diri sendiri" },
  { value: "partner", label: "Pasangan" },
  { value: "children", label: "Anak" },
  { value: "parents", label: "Orang tua atau keluarga lain" },
  { value: "business", label: "Usaha" },
  { value: "other", label: "Pihak atau kepentingan lain" }
] as const;

export const priorityOptions: Array<{ value: FinancialPriority; label: string; description: string }> = [
  { value: "understand", label: "Memahami pengeluaran", description: "Melihat pola sebelum membuat perubahan besar." },
  { value: "budget", label: "Menyusun anggaran", description: "Memberi tugas pada pemasukan sejak awal." },
  { value: "emergency", label: "Membangun dana darurat", description: "Membuat ruang aman saat sesuatu tidak berjalan sesuai rencana." },
  { value: "debt", label: "Mengurangi utang", description: "Memperbaiki ruang gerak dan menurunkan beban kewajiban." },
  { value: "goal", label: "Menyiapkan tujuan", description: "Mengumpulkan dana untuk kebutuhan atau impian tertentu." },
  { value: "learn", label: "Belajar keuangan dari dasar", description: "Memahami konsep sebelum mengambil keputusan." }
];

const defaultAllocation: Record<BudgetBucket, number> = {
  "Kebutuhan pokok": 50,
  "Kewajiban dan utang": 15,
  "Dana darurat dan perlindungan": 10,
  "Tujuan masa depan": 10,
  "Keinginan dan gaya hidup": 10,
  "Berbagi dan ibadah": 5
};

function transfer(
  values: Record<BudgetBucket, number>,
  from: BudgetBucket,
  to: BudgetBucket,
  requested: number
) {
  const amount = Math.min(requested, Math.max(0, values[from]));
  values[from] -= amount;
  values[to] += amount;
}

function unique(items: string[]) {
  return Array.from(new Set(items));
}

export function getPersonalizedBudgetRecommendation(profile: FinancialProfile): {
  scenario: BudgetScenario;
  label: string;
  description: string;
  allocations: BudgetAllocation[];
  reasons: string[];
  emergencyTargetMonths: number;
} {
  const values = { ...defaultAllocation };
  const reasons: string[] = [];
  let scenario: BudgetScenario = "seimbang";

  if (profile.lifeStage === "student" || profile.incomePattern === "allowance" || profile.incomePattern === "none") {
    scenario = "belajar_mengelola";
    values["Kebutuhan pokok"] = 58;
    values["Kewajiban dan utang"] = 5;
    values["Dana darurat dan perlindungan"] = 15;
    values["Tujuan masa depan"] = 7;
    values["Keinginan dan gaya hidup"] = 10;
    values["Berbagi dan ibadah"] = 5;
    reasons.push("Pemasukan awal atau terbatas membutuhkan pembagian yang sederhana dan mudah dijaga.");
  } else if (profile.incomePattern === "variable" || profile.lifeStage === "freelance_business") {
    scenario = "penghasilan_tidak_tetap";
    values["Kebutuhan pokok"] = 52;
    values["Kewajiban dan utang"] = 10;
    values["Dana darurat dan perlindungan"] = 20;
    values["Tujuan masa depan"] = 8;
    values["Keinginan dan gaya hidup"] = 5;
    values["Berbagi dan ibadah"] = 5;
    reasons.push("Pemasukan yang berubah-ubah membutuhkan cadangan lebih besar untuk menjaga bulan yang lebih sepi.");
  } else if (profile.lifeStage === "retired") {
    scenario = "jaga_stabilitas";
    values["Kebutuhan pokok"] = 55;
    values["Kewajiban dan utang"] = 10;
    values["Dana darurat dan perlindungan"] = 20;
    values["Tujuan masa depan"] = 5;
    values["Keinginan dan gaya hidup"] = 5;
    values["Berbagi dan ibadah"] = 5;
    reasons.push("Tahap pensiun lebih membutuhkan kestabilan kebutuhan, kesehatan, dan perlindungan dana.");
  }

  if (profile.debtCondition === "heavy") {
    scenario = "prioritas_utang";
    transfer(values, "Keinginan dan gaya hidup", "Kewajiban dan utang", 5);
    transfer(values, "Tujuan masa depan", "Kewajiban dan utang", 5);
    reasons.push("Beban utang yang terasa berat perlu mendapat ruang lebih besar tanpa menghilangkan kebutuhan dasar.");
  } else if (profile.debtCondition === "manageable") {
    transfer(values, "Keinginan dan gaya hidup", "Kewajiban dan utang", 3);
    reasons.push("Kewajiban yang masih berjalan tetap diberi porsi khusus agar tidak mengganggu pos lain.");
  }

  if (profile.emergencyFundLevel === "none") {
    if (profile.debtCondition !== "heavy") scenario = "bangun_dana_darurat";
    transfer(values, "Keinginan dan gaya hidup", "Dana darurat dan perlindungan", 4);
    transfer(values, "Tujuan masa depan", "Dana darurat dan perlindungan", 4);
    reasons.push("Dana darurat belum tersedia, jadi rekomendasi awal menambah porsi untuk membangun bantalan pertama.");
  } else if (profile.emergencyFundLevel === "under_one") {
    transfer(values, "Keinginan dan gaya hidup", "Dana darurat dan perlindungan", 3);
    reasons.push("Cadangan masih di bawah satu bulan kebutuhan dan perlu diperkuat secara bertahap.");
  }

  if (profile.dependents > 0) {
    transfer(values, "Keinginan dan gaya hidup", "Kebutuhan pokok", 3);
    transfer(values, "Tujuan masa depan", "Kebutuhan pokok", 2);
    reasons.push(`${profile.dependents} tanggungan membuat kebutuhan pokok perlu memiliki ruang yang lebih aman.`);
  }

  if (profile.priorities.includes("debt")) {
    transfer(values, "Keinginan dan gaya hidup", "Kewajiban dan utang", 3);
  }
  if (profile.priorities.includes("emergency")) {
    transfer(values, "Tujuan masa depan", "Dana darurat dan perlindungan", 3);
  }
  if (profile.priorities.includes("goal")) {
    transfer(values, "Keinginan dan gaya hidup", "Tujuan masa depan", 4);
  }

  if (profile.budgetStyle === "structured") {
    transfer(values, "Keinginan dan gaya hidup", "Dana darurat dan perlindungan", 2);
    transfer(values, "Keinginan dan gaya hidup", "Tujuan masa depan", 1);
    reasons.push("Kamu nyaman dengan batas yang jelas, sehingga porsi masa depan dibuat sedikit lebih tegas.");
  } else if (profile.budgetStyle === "flexible") {
    transfer(values, "Tujuan masa depan", "Keinginan dan gaya hidup", 2);
    reasons.push("Kamu membutuhkan ruang fleksibel agar anggaran tetap realistis dan tidak cepat ditinggalkan.");
  }

  let emergencyTargetMonths = 3;
  if (profile.incomePattern === "variable" || profile.lifeStage === "freelance_business") emergencyTargetMonths = 6;
  if (profile.dependents > 0) emergencyTargetMonths = Math.max(emergencyTargetMonths, 6);
  if (profile.lifeStage === "retired") emergencyTargetMonths = Math.max(emergencyTargetMonths, 6);
  if (profile.incomePattern === "none" || profile.incomePattern === "allowance") emergencyTargetMonths = 3;

  const labels: Record<BudgetScenario, { label: string; description: string }> = {
    belajar_mengelola: {
      label: "Mulai sederhana dan aman",
      description: "Pembagian awal untuk belajar mengelola uang tanpa membuat anggaran terasa terlalu rumit."
    },
    seimbang: {
      label: "Tumbuh dengan seimbang",
      description: "Kebutuhan, kewajiban, keamanan, tujuan, dan ruang menikmati hidup dijaga tetap proporsional."
    },
    bangun_dana_darurat: {
      label: "Bangun rasa aman lebih dulu",
      description: "Cadangan keuangan diperkuat sebelum tujuan lain mendapat porsi yang lebih besar."
    },
    prioritas_utang: {
      label: "Pulihkan ruang gerak",
      description: "Utang mendapat perhatian lebih besar sambil tetap menjaga kebutuhan pokok dan dana aman minimum."
    },
    penghasilan_tidak_tetap: {
      label: "Jaga bulan yang berubah-ubah",
      description: "Kebutuhan dan cadangan diperkuat agar penghasilan yang naik-turun tidak langsung mengguncang rencana."
    },
    jaga_stabilitas: {
      label: "Jaga kestabilan",
      description: "Fokus utama berada pada kebutuhan, kesehatan, perlindungan, dan keberlanjutan dana."
    }
  };

  return {
    scenario,
    ...labels[scenario],
    allocations: Object.entries(values).map(([bucket, percent]) => ({
      bucket: bucket as BudgetBucket,
      percent
    })),
    reasons: unique(reasons).slice(0, 4),
    emergencyTargetMonths
  };
}

export function getFinancialProfileSummary(profile: FinancialProfile) {
  const stage = lifeStageOptions.find((item) => item.value === profile.lifeStage)?.label ?? "Kondisi lainnya";
  const income = incomePatternOptions.find((item) => item.value === profile.incomePattern)?.label ?? "Pola pemasukan belum dipilih";
  const priorityLabels = profile.priorities
    .map((value) => priorityOptions.find((item) => item.value === value)?.label)
    .filter(Boolean)
    .join(", ");
  return { stage, income, priorities: priorityLabels || "Belum ada fokus utama" };
}
