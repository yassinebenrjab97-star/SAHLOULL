import { Plus, Trash2 } from "lucide-react";
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
import { EQUIPMENT_TYPES } from "@/lib/constants";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import type { BrandRow, EquipmentType } from "@/types";

export default function AdminBrands() {
  const { t } = useTranslation();
  const [items, setItems] = React.useState<BrandRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [active, setActive] = React.useState<EquipmentType>("printer");
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [deleting, setDeleting] = React.useState<BrandRow | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setItems(await db.listBrands());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = name.trim();
    if (!value) return;
    setBusy(true);
    try {
      await db.addBrand(active, value);
      setName("");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await db.deleteBrand(deleting.id);
      setDeleting(null);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const grouped = React.useMemo(() => {
    const map: Record<EquipmentType, BrandRow[]> = {
      printer: [],
      screen: [],
      unit: [],
      qr_printer: [],
    };
    for (const row of items) map[row.equipment]?.push(row);
    for (const key of Object.keys(map) as EquipmentType[]) {
      map[key].sort((a, b) => a.name.localeCompare(b.name, "fr"));
    }
    return map;
  }, [items]);

  return (
    <div className="space-y-6">
      <header>
        <p className="label-caps">Administration</p>
        <h1 className="mt-1 font-display text-3xl tracking-tight">{t("admin.brandsTitle")}</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">{t("admin.brandsIntro")}</p>
      </header>

      {/* equipment tabs */}
      <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
        {EQUIPMENT_TYPES.map((eq) => (
          <button
            key={eq.value}
            type="button"
            onClick={() => setActive(eq.value)}
            className={cn(
              "shrink-0 border px-3 py-2 text-sm whitespace-nowrap transition-colors",
              active === eq.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-foreground/80 hover:border-foreground",
            )}
            style={{ borderRadius: 3 }}
          >
            {t(`equipment.${eq.value}`)}
            <span className="ms-2 font-mono text-xs opacity-70">{grouped[eq.value].length}</span>
          </button>
        ))}
      </div>

      <form onSubmit={add} className="flex flex-wrap gap-3 border border-border bg-surface p-4">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("admin.addBrandPlaceholder")}
          aria-label={`${t("admin.addBrandPlaceholder")} — ${t(`equipment.${active}`)}`}
          className="min-w-[220px] flex-1"
        />
        <Button type="submit" disabled={busy || name.trim().length < 1}>
          <Plus className="size-4" />
          {t("common.add")}
        </Button>
      </form>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground animate-pulse-soft">{t("common.loading")}</p>
      ) : grouped[active].length === 0 ? (
        <p className="border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {t("common.none")}
        </p>
      ) : (
        <ul className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {grouped[active].map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 bg-surface px-4 py-3">
              <span className="truncate text-sm">{b.name}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`${t("common.delete")} — ${b.name}`}
                onClick={() => setDeleting(b)}
              >
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("common.delete")}</DialogTitle>
            <DialogDescription>{t("admin.deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <p className="font-display text-lg">{deleting?.name}</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)} disabled={busy}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={busy}>
              <Trash2 className="size-4" />
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
