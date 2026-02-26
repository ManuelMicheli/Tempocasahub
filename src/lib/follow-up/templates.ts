// ============================================================
// TempoCasa CRM - Follow-up Message Templates (Italian)
// ============================================================

export interface TemplateContext {
  leadName: string;
  agentName: string;
  zone?: string;
  propertyAddress?: string;
  propertyPrice?: string;
}

const templates: Record<string, (ctx: TemplateContext) => string> = {
  new_lead_notify: (ctx) =>
    `Nuovo lead: ${ctx.leadName}. Contattare al piu presto.`,

  new_lead_reminder_2h: (ctx) =>
    `Reminder: ${ctx.leadName} non ancora contattato. Sono passate 2 ore.`,

  new_lead_urgent_24h: (ctx) =>
    `URGENTE: ${ctx.leadName} non contattato da 24 ore!`,

  after_contact_3d: (ctx) =>
    `Buongiorno ${ctx.leadName}, come procede la ricerca? Ho nuovi immobili che potrebbero interessarti nella zona di ${ctx.zone || 'tuo interesse'}. Resto a disposizione! ${ctx.agentName}`,

  after_contact_7d: (ctx) =>
    `Ciao ${ctx.leadName}, sono ancora a disposizione per aiutarti nella ricerca dell'immobile ideale. Se hai domande o vuoi vedere qualche nuovo immobile, non esitare a contattarmi. ${ctx.agentName}`,

  after_visit_1d: (ctx) =>
    `Buongiorno ${ctx.leadName}, come ti e' sembrato l'immobile${ctx.propertyAddress ? ' di ' + ctx.propertyAddress : ''}? Sono a disposizione per qualsiasi domanda. ${ctx.agentName}`,

  after_visit_3d: (ctx) =>
    `Ciao ${ctx.leadName}, ti segnalo che c'e' interesse anche da altri clienti per l'immobile${ctx.propertyAddress ? ' di ' + ctx.propertyAddress : ''}. Se sei ancora interessato, possiamo organizzare una seconda visita. ${ctx.agentName}`,

  proposal_check_2d: (ctx) =>
    `Verificare con il venditore lo stato della proposta per ${ctx.leadName}.`,

  proposal_update_5d: (ctx) =>
    `Aggiornare ${ctx.leadName} sullo stato della proposta.`,

  reactivation: (ctx) =>
    `Ciao ${ctx.leadName}! Volevo aggiornarti sulle novita immobiliari nella zona di ${ctx.zone || 'tuo interesse'}. Ci sono nuove opportunita che potrebbero interessarti. Possiamo sentirci? ${ctx.agentName}`,

  mandate_30d: (ctx) =>
    `Mandato di ${ctx.leadName} in scadenza tra 30 giorni. Pianificare incontro.`,

  mandate_15d: (ctx) =>
    `Mandato di ${ctx.leadName} in scadenza tra 15 giorni. Preparare report attivita.`,

  mandate_7d: (ctx) =>
    `URGENTE: Mandato di ${ctx.leadName} in scadenza tra 7 giorni!`,
};

export function renderTemplate(
  templateKey: string,
  context: TemplateContext
): string {
  const template = templates[templateKey];
  if (!template) return `[Template "${templateKey}" non trovato]`;
  return template(context);
}
