import { useRef, useState, type ChangeEvent } from "react";
import { readVault, writeVault } from "../lib/localDb";
import {
  markBackupCreated,
  readBackupReminderSettings,
  readLastBackupAt,
  saveBackupReminderSettings,
  type BackupReminderSettings
} from "../lib/backupReminder";
import AtlasIcon from "./AtlasIcon";

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

function formatBackupTime(date: Date | null) {
  if (!date) return "Belum pernah membuat salinan di perangkat ini";
  return `Salinan terakhir: ${date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  })}, ${date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function DataPortability() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [reminder, setReminder] = useState<BackupReminderSettings>(() => readBackupReminderSettings());
  const [lastBackup, setLastBackup] = useState<Date | null>(() => readLastBackupAt());

  async function exportBackup() {
    setBusy(true);
    setStatus("");

    try {
      const vault = await readVault<VaultEnvelope>();
      if (!vault) throw new Error("Belum ada data lokal yang dapat dibuatkan salinan.");

      const now = new Date();
      const backup: AtlasBackup = {
        format: "atlas-finance-encrypted-backup",
        version: 1,
        exportedAt: now.toISOString(),
        vault
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const date = now.toISOString().slice(0, 10);
      anchor.href = url;
      anchor.download = `atlas-finance-cadangan-${date}.atlas.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      markBackupCreated(now);
      setLastBackup(now);
      setStatus("Salinan data terenkripsi berhasil disiapkan. Simpan file ini di tempat yang aman.");
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

  function updateReminder(next: BackupReminderSettings) {
    setReminder(next);
    saveBackupReminderSettings(next);
  }

  async function toggleReminder() {
    const enabled = !reminder.enabled;
    if (enabled && "Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        setStatus("Pengingat di dalam Atlas tetap aktif. Notifikasi perangkat tidak diizinkan oleh peramban.");
      }
    }
    updateReminder({ ...reminder, enabled });
    if (enabled) {
      setStatus(`Pengingat malam aktif pukul ${reminder.time}. Waktunya dapat diubah kapan saja.`);
    } else {
      setStatus("Pengingat malam dinonaktifkan.");
    }
  }

  return (
    <article className="card portabilityCard">
      <div className="portabilityIntro">
        <span className="portabilityIcon" aria-hidden="true"><AtlasIcon name="shield" size={22} /></span>
        <div>
          <span className="eyebrow">SALINAN DATA LOKAL</span>
          <h3>Jaga perjalananmu tetap aman.</h3>
          <p>
            Buat salinan terenkripsi untuk berjaga-jaga, lalu pulihkan kembali saat berpindah
            peramban atau perangkat. Salinan tetap terkunci dengan PIN yang digunakan saat dibuat.
          </p>
          <span className="backupLastSaved"><AtlasIcon name="check" size={14} />{formatBackupTime(lastBackup)}</span>
        </div>
      </div>

      <div className="portabilityActions">
        <button className="primary" type="button" disabled={busy} onClick={() => void exportBackup()}>
          {busy ? "Menyiapkan…" : "Buat salinan sekarang"}
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

      <section className="backupReminderSettings" aria-label="Pengaturan pengingat salinan data">
        <div className="backupReminderSettingsCopy">
          <span className="eyebrow">PENGINGAT MALAM</span>
          <strong>Atlas mengingatkanmu sebelum hari berakhir.</strong>
          <p>Pengingat di dalam Atlas bekerja ketika aplikasi sedang terbuka. Notifikasi perangkat juga digunakan bila kamu mengizinkannya.</p>
          <small>Waktu bawaan pukul 20.00. Pengaturan ini hanya tersimpan di perangkatmu.</small>
        </div>
        <div className="backupReminderControls">
          <input
            type="time"
            aria-label="Waktu pengingat malam"
            value={reminder.time}
            onChange={(event) => updateReminder({ ...reminder, time: event.target.value || "20:00" })}
          />
          <button className={reminder.enabled ? "secondary" : "primary"} type="button" onClick={() => void toggleReminder()}>
            {reminder.enabled ? "Matikan pengingat" : "Aktifkan pengingat"}
          </button>
        </div>
      </section>

      {status && <p className="portabilityStatus" role="status">{status}</p>}
    </article>
  );
}
