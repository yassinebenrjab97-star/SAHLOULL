import type { RequestStatus } from "@/types";

export type StatusTone = "neutral" | "warning" | "info" | "success" | "danger";

export interface StatusMeta {
  key: RequestStatus;
  /** 1-based step in the linear workflow (0 for terminal branches). */
  step: number;
  tone: StatusTone;
  /** Terminal states close the request. */
  terminal: boolean;
  /** The department may bring the equipment in only from `accepted` on. */
  equipmentAllowed: boolean;
}

export const STATUS_META: Record<RequestStatus, StatusMeta> = {
  pending_acceptance: {
    key: "pending_acceptance",
    step: 1,
    tone: "warning",
    terminal: false,
    equipmentAllowed: false,
  },
  accepted: {
    key: "accepted",
    step: 2,
    tone: "success",
    terminal: false,
    equipmentAllowed: true,
  },
  received: {
    key: "received",
    step: 3,
    tone: "info",
    terminal: false,
    equipmentAllowed: true,
  },
  in_repair: {
    key: "in_repair",
    step: 4,
    tone: "info",
    terminal: false,
    equipmentAllowed: true,
  },
  repaired: {
    key: "repaired",
    step: 5,
    tone: "success",
    terminal: true,
    equipmentAllowed: true,
  },
  unrepairable: {
    key: "unrepairable",
    step: 5,
    tone: "danger",
    terminal: true,
    equipmentAllowed: true,
  },
  refused: {
    key: "refused",
    step: 0,
    tone: "danger",
    terminal: true,
    equipmentAllowed: false,
  },
};

/** The ordered main line used by the tracking timeline. */
export const STATUS_FLOW: RequestStatus[] = [
  "pending_acceptance",
  "accepted",
  "received",
  "in_repair",
  "repaired",
];

export interface Transition {
  to: RequestStatus;
  /** i18n key of the action label. */
  action: string;
  /** Needs a free-text reason (ask / refuse / unrepairable). */
  requiresReason?: boolean;
  tone?: StatusTone;
}

/**
 * The single source of truth for the workflow. The admin UI renders exactly
 * these transitions, which is how the "cannot jump from step 1 to step 3"
 * rule is enforced on the client. The same rule lives in the SQL trigger.
 */
export const TRANSITIONS: Record<RequestStatus, Transition[]> = {
  pending_acceptance: [
    { to: "accepted", action: "actions.accept", tone: "success" },
    { to: "refused", action: "actions.refuse", requiresReason: true, tone: "danger" },
  ],
  accepted: [{ to: "received", action: "actions.markReceived", tone: "info" }],
  received: [{ to: "in_repair", action: "actions.startRepair", tone: "info" }],
  in_repair: [
    { to: "repaired", action: "actions.markRepaired", tone: "success" },
    { to: "unrepairable", action: "actions.markUnrepairable", requiresReason: true, tone: "danger" },
  ],
  repaired: [],
  unrepairable: [],
  refused: [],
};

export function statusMeta(status: RequestStatus): StatusMeta {
  return STATUS_META[status];
}

export function isTerminal(status: RequestStatus) {
  return STATUS_META[status].terminal;
}

export function nextTransitions(status: RequestStatus): Transition[] {
  return TRANSITIONS[status] ?? [];
}

/**
 * Guard used both by the UI and by the data layer: verifies a transition is
 * legal. This is what prevents skipping acceptance.
 */
export function canTransition(from: RequestStatus, to: RequestStatus) {
  return (TRANSITIONS[from] ?? []).some((t) => t.to === to);
}
