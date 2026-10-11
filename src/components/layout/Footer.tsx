import { Mail, MapPin, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { useSettings } from "@/hooks/useSettings";
import { telHref } from "@/lib/utils";

export function Footer() {
  const { t } = useTranslation();
  const s = useSettings();
  const year = new Date().getFullYear();

  const links = [
    { to: "/", key: "nav.home" },
    { to: "/reclamation", key: "nav.complaint" },
    { to: "/suivi", key: "nav.tracking" },
    { to: "/materiel-reforme", key: "nav.reformed" },
  ];

  return (
    <footer className="relative z-[2] mt-24 border-t border-border bg-surface">
      <div className="container grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1.2fr] md:gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Logo className="h-9 w-9" />
            <span className="font-display text-lg leading-tight">
              {t("brand.hospital")}
            </span>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">{t("footer.tagline")}</p>
          <p className="label-caps">{t("brand.city")}</p>
        </div>

        <nav aria-label={t("footer.nav")} className="flex flex-col gap-3">
          <h2 className="label-caps">{t("footer.nav")}</h2>
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="link-underline w-fit text-sm text-foreground/80 hover:text-foreground"
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-3">
          <h2 className="label-caps">{t("footer.contact")}</h2>
          <a
            href={telHref(s.phone)}
            className="flex items-center gap-2.5 text-sm text-foreground/85 hover:text-foreground"
          >
            <Phone className="size-3.5 text-primary" aria-hidden />
            <span dir="ltr">{s.phone}</span>
            <span className="text-muted-foreground">· {t("home.contactExtension")} {s.extension}</span>
          </a>
          <a
            href={`mailto:${s.email}`}
            className="flex items-center gap-2.5 text-sm text-foreground/85 hover:text-foreground"
          >
            <Mail className="size-3.5 text-primary" aria-hidden />
            <span dir="ltr">{s.email}</span>
          </a>
          <p className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
            {s.address}
          </p>
        </div>
      </div>

      <div className="border-t border-border/70">
        <div className="container flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {t("footer.department")}. {t("footer.rights")}
          </p>
          <p>{t("footer.emergencyNote")}</p>
        </div>
      </div>
    </footer>
  );
}
