/**
 * Mock sign-in for the class prototype (product.md §4: no real backend).
 * Keeps the current user in memory only; replace with a real API later.
 */
export type Role = 'owner' | 'worker';
export type User = { name: string; contact: string; role: Role };

let current: User | null = null;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function signIn(contact: string, _password: string): Promise<User> {
  await wait(600);
  current = current?.contact === contact ? current : { name: 'Owner', contact, role: 'owner' };
  return current;
}

export async function signUp(user: User, _password: string): Promise<User> {
  await wait(600);
  current = user;
  return current;
}

export function getUser() {
  return current;
}

export function signOut() {
  current = null;
}

/** Accepts an email or a PH mobile number (09xx… or +639xx…). */
export function isEmailOrPhone(value: string) {
  const v = value.trim();
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const phone = /^(\+?63|0)9\d{9}$/.test(v.replace(/[\s-]/g, ''));
  return email || phone;
}
