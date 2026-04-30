function parseLinkedReference(value) {
  const match = String(value || '').trim().match(/^(.*?)\s+—\s+(\/\S+)$/);
  if (!match) {
    return null;
  }

  return {
    title: String(match[1] || '').trim(),
    url: String(match[2] || '').trim(),
  };
}

function parseParagraphs(text) {
  return String(text || '')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function parseAssistantMessage(text) {
  const lines = String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return {
      type: 'plain',
      paragraphs: [],
    };
  }

  const bestMatchLine = lines.find((line) => line.startsWith('Best match:'));
  const whyLines = lines.filter((line) => line.startsWith('Why:'));
  const secondMatchLine = lines.find((line) => line.startsWith('Second match:'));
  const bestNextPageLine = lines.find((line) => line.startsWith('Best next page:'));
  const answerLine = lines.find((line) => line.startsWith('Answer:'));
  const sourcePageLine = lines.find((line) => line.startsWith('Source page:'));

  if (bestMatchLine) {
    return {
      type: 'navigation',
      bestMatch: {
        ...parseLinkedReference(bestMatchLine.replace(/^Best match:\s*/, '')),
        why: whyLines[0]?.replace(/^Why:\s*/, '') || '',
      },
      secondMatch: secondMatchLine
        ? {
          ...parseLinkedReference(secondMatchLine.replace(/^Second match:\s*/, '')),
          why: whyLines[1]?.replace(/^Why:\s*/, '') || '',
        }
        : null,
      paragraphs: parseParagraphs(text),
    };
  }

  if (bestNextPageLine) {
    return {
      type: 'navigation-fallback',
      intro: lines[0] || '',
      bestMatch: {
        ...parseLinkedReference(bestNextPageLine.replace(/^Best next page:\s*/, '')),
        why: whyLines[0]?.replace(/^Why:\s*/, '') || '',
      },
      paragraphs: parseParagraphs(text),
    };
  }

  if (answerLine || sourcePageLine) {
    return {
      type: 'content',
      answer: answerLine?.replace(/^Answer:\s*/, '') || '',
      sourcePage: sourcePageLine
        ? parseLinkedReference(sourcePageLine.replace(/^Source page:\s*/, ''))
        : null,
      paragraphs: parseParagraphs(text),
    };
  }

  return {
    type: 'plain',
    paragraphs: parseParagraphs(text),
  };
}
