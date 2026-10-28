-- Shopping List Manager database schema
create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  quantity integer not null default 1 check (quantity between 1 and 9999),
  bought boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists shopping_items_created_at_idx
  on public.shopping_items (created_at asc);

-- This demo accesses Supabase through a trusted server-side key.
-- Do not expose that key in frontend files or commit it to version control.
