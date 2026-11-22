import { describe, expect, it } from '@jest/globals';

import { byAttention, hoursSince, moistureFromPercent, needsVisit, type Zone } from '../zones';

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

const zone = (over: Partial<Zone>): Zone => ({
  id: 'z',
  code: 'Z',
  area: '',
  row: '',
  plant: null,
  status: 'ok',
  deadCount: 0,
  moisture: 'ok',
  lastCheckedAt: hoursAgo(1),
  lastCheckedBy: null,
  reading: null,
  ...over,
});

describe('moistureFromPercent', () => {
  it('splits wet, just right and dry at 65% and 40%', () => {
    expect(moistureFromPercent(80)).toBe('wet');
    expect(moistureFromPercent(65)).toBe('wet');
    expect(moistureFromPercent(64)).toBe('ok');
    expect(moistureFromPercent(40)).toBe('ok');
    expect(moistureFromPercent(39)).toBe('dry');
  });
});

describe('needsVisit', () => {
  it('is false for a zone checked okay recently', () => {
    expect(needsVisit(zone({}))).toBe(false);
  });
  it('is true for dry, dead or never-checked zones', () => {
    expect(needsVisit(zone({ status: 'needs_water' }))).toBe(true);
    expect(needsVisit(zone({ status: 'dead', deadCount: 2 }))).toBe(true);
    expect(needsVisit(zone({ status: 'not_checked', lastCheckedAt: null }))).toBe(true);
  });
  it('is true when the last check is over 24 hours old', () => {
    expect(needsVisit(zone({ lastCheckedAt: hoursAgo(25) }))).toBe(true);
  });
});

describe('byAttention', () => {
  it('puts dead first, then water, then not checked, then okay', () => {
    const sorted = [
      zone({ id: 'ok', status: 'ok' }),
      zone({ id: 'nc', status: 'not_checked', lastCheckedAt: null }),
      zone({ id: 'water', status: 'needs_water' }),
      zone({ id: 'dead', status: 'dead' }),
    ].sort(byAttention);
    expect(sorted.map((z) => z.id)).toEqual(['dead', 'water', 'nc', 'ok']);
  });
  it('puts the oldest check first within the same status', () => {
    const sorted = [
      zone({ id: 'recent', lastCheckedAt: hoursAgo(1) }),
      zone({ id: 'old', lastCheckedAt: hoursAgo(10) }),
    ].sort(byAttention);
    expect(sorted.map((z) => z.id)).toEqual(['old', 'recent']);
  });
});

describe('hoursSince', () => {
  it('counts whole hours', () => {
    expect(hoursSince(hoursAgo(3.5))).toBe(3);
  });
});
