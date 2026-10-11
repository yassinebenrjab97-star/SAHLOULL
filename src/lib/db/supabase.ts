import { supabase } from "@/lib/supabase";
import { formatTicket } from "@/lib/ticket";
import { uid } from "@/lib/utils";
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
import type {
  AdminSession,
  DataAdapter,
  ReformedFilters,
  RequestFilters,
  StatusUpdate,
} from "./adapter";

const sb = supabase!;

/* ------------------------------------------------------------ row mapping */

function toRequest(row: Record<string, unknown>): ServiceRequest {
  return {
    id: String(row.id),
    ticketNumber: String(row.ticket_number),
    service: String(row.service),
    equipment: row.equipment as EquipmentType,
    brand: String(row.brand),
    serial: (row.serial as string) ?? null,
    description: String(row.description),
    urgency: row.urgency as ServiceRequest["urgency"],
    symptoms: (row.symptoms as string[]) ?? [],
    photoUrl: (row.photo_url as string) ?? null,
    declarantName: String(row.declarant_name),
    declarantFunction: (row.declarant_function as string) ?? null,
    phone: String(row.phone),
    email: (row.email as string) ?? null,
    location: String(row.location),
    availability: (row.availability as string) ?? null,
    status: row.status as RequestStatus,
    refusalReason: (row.refusal_reason as string) ?? null,
    internalNotes: (row.internal_notes as string) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at ?? row.created_at),
    history: Array.isArray(row.request_status_history)
      ? (row.request_status_history as Record<string, unknown>[])
          .map((h) => ({
            id: String(h.id),
            status: h.status as RequestStatus,
            note: (h.note as string) ?? null,
            at: String(h.at),
            by: (h.by as string) ?? null,
          }))
          .sort((a, b) => a.at.localeCompare(b.at))
      : [],
  };
}

function toReformed(row: Record<string, unknown>): ReformedEquipment {
  return {
    id: String(row.id),
    ticketNumber: String(row.ticket_number),
    equipment: row.equipment as EquipmentType,
    brand: String(row.brand ?? ""),
    serial: (row.serial as string) ?? null,
    service: String(row.service ?? ""),
    fault: String(row.fault ?? ""),
    reformedAt: String(row.reformed_at),
    remarks: (row.remarks as string) ?? null,
    requestId: (row.request_id as string) ?? null,
  };
}

async function uploadPhotoIfNeeded(photoUrl?: string | null) {
  if (!photoUrl || !photoUrl.startsWith("data:")) return photoUrl ?? null;
  const res = await fetch(photoUrl);
  const blob = await res.blob();
  const ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const path = `${new Date().getFullYear()}/${uid("photo_")}.${ext}`;
  const { error } = await sb.storage.from("request-photos").upload(path, blob, {
    contentType: blob.type,
    upsert: false,
  });
  if (error) return null;
  return sb.storage.from("request-photos").getPublicUrl(path).data.publicUrl;
}

/* ------------------------------------------------------------- adapter impl */

