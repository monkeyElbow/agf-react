import { useEffect, useMemo, useRef, useState } from 'react';
import BlockHudPanelHost from '../components/BlockHudPanelHost';
import FrontHudAnchorTag from '../components/FrontHudAnchorTag';
import PageShell from '../components/PageShell';
import FrontHudPanelShell from '../components/FrontHudPanelShell';
import FrontHudPageWorkflow from '../components/FrontHudPageWorkflow';
import SafeRichText from '../components/SafeRichText';
import { pageByPath } from '../data/siteMap';
import { useRates } from '../context/RatesContext';
import { useContentAdmin } from '../context/ContentAdminContext';
import { useFrontHud } from '../context/FrontHudContext';
import useNativeEnhancements from '../hooks/useNativeEnhancements';
import useHudDockOrder from '../hooks/useHudDockOrder';
import { buildHudPanelsFromBlocks } from '../lib/blockHudRegistry';
import { buildDynamicLegalCopyFromBlock, buildDynamicRatesFromBlock } from '../lib/dynamicPageBlocks';

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
  const { blocksByPath } = useContentAdmin();
  const { enabled: frontHudEnabled, opacity: frontHudOpacity } = useFrontHud();
  const [hudDockCollapsed, setHudDockCollapsed] = useState(true);
  const [activeHudPanelId, setActiveHudPanelId] = useState('');
  useNativeEnhancements(pageRef);
  const managedBlocks = useMemo(
    () => (Array.isArray(blocksByPath?.['/rates']) ? blocksByPath['/rates'] : []),
    [blocksByPath],
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
  };
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
      className={`rates-page${showFrontHud ? ' is-front-hud-docked' : ''}${hasOpenHudPanel ? ' has-active-front-hud-panel' : ''}`}
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
                <span className="admin-front-hud-visually-hidden">{panel.label}</span>
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
      {showFrontHud ? (
        <FrontHudPageWorkflow pathname="/rates" reviewHref="/admin/rates" reviewLabel="Open rates admin" placement="bar" />
      ) : null}
      {hasOpenHudPanel && activeHudPanel ? (
        <FrontHudPanelShell
          title={activeHudPanel.label}
          onClose={closeHudDock}
          style={{ '--ag-admin-front-hud-opacity': String(frontHudOpacityRatio) }}
        >
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
      <PageShell title="AGFinancial Investment Certificates Rates" source={pageByPath['/rates'].source} showBadge={false}>
        <p className="rates-page-intro">
          Competitive rates plus commitment to our core faith values.
        </p>
        <section
          ref={managedBlockRef}
          className="rates-page-managed-block"
          style={showFrontHud ? { position: 'relative' } : undefined}
        >
          {renderHudAnchor('rates-table')}
          <div
            ref={certificatesSectionRef}
            className="table-scroll fade-up"
          >
            <table className="ag-table has-fixed-layout">
              <thead>
                <tr>
                  <th>Investment Type</th>
                  <th>Standard Rate</th>
                  <th>Standard APY*</th>
                  <th>Premium Rate**</th>
                  <th>Premium APY*</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((row) => (
                  <tr key={row.id}>
                    <td>{row.product}</td>
                    <td>{row.standardRate}</td>
                    <td>{row.standardApy}</td>
                    <td>{row.premiumRate}</td>
                    <td>{row.premiumApy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SafeRichText
            as="div"
            html={legalCopyRuntime?.certificatesHtml || ''}
            className="rates-disclaimer fade-up"
          />

          <h2 ref={iraSectionRef} style={{ marginTop: '2rem' }}>IRA Investment Rates</h2>
          <div className="table-scroll fade-up">
            <table className="ag-table has-fixed-layout">
              <thead>
                <tr>
                  <th>Investment Type</th>
                  <th>Rate</th>
                  <th>APY*</th>
                </tr>
              </thead>
              <tbody>
                {iraRates.map((row) => (
                  <tr key={row.id}>
                    <td>{row.product}</td>
                    <td>{row.rate}</td>
                    <td>{row.apy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
