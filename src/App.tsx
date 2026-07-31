import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import WelcomeJourney from "./components/WelcomeJourney";
import DataPortability from "./components/DataPortability";
import { clearVault } from "./lib/localDb";
import { loadFinanceState, saveFinanceState, vaultExists } from "./lib/cryptoVault";
import {
  getEntitlement,
  isSupabaseConfigured,
  sendMagicLink,
  signInWithGoogle,
  supabase
} from "./lib/supabase";
import {
  awarenessOptions,
  budgetBuckets,
  budgetScenarios,
  expenseCategories,
  getActivities,
  getScenario,
  incomeCategories,
  inferBudgetBucket
} from "./domain/financeCatalog";
import type {
  Awareness,
  BudgetAllocation,
  BudgetBucket,
  BudgetPlan,
  BudgetScenario,
  Entitlement,
  FinanceState,
  FinanceTransaction
} from "./types";
import "./atlas-v2.css";

type Screen = "home" | "record" | "budget" | "learn" | "history" | "space";

type LegacyTransaction = Partial<FinanceTransaction> & {
  area?: string;
  activity?: string;
};

type LegacyFinanceState = Partial<FinanceState> & {
  profileName?: string;
  transactions?: LegacyTransaction[];
};

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

const monthKey = () => new Date().toISOString().slice(0, 7);

function emptyState(name: string): FinanceState {
  return {
    schemaVersion: 2,
    profileName: name,
    householdMembers: [name || "Saya"],
    customCategories: {},
    budgetPlans: [],
    learningProgress: [],
    transactions: [],
    lastUpdatedAt: new Date().toISOString()
  };
}

