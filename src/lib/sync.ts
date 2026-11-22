/**
 * Sync with Supabase (product.md §11). The phone writes locally first; this
 * downloads farms and zones and uploads saved check-ins whenever there is a session and
 * a connection. Failures are silent: the data stays on the phone and the next
 * attempt retries.
 */
import {
  discardCheckIn,
  markSynced,
  pendingCheckIns,
  replaceFarmsAndZones,
  type CheckIn,
  type FarmRow,
  type ZoneRow,
} from './db';
import { supabase } from './supabase';

let running: Promise<void> | null = null;

async function run() {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;

  // Upload first so a slow download never holds back a check-in.
  const pending = pendingCheckIns();
  if (pending.length > 0) {
    const { error } = await upload(pending);
    if (!error) markSynced(pending.map((c) => c.id));
    else await uploadOneByOne(pending);
  }

  const [farms, zones] = await Promise.all([
    supabase.from('farms').select('id, name, owner_id').order('name'),
    supabase.from('zones').select('id, farm_id, code, area, row_label').order('code'),
  ]);
  if (!farms.error && !zones.error && farms.data && zones.data) {
    replaceFarmsAndZones(farms.data as FarmRow[], zones.data as ZoneRow[]);
  }
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
  for (const c of rows) {
    const { error } = await upload([c]);
    if (!error) markSynced([c.id]);
    else if (error.code === '23503') discardCheckIn(c.id); // zone no longer exists
  }
}

/** Run one sync at a time; callers during a run share it. */
export function syncNow() {
  running ??= run()
    .catch(() => {})
    .finally(() => {
      running = null;
    });
  return running;
}
