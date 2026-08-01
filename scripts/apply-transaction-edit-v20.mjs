import { readFile, writeFile } from "node:fs/promises";

async function edit(relativePath, transform) {
  const path = new URL(`../${relativePath}`, import.meta.url);
  const source = await readFile(path, "utf8");
  const next = transform(source);
  if (next !== source) await writeFile(path, next, "utf8");
}

await edit("src/domain/financeCatalog.ts", (input) => {
  let source = input;

  source = source.replace(
`  {
    name: "Dana darurat dan perlindungan",
    bucket: "Dana darurat dan perlindungan",
    activities: ["Dana darurat", "Asuransi kesehatan", "Asuransi jiwa", "Proteksi aset", "Dana kesehatan", "Dana kehilangan penghasilan"]
  },
  {
    name: "Tujuan dan investasi",
    bucket: "Tujuan masa depan",
    activities: ["Dana pendidikan", "Dana tempat tinggal", "Dana kendaraan", "Dana pensiun", "Dana ibadah", "Dana liburan", "Investasi sesuai tujuan", "Tabungan tujuan lainnya"]
  },`,
`  {
    name: "Premi dan perlindungan",
    bucket: "Dana darurat dan perlindungan",
    activities: ["Premi asuransi kesehatan", "Premi asuransi jiwa", "Premi proteksi aset", "Biaya perlindungan lainnya"]
  },`
  );

  return source;
});

