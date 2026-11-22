/**
 * Offline-first storage (product.md §5.7). Check-ins are written to SQLite on
 * the phone with an ID generated here, and marked synced later. Farms, zones,
 * members and other people's check-ins are copies of the server's, so the app
 * still shows them with no signal.
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
  /** Name of whoever checked, kept so it shows offline. */
  worker_name: string | null;
  status: CheckInStatus;
  dead_count: number;
  moisture: Moisture;
  source: 'sensor' | 'finger';
  checked_at: string;
  synced_at: string | null;
};

export type ZoneRow = {
  id: string;
  farm_id: string | null;
  code: string;
  area: string;
  row_label: string;
  plant: string | null;
};

export type FarmRow = {
  id: string;
  name: string;
  owner_id: string | null;
  owner_name: string | null;
  /** Only meaningful to the owner, who shares it with workers. */
  invite_code: string | null;
};

export type MemberRow = { farm_id: string; user_id: string; name: string };

const db = openDatabaseSync('uma.db');

const columns = (table: string) =>
  db.getAllSync<{ name: string }>(`PRAGMA table_info(${table})`).map((c) => c.name);

// Cache tables are copies of the server's, so an older shape is simply dropped
// and downloaded again. check_in holds the user's own unsent work, so it is
// only ever extended, never dropped.
for (const [table, newest] of [
  ['zone', 'plant'],
  ['farm', 'invite_code'],
] as const) {
  const cols = columns(table);
  if (cols.length > 0 && !cols.includes(newest)) db.execSync(`DROP TABLE ${table}`);
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
  CREATE TABLE IF NOT EXISTS farm (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    owner_id TEXT,
    owner_name TEXT,
    invite_code TEXT
  );
  CREATE TABLE IF NOT EXISTS zone (
    id TEXT PRIMARY KEY NOT NULL,
    farm_id TEXT,
    code TEXT NOT NULL,
    area TEXT NOT NULL DEFAULT '',
    row_label TEXT NOT NULL DEFAULT '',
    plant TEXT
  );
  CREATE TABLE IF NOT EXISTS member (
    farm_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (farm_id, user_id)
  );
`);

if (!columns('check_in').includes('worker_name')) {
  db.execSync('ALTER TABLE check_in ADD COLUMN worker_name TEXT');
}

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

/** Re-read a value only when something changed since the last read. */
function memo<T>(read: () => T) {
  let cached: { version: number; value: T } | null = null;
  return () => {
    if (!cached || cached.version !== version) cached = { version, value: read() };
    return cached.value;
  };
}

// ───────────────────────── check-ins ─────────────────────────

const insertCheckIn = (c: CheckIn) =>
  db.runSync(
    `INSERT INTO check_in
       (id, zone_id, worker_id, worker_name, status, dead_count, moisture, source, checked_at, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       worker_id = excluded.worker_id, worker_name = excluded.worker_name,
       status = excluded.status, dead_count = excluded.dead_count, moisture = excluded.moisture,
       source = excluded.source, checked_at = excluded.checked_at, synced_at = excluded.synced_at`,
    c.id,
    c.zone_id,
    c.worker_id,
    c.worker_name,
    c.status,
    c.dead_count,
    c.moisture,
    c.source,
    c.checked_at,
    c.synced_at,
  );

export function addCheckIn(input: Omit<CheckIn, 'id' | 'checked_at' | 'synced_at'>): CheckIn {
  const row: CheckIn = {
    ...input,
    id: newId(),
    checked_at: new Date().toISOString(),
    synced_at: null,
  };
  insertCheckIn(row);
  emit();
  return row;
}

/** Check-ins downloaded from the server, including other people's. */
export function mergeServerCheckIns(rows: CheckIn[]) {
  if (rows.length === 0) return;
  db.withTransactionSync(() => rows.forEach(insertCheckIn));
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

/** Drop one saved check-in the server can never accept, such as one for a deleted zone. */
export function discardCheckIn(id: string) {
  db.runSync('DELETE FROM check_in WHERE id = ?', id);
  emit();
}

export function unsyncedCount() {
  return (
    db.getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM check_in WHERE synced_at IS NULL')
      ?.n ?? 0
  );
}

const getUnsynced = memo(unsyncedCount);
export function useUnsyncedCount() {
  return useSyncExternalStore(subscribe, getUnsynced);
}

const historyReaders = new Map<string, () => CheckIn[]>();
/** Every check-in for one zone, newest first. */
export function useHistory(zoneId: string | undefined) {
  const key = zoneId ?? '';
  let read = historyReaders.get(key);
  if (!read) {
    read = memo(() =>
      db.getAllSync<CheckIn>(
        'SELECT * FROM check_in WHERE zone_id = ? ORDER BY checked_at DESC LIMIT 100',
        key,
      ),
    );
    historyReaders.set(key, read);
  }
  return useSyncExternalStore(subscribe, read);
}

function latestCheckIns() {
  return db.getAllSync<CheckIn>(
    `SELECT c.* FROM check_in c
     JOIN (SELECT zone_id, MAX(checked_at) AS t FROM check_in GROUP BY zone_id) m
       ON m.zone_id = c.zone_id AND m.t = c.checked_at`,
  );
}

// ───────────────────────── farms, zones, members ─────────────────────────

const insertZone = (r: ZoneRow) =>
  db.runSync(
    `INSERT INTO zone (id, farm_id, code, area, row_label, plant) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET farm_id = excluded.farm_id, code = excluded.code,
       area = excluded.area, row_label = excluded.row_label, plant = excluded.plant`,
    r.id,
    r.farm_id,
    r.code,
    r.area,
    r.row_label,
    r.plant,
  );

const insertFarm = (r: FarmRow) =>
  db.runSync(
    `INSERT INTO farm (id, name, owner_id, owner_name, invite_code) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, owner_id = excluded.owner_id,
       owner_name = excluded.owner_name, invite_code = excluded.invite_code`,
    r.id,
    r.name,
    r.owner_id,
    r.owner_name,
    r.invite_code,
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

export function replaceMembers(rows: MemberRow[]) {
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM member');
    for (const m of rows) {
      db.runSync(
        'INSERT OR REPLACE INTO member (farm_id, user_id, name) VALUES (?, ?, ?)',
        m.farm_id,
        m.user_id,
        m.name,
      );
    }
  });
  emit();
}

export function removeMemberLocal(farmId: string, userId: string) {
  db.runSync('DELETE FROM member WHERE farm_id = ? AND user_id = ?', farmId, userId);
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

/** Remove a farm, its zones, members and check-ins from the phone. */
export function deleteFarmLocal(id: string) {
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM check_in WHERE zone_id IN (SELECT id FROM zone WHERE farm_id = ?)', id);
    db.runSync('DELETE FROM zone WHERE farm_id = ?', id);
    db.runSync('DELETE FROM member WHERE farm_id = ?', id);
    db.runSync('DELETE FROM farm WHERE id = ?', id);
  });
  emit();
}

const FARM_KEY = 'uma.farm';
let chosenFarmId: string | null = localStorage.getItem(FARM_KEY);

/**
 * Forget everything that came from the server, for example on sign-out, so the
 * next person on this phone does not see it. Unsent check-ins stay.
 */
export function clearServerCopies() {
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM zone');
    db.runSync('DELETE FROM farm');
    db.runSync('DELETE FROM member');
    db.runSync('DELETE FROM check_in WHERE synced_at IS NOT NULL');
  });
  chosenFarmId = null;
  localStorage.removeItem(FARM_KEY);
  emit();
}

/** A zone by id in any farm on this phone (scanning can land on another farm's zone). */
export function findZone(id: string): ZoneRow | null {
  return db.getFirstSync<ZoneRow>('SELECT * FROM zone WHERE id = ?', id);
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
    .getAllSync<ZoneRow>('SELECT * FROM zone WHERE farm_id = ? ORDER BY code', farmId)
    .map((r) => {
      const base: Zone = {
        id: r.id,
        code: r.code,
        area: r.area,
        row: r.row_label,
        plant: r.plant,
        status: 'not_checked',
        deadCount: 0,
        moisture: null,
        lastCheckedAt: null,
        lastCheckedBy: null,
      };
      const c = latest.get(r.id);
      if (!c) return base;
      return {
        ...base,
        status: c.status,
        deadCount: c.dead_count,
        moisture: c.moisture,
        lastCheckedAt: c.checked_at,
        lastCheckedBy: c.worker_name,
      };
    });
}

type Snapshot = {
  farms: FarmRow[];
  farm: FarmRow | null;
  zones: Zone[];
  counts: Map<string, number>;
};

/** One read per change: all farms, the chosen farm (or the first), its zones, and zone counts. */
const getSnapshot = memo<Snapshot>(() => {
  const farms = db.getAllSync<FarmRow>('SELECT * FROM farm ORDER BY name');
  const farm = farms.find((f) => f.id === chosenFarmId) ?? farms[0] ?? null;
  const counts = new Map(
    db
      .getAllSync<{ farm_id: string; n: number }>(
        'SELECT farm_id, COUNT(*) AS n FROM zone WHERE farm_id IS NOT NULL GROUP BY farm_id',
      )
      .map((r) => [r.farm_id, r.n]),
  );
  return { farms, farm, zones: farm ? zonesOf(farm.id) : [], counts };
});

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

export function useFarm(id: string | undefined) {
  return useFarms().find((f) => f.id === id);
}

/** How many zones each farm has, by farm id. */
export function useZoneCounts() {
  return useSyncExternalStore(subscribe, () => getSnapshot().counts);
}

export function useCurrentFarm() {
  return useSyncExternalStore(subscribe, () => getSnapshot().farm);
}

const memberReaders = new Map<string, () => MemberRow[]>();
/** People who joined a farm (the owner is not in this list). */
export function useMembers(farmId: string | undefined) {
  const key = farmId ?? '';
  let read = memberReaders.get(key);
  if (!read) {
    read = memo(() =>
      db.getAllSync<MemberRow>('SELECT * FROM member WHERE farm_id = ? ORDER BY name', key),
    );
    memberReaders.set(key, read);
  }
  return useSyncExternalStore(subscribe, read);
}
