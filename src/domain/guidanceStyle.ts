import type { BudgetStyle } from "../types";

export type AtlasGuidanceMode = {
  style: BudgetStyle;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  reviewPrompt: string;
  emergencyPrompt: string;
  savedMessage: string;
};

const modes: Record<BudgetStyle, AtlasGuidanceMode> = {
  structured: {
    style: "structured",
    label: "Terstruktur",
    eyebrow: "ARAH YANG JELAS",
    title: "Atlas akan membantumu lewat urutan dan batas yang tegas.",
    description: "Kamu akan lebih sering melihat langkah spesifik, angka yang perlu dijaga, dan urutan tindakan yang dapat diselesaikan satu per satu.",
    reviewPrompt: "Tentukan satu langkah yang terukur dan kapan tepatnya akan kamu lakukan.",
    emergencyPrompt: "Jadikan setoran dana darurat sebagai jadwal tetap, lalu evaluasi nominalnya pada tanggal yang sama setiap bulan.",
    savedMessage: "Transaksi tersimpan. Lanjutkan sesuai urutan yang sudah kamu tetapkan."
  },
  balanced: {
    style: "balanced",
    label: "Seimbang",
    eyebrow: "ARAH DAN RUANG",
    title: "Atlas akan memberi arah utama tanpa menghilangkan ruang menyesuaikan.",
    description: "Kamu akan mendapat satu prioritas yang jelas, disertai pilihan penyesuaian ketika keadaan bulan ini berubah.",
    reviewPrompt: "Jaga satu arah utama, lalu sesuaikan bagian yang memang berubah tanpa membongkar seluruh rencana.",
    emergencyPrompt: "Pertahankan setoran yang realistis. Saat bulan berubah, sesuaikan nominalnya—bukan menghapus tujuannya.",
    savedMessage: "Transaksi tersimpan. Arah bulan ini menjadi sedikit lebih jelas."
  },
  flexible: {
    style: "flexible",
    label: "Fleksibel",
    eyebrow: "RUANG GERAK, KOMITMEN TETAP",
    title: "Atlas akan lebih tegas pada komitmen inti, sementara caranya tetap lentur.",
    description: "Karena kamu membutuhkan ruang gerak, Atlas tidak akan membebani banyak aturan. Namun satu batas utama akan dibuat lebih jelas agar fleksibel tidak berubah menjadi terus menunda.",
    reviewPrompt: "Pilih satu batas yang tidak dinegosiasikan minggu ini. Cara mencapainya boleh berubah, komitmennya jangan hilang.",
    emergencyPrompt: "Nominal setoran boleh menyesuaikan, tetapi dana darurat tetap harus menerima sesuatu sebelum uang fleksibel digunakan.",
    savedMessage: "Transaksi tersimpan. Ruang gerak boleh, tetapi transaksi berikutnya jangan dibiarkan lewat tanpa dicatat."
  }
};

export function getGuidanceMode(style?: BudgetStyle): AtlasGuidanceMode {
  return modes[style ?? "balanced"];
}
