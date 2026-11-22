/**
 * Offline-first storage (product.md §5.7). Check-ins are written to SQLite on
 * the phone with an ID generated here, and marked synced later.
 */
import { openDatabaseSync } from 'expo-sqlite';
import { useSyncExternalStore } from 'react';

import type { Moisture, Status, Zone } from './zones';

export type CheckInStatus = Exclude<Status, 'not_checked'>;

export type CheckIn = {
  id: string;
  zone_id: string;
  worker_id: string | null;
  status: CheckInStatus;
  dead_count: number;
  moisture: Moisture;
  source: 'sensor' | 'finger';
  checked_at: string;
  synced_at: string | null;
};

const db = openDatabaseSync('uma.db');

db.execSync(`
  CREATE TABLE IF NOT EXISTS check_in (
    id TEXT PRIMARY KEY NOT NULL,
    zone_id TEXT NOT NULL,
    worker_id TEXT,
    status TEXT NOT NULL,
    dead_count INTEGER NOT NULL DEFAULT 0,
    moisture TEXT NOT NULL,
    source TEXT NOT NULL,
    checked_at TEXT NOT NULL,
    synced_at TEXT
  );
  CREATE INDEX IF NOT EXISTS check_in_zone ON check_in (zone_id, checked_at);
  -- Copy of the server's zones, so the app works with no signal.
  CREATE TABLE IF NOT EXISTS zone (
    id TEXT PRIMARY KEY NOT NULL,
    code TEXT NOT NULL,
    area TEXT NOT NULL DEFAULT '',
    row_label TEXT NOT NULL DEFAULT ''
  );
`);

/** RFC 4122 v4 ID. Hermes has no crypto.randomUUID; this is fine for record IDs. */
export function newId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// Tiny change feed so screens re-read after a save.
let version = 0;
const listeners = new Set<() => void>();
function emit() {
  version++;
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function addCheckIn(input: Omit<CheckIn, 'id' | 'checked_at' | 'synced_at'>): CheckIn {
  const row: CheckIn = {
    ...input,
    id: newId(),
    checked_at: new Date().toISOString(),
    synced_at: null,
  };
  db.runSync(
    `INSERT INTO check_in (id, zone_id, worker_id, status, dead_count, moisture, source, checked_at, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    row.id,
    row.zone_id,
    row.worker_id,
    row.status,
    row.dead_count,
    row.moisture,
    row.source,
    row.checked_at,
  );
  emit();
  return row;
}

export type ZoneRow = { id: string; code: string; area: string; row_label: string };

/** Replace the local copy of the zone list after a successful download. */
export function replaceZones(rows: ZoneRow[]) {
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM zone');
    for (const r of rows) {
      db.runSync(
        'INSERT INTO zone (id, code, area, row_label) VALUES (?, ?, ?, ?)',
        r.id,
        r.code,
        r.area,
        r.row_label,
      );
    }
  });
  emit();
}

/** Add or update one zone in the local copy. */
export function upsertZone(r: ZoneRow) {
  db.runSync(
    `INSERT INTO zone (id, code, area, row_label) VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET code = excluded.code, area = excluded.area, row_label = excluded.row_label`,
    r.id,
    r.code,
    r.area,
    r.row_label,
  );
  emit();
}

/** Check-ins saved on the phone that the server has not confirmed yet. */
export function pendingCheckIns() {
  return db.getAllSync<CheckIn>(
    'SELECT * FROM check_in WHERE synced_at IS NULL ORDER BY checked_at',
  );
}

export function markSynced(ids: string[]) {
  if (ids.length === 0) return;
  const now = new Date().toISOString();
  db.withTransactionSync(() => {
    for (const id of ids) db.runSync('UPDATE check_in SET synced_at = ? WHERE id = ?', now, id);
  });
  emit();
}

export function useUnsyncedCount() {
  return useSyncExternalStore(subscribe, () => {
    if (!countCache || countCache.version !== version) {
      countCache = { version, n: unsyncedCount() };
    }
    return countCache.n;
  });
}

let countCache: { version: number; n: number } | null = null;

export function unsyncedCount() {
  return (
    db.getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM check_in WHERE synced_at IS NULL')
      ?.n ?? 0
  );
}

function latestCheckIns() {
  return db.getAllSync<CheckIn>(
    `SELECT c.* FROM check_in c
     JOIN (SELECT zone_id, MAX(checked_at) AS t FROM check_in GROUP BY zone_id) m
       ON m.zone_id = c.zone_id AND m.t = c.checked_at`,
  );
}

/** Zones from the local copy, with the newest local check-in applied on top. */
function readZones(): Zone[] {
  const latest = new Map(latestCheckIns().map((c) => [c.zone_id, c]));
  return db
    .getAllSync<ZoneRow>('SELECT id, code, area, row_label FROM zone ORDER BY code')
    .map((r) => {
      const base: Zone = {
        id: r.id,
        code: r.code,
        area: r.area,
        row: r.row_label,
        status: 'not_checked',
        deadCount: 0,
        moisture: null,
        lastCheckedAt: null,
      };
      const c = latest.get(r.id);
      if (!c) return base;
      return {
        ...base,
        status: c.status,
        deadCount: c.dead_count,
        moisture: c.moisture,
        lastCheckedAt: c.checked_at,
      };
    });
}

let cache: { version: number; zones: Zone[] } | null = null;
function getZones() {
  if (!cache || cache.version !== version) cache = { version, zones: readZones() };
  return cache.zones;
}

export function useZones() {
  return useSyncExternalStore(subscribe, getZones);
}

export function useZone(id: string | undefined) {
  return useZones().find((z) => z.id === id);
}
