# Atlas Finance Commercial

Atlas Finance adalah web app/PWA komersial **local-first**. Repository ini sengaja terpisah dari proyek Atlas lama agar versi lama tetap menjadi anchor dan tidak disentuh.

## Prinsip arsitektur

- Identitas pengguna dan lisensi: Supabase
- Data keuangan: terenkripsi di perangkat pengguna
- Database lokal: IndexedDB
- Hosting: Cloudflare Pages
- Backup: Google Drive pengguna pada tahap integrasi
- Pembayaran: Scalev pada tahap integrasi
- Tidak ada secret yang boleh disimpan di repository

## Status saat ini — Foundation 0.1

Sudah tersedia:

- React + TypeScript + Vite
- PWA shell dan service worker offline
- Login Google dan magic link yang siap dihubungkan ke Supabase
- Pemeriksaan lisensi melalui tabel `user_entitlements`
- Mode preview pemilik selama Supabase belum dikonfigurasi
- PIN lokal 6 digit
- Enkripsi AES-GCM dengan key derivation PBKDF2
- IndexedDB
- Input transaksi Area–Activity–Awareness
- Dashboard dasar, riwayat, dan penghapusan transaksi
- Tidak ada data keuangan yang dikirim ke backend

## Environment variables

Di Cloudflare Pages, variabel berikut nanti dimasukkan melalui dashboard:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_APP_ENV
```

`VITE_SUPABASE_PUBLISHABLE_KEY` aman dipakai di aplikasi browser dan tetap dibatasi oleh Row Level Security. **Secret key atau service-role key tidak boleh masuk ke aplikasi browser maupun GitHub.**

## Branch

- `main`: rilis stabil
- `develop`: pengembangan aktif
- perubahan besar masuk melalui pull request

## Tahap berikutnya

1. Membuat proyek Supabase
2. Membuat tabel profil dan lisensi dengan Row Level Security
3. Menghubungkan login email dan Google
4. Deploy branch `develop` ke Cloudflare Pages sebagai preview
5. Menambahkan backup Google Drive
6. Menghubungkan pembayaran Scalev
