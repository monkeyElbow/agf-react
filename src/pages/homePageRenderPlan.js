function isHeroBlock(block) {
  const kind = String(block?.kind || block?.type || '').trim().toLowerCase();
  return kind === 'hero';
}

export function planHomeRenderItems(blocks = [], { showReturnAssist = false } = {}) {
  const sourceBlocks = Array.isArray(blocks) ? blocks : [];
  const heroBlockIndex = sourceBlocks.findIndex((block) => isHeroBlock(block));
  const items = [];

  if (heroBlockIndex < 0) {
    if (showReturnAssist) {
      items.push({ type: 'slot', slot: 'return_assist' });
    }
    sourceBlocks.forEach((block) => {
      items.push({ type: 'block', block });
    });
    return items;
  }

  sourceBlocks.forEach((block, index) => {
    items.push({ type: 'block', block });
    if (showReturnAssist && index === heroBlockIndex) {
      items.push({ type: 'slot', slot: 'return_assist' });
    }
  });

  return items;
}

export function groupHomeRenderItems(items = []) {
  const renderItems = Array.isArray(items) ? items : [];
  const groupedItems = [];
  let pendingBlocks = [];

  const flushPendingBlocks = () => {
    if (!pendingBlocks.length) {
      return;
    }
    groupedItems.push({ type: 'block_run', blocks: pendingBlocks });
    pendingBlocks = [];
  };

  renderItems.forEach((item) => {
    if (item?.type === 'block' && item.block) {
      pendingBlocks.push(item.block);
      return;
    }
    flushPendingBlocks();
    if (item?.type === 'slot') {
      groupedItems.push(item);
    }
  });

  flushPendingBlocks();
  return groupedItems;
}
