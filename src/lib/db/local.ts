import { DEFAULT_BRANDS, DEFAULT_SERVICES, DEFAULT_SETTINGS } from "@/lib/constants";
import { canTransition } from "@/lib/status";
import { formatTicket } from "@/lib/ticket";
import { uid } from "@/lib/utils";
import type {
  BrandRow,
  EquipmentType,
  NewRequestInput,
  ReformedEquipment,
  ServiceRequest,
  ServiceRow,
  SiteSettings,
  StatusHistoryEntry,
  RequestStatus,
} from "@/types";
import type {
  AdminSession,
  DataAdapter,
  ReformedFilters,
  RequestFilters,
  StatusUpdate,
} from "./adapter";

/* ------------------------------------------------------------------ storage */

const NS = "sahloul.desk.";
const K = {
  requests: NS + "requests",
  reformed: NS + "reformed",
  services: NS + "services",
  brands: NS + "brands",
  settings: NS + "settings",
  seq: NS + "seq",
  session: NS + "session",
  seeded: NS + "seeded",
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota — ignore in demo mode */
  }
}

/** Demo credentials for the local mode (documented in the admin login screen). */
export const DEMO_ADMIN = { email: "admin@sahloul.tn", password: "sahloul2025" };

/* --------------------------------------------------------------- seed data */

const now = Date.now();
const daysAgo = (d: number, h = 0) =>
  new Date(now - d * 86_400_000 - h * 3_600_000).toISOString();

function historyEntry(status: RequestStatus, at: string, note?: string): StatusHistoryEntry {
  return { id: uid("h_"), status, at, note: note ?? null };
}

function makeRequest(
  seq: number,
  partial: Partial<ServiceRequest> & Pick<ServiceRequest, "service" | "equipment" | "brand" | "description" | "declarantName" | "phone" | "location">,
): ServiceRequest {
  const createdAt = partial.createdAt ?? daysAgo(3);
  const status = partial.status ?? "pending_acceptance";
  const ticket = formatTicket(seq, new Date(createdAt).getFullYear());
  return {
    id: partial.id ?? uid("req_"),
    ticketNumber: ticket,
    service: partial.service,
    equipment: partial.equipment,
    brand: partial.brand,
    serial: partial.serial ?? null,
    description: partial.description,
    urgency: partial.urgency ?? "normal",
    symptoms: partial.symptoms ?? [],
    photoUrl: partial.photoUrl ?? null,
    declarantName: partial.declarantName,
    declarantFunction: partial.declarantFunction ?? null,
    phone: partial.phone,
    email: partial.email ?? null,
    location: partial.location,
    availability: partial.availability ?? null,
    status,
    refusalReason: partial.refusalReason ?? null,
    internalNotes: partial.internalNotes ?? null,
    createdAt,
    updatedAt: partial.updatedAt ?? createdAt,
    history: partial.history ?? [historyEntry(status, createdAt)],
  };
}

