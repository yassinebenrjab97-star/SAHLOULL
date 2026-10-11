import { z } from "zod";

/** Sentinel used by the brand dropdown for a free-text brand. */
export const OTHER_BRAND = "__other__";

/**
 * Messages are i18n keys (e.g. "errors.required") — the form resolves them
 * through `t()` so every validation error is translated.
 */
export const requestSchema = z.object({
  service: z.string().min(1, "errors.required"),
  equipment: z.enum(["printer", "screen", "unit", "qr_printer"], {
    errorMap: () => ({ message: "errors.equipmentRequired" }),
  }),
  brand: z.string().min(1, "errors.brandRequired"),
  brandCustom: z.string().optional(),
  serial: z.string().max(120, "errors.tooLong").optional().or(z.literal("")),
  description: z.string().min(10, "errors.descriptionMin"),
  symptoms: z.array(z.string()).default([]),
  urgency: z.enum(["normal", "urgent", "critical"]),
  declarantName: z.string().min(2, "errors.nameMin"),
  declarantFunction: z.string().optional().or(z.literal("")),
  phone: z
    .string()
    .min(6, "errors.phoneMin")
    .regex(/^[+()\d\s.\-/]+$/, "errors.phoneInvalid"),
  email: z.string().email("errors.emailInvalid").optional().or(z.literal("")),
  location: z.string().min(2, "errors.locationMin"),
  availability: z.string().optional().or(z.literal("")),
}).refine((v) => v.brand !== OTHER_BRAND || (v.brandCustom && v.brandCustom.trim().length > 1), {
  message: "errors.brandCustomRequired",
  path: ["brandCustom"],
});

export type RequestFormValues = z.infer<typeof requestSchema>;
