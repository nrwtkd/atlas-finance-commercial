import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { clearVault } from "./lib/localDb";
import { loadFinanceState, saveFinanceState, vaultExists } from "./lib/cryptoVault";
import {
  getEntitlement,
  isSupabaseConfigured,
  sendMagicLink,
  signInWithGoogle,
  supabase
} from "./lib/supabase";
import type { Awareness, Entitlement, FinanceState, FinanceTransaction } from "./types";

type Screen = "home" | "record" | "history" | "privacy";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

const emptyState = (name: string): FinanceState => ({
  schemaVersion: 1,
  profileName: name,
  transactions: [],
  lastUpdatedAt: new Date().toISOString()
});

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(
    isSupabaseConfigured
      ? null
      : { status: "active", productCode: "atlas-finance-preview", source: "preview" }
  );
  const [hasVault, setHasVault] = useState(false);
  const [vaultReady, setVaultReady] = useState(false);
  const [pin, setPin] = useState("");
  const [finance, setFinance] = useState<FinanceState | null>(null);
  const [screen, setScreen] = useState<Screen>("home");
  const [message, setMessage] = useState("");

  useEffect(() => {
    vaultExists().then(setHasVault).finally(() => setVaultReady(true));
  }, []);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !session?.user.id) return;
    getEntitlement(session.user.id).then(setEntitlement);
  }, [session]);

  const stats = useMemo(() => {
    const now = new Date();
    const month = (finance?.transactions ?? []).filter((item) => {
      const date = new Date(`${item.date}T00:00:00`);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    const income = month.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
    const expense = month.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
    const impulse = month
      .filter((item) => item.type === "expense" && item.awareness === "Impulse")
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      count: month.length,
      income,
      expense,
      balance: income - expense,
      impulsePercent: expense ? Math.round((impulse / expense) * 100) : 0
    };
  }, [finance]);

  async function persist(next: FinanceState) {
    if (!pin) throw new Error("PIN lokal belum aktif.");
    const updated = { ...next, lastUpdatedAt: new Date().toISOString() };
    await saveFinanceState(pin, updated);
    setFinance(updated);
    setHasVault(true);
  }

  if (!authReady || !vaultReady) {
    return <Centered title="Menyiapkan Atlas…" text="Ruang privatmu sedang disiapkan." />;
  }

  if (isSupabaseConfigured && !session) {
    return <Login message={message} setMessage={setMessage} />;
  }

  if (isSupabaseConfigured && entitlement?.status !== "active") {
    return (
      <Centered
        title="Akses belum aktif"
        text={
          entitlement?.status === "unknown"
            ? "Atlas belum dapat memeriksa lisensimu."
            : "Akun ini belum memiliki lisensi Atlas Finance aktif."
        }
        action={<button className="secondary" onClick={() => supabase?.auth.signOut()}>Keluar</button>}
      />
    );
  }

  if (!finance) {
    return (
      <VaultGate
        hasVault={hasVault}
        message={message}
        setMessage={setMessage}
        onCreate={async (name, newPin) => {
          const next = emptyState(name);
          await saveFinanceState(newPin, next);
          setPin(newPin);
          setFinance(next);
          setHasVault(true);
        }}
        onUnlock={async (enteredPin) => {
          const next = await loadFinanceState(enteredPin);
          if (!next) throw new Error("Data lokal belum tersedia.");
          setPin(enteredPin);
          setFinance(next);
        }}
      />
    );
  }

  return (
    <div className="app">
      {!isSupabaseConfigured && (
        <div className="preview">Mode preview pemilik — Supabase belum dihubungkan.</div>
      )}

      <header className="topbar">
        <div><span className="eyebrow">ATLAS FINANCE</span><h1>Halo, {finance.profileName}</h1></div>
        <button className="icon" onClick={() => { setFinance(null); setPin(""); }}>◇</button>
      </header>

      <main>
        {screen === "home" && (
          <Home finance={finance} stats={stats} onRecord={() => setScreen("record")} />
        )}

        {screen === "record" && (
          <Record
            onCancel={() => setScreen("home")}
            onSave={async (transaction) => {
              await persist({ ...finance, transactions: [transaction, ...finance.transactions] });
              setMessage("Transaksi tersimpan secara lokal.");
              setScreen("home");
            }}
          />
        )}

        {screen === "history" && (
          <History
            transactions={finance.transactions}
            onDelete={(id) => persist({
              ...finance,
              transactions: finance.transactions.filter((item) => item.id !== id)
            })}
          />
        )}

        {screen === "privacy" && (
          <Privacy
            finance={finance}
            onReset={async () => {
              await clearVault();
              setFinance(null);
              setPin("");
              setHasVault(false);
            }}
          />
        )}
      </main>

      {message && <button className="toast" onClick={() => setMessage("")}>{message}</button>}

      <nav>
        <Nav label="Home" icon="⌂" active={screen === "home"} onClick={() => setScreen("home")} />
        <Nav label="Catat" icon="＋" active={screen === "record"} onClick={() => setScreen("record")} />
        <Nav label="Riwayat" icon="≡" active={screen === "history"} onClick={() => setScreen("history")} />
        <Nav label="Privasi" icon="◈" active={screen === "privacy"} onClick={() => setScreen("privacy")} />
      </nav>
    </div>
  );
}

