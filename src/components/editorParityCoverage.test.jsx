import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  FieldControlGrid,
} from '../pages/AdminContentPage';
import {
  BillboardBlockEditor,
  CalculatorCtaBlockEditor,
  CtaBandBlockEditor,
  CtaFormBlockEditor,
  ColumnsBlockEditor,
  FeaturePanelBlockEditor,
  GridBlockEditor,
  HeroBlockEditor,
  HeroPieBlockEditor,
  ImpactStatBlockEditor,
  IntroBlockEditor,
  LegalCopyBlockEditor,
  NewsletterBlockEditor,
  PageContentBlockEditor,
  PhotoColumnBlockEditor,
  RatesBlockEditor,
  RequestFormBlockEditor,
  ServicesGridBlockEditor,
  SiteFeatureBlockEditor,
  SplitPanelBlockEditor,
  TestimonialsBlockEditor,
  TopStripBlockEditor,
} from './block-editors/migratedBlockEditors';
import BlockHudPanelHost from './BlockHudPanelHost';
import {
  contentBlockBlueprintsByPath,
  genericPageBlockBlueprint,
  getAllBlockTemplateBlueprints,
} from '../data/contentBlockBlueprints';
import { defaultTestimonialsLibrary } from '../data/testimonialsLibrarySeed';
import { getBlockHudDefinition } from '../lib/blockHudRegistry';
import { EDITOR_PARITY_CONTRACT, EDITOR_PARITY_TYPES, getEditorParityContract } from '../lib/editorParityContract';
import { getLegacyEditableFieldsForKind } from '../blocks/registry';

const allBlueprintBlocks = getAllBlockTemplateBlueprints();

const ADMIN_RENDERERS_BY_KIND = {
  hero: HeroBlockEditor,
  hero_pie: HeroPieBlockEditor,
  calculator_cta: CalculatorCtaBlockEditor,
  cta_band: CtaBandBlockEditor,
  impact_stat: ImpactStatBlockEditor,
  legal_copy: LegalCopyBlockEditor,
  intro: IntroBlockEditor,
  billboard: BillboardBlockEditor,
  feature_panel: FeaturePanelBlockEditor,
  cta_form: CtaFormBlockEditor,
  request_form: RequestFormBlockEditor,
  columns: ColumnsBlockEditor,
  photo_column: PhotoColumnBlockEditor,
  content: PageContentBlockEditor,
  newsletter: NewsletterBlockEditor,
  rates: RatesBlockEditor,
  services_grid: ServicesGridBlockEditor,
  site_feature: SiteFeatureBlockEditor,
  split_panel: SplitPanelBlockEditor,
  card_grid: GridBlockEditor,
  testimonials: TestimonialsBlockEditor,
  top_strip: TopStripBlockEditor,
};

const SAMPLE_KIND_BY_EDITOR_TYPE = {
  content: { kind: 'content', id: 'page_content' },
  hero: 'hero',
  hero_pie: 'hero_pie',
  calculator_cta: 'calculator_cta',
  cta_band: 'cta_band',
  impact_stat: 'impact_stat',
  legal_copy: { __sample: 'legal_copy' },
  intro: 'intro',
  billboard: 'billboard',
  feature_panel: 'feature_panel',
  card_grid: 'card_grid',
  cta_form: 'cta_form',
  request_form: 'request_form',
  columns: 'columns',
  photo_column: { __sample: 'photo_column' },
  testimonials: 'testimonials',
  page_content: { kind: 'content', id: 'page_content' },
  newsletter: 'newsletter',
  rates: 'rates',
  services_grid: 'services_grid',
  site_feature: 'site_feature',
  split_panel: 'split_panel',
  grid: 'card_grid',
  top_strip: 'top_strip',
  fields: { __sample: 'fields' },
};

