import { readFile, writeFile } from "node:fs/promises";

const appPath = new URL("../src/App.tsx", import.meta.url);
let source = await readFile(appPath, "utf8");
let changed = false;

function replaceBlock(pattern, replacement, marker, label) {
  if (source.includes(marker)) return;
  if (!pattern.test(source)) throw new Error(`Atlas clarity anchor missing: ${label}`);
  source = source.replace(pattern, replacement.trim());
  changed = true;
}

const goalSnapshot = `
function GoalSnapshot({ goals, transactions, onOpen }: { goals: FinancialGoal[]; transactions: FinanceTransaction[]; onOpen: () => void }) {
  const active = goals.filter((goal) => !goal.isArchived && goal.type !== "emergency").slice(0, 3);
  return <section className="card goalSnapshot goalSnapshotOther"><div className="goalSnapshotHead"><div><span className="eyebrow">TUJUAN SELAIN DANA DARURAT</span><h2>Tujuan lain yang sedang kamu bangun.</h2></div><button type="button" onClick={onOpen}>Lihat semua</button></div>{active.length ? <div className="goalMiniGrid">{active.map((goal) => { const current = goalProgress(goal, transactions); const percent = goal.targetAmount ? Math.min(100, Math.round(current / goal.targetAmount * 100)) : 0; return <article key={goal.id}><div><strong>{goal.name}</strong><span>{goal.targetAmount ? percent + "%" : "Atur target"}</span></div><div className="progressTrack"><i style={{ width: percent + "%" }} /></div><small>{rupiah.format(current)}{goal.targetAmount ? " dari " + rupiah.format(goal.targetAmount) : " terkumpul"}</small></article>; })}</div> : <div className="goalSnapshotEmpty"><strong>Belum ada tujuan lain.</strong><p>Tambahkan emas, pensiun, pendidikan, rumah, atau tujuan personal lainnya.</p><button className="secondary" type="button" onClick={onOpen}>Tambah tujuan</button></div>}</section>;
}
`;

replaceBlock(
  /function GoalSnapshot\([\s\S]*?(?=\nfunction BudgetSnapshot)/,
  goalSnapshot,
  "goalSnapshotOther",
  "goal snapshot"
);

const budgetSnapshot = `
function BudgetSnapshot({ plan, transactions, onBudget }: { plan?: BudgetPlan; transactions: FinanceTransaction[]; onBudget: () => void }) {
  if (!plan) return <section className="card emptyBudgetCard"><div><span className="eyebrow">RENCANA BULAN INI</span><h2>Belum ada pembagian anggaran.</h2><p>Masukkan pemasukan, lalu Atlas memberi rekomendasi awal yang tetap bisa kamu ubah.</p></div><button className="secondary" type="button" onClick={onBudget}>Buat rencana</button></section>;
  const spent = transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const allocatedIn = transactions.filter((item) => item.type === "allocation" && item.allocationAction !== "withdrawal").reduce((sum, item) => sum + item.amount, 0);
  const allocatedOut = transactions.filter((item) => item.type === "allocation" && item.allocationAction === "withdrawal").reduce((sum, item) => sum + item.amount, 0);
  const directed = Math.max(0, allocatedIn - allocatedOut);
  const used = spent + directed;
  return <section className="card budgetSnapshot"><div className="budgetSnapshotTop"><div><span className="eyebrow">RENCANA BULAN INI</span><h2>{rupiah.format(plan.monthlyIncome)}</h2></div><button type="button" onClick={onBudget}>Atur ulang</button></div><div className="budgetSnapshotNumbers"><p><span>Pengeluaran yang benar-benar habis</span><strong>{rupiah.format(spent)}</strong></p><p><span>Dana yang dipindahkan ke tujuan</span><strong>{rupiah.format(directed)}</strong></p><p><span>Belum diberi tugas</span><strong>{rupiah.format(Math.max(0, plan.monthlyIncome - used))}</strong></p></div><div className="budgetMiniGrid">{plan.allocations.map((allocation) => { const limit = plan.monthlyIncome * allocation.percent / 100; const bucketSpent = transactions.filter((item) => item.type === "expense" && item.budgetBucket === allocation.bucket).reduce((sum, item) => sum + item.amount, 0); const bucketAllocatedIn = transactions.filter((item) => item.type === "allocation" && item.allocationAction !== "withdrawal" && item.budgetBucket === allocation.bucket).reduce((sum, item) => sum + item.amount, 0); const bucketAllocatedOut = transactions.filter((item) => item.type === "allocation" && item.allocationAction === "withdrawal" && item.budgetBucket === allocation.bucket).reduce((sum, item) => sum + item.amount, 0); const bucketDirected = Math.max(0, bucketAllocatedIn - bucketAllocatedOut); const actual = bucketSpent + bucketDirected; const percent = limit ? Math.min(100, Math.round(actual / limit * 100)) : 0; const detail = bucketSpent > 0 && bucketDirected > 0 ? "Dipakai " + rupiah.format(bucketSpent) + " · dialokasikan " + rupiah.format(bucketDirected) : bucketDirected > 0 ? "Dialokasikan " + rupiah.format(bucketDirected) : "Dipakai " + rupiah.format(bucketSpent); return <article key={allocation.bucket}><div><span>{allocation.bucket}</span><strong>{allocation.percent}%</strong></div><div className="progressTrack"><i style={{ width: percent + "%" }} /></div><small>{detail} · batas {rupiah.format(limit)}</small></article>; })}</div></section>;
}
`;

replaceBlock(
  /function BudgetSnapshot\([\s\S]*?(?=\nfunction Record)/,
  budgetSnapshot,
  "Pengeluaran yang benar-benar habis",
  "budget snapshot"
);

const transactionList = `
function TransactionList({ transactions, goals, onDelete }: { transactions: FinanceTransaction[]; goals: FinancialGoal[]; onDelete?: (id: string) => Promise<void> }) {
  if (!transactions.length) return <div className="empty atlasEmpty">Belum ada jejak di sini. Satu catatan kecil sudah cukup untuk mulai.</div>;
  return <div className="list atlasList">{transactions.map((item) => { const awareness = awarenessOptions.find((option) => option.value === item.awareness)?.label ?? item.awareness; const goal = goals.find((candidate) => candidate.id === item.goalId); const label = item.type === "income" ? "Pemasukan" : item.type === "expense" ? awareness : item.allocationAction === "withdrawal" ? "Diambil dari tujuan" : "Dialokasikan ke tujuan"; const sign = item.type === "income" ? "+" : item.type === "expense" ? "−" : item.allocationAction === "withdrawal" ? "←" : "→"; return <article key={item.id}><div><h3>{item.note || item.activity}<span>{label}</span></h3><p>{new Date(item.date + "T00:00:00").toLocaleDateString("id-ID")} · {goal?.name ?? item.category}</p>{item.type !== "allocation" && <small>Berkaitan dengan: {item.beneficiaries.join(", ")}</small>}{item.type === "allocation" && <small>Ini perpindahan aset, bukan pengeluaran konsumsi.</small>}</div><div className="value"><strong className={item.type}>{sign} {rupiah.format(item.amount)}</strong>{onDelete && <button type="button" onClick={() => void onDelete(item.id)}>Hapus</button>}</div></article>; })}</div>;
}
`;

replaceBlock(
  /function TransactionList\([\s\S]*?(?=\nfunction Nav)/,
  transactionList,
  "Ini perpindahan aset, bukan pengeluaran konsumsi.",
  "transaction list"
);

if (changed) await writeFile(appPath, source, "utf8");
console.log("Atlas goal and allocation clarity ready");
