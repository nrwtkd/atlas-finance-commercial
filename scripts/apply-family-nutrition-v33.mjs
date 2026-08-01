import { readFile, writeFile } from "node:fs/promises";

async function edit(relativePath, transform) {
  const path = new URL(`../${relativePath}`, import.meta.url);
  const source = await readFile(path, "utf8");
  const next = transform(source);
  if (next !== source) await writeFile(path, next, "utf8");
}

function requiredReplace(source, anchor, replacement, label) {
  if (!source.includes(anchor)) throw new Error(`Alerantara family nutrition anchor missing: ${label}`);
  return source.replace(anchor, replacement);
}

await edit("src/types.ts", (input) => {
  let source = input;

  if (!source.includes("export type NutritionFocus")) {
    source = requiredReplace(
      source,
      'export type ManagedFor = "self" | "partner" | "children" | "parents" | "business" | "other";',
      'export type ManagedFor = "self" | "partner" | "children" | "parents" | "business" | "other";\nexport type NutritionFocus = "family_general" | "pregnant" | "breastfeeding" | "child_6_23_months" | "child_2_5_years";\nexport type NutritionFoodGroup = "egg" | "fish" | "meat" | "dairy" | "plant_protein" | "vegetable" | "fruit";',
      "nutrition types"
    );
  }

  source = source.replace(
    'export type FinancialWinCategory = "awareness" | "consistency" | "restraint" | "income" | "budget" | "emergency" | "goal" | "debt" | "learning" | "other";',
    'export type FinancialWinCategory = "awareness" | "consistency" | "restraint" | "income" | "budget" | "emergency" | "goal" | "debt" | "learning" | "nutrition" | "other";'
  );

  if (!source.includes("nutritionTrackingEnabled?: boolean")) {
    source = source.replace(
      /export interface FinancialProfile \{([^}]*)\}/,
      (_match, body) => `export interface FinancialProfile {${body.trimEnd()} nutritionTrackingEnabled?: boolean; nutritionFocus?: NutritionFocus[]; }`
    );
  }

  if (!source.includes("nutritionTags?: NutritionFoodGroup[]")) {
    source = source.replace(
      /export interface FinanceTransaction \{([^}]*)\}/,
      (_match, body) => `export interface FinanceTransaction {${body.trimEnd()} nutritionTags?: NutritionFoodGroup[]; }`
    );
  }

  return source;
});