const PARITY_ASSERTIONS = {
  hero: {
    admin: () => {
      expect(screen.getByLabelText('Hero editor preview surface')).toBeTruthy();
      expect(screen.getByRole('radiogroup', { name: /Hero background/i })).toBeTruthy();
    },
    hud: () => {
      expect(screen.getByLabelText('Hero editor preview surface')).toBeTruthy();
      expect(screen.getByRole('radiogroup', { name: /Hero background/i })).toBeTruthy();
    },
  },
  hero_pie: {
    admin: () => {
      expect(screen.getByRole('group', { name: 'Autoplay wedges' })).toBeTruthy();
      expect(screen.getByLabelText('Autoplay interval (ms)')).toBeTruthy();
      expect(screen.getByLabelText('Service slices (JSON)')).toBeTruthy();
    },
    hud: () => {
      expect(screen.getByRole('group', { name: 'Autoplay wedges' })).toBeTruthy();
      expect(screen.getByLabelText('Autoplay interval (ms)')).toBeTruthy();
      expect(screen.getByLabelText('Service slices (JSON)')).toBeTruthy();
    },
  },
  calculator_cta: {
    admin: () => {
      expect(screen.getByLabelText('Calculator title')).toBeTruthy();
      expect(screen.getByLabelText('Calculate button label')).toBeTruthy();
      expect(screen.getByLabelText('Discuss title')).toBeTruthy();
    },
    hud: () => {
      expect(screen.getByLabelText('Calculator title')).toBeTruthy();
      expect(screen.getByLabelText('Calculate button label')).toBeTruthy();
      expect(screen.getByLabelText('Discuss title')).toBeTruthy();
    },
  },
  cta_band: {
    admin: () => {
      expect(screen.getByLabelText('CTA band title')).toBeTruthy();
      expect(screen.getByLabelText('CTA band body')).toBeTruthy();
      expect(screen.getByLabelText('Button label')).toBeTruthy();
    },
    hud: () => {
      expect(screen.getByLabelText('CTA band title')).toBeTruthy();
      expect(screen.getByLabelText('CTA band body')).toBeTruthy();
      expect(screen.getByLabelText('Button label')).toBeTruthy();
    },
  },
  impact_stat: {
    admin: () => {
      expect(screen.getByLabelText('Impact title prefix')).toBeTruthy();
      expect(screen.getByLabelText('Stat 1 value')).toBeTruthy();
      expect(screen.getByLabelText('CTA label')).toBeTruthy();
    },
    hud: () => {
      expect(screen.getByLabelText('Impact title prefix')).toBeTruthy();
      expect(screen.getByLabelText('Stat 1 value')).toBeTruthy();
      expect(screen.getByLabelText('CTA label')).toBeTruthy();
    },
  },
  legal_copy: {
    admin: () => {
      expect(screen.getByText('Certificates copy')).toBeTruthy();
      expect(screen.getByText('IRA copy')).toBeTruthy();
      expect(screen.getAllByRole('toolbar', { name: 'Article body formatting' }).length).toBeGreaterThan(0);
    },
    hud: () => {
      expect(screen.getByText('Certificates copy')).toBeTruthy();
      expect(screen.getByText('IRA copy')).toBeTruthy();
      expect(screen.getAllByRole('toolbar', { name: 'Article body formatting' }).length).toBeGreaterThan(0);
    },
  },
  intro: {
    admin: () => {
      expect(screen.getByRole('radiogroup', { name: /Intro background/i })).toBeTruthy();
      expect(screen.getByText(/Core text/i)).toBeTruthy();
    },
    hud: () => {
      expect(screen.getByRole('radiogroup', { name: /Intro background/i })).toBeTruthy();
      expect(screen.getAllByText(/Base Body Tone|Core Color/i).length).toBeGreaterThan(0);
      expect(screen.getByLabelText('Button 1 label')).toBeTruthy();
    },
  },
  billboard: {
    admin: () => {
      expect(screen.getByRole('radiogroup', { name: /Billboard title color/i })).toBeTruthy();
      expect(screen.getByRole('radiogroup', { name: /Billboard background/i })).toBeTruthy();
    },
    hud: () => {
      expect(screen.getByRole('radiogroup', { name: /Billboard title color/i })).toBeTruthy();
      expect(screen.getByRole('radiogroup', { name: /Billboard background/i })).toBeTruthy();
    },
  },
  feature_panel: {
    admin: () => {
      expect(screen.getByLabelText('Feature panel title')).toBeTruthy();
      expect(screen.getByRole('toolbar', { name: 'Article body formatting' })).toBeTruthy();
      expect(screen.getByLabelText('Button label')).toBeTruthy();
    },
    hud: () => {
      expect(screen.getByLabelText('Feature panel title')).toBeTruthy();
      expect(screen.getByRole('toolbar', { name: 'Article body formatting' })).toBeTruthy();
      expect(screen.getByLabelText('Button label')).toBeTruthy();
    },
  },
  site_feature: {
    admin: () => {
      expect(screen.getByText('Code-managed editorial placeholder for future art-directed storytelling moments.')).toBeTruthy();
      expect(screen.getByLabelText('Code-managed feature')).toBeTruthy();
      expect(screen.getByLabelText('Headline override')).toBeTruthy();
      expect(screen.getByLabelText('CTA label override')).toBeTruthy();
    },
    hud: () => {
      expect(screen.getByText('Code-managed editorial placeholder for future art-directed storytelling moments.')).toBeTruthy();
      expect(screen.getByLabelText('Code-managed feature')).toBeTruthy();
      expect(screen.getByLabelText('Headline override')).toBeTruthy();
      expect(screen.getByLabelText('CTA label override')).toBeTruthy();
    },
  },
  card_grid: {
    admin: () => {
      expect(screen.getByRole('radiogroup', { name: /Grid background/i })).toBeTruthy();
      expect(screen.getByText(/Grid intro heading|Intro handled outside this preset/i)).toBeTruthy();
    },
    hud: () => {
      expect(screen.getByRole('radiogroup', { name: /Grid background/i })).toBeTruthy();
      expect(screen.getByText(/Grid intro heading|Intro handled outside this preset/i)).toBeTruthy();
    },
  },
  cta_form: {
    admin: () => {
      expect(screen.getByRole('radiogroup', { name: /CTA form heading color|CTA heading color/i })).toBeTruthy();
      expect(screen.getByRole('radiogroup', { name: /CTA background/i })).toBeTruthy();
      expect(screen.getByRole('toolbar', { name: 'Article body formatting' })).toBeTruthy();
    },
    hud: () => {
      expect(screen.getByRole('radiogroup', { name: /CTA form heading color|CTA heading color/i })).toBeTruthy();
      expect(screen.getByRole('radiogroup', { name: /CTA background/i })).toBeTruthy();
      expect(screen.getByRole('toolbar', { name: 'Article body formatting' })).toBeTruthy();
    },
  },
  request_form: {
    admin: () => {
      expect(screen.getByLabelText('Form heading text')).toBeTruthy();
      expect(screen.getByRole('radiogroup', { name: /Background tone/i })).toBeTruthy();
      expect(screen.getByRole('button', { name: /Step 1/i })).toBeTruthy();
    },
    hud: () => {
      expect(screen.getByLabelText('Form heading text')).toBeTruthy();
      expect(screen.getByRole('radiogroup', { name: /Background tone/i })).toBeTruthy();
      expect(screen.getByRole('button', { name: /Step 1/i })).toBeTruthy();
    },
  },
  columns: {
    admin: () => {
      expect(screen.getByRole('radiogroup', { name: /Columns heading color/i })).toBeTruthy();
      expect(screen.getByRole('radiogroup', { name: /Columns background/i })).toBeTruthy();
    },
    hud: () => {
      expect(screen.getByRole('radiogroup', { name: /Columns heading color/i })).toBeTruthy();
      expect(screen.getByRole('radiogroup', { name: /Columns background/i })).toBeTruthy();
    },
  },
  photo_column: {
    admin: () => {
      expect(screen.getByLabelText('Photo label')).toBeTruthy();
      expect(screen.getByLabelText('Photo caption')).toBeTruthy();
      expect(screen.getByLabelText('Photo URL')).toBeTruthy();
    },
    hud: () => {
      expect(screen.getByLabelText('Photo label')).toBeTruthy();
      expect(screen.getByLabelText('Photo caption')).toBeTruthy();
      expect(screen.getByLabelText('Photo URL')).toBeTruthy();
    },
  },
  split_panel: {
    admin: () => {
      expect(screen.getByLabelText('Left title')).toBeTruthy();
      expect(screen.getAllByRole('toolbar', { name: 'Article body formatting' }).length).toBeGreaterThan(0);
      expect(screen.getByLabelText('Right title')).toBeTruthy();
    },
    hud: () => {
      expect(screen.getByLabelText('Left title')).toBeTruthy();
      expect(screen.getAllByRole('toolbar', { name: 'Article body formatting' }).length).toBeGreaterThan(0);
      expect(screen.getByLabelText('Right title')).toBeTruthy();
    },
  },
  testimonials: {
    admin: () => {
      expect(screen.getByRole('button', { name: 'Pick quotes' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Filter tags' })).toBeTruthy();
      expect(screen.getByText('Preview')).toBeTruthy();
    },
    hud: () => {
      expect(screen.getByText(/Pick quotes from the shared library/i)).toBeTruthy();
      expect(screen.getByText('Selector')).toBeTruthy();
      expect(screen.getByText(/Selected quotes/i)).toBeTruthy();
    },
  },
  content: {
    admin: () => {
      expect(screen.getByRole('toolbar', { name: 'Article body formatting' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'View HTML (advanced)' })).toBeTruthy();
      expect(screen.getByRole('group', { name: 'Page content width presets' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Advanced layout' })).toBeTruthy();
    },
    hud: () => {
      expect(screen.getByRole('group', { name: 'Page content editor type' })).toBeTruthy();
      expect(screen.getByRole('toolbar', { name: 'Article body formatting' })).toBeTruthy();
      expect(screen.getByRole('group', { name: 'Page content width presets' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Advanced layout' })).toBeTruthy();
    },
  },
  page_content: {
    admin: () => {
      expect(screen.getByRole('toolbar', { name: 'Article body formatting' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'View HTML (advanced)' })).toBeTruthy();
      expect(screen.getByRole('group', { name: 'Page content width presets' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Advanced layout' })).toBeTruthy();
    },
    hud: () => {
      expect(screen.getByRole('group', { name: 'Page content editor type' })).toBeTruthy();
      expect(screen.getByRole('toolbar', { name: 'Article body formatting' })).toBeTruthy();
      expect(screen.getByRole('group', { name: 'Page content width presets' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Advanced layout' })).toBeTruthy();
    },
  },
  newsletter: {
    admin: () => {
      expect(screen.getByRole('radiogroup', { name: /Newsletter background/i })).toBeTruthy();
      expect(screen.getByText('Newsletter heading')).toBeTruthy();
    },
    hud: () => {
      expect(screen.getByRole('radiogroup', { name: /Newsletter background/i })).toBeTruthy();
      expect(screen.getByText('Newsletter heading')).toBeTruthy();
    },
  },
  rates: {
    admin: () => {
      expect(screen.getByText('Table rows and published rates are managed in the Rates admin screen.')).toBeTruthy();
      expect(screen.getByRole('link', { name: 'Open rates admin ↗' })).toBeTruthy();
    },
    hud: () => {
      expect(screen.getByText('Table rows and published rates are managed in the Rates admin screen.')).toBeTruthy();
      expect(screen.getByRole('link', { name: 'Open rates admin ↗' })).toBeTruthy();
    },
  },
  services_grid: {
    admin: () => {
      expect(screen.getByLabelText('Services grid heading')).toBeTruthy();
      expect(screen.getByLabelText('Card title size (rem)')).toBeTruthy();
      expect(screen.getByLabelText('Card 1 title')).toBeTruthy();
      expect(screen.getByLabelText('Browse label')).toBeTruthy();
    },
    hud: () => {
      expect(screen.getByLabelText('Services grid heading')).toBeTruthy();
      expect(screen.getByLabelText('Card title size (rem)')).toBeTruthy();
      expect(screen.getByLabelText('Card 1 title')).toBeTruthy();
      expect(screen.getByLabelText('Browse label')).toBeTruthy();
    },
  },
  top_strip: {
    admin: () => {
      expect(screen.getByRole('group', { name: /Show Login/i })).toBeTruthy();
      expect(screen.getByLabelText(/Login Label/i)).toBeTruthy();
      expect(screen.getByRole('radiogroup', { name: /Background color/i })).toBeTruthy();
    },
    hud: () => {
      expect(screen.getByRole('radiogroup', { name: /Top strip background color/i })).toBeTruthy();
      expect(screen.getByLabelText('Login Label')).toBeTruthy();
      expect(screen.getByLabelText('Rates URL / Path')).toBeTruthy();
    },
  },
  grid: {
    admin: () => {
      expect(screen.getByRole('radiogroup', { name: /Grid background/i })).toBeTruthy();
      expect(screen.getByText('Grid intro heading')).toBeTruthy();
    },
    hud: () => {
      expect(screen.getByRole('radiogroup', { name: /Grid background/i })).toBeTruthy();
      expect(screen.getByText('Grid intro heading')).toBeTruthy();
    },
  },
  fields: {
    admin: (block) => {
      sampleFieldLabels(block).forEach((label) => {
        expect(screen.getAllByLabelText(label).length).toBeGreaterThan(0);
      });
    },
    hud: (block) => {
      sampleFieldLabels(block).forEach((label) => {
        expect(screen.getAllByLabelText(label).length).toBeGreaterThan(0);
      });
    },
  },
};

function cloneBlock(block) {
  return structuredClone(block);
}

function sampleFieldLabels(block) {
  return (Array.isArray(block?.editableFields) ? block.editableFields : [])
    .map((field) => String(field?.label || '').trim())
    .filter(Boolean)
    .slice(0, 2);
}

function getDynamicBlock(kindOrSelector) {
  const selector = typeof kindOrSelector === 'string'
    ? { kind: kindOrSelector }
    : (kindOrSelector && typeof kindOrSelector === 'object' ? kindOrSelector : {});
  if (selector.__sample === 'fields') {
    return {
      id: 'fields-sample',
      kind: 'legacy_fields',
      mode: 'dynamic',
      editableFields: [
        { id: 'sampleToggle', label: 'Sample toggle', type: 'boolean' },
        { id: 'sampleCount', label: 'Sample count', type: 'number', min: 0, max: 10, step: 1 },
      ],
      settings: {
        sampleToggle: true,
        sampleCount: 2,
      },
    };
  }
  if (selector.__sample === 'photo_column') {
    return {
      id: 'photo-column-sample',
      kind: 'photo_column',
      mode: 'dynamic',
      editableFields: getLegacyEditableFieldsForKind('photo_column'),
      settings: {
        title: 'Mission team',
        body: 'Coverage that travels with you.',
        imageUrl: '/mission-team.jpg',
        imageAlt: 'Mission team',
        buttonLabel: 'Learn more',
        buttonUrl: '/services/insurance/mission-assure',
        buttonPageRef: '/services/insurance/mission-assure',
        buttonStyle: 'outline',
        buttonTone: 'mango',
        widthShare: 1,
      },
    };
  }
  if (selector.__sample === 'legal_copy') {
    return {
      id: 'legal-copy-sample',
      kind: 'legal_copy',
      mode: 'dynamic',
      editableFields: getLegacyEditableFieldsForKind('legal_copy'),
      settings: {
        certificatesHtml: '<p>Certificates disclosure copy.</p>',
        iraHtml: '<p>IRA disclosure copy.</p>',
      },
    };
  }
  if (selector.kind === 'cta_band') {
    return {
      id: 'cta-band-sample',
      kind: 'cta_band',
      mode: 'dynamic',
      editableFields: getLegacyEditableFieldsForKind('cta_band'),
      settings: {
        title: 'Smart stewardship for today and tomorrow.',
        body: 'Stay connected to the tools you need.',
        buttonLabel: 'Learn more',
        buttonUrl: '/services/planned-giving',
        buttonPageRef: '/services/planned-giving',
        background: 'blue',
      },
    };
  }
  if (selector.kind === 'intro') {
    return {
      id: 'intro-sample',
      kind: 'intro',
      mode: 'dynamic',
      editableFields: getLegacyEditableFieldsForKind('intro'),
      settings: {
        heading: 'Most wealth isn’t cash.',
        body: 'Let’s look at what your next step can be.',
        bgTone: 'white',
        button1Label: 'Talk with us',
        button1PageRef: '/services/planned-giving/ministry-impact-fund',
      },
    };
  }
  const expectedKind = String(selector.kind || '').trim();
  const expectedId = String(selector.id || '').trim();
  const matches = allBlueprintBlocks
    .filter((block) => (
      block?.mode === 'dynamic'
      && (!expectedKind || block?.kind === expectedKind)
      && (!expectedId || block?.id === expectedId)
    ))
    .sort((a, b) => {
      const aCount = Array.isArray(a?.editableFields) ? a.editableFields.length : 0;
      const bCount = Array.isArray(b?.editableFields) ? b.editableFields.length : 0;
      return bCount - aCount;
    });

  if (!matches.length) {
    throw new Error(`No dynamic block found for selector "${JSON.stringify(selector)}".`);
  }

  return cloneBlock(matches.find((block) => !expectedId && expectedKind && block?.id === expectedKind) || matches[0]);
}

function renderAdminSurface(block) {
  const kind = String(block?.kind || '').trim();
  const Component = ADMIN_RENDERERS_BY_KIND[kind];
  if (Component) {
    const extraProps = kind === 'testimonials'
      ? { selectedPath: '/services/loans', testimonialsLibrary: defaultTestimonialsLibrary }
      : (kind === 'rates' ? { pathname: '/rates', routeOptions: [] } : { routeOptions: [] });
    render(createElement(Component, {
      block,
      onSettingChange: vi.fn(),
      ...extraProps,
    }));
    return;
  }

  render(createElement(FieldControlGrid, {
    fields: Array.isArray(block?.editableFields) ? block.editableFields : [],
    settings: block?.settings || {},
    onSettingChange: vi.fn(),
    routeOptions: [],
  }));
}

function renderHudSurface(block) {
  render(createElement(BlockHudPanelHost, {
    block,
    pathname: block?.kind === 'rates' ? '/rates' : '/services/loans',
    routeOptions: [],
    testimonialsLibrary: defaultTestimonialsLibrary,
    onSettingChange: vi.fn(),
  }));
}

describe('editor parity coverage', () => {
  it('keeps every HUD editor type mapped to a parity contract', () => {
    const editorTypes = new Set(
      allBlueprintBlocks
        .filter((block) => block?.mode === 'dynamic')
        .map((block) => getBlockHudDefinition(block).editorType),
    );

    editorTypes.forEach((editorType) => {
      expect(getEditorParityContract(editorType)).toBeTruthy();
    });
  });

  it('keeps parity samples wired for every supported editor type', () => {
    EDITOR_PARITY_TYPES.forEach((editorType) => {
      const kind = SAMPLE_KIND_BY_EDITOR_TYPE[editorType];
      const block = getDynamicBlock(kind);
      const contract = EDITOR_PARITY_CONTRACT[editorType];
      const assertions = PARITY_ASSERTIONS[editorType];

      expect(contract).toBeTruthy();
      expect(assertions).toBeTruthy();

      renderAdminSurface(block);
      assertions.admin(block);
      cleanup();

      renderHudSurface(block);
      assertions.hud(block);
      cleanup();
    });
  });
});
