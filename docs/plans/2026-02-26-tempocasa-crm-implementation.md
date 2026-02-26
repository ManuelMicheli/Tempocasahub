# TempoCasa CRM — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete CRM for Tempo Casa real estate agents covering lead management, property matching, follow-up automation, and appointment briefs (MVP + V1.0 scope).

**Architecture:** Next.js 14 App Router with Supabase backend. Tablet-first responsive UI with shadcn/ui. Multi-tenant via Supabase RLS (each agent sees only their data). All external integrations (OpenAI, WhatsApp, Telegram) as placeholders.

**Tech Stack:** Next.js 14, TypeScript strict, Supabase (Auth + PostgreSQL + RLS), Tailwind CSS, shadcn/ui, @dnd-kit (drag & drop), date-fns (date formatting in Italian)

---

## Task 1: Project Scaffolding & Configuration

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`
- Create: `.env.local.example`
- Create: `src/app/layout.tsx`, `src/app/globals.css`

**Step 1: Initialize Next.js project**

Run:
```bash
cd D:/Manum/tempocasa
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Expected: Next.js project created with App Router, TypeScript, Tailwind.

**Step 2: Install dependencies**

Run:
```bash
npm install @supabase/supabase-js @supabase/ssr date-fns @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities lucide-react
```

**Step 3: Install shadcn/ui**

Run:
```bash
npx shadcn@latest init -d
```

Then install components we'll need:
```bash
npx shadcn@latest add button card input label select textarea badge dialog sheet tabs separator dropdown-menu avatar toast form table popover calendar command scroll-area tooltip switch checkbox radio-group alert
```

**Step 4: Create environment config**

Create `.env.local.example`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenAI (placeholder)
OPENAI_API_KEY=sk-placeholder

# WhatsApp Business API (placeholder)
WHATSAPP_API_TOKEN=placeholder
WHATSAPP_PHONE_NUMBER_ID=placeholder

# Telegram Bot (placeholder)
TELEGRAM_BOT_TOKEN=placeholder
```

Create `.env.local` with same content (will be gitignored).

**Step 5: Configure Italian locale for date-fns**

Create `src/lib/date.ts`:
```typescript
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';
import { it } from 'date-fns/locale';

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: it });
}

export function formatDate(date: string | Date, pattern: string = 'dd/MM/yyyy'): string {
  return format(new Date(date), pattern, { locale: it });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: it });
}

export function daysSince(date: string | Date): number {
  return differenceInDays(new Date(), new Date(date));
}

export function daysUntil(date: string | Date): number {
  return differenceInDays(new Date(date), new Date());
}
```

**Step 6: Update globals.css for tablet-first**

Update `src/app/globals.css` to include base Tailwind directives and custom CSS variables for the theme. Use shadcn/ui default theme with Italian real estate warm color palette.

**Step 7: Commit**

```bash
git init
echo "node_modules/\n.next/\n.env.local\n.env" > .gitignore
git add -A
git commit -m "chore: scaffold Next.js 14 project with Tailwind, shadcn/ui, Supabase deps"
```

---

## Task 2: Database Schema, Types & Supabase Client

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `src/types/database.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`
- Create: `src/middleware.ts`

**Step 1: Create SQL migration file**

Create `supabase/migrations/001_initial_schema.sql` with the FULL schema from the spec:
- All tables: `agencies`, `agents`, `leads`, `properties`, `interactions`, `matches`, `follow_up_rules`, `follow_up_queue`
- All indexes
- All CHECK constraints
- RLS policies:
  ```sql
  -- Enable RLS on all tables
  ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
  ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
  ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
  ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
  ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
  ALTER TABLE follow_up_rules ENABLE ROW LEVEL SECURITY;
  ALTER TABLE follow_up_queue ENABLE ROW LEVEL SECURITY;

  -- Agents can see their own record
  CREATE POLICY "agents_own" ON agents FOR ALL USING (user_id = auth.uid());

  -- Agent can see their agency
  CREATE POLICY "agencies_own" ON agencies FOR SELECT USING (
    id IN (SELECT agency_id FROM agents WHERE user_id = auth.uid())
  );

  -- Leads: agent sees only their own
  CREATE POLICY "leads_own" ON leads FOR ALL USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

  -- Properties: agent sees only their own
  CREATE POLICY "properties_own" ON properties FOR ALL USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

  -- Interactions: agent sees only their own
  CREATE POLICY "interactions_own" ON interactions FOR ALL USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

  -- Matches: agent sees matches for their leads
  CREATE POLICY "matches_own" ON matches FOR ALL USING (
    lead_id IN (SELECT id FROM leads WHERE agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()))
  );

  -- Follow-up rules: agent sees only their own
  CREATE POLICY "followup_rules_own" ON follow_up_rules FOR ALL USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

  -- Follow-up queue: agent sees queue for their leads
  CREATE POLICY "followup_queue_own" ON follow_up_queue FOR ALL USING (
    lead_id IN (SELECT id FROM leads WHERE agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()))
  );
  ```
- `updated_at` trigger function:
  ```sql
  CREATE OR REPLACE FUNCTION update_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  CREATE TRIGGER properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  CREATE TRIGGER matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  ```

**Step 2: Create TypeScript types**

Create `src/types/database.ts` mapping every table to TS types:

```typescript
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'active' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | 'dormant';
export type LeadType = 'buyer' | 'seller' | 'both';
export type Temperature = 'hot' | 'warm' | 'cold';
export type LeadSource = 'immobiliare.it' | 'idealista' | 'referral' | 'walk-in' | 'social' | 'altro';
export type Timeline = 'urgente' | '1-3 mesi' | '3-6 mesi' | 'esplorativo';
export type PropertyStatus = 'draft' | 'available' | 'reserved' | 'sold' | 'withdrawn';
export type PropertyCondition = 'nuovo' | 'ristrutturato' | 'buono' | 'da ristrutturare';
export type InteractionType = 'call_outbound' | 'call_inbound' | 'whatsapp_sent' | 'whatsapp_received' | 'email_sent' | 'email_received' | 'visit' | 'meeting' | 'proposal' | 'note';
export type InteractionOutcome = 'interested' | 'not_interested' | 'thinking' | 'no_answer';
export type MatchStatus = 'suggested' | 'sent' | 'visit_booked' | 'visited' | 'interested' | 'rejected' | 'proposal';
export type FollowUpChannel = 'whatsapp' | 'email' | 'call_reminder';
export type FollowUpQueueStatus = 'pending' | 'sent' | 'cancelled' | 'failed';
export type AgentRole = 'agent' | 'manager' | 'admin';

