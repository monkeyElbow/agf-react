import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FieldControlGrid } from './block-editors/migratedBlockEditors';
import { getAllBlockDefinitions, getEditableFieldsForKind } from '../blocks/registry';

function getProbeValue(field, currentValue) {
  if (field.type === 'boolean') {
    return currentValue === true ? false : true;
  }
  if (field.type === 'number' || field.type === 'range') {
    const current = Number(currentValue);
    const step = Number(field.step || 1);
    const min = Number(field.min);
    const max = Number(field.max);
    const hasMin = Number.isFinite(min);
    const hasMax = Number.isFinite(max);
    const base = Number.isFinite(current) ? current : (hasMin ? min : 0);
    const candidate = hasMax && base >= max ? base - step : base + step;

    return Math.min(hasMax ? max : candidate, Math.max(hasMin ? min : candidate, candidate));
  }
  if (field.type === 'select' || field.type === 'swatch') {
    return field.options?.find((option) => String(option.value) !== String(currentValue))?.value
      ?? field.options?.[0]?.value
      ?? '';
  }
  if (field.type === 'route_link') {
    return 'https://example.test/editor-control-grid-probe';
  }
  return `__editor_control_grid_probe__${field.id}`;
}

function triggerField(field, fieldRoot, settings) {
  const nextValue = getProbeValue(field, settings[field.id]);
  if (field.type === 'boolean') {
    const label = nextValue ? 'On' : 'Off';
    const button = Array.from(fieldRoot.querySelectorAll('button'))
      .find((candidate) => candidate.textContent.trim() === label);
    fireEvent.click(button);
    return;
  }
  if (field.type === 'swatch') {
    fireEvent.click(fieldRoot.querySelector('button'));
    return;
  }
  if (field.type === 'highlight_list') {
    fireEvent.click(fieldRoot.querySelector('button'));
    return;
  }
  if (field.type === 'route_link') {
    const control = fieldRoot.querySelector('.admin-route-link-override input');
    expect(control, `${field.id} URL/path override control`).toBeTruthy();
    fireEvent.change(control, { target: { value: nextValue } });
    return;
  }
  const control = field.type === 'html'
    ? fieldRoot.querySelector('[contenteditable="true"], textarea.admin-html-editor-source')
    : fieldRoot.querySelector('select, textarea, input, [contenteditable="true"]');
  if (!control) {
    const button = fieldRoot.querySelector('button');
    expect(button, `${field.id} control`).toBeTruthy();
    fireEvent.click(button);
    return;
  }
  if (control.matches('[contenteditable="true"]')) {
    control.innerHTML = `<p>${nextValue}</p>`;
    fireEvent.input(control, { target: { textContent: nextValue } });
  } else {
    fireEvent.change(control, { target: { value: String(nextValue) } });
  }
}

describe('shared editor control grid', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('sends a setting patch for every canonical control type', () => {
    getAllBlockDefinitions().forEach((definition) => {
      const fields = getEditableFieldsForKind(definition.kind, 'admin');
      if (!fields.length) {
        return;
      }
      const settings = { ...(definition.defaults || {}) };
      const onSettingChange = vi.fn();
      const { container } = render(
        <FieldControlGrid
          fields={fields}
          settings={settings}
          onSettingChange={onSettingChange}
          routeOptions={[]}
        />,
      );

      fields.forEach((field) => {
        const fieldRoot = container.querySelector(`[data-editor-field-id="${field.id}"]`);
        expect(fieldRoot, `${definition.kind}/${field.id} field`).toBeTruthy();
        triggerField(field, fieldRoot, settings);
        expect(onSettingChange, `${definition.kind}/${field.id} callback`).toHaveBeenCalledWith(
          field.id,
          expect.anything(),
        );
        onSettingChange.mockClear();
      });
    });
  }, 30000);
});
