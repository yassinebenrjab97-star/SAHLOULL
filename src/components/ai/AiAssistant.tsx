import { ArrowUpRight, CornerDownLeft, MessagesSquare, RotateCcw, X } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { streamAssistant, type ChatMessage } from "@/lib/ai";
import { cn } from "@/lib/utils";

/** Very small markdown-lite renderer: bold, bullet lists and line breaks. */
function RichText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        const isList = lines.every((l) => /^\s*[-•*]\s+/.test(l) || l.trim() === "");
        if (isList && lines.some((l) => /^\s*[-•*]\s+/.test(l))) {
          return (
            <ul key={bi} className="space-y-1.5 ps-1">
              {lines
                .filter(Boolean)
                .map((l, li) => (
                  <li key={li} className="flex gap-2">
                    <span className="mt-[0.55em] size-1 shrink-0 rounded-full bg-primary" aria-hidden />
                    <span>{renderInline(l.replace(/^\s*[-•*]\s+/, ""))}</span>
                  </li>
                ))}
            </ul>
          );
        }
        return <p key={bi}>{renderInline(block)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold text-foreground">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <React.Fragment key={i}>{p}</React.Fragment>
    ),
  );
}

function Avatar({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full border border-primary/30 bg-primary/10 font-display text-[0.7rem] font-semibold text-primary",
        className,
      )}
      aria-hidden
    >
      IE
    </span>
  );
}

export function AiAssistant() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.split("-")[0];

  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const suggestions = [1, 2, 3, 4].map((n) => t(`ai.suggestion${n}`));

  React.useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  React.useEffect(() => () => abortRef.current?.abort(), []);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || streaming) return;
    setInput("");
    const next: ChatMessage[] = [...messages, { role: "user", content: clean }];
    setMessages(next);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    setMessages((m) => [...m, { role: "assistant", content: "" }]);
    try {
      for await (const delta of streamAssistant(next, lang, controller.signal)) {
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") copy[copy.length - 1] = { ...last, content: last.content + delta };
          return copy;
        });
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: t("ai.error") };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }

  const empty = messages.length === 0;

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? t("ai.close") : t("ai.open")}
        aria-expanded={open}
        className={cn(
          "fixed bottom-5 end-5 z-40 flex items-center gap-2.5 border border-primary/30 bg-surface/95 py-2 pe-4 ps-2 shadow-paper backdrop-blur",
          "transition-transform duration-200 hover:-translate-y-0.5",
          open && "opacity-0 pointer-events-none",
        )}
        style={{ borderRadius: 40 }}
      >
        <Avatar className="size-9" />
        <span className="hidden text-sm font-medium sm:block">{t("ai.title")}</span>
      </button>

      {/* Chat panel */}
      {open && (
        <section
          role="dialog"
          aria-label={t("ai.title")}
          className="fixed bottom-5 end-5 z-50 flex max-h-[min(80dvh,640px)] w-[calc(100vw-2.5rem)] max-w-[380px] animate-fade-up flex-col overflow-hidden border border-border bg-surface shadow-paper"
        >
          <header className="flex items-center gap-3 border-b border-border bg-background/60 px-4 py-3">
            <Avatar className="size-9" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[0.95rem] leading-tight">{t("ai.title")}</p>
              <p className="truncate text-[0.7rem] text-muted-foreground">{t("ai.subtitle")}</p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("ai.close")}
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </header>

          <div ref={scrollRef} className="thin-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {empty && (
              <div className="space-y-4">
                <div className="flex gap-2.5">
                  <Avatar className="mt-0.5 size-7" />
                  <p className="border-s-2 border-primary/30 ps-3 text-sm leading-relaxed text-foreground/90">
                    {t("ai.greeting")}
                  </p>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => void send(s)}
                        className="border border-border bg-background px-3 py-1.5 text-xs text-foreground/85 transition-colors hover:border-primary hover:text-primary"
                        style={{ borderRadius: 3 }}
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={cn("flex gap-2.5", m.role === "user" && "flex-row-reverse")}
              >
                {m.role === "assistant" ? (
                  <Avatar className="mt-0.5 size-7" />
                ) : (
                  <span className="mt-0.5 size-7 shrink-0" aria-hidden />
                )}
                <div
                  className={cn(
                    "max-w-[85%] px-3.5 py-2.5 text-sm",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border-s-2 border-primary/30 bg-background text-foreground/90",
                  )}
                  style={{ borderRadius: 3 }}
                >
                  {m.content ? (
                    <RichText text={m.content} />
                  ) : (
                    <span className="flex items-center gap-1 py-1" aria-label={t("ai.thinking")}>
                      {[0, 1, 2].map((d) => (
                        <span
                          key={d}
                          className="size-1.5 animate-pulse-soft rounded-full bg-muted-foreground"
                          style={{ animationDelay: `${d * 180}ms` }}
                        />
                      ))}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border px-3 py-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
              className="flex items-end gap-2"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                rows={1}
                placeholder={t("ai.placeholder")}
                aria-label={t("ai.placeholder")}
                className="thin-scrollbar max-h-28 min-h-[2.75rem] flex-1 resize-none border border-input bg-background px-3 py-2.5 text-sm outline-none focus-visible:border-primary"
                style={{ borderRadius: 3 }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={streaming || !input.trim()}
                aria-label={t("ai.send")}
              >
                <CornerDownLeft className="size-4" />
              </Button>
            </form>

            <div className="mt-2.5 flex items-center justify-between gap-2">
              <Link
                to="/reclamation"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                {t("ai.ctaCreate")} <ArrowUpRight className="size-3" aria-hidden />
              </Link>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      abortRef.current?.abort();
                      setStreaming(false);
                      setMessages([]);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="size-3" aria-hidden />
                    {t("ai.restart")}
                  </button>
                )}
                <span className="hidden items-center gap-1 text-[0.65rem] text-muted-foreground sm:flex">
                  <MessagesSquare className="size-3" aria-hidden />
                  {t("ai.disclaimer")}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
