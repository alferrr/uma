/**
 * Auth for Uma. Uses Supabase when `.env.local` is configured, otherwise the
 * in-memory mock from the class prototype (product.md §4).
 */
import { supabase } from './supabase';

export type Role = 'owner' | 'worker';
export type User = { name: string; contact: string; role: Role };

let current: User | null = null;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Supabase takes an email or a phone number as separate fields. */
function credentials(contact: string) {
  const v = contact.trim();
  return v.includes('@') ? { email: v } : { phone: v.replace(/[\s-]/g, '').replace(/^0/, '+63') };
}

type SupabaseUser = { email?: string; phone?: string; user_metadata?: Record<string, unknown> };

function toUser(u: SupabaseUser, fallbackContact: string): User {
  const meta = u.user_metadata ?? {};
  return {
    name: typeof meta.name === 'string' ? meta.name : 'Owner',
    contact: u.email || u.phone || fallbackContact,
    role: meta.role === 'worker' ? 'worker' : 'owner',
  };
}

export async function signIn(contact: string, password: string): Promise<User> {
  if (!supabase) {
    await wait(600);
    current = current?.contact === contact ? current : { name: 'Owner', contact, role: 'owner' };
    return current;
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    ...credentials(contact),
    password,
  });
  if (error) throw error;
  current = toUser(data.user, contact);
  return current;
}

export async function signUp(user: User, password: string): Promise<User> {
  if (!supabase) {
    await wait(600);
    current = user;
    return current;
  }
  const { data, error } = await supabase.auth.signUp({
    ...credentials(user.contact),
    password,
    options: { data: { name: user.name, role: user.role } },
  });
  if (error) throw error;
  current = data.user ? toUser(data.user, user.contact) : user;
  return current;
}

export function getUser() {
  return current;
}

export async function signOut() {
  current = null;
  await supabase?.auth.signOut();
}

/** Accepts an email or a PH mobile number (09xx… or +639xx…). */
export function isEmailOrPhone(value: string) {
  const v = value.trim();
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const phone = /^(\+?63|0)9\d{9}$/.test(v.replace(/[\s-]/g, ''));
  return email || phone;
}
