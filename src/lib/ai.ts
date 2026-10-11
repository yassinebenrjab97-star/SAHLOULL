import { LANGUAGES } from "@/lib/constants";
import { AI_ENDPOINT, isSupabaseEnabled } from "@/lib/supabase";

export const AI_NAME = "Ilhem Eltaif Assistant";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function assistantEndpoint(): string | null {
  if (AI_ENDPOINT) return AI_ENDPOINT;
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  if (isSupabaseEnabled && url) return `${url}/functions/v1/ai-assistant`;
  return null;
}

/** Strongly-scoped system prompt: IT support for four equipment types + workflow only. */
export function systemPrompt(lang: string) {
  const label = LANGUAGES.find((l) => l.code === lang)?.label ?? "Français";
  return [
    `You are "${AI_NAME}", the technical support assistant of the IT Department (Service Informatique) of the Hôpital Universitaire Sahloul, a university hospital in Sousse, Tunisia.`,
    "",
    "SCOPE — you ONLY help with:",
    "1. Printers (Imprimante), 2. PC screens (Écran PC), 3. Central units / desktop computers (Unité centrale), 4. QR / label printers (Imprimante QR).",
    "You also explain how this application works (declaring a request, the statuses, why equipment must not be brought before acceptance, tracking a ticket).",
    "",
    "HARD RULES:",
    "- Never give medical advice, never interpret medical data or images, never discuss diagnoses or treatments. If asked anything medical, politely refuse and tell the person to contact the care teams.",
    "- Refuse any topic unrelated to IT support or this app; briefly redirect to the four equipment types and the request workflow.",
    "- Never instruct the user to open, disassemble or repair the inside of a device. Limit guidance to safe, user-serviceable actions: cables, power switches, paper, labels, toner/ink, restart, drivers, calibration, network cable/Wi-Fi, cleaning accessible parts.",
    "- Do not invent ticket numbers or promise repair times.",
    "",
    "WORKFLOW FACTS (explain them accurately):",
    "- Declaring a request creates a ticket like SAH-2025-0001 and starts at 'En attente d'acceptation'.",
    "- While the status is 'En attente d'acceptation', the department MUST NOT bring the equipment to the IT department. Only after the request is ACCEPTED may the equipment be brought in.",
    "- Statuses, in order: En attente d'acceptation → Acceptée (bring the equipment) → En attente de réparation au service informatique → En cours de réparation → Réparé (equipment returns) OR Non réparable (the equipment is automatically added to the 'Matériel réformé' list with its fault and department).",
    "- If a request is refused, the reason is shown on the tracking page and a new request may be opened if the situation changes.",
    "- Tracking: open /suivi and enter the ticket number.",
    "",
    "STYLE:",
    "- Ask one or two clarifying questions about the symptoms when useful, then give a short ordered troubleshooting checklist specific to the equipment type.",
    "- Be warm, calm and professional. Short paragraphs and bullet lists. No emoji.",
    "- If the problem persists after the checks, invite the user to open a request (there is a button to /reclamation) or to call the IT department.",
    `- IMPORTANT: always answer in the user's language (${label}, code "${lang}"). If the user writes in Arabic, answer in Arabic; in French, answer in French; and so on.`,
  ].join("\n");
}

/* ------------------------------------------------------------------ streaming */

