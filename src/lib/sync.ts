/**
 * Sync with Supabase (product.md §11). The phone writes locally first; this
 * uploads saved check-ins, then downloads farms, zones, members, names and
 * recent check-ins (everyone's, so the owner sees the workers' checks). Each
 * part is independent, so one failure does not stop the rest. Nothing is lost
 * on failure: unsent check-ins stay on the phone and the next attempt retries.
 */
import {
  discardCheckIn,
  markSynced,
  mergeServerCheckIns,
  pendingCheckIns,
  replaceFarmsAndZones,
  replaceMembers,
  replaceReadings,
  type CheckIn,
  type FarmRow,
  type ReadingRow,
  type ZoneRow,
} from './db';
import { supabase } from './supabase';

/** How many recent check-ins to download for history and status. */
const RECENT = 300;

let running: Promise<boolean> | null = null;

async function run(): Promise<boolean> {
  if (!supabase) return true;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return true;
  let ok = true;

  // Upload first so a slow download never holds back a check-in.
  const pending = pendingCheckIns();
  if (pending.length > 0) {
    const { error } = await upload(pending);
    if (!error) markSynced(pending.map((c) => c.id));
    else ok = (await uploadOneByOne(pending)) && ok;
  }

  // Names of everyone on your farms (row-level security limits this to them).
  const people = await supabase.from('profiles').select('id, name');
  const names = new Map<string, string>(
    (people.data ?? []).map((p: { id: string; name: string }) => [p.id, p.name]),
  );
  if (people.error) ok = false;

  const [farms, zones] = await Promise.all([fetchFarms(), fetchZones()]);
  if (farms && zones) {
    replaceFarmsAndZones(
      farms.map((f) => ({ ...f, owner_name: (f.owner_id && names.get(f.owner_id)) || null })),
      zones,
    );
  } else {
    ok = false;
  }

  const members = await supabase.from('farm_members').select('farm_id, user_id');
  if (!members.error && members.data) {
    replaceMembers(
      members.data.map((m: { farm_id: string; user_id: string }) => ({
        ...m,
        name: names.get(m.user_id) ?? '',
      })),
    );
  }

  // Readings from the last two days. A missing table (migration not run yet) is not a failure.
  const since = new Date(Date.now() - 48 * 3_600_000).toISOString();
  const readings = await supabase
    .from('sensor_readings')
    .select('id, zone_id, percent, read_at, sample')
    .gte('read_at', since)
    .order('read_at', { ascending: false })
    .limit(500);
  if (!readings.error && readings.data) {
    replaceReadings(
      readings.data.map((r: { sample: boolean } & Omit<ReadingRow, 'sample'>) => ({
        ...r,
        percent: Number(r.percent),
        sample: r.sample ? 1 : 0,
      })),
    );
  } else if (readings.error && !['42P01', 'PGRST205'].includes(readings.error.code)) {
    ok = false;
  }

  const recent = await supabase
    .from('check_ins')
    .select('id, zone_id, worker_id, status, dead_count, moisture, source, checked_at, synced_at')
    .order('checked_at', { ascending: false })
    .limit(RECENT);
  if (!recent.error && recent.data) {
    mergeServerCheckIns(
      (recent.data as Omit<CheckIn, 'worker_name'>[]).map((c) => ({
        ...c,
        worker_name: (c.worker_id && names.get(c.worker_id)) || null,
      })),
    );
  } else {
    ok = false;
  }

  return ok;
}

/** Farms with invite codes; falls back to the older shape until the members migration runs. */
async function fetchFarms(): Promise<Omit<FarmRow, 'owner_name'>[] | null> {
  const full = await supabase!
    .from('farms')
    .select('id, name, owner_id, invite_code')
    .order('name');
  if (!full.error) return full.data;
  const basic = await supabase!.from('farms').select('id, name, owner_id').order('name');
  return basic.error ? null : basic.data.map((f) => ({ ...f, invite_code: null }));
}

async function fetchZones(): Promise<ZoneRow[] | null> {
  const { data, error } = await supabase!
    .from('zones')
    .select('id, farm_id, code, area, row_label, plant')
    .order('code');
  return error ? null : (data as ZoneRow[]);
}

// Same record ID twice never creates a duplicate; worker_id is set by the server.
function upload(rows: CheckIn[]) {
  return supabase!.from('check_ins').upsert(
    rows.map((c) => ({
      id: c.id,
      zone_id: c.zone_id,
      status: c.status,
      dead_count: c.dead_count,
      moisture: c.moisture,
      source: c.source,
      checked_at: c.checked_at,
    })),
    { onConflict: 'id', ignoreDuplicates: true },
  );
}

/** One bad record must not block the rest. A check-in for a zone that was deleted is dropped. */
async function uploadOneByOne(rows: CheckIn[]) {
  let ok = true;
  for (const c of rows) {
    const { error } = await upload([c]);
    if (!error) markSynced([c.id]);
    else if (error.code === '23503')
      discardCheckIn(c.id); // zone no longer exists
    else ok = false;
  }
  return ok;
}

/** Run one sync at a time; callers during a run share it. Resolves true if everything worked. */
export function syncNow() {
  running ??= run()
    .catch(() => false)
    .finally(() => {
      running = null;
    });
  return running;
}
