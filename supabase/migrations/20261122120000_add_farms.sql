-- Uma: farms own zones.
-- Run after 20261122082609_create_profiles_zones_check_ins.sql.
--
-- Existing zones (if you added any) have no farm yet. Delete them in the Table
-- Editor, or give each a farm_id, because only a farm's owner can manage its zones.

create table public.farms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  created_at timestamptz not null default now()
);

create index farms_owner_idx on public.farms (owner_id);

alter table public.farms enable row level security;

grant select, insert, update, delete on table public.farms to authenticated;

-- Prototype: every signed-in user can see every farm. Per-farm membership for
-- workers comes later; until then do not store anything private on a farm.
create policy "farms: signed-in users can read"
  on public.farms for select
  to authenticated
  using (true);

create policy "farms: owners can add their own"
  on public.farms for insert
  to authenticated
  with check (
    (select auth.uid()) = owner_id
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'owner'
    )
  );

create policy "farms: owner can rename"
  on public.farms for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- Deleting a farm also deletes its zones and their check-ins (on delete cascade).
create policy "farms: owner can delete"
  on public.farms for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

-- ───────────────────────── zones belong to a farm ─────────────────────────
alter table public.zones
  add column farm_id uuid references public.farms (id) on delete cascade;

create index zones_farm_idx on public.zones (farm_id);

-- Codes only need to be unique inside one farm.
alter table public.zones drop constraint if exists zones_code_key;
alter table public.zones add constraint zones_farm_code_key unique (farm_id, code);

-- Only the farm's owner may add, edit or delete its zones.
drop policy if exists "zones: owners can add" on public.zones;
drop policy if exists "zones: owners can edit" on public.zones;
drop policy if exists "zones: owners can delete" on public.zones;

create policy "zones: farm owner can add"
  on public.zones for insert
  to authenticated
  with check (
    exists (
      select 1 from public.farms f
      where f.id = zones.farm_id and f.owner_id = (select auth.uid())
    )
  );

create policy "zones: farm owner can edit"
  on public.zones for update
  to authenticated
  using (
    exists (
      select 1 from public.farms f
      where f.id = zones.farm_id and f.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.farms f
      where f.id = zones.farm_id and f.owner_id = (select auth.uid())
    )
  );

create policy "zones: farm owner can delete"
  on public.zones for delete
  to authenticated
  using (
    exists (
      select 1 from public.farms f
      where f.id = zones.farm_id and f.owner_id = (select auth.uid())
    )
  );
