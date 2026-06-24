import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import BlockHudPanelHost from '../components/BlockHudPanelHost';
import BlockOwnershipOverlay, { getBlockOwnershipVisual } from '../components/BlockOwnershipOverlay';
import DynamicCtaSection from '../components/DynamicCtaSection';
import FrontHudAnchorTag from '../components/FrontHudAnchorTag';
import FrontHudPanelShell from '../components/FrontHudPanelShell';
import FrontHudPageWorkflow from '../components/FrontHudPageWorkflow';
import SafeRichText from '../components/SafeRichText';
import { useContentAdmin } from '../context/ContentAdminContext';
import { useFrontHud } from '../context/FrontHudContext';
import { useTestimonials } from '../context/TestimonialsContext';
import useNativeEnhancements from '../hooks/useNativeEnhancements';
import useHudDockOrder from '../hooks/useHudDockOrder';
import useLocalBlockDrafts from '../hooks/useLocalBlockDrafts';
import { buildHudPanelsFromBlocks } from '../lib/blockHudRegistry';
import {
  formatTestimonialAttribution,
  normalizeDisplayTestimonials,
  normalizeTestimonialsSelectionMode,
  parseTokenList,
  resolveTestimonialsBlockData,
} from '../lib/testimonials';
import {
  actionButtonClassName,
  buildDynamicBillboardFromBlock,
  buildDynamicHeroPieFromBlock,
  buildDynamicIntroFromBlock,
  DEFAULT_SERVICE_HERO_PIE_SLICES,
  isExternalLinkHref,
  renderTextWithHighlights,
} from '../lib/dynamicPageBlocks';

