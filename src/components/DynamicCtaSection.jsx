import { useEffect, useMemo, useState } from 'react';
import {
  createInitialFormValues,
  formatFormPhoneInput,
  normalizeFollowUpSubmitLabel,
  validateRequiredFormFields,
} from '../blocks/foundation/forms';
import {
  buildDynamicCtaPresentationClassName,
  buildDynamicCtaFormFromBlock,
  renderTextWithHighlights,
} from '../lib/dynamicPageBlocks';
import BlockOwnershipOverlay from './BlockOwnershipOverlay';
const CTA_DYNAMIC_SUBMIT_STYLE_SET = new Set(['blue', 'dark', 'outline']);
const CTA_DYNAMIC_SUBMIT_TONE_SET = new Set(['atlantean', 'super-grey', 'mango', 'melon', 'white']);
const EMPTY_CTA_FIELDS = Object.freeze([]);

function normalizeDynamicCtaSubmitStyle(value) {
  const token = String(value || '').trim().toLowerCase();
  return CTA_DYNAMIC_SUBMIT_STYLE_SET.has(token) ? token : 'blue';
}

function normalizeDynamicCtaSubmitTone(value, submitStyle = 'blue') {
  const token = String(value || '').trim().toLowerCase();
  if (normalizeDynamicCtaSubmitStyle(submitStyle) === 'outline' && CTA_DYNAMIC_SUBMIT_TONE_SET.has(token)) {
    return token;
  }
  return submitStyle === 'dark' ? 'super-grey' : 'atlantean';
}

function buildDynamicCtaSubmitButtonClassName(baseClassName, settings) {
  const submitStyle = normalizeDynamicCtaSubmitStyle(settings?.submitStyle);
  const submitTone = normalizeDynamicCtaSubmitTone(settings?.submitTone, submitStyle);
  const classNames = String(baseClassName || 'service-native-btn')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => (
      token !== 'is-dark'
      && token !== 'is-outline'
      && !token.startsWith('is-tone-')
    ));

  if (submitStyle === 'dark') {
    classNames.push('is-dark');
  }
  if (submitStyle === 'outline') {
    classNames.push('is-outline');
  }
  classNames.push(`is-tone-${submitTone}`);

  return Array.from(new Set(classNames)).join(' ');
}

