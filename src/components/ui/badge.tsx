import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 border px-2 py-0.5 text-xs font-medium tracking-wide",
  {
    variants: {
      tone: {
        neutral: "border-border bg-muted text-foreground",
        warning: "border-warning/40 bg-warning/12 text-warning",
        info: "border-primary/40 bg-primary/10 text-primary",
        success: "border-success/40 bg-success/12 text-success",
        danger: "border-destructive/40 bg-destructive/12 text-destructive",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { Badge, badgeVariants };
