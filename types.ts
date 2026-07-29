export interface Product {
  id: string;
  name: string;
  isRestricted: boolean;
}

export interface ProductFamily {
  id: string;
  name: string;
  products: Product[];
}

export interface ChangeInfo {
  familyId: string;
  hasChange: boolean;
  changedProductIds: Set<string>;
  addedProductIds: Set<string>;
  removedProductIds: Set<string>;
  restrictionChangedProductIds: Set<string>;
}

// Structure sérialisable pour localStorage (les Set ne sont pas JSON-natifs)
export type SerializedUnacknowledged = Record<string, string[]>;
