// ============================================================
// TempoCasa CRM - Default Follow-up Rules
// Default rules for automated lead follow-up
// ============================================================

export interface DefaultRule {
  trigger_event: string;
  delay_hours: number;
  channel: 'whatsapp' | 'email' | 'call_reminder';
  template_key: string;
  description: string; // Italian description for UI
}

export const DEFAULT_RULES: DefaultRule[] = [
  // NUOVO LEAD
  {
    trigger_event: 'new_lead',
    delay_hours: 0,
    channel: 'call_reminder',
    template_key: 'new_lead_notify',
    description: 'Notifica immediata per nuovo lead',
  },
  {
    trigger_event: 'new_lead',
    delay_hours: 2,
    channel: 'call_reminder',
    template_key: 'new_lead_reminder_2h',
    description: 'Reminder se non contattato dopo 2 ore',
  },
  {
    trigger_event: 'new_lead',
    delay_hours: 24,
    channel: 'call_reminder',
    template_key: 'new_lead_urgent_24h',
    description: 'Alert urgente se non contattato dopo 24 ore',
  },

  // DOPO PRIMO CONTATTO
  {
    trigger_event: 'first_contact',
    delay_hours: 72,
    channel: 'whatsapp',
    template_key: 'after_contact_3d',
    description: 'Follow-up 3 giorni dopo primo contatto',
  },
  {
    trigger_event: 'first_contact',
    delay_hours: 168,
    channel: 'whatsapp',
    template_key: 'after_contact_7d',
    description: 'Follow-up 7 giorni se nessuna risposta',
  },

  // DOPO VISITA
  {
    trigger_event: 'visit_done',
    delay_hours: 24,
    channel: 'whatsapp',
    template_key: 'after_visit_1d',
    description: 'Follow-up giorno dopo la visita',
  },
  {
    trigger_event: 'visit_done',
    delay_hours: 72,
    channel: 'whatsapp',
    template_key: 'after_visit_3d',
    description: 'Follow-up 3 giorni dopo visita se indeciso',
  },

  // PROPOSTA INVIATA
  {
    trigger_event: 'proposal_sent',
    delay_hours: 48,
    channel: 'call_reminder',
    template_key: 'proposal_check_2d',
    description: 'Check venditore 2 giorni dopo proposta',
  },
  {
    trigger_event: 'proposal_sent',
    delay_hours: 120,
    channel: 'call_reminder',
    template_key: 'proposal_update_5d',
    description: 'Update compratore 5 giorni dopo proposta',
  },

  // LEAD DORMIENTE
  {
    trigger_event: 'dormant_30d',
    delay_hours: 0,
    channel: 'whatsapp',
    template_key: 'reactivation',
    description: 'Riattivazione lead dormiente (30+ giorni)',
  },

  // MANDATO IN SCADENZA
  {
    trigger_event: 'mandate_expiry_30d',
    delay_hours: 0,
    channel: 'call_reminder',
    template_key: 'mandate_30d',
    description: 'Reminder mandato scade tra 30 giorni',
  },
  {
    trigger_event: 'mandate_expiry_15d',
    delay_hours: 0,
    channel: 'call_reminder',
    template_key: 'mandate_15d',
    description: 'Preparare report - mandato scade tra 15 giorni',
  },
  {
    trigger_event: 'mandate_expiry_7d',
    delay_hours: 0,
    channel: 'call_reminder',
    template_key: 'mandate_7d',
    description: 'Alert urgente - mandato scade tra 7 giorni',
  },
];

/** Map trigger_event to Italian label */
export const TRIGGER_EVENT_LABELS: Record<string, string> = {
  new_lead: 'Nuovo Lead',
  first_contact: 'Dopo Primo Contatto',
  visit_done: 'Dopo Visita',
  proposal_sent: 'Proposta Inviata',
  dormant_30d: 'Lead Dormiente',
  mandate_expiry_30d: 'Mandato in Scadenza (30gg)',
  mandate_expiry_15d: 'Mandato in Scadenza (15gg)',
  mandate_expiry_7d: 'Mandato in Scadenza (7gg)',
};

/** Map template_key to description for quick lookup */
export const TEMPLATE_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  DEFAULT_RULES.map((r) => [r.template_key, r.description])
);
