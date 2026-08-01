import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname } from "node:path";

async function edit(relativePath, transform) {
  const path = new URL(`../${relativePath}`, import.meta.url);
  const source = await readFile(path, "utf8");
  const next = transform(source);
  if (next !== source) await writeFile(path, next, "utf8");
}

await edit("src/App.tsx", (input) => {
  let source = input;

  if (!source.includes('import TodayWins from "./components/TodayWins";')) {
    const anchor = 'import FundingAwarenessCard from "./components/FundingAwarenessCard";';
    if (!source.includes(anchor)) throw new Error("Alerantara Tara wins import anchor missing");
    source = source.replace(anchor, `${anchor}\nimport TodayWins from "./components/TodayWins";`);
  }

  if (!source.includes('<TodayWins finance={finance} />')) {
    const anchor = '<section className="card focus atlasFocus">';
    if (!source.includes(anchor)) throw new Error("Alerantara Tara wins home anchor missing");
    source = source.replace(anchor, `<TodayWins finance={finance} />\n      ${anchor}`);
  }

  return source;
});

async function renameMascot(directoryUrl) {
  const entries = await readdir(directoryUrl, { withFileTypes: true });
  for (const entry of entries) {
    const entryUrl = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directoryUrl);
    if (entry.isDirectory()) {
      await renameMascot(entryUrl);
      continue;
    }
    if (![".ts", ".tsx"].includes(extname(entry.name))) continue;
    const source = await readFile(entryUrl, "utf8");
    const next = source.replace(/\bTALA\b/g, "TARA").replace(/\bTala\b/g, "Tara");
    if (next !== source) await writeFile(entryUrl, next, "utf8");
  }
}

await renameMascot(new URL("../src/", import.meta.url));

console.log("Tara is now the Alerantara companion with finance and family-care wins on Home");
