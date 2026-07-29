import { useCallback, useEffect, useRef, useState } from 'react';
import { ProductFamily } from './types';
import { detectFamilyChanges } from './detectFamilyChanges';
import { loadUnacknowledgedFromStorage, saveUnacknowledgedToStorage } from './localStorageHelpers';

/**
 * Détecte les changements entre chaque poll de familles de produits,
 * et maintient un état persistant (localStorage) des produits
 * "non vus" par l'utilisateur, jusqu'à acquittement explicite (clic).
 */
export function useProductFamilyChanges(families: ProductFamily[] | undefined) {
  const previousFamiliesRef = useRef<ProductFamily[] | null>(null);
  const isFirstLoadRef = useRef(true);

  // Initialisé directement depuis localStorage pour survivre à un refresh
  const [unacknowledged, setUnacknowledged] = useState<Map<string, Set<string>>>(
    () => loadUnacknowledgedFromStorage()
  );

  // Persiste à chaque changement d'état
  useEffect(() => {
    saveUnacknowledgedToStorage(unacknowledged);
  }, [unacknowledged]);

  useEffect(() => {
    if (!families) return;

    if (isFirstLoadRef.current) {
      // Premier chargement : on n'a rien à comparer, on ne fait
      // qu'initialiser la référence. Les notifs restaurées depuis
      // localStorage restent affichées telles quelles.
      isFirstLoadRef.current = false;
      previousFamiliesRef.current = families;
      return;
    }

    if (previousFamiliesRef.current) {
      const detected = detectFamilyChanges(previousFamiliesRef.current, families);

      setUnacknowledged(prev => {
        let hasAnyNewChange = false;
        const next = new Map(prev);

        for (const [familyId, changeInfo] of detected) {
          if (changeInfo.changedProductIds.size === 0) continue;

          hasAnyNewChange = true;
          const existing = next.get(familyId) ?? new Set<string>();
          const merged = new Set(existing);

          for (const productId of changeInfo.changedProductIds) {
            merged.add(productId);
          }

          next.set(familyId, merged);
        }

        // Évite un re-render / re-write localStorage inutile si rien n'a changé
        return hasAnyNewChange ? next : prev;
      });
    }

    previousFamiliesRef.current = families;
  }, [families]);

  const acknowledgeProduct = useCallback((familyId: string, productId: string) => {
    setUnacknowledged(prev => {
      const set = prev.get(familyId);
      if (!set || !set.has(productId)) return prev;

      const next = new Map(prev);
      const updated = new Set(set);
      updated.delete(productId);

      if (updated.size === 0) {
        next.delete(familyId);
      } else {
        next.set(familyId, updated);
      }

      return next;
    });
  }, []);

  const acknowledgeFamily = useCallback((familyId: string) => {
    setUnacknowledged(prev => {
      if (!prev.has(familyId)) return prev;
      const next = new Map(prev);
      next.delete(familyId);
      return next;
    });
  }, []);

  return { unacknowledged, acknowledgeProduct, acknowledgeFamily };
}
