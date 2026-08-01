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
  'import type { Awareness, Entitlement, FinanceState, FinanceTransaction } from "./types";\nimport DataPortability from "./components/DataPortability";\nimport LearningHub from "./components/LearningHub";\nimport WelcomeJourney from "./components/WelcomeJourney";\nimport {\n  AREA_LABELS,\n  AREA_OPTIONS,\n  AWARENESS_OPTIONS,\n  CUSTOM_ACTIVITY_VALUE,\n  CUSTOM_AREA_VALUE,\n  getActivitiesForArea,\n  getActivityLabel,\n  getAwarenessInfo,\n  getAwarenessLabel\n} from "./lib/financeCatalog";\n',
  "component and catalogue imports"
);

replaceOnce(
  'type Screen = "home" | "record" | "history" | "privacy";',
  'type Screen = "home" | "record" | "learn" | "history" | "privacy";',
  "learning screen type"
);

replaceOnce(
  '        <button className="icon" onClick={() => { setFinance(null); setPin(""); }}>◇</button>',
  '        <button className="icon" aria-label="Kunci Atlas" title="Kunci Atlas" onClick={() => { setFinance(null); setPin(""); }}>◇</button>',
  "lock button accessibility"
);

replaceOnce(
  '        {screen === "history" && (\n          <History\n            transactions={finance.transactions}\n            onDelete={(id) => persist({\n              ...finance,\n              transactions: finance.transactions.filter((item) => item.id !== id)\n            })}\n          />\n        )}\n\n        {screen === "privacy" && (',
  '        {screen === "learn" && <LearningHub />}\n\n        {screen === "history" && (\n          <History\n            transactions={finance.transactions}\n            onDelete={(id) => persist({\n              ...finance,\n              transactions: finance.transactions.filter((item) => item.id !== id)\n            })}\n          />\n        )}\n\n        {screen === "privacy" && (',
  "learning screen render"
);

replaceOnce(
  '      <nav>\n        <Nav label="Home" icon="⌂" active={screen === "home"} onClick={() => setScreen("home")} />\n        <Nav label="Catat" icon="＋" active={screen === "record"} onClick={() => setScreen("record")} />\n        <Nav label="Riwayat" icon="≡" active={screen === "history"} onClick={() => setScreen("history")} />\n        <Nav label="Privasi" icon="◈" active={screen === "privacy"} onClick={() => setScreen("privacy")} />\n      </nav>',
  '      <nav>\n        <Nav label="Beranda" icon="⌂" active={screen === "home"} onClick={() => setScreen("home")} />\n        <Nav label="Catat" icon="＋" active={screen === "record"} onClick={() => setScreen("record")} />\n        <Nav label="Belajar" icon="◌" active={screen === "learn"} onClick={() => setScreen("learn")} />\n        <Nav label="Jejak" icon="≋" active={screen === "history"} onClick={() => setScreen("history")} />\n        <Nav label="Ruangku" icon="◇" active={screen === "privacy"} onClick={() => setScreen("privacy")} />\n      </nav>',
  "Indonesian learning navigation"
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
  '<article><span>Impulse</span><strong>{stats.impulsePercent}%</strong></article>',
  '<article><span>Impulsif</span><strong>{stats.impulsePercent}%</strong></article>',
  "Indonesian impulse statistic"
);

