import { SerializedUnacknowledged } from './types';

const STORAGE_KEY = 'product-family-unacknowledged-changes';

/**
 * Convertit Map<string, Set<string>> en objet JSON-sérialisable.
 */
export function serializeUnacknowledged(map: Map<string, Set<string>>): SerializedUnacknowledged {
  const result: SerializedUnacknowledged = {};
  for (const [familyId, productIds] of map) {
    result[familyId] = Array.from(productIds);
  }
  return result;
}

/**
 * Reconstruit une Map<string, Set<string>> à partir de l'objet stocké.
 */
export function deserializeUnacknowledged(data: SerializedUnacknowledged): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const [familyId, productIds] of Object.entries(data)) {
    map.set(familyId, new Set(productIds));
  }
  return map;
}

export function loadUnacknowledgedFromStorage(): Map<string, Set<string>> {
  if (typeof window === 'undefined') return new Map();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();

    const parsed = JSON.parse(raw) as SerializedUnacknowledged;
    return deserializeUnacknowledged(parsed);
  } catch (error) {
    // localStorage corrompu, inaccessible (mode privé strict), ou JSON invalide
    console.warn('Impossible de lire les notifications depuis localStorage', error);
    return new Map();
  }
}

export function saveUnacknowledgedToStorage(map: Map<string, Set<string>>): void {
  if (typeof window === 'undefined') return;

  try {
    const serialized = serializeUnacknowledged(map);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch (error) {
    // Quota dépassé ou localStorage désactivé : on continue sans persister
    console.warn('Impossible d\'écrire les notifications dans localStorage', error);
  }
}
