import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <section className="container flex min-h-[62vh] flex-col justify-center py-20">
      <p className="font-mono text-sm tracking-label text-primary">404</p>
      <h1 className="mt-4 font-display text-[clamp(2.4rem,6vw,4.5rem)] font-light leading-[1] tracking-tight">
        {t("notFound.title")}
      </h1>
      <p className="mt-5 max-w-md text-muted-foreground text-pretty">{t("notFound.text")}</p>
      <div className="mt-8">
        <Button asChild variant="outline">
          <Link to="/">
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {t("notFound.cta")}
          </Link>
        </Button>
      </div>
    </section>
  );
}
