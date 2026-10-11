import * as React from "react";
import { db, type AdminSession } from "@/lib/db";

/**
 * Admin session state. The same instance of the adapter handles demo vs
 * Supabase; in production the `isAdmin` flag always comes from `user_roles`
 * (never from the client).
 */
export function useAdminSession() {
  const [session, setSession] = React.useState<AdminSession | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    try {
      setSession(await db.getSession());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = React.useCallback(async (email: string, password: string) => {
    const s = await db.signIn(email, password);
    setSession(s);
    return s;
  }, []);

  const signOut = React.useCallback(async () => {
    await db.signOut();
    setSession(null);
  }, []);

  return { session, loading, signIn, signOut, refresh };
}
