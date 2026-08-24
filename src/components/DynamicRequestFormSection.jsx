import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  createInitialFormValues,
  formatFormPhoneInput,
  normalizeFormSubmissionConfig,
  validateRequiredFormFields,
} from '../blocks/foundation/forms';
import { parseTextHighlights, renderTextWithHighlights } from '../lib/dynamicPageBlocks';
import SafeRichText from './SafeRichText';

function normalizeHtmlContent(value) {
  const html = String(value || '').trim();
  if (!html || html === '<p></p>' || html === '<p><br></p>') {
    return '';
  }
  return html;
}

function formatZipValue(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 10);
}

function renderTextWithStrong(source) {
  const text = String(source || '');
  if (!text.includes('**')) {
    return text;
  }

  const chunks = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return chunks.map((chunk, index) => {
    const isStrong = chunk.startsWith('**') && chunk.endsWith('**') && chunk.length > 4;
    if (!isStrong) {
      return <span key={`t-${index}`}>{chunk}</span>;
    }
    return <strong key={`s-${index}`}>{chunk.slice(2, -2)}</strong>;
  });
}

function getStepNextLabel(step) {
  const label = String(step?.nextLabel || '').trim();
  return label || 'Go to next step';
}

function getStepBackLabel(step) {
  const label = String(step?.backLabel || '').trim();
  return label || 'Back';
}

function isGenericStepLabel(value) {
  return /^step\s*\d+\b/i.test(String(value || '').trim());
}

