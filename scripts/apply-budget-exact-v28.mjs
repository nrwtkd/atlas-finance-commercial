import { readFile, writeFile } from "node:fs/promises";

async function edit(relativePath, transform) {
  const path = new URL(`../${relativePath}`, import.meta.url);
  const source = await readFile(path, "utf8");
  const next = transform(source);
  if (next !== source) await writeFile(path, next, "utf8");
}

await edit("src/types.ts", (input) => {
  const anchor = "export interface BudgetAllocation { bucket: BudgetBucket; percent: number; }";
  if (input.includes("basis?: \"percent\" | \"amount\"")) return input;
  if (!input.includes(anchor)) throw new Error("Atlas exact budget allocation type anchor missing");
  return input.replace(
    anchor,
    "export interface BudgetAllocation { bucket: BudgetBucket; percent: number; amount?: number; basis?: \"percent\" | \"amount\"; }"
  );
});

await edit("src/App.tsx", (input) => {
  let source = input;

  const budgetPlanner = `function BudgetPlanner({ plan, profile, actualIncome, transactions, onSave }: { plan?: BudgetPlan; profile: FinancialProfile; actualIncome: number; transactions: FinanceTransaction[]; onSave: (plan: BudgetPlan) => Promise<void> }) {
  const recommendation = getPersonalizedBudgetRecommendation(profile);
  const [income, setIncome] = useState(String(plan?.monthlyIncome || actualIncome || ""));
  const initialIncome = Number(plan?.monthlyIncome || actualIncome || 0);
  const initialAllocations = (plan?.allocations ?? recommendation.allocations).map((item) => ({
    ...item,
    amount: typeof item.amount === "number" ? item.amount : initialIncome ? Math.round(initialIncome * item.percent / 100) : undefined,
    basis: item.basis ?? "percent" as const
  }));
  const [scenario, setScenario] = useState<BudgetScenario>(plan?.scenario ?? recommendation.scenario);
  const [allocations, setAllocations] = useState<BudgetAllocation[]>(initialAllocations);
  const [lastEditedBucket, setLastEditedBucket] = useState<BudgetBucket | null>(null);
  const [percentDrafts, setPercentDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const numericIncome = Number(income) || 0;
  const scenarioInfo = getScenario(scenario);

  function amountFor(allocation: BudgetAllocation) {
    if (allocation.basis === "amount" && typeof allocation.amount === "number") return Math.max(0, Math.round(allocation.amount));
    return numericIncome ? Math.max(0, Math.round(numericIncome * allocation.percent / 100)) : 0;
  }
  function percentFor(allocation: BudgetAllocation) {
    if (allocation.basis === "amount") return numericIncome ? amountFor(allocation) / numericIncome * 100 : 0;
    return Math.max(0, allocation.percent);
  }
  function formatPercent(value: number) {
    return value.toLocaleString("id-ID", { maximumFractionDigits: 6 });
  }
  function parseLocalizedPercent(raw: string) {
    const cleaned = raw.replace(/[^0-9,.]/g, "").replace(/,/g, ".");
    const firstDot = cleaned.indexOf(".");
    const normalized = firstDot < 0 ? cleaned : cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\\./g, "");
    return Math.max(0, Number(normalized) || 0);
  }

  const totalAmount = allocations.reduce((sum, item) => sum + amountFor(item), 0);
  const totalPercent = numericIncome ? totalAmount / numericIncome * 100 : 0;
  const difference = numericIncome - totalAmount;
  const overBudget = difference < -1;
  const completeBudget = numericIncome > 0 && Math.abs(difference) <= 1;

  function selectScenario(value: BudgetScenario) {
    setScenario(value);
    const next = getScenario(value).allocations.map((item) => ({
      ...item,
      amount: numericIncome ? Math.round(numericIncome * item.percent / 100) : undefined,
      basis: "percent" as const
    }));
    setAllocations(next);
    setLastEditedBucket(null);
    setPercentDrafts({});
  }
  function updatePercent(bucket: BudgetBucket, raw: string) {
    const cleanedDraft = raw.replace(/[^0-9,.]/g, "");
    const percent = parseLocalizedPercent(cleanedDraft);
    setPercentDrafts((current) => ({ ...current, [bucket]: cleanedDraft }));
    setLastEditedBucket(bucket);
    setAllocations((current) => current.map((item) => item.bucket === bucket ? {
      ...item,
      percent,
      amount: numericIncome ? Math.round(numericIncome * percent / 100) : 0,
      basis: "percent"
    } : item));
  }
  function finishPercentEdit(bucket: BudgetBucket) {
    setPercentDrafts((current) => {
      const next = { ...current };
      delete next[bucket];
      return next;
    });
  }
  function updateAmount(bucket: BudgetBucket, raw: string) {
    const amount = Math.max(0, Math.round(Number(raw) || 0));
    const percent = numericIncome ? amount / numericIncome * 100 : 0;
    setLastEditedBucket(bucket);
    setPercentDrafts((current) => {
      const next = { ...current };
      delete next[bucket];
      return next;
    });
    setAllocations((current) => current.map((item) => item.bucket === bucket ? {
      ...item,
      amount,
      percent,
      basis: "amount"
    } : item));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!completeBudget || overBudget) return;
    setBusy(true);
    try {
      const timestamp = new Date().toISOString();
      const savedAllocations = allocations.map((item) => {
        const amount = amountFor(item);
        return {
          ...item,
          amount,
          percent: item.basis === "amount" && numericIncome ? amount / numericIncome * 100 : item.percent,
          basis: item.basis ?? "percent"
        };
      });
      await onSave({ id: plan?.id ?? crypto.randomUUID(), month: monthKey(), monthlyIncome: numericIncome, scenario, allocations: savedAllocations, createdAt: plan?.createdAt ?? timestamp, updatedAt: timestamp });
    } finally { setBusy(false); }
  }

  return <form className="budgetLayout responsiveBudget exactBudget" onSubmit={submit}>
    <section className="card budgetSetupCard">
      <label>Pemasukan yang akan direncanakan<input type="number" inputMode="numeric" min="1" value={income} onChange={(event) => setIncome(event.target.value)} required /></label>
      {actualIncome > 0 && <p className="fieldHint">Pemasukan tercatat bulan ini: <strong>{rupiah.format(actualIncome)}</strong></p>}
      <aside className="personalBudgetRecommendation"><span className="eyebrow">REKOMENDASI BERDASARKAN KONDISIMU</span><h3>{recommendation.label}</h3><p>{recommendation.description}</p><ul>{recommendation.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul><span className="emergencyHint">Gambaran target dana darurat: {recommendation.emergencyTargetMonths} bulan kebutuhan pokok</span></aside>
      <label>Kondisi yang paling mendekati saat ini<select value={scenario} onChange={(event) => selectScenario(event.target.value as BudgetScenario)}>{budgetScenarios.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <aside className="scenarioNote"><strong>{scenarioInfo.label}</strong><p>{scenarioInfo.description}</p></aside>

      <div className="responsiveAllocationHeader"><span>Pos anggaran</span><span>Persen</span><span>Nominal pasti</span></div>
      <div className="responsiveAllocationEditor">{allocations.map((allocation) => {
        const amount = amountFor(allocation);
        const calculatedPercent = percentFor(allocation);
        const rowOver = overBudget && allocation.bucket === lastEditedBucket;
        return <div className={rowOver ? "responsiveAllocationRow isOver" : "responsiveAllocationRow"} key={allocation.bucket}>
          <strong>{allocation.bucket}</strong>
          <label><span className="mobileOnlyLabel">Persen</span><div className="budgetInputSuffix"><input type="text" inputMode="decimal" autoComplete="off" value={percentDrafts[allocation.bucket] ?? formatPercent(calculatedPercent)} onChange={(event) => updatePercent(allocation.bucket, event.target.value)} onBlur={() => finishPercentEdit(allocation.bucket)} aria-label={"Persentase " + allocation.bucket} /><b>%</b></div></label>
          <label><span className="mobileOnlyLabel">Nominal pasti</span><div className="budgetInputPrefix"><b>Rp</b><input type="number" min="0" step="1" inputMode="numeric" disabled={!numericIncome} value={amount || ""} onChange={(event) => updateAmount(allocation.bucket, event.target.value)} aria-label={"Nominal " + allocation.bucket} /></div></label>
          <small className="budgetBasisNote">{allocation.basis === "amount" ? "Nominal menjadi patokan; persentase mengikuti." : "Persentase menjadi patokan; nominal mengikuti."}</small>
        </div>;
      })}</div>

      <div className={overBudget ? "budgetResponsiveTotal over" : completeBudget ? "budgetResponsiveTotal valid" : "budgetResponsiveTotal remaining"}>
        <div><span>Total rencana</span><strong>{rupiah.format(totalAmount)} · {formatPercent(totalPercent)}%</strong></div>
        <p>{overBudget ? "Melebihi pemasukan sebesar " + rupiah.format(Math.abs(difference)) + ". Kurangi salah satu pos sebelum menyimpan." : completeBudget ? "Seluruh pemasukan sudah diberi tugas." : "Masih ada " + rupiah.format(Math.max(0, difference)) + " yang belum diberi tugas."}</p>
      </div>
      <button className="primary" disabled={busy || !completeBudget || overBudget}>{busy ? "Menyimpan…" : overBudget ? "Kurangi pembagian dahulu" : "Simpan rencana bulan ini"}</button>
    </section>

    <section className="card budgetPreviewCard"><span className="eyebrow">GAMBARAN PEMBAGIAN</span><h3>{numericIncome ? rupiah.format(numericIncome) : "Masukkan pemasukan"}</h3><div className="allocationPreview">{allocations.map((allocation) => { const amount = amountFor(allocation); const percent = percentFor(allocation); const actual = transactions.filter((item) => item.budgetBucket === allocation.bucket && (item.type === "expense" || (item.type === "allocation" && item.allocationAction !== "withdrawal"))).reduce((sum, item) => sum + item.amount, 0); return <article key={allocation.bucket}><div><span>{allocation.bucket}</span><strong>{rupiah.format(amount)}</strong></div><small>{formatPercent(percent)}% · terpakai atau diarahkan {rupiah.format(actual)}</small></article>; })}</div><div className="educationNote"><strong>Nominal dan persentase saling mengikuti.</strong><p>Masukkan angka yang benar-benar kamu ketahui. Saat kamu mengisi Rp3.190.000, nominal itu tetap persis dan Atlas menghitung persentasenya sebagai informasi.</p></div></section>
  </form>;
}`;

  const budgetPattern = /function BudgetPlanner\([\s\S]*?(?=\nconst learningModules)/;
  if (!budgetPattern.test(source)) throw new Error("Atlas exact budget planner anchor missing");
  source = source.replace(budgetPattern, budgetPlanner);

  source = source.replace(
    "const limit = plan.monthlyIncome * allocation.percent / 100;",
    "const limit = allocation.basis === \"amount\" && typeof allocation.amount === \"number\" ? allocation.amount : plan.monthlyIncome * allocation.percent / 100; const budgetPercent = plan.monthlyIncome ? limit / plan.monthlyIncome * 100 : 0;"
  );
  source = source.replace(
    '<div><span>{allocation.bucket}</span><strong>{allocation.percent.toFixed(2).replace(".00", "")}%</strong></div>',
    '<div><span>{allocation.bucket}</span><strong>{budgetPercent.toLocaleString("id-ID", { maximumFractionDigits: 4 })}%</strong></div>'
  );

  source = source.replace(
    "Tambahkan emas, DPLK atau pensiun, pendidikan, rumah, atau tujuan personal lainnya.",
    "Tambahkan dana pendidikan, liburan, umrah, rumah, atau tujuan tunai lainnya."
  );

  return source;
});

console.log("Atlas exact nominal budgeting and mobile card layout ready");
