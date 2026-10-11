import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Use the official hospital logo when it has been dropped into /public. */
  src?: string;
  alt?: string;
}

/**
 * The hospital emblem. Defaults to the bundled placeholder `logo.svg`; replace
 * the file (or pass `src`) with the official logo to update header, favicon and
 * the loading screen at once.
 */
export function Logo({ className, src = "/logo.svg", alt = "Sahloul" }: LogoProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={40}
      height={40}
      className={cn("h-10 w-10 shrink-0 select-none", className)}
      draggable={false}
    />
  );
}