const SERVICES_HERO_PIE_REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const testimonials = [
  {
    quote: '“Their experience has been a game-changer for us.”',
    author: 'Rich Wilkerson Jr, Vous Church',
  },
  {
    quote: '“We feel like we’re part of the good work AGFinancial is doing.”',
    author: 'Mike, Donor Advised Fund Corporate Client',
  },
  {
    quote: '“Our 120-acre center for ministry for children and rural pastors wouldn’t be here today had it not been for the creative ways that AGFinancial can help leverage people’s resources.”',
    author: 'Bryan Jarrett, Lead Pastor, Northplace Church, TX',
  },
];
const defaultServicesTestimonialsFineprint = 'Testimonials are examples only. Results differ by situation and are not guaranteed.';
const defaultServicesCtaSettings = {
  title: 'Connect your faith & finances. Start here.',
  titleClassName: '',
  titleHighlightsJson: '[{"text":"faith & finances","className":"is-atlantean"}]',
  bodyHtml: '',
  bgTone: 'white',
  submitLabel: 'Follow-up with me',
  successMessage: 'Thanks. We’ll reach out soon.',
  salesforceUrl: '',
  field1Enabled: true,
  field1Type: 'text',
  field1Label: 'Name',
  field1Placeholder: '',
  field1Options: '',
  field1Required: true,
  field2Enabled: true,
  field2Type: 'email',
  field2Label: 'Email',
  field2Placeholder: '',
  field2Options: '',
  field2Required: true,
  field3Enabled: true,
  field3Type: 'tel',
  field3Label: 'Phone',
  field3Placeholder: '(555) 555-5555',
  field3Options: '',
  field3Required: false,
  field4Enabled: true,
  field4Type: 'textarea',
  field4Label: 'Message',
  field4Placeholder: 'What would you like to discuss?',
  field4Options: '',
  field4Required: false,
};
const SERVICES_HERO_PIE_HUD_PANEL_ID = 'services-hero-pie';
const SERVICES_CTA_HUD_PANEL_ID = 'services-cta';
const SERVICES_TESTIMONIALS_HUD_PANEL_ID = 'services-testimonials';
const SERVICES_HUD_PANEL_ID_BY_BLOCK_ID = {
  hero_pie: SERVICES_HERO_PIE_HUD_PANEL_ID,
  cta_form: SERVICES_CTA_HUD_PANEL_ID,
  testimonials: SERVICES_TESTIMONIALS_HUD_PANEL_ID,
};
const SERVICES_HUD_SECTION_KEY_BY_BLOCK_ID = {
  hero_pie: 'heroPie',
  cta_form: 'cta',
  testimonials: 'testimonials',
};
const SERVICES_BREAKDOWN_ROWS = Object.freeze([
  Object.freeze({
    slug: 'loans',
    title: 'Loans',
    path: '/services/loans',
    description: 'The right loan can change everything for your ministry. 100% customized. Every loan, from construction to lines of credit.',
    links: Object.freeze([
      Object.freeze({ label: 'Loan options', path: '/services/loans' }),
    ]),
  }),
  Object.freeze({
    slug: 'investments',
    title: 'Investments',
    path: '/services/investments',
    description: "It's much more than money. Your funds help churches reach their communities. Growth for you, growth for Kingdom.",
    links: Object.freeze([
      Object.freeze({ label: 'Rates', path: '/services/investments#rates' }),
      Object.freeze({ label: 'Demand Certificates', path: '/services/investments#certificates' }),
      Object.freeze({ label: 'Term Certificates', path: '/services/investments#certificates' }),
    ]),
  }),
  Object.freeze({
    slug: 'retirement',
    title: 'Retirement',
    path: '/services/retirement',
    description: 'Plan, contribute, and build for tomorrow. Options include screened investments, IRAs, and our very own MBA Income Fund.',
    links: Object.freeze([
      Object.freeze({ label: 'AGFinancial 403(b)', path: '/services/retirement/403b' }),
      Object.freeze({ label: 'IRAs', path: '/services/retirement/iras' }),
      Object.freeze({ label: '409A', path: '/services/retirement/409a' }),
    ]),
  }),
  Object.freeze({
    slug: 'planned-giving',
    title: 'Planned Giving',
    path: '/services/planned-giving',
    description: 'Legacy planning and charitable giving made easy. Tax savings and income generation options that benefit ministries, donors, and loved ones.',
    links: Object.freeze([
      Object.freeze({ label: 'Charitable Gift Annuities', path: '/services/planned-giving/charitable-gift-annuities' }),
      Object.freeze({ label: 'Charitable Trusts', path: '/services/planned-giving/charitable-trusts' }),
      Object.freeze({ label: 'Donor Advised Funds / Generosity Fund', path: '/services/planned-giving/generosity-fund' }),
      Object.freeze({ label: 'Endowments', path: '/services/planned-giving/endowments' }),
      Object.freeze({ label: 'Wills & Estate Services', path: '/services/planned-giving' }),
    ]),
  }),
  Object.freeze({
    slug: 'insurance',
    title: 'Insurance',
    path: '/services/insurance',
    description: 'Coverage built for churches, ministries and individuals to protect what’s most important.',
    links: Object.freeze([
      Object.freeze({ label: 'Property & Casualty', path: '/services/insurance/property-casualty-insurance' }),
      Object.freeze({ label: 'Group Life', path: '/services/insurance/group-term-life-insurance' }),
      Object.freeze({ label: 'Individual Life', path: '/services/insurance/life-insurance-quote' }),
      Object.freeze({ label: 'Mission Assure', path: '/services/insurance/mission-assure' }),
      Object.freeze({ label: 'Risk Management', path: '/services/insurance' }),
    ]),
  }),
]);

function clampFrontHudOpacity(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 15;
  }
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function mapServicesBillboardToIntroRuntime(runtime) {
  if (!runtime) {
    return null;
  }

  return {
    heading: runtime.title,
    headingClassName: runtime.titleClassName,
    headingHighlights: Array.isArray(runtime.titleHighlights) ? runtime.titleHighlights : [],
    bodyHtml: runtime.bodyHtml,
    body: runtime.body,
    extraLine: runtime.subtitle,
    extraLineClassName: '',
    extraLineStyle: undefined,
    bgTone: runtime.bgTone,
    textTone: runtime.textTone,
    justify: runtime.justify || 'center',
    lineSpacing: runtime.lineSpacing || 1.04,
    actions: Array.isArray(runtime.actions) ? runtime.actions : [],
  };
}

function normalizeHexChannel(value) {
  const clamped = Math.max(0, Math.min(255, Number(value) || 0));
  return Math.round(clamped);
}

function hexToRgbTriplet(value, fallback = '0, 173, 187') {
  const source = String(value || '').trim().replace('#', '');
  const normalized = source.length === 3
    ? source.split('').map((token) => `${token}${token}`).join('')
    : source;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return fallback;
  }
  const red = normalizeHexChannel(Number.parseInt(normalized.slice(0, 2), 16));
  const green = normalizeHexChannel(Number.parseInt(normalized.slice(2, 4), 16));
  const blue = normalizeHexChannel(Number.parseInt(normalized.slice(4, 6), 16));
  return `${red}, ${green}, ${blue}`;
}

