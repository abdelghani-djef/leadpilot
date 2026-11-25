import type { LeadAnalysis, LeadInput } from "./schema";

/**
 * Offline, rule-based stand-in for the AI so the demo runs without an API key.
 * It is deliberately simple: keyword matching, not understanding.
 */

type Lang = "en" | "fr" | "ar";
type Category = LeadAnalysis["category"];

const has = (text: string, words: string[]) => words.some((w) => text.includes(w));

function detectLanguage(text: string): Lang {
  if (/[؀-ۿ]/.test(text)) return "ar";
  const french = ["bonjour", "je ", "nous ", "votre", "besoin", "devis", "merci", "pour ", "avec ", "boutique", "site web"];
  const hits = french.filter((w) => text.includes(w)).length;
  return hits >= 2 ? "fr" : "en";
}

function detectBudget(lead: LeadInput): string | null {
  if (lead.budget) return lead.budget;
  const match = lead.message.match(
    /(?:[$€]\s?\d[\d\s.,]*k?|\d[\d\s.,]*\s?(?:k\b|€|\$|eur\b|euros?\b|usd\b|dzd\b|da\b|دج|دينار))/i,
  );
  return match ? match[0].trim() : null;
}

function detectCategory(text: string): Category {
  const links = (text.match(/https?:\/\//g) ?? []).length;
  if (links > 2 || has(text, ["backlink", "seo services", "casino", "crypto", "guest post", "ignore previous", "ignore all"])) {
    return "spam";
  }
  if (has(text, ["resume", " cv", "internship", "job opening", "hiring", "emploi", "stage ", "candidature", "وظيفة"])) {
    return "job_application";
  }
  if (has(text, ["not working", "bug", "error", "broken", "panne", "bloqué", "ne marche", "مشكل", "لا يعمل"])) {
    return "support";
  }
  if (has(text, ["partner", "partenariat", "collaboration", "white label", "white-label", "marque blanche", "شراكة"])) {
    return "partnership";
  }
  if (has(text, ["quote", "price", "pricing", "how much", "cost", "devis", "prix", "tarif", "combien", "سعر", "ثمن"])) {
    return "quote_request";
  }
  if (
    has(text, [
      "website", "site", "store", "shop", " app", "automat", "chatbot", "n8n", "landing",
      "boutique", "application", "موقع", "متجر", "تطبيق",
    ])
  ) {
    return "new_project";
  }
  return "other";
}

function detectUrgency(text: string): LeadAnalysis["urgency"] {
  if (has(text, ["urgent", "asap", "as soon as possible", "this week", "rapidement", "au plus vite", "cette semaine", "عاجل", "بسرعة"])) {
    return "high";
  }
  if (has(text, ["next month", "soon", "bientôt", "le mois prochain", "قريبا"])) return "medium";
  return "low";
}

const CATEGORY_LABEL: Record<Category, string> = {
  new_project: "New project",
  quote_request: "Quote request",
  support: "Support request",
  partnership: "Partnership offer",
  job_application: "Job application",
  spam: "Likely spam",
  other: "General inquiry",
};

const REPLIES: Record<Lang, Record<"project" | "support" | "decline", (name: string) => string>> = {
  en: {
    project: (n) =>
      `Hi ${n},\n\nThanks for reaching out, this sounds like a great fit for us. To prepare a clear proposal, could you tell me your ideal launch date and roughly what budget you have in mind? I'm happy to jump on a 15-minute call this week if that's easier.\n\nBest,\nNova Digital`,
    support: (n) =>
      `Hi ${n},\n\nSorry to hear about the trouble. Could you send a screenshot and the address of the page where it happens? We'll take a look and get back to you quickly.\n\nBest,\nNova Digital`,
    decline: (n) => `Hi ${n}, thanks for your message, but this isn't something we can help with. All the best, Nova Digital`,
  },
  fr: {
    project: (n) =>
      `Bonjour ${n},\n\nMerci pour votre message, votre projet nous intéresse beaucoup. Pour vous préparer une proposition claire, pouvez-vous m'indiquer la date de lancement souhaitée et le budget envisagé ? Je peux aussi vous appeler 15 minutes cette semaine si c'est plus simple.\n\nCordialement,\nNova Digital`,
    support: (n) =>
      `Bonjour ${n},\n\nDésolé pour ce souci. Pouvez-vous nous envoyer une capture d'écran et l'adresse de la page concernée ? Nous regardons cela rapidement.\n\nCordialement,\nNova Digital`,
    decline: (n) => `Bonjour ${n}, merci pour votre message, mais nous ne pouvons pas donner suite. Bonne continuation, Nova Digital`,
  },
  ar: {
    project: (n) =>
      `مرحبا ${n}،\n\nشكرا على رسالتك، مشروعك يهمنا كثيرا. حتى نحضر لك عرضا واضحا، هل يمكنك إخبارنا بموعد الإطلاق الذي تريده والميزانية التقريبية؟ يمكننا أيضا إجراء مكالمة قصيرة هذا الأسبوع إذا كان ذلك أسهل.\n\nمع التحية،\nNova Digital`,
    support: (n) =>
      `مرحبا ${n}،\n\nنأسف لهذا المشكل. هل يمكنك إرسال صورة للشاشة ورابط الصفحة المعنية؟ سنتابع الأمر بسرعة.\n\nمع التحية،\nNova Digital`,
    decline: (n) => `مرحبا ${n}، شكرا على رسالتك، لكن لا يمكننا المساعدة في هذا الطلب. مع التحية، Nova Digital`,
  },
};

export function demoAnalyze(lead: LeadInput): LeadAnalysis {
  const text = ` ${lead.message} ${lead.company} ${lead.budget} `.toLowerCase();
  const language = detectLanguage(text);
  const category = detectCategory(text);
  const urgency = detectUrgency(text);
  const budget = detectBudget(lead);
  const fits = category === "new_project" || category === "quote_request" || category === "partnership";

  let score: LeadAnalysis["score"] = "cold";
  if (fits && (budget || urgency === "high")) score = "hot";
  else if (fits) score = "warm";

  const reasons: Record<LeadAnalysis["score"], string> = {
    hot: `${CATEGORY_LABEL[category]} that fits the business${budget ? `, with a stated budget (${budget})` : ""}${urgency === "high" ? " and an urgent deadline" : ""}.`,
    warm: `${CATEGORY_LABEL[category]} that fits the business, but no budget or deadline yet.`,
    cold: `${CATEGORY_LABEL[category]}; not a sales opportunity for this business right now.`,
  };

  const languageName = { en: "English", fr: "French", ar: "Arabic" }[language];
  const details = [
    `written in ${languageName}`,
    budget ? `mentions a budget of ${budget}` : "",
    urgency === "high" ? "asks for a fast start" : "",
  ].filter(Boolean);
  const replyKind = category === "spam" || category === "job_application" ? "decline" : category === "support" ? "support" : "project";
  const firstName = lead.name.split(" ")[0];

  return {
    score,
    score_reason: reasons[score],
    category,
    urgency,
    language,
    summary: `${CATEGORY_LABEL[category]} from ${lead.name}, ${details.join(", ")}.`,
    budget_estimate: budget,
    suggested_reply: REPLIES[language][replyKind](firstName),
    next_action:
      score === "hot"
        ? "Reply within the hour and offer a short call."
        : score === "warm"
          ? "Send the reply and ask for budget and timing."
          : category === "spam"
            ? "Archive; no reply needed."
            : "Send a short reply, then archive.",
  };
}
