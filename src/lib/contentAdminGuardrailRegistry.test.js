import { describe, expect, it } from 'vitest';
import {
  CONTENT_ADMIN_GUARDRAILS,
  getContentAdminGuardrail,
} from './contentAdminGuardrailRegistry';

describe('content admin guardrail registry', () => {
  it('requires every durable rule to preserve a legitimate admin action', () => {
    expect(CONTENT_ADMIN_GUARDRAILS.map((guardrail) => guardrail.id)).toEqual([
      'one-running-authority',
      'save-truth',
      'publish-sequencing',
      'publish-receipt',
      'no-restart-dependency',
      'browser-proof',
    ]);
    CONTENT_ADMIN_GUARDRAILS.forEach((guardrail) => {
      expect(guardrail.durableRule).toBeTruthy();
      expect(guardrail.legitimateAdminAction).toBeTruthy();
      expect(guardrail.verification).toBeTruthy();
    });
  });

  it('keeps lookup centralized and reports unknown guardrails explicitly', () => {
    expect(getContentAdminGuardrail('save-truth')).toMatchObject({ id: 'save-truth' });
    expect(getContentAdminGuardrail('missing')).toBeNull();
  });
});
