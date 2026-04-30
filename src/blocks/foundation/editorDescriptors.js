function cloneOption(option) {
  return Object.freeze({
    ...option,
  });
}

export function defineEditorField(descriptor) {
  const nextDescriptor = descriptor && typeof descriptor === 'object' ? descriptor : {};
  const options = Array.isArray(nextDescriptor.options)
    ? nextDescriptor.options.map(cloneOption)
    : undefined;

  return Object.freeze({
    ...nextDescriptor,
    options,
  });
}

export function defineTransitionalLinkFields({
  hrefId,
  hrefLabel = 'URL / Path',
  toId,
  toLabel = 'Internal page path',
  openInNewWindowId = '',
  openInNewWindowLabel = 'Open in new window',
} = {}) {
  const fields = [];

  if (hrefId) {
    fields.push(defineEditorField({
      id: hrefId,
      label: hrefLabel,
      type: 'text',
    }));
  }

  if (toId) {
    fields.push(defineEditorField({
      id: toId,
      label: toLabel,
      type: 'text',
    }));
  }

  if (openInNewWindowId) {
    fields.push(defineEditorField({
      id: openInNewWindowId,
      label: openInNewWindowLabel,
      type: 'boolean',
    }));
  }

  return Object.freeze(fields);
}

export function defineTransitionalActionFields({
  labelId,
  labelLabel = 'Button label',
  hrefId,
  hrefLabel = 'Button URL / Path',
  toId,
  toLabel = 'Button internal page path',
  openInNewWindowId = '',
  openInNewWindowLabel = 'Open button in new window',
  styleId = '',
  styleLabel = 'Button style',
  styleOptions = null,
  toneId = '',
  toneLabel = 'Button color',
  toneOptions = null,
} = {}) {
  const fields = [];

  if (labelId) {
    fields.push(defineEditorField({
      id: labelId,
      label: labelLabel,
      type: 'text',
    }));
  }

  fields.push(...defineTransitionalLinkFields({
    hrefId,
    hrefLabel,
    toId,
    toLabel,
    openInNewWindowId,
    openInNewWindowLabel,
  }));

  if (styleId) {
    fields.push(defineEditorField({
      id: styleId,
      label: styleLabel,
      type: 'select',
      options: Array.isArray(styleOptions) ? styleOptions : [],
    }));
  }

  if (toneId) {
    fields.push(defineEditorField({
      id: toneId,
      label: toneLabel,
      type: 'swatch',
      options: Array.isArray(toneOptions) ? toneOptions : [],
    }));
  }

  return Object.freeze(fields);
}

export function defineEditorSection(descriptor) {
  const nextDescriptor = descriptor && typeof descriptor === 'object' ? descriptor : {};
  const fields = Array.isArray(nextDescriptor.fields)
    ? nextDescriptor.fields.map(defineEditorField)
    : [];
  const surfaces = Array.isArray(nextDescriptor.surfaces) && nextDescriptor.surfaces.length
    ? Array.from(new Set(nextDescriptor.surfaces.map((surface) => String(surface || '').trim()).filter(Boolean)))
    : ['hud', 'admin'];

  return Object.freeze({
    ...nextDescriptor,
    surfaces: Object.freeze(surfaces),
    fields: Object.freeze(fields),
  });
}

export function defineEditorSections(sections) {
  return Object.freeze((Array.isArray(sections) ? sections : []).map(defineEditorSection));
}

export function getEditorSectionsForSurface(sections, surface = 'admin', sectionIds = null) {
  const surfaceToken = String(surface || 'admin').trim().toLowerCase();
  const requestedSectionIds = Array.isArray(sectionIds) && sectionIds.length
    ? new Set(sectionIds.map((sectionId) => String(sectionId || '').trim()).filter(Boolean))
    : null;

  return (Array.isArray(sections) ? sections : []).filter((section) => {
    const sectionId = String(section?.id || '').trim();
    if (!sectionId) {
      return false;
    }
    if (requestedSectionIds && !requestedSectionIds.has(sectionId)) {
      return false;
    }
    const surfaces = Array.isArray(section?.surfaces) ? section.surfaces : [];
    return !surfaces.length || surfaces.includes(surfaceToken);
  });
}

export function flattenEditorFields(sections) {
  const seenFieldIds = new Set();

  return getEditorSectionsForSurface(sections, 'admin').reduce((fields, section) => {
    (Array.isArray(section?.fields) ? section.fields : []).forEach((field) => {
      const fieldId = String(field?.id || '').trim();
      if (!fieldId || seenFieldIds.has(fieldId)) {
        return;
      }
      seenFieldIds.add(fieldId);
      fields.push({
        ...field,
        options: Array.isArray(field?.options) ? field.options.map((option) => ({ ...option })) : undefined,
      });
    });
    return fields;
  }, []);
}
