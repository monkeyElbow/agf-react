import { HERO_SEED_CONTRACTS_BY_PATH } from './heroSeedContracts';

const HERO_RENDER_CONTRACTS_BY_PATH = {
  '/': {
    rootSelector: '.home-native-hero',
    lineSelector: 'p, h1',
    actionScopeSelector: '.service-native-action-row',
    enforceHighlightColors: true,
  },
};

const HERO_CLASS_COLOR_MAP = {
  'is-atlantean': 'rgb(0, 173, 187)',
  'is-mango': 'rgb(250, 163, 26)',
  'is-melon': 'rgb(242, 102, 96)',
  'is-super-grey': 'rgb(65, 64, 66)',
  'is-sandstone': 'rgb(196, 190, 182)',
  'is-white': 'rgb(255, 255, 255)',
};

const loggedHeroRenderDriftKeys = new Set();

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeCssColor(value) {
  return String(value || '').replace(/\s+/g, '').toLowerCase();
}

function parseHighlightsJson(rawValue) {
  try {
    const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue || '[]') : rawValue;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toIssue(field, label) {
  return { field, label };
}

export function summarizeHeroRenderIssues(issues, maxItems = 4) {
  const labels = (Array.isArray(issues) ? issues : [])
    .map((issue) => String(issue?.label || '').trim())
    .filter(Boolean);
  if (!labels.length) {
    return '';
  }
  if (labels.length <= maxItems) {
    return labels.join(', ');
  }
  return `${labels.slice(0, maxItems).join(', ')} +${labels.length - maxItems} more`;
}

export function formatHeroRenderWarningMessage(report, source = 'Hero') {
  const pathname = String(report?.pathname || '').trim() || '(unknown path)';
  const summary = summarizeHeroRenderIssues(report?.issues);
  return `${source} render drift detected for ${pathname}. Missing/incorrect: ${summary}.`;
}

export function logHeroRenderWarningOnce(report, source = 'Hero') {
  if (!import.meta.env.DEV || !report?.hasDrift) {
    return;
  }
  const key = `${source}|${report.pathname}|${report.signature}`;
  if (loggedHeroRenderDriftKeys.has(key)) {
    return;
  }
  loggedHeroRenderDriftKeys.add(key);
  console.warn(formatHeroRenderWarningMessage(report, source));
}

export function inspectHeroRender(rootNode, pathname, options = {}) {
  const renderContract = HERO_RENDER_CONTRACTS_BY_PATH[String(pathname || '').trim()];
  const heroContract = options?.heroContract || HERO_SEED_CONTRACTS_BY_PATH[String(pathname || '').trim()];
  const scope = rootNode && typeof rootNode.querySelector === 'function' ? rootNode : null;
  const styleReader = typeof options?.styleReader === 'function'
    ? options.styleReader
    : ((node) => window.getComputedStyle(node));
  const issues = [];

  if (!renderContract || !heroContract || !scope) {
    return {
      pathname,
      hasDrift: false,
      issues: [],
      signature: '',
    };
  }

  const heroRoot = scope.querySelector(renderContract.rootSelector);
  if (!heroRoot) {
    issues.push(toIssue('heroRoot', 'Hero root missing'));
  } else {
    if (!heroRoot.classList.contains(`is-bg-${heroContract.bgTone}`)) {
      issues.push(toIssue('bgTone', `Missing hero background class is-bg-${heroContract.bgTone}`));
    }
    if (!heroRoot.classList.contains(`is-justify-${heroContract.justify}`)) {
      issues.push(toIssue('justify', `Missing hero justify class is-justify-${heroContract.justify}`));
    }

    const lineNodes = Array.from(heroRoot.querySelectorAll(renderContract.lineSelector || renderContract.headingSelector || 'h1'));
    heroContract.lines
      .map((line, index) => ({ ...line, lineNumber: index + 1 }))
      .filter((line) => normalizeText(line.text))
      .forEach((line) => {
        const lineNode = lineNodes.find((node) => normalizeText(node.textContent) === normalizeText(line.text));
        if (!lineNode) {
          issues.push(toIssue(`line${line.lineNumber}Text`, `Missing hero line "${line.text}"`));
          return;
        }

        String(line.className || '').trim().split(/\s+/).filter(Boolean).forEach((classToken) => {
          if (!lineNode.classList.contains(classToken)) {
            issues.push(toIssue(`line${line.lineNumber}ClassName`, `Missing hero class ${classToken} on "${line.text}"`));
          }
        });

        parseHighlightsJson(line.highlightsJson).forEach((highlight, highlightIndex) => {
          const expectedText = normalizeText(highlight?.text);
          const expectedClass = String(highlight?.className || '').trim();
          if (!expectedText || !expectedClass) {
            return;
          }

          const mark = Array.from(lineNode.querySelectorAll('mark')).find((node) => (
            normalizeText(node.textContent) === expectedText
            && node.classList.contains(expectedClass)
          ));

          if (!mark) {
            issues.push(toIssue(
              `line${line.lineNumber}Highlight${highlightIndex + 1}`,
              `Missing hero highlight ${expectedText} (${expectedClass})`,
            ));
            return;
          }

          if (renderContract.enforceHighlightColors) {
            const expectedColor = HERO_CLASS_COLOR_MAP[expectedClass];
            const actualColor = expectedColor ? normalizeCssColor(styleReader(mark)?.color) : '';
            if (expectedColor && actualColor && actualColor !== normalizeCssColor(expectedColor)) {
              issues.push(toIssue(
                `line${line.lineNumber}HighlightColor${highlightIndex + 1}`,
                `Wrong hero highlight color for ${expectedText}`,
              ));
            }
          }
        });
      });

    heroContract.actions.forEach((action, index) => {
      const expectedLabel = normalizeText(action?.label);
      if (!expectedLabel) {
        return;
      }
      const actionScope = renderContract.actionScopeSelector
        ? (heroRoot.querySelector(renderContract.actionScopeSelector) || heroRoot)
        : heroRoot;
      const actionNode = Array.from(actionScope.querySelectorAll('a,button'))
        .find((node) => normalizeText(node.textContent) === expectedLabel);
      if (!actionNode) {
        issues.push(toIssue(`button${index + 1}Label`, `Missing hero action "${expectedLabel}"`));
      }
    });
  }

  return {
    pathname,
    hasDrift: issues.length > 0,
    issues,
    signature: issues.map((issue) => issue.field).join('|'),
  };
}
