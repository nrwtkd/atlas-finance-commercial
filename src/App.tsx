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
  budgetScenarios,
  expenseCategories,
  getActivities,
  getScenario,
  incomeCategories,
  inferBudgetBucket
} from "./domain/financeCatalog";
import type {
  AllocationAction,
  Awareness,
  BudgetAllocation,
  BudgetBucket,
  BudgetPlan,
  BudgetScenario,
  Entitlement,
  FinanceState,
  FinanceTransaction,
  FinancialGoal,
  GoalType,
  TransactionType
} from "./types";
import "./atlas-v2.css";
import "./goals-v3.css";

type Screen = "home" | "record" | "plan" | "learn" | "history" | "space";
type PlanTab = "budget" | "goals";
type LegacyState = Partial<FinanceState> & { transactions?: Array<Partial<FinanceTransaction>> };

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

const monthKey = () => new Date().toISOString().slice(0, 7);
const emergencyGoalId = "atlas-goal-dana-darurat";

const goalPresets: Array<{ type: GoalType; label: string; defaultName: string; bucket: BudgetBucket }> = [
  { type: "emergency", label: "Dana darurat", defaultName: "Dana darurat", bucket: "Dana darurat dan perlindungan" },
  { type: "education", label: "Pendidikan", defaultName: "Dana pendidikan", bucket: "Tujuan masa depan" },
  { type: "home", label: "Rumah", defaultName: "Dana rumah", bucket: "Tujuan masa depan" },
  { type: "vehicle", label: "Kendaraan", defaultName: "Dana kendaraan", bucket: "Tujuan masa depan" },
  { type: "worship", label: "Ibadah", defaultName: "Dana ibadah", bucket: "Berbagi dan ibadah" },
  { type: "vacation", label: "Liburan", defaultName: "Dana liburan", bucket: "Tujuan masa depan" },
  { type: "retirement", label: "Pensiun", defaultName: "Dana pensiun", bucket: "Tujuan masa depan" },
  { type: "debt", label: "Pelunasan utang", defaultName: "Pelunasan utang", bucket: "Kewajiban dan utang" },
  { type: "wedding", label: "Pernikahan", defaultName: "Dana pernikahan", bucket: "Tujuan masa depan" },
  { type: "custom", label: "Tujuan lainnya", defaultName: "Tujuan keuanganku", bucket: "Tujuan masa depan" }
];

