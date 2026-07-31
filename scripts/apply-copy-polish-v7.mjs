import { readFile, writeFile } from "node:fs/promises";

const appPath = new URL("../src/App.tsx", import.meta.url);
let source = await readFile(appPath, "utf8");
let changed = false;

const replacements = [
  [
    '<h3>Terenkripsi di perangkat</h3><p>Transaksi, tujuan, dan rencana anggaran tidak dikirim ke Supabase. Server hanya dipakai untuk identitas dan lisensi.</p>',
    '<h3>Tetap privat di perangkatmu</h3><p>Data keuanganmu disimpan dan dikunci di perangkat ini. Isi catatanmu tidak dikirim kepada kami. Akunmu hanya digunakan untuk memastikan akses Atlas milikmu.</p>'
  ],
  [
    '<p>PIN mengenkripsi data sebelum masuk ke penyimpanan perangkat.</p>',
    '<p>PIN menjadi kunci untuk membuka data keuangan yang tersimpan di perangkat ini.</p>'
  ]
];

for (const [before, after] of replacements) {
  if (source.includes(after)) continue;
  if (source.includes(before)) {
    source = source.replace(before, after);
    changed = true;
  }
}

if (changed) await writeFile(appPath, source, "utf8");
console.log("Atlas user-facing copy polished");
