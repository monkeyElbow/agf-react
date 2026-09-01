import { useEffect, useMemo, useRef, useState } from 'react';
import ColorPalette from './ColorPalette';
import {
  SEMANTIC_TEXT_COLOR_HEX_VALUES,
  SEMANTIC_TEXT_COLOR_OPTIONS,
} from '../lib/colorSystem';

function ensureHtml(value) {
  const html = String(value || '').trim();
  return html || '<p></p>';
}

function hasHtmlEditorSemanticColorMarkup(value) {
  return /<font\b|color\s*=|style\s*=\s*["'][^"']*color\s*:/i.test(String(value || ''));
}

export const HTML_EDITOR_COLOR_SWATCHES = SEMANTIC_TEXT_COLOR_OPTIONS.map((option) => ({
  id: String(option.value || '').replace(/^is-/, ''),
  label: option.label,
  value: SEMANTIC_TEXT_COLOR_HEX_VALUES[option.value] || '#414042',
  className: option.value,
}));
export const HTML_EDITOR_TEXT_SIZE_OPTIONS = [
  { id: 'fine-print', label: 'Fine print', commandValue: '1', className: 'is-text-fine-print' },
  { id: 'small', label: 'Small', commandValue: '2', className: 'is-text-small' },
  { id: 'body', label: 'Body', commandValue: '3', className: 'is-text-body' },
  { id: 'large', label: 'Large', commandValue: '4', className: 'is-text-large' },
  { id: 'lead', label: 'Lead', commandValue: '5', className: 'is-text-lead' },
  { id: 'display', label: 'Display', commandValue: '6', className: 'is-text-display' },
];
const HTML_EDITOR_TEXT_SIZE_CLASS_NAMES = new Set(
  HTML_EDITOR_TEXT_SIZE_OPTIONS.map((option) => option.className),
);
const HTML_EDITOR_TEXT_SIZE_CLASS_BY_COMMAND_VALUE = new Map(
  HTML_EDITOR_TEXT_SIZE_OPTIONS.map((option) => [option.commandValue, option.className]),
);
const HTML_EDITOR_COLOR_PALETTE_OPTIONS = HTML_EDITOR_COLOR_SWATCHES.map((swatch) => ({
  value: swatch.id,
  label: swatch.label,
  swatch: swatch.value,
}));

const HTML_EDITOR_SEMANTIC_COLOR_CLASSES = new Set(
  HTML_EDITOR_COLOR_SWATCHES.map((swatch) => String(swatch.className || '').trim()).filter(Boolean),
);
const HTML_EDITOR_SEMANTIC_COLOR_CLASS_BY_VALUE = new Map(
  HTML_EDITOR_COLOR_SWATCHES.map((swatch) => [normalizeCssColorValue(swatch.value), swatch.className]),
);

function normalizeCssColorValue(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) {
    return '';
  }
  if (raw === 'white') {
    return '#ffffff';
  }
  const shortHexMatch = raw.match(/^#([0-9a-f]{3})$/i);
  if (shortHexMatch) {
    return `#${shortHexMatch[1].split('').map((token) => `${token}${token}`).join('')}`;
  }
  const longHexMatch = raw.match(/^#([0-9a-f]{6})$/i);
  if (longHexMatch) {
    return `#${longHexMatch[1]}`;
  }
  const rgbMatch = raw.match(/^rgba?\(([^)]+)\)$/i);
  if (!rgbMatch) {
    return raw.replace(/\s+/g, '');
  }
  const channels = rgbMatch[1]
    .split(',')
    .slice(0, 3)
    .map((part) => Math.max(0, Math.min(255, Number.parseInt(part, 10))));
  if (channels.length !== 3 || channels.some((channel) => Number.isNaN(channel))) {
    return raw.replace(/\s+/g, '');
  }
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function extractColorDeclaration(styleValue) {
  const declarations = String(styleValue || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);
  const colorDeclaration = declarations.find((declaration) => declaration.toLowerCase().startsWith('color:'));
  if (!colorDeclaration) {
    return '';
  }
  const [, colorValue = ''] = colorDeclaration.split(':');
  return colorValue.trim();
}

function removeColorDeclaration(styleValue) {
  const declarations = String(styleValue || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((declaration) => !declaration.toLowerCase().startsWith('color:'));
  return declarations.join('; ');
}

function applySemanticColorClass(element, nextClassName) {
  const classes = String(element.getAttribute('class') || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !HTML_EDITOR_SEMANTIC_COLOR_CLASSES.has(token));
  if (nextClassName) {
    classes.push(nextClassName);
  }
  if (classes.length) {
    element.setAttribute('class', Array.from(new Set(classes)).join(' '));
  } else {
    element.removeAttribute('class');
  }
}

function normalizeColorElement(node, document) {
  if (!node || node.nodeType !== document.ELEMENT_NODE) {
    return;
  }

  let element = node;
  let legacyColorValue = '';
  const tagName = String(element.tagName || '').toLowerCase();
  if (tagName === 'font') {
    legacyColorValue = element.getAttribute('color') || '';
    const replacement = document.createElement('span');
    Array.from(element.attributes).forEach((attribute) => {
      if (String(attribute.name || '').toLowerCase() === 'color') {
        return;
      }
      replacement.setAttribute(attribute.name, attribute.value);
    });
    while (element.firstChild) {
      replacement.appendChild(element.firstChild);
    }
    element.parentNode?.replaceChild(replacement, element);
    element = replacement;
  }

  Array.from(element.childNodes).forEach((child) => normalizeColorElement(child, document));

  const styleValue = element.getAttribute('style');
  const colorValue = extractColorDeclaration(styleValue) || element.getAttribute('color') || legacyColorValue;
  const semanticClassName = HTML_EDITOR_SEMANTIC_COLOR_CLASS_BY_VALUE.get(normalizeCssColorValue(colorValue)) || '';
  if (semanticClassName) {
    applySemanticColorClass(element, semanticClassName);
  }

  if (styleValue) {
    const cleanedStyle = removeColorDeclaration(styleValue);
    if (cleanedStyle) {
      element.setAttribute('style', cleanedStyle);
    } else {
      element.removeAttribute('style');
    }
  }

  if (element.hasAttribute('color')) {
    element.removeAttribute('color');
  }
}

export function normalizeHtmlEditorSemanticColors(value) {
  const source = String(value || '').trim();
  if (!source || typeof DOMParser === 'undefined') {
    return source;
  }
  if (!hasHtmlEditorSemanticColorMarkup(source)) {
    return source;
  }
  const parser = new DOMParser();
  const document = parser.parseFromString(`<div>${source}</div>`, 'text/html');
  const root = document.body.firstElementChild;
  if (!root) {
    return source;
  }
  Array.from(root.childNodes).forEach((child) => normalizeColorElement(child, document));
  return root.innerHTML.trim();
}

function applyTextSizeClass(element, nextClassName) {
  const classes = String(element.getAttribute('class') || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !HTML_EDITOR_TEXT_SIZE_CLASS_NAMES.has(token));
  if (nextClassName) {
    classes.push(nextClassName);
  }
  if (classes.length) {
    element.setAttribute('class', Array.from(new Set(classes)).join(' '));
  } else {
    element.removeAttribute('class');
  }
}

function normalizeTextSizeElement(node, document) {
  if (!node || node.nodeType !== document.ELEMENT_NODE) {
    return;
  }

  let element = node;
  const tagName = String(element.tagName || '').toLowerCase();
  if (tagName === 'font' && element.hasAttribute('size')) {
    const commandValue = element.getAttribute('size');
    const replacement = document.createElement('span');
    Array.from(element.attributes).forEach((attribute) => {
      if (String(attribute.name || '').toLowerCase() !== 'size') {
        replacement.setAttribute(attribute.name, attribute.value);
      }
    });
    while (element.firstChild) {
      replacement.appendChild(element.firstChild);
    }
    element.parentNode?.replaceChild(replacement, element);
    element = replacement;
    applyTextSizeClass(element, HTML_EDITOR_TEXT_SIZE_CLASS_BY_COMMAND_VALUE.get(commandValue) || '');
  }

  Array.from(element.childNodes).forEach((child) => normalizeTextSizeElement(child, document));
}

export function normalizeHtmlEditorTextSizes(value) {
  const source = String(value || '').trim();
  if (!source || typeof DOMParser === 'undefined' || !/<font\b[^>]*size\s*=|is-text-/i.test(source)) {
    return source;
  }
  const parser = new DOMParser();
  const document = parser.parseFromString(`<div>${source}</div>`, 'text/html');
  const root = document.body.firstElementChild;
  if (!root) {
    return source;
  }
  Array.from(root.childNodes).forEach((child) => normalizeTextSizeElement(child, document));
  return root.innerHTML.trim();
}

function normalizeHtmlEditorTrailingSpaces(value) {
  return String(value || '').replace(/(?:&nbsp;)+(?=\s*<\/[a-z][^>]*>)/gi, (match) => (
    ' '.repeat((match.match(/&nbsp;/gi) || []).length)
  ));
}

function normalizeHtmlEditorFormatting(value) {
  return normalizeHtmlEditorTextSizes(
    normalizeHtmlEditorSemanticColors(normalizeHtmlEditorTrailingSpaces(value)),
  );
}

export default function AdminHtmlEditor({
  value,
  onChange,
  onBlur,
  placeholder = 'Start writing...',
  compact = false,
  showFooterToggle = true,
  paletteVariant = 'admin',
  ariaLabel = 'HTML content',
  baseColorClassName = '',
  className = '',
  style,
  onBaseColorChange,
  showAlignmentControls = true,
}) {
  const editorRef = useRef(null);
  const savedSelectionRangeRef = useRef(null);
  const [sourceMode, setSourceMode] = useState(false);
  const [selectedColorId, setSelectedColorId] = useState(HTML_EDITOR_COLOR_SWATCHES[0]?.id || '');
  const htmlValue = useMemo(
    () => ensureHtml(normalizeHtmlEditorFormatting(value)),
    [value],
  );

  useEffect(() => {
    if (sourceMode || !editorRef.current) {
      return;
    }
    if (
      typeof document !== 'undefined'
      && (document.activeElement === editorRef.current || editorRef.current.contains(document.activeElement))
    ) {
      return;
    }

    const current = editorRef.current.innerHTML;
    if (current !== htmlValue) {
      editorRef.current.innerHTML = htmlValue;
    }
  }, [htmlValue, sourceMode]);

  useEffect(() => {
    const nextBaseColor = HTML_EDITOR_COLOR_SWATCHES.find((swatch) => (
      swatch.className === String(baseColorClassName || '').trim()
    ));
    if (nextBaseColor && nextBaseColor.id !== selectedColorId) {
      setSelectedColorId(nextBaseColor.id);
    }
  }, [baseColorClassName, selectedColorId]);

  function emitChange(nextHtml) {
    const normalizedHtml = ensureHtml(normalizeHtmlEditorFormatting(nextHtml));
    if (typeof onChange === 'function') {
      onChange(normalizedHtml);
    }
  }

  function readEditorHtml() {
    if (!editorRef.current) {
      return htmlValue;
    }
    return editorRef.current.innerHTML || '<p></p>';
  }

  function applyCommand(command, commandValue = null) {
    if (!editorRef.current) {
      return;
    }

    editorRef.current.focus();
    const savedRange = savedSelectionRangeRef.current;
    if (savedRange && typeof document !== 'undefined') {
      const selection = document.getSelection?.();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedRange);
      }
    }
    if (command === 'foreColor') {
      document.execCommand('styleWithCSS', false, true);
    }
    document.execCommand(command, false, commandValue);
    savedSelectionRangeRef.current = null;
    emitChange(readEditorHtml());
  }

  function onSetLink() {
    const url = window.prompt('Enter URL');
    if (!url) {
      return;
    }
    applyCommand('createLink', url.trim());
  }

  function preserveSelection(event) {
    // Keep focus/selection in the editable surface when clicking toolbar controls.
    captureSelection();
    event.preventDefault();
  }

  function captureSelection() {
    if (!editorRef.current || typeof document === 'undefined') {
      return;
    }
    const selection = document.getSelection?.();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }
    if (!editorRef.current.contains(selection.anchorNode) || !editorRef.current.contains(selection.focusNode)) {
      return;
    }
    savedSelectionRangeRef.current = selection.getRangeAt(0).cloneRange();
  }

  function hasSelectionInEditor() {
    if (!editorRef.current || typeof document === 'undefined') {
      return false;
    }
    const selection = document.getSelection?.();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return false;
    }
    return editorRef.current.contains(selection.anchorNode)
      && editorRef.current.contains(selection.focusNode);
  }

  return (
    <div
      className={`admin-html-editor${compact ? ' is-compact' : ''}${baseColorClassName ? ` ${baseColorClassName}` : ''}${className ? ` ${className}` : ''}`}
      style={style}
    >
      <div className="admin-html-editor-toolbar" role="toolbar" aria-label="Article body formatting">
        <button type="button" onMouseDown={preserveSelection} onClick={() => applyCommand('bold')} title="Bold"><strong>B</strong></button>
        <button type="button" onMouseDown={preserveSelection} onClick={() => applyCommand('italic')} title="Italic"><em>I</em></button>
        <ColorPalette
          variant={paletteVariant}
          className="is-compact is-icon-only is-circular admin-html-editor-color-group"
          ariaLabel="Text color"
          options={HTML_EDITOR_COLOR_PALETTE_OPTIONS}
          value={selectedColorId}
          preventMouseDown
          onChange={(nextValue) => {
            const nextSwatch = HTML_EDITOR_COLOR_SWATCHES.find((swatch) => swatch.id === nextValue);
            if (!nextSwatch) {
              return;
            }
            setSelectedColorId(nextValue);
            if (typeof onBaseColorChange === 'function' && !hasSelectionInEditor()) {
              onBaseColorChange(nextSwatch.className);
              return;
            }
            applyCommand('foreColor', nextSwatch.value);
          }}
          getOptionClassName={(option, state) => `admin-html-editor-color-swatch${state.active ? ' is-active' : ''}${option.value === 'white' ? ' is-light' : ''}`}
          getOptionLabel={(option) => option.label}
          getOptionShortLabel={(option) => option.shortLabel || option.label}
        />
        {showAlignmentControls ? (
          <div className="admin-html-editor-toolbar-group" role="group" aria-label="Text alignment">
            <button type="button" onMouseDown={preserveSelection} onClick={() => applyCommand('justifyLeft')} title="Align left">Left</button>
            <button type="button" onMouseDown={preserveSelection} onClick={() => applyCommand('justifyCenter')} title="Align center">Center</button>
            <button type="button" onMouseDown={preserveSelection} onClick={() => applyCommand('justifyRight')} title="Align right">Right</button>
          </div>
        ) : null}
        <button type="button" onMouseDown={preserveSelection} onClick={() => applyCommand('formatBlock', 'h2')} title="Heading 2">H2</button>
        <button type="button" onMouseDown={preserveSelection} onClick={() => applyCommand('formatBlock', 'h3')} title="Heading 3">H3</button>
        <button type="button" onMouseDown={preserveSelection} onClick={() => applyCommand('formatBlock', 'p')} title="Paragraph">P</button>
        <button type="button" onMouseDown={preserveSelection} onClick={() => applyCommand('insertUnorderedList')} title="Bulleted list">• List</button>
        <button type="button" onMouseDown={preserveSelection} onClick={() => applyCommand('insertOrderedList')} title="Numbered list">1. List</button>
        <button type="button" onMouseDown={preserveSelection} onClick={() => applyCommand('formatBlock', 'blockquote')} title="Quote">Quote</button>
        <button type="button" onMouseDown={preserveSelection} onClick={onSetLink} title="Add link">Link</button>
        <button type="button" onMouseDown={preserveSelection} onClick={() => applyCommand('unlink')} title="Remove link">Unlink</button>
        <button type="button" onMouseDown={preserveSelection} onClick={() => applyCommand('insertHorizontalRule')} title="Divider">Divider</button>
        <button type="button" onMouseDown={preserveSelection} onClick={() => applyCommand('removeFormat')} title="Clear inline formatting">Clear</button>
      </div>

      {sourceMode ? (
        <textarea
          className="admin-html-editor-source"
          aria-label={ariaLabel}
          rows={compact ? 8 : 16}
          value={htmlValue}
          onChange={(event) => emitChange(event.target.value)}
          onBlur={() => onBlur?.()}
        />
      ) : (
        <div
          ref={editorRef}
          className="admin-html-editor-surface"
          role="textbox"
          aria-label={ariaLabel}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          onInput={() => emitChange(readEditorHtml())}
          onBlur={() => {
            emitChange(readEditorHtml());
            onBlur?.();
          }}
        />
      )}

      {showFooterToggle ? (
        <div className="admin-html-editor-footer">
          <button
            type="button"
            className="action-btn action-btn-outline"
            onClick={() => setSourceMode((current) => !current)}
          >
            {sourceMode ? 'Back to visual editor' : 'View HTML (advanced)'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
