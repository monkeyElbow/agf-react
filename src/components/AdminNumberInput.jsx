import { useEffect, useRef, useState } from 'react';

function toDraftValue(value) {
  if (value === '' || value == null) {
    return '';
  }
  return String(value);
}

function parseConstraint(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function countStepDecimals(stepValue) {
  const source = String(stepValue ?? '').trim();
  if (!source || !source.includes('.')) {
    return 0;
  }
  return source.split('.')[1].length;
}

function clampNumericValue(value, min, max) {
  let next = value;
  if (Number.isFinite(min)) {
    next = Math.max(min, next);
  }
  if (Number.isFinite(max)) {
    next = Math.min(max, next);
  }
  return next;
}

function normalizeSteppedValue(value, stepValue) {
  const decimals = Math.min(6, countStepDecimals(stepValue));
  if (!decimals) {
    return Math.round(value);
  }
  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}

export default function AdminNumberInput({
  value,
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  onWheel,
  min,
  max,
  step,
  ...props
}) {
  const isFocusedRef = useRef(false);
  const [draftValue, setDraftValue] = useState(() => toDraftValue(value));

  const commitStepChange = (direction) => {
    const fallbackValue = Number(value);
    const currentValue = Number(draftValue);
    const baseValue = Number.isFinite(currentValue)
      ? currentValue
      : (Number.isFinite(fallbackValue) ? fallbackValue : 0);
    const stepAmount = parseConstraint(step) ?? 1;
    const minValue = parseConstraint(min);
    const maxValue = parseConstraint(max);
    const nextValue = normalizeSteppedValue(
      clampNumericValue(baseValue + (direction * stepAmount), minValue, maxValue),
      stepAmount,
    );
    setDraftValue(String(nextValue));
    onChange?.(nextValue);
  };

  useEffect(() => {
    if (!isFocusedRef.current) {
      setDraftValue(toDraftValue(value));
    }
  }, [value]);

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      role={props.role || 'spinbutton'}
      aria-valuemin={parseConstraint(min) ?? undefined}
      aria-valuemax={parseConstraint(max) ?? undefined}
      aria-valuenow={Number.isFinite(Number(draftValue)) ? Number(draftValue) : undefined}
      value={draftValue}
      onFocus={(event) => {
        isFocusedRef.current = true;
        onFocus?.(event);
      }}
      onChange={(event) => {
        const nextRaw = event.target.value;
        setDraftValue(nextRaw);
        if (nextRaw === '') {
          onChange?.('');
          return;
        }
        const numeric = Number(nextRaw);
        if (Number.isFinite(numeric)) {
          onChange?.(numeric);
        }
      }}
      onBlur={(event) => {
        isFocusedRef.current = false;
        const nextRaw = event.target.value;
        if (nextRaw === '') {
          setDraftValue('');
          onChange?.('');
        } else {
          const numeric = Number(nextRaw);
          if (Number.isFinite(numeric)) {
            setDraftValue(String(numeric));
            onChange?.(numeric);
          } else {
            setDraftValue(toDraftValue(value));
          }
        }
        onBlur?.(event);
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          event.preventDefault();
          if (!event.repeat) {
            commitStepChange(event.key === 'ArrowUp' ? 1 : -1);
          }
          return;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          setDraftValue(toDraftValue(value));
          event.currentTarget.blur();
          return;
        }
        if (event.key === 'Enter') {
          event.currentTarget.blur();
          return;
        }
        onKeyDown?.(event);
      }}
      onWheel={(event) => {
        if (document.activeElement === event.currentTarget) {
          event.currentTarget.blur();
        }
        onWheel?.(event);
      }}
    />
  );
}