export function createSupabaseAdapter(): DataAdapter {
  return {
    mode: "supabase",

    async createRequest(input: NewRequestInput) {
      const year = new Date().getFullYear();
      const { data: seq, error: seqErr } = await sb.rpc("next_ticket_number", { p_year: year });
      if (seqErr) throw seqErr;
      const ticket = formatTicket(Number(seq), year);
      const photoUrl = await uploadPhotoIfNeeded(input.photoUrl);

      const { data, error } = await sb
        .from("requests")
        .insert({
          ticket_number: ticket,
          service: input.service,
          equipment: input.equipment,
          brand: input.brand,
          serial: input.serial,
          description: input.description,
          urgency: input.urgency,
          symptoms: input.symptoms,
          photo_url: photoUrl,
          declarant_name: input.declarantName,
          declarant_function: input.declarantFunction,
          phone: input.phone,
          email: input.email,
          location: input.location,
          availability: input.availability,
          status: "pending_acceptance",
        })
        .select("*, request_status_history(*)")
        .single();
      if (error) throw error;
      return toRequest(data);
    },

    async getRequestByTicket(ticket: string) {
      // Public lookup goes through a SECURITY DEFINER function so the table
      // itself stays protected by RLS (a ticket number acts as a capability).
      const { data, error } = await sb.rpc("get_request_by_ticket", {
        p_ticket: ticket.trim().toUpperCase(),
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row ? toRequest(row as Record<string, unknown>) : null;
    },

    async getRequest(id: string) {
      const { data, error } = await sb
        .from("requests")
        .select("*, request_status_history(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? toRequest(data) : null;
    },

    async listRequests(filters: RequestFilters = {}) {
      let q = sb.from("requests").select("*, request_status_history(*)");
      if (filters.status && filters.status !== "all") q = q.eq("status", filters.status);
      if (filters.service) q = q.eq("service", filters.service);
      if (filters.equipment && filters.equipment !== "all") q = q.eq("equipment", filters.equipment);
      if (filters.search) q = q.or(`ticket_number.ilike.%${filters.search}%,declarant_name.ilike.%${filters.search}%`);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(toRequest);
    },

    async updateRequestStatus(id: string, update: StatusUpdate) {
      const { error } = await sb.rpc("apply_status_transition", {
        p_request_id: id,
        p_to: update.to,
        p_note: update.note ?? null,
      });
      if (error) throw error;
      const { data, error: readErr } = await sb
        .from("requests")
        .select("*, request_status_history(*)")
        .eq("id", id)
        .single();
      if (readErr) throw readErr;
      return toRequest(data);
    },

    async updateRequest(id: string, patch: Partial<ServiceRequest>) {
      const row: Record<string, unknown> = {};
      if (patch.service !== undefined) row.service = patch.service;
      if (patch.brand !== undefined) row.brand = patch.brand;
      if (patch.serial !== undefined) row.serial = patch.serial;
      if (patch.description !== undefined) row.description = patch.description;
      if (patch.urgency !== undefined) row.urgency = patch.urgency;
      if (patch.declarantName !== undefined) row.declarant_name = patch.declarantName;
      if (patch.declarantFunction !== undefined) row.declarant_function = patch.declarantFunction;
      if (patch.phone !== undefined) row.phone = patch.phone;
      if (patch.email !== undefined) row.email = patch.email;
      if (patch.location !== undefined) row.location = patch.location;
      if (patch.availability !== undefined) row.availability = patch.availability;
      if (patch.internalNotes !== undefined) row.internal_notes = patch.internalNotes;
      const { data, error } = await sb
        .from("requests")
        .update(row)
        .eq("id", id)
        .select("*, request_status_history(*)")
        .single();
      if (error) throw error;
      return toRequest(data);
    },

    async deleteRequest(id: string) {
      const { error } = await sb.from("requests").delete().eq("id", id);
      if (error) throw error;
    },

    async listReformed(filters: ReformedFilters = {}) {
      let q = sb.from("reformed_equipment").select("*");
      if (filters.service) q = q.eq("service", filters.service);
      if (filters.equipment && filters.equipment !== "all") q = q.eq("equipment", filters.equipment);
      if (filters.brand) q = q.eq("brand", filters.brand);
      if (filters.search) q = q.or(`ticket_number.ilike.%${filters.search}%,fault.ilike.%${filters.search}%`);
      const { data, error } = await q.order("reformed_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(toReformed);
    },

    async upsertReformed(entry) {
      const row = {
        id: entry.id,
        ticket_number: entry.ticketNumber,
        equipment: entry.equipment,
        brand: entry.brand,
        serial: entry.serial,
        service: entry.service,
        fault: entry.fault,
        reformed_at: entry.reformedAt,
        remarks: entry.remarks,
        request_id: entry.requestId,
      };
      const { data, error } = await sb
        .from("reformed_equipment")
        .upsert(row)
        .select("*")
        .single();
      if (error) throw error;
      return toReformed(data);
    },

    async deleteReformed(id: string) {
      const { error } = await sb.from("reformed_equipment").delete().eq("id", id);
      if (error) throw error;
    },

    async listServices() {
      const { data, error } = await sb.from("services").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as ServiceRow[];
    },
    async addService(name: string) {
      const { data, error } = await sb.from("services").insert({ name: name.trim() }).select("*").single();
      if (error) throw error;
      return data as ServiceRow;
    },
    async deleteService(id: string) {
      const { error } = await sb.from("services").delete().eq("id", id);
      if (error) throw error;
    },

    async listBrands() {
      const { data, error } = await sb.from("brands").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as BrandRow[];
    },
    async addBrand(equipment: EquipmentType, name: string) {
      const { data, error } = await sb
        .from("brands")
        .insert({ equipment, name: name.trim() })
        .select("*")
        .single();
      if (error) throw error;
      return data as BrandRow;
    },
    async deleteBrand(id: string) {
      const { error } = await sb.from("brands").delete().eq("id", id);
      if (error) throw error;
    },

    async getSettings() {
      const { data, error } = await sb.from("site_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return {
        phone: data.phone,
        extension: data.extension,
        email: data.email,
        hours: data.hours,
        address: data.address,
      } as SiteSettings;
    },
    async updateSettings(patch: Partial<SiteSettings>) {
      const { data, error } = await sb
        .from("site_settings")
        .update(patch)
        .eq("id", 1)
        .select("*")
        .single();
      if (error) throw error;
      return {
        phone: data.phone,
        extension: data.extension,
        email: data.email,
        hours: data.hours,
        address: data.address,
      } as SiteSettings;
    },

    async signIn(email: string, password: string) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: role } = await sb
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user!.id)
        .maybeSingle();
      const session: AdminSession = { email, isAdmin: role?.role === "admin" };
      return session;
    },
    async signOut() {
      await sb.auth.signOut();
    },
    async getSession() {
      const { data } = await sb.auth.getSession();
      if (!data.session?.user) return null;
      const { data: role } = await sb
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id)
        .maybeSingle();
      return { email: data.session.user.email ?? "", isAdmin: role?.role === "admin" };
    },
  };
}
