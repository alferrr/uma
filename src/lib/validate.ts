/** Input checks with no device dependencies, so they can be unit tested. */

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** A Philippine mobile number: 09XXXXXXXXX, 639XXXXXXXXX or +639XXXXXXXXX. */
export function isPhMobile(value: string) {
  return /^(\+?63|0)9\d{9}$/.test(value.trim().replace(/[\s-]/g, ''));
}

/** Accepts an email or a PH mobile number (09xx… or +639xx…). */
export function isEmailOrPhone(value: string) {
  return isEmail(value) || isPhMobile(value);
}