export interface Agency {
  id: string;
  name: string;
  city: string | null;
  created_at: string;
}

export interface Agent {
  id: string;
  agency_id: string | null;
  user_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  role: AgentRole;
  created_at: string;
}

export interface Lead {
  id: string;
  agent_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  type: LeadType;
  source: LeadSource | null;
  status: LeadStatus;
  temperature: Temperature;
  search_zones: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  property_types: string[] | null;
  min_rooms: number | null;
  min_sqm: number | null;
  must_have: string[] | null;
  nice_to_have: string[] | null;
  timeline: Timeline | null;
  selling_address: string | null;
  selling_price_requested: number | null;
  selling_price_estimated: number | null;
  mandate_type: string | null;
  mandate_expiry: string | null;
  score: number;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  agent_id: string;
  title: string | null;
  address: string;
  city: string;
  zone: string | null;
  property_type: string;
  price: number;
  sqm: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  total_floors: number | null;
  year_built: number | null;
  energy_class: string | null;
  features: string[] | null;
  condition: PropertyCondition | null;
  heating: string | null;
  status: PropertyStatus;
  photos: string[] | null;
  virtual_tour_url: string | null;
  published_on: string[] | null;
  owner_lead_id: string | null;
  description: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  lead_id: string;
  agent_id: string;
  type: InteractionType;
  property_id: string | null;
  summary: string | null;
  outcome: InteractionOutcome | null;
  scheduled_at: string | null;
  completed_at: string | null;
  duration_minutes: number | null;
  created_at: string;
}

export interface Match {
  id: string;
  lead_id: string;
  property_id: string;
  score: number;
  score_breakdown: {
    price: number;
    zone: number;
    type: number;
    sqm: number;
    must_have: number;
    nice_to_have: number;
  } | null;
  status: MatchStatus;
  agent_notes: string | null;
  client_feedback: string | null;
  created_at: string;
  updated_at: string;
}

export interface FollowUpRule {
  id: string;
  agent_id: string;
  trigger_event: string;
  delay_hours: number;
  channel: FollowUpChannel;
  template_key: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FollowUpQueue {
  id: string;
  lead_id: string;
  rule_id: string | null;
  scheduled_at: string;
  sent_at: string | null;
  status: FollowUpQueueStatus;
  message_preview: string | null;
  created_at: string;
}
```

**Step 3: Create Supabase browser client**

Create `src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Step 4: Create Supabase server client**

Create `src/lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch { /* Server Component read-only */ }
        },
      },
    }
  );
}
```

**Step 5: Create auth middleware**

Create `src/lib/supabase/middleware.ts` with session refresh logic.

Create `src/middleware.ts`:
```typescript
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add database schema, TypeScript types, and Supabase client setup"
```

---

## Task 3: Authentication (Login, Register, Profile)

**Files:**
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/register/page.tsx`
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/lib/supabase/auth-actions.ts`

**Step 1: Create auth server actions**

Create `src/lib/supabase/auth-actions.ts`:
```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });
  if (error) return { error: error.message };
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function register(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const phone = formData.get('phone') as string;

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  // Create agent profile
  if (data.user) {
    await supabase.from('agents').insert({
      user_id: data.user.id,
      full_name: fullName,
      phone: phone,
      email: email,
    });
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
```

**Step 2: Create auth layout**

Create `src/app/(auth)/layout.tsx` — centered card layout with TempoCasa branding. No sidebar.

**Step 3: Create login page**

Create `src/app/(auth)/login/page.tsx`:
- Email + password fields
- "Accedi" button
- Link to register
- Error display
- Uses shadcn/ui Card, Input, Label, Button

**Step 4: Create register page**

Create `src/app/(auth)/register/page.tsx`:
- Full name, phone, email, password fields
- "Registrati" button
- Link to login
- Creates auth user + agent profile in one step

**Step 5: Create agent profile helper**

Create `src/lib/supabase/agent.ts`:
```typescript
import { createClient } from './server';

export async function getCurrentAgent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return agent;
}
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add authentication with login, register, and agent profile"
```

---

## Task 4: Dashboard Layout & Navigation

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/components/sidebar.tsx`
- Create: `src/components/header.tsx`
- Create: `src/components/mobile-nav.tsx`

**Step 1: Create sidebar component**

Create `src/components/sidebar.tsx`:
- Navigation links: Dashboard, Lead, Immobili, Match, Calendario, Impostazioni
- Icons from lucide-react: LayoutDashboard, Users, Building2, Zap, Calendar, Settings
- Active state highlighting
- Agent name + role at bottom
- Collapsible on tablet (toggle button)
- On tablet landscape: sidebar visible, ~240px wide
- On tablet portrait: collapsible drawer via Sheet component

**Step 2: Create header component**

Create `src/components/header.tsx`:
- Page title (dynamic)
- Notification bell icon with badge count
- Agent avatar + dropdown (Profilo, Esci)
- Mobile menu toggle button (visible on small screens)

**Step 3: Create dashboard layout**

Create `src/app/(dashboard)/layout.tsx`:
- Auth guard: redirect to /login if not authenticated
- Fetch current agent
- Sidebar + main content area
- Responsive grid:
  - Desktop/tablet landscape: sidebar + content
  - Tablet portrait/mobile: bottom nav or hamburger menu
- Content area with max-width and padding optimized for tablet (768px-1024px primary target)

**Step 4: Create a context provider for agent data**

Create `src/components/providers/agent-provider.tsx`:
```typescript
'use client';

import { createContext, useContext } from 'react';
import type { Agent } from '@/types/database';

const AgentContext = createContext<Agent | null>(null);

export function AgentProvider({ agent, children }: { agent: Agent; children: React.ReactNode }) {
  return <AgentContext.Provider value={agent}>{children}</AgentContext.Provider>;
}

export function useAgent() {
  const agent = useContext(AgentContext);
  if (!agent) throw new Error('useAgent must be used within AgentProvider');
  return agent;
}
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add dashboard layout with sidebar, header, and tablet-first navigation"
```

---

## Task 5: Lead CRUD

**Files:**
- Create: `src/app/(dashboard)/leads/page.tsx`
- Create: `src/app/(dashboard)/leads/new/page.tsx`
- Create: `src/app/(dashboard)/leads/[id]/page.tsx`
- Create: `src/app/(dashboard)/leads/[id]/edit/page.tsx`
- Create: `src/lib/actions/leads.ts`
- Create: `src/components/leads/lead-form.tsx`
- Create: `src/components/leads/lead-card.tsx`
- Create: `src/components/leads/lead-filters.tsx`
- Create: `src/components/leads/lead-detail.tsx`

**Step 1: Create lead server actions**

Create `src/lib/actions/leads.ts`:
```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAgent } from '@/lib/supabase/agent';