await edit("src/components/FinancialOnboarding.tsx", (input) => {
  let source = input;

  if (!source.includes('from "../domain/nutrition"')) {
    source = requiredReplace(
      source,
      '} from "../domain/personalization";',
      '} from "../domain/personalization";\nimport { nutritionFocusOptions } from "../domain/nutrition";',
      "nutrition onboarding import"
    );
  }

  if (!source.includes("NutritionFocus")) {
    source = requiredReplace(
      source,
      '  ManagedFor\n} from "../types";',
      '  ManagedFor,\n  NutritionFocus\n} from "../types";',
      "nutrition focus type import"
    );
  }

  if (!source.includes("const [nutritionTrackingEnabled")) {
    source = requiredReplace(
      source,
      '  const [budgetStyle, setBudgetStyle] = useState<BudgetStyle>("balanced");',
      '  const [budgetStyle, setBudgetStyle] = useState<BudgetStyle>("balanced");\n  const [nutritionTrackingEnabled, setNutritionTrackingEnabled] = useState(false);\n  const [nutritionFocus, setNutritionFocus] = useState<NutritionFocus[]>([]);',
      "nutrition state"
    );
  }

  if (!source.includes("nutritionTrackingEnabled,")) {
    source = requiredReplace(
      source,
      '    budgetStyle,\n    completedAt:',
      '    budgetStyle,\n    nutritionTrackingEnabled,\n    nutritionFocus: nutritionTrackingEnabled ? nutritionFocus : [],\n    completedAt:',
      "nutrition profile draft"
    );
    source = requiredReplace(
      source,
      'priorities, budgetStyle]);',
      'priorities, budgetStyle, nutritionTrackingEnabled, nutritionFocus]);',
      "nutrition draft dependencies"
    );
  }

  if (!source.includes("function toggleNutritionFocus")) {
    source = requiredReplace(
      source,
      '  async function finish() {',
      '  function toggleNutritionFocus(value: NutritionFocus) {\n    setNutritionFocus((current) => current.includes(value)\n      ? current.filter((item) => item !== value)\n      : [...current, value]);\n  }\n\n  async function finish() {',
      "nutrition focus toggle"
    );
  }

  source = source.replace('aria-label={`Langkah ${step} dari 5`}', 'aria-label={`Langkah ${step} dari 6`}');
  source = source.replace('<span>Langkah {step} dari 5</span>', '<span>Langkah {step} dari 6</span>');
  source = source.replace('style={{ width: `${step * 20}%` }}', 'style={{ width: `${step / 6 * 100}%` }}');

  if (!source.includes('eyebrow">GIZI KELUARGA')) {
    source = source.replace('{step === 5 && (', '{step === 6 && (');
    source = source.replace('{step === 4 && (', '{step === 5 && (');

    const anchor = '        {step === 5 && (';
    const block = `        {step === 4 && (\n          <section className="onboardingStep">\n            <div className="onboardingIntro">\n              <span className="eyebrow">GIZI KELUARGA</span>\n              <h1>Apakah kamu ingin Alerantara ikut merayakan pilihan pangan bergizi?</h1>\n              <p>Fitur ini opsional. Saat aktif, ceklis ringan muncul ketika kamu mencatat belanja bahan makanan, lalu Tala memberi apresiasi dari pilihan yang memang kamu tandai.</p>\n            </div>\n            <div className="nutritionOptInGrid">\n              <button type="button" className={nutritionTrackingEnabled ? "choiceCard active" : "choiceCard"} onClick={() => { setNutritionTrackingEnabled(true); if (!nutritionFocus.length) setNutritionFocus(["family_general"]); }}>\n                <strong>Ya, aktifkan Jejak Gizi Keluarga</strong>\n                <span>Aku ingin keputusan kecil seperti membeli telur, ikan, sayur, atau buah ikut terlihat dan dirayakan.</span>\n              </button>\n              <button type="button" className={!nutritionTrackingEnabled ? "choiceCard active" : "choiceCard"} onClick={() => { setNutritionTrackingEnabled(false); setNutritionFocus([]); }}>\n                <strong>Tidak mengaktifkan fitur ini</strong>\n                <span>Pencatatan keuanganku tetap berjalan seperti biasa tanpa ceklis maupun insight gizi keluarga.</span>\n              </button>\n            </div>\n            {nutritionTrackingEnabled && <section className="nutritionFocusPanel">\n              <strong>Siapa yang ingin lebih kamu perhatikan?</strong>\n              <p>Pilih semua yang sesuai. Pilihan ini tidak digunakan untuk menilai kondisi kesehatan.</p>\n              <div className="choiceGrid twoColumns">\n                {nutritionFocusOptions.map((item) => <button key={item.value} type="button" className={nutritionFocus.includes(item.value) ? "choiceCard active" : "choiceCard"} onClick={() => toggleNutritionFocus(item.value)}>\n                  <strong>{nutritionFocus.includes(item.value) ? "✓ " : "+ "}{item.label}</strong><span>{item.description}</span>\n                </button>)}\n              </div>\n            </section>}\n            <aside className="nutritionConsentNote">Jejak ini tersimpan bersama data terenkripsi di perangkatmu. Alerantara hanya mengingat pilihan yang kamu centang—bukan menilai kecukupan gizi, pertumbuhan anak, atau risiko kesehatan.</aside>\n          </section>\n        )}\n\n${anchor}`;
    source = requiredReplace(source, anchor, block, "nutrition onboarding step");
  }

  source = source.replace('step < 5', 'step < 6');
  source = source.replace('Math.min(5, value + 1)', 'Math.min(6, value + 1)');

  return source;
});