function seedIfNeeded() {
  if (read(K.seeded, false)) return;
  const year = new Date().getFullYear();

  const requests: ServiceRequest[] = [
    makeRequest(1, {
      service: "Urgences",
      equipment: "printer",
      brand: "HP",
      serial: "PH-8834-URG",
      description: "Bourrage papier répété et impression partielle des ordonnances.",
      urgency: "critical",
      symptoms: ["printer.paper_jam", "printer.blurry"],
      declarantName: "Amel Ben Salem",
      declarantFunction: "Infirmière",
      phone: "+216 98 112 233",
      email: "a.bensalem@chu-sahloul.tn",
      location: "Bâtiment A · 2e étage · Box 4",
      availability: "Matin 8h–12h",
      status: "pending_acceptance",
      createdAt: daysAgo(0, 3),
    }),
    makeRequest(2, {
      service: "Cardiologie",
      equipment: "screen",
      brand: "Dell",
      serial: "DL-2210-CARD",
      description: "Écran noir au démarrage du poste de saisie.",
      urgency: "urgent",
      symptoms: ["screen.black_screen", "screen.no_signal"],
      declarantName: "Mohamed Trabelsi",
      declarantFunction: "Cadre de santé",
      phone: "+216 73 369 412",
      location: "Bâtiment B · 1er étage · Bureau 108",
      status: "accepted",
      createdAt: daysAgo(1, 2),
      updatedAt: daysAgo(0, 20),
      history: [
        historyEntry("pending_acceptance", daysAgo(1, 2)),
        historyEntry("accepted", daysAgo(0, 20), "Apporter l'unité avec le câble d'alimentation."),
      ],
    }),
    makeRequest(3, {
      service: "Radiologie / Imagerie médicale",
      equipment: "unit",
      brand: "Lenovo",
      serial: "LN-5521-RAD",
      description: "L'unité centrale ne démarre plus, aucun affichage sur les deux écrans.",
      urgency: "critical",
      symptoms: ["unit.not_start", "unit.no_display"],
      declarantName: "Sonia Gharbi",
      declarantFunction: "Manipulatrice radio",
      phone: "+216 22 445 566",
      location: "Imagerie · Rez-de-chaussée · Salle 2",
      status: "in_repair",
      createdAt: daysAgo(4),
      updatedAt: daysAgo(1),
      history: [
        historyEntry("pending_acceptance", daysAgo(4)),
        historyEntry("accepted", daysAgo(3, 5)),
        historyEntry("received", daysAgo(2, 2), "Équipement déposé au service informatique."),
        historyEntry("in_repair", daysAgo(1), "Alimentation testée, remplacement en cours."),
      ],
      internalNotes: "Alimentation HS — demander une pièce de rechange.",
    }),
    makeRequest(4, {
      service: "Pharmacie",
      equipment: "qr_printer",
      brand: "Zebra",
      serial: "ZB-7781-PHA",
      description: "Les codes QR imprimés ne sont plus lisibles par le lecteur du guichet.",
      urgency: "urgent",
      symptoms: ["qr.unreadable", "qr.calibration"],
      declarantName: "Hatem Jebali",
      declarantFunction: "Pharmacien",
      phone: "+216 73 369 455",
      location: "Pharmacie centrale · Rez-de-chaussée",
      status: "repaired",
      createdAt: daysAgo(8),
      updatedAt: daysAgo(6),
      history: [
        historyEntry("pending_acceptance", daysAgo(8)),
        historyEntry("accepted", daysAgo(7, 6)),
        historyEntry("received", daysAgo(7, 2)),
        historyEntry("in_repair", daysAgo(6, 8)),
        historyEntry("repaired", daysAgo(6), "Rouleau nettoyé et imprimante recalibrée."),
      ],
    }),
    makeRequest(5, {
      service: "Laboratoire de biologie médicale",
      equipment: "printer",
      brand: "Canon",
      serial: "CN-3310-LAB",
      description: "Taches et traînées noires sur toutes les étiquettes de prélèvement.",
      urgency: "normal",
      symptoms: ["printer.blurry"],
      declarantName: "Leïla Hamdi",
      declarantFunction: "Secrétaire",
      phone: "+216 73 369 470",
      location: "Laboratoire · 1er étage · Poste étiquettes",
      status: "unrepairable",
      refusalReason: null,
      createdAt: daysAgo(14),
      updatedAt: daysAgo(10),
      history: [
        historyEntry("pending_acceptance", daysAgo(14)),
        historyEntry("accepted", daysAgo(13)),
        historyEntry("received", daysAgo(12)),
        historyEntry("in_repair", daysAgo(11)),
        historyEntry(
          "unrepairable",
          daysAgo(10),
          "Tambour et kit de fusion hors service — réparation non rentable.",
        ),
      ],
    }),
    makeRequest(6, {
      service: "Bureau des entrées",
      equipment: "printer",
      brand: "Epson",
      serial: "EP-1290-ENT",
      description: "Demande d'installation d'une imprimante supplémentaire au guichet 3.",
      urgency: "normal",
      declarantName: "Nizar Ayari",
      declarantFunction: "Agent d'accueil",
      phone: "+216 73 369 401",
      location: "Hall principal · Guichet 3",
      status: "refused",
      refusalReason: "Hors périmètre — demande de matériel neuf à adresser au service technique.",
      createdAt: daysAgo(9),
      updatedAt: daysAgo(9, 4),
      history: [
        historyEntry("pending_acceptance", daysAgo(9)),
        historyEntry(
          "refused",
          daysAgo(9, 4),
          "Hors périmètre — demande de matériel neuf à adresser au service technique.",
        ),
      ],
    }),
  ];

  const reformed: ReformedEquipment[] = [
    {
      id: uid("ref_"),
      ticketNumber: formatTicket(5, year),
      equipment: "printer",
      brand: "Canon",
      serial: "CN-3310-LAB",
      service: "Laboratoire de biologie médicale",
      fault: "Tambour et kit de fusion hors service.",
      reformedAt: daysAgo(10),
      remarks: "Pièces non disponibles — matériel sorti de l'inventaire.",
      requestId: null,
    },
    {
      id: uid("ref_"),
      ticketNumber: formatTicket(41, year),
      equipment: "screen",
      brand: "AOC",
      serial: "AOC-1190-PED",
      service: "Pédiatrie",
      fault: "Dalle fissurée, affichage illisible.",
      reformedAt: daysAgo(38),
      remarks: "Choc constaté — non réparable.",
      requestId: null,
    },
    {
      id: uid("ref_"),
      ticketNumber: formatTicket(52, year),
      equipment: "unit",
      brand: "HP",
      serial: "HP-4400-GYN",
      service: "Gynécologie-Obstétrique",
      fault: "Carte mère grillée après surtension.",
      reformedAt: daysAgo(66),
      remarks: "Hors garantie.",
      requestId: null,
    },
  ];

  write(K.requests, requests);
  write(K.reformed, reformed);
  write(K.services, DEFAULT_SERVICES.map((name) => ({ id: uid("srv_"), name })));
  write(
    K.brands,
    (Object.entries(DEFAULT_BRANDS) as [EquipmentType, string[]][]).flatMap(([equipment, names]) =>
      names.map((name) => ({ id: uid("brd_"), equipment, name })),
    ),
  );
  write(K.settings, DEFAULT_SETTINGS);
  write(K.seq, { [year]: 52 });
  write(K.seeded, true);
}

