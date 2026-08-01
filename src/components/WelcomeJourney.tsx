import AtlasIcon from "./AtlasIcon";

type WelcomeJourneyProps = {
  name: string;
  transactionCount: number;
  onRecord: () => void;
};

export default function WelcomeJourney({ name, transactionCount, onRecord }: WelcomeJourneyProps) {
  if (transactionCount > 0) return null;

  return (
    <section className="welcomeJourney" aria-labelledby="welcome-title">
      <div className="welcomeBloom" aria-hidden="true"><AtlasIcon name="sparkles" size={23} /></div>

      <div className="welcomeCopy">
        <span className="welcomeKicker">SELAMAT DATANG DI ATLAS</span>
        <h2 id="welcome-title">Senang kamu sampai di sini, {name}.</h2>
        <p className="welcomeLead">
          Apa pun latar dan kondisi hidupmu sekarang, kamu tidak harus langsung membereskan semuanya.
          Kamu sudah melakukan bagian yang penting: mulai melihat keuanganmu dengan lebih jernih.
        </p>
        <p>
          Atlas dapat digunakan saat kamu masih kuliah, baru punya penghasilan, bekerja lepas,
          hidup sendiri, membangun keluarga, maupun memasuki masa pensiun. Kita mulai dari keadaanmu—bukan dari standar hidup orang lain.
        </p>

        <div className="welcomeTrust">
          <span aria-hidden="true"><AtlasIcon name="shield" size={20} /></span>
          <div>
            <strong>Ruang ini milikmu.</strong>
            <small>Data finansial tetap tersimpan di perangkat ini.</small>
          </div>
        </div>

        <button className="welcomeAction" type="button" onClick={onRecord}>
          <span>Catat langkah pertamaku</span><AtlasIcon name="arrowRight" size={18} />
        </button>
      </div>

      <details className="quickGuide">
        <summary>
          <span className="quickGuideIcon" aria-hidden="true"><AtlasIcon name="book" size={21} /></span>
          <span className="quickGuideTitle">
            <strong>Panduan singkat Atlas</strong>
            <small>Buka saat perlu—tidak harus dibaca sekaligus.</small>
          </span>
          <span className="quickGuideChevron" aria-hidden="true"><AtlasIcon name="chevronDown" size={18} /></span>
        </summary>
        <ol>
          <li>
            <strong>Mulai dari yang benar-benar terjadi.</strong>
            <span>Catat satu pemasukan atau pengeluaran hari ini. Tidak perlu menunggu datamu lengkap.</span>
          </li>
          <li>
            <strong>Beri konteks, bukan sekadar angka.</strong>
            <span>Kategori, aktivitas, orang terkait, dan makna transaksi membantu Atlas membaca polamu.</span>
          </li>
          <li>
            <strong>Sesuaikan dengan kehidupanmu.</strong>
            <span>Kamu dapat menambah orang, kategori, dan aktivitas sendiri. Pilih “Saya” saja bila transaksi hanya berkaitan denganmu.</span>
          </li>
          <li>
            <strong>Gunakan perangkat dan peramban yang sama.</strong>
            <span>Data lokal tidak otomatis berpindah ketika kamu membuka Atlas di perangkat lain.</span>
          </li>
          <li>
            <strong>Simpan salinan cadangan secara berkala.</strong>
            <span>Buka menu Ruangku untuk mengekspor atau memulihkan salinan data terenkripsi.</span>
          </li>
          <li>
            <strong>Jaga PIN lokalmu.</strong>
            <span>PIN adalah kunci untuk membuka data dan salinan cadangan yang tersimpan aman.</span>
          </li>
        </ol>
      </details>
    </section>
  );
}
