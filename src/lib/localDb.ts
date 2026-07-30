const DB_NAME = "atlas-finance-commercial";
const DB_VERSION = 1;
const STORE_NAME = "secure_vault";
const VAULT_KEY = "primary";

interface StoredValue {
  value: unknown;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Database lokal gagal dibuka."));
  });
}

export async function readVault<T>(): Promise<T | null> {
  const database = await openDb();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(VAULT_KEY);

    request.onsuccess = () => {
      const stored = request.result as StoredValue | undefined;
      resolve((stored?.value as T | undefined) ?? null);
    };
    request.onerror = () => reject(request.error ?? new Error("Data lokal gagal dibaca."));
  });
}

export async function writeVault(value: unknown): Promise<void> {
  const database = await openDb();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put({ value } satisfies StoredValue, VAULT_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Data lokal gagal disimpan."));
  });
}

export async function clearVault(): Promise<void> {
  const database = await openDb();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(VAULT_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Data lokal gagal dihapus."));
  });
}
