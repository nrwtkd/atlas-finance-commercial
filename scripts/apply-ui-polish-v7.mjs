import { readFile, writeFile } from "node:fs/promises";

const appPath = new URL("../src/App.tsx", import.meta.url);
let source = await readFile(appPath, "utf8");
let changed = false;

function patch(anchor, replacement, marker) {
  if (marker && source.includes(marker)) return;
  if (!source.includes(anchor)) throw new Error(`Atlas UI polish anchor missing: ${anchor.slice(0, 72)}`);
  source = source.replace(anchor, replacement);
  changed = true;
}

patch(
  'import DataPortability from "./components/DataPortability";',
  'import DataPortability from "./components/DataPortability";\nimport AtlasIcon, { type AtlasIconName } from "./components/AtlasIcon";',
  'import AtlasIcon, { type AtlasIconName }'
);

patch(
  '      <header className="atlasTopbar">\n        <div><span className="eyebrow">ATLAS FINANCE</span><h1>Halo, {finance.profileName}</h1><p>Pelan-pelan kita buat uangmu lebih terarah.</p></div>\n        <button className="atlasIconButton" type="button" aria-label="Kunci Atlas" title="Kunci Atlas" onClick={() => { setFinance(null); setPin(""); }}>◇</button>\n      </header>',
  '      <header className="atlasTopbar">\n        <div className="topbarIdentity"><span className="topbarMark" aria-hidden="true">A</span><div><span className="eyebrow">ATLAS FINANCE</span><h1>Halo, {finance.profileName}</h1><p>Pelan-pelan kita buat uangmu lebih terarah.</p></div></div>\n        <button className="atlasIconButton" type="button" aria-label="Kunci Atlas" title="Kunci Atlas" onClick={() => { setFinance(null); setPin(""); }}><AtlasIcon name="lock" size={20} /></button>\n      </header>',
  'className="topbarIdentity"'
);

if (source.includes('<div><b>✦</b></div>')) {
  source = source.replace('<div><b>✦</b></div>', '<div><b className="focusIcon"><AtlasIcon name="sparkles" size={24} /></b></div>');
  changed = true;
} else if (source.includes('<b>✦</b></section>')) {
  source = source.replace('<b>✦</b></section>', '<b className="focusIcon"><AtlasIcon name="sparkles" size={24} /></b></section>');
  changed = true;
}

const navReplacements = [
  ['<Nav label="Beranda" icon="⌂"', '<Nav label="Beranda" icon="home"'],
  ['<Nav label="Catat" icon="＋"', '<Nav label="Catat" icon="plus"'],
  ['<Nav label="Rencana" icon="◌"', '<Nav label="Rencana" icon="plan"'],
  ['<Nav label="Refleksi" icon="✦"', '<Nav label="Refleksi" icon="reflect"'],
  ['<Nav label="Ruangku" icon="◇"', '<Nav label="Ruangku" icon="space"']
];
for (const [anchor, replacement] of navReplacements) {
  if (source.includes(anchor)) {
    source = source.replace(anchor, replacement);
    changed = true;
  }
}

patch(
  'function Nav({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) { return <button className={active ? "active" : ""} type="button" onClick={onClick}><span>{icon}</span><small>{label}</small></button>; }',
  'function Nav({ label, icon, active, onClick }: { label: string; icon: AtlasIconName; active: boolean; onClick: () => void }) { return <button className={active ? "active" : ""} type="button" onClick={onClick} aria-current={active ? "page" : undefined}><span className="navIcon"><AtlasIcon name={icon} size={20} /></span><small>{label}</small></button>; }',
  'className="navIcon"'
);

if (changed) await writeFile(appPath, source, "utf8");
console.log("Atlas premium UI polish ready");