const LOCAL_TIPS: Record<string, Record<EquipmentTypeKey, string[]>> = {
  fr: {
    printer: [
      "Vérifiez que l'imprimante est bien branchée et allumée (voyant d'alimentation).",
      "Ouvrez le capot et retirez délicatement toute feuille coincée, sans forcer le rouleau.",
      "Vérifiez le niveau d'encre ou de toner et remplacez la cartouche si nécessaire.",
      "Éteignez puis rallumez l'imprimante, et déconnectez/reconnectez le câble USB ou réseau.",
      "Sur le poste : menu Imprimantes → supprimez la file d'attente, puis relancez un test d'impression.",
    ],
    screen: [
      "Vérifiez que l'écran est branché et que le voyant d'alimentation est allumé.",
      "Débranchez puis rebranchez le câble vidéo (VGA, HDMI ou DisplayPort) des deux côtés.",
      "Testez un autre câble vidéo ou une autre prise électrique pour isoler la panne.",
      "Si l'écran affiche « aucun signal », vérifiez que l'unité centrale est bien allumée.",
      "Réglez la luminosité : une dalle très sombre peut ressembler à un écran noir.",
    ],
    unit: [
      "Vérifiez le câble d'alimentation et l'interrupteur au dos de l'unité centrale.",
      "Maintenez le bouton d'alimentation 5 secondes, attendez 30 secondes, puis rallumez.",
      "Débranchez les périphériques USB superflus (clés, imprimantes) puis redémarrez.",
      "Vérifiez que l'écran est bien connecté à la carte graphique.",
      "Si des bips se font entendre, notez leur nombre : cela aide beaucoup au diagnostic.",
    ],
    qr_printer: [
      "Vérifiez que l'imprimante QR est allumée et connectée au réseau ou en USB.",
      "Ouvrez le capot et remettez en place le rouleau d'étiquettes, sans le plier.",
      "Lancez une procédure de calibration depuis la face avant de l'appareil.",
      "Nettoyez la tête d'impression avec un stylo de nettoyage adapté.",
      "Augmentez la densité d'impression si les codes QR sortent trop pâles.",
    ],
  },
  ar: {
    printer: [
      "تأكد من أن الطابعة موصولة بالكهرباء ومشغّلة (مؤشر التشغيل).",
      "افتح الغطاء وأزل أي ورقة عالقة بلطف دون إجبار الأسطوانة.",
      "تحقق من مستوى الحبر أو التونر واستبدل الخرطوشة عند الحاجة.",
      "أطفئ الطابعة ثم أعد تشغيلها، وافصل ثم أوصل كبل USB أو الشبكة.",
      "على الحاسوب: الطابعات ← احذف المهام المعلّقة ثم أعد إرسال صفحة اختبار.",
    ],
    screen: [
      "تأكد من أن الشاشة موصولة بالكهرباء ومن أن مؤشر التشغيل مضاء.",
      "افصل ثم أعد توصيل كبل الصورة (VGA أو HDMI أو DisplayPort) من الطرفين.",
      "جرّب كبل صورة آخر أو مقبس كهرباء آخر لعزل العطل.",
      "إذا ظهرت عبارة « لا توجد إشارة »، تأكد من أن الوحدة المركزية مشغّلة.",
      "اضبط السطوع: الشاشة الخافتة جدًا قد تبدو سوداء.",
    ],
    unit: [
      "تحقق من كبل الكهرباء ومن مفتاح التشغيل في خلف الوحدة المركزية.",
      "اضغط زر التشغيل 5 ثوانٍ، انتظر 30 ثانية ثم أعد التشغيل.",
      "افصل الأجهزة الطرفية غير الضرورية ثم أعد التشغيل.",
      "تأكد من توصيل الشاشة بمنفذ بطاقة الرسوميات.",
      "إذا سمعت صفيرًا عند التشغيل، سجّل عدد الصفيرات لأنه يساعد في التشخيص.",
    ],
    qr_printer: [
      "تأكد من أن طابعة QR مشغّلة وموصولة بالشبكة أو عبر USB.",
      "افتح الغطاء وأعد تركيب لفافة الملصقات دون ثنيها.",
      "شغّل إجراء المعايرة من الواجهة الأمامية للجهاز.",
      "نظّف رأس الطباعة باستخدام قلم التنظيف المخصص.",
      "زد كثافة الطباعة إذا ظهرت الرموز باهتة.",
    ],
  },
  en: {
    printer: [
      "Check that the printer is plugged in and switched on (power light).",
      "Open the cover and gently remove any jammed sheet — never force the roller.",
      "Check the ink or toner level and replace the cartridge if needed.",
      "Power the printer off and on, and reseat the USB or network cable.",
      "On the computer: Printers → clear the print queue, then send a test page.",
    ],
    screen: [
      "Check that the screen is plugged in and its power light is on.",
      "Unplug and replug the video cable (VGA, HDMI or DisplayPort) at both ends.",
      "Try another video cable or power outlet to isolate the fault.",
      "If it shows 'no signal', check that the central unit is switched on.",
      "Adjust the brightness — a very dim panel can look like a black screen.",
    ],
    unit: [
      "Check the power cable and the switch at the back of the unit.",
      "Hold the power button for 5 seconds, wait 30 seconds, then power on.",
      "Unplug unnecessary USB peripherals, then restart.",
      "Make sure the screen is connected to the graphics card output.",
      "If you hear beeps, note the number — it helps a lot with diagnosis.",
    ],
    qr_printer: [
      "Check that the QR printer is on and connected to the network or via USB.",
      "Open the cover and reseat the label roll without creasing it.",
      "Run the calibration procedure from the device's front panel.",
      "Clean the print head with the proper cleaning pen.",
      "Increase the print darkness if the QR codes come out too pale.",
    ],
  },
};

type EquipmentTypeKey = "printer" | "screen" | "unit" | "qr_printer";

function detectEquipment(text: string): EquipmentTypeKey | null {
  const t = text.toLowerCase();
  if (/(qr|code|étiquette|etiquette|label|zebra|tsc|godex|argox|code-barre)/.test(t)) return "qr_printer";
  if (/(écran|ecran|moniteur|monitor|screen|affichage|display|noir|black)/.test(t)) return "screen";
  if (/(unité|unite|tour|ordinateur|computer|pc|démarre|demarre|boot|windows|éteint)/.test(t)) return "unit";
  if (/(imprimante|printer|print|impression|toner|encre|bourrage|jam|papier|paper)/.test(t)) return "printer";
  return null;
}