export default function DynamicRequestFormSection({ config }) {
  const steps = useMemo(
    () => (Array.isArray(config?.steps)
      ? config.steps.filter((step) => Array.isArray(step?.fields) && step.fields.length)
      : []),
    [config],
  );
  const [activeStep, setActiveStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [values, setValues] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const fieldRefs = useRef({});
  const startedAtRef = useRef(Date.now());
  const idPrefix = useId();

  useEffect(() => {
    fieldRefs.current = {};
    startedAtRef.current = Date.now();
    setValues(createInitialFormValues(steps.flatMap((step) => step.fields), { multiValueTypes: ['checkbox-group'] }));
    setActiveStep(0);
    setSubmitted(false);
    setErrorMessage('');
    setElapsedTime(0);
  }, [config, steps]);

  const setFieldRef = (fieldId) => (node) => {
    if (node) {
      fieldRefs.current[fieldId] = node;
    } else {
      delete fieldRefs.current[fieldId];
    }
  };

  const focusField = (fieldId) => {
    const element = fieldRefs.current[fieldId];
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  };

  const onChangeField = (fieldId, nextValue) => {
    setValues((prev) => ({ ...prev, [fieldId]: nextValue }));
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const validateStep = (step) => {
    if (!step) {
      return '';
    }
    return validateRequiredFormFields(step.fields, values, {
      multiValueTypes: ['checkbox-group'],
      fileValueTypes: ['file'],
      resolveMessage: (field) => String(field?.errorMessage || '').trim() || `Please complete "${field.label}".`,
    });
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const currentStep = steps[activeStep];
    const validationMessage = validateStep(currentStep);
    if (validationMessage) {
      setErrorMessage(validationMessage);
      const firstRequired = (currentStep?.fields || []).find((field) => field?.required);
      if (firstRequired?.id) {
        focusField(firstRequired.id);
      }
      return;
    }
    setErrorMessage('');
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
      return;
    }
    setElapsedTime(Math.round((Date.now() - startedAtRef.current) / 1000));
    setSubmitted(true);
  };

  const currentStep = steps[activeStep] || null;
  const { submitLabel, successMessage, salesforceUrl } = normalizeFormSubmissionConfig(config, {
    submitLabel: 'Submit request',
    successMessage: 'Thanks. We received your request.',
  });
  const bodyHtml = normalizeHtmlContent(config?.bodyHtml);
  const bodyParagraphs = String(config?.body || '')
    .split(/\n\s*\n/)
    .map((paragraph) => String(paragraph || '').trim())
    .filter(Boolean);
  const stepHeading = String(currentStep?.title || '').trim();
  const showStepHeading = !config?.hideStepTitles && Boolean(stepHeading) && !isGenericStepLabel(stepHeading);

  if (submitted) {
    return (
      <div
        className={`native-info-inline-form dynamic-request-form dynamic-request-panel fade-up is-success${config?.formClassName ? ` ${config.formClassName}` : ''}`}
        role="status"
      >
        <h5>Thank you.</h5>
        <p>{successMessage}</p>
        {elapsedTime > 0 ? <p className="dynamic-request-elapsed">Submitted in about {elapsedTime} seconds.</p> : null}
        {salesforceUrl ? <p className="dynamic-cta-form-salesforce-note">Endpoint saved for wiring: {salesforceUrl}</p> : null}
      </div>
    );
  }

  if (!currentStep) {
    return null;
  }

  return (
    <div className="dynamic-request-layout dynamic-request-shell">
      <div className={`native-info-inline-form dynamic-request-form dynamic-request-panel fade-up${config?.formClassName ? ` ${config.formClassName}` : ''}`}>
        {showStepHeading || currentStep?.note || currentStep?.alert ? (
          <div className="dynamic-request-step-meta">
            {showStepHeading ? <h5>{stepHeading}</h5> : null}
            {currentStep?.note ? <p className="dynamic-request-note">{currentStep.note}</p> : null}
            {currentStep?.alert ? <p className="dynamic-request-alert">{currentStep.alert}</p> : null}
          </div>
        ) : null}
        <form onSubmit={onSubmit} noValidate>
          <div className="dynamic-request-grid">
            {currentStep.fields.map((field) => {
              const fieldId = `${idPrefix}-request-${field.id}`;
              const fieldClassName = `dynamic-request-field${field.full ? ' full' : ''}`;
              if (field.type === 'textarea') {
                return (
                  <label key={field.id} htmlFor={fieldId} className={fieldClassName}>
                    {field.label}
                    <textarea
                      id={fieldId}
                      rows={field.rows || 3}
                      placeholder={field.placeholder || undefined}
                      required={field.required}
                      value={values[field.id] || ''}
                      onChange={(event) => onChangeField(field.id, event.target.value)}
                      ref={setFieldRef(field.id)}
                    />
                    {field.help ? <small className="dynamic-request-help">{field.help}</small> : null}
                  </label>
                );
              }
              if (field.type === 'select') {
                const options = Array.isArray(field.options) ? field.options : [];
                return (
                  <label key={field.id} htmlFor={fieldId} className={fieldClassName}>
                    {field.label}
                    <select
                      id={fieldId}
                      required={field.required}
                      value={values[field.id] || ''}
                      onChange={(event) => onChangeField(field.id, event.target.value)}
                      ref={setFieldRef(field.id)}
                    >
                      <option value="" disabled>{field.placeholder || 'Select one'}</option>
                      {options.map((option) => (
                        <option key={`${field.id}-${option.value || option.label}`} value={option.value || option.label}>
                          {option.label || option.value}
                        </option>
                      ))}
                    </select>
                    {field.help ? <small className="dynamic-request-help">{field.help}</small> : null}
                  </label>
                );
              }
              if (field.type === 'radio-group') {
                const options = Array.isArray(field.options) ? field.options : [];
                return (
                  <fieldset key={field.id} className={`dynamic-request-fieldset${field.full ? ' full' : ''}`}>
                    <legend>{field.label}</legend>
                    <div className="dynamic-request-choice-row">
                      {options.map((option, index) => (
                        <label key={`${field.id}-${option.value || option.label}`} htmlFor={`${fieldId}-${option.value || option.label}`}>
                          <input
                            id={`${fieldId}-${option.value || option.label}`}
                            type="radio"
                            name={field.id}
                            value={option.value || option.label}
                            checked={values[field.id] === (option.value || option.label)}
                            onChange={(event) => onChangeField(field.id, event.target.value)}
                            required={field.required}
                            ref={index === 0 ? setFieldRef(field.id) : undefined}
                          />
                          <span>{option.label || option.value}</span>
                        </label>
                      ))}
                    </div>
                    {field.help ? <small className="dynamic-request-help">{field.help}</small> : null}
                  </fieldset>
                );
              }
              if (field.type === 'checkbox-group') {
                const selectedValues = Array.isArray(values[field.id]) ? values[field.id] : [];
                const options = Array.isArray(field.options) ? field.options : [];
                return (
                  <fieldset key={field.id} className={`dynamic-request-fieldset${field.full ? ' full' : ''}`}>
                    <legend>{field.label}</legend>
                    <div className="dynamic-request-choice-row">
                      {options.map((option, index) => {
                        const optionValue = option.value || option.label;
                        const isChecked = selectedValues.includes(optionValue);
                        return (
                          <label key={`${field.id}-${optionValue}`} htmlFor={`${fieldId}-${optionValue}`}>
                            <input
                              id={`${fieldId}-${optionValue}`}
                              type="checkbox"
                              name={field.id}
                              value={optionValue}
                              checked={isChecked}
                              onChange={(event) => {
                                const nextChecked = event.target.checked;
                                onChangeField(
                                  field.id,
                                  nextChecked
                                    ? Array.from(new Set([...selectedValues, optionValue]))
                                    : selectedValues.filter((value) => value !== optionValue),
                                );
                              }}
                              ref={index === 0 ? setFieldRef(field.id) : undefined}
                            />
                            <span>{option.label || option.value}</span>
                          </label>
                        );
                      })}
                    </div>
                    {field.help ? <small className="dynamic-request-help">{field.help}</small> : null}
                  </fieldset>
                );
              }
              if (field.type === 'file') {
                return (
                  <label key={field.id} htmlFor={fieldId} className={fieldClassName}>
                    {field.label}
                    <input
                      id={fieldId}
                      type="file"
                      onChange={(event) => onChangeField(field.id, event.target.files?.[0] || '')}
                      ref={setFieldRef(field.id)}
                    />
                    {field.help ? <small className="dynamic-request-help">{field.help}</small> : null}
                  </label>
                );
              }
              return (
                <label key={field.id} htmlFor={fieldId} className={fieldClassName}>
                  {field.label}
                  <input
                    id={fieldId}
                    type={field.type || 'text'}
                    placeholder={field.placeholder || undefined}
                    required={field.required}
                    value={values[field.id] || ''}
                    maxLength={field.maxLength || undefined}
                    onChange={(event) => {
                      let nextValue = event.target.value;
                      if (field.format === 'phone') {
                        nextValue = formatFormPhoneInput(nextValue);
                      } else if (field.format === 'zip') {
                        nextValue = formatZipValue(nextValue);
                      }
                      onChangeField(field.id, nextValue);
                    }}
                    ref={setFieldRef(field.id)}
                  />
                  {field.help ? <small className="dynamic-request-help">{field.help}</small> : null}
                </label>
              );
            })}
          </div>
          {errorMessage ? <p className="dynamic-request-error" role="alert">{errorMessage}</p> : null}
          <div className="native-info-inline-form-step-actions">
            {activeStep > 0 ? (
              <button
                type="button"
                className="service-native-btn is-ghost"
                onClick={() => setActiveStep((prev) => Math.max(prev - 1, 0))}
              >
                {getStepBackLabel(currentStep)}
              </button>
            ) : (
              <span className="native-info-inline-form-step-spacer" aria-hidden="true" />
            )}
            <button type="submit" className="service-native-btn">
              {activeStep === steps.length - 1 ? submitLabel : getStepNextLabel(currentStep)}
            </button>
          </div>
          {steps.length > 1 ? (
            <div className="native-info-inline-form-progress dynamic-request-progress" aria-hidden="true">
              {steps.map((step, index) => (
                <span
                  key={step.id || `step-${index + 1}`}
                  className={`native-info-inline-form-dot dynamic-request-progress-dot${index === activeStep ? ' is-active' : ''}`}
                />
              ))}
            </div>
          ) : null}
        </form>
      </div>
      <div className="native-info-section-copy dynamic-request-copy dynamic-request-copy-shell fade-up">
        {config?.title ? (
          <h2
            className={String(config.titleClassName || '').trim() || undefined}
            dangerouslySetInnerHTML={{
              __html: renderTextWithHighlights(
                config.title,
                parseTextHighlights(config.titleHighlightsJson),
              ),
            }}
          />
        ) : null}
        {config?.subtitle ? <p className="dynamic-request-subtitle">{renderTextWithStrong(config.subtitle)}</p> : null}
        {bodyHtml ? (
          <SafeRichText
            as="div"
            className={`native-info-rich-html dynamic-request-body${config?.bodyColorClassName ? ` ${config.bodyColorClassName}` : ''}`}
            html={bodyHtml}
          />
        ) : (
          bodyParagraphs.map((paragraph) => (
            <p
              key={paragraph}
              className={`dynamic-request-body${config?.bodyColorClassName ? ` ${config.bodyColorClassName}` : ''}`}
            >
              {renderTextWithStrong(paragraph)}
            </p>
          ))
        )}
      </div>
    </div>
  );
}
