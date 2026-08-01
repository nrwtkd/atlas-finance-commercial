import { readFile, writeFile } from "node:fs/promises";

async function edit(relativePath, transform) {
  const path = new URL(`../${relativePath}`, import.meta.url);
  const source = await readFile(path, "utf8");
  const next = transform(source);
  if (next !== source) await writeFile(path, next, "utf8");
}

function requiredReplace(source, anchor, replacement, label) {
  if (!source.includes(anchor)) throw new Error(`Alerantara device-license anchor missing: ${label}`);
  return source.replace(anchor, replacement);
}

await edit("src/App.tsx", (input) => {
  let source = input;

  if (!source.includes('import DeviceAccessGate from "./components/DeviceAccessGate";')) {
    source = requiredReplace(
      source,
      'import DataPortability from "./components/DataPortability";',
      'import DataPortability from "./components/DataPortability";\nimport DeviceAccessGate from "./components/DeviceAccessGate";\nimport { activateThisDevice, isDeviceLimitEnabled, type DeviceActivationResult } from "./lib/deviceAccess";',
      "device imports"
    );
  }

  if (!source.includes("const [deviceAccess, setDeviceAccess]")) {
    source = requiredReplace(
      source,
      '  const [hasVault, setHasVault] = useState(false);',
      '  const [deviceAccess, setDeviceAccess] = useState<DeviceActivationResult | null>(null);\n  const [deviceReady, setDeviceReady] = useState(!isDeviceLimitEnabled);\n  const [hasVault, setHasVault] = useState(false);',
      "device states"
    );
  }

  if (!source.includes("activateThisDevice().then")) {
    const anchor = '  const monthlyTransactions = useMemo(() => {';
    const effect = `  useEffect(() => {\n    if (!isDeviceLimitEnabled) {\n      setDeviceReady(true);\n      return;\n    }\n    if (!session?.user.id || entitlement?.status !== "active") {\n      setDeviceAccess(null);\n      setDeviceReady(false);\n      return;\n    }\n\n    let current = true;\n    setDeviceReady(false);\n    activateThisDevice().then((result) => {\n      if (current) setDeviceAccess(result);\n    }).finally(() => {\n      if (current) setDeviceReady(true);\n    });\n\n    return () => { current = false; };\n  }, [session?.user.id, entitlement?.status]);\n\n${anchor}`;
    source = requiredReplace(source, anchor, effect, "device activation effect");
  }

  source = source.replace(
    'if (!authReady || !vaultReady) return <Centered',
    'if (!authReady || !vaultReady || (isDeviceLimitEnabled && entitlement?.status === "active" && !deviceReady)) return <Centered'
  );

  if (!source.includes("<DeviceAccessGate\n        access={deviceAccess ??")) {
    const anchor = '  if (!finance) {';
    const gate = `  if (isDeviceLimitEnabled && entitlement?.status === "active" && deviceReady && deviceAccess?.status !== "active") {\n    return (\n      <DeviceAccessGate\n        access={deviceAccess ?? {\n          status: "unavailable",\n          installationId: "",\n          deviceName: "Perangkat ini",\n          activeCount: 0,\n          maxDevices: 2,\n          message: "Pemeriksaan perangkat belum memberikan hasil."\n        }}\n        onRetry={async () => {\n          setDeviceReady(false);\n          try {\n            setDeviceAccess(await activateThisDevice());\n          } finally {\n            setDeviceReady(true);\n          }\n        }}\n        onSignOut={() => void supabase?.auth.signOut()}\n      />\n    );\n  }\n\n${anchor}`;
    source = requiredReplace(source, anchor, gate, "device gate mount");
  }

  return source;
});

await edit("src/components/DataPortability.tsx", (input) => {
  let source = input;

  if (!source.includes('import DeviceManager from "./DeviceManager";')) {
    source = requiredReplace(
      source,
      'import AtlasIcon from "./AtlasIcon";',
      'import AtlasIcon from "./AtlasIcon";\nimport DeviceManager from "./DeviceManager";',
      "device manager import"
    );
  }

  if (!source.includes("<DeviceManager />")) {
    source = requiredReplace(
      source,
      '      <div className="securityStatusGrid"',
      '      <DeviceManager />\n\n      <div className="securityStatusGrid"',
      "device manager mount"
    );
  }

  return source;
});

console.log("Alerantara two-device license protection ready behind feature flag");