function Login({ message, setMessage }: { message: string; setMessage: (value: string) => void }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const messageIsSuccess = message.toLowerCase().includes("dikirim");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await sendMagicLink(email);
      setMessage("Tautan masuk sudah dikirim. Silakan cek emailmu untuk melanjutkan ke Atlas.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tautan masuk gagal dikirim.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="authPage loginPage">
      <div className="loginGlow loginGlowOne" aria-hidden="true" />
      <div className="loginGlow loginGlowTwo" aria-hidden="true" />

      <section className="authHero loginHero">
        <div className="brandLockup">
          <div className="mark loginMark">A</div>
          <div>
            <span className="eyebrow">ATLAS FINANCE</span>
            <span className="brandByline">by ALALA</span>
          </div>
        </div>

        <h1>
          <span>Mulai dari kondisi yang ada.</span>
          <em>Bertumbuh menuju hidup yang kamu inginkan.</em>
        </h1>

        <p className="heroLead">
          Lihat kondisi keuanganmu dengan lebih jernih, bangun kebiasaan yang lebih baik,
          dan jadikan setiap progres sebagai langkah menuju hidup yang lebih tenang dan bebas menentukan pilihan.
        </p>

        <div className="privacyPromise">
          <span className="promiseIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img">
              <path d="M12 3.2 19 6v5.4c0 4.5-2.7 7.8-7 9.6-4.3-1.8-7-5.1-7-9.6V6l7-2.8Z" />
              <path d="m8.8 12 2.1 2.1 4.4-4.6" />
            </svg>
          </span>
          <span>
            <strong>Keuanganmu, tetap milikmu.</strong>
            <small>Data finansial tersimpan di perangkatmu.</small>
          </span>
        </div>
      </section>

      <section className="card authCard loginCard">
        <div className="cardIntro">
          <span className="journeyIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img">
              <path d="M5 19c4-1 6-3 7-7 1-3 3-5 7-6" />
              <path d="m15.5 4.5 3.5 1.5-1.5 3.5" />
              <circle cx="5" cy="19" r="2" />
            </svg>
          </span>
          <div>
            <h2>Perjalananmu dimulai di sini.</h2>
            <p>Masuk menggunakan akun atau email yang kamu gunakan saat membeli Atlas.</p>
          </div>
        </div>

        <button
          className="primary googleButton"
          type="button"
          disabled={busy}
          onClick={() => signInWithGoogle().catch((error) => setMessage(error.message))}
        >
          <span className="googleMark" aria-hidden="true">G</span>
          <span>{busy ? "Menyiapkan…" : "Lanjutkan dengan Google"}</span>
        </button>

        <div className="divider"><span>atau</span></div>

        <form className="loginForm" onSubmit={submit}>
          <label>
            Email pembelian
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@email.com"
              autoComplete="email"
              required
            />
          </label>
          <button className="secondary wide loginSubmit" disabled={busy}>
            {busy ? "Mengirim tautan…" : "Kirim tautan masuk"}
          </button>
          <p className="loginHelper">
            Tidak perlu kata sandi. Kami akan mengirimkan tautan masuk sekali pakai ke emailmu.
          </p>
        </form>

        {message && (
          <p className={`formMessage loginMessage ${messageIsSuccess ? "success" : "error"}`} role="status">
            {message}
          </p>
        )}
      </section>

      <p className="authClosing">
        <span aria-hidden="true">✦</span>
        Kamu tidak perlu menunggu keuanganmu sempurna untuk mulai menatanya.
      </p>
    </div>
  );
}

