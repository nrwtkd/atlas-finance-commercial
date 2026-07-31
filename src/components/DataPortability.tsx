import { useRef, useState, type ChangeEvent } from "react";
import { clearVault, readVault, writeVault } from "../lib/localDb";
import { decryptVaultEnvelope, type VaultEnvelope } from "../lib/cryptoVault";
import {
  markBackupCreated,
  readBackupReminderSettings,
  readLastBackupAt,
  saveBackupReminderSettings,
  type BackupReminderSettings
} from "../lib/backupReminder";
import type { FinanceState } from "../types";
import AtlasIcon from "./AtlasIcon";
import "./SecurityRecovery.css";

type AtlasBackup = {
  format: "atlas-finance-encrypted-backup";
  version: 1;
  exportedAt: string;
  vault: VaultEnvelope;
};

type VerifiedBackupSummary = {
  verifiedAt: string;
  exportedAt: string;
  fileName: string;
  transactionCount: number;
  goalCount: number;
  budgetCount: number;
};

const LAST_VERIFIED_KEY = "atlas-last-verified-backup";
const DELETE_PHRASE = "HAPUS DATA ATLAS";

function isVaultEnvelope(value: unknown): value is VaultEnvelope {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<VaultEnvelope>;
  return candidate.version === 1
    && typeof candidate.salt === "string"
    && candidate.salt.length > 0
    && typeof candidate.iv === "string"
    && candidate.iv.length > 0
    && typeof candidate.ciphertext === "string"
    && candidate.ciphertext.length > 0;
}

function isAtlasBackup(value: unknown): value is AtlasBackup {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AtlasBackup>;
  const exportedAt = new Date(candidate.exportedAt ?? "");
  return candidate.format === "atlas-finance-encrypted-backup"
    && candidate.version === 1
    && !Number.isNaN(exportedAt.getTime())
    && isVaultEnvelope(candidate.vault);
}

function isFinanceState(value: unknown): value is FinanceState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<FinanceState>;
  return typeof candidate.profileName === "string"
    && Array.isArray(candidate.transactions)
    && Array.isArray(candidate.budgetPlans)
    && Array.isArray(candidate.goals);
}