function createEmergencyGoal(): FinancialGoal {
  const timestamp = new Date().toISOString();
  return {
    id: emergencyGoalId,
    name: "Dana darurat",
    type: "emergency",
    targetAmount: 0,
    initialAmount: 0,
    isArchived: false,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function emptyState(name: string): FinanceState {
  const profileName = name.trim() || "Saya";
  return {
    schemaVersion: 3,
    profileName,
    householdMembers: [profileName],
    customCategories: {},
    budgetPlans: [],
    goals: [createEmergencyGoal()],
    learningProgress: [],
    transactions: [],
    lastUpdatedAt: new Date().toISOString()
  };
}

function bucketForGoal(goal?: FinancialGoal): BudgetBucket {
  return goalPresets.find((item) => item.type === goal?.type)?.bucket ?? "Tujuan masa depan";
}

function normalizeFinanceState(input: LegacyState): FinanceState {
  const profileName = input.profileName?.trim() || "Saya";
  const members = Array.from(new Set((input.householdMembers?.length ? input.householdMembers : [profileName])
    .map((item) => item.trim())
    .filter(Boolean)));
  const suppliedGoals = (input.goals ?? []).map((goal) => ({ ...goal }));
  const hasEmergency = suppliedGoals.some((goal) => goal.type === "emergency");
  const goals = hasEmergency ? suppliedGoals : [createEmergencyGoal(), ...suppliedGoals];
  const emergencyGoal = goals.find((goal) => goal.type === "emergency")!;

  const transactions = (input.transactions ?? []).map((item): FinanceTransaction => {
    const category = item.category || item.area || "Kategori lainnya";
    const activity = item.activity || "Aktivitas lainnya";
    const legacyEmergency = item.type === "expense" && /dana darurat/i.test(`${category} ${activity}`);
    const type: TransactionType = legacyEmergency ? "allocation" : item.type ?? "expense";
    const awareness = item.awareness ?? (type === "allocation" ? "Future" : "Need");
    const goalId = legacyEmergency ? emergencyGoal.id : item.goalId;
    const goal = goals.find((candidate) => candidate.id === goalId);

    return {
      id: item.id || crypto.randomUUID(),
      type,
      amount: Number(item.amount) || 0,
      date: item.date || new Date().toISOString().slice(0, 10),
      beneficiaries: item.beneficiaries?.length ? item.beneficiaries : [profileName],
      category: type === "allocation" ? "Tujuan keuangan" : category,
      activity: legacyEmergency ? "Setoran dana darurat" : activity,
      awareness,
      budgetBucket: type === "allocation"
        ? bucketForGoal(goal)
        : type === "expense"
          ? item.budgetBucket ?? inferBudgetBucket(category, awareness)
          : undefined,
      goalId,
      allocationAction: type === "allocation" ? item.allocationAction ?? "deposit" : undefined,
      note: item.note || "",
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
      area: item.area
    };
  });

  return {
    schemaVersion: 3,
    profileName,
    householdMembers: members.length ? members : [profileName],
    customCategories: input.customCategories ?? {},
    budgetPlans: input.budgetPlans ?? [],
    goals,
    learningProgress: input.learningProgress ?? [],
    transactions,
    lastUpdatedAt: input.lastUpdatedAt || new Date().toISOString()
  };
}

function goalProgress(goal: FinancialGoal, transactions: FinanceTransaction[]): number {
  const movement = transactions
    .filter((item) => item.type === "allocation" && item.goalId === goal.id)
    .reduce((sum, item) => sum + (item.allocationAction === "withdrawal" ? -item.amount : item.amount), 0);
  return Math.max(0, goal.initialAmount + movement);
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(
    isSupabaseConfigured ? null : { status: "active", productCode: "atlas-finance-preview", source: "preview" }
  );
  const [hasVault, setHasVault] = useState(false);
  const [vaultReady, setVaultReady] = useState(false);
  const [pin, setPin] = useState("");
  const [finance, setFinance] = useState<FinanceState | null>(null);
  const [screen, setScreen] = useState<Screen>("home");
  const [planTab, setPlanTab] = useState<PlanTab>("budget");
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
    const income = monthlyTransactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
    const expense = monthlyTransactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
    const allocatedIn = monthlyTransactions
      .filter((item) => item.type === "allocation" && item.allocationAction !== "withdrawal")
      .reduce((sum, item) => sum + item.amount, 0);
    const allocatedOut = monthlyTransactions
      .filter((item) => item.type === "allocation" && item.allocationAction === "withdrawal")
      .reduce((sum, item) => sum + item.amount, 0);
    const impulse = monthlyTransactions
      .filter((item) => item.type === "expense" && item.awareness === "Impulse")
      .reduce((sum, item) => sum + item.amount, 0);
    return {
      count: monthlyTransactions.length,
      income,
      expense,
      allocatedIn,
      allocatedOut,
      available: income - expense - allocatedIn + allocatedOut,
      impulsePercent: expense ? Math.round((impulse / expense) * 100) : 0
    };
  }, [monthlyTransactions]);

  async function persist(next: FinanceState) {
    if (!pin) throw new Error("PIN lokal belum aktif.");
    const updated: FinanceState = { ...next, schemaVersion: 3, lastUpdatedAt: new Date().toISOString() };
    await saveFinanceState(pin, updated);
    setFinance(updated);
    setHasVault(true);
  }

  if (!authReady || !vaultReady) return <Centered title="Menyiapkan Atlas…" text="Ruang privatmu sedang disiapkan." />;
  if (isSupabaseConfigured && !session) return <Login message={message} setMessage={setMessage} />;
  if (isSupabaseConfigured && entitlement?.status !== "active") {
    return <Centered title="Akses belum aktif" text={entitlement?.status === "unknown" ? "Atlas belum dapat memeriksa lisensimu." : "Akun ini belum memiliki lisensi Atlas Finance aktif."} action={<button className="secondary" onClick={() => void supabase?.auth.signOut()}>Keluar</button>} />;
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
          const next = normalizeFinanceState(raw as unknown as LegacyState);
          setPin(enteredPin);
          setFinance(next);
        }}
      />
    );
  }

  const currentPlan = finance.budgetPlans.find((item) => item.month === monthKey());
  const activeGoals = finance.goals.filter((goal) => !goal.isArchived);

  function openGoals() {
    setPlanTab("goals");
    setScreen("plan");
  }

  return (
    <div className="app atlasApp">
      {!isSupabaseConfigured && <div className="preview">Mode pratinjau pemilik — Supabase belum dihubungkan.</div>}
      <header className="atlasTopbar">
        <div><span className="eyebrow">ATLAS FINANCE</span><h1>Halo, {finance.profileName}</h1><p>Pelan-pelan kita buat uangmu lebih terarah.</p></div>
        <button className="atlasIconButton" type="button" aria-label="Kunci Atlas" title="Kunci Atlas" onClick={() => { setFinance(null); setPin(""); }}>◇</button>
      </header>

      <main className="atlasMain">
        {screen === "home" && (
          <Home
            finance={finance}
            stats={stats}
            monthlyTransactions={monthlyTransactions}
            currentPlan={currentPlan}
            onRecord={() => setScreen("record")}
            onBudget={() => { setPlanTab("budget"); setScreen("plan"); }}
            onGoals={openGoals}
            onHistory={() => setScreen("history")}
          />
        )}

        {screen === "record" && (
          <Record
            profileName={finance.profileName}
            members={finance.householdMembers}
            customCategories={finance.customCategories}
            goals={activeGoals}
            onOpenGoals={openGoals}
            onCancel={() => setScreen("home")}
            onSave={async ({ transaction, newMember, customCategory, customActivity }) => {
              const nextMembers = newMember && !finance.householdMembers.includes(newMember) ? [...finance.householdMembers, newMember] : finance.householdMembers;
              const nextCustom = { ...finance.customCategories };
              if (customCategory) nextCustom[customCategory] = Array.from(new Set([...(nextCustom[customCategory] ?? []), ...(customActivity ? [customActivity] : [])]));
              else if (customActivity && transaction.category) nextCustom[transaction.category] = Array.from(new Set([...(nextCustom[transaction.category] ?? []), customActivity]));
              await persist({ ...finance, householdMembers: nextMembers, customCategories: nextCustom, transactions: [transaction, ...finance.transactions] });
              if (transaction.type === "income" && !currentPlan) {
                setMessage("Pemasukan tercatat. Sekarang Atlas bantu menyusun rencana pembagiannya.");
                setPlanTab("budget");
                setScreen("plan");
              } else {
                setMessage(transaction.type === "allocation" ? "Pergerakan dana tersimpan dan tracker tujuan sudah diperbarui." : "Transaksi tersimpan di perangkatmu.");
                setScreen("home");
              }
            }}
          />
        )}

        {screen === "plan" && (
          <PlanCenter tab={planTab} onTab={setPlanTab}>
            {planTab === "budget" ? (
              <BudgetPlanner
                plan={currentPlan}
                actualIncome={stats.income}
                transactions={monthlyTransactions}
                onSave={async (plan) => {
                  await persist({ ...finance, budgetPlans: [plan, ...finance.budgetPlans.filter((item) => item.month !== plan.month)] });
                  setMessage("Rencana anggaran bulan ini sudah disimpan.");
                  setScreen("home");
                }}
              />
            ) : (
              <GoalCenter
                goals={finance.goals}
                transactions={finance.transactions}
                onSave={async (goal) => {
                  await persist({ ...finance, goals: [goal, ...finance.goals.filter((item) => item.id !== goal.id)] });
                  setMessage("Tujuan keuangan sudah disimpan.");
                }}
                onArchive={async (id) => persist({ ...finance, goals: finance.goals.map((goal) => goal.id === id ? { ...goal, isArchived: true, updatedAt: new Date().toISOString() } : goal) })}
                onAllocate={() => setScreen("record")}
              />
            )}
          </PlanCenter>
        )}

        {screen === "learn" && <LearningCenter progress={finance.learningProgress} onToggle={async (moduleId) => persist({ ...finance, learningProgress: finance.learningProgress.includes(moduleId) ? finance.learningProgress.filter((item) => item !== moduleId) : [...finance.learningProgress, moduleId] })} />}

        {screen === "history" && <History transactions={finance.transactions} goals={finance.goals} onBack={() => setScreen("home")} onDelete={(id) => persist({ ...finance, transactions: finance.transactions.filter((item) => item.id !== id) })} />}

        {screen === "space" && (
          <MySpace
            finance={finance}
            onUpdateMembers={(members) => persist({ ...finance, householdMembers: members })}
            onLock={() => { setFinance(null); setPin(""); }}
            onSignOut={() => void supabase?.auth.signOut()}
            onReset={async () => { await clearVault(); setFinance(null); setPin(""); setHasVault(false); }}
          />
        )}
      </main>

      {message && <button className="toast atlasToast" type="button" onClick={() => setMessage("")}>{message}</button>}
      <nav className="atlasNav" aria-label="Navigasi utama">
        <Nav label="Beranda" icon="⌂" active={screen === "home" || screen === "history"} onClick={() => setScreen("home")} />
        <Nav label="Catat" icon="＋" active={screen === "record"} onClick={() => setScreen("record")} />
        <Nav label="Rencana" icon="◌" active={screen === "plan"} onClick={() => setScreen("plan")} />
        <Nav label="Belajar" icon="✦" active={screen === "learn"} onClick={() => setScreen("learn")} />
        <Nav label="Ruangku" icon="◇" active={screen === "space"} onClick={() => setScreen("space")} />
      </nav>
    </div>
  );
}