export default function DynamicCtaSection({
  managedBlocks = [],
  defaultSettings = {},
  sectionClassName = 'service-native-section',
  sectionHudClassName = '',
  ownership = null,
  hudAnchor = null,
  formWrapperClassName = '',
  submitButtonClassName = 'service-native-btn',
  fieldIdPrefix = 'dynamic-cta',
  onSubmitData = null,
  titlePlacement = 'outside',
  renderDefaultWhenMissing = false,
}) {
  const [values, setValues] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const ctaBlockRecord = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'cta_form'
      && block?.kind === 'cta_form'
    )) || null
  ), [managedBlocks]);
  const ctaBlockHidden = ctaBlockRecord?.hidden === true || ctaBlockRecord?.hidden === 'true';
  const dynamicCtaBlock = ctaBlockRecord
    && ctaBlockRecord.mode === 'dynamic'
    && !ctaBlockHidden
    ? ctaBlockRecord
    : null;

  const runtime = useMemo(() => {
    if (dynamicCtaBlock) {
      return buildDynamicCtaFormFromBlock(dynamicCtaBlock);
    }
    if (!renderDefaultWhenMissing) {
      return null;
    }
    return buildDynamicCtaFormFromBlock({
      id: 'cta_form',
      kind: 'cta_form',
      mode: 'dynamic',
      settings: defaultSettings,
    });
  }, [defaultSettings, dynamicCtaBlock, renderDefaultWhenMissing]);

  const title = String(runtime?.title || '').trim();
  const titleClassName = String(runtime?.titleClassName || '').trim();
  const titleHighlights = Array.isArray(runtime?.titleHighlights) ? runtime.titleHighlights : [];
  const bodyHtml = String(runtime?.bodyHtml || '').trim();
  const bodyColorClassName = String(runtime?.bodyColorClassName || '').trim();
  const fineprint = String(runtime?.fineprint || '').trim();
  const subtitle = String(runtime?.subtitle || '').trim();
  const bgTone = String(runtime?.bgTone || 'white').trim().toLowerCase() || 'white';
  const submitLabel = normalizeFollowUpSubmitLabel(runtime?.submitLabel);
  const successMessage = String(runtime?.successMessage || '').trim() || 'Thanks. We’ll reach out soon.';
  const salesforceUrl = String(runtime?.salesforceUrl || '').trim();
  const resolvedSubmitButtonClassName = useMemo(
    () => buildDynamicCtaSubmitButtonClassName(submitButtonClassName, runtime),
    [runtime, submitButtonClassName],
  );
  const fields = Array.isArray(runtime?.fields) ? runtime.fields : EMPTY_CTA_FIELDS;
  const renderTitleInsideShell = titlePlacement === 'inside';
  const presentationClassName = useMemo(
    () => buildDynamicCtaPresentationClassName(runtime),
    [runtime],
  );

  useEffect(() => {
    setValues(createInitialFormValues(fields, { multiValueTypes: ['multiselect'], booleanTypes: ['checkbox'] }));
    setSubmitted(false);
    setErrorMessage('');
  }, [fields]);

  if (ctaBlockHidden) {
    return null;
  }
  if (!runtime) {
    return null;
  }

  const onFieldChange = (field, nextValue) => {
    setValues((prev) => ({
      ...prev,
      [field.id]: field.type === 'tel' ? formatFormPhoneInput(nextValue) : nextValue,
    }));
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const validationMessage = validateRequiredFormFields(fields, values, {
      multiValueTypes: ['multiselect'],
      booleanTypes: ['checkbox'],
      resolveMessage: (field) => `Please complete "${field.label}" before submitting.`,
    });
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    if (typeof onSubmitData === 'function') {
      onSubmitData({ values, fields, settings: dynamicCtaBlock?.settings || defaultSettings, runtime });
    }
    setErrorMessage('');
    setValues(createInitialFormValues(fields, { multiValueTypes: ['multiselect'], booleanTypes: ['checkbox'] }));
    if (!fields.length) {
      return;
    }
    setSubmitted(true);
  };

  const formClassName = ['native-info-inline-form', 'dynamic-cta-form', String(formWrapperClassName || '').trim()]
    .filter(Boolean)
    .join(' ');
  const headingMarkup = title ? (
    <div className="dynamic-cta-form-heading">
      <h5 className="dynamic-cta-form-title">
        <span
          dangerouslySetInnerHTML={{
            __html: renderTextWithHighlights(title, titleHighlights),
          }}
        />
      </h5>
      {subtitle ? <p className="dynamic-cta-form-subtitle">{subtitle}</p> : null}
      {renderTitleInsideShell && bodyHtml ? (
        <div className={`native-info-rich-html dynamic-cta-form-callout${bodyColorClassName ? ` ${bodyColorClassName}` : ''}`} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      ) : null}
    </div>
  ) : null;

  return (
    <section
      className={`${sectionClassName} native-dynamic-cta is-bg-${bgTone}${presentationClassName ? ` ${presentationClassName}` : ''}${sectionHudClassName ? ` ${sectionHudClassName}` : ''}${ownership?.className || ''}`}
      data-block-id={dynamicCtaBlock?.id || 'cta_form'}
      data-cta-display-mode={runtime?.displayMode || 'default'}
      data-cta-trigger-mode={runtime?.triggerMode || 'default'}
    >
      <BlockOwnershipOverlay ownership={ownership} />
      {hudAnchor}
      <div className="ag-panel-rail">
        {!renderTitleInsideShell ? (
          <div className="native-info-section-copy">
            <h2 className={titleClassName || undefined}>
              <span
                dangerouslySetInnerHTML={{
                  __html: renderTextWithHighlights(title, titleHighlights),
                }}
              />
            </h2>
          </div>
        ) : null}

        {submitted ? (
          <div
            className={formClassName}
            aria-label={title}
            data-cta-state="success"
            data-cta-display-mode={runtime?.displayMode || 'default'}
            data-cta-trigger-mode={runtime?.triggerMode || 'default'}
          >
            {renderTitleInsideShell ? headingMarkup : null}
            <div className="dynamic-cta-form-success" role="status">
              <h5>Thank you.</h5>
              <p>{successMessage}</p>
              {salesforceUrl ? (
                <p className="dynamic-cta-form-salesforce-note">Salesforce endpoint saved for future wiring: {salesforceUrl}</p>
              ) : null}
            </div>
          </div>
        ) : (
          <div
            className={formClassName}
            aria-label={title}
            data-cta-state="ready"
            data-cta-display-mode={runtime?.displayMode || 'default'}
            data-cta-trigger-mode={runtime?.triggerMode || 'default'}
          >
            <form onSubmit={onSubmit} noValidate>
              {renderTitleInsideShell ? headingMarkup : null}
              {fields.map((field) => {
                const fieldId = `${fieldIdPrefix}-${field.id}`;
                const options = Array.isArray(field.options) ? field.options : [];

                if (field.type === 'multiselect') {
                  const selectedValues = Array.isArray(values[field.id]) ? values[field.id] : [];
                  return (
                    <label key={field.id} htmlFor={fieldId}>
                      {field.label}
                      <select
                        id={fieldId}
                        multiple
                        size={Math.min(Math.max(options.length || 3, 3), 8)}
                        value={selectedValues}
                        onChange={(event) => {
                          const nextValues = Array.from(event.target.selectedOptions || []).map((option) => option.value);
                          onFieldChange(field, nextValues);
                        }}
                        required={Boolean(field.required)}
                      >
                        {options.map((option) => (
                          <option key={`${field.id}-${option.value}`} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                  );
                }

                if (field.type === 'select') {
                  return (
                    <label key={field.id} htmlFor={fieldId}>
                      {field.label}
                      <select
                        id={fieldId}
                        value={String(values[field.id] || '')}
                        onChange={(event) => onFieldChange(field, event.target.value)}
                        required={Boolean(field.required)}
                      >
                        <option value="">{field.placeholder || 'Select one'}</option>
                        {options.map((option) => (
                          <option key={`${field.id}-${option.value}`} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                  );
                }

                if (field.type === 'textarea') {
                  return (
                    <label key={field.id} htmlFor={fieldId}>
                      {field.label}
                      <textarea
                        id={fieldId}
                        rows={4}
                        placeholder={field.placeholder || undefined}
                        value={values[field.id] || ''}
                        onChange={(event) => onFieldChange(field, event.target.value)}
                        required={Boolean(field.required)}
                      />
                    </label>
                  );
                }

                if (field.type === 'checkbox') {
                  return (
                    <label key={field.id} htmlFor={fieldId} className="dynamic-cta-checkbox-field">
                      <span>{field.label}</span>
                      <input
                        id={fieldId}
                        type="checkbox"
                        checked={Boolean(values[field.id])}
                        onChange={(event) => onFieldChange(field, event.target.checked)}
                        required={Boolean(field.required)}
                      />
                    </label>
                  );
                }

                return (
                  <label key={field.id} htmlFor={fieldId}>
                    {field.label}
                    <input
                      id={fieldId}
                      type={field.type || 'text'}
                      placeholder={field.placeholder || undefined}
                      value={values[field.id] || ''}
                      onChange={(event) => onFieldChange(field, event.target.value)}
                      required={Boolean(field.required)}
                    />
                  </label>
                );
              })}
              {errorMessage ? <p className="dynamic-cta-form-error" role="alert">{errorMessage}</p> : null}
              {!renderTitleInsideShell && bodyHtml ? (
                <div className={`native-info-rich-html dynamic-cta-form-callout${bodyColorClassName ? ` ${bodyColorClassName}` : ''}`} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
              ) : null}
              {fineprint ? <p className="dynamic-cta-form-fineprint">{fineprint}</p> : null}
              <button type="submit" className={resolvedSubmitButtonClassName}>{submitLabel}</button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
