import { useState } from "react";
import AtlasIcon from "./AtlasIcon";
import "./EarlyAccessPending.css";

type Props = {
  email: string;
  userId: string;
  status: "inactive" | "unknown";
  onRetry: () => Promise<void>;
  onSignOut: () => void;
};

export default function EarlyAccessPending({ email, userId, status, onRetry, onSignOut }: Props) {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  async function copyActivationCode() {
    const text = `ATLAS EARLY ACCESS\nEmail: ${email}\nKode aktivasi: ${userId}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      window.prompt("Salin informasi aktivasi ini:", text);
    }
  }

  async function retry() {
    setChecking(true);
    try {
      await onRetry();
    } finally {
      setChecking(false);
    }
  }

  return (
    <main className="earlyAccessPage">
      <section className="earlyAccessCard" aria-labelledby="early-access-title">
        <div className="earlyAccessMark" aria-hidden="true">A</div>
        <span className="eyebrow">AKSES AWAL ATLAS</span>
        <h1 id="early-access-title">Akunmu sudah dikenali.</h1>
        <p className="earlyAccessLead">
          {status === "unknown"
            ? "Atlas belum berhasil memastikan akses akunmu. Coba periksa lagi beberapa saat lagi."
            : "Karena Atlas masih dalam closed beta, akun ini perlu diaktifkan satu kali oleh tim Atlas."}
        </p>

        <div className="earlyAccessIdentity">
          <span aria-hidden="true"><AtlasIcon name="lock" size={20} /></span>
          <div><small>Akun yang digunakan</small><strong>{email}</strong></div>
        </div>

        <div className="earlyAccessSteps">
          <article><b>1</b><span>Salin kode aktivasi di bawah.</span></article>
          <article><b>2</b><span>Kirimkan kepada Wita atau tim Atlas.</span></article>
          <article><b>3</b><span>Setelah dikabari aktif, tekan “Periksa akses”.</span></article>
        </div>

        <button className="secondary earlyAccessCopy" type="button" onClick={() => void copyActivationCode()}>
          <AtlasIcon name={copied ? "check" : "wallet"} size={18} />
          <span>{copied ? "Kode sudah disalin" : "Salin kode aktivasi"}</span>
        </button>

        <button className="primary earlyAccessRetry" type="button" disabled={checking} onClick={() => void retry()}>
          {checking ? "Memeriksa…" : "Periksa akses"}
        </button>
        <button className="earlyAccessSignOut" type="button" onClick={onSignOut}>Masuk dengan akun lain</button>

        <p className="earlyAccessFine">Kode ini hanya mengenali akunmu. Isi data keuanganmu tidak ikut terkirim.</p>
      </section>
    </main>
  );
}