export async function createLead(formData: FormData) {
  const supabase = await createClient();
  const agent = await getCurrentAgent();
  if (!agent) return { error: 'Non autenticato' };

  const lead = {
    agent_id: agent.id,
    full_name: formData.get('full_name') as string,
    phone: formData.get('phone') as string || null,
    email: formData.get('email') as string || null,
    type: formData.get('type') as string,
    source: formData.get('source') as string || null,
    search_zones: formData.getAll('search_zones').filter(Boolean) as string[],
    budget_min: formData.get('budget_min') ? Number(formData.get('budget_min')) : null,
    budget_max: formData.get('budget_max') ? Number(formData.get('budget_max')) : null,
    property_types: formData.getAll('property_types').filter(Boolean) as string[],
    timeline: formData.get('timeline') as string || null,
    notes: formData.get('notes') as string || null,
    // Seller fields
    selling_address: formData.get('selling_address') as string || null,
    selling_price_requested: formData.get('selling_price_requested') ? Number(formData.get('selling_price_requested')) : null,
  };

  const { error } = await supabase.from('leads').insert(lead);
  if (error) return { error: error.message };

  revalidatePath('/leads');
  return { success: true };
}

export async function updateLead(id: string, formData: FormData) { /* similar */ }
export async function updateLeadStatus(id: string, status: string) { /* drag & drop */ }
export async function deleteLead(id: string) { /* soft delete or hard delete */ }
```

**Step 2: Create lead form component**

Create `src/components/leads/lead-form.tsx`:
- Minimal quick-add form: nome, telefono, tipo (buyer/seller/both), zona, budget
- Conditional fields: buyer fields shown when type is buyer/both, seller fields when seller/both
- Source dropdown: immobiliare.it, idealista, referral, walk-in, social, altro
- Timeline select for buyers
- Must-have / nice-to-have as tag inputs
- Notes textarea
- All labels in Italian

**Step 3: Create lead card component**

Create `src/components/leads/lead-card.tsx`:
- Name + temperature badge (rosso/giallo/verde)
- Last contact with warning if > 3 days
- Next follow-up date
- Budget range or selling price
- Search zones (tags)
- Quick action buttons: call icon, WhatsApp icon
- Compact enough for Kanban column

**Step 4: Create lead list page**

Create `src/app/(dashboard)/leads/page.tsx`:
- Server component fetching leads
- Filters bar: status, temperature, source, search text
- Toggle between list view and Kanban view (Kanban is Task 6)
- List view: table with sortable columns
- "Nuovo Lead" button → /leads/new

**Step 5: Create lead detail page**

Create `src/app/(dashboard)/leads/[id]/page.tsx`:
- Full lead info display
- Interaction history timeline
- Matched properties list with scores
- Follow-up schedule
- Edit button, quick action buttons

**Step 6: Create new lead page**

Create `src/app/(dashboard)/leads/new/page.tsx`:
- Uses lead-form component
- Redirects to lead detail on success

**Step 7: Create edit lead page**

Create `src/app/(dashboard)/leads/[id]/edit/page.tsx`:
- Uses lead-form pre-filled with existing data

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: add lead CRUD with form, list, detail, and edit pages"
```

---

## Task 6: Lead Kanban Board

**Files:**
- Create: `src/components/leads/kanban-board.tsx`
- Create: `src/components/leads/kanban-column.tsx`
- Create: `src/components/leads/kanban-card.tsx`

**Step 1: Create Kanban board component**

Create `src/components/leads/kanban-board.tsx`:
- Uses @dnd-kit/core and @dnd-kit/sortable
- Columns from spec: Nuovi, Contattati, Qualificati, Attivi, Proposta, Negoziazione, Chiuso, Perso
- Map to lead statuses: new, contacted, qualified, active, proposal, negotiation, closed_won, closed_lost
- Dormant leads shown in a collapsed "Dormienti" section below
- Horizontal scrollable on tablet (all columns visible on landscape, scroll on portrait)
- DragOverlay for visual feedback during drag

**Step 2: Create Kanban column component**

Create `src/components/leads/kanban-column.tsx`:
- Column header with status name + count badge
- Droppable area using @dnd-kit
- Scrollable card list within column
- Column width ~280px optimized for tablet

**Step 3: Create Kanban card component**

Create `src/components/leads/kanban-card.tsx`:
- Draggable using @dnd-kit
- Shows: name, temperature dot (red/yellow/green), last contact relative time
- Warning icon if last contact > 3 days for hot leads, > 7 for warm
- Budget summary line
- Zone tags (max 2 visible + "+N")
- Compact height for many cards visible

**Step 4: Wire up drag & drop status change**

On drag end:
- Call `updateLeadStatus(leadId, newStatus)` server action
- Optimistic update in UI
- Revert on error

