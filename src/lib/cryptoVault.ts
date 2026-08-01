import { readVault, writeVault } from "./localDb";
import type { FinanceState } from "../types";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const ITERATIONS = 310000;

export interface VaultEnvelope {
  version: 1;
  salt: string;
  iv: string;
  ciphertext: string;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 32768;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(encoder.encode(pin)),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: toArrayBuffer(salt), iterations: ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function decryptVaultEnvelope(pin: string, envelope: VaultEnvelope): Promise<FinanceState> {
  const key = await deriveKey(pin, base64ToBytes(envelope.salt));

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: toArrayBuffer(base64ToBytes(envelope.iv)) },
      key,
      toArrayBuffer(base64ToBytes(envelope.ciphertext))
    );
    return JSON.parse(decoder.decode(decrypted)) as FinanceState;
  } catch {
    throw new Error("PIN tidak cocok atau salinan tidak dapat dibuka.");
  }
}

export async function vaultExists(): Promise<boolean> {
  return Boolean(await readVault<VaultEnvelope>());
}

export async function saveFinanceState(pin: string, state: FinanceState): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);
  const plaintext = encoder.encode(JSON.stringify(state));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(plaintext)
  );

  await writeVault({
    version: 1,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encrypted))
  } satisfies VaultEnvelope);
}

export async function loadFinanceState(pin: string): Promise<FinanceState | null> {
  const envelope = await readVault<VaultEnvelope>();
  if (!envelope) return null;
  return decryptVaultEnvelope(pin, envelope);
}
