import { readFile, writeFile } from "node:fs/promises";

const appPath = new URL("../src/App.tsx", import.meta.url);
let source = await readFile(appPath, "utf8");
const match = source.match(/type Screen = ([^;]+);/);
if (!match) throw new Error("Atlas Screen type anchor missing");
if (!match[1].includes('"goal-movement"')) {
  source = source.replace(/type Screen = ([^;]+);/, (_full, members) => `type Screen = ${members} | "goal-movement";`);
  await writeFile(appPath, source, "utf8");
}
console.log("Atlas goal movement screen type fixed");
