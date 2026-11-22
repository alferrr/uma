/**
 * Offline-first storage (product.md §5.7). Check-ins are written to SQLite on
 * the phone with an ID generated here, and marked synced later.
 */
import 'expo-sqlite/localStorage/install';

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

// The zone table is only a copy of the server's. An older copy without farm_id is
// dropped and downloaded again.
const zoneCols = db.getAllSync<{ name: string }>('PRAGMA table_info(zone)');
if (zoneCols.length > 0 && !zoneCols.some((c) => c.name === 'farm_id')) {
  db.execSync('DROP TABLE zone');
}

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
  -- Copies of the server's farms and zones, so the app works with no signal.
  CREATE TABLE IF NOT EXISTS farm (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    owner_id TEXT
  );
  CREATE TABLE IF NOT EXISTS zone (
    id TEXT PRIMARY KEY NOT NULL,
    farm_id TEXT,
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

export type ZoneRow = {
  id: string;
  farm_id: string | null;
  code: string;
  area: string;
  row_label: string;
};
export type FarmRow = { id: string; name: string; owner_id: string | null };

const insertZone = (r: ZoneRow) =>
  db.runSync(
    `INSERT INTO zone (id, farm_id, code, area, row_label) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET farm_id = excluded.farm_id, code = excluded.code,
       area = excluded.area, row_label = excluded.row_label`,
    r.id,
    r.farm_id,
    r.code,
    r.area,
    r.row_label,
  );

const insertFarm = (r: FarmRow) =>
  db.runSync(
    `INSERT INTO farm (id, name, owner_id) VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, owner_id = excluded.owner_id`,
    r.id,
    r.name,
    r.owner_id,
  );

/** Replace the local copy of farms and zones after a successful download. */
export function replaceFarmsAndZones(farms: FarmRow[], zones: ZoneRow[]) {
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM zone');
    db.runSync('DELETE FROM farm');
    farms.forEach(insertFarm);
    zones.forEach(insertZone);
  });
  emit();
}

export function upsertZone(r: ZoneRow) {
  insertZone(r);
  emit();
}

export function upsertFarm(r: FarmRow) {
  insertFarm(r);
  emit();
}

/** Remove a zone and its check-ins from the phone (the server cascades the same way). */
export function deleteZoneLocal(id: string) {
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM check_in WHERE zone_id = ?', id);
    db.runSync('DELETE FROM zone WHERE id = ?', id);
  });
  emit();
}

/** Remove a farm, its zones and their check-ins from the phone. */
export function deleteFarmLocal(id: string) {
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM check_in WHERE zone_id IN (SELECT id FROM zone WHERE farm_id = ?)', id);
    db.runSync('DELETE FROM zone WHERE farm_id = ?', id);
    db.runSync('DELETE FROM farm WHERE id = ?', id);
  });
  emit();
}

/** Drop one saved check-in the server can never accept, such as one for a deleted zone. */
export function discardCheckIn(id: string) {
  db.runSync('DELETE FROM check_in WHERE id = ?', id);
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

const FARM_KEY = 'uma.farm';
let chosenFarmId: string | null = localStorage.getItem(FARM_KEY);

/** Forget the farm and zone copies, for example on sign-out. Saved check-ins stay. */
export function clearFarmsAndZones() {
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM zone');
    db.runSync('DELETE FROM farm');
  });
  chosenFarmId = null;
  localStorage.removeItem(FARM_KEY);
  emit();
}

/** Pick which farm Home, Map and zone lists show. */
export function setCurrentFarm(id: string) {
  chosenFarmId = id;
  localStorage.setItem(FARM_KEY, id);
  emit();
}

function zonesOf(farmId: string): Zone[] {
  const latest = new Map(latestCheckIns().map((c) => [c.zone_id, c]));
  return db
    .getAllSync<ZoneRow>(
      'SELECT id, farm_id, code, area, row_label FROM zone WHERE farm_id = ? ORDER BY code',
      farmId,
    )
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

type Snapshot = {
  version: number;
  farms: FarmRow[];
  farm: FarmRow | null;
  zones: Zone[];
  counts: Map<string, number>;
};
let snap: Snapshot | null = null;

/** One read per change: all farms, the chosen farm (or the first), and its zones. */
function getSnapshot(): Snapshot {
  if (snap && snap.version === version) return snap;
  const farms = db.getAllSync<FarmRow>('SELECT id, name, owner_id FROM farm ORDER BY name');
  const farm = farms.find((f) => f.id === chosenFarmId) ?? farms[0] ?? null;
  const counts = new Map(
    db
      .getAllSync<{ farm_id: string; n: number }>(
        'SELECT farm_id, COUNT(*) AS n FROM zone WHERE farm_id IS NOT NULL GROUP BY farm_id',
      )
      .map((r) => [r.farm_id, r.n]),
  );
  snap = { version, farms, farm, zones: farm ? zonesOf(farm.id) : [], counts };
  return snap;
}

/** Zones of the current farm. */
export function useZones() {
  return useSyncExternalStore(subscribe, () => getSnapshot().zones);
}

export function useZone(id: string | undefined) {
  return useZones().find((z) => z.id === id);
}

export function useFarms() {
  return useSyncExternalStore(subscribe, () => getSnapshot().farms);
}

/** How many zones each farm has, by farm id. */
export function useZoneCounts() {
  return useSyncExternalStore(subscribe, () => getSnapshot().counts);
}

export function useCurrentFarm() {
  return useSyncExternalStore(subscribe, () => getSnapshot().farm);
}
