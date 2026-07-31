import { readFile, writeFile } from "node:fs/promises";

const appPath = new URL("../src/App.tsx", import.meta.url);
let source = await readFile(appPath, "utf8");
let changed = false;

function replaceRequired(pattern, replacement, label) {
  if (!pattern.test(source)) throw new Error(`Atlas goal-card action anchor missing: ${label}`);
  source = source.replace(pattern, replacement);
  changed = true;
}

if (!source.includes('import GoalMovementPanel from "./components/GoalMovementPanel";')) {
  const anchor = 'import EmergencyFundGuide from "./components/EmergencyFundGuide";';
  if (!source.includes(anchor)) throw new Error("Atlas goal movement import anchor missing");
  source = source.replace(anchor, `${anchor}\nimport GoalMovementPanel from "./components/GoalMovementPanel";`);
  changed = true;
}

if (source.includes('type Screen = "home" | "record" | "plan" | "learn" | "history" | "space";')) {
  source = source.replace(
    'type Screen = "home" | "record" | "plan" | "learn" | "history" | "space";',
    'type Screen = "home" | "record" | "goal-movement" | "plan" | "learn" | "history" | "space";'
  );
  changed = true;
}

if (!source.includes('const [goalMovement, setGoalMovement]')) {
  const anchor = '  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);';
  if (!source.includes(anchor)) throw new Error("Atlas goal movement state anchor missing");
  source = source.replace(anchor, `${anchor}\n  const [goalMovement, setGoalMovement] = useState<{ goalId: string; action: AllocationAction; transaction?: FinanceTransaction } | null>(null);`);
  changed = true;
}

if (!source.includes('function openGoalMovement(goalId: string')) {
  const anchor = `  function openGoals() {\n    setPlanTab("goals");\n    setScreen("plan");\n  }`;
  if (!source.includes(anchor)) throw new Error("Atlas open goal movement anchor missing");
  source = source.replace(anchor, `${anchor}\n\n  function openGoalMovement(goalId: string, action: AllocationAction = "deposit", transaction?: FinanceTransaction) {\n    setEditingTransaction(null);\n    setGoalMovement({ goalId, action, transaction });\n    setScreen("goal-movement");\n  }`);
  changed = true;
}

if (!source.includes('const movementGoal = goalMovement')) {
  const anchor = '  const activeGoals = finance.goals.filter((goal) => !goal.isArchived);';
  if (!source.includes(anchor)) throw new Error("Atlas movement goal lookup anchor missing");
  source = source.replace(anchor, `${anchor}\n  const movementGoal = goalMovement ? finance.goals.find((goal) => goal.id === goalMovement.goalId) : undefined;`);
  changed = true;
}

if (!source.includes('onEmergencyDeposit={() =>')) {
  replaceRequired(
    /<Home\n\s+finance=\{finance\}[\s\S]*?onHistory=\{\(\) => setScreen\("history"\)\}\n\s*\/>/,
    `<Home
            finance={finance}
            stats={stats}
            monthlyTransactions={monthlyTransactions}
            currentPlan={currentPlan}
            onRecord={() => setScreen("record")}
            onBudget={() => { setPlanTab("budget"); setScreen("plan"); }}
            onGoals={openGoals}
            onGoalDeposit={(goalId) => openGoalMovement(goalId, "deposit")}
            onEmergencyDeposit={() => { const goal = finance.goals.find((item) => item.type === "emergency" && !item.isArchived); if (goal) openGoalMovement(goal.id, "deposit"); }}
            onEmergencyWithdraw={() => { const goal = finance.goals.find((item) => item.type === "emergency" && !item.isArchived); if (goal) openGoalMovement(goal.id, "withdrawal"); }}
            onHistory={() => setScreen("history")}
          />`,
    "home mount"
  );
}

