import { Menu, X } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, useLocation } from "react-router-dom";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", key: "nav.home", end: true },
  { to: "/reclamation", key: "nav.complaint", end: false },
  { to: "/suivi", key: "nav.tracking", end: false },
  { to: "/materiel-reforme", key: "nav.reformed", end: false },
];

export function Header() {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:border focus:border-border focus:bg-surface focus:px-3 focus:py-1.5 focus:text-sm"
      >
        {t("common.jumpToContent")}
      </a>

      <div className="container flex h-16 items-center justify-between gap-4 md:h-20">
        <Link to="/" className="group flex items-center gap-3" aria-label={t("brand.name")}>
          <Logo className="h-9 w-9 transition-transform duration-300 group-hover:scale-[1.04] md:h-11 md:w-11" />
          <span className="flex flex-col">
            <span className="font-display text-[0.95rem] leading-tight tracking-tight md:text-[1.05rem]">
              {t("brand.hospital")}
            </span>
            <span className="label-caps leading-tight">{t("brand.department")}</span>
          </span>
        </Link>

        <nav aria-label="Navigation" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "link-underline px-3 py-2 text-sm tracking-wide transition-colors",
                  isActive ? "font-medium text-primary" : "text-foreground/75 hover:text-foreground",
                )
              }
            >
              {t(item.key)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <LanguageSwitcher compact />
          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t("common.close") : t("common.menu")}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div id="mobile-nav" className="border-t border-border bg-surface lg:hidden">
          <nav aria-label="Navigation" className="container flex flex-col py-2">
            {NAV.map((item, i) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                style={{ animationDelay: `${i * 45}ms` }}
                className={({ isActive }) =>
                  cn(
                    "animate-fade-up border-b border-border/60 py-3.5 text-base tracking-wide last:border-b-0",
                    isActive ? "font-medium text-primary" : "text-foreground/80",
                  )
                }
              >
                {t(item.key)}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