function VaultGate({
  hasVault,
  message,
  setMessage,
  onCreate,
  onUnlock
}: {
  hasVault: boolean;
  message: string;
  setMessage: (value: string) => void;
  onCreate: (name: string, pin: string) => Promise<void>;
  onUnlock: (pin: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [localPin, setLocalPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!hasVault && localPin !== confirmPin) return;
    setBusy(true);
    setMessage("");
    try {
      if (hasVault) await onUnlock(localPin);
      else await onCreate(name, localPin);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ruang privat gagal dibuka.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="authPage">
      <section className="authHero">
        <div className="mark">A</div><span className="eyebrow">RUANG PRIVAT</span>
        <h1>{hasVault ? "Buka data di perangkat ini." : "Buat kunci lokalmu."}</h1>
        <p>PIN mengenkripsi data sebelum masuk ke penyimpanan perangkat.</p>
      </section>
      <form className="card authCard" onSubmit={submit}>
        {!hasVault && <label>Nama panggilan<input value={name} onChange={(e) => setName(e.target.value)} required /></label>}
        <label>PIN 6 digit<input type="password" inputMode="numeric" pattern="[0-9]{6}" value={localPin} onChange={(e) => setLocalPin(e.target.value.replace(/\D/g, "").slice(0, 6))} required /></label>
        {!hasVault && <label>Ulangi PIN<input type="password" inputMode="numeric" pattern="[0-9]{6}" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))} required /></label>}
        {!hasVault && confirmPin && localPin !== confirmPin && <p className="formMessage">PIN belum sama.</p>}
        <button className="primary" disabled={busy || (!hasVault && localPin !== confirmPin)}>{busy ? "Memproses…" : hasVault ? "Buka Atlas" : "Buat ruang privat"}</button>
        {message && <p className="formMessage">{message}</p>}
        <p className="fine">PIN tidak disimpan oleh Atlas dan tidak dapat dipulihkan oleh tim Atlas.</p>
      </form>
    </div>
  );
}

function Home({ finance, stats, onRecord }: {
  finance: FinanceState;
  stats: { count: number; income: number; expense: number; balance: number; impulsePercent: number };
  onRecord: () => void;
}) {
  const focus = stats.count === 0
    ? ["Mulai dari satu transaksi.", "Catat pemasukan atau pengeluaran pertama agar Atlas mulai membaca polamu."]
    : stats.balance < 0
      ? ["Arus kas bulan ini masih minus.", `Pengeluaran lebih besar ${rupiah.format(Math.abs(stats.balance))} daripada pemasukan.`]
      : stats.impulsePercent >= 20
        ? ["Belanja impulsif mulai mengambil ruang.", `${stats.impulsePercent}% pengeluaran bulan ini tercatat sebagai Impulse.`]
        : ["Masih ada ruang untuk diarahkan.", `Arus kas sementara positif ${rupiah.format(stats.balance)}.`];

  return (
    <>
      <section className="balance"><span>Arus kas bulan ini</span><strong>{rupiah.format(stats.balance)}</strong><div><p><small>Pemasukan</small>{rupiah.format(stats.income)}</p><p><small>Pengeluaran</small>{rupiah.format(stats.expense)}</p></div></section>
      <section className="card focus"><div><span className="eyebrow">FOKUS HARI INI</span><h2>{focus[0]}</h2><p>{focus[1]}</p></div><b>✦</b></section>
      <div className="heading"><h2>Ringkasan</h2><button onClick={onRecord}>Catat transaksi</button></div>
      <section className="stats"><article><span>Transaksi</span><strong>{stats.count}</strong></article><article><span>Impulse</span><strong>{stats.impulsePercent}%</strong></article><article><span>Disimpan lokal</span><strong>100%</strong></article><article><span>Diperbarui</span><strong>{new Date(finance.lastUpdatedAt).toLocaleDateString("id-ID")}</strong></article></section>
      <div className="heading"><h2>Transaksi terbaru</h2></div>
      <TransactionList transactions={finance.transactions.slice(0, 5)} />
    </>
  );
}

