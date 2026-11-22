/** Zone and status types, plus helpers for ranking zones that need a visit. */
export type Status = 'ok' | 'needs_water' | 'dead' | 'not_checked';
export type Moisture = 'wet' | 'ok' | 'dry';

export type Zone = {
  id: string;
  code: string;
  area: string;
  row: string;
  plant: string | null;
  status: Status;
  deadCount: number;
  moisture: Moisture | null;
  /** ISO time of the last check, or null if never checked. */
  lastCheckedAt: string | null;
  /** Name of whoever checked last, when known. */
  lastCheckedBy: string | null;
  /** Newest sensor reading, when the zone has one. */
  reading: SensorReading | null;
};

/** One soil-moisture reading from a zone's sensor. `sample` marks seeded demo data. */
export type SensorReading = { percent: number; readAt: string; sample: boolean };

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
  return ({ ok: 'green', needs_water: 'yellow', dead: 'brown', not_checked: 'grey' } as const)[
    status
  ];
}

/** Whole hours since an ISO time. */
export function hoursSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
}