function Login({ message, setMessage }: { message: string; setMessage: (value: string) => void }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const success = message.toLowerCase().includes("dikirim");
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try { await sendMagicLink(email); setMessage("Tautan masuk sudah dikirim. Silakan cek emailmu untuk melanjutkan ke Atlas."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Tautan masuk gagal dikirim."); }
    finally { setBusy(false); }
  }
  return (
    <div className="authPage loginPage">
      <div className="loginGlow loginGlowOne" aria-hidden="true" /><div className="loginGlow loginGlowTwo" aria-hidden="true" />
      <section className="authHero loginHero">
        <div className="brandLockup"><div className="mark loginMark">A</div><div><span className="eyebrow">ATLAS FINANCE</span><span className="brandByline">by ALALA</span></div></div>
        <h1><span>Mulai dari kondisi yang ada.</span><em>Bertumbuh menuju hidup yang kamu inginkan.</em></h1>
        <p className="heroLead">Lihat kondisi keuanganmu dengan lebih jernih, bangun kebiasaan yang lebih baik, dan jadikan setiap progres sebagai langkah menuju hidup yang lebih tenang dan bebas menentukan pilihan.</p>
        <div className="privacyPromise"><span className="promiseIcon" aria-hidden="true">◇</span><span><strong>Keuanganmu, tetap milikmu.</strong><small>Data finansial tersimpan di perangkatmu.</small></span></div>
      </section>
      <section className="card authCard loginCard">
        <div className="cardIntro"><span className="journeyIcon" aria-hidden="true">↗</span><div><h2>Perjalananmu dimulai di sini.</h2><p>Masuk menggunakan akun atau email yang kamu gunakan saat membeli Atlas.</p></div></div>
        <button className="primary googleButton" type="button" disabled={busy} onClick={() => signInWithGoogle().catch((error) => setMessage(error.message))}><span className="googleMark">G</span><span>Lanjutkan dengan Google</span></button>
        <div className="divider"><span>atau</span></div>
        <form className="loginForm" onSubmit={submit}><label>Email pembelian<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" autoComplete="email" required /></label><button className="secondary wide loginSubmit" disabled={busy}>{busy ? "Mengirim tautan…" : "Kirim tautan masuk"}</button><p className="loginHelper">Tidak perlu kata sandi. Kami akan mengirimkan tautan masuk sekali pakai ke emailmu.</p></form>
        {message && <p className={`formMessage loginMessage ${success ? "success" : "error"}`}>{message}</p>}
      </section>
      <p className="authClosing"><span>✦</span>Kamu tidak perlu menunggu keuanganmu sempurna untuk mulai menatanya.</p>
    </div>
  );
}

function VaultGate({ hasVault, message, setMessage, onCreate, onUnlock }: { hasVault: boolean; message: string; setMessage: (value: string) => void; onCreate: (name: string, pin: string) => Promise<void>; onUnlock: (pin: string) => Promise<void> }) {
  const [name, setName] = useState(""); const [localPin, setLocalPin] = useState(""); const [confirmPin, setConfirmPin] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); if (!hasVault && localPin !== confirmPin) return; setBusy(true); setMessage(""); try { hasVault ? await onUnlock(localPin) : await onCreate(name, localPin); } catch (error) { setMessage(error instanceof Error ? error.message : "Ruang privat gagal dibuka."); } finally { setBusy(false); } }
  return (
    <div className="authPage"><section className="authHero"><div className="mark">A</div><span className="eyebrow">RUANG PRIVAT</span><h1>{hasVault ? "Buka data di perangkat ini." : "Buat kunci lokalmu."}</h1><p>PIN mengenkripsi data sebelum masuk ke penyimpanan perangkat.</p></section>
      <form className="card authCard" onSubmit={submit}>{!hasVault && <label>Nama panggilan<input value={name} onChange={(e) => setName(e.target.value)} required /></label>}<label>PIN 6 digit<input type="password" inputMode="numeric" pattern="[0-9]{6}" value={localPin} onChange={(e) => setLocalPin(e.target.value.replace(/\D/g, "").slice(0, 6))} required /></label>{!hasVault && <label>Ulangi PIN<input type="password" inputMode="numeric" pattern="[0-9]{6}" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))} required /></label>}<button className="primary" disabled={busy || (!hasVault && localPin !== confirmPin)}>{busy ? "Memproses…" : hasVault ? "Buka Atlas" : "Buat ruang privat"}</button>{message && <p className="formMessage">{message}</p>}<p className="fine">PIN tidak disimpan oleh Atlas dan tidak dapat dipulihkan oleh tim Atlas.</p></form>
    </div>
  );
}