function Record({ onCancel, onSave }: { onCancel: () => void; onSave: (item: FinanceTransaction) => Promise<void> }) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [area, setArea] = useState("Rumah Tangga");
  const [activity, setActivity] = useState("Makan & Minum");
  const [awareness, setAwareness] = useState<Awareness>("Need");
  const [note, setNote] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!value) return;
    const timestamp = new Date().toISOString();
    await onSave({ id: crypto.randomUUID(), type, amount: value, date, area, activity, awareness, note, createdAt: timestamp, updatedAt: timestamp });
  }

  return (
    <section>
      <div className="heading"><div><span className="eyebrow">CATAT CEPAT</span><h2>Tambah transaksi</h2></div><button onClick={onCancel}>Batal</button></div>
      <form className="card form" onSubmit={submit}>
        <div className="segmented"><button type="button" className={type === "expense" ? "active" : ""} onClick={() => setType("expense")}>Pengeluaran</button><button type="button" className={type === "income" ? "active" : ""} onClick={() => setType("income")}>Pemasukan</button></div>
        <label>Nominal<input type="number" inputMode="numeric" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required /></label>
        <div className="two"><label>Tanggal<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><label>Kesadaran<select value={awareness} onChange={(e) => setAwareness(e.target.value as Awareness)}>{["Need", "Want", "Impulse", "Fixed", "Future", "Protection", "Payoff"].map((x) => <option key={x}>{x}</option>)}</select></label></div>
        <div className="two"><label>Area<select value={area} onChange={(e) => setArea(e.target.value)}>{["Diri", "Rumah Tangga", "Anak", "Pasangan", "Keluarga", "Pekerjaan", "Lainnya"].map((x) => <option key={x}>{x}</option>)}</select></label><label>Aktivitas<select value={activity} onChange={(e) => setActivity(e.target.value)}>{["Makan & Minum", "Belanja Rumah", "Transportasi", "Kesehatan", "Pendidikan", "Tagihan", "Hiburan", "Tabungan", "Penghasilan", "Lainnya"].map((x) => <option key={x}>{x}</option>)}</select></label></div>
        <label>Catatan<input value={note} onChange={(e) => setNote(e.target.value)} maxLength={100} /></label>
        <button className="primary">Simpan transaksi</button>
      </form>
    </section>
  );
}

function History({ transactions, onDelete }: { transactions: FinanceTransaction[]; onDelete: (id: string) => Promise<void> }) {
  const [query, setQuery] = useState("");
  const filtered = transactions.filter((item) => `${item.note} ${item.area} ${item.activity} ${item.awareness}`.toLowerCase().includes(query.toLowerCase()));
  return <section><div className="heading"><div><span className="eyebrow">RIWAYAT</span><h2>Semua transaksi</h2></div></div><input className="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari transaksi" /><TransactionList transactions={filtered} onDelete={onDelete} /></section>;
}

function Privacy({ finance, onReset }: { finance: FinanceState; onReset: () => Promise<void> }) {
  return <section><div className="heading"><div><span className="eyebrow">DATA & PRIVASI</span><h2>Milikmu sendiri</h2></div></div><article className="card privacy"><b>◈</b><div><h3>Terenkripsi di perangkat</h3><p>Transaksi tidak dikirim ke Supabase. Server hanya dipakai untuk identitas dan lisensi.</p></div></article><article className="card meta"><p><span>Jumlah transaksi</span><strong>{finance.transactions.length}</strong></p><p><span>Backup Drive</span><strong>Belum dihubungkan</strong></p></article><button className="danger" onClick={() => window.confirm("Hapus seluruh data lokal Atlas?") && void onReset()}>Hapus data lokal</button></section>;
}

function TransactionList({ transactions, onDelete }: { transactions: FinanceTransaction[]; onDelete?: (id: string) => Promise<void> }) {
  if (!transactions.length) return <div className="empty">Belum ada transaksi.</div>;
  return <div className="list">{transactions.map((item) => <article key={item.id}><div><h3>{item.note || item.activity}<span>{item.awareness}</span></h3><p>{new Date(`${item.date}T00:00:00`).toLocaleDateString("id-ID")} · {item.area}</p></div><div className="value"><strong className={item.type}>{item.type === "expense" ? "−" : "+"}{rupiah.format(item.amount)}</strong>{onDelete && <button onClick={() => void onDelete(item.id)}>Hapus</button>}</div></article>)}</div>;
}

function Nav({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) {
  return <button className={active ? "active" : ""} onClick={onClick}><span>{icon}</span><small>{label}</small></button>;
}

function Centered({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return <div className="center"><div className="mark">A</div><h1>{title}</h1><p>{text}</p>{action}</div>;
}

export default App;
