/** A fixed, non-interactive grain layer that gives the UI a printed-paper feel. */
export function GrainOverlay() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] paper-grain" />
  );
}
