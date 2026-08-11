import { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/service-native.css';
import BlockHudPanelHost from '../components/BlockHudPanelHost';
import FrontHudAnchorTag from '../components/FrontHudAnchorTag';
import PageShell from '../components/PageShell';
import FrontHudPanelShell from '../components/FrontHudPanelShell';
import FrontHudPageWorkflow from '../components/FrontHudPageWorkflow';
import SafeRichText from '../components/SafeRichText';
import CertificateRatesSheet from '../components/CertificateRatesSheet';
import IraRatesSheet from '../components/IraRatesSheet';
import { pageByPath } from '../data/siteMap';
import { useRates } from '../context/RatesContext';
import { useContentAdmin } from '../context/ContentAdminContextCore';
import { useFrontHud } from '../context/FrontHudContext';
import useNativeEnhancements from '../hooks/useNativeEnhancements';
import useHudDockOrder from '../hooks/useHudDockOrder';
import { buildHudPanelsFromBlocks } from '../lib/blockHudRegistry';
import { buildDynamicLegalCopyFromBlock, buildDynamicRatesFromBlock } from '../lib/dynamicPageBlocks';
import { selectFrontHudContentSource } from '../lib/frontHudContentSource';

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
  const certificatesSectionRef = useRef(null);
  const iraSectionRef = useRef(null);
  const {
    blocksByPath,
    authoringBlocksByPath,
    clearActiveBlockLock = () => ({ ok: false }),
  } = useContentAdmin();
  const {
    enabled: frontHudEnabled,
    opacity: frontHudOpacity,
    setEnabled: setFrontHudEnabled = null,
  } = useFrontHud();
  const { blocksByPath: managedBlocksByPath } = selectFrontHudContentSource({
    enabled: frontHudEnabled,
    pathname: '/rates',
    authoringBlocksByPath,
    blocksByPath,
  });
  const [hudDockCollapsed, setHudDockCollapsed] = useState(true);
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
        panelIdByKind: { rates: 'rates-table' },
      },
    ),
    [dynamicRatesPageBlocks],
  );
  const showFrontHud = frontHudEnabled && hudPanels.length > 0;
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
    setActiveHudPanelId(targetPanelId);
    scrollToElement(managedBlockRef.current);
  };

  const closeHudDock = () => {
    setHudDockCollapsed(true);
    setActiveHudPanelId('');
    setFrontHudEnabled?.(false);
  };

  useEffect(() => () => {
    const activeHudBlockId = String(activeHudPanel?.block?.id || '').trim();
    if (activeHudBlockId) {
      clearActiveBlockLock('/rates', activeHudBlockId);
    }
  }, [activeHudPanel?.block?.id, clearActiveBlockLock]);
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

  return (
    <div
      ref={pageRef}
      className={`rates-page${showFrontHud ? ' is-front-hud-docked admin-front-hud-scope' : ''}${hasOpenHudPanel ? ' has-active-front-hud-panel' : ''}`}
    >
      {showFrontHud ? (
        <aside className={`admin-front-hud-dock${hudDockCollapsed ? ' is-collapsed' : ''}`} aria-label="Front HUD editor panels">
          <div className={`admin-front-hud-dock-tabs${isDockDragging ? ' is-drag-active' : ''}`}>
            {orderedHudPanels.map((panel) => (
              <button
                key={panel.id}
                type="button"
                className={`admin-front-hud-dock-tab${!hudDockCollapsed && activeHudPanelId === panel.id ? ' is-active' : ''}${isPanelDragging(panel.id) ? ' is-dragging' : ''}${isPanelDragOver(panel.id) ? ' is-drag-over' : ''}${getPanelDropPosition(panel.id) ? ` is-drop-${getPanelDropPosition(panel.id)}` : ''}`}
                onClick={() => openRatesHudPanel(panel.id)}
                aria-label={`Edit ${panel.label}`}
                title={`Edit ${panel.label}`}
                {...getDockTabDragProps(panel.id)}
              >
                <img src={panel.icon} alt="" aria-hidden="true" className="admin-front-hud-dock-tab-icon" />
                <span className="admin-front-hud-dock-tab-label">{panel.label}</span>
              </button>
            ))}
          </div>
          <div className="admin-front-hud-dock-actions">
            <button
              type="button"
              className="admin-front-hud-dock-collapse"
              onClick={() => setHudDockCollapsed((current) => !current)}
              aria-label={hudDockCollapsed ? 'Show panels' : 'Hide panels'}
              title={hudDockCollapsed ? 'Show panels' : 'Hide panels'}
            >
              {hudDockCollapsed ? '▢' : '×'}
            </button>
          </div>
        </aside>
      ) : null}
      <FrontHudPageWorkflow pathname="/rates" reviewHref="/admin/rates" reviewLabel="Open rates admin" placement="bar" isVisible={showFrontHud} />
      {hasOpenHudPanel && activeHudPanel ? (
        <FrontHudPanelShell
          title={activeHudPanel.label}
          blockId={activeHudPanel.block.id}
          pathname="/rates"
          onClose={closeHudDock}
          style={{ '--ag-admin-front-hud-opacity': String(frontHudOpacityRatio) }}
        >
          <FrontHudPageWorkflow
            pathname="/rates"
            reviewHref="/admin/rates"
            reviewLabel="Open rates admin"
            placement="dock-inline"
            showBlockDiscardAction
            blockId={activeHudPanel.block.id}
            blockLabel={activeHudPanel.label}
            onDoneEditing={closeHudDock}
          />
          <BlockHudPanelHost
            block={activeHudPanel.block}
            pathname="/rates"
            ratesContext={{
              scrollToCertificates: () => scrollToElement(certificatesSectionRef.current),
              scrollToIra: () => scrollToElement(iraSectionRef.current),
            }}
            onSettingChange={() => {}}
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
          {renderHudAnchor('rates-table')}
          <div ref={certificatesSectionRef} className="rates-page-certificate-block fade-up">
            <CertificateRatesSheet rates={rates} />
          </div>

          <SafeRichText
            as="div"
            html={legalCopyRuntime?.certificatesHtml || ''}
            className="rates-disclaimer fade-up"
          />

          <h2 ref={iraSectionRef} className="rates-page-subheading">IRA Investment Rates</h2>
          <div className="rates-page-ira-block fade-up">
            <IraRatesSheet rates={iraRates} />
          </div>

          <SafeRichText
            as="div"
            html={legalCopyRuntime?.iraHtml || ''}
            className="rates-disclaimer fade-up"
          />
        </section>
      </PageShell>
    </div>
  );
}
