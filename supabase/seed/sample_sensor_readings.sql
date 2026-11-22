-- Demo only: six hourly SAMPLE soil-moisture readings for every zone of one farm.
-- The app shows these as "Sample data". Change the farm name, then run in the SQL Editor.
-- Re-running adds another set; delete old ones with:
--   delete from public.sensor_readings where sample;

with farm as (
  select id from public.farms where name = 'Test Farm' limit 1
),
z as (
  select zones.id, row_number() over (order by zones.code) as n
  from public.zones join farm on zones.farm_id = farm.id
)
insert into public.sensor_readings (zone_id, percent, read_at, sample)
select
  z.id,
  -- Each zone starts at a different level and dries a little each hour.
  greatest(5, least(95, 70 - (z.n * 9) % 45 - h * 3)),
  date_trunc('hour', now()) - make_interval(hours => 5 - h),
  true
from z cross join generate_series(0, 5) as h;