await edit("src/App.tsx", (input) => {
  let source = input;

  if (!source.includes('from "./domain/nutrition"')) {
    source = requiredReplace(
      source,
      '} from "./domain/financeCatalog";',
      '} from "./domain/financeCatalog";\nimport { nutritionFoodLabelList, nutritionFoodOptions } from "./domain/nutrition";',
      "nutrition app import"
    );
  }

  if (!source.includes("nutritionTrackingEnabled={Boolean(finance.financialProfile")) {
    source = requiredReplace(
      source,
      '            profileName={finance.profileName}\n            members={finance.householdMembers}',
      '            profileName={finance.profileName}\n            nutritionTrackingEnabled={Boolean(finance.financialProfile?.nutritionTrackingEnabled)}\n            members={finance.householdMembers}',
      "record nutrition setting prop"
    );
  }

  if (!source.includes("nutritionTrackingEnabled, members")) {
    source = requiredReplace(
      source,
      'function Record({ profileName, members,',
      'function Record({ profileName, nutritionTrackingEnabled, members,',
      "record nutrition prop signature"
    );
    source = requiredReplace(
      source,
      '{ profileName: string; members: string[];',
      '{ profileName: string; nutritionTrackingEnabled: boolean; members: string[];',
      "record nutrition prop type"
    );
  }

  if (!source.includes("const [nutritionTags, setNutritionTags]")) {
    source = requiredReplace(
      source,
      '  const [note, setNote] = useState(initialTransaction?.note ?? "");',
      '  const [note, setNote] = useState(initialTransaction?.note ?? "");\n  const [nutritionTags, setNutritionTags] = useState<NonNullable<FinanceTransaction["nutritionTags"]>>(initialTransaction?.nutritionTags ?? []);',
      "nutrition transaction state"
    );
  }

  if (!source.includes("const showNutritionChoices")) {
    source = requiredReplace(
      source,
      '  const selectedActivity = activity === "Aktivitas lainnya…" ? customActivity.trim() : activity;',
      '  const selectedActivity = activity === "Aktivitas lainnya…" ? customActivity.trim() : activity;\n  const showNutritionChoices = nutritionTrackingEnabled && type === "expense" && selectedCategory === "Makan dan minum" && selectedActivity === "Belanja bahan makanan";',
      "nutrition transaction visibility"
    );
  }

  if (!source.includes("function toggleNutritionTag")) {
    source = requiredReplace(
      source,
      '  function addRelatedParty()',
      '  function toggleNutritionTag(value: NonNullable<FinanceTransaction["nutritionTags"]>[number]) { setNutritionTags((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]); }\n  function addRelatedParty()',
      "nutrition transaction toggle"
    );
  }

  if (!source.includes("nutritionTags: showNutritionChoices")) {
    source = requiredReplace(
      source,
      '        note,\n        createdAt:',
      '        note,\n        nutritionTags: showNutritionChoices && nutritionTags.length ? nutritionTags : undefined,\n        createdAt:',
      "nutrition transaction persistence"
    );
  }

  if (!source.includes('className="nutritionTransactionField"')) {
    const anchor = '    <label>Catatan<input value={note}';
    const block = `    {showNutritionChoices && <fieldset className="nutritionTransactionField"><legend>Yang ikut kamu sediakan hari ini</legend><p>Opsional. Nominal tetap satu transaksi dan tidak dibagi per bahan.</p><div className="nutritionFoodChoices">{nutritionFoodOptions.map((item) => <button key={item.value} type="button" className={nutritionTags.includes(item.value) ? "nutritionFoodChoice active" : "nutritionFoodChoice"} onClick={() => toggleNutritionTag(item.value)}>{nutritionTags.includes(item.value) ? "✓ " : "+ "}{item.label}</button>)}</div><small className="nutritionTransactionHint">Alerantara merayakan kehadiran dan variasinya, bukan mahalnya belanja.</small></fieldset>}\n${anchor}`;
    source = requiredReplace(source, anchor, block, "nutrition transaction field");
  }

  const persistAnchor = '              await persist({ ...finance, householdMembers: nextMembers, customCategories: nextCustom, transactions: editingTransaction ? finance.transactions.map((item) => item.id === editingTransaction.id ? transaction : item) : [transaction, ...finance.transactions] });';
  if (!source.includes("const nutritionWin = !editingTransaction")) {
    const persistBlock = `              const nutritionWin = !editingTransaction && transaction.nutritionTags?.length ? {\n                id: \`nutrition-\${transaction.id}\`,\n                date: transaction.date,\n                title: "Pilihan bergizi untuk keluarga",\n                description: \`Kamu ikut menyediakan \${nutritionFoodLabelList(transaction.nutritionTags)}. Merawat keluarga juga terlihat dari keputusan belanja yang sederhana.\`,\n                amount: transaction.amount,\n                category: "nutrition" as const,\n                createdAt: transaction.createdAt,\n                updatedAt: transaction.updatedAt\n              } : null;\n              await persist({ ...finance, householdMembers: nextMembers, customCategories: nextCustom, financialWins: nutritionWin ? [nutritionWin, ...finance.financialWins] : finance.financialWins, transactions: editingTransaction ? finance.transactions.map((item) => item.id === editingTransaction.id ? transaction : item) : [transaction, ...finance.transactions] });`;
    source = requiredReplace(source, persistAnchor, persistBlock, "nutrition automatic win");
  }

  const messageAnchor = '                setMessage(wasEditing ? "Perubahan transaksi sudah disimpan." : transaction.type === "allocation" ? "Pergerakan dana tersimpan dan tracker tujuan sudah diperbarui." : getGuidanceMode(finance.financialProfile?.budgetStyle).savedMessage);';
  if (source.includes(messageAnchor)) {
    source = source.replace(
      messageAnchor,
      '                setMessage(wasEditing ? "Perubahan transaksi sudah disimpan." : transaction.nutritionTags?.length ? `Pilihan baik untuk keluargamu. ${nutritionFoodLabelList(transaction.nutritionTags)} ikut tercatat hari ini.` : transaction.type === "allocation" ? "Pergerakan dana tersimpan dan tracker tujuan sudah diperbarui." : getGuidanceMode(finance.financialProfile?.budgetStyle).savedMessage);'
    );
  }

  return source;
});

await edit("src/main.tsx", (input) => {
  if (input.includes('import "./family-nutrition-v33.css";')) return input;
  const anchor = 'import "./budget-status-v31.css";';
  if (!input.includes(anchor)) throw new Error("Alerantara family nutrition CSS import anchor missing");
  return input.replace(anchor, `${anchor}\nimport "./family-nutrition-v33.css";`);
});

console.log("Alerantara optional family nutrition journey ready");
