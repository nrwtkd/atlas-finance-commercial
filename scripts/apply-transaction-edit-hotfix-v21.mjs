import { readFile, writeFile } from "node:fs/promises";

const appPath = new URL("../src/App.tsx", import.meta.url);
const source = await readFile(appPath, "utf8");
const next = source.replaceAll("localDateInputValue()", "localDateKey()");
if (next !== source) await writeFile(appPath, next, "utf8");
console.log("Atlas transaction editor local date helper fixed");
