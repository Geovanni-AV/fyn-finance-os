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
