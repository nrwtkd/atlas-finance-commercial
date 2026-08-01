import { readFile, writeFile } from "node:fs/promises";

async function edit(relativePath, transform) {
  const path = new URL(`../${relativePath}`, import.meta.url);
  const source = await readFile(path, "utf8");
  const next = transform(source);
  if (next !== source) await writeFile(path, next, "utf8");
}

await edit("src/types.ts", (input) => {
  if (input.includes('| "Investasi dan pensiun"')) return input;
  const anchor = '  | "Tujuan masa depan"\n';
  if (!input.includes(anchor)) throw new Error("Atlas investment bucket type anchor missing");
  return input.replace(anchor, `${anchor}  | "Investasi dan pensiun"\n`);
});

await edit("src/domain/financeCatalog.ts", (input) => {
  let source = input;

  if (!source.includes('  "Investasi dan pensiun",')) {
    const anchor = '  "Tujuan masa depan",\n';
    if (!source.includes(anchor)) throw new Error("Atlas investment bucket catalog anchor missing");
    source = source.replace(anchor, `${anchor}  "Investasi dan pensiun",\n`);
  }

  if (!source.includes('name: "Investasi dan pensiun"')) {
    const anchor = `  {
    name: "Keinginan dan gaya hidup",
    bucket: "Keinginan dan gaya hidup",`;
    if (!source.includes(anchor)) throw new Error("Atlas investment expense category anchor missing");
    const block = `  {
    name: "Investasi dan pensiun",
    bucket: "Investasi dan pensiun",
    activities: ["Pembelian Logam Mulia atau emas", "Setoran DPLK", "Investasi reksa dana", "Investasi saham", "Investasi lainnya"]
  },
`;
    source = source.replace(anchor, `${block}${anchor}`);
  }

  if (!source.includes('category === "Investasi dan pensiun"')) {
    const anchor = 'export function inferBudgetBucket(category: string, awareness: Awareness): BudgetBucket {\n';
    if (!source.includes(anchor)) throw new Error("Atlas investment inference anchor missing");
    source = source.replace(anchor, `${anchor}  if (category === "Investasi dan pensiun") return "Investasi dan pensiun";\n`);
  }

  if (!source.includes('budgetScenarioInvestmentSplit')) {
    source = source.replace(
      /\{ bucket: "Tujuan masa depan", percent: (\d+) \},/g,
      (_match, raw) => {
        const original = Number(raw);
        const goalPercent = Math.ceil(original / 2);
        const investmentPercent = original - goalPercent;
        return `{ bucket: "Tujuan masa depan", percent: ${goalPercent} },\n      { bucket: "Investasi dan pensiun", percent: ${investmentPercent} },`;
      }
    );
    source += '\n// budgetScenarioInvestmentSplit\n';
  }

  return source;
});

await edit("src/domain/personalization.ts", (input) => {
  let source = input;
  if (!source.includes('"Investasi dan pensiun": 5')) {
    source = source.replace(
      '  "Tujuan masa depan": 10,\n',
      '  "Tujuan masa depan": 5,\n  "Investasi dan pensiun": 5,\n'
    );
    source = source.replace(
      '    values["Tujuan masa depan"] = 7;\n',
      '    values["Tujuan masa depan"] = 4;\n    values["Investasi dan pensiun"] = 3;\n'
    );
    source = source.replace(
      '    values["Tujuan masa depan"] = 8;\n',
      '    values["Tujuan masa depan"] = 4;\n    values["Investasi dan pensiun"] = 4;\n'
    );
    source = source.replace(
      '    values["Tujuan masa depan"] = 5;\n',
      '    values["Tujuan masa depan"] = 3;\n    values["Investasi dan pensiun"] = 2;\n'
    );
  }
  return source;
});

