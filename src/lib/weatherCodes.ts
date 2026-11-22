/** Weather condition groups, with no device dependencies, so they can be unit tested. */

export type Condition = 'clear' | 'partly' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'storm';

/** WMO weather codes, grouped. https://open-meteo.com/en/docs */
export function conditionFromCode(code: number): Condition {
  if (code === 0) return 'clear';
  if (code <= 2) return 'partly';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if (code >= 95) return 'storm';
  return 'cloudy';
}
