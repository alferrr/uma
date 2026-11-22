/**
 * Auth for Uma. Uses Supabase when `.env.local` is configured, otherwise the
 * in-memory mock from the class prototype (product.md §4).
 */
import { clearServerCopies } from './db';
import { supabase } from './supabase';

export type Role = 'owner' | 'worker';
export type User = { id?: string; name: string; contact: string; role: Role };

let current: User | null = null;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Supabase takes an email or a phone number as separate fields. */
function credentials(contact: string) {
  const v = contact.trim();
  return v.includes('@') ? { email: v } : { phone: v.replace(/[\s-]/g, '').replace(/^0/, '+63') };
}

type SupabaseUser = {
  id: string;
  email?: string;
  phone?: string;
  user_metadata?: Record<string, unknown>;
};

function toUser(u: SupabaseUser, fallbackContact: string): User {
  const meta = u.user_metadata ?? {};
  return {
    id: u.id,
    name: typeof meta.name === 'string' ? meta.name : 'Owner',
    contact: u.email || u.phone || fallbackContact,
    role: meta.role === 'worker' ? 'worker' : 'owner',
  };
}

/**
 * The profile row is the source of truth for the role; sign-up metadata is only
 * a fallback for the moment before the row exists.
 */
async function withProfile(u: SupabaseUser, fallbackContact: string): Promise<User> {
  const base = toUser(u, fallbackContact);
  if (!supabase) return base;
  const { data } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', u.id)
    .maybeSingle();
  if (!data) return base;
  return {
    ...base,
    name: data.name || base.name,
    role: data.role === 'worker' ? 'worker' : 'owner',
  };
}

/** Bring back the signed-in user after the app restarts (the session is kept on the phone). */
export async function restoreSession(): Promise<User | null> {
  if (!supabase) return current;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;
  current = await withProfile(data.session.user, '');
  return current;
}

/** Change the signed-in user's display name. */
export async function updateName(name: string) {
  const clean = name.trim();
  if (!clean || !current) return;
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const id = data.session?.user.id;
    if (!id) throw new Error('Not signed in');
    const { error } = await supabase.from('profiles').update({ name: clean }).eq('id', id);
    if (error) throw error;
  }
  current = { ...current, name: clean };
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
  current = await withProfile(data.user, contact);
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
  clearServerCopies();
  await supabase?.auth.signOut();
}

/** Accepts an email or a PH mobile number (09xx… or +639xx…). */
export function isEmailOrPhone(value: string) {
  const v = value.trim();
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const phone = /^(\+?63|0)9\d{9}$/.test(v.replace(/[\s-]/g, ''));
  return email || phone;
}
