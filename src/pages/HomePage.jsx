import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import BlockHudPanelHost from '../components/BlockHudPanelHost';
import { getBlockOwnershipVisual, isForeignOwnedBlockOwnership } from '../components/BlockOwnershipOverlay';
import SiteSearchPanel from '../components/SiteSearchPanel';
import { normalizeCtaHudSubmitStyle, normalizeCtaHudSubmitTone } from '../components/CtaHudEditorPanel';
import FrontHudPanelShell from '../components/FrontHudPanelShell';
import FrontHudPageWorkflow from '../components/FrontHudPageWorkflow';
import MobileFrontHudActionTray from '../components/MobileFrontHudActionTray';
import PageBlocksRenderer from '../components/blocks/PageBlocksRenderer';
import { useDocuments } from '../context/DocumentsContext';
import { ResourcesProvider, useResources } from '../context/ResourcesContext';
import { homePageBlocks } from '../data/pageBlocks/homeBlocks';
import useNativeEnhancements from '../hooks/useNativeEnhancements';
import useHudDockOrder from '../hooks/useHudDockOrder';
import useLocalBlockDrafts from '../hooks/useLocalBlockDrafts';
import { inspectDynamicHeroSettings, normalizeDynamicHeroSettings, useContentAdmin } from '../context/ContentAdminContext';
import { useFrontHud } from '../context/FrontHudContext';
import { buildHudPanelsFromBlocks } from '../lib/blockHudRegistry';
import {
  applySelectionColor,
  extractHeroLineColorToken,
  parseHeroRangeHighlights,
  remapHighlightsJsonForTextChange,
  removeSelectionRange,
  replaceHeroLineColorClass,
} from '../lib/heroHudRanges';
import { logHeroDriftWarningOnce } from '../lib/heroDriftWarnings';
import {
  inspectHeroRender,
  logHeroRenderWarningOnce,
} from '../lib/heroRenderGuardrails';
import { getTokenSwatch } from '../lib/colorSystem';
import { shouldRenderHeroInlineEditor } from '../lib/heroHudMode';
import {
  dismissHomeReturnAssist,
  shouldShowHomeReturnAssist,
} from '../lib/homeReturnAssist';

