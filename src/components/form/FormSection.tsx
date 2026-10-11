import type * as React from "react";

export function FormSection({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-6 border-t border-border py-8 first:border-t-0 first:pt-0 md:grid-cols-[200px_1fr] md:gap-10">
      <header className="flex items-start gap-3">
        <span className="font-mono text-sm leading-6 text-primary" aria-hidden>
          {String(index).padStart(2, "0")}
        </span>
        <h2 className="label-caps pt-0.5 leading-6">{title}</h2>
      </header>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
