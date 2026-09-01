import { Children, isValidElement } from 'react';

function blockId(block) {
  return String(block?.id || '').trim();
}

function childBlockId(child) {
  if (!isValidElement(child)) {
    return '';
  }
  return String(child.props?.['data-block-id'] || '').trim();
}

/**
 * The saved block list is the single authority for the rendered DOM sequence.
 * Children without a managed identity are route-owned support content and stay
 * after the managed sequence in their authored relative order.
 */
export function orderManagedBlockChildren(children, blocks = []) {
  const positionByBlockId = new Map();
  (Array.isArray(blocks) ? blocks : []).forEach((block, index) => {
    const id = blockId(block);
    if (id && !positionByBlockId.has(id)) {
      positionByBlockId.set(id, index);
    }
  });

  return Children.toArray(children)
    .map((child, sourceIndex) => ({
      child,
      sourceIndex,
      blockId: childBlockId(child),
    }))
    .sort((left, right) => {
      const leftPosition = positionByBlockId.get(left.blockId);
      const rightPosition = positionByBlockId.get(right.blockId);
      const leftRank = Number.isFinite(leftPosition)
        ? leftPosition
        : positionByBlockId.size + left.sourceIndex;
      const rightRank = Number.isFinite(rightPosition)
        ? rightPosition
        : positionByBlockId.size + right.sourceIndex;
      return leftRank - rightRank || left.sourceIndex - right.sourceIndex;
    })
    .map(({ child }) => child);
}

export default function ManagedBlockOrder({ blocks, children, ...props }) {
  return (
    <div {...props}>
      {orderManagedBlockChildren(children, blocks)}
    </div>
  );
}
