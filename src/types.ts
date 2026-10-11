export type EquipmentType = "printer" | "screen" | "unit" | "qr_printer";

export type Urgency = "normal" | "urgent" | "critical";

/**
 * The workflow, in order. A request always enters at `pending_acceptance`.
 * `refused` and `unrepairable` are terminal branches.
 */
export type RequestStatus =
  | "pending_acceptance"
  | "accepted"
  | "received"
  | "in_repair"
  | "repaired"
  | "unrepairable"
  | "refused";

export interface StatusHistoryEntry {
  id: string;
  status: RequestStatus;
  note?: string | null;
  at: string;
  by?: string | null;
}

export interface ServiceRequest {
  id: string;
  ticketNumber: string;
  /** Canonical service name (hospital department). */
  service: string;
  equipment: EquipmentType;
  brand: string;
  serial?: string | null;
  description: string;
  urgency: Urgency;
  /** i18n keys of the quick-picked symptoms. */
  symptoms: string[];
  photoUrl?: string | null;
  declarantName: string;
  declarantFunction?: string | null;
  phone: string;
  email?: string | null;
  location: string;
  availability?: string | null;
  status: RequestStatus;
  refusalReason?: string | null;
  internalNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  history: StatusHistoryEntry[];
}

export interface ReformedEquipment {
  id: string;
  ticketNumber: string;
  equipment: EquipmentType;
  brand: string;
  serial?: string | null;
  service: string;
  fault: string;
  reformedAt: string;
  remarks?: string | null;
  requestId?: string | null;
}

export interface SiteSettings {
  phone: string;
  extension: string;
  email: string;
  hours: string;
  address: string;
}

export interface BrandRow {
  id: string;
  equipment: EquipmentType;
  name: string;
}

export interface ServiceRow {
  id: string;
  name: string;
}

/** A fully-shaped payload for creating a request (what the form produces). */
export type NewRequestInput = Omit<
  ServiceRequest,
  | "id"
  | "ticketNumber"
  | "status"
  | "refusalReason"
  | "internalNotes"
  | "createdAt"
  | "updatedAt"
  | "history"
>;
