import { readFile, writeFile } from "node:fs/promises";

const appPath = new URL("../src/App.tsx", import.meta.url);
let source = await readFile(appPath, "utf8");
let changed = false;

function patch(anchor, replacement, marker) {
  if (marker && source.includes(marker)) return;
  if (!source.includes(anchor)) throw new Error(`Atlas early deployer anchor missing: ${anchor.slice(0, 90)}`);
  source = source.replace(anchor, replacement);
  changed = true;
}

patch(
  'import DataPortability from "./components/DataPortability";',
  'import DataPortability from "./components/DataPortability";\nimport EarlyAccessPending from "./components/EarlyAccessPending";\nimport EarlyAccessFeedback from "./components/EarlyAccessFeedback";',
  'import EarlyAccessPending from "./components/EarlyAccessPending";'
);

patch(
  '  if (isSupabaseConfigured && entitlement?.status !== "active") {\n    return <Centered title="Akses belum aktif" text={entitlement?.status === "unknown" ? "Atlas belum dapat memeriksa lisensimu." : "Akun ini belum memiliki lisensi Atlas Finance aktif."} action={<button className="secondary" onClick={() => void supabase?.auth.signOut()}>Keluar</button>} />;\n  }',
  `  if (isSupabaseConfigured && entitlement?.status !== "active") {\n    return (\n      <EarlyAccessPending\n        email={session?.user.email ?? "Akun Google"}\n        userId={session?.user.id ?? ""}\n        status={entitlement?.status === "unknown" ? "unknown" : "inactive"}\n        onRetry={async () => {\n          if (!session?.user.id) return;\n          setEntitlement(await getEntitlement(session.user.id));\n        }}\n        onSignOut={() => void supabase?.auth.signOut()}\n      />\n    );\n  }`,
  '<EarlyAccessPending\n        email={session?.user.email'
);

patch(
  '<DataPortability /><section className="card privacy atlasPrivacy">',
  '<DataPortability /><EarlyAccessFeedback finance={finance} /><section className="card privacy atlasPrivacy">',
  '<EarlyAccessFeedback finance={finance} />'
);

if (changed) await writeFile(appPath, source, "utf8");
console.log("Atlas closed beta activation and feedback ready");
