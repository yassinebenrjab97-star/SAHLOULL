import { isSupabaseEnabled } from "@/lib/supabase";
import type { DataAdapter } from "./adapter";
import { createLocalAdapter, DEMO_ADMIN, resetLocalData } from "./local";
import { createSupabaseAdapter } from "./supabase";

/**
 * The active data adapter.
 * - Supabase configured  → production adapter (real DB, auth, storage, RLS).
 * - Otherwise            → local adapter (browser storage) so the app is fully
 *                          usable for evaluation without any backend.
 */
export const db: DataAdapter = isSupabaseEnabled
  ? createSupabaseAdapter()
  : createLocalAdapter();

export const mode = db.mode;
export { DEMO_ADMIN, resetLocalData };
export type { AdminSession, DataAdapter, ReformedFilters, RequestFilters, StatusUpdate } from "./adapter";
