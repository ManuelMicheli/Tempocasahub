# 🏠 TempoCasa Agent Assistant — Product Spec & Development Prompt

## Vision

Sistema CRM intelligente per agenti immobiliari di Tempo Casa che automatizza la gestione lead, il matching immobili-clienti e la preparazione appuntamenti. Pensato per un agente junior con ~1.5 anni di esperienza, ma architettato per scalare a tutta l'agenzia.

---

## 1. Architettura Generale

### Stack Consigliato

| Layer | Tecnologia | Motivazione |
|-------|-----------|-------------|
| Frontend | Next.js + Tailwind + shadcn/ui | Dashboard responsive, mobile-first (l'agente è spesso fuori ufficio) |
| Backend | Supabase (Auth, DB, Edge Functions, Realtime) | Setup rapido, RLS per multi-tenancy futura, realtime per notifiche |
| AI Layer | OpenAI GPT-5 API | Matching intelligente, generazione brief, analisi lead |
| Automazioni | Supabase Edge Functions + pg_cron + Database Webhooks | Follow-up, notifiche, sync — tutto nativo Supabase |
| Notifiche | WhatsApp Business API / Telegram Bot | Canale preferito dagli agenti italiani |
| Hosting | Vercel + Supabase Cloud | Zero DevOps |

### Schema Database (Supabase/PostgreSQL)

```sql
-- ORGANIZZAZIONE
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id),
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT DEFAULT 'agent', -- 'agent', 'manager', 'admin'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- LEAD & CLIENTI
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  
  -- Anagrafica
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  
  -- Classificazione
  type TEXT NOT NULL CHECK (type IN ('buyer', 'seller', 'both')),
  source TEXT, -- 'immobiliare.it', 'idealista', 'referral', 'walk-in', 'social', 'altro'
  status TEXT DEFAULT 'new' CHECK (status IN (
    'new',           -- Appena entrato
    'contacted',     -- Primo contatto fatto
    'qualified',     -- Qualificato (ha budget/motivazione reale)
    'active',        -- In ricerca attiva / trattativa
    'proposal',      -- Proposta fatta
    'negotiation',   -- In negoziazione
    'closed_won',    -- Affare chiuso
    'closed_lost',   -- Perso
    'dormant'        -- Inattivo ma da ricontattare
  )),
  temperature TEXT DEFAULT 'warm' CHECK (temperature IN ('hot', 'warm', 'cold')),
  
  -- Ricerca (per buyer)
  search_zones TEXT[],           -- ['Legnano', 'Parabiago', 'San Vittore Olona']
  budget_min INTEGER,
  budget_max INTEGER,
  property_types TEXT[],         -- ['appartamento', 'villa', 'bilocale']
  min_rooms INTEGER,
  min_sqm INTEGER,
  must_have TEXT[],              -- ['box', 'balcone', 'ascensore', 'giardino']
  nice_to_have TEXT[],           -- ['terrazzo', 'cantina', 'doppi servizi']
  timeline TEXT,                 -- 'urgente', '1-3 mesi', '3-6 mesi', 'esplorativo'
  
  -- Vendita (per seller)
  selling_address TEXT,
  selling_price_requested INTEGER,
  selling_price_estimated INTEGER,
  mandate_type TEXT,             -- 'esclusiva', 'non esclusiva'
  mandate_expiry DATE,
  
  -- Tracking
  score INTEGER DEFAULT 50,      -- 0-100, calcolato automaticamente
  last_contact_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- IMMOBILI
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  
  -- Dettagli
  title TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  zone TEXT,                     -- Quartiere/zona
  property_type TEXT NOT NULL,   -- 'appartamento', 'villa', 'loft', etc.
  
  -- Caratteristiche
  price INTEGER NOT NULL,
  sqm INTEGER,
  rooms INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  floor INTEGER,
  total_floors INTEGER,
  year_built INTEGER,
  energy_class TEXT,             -- 'A4' -> 'G'
  
  -- Features
  features TEXT[],               -- ['box', 'balcone', 'ascensore', 'giardino', 'cantina', ...]
  condition TEXT,                -- 'nuovo', 'ristrutturato', 'buono', 'da ristrutturare'
  heating TEXT,                  -- 'autonomo', 'centralizzato'
  
  -- Stato
  status TEXT DEFAULT 'available' CHECK (status IN (
    'draft',         -- In preparazione
    'available',     -- Disponibile
    'reserved',      -- Proposta accettata
    'sold',          -- Venduto
    'withdrawn'      -- Ritirato
  )),
  
  -- Media
  photos TEXT[],                 -- URLs delle foto
  virtual_tour_url TEXT,
  
  -- Portali
  published_on TEXT[],           -- ['immobiliare.it', 'idealista', 'casa.it']
  
  -- Proprietario (collegato come lead tipo 'seller')
  owner_lead_id UUID REFERENCES leads(id),
  
  description TEXT,
  internal_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- INTERAZIONI E ATTIVITÀ
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id),
  
  type TEXT NOT NULL CHECK (type IN (
    'call_outbound', 'call_inbound',
    'whatsapp_sent', 'whatsapp_received',
    'email_sent', 'email_received',
    'visit',          -- Visita immobile
    'meeting',        -- Incontro in ufficio
    'proposal',       -- Proposta d'acquisto
    'note'
  )),
  
  property_id UUID REFERENCES properties(id),  -- Se relativo a un immobile specifico
  
  summary TEXT,
  outcome TEXT,                 -- 'interested', 'not_interested', 'thinking', 'no_answer'
  
  scheduled_at TIMESTAMPTZ,     -- Per appuntamenti futuri
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- MATCH IMMOBILI-CLIENTI
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  
  score INTEGER NOT NULL,        -- 0-100, calcolato dall'AI
  score_breakdown JSONB,         -- { price: 90, zone: 80, features: 70, ... }
  
  status TEXT DEFAULT 'suggested' CHECK (status IN (
    'suggested',     -- Suggerito dal sistema
    'sent',          -- Inviato al cliente
    'visit_booked',  -- Visita prenotata
    'visited',       -- Visitato
    'interested',    -- Cliente interessato
    'rejected',      -- Cliente non interessato
    'proposal'       -- Proposta fatta
  )),
  
  agent_notes TEXT,
  client_feedback TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(lead_id, property_id)
);

-- FOLLOW-UP AUTOMATICI
CREATE TABLE follow_up_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  
  trigger_event TEXT NOT NULL,   -- 'new_lead', 'no_response_3d', 'visit_done', 'proposal_sent', etc.
  delay_hours INTEGER DEFAULT 0,
  channel TEXT NOT NULL,         -- 'whatsapp', 'email', 'call_reminder'
  template_key TEXT,             -- Riferimento al template messaggio
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE follow_up_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES follow_up_rules(id),
  
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
  
  message_preview TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES per performance
CREATE INDEX idx_leads_agent ON leads(agent_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_temperature ON leads(temperature);
CREATE INDEX idx_leads_next_followup ON leads(next_follow_up_at);
CREATE INDEX idx_properties_agent ON properties(agent_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_city_zone ON properties(city, zone);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_interactions_lead ON interactions(lead_id);
CREATE INDEX idx_interactions_scheduled ON interactions(scheduled_at);
CREATE INDEX idx_matches_lead ON matches(lead_id);
CREATE INDEX idx_matches_property ON matches(property_id);
CREATE INDEX idx_matches_score ON matches(score DESC);
CREATE INDEX idx_followup_queue_scheduled ON follow_up_queue(scheduled_at) WHERE status = 'pending';
```

---

## 2. Feature 1: Gestione Lead & Follow-up Automatico

### 2.1 Acquisizione Lead

**Input manuale rapido:**
- Form minimale: nome, telefono, tipo (compra/vende), zona, budget
- Il resto si completa dopo il primo contatto
- Quick-add da mobile con voice-to-text per le note

**Import da portali (fase 2):**
- Supabase Edge Function che riceve email via webhook (es. Mailgun/Resend inbound)
- Parsing automatico delle notifiche da Immobiliare.it, Idealista, Casa.it
- Deduplicazione per telefono/email

### 2.2 Pipeline Visuale

Dashboard con vista Kanban delle colonne:
```
[Nuovi] → [Contattati] → [Qualificati] → [Attivi] → [Proposta] → [Negoziazione] → [Chiuso ✓]
                                                                                    [Perso ✗]
```

Ogni card mostra:
- Nome + temperatura (🔴🟡🟢)
- Ultimo contatto (con warning se > X giorni)
- Prossimo follow-up
- Budget / zona di ricerca (sintesi)

Drag & drop per cambiare stato.

### 2.3 Lead Scoring Automatico

Score 0-100 calcolato su:

| Fattore | Peso | Logica |
|---------|------|--------|
| Reattività | 25% | Risponde entro 24h? Quante interazioni? |
| Timeline | 20% | Urgente > 1-3 mesi > esplorativo |
| Budget realistico | 20% | Budget allineato al mercato della zona? |
| Completezza profilo | 15% | Quanti campi compilati? |
| Source quality | 10% | Referral > Walk-in > Portale |
| Engagement | 10% | Visite fatte, documenti richiesti |

Il score si aggiorna automaticamente ad ogni interazione.

### 2.4 Sistema Follow-up

**Regole predefinite (personalizzabili):**

```
NUOVO LEAD:
  → Immediato: Notifica all'agente ("Nuovo lead: Mario Rossi, cerca bilocale a Legnano")
  → +2h: Se non contattato → reminder agente
  → +24h: Se non contattato → alert urgente

DOPO PRIMO CONTATTO:
  → +3 giorni: "Come procede la ricerca? Ho nuovi immobili che potrebbero interessarti"
  → +7 giorni: Se nessuna risposta → "Sono ancora a disposizione per..."

DOPO VISITA:
  → +1 giorno: "Come ti è sembrato l'immobile di via Roma?"
  → +3 giorni: Se interessato ma indeciso → "Ti segnalo che c'è interesse anche da altri clienti"

PROPOSTA INVIATA:
  → +2 giorni: Check con il venditore
  → +5 giorni: Update al compratore

LEAD DORMIENTE (no interazione > 30 giorni):
  → Messaggio di riattivazione: "Ciao! Volevo aggiornarti sulle novità nella zona X"

MANDATO IN SCADENZA (per seller):
  → -30 giorni: Reminder agente
  → -15 giorni: Preparare report attività
  → -7 giorni: Alert urgente
```

**Template messaggi WhatsApp:**
- Personalizzati con nome cliente, immobile, zona
- Tono professionale ma caldo
- L'agente può editare prima dell'invio (mai full-auto sui messaggi importanti)

### 2.5 Vista Agenda Giornaliera

"Oggi devi:"
1. 🔴 Richiamare Maria Bianchi (lead hot, non contattata da 2gg)
2. 🟡 Follow-up con Luca Verdi (visita ieri a via Garibaldi 12)
3. 📋 3 nuovi lead da qualificare
4. 📅 Appuntamento 15:00 — Visita bilocale via Roma con Famiglia Neri
5. ⚠️ Mandato via Dante scade tra 20 giorni

---

## 3. Feature 2: Matching Immobili-Clienti

### 3.1 Algoritmo di Matching

Quando viene inserito un **nuovo immobile** o un **nuovo lead buyer**, il sistema calcola automaticamente i match.

**Criteri di scoring:**

```
MATCH SCORE (0-100):

1. PREZZO (peso 30%)
   - Immobile nel range budget → 100%
   - Entro 10% sopra budget → 70%
   - Entro 20% sopra budget → 40%
   - Fuori range → 0%

2. ZONA (peso 25%)
   - Zona esatta corrispondente → 100%
   - Zona adiacente / stesso comune → 60%
   - Fuori zona ma vicino → 20%

3. TIPOLOGIA (peso 15%)
   - Match esatto (es. bilocale = bilocale) → 100%
   - Compatibile (es. cerca trilocale, è un grande bilocale) → 50%

4. METRATURA (peso 10%)
   - >= min_sqm richiesto → 100%
   - Entro -10% → 70%
   - Sotto → 30%

5. MUST-HAVE (peso 15%)
   - Tutti presenti → 100%
   - Mancante 1 → 50%
   - Mancante 2+ → 10%

6. NICE-TO-HAVE (peso 5%)
   - Bonus proporzionale ai match
```

### 3.2 Notifiche Match

Quando score >= 70:
```
🏠 NUOVO MATCH (Score: 87/100)

Immobile: Bilocale Via Garibaldi 12, Legnano
Prezzo: €145.000 (budget: €130-150k ✅)
65 mq, 2° piano con ascensore, balcone, box

Cliente: Mario Rossi (lead attivo da 15gg)
Cerca: bilocale Legnano, budget 130-150k

✅ Zona: Legnano centro (match esatto)
✅ Budget: nel range
✅ Must-have: box ✓, ascensore ✓, balcone ✓
⚠️ Metratura: 65 mq (cercava min 70)

→ [Invia al cliente] [Prenota visita] [Ignora]
```

### 3.3 Dashboard Match

Per ogni immobile: lista clienti compatibili ordinata per score.
Per ogni cliente: lista immobili compatibili ordinata per score.

Vista "Opportunità" con i match ad alto score non ancora inviati.

### 3.4 AI Enhancement (OpenAI GPT-5)

Oltre al matching algoritmico, un layer AI che:
- Analizza le note delle interazioni per capire preferenze non strutturate ("il cliente ha detto che vuole una zona tranquilla" → penalizza immobili su strade trafficate)
- Suggerisce perché un match potrebbe funzionare anche se il score è medio ("Il prezzo è leggermente sopra budget, ma il cliente ha detto che potrebbe salire se trova il posto giusto")
- Genera il messaggio personalizzato da inviare al cliente per ogni match

---

## 4. Feature 3: Preparazione Appuntamenti

### 4.1 Brief Pre-Appuntamento

Generato automaticamente 1 ora prima dell'appuntamento (o on-demand).

**Struttura del brief:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 BRIEF APPUNTAMENTO
Oggi, 15:00 — Visita immobile
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 CLIENTE: Mario Rossi
   📞 333-1234567
   🔥 Lead HOT (score: 82)
   📅 Cliente da: 15 gennaio 2026
   
💬 STORIA INTERAZIONI:
   • 15/01 — Primo contatto (da Immobiliare.it)
           Cerca bilocale Legnano, budget 130-150k
           Coppia giovane, primo acquisto
   • 18/01 — Chiamata follow-up
           Confermato interesse, vuole zona centro
           "Non vuole piano terra, preferisce luminoso"
   • 22/01 — Inviati 3 immobili, interessato a 2
   • 25/01 — Visita Via Dante 8 
           "Troppo piccolo, bagno da rifare"
   
🏠 IMMOBILE DA VISITARE:
   Via Garibaldi 12, Legnano
   Bilocale 65 mq, 2° piano, €145.000
   Box, balcone, ascensore
   Classe E, riscaldamento autonomo
   
   Punti di forza da evidenziare:
   ✅ 2° piano con ascensore (vuole luminoso, no PT)
   ✅ Bagno già ristrutturato (punto dolente visita precedente)
   ✅ Box incluso nel prezzo
   ✅ Nel budget
   
   Possibili obiezioni:
   ⚠️ 65 mq (cercava 70+ → ma è ben distribuito)
   ⚠️ Classe E (evidenziare che il condominio sta valutando cappotto termico)
   
💡 SUGGERIMENTI AI:
   "Il cliente è alla seconda visita e ha indicato chiaramente
    cosa non vuole (piccolo, bagno da rifare). Questo immobile
    risponde a entrambi i punti. Evidenzia subito il bagno e
    la luminosità. Se il cliente è dubbioso sulla metratura,
    fai notare la distribuzione degli spazi e il balcone vivibile."

🔗 AZIONI POST-VISITA:
   [ ] Registrare feedback
   [ ] Se interessato → proposta
   [ ] Se non interessato → motivazione + prossimi suggerimenti
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4.2 Trigger Generazione Brief

- **Automatico**: 1 ora prima di ogni appuntamento schedulato
- **On-demand**: Tap su un appuntamento in agenda
- **Delivery**: Push notification + visualizzabile in app + inviabile su WhatsApp

### 4.3 Post-Appuntamento

Quick-feedback form (30 secondi):
- Come è andata? [Molto interessato / Interessato / Così così / Non interessato]
- Note veloci (voice-to-text)
- Prossimo passo? [Proposta / Altra visita / Follow-up tra X giorni / Nessuno]

Il sistema automaticamente:
- Aggiorna il lead score
- Aggiorna lo stato del match
- Schedula il follow-up appropriato

---

## 5. UX / Interfaccia

### Principi

1. **Mobile-first**: L'agente usa il sistema dal telefono il 70% del tempo
2. **3-tap rule**: Qualsiasi azione comune in max 3 tap
3. **Zero data entry dove possibile**: Voice-to-text, auto-fill, smart defaults
4. **Notifiche actionable**: Ogni notifica ha un'azione diretta collegata

### Schermate Principali

1. **Home / Dashboard**
   - Agenda del giorno (appuntamenti + task)
   - Lead che richiedono attenzione (ordinati per urgenza)
   - Nuovi match da revisare
   - KPI rapidi (lead attivi, visite settimana, proposte in corso)

2. **Lead Board** (Kanban)
   - Drag & drop fra stati
   - Filtri per temperatura, zona, budget
   - Quick actions: chiama, WhatsApp, schedula

3. **Immobili**
   - Lista con filtri
   - Per ogni immobile: match score con clienti attivi
   - Quick-add con foto

4. **Match Center**
   - Nuovi match suggeriti
   - Match inviati in attesa di feedback
   - Storico

5. **Calendario**
   - Vista giorno/settimana
   - Integrazione con Google Calendar
   - Brief accessibile per ogni appuntamento

---

## 6. Roadmap Implementativa

### MVP (Settimane 1-3)
- [ ] Setup Supabase (schema, auth, RLS)
- [ ] CRUD Lead con form rapido
- [ ] CRUD Immobili
- [ ] Kanban board lead
- [ ] Matching algoritmico base (senza AI)
- [ ] Dashboard "oggi devi"

### V1.0 (Settimane 4-6)
- [ ] Sistema follow-up con regole e queue
- [ ] Brief pre-appuntamento (generato con AI)
- [ ] Notifiche match via WhatsApp/Telegram
- [ ] Post-visita quick feedback
- [ ] Lead scoring automatico

### V1.5 (Settimane 7-9)
- [ ] AI enhancement matching (analisi note)
- [ ] Import lead da email portali (Edge Function + inbound webhook)
- [ ] Calendario integrato
- [ ] Voice-to-text per note
- [ ] Report settimanale automatico

### V2.0 — Multi-Agente (Futuro)
- [ ] Multi-tenancy (più agenti, stesso ufficio)
- [ ] Assegnazione lead automatica
- [ ] Dashboard manager con KPI team
- [ ] Generazione annunci automatica
- [ ] Valutazione immobili con dati di mercato
- [ ] CRM completo con pipeline vendita

---

## 7. Note Tecniche

### Sicurezza & Privacy
- RLS Supabase per isolamento dati agente
- GDPR compliance: consenso esplicito per marketing
- Dati clienti criptati
- Audit log per ogni azione sui dati personali

### Performance
- Edge Functions per matching (esecuzione vicina all'utente)
- Matching ricalcolato solo su insert/update (non real-time)
- Caching dei brief appuntamento
- PWA per esperienza mobile nativa

### Integrazioni Future
- Google Calendar (sync bidirezionale)
- WhatsApp Business API (messaggi template)
- Immobiliare.it / Idealista (API o email parsing)
- Google Maps (per zone e distanze)
- Firma digitale (proposte d'acquisto)

---

## 8. Prompt di Sviluppo

Questo è il prompt da usare per iniziare lo sviluppo di ogni feature:

```
Sei un senior full-stack developer specializzato in Supabase + Next.js.
Stai costruendo "TempoCasa Agent Assistant", un CRM per agenti immobiliari.

CONTESTO:
- Utente target: agente immobiliare junior in Italia (Tempo Casa)
- Stack: Next.js 14 (App Router), Supabase, Tailwind, shadcn/ui
- Mobile-first, PWA
- Lingua interfaccia: Italiano

PRINCIPI:
- Codice pulito, tipizzato (TypeScript strict)
- Server Components dove possibile
- Supabase RLS per sicurezza
- UI minimale ma funzionale
- Ogni feature deve funzionare offline-first dove possibile

DATABASE: [inserire schema SQL sopra]

FEATURE DA IMPLEMENTARE: [specificare]
```

---

*Documento generato come base di sviluppo. Da espandere iterativamente durante l'implementazione.*
