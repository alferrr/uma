-- Uma: profiles, zones and check-ins.
-- No seed data. Zones are added by an owner (or in the Table Editor).

-- ───────────────────────── profiles ─────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  role text not null default 'worker' check (role in ('owner', 'worker')),
  language text check (language in ('ceb', 'en', 'tl')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users may only change their own name and language, never their role.
grant select on table public.profiles to authenticated;
grant update (name, language) on table public.profiles to authenticated;

create policy "profiles: read own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Create the profile when someone signs up. Lives in a private schema so it is
-- not callable through the Data API. The role is chosen at sign-up (self-declared
-- in this prototype); anything other than 'owner' becomes 'worker'.
create schema if not exists private;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    case when new.raw_user_meta_data ->> 'role' = 'owner' then 'owner' else 'worker' end
  );
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Profiles for anyone who signed up before this migration.
insert into public.profiles (id, name, role)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'name', ''),
  case when u.raw_user_meta_data ->> 'role' = 'owner' then 'owner' else 'worker' end
from auth.users u
on conflict (id) do nothing;

-- ───────────────────────── zones ─────────────────────────
create table public.zones (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  area text not null default '',
  row_label text not null default '',
  plant text,
  -- Polygon as percentages of the map image: [[x, y], ...]
  map_points jsonb,
  created_at timestamptz not null default now()
);

alter table public.zones enable row level security;

grant select, insert, update, delete on table public.zones to authenticated;

create policy "zones: signed-in users can read"
  on public.zones for select
  to authenticated
  using (true);

create policy "zones: owners can add"
  on public.zones for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'owner'
    )
  );

create policy "zones: owners can edit"
  on public.zones for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'owner'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'owner'
    )
  );

create policy "zones: owners can delete"
  on public.zones for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'owner'
    )
  );

-- ───────────────────────── check_ins ─────────────────────────
-- The id is generated on the phone, so uploading the same record twice never
-- creates a duplicate (product.md §11).
create table public.check_ins (
  id uuid primary key,
  zone_id uuid not null references public.zones (id) on delete cascade,
  worker_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  status text not null check (status in ('ok', 'needs_water', 'dead')),
  dead_count integer not null default 0 check (dead_count >= 0),
  moisture text not null check (moisture in ('wet', 'ok', 'dry')),
  source text not null check (source in ('sensor', 'finger')),
  checked_at timestamptz not null,
  synced_at timestamptz not null default now(),
  check (status = 'dead' or dead_count = 0)
);

create index check_ins_zone_checked_idx on public.check_ins (zone_id, checked_at desc);
create index check_ins_worker_idx on public.check_ins (worker_id);

alter table public.check_ins enable row level security;

-- Check-ins are a log: users can add and read them, never edit or delete.
grant select, insert on table public.check_ins to authenticated;

create policy "check_ins: signed-in users can read"
  on public.check_ins for select
  to authenticated
  using (true);

create policy "check_ins: add as yourself"
  on public.check_ins for insert
  to authenticated
  with check ((select auth.uid()) = worker_id);
