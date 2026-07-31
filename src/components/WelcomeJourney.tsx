type WelcomeJourneyProps = {
  name: string;
  transactionCount: number;
  onRecord: () => void;
};

export default function WelcomeJourney({ name, transactionCount, onRecord }: WelcomeJourneyProps) {
  if (transactionCount > 0) return null;

  return (
    <section className="welcomeJourney" aria-labelledby="welcome-title">
      <div className="welcomeBloom" aria-hidden="true">✦</div>

      <div className="welcomeCopy">
        <span className="welcomeKicker">SELAMAT DATANG DI ATLAS</span>
        <h2 id="welcome-title">Senang kamu sampai di sini, {name}.</h2>
        <p className="welcomeLead">
          Kamu tidak harus membereskan semuanya hari ini. Kamu sudah melakukan bagian yang penting:
          memilih untuk melihat kondisi keuanganmu dengan lebih jernih.
        </p>
        <p>
          Atlas hadir sebagai ruang yang tenang untuk mencatat, memahami pola, dan bertumbuh tanpa
          rasa dihakimi. Apa pun kondisimu sekarang, kita mulai dari sana—pelan-pelan, tapi nyata.
        </p>

        <div className="welcomeTrust">
          <span aria-hidden="true">◇</span>
          <div>
            <strong>Ruang ini milikmu.</strong>
            <small>Data finansial tetap tersimpan di perangkat ini.</small>
          </div>
        </div>

        <button className="welcomeAction" type="button" onClick={onRecord}>
          Catat langkah pertamaku <span aria-hidden="true">→</span>
        </button>
      </div>

      <details className="quickGuide" open>
        <summary>
          <span aria-hidden="true">☼</span>
          Baca sebentar sebelum mulai
        </summary>
        <ol>
          <li>
            <strong>Mulai dari yang benar-benar terjadi.</strong>
            <span>Catat satu pemasukan atau pengeluaran hari ini. Tidak perlu menunggu datamu lengkap.</span>
          </li>
          <li>
            <strong>Beri konteks, bukan sekadar angka.</strong>
            <span>Area, aktivitas, dan kesadaran membantu Atlas membaca hubunganmu dengan uang.</span>
          </li>
          <li>
            <strong>Gunakan perangkat dan browser yang sama.</strong>
            <span>Data lokal tidak otomatis berpindah ketika kamu membuka Atlas di perangkat lain.</span>
          </li>
          <li>
            <strong>Simpan backup secara berkala.</strong>
            <span>Buka menu Ruangku untuk mengekspor atau memulihkan backup terenkripsi.</span>
          </li>
          <li>
            <strong>Jaga PIN lokalmu.</strong>
            <span>PIN tidak disimpan oleh Atlas dan diperlukan untuk membuka backup terenkripsi.</span>
          </li>
        </ol>
      </details>
    </section>
  );
}
