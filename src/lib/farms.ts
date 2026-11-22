/**
 * Farm, zone and membership changes that go through the server. They need a
 * connection; the phone's copy is updated only after the server agrees.
 * With no backend configured (prototype mock) they change the phone only.
 */
import { getUser } from './auth';
import {
  deleteFarmLocal,
  deleteZoneLocal,
  newId,
  removeMemberLocal,
  setCurrentFarm,
  upsertFarm,
  upsertZone,
  type FarmRow,
  type ZoneRow,
} from './db';
import { supabase } from './supabase';
import { syncNow } from './sync';

/** forbidden: row-level security said no. taken: zone code already used on this farm. */
export type ActionError = 'forbidden' | 'failed' | 'taken' | 'invalid';

type Result<T> = { ok: T; error?: undefined } | { ok?: undefined; error: ActionError };

const classify = (code: string | undefined): ActionError =>
  code === '42501' ? 'forbidden' : code === '23505' ? 'taken' : 'failed';

/** Only a farm's owner can change it. With no backend everything is allowed. */
export function canManageFarm(farm: FarmRow | null | undefined) {
  if (!farm) return false;
  if (!supabase) return true;
  const id = getUser()?.id;
  return !!id && farm.owner_id === id;
}

// ───────────────────────── farms ─────────────────────────

export async function createFarm(name: string): Promise<Result<FarmRow>> {
  const clean = name.trim();
  let farm: FarmRow;
  if (supabase) {
    const { data, error } = await supabase
      .from('farms')
      .insert({ name: clean })
      .select('id, name, owner_id, invite_code')
      .single();
    if (error) return { error: classify(error.code) };
    farm = { ...data, owner_name: getUser()?.name ?? null };
  } else {
    farm = { id: newId(), name: clean, owner_id: null, owner_name: null, invite_code: null };
  }
  upsertFarm(farm);
  setCurrentFarm(farm.id);
  return { ok: farm };
}

export async function renameFarm(farm: FarmRow, name: string): Promise<Result<FarmRow>> {
  const next = { ...farm, name: name.trim() };
  if (supabase) {
    // Row-level security does not raise an error when it blocks a write; it just
    // changes nothing. Asking for the changed rows back tells the two apart.
    const { data, error } = await supabase
      .from('farms')
      .update({ name: next.name })
      .eq('id', farm.id)
      .select('id');
    if (error) return { error: classify(error.code) };
    if (data.length === 0) return { error: 'forbidden' };
  }
  upsertFarm(next);
  return { ok: next };
}

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

// ───────────────────────── zones ─────────────────────────

export type ZoneInput = Omit<ZoneRow, 'id'> & { id?: string };

/** Add a zone, or update it when `id` is given. */
export async function saveZone(input: ZoneInput): Promise<Result<ZoneRow>> {
  const fields = {
    farm_id: input.farm_id,
    code: input.code.trim().toUpperCase(),
    area: input.area.trim(),
    row_label: input.row_label.trim(),
    plant: input.plant?.trim() || null,
  };
  let row: ZoneRow;
  if (supabase) {
    const columns = 'id, farm_id, code, area, row_label, plant';
    const res = input.id
      ? await supabase.from('zones').update(fields).eq('id', input.id).select(columns)
      : await supabase.from('zones').insert(fields).select(columns);
    if (res.error) return { error: classify(res.error.code) };
    if (!res.data[0]) return { error: 'forbidden' };
    row = res.data[0] as ZoneRow;
  } else {
    row = { ...fields, id: input.id ?? newId() };
  }
  upsertZone(row);
  return { ok: row };
}

export async function removeZone(id: string): Promise<ActionError | null> {
  const error = await deleteOnServer('zones', id);
  if (!error) deleteZoneLocal(id);
  return error;
}

// ───────────────────────── members ─────────────────────────

/** Join a farm with the code its owner shared. */
export async function joinFarm(code: string): Promise<Result<string>> {
  if (!supabase) return { error: 'failed' };
  const { data, error } = await supabase.rpc('join_farm', { p_code: code.trim() });
  if (error) return { error: error.code === 'P0002' ? 'invalid' : 'failed' };
  const farmId = data as string;
  await syncNow();
  setCurrentFarm(farmId);
  return { ok: farmId };
}

/** Owner removes someone from their farm. */
export async function removeMember(farmId: string, userId: string): Promise<ActionError | null> {
  if (!supabase) return 'failed';
  const { data, error } = await supabase
    .from('farm_members')
    .delete()
    .eq('farm_id', farmId)
    .eq('user_id', userId)
    .select('user_id');
  if (error) return 'failed';
  if (data.length === 0) return 'forbidden';
  removeMemberLocal(farmId, userId);
  return null;
}

/** Leave a farm you joined. You lose access to it straight away. */
export async function leaveFarm(farmId: string): Promise<ActionError | null> {
  const me = getUser()?.id;
  if (!me) return 'failed';
  const error = await removeMember(farmId, me);
  if (!error) deleteFarmLocal(farmId);
  return error;
}
