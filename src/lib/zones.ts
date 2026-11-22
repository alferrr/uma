/**
 * Zones on the farm. Only POT-01 is real (product.md §4); everything else is
 * labeled sample data so the map and lists have something to show.
 */
export type Status = 'ok' | 'needs_water' | 'dead' | 'not_checked';
export type Moisture = 'wet' | 'ok' | 'dry';

export type Zone = {
  id: string;
  code: string;
  area: string;
  row: string;
  status: Status;
  deadCount: number;
  moisture: Moisture | null;
  /** ISO time of the last check, or null if never checked. */
  lastCheckedAt: string | null;
  sample: boolean;
};

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

export const SAMPLE_ZONES: Zone[] = [
  { id: 'pot-01', code: 'POT-01', area: 'Zone A', row: 'Row 3', status: 'ok', deadCount: 0, moisture: 'ok', lastCheckedAt: hoursAgo(2), sample: false },
  { id: 'z-02', code: 'Z-02', area: 'Zone A', row: 'Row 4', status: 'ok', deadCount: 0, moisture: 'ok', lastCheckedAt: hoursAgo(5), sample: true },
  { id: 'z-03', code: 'Z-03', area: 'Zone B', row: 'Row 1', status: 'not_checked', deadCount: 0, moisture: null, lastCheckedAt: null, sample: true },
  { id: 'z-04', code: 'Z-04', area: 'Zone B', row: 'Row 2', status: 'needs_water', deadCount: 0, moisture: 'dry', lastCheckedAt: hoursAgo(26), sample: true },
  { id: 'z-05', code: 'Z-05', area: 'Zone C', row: 'Row 1', status: 'dead', deadCount: 3, moisture: 'dry', lastCheckedAt: hoursAgo(30), sample: true },
  { id: 'z-06', code: 'Z-06', area: 'Zone C', row: 'Row 2', status: 'ok', deadCount: 0, moisture: 'wet', lastCheckedAt: hoursAgo(3), sample: true },
];

/** Sample hourly sensor readings for POT-01 (no Bluetooth yet). */
export const SAMPLE_READINGS = [
  { hour: '09', percent: 62 },
  { hour: '10', percent: 58 },
  { hour: '11', percent: 54 },
  { hour: '12', percent: 49 },
  { hour: '13', percent: 45 },
  { hour: '14', percent: 41 },
];

export function moistureFromPercent(p: number): Moisture {
  if (p >= 65) return 'wet';
  if (p >= 40) return 'ok';
  return 'dry';
}

/** Zones that need a visit: never checked, dry, dead plants, or not checked in 24 h. */
export function needsVisit(z: Zone) {
  if (z.status !== 'ok') return true;
  if (!z.lastCheckedAt) return true;
  return Date.now() - new Date(z.lastCheckedAt).getTime() > 24 * 3_600_000;
}

const PRIORITY: Record<Status, number> = { dead: 0, needs_water: 1, not_checked: 2, ok: 3 };

/** Attention list order: worst status first, then oldest check first. */
export function byAttention(a: Zone, b: Zone) {
  const p = PRIORITY[a.status] - PRIORITY[b.status];
  if (p) return p;
  const ta = a.lastCheckedAt ? new Date(a.lastCheckedAt).getTime() : 0;
  const tb = b.lastCheckedAt ? new Date(b.lastCheckedAt).getTime() : 0;
  return ta - tb;
}

export function toneFor(status: Status) {
  return ({ ok: 'green', needs_water: 'yellow', dead: 'brown', not_checked: 'grey' } as const)[status];
}

/** Whole hours since an ISO time. */
export function hoursSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
}
