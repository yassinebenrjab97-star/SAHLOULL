import { Check, RotateCcw, Save } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { db, mode, resetLocalData } from "@/lib/db";
import type { SiteSettings } from "@/types";

export default function AdminSettings() {
  const { t } = useTranslation();
  const [values, setValues] = React.useState<SiteSettings | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [resetOpen, setResetOpen] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    db.getSettings()
      .then((s) => alive && setValues(s))
      .catch(() => void 0);
    return () => {
      alive = false;
    };
  }, []);

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) =>
    setValues((v) => (v ? { ...v, [key]: value } : v));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values) return;
    setBusy(true);
    try {
      const next = await db.updateSettings(values);
      setValues(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } finally {
      setBusy(false);
    }
  };

  const doReset = () => {
    resetLocalData();
    window.location.href = "/";
  };

  const FIELDS: { key: keyof SiteSettings; label: string; ltr?: boolean; textarea?: boolean }[] = [
    { key: "phone", label: t("admin.phone"), ltr: true },
    { key: "extension", label: t("admin.extension"), ltr: true },
    { key: "email", label: t("admin.email"), ltr: true },
    { key: "hours", label: t("admin.hours") },
    { key: "address", label: t("admin.address"), textarea: true },
  ];

  return (
    <div className="space-y-6">
      <header>
        <p className="label-caps">Administration</p>
        <h1 className="mt-1 font-display text-3xl tracking-tight">{t("admin.settingsTitle")}</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">{t("admin.settingsIntro")}</p>
      </header>

      {values && (
        <form onSubmit={save} className="space-y-5 border border-border bg-surface p-5 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.key} className={f.textarea ? "sm:col-span-2" : undefined}>
                <Label htmlFor={`setting-${f.key}`} className="mb-2">
                  {f.label}
                </Label>
                {f.textarea ? (
                  <Textarea
                    id={`setting-${f.key}`}
                    dir={f.ltr ? "ltr" : undefined}
                    value={values[f.key]}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                ) : (
                  <Input
                    id={`setting-${f.key}`}
                    dir={f.ltr ? "ltr" : undefined}
                    value={values[f.key]}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={busy}>
              <Save className="size-4" />
              {t("admin.saveChanges")}
            </Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-xs text-success">
                <Check className="size-3.5" />
                {t("admin.saved")}
              </span>
            )}
          </div>
        </form>
      )}

      {mode === "local" && (
        <section className="border border-destructive/40 bg-destructive/5 p-5">
          <h2 className="font-display text-lg tracking-tight text-destructive">{t("admin.resetDemo")}</h2>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{t("admin.resetDemoText")}</p>
          <Button variant="destructive" className="mt-4" onClick={() => setResetOpen(true)}>
            <RotateCcw className="size-4" />
            {t("admin.resetDemoBtn")}
          </Button>
        </section>
      )}

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.resetDemo")}</DialogTitle>
            <DialogDescription>{t("admin.deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={doReset}>
              <RotateCcw className="size-4" />
              {t("admin.resetDemoBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