**Step 5: Add Kanban view to leads page**

Update `src/app/(dashboard)/leads/page.tsx`:
- Add view toggle: "Lista" | "Kanban"
- Default to Kanban on tablet
- Pass leads data and filters to KanbanBoard

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add lead Kanban board with drag & drop status changes"
```

---

## Task 7: Property CRUD

**Files:**
- Create: `src/app/(dashboard)/properties/page.tsx`
- Create: `src/app/(dashboard)/properties/new/page.tsx`
- Create: `src/app/(dashboard)/properties/[id]/page.tsx`
- Create: `src/app/(dashboard)/properties/[id]/edit/page.tsx`
- Create: `src/lib/actions/properties.ts`
- Create: `src/components/properties/property-form.tsx`
- Create: `src/components/properties/property-card.tsx`
- Create: `src/components/properties/property-filters.tsx`

**Step 1: Create property server actions**

Create `src/lib/actions/properties.ts`:
- `createProperty(formData)` — insert with agent_id from session
- `updateProperty(id, formData)` — update
- `deleteProperty(id)` — delete or set status to 'withdrawn'
- `updatePropertyStatus(id, status)` — quick status change

**Step 2: Create property form**

Create `src/components/properties/property-form.tsx`:
- Organized sections: Dettagli, Caratteristiche, Features, Stato, Media
- Dettagli: titolo, indirizzo, citta, zona, tipologia
- Caratteristiche: prezzo, mq, locali, camere, bagni, piano, anno costruzione, classe energetica
- Features: checkbox grid (box, balcone, ascensore, giardino, cantina, terrazzo, doppi servizi)
- Condition select, heating select
- Status select
- Owner lead selector (optional, links to seller lead)
- Photos URLs field (multi-input)
- Description + internal notes textareas
- All labels in Italian

**Step 3: Create property card**

Create `src/components/properties/property-card.tsx`:
- Photo thumbnail (or placeholder)
- Title or address
- Price formatted (€145.000)
- Key stats: sqm, rooms, floor
- Status badge (color-coded)
- Features tags (max 3 visible)
- Match count badge ("3 clienti compatibili")

**Step 4: Create property list page**

Create `src/app/(dashboard)/properties/page.tsx`:
- Server component fetching properties
- Grid layout (2 cols on tablet portrait, 3 on landscape)
- Filter bar: status, city, price range, property type, rooms
- Sort: price, date added, match count
- "Nuovo Immobile" button

**Step 5: Create property detail page**

Create `src/app/(dashboard)/properties/[id]/page.tsx`:
- Full property info with photo gallery
- Matched leads list with scores
- Interaction history related to this property
- Owner info (if linked to seller lead)
- Actions: edit, change status, generate matches

**Step 6: Create new + edit pages**

Pages using property-form component.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add property CRUD with form, grid list, detail, and filters"
```

---

## Task 8: Matching Algorithm

**Files:**
- Create: `src/lib/matching/calculate-match.ts`
- Create: `src/lib/matching/run-matching.ts`
- Create: `src/lib/actions/matches.ts`

**Step 1: Implement match score calculation**

Create `src/lib/matching/calculate-match.ts`:

```typescript
import type { Lead, Property } from '@/types/database';

interface ScoreBreakdown {
  price: number;
  zone: number;
  type: number;
  sqm: number;
  must_have: number;
  nice_to_have: number;
}

const WEIGHTS = {
  price: 0.30,
  zone: 0.25,
  type: 0.15,
  sqm: 0.10,
  must_have: 0.15,
  nice_to_have: 0.05,
};

export function calculateMatchScore(lead: Lead, property: Property): { score: number; breakdown: ScoreBreakdown } {
  const breakdown: ScoreBreakdown = {
    price: calculatePriceScore(lead, property),
    zone: calculateZoneScore(lead, property),
    type: calculateTypeScore(lead, property),
    sqm: calculateSqmScore(lead, property),
    must_have: calculateMustHaveScore(lead, property),
    nice_to_have: calculateNiceToHaveScore(lead, property),
  };

  const score = Math.round(
    breakdown.price * WEIGHTS.price +
    breakdown.zone * WEIGHTS.zone +
    breakdown.type * WEIGHTS.type +
    breakdown.sqm * WEIGHTS.sqm +
    breakdown.must_have * WEIGHTS.must_have +
    breakdown.nice_to_have * WEIGHTS.nice_to_have
  );

  return { score, breakdown };
}

function calculatePriceScore(lead: Lead, property: Property): number {
  if (!lead.budget_min && !lead.budget_max) return 50; // No budget info
  const price = property.price;
  const max = lead.budget_max || Infinity;
  const min = lead.budget_min || 0;

  if (price >= min && price <= max) return 100;
  if (price > max) {
    const overPercent = ((price - max) / max) * 100;
    if (overPercent <= 10) return 70;
    if (overPercent <= 20) return 40;
    return 0;
  }
  return 80; // Under budget is fine
}

function calculateZoneScore(lead: Lead, property: Property): number {
  if (!lead.search_zones || lead.search_zones.length === 0) return 50;
  const propertyZone = (property.zone || property.city || '').toLowerCase();
  const propertyCity = property.city.toLowerCase();

  for (const zone of lead.search_zones) {
    if (propertyZone.includes(zone.toLowerCase()) || zone.toLowerCase().includes(propertyZone)) return 100;
    if (propertyCity.includes(zone.toLowerCase()) || zone.toLowerCase().includes(propertyCity)) return 60;
  }
  return 20;
}

function calculateTypeScore(lead: Lead, property: Property): number {
  if (!lead.property_types || lead.property_types.length === 0) return 50;
  const propType = property.property_type.toLowerCase();
  for (const t of lead.property_types) {
    if (propType.includes(t.toLowerCase()) || t.toLowerCase().includes(propType)) return 100;
  }
  return 30;
}

function calculateSqmScore(lead: Lead, property: Property): number {
  if (!lead.min_sqm || !property.sqm) return 50;
  if (property.sqm >= lead.min_sqm) return 100;
  const deficit = ((lead.min_sqm - property.sqm) / lead.min_sqm) * 100;
  if (deficit <= 10) return 70;
  return 30;
}

function calculateMustHaveScore(lead: Lead, property: Property): number {
  if (!lead.must_have || lead.must_have.length === 0) return 100;
  const features = (property.features || []).map(f => f.toLowerCase());
  let missing = 0;
  for (const must of lead.must_have) {
    if (!features.includes(must.toLowerCase())) missing++;
  }
  if (missing === 0) return 100;
  if (missing === 1) return 50;
  return 10;
}

function calculateNiceToHaveScore(lead: Lead, property: Property): number {
  if (!lead.nice_to_have || lead.nice_to_have.length === 0) return 50;
  const features = (property.features || []).map(f => f.toLowerCase());
  let matched = 0;
  for (const nice of lead.nice_to_have) {
    if (features.includes(nice.toLowerCase())) matched++;
  }
  return Math.round((matched / lead.nice_to_have.length) * 100);
}
```