function localReply(userText: string, lang: string): string {
  const l = (["fr", "ar", "en"].includes(lang) ? lang : "en") as "fr" | "ar" | "en";
  const tips = LOCAL_TIPS[l];
  const eq = detectEquipment(userText);
  const t = userText.toLowerCase();
  const asksWorkflow = /(accept|statut|status|dépose|depose|apport|bring|suivi|ticket|réform|reform|workflow|étape|etape)/.test(t);

  const head: Record<"fr" | "ar" | "en", string> = {
    fr: "Voici ce que je vous propose, étape par étape :",
    ar: "إليك ما أقترحه عليك خطوة بخطوة:",
    en: "Here is what I suggest, step by step:",
  };
  const tail: Record<"fr" | "ar" | "en", string> = {
    fr: "Si le problème persiste après ces vérifications, ouvrez une demande : l'ingénieur prendra le relais. Rappel : n'apportez pas l'équipement avant l'acceptation de la demande.",
    ar: "إذا استمرت المشكلة بعد هذه الفحوصات، افتح طلبًا وسيتولى المهندس الأمر. تذكير: لا تُحضر الجهاز قبل قبول الطلب.",
    en: "If the problem persists after these checks, open a request and the engineer will take over. Reminder: do not bring the equipment before your request is accepted.",
  };
  const workflow: Record<"fr" | "ar" | "en", string> = {
    fr: "Concernant le suivi : après l'envoi, votre demande est « En attente d'acceptation ». N'apportez l'équipement qu'après l'acceptation, puis les étapes sont : acceptée → reçu au service informatique → en réparation → réparé ou non réparable (ajouté au matériel réformé). Suivez tout depuis la page Suivi avec votre numéro SAH-… .",
    ar: "بخصوص التتبع: بعد الإرسال يكون الطلب «قيد الانتظار». لا تُحضر الجهاز إلا بعد القبول، ثم تكون المراحل: مقبولة ← تم الاستلام ← قيد الإصلاح ← تم الإصلاح أو غير قابل للإصلاح (يُضاف إلى المعدات المشطوبة). تابِع كل شيء من صفحة التتبع برقم SAH-… .",
    en: "About tracking: after submission your request is 'Pending acceptance'. Only bring the equipment once it is accepted; the steps are then: accepted → received by IT → in repair → repaired, or unrepairable (added to the scrapped-equipment list). Track everything from the Tracking page with your SAH-… number.",
  };

  const parts: string[] = [];
  if (asksWorkflow) parts.push(workflow[l]);
  if (eq) {
    parts.push(`${head[l]}\n` + tips[eq].map((s) => `- ${s}`).join("\n"));
  }
  if (!asksWorkflow && !eq) {
    const ask: Record<"fr" | "ar" | "en", string> = {
      fr: "Pouvez-vous préciser l'équipement concerné (imprimante, écran PC, unité centrale ou imprimante QR) et ce qui se passe exactement ?",
      ar: "هل يمكنك توضيح الجهاز المعني (طابعة، شاشة، وحدة مركزية أو طابعة QR) وما الذي يحدث بالضبط؟",
      en: "Could you specify the equipment (printer, PC screen, central unit or QR printer) and what exactly happens?",
    };
    parts.push(ask[l]);
  }
  parts.push(tail[l]);
  return parts.join("\n\n");
}

async function* localStream(
  messages: ChatMessage[],
  lang: string,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const full = localReply(lastUser, lang);
  const tokens = full.match(/\S+\s*/g) ?? [full];
  for (const token of tokens) {
    if (signal?.aborted) return;
    yield token;
    await new Promise((r) => setTimeout(r, 12));
  }
}

/**
 * Streams the assistant answer as text deltas.
 * Production: the Supabase edge function (or VITE_AI_ENDPOINT) proxying an LLM.
 * Demo/offline: a built-in rule-based assistant so the chat still works.
 */
export async function* streamAssistant(
  messages: ChatMessage[],
  lang: string,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const endpoint = assistantEndpoint();
  if (!endpoint) {
    yield* localStream(messages, lang, signal);
    return;
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, language: lang, system: systemPrompt(lang) }),
    });
    if (!res.ok || !res.body) throw new Error(`ai_http_${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // OpenAI-style SSE frames, one JSON per "data:" line.
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith("data:")) {
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") return;
          try {
            const json = JSON.parse(payload);
            const delta =
              json?.choices?.[0]?.delta?.content ??
              json?.delta ??
              json?.token ??
              json?.content ??
              "";
            if (delta) yield delta as string;
          } catch {
            yield payload; // plain-text SSE
          }
        } else {
          yield trimmed; // raw text stream
        }
      }
    }
    if (buffer.trim()) yield buffer.trim();
  } catch (err) {
    if ((err as Error).name === "AbortError") return;
    // Any backend failure degrades gracefully to the local assistant.
    yield* localStream(messages, lang, signal);
  }
}