await edit("src/App.tsx", (input) => {
  let source = input;

  if (!source.includes("const [editingTransaction, setEditingTransaction]")) {
    const anchor = '  const [message, setMessage] = useState("");';
    if (!source.includes(anchor)) throw new Error("Atlas edit state anchor missing");
    source = source.replace(anchor, `${anchor}\n  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);`);
  }

  if (!source.includes("onCreateGoldGoal={async () =>")) {
    const anchor = `            plan={currentPlan}\n            monthlyTransactions={monthlyTransactions}\n            onOpenGoals={openGoals}\n            onCancel={() => setScreen("home")}`;
    if (!source.includes(anchor)) throw new Error("Atlas record mount anchor missing");
    const replacement = `            plan={currentPlan}\n            monthlyTransactions={monthlyTransactions}\n            initialTransaction={editingTransaction ?? undefined}\n            onCreateGoldGoal={async () => {\n              const existing = finance.goals.find((goal) => goal.type === "gold" && !goal.isArchived);\n              if (existing) return existing.id;\n              const timestamp = new Date().toISOString();\n              const goal: FinancialGoal = { id: crypto.randomUUID(), name: "Emas rutin", type: "gold", targetAmount: 0, initialAmount: 0, isArchived: false, createdAt: timestamp, updatedAt: timestamp };\n              await persist({ ...finance, goals: [goal, ...finance.goals] });\n              setMessage("Tujuan Emas rutin sudah dibuat dan siap dipilih.");\n              return goal.id;\n            }}\n            onOpenGoals={() => { setEditingTransaction(null); openGoals(); }}\n            onCancel={() => { setEditingTransaction(null); setScreen("home"); }}`;
    source = source.replace(anchor, replacement);
  }

  if (!source.includes("editingTransaction ? finance.transactions.map")) {
    const anchor = "transactions: [transaction, ...finance.transactions]";
    if (!source.includes(anchor)) throw new Error("Atlas transaction persistence anchor missing");
    source = source.replace(anchor, "transactions: editingTransaction ? finance.transactions.map((item) => item.id === editingTransaction.id ? transaction : item) : [transaction, ...finance.transactions]");
  }

  if (!source.includes('setEditingTransaction(null);\n              if (transaction.type === "income"')) {
    const anchor = '              if (transaction.type === "income" && !currentPlan) {';
    if (!source.includes(anchor)) throw new Error("Atlas transaction edit cleanup anchor missing");
    source = source.replace(anchor, `              const wasEditing = Boolean(editingTransaction);\n              setEditingTransaction(null);\n              if (transaction.type === "income" && !currentPlan && !wasEditing) {`);
  }

  if (!source.includes('wasEditing ? "Perubahan transaksi sudah disimpan."')) {
    const anchor = '                setMessage(transaction.type === "allocation" ? "Pergerakan dana tersimpan dan tracker tujuan sudah diperbarui." : getGuidanceMode(finance.financialProfile?.budgetStyle).savedMessage);';
    if (!source.includes(anchor)) throw new Error("Atlas transaction edit message anchor missing");
    source = source.replace(anchor, '                setMessage(wasEditing ? "Perubahan transaksi sudah disimpan." : transaction.type === "allocation" ? "Pergerakan dana tersimpan dan tracker tujuan sudah diperbarui." : getGuidanceMode(finance.financialProfile?.budgetStyle).savedMessage);');
  }

  if (!source.includes("onEdit={(transaction) =>")) {
    const anchor = '<History transactions={finance.transactions} goals={finance.goals} onBack={() => setScreen("home")} onDelete={(id) => persist({ ...finance, transactions: finance.transactions.filter((item) => item.id !== id) })} />';
    if (!source.includes(anchor)) throw new Error("Atlas history mount anchor missing");
    source = source.replace(anchor, '<History transactions={finance.transactions} goals={finance.goals} onBack={() => setScreen("home")} onEdit={(transaction) => { setEditingTransaction(transaction); setScreen("record"); }} onDelete={(id) => persist({ ...finance, transactions: finance.transactions.filter((item) => item.id !== id) })} />');
  }

  if (!source.includes("historyEditReady")) {
    const historyPattern = /function History\([\s\S]*?(?=\nfunction MySpace)/;
    if (!historyPattern.test(source)) throw new Error("Atlas History function anchor missing");
    const history = `function History({ transactions, goals, onDelete, onEdit, onBack }: { transactions: FinanceTransaction[]; goals: FinancialGoal[]; onDelete: (id: string) => Promise<void>; onEdit: (transaction: FinanceTransaction) => void; onBack: () => void }) {
  const historyEditReady = true;
  const [query, setQuery] = useState("");
  const filtered = transactions.filter((item) => \`${'${item.note} ${item.category} ${item.activity} ${item.beneficiaries.join(" ")}'}\`.toLowerCase().includes(query.toLowerCase()));
  return <section><div className="heading atlasSectionHeading"><div><span className="eyebrow">JEJAK KEUANGAN</span><h2>Semua pergerakan uang</h2></div><button type="button" onClick={onBack}>Kembali</button></div><input className="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari kategori, tujuan, orang, atau catatan" /><TransactionList transactions={filtered} goals={goals} onEdit={onEdit} onDelete={onDelete} /></section>;
}`;
    source = source.replace(historyPattern, history);
  }

  if (!source.includes("initialTransaction, onCreateGoldGoal")) {
    const recordPattern = /function Record\([\s\S]*?(?=\nfunction PlanCenter)/;
    if (!recordPattern.test(source)) throw new Error("Atlas Record function anchor missing");
    const record = `function Record({ profileName, members, customCategories, goals, plan, monthlyTransactions, initialTransaction, onCreateGoldGoal, onOpenGoals, onCancel, onSave }: { profileName: string; members: string[]; customCategories: Record<string, string[]>; goals: FinancialGoal[]; plan?: BudgetPlan; monthlyTransactions: FinanceTransaction[]; initialTransaction?: FinanceTransaction; onCreateGoldGoal: () => Promise<string>; onOpenGoals: () => void; onCancel: () => void; onSave: (result: { transaction: FinanceTransaction; newMembers?: string[]; customCategory?: string; customActivity?: string }) => Promise<void> }) {
  const initialCategoryIsCustom = Boolean(initialTransaction?.type === "expense" && !expenseCategories.some((item) => item.name === initialTransaction.category));
  const originalActivities = initialTransaction?.type === "expense" ? getActivities(initialTransaction.category, customCategories) : [];
  const initialActivityIsCustom = Boolean(initialTransaction?.type === "expense" && !originalActivities.includes(initialTransaction.activity));
  const [type, setType] = useState<TransactionType>(initialTransaction?.type ?? "expense");
  const [amount, setAmount] = useState(initialTransaction ? String(initialTransaction.amount) : "");
  const [date, setDate] = useState(initialTransaction?.date ?? localDateInputValue());
  const [beneficiaries, setBeneficiaries] = useState<string[]>(initialTransaction?.beneficiaries?.length ? initialTransaction.beneficiaries : [members[0] ?? profileName]);
  const [newMember, setNewMember] = useState("");
  const [addedMembers, setAddedMembers] = useState<string[]>([]);
  const [category, setCategory] = useState(initialCategoryIsCustom ? "Kategori lainnya…" : initialTransaction?.category ?? expenseCategories[0].name);
  const [customCategory, setCustomCategory] = useState(initialCategoryIsCustom ? initialTransaction?.category ?? "" : "");
  const [activity, setActivity] = useState(initialActivityIsCustom ? "Aktivitas lainnya…" : initialTransaction?.activity ?? expenseCategories[0].activities[0]);
  const [customActivity, setCustomActivity] = useState(initialActivityIsCustom ? initialTransaction?.activity ?? "" : "");
  const [awareness, setAwareness] = useState<Awareness>(initialTransaction?.awareness ?? "Need");
  const [goalId, setGoalId] = useState(initialTransaction?.goalId ?? goals[0]?.id ?? "");
  const [allocationAction, setAllocationAction] = useState<AllocationAction>(initialTransaction?.allocationAction ?? "deposit");
  const [note, setNote] = useState(initialTransaction?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [creatingGold, setCreatingGold] = useState(false);

  const availableMembers = Array.from(new Set([...members, ...addedMembers]));
  const categoryList = [...expenseCategories.map((item) => item.name), ...Object.keys(customCategories)];
  const selectedCategory = category === "Kategori lainnya…" ? customCategory.trim() : category;
  const activities = type === "expense" ? getActivities(selectedCategory, customCategories) : [];
  const selectedActivity = activity === "Aktivitas lainnya…" ? customActivity.trim() : activity;
  const awarenessInfo = awarenessOptions.find((item) => item.value === awareness)!;
  const selectedGoal = goals.find((goal) => goal.id === goalId);
  const bucket = type === "expense" ? inferBudgetBucket(selectedCategory, awareness) : type === "allocation" ? bucketForGoal(selectedGoal) : undefined;
  const plannedBucketPercent = bucket ? (plan?.allocations.find((item) => item.bucket === bucket)?.percent ?? 0) : 0;
  const plannedBucketLimit = plan && bucket ? plan.monthlyIncome * plannedBucketPercent / 100 : 0;
  const currentBucketUse = bucket ? monthlyTransactions.filter((item) => item.id !== initialTransaction?.id && item.budgetBucket === bucket && (item.type === "expense" || (item.type === "allocation" && item.allocationAction !== "withdrawal"))).reduce((total, item) => total + item.amount, 0) : 0;
  const projectedBucketUse = currentBucketUse + (Number(amount) || 0);
  const outsideBudget = Boolean(plan && bucket && plannedBucketPercent === 0 && Number(amount) > 0);
  const aboveBudget = Boolean(plan && bucket && plannedBucketLimit > 0 && projectedBucketUse > plannedBucketLimit);
  const hasGoldGoal = goals.some((goal) => goal.type === "gold" && !goal.isArchived);

  function changeType(next: TransactionType) {
    setType(next);
    if (next === "expense") { setCategory(expenseCategories[0].name); setActivity(expenseCategories[0].activities[0]); setAwareness("Need"); }
    if (next === "income") setCategory(incomeCategories[0]);
    if (next === "allocation" && goals[0]) setGoalId(goals[0].id);
  }
  function changeCategory(value: string) { setCategory(value); setCustomActivity(""); if (value === "Kategori lainnya…") setActivity("Aktivitas lainnya…"); else setActivity(getActivities(value, customCategories)[0] ?? "Aktivitas lainnya…"); }
  function toggleBeneficiary(value: string) { setBeneficiaries((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]); }
  function addRelatedParty() { const value = newMember.trim(); if (!value) return; setAddedMembers((current) => Array.from(new Set([...current, value]))); setBeneficiaries((current) => Array.from(new Set([...current, value]))); setNewMember(""); }
  async function createGoldGoal() { setCreatingGold(true); try { const id = await onCreateGoldGoal(); setGoalId(id); setType("allocation"); } finally { setCreatingGold(false); } }
  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!value || (type !== "allocation" && !beneficiaries.length)) return;
    if (type === "allocation" && !selectedGoal) return;
    setBusy(true);
    try {
      const timestamp = new Date().toISOString();
      const transaction: FinanceTransaction = {
        id: initialTransaction?.id ?? crypto.randomUUID(),
        type,
        amount: value,
        date,
        beneficiaries: type === "allocation" ? [profileName] : beneficiaries,
        category: type === "allocation" ? "Tujuan keuangan" : selectedCategory,
        activity: type === "allocation" ? \`${'${allocationAction === "withdrawal" ? "Penarikan dari" : "Setoran ke"} ${selectedGoal?.name}'}\` : type === "income" ? selectedCategory : selectedActivity,
        awareness: type === "income" ? "Fixed" : type === "allocation" ? (selectedGoal?.type === "debt" ? "Payoff" : selectedGoal?.type === "emergency" ? "Protection" : "Future") : awareness,
        budgetBucket: bucket,
        goalId: type === "allocation" ? selectedGoal?.id : undefined,
        allocationAction: type === "allocation" ? allocationAction : undefined,
        note,
        createdAt: initialTransaction?.createdAt ?? timestamp,
        updatedAt: timestamp
      };
      await onSave({ transaction, newMembers: addedMembers, customCategory: category === "Kategori lainnya…" ? customCategory.trim() || undefined : undefined, customActivity: activity === "Aktivitas lainnya…" ? customActivity.trim() || undefined : undefined });
    } finally { setBusy(false); }
  }

  return <section className="recordPage"><div className="heading atlasSectionHeading"><div><span className="eyebrow">{initialTransaction ? "PERBAIKI CATATAN" : "CATAT DENGAN SADAR"}</span><h2>{initialTransaction ? "Sesuaikan transaksi ini." : "Uangmu bergerak ke mana?"}</h2><p>Pisahkan uang yang benar-benar habis dari uang yang hanya dipindahkan ke tujuan.</p></div><button type="button" onClick={onCancel}>Batal</button></div><form className="card form atlasForm" onSubmit={submit}>
    <div className="segmented transactionKinds"><button type="button" className={type === "expense" ? "active" : ""} onClick={() => changeType("expense")}>Pengeluaran</button><button type="button" className={type === "income" ? "active" : ""} onClick={() => changeType("income")}>Pemasukan</button><button type="button" className={type === "allocation" ? "active" : ""} onClick={() => changeType("allocation")}>Tujuan</button></div>
    <aside className="movementHelp"><strong>{type === "expense" ? "Uang dipakai" : type === "income" ? "Uang masuk" : "Uang dipindahkan ke tujuan"}</strong><p>{type === "expense" ? "Pilih ini saat uang benar-benar habis untuk makan, tagihan, belanja, atau layanan." : type === "income" ? "Pilih ini saat uang benar-benar sudah masuk dan tersedia." : "Pilih ini untuk dana darurat, emas, pensiun, pendidikan, atau tujuan lain yang masih menjadi asetmu."}</p></aside>
    <label>Nominal<input type="number" inputMode="numeric" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Contoh: 250000" required /></label><label>Tanggal<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
    {type === "allocation" ? <><div className="segmented"><button type="button" className={allocationAction === "deposit" ? "active" : ""} onClick={() => setAllocationAction("deposit")}>Tambahkan ke tujuan</button><button type="button" className={allocationAction === "withdrawal" ? "active" : ""} onClick={() => setAllocationAction("withdrawal")}>Ambil dari tujuan</button></div>{goals.length ? <label>Tujuan alokasi<select value={goalId} onChange={(event) => setGoalId(event.target.value)}>{goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.name}</option>)}</select></label> : <div className="empty atlasEmpty"><p>Belum ada tujuan keuangan.</p><button className="secondary" type="button" onClick={onOpenGoals}>Buat tujuan dahulu</button></div>}{!hasGoldGoal && <button className="secondary quickGoldAction" type="button" disabled={creatingGold} onClick={() => void createGoldGoal()}>{creatingGold ? "Membuat tujuan emas…" : "+ Tambah tujuan Emas rutin"}</button>}<div className="allocationExplanation"><strong>{selectedGoal?.name ?? "Pilih tujuan"}</strong><p>Atlas akan mencatatnya sebagai perpindahan aset, bukan pengeluaran konsumsi.</p></div><div className="bucketPreview"><span>Masuk ke pos anggaran</span><strong>{bucket}</strong></div></> : <>
      <fieldset className="beneficiaryField"><legend>Transaksi ini berkaitan dengan siapa?</legend><p>Pilih “Saya” saja bila transaksi hanya berkaitan denganmu. Kamu boleh memilih lebih dari satu orang.</p><div className="chipGroup">{availableMembers.map((member) => <button key={member} className={beneficiaries.includes(member) ? "chip active" : "chip"} type="button" onClick={() => toggleBeneficiary(member)}>{beneficiaries.includes(member) ? "✓ " : "+ "}{member}</button>)}</div><div className="inlineAdd"><input value={newMember} onChange={(event) => setNewMember(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addRelatedParty(); } }} placeholder="Tambah orang atau pihak lain" /><button className="secondary" type="button" disabled={!newMember.trim()} onClick={addRelatedParty}>Tambahkan</button></div>{addedMembers.length > 0 && <small className="relatedPartyConfirmation"><AtlasIcon name="check" size={14} />{addedMembers.length} pihak baru sudah ditambahkan dan dipilih.</small>}</fieldset>
      <label>{type === "income" ? "Sumber pemasukan" : "Kategori pengeluaran"}<select value={category} onChange={(event) => changeCategory(event.target.value)}>{(type === "income" ? incomeCategories : categoryList).map((item) => <option key={item}>{item}</option>)}{type === "expense" && <option>Kategori lainnya…</option>}</select></label>{type === "expense" && category === "Kategori lainnya…" && <label>Nama kategori baru<input value={customCategory} onChange={(event) => setCustomCategory(event.target.value)} required /></label>}{type === "expense" && <><label>Aktivitas pengeluaran<select value={activity} onChange={(event) => setActivity(event.target.value)}>{activities.map((item) => <option key={item}>{item}</option>)}<option>Aktivitas lainnya…</option></select></label>{activity === "Aktivitas lainnya…" && <label>Nama aktivitas baru<input value={customActivity} onChange={(event) => setCustomActivity(event.target.value)} required /></label>}<label>Makna transaksi<select value={awareness} onChange={(event) => setAwareness(event.target.value as Awareness)}>{awarenessOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><aside className="awarenessHelp"><strong>{awarenessInfo.label}</strong><p>{awarenessInfo.description}</p><small>{awarenessInfo.example}</small></aside><div className="bucketPreview"><span>Masuk ke pos anggaran</span><strong>{bucket}</strong></div></>}</>}
    {(outsideBudget || aboveBudget) && <aside className="recordBudgetWarning" role="status"><AtlasIcon name="insight" size={18} /><div><strong>{outsideBudget ? "Pos ini belum masuk anggaran bulan ini." : "Catatan ini akan melewati batas pos."}</strong><p>{outsideBudget ? \`Pergerakan tetap boleh disimpan, tetapi ${'${bucket}'} masih memiliki rencana Rp0. Setelah menyimpan, tinjau anggaran agar tujuan ini mendapat porsi yang nyata.\` : \`Setelah catatan ini, penggunaan ${'${bucket}'} menjadi ${'${rupiah.format(projectedBucketUse)}'} dari rencana ${'${rupiah.format(plannedBucketLimit)}'}.\`}</p></div></aside>}
    <label>Catatan<input value={note} onChange={(event) => setNote(event.target.value)} maxLength={120} placeholder={type === "allocation" ? "Contoh: setoran rutin bulan ini" : "Tambahkan keterangan bila perlu"} /></label><button className="primary" disabled={busy || (type === "allocation" && !selectedGoal)}>{busy ? "Menyimpan…" : initialTransaction ? "Simpan perubahan" : type === "income" ? "Simpan pemasukan" : type === "expense" ? "Simpan pengeluaran" : allocationAction === "deposit" ? "Simpan ke tujuan" : "Simpan pengambilan dana"}</button>
  </form></section>;
}`;
    source = source.replace(recordPattern, record);
  }

  if (!source.includes("transactionEditActions")) {
    const listPattern = /function TransactionList\([\s\S]*?(?=\nfunction Nav)/;
    if (!listPattern.test(source)) throw new Error("Atlas TransactionList anchor missing");
    const list = `function TransactionList({ transactions, goals, onEdit, onDelete }: { transactions: FinanceTransaction[]; goals: FinancialGoal[]; onEdit?: (transaction: FinanceTransaction) => void; onDelete?: (id: string) => Promise<void> }) {
  if (!transactions.length) return <div className="empty atlasEmpty">Belum ada jejak di sini. Satu catatan kecil sudah cukup untuk mulai.</div>;
  return <div className="list atlasList">{transactions.map((item) => { const awareness = awarenessOptions.find((option) => option.value === item.awareness)?.label ?? item.awareness; const goal = goals.find((candidate) => candidate.id === item.goalId); const label = item.type === "income" ? "Pemasukan" : item.type === "expense" ? awareness : item.allocationAction === "withdrawal" ? "Diambil dari tujuan" : "Dialokasikan ke tujuan"; const sign = item.type === "income" ? "+" : item.type === "expense" ? "−" : item.allocationAction === "withdrawal" ? "←" : "→"; return <article key={item.id}><div><h3>{item.note || item.activity}<span>{label}</span></h3><p>{new Date(item.date + "T00:00:00").toLocaleDateString("id-ID")} · {goal?.name ?? item.category}</p>{item.type !== "allocation" && <small>Berkaitan dengan: {item.beneficiaries.join(", ")}</small>}{item.type === "allocation" && <small>Ini perpindahan aset, bukan pengeluaran konsumsi.</small>}</div><div className="value"><strong className={item.type}>{sign} {rupiah.format(item.amount)}</strong>{(onEdit || onDelete) && <div className="transactionEditActions">{onEdit && <button type="button" onClick={() => onEdit(item)}>Edit</button>}{onDelete && <button type="button" onClick={() => window.confirm("Hapus transaksi ini?") && void onDelete(item.id)}>Hapus</button>}</div>}</div></article>; })}</div>;
}`;
    source = source.replace(listPattern, list);
  }

  return source;
});

console.log("Atlas transaction editing, gold quick goal, and clear movement paths ready");
