import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { STATUS_FLOW, statusMeta } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import type { RequestStatus, ServiceRequest } from "@/types";
import { cn } from "@/lib/utils";

type NodeState = "done" | "current" | "todo";

interface Node {
  status: RequestStatus;
  state: NodeState;
  at?: string;
  note?: string | null;
}

function buildNodes(request: ServiceRequest): Node[] {
  const atOf = (s: RequestStatus) =>
    request.history.find((h) => h.status === s);
  const currentStep = statusMeta(request.status).step;

  if (request.status === "refused") {
    return [
      { status: "pending_acceptance", state: "done", at: atOf("pending_acceptance")?.at },
      {
        status: "refused",
        state: "current",
        at: atOf("refused")?.at,
        note: request.refusalReason,
      },
    ];
  }

  const nodes: Node[] = STATUS_FLOW.map((status) => {
    const step = statusMeta(status).step;
    const state: NodeState = step < currentStep ? "done" : step === currentStep ? "current" : "todo";
    const entry = atOf(status);
    return { status, state, at: entry?.at, note: entry?.note };
  });

  // When unrepairable, the final node is re-labelled to the terminal branch.
  if (request.status === "unrepairable") {
    const last = nodes[nodes.length - 1];
    last.status = "unrepairable";
    last.note = atOf("unrepairable")?.note;
    last.at = atOf("unrepairable")?.at;
  }
  return nodes;
}

export function Timeline({ request }: { request: ServiceRequest }) {
  const { t, i18n } = useTranslation();
  const nodes = buildNodes(request);

  return (
    <ol className="relative flex flex-col">
      {nodes.map((node, i) => {
        const meta = statusMeta(node.status);
        const isLast = i === nodes.length - 1;
        const done = node.state === "done";
        const current = node.state === "current";

        return (
          <li
            key={`${node.status}-${i}`}
            style={{ animationDelay: `${i * 70}ms` }}
            className="relative flex gap-4 animate-fade-up"
          >
            {/* rail */}
            <div className="relative flex w-9 shrink-0 flex-col items-center">
              <span
                className={cn(
                  "z-10 grid size-9 place-items-center border font-mono text-sm transition-colors",
                  done && "border-primary bg-primary text-primary-foreground",
                  current && "border-primary bg-surface text-primary",
                  !done && !current && "border-border bg-surface text-muted-foreground",
                )}
                style={{ borderRadius: 2 }}
              >
                {done ? <Check className="size-4" aria-hidden /> : String(i + 1).padStart(2, "0")}
              </span>
              {!isLast && (
                <span
                  className={cn(
                    "w-px flex-1 grow",
                    done ? "bg-primary/60" : "bg-border",
                  )}
                  aria-hidden
                />
              )}
            </div>

            {/* content */}
            <div className={cn("flex-1 pb-7", isLast && "pb-0")}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3
                  className={cn(
                    "font-display text-base leading-tight tracking-tight",
                    current && "text-primary",
                    node.state === "todo" && "text-muted-foreground",
                  )}
                >
                  {current && (
                    <span className="me-2 inline-block size-2 -translate-y-px animate-pulse-soft rounded-full bg-primary align-middle" />
                  )}
                  {t(`status.${node.status}`)}
                </h3>
                {node.at && (
                  <time className="font-mono text-[0.7rem] text-muted-foreground" dir="ltr">
                    {formatDate(node.at, i18n.language, true)}
                  </time>
                )}
              </div>
              <p
                className={cn(
                  "mt-1 text-sm",
                  node.state === "todo" ? "text-muted-foreground/70" : "text-muted-foreground",
                )}
              >
                {t(`statusDesc.${node.status}`)}
              </p>
              {node.note && (
                <p className="mt-2 border-s-2 border-border ps-3 text-sm italic text-foreground/80">
                  {node.note}
                </p>
              )}
              <span className="sr-only">
                {current ? t("workflow.current") : done ? t("tracking.timelineDone") : t("tracking.timelineNext")}
              </span>
              {meta.terminal && current ? null : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