function Home({ finance, stats, monthlyTransactions, currentPlan, onRecord, onBudget, onGoals, onHistory }: { finance: FinanceState; stats: { count: number; income: number; expense: number; allocatedIn: number; allocatedOut: number; available: number; impulsePercent: number }; monthlyTransactions: FinanceTransaction[]; currentPlan?: BudgetPlan; onRecord: () => void; onBudget: () => void; onGoals: () => void; onHistory: () => void }) {
  const focus = stats.count === 0 ? ["Mulai dari satu transaksi.", "Catat pemasukan, pengeluaran, atau alokasi dana pertama agar Atlas mulai membaca polamu."] : !currentPlan ? ["Uangmu sudah mulai bercerita.", "Susun rencana anggaran agar setiap rupiah punya arah."] : stats.available < 0 ? ["Arus kas bulan ini perlu ruang bernapas.", `Dana tersedia sementara minus ${rupiah.format(Math.abs(stats.available))}.`] : stats.impulsePercent >= 20 ? ["Belanja spontan mulai mengambil ruang.", `${stats.impulsePercent}% pengeluaran bulan ini tercatat sebagai impulsif.`] : ["Kamu sedang membangun arah.", `Dana yang masih tersedia bulan ini ${rupiah.format(stats.available)}.`];
  return (
    <><WelcomeJourney name={finance.profileName} transactionCount={finance.transactions.length} onRecord={onRecord} />
      <section className="balance atlasBalance"><div className="balanceHeading"><span>Dana tersedia bulan ini</span><small>{new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</small></div><strong>{rupiah.format(stats.available)}</strong><div className="cashflowTiles"><p><small>Pemasukan</small>{rupiah.format(stats.income)}</p><p><small>Pengeluaran</small>{rupiah.format(stats.expense)}</p><p><small>Dialokasikan</small>{rupiah.format(stats.allocatedIn)}</p></div></section>
      <section className="card focus atlasFocus"><div><span className="eyebrow">LANGKAH HARI INI</span><h2>{focus[0]}</h2><p>{focus[1]}</p>{!currentPlan && stats.income > 0 && <button className="textAction" type="button" onClick={onBudget}>Susun rencana anggaran →</button>}</div><b>✦</b></section>
      <GoalSnapshot goals={finance.goals} transactions={finance.transactions} onOpen={onGoals} />
      <BudgetSnapshot plan={currentPlan} transactions={monthlyTransactions} onBudget={onBudget} />
      <div className="heading atlasSectionHeading"><div><span className="eyebrow">JEJAK TERBARU</span><h2>Yang baru kamu catat</h2></div><button type="button" onClick={onHistory}>Lihat semua</button></div><TransactionList transactions={finance.transactions.slice(0, 5)} goals={finance.goals} />
    </>
  );
}

function GoalSnapshot({ goals, transactions, onOpen }: { goals: FinancialGoal[]; transactions: FinanceTransaction[]; onOpen: () => void }) {
  const active = goals.filter((goal) => !goal.isArchived).slice(0, 3);
  return <section className="card goalSnapshot"><div className="goalSnapshotHead"><div><span className="eyebrow">TUJUAN KEUANGAN</span><h2>Uang yang sedang kamu arahkan.</h2></div><button type="button" onClick={onOpen}>Lihat semua</button></div><div className="goalMiniGrid">{active.map((goal) => { const current = goalProgress(goal, transactions); const percent = goal.targetAmount ? Math.min(100, Math.round(current / goal.targetAmount * 100)) : 0; return <article key={goal.id}><div><strong>{goal.name}</strong><span>{goal.targetAmount ? `${percent}%` : "Atur target"}</span></div><div className="progressTrack"><i style={{ width: `${percent}%` }} /></div><small>{rupiah.format(current)}{goal.targetAmount ? ` dari ${rupiah.format(goal.targetAmount)}` : " terkumpul"}</small></article>; })}</div></section>;
}

function BudgetSnapshot({ plan, transactions, onBudget }: { plan?: BudgetPlan; transactions: FinanceTransaction[]; onBudget: () => void }) {
  if (!plan) return <section className="card emptyBudgetCard"><div><span className="eyebrow">RENCANA BULAN INI</span><h2>Belum ada pembagian anggaran.</h2><p>Masukkan pemasukan, lalu Atlas memberi rekomendasi awal yang tetap bisa kamu ubah.</p></div><button className="secondary" type="button" onClick={onBudget}>Buat rencana</button></section>;
  const used = transactions.filter((item) => item.type === "expense" || (item.type === "allocation" && item.allocationAction !== "withdrawal")).reduce((sum, item) => sum + item.amount, 0);
  return <section className="card budgetSnapshot"><div className="budgetSnapshotTop"><div><span className="eyebrow">RENCANA BULAN INI</span><h2>{rupiah.format(plan.monthlyIncome)}</h2></div><button type="button" onClick={onBudget}>Atur ulang</button></div><div className="budgetSnapshotNumbers"><p><span>Sudah digunakan dan diarahkan</span><strong>{rupiah.format(used)}</strong></p><p><span>Belum diberi tugas</span><strong>{rupiah.format(Math.max(0, plan.monthlyIncome - used))}</strong></p></div><div className="budgetMiniGrid">{plan.allocations.map((allocation) => { const limit = plan.monthlyIncome * allocation.percent / 100; const actual = transactions.filter((item) => item.budgetBucket === allocation.bucket && (item.type === "expense" || (item.type === "allocation" && item.allocationAction !== "withdrawal"))).reduce((sum, item) => sum + item.amount, 0); const percent = limit ? Math.min(100, Math.round(actual / limit * 100)) : 0; return <article key={allocation.bucket}><div><span>{allocation.bucket}</span><strong>{allocation.percent}%</strong></div><div className="progressTrack"><i style={{ width: `${percent}%` }} /></div><small>{rupiah.format(actual)} dari {rupiah.format(limit)}</small></article>; })}</div></section>;
}

function Record({ profileName, members, customCategories, goals, onOpenGoals, onCancel, onSave }: { profileName: string; members: string[]; customCategories: Record<string, string[]>; goals: FinancialGoal[]; onOpenGoals: () => void; onCancel: () => void; onSave: (result: { transaction: FinanceTransaction; newMember?: string; customCategory?: string; customActivity?: string }) => Promise<void> }) {
  const [type, setType] = useState<TransactionType>("expense"); const [amount, setAmount] = useState(""); const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); const [beneficiaries, setBeneficiaries] = useState<string[]>([members[0] ?? profileName]); const [newMember, setNewMember] = useState(""); const [category, setCategory] = useState(expenseCategories[0].name); const [customCategory, setCustomCategory] = useState(""); const [activity, setActivity] = useState(expenseCategories[0].activities[0]); const [customActivity, setCustomActivity] = useState(""); const [awareness, setAwareness] = useState<Awareness>("Need"); const [goalId, setGoalId] = useState(goals[0]?.id ?? ""); const [allocationAction, setAllocationAction] = useState<AllocationAction>("deposit"); const [note, setNote] = useState(""); const [busy, setBusy] = useState(false);
  const categoryList = [...expenseCategories.map((item) => item.name), ...Object.keys(customCategories)]; const selectedCategory = category === "Kategori lainnya…" ? customCategory.trim() : category; const activities = type === "expense" ? getActivities(selectedCategory, customCategories) : []; const selectedActivity = activity === "Aktivitas lainnya…" ? customActivity.trim() : activity; const awarenessInfo = awarenessOptions.find((item) => item.value === awareness)!; const selectedGoal = goals.find((goal) => goal.id === goalId); const bucket = type === "expense" ? inferBudgetBucket(selectedCategory, awareness) : type === "allocation" ? bucketForGoal(selectedGoal) : undefined;
  function changeType(next: TransactionType) { setType(next); if (next === "expense") { setCategory(expenseCategories[0].name); setActivity(expenseCategories[0].activities[0]); } if (next === "income") setCategory(incomeCategories[0]); if (next === "allocation" && goals[0]) setGoalId(goals[0].id); }
  function changeCategory(value: string) { setCategory(value); setCustomActivity(""); if (value === "Kategori lainnya…") setActivity("Aktivitas lainnya…"); else setActivity(getActivities(value, customCategories)[0] ?? "Aktivitas lainnya…"); }
  function toggleBeneficiary(value: string) { setBeneficiaries((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]); }
  async function submit(event: FormEvent) { event.preventDefault(); const value = Number(amount); if (!value || (type !== "allocation" && !beneficiaries.length)) return; if (type === "allocation" && !selectedGoal) return; setBusy(true); try { const timestamp = new Date().toISOString(); const transaction: FinanceTransaction = { id: crypto.randomUUID(), type, amount: value, date, beneficiaries: type === "allocation" ? [profileName] : beneficiaries, category: type === "allocation" ? "Tujuan keuangan" : selectedCategory, activity: type === "allocation" ? `${allocationAction === "withdrawal" ? "Penarikan dari" : "Setoran ke"} ${selectedGoal?.name}` : type === "income" ? selectedCategory : selectedActivity, awareness: type === "income" ? "Fixed" : type === "allocation" ? (selectedGoal?.type === "debt" ? "Payoff" : selectedGoal?.type === "emergency" ? "Protection" : "Future") : awareness, budgetBucket: bucket, goalId: type === "allocation" ? selectedGoal?.id : undefined, allocationAction: type === "allocation" ? allocationAction : undefined, note, createdAt: timestamp, updatedAt: timestamp }; await onSave({ transaction, newMember: newMember.trim() || undefined, customCategory: category === "Kategori lainnya…" ? customCategory.trim() || undefined : undefined, customActivity: activity === "Aktivitas lainnya…" ? customActivity.trim() || undefined : undefined }); } finally { setBusy(false); } }
  return <section className="recordPage"><div className="heading atlasSectionHeading"><div><span className="eyebrow">CATAT DENGAN SADAR</span><h2>Uangmu bergerak ke mana?</h2><p>Pisahkan uang yang benar-benar habis dari uang yang sedang kamu arahkan menuju tujuan.</p></div><button type="button" onClick={onCancel}>Batal</button></div><form className="card form atlasForm" onSubmit={submit}>
    <div className="segmented transactionKinds"><button type="button" className={type === "expense" ? "active" : ""} onClick={() => changeType("expense")}>Pengeluaran</button><button type="button" className={type === "income" ? "active" : ""} onClick={() => changeType("income")}>Pemasukan</button><button type="button" className={type === "allocation" ? "active" : ""} onClick={() => changeType("allocation")}>Alokasi dana</button></div>
    <aside className="movementHelp"><strong>{type === "expense" ? "Pengeluaran" : type === "income" ? "Pemasukan" : "Alokasi dana"}</strong><p>{type === "expense" ? "Uang digunakan dan tidak lagi tersedia, misalnya makan, obat, atau tagihan." : type === "income" ? "Uang masuk dari gaji, usaha, beasiswa, pemberian, atau sumber lainnya." : "Uang tidak habis—ia dipindahkan ke atau ditarik dari tujuan keuanganmu."}</p></aside>
    <label>Nominal<input type="number" inputMode="numeric" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Contoh: 250000" required /></label><label>Tanggal<input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
    {type === "allocation" ? <><div className="segmented"><button type="button" className={allocationAction === "deposit" ? "active" : ""} onClick={() => setAllocationAction("deposit")}>Tambahkan ke tujuan</button><button type="button" className={allocationAction === "withdrawal" ? "active" : ""} onClick={() => setAllocationAction("withdrawal")}>Tarik dari tujuan</button></div>{goals.length ? <label>Tujuan keuangan<select value={goalId} onChange={(e) => setGoalId(e.target.value)}>{goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.name}</option>)}</select></label> : <div className="empty atlasEmpty"><p>Belum ada tujuan keuangan.</p><button className="secondary" type="button" onClick={onOpenGoals}>Buat tujuan dahulu</button></div>}<div className="bucketPreview"><span>Masuk ke pos anggaran</span><strong>{bucket}</strong></div></> : <>
      <fieldset className="beneficiaryField"><legend>Transaksi ini berkaitan dengan siapa?</legend><p>Pilih “Saya” saja bila transaksi hanya berkaitan denganmu. Kamu boleh memilih lebih dari satu orang.</p><div className="chipGroup">{members.map((member) => <button key={member} className={beneficiaries.includes(member) ? "chip active" : "chip"} type="button" onClick={() => toggleBeneficiary(member)}>{beneficiaries.includes(member) ? "✓ " : "+ "}{member}</button>)}</div><div className="inlineAdd"><input value={newMember} onChange={(e) => setNewMember(e.target.value)} placeholder="Tambah orang atau pihak lain" /><button className="secondary" type="button" onClick={() => { const value = newMember.trim(); if (value) setBeneficiaries((current) => Array.from(new Set([...current, value]))); }}>Tambahkan</button></div></fieldset>
      <label>{type === "income" ? "Sumber pemasukan" : "Kategori"}<select value={category} onChange={(e) => changeCategory(e.target.value)}>{(type === "income" ? incomeCategories : categoryList).map((item) => <option key={item}>{item}</option>)}{type === "expense" && <option>Kategori lainnya…</option>}</select></label>{type === "expense" && category === "Kategori lainnya…" && <label>Nama kategori baru<input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} required /></label>}{type === "expense" && <><label>Aktivitas<select value={activity} onChange={(e) => setActivity(e.target.value)}>{activities.map((item) => <option key={item}>{item}</option>)}<option>Aktivitas lainnya…</option></select></label>{activity === "Aktivitas lainnya…" && <label>Nama aktivitas baru<input value={customActivity} onChange={(e) => setCustomActivity(e.target.value)} required /></label>}<label>Makna transaksi<select value={awareness} onChange={(e) => setAwareness(e.target.value as Awareness)}>{awarenessOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><aside className="awarenessHelp"><strong>{awarenessInfo.label}</strong><p>{awarenessInfo.description}</p><small>{awarenessInfo.example}</small></aside><div className="bucketPreview"><span>Masuk ke pos anggaran</span><strong>{bucket}</strong></div></>}</>}
    <label>Catatan<input value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} placeholder={type === "allocation" ? "Contoh: setoran rutin bulan ini" : "Tambahkan keterangan bila perlu"} /></label><button className="primary" disabled={busy || (type === "allocation" && !selectedGoal)}>{busy ? "Menyimpan…" : type === "income" ? "Simpan pemasukan" : type === "expense" ? "Simpan pengeluaran" : allocationAction === "deposit" ? "Simpan alokasi dana" : "Simpan penarikan dana"}</button>
  </form></section>;
}

