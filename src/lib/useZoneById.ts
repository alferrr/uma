import { useEffect } from 'react';

import { findZone, setCurrentFarm, useZone } from './db';

/**
 * A zone by id. Screens only see the current farm's zones, so when the id
 * belongs to another farm on this phone (a scanned QR code, a link), switch to
 * that farm; the zone then appears on the next render.
 */
export function useZoneById(id: string | undefined) {
  const zone = useZone(id);
  useEffect(() => {
    if (zone || !id) return;
    const row = findZone(id);
    if (row?.farm_id) setCurrentFarm(row.farm_id);
  }, [zone, id]);
  return zone;
}
