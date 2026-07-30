import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Entitlement } from "../types";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

export async function signInWithGoogle(): Promise<void> {
  if (!supabase) throw new Error("Supabase belum dikonfigurasi.");

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin }
  });

  if (error) throw error;
}

export async function sendMagicLink(email: string): Promise<void> {
  if (!supabase) throw new Error("Supabase belum dikonfigurasi.");

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin }
  });

  if (error) throw error;
}

export async function getEntitlement(userId: string): Promise<Entitlement> {
  if (!supabase) {
    return { status: "active", productCode: "atlas-finance-preview", source: "preview" };
  }

  const { data, error } = await supabase
    .from("user_entitlements")
    .select("status, product_code")
    .eq("user_id", userId)
    .eq("product_code", "atlas-finance")
    .maybeSingle();

  if (error) {
    console.error("Entitlement check failed", error);
    return { status: "unknown", productCode: null, source: "supabase" };
  }

  return {
    status: data?.status ?? "inactive",
    productCode: data?.product_code ?? null,
    source: "supabase"
  };
}
