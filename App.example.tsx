import React, { useEffect, useState } from 'react';
import { ProductFamily } from './types';
import { ProductFamilyTree } from './ProductFamilyTree';

// Exemple minimal d'intégration avec un polling toutes les 30s.
// À adapter à votre stack (React Query, SWR, fetch natif, etc.)
export default function App() {
  const [families, setFamilies] = useState<ProductFamily[] | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    async function fetchFamilies() {
      try {
        const response = await fetch('/api/product-families');
        const data: ProductFamily[] = await response.json();
        if (!cancelled) setFamilies(data);
      } catch (error) {
        console.error('Erreur lors du chargement des familles de produits', error);
      }
    }

    fetchFamilies();
    const interval = setInterval(fetchFamilies, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!families) return <div>Chargement...</div>;

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Familles de produits</h1>
      <ProductFamilyTree families={families} />
    </div>
  );
}
