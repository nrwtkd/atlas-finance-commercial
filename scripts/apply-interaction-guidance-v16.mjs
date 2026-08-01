import { readFile, writeFile } from "node:fs/promises";

async function edit(relativePath, transform) {
  const path = new URL(`../${relativePath}`, import.meta.url);
  const source = await readFile(path, "utf8");
  const next = transform(source);
  if (next !== source) await writeFile(path, next, "utf8");
}

function addAfter(source, anchor, addition, marker = addition) {
  if (source.includes(marker)) return source;
  if (!source.includes(anchor)) throw new Error(`Atlas interaction anchor missing: ${anchor.slice(0, 100)}`);
  return source.replace(anchor, `${anchor}\n${addition}`);
}

await edit("src/App.tsx", (input) => {
  let source = addAfter(
    input,
    'import EmergencyFundGuide from "./components/EmergencyFundGuide";',
    'import GuidanceModeCard from "./components/GuidanceModeCard";\nimport { getGuidanceMode } from "./domain/guidanceStyle";',
    'import GuidanceModeCard from "./components/GuidanceModeCard";'
  );

  if (!source.includes("Atlas menyembunyikan pesan singkat otomatis")) {
    const monthlyAnchor = '  const monthlyTransactions = useMemo(() => {';
    const timeoutEffect = `  // Atlas menyembunyikan pesan singkat otomatis agar tidak menutup isi layar.\n  useEffect(() => {\n    if (!finance || !message) return;\n    const timeout = window.setTimeout(() => setMessage(""), 2400);\n    return () => window.clearTimeout(timeout);\n  }, [finance, message]);\n\n`;
    if (!source.includes(monthlyAnchor)) throw new Error("Atlas toast timeout anchor missing");
    source = source.replace(monthlyAnchor, `${timeoutEffect}${monthlyAnchor}`);
  }

  const saveAnchor = '            onSave={async ({ transaction, newMember, customCategory, customActivity }) => {\n              const nextMembers = newMember && !finance.householdMembers.includes(newMember) ? [...finance.householdMembers, newMember] : finance.householdMembers;';
  const saveReplacement = '            onSave={async ({ transaction, newMembers = [], customCategory, customActivity }) => {\n              const nextMembers = Array.from(new Set([...finance.householdMembers, ...newMembers]));';
  if (!source.includes('newMembers = [], customCategory')) {
    if (!source.includes(saveAnchor)) throw new Error("Atlas related-party save anchor missing");
    source = source.replace(saveAnchor, saveReplacement);
  }

  const savedMessageAnchor = '                setMessage(transaction.type === "allocation" ? "Pergerakan dana tersimpan dan tracker tujuan sudah diperbarui." : "Transaksi tersimpan di perangkatmu.");';
  const savedMessageReplacement = '                setMessage(transaction.type === "allocation" ? "Pergerakan dana tersimpan dan tracker tujuan sudah diperbarui." : getGuidanceMode(finance.financialProfile?.budgetStyle).savedMessage);';
  if (!source.includes('getGuidanceMode(finance.financialProfile?.budgetStyle).savedMessage')) {
    if (!source.includes(savedMessageAnchor)) throw new Error("Atlas saved-message anchor missing");
    source = source.replace(savedMessageAnchor, savedMessageReplacement);
  }

  const recordSignature = 'onSave: (result: { transaction: FinanceTransaction; newMember?: string; customCategory?: string; customActivity?: string }) => Promise<void>';
  if (!source.includes('newMembers?: string[]; customCategory')) {
    if (!source.includes(recordSignature)) throw new Error("Atlas record signature anchor missing");
    source = source.replace(recordSignature, 'onSave: (result: { transaction: FinanceTransaction; newMembers?: string[]; customCategory?: string; customActivity?: string }) => Promise<void>');
  }

  const memberStateAnchor = 'const [beneficiaries, setBeneficiaries] = useState<string[]>([members[0] ?? profileName]); const [newMember, setNewMember] = useState(""); const [category, setCategory]';
  if (!source.includes('const [addedMembers, setAddedMembers]')) {
    if (!source.includes(memberStateAnchor)) throw new Error("Atlas related-party state anchor missing");
    source = source.replace(memberStateAnchor, 'const [beneficiaries, setBeneficiaries] = useState<string[]>([members[0] ?? profileName]); const [newMember, setNewMember] = useState(""); const [addedMembers, setAddedMembers] = useState<string[]>([]); const [category, setCategory]');
  }

  const categoryAnchor = '  const categoryList = [...expenseCategories.map((item) => item.name), ...Object.keys(customCategories)]; const selectedCategory';
  if (!source.includes('const availableMembers = Array.from(new Set([...members, ...addedMembers]))')) {
    if (!source.includes(categoryAnchor)) throw new Error("Atlas available related-party anchor missing");
    source = source.replace(categoryAnchor, '  const availableMembers = Array.from(new Set([...members, ...addedMembers]));\n  const categoryList = [...expenseCategories.map((item) => item.name), ...Object.keys(customCategories)]; const selectedCategory');
  }

  const toggleAnchor = '  function toggleBeneficiary(value: string) { setBeneficiaries((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]); }\n  async function submit';
  if (!source.includes('function addRelatedParty()')) {
    if (!source.includes(toggleAnchor)) throw new Error("Atlas add related-party function anchor missing");
    source = source.replace(toggleAnchor, `  function toggleBeneficiary(value: string) { setBeneficiaries((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]); }\n  function addRelatedParty() {\n    const value = newMember.trim();\n    if (!value) return;\n    setAddedMembers((current) => Array.from(new Set([...current, value])));\n    setBeneficiaries((current) => Array.from(new Set([...current, value])));\n    setNewMember("");\n  }\n  async function submit`);
  }

  const submitMemberAnchor = 'await onSave({ transaction, newMember: newMember.trim() || undefined, customCategory:';
  if (!source.includes('await onSave({ transaction, newMembers: addedMembers, customCategory:')) {
    if (!source.includes(submitMemberAnchor)) throw new Error("Atlas related-party submit anchor missing");
    source = source.replace(submitMemberAnchor, 'await onSave({ transaction, newMembers: addedMembers, customCategory:');
  }

  const chipAnchor = '<div className="chipGroup">{members.map((member) =>';
  if (!source.includes('<div className="chipGroup">{availableMembers.map((member) =>')) {
    if (!source.includes(chipAnchor)) throw new Error("Atlas related-party chip anchor missing");
    source = source.replace(chipAnchor, '<div className="chipGroup">{availableMembers.map((member) =>');
  }

  const addButtonAnchor = '<div className="inlineAdd"><input value={newMember} onChange={(e) => setNewMember(e.target.value)} placeholder="Tambah orang atau pihak lain" /><button className="secondary" type="button" onClick={() => { const value = newMember.trim(); if (value) setBeneficiaries((current) => Array.from(new Set([...current, value]))); }}>Tambahkan</button></div>';
  const addButtonReplacement = '<div className="inlineAdd"><input value={newMember} onChange={(e) => setNewMember(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRelatedParty(); } }} placeholder="Tambah orang atau pihak lain" /><button className="secondary" type="button" disabled={!newMember.trim()} onClick={addRelatedParty}>Tambahkan</button></div>{addedMembers.length > 0 && <small className="relatedPartyConfirmation"><AtlasIcon name="check" size={14} />{addedMembers.length} pihak baru sudah ditambahkan dan dipilih.</small>}';
  if (!source.includes('className="relatedPartyConfirmation"')) {
    if (!source.includes(addButtonAnchor)) throw new Error("Atlas related-party button anchor missing");
    source = source.replace(addButtonAnchor, addButtonReplacement);
  }

  const emergencyAnchor = '      <EmergencyFundGuide\n        finance={finance}';
  if (!source.includes('<GuidanceModeCard style={finance.financialProfile?.budgetStyle ?? "balanced"} />')) {
    if (!source.includes(emergencyAnchor)) throw new Error("Atlas guidance card home anchor missing");
    source = source.replace(emergencyAnchor, '      <GuidanceModeCard style={finance.financialProfile?.budgetStyle ?? "balanced"} />\n      <EmergencyFundGuide\n        finance={finance}');
  }

  const toastAnchor = '      {message && <button className="toast atlasToast" type="button" onClick={() => setMessage("")}>{message}</button>}';
  const toastReplacement = '      {message && <button className="toast atlasToast" type="button" aria-live="polite" onClick={() => setMessage("")}><AtlasIcon name="check" size={16} /><span>{message}</span></button>}';
  if (!source.includes('aria-live="polite" onClick={() => setMessage("")}><AtlasIcon')) {
    if (!source.includes(toastAnchor)) throw new Error("Atlas compact toast anchor missing");
    source = source.replace(toastAnchor, toastReplacement);
  }

  return source;
});