function readVerifiedSummary(): VerifiedBackupSummary | null {
  try {
    const raw = localStorage.getItem(LAST_VERIFIED_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VerifiedBackupSummary;
    return parsed?.verifiedAt && parsed?.fileName ? parsed : null;
  } catch {
    return null;
  }
}

function formatDateTime(date: Date | null) {
  if (!date) return "Belum ada";
  return `${date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  })}, ${date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
}

function backupHealth(lastBackup: Date | null) {
  if (!lastBackup) {
    return {
      title: "Belum terlindungi",
      text: "Buat salinan pertama agar datamu dapat dipulihkan.",
      attention: true
    };
  }
  const ageDays = Math.floor((Date.now() - lastBackup.getTime()) / 86_400_000);
  if (ageDays <= 7) {
    return {
      title: "Cadangan terjaga",
      text: `Terakhir dibuat ${formatDateTime(lastBackup)}.`,
      attention: false
    };
  }
  return {
    title: "Perlu diperbarui",
    text: `Salinan terakhir sudah ${ageDays} hari lalu.`,
    attention: true
  };
}

export default function DataPortability() {
  const restoreInput = useRef<HTMLInputElement>(null);
  const verifyInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [reminder, setReminder] = useState<BackupReminderSettings>(() => readBackupReminderSettings());
  const [lastBackup, setLastBackup] = useState<Date | null>(() => readLastBackupAt());
  const [lastVerified, setLastVerified] = useState<VerifiedBackupSummary | null>(() => readVerifiedSummary());
  const [pendingCheck, setPendingCheck] = useState<{ fileName: string; backup: AtlasBackup } | null>(null);
  const [checkPin, setCheckPin] = useState("");
  const [checkResult, setCheckResult] = useState<VerifiedBackupSummary | null>(null);
  const [deleteText, setDeleteText] = useState("");

  const health = backupHealth(lastBackup);

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
      setStatus("Salinan terenkripsi sudah dibuat. Simpan file tersebut di tempat yang mudah kamu temukan kembali.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Salinan data gagal dibuat.");
    } finally {
      setBusy(false);
    }
  }

  async function parseBackupFile(file: File) {
    const parsed = JSON.parse(await file.text()) as unknown;
    if (!isAtlasBackup(parsed)) {
      throw new Error("File ini bukan salinan Atlas yang dapat dikenali.");
    }
    return parsed;
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const confirmed = window.confirm(
      "Memulihkan salinan akan mengganti data Atlas yang tersimpan di perangkat ini. Lanjutkan?"
    );
    if (!confirmed) return;

    setBusy(true);
    setStatus("");

    try {
      const parsed = await parseBackupFile(file);
      await writeVault(parsed.vault);
      window.alert("Salinan berhasil dipulihkan. Masukkan PIN yang digunakan ketika salinan tersebut dibuat.");
      window.location.reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Salinan data gagal dipulihkan.");
      setBusy(false);
    }
  }

  async function chooseBackupToVerify(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setStatus("");
    setCheckResult(null);
    setCheckPin("");

    try {
      const backup = await parseBackupFile(file);
      setPendingCheck({ fileName: file.name, backup });
    } catch (error) {
      setPendingCheck(null);
      setStatus(error instanceof Error ? error.message : "File salinan tidak dapat diperiksa.");
    }
  }

  async function verifyBackup() {
    if (!pendingCheck || checkPin.length !== 6) return;
    setBusy(true);
    setStatus("");

    try {
      const state = await decryptVaultEnvelope(checkPin, pendingCheck.backup.vault);
      if (!isFinanceState(state)) throw new Error("Salinan dapat dibuka, tetapi isi datanya tidak lengkap.");

      const summary: VerifiedBackupSummary = {
        verifiedAt: new Date().toISOString(),
        exportedAt: pendingCheck.backup.exportedAt,
        fileName: pendingCheck.fileName,
        transactionCount: state.transactions.length,
        goalCount: state.goals.length,
        budgetCount: state.budgetPlans.length
      };
      localStorage.setItem(LAST_VERIFIED_KEY, JSON.stringify(summary));
      setLastVerified(summary);
      setCheckResult(summary);
      setCheckPin("");
      setStatus("Salinan berhasil diuji tanpa mengganti data yang sedang kamu gunakan.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Salinan belum dapat dipastikan siap dipulihkan.");
    } finally {
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
    setStatus(enabled
      ? `Pengingat malam aktif pukul ${reminder.time}. Waktunya dapat diubah kapan saja.`
      : "Pengingat malam dinonaktifkan.");
  }

  async function deleteLocalData() {
    if (deleteText !== DELETE_PHRASE) return;
    const confirmed = window.confirm(
      "Ini akan menghapus seluruh data Atlas dari perangkat ini. File salinan yang pernah kamu simpan tidak ikut terhapus. Lanjutkan?"
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      await clearVault();
      window.alert("Data Atlas sudah dihapus dari perangkat ini. Kamu dapat membuat ruang baru atau memulihkan salinan.");
      window.location.reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Data lokal gagal dihapus.");
      setBusy(false);
    }
  }

  return (
    <article className="card portabilityCard securityCenter">
      <div className="portabilityIntro">
        <span className="portabilityIcon" aria-hidden="true"><AtlasIcon name="shield" size={22} /></span>
        <div>
          <span className="eyebrow">KEAMANAN DAN PEMULIHAN</span>
          <h3>Jaga perjalananmu tetap bisa dilanjutkan.</h3>
          <p>
            Data keuanganmu tersimpan di perangkat ini. Salinan terenkripsi membantumu melanjutkan Atlas
            ketika berganti HP, peramban, atau perangkat.
          </p>
        </div>
      </div>

      <div className="securityStatusGrid" aria-label="Status keamanan data Atlas">
        <article className="securitySignal">
          <span><AtlasIcon name="lock" size={18} /></span>
          <div><strong>Data terkunci</strong><small>Isi keuangan hanya dapat dibuka menggunakan PIN lokalmu.</small></div>
        </article>
        <article className={`securitySignal ${health.attention ? "attention" : ""}`}>
          <span><AtlasIcon name={health.attention ? "calendar" : "check"} size={18} /></span>
          <div><strong>{health.title}</strong><small>{health.text}</small></div>
        </article>
        <article className={`securitySignal ${reminder.enabled ? "" : "attention"}`}>
          <span><AtlasIcon name="shield" size={18} /></span>
          <div>
            <strong>{reminder.enabled ? `Pengingat ${reminder.time}` : "Pengingat belum aktif"}</strong>
            <small>{reminder.enabled ? "Atlas akan mengingatkan saat waktunya membuat salinan." : "Aktifkan agar membuat cadangan tidak mudah terlewat."}</small>
          </div>
        </article>
      </div>

      <div className="securityActions">
        <button className="primary" type="button" disabled={busy} onClick={() => void exportBackup()}>
          {busy ? "Menyiapkan…" : "Buat salinan sekarang"}
        </button>
        <button className="secondary" type="button" disabled={busy} onClick={() => restoreInput.current?.click()}>
          Pulihkan salinan
        </button>
        <button className="secondary" type="button" disabled={busy} onClick={() => verifyInput.current?.click()}>
          Periksa salinan
        </button>
        <input
          ref={restoreInput}
          className="visuallyHidden"
          type="file"
          accept=".json,.atlas,application/json"
          onChange={(event) => void importBackup(event)}
        />
        <input
          ref={verifyInput}
          className="visuallyHidden"
          type="file"
          accept=".json,.atlas,application/json"
          onChange={(event) => void chooseBackupToVerify(event)}
        />
      </div>

      {pendingCheck && (
        <section className="backupCheckPanel" aria-label="Pemeriksaan salinan data">
          <div>
            <span className="eyebrow">UJI TANPA MENIMPA DATA</span>
            <h4>{pendingCheck.fileName}</h4>
            <p>Masukkan PIN yang digunakan ketika file ini dibuat. Atlas akan mencoba membukanya sementara, tanpa mengganti data di perangkatmu.</p>
          </div>
          <div className="backupCheckForm">
            <label>
              PIN salinan
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={checkPin}
                onChange={(event) => setCheckPin(event.target.value.replace(/\D/g, ""))}
                placeholder="6 digit"
              />
            </label>
            <button className="primary" type="button" disabled={busy || checkPin.length !== 6} onClick={() => void verifyBackup()}>
              Uji salinan
            </button>
          </div>
          {checkResult && (
            <div className="backupVerifiedResult">
              <AtlasIcon name="check" size={21} />
              <div>
                <strong>Salinan siap dipulihkan.</strong>
                <small>
                  Dibuat {formatDateTime(new Date(checkResult.exportedAt))} · {checkResult.transactionCount} catatan · {checkResult.goalCount} tujuan · {checkResult.budgetCount} rencana anggaran.
                </small>
              </div>
            </div>
          )}
        </section>
      )}

      {lastVerified && !checkResult && (
        <div className="backupVerifiedResult">
          <AtlasIcon name="check" size={21} />
          <div>
            <strong>Salinan terakhir sudah pernah diuji.</strong>
            <small>{lastVerified.fileName} · diperiksa {formatDateTime(new Date(lastVerified.verifiedAt))}.</small>
          </div>
        </div>
      )}

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

      <details className="recoveryGuide">
        <summary>
          <AtlasIcon name="arrowRight" size={18} />
          <span>Saat berganti HP atau perangkat</span>
          <span aria-hidden="true">⌄</span>
        </summary>
        <div className="recoverySteps">
          <article><b>1</b><strong>Buat salinan terbaru</strong><p>Simpan file di Drive, email pribadi, atau tempat aman yang dapat dibuka dari perangkat baru.</p></article>
          <article><b>2</b><strong>Buka Atlas di perangkat baru</strong><p>Masuk dengan akun pembelian yang sama, lalu pilih Pulihkan salinan di Ruangku.</p></article>
          <article><b>3</b><strong>Gunakan PIN lama</strong><p>Salinan hanya dapat dibuka dengan PIN yang digunakan ketika file tersebut dibuat.</p></article>
        </div>
      </details>

      <details className="dangerZone">
        <summary>
          <AtlasIcon name="lock" size={18} />
          <span>Hapus data dari perangkat ini</span>
          <span aria-hidden="true">⌄</span>
        </summary>
        <div className="dangerZoneBody">
          <p>
            Gunakan hanya saat perangkat akan diberikan kepada orang lain atau kamu benar-benar ingin memulai ulang.
            Sebaiknya buat dan periksa salinan terlebih dahulu. Tindakan ini tidak dapat dibatalkan tanpa file cadangan.
          </p>
          <div className="dangerConfirm">
            <input
              value={deleteText}
              onChange={(event) => setDeleteText(event.target.value)}
              placeholder={`Ketik: ${DELETE_PHRASE}`}
              aria-label="Konfirmasi penghapusan data Atlas"
            />
            <button className="danger" type="button" disabled={busy || deleteText !== DELETE_PHRASE} onClick={() => void deleteLocalData()}>
              Hapus dari perangkat
            </button>
          </div>
        </div>
      </details>

      {status && <p className="portabilityStatus" role="status">{status}</p>}
    </article>
  );
}
