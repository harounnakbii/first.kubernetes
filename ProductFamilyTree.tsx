import React, { useState } from 'react';
import { ProductFamily } from './types';
import { useProductFamilyChanges } from './useProductFamilyChanges';

const dotStyleFamily: React.CSSProperties = {
  display: 'inline-block',
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: '#f97316', // orange-500
  marginLeft: 6,
};

const dotStyleProduct: React.CSSProperties = {
  display: 'inline-block',
  width: 6,
  height: 6,
  borderRadius: '50%',
  backgroundColor: '#f97316',
  marginLeft: 6,
};

interface FamilyNodeProps {
  family: ProductFamily;
  changedProductIds: Set<string> | undefined;
  onAcknowledgeFamily: (familyId: string) => void;
  onAcknowledgeProduct: (familyId: string, productId: string) => void;
}

function FamilyNode({
  family,
  changedProductIds,
  onAcknowledgeFamily,
  onAcknowledgeProduct,
}: FamilyNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const hasFamilyChange = !!changedProductIds && changedProductIds.size > 0;

  const handleToggleExpand = (e: React.MouseEvent) => {
    // Le clic sur la flèche ne fait que déplier/replier,
    // il n'acquitte PAS la notification.
    e.stopPropagation();
    setExpanded(prev => !prev);
  };

  const handleLabelClick = () => {
    // Le clic sur le libellé de la famille marque tout comme vu.
    onAcknowledgeFamily(family.id);
  };

  return (
    <li style={{ listStyle: 'none', marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
        <span onClick={handleToggleExpand} style={{ marginRight: 6, userSelect: 'none' }}>
          {expanded ? '▾' : '▸'}
        </span>
        <span onClick={handleLabelClick}>
          {family.name}
          {hasFamilyChange && <span style={dotStyleFamily} title="Changement non lu" />}
        </span>
      </div>

      {expanded && (
        <ul style={{ paddingLeft: 24, marginTop: 4 }}>
          {family.products.map(product => (
            <li
              key={product.id}
              style={{ listStyle: 'none', cursor: 'pointer', padding: '2px 0' }}
              onClick={() => onAcknowledgeProduct(family.id, product.id)}
            >
              {product.name}
              {product.isRestricted && (
                <span style={{ marginLeft: 6, fontSize: 12, color: '#dc2626' }}>
                  (restreint)
                </span>
              )}
              {changedProductIds?.has(product.id) && (
                <span style={dotStyleProduct} title="Changement non lu" />
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

interface ProductFamilyTreeProps {
  families: ProductFamily[];
}

export function ProductFamilyTree({ families }: ProductFamilyTreeProps) {
  const { unacknowledged, acknowledgeProduct, acknowledgeFamily } =
    useProductFamilyChanges(families);

  return (
    <ul style={{ paddingLeft: 0 }}>
      {families.map(family => (
        <FamilyNode
          key={family.id}
          family={family}
          changedProductIds={unacknowledged.get(family.id)}
          onAcknowledgeFamily={acknowledgeFamily}
          onAcknowledgeProduct={acknowledgeProduct}
        />
      ))}
    </ul>
  );
}
