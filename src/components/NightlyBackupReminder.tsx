import { useEffect, useState } from "react";
import AtlasIcon from "./AtlasIcon";
import {
  BACKUP_CREATED_EVENT,
  BACKUP_NOTIFICATION_DATE_KEY,
  BACKUP_REMINDER_CHANGED_EVENT,
  BACKUP_SNOOZE_UNTIL_KEY,
  backupWasCreatedToday,
  localDateKey,
  readBackupReminderSettings,
  reminderTimeHasPassed
} from "../lib/backupReminder";
import "./BackupReminder.css";

function snoozeIsActive() {
  const until = Number(localStorage.getItem(BACKUP_SNOOZE_UNTIL_KEY));
  return Number.isFinite(until) && until > Date.now();
}

async function showDeviceNotification() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const today = localDateKey();
  if (localStorage.getItem(BACKUP_NOTIFICATION_DATE_KEY) === today) return;

  try {
    const registration = await navigator.serviceWorker?.ready;
    if (registration) {
      await registration.showNotification("Waktunya menjaga salinan Atlas", {
        body: "Buat salinan data malam ini agar perjalanan keuanganmu tetap aman saat perangkat berganti.",
        icon: "/icons/atlas-icon.svg",
        badge: "/icons/atlas-icon.svg",
        tag: "atlas-nightly-backup",
        data: { url: "/" }
      });
      localStorage.setItem(BACKUP_NOTIFICATION_DATE_KEY, today);
    }
  } catch {
    // Pengingat di dalam Atlas tetap tersedia ketika notifikasi perangkat gagal.
  }
}

function openSpace() {
  const navButton = Array.from(document.querySelectorAll<HTMLButtonElement>(".atlasNav button"))
    .find((button) => /ruangku/i.test(button.textContent ?? ""));
  navButton?.click();
}

export default function NightlyBackupReminder() {
  const [visible, setVisible] = useState(false);
  const [time, setTime] = useState("20:00");

  useEffect(() => {
    function checkReminder() {
      const settings = readBackupReminderSettings();
      setTime(settings.time);
      const shouldShow = settings.enabled
        && reminderTimeHasPassed(settings.time)
        && !backupWasCreatedToday()
        && !snoozeIsActive();
      setVisible(shouldShow);
      if (shouldShow) void showDeviceNotification();
    }

    checkReminder();
    const interval = window.setInterval(checkReminder, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") checkReminder();
    };
    window.addEventListener("focus", checkReminder);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(BACKUP_REMINDER_CHANGED_EVENT, checkReminder);
    window.addEventListener(BACKUP_CREATED_EVENT, checkReminder);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", checkReminder);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(BACKUP_REMINDER_CHANGED_EVENT, checkReminder);
      window.removeEventListener(BACKUP_CREATED_EVENT, checkReminder);
    };
  }, []);

  if (!visible) return null;

  function snooze() {
    localStorage.setItem(BACKUP_SNOOZE_UNTIL_KEY, String(Date.now() + 30 * 60 * 1000));
    setVisible(false);
  }

  return (
    <aside className="nightlyBackupReminder" role="dialog" aria-label="Pengingat membuat salinan data Atlas">
      <span className="nightlyBackupIcon" aria-hidden="true"><AtlasIcon name="shield" size={22} /></span>
      <div className="nightlyBackupCopy">
        <span className="eyebrow">PENGINGAT MALAM · {time}</span>
        <strong>Luangkan satu menit untuk menjaga datamu.</strong>
        <p>Buat salinan terenkripsi malam ini agar catatanmu tetap bisa dipulihkan saat perangkat atau peramban berganti.</p>
      </div>
      <div className="nightlyBackupActions">
        <button className="primary" type="button" onClick={() => { openSpace(); setVisible(false); }}>
          Buka Ruangku
        </button>
        <button className="secondary" type="button" onClick={snooze}>Nanti 30 menit</button>
      </div>
    </aside>
  );
}
