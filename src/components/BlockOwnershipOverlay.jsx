function formatRelativeOwnershipTime(timestamp, now = Date.now()) {
  const value = Number(timestamp);
  if (!Number.isFinite(value) || value <= 0) {
    return '';
  }

  const deltaMs = Math.max(0, now - value);
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (deltaMs < minuteMs) {
    return 'just now';
  }
  if (deltaMs < hourMs) {
    const minutes = Math.max(1, Math.round(deltaMs / minuteMs));
    return `${minutes} min ago`;
  }
  if (deltaMs < dayMs) {
    const hours = Math.max(1, Math.round(deltaMs / hourMs));
    return `${hours} hr ago`;
  }
  const days = Math.max(1, Math.round(deltaMs / dayMs));
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function toActorDisplayName(actor) {
  return String(actor?.displayName || '').trim();
}

export function isForeignOwnedBlockOwnershipState(state) {
  return state === 'editing-other' || state === 'drafted-other';
}

export function isForeignOwnedBlockOwnership(ownership) {
  return isForeignOwnedBlockOwnershipState(String(ownership?.state || '').trim());
}

export function getBlockOwnershipVisual(meta, currentUserId, now = Date.now()) {
  const normalizedCurrentUserId = String(currentUserId || '').trim();
  const lockedBy = meta?.lockedBy || null;
  const draftedBy = meta?.isPublishedEquivalent ? null : (meta?.draftedBy || null);
  const savedBy = meta?.savedBy || null;
  const lockedByOther = lockedBy?.userId && lockedBy.userId !== normalizedCurrentUserId;
  const draftedByOther = draftedBy?.userId && draftedBy.userId !== normalizedCurrentUserId;
  const savedByOther = savedBy?.userId && savedBy.userId !== normalizedCurrentUserId;

  if (lockedByOther) {
    return {
      state: 'editing-other',
      className: ' is-admin-owned-other is-admin-owned-editing-other',
      overlayLabel: `${toActorDisplayName(lockedBy)} is editing this block`,
      overlayDetail: savedBy?.displayName && meta?.savedAt
        ? `Saved ${formatRelativeOwnershipTime(meta.savedAt, now)}`
        : '',
      isOwnedByOther: true,
      owner: lockedBy,
    };
  }

  if (lockedBy?.userId === normalizedCurrentUserId) {
    return {
      state: 'editing-self',
      className: ' is-admin-owned-self is-admin-owned-editing-self',
      overlayLabel: '',
      overlayDetail: '',
      isOwnedByOther: false,
      owner: lockedBy,
    };
  }

  if (draftedByOther) {
    return {
      state: 'drafted-other',
      className: ' is-admin-owned-other is-admin-owned-drafted-other',
      overlayLabel: `Unpublished draft by ${toActorDisplayName(draftedBy)}`,
      overlayDetail: draftedBy?.displayName && meta?.draftedAt
        ? `Draft saved ${formatRelativeOwnershipTime(meta.draftedAt, now)}`
        : '',
      isOwnedByOther: true,
      owner: draftedBy,
    };
  }

  if (savedByOther) {
    return {
      state: 'saved-other',
      className: ' is-admin-owned-other is-admin-owned-saved-other',
      overlayLabel: `Last saved by ${toActorDisplayName(savedBy)}`,
      overlayDetail: savedBy?.displayName && meta?.savedAt
        ? `Saved ${formatRelativeOwnershipTime(meta.savedAt, now)}`
        : '',
      isOwnedByOther: true,
      owner: savedBy,
    };
  }

  const ownedBySelf = Boolean(
    normalizedCurrentUserId
    && (
      draftedBy?.userId === normalizedCurrentUserId
      || savedBy?.userId === normalizedCurrentUserId
    )
  );

  if (ownedBySelf) {
    return {
      state: 'owned-self',
      className: ' is-admin-owned-self',
      overlayLabel: '',
      overlayDetail: '',
      isOwnedByOther: false,
      owner: draftedBy?.userId === normalizedCurrentUserId ? draftedBy : savedBy,
    };
  }

  return {
    state: 'none',
    className: '',
    overlayLabel: '',
    overlayDetail: '',
    isOwnedByOther: false,
    owner: null,
  };
}

export default function BlockOwnershipOverlay({ ownership }) {
  if (!ownership?.overlayLabel) {
    return null;
  }

  return (
    <div className={`admin-block-ownership-overlay is-${ownership.state || 'none'}`} aria-hidden="true">
      <div className="admin-block-ownership-overlay-card">
        <strong>{ownership.overlayLabel}</strong>
        {ownership.overlayDetail ? <span>{ownership.overlayDetail}</span> : null}
      </div>
    </div>
  );
}