**Step 2: Implement batch matching runner**

Create `src/lib/matching/run-matching.ts`:
```typescript
import { createClient } from '@/lib/supabase/server';
import { calculateMatchScore } from './calculate-match';

// Run matching for a new property against all active buyer leads
export async function matchPropertyToLeads(propertyId: string) {
  const supabase = await createClient();

  const { data: property } = await supabase.from('properties').select('*').eq('id', propertyId).single();
  if (!property || property.status !== 'available') return;

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('agent_id', property.agent_id)
    .in('type', ['buyer', 'both'])
    .not('status', 'in', '("closed_won","closed_lost")');

  if (!leads) return;

  const matches = [];
  for (const lead of leads) {
    const { score, breakdown } = calculateMatchScore(lead, property);
    if (score >= 50) {
      matches.push({
        lead_id: lead.id,
        property_id: property.id,
        score,
        score_breakdown: breakdown,
        status: 'suggested' as const,
      });
    }
  }

  if (matches.length > 0) {
    await supabase.from('matches').upsert(matches, { onConflict: 'lead_id,property_id' });
  }
}

// Run matching for a new lead against all available properties
export async function matchLeadToProperties(leadId: string) {
  // Similar logic, reversed
}
```

**Step 3: Create match actions**

Create `src/lib/actions/matches.ts`:
- `updateMatchStatus(id, status)` — change match status
- `addMatchNote(id, note)` — add agent note
- `addClientFeedback(id, feedback)` — after visit
- `recalculateMatches(agentId)` — recalculate all

**Step 4: Trigger matching on property/lead creation**

Update `src/lib/actions/properties.ts` → call `matchPropertyToLeads` after insert.
Update `src/lib/actions/leads.ts` → call `matchLeadToProperties` after insert (if buyer/both).

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add property-lead matching algorithm with 6-criteria scoring"
```

---

## Task 9: Match Center UI

**Files:**
- Create: `src/app/(dashboard)/matches/page.tsx`
- Create: `src/components/matches/match-card.tsx`
- Create: `src/components/matches/match-detail-dialog.tsx`
- Create: `src/components/matches/match-notification.tsx`

**Step 1: Create match card component**

Create `src/components/matches/match-card.tsx`:
- Score badge (color: green >=80, yellow >=60, gray <60)
- Property summary: address, price, sqm, features
- Lead summary: name, budget, zones
- Score breakdown bars (visual)
- Status badge
- Action buttons: "Invia al cliente", "Prenota visita", "Ignora"

**Step 2: Create match detail dialog**

Create `src/components/matches/match-detail-dialog.tsx`:
- Full match info as per spec notification format:
  - Property details
  - Lead details
  - Score breakdown with checkmarks/warnings
  - Action buttons

**Step 3: Create Match Center page**

Create `src/app/(dashboard)/matches/page.tsx`:
- Tabs: "Nuovi suggerimenti" | "Inviati" | "Storico"
- Tab 1 (Nuovi): matches with status='suggested', ordered by score DESC
- Tab 2 (Inviati): matches with status='sent'|'visit_booked', awaiting feedback
- Tab 3 (Storico): all other statuses
- Filter by lead, by property, by min score
- Grid of match cards (2 cols tablet portrait, 3 landscape)

**Step 4: Add match counts to property and lead pages**

Update property detail: show matched leads section.
Update lead detail: show matched properties section.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Match Center with match cards, detail dialog, and tabbed views"
```

---

## Task 10: Dashboard "Oggi Devi"

**Files:**
- Create: `src/app/(dashboard)/page.tsx`
- Create: `src/components/dashboard/today-agenda.tsx`
- Create: `src/components/dashboard/urgent-leads.tsx`
- Create: `src/components/dashboard/new-matches.tsx`
- Create: `src/components/dashboard/kpi-cards.tsx`

**Step 1: Create KPI cards component**

Create `src/components/dashboard/kpi-cards.tsx`:
- 4 cards in a row (2x2 on tablet portrait):
  - Lead attivi (count of active leads)
  - Visite questa settimana (scheduled visits this week)
  - Proposte in corso (leads in proposal/negotiation)
  - Nuovi match (unreviewed suggested matches count)

**Step 2: Create today agenda component**

Create `src/components/dashboard/today-agenda.tsx`:
- Ordered list of today's items:
  1. Hot leads not contacted in 2+ days (red priority)
  2. Follow-ups due today (yellow priority)
  3. New leads to qualify (info priority)
  4. Scheduled appointments today (with time)
  5. Expiring mandates within 30 days (warning)
- Each item has icon, description, quick action button
- Matches the spec format:
  ```
  1. 🔴 Richiamare Maria Bianchi (lead hot, non contattata da 2gg)
  2. 🟡 Follow-up con Luca Verdi (visita ieri a via Garibaldi 12)
  3. 📋 3 nuovi lead da qualificare
  4. 📅 Appuntamento 15:00 — Visita bilocale via Roma con Famiglia Neri
  5. ⚠️ Mandato via Dante scade tra 20 giorni
  ```

**Step 3: Create urgent leads component**

