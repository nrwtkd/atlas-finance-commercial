export type BackupReminderSettings = {
  enabled: boolean;
  time: string;
};

export const BACKUP_REMINDER_SETTINGS_KEY = "atlas-backup-reminder-settings";
export const LAST_BACKUP_AT_KEY = "atlas-last-backup-at";
export const BACKUP_SNOOZE_UNTIL_KEY = "atlas-backup-snooze-until";
export const BACKUP_NOTIFICATION_DATE_KEY = "atlas-backup-notification-date";
export const BACKUP_REMINDER_CHANGED_EVENT = "atlas-backup-reminder-changed";
export const BACKUP_CREATED_EVENT = "atlas-backup-created";

const defaultSettings: BackupReminderSettings = {
  enabled: false,
  time: "20:00"
};

export function readBackupReminderSettings(): BackupReminderSettings {
  try {
    const raw = localStorage.getItem(BACKUP_REMINDER_SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<BackupReminderSettings>;
    return {
      enabled: parsed.enabled === true,
      time: /^\d{2}:\d{2}$/.test(parsed.time ?? "") ? parsed.time! : defaultSettings.time
    };
  } catch {
    return defaultSettings;
  }
}

export function saveBackupReminderSettings(settings: BackupReminderSettings) {
  localStorage.setItem(BACKUP_REMINDER_SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(BACKUP_REMINDER_CHANGED_EVENT));
}

export function markBackupCreated(at = new Date()) {
  localStorage.setItem(LAST_BACKUP_AT_KEY, at.toISOString());
  localStorage.removeItem(BACKUP_SNOOZE_UNTIL_KEY);
  window.dispatchEvent(new CustomEvent(BACKUP_CREATED_EVENT));
}

export function readLastBackupAt(): Date | null {
  const raw = localStorage.getItem(LAST_BACKUP_AT_KEY);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function backupWasCreatedToday() {
  const last = readLastBackupAt();
  return Boolean(last && localDateKey(last) === localDateKey());
}

export function reminderTimeHasPassed(time: string, now = new Date()) {
  const [hour, minute] = time.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return false;
  return now.getHours() * 60 + now.getMinutes() >= hour * 60 + minute;
}
