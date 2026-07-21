create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.ipo_companies (
  id uuid primary key default gen_random_uuid(),
  company_name text not null unique,
  ticker text,
  exchange text,
  sector text,
  status text not null default 'filed',
  expected_pricing_date date,
  expected_listing_date date,
  current_price_range_low numeric,
  current_price_range_high numeric,
  estimated_deal_size numeric,
  shares_offered bigint,
  description text,
  last_source text,
  source_label text,
  trust_label text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ipo_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.ipo_companies(id) on delete cascade,
  company_name text,
  event_type text not null,
  title text not null,
  detail text,
  source text,
  source_url text,
  event_time timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.ipo_companies(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique(user_id, company_id)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists set_ipo_companies_updated_at on public.ipo_companies;
create trigger set_ipo_companies_updated_at
  before update on public.ipo_companies
  for each row execute procedure public.set_updated_at();

alter table public.ipo_companies enable row level security;
alter table public.ipo_events enable row level security;
alter table public.profiles enable row level security;
alter table public.user_watchlist_items enable row level security;

drop policy if exists "public read ipo companies" on public.ipo_companies;
create policy "public read ipo companies"
  on public.ipo_companies
  for select
  using (true);

drop policy if exists "public read ipo events" on public.ipo_events;
create policy "public read ipo events"
  on public.ipo_events
  for select
  using (true);

drop policy if exists "user read own profile" on public.profiles;
create policy "user read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "user read own watchlist" on public.user_watchlist_items;
create policy "user read own watchlist"
  on public.user_watchlist_items
  for select
  using (auth.uid() = user_id);

drop policy if exists "user insert own watchlist" on public.user_watchlist_items;
create policy "user insert own watchlist"
  on public.user_watchlist_items
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "user delete own watchlist" on public.user_watchlist_items;
create policy "user delete own watchlist"
  on public.user_watchlist_items
  for delete
  using (auth.uid() = user_id);

alter publication supabase_realtime add table public.ipo_companies;
alter publication supabase_realtime add table public.ipo_events;

insert into public.ipo_companies (
  company_name, ticker, exchange, sector, status, expected_pricing_date, expected_listing_date,
  current_price_range_low, current_price_range_high, estimated_deal_size, shares_offered,
  description, last_source, source_label, trust_label
)
select * from (
  values
    ('Northstar Compute', 'NSTC', 'NASDAQ', 'AI Infrastructure', 'pricing', date '2026-07-23', date '2026-07-24', 22, 25, 920000000, 36800000, 'GPU cloud infrastructure provider with strong enterprise demand.', 'SEC amendment', 'Official SEC + desk intelligence', 'Estimated pricing window'),
    ('Helio Robotics', 'HLRO', 'NYSE', 'Industrial Automation', 'marketing', date '2026-07-30', date '2026-07-31', 16, 19, 410000000, 22100000, 'Warehouse robotics and fulfillment software operator.', 'SEC filing', 'SEC filing data', 'Filed and marketing'),
    ('Atlas BioSystems', 'ATLB', 'NASDAQ', 'Biotech', 'filed', date '2026-08-11', date '2026-08-12', null, null, 185000000, 12300000, 'Precision oncology platform with next-generation diagnostics.', 'Initial S-1', 'Initial S-1', 'Early stage')
) as seed(company_name, ticker, exchange, sector, status, expected_pricing_date, expected_listing_date, current_price_range_low, current_price_range_high, estimated_deal_size, shares_offered, description, last_source, source_label, trust_label)
where not exists (select 1 from public.ipo_companies limit 1);

insert into public.ipo_events (company_id, company_name, event_type, title, detail, source)
select c.id, c.company_name, 'filed', c.company_name || ' added to pipeline', 'Seed data event for first-run preview.', c.last_source
from public.ipo_companies c
where not exists (select 1 from public.ipo_events limit 1);