if (!source.includes('screen === "goal-movement"')) {
  const anchor = '        {screen === "plan" && (';
  if (!source.includes(anchor)) throw new Error("Atlas goal movement screen anchor missing");
  const block = `        {screen === "goal-movement" && goalMovement && movementGoal && (
          <GoalMovementPanel
            goal={movementGoal}
            action={goalMovement.action}
            profileName={finance.profileName}
            plan={currentPlan}
            monthlyTransactions={monthlyTransactions}
            allTransactions={finance.transactions}
            initialTransaction={goalMovement.transaction}
            onCancel={() => { setGoalMovement(null); setScreen("home"); }}
            onSave={async (transaction) => {
              const nextTransactions = goalMovement.transaction
                ? finance.transactions.map((item) => item.id === transaction.id ? transaction : item)
                : [transaction, ...finance.transactions];
              await persist({ ...finance, transactions: nextTransactions });
              setMessage(goalMovement.transaction
                ? "Perubahan tujuan sudah disimpan."
                : transaction.allocationAction === "withdrawal"
                  ? "Pengambilan dana darurat sudah dicatat dengan jujur."
                  : "Setoran tujuan sudah dicatat dan progres diperbarui.");
              setGoalMovement(null);
              setScreen("home");
            }}
          />
        )}

${anchor}`;
  source = source.replace(anchor, block);
  changed = true;
}

source = source.replace(
  'onAllocate={() => setScreen("record")}',
  'onAllocate={(goalId) => openGoalMovement(goalId, "deposit")}'
);
source = source.replaceAll('onAllocate: () => void', 'onAllocate: (goalId: string) => void');
source = source.replaceAll('onClick={onAllocate}', 'onClick={() => onAllocate(goal.id)}');

source = source.replace(
  'onEdit={(transaction) => { setEditingTransaction(transaction); setScreen("record"); }}',
  'onEdit={(transaction) => { if (transaction.type === "allocation" && transaction.goalId) openGoalMovement(transaction.goalId, transaction.allocationAction ?? "deposit", transaction); else { setGoalMovement(null); setEditingTransaction(transaction); setScreen("record"); } }}'
);

source = source.replace(
  /<button type="button" className=\{type === "allocation" \? "active" : ""\} onClick=\{\(\) => changeType\("allocation"\)\}>Tujuan<\/button>/,
  ''
);

const home = `function Home({ finance, stats, monthlyTransactions, currentPlan, onRecord, onBudget, onGoals, onGoalDeposit, onEmergencyDeposit, onEmergencyWithdraw, onHistory }: { finance: FinanceState; stats: { count: number; income: number; expense: number; allocatedIn: number; allocatedOut: number; available: number; impulsePercent: number }; monthlyTransactions: FinanceTransaction[]; currentPlan?: BudgetPlan; onRecord: () => void; onBudget: () => void; onGoals: () => void; onGoalDeposit: (goalId: string) => void; onEmergencyDeposit: () => void; onEmergencyWithdraw: () => void; onHistory: () => void }) {
  const focus = stats.count === 0 ? ["Mulai dari satu transaksi.", "Catat pemasukan atau pengeluaran pertama agar Atlas mulai membaca polamu."] : !currentPlan ? ["Uangmu sudah mulai bercerita.", "Susun rencana anggaran agar setiap rupiah punya arah."] : stats.available < 0 ? ["Arus kas bulan ini perlu ruang bernapas.", \`Dana tersedia sementara minus \${rupiah.format(Math.abs(stats.available))}.\`] : stats.impulsePercent >= 20 ? ["Belanja spontan mulai mengambil ruang.", \`\${stats.impulsePercent}% pengeluaran bulan ini tercatat sebagai impulsif.\`] : ["Kamu sedang membangun arah.", \`Dana yang masih tersedia bulan ini \${rupiah.format(stats.available)}.\`];
  return (
    <><WelcomeJourney name={finance.profileName} transactionCount={finance.transactions.length} onRecord={onRecord} />
      <section className="balance atlasBalance"><div className="balanceHeading"><span>Dana tersedia bulan ini</span><small>{new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</small></div><strong>{rupiah.format(stats.available)}</strong><div className="cashflowTiles"><p><small>Pemasukan</small>{rupiah.format(stats.income)}</p><p><small>Pengeluaran</small>{rupiah.format(stats.expense)}</p><p><small>Dialokasikan</small>{rupiah.format(stats.allocatedIn)}</p></div></section>
      <section className="card focus atlasFocus"><div><span className="eyebrow">LANGKAH HARI INI</span><h2>{focus[0]}</h2><p>{focus[1]}</p>{!currentPlan && stats.income > 0 && <button className="textAction" type="button" onClick={onBudget}>Susun rencana anggaran →</button>}</div><b>✦</b></section>
      <FundingAwarenessCard plan={currentPlan} actualIncome={stats.income} transactions={monthlyTransactions} onOpenBudget={onBudget} />
      <GuidanceModeCard style={finance.financialProfile?.budgetStyle ?? "balanced"} />
      <EmergencyFundGuide finance={finance} currentPlan={currentPlan} onAddFunds={onEmergencyDeposit} onWithdraw={onEmergencyWithdraw} onOpenGoals={onGoals} onOpenBudget={onBudget} />
      <GoalSnapshot goals={finance.goals} transactions={finance.transactions} onOpen={onGoals} onDeposit={onGoalDeposit} />
      <BudgetSnapshot plan={currentPlan} transactions={monthlyTransactions} onBudget={onBudget} />
      <div className="heading atlasSectionHeading"><div><span className="eyebrow">JEJAK TERBARU</span><h2>Yang baru kamu catat</h2></div><button type="button" onClick={onHistory}>Lihat semua</button></div><TransactionList transactions={finance.transactions.slice(0, 5)} goals={finance.goals} />
    </>
  );
}
`;

