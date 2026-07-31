import { readFile, writeFile } from "node:fs/promises";

const appPath = new URL("../src/App.tsx", import.meta.url);
let source = await readFile(appPath, "utf8");

function replaceOnce(before, after, label) {
  if (source.includes(after)) return;
  if (!source.includes(before)) {
    throw new Error(`Atlas experience patch gagal pada: ${label}`);
  }
  source = source.replace(before, after);
}

replaceOnce(
  'import type { Awareness, Entitlement, FinanceState, FinanceTransaction } from "./types";\n',
  'import type { Awareness, Entitlement, FinanceState, FinanceTransaction } from "./types";\nimport DataPortability from "./components/DataPortability";\nimport WelcomeJourney from "./components/WelcomeJourney";\n',
  "component imports"
);

replaceOnce(
  '        <button className="icon" onClick={() => { setFinance(null); setPin(""); }}>◇</button>',
  '        <button className="icon" aria-label="Kunci Atlas" title="Kunci Atlas" onClick={() => { setFinance(null); setPin(""); }}>◇</button>',
  "lock button accessibility"
);

replaceOnce(
  '      <nav>\n        <Nav label="Home" icon="⌂" active={screen === "home"} onClick={() => setScreen("home")} />\n        <Nav label="Catat" icon="＋" active={screen === "record"} onClick={() => setScreen("record")} />\n        <Nav label="Riwayat" icon="≡" active={screen === "history"} onClick={() => setScreen("history")} />\n        <Nav label="Privasi" icon="◈" active={screen === "privacy"} onClick={() => setScreen("privacy")} />\n      </nav>',
  '      <nav>\n        <Nav label="Beranda" icon="⌂" active={screen === "home"} onClick={() => setScreen("home")} />\n        <Nav label="Catat" icon="＋" active={screen === "record"} onClick={() => setScreen("record")} />\n        <Nav label="Jejak" icon="≋" active={screen === "history"} onClick={() => setScreen("history")} />\n        <Nav label="Ruangku" icon="◇" active={screen === "privacy"} onClick={() => setScreen("privacy")} />\n      </nav>',
  "warmer navigation"
);

replaceOnce(
  '    <>\n      <section className="balance">',
  '    <>\n      <WelcomeJourney name={finance.profileName} transactionCount={stats.count} onRecord={onRecord} />\n      <section className="balance">',
  "welcome journey"
);

replaceOnce(
  '<section className="card focus"><div><span className="eyebrow">FOKUS HARI INI</span>',
  '<section className="card focus"><div><span className="eyebrow">LANGKAH HARI INI</span>',
  "focus language"
);

replaceOnce(
  '<div className="heading"><h2>Ringkasan</h2><button onClick={onRecord}>Catat transaksi</button></div>',
  '<div className="heading"><h2>Gambaran bulan ini</h2><button onClick={onRecord}>Catat transaksi</button></div>',
  "summary language"
);

replaceOnce(
  'function Privacy({ finance, onReset }: { finance: FinanceState; onReset: () => Promise<void> }) {\n  return <section><div className="heading"><div><span className="eyebrow">DATA & PRIVASI</span><h2>Milikmu sendiri</h2></div></div><article className="card privacy"><b>◈</b><div><h3>Terenkripsi di perangkat</h3><p>Transaksi tidak dikirim ke Supabase. Server hanya dipakai untuk identitas dan lisensi.</p></div></article><article className="card meta"><p><span>Jumlah transaksi</span><strong>{finance.transactions.length}</strong></p><p><span>Backup Drive</span><strong>Belum dihubungkan</strong></p></article><button className="danger" onClick={() => window.confirm("Hapus seluruh data lokal Atlas?") && void onReset()}>Hapus data lokal</button></section>;\n}',
  'function Privacy({ finance, onReset }: { finance: FinanceState; onReset: () => Promise<void> }) {\n  return (\n    <section>\n      <div className="heading">\n        <div><span className="eyebrow">RUANG AMANMU</span><h2>Data tetap dalam kendalimu</h2></div>\n      </div>\n      <article className="card privacy">\n        <b>◈</b>\n        <div><h3>Terenkripsi di perangkat</h3><p>Transaksi tidak dikirim ke Supabase. Server hanya dipakai untuk identitas dan lisensi.</p></div>\n      </article>\n      <DataPortability />\n      <article className="card meta">\n        <p><span>Jumlah transaksi</span><strong>{finance.transactions.length}</strong></p>\n        <p><span>Penyimpanan utama</span><strong>Perangkat ini</strong></p>\n      </article>\n      <button className="danger" onClick={() => window.confirm("Hapus seluruh data lokal Atlas?") && void onReset()}>Hapus data lokal</button>\n    </section>\n  );\n}',
  "privacy and backup space"
);

replaceOnce(
  'if (!transactions.length) return <div className="empty">Belum ada transaksi.</div>;',
  'if (!transactions.length) return <div className="empty">Belum ada jejak transaksi. Langkah pertamamu bisa dimulai hari ini.</div>;',
  "warm empty state"
);

await writeFile(appPath, source);
console.log("Atlas welcome, navigation, and encrypted backup experience applied.");
