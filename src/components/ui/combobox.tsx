import { Check, ChevronsUpDown, Search } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  invalid?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder,
  searchable = true,
  searchPlaceholder,
  emptyText = "—",
  invalid,
  id,
  className,
  ...aria
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = React.useMemo(() => {
    if (!searchable || !query) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  React.useEffect(() => {
    if (open && searchable) inputRef.current?.focus();
    if (open) setActive(Math.max(0, filtered.findIndex((o) => o.value === value)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  React.useEffect(() => {
    const el = listRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const commit = (opt?: ComboboxOption) => {
    if (!opt) return;
    onChange(opt.value);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(filtered.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      commit(filtered[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div
        className={cn(
          "flex h-11 w-full items-center border bg-surface transition-colors",
          open ? "border-primary ring-1 ring-primary" : "border-input",
          invalid && "border-destructive",
        )}
      >
        {open && searchable ? (
          <Search className="ms-3 size-4 shrink-0 text-muted-foreground" aria-hidden />
        ) : null}
        <input
          id={id}
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls={id ? `${id}-listbox` : undefined}
          aria-autocomplete="list"
          aria-label={aria["aria-label"]}
          readOnly={!searchable}
          value={open ? query : (selected?.label ?? "")}
          placeholder={open ? (searchPlaceholder ?? placeholder) : placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={cn(
            "h-full w-full bg-transparent px-3 text-sm text-foreground outline-none",
            "placeholder:text-muted-foreground/70",
            !open && selected && "text-foreground",
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => setOpen((o) => !o)}
          className="grid h-full w-10 shrink-0 place-items-center text-muted-foreground"
        >
          <ChevronsUpDown className="size-4" />
        </button>
      </div>

      {open && (
        <div className="absolute z-40 mt-1 w-full animate-fade-in border border-border bg-surface shadow-paper">
          <ul
            id={id ? `${id}-listbox` : undefined}
            ref={listRef}
            role="listbox"
            className="thin-scrollbar max-h-64 overflow-y-auto py-1"
          >
            {filtered.length === 0 && (
              <li className="px-3.5 py-3 text-sm text-muted-foreground">{emptyText}</li>
            )}
            {filtered.map((opt, i) => {
              const isSelected = opt.value === value;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commit(opt);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 px-3.5 py-2 text-sm",
                    i === active ? "bg-muted" : "bg-transparent",
                    isSelected && "font-medium text-primary",
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="size-4 shrink-0" aria-hidden />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
