/**
 * Farm and zone changes that go through the server. Adding and deleting need a
 * connection; the phone's copy is updated only after the server agrees.
 */
import { getUser } from './auth';
import {
  deleteFarmLocal,
  deleteZoneLocal,
  newId,
  setCurrentFarm,
  upsertFarm,
  type FarmRow,
} from './db';
import { supabase } from './supabase';

export type ActionError = 'forbidden' | 'failed';

/** Only a farm's owner can change it. With no backend (prototype mock) everything is allowed. */
export function canManageFarm(farm: FarmRow | null) {
  if (!farm) return false;
  if (!supabase) return true;
  const id = getUser()?.id;
  return !!id && farm.owner_id === id;
}

export async function createFarm(
  name: string,
): Promise<{ farm: FarmRow; error?: undefined } | { farm?: undefined; error: ActionError }> {
  let farm: FarmRow;
  if (supabase) {
    const { data, error } = await supabase
      .from('farms')
      .insert({ name: name.trim() })
      .select('id, name, owner_id')
      .single();
    if (error) return { error: error.code === '42501' ? 'forbidden' : 'failed' };
    farm = data as FarmRow;
  } else {
    farm = { id: newId(), name: name.trim(), owner_id: null };
  }
  upsertFarm(farm);
  setCurrentFarm(farm.id);
  return { farm };
}

// Row-level security does not raise an error when it blocks a delete; it just
// deletes nothing. Asking for the deleted rows back tells the two cases apart.
async function deleteOnServer(table: 'farms' | 'zones', id: string): Promise<ActionError | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from(table).delete().eq('id', id).select('id');
  if (error) return 'failed';
  return data.length === 0 ? 'forbidden' : null;
}

export async function removeFarm(id: string): Promise<ActionError | null> {
  const error = await deleteOnServer('farms', id);
  if (!error) deleteFarmLocal(id);
  return error;
}

export async function removeZone(id: string): Promise<ActionError | null> {
  const error = await deleteOnServer('zones', id);
  if (!error) deleteZoneLocal(id);
  return error;
}