const HOME_NEWSLETTER_FORM_ID = '34a993b6-d0fb-48fd-b3c4-faad7332770c';
const HOME_TOP_STRIP_HUD_PANEL_ID = 'home-top-strip';
const HOME_HERO_HUD_PANEL_ID = 'home-hero';
const HOME_CTA_HUD_PANEL_ID = 'home-cta-form';
const HOME_NEWSLETTER_HUD_PANEL_ID = 'home-newsletter';
const HOME_SERVICES_GRID_HUD_PANEL_ID = 'home-services-grid';
const HOME_SERVICES_FEATURE_HUD_PANEL_ID = 'home-services-feature-animation';
const HOME_IMPACT_STAT_HUD_PANEL_ID = 'home-impact-stat';
const HOME_SITE_FEATURE_HUD_PANEL_ID = 'home-site-feature';
const HOME_COLUMNS_MHA_HUD_PANEL_ID = 'home-columns-mha';
const HOME_COLUMNS_MATH_HUD_PANEL_ID = 'home-columns-math';
const HOME_HUD_PANEL_ID_BY_BLOCK_ID = {
  top_strip: HOME_TOP_STRIP_HUD_PANEL_ID,
  hero: HOME_HERO_HUD_PANEL_ID,
  home_services_feature_animation: HOME_SERVICES_FEATURE_HUD_PANEL_ID,
  services_grid: HOME_SERVICES_GRID_HUD_PANEL_ID,
  impact_stat: HOME_IMPACT_STAT_HUD_PANEL_ID,
  home_impact_story: HOME_SITE_FEATURE_HUD_PANEL_ID,
  cta_form: HOME_CTA_HUD_PANEL_ID,
  newsletter: HOME_NEWSLETTER_HUD_PANEL_ID,
  columns_mha: HOME_COLUMNS_MHA_HUD_PANEL_ID,
  columns_math: HOME_COLUMNS_MATH_HUD_PANEL_ID,
};
const HOME_HUD_ANCHOR_SELECTOR_BY_BLOCK_ID = {
  top_strip: '[data-block-id="top_strip"]',
  hero: '[data-block-id="hero"]',
  home_services_feature_animation: '[data-block-id="home_services_feature_animation"]',
  services_grid: '[data-block-id="services_grid"]',
  impact_stat: '[data-block-id="impact_stat"]',
  home_impact_story: '[data-block-id="home_impact_story"]',
  cta_form: '[data-block-id="cta_form"]',
  newsletter: '[data-block-id="newsletter"]',
  columns_mha: '[data-block-id="columns_mha"]',
  columns_math: '[data-block-id="columns_math"]',
};
const HOME_HERO_LINE_KEYS = ['line1', 'line2', 'line3'];
const MOBILE_FRONT_HUD_MEDIA_QUERY = '(max-width: 760px)';
const HOME_HERO_LINE_CLASSNAME_FALLBACK = {
  line1: 'home-native-eyebrow',
  line2: 'home-native-title line1 line2',
  line3: 'home-native-title line3',
};
const HOME_TOP_STRIP_BG_SWATCH_OPTIONS = [
  { value: 'sand', label: 'Sand', swatch: 'linear-gradient(147deg, rgb(242, 238, 235) 62%, rgb(218, 215, 208) 100%)' },
  { value: 'grey', label: 'Grey', swatch: 'linear-gradient(145deg, #414042 0%, #636265 100%)' },
  { value: 'blue', label: 'Blue', swatch: getTokenSwatch('blue') },
  { value: 'white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
];
const HOME_TOP_STRIP_TEXT_SWATCH_OPTIONS = [
  { value: 'super-grey', label: 'Super Grey', swatch: 'linear-gradient(145deg, #414042 0%, #5f5e61 100%)' },
  { value: 'atlantean', label: 'Blue', swatch: getTokenSwatch('atlantean') },
  { value: 'mango', label: 'Mango', swatch: 'linear-gradient(145deg, #f6b146 0%, #e8991f 100%)' },
  { value: 'melon', label: 'Melon', swatch: 'linear-gradient(145deg, #f48f7a 0%, #e56f58 100%)' },
  { value: 'white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
];
const HOME_TOP_STRIP_BUTTON_SWATCH_OPTIONS = [
  { value: 'atlantean', label: 'Blue', swatch: getTokenSwatch('atlantean') },
  { value: 'super-grey', label: 'Super Grey', swatch: 'linear-gradient(145deg, #414042 0%, #5f5e61 100%)' },
  { value: 'mango', label: 'Mango', swatch: 'linear-gradient(145deg, #f6b146 0%, #e8991f 100%)' },
  { value: 'melon', label: 'Melon', swatch: 'linear-gradient(145deg, #f48f7a 0%, #e56f58 100%)' },
  { value: 'white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
];
const HOME_TOP_STRIP_RATES_BUTTON_SWATCH_OPTIONS = [
  { value: 'mango', label: 'Mango', swatch: 'linear-gradient(145deg, #f6b146 0%, #e8991f 100%)' },
  { value: 'atlantean', label: 'Blue', swatch: getTokenSwatch('atlantean') },
  { value: 'melon', label: 'Melon', swatch: 'linear-gradient(145deg, #f48f7a 0%, #e56f58 100%)' },
  { value: 'super-grey', label: 'Super Grey', swatch: 'linear-gradient(145deg, #414042 0%, #5f5e61 100%)' },
  { value: 'white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
];
// Home now owns its ministry-impact storytelling through the canonical
// `home_impact_story` site feature block in `homePageBlocks`, so stale
// extra impact-stat blocks should not render a duplicate section later on the page.
const HOME_EXTRA_RENDERABLE_DYNAMIC_KINDS = new Set(['site_feature']);

function toBooleanSetting(value, fallback = true) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const token = value.trim().toLowerCase();
    if (token === 'true') {
      return true;
    }
    if (token === 'false') {
      return false;
    }
  }
  if (value == null) {
    return fallback;
  }
  return Boolean(value);
}

function isManagedBlockVisible(block) {
  return block?.hidden !== true && block?.hidden !== 'true';
}

function clampFrontHudOpacity(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 15;
  }
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function isMobileHudSelectionBlocked(target) {
  return target instanceof Element
    && Boolean(target.closest('a, button, input, select, textarea, summary, label, [role="button"], [role="link"], [data-admin-mobile-hud-ignore]'));
}

function HomeReturnAssistSearchPanel() {
  const { documents } = useDocuments();
  const { articles } = useResources();

  return (
    <SiteSearchPanel
      variant="return-assist"
      documents={documents}
      articles={articles}
      placeholder="What can we help you find?"
      label="What can we help you find?"
      autoFocus
    />
  );
}

function hasReadableHtmlContent(value) {
  const html = String(value || '').trim();
  if (!html) {
    return false;
  }
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return Boolean(text);
}

function hasRenderableHomeColumnsLayout(block) {
  const columnsStyle = String(block?.columnsStyle || '').trim().toLowerCase() || 'retirement';
  const columns = Array.isArray(block?.columnsData) && block.columnsData.length
    ? block.columnsData
    : Array.from({ length: 4 }, (_, index) => {
        const slot = index + 1;
        const enabledValue = block?.[`col${slot}Enabled`];
        const isEnabled = enabledValue === undefined ? slot <= 2 : toBooleanSetting(enabledValue);
        if (!isEnabled) {
          return null;
        }
        return {
          type: block?.[`col${slot}Type`] || (slot === 1 ? 'photo' : 'text'),
          imageUrl: block?.[`col${slot}ImageUrl`],
          title: block?.[`col${slot}Title`],
          body: block?.[`col${slot}Body`],
          buttonLabel: block?.[`col${slot}ButtonLabel`],
        };
      }).filter(Boolean);

  if (columnsStyle === 'legacy-highlight') {
    return columns.some((column) => String(column?.title || '').trim());
  }

  if (columnsStyle === 'loans-value') {
    return columns.some((column) => [
      column?.title,
      column?.body,
      column?.buttonLabel,
      String(column?.type || '').trim().toLowerCase() === 'photo' ? column?.imageUrl : '',
    ].some((value) => String(value || '').trim()));
  }

  const hasPhotoColumn = columns.some((column) => (
    String(column?.type || '').trim().toLowerCase() === 'photo'
    && String(column?.imageUrl || '').trim()
  ));
  const hasTextColumn = columns.some((column) => (
    String(column?.type || '').trim().toLowerCase() !== 'photo'
    && [
      column?.title,
      column?.body,
      column?.buttonLabel,
    ].some((value) => String(value || '').trim())
  ));

  return hasPhotoColumn && hasTextColumn;
}

function mergeHomeColumnsWithFallback(baseBlock, dynamicSettings) {
  const settings = dynamicSettings && typeof dynamicSettings === 'object' ? dynamicSettings : {};
  const merged = { ...baseBlock, ...settings };
  const columnsData = Array.isArray(merged.columnsData) ? merged.columnsData : null;
  if (columnsData) {
    const hasMeaningfulColumnsData = columnsData.some((column) => {
      if (!column || typeof column !== 'object') {
        return false;
      }
      return [
        column.title,
        column.body,
        column.imageUrl,
        column.imageAlt,
        column.buttonLabel,
        column.buttonUrl,
      ].some((value) => String(value || '').trim());
    });
    if (!hasMeaningfulColumnsData) {
      delete merged.columnsData;
    }
  }

  [
    'bgTone',
    'columns',
    'contentWidth',
    'col1Type',
    'col1ImageUrl',
    'col1ImageAlt',
    'col1Title',
    'col1TitleClassName',
    'col1TitleHighlightsJson',
    'col1Body',
    'col1ButtonLabel',
    'col1ButtonUrl',
    'col2Type',
    'col2ImageUrl',
    'col2ImageAlt',
    'col2Title',
    'col2TitleClassName',
    'col2TitleHighlightsJson',
    'col2Body',
    'col2ButtonLabel',
    'col2ButtonUrl',
  ].forEach((field) => {
    const current = merged[field];
    if (current == null) {
      merged[field] = baseBlock[field];
      return;
    }
    if (typeof current === 'string' && !current.trim()) {
      merged[field] = baseBlock[field];
    }
  });

  if (!hasRenderableHomeColumnsLayout(merged)) {
    return { ...baseBlock };
  }

  return merged;
}

function summarizeHomeColumnsBlock(block) {
  if (!block) {
    return null;
  }
  const settings = block?.settings && typeof block.settings === 'object' ? block.settings : {};
  return {
    id: String(block.id || '').trim(),
    mode: String(block.mode || '').trim(),
    hidden: block.hidden,
    kind: String(block.kind || '').trim(),
    col1Type: String(settings.col1Type || '').trim(),
    col1Title: String(settings.col1Title || '').trim(),
    col1ImageUrl: String(settings.col1ImageUrl || '').trim(),
    col2Type: String(settings.col2Type || '').trim(),
    col2Title: String(settings.col2Title || '').trim(),
    col2ImageUrl: String(settings.col2ImageUrl || '').trim(),
    hasRenderableLayout: hasRenderableHomeColumnsLayout(settings),
  };
}

export default function HomePage() {
  const location = useLocation();
  const pageRef = useRef(null);
  const heroSectionRef = useRef(null);
  const ctaTitleInputRef = useRef(null);
  const heroLineInputRefs = useRef({ line1: null, line2: null, line3: null });
  const {
    blocksByPath,
    pageHierarchy,
    updateBlock = () => {},
    moveBlock = () => {},
    removeBlock = () => {},
    getBlockCollaboration = () => null,
    devIdentity = null,
    setActiveBlockLock = () => ({ ok: false }),
    claimBufferedBlockEdit = () => false,
    commitBlockSettingsPatch = () => false,
    registerExternalDraftFlushHandler = null,
  } = useContentAdmin();
  const { enabled: frontHudEnabled, opacity: frontHudOpacity } = useFrontHud();
  const [showReturnAssist, setShowReturnAssist] = useState(false);
  const [hudDockCollapsed, setHudDockCollapsed] = useState(true);
  const [activeHudPanelId, setActiveHudPanelId] = useState('');
  const [isMobileFrontHudViewport, setIsMobileFrontHudViewport] = useState(
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(MOBILE_FRONT_HUD_MEDIA_QUERY).matches
      : false,
  );
  const [mobileHudMoreOpen, setMobileHudMoreOpen] = useState(false);
  const [mobileHudDeleteConfirmBlockId, setMobileHudDeleteConfirmBlockId] = useState('');
  const [heroSelection, setHeroSelection] = useState({
    line: '',
    start: 0,
    end: 0,
    text: '',
  });
  const [ctaTitleSelection, setCtaTitleSelection] = useState({
    start: 0,
    end: 0,
    text: '',
  });
  const [heroActiveLine, setHeroActiveLine] = useState('line1');
  const managedBlocksSource = useMemo(
    () => (Array.isArray(blocksByPath?.['/']) ? blocksByPath['/'] : []),
    [blocksByPath],
  );
  const { blocks: managedBlocks, stageLocalBlockSetting, stageLocalBlockSettings } = useLocalBlockDrafts({
    pathname: '/',
    blocks: managedBlocksSource,
    claimBufferedBlockEdit,
    commitBlockSettingsPatch,
    registerExternalDraftFlushHandler,
  });
  const dynamicTopStripBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'top_strip'
      && block?.kind === 'top_strip'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const dynamicCtaBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'cta_form'
      && block?.kind === 'cta_form'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const managedHeroBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'hero'
      && block?.kind === 'hero'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const dynamicHeroBlock = useMemo(() => (
    managedHeroBlock?.mode === 'dynamic'
      ? managedHeroBlock
      : null
  ), [managedHeroBlock]);
  const dynamicNewsletterBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'newsletter'
      && block?.kind === 'newsletter'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const dynamicServicesGridBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'services_grid'
      && block?.kind === 'services_grid'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const managedHomeServicesFeatureBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'home_services_feature_animation'
      && block?.kind === 'site_feature'
    )) || null
  ), [managedBlocks]);
  const dynamicHomeServicesFeatureBlock = managedHomeServicesFeatureBlock?.mode === 'dynamic'
    && isManagedBlockVisible(managedHomeServicesFeatureBlock)
    ? managedHomeServicesFeatureBlock
    : null;
  const dynamicImpactStatBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'impact_stat'
      && block?.kind === 'impact_stat'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const dynamicHomeImpactStoryBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'home_impact_story'
      && block?.kind === 'site_feature'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const managedHomeColumnsById = useMemo(() => {
    const next = new Map();
    managedBlocks.forEach((block) => {
      const blockId = String(block?.id || '').trim();
      if (block?.kind !== 'columns') {
        return;
      }
      if (blockId !== 'columns_mha' && blockId !== 'columns_math') {
        return;
      }
      next.set(blockId, block);
    });
    return next;
  }, [managedBlocks]);
  const dynamicColumnsMhaBlock = managedHomeColumnsById.get('columns_mha')?.mode === 'dynamic'
    && isManagedBlockVisible(managedHomeColumnsById.get('columns_mha'))
    ? managedHomeColumnsById.get('columns_mha')
    : null;
  const dynamicColumnsMathBlock = managedHomeColumnsById.get('columns_math')?.mode === 'dynamic'
    && isManagedBlockVisible(managedHomeColumnsById.get('columns_math'))
    ? managedHomeColumnsById.get('columns_math')
    : null;
  const staticHomeColumnsById = useMemo(() => {
    const next = new Map();
    homePageBlocks.forEach((block) => {
      const blockId = String(block?.id || '').trim();
      if (block?.type === 'columns' && blockId) {
        next.set(blockId, block);
      }
    });
    return next;
  }, []);
  const columnsMhaHudSettings = useMemo(() => {
    if (!dynamicColumnsMhaBlock) {
      return {};
    }
    const baseBlock = staticHomeColumnsById.get('columns_mha');
    return mergeHomeColumnsWithFallback(baseBlock || {}, dynamicColumnsMhaBlock.settings || {});
  }, [dynamicColumnsMhaBlock, staticHomeColumnsById]);
  const columnsMathHudSettings = useMemo(() => {
    if (!dynamicColumnsMathBlock) {
      return {};
    }
    const baseBlock = staticHomeColumnsById.get('columns_math');
    return mergeHomeColumnsWithFallback(baseBlock || {}, dynamicColumnsMathBlock.settings || {});
  }, [dynamicColumnsMathBlock, staticHomeColumnsById]);
  const hudPanels = useMemo(
    () => buildHudPanelsFromBlocks(managedBlocks, {
      panelIdById: HOME_HUD_PANEL_ID_BY_BLOCK_ID,
      anchorSelectorById: HOME_HUD_ANCHOR_SELECTOR_BY_BLOCK_ID,
    }),
    [managedBlocks],
  );
  const routeLinkOptions = useMemo(
    () => Object.values(pageHierarchy || {})
      .filter((page) => page && page.path && !page.path.startsWith('/admin/') && page.path !== '/search')
      .sort((a, b) => a.path.localeCompare(b.path)),
    [pageHierarchy],
  );
  const activeHudPanel = useMemo(
    () => hudPanels.find((panel) => panel.id === activeHudPanelId) || null,
    [activeHudPanelId, hudPanels],
  );
  const hudAnchorPanelsByBlockId = useMemo(() => (
    hudPanels.reduce((next, panel) => {
      const blockId = String(panel?.blockId || '').trim();
      if (!blockId) {
        return next;
      }
      next[blockId] = {
        panelId: panel.id,
        label: panel.label,
        anchorSelector: panel.anchorSelector,
      };
      return next;
    }, {})
  ), [hudPanels]);
  const {
    orderedPanels: orderedHudPanels,
    getDockTabDragProps,
    isPanelDragging,
    isPanelDragOver,
    getPanelDropPosition,
    isDockDragging,
  } = useHudDockOrder({
    panels: hudPanels,
    storageKey: 'home',
  });
  const frontHudOpacityRatio = clampFrontHudOpacity(frontHudOpacity) / 100;
  const showFrontHud = frontHudEnabled && hudPanels.length > 0;
  const isMobileFrontHud = showFrontHud && isMobileFrontHudViewport;
  const hasOpenHudPanel = showFrontHud && !hudDockCollapsed && Boolean(activeHudPanelId);
  const getOwnershipVisualForBlockId = (blockId) => {
    if (!showFrontHud || !blockId) {
      return { className: '', overlayLabel: '', overlayDetail: '', state: 'none', isOwnedByOther: false };
    }
    return getBlockOwnershipVisual(getBlockCollaboration('/', blockId), devIdentity?.userId);
  };
  const homeHudFocusClass = hasOpenHudPanel && activeHudPanelId
    ? ` hud-focus-${activeHudPanelId}`
    : '';
  const mobileSelectedHudPanel = isMobileFrontHud && activeHudPanelId
    ? (hudPanels.find((panel) => panel.id === activeHudPanelId) || null)
    : null;
  const mobileSelectedHudBlock = mobileSelectedHudPanel?.block || null;
  const mobileSelectedHudBlockId = String(mobileSelectedHudBlock?.id || '').trim();
  const mobileSelectedHudBlockIndex = mobileSelectedHudBlockId
    ? managedBlocks.findIndex((block) => block.id === mobileSelectedHudBlockId)
    : -1;
  const canMoveMobileSelectedHudBlockUp = mobileSelectedHudBlockIndex > 0;
  const canMoveMobileSelectedHudBlockDown = mobileSelectedHudBlockIndex >= 0
    && mobileSelectedHudBlockIndex < managedBlocks.length - 1;

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const media = window.matchMedia(MOBILE_FRONT_HUD_MEDIA_QUERY);
    const syncMobileHudState = () => setIsMobileFrontHudViewport(media.matches);
    syncMobileHudState();
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', syncMobileHudState);
      return () => media.removeEventListener('change', syncMobileHudState);
    }
    media.addListener(syncMobileHudState);
    return () => media.removeListener(syncMobileHudState);
  }, []);

  useEffect(() => {
    if (!showFrontHud) {
      setHudDockCollapsed(true);
      setActiveHudPanelId('');
      setMobileHudMoreOpen(false);
      setMobileHudDeleteConfirmBlockId('');
    }
  }, [showFrontHud]);

  useEffect(() => {
    if (!pageRef.current) {
      return undefined;
    }

    const blockIds = hudPanels.map((panel) => String(panel?.blockId || '').trim()).filter(Boolean);
    blockIds.forEach((blockId) => {
      const target = pageRef.current?.querySelector(`[data-block-id="${blockId}"]`);
      if (!target) {
        return;
      }
      if (isMobileFrontHud) {
        target.setAttribute('data-mobile-front-hud-selectable', 'true');
        target.toggleAttribute('data-mobile-front-hud-selected', blockId === mobileSelectedHudBlockId);
      } else {
        target.removeAttribute('data-mobile-front-hud-selectable');
        target.removeAttribute('data-mobile-front-hud-selected');
      }
    });

    return () => {
      blockIds.forEach((blockId) => {
        const target = pageRef.current?.querySelector(`[data-block-id="${blockId}"]`);
        target?.removeAttribute('data-mobile-front-hud-selectable');
        target?.removeAttribute('data-mobile-front-hud-selected');
      });
    };
  }, [hudPanels, isMobileFrontHud, mobileSelectedHudBlockId]);

  useEffect(() => {
    if (!isMobileFrontHud || !mobileSelectedHudBlockId || hasOpenHudPanel) {
      setMobileHudMoreOpen(false);
      setMobileHudDeleteConfirmBlockId('');
    }
  }, [hasOpenHudPanel, isMobileFrontHud, mobileSelectedHudBlockId]);

  useEffect(() => {
    setShowReturnAssist(shouldShowHomeReturnAssist(location.pathname));
  }, [location.pathname]);

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

  const scrollToSelector = (selector) => {
    if (!selector || typeof document === 'undefined') {
      return;
    }
    const target = document.querySelector(selector);
    scrollToElement(target);
  };

  const setHudPanelOpen = (panelId, anchorSelector, options = {}) => {
    const shouldScroll = options.scrollToTarget !== false;
    setHudDockCollapsed(false);
    setActiveHudPanelId(panelId);
    if (!shouldScroll) {
      return;
    }
    if (panelId === HOME_TOP_STRIP_HUD_PANEL_ID) {
      scrollToSelector('[data-block-id="top_strip"]');
      return;
    }
    if (panelId === HOME_HERO_HUD_PANEL_ID) {
      scrollToElement(heroSectionRef.current);
      return;
    }
    scrollToSelector(anchorSelector);
  };

  const openHudPanel = (panelId, anchorSelector) => {
    if (!hudDockCollapsed && activeHudPanelId === panelId) {
      setHudDockCollapsed(true);
      setActiveHudPanelId('');
      return;
    }
    setHudPanelOpen(panelId, anchorSelector);
  };

  const closeHudDock = () => {
    setHudDockCollapsed(true);
    setActiveHudPanelId('');
  };
  const closeMobileHudPanel = () => {
    setHudDockCollapsed(true);
    setMobileHudMoreOpen(false);
    setMobileHudDeleteConfirmBlockId('');
  };
  const clearMobileHudSelection = () => {
    setHudDockCollapsed(true);
    setActiveHudPanelId('');
    setMobileHudMoreOpen(false);
    setMobileHudDeleteConfirmBlockId('');
  };
  const selectMobileHudPanel = (panelId) => {
    if (!isMobileFrontHud || !panelId) {
      return;
    }
    setActiveHudPanelId(panelId);
    setHudDockCollapsed(true);
    setMobileHudMoreOpen(false);
    setMobileHudDeleteConfirmBlockId('');
  };
  const handleMobilePageHudClickCapture = (event) => {
    if (!isMobileFrontHud || !showFrontHud || isMobileHudSelectionBlocked(event.target)) {
      return;
    }
    const blockNode = event.target instanceof Element
      ? event.target.closest('[data-block-id]')
      : null;
    const blockId = String(blockNode?.getAttribute('data-block-id') || '').trim();
    if (!blockId) {
      return;
    }
    const panel = hudAnchorPanelsByBlockId[blockId];
    if (!panel?.panelId) {
      return;
    }
    selectMobileHudPanel(panel.panelId);
  };
  const handleDismissReturnAssist = () => {
    dismissHomeReturnAssist();
    setShowReturnAssist(false);
  };

  const updateTopStripSetting = (settingKey, settingValue) => {
    if (!dynamicTopStripBlock) {
      return;
    }
    stageLocalBlockSetting(dynamicTopStripBlock.id, settingKey, settingValue);
  };
  const updateHeroSetting = (settingKey, settingValue) => {
    if (!dynamicHeroBlock) {
      return;
    }
    stageLocalBlockSetting(dynamicHeroBlock.id, settingKey, settingValue);
  };
  const updateHeroSettings = (settingsPatch) => {
    if (!dynamicHeroBlock) {
      return;
    }
    stageLocalBlockSettings(dynamicHeroBlock.id, settingsPatch);
  };
  const updateCtaSetting = (settingKey, settingValue) => {
    if (!dynamicCtaBlock) {
      return;
    }
    stageLocalBlockSetting(dynamicCtaBlock.id, settingKey, settingValue);
  };
  const updateColumnsSetting = (blockId, settingKey, settingValue) => {
    if (!blockId) {
      return;
    }
    stageLocalBlockSetting(blockId, settingKey, settingValue);
  };
  const handleMobileHudEdit = () => {
    if (!mobileSelectedHudPanel?.id) {
      return;
    }
    setHudPanelOpen(mobileSelectedHudPanel.id, mobileSelectedHudPanel.anchorSelector, { scrollToTarget: false });
  };
  const handleMobileHudMove = (direction) => {
    if (!mobileSelectedHudBlockId) {
      return;
    }
    moveBlock('/', mobileSelectedHudBlockId, direction);
  };
  const handleMobileHudToggleVisibility = () => {
    if (!mobileSelectedHudBlockId || !mobileSelectedHudBlock) {
      return;
    }
    updateBlock('/', mobileSelectedHudBlockId, {
      hidden: mobileSelectedHudBlock.hidden !== true && mobileSelectedHudBlock.hidden !== 'true',
    });
    setMobileHudMoreOpen(false);
    setMobileHudDeleteConfirmBlockId('');
  };
  const handleMobileHudDelete = () => {
    if (!mobileSelectedHudBlockId) {
      return;
    }
    if (mobileHudDeleteConfirmBlockId !== mobileSelectedHudBlockId) {
      setMobileHudDeleteConfirmBlockId(mobileSelectedHudBlockId);
      return;
    }
    removeBlock('/', mobileSelectedHudBlockId);
    clearMobileHudSelection();
  };

  const captureHeroSelection = (lineKey, interactionMeta = null) => {
    const commitHeroSelection = (nextSelection) => {
      const normalizedSelection = nextSelection && typeof nextSelection === 'object'
        ? nextSelection
        : { line: '', start: 0, end: 0, text: '' };
      setHeroSelection((previous) => (
        previous.line === normalizedSelection.line
        && previous.start === normalizedSelection.start
        && previous.end === normalizedSelection.end
        && previous.text === normalizedSelection.text
          ? previous
          : normalizedSelection
      ));
    };
    const meta = interactionMeta && typeof interactionMeta === 'object' ? interactionMeta : null;
    const metaStart = Number(meta?.selectionStart);
    const metaEnd = Number(meta?.selectionEnd);
    const metaValue = String(meta?.value || '');
    if (Number.isInteger(metaStart) && Number.isInteger(metaEnd)) {
      const start = Math.max(0, Math.min(metaStart, metaEnd));
      const end = Math.max(start, metaStart, metaEnd);
      commitHeroSelection({
        line: lineKey,
        start,
        end,
        text: metaValue.slice(start, end),
      });
      return;
    }
    const input = heroLineInputRefs.current[lineKey];
    if (!input) {
      return;
    }
    const rawStart = Number(input.selectionStart);
    const rawEnd = Number(input.selectionEnd);
    if (!Number.isInteger(rawStart) || !Number.isInteger(rawEnd)) {
      return;
    }
    const start = Math.max(0, Math.min(rawStart, rawEnd));
    const end = Math.max(start, rawStart, rawEnd);
    const lineText = String(input.value || '');
    commitHeroSelection({
      line: lineKey,
      start,
      end,
      text: lineText.slice(start, end),
    });
  };

  const handleHeroHudLineTextChange = (lineKey, value) => {
    if (isForeignOwnedBlockOwnership(getOwnershipVisualForBlockId('hero'))) {
      return;
    }
    const normalizedLineKey = lineKey === 'line2' || lineKey === 'line3' ? lineKey : 'line1';
    const nextText = String(value || '');
    if (/[\r\n]/.test(nextText)) {
      const segmentsRaw = nextText
        .replaceAll('\r', '')
        .split('\n');
      const startIndex = HOME_HERO_LINE_KEYS.indexOf(normalizedLineKey);
      const destinationKeys = startIndex >= 0 ? HOME_HERO_LINE_KEYS.slice(startIndex) : [normalizedLineKey];
      const segments = destinationKeys.map((_, index) => {
        if (!segmentsRaw.length) {
          return '';
        }
        if (index === destinationKeys.length - 1 && segmentsRaw.length > destinationKeys.length) {
          return segmentsRaw.slice(index).join(' ').trim();
        }
        return String(segmentsRaw[index] || '').trim();
      });
      destinationKeys.forEach((key, index) => {
        updateHeroSettings({
          [`${key}Text`]: segments[index] || '',
          [`${key}HighlightsJson`]: '',
        });
      });
      setHeroSelection((previous) => (
        destinationKeys.includes(previous.line)
          ? { line: normalizedLineKey, start: 0, end: 0, text: '' }
          : previous
      ));
      return;
    }
    const previousText = String(
      heroHudEditableLines.find((line) => line.key === normalizedLineKey)?.text
      || heroHudSettings[`${normalizedLineKey}Text`]
      || '',
    );
    updateHeroSettings({
      [`${normalizedLineKey}Text`]: nextText,
      [`${normalizedLineKey}HighlightsJson`]: remapHighlightsJsonForTextChange(
        heroHudSettings[`${normalizedLineKey}HighlightsJson`],
        previousText,
        nextText,
      ),
    });
    setHeroSelection((previous) => (
      previous.line === normalizedLineKey
        ? { line: normalizedLineKey, start: 0, end: 0, text: '' }
        : previous
    ));
  };

  const handleHeroLineInteract = (lineKey, interactionMeta) => {
    setHeroActiveLine(lineKey);
    setHudPanelOpen(HOME_HERO_HUD_PANEL_ID, '[data-block-id="hero"]', { scrollToTarget: false });
    captureHeroSelection(lineKey, interactionMeta);
  };

  const applyHeroLineColor = (lineKey, colorValue) => {
    const normalizedLineKey = lineKey === 'line2' || lineKey === 'line3' ? lineKey : 'line1';
    const classNameKey = `${normalizedLineKey}ClassName`;
    const currentClassName = String(
      heroHudEditableLines.find((line) => line.key === normalizedLineKey)?.className
      || heroHudSettings[classNameKey]
      || HOME_HERO_LINE_CLASSNAME_FALLBACK[normalizedLineKey]
      || normalizedLineKey,
    ).trim() || HOME_HERO_LINE_CLASSNAME_FALLBACK[normalizedLineKey] || normalizedLineKey;
    updateHeroSetting(classNameKey, replaceHeroLineColorClass(currentClassName, colorValue));
  };

  const applyHeroSelectionColor = (lineKey, colorValue) => {
    const normalizedLineKey = lineKey === 'line2' || lineKey === 'line3' ? lineKey : 'line1';
    const lineText = String(
      heroHudEditableLines.find((line) => line.key === normalizedLineKey)?.text
      || heroHudSettings[`${normalizedLineKey}Text`]
      || '',
    );
    const safeStart = Math.max(0, Math.min(Number(heroSelection.start) || 0, lineText.length));
    const safeEnd = Math.max(safeStart, Math.min(Number(heroSelection.end) || 0, lineText.length));
    if (safeEnd <= safeStart) {
      return;
    }
    const highlightsKey = `${normalizedLineKey}HighlightsJson`;
    updateHeroSetting(
      highlightsKey,
      applySelectionColor(
        heroHudSettings[highlightsKey],
        lineText,
        safeStart,
        safeEnd,
        colorValue,
      ),
    );
  };

  const removeHeroSpan = (lineKey, index) => {
    const normalizedLineKey = lineKey === 'line2' || lineKey === 'line3' ? lineKey : 'line1';
    const lineText = String(
      heroHudEditableLines.find((line) => line.key === normalizedLineKey)?.text
      || heroHudSettings[`${normalizedLineKey}Text`]
      || '',
    );
    const highlightsKey = `${normalizedLineKey}HighlightsJson`;
    updateHeroSetting(
      highlightsKey,
      removeSelectionRange(
        heroHudSettings[highlightsKey],
        lineText,
        index,
      ),
    );
  };

  const clearHeroLineSpans = (lineKey) => {
    const normalizedLineKey = lineKey === 'line2' || lineKey === 'line3' ? lineKey : 'line1';
    updateHeroSetting(`${normalizedLineKey}HighlightsJson`, '');
    setHeroSelection((previous) => (
      previous.line === normalizedLineKey
        ? { line: normalizedLineKey, start: 0, end: 0, text: '' }
        : previous
    ));
  };

  const captureCtaTitleSelection = () => {
    const input = ctaTitleInputRef.current;
    if (!input) {
      return;
    }
    const rawStart = Number(input.selectionStart);
    const rawEnd = Number(input.selectionEnd);
    if (!Number.isInteger(rawStart) || !Number.isInteger(rawEnd)) {
      return;
    }
    const start = Math.max(0, Math.min(rawStart, rawEnd));
    const end = Math.max(start, Math.max(rawStart, rawEnd));
    const text = String(input.value || '').slice(start, end);
    setCtaTitleSelection({ start, end, text });
  };

  const topStripHudSettings = dynamicTopStripBlock?.settings && typeof dynamicTopStripBlock.settings === 'object'
    ? dynamicTopStripBlock.settings
    : {};
  const heroInspection = useMemo(
    () => inspectDynamicHeroSettings('/', dynamicHeroBlock?.settings),
    [dynamicHeroBlock],
  );
  const heroHudSettings = heroInspection.normalizedSettings;
  const ctaHudSettings = dynamicCtaBlock?.settings && typeof dynamicCtaBlock.settings === 'object'
    ? dynamicCtaBlock.settings
    : {};
  const heroHudLine1Value = String(
    heroHudSettings.line1Text
    || heroHudSettings.eyebrow
    || [heroHudSettings.eyebrowPrefix, heroHudSettings.highlight].filter(Boolean).join(' '),
  ).trim();
  const heroHudLine2Value = String(
    heroHudSettings.line2Text
    || heroHudSettings.title
    || [heroHudSettings.titlePrefix, heroHudSettings.accentWord].filter(Boolean).join(' '),
  ).trim();
  const heroHudCtaLabel = String(heroHudSettings.button1Label || heroHudSettings.ctaLabel || '').trim();
  const heroHudCtaTarget = String(
    heroHudSettings.button1PageRef
    || heroHudSettings.button1Url
    || heroHudSettings.ctaPath
    || '',
  ).trim();
  const heroHudLine3Value = String(heroHudSettings.line3Text || '').trim();
  const heroHudLineHeight = Number.isFinite(Number(heroHudSettings.lineHeight))
    ? Number(heroHudSettings.lineHeight)
    : 0.9;
  const heroHudBgTone = String(heroHudSettings.bgTone || 'white').trim() || 'white';
  const heroHudJustify = String(heroHudSettings.justify || 'left').trim().toLowerCase() || 'left';
  const heroHudEditableLines = useMemo(() => {
    const legacyLine1Highlight = String(heroHudSettings.highlight || '').trim() || 'investment';
    const legacyLine2Highlight = String(heroHudSettings.accentWord || '').trim() || 'church';
    const candidateLines = [1, 2, 3].map((lineNumber) => {
      const lineKey = `line${lineNumber}`;
      const fallbackText = lineNumber === 1
        ? heroHudLine1Value
        : lineNumber === 2
          ? heroHudLine2Value
          : heroHudLine3Value;
      const text = String((heroHudSettings[`${lineKey}Text`] ?? fallbackText) || '');
      const classNameFallback = lineNumber === 1
        ? 'home-native-eyebrow'
        : lineNumber === 2
          ? 'home-native-title line1 line2'
          : 'home-native-title line3';
      const className = String(heroHudSettings[`${lineKey}ClassName`] || classNameFallback).trim() || classNameFallback;
      let highlights = parseHeroRangeHighlights(heroHudSettings[`${lineKey}HighlightsJson`], text);

      if (!highlights.length && lineNumber === 1 && legacyLine1Highlight) {
        highlights = parseHeroRangeHighlights(
          JSON.stringify([{ text: legacyLine1Highlight, className: 'is-atlantean' }]),
          text,
        );
      }
      if (!highlights.length && lineNumber === 2 && legacyLine2Highlight) {
        highlights = parseHeroRangeHighlights(
          JSON.stringify([{ text: legacyLine2Highlight, className: 'is-mango' }]),
          text,
        );
      }

      return {
        key: lineKey,
        label: `Line ${lineNumber}`,
        text,
        className,
        lineColor: extractHeroLineColorToken(className),
        highlights,
      };
    });

    const withText = candidateLines.filter((line) => String(line.text || '').trim());
    return withText.length ? withText : candidateLines.slice(0, 1);
  }, [
    heroHudLine1Value,
    heroHudLine2Value,
    heroHudLine3Value,
    heroHudSettings.accentWord,
    heroHudSettings.highlight,
    heroHudSettings.line1ClassName,
    heroHudSettings.line1HighlightsJson,
    heroHudSettings.line1Text,
    heroHudSettings.line2ClassName,
    heroHudSettings.line2HighlightsJson,
    heroHudSettings.line2Text,
    heroHudSettings.line3ClassName,
    heroHudSettings.line3HighlightsJson,
    heroHudSettings.line3Text,
  ]);
  const ctaHudBgTone = String(ctaHudSettings.bgTone || 'white').trim().toLowerCase() || 'white';
  const ctaHudTitleColor = extractHeroLineColorToken(String(ctaHudSettings.titleClassName || '').trim());
  const ctaHudSubmitStyle = normalizeCtaHudSubmitStyle(ctaHudSettings.submitStyle);
  const ctaHudSubmitTone = normalizeCtaHudSubmitTone(ctaHudSettings.submitTone, ctaHudSubmitStyle);
  const heroActiveLineData = heroHudEditableLines.find((line) => line.key === heroActiveLine) || heroHudEditableLines[0] || null;

  useEffect(() => {
    logHeroDriftWarningOnce(heroInspection, 'Home hero');
  }, [heroInspection]);

  const blocks = useMemo(() => {
    const impactStatManagedBlock = dynamicImpactStatBlock;
    const homeImpactStoryManagedBlock = dynamicHomeImpactStoryBlock;
    const homeServicesFeatureManagedBlock = managedHomeServicesFeatureBlock;
    const homeServicesFeatureIsActive = Boolean(dynamicHomeServicesFeatureBlock || !homeServicesFeatureManagedBlock);
    const newsletterManagedBlock = dynamicNewsletterBlock;
    const servicesGridManagedBlock = dynamicServicesGridBlock;
    const topStripManagedBlock = dynamicTopStripBlock;
    const heroManagedBlock = managedHeroBlock;
    const ctaManagedBlock = dynamicCtaBlock;
    const columnsMhaBlock = dynamicColumnsMhaBlock;
    const columnsMathBlock = dynamicColumnsMathBlock;

    const topStripSettings = topStripManagedBlock?.settings && typeof topStripManagedBlock.settings === 'object'
      ? topStripManagedBlock.settings
      : null;

    const newsletterSettings = newsletterManagedBlock?.settings && typeof newsletterManagedBlock.settings === 'object'
      ? newsletterManagedBlock.settings
      : null;
    const impactStatSettings = impactStatManagedBlock?.settings && typeof impactStatManagedBlock.settings === 'object'
      ? impactStatManagedBlock.settings
      : null;
    const homeServicesFeatureSettings = homeServicesFeatureManagedBlock?.settings
      && typeof homeServicesFeatureManagedBlock.settings === 'object'
      ? homeServicesFeatureManagedBlock.settings
      : null;
    const homeImpactStorySettings = homeImpactStoryManagedBlock?.settings && typeof homeImpactStoryManagedBlock.settings === 'object'
      ? homeImpactStoryManagedBlock.settings
      : null;
    const servicesGridSettings = servicesGridManagedBlock?.settings && typeof servicesGridManagedBlock.settings === 'object'
      ? servicesGridManagedBlock.settings
      : null;

    const ctaSettings = ctaManagedBlock?.settings && typeof ctaManagedBlock.settings === 'object'
      ? ctaManagedBlock.settings
      : null;
    const heroSettings = heroManagedBlock?.settings && typeof heroManagedBlock.settings === 'object'
      ? normalizeDynamicHeroSettings('/', heroManagedBlock.settings)
      : null;
    const columnsMhaSettings = columnsMhaBlock?.settings && typeof columnsMhaBlock.settings === 'object'
      ? columnsMhaBlock.settings
      : null;
    const columnsMathSettings = columnsMathBlock?.settings && typeof columnsMathBlock.settings === 'object'
      ? columnsMathBlock.settings
      : null;

    const resolvedBlocks = homePageBlocks.map((block) => {
      if (block.type === 'site_feature' && block.id === 'home_services_feature_animation') {
        return {
          ...block,
          id: homeServicesFeatureManagedBlock?.id || block.id || 'home_services_feature_animation',
          kind: homeServicesFeatureManagedBlock?.kind || block.kind || 'site_feature',
          mode: homeServicesFeatureIsActive ? 'dynamic' : (homeServicesFeatureManagedBlock?.mode || block.mode || 'static'),
          settings: homeServicesFeatureSettings
            ? {
                featureId: String(homeServicesFeatureSettings.featureId || block.featureId || 'home_services_feature_animation').trim() || 'home_services_feature_animation',
                headline: String(homeServicesFeatureSettings.headline ?? block.headline ?? '').trim(),
              }
            : {
                featureId: String(block.featureId || 'home_services_feature_animation').trim() || 'home_services_feature_animation',
                headline: String(block.headline || '').trim(),
              },
        };
      }

      if (block.type === 'newsletter' && newsletterSettings) {
        const fallbackTitle = String(
          block.title || [block.headingPrefix, block.headingHighlight].filter(Boolean).join(' '),
        ).trim();
        const fallbackBodyHtml = hasReadableHtmlContent(block.bodyHtml)
          ? String(block.bodyHtml || '').trim()
          : (block.body ? `<p>${block.body}</p>` : '');
        const nextTitle = String(newsletterSettings.title || '').trim() || fallbackTitle;
        const nextBodyText = String(newsletterSettings.body || block.body || '').trim();
        const rawBodyHtml = String(newsletterSettings.bodyHtml || '').trim();
        const nextBodyHtml = hasReadableHtmlContent(rawBodyHtml)
          ? rawBodyHtml
          : (nextBodyText ? `<p>${nextBodyText}</p>` : fallbackBodyHtml);
        return {
          ...block,
          id: newsletterManagedBlock?.id || block.id || 'newsletter',
          kind: newsletterManagedBlock?.kind || block.kind || 'newsletter',
          mode: newsletterManagedBlock?.mode || block.mode || 'static',
          title: nextTitle,
          titleClassName: String(newsletterSettings.titleClassName || block.titleClassName || '').trim(),
          titleHighlightsJson: String(newsletterSettings.titleHighlightsJson || block.titleHighlightsJson || '').trim(),
          bodyHtml: nextBodyHtml,
          body: nextBodyText || String(block.body || '').trim(),
          bgTone: String(newsletterSettings.bgTone || block.bgTone || 'grey').trim() || 'grey',
          textTone: String(newsletterSettings.textTone || block.textTone || 'white').trim() || 'white',
          formId: String(newsletterSettings.formId || block.formId || HOME_NEWSLETTER_FORM_ID).trim() || HOME_NEWSLETTER_FORM_ID,
          accountId: String(newsletterSettings.accountId || block.accountId || '').trim(),
          sourceId: String(newsletterSettings.sourceId || block.sourceId || '').trim(),
        };
      }

      if (block.type === 'top_strip' && topStripSettings) {
        return {
          ...block,
          id: topStripManagedBlock?.id || block.id || 'top_strip',
          kind: topStripManagedBlock?.kind || block.kind || 'top_strip',
          mode: topStripManagedBlock?.mode || block.mode || 'static',
          ...topStripSettings,
          __hudAnchorId: 'home-top-strip',
          ratesButtonTone: String(topStripSettings.ratesButtonTone || '').trim() || 'mango',
        };
      }

      if (block.type === 'services_grid' && servicesGridSettings) {
        if (homeServicesFeatureIsActive) {
          return null;
        }
        return {
          ...block,
          id: servicesGridManagedBlock?.id || block.id || 'services_grid',
          kind: servicesGridManagedBlock?.kind || block.kind || 'services_grid',
          mode: servicesGridManagedBlock?.mode || block.mode || 'static',
          settings: servicesGridSettings,
        };
      }

      if (block.type === 'services_grid' && homeServicesFeatureIsActive) {
        return null;
      }

      if (block.type === 'impact_stat' && impactStatSettings) {
        return {
          ...block,
          id: impactStatManagedBlock?.id || block.id || 'impact_stat',
          kind: impactStatManagedBlock?.kind || block.kind || 'impact_stat',
          mode: impactStatManagedBlock?.mode || block.mode || 'static',
          settings: impactStatSettings,
        };
      }

      if (block.type === 'site_feature' && block.id === 'home_impact_story') {
        return {
          ...block,
          id: homeImpactStoryManagedBlock?.id || block.id || 'home_impact_story',
          kind: homeImpactStoryManagedBlock?.kind || block.kind || 'site_feature',
          mode: homeImpactStoryManagedBlock?.mode || block.mode || 'dynamic',
          settings: homeImpactStorySettings
            ? {
                featureId: String(homeImpactStorySettings.featureId || block.featureId || 'home_impact_story').trim() || 'home_impact_story',
                headline: String(homeImpactStorySettings.headline ?? block.headline ?? '').trim(),
                body: String(homeImpactStorySettings.body ?? block.body ?? '').trim(),
                buttonLabel: String(homeImpactStorySettings.buttonLabel ?? block.buttonLabel ?? '').trim(),
                buttonUrl: String(homeImpactStorySettings.buttonUrl ?? block.buttonUrl ?? '').trim(),
                buttonPageRef: String(homeImpactStorySettings.buttonPageRef ?? block.buttonPageRef ?? '').trim(),
                buttonOpenInNewWindow: Boolean(homeImpactStorySettings.buttonOpenInNewWindow ?? false),
              }
            : undefined,
        };
      }

      if (block.type === 'cta_form' && ctaSettings) {
        const readCtaSetting = (...keys) => {
          for (let index = 0; index < keys.length; index += 1) {
            const key = keys[index];
            if (Object.prototype.hasOwnProperty.call(ctaSettings, key)) {
              return ctaSettings[key];
            }
          }
          return undefined;
        };
        const fallbackLegacyTitle = [
          String(block.headingPrefix || '').trim(),
          String(block.headingHighlight || '').trim(),
          String(block.headingSuffix || '').trim(),
        ].filter(Boolean).join(' ').trim();
        const fallbackLegacyHighlight = String(block.headingHighlight || '').trim();
        const fallbackLegacyHighlightsJson = fallbackLegacyHighlight
          ? JSON.stringify([{ text: fallbackLegacyHighlight, className: 'is-atlantean' }])
          : '';
        const noteText = String(ctaSettings.note || block.note || '').trim();
        const fallbackBodyHtml = noteText ? `<p>${noteText}</p>` : '';

        return {
          ...block,
          id: ctaManagedBlock?.id || block.id || 'cta_form',
          kind: ctaManagedBlock?.kind || block.kind || 'cta_form',
          mode: ctaManagedBlock?.mode || block.mode || 'static',
          title: String(
            readCtaSetting('title') ?? block.title ?? fallbackLegacyTitle,
          ).trim(),
          titleClassName: String(readCtaSetting('titleClassName') ?? block.titleClassName ?? '').trim(),
          titleHighlightsJson: String(
            readCtaSetting('titleHighlightsJson') ?? block.titleHighlightsJson ?? fallbackLegacyHighlightsJson,
          ).trim(),
          subtitle: String(
            readCtaSetting('subtitle') ?? block.subtitle ?? '',
          ).trim(),
          bodyHtml: String(
            readCtaSetting('bodyHtml') ?? block.bodyHtml ?? fallbackBodyHtml,
          ).trim(),
          bgTone: 'white',
          submitStyle: String(
            readCtaSetting('submitStyle')
            || block.submitStyle
            || 'blue',
          ).trim().toLowerCase() || 'blue',
          submitTone: String(
            readCtaSetting('submitTone') ?? block.submitTone ?? '',
          ).trim().toLowerCase(),
          submitLabel: String(
            readCtaSetting('submitLabel', 'buttonLabel')
            || block.submitLabel
            || block.buttonLabel
            || 'Follow-up with me',
          ).trim() || 'Follow-up with me',
          salesforceUrl: String(readCtaSetting('salesforceUrl') ?? block.salesforceUrl ?? '').trim(),
          successMessage: String(readCtaSetting('successMessage') ?? block.successMessage ?? '').trim() || block.successMessage,
          field1Enabled: ctaSettings.field1Enabled ?? block.field1Enabled,
          field1Type: String(readCtaSetting('field1Type') ?? block.field1Type ?? '').trim() || block.field1Type,
          field1Label: String(readCtaSetting('field1Label') ?? block.field1Label ?? '').trim() || block.field1Label,
          field1Placeholder: String(
            readCtaSetting('field1Placeholder')
            || block.field1Placeholder
            || '',
          ).trim(),
          field1Options: String(readCtaSetting('field1Options') ?? block.field1Options ?? '').trim(),
          field1Required: ctaSettings.field1Required ?? block.field1Required,
          field2Enabled: ctaSettings.field2Enabled ?? block.field2Enabled,
          field2Type: String(readCtaSetting('field2Type') ?? block.field2Type ?? '').trim() || block.field2Type,
          field2Label: String(readCtaSetting('field2Label') ?? block.field2Label ?? '').trim() || block.field2Label,
          field2Placeholder: String(
            readCtaSetting('field2Placeholder')
            || block.field2Placeholder
            || '',
          ).trim(),
          field2Options: String(readCtaSetting('field2Options') ?? block.field2Options ?? '').trim(),
          field2Required: ctaSettings.field2Required ?? block.field2Required,
          field3Enabled: ctaSettings.field3Enabled ?? block.field3Enabled,
          field3Type: String(readCtaSetting('field3Type') ?? block.field3Type ?? '').trim() || block.field3Type,
          field3Label: String(readCtaSetting('field3Label') ?? block.field3Label ?? '').trim() || block.field3Label,
          field3Placeholder: String(
            readCtaSetting('field3Placeholder', 'phonePlaceholder')
            || block.field3Placeholder
            || block.phonePlaceholder
            || '(555) 555-5555',
          ).trim(),
          field3Options: String(readCtaSetting('field3Options') ?? block.field3Options ?? '').trim(),
          field3Required: ctaSettings.field3Required ?? block.field3Required,
          field4Enabled: ctaSettings.field4Enabled ?? block.field4Enabled,
          field4Type: String(readCtaSetting('field4Type') ?? block.field4Type ?? '').trim() || block.field4Type,
          field4Label: String(readCtaSetting('field4Label') ?? block.field4Label ?? '').trim() || block.field4Label,
          field4Placeholder: String(
            readCtaSetting('field4Placeholder', 'messagePlaceholder')
            || block.field4Placeholder
            || block.messagePlaceholder
            || 'What would you like to discuss?',
          ).trim(),
          field4Options: String(readCtaSetting('field4Options') ?? block.field4Options ?? '').trim(),
          field4Required: ctaSettings.field4Required ?? block.field4Required,
        };
      }

      if (block.type === 'hero' && heroSettings) {
        return {
          ...block,
          ...heroSettings,
          id: 'hero',
          kind: 'hero',
          mode: heroManagedBlock?.mode || block.mode || 'dynamic',
        };
      }

      if (block.id === 'columns_mha') {
        if (columnsMhaSettings) {
          return {
            id: columnsMhaBlock?.id || block.id || 'columns_mha',
            kind: columnsMhaBlock?.kind || block.kind || 'columns',
            mode: columnsMhaBlock?.mode || 'dynamic',
            settings: mergeHomeColumnsWithFallback(block, columnsMhaSettings),
          };
        }
      }

      if (block.id === 'columns_math') {
        if (columnsMathSettings) {
          return {
            id: columnsMathBlock?.id || block.id || 'columns_math',
            kind: columnsMathBlock?.kind || block.kind || 'columns',
            mode: columnsMathBlock?.mode || 'dynamic',
            settings: mergeHomeColumnsWithFallback(block, columnsMathSettings),
          };
        }
      }

      return block;
    }).filter(Boolean);

    const resolvedBlockIds = new Set(
      resolvedBlocks
        .map((block) => String(block?.id || '').trim())
        .filter(Boolean),
    );
    const extraRenderableManagedBlocks = managedBlocks.filter((block) => {
      if (!isManagedBlockVisible(block)) {
        return false;
      }
      if (String(block?.mode || '').trim().toLowerCase() !== 'dynamic') {
        return false;
      }
      const kind = String(block?.kind || block?.type || '').trim().toLowerCase();
      if (!HOME_EXTRA_RENDERABLE_DYNAMIC_KINDS.has(kind)) {
        return false;
      }
      const blockId = String(block?.id || '').trim();
      return !blockId || !resolvedBlockIds.has(blockId);
    });

    return resolvedBlocks.concat(extraRenderableManagedBlocks);
  }, [
    dynamicHomeServicesFeatureBlock,
    dynamicColumnsMathBlock,
    dynamicColumnsMhaBlock,
    dynamicCtaBlock,
    dynamicHeroBlock,
    dynamicHomeImpactStoryBlock,
    dynamicImpactStatBlock,
    managedHomeServicesFeatureBlock,
    managedBlocks,
    dynamicNewsletterBlock,
    dynamicServicesGridBlock,
    dynamicTopStripBlock,
  ]);
  const heroBlockIndex = useMemo(
    () => blocks.findIndex((block) => {
      const kind = String(block?.kind || block?.type || '').trim().toLowerCase();
      return kind === 'hero';
    }),
    [blocks],
  );
  const blocksThroughHero = useMemo(
    () => (heroBlockIndex >= 0 ? blocks.slice(0, heroBlockIndex + 1) : []),
    [blocks, heroBlockIndex],
  );
  const blocksAfterHero = useMemo(
    () => (heroBlockIndex >= 0 ? blocks.slice(heroBlockIndex + 1) : blocks),
    [blocks, heroBlockIndex],
  );
  const nativeEnhancementsKey = useMemo(
    () => blocks.map((block) => `${String(block?.id || block?.type || '')}:${String(block?.mode || 'static')}`).join('|'),
    [blocks],
  );
  useNativeEnhancements(pageRef, nativeEnhancementsKey);

  const homeColumnsDiagnostics = useMemo(() => {
    const renderedColumns = blocks.filter((block) => block?.id === 'columns_mha' || block?.id === 'columns_math');
    return {
      managed: {
        columns_mha: summarizeHomeColumnsBlock(managedHomeColumnsById.get('columns_mha') || null),
        columns_math: summarizeHomeColumnsBlock(managedHomeColumnsById.get('columns_math') || null),
      },
      renderedIds: renderedColumns.map((block) => String(block?.id || '').trim()),
      renderedCount: renderedColumns.length,
    };
  }, [blocks, managedHomeColumnsById]);
  const showHomeColumnsDebug = useMemo(() => {
    const isMissingExpectedColumns = homeColumnsDiagnostics.renderedCount < 2;
    const hasBrokenManagedLayout = ['columns_mha', 'columns_math'].some((blockId) => {
      const summary = homeColumnsDiagnostics.managed[blockId];
      if (!summary) {
        return false;
      }
      if (summary.hidden === true || summary.hidden === 'true') {
        return false;
      }
      return !summary.hasRenderableLayout;
    });
    return import.meta.env.DEV && (isMissingExpectedColumns || hasBrokenManagedLayout);
  }, [homeColumnsDiagnostics]);

  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === 'undefined') {
      return;
    }

    window.__agfHomeColumnsDebug = homeColumnsDiagnostics;

    if (showHomeColumnsDebug) {
      console.warn('Home columns drift detected.', homeColumnsDiagnostics);
    }
  }, [homeColumnsDiagnostics, showHomeColumnsDebug]);

  useEffect(() => {
    if (!import.meta.env.DEV || !pageRef.current) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      const report = inspectHeroRender(pageRef.current, '/');
      logHeroRenderWarningOnce(report, 'Home hero');
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [blocks]);

  const isHeroHudEditing = shouldRenderHeroInlineEditor({
    hudEnabled: showFrontHud && !isMobileFrontHud,
    hasDynamicHero: Boolean(dynamicHeroBlock),
    activeHudPanelId: hasOpenHudPanel ? activeHudPanel?.id : '',
    heroHudPanelId: HOME_HERO_HUD_PANEL_ID,
  });
  const homeHeroHudConfig = isHeroHudEditing ? {
    isEditing: true,
    activeLineKey: heroActiveLine,
    sectionRef: heroSectionRef,
    onLineTextChange: handleHeroHudLineTextChange,
    commitOnBlurOnly: true,
    onLineInteract: handleHeroLineInteract,
    setLineInputRef: (lineKey, node) => {
      heroLineInputRefs.current[lineKey] = node;
    },
  } : null;

  return (
    <div
      ref={pageRef}
      className={`home-native-page${showFrontHud ? ' is-front-hud-docked' : ''}${hasOpenHudPanel ? ' has-active-front-hud-panel' : ''}${homeHudFocusClass}${isMobileFrontHud ? ' is-mobile-front-hud' : ''}${isMobileFrontHud && mobileSelectedHudPanel && hudDockCollapsed ? ' has-mobile-selected-front-hud' : ''}`}
      onClickCapture={isMobileFrontHud ? handleMobilePageHudClickCapture : undefined}
    >
      {showHomeColumnsDebug ? (
        <pre
          style={{
            position: 'fixed',
            left: '12px',
            bottom: '12px',
            zIndex: 9999,
            width: 'min(560px, calc(100% - 24px))',
            maxWidth: 'calc(100% - 24px)',
            maxHeight: '40vh',
            overflow: 'auto',
            boxSizing: 'border-box',
            margin: 0,
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'rgba(20, 28, 36, 0.92)',
            color: '#f3f7fb',
            fontSize: '12px',
            lineHeight: 1.45,
            boxShadow: '0 18px 40px rgba(0, 0, 0, 0.28)',
          }}
        >
          {JSON.stringify(homeColumnsDiagnostics, null, 2)}
        </pre>
      ) : null}
      {showFrontHud && !isMobileFrontHud ? (
        <aside className={`admin-front-hud-dock${hudDockCollapsed ? ' is-collapsed' : ''}`} aria-label="Front HUD editor panels">
          <div className={`admin-front-hud-dock-tabs${isDockDragging ? ' is-drag-active' : ''}`}>
            {orderedHudPanels.map((panel) => (
              <button
                key={panel.id}
                type="button"
                className={`admin-front-hud-dock-tab${!hudDockCollapsed && activeHudPanel?.id === panel.id ? ' is-active' : ''}${isPanelDragging(panel.id) ? ' is-dragging' : ''}${isPanelDragOver(panel.id) ? ' is-drag-over' : ''}${getPanelDropPosition(panel.id) ? ` is-drop-${getPanelDropPosition(panel.id)}` : ''}`}
                onClick={() => openHudPanel(panel.id, panel.anchorSelector)}
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
            {!hudDockCollapsed ? (
              <button
                type="button"
                className="admin-front-hud-dock-collapse"
                onClick={closeHudDock}
                aria-label="Hide panels"
                title="Hide panels"
              >
                ×
              </button>
            ) : null}
          </div>
        </aside>
      ) : null}
      {showFrontHud ? (
        <FrontHudPageWorkflow pathname="/" reviewHref="/admin/content?page=%2F" placement="bar" />
      ) : null}

      {hasOpenHudPanel && activeHudPanel ? (
        <FrontHudPanelShell
          title={activeHudPanel.label}
          onClose={isMobileFrontHud ? closeMobileHudPanel : closeHudDock}
          className={isMobileFrontHud ? 'is-mobile-sheet' : ''}
          draggable={!isMobileFrontHud}
          isMobileSheet={isMobileFrontHud}
          style={{ '--ag-admin-front-hud-opacity': String(frontHudOpacityRatio) }}
        >
          <BlockHudPanelHost
            block={activeHudPanel.block}
            pathname="/"
            routeOptions={routeLinkOptions}
            ownership={getOwnershipVisualForBlockId(activeHudPanel.block.id)}
            onOwnershipAction={() => {
              if (!activeHudPanel?.block?.id) {
                return;
              }
              setActiveBlockLock('/', activeHudPanel.block.id, { force: true });
            }}
            onSettingChange={(settingKey, nextValue) => stageLocalBlockSetting(activeHudPanel.block.id, settingKey, nextValue)}
          />
        </FrontHudPanelShell>
      ) : null}

      {blocksThroughHero.length ? (
        <PageBlocksRenderer
          blocks={blocksThroughHero}
          heroHud={homeHeroHudConfig}
          ownershipEnabled={showFrontHud}
          hudAnchorsByBlockId={showFrontHud && !isMobileFrontHud ? hudAnchorPanelsByBlockId : null}
          activeHudPanelId={activeHudPanelId}
          hudDockCollapsed={hudDockCollapsed}
          hudOpacityRatio={frontHudOpacityRatio}
          onHudAnchorClick={showFrontHud && !isMobileFrontHud ? openHudPanel : null}
        />
      ) : null}

      {showReturnAssist ? (
        <section className="home-return-assist" aria-label="Return assist">
          <ResourcesProvider>
            <div className="home-return-assist-panel">
              <div className="home-return-assist-search-shell">
                <HomeReturnAssistSearchPanel />
              </div>
              <button
                type="button"
                className="home-return-assist-dismiss"
                onClick={handleDismissReturnAssist}
                aria-label="Dismiss return assist"
              >
                ×
              </button>
            </div>
          </ResourcesProvider>
        </section>
      ) : null}

      {blocksAfterHero.length ? (
        <PageBlocksRenderer
          blocks={blocksAfterHero}
          heroHud={null}
          ownershipEnabled={showFrontHud}
          hudAnchorsByBlockId={showFrontHud && !isMobileFrontHud ? hudAnchorPanelsByBlockId : null}
          activeHudPanelId={activeHudPanelId}
          hudDockCollapsed={hudDockCollapsed}
          hudOpacityRatio={frontHudOpacityRatio}
          onHudAnchorClick={showFrontHud && !isMobileFrontHud ? openHudPanel : null}
        />
      ) : null}
      {isMobileFrontHud && mobileSelectedHudPanel && hudDockCollapsed ? (
        <MobileFrontHudActionTray
          blockLabel={mobileSelectedHudPanel.label}
          isHidden={mobileSelectedHudBlock?.hidden === true || mobileSelectedHudBlock?.hidden === 'true'}
          canMoveUp={canMoveMobileSelectedHudBlockUp}
          canMoveDown={canMoveMobileSelectedHudBlockDown}
          isMoreOpen={mobileHudMoreOpen}
          isDeleteConfirming={mobileHudDeleteConfirmBlockId === mobileSelectedHudBlockId}
          onEdit={handleMobileHudEdit}
          onMoveUp={() => handleMobileHudMove('up')}
          onMoveDown={() => handleMobileHudMove('down')}
          onToggleMore={() => {
            setMobileHudMoreOpen((current) => !current);
            setMobileHudDeleteConfirmBlockId('');
          }}
          onToggleVisibility={handleMobileHudToggleVisibility}
          onDelete={handleMobileHudDelete}
          onDismiss={clearMobileHudSelection}
        />
      ) : null}
    </div>
  );
}
