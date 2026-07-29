# Product Family Notifications

Détection des changements (ajout / suppression / modification de `isRestricted`)
entre chaque poll de familles de produits, avec persistance de l'état
"non vu" dans `localStorage` jusqu'à ce que l'utilisateur clique sur
le produit ou la famille concernée.

## Fichiers

- `src/types.ts` — Types partagés (`Product`, `ProductFamily`, `ChangeInfo`).
- `src/detectFamilyChanges.ts` — Fonction pure de comparaison entre deux
  snapshots de familles de produits.
- `src/localStorageHelpers.ts` — Sérialisation/désérialisation des `Set`
  (non JSON-natifs) pour `localStorage`.
- `src/useProductFamilyChanges.ts` — Hook React : détecte les changements
  à chaque nouveau `families` reçu, accumule les IDs non acquittés, et
  persiste automatiquement dans `localStorage`.
- `src/ProductFamilyTree.tsx` — Composant TreeView (SimpleTreeView-like)
  affichant un point orange sur les familles/produits ayant un
  changement non acquitté.
- `src/App.example.tsx` — Exemple d'intégration avec un polling toutes
  les 30 secondes.

## Points d'implémentation

- Le clic sur la **flèche d'expansion** ne fait que déplier/replier ;
  seul le clic sur le **libellé** de la famille (ou sur un produit)
  acquitte la notification, pour éviter de la perdre accidentellement.
- Au premier chargement (`isFirstLoadRef`), aucune comparaison n'est
  faite : on évite ainsi de signaler tous les produits comme "changés"
  dès l'affichage initial. Les notifications restaurées depuis
  `localStorage` d'une session précédente restent cependant affichées.
- `localStorage` est enveloppé dans des `try/catch` : si le quota est
  dépassé, ou si l'accès est bloqué (mode privé strict de certains
  navigateurs), le code continue de fonctionner sans persistance plutôt
  que de planter.
- La clé utilisée dans `localStorage` est
  `product-family-unacknowledged-changes` — à adapter si plusieurs
  utilisateurs partagent le même navigateur (auquel cas il faudrait
  suffixer la clé avec un identifiant utilisateur).

## Adapter à votre stack

L'exemple `App.example.tsx` utilise `fetch` + `setInterval` pour rester
neutre. Si vous utilisez React Query, remplacez simplement l'effet par :

```ts
const { data: families } = useQuery({
  queryKey: ['product-families'],
  queryFn: fetchProductFamilies,
  refetchInterval: 30_000,
});
```

Le hook `useProductFamilyChanges(families)` fonctionne de la même façon
quelle que soit la source de données, tant que vous lui passez le
tableau `ProductFamily[]` à chaque poll.
