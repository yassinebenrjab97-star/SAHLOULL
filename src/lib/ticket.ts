import { TICKET_PREFIX } from "./constants";

/**
 * Ticket number format: SAH-2025-0001
 * The sequence is per-year and stored by the data layer.
 */
export function formatTicket(seq: number, year: number) {
  return `${TICKET_PREFIX}-${year}-${String(seq).padStart(4, "0")}`;
}

export function parseTicket(ticket: string): { year: number; seq: number } | null {
  const m = /^SAH-(\d{4})-(\d{1,6})$/i.exec(ticket.trim());
  if (!m) return null;
  return { year: Number(m[1]), seq: Number(m[2]) };
}

export function isValidTicket(ticket: string) {
  return parseTicket(ticket) !== null;
}

export function normalizeTicket(ticket: string) {
  const t = ticket.trim().toUpperCase();
  return t.startsWith(`${TICKET_PREFIX}-`) ? t : t;
}
