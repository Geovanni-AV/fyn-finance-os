---
name: fyn-finance-backend
description: >
  Use this skill for ALL development tasks on the Fyn Finance OS project.
  Activated when working on: Supabase schema, authentication, PDF parsing,
  Express server, AppContext migration from mock data, TypeScript fixes,
  or any backend integration with the existing React 18 frontend.
  Do not use for unrelated projects.
---

# Fyn Finance OS — Backend Development Skill

## Project Identity

**Fyn Finance OS v2.0** — Fintech personal app, 100% Spanish (Mexico).
**Stack:** React 18 + TypeScript strict + Vite + Tailwind CSS v3 + Recharts + React Router v6.
**Backend target:** Supabase local (dev) → Supabase Cloud (prod).
**PDF parsing:** pdf-parse primary + Claude API fallback.
**Deploy dev:** fully local (localhost:5173 frontend, localhost:3001 Express server, localhost:54321 Supabase).

---

## CRITICAL: Fix These TypeScript Errors First

Before any backend work, fix these two existing TS errors:

### Fix 1 — `src/mockData/index.ts`
Lines with `type: 'freelance'` and `type: 'inversiones'` must be `type: 'ingreso'`.
The `category` field stays as `'freelance'` or `'inversiones'`. Only `type` is wrong.
Affected tx IDs: tx-012, tx-027, tx-028 (freelance), tx-030 (inversiones).

### Fix 2 — `src/components/ui/index.tsx` — Card component
Add `style?: React.CSSProperties` to the Card props interface.

---

## Project File Map (do not restructure)

```
fyn-finance-os/              ← project root
├── src/
│   ├── context/
│   │   ├── AppContext.tsx   ← PRIMARY: replace mockData with Supabase here
│   │   ├── ToastContext.tsx ← do not modify
│   │   └── ThemeContext.tsx ← do not modify
│   ├── lib/                 ← CREATE THIS: Supabase client + API modules
│   │   ├── supabase.ts
│   │   └── api/
│   │       ├── accounts.ts
│   │       ├── transactions.ts
│   │       ├── budgets.ts
│   │       ├── goals.ts
│   │       └── debts.ts
│   ├── mockData/index.ts   ← keep for offline fallback, fix TS errors
│   ├── hooks/useFinance.ts ← pure calculations, do not modify
│   ├── types/index.ts      ← source of truth for all types, do not modify
│   └── screens/            ← 13 modules, UI complete, only connect data
├── server/                  ← CREATE THIS: Express server
│   ├── index.ts
│   ├── routes/pdf.ts
│   ├── parsers/
│   │   ├── index.ts        ← bank router
│   │   ├── bbva.ts
│   │   ├── nu.ts
│   │   ├── santander.ts
│   │   ├── hsbc.ts
│   │   ├── klar.ts
│   │   └── ai-fallback.ts  ← Claude API
│   └── lib/
│       ├── supabase-admin.ts
│       └── deduplicator.ts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .env.local               ← frontend env vars
├── server/.env              ← server env vars
└── .agents/
    └── skills/
        └── fyn-finance-backend/  ← THIS SKILL lives here
```

---

## Environment Variables

### `.env.local` (frontend root)
```
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<from: supabase start output>
VITE_API_URL=http://localhost:3001
```

### `server/.env`
```
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=<from: supabase start output>
ANTHROPIC_API_KEY=<sk-ant-... only needed for PDF AI fallback>
PORT=3001
```

---

## Execution Plan — 4 Stages

### STAGE 1: Foundation (Start Here)

**Goal:** Supabase running locally, auth working, schema applied.

```
Step 1.1 — Fix TypeScript errors (see above)
Step 1.2 — Install Supabase CLI: npm install -g supabase
Step 1.3 — supabase init (in project root)
Step 1.4 — supabase start (requires Docker Desktop running)
Step 1.5 — Apply migration: create supabase/migrations/001_initial_schema.sql
Step 1.6 — supabase db reset (applies migration)
Step 1.7 — npm install @supabase/supabase-js (frontend)
Step 1.8 — Create src/lib/supabase.ts
Step 1.9 — Create AuthContext.tsx (wrap App.tsx)
Step 1.10 — Replace localStorage 'fyn-onboarding-done' with real session
Step 1.11 — Protect routes with real auth (RequireOnboarding → RequireAuth)
```

### STAGE 2: PDF Pipeline

**Goal:** User uploads bank PDF → transactions parsed → inserted in Supabase.

