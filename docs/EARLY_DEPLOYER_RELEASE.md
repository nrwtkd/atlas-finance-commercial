# Alerantara Finance — Early Deployer Release

Dokumen ini adalah checklist wajib sebelum tautan produksi dibagikan kepada early deployer.

## 1. Aktifkan perlindungan dua perangkat

1. Buka Supabase Dashboard → SQL Editor.
2. Jalankan seluruh isi:
   `supabase/migrations/20260801_alerantara_device_activations.sql`
3. Pastikan fungsi berikut tersedia:
   - `activate_alerantara_device`
   - `list_alerantara_devices`
   - `revoke_alerantara_device`
4. Di Cloudflare Pages, tambahkan environment variable:
   `VITE_DEVICE_LIMIT_ENABLED=true`
5. Redeploy branch `develop`.

Jangan mengaktifkan environment variable sebelum migrasi SQL berhasil. Kode aplikasi menggunakan feature flag agar deployment biasa tidak mengunci pengguna ketika tabel belum siap.

## 2. Aktifkan akun early deployer

Gunakan proses entitlement yang sudah berjalan untuk memastikan akun Google masing-masing memiliki:

- `product_code`: `atlas-finance` (kode internal lama sengaja dipertahankan)
- `status`: `active`

Jangan memakai satu akun Google bersama-sama. Satu akun berarti satu lisensi personal dengan maksimal dua perangkat aktif.

## 3. Uji lisensi perangkat

Lakukan smoke test berikut dengan satu akun pengujian:

1. Perangkat pertama berhasil masuk dan terdaftar.
2. Perangkat kedua berhasil masuk dan terdaftar.
3. Perangkat ketiga tertahan pada halaman batas perangkat.
4. Daftar perangkat tampil di Keamanan dan Pemulihan.
5. Perangkat lama dapat dilepaskan.
6. Aktivasi baru setelah pelepasan menampilkan jeda 24 jam.
7. Logout biasa tidak menghapus slot perangkat.

## 4. Uji alur data utama

Pada satu perangkat bersih:

1. Login Google.
2. Buat PIN dan ruang lokal.
3. Selesaikan Kenali Kondisimu.
4. Aktifkan atau tolak Jejak Gizi Keluarga.
5. Catat pemasukan.
6. Buat dan simpan anggaran 100%.
7. Catat pengeluaran biasa.
8. Catat belanja bahan makanan dengan ceklis pangan.
9. Pastikan Tara Hari Ini menampilkan kemenangan keuangan dan keluarga.
10. Tambah dana ke tujuan.
11. Edit lalu hapus satu transaksi.
12. Buat file cadangan.
13. Periksa file cadangan menggunakan PIN.
14. Pulihkan cadangan pada browser pengujian lain.

## 5. Pesan yang wajib disampaikan kepada early deployer

- Ini adalah closed beta, bukan produk final.
- Data keuangan tersimpan secara lokal dan terenkripsi di perangkat.
- Data belum tersinkron otomatis antarperangkat.
- Login di perangkat kedua tidak otomatis membawa isi perangkat pertama.
- Buat file cadangan setelah onboarding dan minimal setiap minggu.
- PIN tidak dapat dipulihkan oleh tim Alerantara.
- Jangan memasukkan data yang satu-satunya salinannya tidak boleh hilang sebelum cadangan berhasil diuji.
- Masukan dapat dikirim dari menu Early Deployer tanpa menyertakan nominal atau isi catatan.

## 6. Kriteria boleh dibagikan

Tautan boleh diberikan kepada dua early deployer setelah:

- Build Check GitHub berhasil.
- Migrasi perangkat berhasil dijalankan.
- Feature flag perangkat aktif di Cloudflare.
- Ketiga skenario perangkat pada bagian 3 lolos.
- Satu alur penuh pada bagian 4 lolos di Android.
- File cadangan berhasil dibuat dan diuji.

## Yang belum dijanjikan pada tahap ini

- Sinkronisasi realtime.
- Cadangan cloud otomatis.
- Pemulihan PIN oleh server.
- Pembayaran dan aktivasi lisensi otomatis.
- Jaminan tanpa bug atau kehilangan data.

Early deployer digunakan untuk menemukan kebingungan, bug, dan kebutuhan nyata sebelum Alerantara dijual secara luas.
