/**
 * Offline-first storage (product.md §5.7). Check-ins are written to SQLite on
 * the phone with an ID generated here, and marked synced later.
 */
import { openDatabaseSync } from 'expo-sqlite';
import { useSyncExternalStore } from 'react';

import { ZONES, type Moisture, type Status, type Zone } from './zones';

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
`);

/** RFC 4122 v4 ID. Hermes has no crypto.randomUUID; this is fine for record IDs. */
function uuid() {
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
    id: uuid(),
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

/** Zones with the newest local check-in applied on top. */
function readZones(): Zone[] {
  const latest = new Map(latestCheckIns().map((c) => [c.zone_id, c]));
  return ZONES.map((z) => {
    const c = latest.get(z.id);
    if (!c) return z;
    return {
      ...z,
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
