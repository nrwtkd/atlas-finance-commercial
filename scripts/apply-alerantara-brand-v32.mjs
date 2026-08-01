import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const root = new URL("../", import.meta.url);
const srcRoot = new URL("../src/", import.meta.url);

function rebrandVisibleCopy(source) {
  return source
    .replace(/\bATLAS\b/g, "ALERANTARA")
    .replace(/\bAtlas\b/g, "Alerantara");
}

async function walk(directoryUrl) {
  const entries = await readdir(directoryUrl, { withFileTypes: true });
  for (const entry of entries) {
    const entryUrl = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directoryUrl);
    if (entry.isDirectory()) {
      await walk(entryUrl);
      continue;
    }
    if (![".ts", ".tsx"].includes(extname(entry.name))) continue;

    const source = await readFile(entryUrl, "utf8");
    let next = rebrandVisibleCopy(source);

    if (entry.name === "DataPortability.tsx") {
      next = next
        .replace(
          'format: "atlas-finance-encrypted-backup";',
          'format: "alerantara-finance-encrypted-backup" | "atlas-finance-encrypted-backup";'
        )
        .replace(
          'return candidate.format === "atlas-finance-encrypted-backup"',
          'return (candidate.format === "alerantara-finance-encrypted-backup" || candidate.format === "atlas-finance-encrypted-backup")'
        )
        .replace(
          'format: "atlas-finance-encrypted-backup",',
          'format: "alerantara-finance-encrypted-backup",'
        )
        .replace(
          'anchor.download = `atlas-finance-cadangan-${date}.atlas.json`;',
          'anchor.download = `alerantara-finance-cadangan-${date}.alerantara.json`;'
        )
        .replaceAll(
          'accept=".json,.atlas,application/json"',
          'accept=".json,.atlas,.alerantara,application/json"'
        );
    }

    if (next !== source) await writeFile(entryUrl, next, "utf8");
  }
}

await walk(srcRoot);

for (const relativePath of ["index.html", "public/manifest.webmanifest"]) {
  const path = new URL(`../${relativePath}`, import.meta.url);
  const source = await readFile(path, "utf8");
  const next = rebrandVisibleCopy(source);
  if (next !== source) await writeFile(path, next, "utf8");
}

console.log("Alerantara Finance user-facing brand applied; legacy data identifiers preserved");
