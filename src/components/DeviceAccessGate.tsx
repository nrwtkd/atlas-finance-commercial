import { useEffect, useState } from "react";
import {
  listMyDevices,
  revokeDevice,
  type DeviceActivationResult,
  type RegisteredDevice
} from "../lib/deviceAccess";
import AtlasCompanion from "./AtlasCompanion";
import "./DeviceAccess.css";

function formatDateTime(value?: string) {
  if (!value) return "Belum tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Belum tersedia";
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function gateCopy(access: DeviceActivationResult) {
  if (access.status === "limit_reached") {
    return {
      eyebrow: "BATAS PERANGKAT",
      title: "Lisensi ini sudah aktif di dua perangkat.",
      text: "Alerantara Finance digunakan untuk kebutuhan personal. Lepaskan satu perangkat lama bila kamu memang sedang berganti HP atau komputer."
    };
  }
  if (access.status === "cooldown") {
    return {
      eyebrow: "PERGANTIAN PERANGKAT",
      title: "Perangkat baru belum dapat diaktifkan.",
      text: `Untuk mencegah satu lisensi diputar ke banyak orang, aktivasi berikutnya tersedia setelah ${formatDateTime(access.retryAt)}.`
    };
  }
  if (access.status === "inactive_license") {
    return {
      eyebrow: "LISENSI",
      title: "Lisensi akun ini belum aktif.",
      text: "Masuk menggunakan akun yang menerima akses Alerantara Finance atau hubungi tim early deployer."
    };
  }
  return {
    eyebrow: "PEMERIKSAAN PERANGKAT",
    title: "Alerantara belum dapat memeriksa perangkat ini.",
    text: "Koneksi atau konfigurasi perlindungan perangkat mungkin belum siap. Data lokalmu tidak dihapus."
  };
}

export default function DeviceAccessGate({
  access,
  onRetry,
  onSignOut
}: {
  access: DeviceActivationResult;
  onRetry: () => Promise<void>;
  onSignOut: () => void;
}) {
  const [devices, setDevices] = useState<RegisteredDevice[]>([]);
  const [busyId, setBusyId] = useState("");
  const [status, setStatus] = useState("");
  const copy = gateCopy(access);

  async function refreshDevices() {
    try {
      setDevices(await listMyDevices());
    } catch (error) {
      console.error("Device list failed", error);
      setStatus("Daftar perangkat belum dapat dimuat.");
    }
  }

  useEffect(() => {
    if (access.status === "limit_reached" || access.status === "cooldown") {
      void refreshDevices();
    }
  }, [access.status]);

  async function release(installationId: string) {
    setBusyId(installationId);
    setStatus("");
    try {
      const result = await revokeDevice(installationId);
      setStatus(result.message ?? "Perangkat telah dilepaskan.");
      await refreshDevices();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Perangkat belum dapat dilepaskan.");
    } finally {
      setBusyId("");
    }
  }

  const activeDevices = devices.filter((device) => !device.revokedAt);

  return (
    <main className="deviceGate">
      <section className="deviceGateCard">
        <div className="deviceGateIntro">
          <AtlasCompanion mood={access.status === "unavailable" ? "guide" : "warn"} size="large" label="Tara menjaga akses lisensi Alerantara" />
          <div>
            <span className="eyebrow">{copy.eyebrow}</span>
            <h1>{copy.title}</h1>
            <p>{copy.text}</p>
          </div>
        </div>

        <div className="deviceGateSignal">
          Perangkat ini: <strong>{access.deviceName}</strong><br />
          Perangkat aktif: <strong>{access.activeCount} dari {access.maxDevices}</strong>
        </div>

        {activeDevices.length > 0 && (
          <div className="deviceGateList" aria-label="Perangkat yang menggunakan lisensi">
            {activeDevices.map((device) => (
              <article className="deviceGateDevice" key={device.installationId}>
                <div>
                  <strong>{device.deviceName}</strong>
                  <small>Terakhir aktif {formatDateTime(device.lastSeenAt)}</small>
                </div>
                <button
                  className="secondary"
                  type="button"
                  disabled={Boolean(busyId)}
                  onClick={() => void release(device.installationId)}
                >
                  {busyId === device.installationId ? "Melepaskan…" : "Lepaskan perangkat"}
                </button>
              </article>
            ))}
          </div>
        )}

        {access.status === "limit_reached" && (
          <p className="deviceGateStatus">
            Setelah perangkat dilepaskan, perangkat baru dapat diaktifkan 24 jam kemudian. Tim early deployer dapat membantu bila perangkat hilang atau rusak.
          </p>
        )}
        {status && <p className="deviceGateStatus" role="status">{status}</p>}

        <div className="deviceGateActions">
          <button className="primary" type="button" disabled={Boolean(busyId)} onClick={() => void onRetry()}>
            Periksa kembali
          </button>
          <button className="secondary" type="button" disabled={Boolean(busyId)} onClick={onSignOut}>
            Keluar dari akun
          </button>
        </div>
      </section>
    </main>
  );
}
