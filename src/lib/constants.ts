import type { EquipmentType } from "@/types";

/** The four supported equipment types (tile UI on /reclamation). */
export const EQUIPMENT_TYPES: {
  value: EquipmentType;
  /** lucide-react icon name handled in <EquipmentTiles/> */
  icon: "printer" | "monitor" | "pc-case" | "qr-code";
}[] = [
  { value: "printer", icon: "printer" },
  { value: "screen", icon: "monitor" },
  { value: "unit", icon: "pc-case" },
  { value: "qr_printer", icon: "qr-code" },
];

/** Standard services of a Tunisian university hospital (editable in /admin). */
export const DEFAULT_SERVICES: string[] = [
  "Urgences",
  "Réanimation médicale",
  "Réanimation chirurgicale",
  "Réanimation néonatale",
  "Cardiologie",
  "Chirurgie cardiovasculaire",
  "Pneumologie",
  "Gastro-entérologie",
  "Néphrologie / Hémodialyse",
  "Neurologie",
  "Neurochirurgie",
  "Endocrinologie",
  "Médecine interne",
  "Hématologie",
  "Oncologie / Cancérologie",
  "Radiothérapie",
  "Rhumatologie",
  "Dermatologie",
  "Maladies infectieuses",
  "Médecine physique et réadaptation",
  "Médecine du travail",
  "Médecine légale",
  "Pédiatrie",
  "Néonatologie",
  "Gynécologie-Obstétrique",
  "Maternité",
  "Chirurgie générale",
  "Chirurgie orthopédique et traumatologique",
  "Chirurgie plastique",
  "Urologie",
  "ORL",
  "Ophtalmologie",
  "Stomatologie / Médecine dentaire",
  "Anesthésie",
  "Bloc opératoire",
  "Radiologie / Imagerie médicale",
  "Médecine nucléaire",
  "Laboratoire de biologie médicale",
  "Anatomie pathologique",
  "Microbiologie",
  "Pharmacie",
  "Banque de sang / Centre de transfusion",
  "Stérilisation centrale",
  "Psychiatrie",
  "Pédopsychiatrie",
  "Bureau des entrées",
  "Admission",
  "Archives médicales",
  "Direction",
  "Secrétariat général",
  "Ressources humaines",
  "Service financier / Économat",
  "Service technique / Maintenance",
  "Hygiène hospitalière",
  "Consultations externes",
  "Autre",
];

/** Default brands per equipment type. `__other__` renders the free-text input. */
export const DEFAULT_BRANDS: Record<EquipmentType, string[]> = {
  printer: ["HP", "Canon", "Epson", "Brother", "Samsung", "Xerox", "Lexmark", "Kyocera", "Ricoh"],
  screen: ["Dell", "HP", "Samsung", "LG", "Lenovo", "Acer", "Asus", "AOC", "Philips"],
  unit: ["Dell", "HP", "Lenovo", "Acer", "Asus", "Fujitsu", "Packard Bell", "Assemblé / Clone"],
  qr_printer: ["Zebra", "TSC", "Brother", "Datamax", "Godex", "Honeywell", "Argox"],
};

/**
 * Quick-pick symptoms per equipment. Values are stored on the request and
 * translated via `t(`symptoms.${value}`)`.
 */
export const SYMPTOMS: Record<EquipmentType, string[]> = {
  printer: [
    "printer.not_power",
    "printer.paper_jam",
    "printer.blurry",
    "printer.blank_pages",
    "printer.offline",
    "printer.error_light",
    "printer.low_ink",
    "printer.noise",
  ],
  screen: [
    "screen.black_screen",
    "screen.no_signal",
    "screen.flicker",
    "screen.lines",
    "screen.dim",
    "screen.power_led",
  ],
  unit: [
    "unit.not_start",
    "unit.no_display",
    "unit.very_slow",
    "unit.freezes",
    "unit.blue_screen",
    "unit.noise",
    "unit.overheating",
  ],
  qr_printer: [
    "qr.unreadable",
    "qr.not_printing",
    "qr.paper_jam",
    "qr.calibration",
    "qr.blurry",
    "qr.not_connected",
  ],
};

/** Default editable contact info shown on the home page. */
export const DEFAULT_SETTINGS = {
  phone: "+216 73 369 400",
  extension: "4000",
  email: "informatique@chu-sahloul.tn",
  hours: "Lun – Ven · 08:00 – 16:30",
  address: "Hôpital Universitaire Sahloul, Route de la Ceinture, Sousse 4054, Tunisie",
};

export const TICKET_PREFIX = "SAH";

/** Languages offered by the switch. `dir` drives the RTL flip. */
export const LANGUAGES = [
  { code: "fr", label: "Français", short: "FR", flag: "🇫🇷", dir: "ltr" },
  { code: "ar", label: "العربية", short: "AR", flag: "🇹🇳", dir: "rtl" },
  { code: "en", label: "English", short: "EN", flag: "🇬🇧", dir: "ltr" },
  { code: "es", label: "Español", short: "ES", flag: "🇪🇸", dir: "ltr" },
  { code: "de", label: "Deutsch", short: "DE", flag: "🇩🇪", dir: "ltr" },
  { code: "it", label: "Italiano", short: "IT", flag: "🇮🇹", dir: "ltr" },
  { code: "tr", label: "Türkçe", short: "TR", flag: "🇹🇷", dir: "ltr" },
  { code: "pt", label: "Português", short: "PT", flag: "🇵🇹", dir: "ltr" },
  { code: "ru", label: "Русский", short: "RU", flag: "🇷🇺", dir: "ltr" },
  { code: "zh", label: "中文", short: "ZH", flag: "🇨🇳", dir: "ltr" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];