Create `src/components/dashboard/urgent-leads.tsx`:
- Top 5 leads requiring attention, ordered by urgency
- Hot leads with no contact > 2 days first
- Shows lead card mini version with quick actions

**Step 4: Create new matches component**

Create `src/components/dashboard/new-matches.tsx`:
- Latest 5 suggested matches (score >= 70)
- Mini match card with "Vedi dettagli" button

**Step 5: Create dashboard page**

Create `src/app/(dashboard)/page.tsx`:
- Server component fetching all dashboard data
- Layout:
  - KPI cards row at top
  - Two columns on tablet landscape:
    - Left (60%): "Oggi devi" agenda
    - Right (40%): Nuovi match + Urgent leads
  - Single column on portrait: stack all sections

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add dashboard with daily agenda, KPIs, urgent leads, and new matches"
```

---

## Task 11: Lead Scoring Automatico

**Files:**
- Create: `src/lib/scoring/calculate-lead-score.ts`
- Create: `src/lib/scoring/update-score.ts`

**Step 1: Implement lead score calculation**

Create `src/lib/scoring/calculate-lead-score.ts`:

```typescript
import type { Lead, Interaction } from '@/types/database';

const WEIGHTS = {
  reactivity: 0.25,
  timeline: 0.20,
  budget: 0.20,
  completeness: 0.15,
  source: 0.10,
  engagement: 0.10,
};

export function calculateLeadScore(lead: Lead, interactions: Interaction[]): number {
  const scores = {
    reactivity: calculateReactivity(lead, interactions),
    timeline: calculateTimeline(lead),
    budget: calculateBudget(lead),
    completeness: calculateCompleteness(lead),
    source: calculateSourceQuality(lead),
    engagement: calculateEngagement(interactions),
  };

  return Math.round(
    scores.reactivity * WEIGHTS.reactivity +
    scores.timeline * WEIGHTS.timeline +
    scores.budget * WEIGHTS.budget +
    scores.completeness * WEIGHTS.completeness +
    scores.source * WEIGHTS.source +
    scores.engagement * WEIGHTS.engagement
  );
}

function calculateReactivity(lead: Lead, interactions: Interaction[]): number {
  // Based on response time and interaction count
  if (interactions.length === 0) return 30;
  const inbound = interactions.filter(i => i.type.includes('inbound') || i.type.includes('received'));
  if (inbound.length === 0) return 40;
  // Check average response time
  const recentInteractions = interactions.length;
  if (recentInteractions >= 5) return 100;
  if (recentInteractions >= 3) return 80;
  return 60;
}

function calculateTimeline(lead: Lead): number {
  switch (lead.timeline) {
    case 'urgente': return 100;
    case '1-3 mesi': return 80;
    case '3-6 mesi': return 50;
    case 'esplorativo': return 20;
    default: return 40;
  }
}

function calculateBudget(lead: Lead): number {
  if (lead.type === 'seller') {
    return lead.selling_price_requested ? 80 : 30;
  }
  if (lead.budget_min || lead.budget_max) return 80;
  return 30;
}

