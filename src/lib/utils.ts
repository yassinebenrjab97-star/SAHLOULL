import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Localised, human date (falls back gracefully). */
export function formatDate(iso: string | Date, locale = "fr", withTime = false) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat(localeToBcp47(locale), {
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

export function localeToBcp47(locale: string) {
  const map: Record<string, string> = {
    fr: "fr-FR",
    ar: "ar-TN",
    en: "en-GB",
    es: "es-ES",
    de: "de-DE",
    it: "it-IT",
    tr: "tr-TR",
    pt: "pt-PT",
    ru: "ru-RU",
    zh: "zh-CN",
  };
  return map[locale] ?? locale;
}

export function isRtl(locale: string) {
  return locale === "ar";
}

/** A short, sortable id (works in the browser and in edge functions). */
export function uid(prefix = "") {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}${Date.now().toString(36)}${rnd}`;
}

export function debounce<T extends (...args: never[]) => void>(fn: T, ms = 200) {
  let t: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/** Normalise a phone / extension for tel: links (keeps leading + and digits). */
export function telHref(phone: string) {
  const cleaned = phone.replace(/[^\d+]/g, "");
  return `tel:${cleaned}`;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
