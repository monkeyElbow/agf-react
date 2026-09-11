import { describe, expect, it } from 'vitest';
import { getAllBlockDefinitions } from '../blocks/registry';
import { getAllBlockTemplateBlueprints } from '../data/contentBlockBlueprints';
import {
  buildEditorControlRuntime,
  createEditorControlProbeBlock,
  createEditorControlProbeValue,
  getEditorControlFields,
  patchEditorControl,
} from './editorControlContract';

function serialize(value) {
  return JSON.stringify(value, (_key, candidate) => (
    typeof candidate === 'function' ? '[function]' : candidate
  ));
}

function uniqueFields(fields) {
  const seen = new Set();
  return fields.filter((field) => {
    const fieldId = String(field?.id || '').trim();
    if (!fieldId || seen.has(fieldId)) {
      return false;
    }
    seen.add(fieldId);
    return true;
  });
}

function createBaseBlock(definition) {
  const sample = getAllBlockTemplateBlueprints().find((block) => block?.kind === definition.kind);
  return createEditorControlProbeBlock(definition, {
    id: `reachability-probe-${definition.kind}`,
    ...(sample || {}),
    settings: {
      ...(sample?.settings || {}),
    },
  });
}

function auditBlock(definition) {
  const fields = uniqueFields(getEditorControlFields(definition.kind, 'admin'));
  const baseBlock = createBaseBlock(definition);
  const failures = [];
  const review = [];
  let runtime = null;

  try {
    runtime = buildEditorControlRuntime(definition, baseBlock);
  } catch (error) {
    failures.push(`${definition.kind}/<block> runtime threw: ${error.message}`);
  }

  fields.forEach((field) => {
    const fieldId = String(field.id || '').trim();
    const nextValue = createEditorControlProbeValue(field, {
      kind: definition.kind,
      currentValue: baseBlock.settings?.[fieldId],
      variant: 'reachability-next',
    });
    const patchedBlock = patchEditorControl(baseBlock, field, nextValue);
    if (!Object.prototype.hasOwnProperty.call(patchedBlock.settings || {}, fieldId)) {
      failures.push(`${definition.kind}/${fieldId} setting was dropped before runtime`);
      return;
    }

    let nextRuntime;
    try {
      nextRuntime = buildEditorControlRuntime(definition, patchedBlock);
    } catch (error) {
      failures.push(`${definition.kind}/${fieldId} runtime threw: ${error.message}`);
      return;
    }

    if (runtime == null || nextRuntime == null) {
      review.push(`${definition.kind}/${fieldId} runtime fixture did not render`);
      return;
    }
    if (serialize(runtime) === serialize(nextRuntime)) {
      review.push(`${definition.kind}/${fieldId} runtime output did not change; verify conditional/CSS consumer`);
    }
  });

  return {
    kind: definition.kind,
    controls: fields.length,
    failures,
    review,
  };
}

describe('editor control reachability audit', () => {
  it('audits every registered block and reports hard failures separately from controls requiring visual review', () => {
    const reports = getAllBlockDefinitions().map(auditBlock);
    const failures = reports.flatMap((report) => report.failures);
    const reviewCount = reports.reduce((total, report) => total + report.review.length, 0);

    reports.forEach((report) => {
      const status = report.failures.length ? 'FAIL' : 'PASS';
      console.log(
        `[CONTROL AUDIT] ${status} ${report.kind}: ${report.controls} controls, `
        + `${report.failures.length} hard failures, ${report.review.length} unverified visual effects`,
      );
      if (report.failures.length) {
        console.error(`[CONTROL AUDIT] ${report.failures.join(' | ')}`);
      }
    });
    if (reviewCount) {
      console.warn(
        `[CONTROL AUDIT] ${reviewCount} controls are unverified by unit/runtime tests; `
        + 'this is not a failure. Use browser/computed-style proof for these controls.',
      );
    }

    expect(failures, 'editor control reachability hard failures').toEqual([]);
  }, 30000);
});
