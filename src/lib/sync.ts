/**
 * Sync with Supabase (product.md §11). The phone writes locally first; this
 * downloads zones and uploads saved check-ins whenever there is a session and
 * a connection. Failures are silent: the data stays on the phone and the next
 * attempt retries.
 */
import { markSynced, pendingCheckIns, replaceZones, type ZoneRow } from './db';
import { supabase } from './supabase';

let running: Promise<void> | null = null;

async function run() {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;

  // Upload first so a slow zone download never holds back a check-in.
  const pending = pendingCheckIns();
  if (pending.length > 0) {
    // Same record ID twice never creates a duplicate; worker_id is set by the server.
    const { error } = await supabase.from('check_ins').upsert(
      pending.map((c) => ({
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
    if (!error) markSynced(pending.map((c) => c.id));
  }

  const { data: zones, error } = await supabase
    .from('zones')
    .select('id, code, area, row_label')
    .order('code');
  if (!error && zones) replaceZones(zones as ZoneRow[]);
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
