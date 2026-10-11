import * as LabelPrimitive from "@radix-ui/react-label";
import * as React from "react";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & { required?: boolean }
>(({ className, required, children, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "flex items-center gap-1 text-[0.8rem] font-medium uppercase tracking-wider text-foreground/80",
      className,
    )}
    {...props}
  >
    {children}
    {required && (
      <span aria-hidden="true" className="text-accent">
        *
      </span>
    )}
  </LabelPrimitive.Root>
));
Label.displayName = "Label";

export { Label };
