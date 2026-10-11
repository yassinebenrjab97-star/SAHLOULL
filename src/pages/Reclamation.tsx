import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, ArrowRight, Send } from "lucide-react";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { EquipmentTiles } from "@/components/form/EquipmentTiles";
import { FormSection } from "@/components/form/FormSection";
import { PhotoUpload, type PhotoValue } from "@/components/form/PhotoUpload";
import { SymptomChips } from "@/components/form/SymptomChips";
import { UrgencyTiles } from "@/components/form/UrgencyTiles";
import { TicketCard } from "@/components/TicketCard";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTaxonomy } from "@/hooks/useTaxonomy";
import { db } from "@/lib/db";
import { OTHER_BRAND, requestSchema, type RequestFormValues } from "@/lib/validation";
import type { NewRequestInput, ServiceRequest } from "@/types";
import { cn } from "@/lib/utils";

function FieldError({ message }: { message?: string }) {
  const { t } = useTranslation();
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs text-destructive">
      {t(message)}
    </p>
  );
}

export default function Reclamation() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { services, brands } = useTaxonomy();
  const [photo, setPhoto] = React.useState<PhotoValue | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [created, setCreated] = React.useState<ServiceRequest | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      service: "",
      brand: "",
      brandCustom: "",
      serial: "",
      description: "",
      symptoms: [],
      urgency: "normal",
      declarantName: "",
      declarantFunction: "",
      phone: "",
      email: "",
      location: "",
      availability: "",
    },
  });

  const equipment = watch("equipment");
  const brand = watch("brand");

  React.useEffect(() => {
    setValue("brand", "");
    setValue("brandCustom", "");
    setValue("symptoms", []);
  }, [equipment, setValue]);

  const serviceOptions = services.map((s) => ({ value: s.name, label: s.name }));
  const brandOptions = React.useMemo(
    () => [
      ...brands
        .filter((b) => b.equipment === equipment)
        .map((b) => ({ value: b.name, label: b.name })),
      { value: OTHER_BRAND, label: t("reclamation.brandOther") },
    ],
    [brands, equipment, t],
  );

  const onSubmit = async (values: RequestFormValues) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const resolvedBrand =
        values.brand === OTHER_BRAND ? (values.brandCustom ?? "").trim() : values.brand;
      const input: NewRequestInput = {
        service: values.service,
        equipment: values.equipment,
        brand: resolvedBrand,
        serial: values.serial || null,
        description: values.description,
        urgency: values.urgency,
        symptoms: values.symptoms ?? [],
        photoUrl: photo?.dataUrl ?? null,
        declarantName: values.declarantName,
        declarantFunction: values.declarantFunction || null,
        phone: values.phone,
        email: values.email || null,
        location: values.location,
        availability: values.availability || null,
      };
      const request = await db.createRequest(input);
      setCreated(request);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmitError(t("common.somethingWrong"));
    } finally {
      setSubmitting(false);
    }
  };

  /* ----------------------------- success view ----------------------------- */
  if (created) {
    return (
      <div className="container max-w-2xl py-14 md:py-20">
        <div className="animate-fade-up">
          <p className="label-caps flex items-center gap-3">
            <span className="inline-block h-px w-10 bg-success" aria-hidden />
            {t("reclamation.successTitle")}
          </p>
          <h1 className="mt-4 font-display text-3xl tracking-tight md:text-4xl">
            {t("tracking.title")}
          </h1>
          <p className="mt-4 text-muted-foreground">{t("reclamation.successSubtitle")}</p>

          <div className="mt-8">
            <TicketCard request={created} />
          </div>

          <div className="mt-6 flex items-start gap-3 border border-warning/40 bg-warning/10 p-4 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            <p className="text-foreground/90">{t("reclamation.successNote")}</p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => navigate("/suivi", { state: { ticket: created.ticketNumber } })}>
              {t("reclamation.trackNow")}
              <ArrowRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                reset();
                setPhoto(null);
                setCreated(null);
              }}
            >
              {t("reclamation.newRequest")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------- form view ------------------------------ */
  return (
    <div className="container max-w-4xl py-14 md:py-20">
      <header className="max-w-2xl">
        <p className="label-caps flex items-center gap-3">
          <span className="inline-block h-px w-10 bg-accent" aria-hidden />
          {t("reclamation.eyebrow")}
        </p>
        <h1 className="mt-5 font-display text-[clamp(2.1rem,5.5vw,3.4rem)] leading-[1.02] tracking-tight">
          {t("reclamation.title")}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground text-pretty">{t("reclamation.intro")}</p>
      </header>

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="mt-12">
        {/* 1 — service */}
        <FormSection index={1} title={t("reclamation.sectionService")}>
          <Label htmlFor="service" required className="mb-2">
            {t("reclamation.sectionService")}
          </Label>
          <Controller
            control={control}
            name="service"
            render={({ field }) => (
              <Combobox
                id="service"
                options={serviceOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder={t("reclamation.servicePlaceholder")}
                searchPlaceholder={t("reclamation.servicePlaceholder")}
                emptyText={t("common.none")}
                invalid={!!errors.service}
                aria-label={t("reclamation.sectionService")}
              />
            )}
          />
          <FieldError message={errors.service?.message} />
        </FormSection>

        {/* 2 — equipment */}
        <FormSection index={2} title={t("reclamation.sectionEquipment")}>
          <Controller
            control={control}
            name="equipment"
            render={({ field }) => (
              <EquipmentTiles
                value={field.value ?? ""}
                onChange={field.onChange}
                invalid={!!errors.equipment}
              />
            )}
          />
          <FieldError message={errors.equipment?.message} />
        </FormSection>

        {/* 3 — brand */}
        <FormSection index={3} title={t("reclamation.sectionBrand")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="brand" className="mb-2">
                {t("reclamation.sectionBrand")}
              </Label>
              <Controller
                control={control}
                name="brand"
                render={({ field }) => (
                  <Combobox
                    id="brand"
                    options={brandOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t("reclamation.brandPlaceholder")}
                    searchPlaceholder={t("reclamation.brandPlaceholder")}
                    emptyText={t("common.none")}
                    invalid={!!errors.brand}
                    aria-label={t("reclamation.sectionBrand")}
                    className={cn(!equipment && "opacity-60")}
                  />
                )}
              />
              <FieldError message={errors.brand?.message} />
            </div>

            {brand === OTHER_BRAND && (
              <div className="animate-fade-in">
                <Label htmlFor="brandCustom" className="mb-2" required>
                  {t("reclamation.brandCustomLabel")}
                </Label>
                <Input
                  id="brandCustom"
                  placeholder={t("reclamation.brandCustomPlaceholder")}
                  aria-invalid={!!errors.brandCustom}
                  {...register("brandCustom")}
                />
                <FieldError message={errors.brandCustom?.message} />
              </div>
            )}
          </div>

          <div className="mt-5">
            <Label htmlFor="serial" className="mb-2">
              {t("reclamation.serialLabel")}{" "}
              <span className="font-normal normal-case tracking-normal text-muted-foreground">
                ({t("common.optional")})
              </span>
            </Label>
            <Input id="serial" dir="ltr" {...register("serial")} />
            <p className="mt-1.5 text-xs text-muted-foreground">{t("reclamation.serialHint")}</p>
          </div>
        </FormSection>

        {/* 4 — detail */}
        <FormSection index={4} title={t("reclamation.sectionDetail")}>
          <div>
            <Label htmlFor="description" required className="mb-2">
              {t("reclamation.descriptionLabel")}
            </Label>
            <Textarea
              id="description"
              placeholder={t("reclamation.descriptionPlaceholder")}
              aria-invalid={!!errors.description}
              {...register("description")}
            />
            <FieldError message={errors.description?.message} />
          </div>

          {equipment && (
            <div className="mt-6">
              <Label className="mb-2">{t("reclamation.symptomsLabel")}</Label>
              <Controller
                control={control}
                name="symptoms"
                render={({ field }) => (
                  <SymptomChips
                    equipment={equipment}
                    value={field.value ?? []}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          )}

          <div className="mt-6">
            <Label className="mb-2">{t("reclamation.urgencyLabel")}</Label>
            <Controller
              control={control}
              name="urgency"
              render={({ field }) => <UrgencyTiles value={field.value} onChange={field.onChange} />}
            />
          </div>

          <div className="mt-6">
            <Label className="mb-2">{t("reclamation.photoLabel")}</Label>
            <PhotoUpload value={photo} onChange={setPhoto} />
          </div>
        </FormSection>

        {/* 5 — contact */}
        <FormSection index={5} title={t("reclamation.sectionContact")}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="declarantName" required className="mb-2">
                {t("reclamation.declarantName")}
              </Label>
              <Input
                id="declarantName"
                autoComplete="name"
                placeholder={t("reclamation.declarantNamePlaceholder")}
                aria-invalid={!!errors.declarantName}
                {...register("declarantName")}
              />
              <FieldError message={errors.declarantName?.message} />
            </div>

            <div>
              <Label htmlFor="declarantFunction" className="mb-2">
                {t("reclamation.declarantFunction")}
              </Label>
              <Input
                id="declarantFunction"
                placeholder={t("reclamation.declarantFunctionPlaceholder")}
                {...register("declarantFunction")}
              />
            </div>

            <div>
              <Label htmlFor="phone" required className="mb-2">
                {t("reclamation.phone")}
              </Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                dir="ltr"
                placeholder={t("reclamation.phonePlaceholder")}
                aria-invalid={!!errors.phone}
                {...register("phone")}
              />
              <FieldError message={errors.phone?.message} />
            </div>

            <div>
              <Label htmlFor="email" className="mb-2">
                {t("reclamation.email")}{" "}
                <span className="font-normal normal-case tracking-normal text-muted-foreground">
                  ({t("common.optional")})
                </span>
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                dir="ltr"
                placeholder={t("reclamation.emailPlaceholder")}
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              <FieldError message={errors.email?.message} />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="location" required className="mb-2">
                {t("reclamation.location")}
              </Label>
              <Input
                id="location"
                placeholder={t("reclamation.locationPlaceholder")}
                aria-invalid={!!errors.location}
                {...register("location")}
              />
              <FieldError message={errors.location?.message} />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="availability" className="mb-2">
                {t("reclamation.availability")}{" "}
                <span className="font-normal normal-case tracking-normal text-muted-foreground">
                  ({t("common.optional")})
                </span>
              </Label>
              <Input
                id="availability"
                placeholder={t("reclamation.availabilityPlaceholder")}
                {...register("availability")}
              />
            </div>
          </div>

          {submitError && (
            <p role="alert" className="mt-5 text-sm text-destructive">
              {submitError}
            </p>
          )}

          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">{t("reclamation.requiredNote")}</p>
            <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
              <Send className="size-4" />
              {submitting ? t("reclamation.submitting") : t("reclamation.submit")}
            </Button>
          </div>
        </FormSection>
      </form>

      <p className="mt-10 text-xs text-muted-foreground">
        <Link to="/suivi" className="link-underline">
          {t("nav.tracking")}
        </Link>
      </p>
    </div>
  );
}