replaceRequired(
  /function Home\([\s\S]*?(?=\nfunction GoalSnapshot)/,
  home.trim(),
  "home function"
);

const goalSnapshot = `function GoalSnapshot({ goals, transactions, onOpen, onDeposit }: { goals: FinancialGoal[]; transactions: FinanceTransaction[]; onOpen: () => void; onDeposit: (goalId: string) => void }) {
  const active = goals.filter((goal) => !goal.isArchived && goal.type !== "emergency").slice(0, 3);
  return <section className="card goalSnapshot goalSnapshotOther"><div className="goalSnapshotHead"><div><span className="eyebrow">TUJUAN SELAIN DANA DARURAT</span><h2>Tujuan lain yang sedang kamu bangun.</h2></div><button type="button" onClick={onOpen}>Lihat semua</button></div>{active.length ? <div className="goalMiniGrid">{active.map((goal) => { const current = goalProgress(goal, transactions); const percent = goal.targetAmount ? Math.min(100, Math.round(current / goal.targetAmount * 100)) : 0; const actionText = goal.type === "retirement" ? "Tambah setoran" : goal.type === "gold" ? "Catat pembelian" : "Tambah dana"; return <article key={goal.id}><div><strong>{goal.name}</strong><span>{goal.targetAmount ? percent + "%" : goal.type === "retirement" ? "Dana terkunci" : "Atur target"}</span></div><div className="progressTrack"><i style={{ width: percent + "%" }} /></div><small>{rupiah.format(current)}{goal.targetAmount ? " dari " + rupiah.format(goal.targetAmount) : " terkumpul"}</small><div className="goalCardActions"><button className="secondary" type="button" onClick={() => onDeposit(goal.id)}>{actionText}</button></div></article>; })}</div> : <div className="goalSnapshotEmpty"><strong>Belum ada tujuan lain.</strong><p>Tambahkan emas, DPLK atau pensiun, pendidikan, rumah, atau tujuan personal lainnya.</p><button className="secondary" type="button" onClick={onOpen}>Tambah tujuan</button></div>}</section>;
}
`;

replaceRequired(
  /function GoalSnapshot\([\s\S]*?(?=\nfunction BudgetSnapshot)/,
  goalSnapshot.trim(),
  "goal snapshot function"
);

if (changed) await writeFile(appPath, source, "utf8");
console.log("Atlas goal actions now live inside each goal card");
