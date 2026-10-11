import type {
  BrandRow,
  EquipmentType,
  NewRequestInput,
  ReformedEquipment,
  RequestStatus,
  ServiceRequest,
  ServiceRow,
  SiteSettings,
} from "@/types";

export interface AdminSession {
  email: string;
  isAdmin: boolean;
}

export interface RequestFilters {
  status?: RequestStatus | "all";
  service?: string;
  equipment?: EquipmentType | "all";
  search?: string;
}

export interface ReformedFilters {
  service?: string;
  equipment?: EquipmentType | "all";
  brand?: string;
  search?: string;
}

export interface StatusUpdate {
  to: RequestStatus;
  note?: string | null;
  by?: string | null;
}

/**
 * The single contract used by the whole UI. Two implementations live behind it:
 * a Supabase-backed one (production) and a local one (demo / offline).
 */
export interface DataAdapter {
  readonly mode: "supabase" | "local";

  // --- Requests -------------------------------------------------------------
  createRequest(input: NewRequestInput): Promise<ServiceRequest>;
  getRequestByTicket(ticket: string): Promise<ServiceRequest | null>;
  getRequest(id: string): Promise<ServiceRequest | null>;
  listRequests(filters?: RequestFilters): Promise<ServiceRequest[]>;
  updateRequestStatus(id: string, update: StatusUpdate): Promise<ServiceRequest>;
  updateRequest(id: string, patch: Partial<ServiceRequest>): Promise<ServiceRequest>;
  deleteRequest(id: string): Promise<void>;

  // --- Reformed equipment ---------------------------------------------------
  listReformed(filters?: ReformedFilters): Promise<ReformedEquipment[]>;
  upsertReformed(entry: Partial<ReformedEquipment> & { id?: string }): Promise<ReformedEquipment>;
  deleteReformed(id: string): Promise<void>;

  // --- Taxonomy -------------------------------------------------------------
  listServices(): Promise<ServiceRow[]>;
  addService(name: string): Promise<ServiceRow>;
  deleteService(id: string): Promise<void>;
  listBrands(): Promise<BrandRow[]>;
  addBrand(equipment: EquipmentType, name: string): Promise<BrandRow>;
  deleteBrand(id: string): Promise<void>;

  // --- Settings -------------------------------------------------------------
  getSettings(): Promise<SiteSettings>;
  updateSettings(patch: Partial<SiteSettings>): Promise<SiteSettings>;

  // --- Auth -----------------------------------------------------------------
  signIn(email: string, password: string): Promise<AdminSession>;
  signOut(): Promise<void>;
  getSession(): Promise<AdminSession | null>;
}
