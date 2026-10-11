import { AlertTriangle, RotateCcw } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface State {
  error: Error | null;
}

function ErrorFallback() {
  const { t } = useTranslation();
  return (
    <div className="container flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
      <AlertTriangle className="size-8 text-destructive" aria-hidden />
      <h1 className="mt-5 font-display text-3xl tracking-tight">{t("errors.generic")}</h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground text-pretty">
        {t("common.somethingWrong")}
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => window.location.reload()}>
          <RotateCcw className="size-4" />
          {t("common.retry")}
        </Button>
        <Button asChild variant="outline">
          <a href="/">{t("notFound.cta")}</a>
        </Button>
      </div>
    </div>
  );
}

/**
 * Catches render/import errors so a single failure never leaves a blank page.
 * Give it a `key` tied to the route when used around a router outlet so it
 * resets automatically on navigation.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[Sahloul IT Desk]", error);
  }

  render() {
    if (this.state.error) return <ErrorFallback />;
    return this.props.children;
  }
}