function calculateCompleteness(lead: Lead): number {
  const fields = [
    lead.full_name, lead.phone, lead.email, lead.type,
    lead.source, lead.search_zones?.length, lead.budget_min,
    lead.budget_max, lead.property_types?.length, lead.timeline,
    lead.must_have?.length, lead.notes,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

function calculateSourceQuality(lead: Lead): number {
  switch (lead.source) {
    case 'referral': return 100;
    case 'walk-in': return 80;
    case 'social': return 60;
    case 'immobiliare.it': case 'idealista': return 50;
    default: return 40;
  }
}

function calculateEngagement(interactions: Interaction[]): number {
  const visits = interactions.filter(i => i.type === 'visit').length;
  const proposals = interactions.filter(i => i.type === 'proposal').length;
  if (proposals > 0) return 100;
  if (visits >= 3) return 90;
  if (visits >= 1) return 70;
  return 30;
}
```

**Step 2: Create score updater**

Create `src/lib/scoring/update-score.ts`:
```typescript
import { createClient } from '@/lib/supabase/server';
import { calculateLeadScore } from './calculate-lead-score';

export async function updateLeadScore(leadId: string) {
  const supabase = await createClient();

  const { data: lead } = await supabase.from('leads').select('*').eq('id', leadId).single();
  if (!lead) return;

  const { data: interactions } = await supabase
    .from('interactions')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  const score = calculateLeadScore(lead, interactions || []);

  await supabase.from('leads').update({ score }).eq('id', leadId);
}
```

**Step 3: Trigger score update on interaction create**

Update interaction creation actions to call `updateLeadScore` after each new interaction.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add automatic lead scoring with 6-factor calculation"
```

---

## Task 12: Interaction Tracking & Calendar

**Files:**
- Create: `src/app/(dashboard)/calendar/page.tsx`
- Create: `src/components/interactions/interaction-form.tsx`
- Create: `src/components/interactions/interaction-timeline.tsx`
- Create: `src/components/calendar/calendar-view.tsx`
- Create: `src/components/calendar/appointment-card.tsx`
- Create: `src/lib/actions/interactions.ts`

**Step 1: Create interaction server actions**

Create `src/lib/actions/interactions.ts`:
- `createInteraction(formData)` — create interaction, update lead's last_contact_at
- `scheduleAppointment(formData)` — create interaction with scheduled_at
- `completeInteraction(id, outcome, summary)` — mark as completed

**Step 2: Create interaction form**

Create `src/components/interactions/interaction-form.tsx`:
- Dialog/sheet form
- Type select (all interaction types from spec, in Italian)
- Property select (optional, for visits)
- Summary textarea
- Outcome select (for completed interactions)
- Schedule date/time picker (for future appointments)
- Duration field

**Step 3: Create interaction timeline**

Create `src/components/interactions/interaction-timeline.tsx`:
- Vertical timeline showing all interactions for a lead
- Icon per type, color per outcome
- Date + summary + property reference
- Used on lead detail page

**Step 4: Create calendar view**

Create `src/components/calendar/calendar-view.tsx`:
- Week view (default) and day view toggle
- Shows scheduled interactions as appointment blocks
- Click to view brief or details
- "Nuovo appuntamento" button

**Step 5: Create appointment card**

Create `src/components/calendar/appointment-card.tsx`:
- Time, lead name, property address, type
- Status (scheduled/completed)
- "Vedi brief" button (links to Task 13)

**Step 6: Create calendar page**

Create `src/app/(dashboard)/calendar/page.tsx`:
- Fetch scheduled interactions for current week
- Calendar view component
- Quick-add appointment button

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add interaction tracking, timeline, and calendar view"
```

---

## Task 13: Follow-up System

**Files:**
- Create: `src/lib/follow-up/rules.ts`
- Create: `src/lib/follow-up/templates.ts`
- Create: `src/lib/follow-up/scheduler.ts`
- Create: `src/lib/follow-up/processor.ts`
- Create: `src/app/(dashboard)/settings/follow-up/page.tsx`
- Create: `src/components/follow-up/rule-editor.tsx`
- Create: `src/components/follow-up/queue-list.tsx`
- Create: `src/lib/actions/follow-up.ts`
- Create: `src/lib/notifications/placeholder.ts`

**Step 1: Define default follow-up rules**

Create `src/lib/follow-up/rules.ts`:
```typescript
export const DEFAULT_RULES = [
  { trigger_event: 'new_lead', delay_hours: 0, channel: 'call_reminder', template_key: 'new_lead_notify' },
  { trigger_event: 'new_lead', delay_hours: 2, channel: 'call_reminder', template_key: 'new_lead_reminder_2h' },
  { trigger_event: 'new_lead', delay_hours: 24, channel: 'call_reminder', template_key: 'new_lead_urgent_24h' },
  { trigger_event: 'first_contact', delay_hours: 72, channel: 'whatsapp', template_key: 'after_contact_3d' },
  { trigger_event: 'first_contact', delay_hours: 168, channel: 'whatsapp', template_key: 'after_contact_7d' },
  { trigger_event: 'visit_done', delay_hours: 24, channel: 'whatsapp', template_key: 'after_visit_1d' },
  { trigger_event: 'visit_done', delay_hours: 72, channel: 'whatsapp', template_key: 'after_visit_3d' },
  { trigger_event: 'proposal_sent', delay_hours: 48, channel: 'call_reminder', template_key: 'proposal_check_2d' },
  { trigger_event: 'proposal_sent', delay_hours: 120, channel: 'call_reminder', template_key: 'proposal_update_5d' },
  { trigger_event: 'dormant_30d', delay_hours: 0, channel: 'whatsapp', template_key: 'reactivation' },
  { trigger_event: 'mandate_expiry_30d', delay_hours: 0, channel: 'call_reminder', template_key: 'mandate_30d' },
  { trigger_event: 'mandate_expiry_15d', delay_hours: 0, channel: 'call_reminder', template_key: 'mandate_15d' },
  { trigger_event: 'mandate_expiry_7d', delay_hours: 0, channel: 'call_reminder', template_key: 'mandate_7d' },
];
```

**Step 2: Create message templates**

Create `src/lib/follow-up/templates.ts`:
- Template functions that accept lead name, property, zone etc.
- Italian language, professional but warm tone
- All templates from spec section 2.4

**Step 3: Create scheduler**

Create `src/lib/follow-up/scheduler.ts`:
- `scheduleFollowUp(leadId, triggerEvent)` — looks up rules for trigger, creates queue entries
- `cancelPendingFollowUps(leadId)` — cancel when status changes
- Called from interaction actions and lead status changes

**Step 4: Create processor (placeholder)**

Create `src/lib/follow-up/processor.ts`:
- `processPendingFollowUps()` — find pending queue items with scheduled_at <= now
- For whatsapp/email: call notification placeholder, mark as sent
- For call_reminder: show in dashboard agenda
- This would run via cron in production; for now callable manually or via API route

**Step 5: Create notification placeholders**

Create `src/lib/notifications/placeholder.ts`:
```typescript
export async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  console.log(`[PLACEHOLDER] WhatsApp to ${phone}: ${message}`);
  return true;
}

export async function sendTelegram(chatId: string, message: string): Promise<boolean> {
  console.log(`[PLACEHOLDER] Telegram to ${chatId}: ${message}`);
  return true;
}

export async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  console.log(`[PLACEHOLDER] Email to ${to}: ${subject}`);
  return true;
}
```

**Step 6: Create follow-up settings page**

Create `src/app/(dashboard)/settings/follow-up/page.tsx`:
- List of follow-up rules with toggle on/off
- Edit delay, channel, template per rule
- "Ripristina default" button
- Seed default rules on first load

**Step 7: Create queue list component**

Create `src/components/follow-up/queue-list.tsx`:
- Shows pending follow-ups for a lead
- Status, scheduled time, message preview
- Cancel button

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: add follow-up system with rules, templates, scheduler, and notification placeholders"
```

---

## Task 14: Appointment Brief & Post-Visit Feedback

**Files:**
- Create: `src/lib/ai/placeholder.ts`
- Create: `src/lib/brief/generate-brief.ts`
- Create: `src/components/brief/appointment-brief.tsx`
- Create: `src/components/interactions/post-visit-form.tsx`
- Create: `src/app/(dashboard)/calendar/[id]/brief/page.tsx`

**Step 1: Create AI placeholder**

Create `src/lib/ai/placeholder.ts`:
```typescript
export async function generateAISuggestions(context: {
  lead: any;
  property: any;
  interactions: any[];
}): Promise<string> {
  // Placeholder: return a static suggestion based on available data
  const { lead, property, interactions } = context;
  const visitCount = interactions.filter(i => i.type === 'visit').length;

  return `Il cliente e' alla visita numero ${visitCount + 1}. ` +
    `Budget ${lead.budget_min ? `${lead.budget_min}-${lead.budget_max}` : 'non specificato'}. ` +
    `Immobile a €${property.price?.toLocaleString('it-IT')}. ` +
    `[Suggerimento AI placeholder - collegare OpenAI per suggerimenti personalizzati]`;
}

