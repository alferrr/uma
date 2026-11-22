-- Uma: workers join a farm with an invite code, and see only their farms.
-- Run after 20261122120000_add_farms.sql.
--
-- Until now every signed-in user could read every farm, zone and check-in. After
-- this migration, a user sees a farm only if they own it or have joined it.

-- ───────────────────────── helper functions ─────────────────────────
-- They live in the private schema (not reachable through the Data API) and are
-- SECURITY DEFINER so policies can ask about other tables without the policies
-- calling each other forever. Each one only answers about auth.uid().
grant usage on schema private to authenticated;

-- Membership table first: the functions below read it.
create table public.farm_members (
  farm_id uuid not null references public.farms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (farm_id, user_id)
);

create index farm_members_user_idx on public.farm_members (user_id);

create function private.is_member(p_farm uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.farm_members m
    where m.farm_id = p_farm and m.user_id = (select auth.uid())
  );
$$;

create function private.owns_farm(p_farm uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.farms f
    where f.id = p_farm and f.owner_id = (select auth.uid())
  );
$$;

create function private.can_see_farm(p_farm uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.owns_farm(p_farm) or private.is_member(p_farm);
$$;

create function private.can_see_zone(p_zone uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.zones z
    where z.id = p_zone and private.can_see_farm(z.farm_id)
  );
$$;

-- You can read your own profile and the profile of anyone on a farm you can see.
create function private.shares_farm_with(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_user = (select auth.uid())
    or exists (
      select 1 from public.farms f
      where private.can_see_farm(f.id)
        and (
          f.owner_id = p_user
          or exists (
            select 1 from public.farm_members m
            where m.farm_id = f.id and m.user_id = p_user
          )
        )
    );
$$;

revoke all on function
  private.is_member(uuid), private.owns_farm(uuid), private.can_see_farm(uuid),
  private.can_see_zone(uuid), private.shares_farm_with(uuid)
  from public, anon;
grant execute on function
  private.is_member(uuid), private.owns_farm(uuid), private.can_see_farm(uuid),
  private.can_see_zone(uuid), private.shares_farm_with(uuid)
  to authenticated;

-- ───────────────────────── members ─────────────────────────
alter table public.farm_members enable row level security;

-- Joining goes through join_farm() below, so there is no insert policy.
grant select, delete on table public.farm_members to authenticated;

create policy "members: see who is on a farm you can see"
  on public.farm_members for select
  to authenticated
  using (private.can_see_farm(farm_id));

create policy "members: owner removes someone, or you leave"
  on public.farm_members for delete
  to authenticated
  using (private.owns_farm(farm_id) or user_id = (select auth.uid()));

-- ───────────────────────── invite codes ─────────────────────────
alter table public.farms
  add column invite_code text not null
  default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

create unique index farms_invite_code_key on public.farms (invite_code);

-- Callable by signed-in users only. It runs with elevated rights because a worker
-- cannot read a farm before joining it; it only ever adds the caller themselves.
create function public.join_farm(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_farm uuid;
begin
  if v_user is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  select f.id into v_farm
  from public.farms f
  where f.invite_code = upper(btrim(p_code));

  if v_farm is null then
    raise exception 'Invalid invite code' using errcode = 'P0002';
  end if;

  insert into public.farm_members (farm_id, user_id)
  values (v_farm, v_user)
  on conflict do nothing;

  return v_farm;
end;
$$;

revoke all on function public.join_farm(text) from public, anon;
grant execute on function public.join_farm(text) to authenticated;

-- ───────────────────────── who can read what ─────────────────────────
drop policy if exists "farms: signed-in users can read" on public.farms;
create policy "farms: owner and members can read"
  on public.farms for select
  to authenticated
  -- The owner check is a plain column test so INSERT ... RETURNING works.
  using ((select auth.uid()) = owner_id or private.is_member(id));

drop policy if exists "zones: signed-in users can read" on public.zones;
create policy "zones: farm owner and members can read"
  on public.zones for select
  to authenticated
  using (private.can_see_farm(farm_id));

drop policy if exists "check_ins: signed-in users can read" on public.check_ins;
create policy "check_ins: farm owner and members can read"
  on public.check_ins for select
  to authenticated
  using (private.can_see_zone(zone_id));

drop policy if exists "check_ins: add as yourself" on public.check_ins;
create policy "check_ins: add as yourself on a farm you can see"
  on public.check_ins for insert
  to authenticated
  with check (
    (select auth.uid()) = worker_id
    and private.can_see_zone(zone_id)
  );

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read people on your farms"
  on public.profiles for select
  to authenticated
  using (private.shares_farm_with(id));
