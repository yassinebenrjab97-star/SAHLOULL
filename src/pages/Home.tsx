import { ArrowRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import { telHref } from "@/lib/utils";

const STEPS = [
  { n: "01", title: "home.step1Title", text: "home.step1Text" },
  { n: "02", title: "home.step2Title", text: "home.step2Text" },
  { n: "03", title: "home.step3Title", text: "home.step3Text" },
  { n: "04", title: "home.step4Title", text: "home.step4Text" },
];

export default function Home() {
  const { t } = useTranslation();
  const s = useSettings();

  const contact = [
    { icon: Phone, label: t("home.contactPhone"), value: s.phone, href: telHref(s.phone), ltr: true },
    {
      icon: Phone,
      label: t("home.contactExtension"),
      value: s.extension,
      href: telHref(s.extension),
      ltr: true,
    },
    { icon: Mail, label: t("home.contactEmail"), value: s.email, href: `mailto:${s.email}`, ltr: true },
    { icon: Clock, label: t("home.contactHours"), value: s.hours, href: undefined, ltr: false },
  ];

  return (
    <div className="relative">
      {/* ============================= HERO ============================= */}
      <section className="container grid gap-12 pt-14 pb-16 md:grid-cols-[1.55fr_1fr] md:items-end md:gap-16 md:pt-24 md:pb-24">
        <div>
          <p className="label-caps flex items-center gap-3">
            <span className="inline-block h-px w-10 bg-accent" aria-hidden />
            {t("home.eyebrow")}
          </p>

          <h1 className="mt-6 font-display text-[clamp(2.6rem,7.2vw,5.2rem)] font-light leading-[0.98] tracking-tight text-balance">
            {t("home.title")}
            <br />
            <em className="italic text-primary">{t("home.titleAccent")}</em>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
            {t("home.intro")}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="group">
              <Link to="/reclamation">
                {t("home.ctaDeclare")}
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/suivi">{t("home.ctaTrack")}</Link>
            </Button>
          </div>
        </div>

        {/* Emblem seal */}
        <Reveal delay={140} className="relative">
          <figure className="cut-tr relative border border-border bg-surface p-8 shadow-paper">
            <div className="mx-auto grid size-40 place-items-center md:size-48">
              <Logo className="h-32 w-32 md:h-40 md:w-40" />
            </div>
            <figcaption className="mt-8 border-t border-border pt-5 text-center">
              <p className="font-display text-lg leading-tight">{t("brand.hospital")}</p>
              <p className="label-caps mt-1.5">{t("brand.department")}</p>
            </figcaption>
          </figure>
          <div className="mt-5 flex items-center justify-between px-1">
            <span className="label-caps">{t("brand.name")}</span>
            <span className="label-caps">{t("brand.city")}</span>
          </div>
        </Reveal>
      </section>

      {/* ============================= STEPS ============================ */}
      <section className="border-y border-border bg-surface">
        <div className="container py-16 md:py-20">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="label-caps">{t("workflow.title")}</p>
              <h2 className="mt-3 font-display text-3xl tracking-tight md:text-4xl">
                {t("home.stepsTitle")}
              </h2>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">{t("home.stepsSubtitle")}</p>
          </div>

          <ol className="mt-12 grid gap-px border border-border bg-border md:grid-cols-4">
            {STEPS.map((step, i) => (
              <Reveal
                key={step.n}
                as="li"
                delay={i * 90}
                className="group flex flex-col bg-surface p-7 transition-colors hover:bg-background"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-5xl font-light leading-none text-primary/25 transition-colors group-hover:text-primary/50">
                    {step.n}
                  </span>
                  <span className="label-caps">{t("home.stepWord")} {i + 1}</span>
                </div>
                <h3 className="mt-7 font-display text-xl tracking-tight">{t(step.title)}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{t(step.text)}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ============================ CONTACT =========================== */}
      <section className="container py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <div>
            <p className="label-caps">{t("footer.contact")}</p>
            <h2 className="mt-3 font-display text-3xl tracking-tight md:text-4xl">
              {t("home.contactTitle")}
            </h2>
            <p className="mt-4 max-w-sm text-muted-foreground">{t("home.contactSubtitle")}</p>
            <Button asChild variant="outline" className="mt-6">
              <a href={`mailto:${s.email}`}>
                <Mail className="size-4" />
                {t("home.contactCta")}
              </a>
            </Button>
          </div>

          <dl className="grid gap-px self-start border border-border bg-border sm:grid-cols-2">
            {contact.map((c) => (
              <div key={c.label} className="flex flex-col gap-2 bg-background p-6">
                <dt className="label-caps flex items-center gap-2">
                  <c.icon className="size-3.5 text-primary" aria-hidden />
                  {c.label}
                </dt>
                <dd className="text-base text-foreground">
                  {c.href ? (
                    <a href={c.href} className="link-underline" dir={c.ltr ? "ltr" : undefined}>
                      {c.value}
                    </a>
                  ) : (
                    c.value
                  )}
                </dd>
              </div>
            ))}
            <div className="flex flex-col gap-2 bg-background p-6 sm:col-span-2">
              <dt className="label-caps flex items-center gap-2">
                <MapPin className="size-3.5 text-primary" aria-hidden />
                {t("home.contactAddress")}
              </dt>
              <dd className="text-base text-foreground">{s.address}</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