export async function generateMatchMessage(lead: any, property: any, score: number): Promise<string> {
  return `Buongiorno ${lead.full_name}, ho un immobile che potrebbe interessarti: ` +
    `${property.title || property.address}, ${property.city}. ` +
    `${property.rooms} locali, ${property.sqm} mq a €${property.price?.toLocaleString('it-IT')}. ` +
    `Vuoi organizzare una visita?`;
}
```

**Step 2: Implement brief generation**

Create `src/lib/brief/generate-brief.ts`:
```typescript
import { createClient } from '@/lib/supabase/server';
import { generateAISuggestions } from '@/lib/ai/placeholder';
import type { Lead, Property, Interaction, Match } from '@/types/database';

export interface AppointmentBrief {
  appointment: Interaction;
  lead: Lead;
  property: Property | null;
  interactions: Interaction[];
  match: Match | null;
  strengths: string[];
  objections: string[];
  aiSuggestions: string;
}

export async function generateBrief(interactionId: string): Promise<AppointmentBrief | null> {
  const supabase = await createClient();

  // Fetch appointment
  const { data: appointment } = await supabase
    .from('interactions')
    .select('*')
    .eq('id', interactionId)
    .single();
  if (!appointment) return null;

  // Fetch lead
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', appointment.lead_id)
    .single();
  if (!lead) return null;

  // Fetch property if linked
  let property = null;
  if (appointment.property_id) {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('id', appointment.property_id)
      .single();
    property = data;
  }

  // Fetch all interactions for this lead
  const { data: interactions } = await supabase
    .from('interactions')
    .select('*')
    .eq('lead_id', lead.id)
    .order('created_at', { ascending: true });

  // Fetch match if property linked
  let match = null;
  if (property) {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('lead_id', lead.id)
      .eq('property_id', property.id)
      .single();
    match = data;
  }

  // Calculate strengths and objections
  const strengths: string[] = [];
  const objections: string[] = [];

  if (property && lead) {
    // Price check
    if (lead.budget_max && property.price <= lead.budget_max) {
      strengths.push(`Nel budget (€${property.price.toLocaleString('it-IT')} vs max €${lead.budget_max.toLocaleString('it-IT')})`);
    } else if (lead.budget_max) {
      objections.push(`Sopra budget (€${property.price.toLocaleString('it-IT')} vs max €${lead.budget_max.toLocaleString('it-IT')})`);
    }

    // Must-have check
    if (lead.must_have && property.features) {
      const features = property.features.map(f => f.toLowerCase());
      for (const must of lead.must_have) {
        if (features.includes(must.toLowerCase())) {
          strengths.push(`${must} presente`);
        } else {
          objections.push(`${must} non presente`);
        }
      }
    }

    // Sqm check
    if (lead.min_sqm && property.sqm) {
      if (property.sqm >= lead.min_sqm) {
        strengths.push(`${property.sqm} mq (cercava min ${lead.min_sqm})`);
      } else {
        objections.push(`${property.sqm} mq (cercava min ${lead.min_sqm})`);
      }
    }
  }

  // AI suggestions (placeholder)
  const aiSuggestions = await generateAISuggestions({
    lead, property, interactions: interactions || [],
  });

  return {
    appointment,
    lead,
    property,
    interactions: interactions || [],
    match,
    strengths,
    objections,
    aiSuggestions,
  };
}
```

**Step 3: Create brief display component**

Create `src/components/brief/appointment-brief.tsx`:
- Renders the full brief exactly as in spec section 4.1
- Sections: Client info, Interaction history, Property details, Strengths/Objections, AI suggestions, Post-visit actions
- Print-friendly and share-friendly layout
- Optimized for tablet reading

**Step 4: Create brief page**

Create `src/app/(dashboard)/calendar/[id]/brief/page.tsx`:
- Server component that generates brief and renders it
- "Condividi" button (placeholder)
- Back to calendar link

**Step 5: Create post-visit feedback form**

Create `src/components/interactions/post-visit-form.tsx`:
- Dialog form (30 seconds to complete):
  - "Come e' andata?" — 4 buttons: Molto interessato / Interessato / Cosi cosi / Non interessato
  - Notes textarea (could use voice-to-text in future)
  - "Prossimo passo?" — select: Proposta / Altra visita / Follow-up tra X giorni / Nessuno
  - If "Follow-up tra X giorni" → days input
- On submit:
  - Create interaction with outcome
  - Update match status based on feedback
  - Update lead score
  - Schedule follow-up if selected

**Step 6: Wire post-visit to calendar and lead pages**

Add "Registra feedback" button on completed visit interactions.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add appointment brief generation and post-visit feedback form"
```

---

## Task Summary

| # | Task | Dependencies |
|---|------|-------------|
| 1 | Project Scaffolding | None |
| 2 | Database Schema & Types | Task 1 |
| 3 | Authentication | Task 2 |
| 4 | Dashboard Layout & Navigation | Task 3 |
| 5 | Lead CRUD | Task 4 |
| 6 | Lead Kanban Board | Task 5 |
| 7 | Property CRUD | Task 4 |
| 8 | Matching Algorithm | Task 5, 7 |
| 9 | Match Center UI | Task 8 |
| 10 | Dashboard "Oggi Devi" | Task 5, 7, 8, 12 |
| 11 | Lead Scoring | Task 5, 12 |
| 12 | Interaction Tracking & Calendar | Task 5, 7 |
| 13 | Follow-up System | Task 5, 12 |
| 14 | Appointment Brief & Post-Visit | Task 12, 8 |

**Parallel execution waves:**
- Wave 1: Task 1 → 2 → 3 → 4
- Wave 2: Task 5 + 7 (parallel)
- Wave 3: Task 6 + 8 + 12 (parallel, after wave 2)
- Wave 4: Task 9 + 11 + 13 (parallel, after wave 3)
- Wave 5: Task 10 + 14 (parallel, after wave 4)
