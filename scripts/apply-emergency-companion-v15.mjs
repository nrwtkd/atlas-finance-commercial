import { readFile, writeFile } from "node:fs/promises";

async function edit(relativePath, transform) {
  const path = new URL(`../${relativePath}`, import.meta.url);
  const source = await readFile(path, "utf8");
  const next = transform(source);
  if (next !== source) await writeFile(path, next, "utf8");
}

function addAfter(source, anchor, addition, marker = addition) {
  if (source.includes(marker)) return source;
  if (!source.includes(anchor)) throw new Error(`Atlas companion anchor missing: ${anchor.slice(0, 90)}`);
  return source.replace(anchor, `${anchor}\n${addition}`);
}

await edit("src/App.tsx", (input) => {
  let source = addAfter(
    input,
    'import EarlyAccessFeedback from "./components/EarlyAccessFeedback";',
    'import EmergencyFundGuide from "./components/EmergencyFundGuide";',
    'import EmergencyFundGuide from "./components/EmergencyFundGuide";'
  );

  const goalAnchor = '      <GoalSnapshot goals={finance.goals} transactions={finance.transactions} onOpen={onGoals} />';
  const emergencyBlock = `      <EmergencyFundGuide\n        finance={finance}\n        currentPlan={currentPlan}\n        onOpenGoals={onGoals}\n        onOpenBudget={onBudget}\n      />\n${goalAnchor}`;
  if (!source.includes('<EmergencyFundGuide\n        finance={finance}')) {
    if (!source.includes(goalAnchor)) throw new Error("Atlas emergency guide home anchor missing");
    source = source.replace(goalAnchor, emergencyBlock);
  }

  return source;
});

await edit("src/components/ReflectionCenter.tsx", (input) => {
  let source = addAfter(
    input,
    'import MonthClosePanel from "./MonthClosePanel";',
    'import ReviewCompanion from "./ReviewCompanion";',
    'import ReviewCompanion from "./ReviewCompanion";'
  );

  const messageAnchor = '      {message && <button className="reflectionMessage" type="button" onClick={() => setMessage("")}>{message}</button>}';
  if (!source.includes('<ReviewCompanion finance={finance} />')) {
    if (!source.includes(messageAnchor)) throw new Error("Atlas review companion anchor missing");
    source = source.replace(messageAnchor, `${messageAnchor}\n      <ReviewCompanion finance={finance} />`);
  }
  return source;
});

await edit("src/components/LearningExperienceUpgrade.tsx", (input) => {
  let source = input;
  const functionAnchor = '      "Dana darurat adalah penyangga ketika terjadi kebutuhan mendesak, penting, dan tidak direncanakan. Tujuannya bukan membuat kita kebal dari semua masalah, tetapi memberi waktu untuk berpikir dan bertindak tanpa langsung bergantung pada utang baru.",';
  const functionExpansion = `      "Dana darurat bukan sekadar tabungan yang diberi nama berbeda. Fungsi utamanya adalah membeli waktu: menjaga kebutuhan pokok tetap berjalan saat pemasukan berhenti, memberi ruang ketika kesehatan membutuhkan biaya mendadak, atau menangani kerusakan penting agar rumah dan pekerjaan tetap berfungsi.",\n${functionAnchor}`;
  if (!source.includes("Fungsi utamanya adalah membeli waktu:")) {
    if (!source.includes(functionAnchor)) throw new Error("Atlas emergency lesson function anchor missing");
    source = source.replace(functionAnchor, functionExpansion);
  }

  const targetAnchor = '      "Target dana darurat tidak harus sama untuk semua orang. Penghasilan yang tidak tetap, jumlah tanggungan, kebutuhan kesehatan, kestabilan pekerjaan, akses perlindungan, dan besarnya kebutuhan pokok memengaruhi seberapa besar penyangga yang dibutuhkan.",';
  const targetExpansion = `${targetAnchor}\n      "Atlas menggunakan kebutuhan pokok dan kewajiban minimum sebagai dasar hitungan, lalu mengalikannya dengan jumlah bulan perlindungan yang sesuai kondisi. Tiga bulan dapat menjadi titik awal untuk pemasukan stabil tanpa tanggungan besar, sedangkan enam bulan atau lebih memberi ruang lebih aman untuk pemasukan tidak tetap, tanggungan, atau kondisi yang lebih rentan.",`;
  if (!source.includes("Atlas menggunakan kebutuhan pokok dan kewajiban minimum")) {
    if (!source.includes(targetAnchor)) throw new Error("Atlas emergency lesson calculation anchor missing");
    source = source.replace(targetAnchor, targetExpansion);
  }

  const exampleAnchor = '      "Biaya tahunan yang sudah diketahui seharusnya disiapkan sebagai dana berkala, bukan diambil dari dana darurat."';
  const exampleExpansion = `${exampleAnchor},\n      "Bila pemasukan terhenti sementara, dana darurat menjaga makan, tempat tinggal, transportasi penting, dan kewajiban minimum tetap berjalan sambil kamu mencari solusi berikutnya."`;
  if (!source.includes("Bila pemasukan terhenti sementara")) {
    if (!source.includes(exampleAnchor)) throw new Error("Atlas emergency lesson example anchor missing");
    source = source.replace(exampleAnchor, exampleExpansion);
  }

  return source;
});

console.log("Atlas emergency target, education, and companion ready");
