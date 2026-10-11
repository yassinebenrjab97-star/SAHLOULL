import { AlertTriangle, Lock } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { GrainOverlay } from "@/components/GrainOverlay";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_ADMIN, mode } from "@/lib/db";

export function AdminLogin({
  onSubmit,
}: {
  onSubmit: (email: string, password: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [email, setEmail] = React.useState(mode === "local" ? DEMO_ADMIN.email : "");
  const [password, setPassword] = React.useState(mode === "local" ? DEMO_ADMIN.password : "");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit(email, password);
    } catch {
      setError(t("admin.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative grid min-h-[100dvh] place-items-center bg-background px-4 py-10">
      <GrainOverlay />
      <div className="absolute end-4 top-4 z-10 flex items-center gap-1">
        <LanguageSwitcher compact />
        <ThemeToggle />
      </div>

      <div className="relative z-[2] w-full max-w-sm animate-fade-up">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo className="h-14 w-14" />
          <p className="mt-4 font-display text-lg leading-tight">{t("brand.hospital")}</p>
          <p className="label-caps mt-1">{t("brand.department")}</p>
        </div>

        <form onSubmit={submit} className="cut-tr border border-border bg-surface p-6 shadow-paper sm:p-8">
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-primary" aria-hidden />
            <h1 className="font-display text-xl tracking-tight">{t("admin.loginTitle")}</h1>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">{t("admin.loginSubtitle")}</p>

          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="admin-email" required className="mb-2">
                {t("admin.email")}
              </Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="username"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="admin-password" required className="mb-2">
                {t("admin.password")}
              </Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="mt-6 w-full" disabled={loading}>
            {loading ? t("admin.signingIn") : t("admin.signIn")}
          </Button>
        </form>

        {mode === "local" && (
          <p className="mt-4 flex items-start gap-2 border border-warning/40 bg-warning/10 p-3 text-xs text-foreground/85">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
            {t("admin.demoHint")}
          </p>
        )}

        <p className="mt-6 text-center">
          <Link to="/" className="link-underline text-sm text-muted-foreground hover:text-foreground">
            {t("admin.backToSite")}
          </Link>
        </p>
      </div>
    </div>
  );
}
