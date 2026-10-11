import { ExternalLink, LogOut } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, Outlet } from "react-router-dom";
import { GrainOverlay } from "@/components/GrainOverlay";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { PageFallback } from "@/components/PageFallback";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAdminSession } from "@/hooks/useAdminSession";
import type { AdminSession } from "@/lib/db";
import { cn } from "@/lib/utils";
import { AdminLogin } from "./AdminLogin";

interface AdminContextValue {
  session: AdminSession;
  signOut: () => Promise<void>;
}
export const AdminContext = React.createContext<AdminContextValue | null>(null);
export function useAdmin() {
  const ctx = React.useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside AdminLayout");
  return ctx;
}

const NAV = [
  { to: "/admin", key: "admin.sectionRequests", end: true, n: "01" },
  { to: "/admin/reformed", key: "admin.sectionReformed", end: false, n: "02" },
  { to: "/admin/services", key: "admin.sectionServices", end: false, n: "03" },
  { to: "/admin/brands", key: "admin.sectionBrands", end: false, n: "04" },
  { to: "/admin/settings", key: "admin.sectionSettings", end: false, n: "05" },
];

export function AdminLayout() {
  const { t } = useTranslation();
  const { session, loading, signIn, signOut, refresh } = useAdminSession();

  if (loading) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background">
        <p className="label-caps animate-pulse-soft">{t("admin.loading")}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <AdminLogin
        onSubmit={async (email, password) => {
          await signIn(email, password);
          await refresh();
        }}
      />
    );
  }

  if (!session.isAdmin) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background px-6 text-center">
        <div className="max-w-sm">
          <h1 className="font-display text-2xl">{t("admin.notAuthorized")}</h1>
          <Button variant="outline" className="mt-6" onClick={() => void signOut()}>
            {t("admin.signOut")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AdminContext.Provider value={{ session, signOut }}>
      <div className="relative flex min-h-[100dvh] flex-col bg-background">
        <GrainOverlay />

        <header className="sticky top-0 z-30 border-b border-border bg-foreground text-background">
          <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 md:px-6">
            <div className="flex items-center gap-3">
              <Logo className="h-7 w-7" />
              <span className="font-display text-sm tracking-tight">{t("brand.name")}</span>
              <span className="hidden border-s border-background/30 ps-3 font-mono text-[0.65rem] uppercase tracking-label text-background/70 sm:inline">
                Administration
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="hidden max-w-[220px] truncate text-xs text-background/70 md:inline" dir="ltr">
                {session.email}
              </span>
              <LanguageSwitcher compact />
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                className="text-background hover:bg-background/15"
                aria-label={t("admin.backToSite")}
                asChild
              >
                <Link to="/">
                  <ExternalLink className="size-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-background hover:bg-background/15"
                aria-label={t("admin.signOut")}
                onClick={() => void signOut()}
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="relative z-[2] mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-8 px-4 py-8 md:flex-row md:px-6 md:py-10">
          <nav aria-label="Admin" className="md:w-56 md:shrink-0">
            <ul className="no-scrollbar flex gap-1 overflow-x-auto md:sticky md:top-24 md:flex-col md:overflow-visible">
              {NAV.map((item) => (
                <li key={item.to} className="shrink-0">
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 border border-transparent px-3 py-2.5 text-sm whitespace-nowrap transition-colors",
                        isActive ? "border-border bg-surface" : "hover:border-border hover:bg-surface",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={cn("font-mono text-xs", isActive ? "text-primary" : "text-muted-foreground")}>
                          {item.n}
                        </span>
                        <span className={cn(isActive && "font-medium text-primary")}>{t(item.key)}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 flex-1">
            <React.Suspense fallback={<PageFallback />}>
              <Outlet />
            </React.Suspense>
          </div>
        </div>
      </div>
    </AdminContext.Provider>
  );
}