/* ------------------------------------------------------------- adapter impl */

export function createLocalAdapter(): DataAdapter {
  seedIfNeeded();

  const allRequests = () => read<ServiceRequest[]>(K.requests, []);
  const saveRequests = (r: ServiceRequest[]) => write(K.requests, r);

  function nextTicket(year: number) {
    const seq = read<Record<string, number>>(K.seq, {});
    const next = (seq[year] ?? 0) + 1;
    seq[year] = next;
    write(K.seq, seq);
    return formatTicket(next, year);
  }

  function autoReform(request: ServiceRequest, note?: string | null) {
    const list = read<ReformedEquipment[]>(K.reformed, []);
    list.unshift({
      id: uid("ref_"),
      ticketNumber: request.ticketNumber,
      equipment: request.equipment,
      brand: request.brand,
      serial: request.serial ?? null,
      service: request.service,
      fault: note || request.description,
      reformedAt: new Date().toISOString(),
      remarks: null,
      requestId: request.id,
    });
    write(K.reformed, list);
  }

  return {
    mode: "local",

    async createRequest(input: NewRequestInput) {
      const year = new Date().getFullYear();
      const createdAt = new Date().toISOString();
      const request: ServiceRequest = {
        ...input,
        id: uid("req_"),
        ticketNumber: nextTicket(year),
        status: "pending_acceptance",
        refusalReason: null,
        internalNotes: null,
        createdAt,
        updatedAt: createdAt,
        history: [historyEntry("pending_acceptance", createdAt)],
      };
      const list = allRequests();
      list.unshift(request);
      saveRequests(list);
      return request;
    },

    async getRequestByTicket(ticket: string) {
      const t = ticket.trim().toUpperCase();
      return allRequests().find((r) => r.ticketNumber.toUpperCase() === t) ?? null;
    },

    async getRequest(id: string) {
      return allRequests().find((r) => r.id === id) ?? null;
    },

    async listRequests(filters: RequestFilters = {}) {
      let list = allRequests();
      if (filters.status && filters.status !== "all")
        list = list.filter((r) => r.status === filters.status);
      if (filters.service) list = list.filter((r) => r.service === filters.service);
      if (filters.equipment && filters.equipment !== "all")
        list = list.filter((r) => r.equipment === filters.equipment);
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          (r) =>
            r.ticketNumber.toLowerCase().includes(q) ||
            r.declarantName.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q),
        );
      }
      return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async updateRequestStatus(id: string, update: StatusUpdate) {
      const list = allRequests();
      const idx = list.findIndex((r) => r.id === id);
      if (idx === -1) throw new Error("request_not_found");
      const current = list[idx];
      if (!canTransition(current.status, update.to))
        throw new Error(`illegal_transition:${current.status}->${update.to}`);

      const at = new Date().toISOString();
      const updated: ServiceRequest = {
        ...current,
        status: update.to,
        updatedAt: at,
        refusalReason: update.to === "refused" ? (update.note ?? null) : current.refusalReason,
        history: [
          ...current.history,
          historyEntry(update.to, at, update.note ?? undefined),
        ],
      };
      list[idx] = updated;
      saveRequests(list);
      if (update.to === "unrepairable") autoReform(updated, update.note);
      return updated;
    },

    async updateRequest(id: string, patch: Partial<ServiceRequest>) {
      const list = allRequests();
      const idx = list.findIndex((r) => r.id === id);
      if (idx === -1) throw new Error("request_not_found");
      const updated = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
      list[idx] = updated;
      saveRequests(list);
      return updated;
    },

    async deleteRequest(id: string) {
      saveRequests(allRequests().filter((r) => r.id !== id));
    },

    async listReformed(filters: ReformedFilters = {}) {
      let list = read<ReformedEquipment[]>(K.reformed, []);
      if (filters.service) list = list.filter((r) => r.service === filters.service);
      if (filters.equipment && filters.equipment !== "all")
        list = list.filter((r) => r.equipment === filters.equipment);
      if (filters.brand) list = list.filter((r) => r.brand === filters.brand);
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          (r) =>
            r.ticketNumber.toLowerCase().includes(q) ||
            r.service.toLowerCase().includes(q) ||
            r.fault.toLowerCase().includes(q) ||
            r.brand.toLowerCase().includes(q),
        );
      }
      return [...list].sort((a, b) => b.reformedAt.localeCompare(a.reformedAt));
    },

    async upsertReformed(entry) {
      const list = read<ReformedEquipment[]>(K.reformed, []);
      if (entry.id) {
        const idx = list.findIndex((r) => r.id === entry.id);
        if (idx !== -1) {
          const updated = { ...list[idx], ...entry } as ReformedEquipment;
          list[idx] = updated;
          write(K.reformed, list);
          return updated;
        }
      }
      const created: ReformedEquipment = {
        id: entry.id ?? uid("ref_"),
        ticketNumber: entry.ticketNumber ?? formatTicket(0, new Date().getFullYear()),
        equipment: entry.equipment ?? "printer",
        brand: entry.brand ?? "",
        serial: entry.serial ?? null,
        service: entry.service ?? "",
        fault: entry.fault ?? "",
        reformedAt: entry.reformedAt ?? new Date().toISOString(),
        remarks: entry.remarks ?? null,
        requestId: entry.requestId ?? null,
      };
      list.unshift(created);
      write(K.reformed, list);
      return created;
    },

    async deleteReformed(id: string) {
      write(
        K.reformed,
        read<ReformedEquipment[]>(K.reformed, []).filter((r) => r.id !== id),
      );
    },

    async listServices() {
      const list = read<ServiceRow[]>(K.services, []);
      return [...list].sort((a, b) => a.name.localeCompare(b.name, "fr"));
    },
    async addService(name: string) {
      const list = read<ServiceRow[]>(K.services, []);
      const row = { id: uid("srv_"), name: name.trim() };
      list.push(row);
      write(K.services, list);
      return row;
    },
    async deleteService(id: string) {
      write(K.services, read<ServiceRow[]>(K.services, []).filter((s) => s.id !== id));
    },

    async listBrands() {
      return read<BrandRow[]>(K.brands, []);
    },
    async addBrand(equipment: EquipmentType, name: string) {
      const list = read<BrandRow[]>(K.brands, []);
      const row = { id: uid("brd_"), equipment, name: name.trim() };
      list.push(row);
      write(K.brands, list);
      return row;
    },
    async deleteBrand(id: string) {
      write(K.brands, read<BrandRow[]>(K.brands, []).filter((b) => b.id !== id));
    },

    async getSettings() {
      return { ...DEFAULT_SETTINGS, ...read<Partial<SiteSettings>>(K.settings, {}) };
    },
    async updateSettings(patch: Partial<SiteSettings>) {
      const merged = { ...DEFAULT_SETTINGS, ...read<Partial<SiteSettings>>(K.settings, {}), ...patch };
      write(K.settings, merged);
      return merged;
    },

    async signIn(email: string, password: string) {
      const ok =
        email.trim().toLowerCase() === DEMO_ADMIN.email && password === DEMO_ADMIN.password;
      if (!ok) throw new Error("invalid_credentials");
      const session: AdminSession = { email: DEMO_ADMIN.email, isAdmin: true };
      write(K.session, session);
      return session;
    },
    async signOut() {
      localStorage.removeItem(K.session);
    },
    async getSession() {
      return read<AdminSession | null>(K.session, null);
    },
  };
}

/** Wipes the demo data (used by the admin settings screen). */
export function resetLocalData() {
  Object.values(K).forEach((k) => localStorage.removeItem(k));
}