```
Step 2.1 — mkdir server && cd server && npm init -y
Step 2.2 — Install: express multer pdf-parse cors dotenv @supabase/supabase-js
Step 2.3 — Install dev: typescript ts-node nodemon @types/express @types/multer @types/cors
Step 2.4 — Create server/index.ts (Express, port 3001)
Step 2.5 — Create server/lib/supabase-admin.ts (service role)
Step 2.6 — Create server/lib/pdf-extractor.ts (pdf-parse wrapper)
Step 2.7 — Create server/parsers/ (one file per bank, see references/parsers.md)
Step 2.8 — Create server/lib/deduplicator.ts
Step 2.9 — Create server/routes/pdf.ts (upload → parse → review → confirm)
Step 2.10 — Connect src/screens/Registro/index.tsx tab PDF to server endpoints
```

### STAGE 3: CRUD Real Data

**Goal:** Replace all mockData with live Supabase queries in AppContext.

```
Step 3.1 — Create src/lib/api/ modules (one per entity)
Step 3.2 — Modify AppContext.tsx: useState(mock) → useEffect + supabase query
Step 3.3 — Implement mappers: snake_case DB → camelCase TypeScript
Step 3.4 — Add loading states (Skeleton component already exists)
Step 3.5 — Implement optimistic updates for addTransaction, deleteTransaction
Step 3.6 — Add real-time sync: supabase.channel() for transactions table
```

### STAGE 4: Budgets + Alerts Automation

**Goal:** spent calculated from real transactions, alerts auto-generated.

```
Step 4.1 — Remove hardcoded 'spent' from budgets table
Step 4.2 — Use SQL function get_budget_spent() in budget queries
Step 4.3 — PostgreSQL trigger: auto-create alert when budget > 80%
Step 4.4 — Connect alerts screen to real data
Step 4.5 — Implement monthly net_worth_history snapshot (cron or on-login)
```

---

## Database Schema (apply in migration 001)

```sql
create extension if not exists "uuid-ossp";

-- PROFILES
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  currency text default 'MXN',
  theme text default 'dark',
  onboarding_done boolean default false,
  created_at timestamptz default now()
);

-- ACCOUNTS
create table accounts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  bank text not null,
  type text not null check (type in ('debito','credito','efectivo','inversion')),
  balance numeric(12,2) default 0,
  credit_limit numeric(12,2),
  currency text default 'MXN',
  color text default '#2563EB',
  last_four text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- TRANSACTIONS
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  account_id uuid references accounts(id) on delete set null,
  date date not null,
  amount numeric(12,2) not null,
  type text not null check (type in ('gasto','ingreso','transferencia')),
  category text not null,
  description text,
  source text default 'manual' check (source in ('manual','ocr','pdf','sync')),
  is_recurring boolean default false,
  recurrence_period text,
  tags text[],
  notes text,
  pdf_upload_id uuid,
  created_at timestamptz default now()
);

-- BUDGETS (no 'spent' column — calculated dynamically)
create table budgets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  category text not null,
  monthly_limit numeric(12,2) not null,
  period text not null,
  created_at timestamptz default now(),
  unique(user_id, category, period)
);

-- SAVING GOALS
create table saving_goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  type text not null,
  target_amount numeric(12,2) not null,
  current_amount numeric(12,2) default 0,
  target_date date,
  monthly_contribution numeric(12,2) default 0,
  expected_return numeric(5,4) default 0.07,
  color text default '#2563EB',
  icon text default 'savings',
  created_at timestamptz default now()
);

-- DEBTS
create table debts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  type text not null,
  balance numeric(12,2) not null,
  original_balance numeric(12,2) not null,
  interest_rate numeric(6,4) not null,
  minimum_payment numeric(12,2) not null,
  due_day smallint not null check (due_day between 1 and 31),
  account_id uuid references accounts(id) on delete set null,
  created_at timestamptz default now()
);

-- ALERTS
create table alerts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  type text not null,
  severity text not null check (severity in ('info','warning','danger','success')),
  title text not null,
  message text not null,
  is_read boolean default false,
  related_entity_id uuid,
  created_at timestamptz default now()
);

-- ALERT SETTINGS
create table alert_settings (
  user_id uuid references profiles(id) on delete cascade primary key,
  presupuesto_alerta boolean default true,
  presupuesto_excedido boolean default true,
  pago_proximo boolean default true,
  pago_vencido boolean default true,
  meta_lograda boolean default true,
  saldo_bajo boolean default true,
  gasto_inusual boolean default false,
  racha_ahorro boolean default true,
  resumen_semanal boolean default false
);

-- NET WORTH HISTORY
create table net_worth_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  month text not null,
  assets numeric(14,2) not null,
  liabilities numeric(14,2) not null,
  net_worth numeric(14,2) not null,
  created_at timestamptz default now(),
  unique(user_id, month)
);

-- PDF UPLOADS
create table pdf_uploads (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  storage_path text not null,
  bank text not null,
  status text default 'pending' check (status in ('pending','processing','done','error')),
  transactions_imported integer default 0,
  error_message text,
  created_at timestamptz default now()
);

-- RLS: enable on all tables
alter table profiles enable row level security;
alter table accounts enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table saving_goals enable row level security;
alter table debts enable row level security;
alter table alerts enable row level security;
alter table alert_settings enable row level security;
alter table net_worth_history enable row level security;
alter table pdf_uploads enable row level security;

-- RLS POLICIES
create policy "own" on profiles for all using (auth.uid() = id);
create policy "own" on accounts for all using (auth.uid() = user_id);
create policy "own" on transactions for all using (auth.uid() = user_id);
create policy "own" on budgets for all using (auth.uid() = user_id);
create policy "own" on saving_goals for all using (auth.uid() = user_id);
create policy "own" on debts for all using (auth.uid() = user_id);
create policy "own" on alerts for all using (auth.uid() = user_id);
create policy "own" on alert_settings for all using (auth.uid() = user_id);
create policy "own" on net_worth_history for all using (auth.uid() = user_id);
create policy "own" on pdf_uploads for all using (auth.uid() = user_id);

-- FUNCTION: calculate budget spent from transactions
create or replace function get_budget_spent(p_user_id uuid, p_category text, p_period text)
returns numeric as $$
  select coalesce(sum(amount), 0)
  from transactions
  where user_id = p_user_id
    and category = p_category
    and to_char(date, 'YYYY-MM') = p_period
    and type = 'gasto';
$$ language sql stable security definer;

-- TRIGGER: auto-create profile on signup
create or replace function handle_new_user() returns trigger as $$
begin
  insert into profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name','Usuario'), new.email);
  insert into alert_settings (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

---

## Key Code Patterns

### `src/lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### DB → TypeScript mapper pattern
```typescript
// Always use explicit mappers, never spread DB rows directly
function mapAccountFromDB(row: any): Account {
  return {
    id: row.id,
    name: row.name,
    bank: row.bank as BankName,
    type: row.type as AccountType,
    balance: Number(row.balance),
    creditLimit: row.credit_limit ? Number(row.credit_limit) : undefined,
    currency: 'MXN',
    color: row.color,
    lastFour: row.last_four ?? undefined,
    isActive: row.is_active,
  }
}
```

