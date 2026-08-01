import { readFile, writeFile } from "node:fs/promises";

const appPath = new URL("../src/App.tsx", import.meta.url);
let source = await readFile(appPath, "utf8");
let changed = false;

function replaceOnce(anchor, replacement, label) {
  if (!source.includes(anchor)) throw new Error(`Atlas v27 anchor missing: ${label}`);
  source = source.replace(anchor, replacement);
  changed = true;
}

if (!source.includes("const [percentDrafts, setPercentDrafts]")) {
  replaceOnce(
    "  const [lastEditedBucket, setLastEditedBucket] = useState<BudgetBucket | null>(null);\n  const [busy, setBusy] = useState(false);",
    "  const [lastEditedBucket, setLastEditedBucket] = useState<BudgetBucket | null>(null);\n  const [percentDrafts, setPercentDrafts] = useState<Record<string, string>>({});\n  const [busy, setBusy] = useState(false);",
    "percentage draft state"
  );
}

if (!source.includes("function parseLocalizedPercent")) {
  replaceOnce(
    "  function selectScenario(value: BudgetScenario) {\n    setScenario(value);\n    setAllocations(getScenario(value).allocations.map((item) => ({ ...item })));\n    setLastEditedBucket(null);\n  }\n  function updatePercent(bucket: BudgetBucket, raw: string) {\n    const percent = Math.max(0, Number(raw) || 0);\n    setLastEditedBucket(bucket);\n    setAllocations((current) => current.map((item) => item.bucket === bucket ? { ...item, percent } : item));\n  }",
    "  function selectScenario(value: BudgetScenario) {\n    setScenario(value);\n    setAllocations(getScenario(value).allocations.map((item) => ({ ...item })));\n    setLastEditedBucket(null);\n    setPercentDrafts({});\n  }\n  function parseLocalizedPercent(raw: string) {\n    const cleaned = raw.replace(/[^0-9,.]/g, \"\").replace(/,/g, \".\");\n    const firstDot = cleaned.indexOf(\".\");\n    const normalized = firstDot < 0 ? cleaned : cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\\./g, \"\");\n    return Math.max(0, Number(normalized) || 0);\n  }\n  function updatePercent(bucket: BudgetBucket, raw: string) {\n    const cleanedDraft = raw.replace(/[^0-9,.]/g, \"\");\n    const percent = parseLocalizedPercent(cleanedDraft);\n    setPercentDrafts((current) => ({ ...current, [bucket]: cleanedDraft }));\n    setLastEditedBucket(bucket);\n    setAllocations((current) => current.map((item) => item.bucket === bucket ? { ...item, percent } : item));\n  }\n  function finishPercentEdit(bucket: BudgetBucket) {\n    setPercentDrafts((current) => {\n      const next = { ...current };\n      delete next[bucket];\n      return next;\n    });\n  }",
    "localized percentage parser"
  );
}

const oldPercentInput = "          <label><span className=\"mobileOnlyLabel\">Persen</span><div className=\"budgetInputSuffix\"><input type=\"number\" min=\"0\" step=\"0.01\" value={Number(allocation.percent.toFixed(4))} onChange={(event) => updatePercent(allocation.bucket, event.target.value)} /><b>%</b></div></label>";
const newPercentInput = "          <label><span className=\"mobileOnlyLabel\">Persen</span><div className=\"budgetInputSuffix\"><input type=\"text\" inputMode=\"decimal\" autoComplete=\"off\" value={percentDrafts[allocation.bucket] ?? allocation.percent.toLocaleString(\"id-ID\", { maximumFractionDigits: 4 })} onChange={(event) => updatePercent(allocation.bucket, event.target.value)} onBlur={() => finishPercentEdit(allocation.bucket)} aria-label={\"Persentase \" + allocation.bucket} /><b>%</b></div></label>";
if (source.includes(oldPercentInput)) replaceOnce(oldPercentInput, newPercentInput, "localized percent input");

if (!source.includes("const hasBudget = limit > 1;")) {
  replaceOnce(
    "      const bucketDirected = Math.max(0, bucketAllocatedIn - bucketAllocatedOut);\n      const actual = bucketExpense + bucketDirected;\n      const isOver = actual > limit + 1;\n      const percent = limit ? Math.min(100, Math.round(actual / limit * 100)) : actual > 0 ? 100 : 0;",
    "      const bucketDirected = Math.max(0, bucketAllocatedIn - bucketAllocatedOut);\n      const actual = bucketExpense + bucketDirected;\n      const hasBudget = limit > 1;\n      const isOver = hasBudget ? actual > limit + 1 : actual > 0;\n      const percent = hasBudget ? Math.min(100, Math.round(actual / limit * 100)) : actual > 0 ? 100 : 0;",
    "zero budget status"
  );

  replaceOnce(
    "      if (!detailParts.length) detailParts.push(\"Belum digunakan\");\n      const overText = isOver ? \" · melewati \" + rupiah.format(actual - limit) : \"\";",
    "      if (!detailParts.length && hasBudget) detailParts.push(\"Belum digunakan\");\n      const overText = isOver && hasBudget ? \" · melewati \" + rupiah.format(actual - limit) : \"\";\n      const statusText = !hasBudget\n        ? (detailParts.length ? detailParts.join(\" · \") + \" · tidak ada anggaran\" : \"Tidak ada anggaran\")\n        : detailParts.join(\" · \") + \" · batas \" + rupiah.format(limit) + overText;",
    "zero budget copy"
  );

  replaceOnce(
    "        <small>{detailParts.join(\" · \")} · batas {rupiah.format(limit)}{overText}</small>",
    "        <small>{statusText}</small>",
    "zero budget rendered status"
  );
}

if (changed) await writeFile(appPath, source, "utf8");
console.log("Atlas decimal input, mobile summary, and zero-budget copy ready");
