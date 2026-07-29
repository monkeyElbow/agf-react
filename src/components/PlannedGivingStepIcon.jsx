import cgaStep2Svg from '../assets/planned-giving-step-icons/pg-cga-step2.svg?raw';
import cgaStep3Svg from '../assets/planned-giving-step-icons/pg-cga-step3.svg?raw';
import crtStep2Svg from '../assets/planned-giving-step-icons/pg-crt-step2.svg?raw';
import dafStep1Svg from '../assets/planned-giving-step-icons/pg-daf-step1.svg?raw';
import dafStep2Svg from '../assets/planned-giving-step-icons/pg-daf-step2.svg?raw';
import dafStep3Svg from '../assets/planned-giving-step-icons/pg-daf-step3.svg?raw';
import endowmentsStep1Svg from '../assets/planned-giving-step-icons/pg-endowments-step1.svg?raw';
import endowmentsStep3Svg from '../assets/planned-giving-step-icons/pg-endowments-step3.svg?raw';
import mifStep2Svg from '../assets/planned-giving-step-icons/pg-mif-step2.svg?raw';
import mifStep3Svg from '../assets/planned-giving-step-icons/pg-mif-step3.svg?raw';
import qcdStep3Svg from '../assets/planned-giving-step-icons/pg-qcd-step3.svg?raw';

const STEP_ICON_SVG_BY_KEY = Object.freeze({
  'cga-step-2': cgaStep2Svg,
  'cga-step-3': cgaStep3Svg,
  'crt-step-2': crtStep2Svg,
  'daf-step-1': dafStep1Svg,
  'daf-step-2': dafStep2Svg,
  'daf-step-3': dafStep3Svg,
  'endowments-step-1': endowmentsStep1Svg,
  'endowments-step-3': endowmentsStep3Svg,
  'mif-step-2': mifStep2Svg,
  'mif-step-3': mifStep3Svg,
  'qcd-step-3': qcdStep3Svg,
});

export const PLANNED_GIVING_STEP_ICON_KEYS = Object.freeze(Object.keys(STEP_ICON_SVG_BY_KEY));

export default function PlannedGivingStepIcon({
  iconKey,
  tone = '',
  className = '',
  fadeDelayMs,
  fadeRootMargin = '',
}) {
  const normalizedIconKey = String(iconKey || '').trim();
  const svgMarkup = STEP_ICON_SVG_BY_KEY[normalizedIconKey];
  if (!svgMarkup) {
    return null;
  }

  const toneClassName = String(tone || '').trim()
    ? ` is-tone-${String(tone || '').trim()}`
    : '';
  const extraClassName = String(className || '').trim()
    ? ` ${String(className || '').trim()}`
    : '';
  const normalizedFadeDelayMs = Number(fadeDelayMs);
  const fadeDelayAttribute = Number.isFinite(normalizedFadeDelayMs)
    ? Math.max(0, normalizedFadeDelayMs)
    : undefined;
  const normalizedFadeRootMargin = String(fadeRootMargin || '').trim() || undefined;

  return (
    <span
      className={`planned-giving-step-icon${toneClassName}${extraClassName}`}
      data-planned-giving-step-icon={normalizedIconKey}
      data-fade-delay-ms={fadeDelayAttribute}
      data-fade-root-margin={normalizedFadeRootMargin}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}