function PlanCenter({ tab, onTab, children }: { tab: PlanTab; onTab: (tab: PlanTab) => void; children: ReactNode }) {
  return <section className="planPage"><div className="pageIntro"><span className="eyebrow">RENCANA KEUANGAN</span><h2>Beri arah pada uangmu.</h2><p>Susun pembagian bulanan dan pantau tujuan tanpa mencampurkan uang yang habis dengan uang yang masih kamu miliki.</p></div><div className="planTabs"><button type="button" className={tab === "budget" ? "active" : ""} onClick={() => onTab("budget")}>Anggaran bulanan</button><button type="button" className={tab === "goals" ? "active" : ""} onClick={() => onTab("goals")}>Tujuan keuangan</button></div>{children}</section>;
}

function GoalCenter({ goals, transactions, onSave, onArchive, onAllocate }: { goals: FinancialGoal[]; transactions: FinanceTransaction[]; onSave: (goal: FinancialGoal) => Promise<void>; onArchive: (id: string) => Promise<void>; onAllocate: () => void }) {
  const [editing, setEditing] = useState<FinancialGoal | null>(null); const [type, setType] = useState<GoalType>("emergency"); const [name, setName] = useState("Dana darurat"); const [target, setTarget] = useState(""); const [initial, setInitial] = useState(""); const [monthly, setMonthly] = useState(""); const [deadline, setDeadline] = useState(""); const [busy, setBusy] = useState(false);
  function selectType(next: GoalType) { setType(next); if (!editing) setName(goalPresets.find((item) => item.type === next)?.defaultName ?? "Tujuan keuanganku"); }
  function edit(goal: FinancialGoal) { setEditing(goal); setType(goal.type); setName(goal.name); setTarget(String(goal.targetAmount || "")); setInitial(String(goal.initialAmount || "")); setMonthly(String(goal.monthlyTarget || "")); setDeadline(goal.deadline ?? ""); }
  function reset() { setEditing(null); setType("emergency"); setName("Dana darurat"); setTarget(""); setInitial(""); setMonthly(""); setDeadline(""); }
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); try { const timestamp = new Date().toISOString(); await onSave({ id: editing?.id ?? (type === "emergency" && !goals.some((goal) => goal.type === "emergency") ? emergencyGoalId : crypto.randomUUID()), name: name.trim(), type, targetAmount: Number(target) || 0, initialAmount: Number(initial) || 0, monthlyTarget: Number(monthly) || undefined, deadline: deadline || undefined, isArchived: false, createdAt: editing?.createdAt ?? timestamp, updatedAt: timestamp }); reset(); } finally { setBusy(false); } }
  return <div className="goalsLayout"><section className="goalList">{goals.filter((goal) => !goal.isArchived).map((goal) => { const current = goalProgress(goal, transactions); const percent = goal.targetAmount ? Math.min(100, Math.round(current / goal.targetAmount * 100)) : 0; const remaining = Math.max(0, goal.targetAmount - current); return <article className="card goalCard" key={goal.id}><div className="goalCardTop"><div><span className="goalType">{goalPresets.find((item) => item.type === goal.type)?.label}</span><h3>{goal.name}</h3></div><strong>{goal.targetAmount ? `${percent}%` : "Target belum diatur"}</strong></div><div className="goalAmount"><b>{rupiah.format(current)}</b><span>{goal.targetAmount ? `dari ${rupiah.format(goal.targetAmount)}` : "sudah terkumpul"}</span></div><div className="progressTrack"><i style={{ width: `${percent}%` }} /></div><div className="goalMeta"><span>{goal.targetAmount ? `Sisa ${rupiah.format(remaining)}` : "Tentukan target agar progres lebih bermakna"}</span>{goal.deadline && <span>Target waktu {new Date(`${goal.deadline}T00:00:00`).toLocaleDateString("id-ID", { month: "short", year: "numeric" })}</span>}</div><div className="goalActions"><button className="secondary" type="button" onClick={() => edit(goal)}>Atur</button><button className="primary" type="button" onClick={onAllocate}>Tambah atau tarik dana</button>{goal.type !== "emergency" && <button className="textDanger" type="button" onClick={() => void onArchive(goal.id)}>Arsipkan</button>}</div></article>; })}</section>
    <form className="card goalForm" onSubmit={submit}><span className="eyebrow">{editing ? "ATUR TUJUAN" : "TUJUAN BARU"}</span><h3>{editing ? `Perbarui ${editing.name}` : "Apa yang sedang kamu siapkan?"}</h3><label>Jenis tujuan<select value={type} onChange={(e) => selectType(e.target.value as GoalType)}>{goalPresets.map((item) => <option key={item.type} value={item.type}>{item.label}</option>)}</select></label><label>Nama tujuan<input value={name} onChange={(e) => setName(e.target.value)} required /></label><label>Target nominal<input type="number" min="0" inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Boleh diisi nanti" /></label><label>Dana yang sudah ada sebelum memakai Atlas<input type="number" min="0" inputMode="numeric" value={initial} onChange={(e) => setInitial(e.target.value)} placeholder="0" /></label><div className="two"><label>Rencana setoran bulanan<input type="number" min="0" inputMode="numeric" value={monthly} onChange={(e) => setMonthly(e.target.value)} /></label><label>Tenggat waktu<input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></label></div><button className="primary" disabled={busy}>{busy ? "Menyimpan…" : editing ? "Simpan perubahan" : "Buat tujuan"}</button>{editing && <button className="secondary" type="button" onClick={reset}>Batal mengubah</button>}<p className="fine">Setiap alokasi dana yang diarahkan ke tujuan ini akan memperbarui progres secara otomatis.</p></form>
  </div>;
}

