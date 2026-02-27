# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build (also serves as type-check, no separate tsc command)
npm run lint         # ESLint via next lint
npm run whatsapp     # Run WhatsApp bridge service (tsx src/services/whatsapp-bridge/index.ts)
```

No test framework is configured. There is no `npm test` command.

## Project Overview

TempoCasa CRM — a real estate agent CRM for Tempo Casa agencies. Built with **Next.js 14 App Router**, **Supabase** (auth + Postgres + RLS), **Tailwind CSS 3** with **shadcn/ui** components, and **TypeScript** in strict mode.

## Language & Design Constraints

- **All UI text must be in Italian** — labels, buttons, placeholders, error messages, everything user-facing.
- **Tablet-first responsive design** — primary viewport is 768-1024px (agents use tablets in the field). Desktop is secondary, mobile is tertiary.
- **Dark mode** is the default theme (configured via `next-themes` with class strategy).

## Architecture

### Route Groups

The app uses Next.js route groups for layout separation:

- `(auth)` — `/login`, `/register` — centered card layout, no sidebar
- `(dashboard)` — all authenticated pages — sidebar + header layout with `AgentProvider` context

### Auth & Data Isolation

- **Middleware** (`src/middleware.ts` → `src/lib/supabase/middleware.ts`): Refreshes Supabase sessions on every request. Redirects unauthenticated users to `/login` and authenticated users away from auth pages.
- **RLS**: Every table has row-level security policies scoped to `agent_id`. Each agent sees only their own data. The schema is in `supabase/migrations/001_initial_schema.sql`.
- **Agent context**: `getCurrentAgent()` in `src/lib/supabase/agent.ts` fetches the logged-in agent's record. The dashboard layout wraps children in `<AgentProvider>` so client components can call `useAgent()`.

### Supabase Client Pattern

- **Server** (Server Components, Server Actions, Route Handlers): `createClient()` from `src/lib/supabase/server.ts` — uses `cookies()` from `next/headers`
- **Browser** (Client Components): `createClient()` from `src/lib/supabase/client.ts` — uses `createBrowserClient`
- **Middleware**: Separate implementation in `src/lib/supabase/middleware.ts`

### Server Actions

All data mutations use Next.js Server Actions in `src/lib/actions/`. Each action file follows the pattern:
1. `'use server'` directive
2. Get agent via `getCurrentAgent()` (ensures RLS scoping)
3. Perform Supabase query
4. Call `revalidatePath()` to refresh cached data
5. `redirect()` on success

Action files: `leads.ts`, `properties.ts`, `matches.ts`, `interactions.ts`, `follow-up.ts`, `post-visit.ts`

### Key Business Logic Modules

| Module | Path | Purpose |
|--------|------|---------|
| Matching | `src/lib/matching/` | 6-criteria scoring (price, zone, type, sqm, must_have, nice_to_have) between leads and properties |
| Lead Scoring | `src/lib/scoring/` | Auto-calculates lead priority score based on 6 factors |
| Follow-up | `src/lib/follow-up/` | Rules engine, templates, scheduler, processor for automated follow-ups |
| Brief | `src/lib/brief/` | Generates appointment preparation briefs |
| Import | `src/lib/import/` | CSV/Excel parsing, field mapping, validation for bulk lead/property import |
| AI | `src/lib/ai/` | Placeholder OpenAI integrations for text extraction |
| WhatsApp | `src/lib/whatsapp/` | Session manager for WhatsApp Web bridge via Baileys |
| Census | `src/lib/census/` | Cadastral data providers (mock + OpenAPI.com), geocoding (Nominatim), sync orchestration |

### API Routes

All under `src/app/api/`:
- `whatsapp/*` — Connect, disconnect, QR code, contacts sync, status
- `ai/*` — Extract property/lead from text (placeholder OpenAI)
- `census/*` — Zone sync, buildings list, unit owners/transactions/contact-log (on-demand fetch)

### Component Organization

- `src/components/ui/` — shadcn/ui primitives (do not edit directly, regenerate via shadcn CLI)
- `src/components/{domain}/` — feature components grouped by domain: `leads/`, `properties/`, `matches/`, `calendar/`, `interactions/`, `follow-up/`, `brief/`, `dashboard/`, `import/`, `whatsapp/`, `ai/`, `census/`
- `src/components/providers/` — React context providers (`AgentProvider`)
- `src/components/sidebar.tsx`, `header.tsx` — shell layout components

### Database Schema

8 core tables defined in `supabase/migrations/001_initial_schema.sql`: `agencies`, `agents`, `leads`, `properties`, `interactions`, `matches`, `follow_up_rules`, `follow_up_queue`. WhatsApp tables in `002_whatsapp.sql`. Census tables (6) in `003_census.sql`: `census_zones`, `census_buildings`, `census_units`, `census_owners`, `census_transactions`, `census_contact_log` — with agency-level RLS and auto-updating counter triggers.

TypeScript interfaces for all tables live in `src/types/database.ts`.

### Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.json`).

## Environment Variables

Copy `.env.local.example` to `.env.local`. Required:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project credentials
- `SUPABASE_SERVICE_ROLE_KEY` — for WhatsApp bridge service

Optional/placeholder: `OPENAI_API_KEY`, `WHATSAPP_API_TOKEN`, `TELEGRAM_BOT_TOKEN`, `WA_BRIDGE_PORT`, `CADASTRAL_PROVIDER` (mock/openapi), `OPENAPI_CATASTO_KEY`, `OPENAPI_CATASTO_URL`

## External Integrations

OpenAI, WhatsApp Business API, and Telegram integrations are **placeholders** — they have the code structure but use mock/stub implementations. The WhatsApp Web bridge (`@whiskeysockets/baileys`) has real connection logic but is a standalone service.
