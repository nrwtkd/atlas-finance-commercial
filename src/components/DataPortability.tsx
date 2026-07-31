import { useRef, useState, type ChangeEvent } from "react";
import { readVault, writeVault } from "../lib/localDb";

type VaultEnvelope = {
  version: 1;
  salt: string;
  iv: string;
  ciphertext: string;
};

type AtlasBackup = {
  format: "atlas-finance-encrypted-backup";
  version: 1;
  exportedAt: string;
  vault: VaultEnvelope;
};

function isVaultEnvelope(value: unknown): value is VaultEnvelope {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<VaultEnvelope>;
  return candidate.version === 1
    && typeof candidate.salt === "string"
    && typeof candidate.iv === "string"
    && typeof candidate.ciphertext === "string";
}

function isAtlasBackup(value: unknown): value is AtlasBackup {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AtlasBackup>;
  return candidate.format === "atlas-finance-encrypted-backup"
    && candidate.version === 1
    && typeof candidate.exportedAt === "string"
    && isVaultEnvelope(candidate.vault);
}

export default function DataPortability() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function exportBackup() {
    setBusy(true);
    setStatus("");

    try {
      const vault = await readVault<VaultEnvelope>();
      if (!vault) throw new Error("Belum ada data lokal yang dapat dibuatkan salinan.");

      const backup: AtlasBackup = {
        format: "atlas-finance-encrypted-backup",
        version: 1,
        exportedAt: new Date().toISOString(),
        vault
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      anchor.href = url;
      anchor.download = `atlas-finance-cadangan-${date}.atlas.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus("Salinan data terenkripsi berhasil disiapkan.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Salinan data gagal dibuat.");
    } finally {
      setBusy(false);
    }
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const confirmed = window.confirm(
      "Memulihkan salinan akan mengganti data lokal Atlas di perangkat ini. Lanjutkan?"
    );
    if (!confirmed) return;

    setBusy(true);
    setStatus("");

    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      if (!isAtlasBackup(parsed)) {
        throw new Error("File ini bukan salinan data Atlas Finance yang valid.");
      }

      await writeVault(parsed.vault);
      window.alert("Salinan data berhasil dipulihkan. Masukkan PIN yang digunakan saat salinan dibuat.");
      window.location.reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Salinan data gagal dipulihkan.");
      setBusy(false);
    }
  }

  return (
    <article className="card portabilityCard">
      <div className="portabilityIntro">
        <span className="portabilityIcon" aria-hidden="true">⇄</span>
        <div>
          <span className="eyebrow">SALINAN DATA LOKAL</span>
          <h3>Bawa datamu dengan aman.</h3>
          <p>
            Ekspor salinan terenkripsi untuk berjaga-jaga, lalu pulihkan kembali saat berpindah
            peramban atau perangkat. Salinan tetap terkunci dengan PIN yang digunakan saat dibuat.
          </p>
        </div>
      </div>

      <div className="portabilityActions">
        <button className="primary" type="button" disabled={busy} onClick={() => void exportBackup()}>
          {busy ? "Menyiapkan…" : "Ekspor salinan"}
        </button>
        <button className="secondary" type="button" disabled={busy} onClick={() => fileInput.current?.click()}>
          Pulihkan salinan
        </button>
        <input
          ref={fileInput}
          className="visuallyHidden"
          type="file"
          accept=".json,.atlas,application/json"
          onChange={(event) => void importBackup(event)}
        />
      </div>

      {status && <p className="portabilityStatus" role="status">{status}</p>}
    </article>
  );
}
