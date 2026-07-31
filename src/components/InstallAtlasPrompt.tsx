import { useEffect, useMemo, useState } from "react";
import AtlasIcon from "./AtlasIcon";
import "./InstallAtlasPrompt.css";

type InstallChoice = { outcome: "accepted" | "dismissed"; platform: string };

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
}

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

const DISMISS_KEY = "atlas-install-prompt-dismissed-at";
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
}

function recentlyDismissed() {
  const value = Number(localStorage.getItem(DISMISS_KEY));
  return Number.isFinite(value) && Date.now() - value < DISMISS_FOR_MS;
}

export default function InstallAtlasPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const ios = useMemo(() => typeof navigator !== "undefined" && isIosDevice(), []);

  useEffect(() => {
    if (isStandaloneMode() || recentlyDismissed()) return;

    const mobileLike = window.matchMedia("(max-width: 900px), (pointer: coarse)").matches;
    if (!mobileLike) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => {
      setVisible(false);
      setInstallEvent(null);
      localStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    const reveal = window.setTimeout(() => setVisible(true), 1400);

    return () => {
      window.clearTimeout(reveal);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
    setShowGuide(false);
  }

  async function install() {
    if (installEvent) {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") {
        setVisible(false);
        setInstallEvent(null);
      }
      return;
    }
    setShowGuide(true);
  }

  if (!visible || isStandaloneMode()) return null;

  return (
    <aside className="installAtlas" role="dialog" aria-label="Pasang Atlas Finance di perangkat">
      <button className="installAtlasClose" type="button" aria-label="Tutup pengingat pemasangan" onClick={dismiss}>×</button>
      <div className="installAtlasMark" aria-hidden="true">A</div>
      <div className="installAtlasCopy">
        <span className="eyebrow">ATLAS DI LAYAR UTAMAMU</span>
        <strong>Pasang Atlas seperti aplikasi.</strong>
        <p>Buka lebih cepat dari ikon di HP. Setelah dipasang, biasakan masuk melalui ikon Atlas.</p>
        {showGuide && (
          <div className="iosInstallGuide">
            {ios ? (
              <>
                <span><b>1</b> Buka Atlas menggunakan <strong>Safari</strong>.</span>
                <span><b>2</b> Ketuk <strong>Bagikan</strong>, lalu pilih <strong>Tambahkan ke Layar Utama</strong>.</span>
                <span><b>3</b> Ketuk <strong>Tambah</strong>.</span>
              </>
            ) : (
              <>
                <span><b>1</b> Buka menu <strong>⋮</strong> di Chrome.</span>
                <span><b>2</b> Pilih <strong>Instal aplikasi</strong> atau <strong>Tambahkan ke layar utama</strong>.</span>
                <span><b>3</b> Konfirmasi pemasangan.</span>
              </>
            )}
          </div>
        )}
      </div>
      <button className="installAtlasAction" type="button" onClick={() => void install()}>
        <AtlasIcon name="plus" size={18} />
        <span>{installEvent ? "Pasang Atlas" : showGuide ? "Panduan terbuka" : "Lihat caranya"}</span>
      </button>
    </aside>
  );
}