function normalizeFinanceState(input: LegacyFinanceState): FinanceState {
  const profileName = input.profileName?.trim() || "Saya";
  const members = Array.from(new Set((input.householdMembers?.length ? input.householdMembers : [profileName])
    .map((item) => item.trim())
    .filter(Boolean)));

  const transactions = (input.transactions ?? []).map((item): FinanceTransaction => {
    const category = item.category || item.area || "Kategori lainnya";
    const awareness = item.awareness ?? "Need";
    return {
      id: item.id || crypto.randomUUID(),
      type: item.type ?? "expense",
      amount: Number(item.amount) || 0,
      date: item.date || new Date().toISOString().slice(0, 10),
      beneficiaries: item.beneficiaries?.length ? item.beneficiaries : [profileName],
      category,
      activity: item.activity || "Aktivitas lainnya",
      awareness,
      budgetBucket: item.type === "expense"
        ? item.budgetBucket ?? inferBudgetBucket(category, awareness)
        : undefined,
      note: item.note || "",
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
      area: item.area
    };
  });

  return {
    schemaVersion: 2,
    profileName,
    householdMembers: members.length ? members : [profileName],
    customCategories: input.customCategories ?? {},
    budgetPlans: input.budgetPlans ?? [],
    learningProgress: input.learningProgress ?? [],
    transactions,
    lastUpdatedAt: input.lastUpdatedAt || new Date().toISOString()
  };
}

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

  const monthlyTransactions = useMemo(() => {
    const now = new Date();
    return (finance?.transactions ?? []).filter((item) => {
      const date = new Date(`${item.date}T00:00:00`);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
  }, [finance]);

  const stats = useMemo(() => {
    const income = monthlyTransactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0);
    const expense = monthlyTransactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);
    const impulse = monthlyTransactions
      .filter((item) => item.type === "expense" && item.awareness === "Impulse")
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      count: monthlyTransactions.length,
      income,
      expense,
      balance: income - expense,
      impulsePercent: expense ? Math.round((impulse / expense) * 100) : 0
    };
  }, [monthlyTransactions]);

  async function persist(next: FinanceState) {
    if (!pin) throw new Error("PIN lokal belum aktif.");
    const updated = { ...next, schemaVersion: 2 as const, lastUpdatedAt: new Date().toISOString() };
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
          const raw = await loadFinanceState(enteredPin);
          if (!raw) throw new Error("Data lokal belum tersedia.");
          const next = normalizeFinanceState(raw as unknown as LegacyFinanceState);
          setPin(enteredPin);
          setFinance(next);
        }}
      />
    );
  }

  const currentPlan = finance.budgetPlans.find((item) => item.month === monthKey());

  return (
    <div className="app atlasApp">
      {!isSupabaseConfigured && (
        <div className="preview">Mode pratinjau pemilik — Supabase belum dihubungkan.</div>
      )}

      <header className="atlasTopbar">
        <div>
          <span className="eyebrow">ATLAS FINANCE</span>
          <h1>Halo, {finance.profileName}</h1>
          <p>Pelan-pelan kita buat uangmu lebih terarah.</p>
        </div>
        <button
          className="atlasIconButton"
          type="button"
          aria-label="Kunci Atlas"
          title="Kunci Atlas"
          onClick={() => { setFinance(null); setPin(""); }}
        >
          ◇
        </button>
      </header>

      <main className="atlasMain">
        {screen === "home" && (
          <Home
            finance={finance}
            stats={stats}
            monthlyTransactions={monthlyTransactions}
            currentPlan={currentPlan}
            onRecord={() => setScreen("record")}
            onBudget={() => setScreen("budget")}
            onHistory={() => setScreen("history")}
          />
        )}

        {screen === "record" && (
          <Record
            members={finance.householdMembers}
            customCategories={finance.customCategories}
            onCancel={() => setScreen("home")}
            onSave={async ({ transaction, newMember, customCategory, customActivity }) => {
              const nextMembers = newMember && !finance.householdMembers.includes(newMember)
                ? [...finance.householdMembers, newMember]
                : finance.householdMembers;
              const nextCustom = { ...finance.customCategories };
              if (customCategory) {
                nextCustom[customCategory] = Array.from(new Set([
                  ...(nextCustom[customCategory] ?? []),
                  ...(customActivity ? [customActivity] : [])
                ]));
              } else if (customActivity && transaction.category) {
                nextCustom[transaction.category] = Array.from(new Set([
                  ...(nextCustom[transaction.category] ?? []),
                  customActivity
                ]));
              }

              const next = {
                ...finance,
                householdMembers: nextMembers,
                customCategories: nextCustom,
                transactions: [transaction, ...finance.transactions]
              };
              await persist(next);
              setMessage(
                transaction.type === "income" && !currentPlan
                  ? "Pemasukan tercatat. Sekarang Atlas bantu menyusun rencana pembagiannya."
                  : "Transaksi tersimpan di perangkatmu."
              );
              setScreen(transaction.type === "income" && !currentPlan ? "budget" : "home");
            }}
          />
        )}

        {screen === "budget" && (
          <BudgetPlanner
            plan={currentPlan}
            actualIncome={stats.income}
            transactions={monthlyTransactions}
            onSave={async (plan) => {
              await persist({
                ...finance,
                budgetPlans: [plan, ...finance.budgetPlans.filter((item) => item.month !== plan.month)]
              });
              setMessage("Rencana anggaran bulan ini sudah disimpan.");
              setScreen("home");
            }}
          />
        )}

        {screen === "learn" && (
          <LearningCenter
            progress={finance.learningProgress}
            onToggle={async (moduleId) => {
              const completed = finance.learningProgress.includes(moduleId);
              await persist({
                ...finance,
                learningProgress: completed
                  ? finance.learningProgress.filter((item) => item !== moduleId)
                  : [...finance.learningProgress, moduleId]
              });
            }}
          />
        )}

        {screen === "history" && (
          <History
            transactions={finance.transactions}
            onBack={() => setScreen("home")}
            onDelete={(id) => persist({
              ...finance,
              transactions: finance.transactions.filter((item) => item.id !== id)
            })}
          />
        )}

        {screen === "space" && (
          <MySpace
            finance={finance}
            onUpdateMembers={(members) => persist({ ...finance, householdMembers: members })}
            onLock={() => { setFinance(null); setPin(""); }}
            onSignOut={() => supabase?.auth.signOut()}
            onReset={async () => {
              await clearVault();
              setFinance(null);
              setPin("");
              setHasVault(false);
            }}
          />
        )}
      </main>

      {message && (
        <button className="toast atlasToast" type="button" onClick={() => setMessage("")}>{message}</button>
      )}

      <nav className="atlasNav" aria-label="Navigasi utama">
        <Nav label="Beranda" icon="⌂" active={screen === "home" || screen === "history"} onClick={() => setScreen("home")} />
        <Nav label="Catat" icon="＋" active={screen === "record"} onClick={() => setScreen("record")} />
        <Nav label="Rencana" icon="◌" active={screen === "budget"} onClick={() => setScreen("budget")} />
        <Nav label="Belajar" icon="✦" active={screen === "learn"} onClick={() => setScreen("learn")} />
        <Nav label="Ruangku" icon="◇" active={screen === "space"} onClick={() => setScreen("space")} />
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

function Home({
  finance,
  stats,
  monthlyTransactions,
  currentPlan,
  onRecord,
  onBudget,
  onHistory
}: {
  finance: FinanceState;
  stats: { count: number; income: number; expense: number; balance: number; impulsePercent: number };
  monthlyTransactions: FinanceTransaction[];
  currentPlan?: BudgetPlan;
  onRecord: () => void;
  onBudget: () => void;
  onHistory: () => void;
}) {
  const focus = stats.count === 0
    ? ["Mulai dari satu transaksi.", "Catat pemasukan atau pengeluaran pertama agar Atlas mulai membaca polamu."]
    : !currentPlan
      ? ["Uangmu sudah mulai bercerita.", "Susun rencana anggaran agar setiap rupiah punya arah sebelum habis digunakan."]
      : stats.balance < 0
        ? ["Arus kas bulan ini perlu ruang bernapas.", `Pengeluaran lebih besar ${rupiah.format(Math.abs(stats.balance))} daripada pemasukan.`]
        : stats.impulsePercent >= 20
          ? ["Belanja spontan mulai mengambil ruang.", `${stats.impulsePercent}% pengeluaran bulan ini tercatat sebagai impulsif.`]
          : ["Kamu sedang membangun arah.", `Arus kas sementara positif ${rupiah.format(stats.balance)}.`];

  return (
    <>
      <WelcomeJourney name={finance.profileName} transactionCount={finance.transactions.length} onRecord={onRecord} />

      <section className="balance atlasBalance">
        <div className="balanceHeading">
          <span>Arus kas bulan ini</span>
          <small>{new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</small>
        </div>
        <strong>{rupiah.format(stats.balance)}</strong>
        <div>
          <p><small>Pemasukan</small>{rupiah.format(stats.income)}</p>
          <p><small>Pengeluaran</small>{rupiah.format(stats.expense)}</p>
        </div>
      </section>

      <section className="card focus atlasFocus">
        <div>
          <span className="eyebrow">LANGKAH HARI INI</span>
          <h2>{focus[0]}</h2>
          <p>{focus[1]}</p>
          {!currentPlan && stats.income > 0 && <button className="textAction" type="button" onClick={onBudget}>Susun rencana anggaran →</button>}
        </div>
        <b>✦</b>
      </section>

      <BudgetSnapshot plan={currentPlan} transactions={monthlyTransactions} onBudget={onBudget} />

      <div className="heading atlasSectionHeading">
        <div><span className="eyebrow">JEJAK TERBARU</span><h2>Yang baru kamu catat</h2></div>
        <button type="button" onClick={onHistory}>Lihat semua</button>
      </div>
      <TransactionList transactions={finance.transactions.slice(0, 5)} />
    </>
  );
}

function BudgetSnapshot({ plan, transactions, onBudget }: {
  plan?: BudgetPlan;
  transactions: FinanceTransaction[];
  onBudget: () => void;
}) {
  if (!plan) {
    return (
      <section className="card emptyBudgetCard">
        <div><span className="eyebrow">RENCANA BULAN INI</span><h2>Belum ada pembagian anggaran.</h2><p>Masukkan pemasukan, lalu Atlas memberi rekomendasi awal yang tetap bisa kamu ubah.</p></div>
        <button className="secondary" type="button" onClick={onBudget}>Buat rencana</button>
      </section>
    );
  }

  const spent = transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const remaining = Math.max(0, plan.monthlyIncome - spent);

  return (
    <section className="card budgetSnapshot">
      <div className="budgetSnapshotTop">
        <div><span className="eyebrow">RENCANA BULAN INI</span><h2>{rupiah.format(plan.monthlyIncome)}</h2></div>
        <button type="button" onClick={onBudget}>Atur ulang</button>
      </div>
      <div className="budgetSnapshotNumbers">
        <p><span>Sudah digunakan</span><strong>{rupiah.format(spent)}</strong></p>
        <p><span>Masih dapat diarahkan</span><strong>{rupiah.format(remaining)}</strong></p>
      </div>
      <div className="budgetMiniGrid">
        {plan.allocations.map((allocation) => {
          const limit = plan.monthlyIncome * allocation.percent / 100;
          const actual = transactions
            .filter((item) => item.type === "expense" && item.budgetBucket === allocation.bucket)
            .reduce((sum, item) => sum + item.amount, 0);
          const percent = limit ? Math.min(100, Math.round(actual / limit * 100)) : 0;
          return (
            <article key={allocation.bucket}>
              <div><span>{allocation.bucket}</span><strong>{allocation.percent}%</strong></div>
              <div className="progressTrack"><i style={{ width: `${percent}%` }} /></div>
              <small>{rupiah.format(actual)} dari {rupiah.format(limit)}</small>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Record({
  members,
  customCategories,
  onCancel,
  onSave
}: {
  members: string[];
  customCategories: Record<string, string[]>;
  onCancel: () => void;
  onSave: (result: {
    transaction: FinanceTransaction;
    newMember?: string;
    customCategory?: string;
    customActivity?: string;
  }) => Promise<void>;
}) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [beneficiaries, setBeneficiaries] = useState<string[]>(members.length ? [members[0]] : []);
  const [newMember, setNewMember] = useState("");
  const [category, setCategory] = useState(expenseCategories[0].name);
  const [customCategory, setCustomCategory] = useState("");
  const [activity, setActivity] = useState(expenseCategories[0].activities[0]);
  const [customActivity, setCustomActivity] = useState("");
  const [awareness, setAwareness] = useState<Awareness>("Need");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const categoryList = [...expenseCategories.map((item) => item.name), ...Object.keys(customCategories)];
  const selectedCategory = category === "Kategori lainnya…" ? customCategory.trim() : category;
  const activities = type === "expense" ? getActivities(selectedCategory, customCategories) : [];
  const selectedActivity = activity === "Aktivitas lainnya…" ? customActivity.trim() : activity;
  const awarenessInfo = awarenessOptions.find((item) => item.value === awareness)!;
  const bucket = type === "expense" ? inferBudgetBucket(selectedCategory, awareness) : undefined;

  function changeCategory(value: string) {
    setCategory(value);
    setCustomActivity("");
    if (value === "Kategori lainnya…") {
      setActivity("Aktivitas lainnya…");
      return;
    }
    const nextActivities = getActivities(value, customCategories);
    setActivity(nextActivities[0] ?? "Aktivitas lainnya…");
  }

  function toggleBeneficiary(value: string) {
    setBeneficiaries((current) => current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]);
  }

  function addMember() {
    const value = newMember.trim();
    if (!value) return;
    setBeneficiaries((current) => Array.from(new Set([...current, value])));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!value || !beneficiaries.length || !selectedCategory) return;
    if (type === "expense" && !selectedActivity) return;

    setBusy(true);
    try {
      const timestamp = new Date().toISOString();
      await onSave({
        transaction: {
          id: crypto.randomUUID(),
          type,
          amount: value,
          date,
          beneficiaries,
          category: selectedCategory,
          activity: type === "income" ? selectedCategory : selectedActivity,
          awareness: type === "income" ? "Fixed" : awareness,
          budgetBucket: bucket,
          note,
          createdAt: timestamp,
          updatedAt: timestamp
        },
        newMember: newMember.trim() || undefined,
        customCategory: category === "Kategori lainnya…" ? customCategory.trim() || undefined : undefined,
        customActivity: activity === "Aktivitas lainnya…" ? customActivity.trim() || undefined : undefined
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="recordPage">
      <div className="heading atlasSectionHeading">
        <div><span className="eyebrow">CATAT DENGAN SADAR</span><h2>Transaksi ini bercerita tentang apa?</h2><p>Nominal memberi angka. Konteks membantu Atlas memahami polamu.</p></div>
        <button type="button" onClick={onCancel}>Batal</button>
      </div>

      <form className="card form atlasForm" onSubmit={submit}>
        <div className="segmented">
          <button type="button" className={type === "expense" ? "active" : ""} onClick={() => { setType("expense"); changeCategory(expenseCategories[0].name); }}>Pengeluaran</button>
          <button type="button" className={type === "income" ? "active" : ""} onClick={() => { setType("income"); setCategory(incomeCategories[0]); }}>Pemasukan</button>
        </div>

        <label>Nominal
          <input type="number" inputMode="numeric" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Contoh: 250000" required />
        </label>

        <label>Tanggal
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>

        <fieldset className="beneficiaryField">
          <legend>{type === "income" ? "Pemasukan ini digunakan untuk siapa?" : "Pengeluaran ini untuk siapa?"}</legend>
          <p>Kamu boleh memilih lebih dari satu orang. Kesehatan keluarga, misalnya, bisa dicatat untuk beberapa anggota sekaligus.</p>
          <div className="chipGroup">
            {members.map((member) => (
              <button
                key={member}
                className={beneficiaries.includes(member) ? "chip active" : "chip"}
                type="button"
                onClick={() => toggleBeneficiary(member)}
              >
                {beneficiaries.includes(member) ? "✓ " : "+ "}{member}
              </button>
            ))}
          </div>
          <div className="inlineAdd">
            <input value={newMember} onChange={(e) => setNewMember(e.target.value)} placeholder="Tambah nama pasangan, anak, atau anggota lain" />
            <button className="secondary" type="button" onClick={addMember}>Tambahkan</button>
          </div>
        </fieldset>

        <label>{type === "income" ? "Sumber pemasukan" : "Kategori"}
          <select value={category} onChange={(e) => changeCategory(e.target.value)}>
            {(type === "income" ? incomeCategories : categoryList).map((item) => <option key={item}>{item}</option>)}
            {type === "expense" && <option>Kategori lainnya…</option>}
          </select>
        </label>

        {type === "expense" && category === "Kategori lainnya…" && (
          <label>Nama kategori baru
            <input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Contoh: Hewan peliharaan" required />
          </label>
        )}

        {type === "expense" && (
          <>
            <label>Aktivitas
              <select value={activity} onChange={(e) => setActivity(e.target.value)}>
                {activities.map((item) => <option key={item}>{item}</option>)}
                <option>Aktivitas lainnya…</option>
              </select>
            </label>

            {activity === "Aktivitas lainnya…" && (
              <label>Nama aktivitas baru
                <input value={customActivity} onChange={(e) => setCustomActivity(e.target.value)} placeholder="Tulis aktivitas yang paling sesuai" required />
              </label>
            )}

            <label>Makna transaksi
              <select value={awareness} onChange={(e) => setAwareness(e.target.value as Awareness)}>
                {awarenessOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>

            <aside className="awarenessHelp">
              <strong>{awarenessInfo.label}</strong>
              <p>{awarenessInfo.description}</p>
              <small>{awarenessInfo.example}</small>
            </aside>

            <div className="bucketPreview">
              <span>Masuk ke pos anggaran</span>
              <strong>{bucket}</strong>
            </div>
          </>
        )}

        <label>Catatan
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} placeholder="Contoh: obat demam untuk Wita, Deni, dan Qianna" />
        </label>

        <button className="primary" disabled={busy || !beneficiaries.length}>
          {busy ? "Menyimpan…" : type === "income" ? "Simpan pemasukan" : "Simpan pengeluaran"}
        </button>
      </form>
    </section>
  );
}

function BudgetPlanner({ plan, actualIncome, transactions, onSave }: {
  plan?: BudgetPlan;
  actualIncome: number;
  transactions: FinanceTransaction[];
  onSave: (plan: BudgetPlan) => Promise<void>;
}) {
  const [income, setIncome] = useState(String(plan?.monthlyIncome || actualIncome || ""));
  const [scenario, setScenario] = useState<BudgetScenario>(plan?.scenario ?? "seimbang");
  const [allocations, setAllocations] = useState<BudgetAllocation[]>(
    plan?.allocations ?? getScenario("seimbang").allocations.map((item) => ({ ...item }))
  );
  const [busy, setBusy] = useState(false);

  const numericIncome = Number(income) || 0;
  const totalPercent = allocations.reduce((sum, item) => sum + item.percent, 0);
  const scenarioInfo = getScenario(scenario);

  function selectScenario(value: BudgetScenario) {
    setScenario(value);
    setAllocations(getScenario(value).allocations.map((item) => ({ ...item })));
  }

  function updatePercent(bucket: BudgetBucket, percent: number) {
    setAllocations((current) => current.map((item) => item.bucket === bucket
      ? { ...item, percent: Math.max(0, Math.min(100, percent || 0)) }
      : item));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!numericIncome || totalPercent !== 100) return;
    setBusy(true);
    try {
      const timestamp = new Date().toISOString();
      await onSave({
        id: plan?.id ?? crypto.randomUUID(),
        month: monthKey(),
        monthlyIncome: numericIncome,
        scenario,
        allocations,
        createdAt: plan?.createdAt ?? timestamp,
        updatedAt: timestamp
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="budgetPage">
      <div className="pageIntro">
        <span className="eyebrow">RENCANA BULANAN</span>
        <h2>Beri tugas pada uangmu sebelum ia habis.</h2>
        <p>Atlas memberi rekomendasi awal setelah kamu memasukkan pemasukan. Persentasenya bukan aturan kaku—ubah agar sesuai kenyataan hidupmu.</p>
      </div>

      <form className="budgetLayout" onSubmit={submit}>
        <section className="card budgetSetupCard">
          <label>Pemasukan yang akan direncanakan
            <input type="number" inputMode="numeric" min="1" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="Masukkan total pemasukan bulan ini" required />
          </label>
          {actualIncome > 0 && <p className="fieldHint">Pemasukan yang sudah tercatat bulan ini: <strong>{rupiah.format(actualIncome)}</strong></p>}

          <label>Kondisi yang paling mendekati saat ini
            <select value={scenario} onChange={(e) => selectScenario(e.target.value as BudgetScenario)}>
              {budgetScenarios.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>

          <aside className="scenarioNote"><strong>{scenarioInfo.label}</strong><p>{scenarioInfo.description}</p></aside>

          <div className="allocationEditor">
            {allocations.map((allocation) => (
              <label key={allocation.bucket}>
                <span>{allocation.bucket}</span>
                <div><input type="number" min="0" max="100" value={allocation.percent} onChange={(e) => updatePercent(allocation.bucket, Number(e.target.value))} /><b>%</b></div>
              </label>
            ))}
          </div>

          <div className={totalPercent === 100 ? "percentTotal valid" : "percentTotal invalid"}>
            <span>Total pembagian</span><strong>{totalPercent}%</strong>
          </div>

          <button className="primary" disabled={busy || !numericIncome || totalPercent !== 100}>
            {busy ? "Menyimpan…" : "Simpan rencana bulan ini"}
          </button>
        </section>

        <section className="card budgetPreviewCard">
          <span className="eyebrow">GAMBARAN PEMBAGIAN</span>
          <h3>{numericIncome ? rupiah.format(numericIncome) : "Masukkan pemasukan"}</h3>
          <div className="allocationPreview">
            {allocations.map((allocation) => {
              const amount = numericIncome * allocation.percent / 100;
              const actual = transactions
                .filter((item) => item.type === "expense" && item.budgetBucket === allocation.bucket)
                .reduce((sum, item) => sum + item.amount, 0);
              return (
                <article key={allocation.bucket}>
                  <div><span>{allocation.bucket}</span><strong>{rupiah.format(amount)}</strong></div>
                  <small>{allocation.percent}% · terpakai {rupiah.format(actual)}</small>
                </article>
              );
            })}
          </div>
          <div className="educationNote">
            <strong>Kenapa ini hanya rekomendasi awal?</strong>
            <p>Keluarga dengan penghasilan tidak tetap, cicilan besar, kebutuhan kesehatan khusus, atau tanggungan berbeda membutuhkan pembagian yang berbeda. Atlas membantu memberi struktur, bukan menghakimi pilihanmu.</p>
          </div>
        </section>
      </form>
    </section>
  );
}

const learningModules = [
  {
    id: "arus-kas",
    title: "Kenali arus kas sebelum membuat target",
    summary: "Pahami pemasukan, pengeluaran, dan selisihnya agar keputusan tidak dibuat dari perasaan saja.",
    content: "Mulailah dari angka yang benar-benar terjadi. Catat pemasukan bersih dan seluruh pengeluaran, termasuk biaya kecil yang sering luput. Arus kas positif bukan berarti semua aman, tetapi memberi ruang untuk membangun dana darurat dan tujuan."
  },
  {
    id: "anggaran",
    title: "Anggaran adalah arah, bukan hukuman",
    summary: "Buat pembagian yang realistis dan tetap menyediakan ruang untuk menikmati hidup.",
    content: "Anggaran yang terlalu ketat biasanya sulit bertahan. Pisahkan kebutuhan pokok, kewajiban, perlindungan, tujuan, keinginan, serta berbagi. Evaluasi dengan data aktual, lalu sesuaikan setiap bulan."
  },
  {
    id: "dana-darurat",
    title: "Bangun dana darurat bertahap",
    summary: "Cadangan membantu keluarga bertahan ketika penghasilan terganggu atau muncul kebutuhan mendesak.",
    content: "Target dana darurat perlu mempertimbangkan kebutuhan pokok bulanan, kestabilan penghasilan, jumlah tanggungan, dan perlindungan yang sudah dimiliki. Mulai dari target kecil yang terasa mungkin, lalu naikkan bertahap."
  },
  {
    id: "dana-berkala",
    title: "Siapkan dana untuk pengeluaran yang pasti datang",
    summary: "Biaya tahunan bukan kejutan jika sudah dicicil setiap bulan.",
    content: "Pajak kendaraan, uang sekolah, hari raya, servis, dan liburan dapat dibuat menjadi dana berkala. Bagi kebutuhan tahunan dengan jumlah bulan tersisa, lalu sisihkan rutin."
  },
  {
    id: "utang",
    title: "Kelola utang dengan urutan yang jelas",
    summary: "Hentikan penambahan utang konsumtif dan pilih strategi pelunasan yang sanggup dijalani.",
    content: "Catat saldo, bunga, cicilan minimum, dan jatuh tempo. Prioritaskan kewajiban yang paling mahal atau paling berisiko, sambil menjaga kebutuhan pokok dan dana aman minimum."
  },
  {
    id: "proteksi",
    title: "Proteksi menjaga rencana tetap berjalan",
    summary: "Kenali risiko kesehatan, jiwa, dan aset sebelum mengejar hasil investasi.",
    content: "Proteksi bukan pengganti dana darurat. Keduanya bekerja bersama: dana darurat menangani kebutuhan yang masih dapat ditanggung sendiri, sedangkan proteksi membantu risiko besar yang dapat mengguncang keuangan keluarga."
  },
  {
    id: "tujuan",
    title: "Ubah keinginan menjadi tujuan yang terukur",
    summary: "Tentukan nominal, tenggat, prioritas, dan sumber dana untuk setiap tujuan.",
    content: "Tujuan yang baik menjawab empat hal: untuk apa, berapa kebutuhannya, kapan dibutuhkan, dan berapa yang perlu disisihkan. Pisahkan tujuan jangka pendek, menengah, dan panjang."
  },
  {
    id: "investasi",
    title: "Investasi mengikuti tujuan dan kesiapan",
    summary: "Jangan memilih produk hanya karena sedang ramai atau menjanjikan hasil tinggi.",
    content: "Pastikan arus kas, dana darurat, utang, dan proteksi berada pada kondisi yang cukup sehat. Setelah itu, pilih instrumen sesuai tujuan, jangka waktu, pemahaman, dan kemampuan menghadapi risiko."
  }
];

function LearningCenter({ progress, onToggle }: { progress: string[]; onToggle: (moduleId: string) => Promise<void> }) {
  const [monthlyNeeds, setMonthlyNeeds] = useState("");
  const [months, setMonths] = useState("6");
  const emergencyTarget = (Number(monthlyNeeds) || 0) * (Number(months) || 0);

  return (
    <section className="learningPage">
      <div className="pageIntro">
        <span className="eyebrow">BELAJAR BERSAMA ATLAS</span>
        <h2>Keputusan keuangan yang baik bisa dipelajari.</h2>
        <p>Materinya dibuat singkat, praktis, dan dekat dengan keputusan sehari-hari. Bukan untuk membuatmu merasa tertinggal.</p>
      </div>

      <section className="card emergencyCalculator">
        <div><span className="eyebrow">LATIHAN DANA DARURAT</span><h3>Berapa gambaran cadanganmu?</h3><p>Gunakan kebutuhan pokok, bukan seluruh gaya hidup bulanan.</p></div>
        <div className="emergencyInputs">
          <label>Kebutuhan pokok per bulan<input type="number" inputMode="numeric" min="0" value={monthlyNeeds} onChange={(e) => setMonthlyNeeds(e.target.value)} placeholder="Contoh: 5.000.000" /></label>
          <label>Bulan penyangga<select value={months} onChange={(e) => setMonths(e.target.value)}><option value="3">3 bulan</option><option value="6">6 bulan</option><option value="9">9 bulan</option><option value="12">12 bulan</option></select></label>
        </div>
        <div className="emergencyResult"><span>Gambaran target</span><strong>{rupiah.format(emergencyTarget)}</strong></div>
        <small>Target sebenarnya perlu disesuaikan dengan kestabilan penghasilan, tanggungan, kondisi kesehatan, dan perlindungan keluarga.</small>
      </section>

      <div className="learningGrid">
        {learningModules.map((module, index) => {
          const completed = progress.includes(module.id);
          return (
            <details className={completed ? "learningCard completed" : "learningCard"} key={module.id}>
              <summary>
                <span className="moduleNumber">{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{module.title}</h3><p>{module.summary}</p></div>
                <span className="moduleToggle">⌄</span>
              </summary>
              <div className="moduleBody">
                <p>{module.content}</p>
                <button className={completed ? "secondary" : "primary"} type="button" onClick={() => void onToggle(module.id)}>
                  {completed ? "Tandai belum selesai" : "Tandai sudah dipahami"}
                </button>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

function History({ transactions, onDelete, onBack }: {
  transactions: FinanceTransaction[];
  onDelete: (id: string) => Promise<void>;
  onBack: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = transactions.filter((item) => `${item.note} ${item.category} ${item.activity} ${item.beneficiaries.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <section>
      <div className="heading atlasSectionHeading"><div><span className="eyebrow">JEJAK KEUANGAN</span><h2>Semua transaksi</h2></div><button type="button" onClick={onBack}>Kembali</button></div>
      <input className="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari kategori, aktivitas, orang, atau catatan" />
      <TransactionList transactions={filtered} onDelete={onDelete} />
    </section>
  );
}

function MySpace({ finance, onUpdateMembers, onLock, onSignOut, onReset }: {
  finance: FinanceState;
  onUpdateMembers: (members: string[]) => Promise<void>;
  onLock: () => void;
  onSignOut: () => void;
  onReset: () => Promise<void>;
}) {
  const [member, setMember] = useState("");

  async function addMember() {
    const value = member.trim();
    if (!value || finance.householdMembers.includes(value)) return;
    await onUpdateMembers([...finance.householdMembers, value]);
    setMember("");
  }

  return (
    <section className="spacePage">
      <div className="pageIntro"><span className="eyebrow">RUANGKU</span><h2>Data, keluarga, dan kendalimu.</h2><p>Atur siapa saja yang dapat menjadi penerima manfaat transaksi, simpan backup, atau kunci Atlas saat selesai digunakan.</p></div>

      <section className="card memberCard">
        <div><span className="eyebrow">ANGGOTA DAN PENERIMA MANFAAT</span><h3>Siapa saja yang kamu kelola?</h3><p>Nama-nama ini dapat dipilih bersamaan saat mencatat kesehatan, makan keluarga, pendidikan, atau kebutuhan lainnya.</p></div>
        <div className="memberList">
          {finance.householdMembers.map((item) => (
            <span key={item}>{item}{finance.householdMembers.length > 1 && <button type="button" aria-label={`Hapus ${item}`} onClick={() => void onUpdateMembers(finance.householdMembers.filter((name) => name !== item))}>×</button>}</span>
          ))}
        </div>
        <div className="inlineAdd"><input value={member} onChange={(e) => setMember(e.target.value)} placeholder="Tambah nama anggota" /><button className="secondary" type="button" onClick={() => void addMember()}>Tambahkan</button></div>
      </section>

      <DataPortability />

      <section className="card privacy atlasPrivacy">
        <b>◇</b>
        <div><h3>Terenkripsi di perangkat</h3><p>Transaksi tidak dikirim ke Supabase. Server hanya dipakai untuk identitas dan lisensi. Backup ekspor juga tetap terenkripsi.</p></div>
      </section>

      <section className="card accountActions">
        <button className="secondary" type="button" onClick={onLock}>Kunci Atlas di perangkat ini</button>
        <button className="secondary" type="button" onClick={onSignOut}>Keluar dari akun</button>
        <button className="danger" type="button" onClick={() => window.confirm("Hapus seluruh data lokal Atlas di perangkat ini?") && void onReset()}>Hapus seluruh data lokal</button>
      </section>
    </section>
  );
}

function TransactionList({ transactions, onDelete }: { transactions: FinanceTransaction[]; onDelete?: (id: string) => Promise<void> }) {
  if (!transactions.length) return <div className="empty atlasEmpty">Belum ada jejak di sini. Satu catatan kecil sudah cukup untuk mulai.</div>;
  return (
    <div className="list atlasList">
      {transactions.map((item) => {
        const awareness = awarenessOptions.find((option) => option.value === item.awareness)?.label ?? item.awareness;
        return (
          <article key={item.id}>
            <div>
              <h3>{item.note || item.activity}<span>{item.type === "income" ? "Pemasukan" : awareness}</span></h3>
              <p>{new Date(`${item.date}T00:00:00`).toLocaleDateString("id-ID")} · {item.category}</p>
              <small>Untuk: {item.beneficiaries.join(", ")}</small>
            </div>
            <div className="value">
              <strong className={item.type}>{item.type === "expense" ? "−" : "+"}{rupiah.format(item.amount)}</strong>
              {onDelete && <button type="button" onClick={() => void onDelete(item.id)}>Hapus</button>}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Nav({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) {
  return <button className={active ? "active" : ""} type="button" onClick={onClick}><span>{icon}</span><small>{label}</small></button>;
}

function Centered({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return <div className="center"><div className="mark">A</div><h1>{title}</h1><p>{text}</p>{action}</div>;
}

export default App;
