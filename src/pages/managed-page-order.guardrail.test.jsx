import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ManagedBlockOrder from '../components/ManagedBlockOrder';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function pageSource(filename) {
  return readFileSync(path.resolve(__dirname, filename), 'utf8');
}

describe('native page managed-order guardrails', () => {
  it('renders every Services HUD block in the persisted block order', () => {
    const source = pageSource('./ServicesPage.jsx');

    expect(source).toContain("import ManagedBlockOrder from '../components/ManagedBlockOrder';");
    expect(source).toContain('<ManagedBlockOrder className="services-native-page-content" blocks={managedBlocks}>');
    ['hero_pie', 'intro', 'services_cards', 'matters_band', 'cta_form', 'testimonials'].forEach((blockId) => {
      expect(source).toContain(`managedBlockOrderStyle('${blockId}')`);
    });
  });

  it('renders every Retirement HUD block in the persisted block order', () => {
    const source = pageSource('./RetirementPage.jsx');

    expect(source).toContain("import ManagedBlockOrder from '../components/ManagedBlockOrder';");
    expect(source).toContain('<ManagedBlockOrder className="retirement-native-page-content" blocks={managedBlocks}>');
    [
      'hero',
      'intro',
      'retirement_plan_feature',
      'split_options',
      'billboard',
      'rollover_billboard',
      'columns_math',
      'cta_form',
      'testimonials',
    ].forEach((blockId) => {
      expect(source).toContain(`managedBlockOrderStyle('${blockId}')`);
    });
  });

  it('renders every movable Loans HUD block in the persisted block order', () => {
    const source = pageSource('./LoansPage.jsx');

    expect(source).toContain("import ManagedBlockOrder from '../components/ManagedBlockOrder';");
    expect(source).toContain('<ManagedBlockOrder className="loans-native-page-content" blocks={managedBlocks}>');
    ['hero', 'intro', 'loan_options', 'request_form', 'value_cards', 'vision_fuel', 'cta_form', 'testimonials'].forEach((blockId) => {
      expect(source).toContain(`managedBlockOrderStyle('${blockId}')`);
    });
    expect(source).toContain("canReorder={blockId !== 'cta_band'}");
  });

  it.each([
    {
      name: 'Services',
      className: 'services-native-page-content',
      sourceOrder: ['hero_pie', 'intro', 'services_cards', 'matters_band', 'cta_form', 'testimonials'],
      savedOrder: ['cta_form', 'matters_band', 'hero_pie', 'testimonials', 'intro', 'services_cards'],
    },
    {
      name: 'Retirement',
      className: 'retirement-native-page-content',
      sourceOrder: ['hero', 'intro', 'retirement_plan_feature', 'split_options', 'billboard', 'rollover_billboard', 'columns_math', 'cta_form', 'testimonials'],
      savedOrder: ['columns_math', 'cta_form', 'hero', 'testimonials', 'intro', 'billboard', 'retirement_plan_feature', 'rollover_billboard', 'split_options'],
    },
    {
      name: 'Loans',
      className: 'loans-native-page-content',
      sourceOrder: ['hero', 'intro', 'loan_options', 'request_form', 'value_cards', 'vision_fuel', 'cta_form', 'testimonials'],
      savedOrder: ['testimonials', 'intro', 'cta_form', 'vision_fuel', 'hero', 'request_form', 'value_cards', 'loan_options'],
    },
  ])('renders $name DOM blocks in saved order after a reorder', ({ className, sourceOrder, savedOrder }) => {
    const { container } = render(
      <ManagedBlockOrder className={className} blocks={savedOrder.map((id) => ({ id }))}>
        {sourceOrder.map((id) => <section key={id} data-block-id={id} />)}
        <aside data-route-support="true" />
      </ManagedBlockOrder>,
    );

    const renderedOrder = Array.from(container.querySelector(`.${className}`).children)
      .map((element) => element.getAttribute('data-block-id'))
      .filter(Boolean);
    expect(renderedOrder).toEqual(savedOrder);
    expect(container.querySelector('[data-route-support="true"]')).toBe(
      container.querySelector(`.${className}`).lastElementChild,
    );
  });
});
