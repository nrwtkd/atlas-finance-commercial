import { useEffect, useMemo, useState } from "react";
import {
  getCurrentInstallationId,
  isDeviceLimitEnabled,
  listMyDevices,
  revokeDevice,
  type RegisteredDevice
} from "../lib/deviceAccess";
import "./DeviceAccess.css";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "waktu tidak tersedia";
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function DeviceManager() {
  const currentInstallationId = useMemo(() => getCurrentInstallationId(), []);
  const [devices, setDevices] = useState<RegisteredDevice[]>([]);
  const [busyId, setBusyId] = useState("");
  const [status, setStatus] = useState("");

  async function refresh() {
    try {
      setDevices(await listMyDevices());
      setStatus("");
    } catch (error) {
      console.error("Device list failed", error);
      setStatus("Daftar perangkat belum dapat dimuat.");
    }
  }

  useEffect(() => {
    if (isDeviceLimitEnabled) void refresh();
  }, []);

  if (!isDeviceLimitEnabled) return null;

  const activeDevices = devices.filter((device) => !device.revokedAt);

  async function release(device: RegisteredDevice) {
    if (device.installationId === currentInstallationId) return;
    const confirmed = window.confirm(
      `Lepaskan ${device.deviceName}? Perangkat baru baru dapat diaktifkan 24 jam setelah pelepasan.`
    );
    if (!confirmed) return;

    setBusyId(device.installationId);
    setStatus("");
    try {
      const result = await revokeDevice(device.installationId);
      setStatus(result.message ?? "Perangkat telah dilepaskan.");
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Perangkat belum dapat dilepaskan.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <section className="deviceManager" aria-label="Perangkat yang menggunakan lisensi">
      <div className="deviceManagerHead">
        <div>
          <span className="eyebrow">PERANGKAT SAYA</span>
          <h4>Satu lisensi untuk dua perangkat pribadi.</h4>
          <p>Kelola HP atau komputer yang boleh membuka Alerantara menggunakan akun ini.</p>
        </div>
        <span className="deviceCount">{activeDevices.length} / 2 aktif</span>
      </div>

      <div className="deviceManagerList">
        {activeDevices.map((device) => {
          const isCurrent = device.installationId === currentInstallationId;
          return (
            <article className={isCurrent ? "deviceManagerDevice isCurrent" : "deviceManagerDevice"} key={device.installationId}>
              <div>
                <strong>
                  {device.deviceName}
                  {isCurrent && <span className="deviceBadge">Perangkat ini</span>}
                </strong>
                <small>
                  Pertama aktif {formatDateTime(device.firstActivatedAt)} · terakhir aktif {formatDateTime(device.lastSeenAt)}
                </small>
              </div>
              <button
                className="secondary"
                type="button"
                disabled={isCurrent || Boolean(busyId)}
                onClick={() => void release(device)}
              >
                {isCurrent ? "Sedang digunakan" : busyId === device.installationId ? "Melepaskan…" : "Lepaskan"}
              </button>
            </article>
          );
        })}
        {!activeDevices.length && !status && <p className="deviceManagerNote">Belum ada perangkat aktif yang dapat ditampilkan.</p>}
      </div>

      <p className="deviceManagerNote">
        Keluar dari akun tidak otomatis mengosongkan slot. Lepaskan hanya ketika kamu benar-benar berganti perangkat. Aktivasi perangkat baru memiliki jeda 24 jam untuk mencegah lisensi dibagikan bergantian.
      </p>
      {status && <p className="deviceManagerError" role="status">{status}</p>}
    </section>
  );
}