await edit("src/App.tsx", (input) => {
  let source = input;

  if (!source.includes("const migratedInvestmentTransactions")) {
    const pattern = /(const transactions = \(input\.transactions \?\? \[\]\)\.map\([\s\S]*?\n  \}\);)(\n\n  return \{)/;
    if (!pattern.test(source)) throw new Error("Atlas investment migration anchor missing");
    source = source.replace(pattern, `$1

  const migratedInvestmentTransactions = transactions.map((item) => {
    const linkedGoal = goals.find((goal) => goal.id === item.goalId);
    if (item.type !== "allocation" || (linkedGoal?.type !== "gold" && linkedGoal?.type !== "retirement")) return item;
    return {
      ...item,
      type: "expense" as const,
      category: "Investasi dan pensiun",
      activity: linkedGoal.type === "gold" ? "Pembelian Logam Mulia atau emas" : "Setoran DPLK",
      awareness: "Future" as const,
      budgetBucket: "Investasi dan pensiun" as const,
      goalId: undefined,
      allocationAction: undefined
    };
  });$2`);
    source = source.replace(
      '    transactions,\n    lastUpdatedAt:',
      '    transactions: migratedInvestmentTransactions,\n    lastUpdatedAt:'
    );
  }

  source = source.replace(
    'const expense = monthlyTransactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);',
    'const invested = monthlyTransactions.filter((item) => item.type === "expense" && item.budgetBucket === "Investasi dan pensiun").reduce((sum, item) => sum + item.amount, 0);\n    const expense = monthlyTransactions.filter((item) => item.type === "expense" && item.budgetBucket !== "Investasi dan pensiun").reduce((sum, item) => sum + item.amount, 0);'
  );
  source = source.replace(
    '      expense,\n      allocatedIn,',
    '      expense,\n      invested,\n      allocatedIn,'
  );
  source = source.replace(
    '      available: income - expense - allocatedIn + allocatedOut,',
    '      available: income - expense - invested - allocatedIn + allocatedOut,'
  );

  source = source.replaceAll(
    'stats: { count: number; income: number; expense: number; allocatedIn: number;',
    'stats: { count: number; income: number; expense: number; invested: number; allocatedIn: number;'
  );
  source = source.replace(
    '<p><small>Pengeluaran</small>{rupiah.format(stats.expense)}</p><p><small>Dialokasikan</small>{rupiah.format(stats.allocatedIn)}</p>',
    '<p><small>Pengeluaran</small>{rupiah.format(stats.expense)}</p><p><small>Investasi & pensiun</small>{rupiah.format(stats.invested)}</p><p><small>Tersimpan ke tujuan</small>{rupiah.format(stats.allocatedIn)}</p>'
  );

  source = source.replaceAll(
    'goals.filter((goal) => !goal.isArchived && goal.type !== "emergency")',
    'goals.filter((goal) => !goal.isArchived && goal.type !== "emergency" && goal.type !== "gold" && goal.type !== "retirement")'
  );
  source = source.replaceAll(
    'goals.filter((goal) => !goal.isArchived).map((goal) =>',
    'goals.filter((goal) => !goal.isArchived && goal.type !== "gold" && goal.type !== "retirement").map((goal) =>'
  );
  source = source.replace(
    '{goalPresets.map((item) => <option key={item.type} value={item.type}>{item.label}</option>)}',
    '{goalPresets.filter((item) => item.type !== "gold" && item.type !== "retirement").map((item) => <option key={item.type} value={item.type}>{item.label}</option>)}'
  );
  source = source.replace(
    'function changeCategory(value: string) { setCategory(value); setCustomActivity(""); if (value === "Kategori lainnya…") setActivity("Aktivitas lainnya…"); else setActivity(getActivities(value, customCategories)[0] ?? "Aktivitas lainnya…"); }',
    'function changeCategory(value: string) { setCategory(value); setCustomActivity(""); if (value === "Investasi dan pensiun") setAwareness("Future"); if (value === "Kategori lainnya…") setActivity("Aktivitas lainnya…"); else setActivity(getActivities(value, customCategories)[0] ?? "Aktivitas lainnya…"); }'
  );

  const budgetPlanner = `function BudgetPlanner({ plan, profile, actualIncome, transactions, onSave }: { plan?: BudgetPlan; profile: FinancialProfile; actualIncome: number; transactions: FinanceTransaction[]; onSave: (plan: BudgetPlan) => Promise<void> }) {
  const recommendation = getPersonalizedBudgetRecommendation(profile);
  const [income, setIncome] = useState(String(plan?.monthlyIncome || actualIncome || ""));
  const [scenario, setScenario] = useState<BudgetScenario>(plan?.scenario ?? recommendation.scenario);
  const [allocations, setAllocations] = useState<BudgetAllocation[]>(plan?.allocations ?? recommendation.allocations.map((item) => ({ ...item })));
  const [lastEditedBucket, setLastEditedBucket] = useState<BudgetBucket | null>(null);
  const [busy, setBusy] = useState(false);
  const numericIncome = Number(income) || 0;
  const scenarioInfo = getScenario(scenario);
  const amountFor = (allocation: BudgetAllocation) => numericIncome ? Math.round(numericIncome * allocation.percent / 100) : 0;
  const totalAmount = allocations.reduce((sum, item) => sum + amountFor(item), 0);
  const totalPercent = numericIncome ? totalAmount / numericIncome * 100 : 0;
  const difference = numericIncome - totalAmount;
  const overBudget = difference < -1;
  const completeBudget = numericIncome > 0 && Math.abs(difference) <= 1;

  function selectScenario(value: BudgetScenario) {
    setScenario(value);
    setAllocations(getScenario(value).allocations.map((item) => ({ ...item })));
    setLastEditedBucket(null);
  }
  function updatePercent(bucket: BudgetBucket, raw: string) {
    const percent = Math.max(0, Number(raw) || 0);
    setLastEditedBucket(bucket);
    setAllocations((current) => current.map((item) => item.bucket === bucket ? { ...item, percent } : item));
  }
  function updateAmount(bucket: BudgetBucket, raw: string) {
    const amount = Math.max(0, Number(raw) || 0);
    const percent = numericIncome ? amount / numericIncome * 100 : 0;
    setLastEditedBucket(bucket);
    setAllocations((current) => current.map((item) => item.bucket === bucket ? { ...item, percent } : item));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!completeBudget || overBudget) return;
    setBusy(true);
    try {
      const timestamp = new Date().toISOString();
      await onSave({ id: plan?.id ?? crypto.randomUUID(), month: monthKey(), monthlyIncome: numericIncome, scenario, allocations, createdAt: plan?.createdAt ?? timestamp, updatedAt: timestamp });
    } finally { setBusy(false); }
  }

  return <form className="budgetLayout responsiveBudget" onSubmit={submit}>
    <section className="card budgetSetupCard">
      <label>Pemasukan yang akan direncanakan<input type="number" inputMode="numeric" min="1" value={income} onChange={(event) => setIncome(event.target.value)} required /></label>
      {actualIncome > 0 && <p className="fieldHint">Pemasukan tercatat bulan ini: <strong>{rupiah.format(actualIncome)}</strong></p>}
      <aside className="personalBudgetRecommendation"><span className="eyebrow">REKOMENDASI BERDASARKAN KONDISIMU</span><h3>{recommendation.label}</h3><p>{recommendation.description}</p><ul>{recommendation.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul><span className="emergencyHint">Gambaran target dana darurat: {recommendation.emergencyTargetMonths} bulan kebutuhan pokok</span></aside>
      <label>Kondisi yang paling mendekati saat ini<select value={scenario} onChange={(event) => selectScenario(event.target.value as BudgetScenario)}>{budgetScenarios.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <aside className="scenarioNote"><strong>{scenarioInfo.label}</strong><p>{scenarioInfo.description}</p></aside>

      <div className="responsiveAllocationHeader"><span>Pos anggaran</span><span>Persen</span><span>Nominal pasti</span></div>
      <div className="responsiveAllocationEditor">{allocations.map((allocation) => {
        const amount = amountFor(allocation);
        const rowOver = overBudget && allocation.bucket === lastEditedBucket;
        return <div className={rowOver ? "responsiveAllocationRow isOver" : "responsiveAllocationRow"} key={allocation.bucket}>
          <strong>{allocation.bucket}</strong>
          <label><span className="mobileOnlyLabel">Persen</span><div className="budgetInputSuffix"><input type="number" min="0" step="0.01" value={Number(allocation.percent.toFixed(4))} onChange={(event) => updatePercent(allocation.bucket, event.target.value)} /><b>%</b></div></label>
          <label><span className="mobileOnlyLabel">Nominal</span><div className="budgetInputPrefix"><b>Rp</b><input type="number" min="0" step="1" disabled={!numericIncome} value={amount || ""} onChange={(event) => updateAmount(allocation.bucket, event.target.value)} /></div></label>
        </div>;
      })}</div>

      <div className={overBudget ? "budgetResponsiveTotal over" : completeBudget ? "budgetResponsiveTotal valid" : "budgetResponsiveTotal remaining"}>
        <div><span>Total rencana</span><strong>{rupiah.format(totalAmount)} · {totalPercent.toFixed(2).replace(".00", "")}%</strong></div>
        <p>{overBudget ? "Melebihi pemasukan sebesar " + rupiah.format(Math.abs(difference)) + ". Kurangi salah satu pos sebelum menyimpan." : completeBudget ? "Seluruh pemasukan sudah diberi tugas." : "Masih ada " + rupiah.format(Math.max(0, difference)) + " yang belum diberi tugas."}</p>
      </div>
      <button className="primary" disabled={busy || !completeBudget || overBudget}>{busy ? "Menyimpan…" : overBudget ? "Kurangi pembagian dahulu" : "Simpan rencana bulan ini"}</button>
    </section>

    <section className="card budgetPreviewCard"><span className="eyebrow">GAMBARAN PEMBAGIAN</span><h3>{numericIncome ? rupiah.format(numericIncome) : "Masukkan pemasukan"}</h3><div className="allocationPreview">{allocations.map((allocation) => { const amount = amountFor(allocation); const actual = transactions.filter((item) => item.budgetBucket === allocation.bucket && (item.type === "expense" || (item.type === "allocation" && item.allocationAction !== "withdrawal"))).reduce((sum, item) => sum + item.amount, 0); return <article key={allocation.bucket}><div><span>{allocation.bucket}</span><strong>{rupiah.format(amount)}</strong></div><small>{allocation.percent.toFixed(2).replace(".00", "")}% · terpakai atau diarahkan {rupiah.format(actual)}</small></article>; })}</div><div className="educationNote"><strong>Persentase dan nominal saling mengikuti.</strong><p>Isi angka yang paling kamu ketahui. Cicilan atau DPLK boleh dimasukkan dalam rupiah pasti; Atlas akan menghitung persentasenya.</p></div></section>
  </form>;
}`;

  const budgetPattern = /function BudgetPlanner\([\s\S]*?(?=\nfunction LearningCenter)/;
  if (!budgetPattern.test(source)) throw new Error("Atlas responsive budget planner anchor missing");
  source = source.replace(budgetPattern, budgetPlanner);

  return source;
});

console.log("Atlas investments separated from cash goals and responsive budget ready");