replaceOnce(
  'function Record({ onCancel, onSave }: { onCancel: () => void; onSave: (item: FinanceTransaction) => Promise<void> }) {\n  const [type, setType] = useState<"income" | "expense">("expense");\n  const [amount, setAmount] = useState("");\n  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));\n  const [area, setArea] = useState("Rumah Tangga");\n  const [activity, setActivity] = useState("Makan & Minum");\n  const [awareness, setAwareness] = useState<Awareness>("Need");\n  const [note, setNote] = useState("");\n\n  async function submit(event: FormEvent) {\n    event.preventDefault();\n    const value = Number(amount);\n    if (!value) return;\n    const timestamp = new Date().toISOString();\n    await onSave({ id: crypto.randomUUID(), type, amount: value, date, area, activity, awareness, note, createdAt: timestamp, updatedAt: timestamp });\n  }\n\n  return (\n    <section>\n      <div className="heading"><div><span className="eyebrow">CATAT CEPAT</span><h2>Tambah transaksi</h2></div><button onClick={onCancel}>Batal</button></div>\n      <form className="card form" onSubmit={submit}>\n        <div className="segmented"><button type="button" className={type === "expense" ? "active" : ""} onClick={() => setType("expense")}>Pengeluaran</button><button type="button" className={type === "income" ? "active" : ""} onClick={() => setType("income")}>Pemasukan</button></div>\n        <label>Nominal<input type="number" inputMode="numeric" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required /></label>\n        <div className="two"><label>Tanggal<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><label>Kesadaran<select value={awareness} onChange={(e) => setAwareness(e.target.value as Awareness)}>{["Need", "Want", "Impulse", "Fixed", "Future", "Protection", "Payoff"].map((x) => <option key={x}>{x}</option>)}</select></label></div>\n        <div className="two"><label>Area<select value={area} onChange={(e) => setArea(e.target.value)}>{["Diri", "Rumah Tangga", "Anak", "Pasangan", "Keluarga", "Pekerjaan", "Lainnya"].map((x) => <option key={x}>{x}</option>)}</select></label><label>Aktivitas<select value={activity} onChange={(e) => setActivity(e.target.value)}>{["Makan & Minum", "Belanja Rumah", "Transportasi", "Kesehatan", "Pendidikan", "Tagihan", "Hiburan", "Tabungan", "Penghasilan", "Lainnya"].map((x) => <option key={x}>{x}</option>)}</select></label></div>\n        <label>Catatan<input value={note} onChange={(e) => setNote(e.target.value)} maxLength={100} /></label>\n        <button className="primary">Simpan transaksi</button>\n      </form>\n    </section>\n  );\n}',
  'function Record({ onCancel, onSave }: { onCancel: () => void; onSave: (item: FinanceTransaction) => Promise<void> }) {\n  const [type, setType] = useState<"income" | "expense">("expense");\n  const [amount, setAmount] = useState("");\n  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));\n  const [areaChoice, setAreaChoice] = useState("Rumah Tangga");\n  const [customArea, setCustomArea] = useState("");\n  const [activityChoice, setActivityChoice] = useState(getActivitiesForArea("Rumah Tangga")[0]);\n  const [customActivity, setCustomActivity] = useState("");\n  const [awareness, setAwareness] = useState<Awareness>("Need");\n  const [note, setNote] = useState("");\n  const awarenessInfo = getAwarenessInfo(awareness);\n  const activities = getActivitiesForArea(areaChoice);\n\n  function changeArea(nextArea: string) {\n    setAreaChoice(nextArea);\n    setCustomArea("");\n    setActivityChoice(getActivitiesForArea(nextArea)[0]);\n    setCustomActivity("");\n  }\n\n  async function submit(event: FormEvent) {\n    event.preventDefault();\n    const value = Number(amount);\n    const area = areaChoice === CUSTOM_AREA_VALUE ? customArea.trim() : areaChoice;\n    const activity = activityChoice === CUSTOM_ACTIVITY_VALUE ? customActivity.trim() : activityChoice;\n    if (!value || !area || !activity) return;\n    const timestamp = new Date().toISOString();\n    await onSave({ id: crypto.randomUUID(), type, amount: value, date, area, activity, awareness, note, createdAt: timestamp, updatedAt: timestamp });\n  }\n\n  return (\n    <section className="recordExperience">\n      <div className="heading"><div><span className="eyebrow">CATAT DENGAN SADAR</span><h2>Transaksi ini bercerita tentang apa?</h2></div><button onClick={onCancel}>Batal</button></div>\n      <p className="recordIntro">Bukan hanya nominalnya. Area, aktivitas, dan alasan di balik transaksi akan membantu Atlas membaca pola keuanganmu.</p>\n      <form className="card form" onSubmit={submit}>\n        <div className="segmented"><button type="button" className={type === "expense" ? "active" : ""} onClick={() => setType("expense")}>Pengeluaran</button><button type="button" className={type === "income" ? "active" : ""} onClick={() => setType("income")}>Pemasukan</button></div>\n        <label>Nominal<input type="number" inputMode="numeric" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Contoh: 50.000" required /></label>\n        <div className="two">\n          <label>Tanggal<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>\n          <label>Makna transaksi\n            <select value={awareness} onChange={(e) => setAwareness(e.target.value as Awareness)}>\n              {AWARENESS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}\n            </select>\n          </label>\n        </div>\n        <div className="awarenessGuide" role="note">\n          <strong>{awarenessInfo.label}</strong>\n          <span>{awarenessInfo.description}</span>\n          <small>{awarenessInfo.example}</small>\n        </div>\n        <div className="two adaptiveFields">\n          <label>Area kehidupan\n            <select value={areaChoice} onChange={(e) => changeArea(e.target.value)}>\n              {AREA_OPTIONS.map((area) => <option key={area} value={area}>{AREA_LABELS[area]}</option>)}\n            </select>\n          </label>\n          <label>Aktivitas\n            <select value={activityChoice} onChange={(e) => { setActivityChoice(e.target.value); setCustomActivity(""); }}>\n              {activities.map((activity) => <option key={activity} value={activity}>{getActivityLabel(activity)}</option>)}\n            </select>\n          </label>\n        </div>\n        {areaChoice === CUSTOM_AREA_VALUE && <label>Nama area lainnya<input value={customArea} onChange={(e) => setCustomArea(e.target.value)} placeholder="Contoh: Komunitas" required /></label>}\n        {activityChoice === CUSTOM_ACTIVITY_VALUE && <label>Nama aktivitas lainnya<input value={customActivity} onChange={(e) => setCustomActivity(e.target.value)} placeholder="Tulis aktivitas yang paling sesuai" required /></label>}\n        <label>Catatan singkat<input value={note} onChange={(e) => setNote(e.target.value)} maxLength={100} placeholder="Opsional: apa yang ingin kamu ingat dari transaksi ini?" /></label>\n        <button className="primary">Simpan transaksi</button>\n      </form>\n    </section>\n  );\n}',
  "adaptive Indonesian transaction form"
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

replaceOnce(
  '<h3>{item.note || item.activity}<span>{item.awareness}</span></h3>',
  '<h3>{item.note || item.activity}<span>{getAwarenessLabel(item.awareness)}</span></h3>',
  "Indonesian transaction awareness label"
);

await writeFile(appPath, source);
console.log("Atlas Indonesian adaptive experience and learning hub applied.");
