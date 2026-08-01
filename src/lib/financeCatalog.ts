import type { Awareness } from "../types";

export const CUSTOM_AREA_VALUE = "__area_lainnya__";
export const CUSTOM_ACTIVITY_VALUE = "__aktivitas_lainnya__";

export const AREA_OPTIONS = [
  "Diri",
  "Rumah Tangga",
  "Anak",
  "Pasangan",
  "Keluarga",
  "Pekerjaan",
  "Keuangan & Masa Depan",
  CUSTOM_AREA_VALUE
] as const;

export const AREA_LABELS: Record<string, string> = {
  Diri: "Diri",
  "Rumah Tangga": "Rumah tangga",
  Anak: "Anak",
  Pasangan: "Pasangan",
  Keluarga: "Keluarga",
  Pekerjaan: "Pekerjaan atau usaha",
  "Keuangan & Masa Depan": "Keuangan dan masa depan",
  [CUSTOM_AREA_VALUE]: "Area lainnya…"
};

export const ACTIVITIES_BY_AREA: Record<string, string[]> = {
  Diri: [
    "Makan & Minum",
    "Transportasi Pribadi",
    "Kesehatan",
    "Perawatan Diri",
    "Pakaian & Kebutuhan Pribadi",
    "Pendidikan & Pengembangan Diri",
    "Hobi & Hiburan",
    CUSTOM_ACTIVITY_VALUE
  ],
  "Rumah Tangga": [
    "Belanja Dapur",
    "Tagihan Rumah",
    "Sewa atau KPR",
    "Perawatan Rumah",
    "Perabot & Perlengkapan",
    "Bantuan Rumah Tangga",
    CUSTOM_ACTIVITY_VALUE
  ],
  Anak: [
    "Pendidikan Anak",
    "Kesehatan Anak",
    "Kebutuhan Harian Anak",
    "Kegiatan & Kursus Anak",
    "Tabungan Anak",
    "Hiburan Anak",
    CUSTOM_ACTIVITY_VALUE
  ],
  Pasangan: [
    "Kebutuhan Pasangan",
    "Kebersamaan",
    "Hadiah",
    "Dukungan Karier atau Usaha",
    CUSTOM_ACTIVITY_VALUE
  ],
  Keluarga: [
    "Orang Tua",
    "Saudara",
    "Bantuan Keluarga",
    "Acara Keluarga",
    CUSTOM_ACTIVITY_VALUE
  ],
  Pekerjaan: [
    "Transportasi Kerja",
    "Makan Saat Kerja",
    "Peralatan Kerja",
    "Pengembangan Profesional",
    "Operasional Usaha",
    CUSTOM_ACTIVITY_VALUE
  ],
  "Keuangan & Masa Depan": [
    "Dana Darurat",
    "Dana Berkala",
    "Tabungan Tujuan",
    "Investasi",
    "Proteksi atau Asuransi",
    "Pelunasan Utang",
    "Zakat, Infak & Sedekah",
    CUSTOM_ACTIVITY_VALUE
  ],
  [CUSTOM_AREA_VALUE]: [CUSTOM_ACTIVITY_VALUE]
};

export const AWARENESS_OPTIONS: Array<{
  value: Awareness;
  label: string;
  shortLabel: string;
  description: string;
  example: string;
}> = [
  {
    value: "Need",
    label: "Kebutuhan",
    shortLabel: "Kebutuhan",
    description: "Penting untuk hidup, kesehatan, tanggung jawab, atau fungsi sehari-hari.",
    example: "Contoh: makan pokok, obat, transportasi kerja."
  },
  {
    value: "Want",
    label: "Keinginan",
    shortLabel: "Keinginan",
    description: "Membuat hidup lebih nyaman atau menyenangkan, tetapi masih bisa ditunda.",
    example: "Contoh: nongkrong, pakaian tambahan, hiburan."
  },
  {
    value: "Impulse",
    label: "Impulsif",
    shortLabel: "Impulsif",
    description: "Terjadi spontan, tidak direncanakan, atau diputuskan karena dorongan sesaat.",
    example: "Contoh: membeli karena promo padahal sebelumnya tidak berniat."
  },
  {
    value: "Fixed",
    label: "Wajib atau rutin",
    shortLabel: "Rutin",
    description: "Pengeluaran yang jumlah atau jadwalnya relatif tetap dan perlu disiapkan berkala.",
    example: "Contoh: sewa, cicilan, listrik, uang sekolah."
  },
  {
    value: "Future",
    label: "Masa depan",
    shortLabel: "Masa depan",
    description: "Uang yang sengaja diarahkan untuk tujuan, tabungan, atau kebutuhan mendatang.",
    example: "Contoh: dana darurat, pendidikan, ibadah, rumah, pensiun."
  },
  {
    value: "Protection",
    label: "Perlindungan",
    shortLabel: "Perlindungan",
    description: "Menjaga kondisi keuangan dari risiko besar yang sulit ditanggung sekaligus.",
    example: "Contoh: BPJS, asuransi yang sesuai kebutuhan, dana kesehatan."
  },
  {
    value: "Payoff",
    label: "Pelunasan utang",
    shortLabel: "Pelunasan",
    description: "Pembayaran yang mengurangi kewajiban atau pokok utang agar beban masa depan mengecil.",
    example: "Contoh: cicilan, pelunasan kartu kredit, tambahan pembayaran pokok."
  }
];

export function getActivitiesForArea(area: string): string[] {
  return ACTIVITIES_BY_AREA[area] ?? [CUSTOM_ACTIVITY_VALUE];
}

export function getActivityLabel(activity: string): string {
  return activity === CUSTOM_ACTIVITY_VALUE ? "Aktivitas lainnya…" : activity;
}

export function getAwarenessLabel(value: Awareness): string {
  return AWARENESS_OPTIONS.find((option) => option.value === value)?.shortLabel ?? value;
}

export function getAwarenessInfo(value: Awareness) {
  return AWARENESS_OPTIONS.find((option) => option.value === value) ?? AWARENESS_OPTIONS[0];
}