### AppContext migration pattern
```typescript
// BEFORE
const [accounts, setAccounts] = useState(mockAccounts)

// AFTER
const [accounts, setAccounts] = useState<Account[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  if (!session?.user) return
  supabase.from('accounts')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at')
    .then(({ data, error }) => {
      if (data) setAccounts(data.map(mapAccountFromDB))
      setLoading(false)
    })
}, [session])
```

### Deduplication hash (server)
```typescript
// server/lib/deduplicator.ts
export function txHash(date: string, amount: number, description: string): string {
  return `${date}|${amount}|${description.toLowerCase().trim()}`
}
```

### Bank detection (server)
```typescript
export function detectBank(text: string): BankName {
  if (/BBVA|Bancomer/i.test(text)) return 'BBVA'
  if (/Nu\s|Nubank/i.test(text)) return 'Nu'
  if (/Santander/i.test(text)) return 'Santander'
  if (/HSBC/i.test(text)) return 'HSBC'
  if (/Klar/i.test(text)) return 'Klar'
  if (/Openbank/i.test(text)) return 'Openbank'
  return 'Otra'
}
```

---

## Coding Rules (always follow)

1. **Never break existing UI** — frontend has 13 working screens, only connect data.
2. **snake_case in DB**, **camelCase in TypeScript** — always use explicit mappers.
3. **Always add RLS** to any new table created.
4. **`src/types/index.ts` is immutable** — never change types, only extend if needed.
5. **Loading states** — use `<Skeleton>` component (already exists in `src/components/ui/`).
6. **Errors** — use `useToast()` hook from `src/context/ToastContext.tsx`.
7. **Naming convention for files**: kebab-case for server, PascalCase for React components.
8. **`spent` is never stored** — always computed via `get_budget_spent()` SQL function.
9. **PDF confidence threshold**: if parser extracts < 80% of expected fields → call AI fallback.
10. **Optimistic updates**: UI updates immediately, rollback on error with toast notification.

---

## Do Not Use This Skill When
- Working on an unrelated project.
- Making pure UI/design changes with no data layer involvement.
- The task is a simple one-line fix unrelated to backend or Supabase.
