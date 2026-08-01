import { isSupabaseConfigured, supabase } from "./supabase";

export const isDeviceLimitEnabled = isSupabaseConfigured
  && import.meta.env.VITE_DEVICE_LIMIT_ENABLED === "true";

const INSTALLATION_ID_KEY = "alerantara-installation-id-v1";

export type DeviceActivationStatus =
  | "active"
  | "limit_reached"
  | "cooldown"
  | "inactive_license"
  | "unavailable";

export interface DeviceActivationResult {
  status: DeviceActivationStatus;
  installationId: string;
  deviceName: string;
  activeCount: number;
  maxDevices: number;
  retryAt?: string;
  message?: string;
}

export interface RegisteredDevice {
  installationId: string;
  deviceName: string;
  platform?: string;
  browser?: string;
  firstActivatedAt: string;
  lastSeenAt: string;
  revokedAt?: string;
}

type RpcActivationPayload = {
  status?: DeviceActivationStatus;
  active_count?: number;
  max_devices?: number;
  retry_at?: string;
  message?: string;
};

type RpcDevicePayload = {
  installation_id?: string;
  device_name?: string;
  platform?: string;
  browser?: string;
  first_activated_at?: string;
  last_seen_at?: string;
  revoked_at?: string | null;
};

function makeInstallationId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `alerantara-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getCurrentInstallationId() {
  try {
    const stored = window.localStorage.getItem(INSTALLATION_ID_KEY);
    if (stored) return stored;
    const created = makeInstallationId();
    window.localStorage.setItem(INSTALLATION_ID_KEY, created);
    return created;
  } catch {
    try {
      const stored = window.sessionStorage.getItem(INSTALLATION_ID_KEY);
      if (stored) return stored;
      const created = makeInstallationId();
      window.sessionStorage.setItem(INSTALLATION_ID_KEY, created);
      return created;
    } catch {
      return makeInstallationId();
    }
  }
}

function browserName(userAgent: string) {
  if (/SamsungBrowser/i.test(userAgent)) return "Samsung Internet";
  if (/Edg\//i.test(userAgent)) return "Microsoft Edge";
  if (/Firefox\//i.test(userAgent)) return "Firefox";
  if (/CriOS|Chrome\//i.test(userAgent)) return "Chrome";
  if (/Safari\//i.test(userAgent)) return "Safari";
  return "Peramban";
}

function platformName(userAgent: string) {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  if (nav.userAgentData?.platform) return nav.userAgentData.platform;
  if (/Android/i.test(userAgent)) return "Android";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iPhone atau iPad";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Macintosh|Mac OS X/i.test(userAgent)) return "macOS";
  if (/Linux/i.test(userAgent)) return "Linux";
  return navigator.platform || "Perangkat";
}

export function describeCurrentDevice() {
  const userAgent = navigator.userAgent || "";
  const browser = browserName(userAgent);
  const platform = platformName(userAgent);
  const standalone = window.matchMedia?.("(display-mode: standalone)")?.matches;
  const deviceName = `${standalone ? "Aplikasi" : browser} di ${platform}`;
  return { deviceName, browser, platform };
}

export async function activateThisDevice(): Promise<DeviceActivationResult> {
  const installationId = getCurrentInstallationId();
  const descriptor = describeCurrentDevice();

  if (!isDeviceLimitEnabled || !supabase) {
    return {
      status: "active",
      installationId,
      deviceName: descriptor.deviceName,
      activeCount: 1,
      maxDevices: 2,
      message: "Pembatasan perangkat belum diaktifkan."
    };
  }

  const { data, error } = await supabase.rpc("activate_alerantara_device", {
    p_installation_id: installationId,
    p_device_name: descriptor.deviceName,
    p_platform: descriptor.platform,
    p_browser: descriptor.browser
  });

  if (error) {
    console.error("Device activation failed", error);
    return {
      status: "unavailable",
      installationId,
      deviceName: descriptor.deviceName,
      activeCount: 0,
      maxDevices: 2,
      message: "Alerantara belum dapat memeriksa perangkat ini."
    };
  }

  const payload = (data ?? {}) as RpcActivationPayload;
  return {
    status: payload.status ?? "unavailable",
    installationId,
    deviceName: descriptor.deviceName,
    activeCount: Number(payload.active_count) || 0,
    maxDevices: Number(payload.max_devices) || 2,
    retryAt: payload.retry_at,
    message: payload.message
  };
}

export async function listMyDevices(): Promise<RegisteredDevice[]> {
  if (!isDeviceLimitEnabled || !supabase) return [];
  const { data, error } = await supabase.rpc("list_alerantara_devices");
  if (error) throw error;
  if (!Array.isArray(data)) return [];

  return (data as RpcDevicePayload[])
    .filter((item) => Boolean(item.installation_id && item.device_name && item.first_activated_at && item.last_seen_at))
    .map((item) => ({
      installationId: item.installation_id as string,
      deviceName: item.device_name as string,
      platform: item.platform || undefined,
      browser: item.browser || undefined,
      firstActivatedAt: item.first_activated_at as string,
      lastSeenAt: item.last_seen_at as string,
      revokedAt: item.revoked_at || undefined
    }));
}

export async function revokeDevice(installationId: string) {
  if (!supabase) throw new Error("Supabase belum dikonfigurasi.");
  const { data, error } = await supabase.rpc("revoke_alerantara_device", {
    p_installation_id: installationId
  });
  if (error) throw error;
  return data as { status?: string; message?: string; retry_at?: string };
}
