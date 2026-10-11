import * as React from "react";
import { cn } from "@/lib/utils";

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Stagger delay in ms. */
  delay?: number;
  as?: "div" | "section" | "li" | "article";
}

/** Reveals its children with a short, staggered fade-up the first time it
 *  enters the viewport. Respects prefers-reduced-motion via the CSS reset. */
export function Reveal({ delay = 0, className, children, as = "div", ...props }: RevealProps) {
  const ref = React.useRef<HTMLElement | null>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as as React.ElementType;
  return (
    <Tag
      ref={ref as never}
      style={{ animationDelay: `${delay}ms` }}
      className={cn(visible ? "animate-fade-up" : "opacity-0", className)}
      {...props}
    >
      {children}
    </Tag>
  );
}
