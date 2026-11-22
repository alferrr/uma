-- Uma: soil-moisture readings per zone (product.md §5.8, §10 sensor_reading).
-- Run after 20261122180000_add_farm_members.sql.
--
-- A buried sensor will upload these later (over Bluetooth through the phone).
-- Until then, rows marked sample = true can be seeded for demos; the app labels
-- them "Sample data" everywhere they appear.

create table public.sensor_readings (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.zones (id) on delete cascade,
  percent numeric(5, 2) not null check (percent between 0 and 100),
  read_at timestamptz not null,
  sample boolean not null default false,
  created_at timestamptz not null default now()
);

create index sensor_readings_zone_read_idx on public.sensor_readings (zone_id, read_at desc);

alter table public.sensor_readings enable row level security;

grant select, insert on table public.sensor_readings to authenticated;

create policy "sensor_readings: farm owner and members can read"
  on public.sensor_readings for select
  to authenticated
  using (private.can_see_zone(zone_id));

-- Anyone on the farm can upload a reading (the phone that talked to the sensor).
create policy "sensor_readings: farm owner and members can add"
  on public.sensor_readings for insert
  to authenticated
  with check (private.can_see_zone(zone_id));
