import { isValidElement } from 'react';
import BlockOwnershipOverlay from './BlockOwnershipOverlay';
import FrontHudAnchorTag from './FrontHudAnchorTag';

/**
 * Shared non-content layers for canonical block surfaces.
 *
 * The block renderer continues to own its semantic content and layout. This
 * component owns the stable layer order used by every reusable block surface:
 * background effects, collaboration context, then the HUD anchor.
 */
export function BlockSurfaceHudAnchor({ hudAnchor }) {
  if (!hudAnchor) {
    return null;
  }

  if (isValidElement(hudAnchor)) {
    return hudAnchor;
  }

  return (
    <FrontHudAnchorTag
      label={hudAnchor.label}
      icon={hudAnchor.icon}
      isActive={hudAnchor.isActive}
      onClick={hudAnchor.onClick}
      style={hudAnchor.style}
      structureControls={hudAnchor.structureControls}
    />
  );
}

export default function BlockSurfaceLayers({
  ownership = null,
  hudAnchor = null,
  backgroundEffects = null,
}) {
  return (
    <>
      {backgroundEffects}
      <BlockOwnershipOverlay ownership={ownership} />
      <BlockSurfaceHudAnchor hudAnchor={hudAnchor} />
    </>
  );
}
