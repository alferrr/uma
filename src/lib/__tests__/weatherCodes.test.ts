import { describe, expect, it } from '@jest/globals';

import { conditionFromCode } from '../weatherCodes';

describe('conditionFromCode', () => {
  it.each([
    [0, 'clear'],
    [1, 'partly'],
    [2, 'partly'],
    [3, 'cloudy'],
    [45, 'fog'],
    [48, 'fog'],
    [51, 'drizzle'],
    [57, 'drizzle'],
    [61, 'rain'],
    [67, 'rain'],
    [80, 'rain'],
    [82, 'rain'],
    [95, 'storm'],
    [99, 'storm'],
    [71, 'cloudy'],
  ])('maps WMO code %i to %s', (code, condition) => {
    expect(conditionFromCode(code)).toBe(condition);
  });
});