function textColorForHex(value, fallback = '#ffffff') {
  const source = String(value || '').trim().replace('#', '');
  const normalized = source.length === 3
    ? source.split('').map((token) => `${token}${token}`).join('')
    : source;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return fallback;
  }
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  const luminance = ((red * 299) + (green * 587) + (blue * 114)) / 1000;
  return luminance > 150 ? '#1f2122' : '#ffffff';
}

export default function ServicesPage() {
  const pageRef = useRef(null);
  const heroPieSectionRef = useRef(null);
  const heroPieCardSizerRef = useRef(null);
  const ctaSectionRef = useRef(null);
  const testimonialsSectionRef = useRef(null);
  const {
    blocksByPath,
    pageHierarchy,
    setActiveBlockLock = () => ({ ok: false }),
    getBlockCollaboration = () => null,
    devIdentity = null,
    claimBufferedBlockEdit = () => false,
    commitBlockSettingsPatch = () => false,
    registerExternalDraftFlushHandler = null,
  } = useContentAdmin();
  const { enabled: frontHudEnabled, opacity: frontHudOpacity } = useFrontHud();
  const { testimonials: testimonialsLibrary } = useTestimonials();
  useNativeEnhancements(pageRef);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [heroPieUserInteracted, setHeroPieUserInteracted] = useState(false);
  const [heroPieReducedMotion, setHeroPieReducedMotion] = useState(false);
  const [heroPieCardMinHeight, setHeroPieCardMinHeight] = useState(0);
  const [hudDockCollapsed, setHudDockCollapsed] = useState(true);
  const [activeHudPanelId, setActiveHudPanelId] = useState('');
  const managedBlocksSource = useMemo(
    () => (Array.isArray(blocksByPath?.['/services']) ? blocksByPath['/services'] : []),
    [blocksByPath],
  );
  const { blocks: managedBlocks, stageLocalBlockSetting, stageLocalBlockSettings } = useLocalBlockDrafts({
    pathname: '/services',
    blocks: managedBlocksSource,
    claimBufferedBlockEdit,
    commitBlockSettingsPatch,
    registerExternalDraftFlushHandler,
  });
  const heroPieBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'hero_pie'
      && block?.kind === 'hero_pie'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const billboardIntroBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'intro'
      && block?.kind === 'billboard'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const introBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'intro'
      && block?.kind === 'intro'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const dynamicTestimonialsBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'testimonials'
      && block?.kind === 'testimonials'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const ctaBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'cta_form'
      && block?.kind === 'cta_form'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const testimonialsData = useMemo(
    () => resolveTestimonialsBlockData({
      block: dynamicTestimonialsBlock,
      library: testimonialsLibrary,
      fallbackItems: testimonials,
      fallbackFineprint: defaultServicesTestimonialsFineprint,
      defaultTag: 'services',
    }),
    [dynamicTestimonialsBlock, testimonialsLibrary],
  );
  const dynamicIntro = useMemo(() => {
    const servicesBillboard = buildDynamicBillboardFromBlock(billboardIntroBlock);
    if (servicesBillboard) {
      return mapServicesBillboardToIntroRuntime(servicesBillboard);
    }
    return buildDynamicIntroFromBlock(introBlock);
  }, [billboardIntroBlock, introBlock]);
  const heroPieRuntime = useMemo(() => (
    buildDynamicHeroPieFromBlock(heroPieBlock || {
      id: 'hero_pie',
      kind: 'hero_pie',
      mode: 'dynamic',
      settings: {
        autoplay: true,
        autoplayMs: 2400,
        slicesJson: JSON.stringify(DEFAULT_SERVICE_HERO_PIE_SLICES),
      },
    })
  ), [heroPieBlock]);
  const heroPieSlices = heroPieRuntime?.slices || [];
  const heroPieAutoplayEnabled = heroPieRuntime?.autoplay ?? true;
  const heroPieAutoplayMs = heroPieRuntime?.autoplayMs ?? 2400;
  const testimonialsHudSettings = dynamicTestimonialsBlock?.settings || {};
  const testimonialsHudSelectionMode = normalizeTestimonialsSelectionMode(testimonialsHudSettings.selectionMode);
  const testimonialsHudLibrary = useMemo(
    () => normalizeDisplayTestimonials(testimonialsLibrary),
    [testimonialsLibrary],
  );
  const testimonialsHudSelectedIds = useMemo(
    () => parseTokenList(testimonialsHudSettings.selectedIdsCsv),
    [testimonialsHudSettings.selectedIdsCsv],
  );
  const testimonialsHudFilterTags = useMemo(
    () => parseTokenList(testimonialsHudSettings.filterTagsCsv),
    [testimonialsHudSettings.filterTagsCsv],
  );
  const testimonialsHudAvailableTags = useMemo(() => {
    const tags = new Set();
    testimonialsHudLibrary.forEach((item) => {
      (Array.isArray(item?.tags) ? item.tags : []).forEach((tag) => {
        const token = parseTokenList(tag)[0];
        if (token) {
          tags.add(token);
        }
      });
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [testimonialsHudLibrary]);
  const testimonialsHudResolved = useMemo(
    () => resolveTestimonialsBlockData({
      block: dynamicTestimonialsBlock,
      library: testimonialsHudLibrary,
      fallbackItems: [],
      fallbackFineprint: '',
      defaultTag: 'services',
    }),
    [dynamicTestimonialsBlock, testimonialsHudLibrary],
  );
  const testimonialsHudPreviewItems = Array.isArray(testimonialsHudResolved?.items)
    ? testimonialsHudResolved.items.slice(0, 4)
    : [];
  const hudPanels = useMemo(
    () => buildHudPanelsFromBlocks(managedBlocks, {
      panelIdById: SERVICES_HUD_PANEL_ID_BY_BLOCK_ID,
    }).map((panel) => ({
      ...panel,
      sectionKey: SERVICES_HUD_SECTION_KEY_BY_BLOCK_ID[panel.blockId] || '',
    })),
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
  const hudPanelByBlockId = useMemo(() => (
    hudPanels.reduce((next, panel) => {
      const blockId = String(panel?.blockId || '').trim();
      if (blockId) {
        next[blockId] = panel;
      }
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
    storageKey: 'services',
  });
  const frontHudOpacityRatio = clampFrontHudOpacity(frontHudOpacity) / 100;
  const showFrontHud = frontHudEnabled && hudPanels.length > 0;
  const hasOpenHudPanel = showFrontHud && !hudDockCollapsed && Boolean(activeHudPanelId);
  const activeHudBlockId = hasOpenHudPanel ? String(activeHudPanel?.blockId || activeHudPanel?.block?.id || '').trim() : '';
  const getHudBlockStateClassName = (blockId) => {
    const normalizedBlockId = String(blockId || '').trim();
    if (!hasOpenHudPanel || !normalizedBlockId) {
      return '';
    }
    return activeHudBlockId === normalizedBlockId ? ' is-hud-focus-target' : ' is-hud-dimmed';
  };
  const getOwnershipVisualForBlockId = (blockId) => {
    if (!showFrontHud || !blockId) {
      return { className: '', overlayLabel: '', overlayDetail: '', state: 'none', isOwnedByOther: false };
    }
    return getBlockOwnershipVisual(getBlockCollaboration('/services', blockId), devIdentity?.userId);
  };
  const isCtaHudFocusTarget = hasOpenHudPanel && activeHudPanelId === SERVICES_CTA_HUD_PANEL_ID;

  useEffect(() => {
    if (!showFrontHud) {
      setHudDockCollapsed(true);
      setActiveHudPanelId('');
    }
  }, [showFrontHud]);

  useEffect(() => {
    if (!heroPieSlices.length) {
      setActiveIndex(0);
      setHoveredIndex(null);
      return;
    }
    setActiveIndex((current) => ((current % heroPieSlices.length) + heroPieSlices.length) % heroPieSlices.length);
    setHoveredIndex((current) => (current != null && current >= heroPieSlices.length ? null : current));
  }, [heroPieSlices.length]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const media = window.matchMedia(SERVICES_HERO_PIE_REDUCED_MOTION_QUERY);
    const syncReducedMotion = () => {
      setHeroPieReducedMotion(Boolean(media.matches));
    };

    syncReducedMotion();
    media.addEventListener?.('change', syncReducedMotion);
    media.addListener?.(syncReducedMotion);

    return () => {
      media.removeEventListener?.('change', syncReducedMotion);
      media.removeListener?.(syncReducedMotion);
    };
  }, []);

  useEffect(() => {
    if (
      hoveredIndex !== null
      || heroPieUserInteracted
      || heroPieReducedMotion
      || !heroPieAutoplayEnabled
      || heroPieSlices.length <= 1
    ) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % heroPieSlices.length);
    }, heroPieAutoplayMs);
    return () => window.clearInterval(timer);
  }, [
    heroPieAutoplayEnabled,
    heroPieAutoplayMs,
    heroPieReducedMotion,
    heroPieSlices.length,
    heroPieUserInteracted,
    hoveredIndex,
  ]);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const measureCardHeight = () => {
      const sizer = heroPieCardSizerRef.current;
      if (!sizer) {
        return;
      }
      const cards = Array.from(sizer.querySelectorAll('.services-pie-card'));
      const nextHeight = cards.reduce((tallest, card) => (
        Math.max(tallest, Math.ceil(card.getBoundingClientRect().height))
      ), 0);
      setHeroPieCardMinHeight((current) => (current === nextHeight ? current : nextHeight));
    };

    const frame = window.requestAnimationFrame(measureCardHeight);
    window.addEventListener('resize', measureCardHeight);

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined' && heroPieCardSizerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        measureCardHeight();
      });
      resizeObserver.observe(heroPieCardSizerRef.current);
    }

    let fontLoadCanceled = false;
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!fontLoadCanceled) {
          measureCardHeight();
        }
      });
    }

    return () => {
      fontLoadCanceled = true;
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', measureCardHeight);
      resizeObserver?.disconnect();
    };
  }, [heroPieSlices]);

  const activeSlice = heroPieSlices[hoveredIndex ?? activeIndex] || DEFAULT_SERVICE_HERO_PIE_SLICES[0];
  const activeSliceAccentStyle = {
    '--services-pie-active-color': activeSlice.color,
    '--services-pie-active-rgb': hexToRgbTriplet(activeSlice.color),
  };
  const activeSliceCardStyle = heroPieCardMinHeight > 0
    ? { '--services-pie-card-min-height': `${heroPieCardMinHeight}px` }
    : undefined;
  const activeSliceButtonStyle = {
    '--btn-color': activeSlice.color,
    '--btn-hover-color': activeSlice.color,
    '--btn-text': textColorForHex(activeSlice.color),
    '--btn-hover-text': textColorForHex(activeSlice.color),
  };
  const wheelButtonClassName = actionButtonClassName('blue');
  const selectHeroSlice = (index) => {
    setActiveIndex(index);
    setHeroPieUserInteracted(true);
  };
  const previewHeroSlice = (index) => {
    setHoveredIndex(index);
  };
  const clearHeroSlicePreview = () => {
    setHoveredIndex(null);
  };
  const scrollElementWithNavOffset = (target, extraOffset = 8) => {
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
  const scrollToHudSection = (sectionKey) => {
    if (sectionKey === 'heroPie') {
      scrollElementWithNavOffset(heroPieSectionRef.current);
      return;
    }
    if (sectionKey === 'cta') {
      scrollElementWithNavOffset(ctaSectionRef.current);
      return;
    }
    if (sectionKey === 'testimonials') {
      scrollElementWithNavOffset(testimonialsSectionRef.current);
    }
  };
  const openHudPanel = (panelId, sectionKey) => {
    if (!hudDockCollapsed && activeHudPanelId === panelId) {
      setHudDockCollapsed(true);
      setActiveHudPanelId('');
      return;
    }
    setHudDockCollapsed(false);
    setActiveHudPanelId(panelId);
    scrollToHudSection(sectionKey);
  };
  const closeHudDock = () => {
    setHudDockCollapsed(true);
    setActiveHudPanelId('');
  };
  const renderHudAnchor = (blockId) => {
    if (!showFrontHud) {
      return null;
    }
    const panel = hudPanelByBlockId[String(blockId || '').trim()];
    if (!panel) {
      return null;
    }
    return (
      <FrontHudAnchorTag
        label={panel.label}
        isActive={!hudDockCollapsed && activeHudPanelId === panel.id}
        onClick={() => openHudPanel(panel.id, panel.sectionKey)}
        style={{ '--ag-admin-front-hud-opacity': String(frontHudOpacityRatio) }}
      />
    );
  };
  const updateHeroPieSetting = (settingKey, settingValue) => {
    if (!heroPieBlock) {
      return;
    }
    stageLocalBlockSetting(heroPieBlock.id, settingKey, settingValue);
  };
  const updateTestimonialsSetting = (settingKey, settingValue) => {
    if (!dynamicTestimonialsBlock) {
      return;
    }
    stageLocalBlockSetting(dynamicTestimonialsBlock.id, settingKey, settingValue);
  };
  const updateTestimonialsSettings = (settingsPatch) => {
    if (!dynamicTestimonialsBlock) {
      return;
    }
    stageLocalBlockSettings(dynamicTestimonialsBlock.id, settingsPatch);
  };
  const setTestimonialsSelectedIds = (nextIds) => {
    const normalized = parseTokenList((Array.isArray(nextIds) ? nextIds : []).join(','));
    updateTestimonialsSettings({
      selectedIdsCsv: normalized.join(','),
      ...(testimonialsHudSelectionMode !== 'manual' ? { selectionMode: 'manual' } : {}),
    });
  };
  const toggleTestimonialsSelectedId = (id) => {
    const token = parseTokenList(id)[0];
    if (!token) {
      return;
    }
    const nextIds = testimonialsHudSelectedIds.includes(token)
      ? testimonialsHudSelectedIds.filter((entry) => entry !== token)
      : [...testimonialsHudSelectedIds, token];
    setTestimonialsSelectedIds(nextIds);
  };
  const setTestimonialsFilterTags = (nextTags) => {
    const normalized = parseTokenList((Array.isArray(nextTags) ? nextTags : []).join(','));
    updateTestimonialsSettings({
      filterTagsCsv: normalized.join(','),
    });
  };
  const toggleTestimonialsFilterTag = (tag) => {
    const token = parseTokenList(tag)[0];
    if (!token) {
      return;
    }
    const nextTags = testimonialsHudFilterTags.includes(token)
      ? testimonialsHudFilterTags.filter((entry) => entry !== token)
      : [...testimonialsHudFilterTags, token];
    setTestimonialsFilterTags(nextTags);
  };

  return (
    <div
      ref={pageRef}
      className={`service-native-page services-native-page${showFrontHud ? ' is-front-hud-docked' : ''}${hasOpenHudPanel ? ' has-active-front-hud-panel' : ''}`}
    >
      {showFrontHud ? (
        <aside className={`admin-front-hud-dock${hudDockCollapsed ? ' is-collapsed' : ''}`} aria-label="Front HUD editor panels">
          <div className={`admin-front-hud-dock-tabs${isDockDragging ? ' is-drag-active' : ''}`}>
            {orderedHudPanels.map((panel) => (
              <button
                key={panel.id}
                type="button"
                className={`admin-front-hud-dock-tab${!hudDockCollapsed && activeHudPanel?.id === panel.id ? ' is-active' : ''}${isPanelDragging(panel.id) ? ' is-dragging' : ''}${isPanelDragOver(panel.id) ? ' is-drag-over' : ''}${getPanelDropPosition(panel.id) ? ` is-drop-${getPanelDropPosition(panel.id)}` : ''}`}
                onClick={() => openHudPanel(panel.id, panel.sectionKey)}
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
        <FrontHudPageWorkflow pathname="/services" reviewHref="/admin/content?page=%2Fservices" placement="bar" />
      ) : null}
      {hasOpenHudPanel && activeHudPanel ? (
        <FrontHudPanelShell
          title={activeHudPanel.label}
          onClose={closeHudDock}
          style={{ '--ag-admin-front-hud-opacity': String(frontHudOpacityRatio) }}
        >
          <BlockHudPanelHost
            block={activeHudPanel.block}
            pathname="/services"
            routeOptions={routeLinkOptions}
            testimonialsLibrary={testimonialsLibrary}
            ownership={getOwnershipVisualForBlockId(activeHudPanel.block.id)}
            onOwnershipAction={() => {
              if (!activeHudPanel?.block?.id) {
                return;
              }
              setActiveBlockLock('/services', activeHudPanel.block.id, { force: true });
            }}
            onSettingChange={(settingKey, nextValue) => stageLocalBlockSetting(activeHudPanel.block.id, settingKey, nextValue)}
          />
        </FrontHudPanelShell>
      ) : null}
      <section
        ref={heroPieSectionRef}
        className={`services-pie-hero${getOwnershipVisualForBlockId('hero_pie').className || ''}`}
        data-block-id="hero_pie"
        style={activeSliceAccentStyle}
      >
        <BlockOwnershipOverlay ownership={getOwnershipVisualForBlockId('hero_pie')} />
        {renderHudAnchor('hero_pie')}
        <div className="ag-panel-rail">
          <div className="services-pie-interactive-shell fade-up">
            <div className="services-pie-hero-grid">
              <div className="services-pie-wrap">
                <svg viewBox="0 0 1080 1080" preserveAspectRatio="xMidYMid meet" className="services-pie-chart" aria-label="Services">
                  <circle cx="540" cy="540" r="472" fill="rgba(255, 255, 255, 0.72)" />
                  <circle cx="540" cy="540" r="432" fill="rgba(255, 255, 255, 0.3)" />
                  {heroPieSlices.map((slice, index) => {
                    const isActive = (hoveredIndex ?? activeIndex) === index;
                    return (
                      <a
                        key={slice.path}
                        role="button"
                        tabIndex={0}
                        aria-label={slice.title}
                        aria-pressed={isActive}
                        className={`services-pie-slice-control${isActive ? ' is-active' : ''}`}
                        data-service-wheel-slice={slice.title}
                        onMouseEnter={() => previewHeroSlice(index)}
                        onMouseLeave={clearHeroSlicePreview}
                        onFocus={() => previewHeroSlice(index)}
                        onBlur={clearHeroSlicePreview}
                        onClick={(event) => {
                          event.preventDefault();
                          selectHeroSlice(index);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            selectHeroSlice(index);
                          }
                        }}
                      >
                        <path className={`services-pie-wedge${isActive ? ' is-active' : ''}`} d={slice.d} fill={slice.color} />
                      </a>
                    );
                  })}
                  <circle cx="540" cy="540" r="178" fill="rgba(255, 255, 255, 0.985)" />
                  <circle cx="540" cy="540" r="162" fill="rgba(247, 250, 250, 0.985)" />
                </svg>
              </div>

              <article className="services-pie-card" data-service-wheel-card={activeSlice.title} style={activeSliceCardStyle}>
                <h2>{activeSlice.title}</h2>
                <p>{activeSlice.description}</p>
                <Link to={activeSlice.path} className={wheelButtonClassName} style={activeSliceButtonStyle}>
                  Explore {activeSlice.title}
                </Link>
              </article>
            </div>

            <div className="services-pie-card-sizer" ref={heroPieCardSizerRef} aria-hidden="true">
              {heroPieSlices.map((slice) => (
                <article key={`service-card-sizer-${slice.path}`} className="services-pie-card">
                  <h2>{slice.title}</h2>
                  <p>{slice.description}</p>
                  <span className={wheelButtonClassName}>
                    Explore {slice.title}
                  </span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={`services-native-intro${dynamicIntro ? ` service-native-intro dynamic-intro is-bg-${dynamicIntro.bgTone || 'white'} is-text-${dynamicIntro.textTone || 'dark'}` : ''}${getHudBlockStateClassName('intro')}${getOwnershipVisualForBlockId('intro').className || ''}`} data-block-id="intro">
        <BlockOwnershipOverlay ownership={getOwnershipVisualForBlockId('intro')} />
        {renderHudAnchor('intro')}
        <div className="ag-panel-rail">
          <div
            className={`service-native-intro-copy is-justify-${dynamicIntro?.justify || 'center'}`}
            style={{ '--intro-heading-line-height': dynamicIntro?.lineSpacing || 1.04 }}
          >
            <h2 className={dynamicIntro?.headingClassName || undefined}>
              {dynamicIntro ? (
                <span
                  dangerouslySetInnerHTML={{
                    __html: renderTextWithHighlights(dynamicIntro.heading, dynamicIntro.headingHighlights),
                  }}
                />
              ) : (
                <>
                  A robust financial strategy for
                  {' '}
                  <mark>your ministry</mark>
                  {' '}
                  and
                  {' '}
                  <mark className="is-gold">your family</mark>.
                </>
              )}
            </h2>
            {dynamicIntro?.bodyHtml ? (
              <SafeRichText as="div" className="native-info-rich-html" html={dynamicIntro.bodyHtml} />
            ) : null}
            {dynamicIntro?.body ? <p>{dynamicIntro.body}</p> : null}
            {dynamicIntro?.extraLine ? (
              <p
                className={dynamicIntro?.extraLineClassName || undefined}
                style={dynamicIntro?.extraLineStyle}
              >
                <strong>{dynamicIntro.extraLine}</strong>
              </p>
            ) : null}
            {(dynamicIntro?.actions || []).length ? (
              <div className={`service-native-action-row${(dynamicIntro.justify || 'center') === 'center' ? ' is-centered' : ''}`}>
                {dynamicIntro.actions.map((action) => {
                  const buttonClassName = actionButtonClassName(action.style);
                  const actionTarget = action.to || action.href || '';
                  const isInternal = Boolean(action.to || (action.href && !isExternalLinkHref(action.href) && action.href.startsWith('/')));
                  return isInternal ? (
                    <Link
                      key={`services-intro-action-${actionTarget}-${action.label}`}
                      to={actionTarget}
                      className={buttonClassName}
                      target={action.openInNewWindow ? '_blank' : undefined}
                      rel={action.openInNewWindow ? 'noreferrer noopener' : undefined}
                    >
                      {action.label}
                    </Link>
                  ) : (
                    <a
                      key={`services-intro-action-${actionTarget}-${action.label}`}
                      href={actionTarget}
                      className={buttonClassName}
                      target={action.openInNewWindow ? '_blank' : undefined}
                      rel={action.openInNewWindow ? 'noreferrer noopener' : undefined}
                    >
                      {action.label}
                    </a>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="services-native-grid-wrap services-breakdown-section">
        <div className="services-native-grid-bleed">
          <div className="services-breakdown-shell">
            <header className="services-breakdown-header fade-up">
              <h2>What would you like to explore?</h2>
            </header>

            <div className="services-breakdown-list">
              {SERVICES_BREAKDOWN_ROWS.map((service) => (
              <article
                key={`${service.path}-${service.title}`}
                className="services-breakdown-panel fade-up fade-up-force-observe"
                data-service-breakdown-row={service.title}
              >
                <h3>
                  {isExternalLinkHref(service.path) ? (
                    <a href={service.path} target="_blank" rel="noreferrer noopener">{service.title}</a>
                  ) : (
                    <Link to={service.path}>{service.title}</Link>
                  )}
                </h3>

                <p className="services-breakdown-description">{service.description}</p>

                <nav className="services-breakdown-links" aria-label={`${service.title} links`}>
                  {service.links.map((item) => (
                    isExternalLinkHref(item.path) ? (
                      <a key={item.label} href={item.path} target="_blank" rel="noreferrer noopener">{item.label}</a>
                    ) : (
                      <Link key={item.label} to={item.path}>{item.label}</Link>
                    )
                  ))}
                </nav>
              </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="services-native-matters">
        <div className="ag-panel-rail">
          <h2>
            What you do
            {' '}
            <mark>matters</mark>
            .
          </h2>
          <p>
            As an AGFinancial customer, your financial decisions fund real ministry work, transforming lives, including yours.
          </p>
          <div className="service-native-action-row is-centered">
            <Link to="/about-us/impact" className="service-native-btn is-dark">See what you're part of</Link>
          </div>
        </div>
      </section>

      <div ref={ctaSectionRef}>
        <DynamicCtaSection
          managedBlocks={managedBlocks}
          defaultSettings={defaultServicesCtaSettings}
          sectionClassName="services-native-connect service-native-section"
          sectionHudClassName={(getHudBlockStateClassName('cta_form') || (hasOpenHudPanel ? (isCtaHudFocusTarget ? ' is-hud-focus-target' : ' is-hud-dimmed') : '')).trim()}
          ownership={getOwnershipVisualForBlockId('cta_form')}
          hudAnchor={renderHudAnchor('cta_form')}
          fieldIdPrefix="services-connect"
        />
      </div>

      <section ref={testimonialsSectionRef} className={`services-native-testimonials${getOwnershipVisualForBlockId('testimonials').className || ''}`} data-block-id="testimonials">
        <BlockOwnershipOverlay ownership={getOwnershipVisualForBlockId('testimonials')} />
        {renderHudAnchor('testimonials')}
        <div className="ag-panel-rail">
          <div className="carousel-stack">
            {testimonialsData.items.length ? testimonialsData.items.map((item, index) => (
              <article key={`${item.author}-${item.quote.slice(0, 24)}`} className={`carousel-frame${index === 0 ? ' is-active' : ''}`}>
                <p>{item.quote}</p>
                <p><strong>{item.author}</strong></p>
              </article>
            )) : showFrontHud ? (
              <article className="carousel-frame is-active">
                <p>No testimonials selected yet.</p>
                <p><strong>Choose quotes in the HUD selector.</strong></p>
              </article>
            ) : null}
          </div>
          {testimonialsData.showFineprint ? (
            <p className="services-native-testimonials-note">
              {testimonialsData.fineprint}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