function BudgetPlanner({ plan, actualIncome, transactions, onSave }: { plan?: BudgetPlan; actualIncome: number; transactions: FinanceTransaction[]; onSave: (plan: BudgetPlan) => Promise<void> }) {
  const [income, setIncome] = useState(String(plan?.monthlyIncome || actualIncome || "")); const [scenario, setScenario] = useState<BudgetScenario>(plan?.scenario ?? "seimbang"); const [allocations, setAllocations] = useState<BudgetAllocation[]>(plan?.allocations ?? getScenario("seimbang").allocations.map((item) => ({ ...item }))); const [busy, setBusy] = useState(false); const numericIncome = Number(income) || 0; const totalPercent = allocations.reduce((sum, item) => sum + item.percent, 0); const scenarioInfo = getScenario(scenario);
  function selectScenario(value: BudgetScenario) { setScenario(value); setAllocations(getScenario(value).allocations.map((item) => ({ ...item }))); }
  async function submit(event: FormEvent) { event.preventDefault(); if (!numericIncome || totalPercent !== 100) return; setBusy(true); try { const timestamp = new Date().toISOString(); await onSave({ id: plan?.id ?? crypto.randomUUID(), month: monthKey(), monthlyIncome: numericIncome, scenario, allocations, createdAt: plan?.createdAt ?? timestamp, updatedAt: timestamp }); } finally { setBusy(false); } }
  return <form className="budgetLayout" onSubmit={submit}><section className="card budgetSetupCard"><label>Pemasukan yang akan direncanakan<input type="number" inputMode="numeric" min="1" value={income} onChange={(e) => setIncome(e.target.value)} required /></label>{actualIncome > 0 && <p className="fieldHint">Pemasukan tercatat bulan ini: <strong>{rupiah.format(actualIncome)}</strong></p>}<label>Kondisi yang paling mendekati saat ini<select value={scenario} onChange={(e) => selectScenario(e.target.value as BudgetScenario)}>{budgetScenarios.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><aside className="scenarioNote"><strong>{scenarioInfo.label}</strong><p>{scenarioInfo.description}</p></aside><div className="allocationEditor">{allocations.map((allocation) => <label key={allocation.bucket}><span>{allocation.bucket}</span><div><input type="number" min="0" max="100" value={allocation.percent} onChange={(e) => setAllocations((current) => current.map((item) => item.bucket === allocation.bucket ? { ...item, percent: Number(e.target.value) || 0 } : item))} /><b>%</b></div></label>)}</div><div className={totalPercent === 100 ? "percentTotal valid" : "percentTotal invalid"}><span>Total pembagian</span><strong>{totalPercent}%</strong></div><button className="primary" disabled={busy || !numericIncome || totalPercent !== 100}>Simpan rencana bulan ini</button></section><section className="card budgetPreviewCard"><span className="eyebrow">GAMBARAN PEMBAGIAN</span><h3>{numericIncome ? rupiah.format(numericIncome) : "Masukkan pemasukan"}</h3><div className="allocationPreview">{allocations.map((allocation) => { const amount = numericIncome * allocation.percent / 100; const actual = transactions.filter((item) => item.budgetBucket === allocation.bucket && (item.type === "expense" || (item.type === "allocation" && item.allocationAction !== "withdrawal"))).reduce((sum, item) => sum + item.amount, 0); return <article key={allocation.bucket}><div><span>{allocation.bucket}</span><strong>{rupiah.format(amount)}</strong></div><small>{allocation.percent}% · terpakai atau dialokasikan {rupiah.format(actual)}</small></article>; })}</div><div className="educationNote"><strong>Anggaran bukan aturan kaku.</strong><p>Ubah persentase sesuai pemasukan, tanggungan, cicilan, kebutuhan kesehatan, dan tahap hidupmu.</p></div></section></form>;
}

const learningModules = [
  ["arus-kas", "Kenali tiga jenis pergerakan uang", "Bedakan pemasukan, pengeluaran, dan alokasi agar laporan tidak menyesatkan.", "Pengeluaran membuat uang habis. Alokasi memindahkan uang ke tujuan yang masih menjadi milikmu. Pemisahan ini membuat arus kas dan progres tujuan terbaca lebih jernih."],
  ["anggaran", "Anggaran adalah arah, bukan hukuman", "Beri tugas pada uang dengan pembagian yang realistis.", "Mulai dari kebutuhan nyata, kewajiban, perlindungan, tujuan, keinginan, serta berbagi. Evaluasi dari data aktual dan sesuaikan setiap bulan."],
  ["darurat", "Dana darurat membangun ruang bernapas", "Pelajari target, tempat penyimpanan, dan penggunaannya.", "Target dana darurat bergantung pada kestabilan pemasukan, jumlah tanggungan, perlindungan, serta kebutuhan khusus. Dana ini harus mudah diakses dan tidak digunakan untuk belanja terencana."],
  ["tujuan", "Satu tujuan, satu rencana", "Ubah keinginan besar menjadi target, waktu, dan setoran.", "Tentukan nominal target, dana awal, tenggat, dan setoran berkala. Atlas akan membaca progres dari alokasi dana yang kamu catat."],
  ["utang", "Utang perlu peta pelunasan", "Dahulukan kewajiban berbiaya tinggi tanpa mengabaikan kebutuhan dasar.", "Catat saldo, cicilan, biaya, dan jadwal. Pembayaran pokok dapat diarahkan ke tujuan pelunasan utang agar progresnya terlihat."],
  ["proteksi", "Proteksi menjaga rencana tetap berjalan", "Pahami peran dana darurat dan perlindungan risiko.", "Proteksi bukan semata produk. Mulailah dari dana aman, akses kesehatan, dan perlindungan terhadap risiko yang dapat mengguncang arus kas."],
  ["investasi", "Investasi mengikuti tujuan", "Kenali waktu, risiko, dan kebutuhan likuiditas sebelum memilih instrumen.", "Jangan mulai dari produk. Mulai dari tujuan, tenggat, kemampuan menghadapi perubahan nilai, dan kebutuhan mencairkan dana."]
] as const;

function LearningCenter({ progress, onToggle }: { progress: string[]; onToggle: (id: string) => Promise<void> }) {
  return <section><div className="pageIntro"><span className="eyebrow">BELAJAR DI ATLAS</span><h2>Keputusan yang lebih tenang dimulai dari pemahaman.</h2><p>Materi ini bersifat edukasi umum dan akan terus dikembangkan serta ditinjau bersama praktisi perencanaan keuangan.</p></div><div className="learningList">{learningModules.map(([id, title, summary, content], index) => { const done = progress.includes(id); return <details className={done ? "learningCard completed" : "learningCard"} key={id}><summary><span className="moduleNumber">{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{summary}</p></div><span>⌄</span></summary><div className="moduleBody"><p>{content}</p><button className={done ? "secondary" : "primary"} type="button" onClick={() => void onToggle(id)}>{done ? "Tandai belum selesai" : "Tandai sudah dipahami"}</button></div></details>; })}</div></section>;
}

function History({ transactions, goals, onDelete, onBack }: { transactions: FinanceTransaction[]; goals: FinancialGoal[]; onDelete: (id: string) => Promise<void>; onBack: () => void }) {
  const [query, setQuery] = useState(""); const filtered = transactions.filter((item) => `${item.note} ${item.category} ${item.activity} ${item.beneficiaries.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  return <section><div className="heading atlasSectionHeading"><div><span className="eyebrow">JEJAK KEUANGAN</span><h2>Semua pergerakan uang</h2></div><button type="button" onClick={onBack}>Kembali</button></div><input className="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari kategori, tujuan, orang, atau catatan" /><TransactionList transactions={filtered} goals={goals} onDelete={onDelete} /></section>;
}

function MySpace({ finance, onUpdateMembers, onLock, onSignOut, onReset }: { finance: FinanceState; onUpdateMembers: (members: string[]) => Promise<void>; onLock: () => void; onSignOut: () => void; onReset: () => Promise<void> }) {
  const [member, setMember] = useState("");
  return <section className="spacePage"><div className="pageIntro"><span className="eyebrow">RUANGKU</span><h2>Data, orang terkait, dan kendalimu.</h2><p>Sesuaikan pihak yang dapat dipilih dalam transaksi, simpan salinan data, atau kunci Atlas saat selesai digunakan.</p></div><section className="card memberCard"><div><span className="eyebrow">ORANG DAN PIHAK TERKAIT</span><h3>Siapa saja yang keuangannya ikut kamu kelola?</h3><p>Pengguna yang hidup sendiri cukup menyimpan dirinya sendiri. Tambahkan pasangan, anak, orang tua, rekan usaha, atau pihak lain hanya bila diperlukan.</p></div><div className="memberList">{finance.householdMembers.map((item) => <span key={item}>{item}{finance.householdMembers.length > 1 && <button type="button" onClick={() => void onUpdateMembers(finance.householdMembers.filter((name) => name !== item))}>×</button>}</span>)}</div><div className="inlineAdd"><input value={member} onChange={(e) => setMember(e.target.value)} placeholder="Tambah nama atau pihak" /><button className="secondary" type="button" onClick={() => { const value = member.trim(); if (value && !finance.householdMembers.includes(value)) void onUpdateMembers([...finance.householdMembers, value]).then(() => setMember("")); }}>Tambahkan</button></div></section><DataPortability /><section className="card privacy atlasPrivacy"><b>◇</b><div><h3>Terenkripsi di perangkat</h3><p>Transaksi, tujuan, dan rencana anggaran tidak dikirim ke Supabase. Server hanya dipakai untuk identitas dan lisensi.</p></div></section><section className="card accountActions"><button className="secondary" type="button" onClick={onLock}>Kunci Atlas di perangkat ini</button><button className="secondary" type="button" onClick={onSignOut}>Keluar dari akun</button><button className="danger" type="button" onClick={() => window.confirm("Hapus seluruh data lokal Atlas di perangkat ini?") && void onReset()}>Hapus seluruh data lokal</button></section></section>;
}

function TransactionList({ transactions, goals, onDelete }: { transactions: FinanceTransaction[]; goals: FinancialGoal[]; onDelete?: (id: string) => Promise<void> }) {
  if (!transactions.length) return <div className="empty atlasEmpty">Belum ada jejak di sini. Satu catatan kecil sudah cukup untuk mulai.</div>;
  return <div className="list atlasList">{transactions.map((item) => { const awareness = awarenessOptions.find((option) => option.value === item.awareness)?.label ?? item.awareness; const goal = goals.find((candidate) => candidate.id === item.goalId); const label = item.type === "income" ? "Pemasukan" : item.type === "expense" ? awareness : item.allocationAction === "withdrawal" ? "Penarikan tujuan" : "Alokasi tujuan"; const sign = item.type === "income" || (item.type === "allocation" && item.allocationAction === "withdrawal") ? "+" : "−"; return <article key={item.id}><div><h3>{item.note || item.activity}<span>{label}</span></h3><p>{new Date(`${item.date}T00:00:00`).toLocaleDateString("id-ID")} · {goal?.name ?? item.category}</p>{item.type !== "allocation" && <small>Berkaitan dengan: {item.beneficiaries.join(", ")}</small>}</div><div className="value"><strong className={item.type}>{sign}{rupiah.format(item.amount)}</strong>{onDelete && <button type="button" onClick={() => void onDelete(item.id)}>Hapus</button>}</div></article>; })}</div>;
}

function Nav({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) { return <button className={active ? "active" : ""} type="button" onClick={onClick}><span>{icon}</span><small>{label}</small></button>; }
function Centered({ title, text, action }: { title: string; text: string; action?: ReactNode }) { return <div className="center"><div className="mark">A</div><h1>{title}</h1><p>{text}</p>{action}</div>; }

export default App;
