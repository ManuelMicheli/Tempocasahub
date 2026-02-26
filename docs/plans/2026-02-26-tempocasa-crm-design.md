# TempoCasa CRM — Design Document

## Scope

MVP + V1.0 (Feature 1-11). Tutte le integrazioni esterne (OpenAI, WhatsApp, Telegram, Google Calendar) come placeholder con variabili d'ambiente.

## Stack

- Next.js 14 App Router, TypeScript strict
- Supabase (Auth, PostgreSQL, RLS, Edge Functions)
- Tailwind CSS + shadcn/ui
- PWA ready

## UX

- **Tablet-first**: layout ottimizzato per tablet (usato in agenzia e durante visite)
- Responsive per desktop e mobile
- Lingua interfaccia: Italiano
- 3-tap rule: azioni comuni in max 3 tap

## Auth

Multi-utente con Supabase Auth (email/password). Ogni agente vede solo i propri dati tramite RLS. Profilo agente collegato a tabella `agents`.

## Database

Schema SQL esattamente come da spec (`agencies`, `agents`, `leads`, `properties`, `interactions`, `matches`, `follow_up_rules`, `follow_up_queue`). RLS su tutte le tabelle filtrando per `agent_id`.

## Features

### MVP

1. **Auth multi-utente** — registrazione, login, profilo agente
2. **CRUD Lead** — form rapido, completamento progressivo
3. **CRUD Immobili** — lista con filtri, dettaglio completo
4. **Kanban Board Lead** — drag & drop tra stati, card con temperatura/ultimo contatto/budget
5. **Matching algoritmico** — score 0-100, 6 criteri (prezzo 30%, zona 25%, tipologia 15%, metratura 10%, must-have 15%, nice-to-have 5%)
6. **Dashboard "Oggi devi"** — agenda giornaliera, lead urgenti, match da revisare, KPI

### V1.0

7. **Sistema follow-up** — regole predefinite personalizzabili, coda schedulata, template messaggi
8. **Brief pre-appuntamento** — struttura completa, placeholder AI per generazione
9. **Notifiche match in-app** — placeholder per WhatsApp/Telegram
10. **Post-visita quick feedback** — form rapido, aggiornamento automatico score/stato match
11. **Lead scoring automatico** — 6 fattori (reattivita 25%, timeline 20%, budget 20%, completezza 15%, source 10%, engagement 10%)

## Struttura Progetto

```
src/
  app/
    (auth)/               # Login/Register
    (dashboard)/          # Layout autenticato
      page.tsx            # Dashboard "Oggi devi"
      leads/              # CRUD + Kanban
      properties/         # CRUD Immobili
      matches/            # Match Center
      calendar/           # Agenda/Appuntamenti
      settings/           # Profilo + Regole follow-up
  components/             # Componenti UI riusabili
  lib/
    supabase/             # Client, types, helpers
    matching/             # Algoritmo matching
    scoring/              # Lead scoring
    follow-up/            # Logica follow-up
    ai/                   # Placeholder OpenAI
  types/                  # TypeScript types dal DB schema
```

## Integrazioni (placeholder)

- **OpenAI**: interfaccia definita, risposte mock
- **WhatsApp/Telegram**: interfaccia notifiche, log in console
- **Google Calendar**: predisposto, non implementato
