import { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/service-native.css';
import {
  FrontHudPageWorkflow,
  FrontHudPanelShell,
  LazyBlockHudPanelHost as BlockHudPanelHost,
  preloadBlockHudPanelHost,
  preloadFrontHudChrome,
} from '../components/BlockHudPanelHostLoader';
import FrontHudAnchorTag from '../components/FrontHudAnchorTag';
import FrontHudDock from '../components/FrontHudDock';
import PageShell from '../components/PageShell';
import SafeRichText from '../components/SafeRichText';
import RatesBlock from '../components/RatesBlock';
import { pageByPath } from '../data/siteMap';
import { useRates } from '../context/RatesContext';
import { useContentAdmin } from '../context/ContentAdminContextCore';
import { useFrontHud } from '../context/FrontHudContext';
import useNativeEnhancements from '../hooks/useNativeEnhancements';
import useHudDockOrder from '../hooks/useHudDockOrder';
import { useManagedContentSource } from '../hooks/useManagedContentSource';
import { buildHudPanelsFromBlocks } from '../lib/blockHudRegistry';
import { buildDynamicLegalCopyFromBlock, buildDynamicRatesFromBlock } from '../lib/dynamicPageBlocks';
import { getBlockOwnershipVisual } from '../components/BlockOwnershipOverlay';

function clampFrontHudOpacity(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 15;
  }
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function buildRatesPageRuntime(block) {
  const blockKind = String(block?.kind || block?.type || '').trim();
  if (blockKind === 'rates') {
    return buildDynamicRatesFromBlock(block);
  }
  return null;
}

export default function RatesPage() {
  const { rates, iraRates, ratesMeta, legalCopy } = useRates();
  const pageRef = useRef(null);
  const managedBlockRef = useRef(null);
  const rateSectionRefs = useRef({});
  const {
    getBlockCollaboration = () => null,
    devIdentity = null,
    setActiveBlockLock = () => ({ ok: false }),
    clearActiveBlockLock = () => ({ ok: false }),
    updateBlockSetting = () => {},
  } = useContentAdmin();
  const clearActiveBlockLockRef = useRef(clearActiveBlockLock);

  useEffect(() => {
    clearActiveBlockLockRef.current = clearActiveBlockLock;
  }, [clearActiveBlockLock]);
  const {
    enabled: frontHudEnabled,
    opacity: frontHudOpacity,
    setEnabled: setFrontHudEnabled = null,
  } = useFrontHud();
  const { blocksByPath: managedBlocksByPath } = useManagedContentSource({ pathname: '/rates' });
  const [hudDockCollapsed, setHudDockCollapsed] = useState(true);
  const [hudDockIconsOnly, setHudDockIconsOnly] = useState(false);
  const [hudDockHoverLabel, setHudDockHoverLabel] = useState(null);
  const [activeHudPanelId, setActiveHudPanelId] = useState('');
  useNativeEnhancements(pageRef);
  const managedBlocks = useMemo(
    () => (Array.isArray(managedBlocksByPath?.['/rates']) ? managedBlocksByPath['/rates'] : []),
    [managedBlocksByPath],
  );
  const dynamicRatesPageBlocks = useMemo(
    () => managedBlocks
      .map((block) => ({
        block,
        runtime: buildRatesPageRuntime(block),
      }))
      .filter((entry) => (
        entry.runtime
        && entry.block?.hidden !== true
        && entry.block?.hidden !== 'true'
      )),
    [managedBlocks],
  );
  const legalCopyRuntime = useMemo(
    () => buildDynamicLegalCopyFromBlock(
      {
        id: 'disclaimer',
        kind: 'legal_copy',
        mode: 'dynamic',
        settings: legalCopy,
      },
      {
        certificatesEffectiveDate: ratesMeta?.certificatesEffectiveDate,
        iraEffectiveDate: ratesMeta?.iraEffectiveDate,
      },
    ),
    [legalCopy, ratesMeta?.certificatesEffectiveDate, ratesMeta?.iraEffectiveDate],
  );
  const hudPanels = useMemo(
    () => buildHudPanelsFromBlocks(
      dynamicRatesPageBlocks.map((entry) => entry.block),
      {
        anchorSelectorById: Object.fromEntries(
          dynamicRatesPageBlocks.map((entry) => [entry.block.id, `#${entry.runtime.anchorId}`]),
        ),
        includeHidden: true,
      },
    ),
    [dynamicRatesPageBlocks],
  );
  const showFrontHud = frontHudEnabled && hudPanels.length > 0;
  const getOwnershipVisualForBlockId = (blockId) => {
    if (!showFrontHud || !blockId) {
      return { className: '', overlayLabel: '', overlayDetail: '', state: 'none', isOwnedByOther: false };
    }
    return getBlockOwnershipVisual(getBlockCollaboration('/rates', blockId), devIdentity?.userId);
  };
  useEffect(() => {
    if (showFrontHud) {
      void preloadFrontHudChrome();
      void preloadBlockHudPanelHost();
    }
  }, [showFrontHud]);
  const frontHudOpacityRatio = clampFrontHudOpacity(frontHudOpacity) / 100;
  const activeHudPanel = useMemo(
    () => hudPanels.find((panel) => panel.id === activeHudPanelId) || null,
    [activeHudPanelId, hudPanels],
  );
  const hudPanelById = useMemo(() => (
    hudPanels.reduce((next, panel) => {
      const panelId = String(panel?.id || '').trim();
      if (panelId) {
        next[panelId] = panel;
      }
      return next;
    }, {})
  ), [hudPanels]);
  const hasOpenHudPanel = showFrontHud && !hudDockCollapsed && Boolean(activeHudPanel);
  const {
    orderedPanels: orderedHudPanels,
    getDockTabDragProps,
    isPanelDragging,
    isPanelDragOver,
    getPanelDropPosition,
    isDockDragging,
  } = useHudDockOrder({
    panels: hudPanels,
    storageKey: 'rates',
  });

  useEffect(() => {
    if (!showFrontHud) {
      setHudDockCollapsed(true);
      setActiveHudPanelId('');
      setHudDockIconsOnly(false);
      setHudDockHoverLabel(null);
    }
  }, [showFrontHud]);

  const scrollToElement = (target, extraOffset = 8) => {
    if (!target || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    const nav = document.querySelector('.site-nav');
    const navHeight = nav ? nav.getBoundingClientRect().height : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - navHeight - extraOffset;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: 'smooth',
    });
  };

  const openRatesHudPanel = (panelId = '') => {
    const targetPanelId = String(panelId || hudPanels[0]?.id || 'rates-table').trim() || 'rates-table';
    if (!hudDockCollapsed && activeHudPanelId === targetPanelId) {
      setHudDockCollapsed(true);
      setActiveHudPanelId('');
      return;
    }
    setHudDockCollapsed(false);
    setHudDockIconsOnly(true);
    setHudDockHoverLabel(null);
    setActiveHudPanelId(targetPanelId);
    scrollToElement(managedBlockRef.current);
  };

  const closeHudDock = () => {
    setHudDockCollapsed(true);
    setActiveHudPanelId('');
    setHudDockHoverLabel(null);
    setFrontHudEnabled?.(false);
  };
  const closeHudPanel = () => {
    setHudDockCollapsed(false);
    setActiveHudPanelId('');
    setHudDockHoverLabel(null);
  };

  const setRateSectionRef = (anchorId, node) => {
    const key = String(anchorId || '').trim();
    if (!key) {
      return;
    }
    if (node) {
      rateSectionRefs.current[key] = node;
    } else {
      delete rateSectionRefs.current[key];
    }
  };

  useEffect(() => () => {
    const activeHudBlockId = String(activeHudPanel?.block?.id || '').trim();
    if (activeHudBlockId) {
      clearActiveBlockLockRef.current('/rates', activeHudBlockId);
    }
  }, [activeHudPanel?.block?.id]);
  const renderHudAnchor = (panelId, layerClassName = '') => {
    if (!showFrontHud) {
      return null;
    }
    const panel = hudPanelById[String(panelId || '').trim()];
    if (!panel) {
      return null;
    }
    return (
      <FrontHudAnchorTag
        label={panel.label}
        icon={panel.icon}
        isActive={!hudDockCollapsed && activeHudPanelId === panel.id}
        onClick={() => openRatesHudPanel(panel.id)}
        layerClassName={layerClassName}
        style={{ '--ag-admin-front-hud-opacity': String(frontHudOpacityRatio) }}
      />
    );
  };

  const renderManagedRateBlock = ({ block, runtime }, index) => {
    const dataset = String(runtime?.dataset || '').trim();
    const legalHtml = dataset === 'ira'
      ? legalCopyRuntime?.iraHtml
      : (dataset === 'certificates' ? legalCopyRuntime?.certificatesHtml : '');
    return (
      <div
        key={block.id}
        ref={(node) => setRateSectionRef(runtime.anchorId, node)}
        id={runtime.anchorId || undefined}
        className={`rates-page-managed-rate rates-page-managed-rate--${dataset || 'unknown'} fade-up`}
        data-rates-managed-order={String(index)}
        data-rates-managed-block-id={block.id}
        data-rates-managed-panel-id={runtime.panelId}
      >
        {renderHudAnchor(runtime.panelId)}
        {dataset === 'ira' ? (
          <h2 className="rates-page-subheading">IRA Investment Rates</h2>
        ) : null}
        <RatesBlock runtime={runtime} rates={rates} iraRates={iraRates} ratesMeta={ratesMeta} />
        {legalHtml ? (
          <SafeRichText as="div" html={legalHtml} className="rates-disclaimer fade-up" />
        ) : null}
      </div>
    );
  };

  return (
    <div
      ref={pageRef}
      className={`rates-page${showFrontHud ? ' is-front-hud-docked admin-front-hud-scope' : ''}${hasOpenHudPanel ? ' has-active-front-hud-panel' : ''}`}
    >
      {showFrontHud ? (
        <FrontHudDock
          panels={orderedHudPanels}
          activePanelId={activeHudPanelId}
          isCollapsed={hudDockCollapsed}
          isIconsOnly={hudDockIconsOnly}
          isDockDragging={isDockDragging}
          style={{ '--ag-admin-front-hud-opacity': String(frontHudOpacityRatio) }}
          panelAriaLabelPrefix="Edit "
          getPanelTitle={(panel) => `Edit ${panel.label}${panel.isHidden ? ' — hidden from visitors' : ''}`}
          onPanelOpen={(panel) => openRatesHudPanel(panel.id)}
          onPanelClose={closeHudPanel}
          onToggleIconsOnly={() => setHudDockIconsOnly((current) => !current)}
          onClose={closeHudDock}
          getDockTabDragProps={getDockTabDragProps}
          isPanelDragging={isPanelDragging}
          isPanelDragOver={isPanelDragOver}
          getPanelDropPosition={getPanelDropPosition}
          onDockHoverLabelChange={setHudDockHoverLabel}
          dockHoverLabel={hudDockHoverLabel}
        />
      ) : null}
      <FrontHudPageWorkflow pathname="/rates" reviewHref="/admin/rates" reviewLabel="Open rates admin" placement="bar" isVisible={showFrontHud} />
      {hasOpenHudPanel && activeHudPanel ? (
        <FrontHudPanelShell
          title={activeHudPanel.label}
          blockId={activeHudPanel.block.id}
          pathname="/rates"
          ownership={getOwnershipVisualForBlockId(activeHudPanel.block.id)}
          onOwnershipAction={() => {
            if (!activeHudPanel?.block?.id) {
              return;
            }
            return setActiveBlockLock('/rates', activeHudPanel.block.id, { force: true });
          }}
          onClose={closeHudPanel}
          style={{ '--ag-admin-front-hud-opacity': String(frontHudOpacityRatio) }}
        >
          <FrontHudPageWorkflow
            pathname="/rates"
            reviewHref="/admin/rates"
            reviewLabel="Open rates admin"
            placement="dock-inline"
            showBlockDiscardAction
            blockId={activeHudPanel.block.id}
            block={activeHudPanel.block}
            blockLabel={activeHudPanel.label}
            ownership={getOwnershipVisualForBlockId(activeHudPanel.block.id)}
            onOwnershipAction={() => {
              if (!activeHudPanel?.block?.id) {
                return;
              }
              return setActiveBlockLock('/rates', activeHudPanel.block.id, { force: true });
            }}
            onDoneEditing={closeHudDock}
          />
          <BlockHudPanelHost
            block={activeHudPanel.block}
            pathname="/rates"
            ownership={getOwnershipVisualForBlockId(activeHudPanel.block.id)}
            onOwnershipAction={() => {
              if (!activeHudPanel?.block?.id) {
                return;
              }
              return setActiveBlockLock('/rates', activeHudPanel.block.id, { force: true });
            }}
            ratesContext={{
              rates,
              iraRates,
              ratesMeta,
              scrollToCertificates: () => scrollToElement(rateSectionRefs.current['certificates-rates']),
              scrollToIra: () => scrollToElement(rateSectionRefs.current['ira-rates']),
              scrollTo403b: () => scrollToElement(rateSectionRefs.current['403b-investment-rate']),
            }}
            onSettingChange={(settingKey, nextValue) => updateBlockSetting('/rates', activeHudPanel.block.id, settingKey, nextValue)}
          />
        </FrontHudPanelShell>
      ) : null}
      <PageShell title="AGFinancial Investment Certificate Rates" source={pageByPath['/rates'].source} showBadge={false}>
        <p className="rates-page-intro">
          Competitive rates plus commitment to our core faith values.
        </p>
        <section
          ref={managedBlockRef}
          className="rates-page-managed-block"
          style={showFrontHud ? { position: 'relative' } : undefined}
        >
          {dynamicRatesPageBlocks.map(renderManagedRateBlock)}
        </section>
      </PageShell>
    </div>
  );
}
