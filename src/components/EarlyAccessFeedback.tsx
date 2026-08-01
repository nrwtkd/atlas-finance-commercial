import { useState } from "react";
import type { FinanceState } from "../types";
import AtlasIcon from "./AtlasIcon";
import "./EarlyAccessFeedback.css";

type FeedbackKind = "Bingung" | "Error" | "Saran" | "Bagian yang disukai";

const areas = [
  "Masuk dan PIN",
  "Kenali Kondisimu",
  "Mencatat transaksi",
  "Rencana anggaran",
  "Tujuan keuangan",
  "Insight dan refleksi",
  "Cadangan dan pemulihan",
  "Tampilan",
  "Bagian lainnya"
];

export default function EarlyAccessFeedback({ finance }: { finance: FinanceState }) {
  const [kind, setKind] = useState<FeedbackKind>("Bingung");
  const [area, setArea] = useState(areas[0]);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");

  function reportText() {
    return [
      "ATLAS EARLY DEPLOYER — MASUKAN",
      `Waktu: ${new Date().toLocaleString("id-ID")}`,
      `Jenis: ${kind}`,
      `Bagian: ${area}`,
      `Catatan: ${note.trim() || "-"}`,
      "",
      "Konteks penggunaan tanpa nominal:",
      `• ${finance.transactions.length} catatan transaksi`,
      `• ${finance.budgetPlans.length} rencana anggaran`,
      `• ${finance.goals.filter((item) => !item.isArchived).length} tujuan aktif`,
      `• ${finance.learningProgress.length} materi dipahami`,
      "",
      `Perangkat: ${navigator.userAgent}`
    ].join("\n");
  }

  async function sendFeedback() {
    const text = reportText();
    try {
      if (navigator.share) {
        await navigator.share({ title: "Masukan Atlas Early Deployer", text });
        setStatus("Masukan siap dikirim melalui aplikasi yang kamu pilih.");
      } else {
        await navigator.clipboard.writeText(text);
        setStatus("Masukan sudah disalin. Tempelkan ke WhatsApp atau pesan untuk tim Atlas.");
      }
      setNote("");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(text);
        setStatus("Masukan sudah disalin. Tempelkan ke WhatsApp atau pesan untuk tim Atlas.");
      } catch {
        window.prompt("Salin masukan ini lalu kirim kepada tim Atlas:", text);
      }
    }
  }

  return (
    <section className="card earlyFeedbackCard">
      <div className="earlyFeedbackIntro">
        <span className="earlyFeedbackIcon" aria-hidden="true"><AtlasIcon name="heart" size={21} /></span>
        <div>
          <span className="eyebrow">EARLY DEPLOYER</span>
          <h3>Ceritakan bagian yang membantu atau masih membingungkan.</h3>
          <p>Laporan hanya menyertakan jumlah data dan informasi perangkat. Nominal, isi catatan, dan kondisi keuanganmu tidak ikut dimasukkan.</p>
        </div>
      </div>

      <div className="earlyFeedbackFields">
        <label>
          Jenis masukan
          <select value={kind} onChange={(event) => setKind(event.target.value as FeedbackKind)}>
            <option>Bingung</option>
            <option>Error</option>
            <option>Saran</option>
            <option>Bagian yang disukai</option>
          </select>
        </label>
        <label>
          Bagian Atlas
          <select value={area} onChange={(event) => setArea(event.target.value)}>
            {areas.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>

      <label className="earlyFeedbackNote">
        Apa yang terjadi atau kamu rasakan?
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={700}
          placeholder="Contoh: aku bingung apakah dana darurat harus dicatat sebagai pengeluaran atau alokasi."
        />
      </label>

      <button className="secondary earlyFeedbackSend" type="button" disabled={!note.trim()} onClick={() => void sendFeedback()}>
        <AtlasIcon name="arrowRight" size={18} />
        <span>Kirim atau salin masukan</span>
      </button>
      {status && <p className="earlyFeedbackStatus" role="status">{status}</p>}
    </section>
  );
}