await edit("src/components/FinancialOnboarding.tsx", (input) => {
  let source = addAfter(
    input,
    'import { useMemo, useState } from "react";',
    'import GuidanceModeCard from "./GuidanceModeCard";',
    'import GuidanceModeCard from "./GuidanceModeCard";'
  );

  const previewAnchor = '            </fieldset>\n\n            <aside className="recommendationPreview">';
  if (!source.includes('<GuidanceModeCard style={budgetStyle} compact />')) {
    if (!source.includes(previewAnchor)) throw new Error("Atlas onboarding guidance preview anchor missing");
    source = source.replace(previewAnchor, '            </fieldset>\n            <GuidanceModeCard style={budgetStyle} compact />\n\n            <aside className="recommendationPreview">');
  }
  return source;
});

await edit("src/components/ReviewCompanion.tsx", (input) => {
  let source = addAfter(
    input,
    'import { localMonthKey } from "../lib/localDate";',
    'import { getGuidanceMode } from "../domain/guidanceStyle";',
    'import { getGuidanceMode } from "../domain/guidanceStyle";'
  );

  const messageAnchor = '  const message = getReviewMessage(finance);';
  if (!source.includes('const guidance = getGuidanceMode(finance.financialProfile?.budgetStyle);')) {
    if (!source.includes(messageAnchor)) throw new Error("Atlas review guidance anchor missing");
    source = source.replace(messageAnchor, `${messageAnchor}\n  const guidance = getGuidanceMode(finance.financialProfile?.budgetStyle);`);
  }

  const textAnchor = '        <p>{message.text}</p>';
  if (!source.includes('className="reviewGuidancePrompt"')) {
    if (!source.includes(textAnchor)) throw new Error("Atlas review prompt anchor missing");
    source = source.replace(textAnchor, `${textAnchor}\n        <small className="reviewGuidancePrompt">{guidance.reviewPrompt}</small>`);
  }
  return source;
});

