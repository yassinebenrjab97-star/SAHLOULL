import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import type { EquipmentType, ReformedEquipment } from "@/types";

const EQUIPMENT: EquipmentType[] = ["printer", "screen", "unit", "qr_printer"];

type Draft = Partial<ReformedEquipment>;

const emptyDraft = (): Draft => ({
  ticketNumber: "",
  equipment: "printer",
  brand: "",
  serial: "",
  service: "",
  fault: "",
  reformedAt: new Date().toISOString(),
  remarks: "",
});

export default function AdminReformed() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = React.useState<ReformedEquipment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [deleting, setDeleting] = React.useState<ReformedEquipment | null>(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setItems(await db.listReformed());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      await db.upsertReformed(draft);
      setDraft(null);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await db.deleteReformed(deleting.id);
      setDeleting(null);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const set = <K extends keyof ReformedEquipment>(key: K, value: ReformedEquipment[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps">Administration</p>
          <h1 className="mt-1 font-display text-3xl tracking-tight">{t("admin.reformedTitle")}</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{t("admin.reformedIntro")}</p>
        </div>
        <Button onClick={() => setDraft(emptyDraft())}>
          <Plus className="size-4" />
          {t("admin.addReformed")}
        </Button>
      </header>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground animate-pulse-soft">{t("common.loading")}</p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["colTicket", "colEquipment", "colBrand", "colService", "colDate", ""].map((c, i) => (
                  <th key={i} scope="col" className="border-b border-border px-3 py-3 text-start label-caps whitespace-nowrap">
                    {c ? t(`reformed.${c}`) : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-b border-border/70 last:border-b-0 hover:bg-muted/40">
                  <td className="px-3 py-3 font-mono text-xs" dir="ltr">
                    {i.ticketNumber}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">{t(`equipment.${i.equipment}`)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{i.brand}</td>
                  <td className="max-w-[200px] truncate px-3 py-3">{i.service}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                    {formatDate(i.reformedAt, i18n.language)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label={t("common.edit")} onClick={() => setDraft(i)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("common.delete")}
                        onClick={() => setDeleting(i)}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* edit / add dialog */}
      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[85dvh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.id ? t("admin.editReformed") : t("admin.addReformed")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-2">{t("reformed.colTicket")}</Label>
              <Input dir="ltr" value={draft?.ticketNumber ?? ""} onChange={(e) => set("ticketNumber", e.target.value)} />
            </div>
            <div>
              <Label className="mb-2">{t("reformed.colEquipment")}</Label>
              <select
                value={draft?.equipment ?? "printer"}
                onChange={(e) => set("equipment", e.target.value as EquipmentType)}
                className="h-11 w-full border border-input bg-surface px-3 text-sm outline-none focus-visible:border-primary"
                style={{ borderRadius: 3 }}
              >
                {EQUIPMENT.map((eq) => (
                  <option key={eq} value={eq}>
                    {t(`equipment.${eq}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-2">{t("reformed.colBrand")}</Label>
              <Input value={draft?.brand ?? ""} onChange={(e) => set("brand", e.target.value)} />
            </div>
            <div>
              <Label className="mb-2">{t("reformed.colSerial")}</Label>
              <Input dir="ltr" value={draft?.serial ?? ""} onChange={(e) => set("serial", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-2">{t("reformed.colService")}</Label>
              <Input value={draft?.service ?? ""} onChange={(e) => set("service", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-2">{t("reformed.colFault")}</Label>
              <Textarea value={draft?.fault ?? ""} onChange={(e) => set("fault", e.target.value)} />
            </div>
            <div>
              <Label className="mb-2">{t("reformed.colDate")}</Label>
              <Input
                type="date"
                dir="ltr"
                value={(draft?.reformedAt ?? "").slice(0, 10)}
                onChange={(e) => set("reformedAt", new Date(e.target.value).toISOString())}
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-2">{t("reformed.colRemarks")}</Label>
              <Input value={draft?.remarks ?? ""} onChange={(e) => set("remarks", e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDraft(null)} disabled={busy}>
              {t("common.cancel")}
            </Button>
            <Button onClick={save} disabled={busy || !draft?.service || !draft?.brand}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* delete dialog */}
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("common.delete")}</DialogTitle>
            <DialogDescription>{t("admin.deleteConfirm")}</DialogDescription>
          </DialogHeader>
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
