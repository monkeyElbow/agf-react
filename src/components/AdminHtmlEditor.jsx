import { useEffect, useMemo, useRef, useState } from 'react';

function ensureHtml(value) {
  const html = String(value || '').trim();
  return html || '<p></p>';
}

export default function AdminHtmlEditor({ value, onChange, placeholder = 'Start writing...' }) {
  const editorRef = useRef(null);
  const [sourceMode, setSourceMode] = useState(false);
  const htmlValue = useMemo(() => ensureHtml(value), [value]);

  useEffect(() => {
    if (sourceMode || !editorRef.current) {
      return;
    }

    const current = editorRef.current.innerHTML;
    if (current !== htmlValue) {
      editorRef.current.innerHTML = htmlValue;
    }
  }, [htmlValue, sourceMode]);

  function emitChange(nextHtml) {
    if (typeof onChange === 'function') {
      onChange(nextHtml);
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
    document.execCommand(command, false, commandValue);
    emitChange(readEditorHtml());
  }

  function onSetLink() {
    const url = window.prompt('Enter URL');
    if (!url) {
      return;
    }
    applyCommand('createLink', url.trim());
  }

  return (
    <div className="admin-html-editor">
      <div className="admin-html-editor-toolbar" role="toolbar" aria-label="Article body formatting">
        <button type="button" onClick={() => applyCommand('bold')} title="Bold"><strong>B</strong></button>
        <button type="button" onClick={() => applyCommand('italic')} title="Italic"><em>I</em></button>
        <button type="button" onClick={() => applyCommand('formatBlock', 'h2')} title="Heading 2">H2</button>
        <button type="button" onClick={() => applyCommand('formatBlock', 'h3')} title="Heading 3">H3</button>
        <button type="button" onClick={() => applyCommand('formatBlock', 'p')} title="Paragraph">P</button>
        <button type="button" onClick={() => applyCommand('insertUnorderedList')} title="Bulleted list">• List</button>
        <button type="button" onClick={() => applyCommand('insertOrderedList')} title="Numbered list">1. List</button>
        <button type="button" onClick={() => applyCommand('formatBlock', 'blockquote')} title="Quote">Quote</button>
        <button type="button" onClick={onSetLink} title="Add link">Link</button>
        <button type="button" onClick={() => applyCommand('unlink')} title="Remove link">Unlink</button>
        <button type="button" onClick={() => applyCommand('insertHorizontalRule')} title="Divider">Divider</button>
        <button type="button" onClick={() => applyCommand('removeFormat')} title="Clear inline formatting">Clear</button>
      </div>

      {sourceMode ? (
        <textarea
          className="admin-html-editor-source"
          rows={16}
          value={htmlValue}
          onChange={(event) => emitChange(event.target.value)}
        />
      ) : (
        <div
          ref={editorRef}
          className="admin-html-editor-surface"
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          onInput={() => emitChange(readEditorHtml())}
          onBlur={() => emitChange(readEditorHtml())}
          dangerouslySetInnerHTML={{ __html: htmlValue }}
        />
      )}

      <div className="admin-html-editor-footer">
        <button
          type="button"
          className="action-btn action-btn-outline"
          onClick={() => setSourceMode((current) => !current)}
        >
          {sourceMode ? 'Back to visual editor' : 'View HTML (advanced)'}
        </button>
      </div>
    </div>
  );
}