await edit("src/components/EmergencyFundGuide.tsx", (input) => {
  let source = addAfter(
    input,
    'import { getPersonalizedBudgetRecommendation } from "../domain/personalization";',
    'import { getGuidanceMode } from "../domain/guidanceStyle";',
    'import { getGuidanceMode } from "../domain/guidanceStyle";'
  );

  const targetAnchor = '  const reachedTarget = calculation.target > 0 && calculation.saved >= calculation.target;';
  if (!source.includes('const guidance = getGuidanceMode(finance.financialProfile?.budgetStyle);')) {
    if (!source.includes(targetAnchor)) throw new Error("Atlas emergency guidance anchor missing");
    source = source.replace(targetAnchor, `${targetAnchor}\n  const guidance = getGuidanceMode(finance.financialProfile?.budgetStyle);`);
  }

  const companionAnchor = '          <p>{companionMessage}</p>';
  if (!source.includes('className="emergencyGuidancePrompt"')) {
    if (!source.includes(companionAnchor)) throw new Error("Atlas emergency prompt anchor missing");
    source = source.replace(companionAnchor, `${companionAnchor}\n          <small className="emergencyGuidancePrompt">{guidance.emergencyPrompt}</small>`);
  }
  return source;
});

console.log("Atlas interaction fixes and personalized guidance ready");
