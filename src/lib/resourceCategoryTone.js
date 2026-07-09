export function getResourceCategoryTone(category) {
  const token = String(category || '').trim().toLowerCase();
  if (!token) {
    return 'atlantean';
  }
  if (token.includes('planned') || token.includes('tax')) {
    return 'mango';
  }
  if (token.includes('loan') || token.includes('invest')) {
    return 'atlantean';
  }
  if (token.includes('insur') || token.includes('risk')) {
    return 'melon';
  }
  if (token.includes('retire')) {
    return 'super-grey';
  }
  if (
    token.includes('finance')
    || token.includes('article')
    || token.includes('document')
    || token.includes('policy')
    || token.includes('prospectus')
    || token.includes('form')
  ) {
    return 'sandstone';
  }
  return 'atlantean';
}
