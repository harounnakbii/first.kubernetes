import { ChangeInfo, ProductFamily } from './types';

/**
 * Compare deux snapshots de familles de produits et détecte, pour chaque
 * famille, les produits ajoutés, supprimés, ou dont le flag isRestricted
 * a changé. Une famille est marquée "hasChange" dès qu'elle contient au
 * moins un produit concerné par l'un de ces trois cas.
 */
export function detectFamilyChanges(
  previousFamilies: ProductFamily[],
  newFamilies: ProductFamily[]
): Map<string, ChangeInfo> {
  const changesByFamily = new Map<string, ChangeInfo>();
  const previousFamilyMap = new Map(previousFamilies.map(f => [f.id, f]));

  for (const newFamily of newFamilies) {
    const previousFamily = previousFamilyMap.get(newFamily.id);

    const changeInfo: ChangeInfo = {
      familyId: newFamily.id,
      hasChange: false,
      changedProductIds: new Set(),
      addedProductIds: new Set(),
      removedProductIds: new Set(),
      restrictionChangedProductIds: new Set(),
    };

    // Famille nouvelle : rien à comparer, pas de diff à signaler
    if (!previousFamily) {
      changesByFamily.set(newFamily.id, changeInfo);
      continue;
    }

    const previousProductMap = new Map(previousFamily.products.map(p => [p.id, p]));
    const newProductIds = new Set(newFamily.products.map(p => p.id));

    // Produits ajoutés ou modifiés (isRestricted)
    for (const newProduct of newFamily.products) {
      const previousProduct = previousProductMap.get(newProduct.id);

      if (!previousProduct) {
        changeInfo.addedProductIds.add(newProduct.id);
        changeInfo.changedProductIds.add(newProduct.id);
        changeInfo.hasChange = true;
      } else if (previousProduct.isRestricted !== newProduct.isRestricted) {
        changeInfo.restrictionChangedProductIds.add(newProduct.id);
        changeInfo.changedProductIds.add(newProduct.id);
        changeInfo.hasChange = true;
      }
    }

    // Produits supprimés (présents avant, absents maintenant)
    for (const previousProduct of previousFamily.products) {
      if (!newProductIds.has(previousProduct.id)) {
        changeInfo.removedProductIds.add(previousProduct.id);
        changeInfo.hasChange = true;
      }
    }

    changesByFamily.set(newFamily.id, changeInfo);
  }

  return changesByFamily;
}
