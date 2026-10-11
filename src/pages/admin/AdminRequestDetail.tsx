import { ArrowLeft, Mail, Pencil, Phone, Save, Trash2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { StatusStamp } from "@/components/StatusStamp";
import { Timeline } from "@/components/Timeline";
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
import { useAdmin } from "@/pages/admin/AdminLayout";
import { db } from "@/lib/db";
import { nextTransitions, type Transition } from "@/lib/status";
import { formatDate, telHref } from "@/lib/utils";
import type { ServiceRequest, Urgency } from "@/types";

function InfoRow({ label, value, ltr }: { label: string; value: React.ReactNode; ltr?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="label-caps">{label}</dt>
      <dd className="text-sm text-foreground/90" dir={ltr ? "ltr" : undefined}>
        {value}
      </dd>
    </div>
  );
}

export default function AdminRequestDetail() {
  const { t, i18n } = useTranslation();
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { session } = useAdmin();

  const [request, setRequest] = React.useState<ServiceRequest | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notes, setNotes] = React.useState("");
  const [notesSaving, setNotesSaving] = React.useState(false);
  const [notesSaved, setNotesSaved] = React.useState(false);

  const [pending, setPending] = React.useState<Transition | null>(null);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [form, setForm] = React.useState<Partial<ServiceRequest>>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await db.getRequest(id);
      setRequest(r);
      setNotes(r?.internalNotes ?? "");
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="py-16 text-center text-sm text-muted-foreground animate-pulse-soft">{t("common.loading")}</p>;
  }
  if (!request) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">{t("errors.notFound")}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/admin">{t("admin.backToList")}</Link>
        </Button>
      </div>
    );
  }

  const transitions = nextTransitions(request.status);

  const runTransition = async (transition: Transition, note?: string) => {
    setBusy(true);
    try {
      const updated = await db.updateRequestStatus(request.id, {
        to: transition.to,
        note: note ?? null,
        by: session.email,
      });
      setRequest(updated);
      setPending(null);
      setReason("");
    } catch {
      /* surfaced by the disabling state */
    } finally {
      setBusy(false);
    }
  };

  const onActionClick = (transition: Transition) => {
    if (transition.requiresReason) {
      setPending(transition);
      setReason("");
    } else {
      void runTransition(transition);
    }
  };

  const saveNotes = async () => {
    setNotesSaving(true);
    try {
      const updated = await db.updateRequest(request.id, { internalNotes: notes });
      setRequest(updated);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2200);
    } finally {
      setNotesSaving(false);
    }
  };

  const openEdit = () => {
    setForm({
      service: request.service,
      brand: request.brand,
      serial: request.serial ?? "",
      description: request.description,
      urgency: request.urgency,
      declarantName: request.declarantName,
      phone: request.phone,
      email: request.email ?? "",
      location: request.location,
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    setBusy(true);
    try {
      const updated = await db.updateRequest(request.id, form);
      setRequest(updated);
      setEditOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await db.deleteRequest(request.id);
      navigate("/admin");
    } finally {
      setBusy(false);
    }
  };

  const urgencyTone: Record<Urgency, string> = {
    normal: "text-muted-foreground",
    urgent: "text-warning",
    critical: "text-destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button asChild variant="ghost" size="sm" className="-ms-2">
          <Link to="/admin">
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {t("admin.backToList")}
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Pencil className="size-4" />
            {t("common.edit")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4 text-destructive" />
            {t("common.delete")}
          </Button>
        </div>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="label-caps">{t("admin.detailTitle")}</p>
          <h1 className="mt-1 font-mono text-2xl tracking-tight" dir="ltr">
            {request.ticketNumber}
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("admin.createdAt")} {formatDate(request.createdAt, i18n.language, true)} · {t("admin.updatedAt")}{" "}
            {formatDate(request.updatedAt, i18n.language, true)}
          </p>
        </div>
        <StatusStamp status={request.status} />
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {/* workflow actions */}
          <section className="border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="label-caps">{t("admin.transitionTitle")}</h2>
              <span className="text-xs text-muted-foreground">{t("admin.currentStatus")}: {t(`status.${request.status}`)}</span>
            </div>

            {transitions.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">{t(`statusDesc.${request.status}`)}</p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {transitions.map((tr) => (
                  <Button
                    key={tr.to}
                    type="button"
                    disabled={busy}
                    variant={tr.tone === "danger" ? "destructive" : tr.tone === "success" ? "default" : "outline"}
                    onClick={() => onActionClick(tr)}
                  >
                    {t(tr.action)}
                  </Button>
                ))}
              </div>
            )}

            {request.status === "pending_acceptance" && (
              <p className="mt-4 border-s-2 border-warning ps-3 text-xs text-muted-foreground">
                {t("tracking.warningPending")}
              </p>
            )}
          </section>

          {/* declaration */}
          <section className="border border-border bg-surface p-5">
            <h2 className="label-caps">{t("admin.descriptionTitle")}</h2>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <InfoRow label={t("reclamation.sectionService")} value={request.service} />
              <InfoRow label={t("reclamation.sectionEquipment")} value={t(`equipment.${request.equipment}`)} />
              <InfoRow label={t("reclamation.sectionBrand")} value={request.brand} />
              <InfoRow label={t("reclamation.serialLabel")} value={request.serial || "—"} ltr />
              <InfoRow
                label={t("reclamation.urgencyLabel")}
                value={<span className={urgencyTone[request.urgency]}>{t(`urgency.${request.urgency}`)}</span>}
              />
            </dl>

            <div className="mt-5">
              <p className="label-caps">{t("admin.descriptionTitle")}</p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground/90">{request.description}</p>
            </div>

            {request.symptoms.length > 0 && (
              <div className="mt-5">
                <p className="label-caps">{t("admin.symptomsTitle")}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {request.symptoms.map((s) => (
                    <span key={s} className="border border-border bg-background px-2 py-0.5 text-xs" style={{ borderRadius: 2 }}>
                      {t(`symptoms.${s}`)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5">
              <p className="label-caps">{t("admin.photoTitle")}</p>
              {request.photoUrl ? (
                <img
                  src={request.photoUrl}
                  alt=""
                  className="mt-2 max-h-80 w-full border border-border object-contain"
                  style={{ borderRadius: 2 }}
                />
              ) : (
                <p className="mt-1.5 text-sm text-muted-foreground">{t("admin.noPhoto")}</p>
              )}
            </div>
          </section>

          {/* history */}
          <section className="border border-border bg-surface p-5">
            <h2 className="label-caps">{t("admin.statusHistory")}</h2>
            <div className="mt-6">
              <Timeline request={request} />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          {/* contact */}
          <section className="border border-border bg-surface p-5">
            <h2 className="label-caps">{t("tracking.contactTitle")}</h2>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">{t("reclamation.declarantName")}</p>
                <p className="text-foreground">
                  {request.declarantName}
                  {request.declarantFunction ? ` · ${request.declarantFunction}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href={telHref(request.phone)}>
                    <Phone className="size-3.5" />
                    {t("admin.callNow")}
                  </a>
                </Button>
                {request.email && (
                  <Button asChild variant="outline" size="sm">
                    <a href={`mailto:${request.email}`}>
                      <Mail className="size-3.5" />
                      {t("admin.sendEmail")}
                    </a>
                  </Button>
                )}
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p dir="ltr">{request.phone}</p>
                {request.email && <p dir="ltr">{request.email}</p>}
                <p>
                  <span className="text-foreground/70">{t("admin.locationTitle")}: </span>
                  {request.location}
                </p>
                {request.availability && (
                  <p>
                    <span className="text-foreground/70">{t("admin.availabilityTitle")}: </span>
                    {request.availability}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* internal notes */}
          <section className="border border-border bg-surface p-5">
            <h2 className="label-caps">{t("admin.internalNotes")}</h2>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("admin.internalNotesPlaceholder")}
              className="mt-3 min-h-[120px]"
            />
            <div className="mt-3 flex items-center gap-3">
              <Button size="sm" onClick={saveNotes} disabled={notesSaving}>
                <Save className="size-3.5" />
                {t("admin.saveNotes")}
              </Button>
              {notesSaved && <span className="text-xs text-success">{t("admin.notesSaved")}</span>}
            </div>
          </section>
        </aside>
      </div>

      {/* reason dialog */}
      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pending ? t(pending.action) : ""}</DialogTitle>
            <DialogDescription>
              {pending?.to === "unrepairable" ? t("admin.unrepairableWarning") : t("admin.reasonLabel")}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="reason" className="mb-2" required>
              {t("admin.reasonLabel")}
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("admin.reasonPlaceholder")}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPending(null)} disabled={busy}>
              {t("common.cancel")}
            </Button>
            <Button
              variant={pending?.tone === "danger" ? "destructive" : "default"}
              disabled={busy || reason.trim().length < 3}
              onClick={() => pending && runTransition(pending, reason.trim())}
            >
              {pending?.to === "unrepairable"
                ? t("admin.confirmUnrepairable")
                : pending?.to === "refused"
                  ? t("admin.confirmRefuse")
                  : t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85dvh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("common.edit")}</DialogTitle>
            <DialogDescription className="font-mono" dir="ltr">
              {request.ticketNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="mb-2">{t("reclamation.sectionService")}</Label>
              <Input value={form.service ?? ""} onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))} />
            </div>
            <div>
              <Label className="mb-2">{t("reclamation.sectionBrand")}</Label>
              <Input value={form.brand ?? ""} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />
            </div>
            <div>
              <Label className="mb-2">{t("reclamation.serialLabel")}</Label>
              <Input dir="ltr" value={form.serial ?? ""} onChange={(e) => setForm((f) => ({ ...f, serial: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-2">{t("reclamation.descriptionLabel")}</Label>
              <Textarea
                value={form.description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <Label className="mb-2">{t("reclamation.urgencyLabel")}</Label>
              <select
                value={form.urgency ?? "normal"}
                onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value as Urgency }))}
                className="h-11 w-full border border-input bg-surface px-3 text-sm outline-none focus-visible:border-primary"
                style={{ borderRadius: 3 }}
              >
                {(["normal", "urgent", "critical"] as Urgency[]).map((u) => (
                  <option key={u} value={u}>
                    {t(`urgency.${u}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-2">{t("reclamation.declarantName")}</Label>
              <Input
                value={form.declarantName ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, declarantName: e.target.value }))}
              />
            </div>
            <div>
              <Label className="mb-2">{t("reclamation.phone")}</Label>
              <Input dir="ltr" value={form.phone ?? ""} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label className="mb-2">{t("reclamation.email")}</Label>
              <Input dir="ltr" value={form.email ?? ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-2">{t("reclamation.location")}</Label>
              <Input value={form.location ?? ""} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={busy}>
              {t("common.cancel")}
            </Button>
            <Button onClick={saveEdit} disabled={busy}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.deleteRequest")}</DialogTitle>
            <DialogDescription>{t("admin.deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={busy}>
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
